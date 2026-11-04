/**
 * Point d'entrée du moteur de simulation.
 *
 * - creerPartie(options)       : nouvelle partie à partir des données sourcées
 * - jouerTour(etat, decisions) : simule un trimestre et renvoie un NOUVEL état
 * - apercuDecisions(...)       : impact immédiat et à un an de décisions (curseurs en temps réel)
 * - chiffrerReforme(...)       : chiffrage d'une réforme par simulation (avec / sans)
 *
 * Format des décisions :
 * {
 *   budget:     { [poste]: variation en volume en % par rapport au départ },
 *   impots:     { [impot]: nouveau taux ou indice },
 *   reformes:   [{ id, option }],
 *   diplomatie: [{ id, option }],
 *   partCourtTerme: 0.05 à 0.5 (part des émissions de dette à moins d'un an),
 *   trajectoire: { [annee]: déficit annoncé en % du PIB },
 *   procedureReformes: 'vote' | '49.3' (France) | 'reconciliation' (États-Unis),
 *   procedureBudget: 'auto' | '49.3' | 'ordonnances' | 'compromis' | 'complet' | 'cr' (États-Unis),
 *   referendum: { id, option } (France, une fois par an),
 *   dissolution: true (France), questionConfiance: true (Allemagne),
 *   plafondDette: 'negocier' | 'reconciliation' | 'bras_de_fer' (États-Unis),
 *   entreprises: [{ id, action }] (rencontre, participation, nationaliser, ceder, action_specifique),
 *   programmes:  [{ id, commande: 'lancer' | 'arreter' }] (État stratège),
 * }
 */
import { creerEtatInitial } from './etatInitial.js';
import { creerAleatoire } from './aleatoire.js';
import { libelleTrimestre, trimestreSuivant } from './calendrier.js';
import { majMonde, tauxDirecteur } from './monde.js';
import { majReformes, adopterReforme, reformesDisponibles } from './reformes.js';
import { majTempsTravail } from './travail.js';
import { majRetraites } from './retraites.js';
import { majInternational, executerAction, actionsDisponibles } from './international.js';
import { majDepenses, depensesPondereesMultiplicateur, totalDepensesPrimaires } from './depenses.js';
import { appliquerTaux, calculerRecettes } from './fiscalite.js';
import { majMacro } from './macro.js';
import { majFinances, bilanAnnuel } from './finances.js';
import { majMenages } from './menages.js';
import { majSocial } from './social.js';
import { initialiserPolitique, validerReformes, voterBudget, majPolitique, prevoirVotes, remaniement, nommerPremierMinistre } from './politique.js';
import { genererObjectifs, majObjectifs, cloturerObjectifs } from './objectifs.js';
import { genererEvenements, resoudreEvenements, depensesTemporairesActives } from './evenements.js';
import { calculerScore } from './score.js';
import { initialiserOpinion, majOpinion } from './opinion.js';
import { majSucces, SUCCES } from './succes.js';
import { etatCapitalisationInitial, majCapitalisation, ALLOCATIONS } from './capitalisation.js';
import { ANNEE_FIN, calendrierJusqua2050, nbToursJusqua } from './horizon.js';
import { initialiserClassements, majClassements } from './classements.js';
import { initialiserG7, tenirSommet, preparerSommet } from './g7.js';
import { initialiserNotation, notesDepuisDonnees, majNotation } from './notation.js';
import { controleConstitutionnel } from './constitution.js';
import { etatCommunicationInitial, communiquer, majCommunication } from './communication.js';
import { conseils } from './conseiller.js';
import { initialiserEntreprises, effetsEntreprises, majEntreprises, executerActionEntreprise, piloterProgramme, ACTIONS_PAR_TRIMESTRE } from './entreprises.js';
import { referendum } from './elections.js';
import { trouverReforme } from './reformes.js';
import { MINISTERES } from '../model/ministeres.js';
import { IMPOTS } from '../model/impots.js';
import { PARAMETRES, MODES, normaliserMode } from '../model/parametres.js';
import { borner } from '../model/outils.js';

export { reformesDisponibles, actionsDisponibles, calculerScore, conseils, SUCCES };
export { programmesDisponibles, valeurPortefeuille, fleuron } from './entreprises.js';
export { siegesLegislativesFrance } from './elections.js';
export { ALLOCATIONS, fluxAnnuels, doubleCharge, projeterCapitalisation, parametresProjection, concentrationGains, CIBLE_MIXTE, SCENARIOS_MIXTE } from './capitalisation.js';
export { voterTexte, texteFinancier, PROFILS_PREMIER_MINISTRE } from './politique.js';
export { classementsTries, rangs as rangsClassements, ID_PAYS } from './classements.js';
export { bilanReformes, effetOpinionReforme } from './reformes.js';
export { soliditePouvoir } from './pouvoir.js';
export { resumeNotation, libelleNote, revuesDuTrimestre } from './notation.js';
export { risqueConstitutionnel } from './constitution.js';
export { actionsCommunication, ACTIONS_COMMUNICATION, GROUPES_CIBLES } from './communication.js';
export { previsionG7, prochainSommet, peutNegocier, membreG7 } from './g7.js';
export { intentions as intentionsDeVote, THEMES } from './opinion.js';

/**
 * Prévision des votes avec les décisions envisagées (curseurs, taux, réformes),
 * sans jouer le tour.
 */
export function previsionPolitique(etat, decisions = {}) {
  const e = structuredClone(etat);
  if (decisions.nominationPM && e.role === 'president') nommerPremierMinistre(e, decisions.nominationPM);
  for (const [id, v] of Object.entries(decisions.budget ?? {})) if (e.budget[id]) e.budget[id].variationVolume = v;
  appliquerTaux(e, decisions.impots ?? {});
  // Les postes évalués par les partis sont les cibles visées, pas les montants déjà atteints
  for (const l of Object.values(e.budget)) if (l.variationVolume !== undefined && l.montantInitial) l.montant = l.montantInitial * (l.facteurBesoins ?? 1) * (e.macro.niveauPrix / 100) * (1 + (l.variationVolume ?? 0) / 100) + (l.ajustementReformes ?? 0);
  const p = prevoirVotes(e, decisions.reformes ?? []);
  // Mode expert : les pointages sont incertains (± 25 voix), comme dans la réalité des négociations
  p.incertitude = MODES[normaliserMode(e.mode)].previsionsExactes ? 0 : 25;
  return p;
}

export function creerPartie(options) {
  const e = creerEtatInitial(options);
  // Calendrier « mandat complet » : l'élection intermédiaire est repoussée à la fin du mandat
  e.calendrierChoisi = options.calendrier ?? 'reel';
  if (e.calendrierChoisi === 'mandat_complet') {
    e.statique.calendrier = { ...e.statique.calendrier, echeances: e.statique.calendrier.echeances.filter((x) => !['presidentielle', 'legislatives'].includes(x.type)) };
  }
  // Partie longue : jusqu'en 2050, avec les scrutins prolongés selon leur périodicité légale
  if (e.calendrierChoisi === 'horizon2050') {
    e.horizon = ANNEE_FIN;
    e.nbToursMandat = e.nbTours;
    e.statique.calendrier = calendrierJusqua2050(e.statique.calendrier, e.pays);
    e.nbTours = nbToursJusqua(e.trimestre, ANNEE_FIN);
  }
  e.politiqueSociale = { indicePrestations: 1, gel: null, surplusBaremeGele: 0, rendementPatrimoine: 0, bloquerCotisation2028: false };
  e.politiqueSalariale = { indicePoint: 1, gel: null, indiceSmic: 1 };
  e.macro.chocsPrixEnAttente = [];
  e.precedent = { recettesReformes: 0 };
  e.depensesTemporaires = [];
  e.evenements = { enAttente: [], historique: [] };
  e.grandsEvenements = {};
  e.graineMonde = (e.graine * 2654435761) >>> 0;
  initialiserPolitique(e, options.donnees);
  // Intensité des effets des réformes : « réaliste » (calibrage des études) ou « accentuée » (effets plus visibles)
  e.intensiteReformes = options.intensite === 'accentuee' ? 2 : 1;
  // France : jouer le président de la République plutôt que le Premier ministre
  e.role = options.role === 'president' && e.pays === 'france' ? 'president' : 'chef_gouvernement';
  if (e.role === 'president') {
    e.statique.chefGouvernement = { titre: 'Président de la République', nomActuel: 'Emmanuel Macron (mandat jusqu\'en mai 2027)' };
    e.politique.premierMinistre = { profil: 'camp', depuis: 1 };
  }
  initialiserEntreprises(e);
  e.capitalisation = etatCapitalisationInitial();
  e.elections = { historique: [] };
  initialiserOpinion(e);
  initialiserClassements(e, options.contexte?.classements);
  initialiserG7(e);
  e.communication = etatCommunicationInitial();
  const { notes, dynamique } = notesDepuisDonnees(options.donnees);
  initialiserNotation(e, notes, dynamique);
  // Référence de la projection présidentielle (France) : la situation de départ
  if (e.politique.presidentielle && e.pays === 'france') {
    e.politique.presidentielle.reference = { popularite: e.social.popularite, croissance: e.macro.croissanceAnnuelle, chomage: e.macro.chomage, inflation: e.macro.inflation, cohesion: e.social.cohesion };
  }
  e.objectifs = genererObjectifs(e);
  e.historique.push({ ...instantane(e), trimestre: 'Départ' });
  // Rendez-vous déjà fixés au premier trimestre (COP31, G20...) : tirage séparé, sans toucher à l'aléa de la partie
  genererEvenements(e, creerAleatoire((e.graine ^ 0x9e3779b9) >>> 0), 1, { calendrierSeulement: true });
  if (e.statique.devise === '$') e.evenements.enAttente = adapterDevise(e.evenements.enAttente);
  return e;
}

/** Indices de revalorisation des prestations et des rémunérations publiques. */
function majPolitiques(e, ratioPrix) {
  const ps = e.politiqueSociale;
  const gelPrestations = ps.gel && e.tour >= ps.gel.debut && e.tour < ps.gel.fin;
  if (!gelPrestations) ps.indicePrestations *= ratioPrix;
  const sal = e.politiqueSalariale;
  const gelPoint = sal.gel && e.tour >= sal.gel.debut && e.tour < sal.gel.fin;
  if (!gelPoint) sal.indicePoint *= 1 + 0.8 * e.macro.croissanceSalaires / 400;
  // Salaire minimum : revalorisé au 1er janvier sur l'inflation passée (France) ou selon le calendrier fixé (Allemagne)
  if (e.trimestre.t === 1) {
    const cibleSmic = e.pays === 'allemagne' && e.trimestre.annee === 2027 ? 14.60 / 13.90 : e.macro.niveauPrix / 100;
    sal.indiceSmic = Math.max(sal.indiceSmic, cibleSmic, 0.98 * e.macro.indiceSalaires);
  }
}

/** Échéances légales automatiques (sans décision du joueur). */
function echeancesLegales(e) {
  const tr = e.trimestre;
  if (e.pays === 'allemagne' && tr.annee === 2028 && tr.t === 1 && !e.politiqueSociale.bloquerCotisation2028) {
    const p = e.statique.retraites;
    const hausse = (p.hausseCotisationPrevue.nouveauTaux - p.tauxCotisation) * p.rendementPointCotisation;
    const cot = e.impots.cotisations;
    cot.taux = Math.min(cot.bornes[1], cot.taux + hausse / cot.R0 * 100);
    e.journal.push({ tour: e.tour, trimestre: libelleTrimestre(tr), type: 'loi', texte: `La cotisation retraite passe de ${p.tauxCotisation} % à ${p.hausseCotisationPrevue.nouveauTaux} % (+${hausse.toFixed(1)} Md€ par an), comme prévu par la projection de la loi en vigueur.` });
  }
}

/** Stocks de capital : investissement d'aujourd'hui, effet de demain. */
function majStocks(e) {
  const prix = e.macro.niveauPrix / 100;
  for (const [nom, s] of Object.entries(e.stocks)) {
    const par = PARAMETRES.stocks[nom];
    s.fileAttente.push(e.budget[s.poste].montant / prix); // flux en euros constants
    const entrant = s.fileAttente.shift();
    s.niveau = s.niveau * (1 - par.depreciationAnnuelle / 4) + entrant / 4;
  }
  // Effort de recherche (% du PIB) : la dépense publique pèse environ 35 % de la recherche totale
  const r = e.stocks.recherche;
  const varPublique = e.budget.recherche.montant / (e.budget.recherche.montantInitial * prix) - 1;
  const varIS = e.impots.impotSocietes ? -(e.impots.impotSocietes.taux - e.impots.impotSocietes.tauxRef) * 0.01 : 0;
  e.recherche = { effortPctPIB: e.statique.stocksInitiaux?.recherche * (1 + 0.35 * varPublique + varIS) * (r.niveau / r.niveau0) ** 0.2 };
}

/** Émissions de gaz à effet de serre (MtCO2e par an). */
function majClimat(e) {
  const c = e.climat;
  const p = e.statique.climat;
  const annees = (e.tour) / 4;
  const vert = e.stocks.vert.niveau / e.stocks.vert.niveau0;
  const taxe = e.impots.accisesEnergie ? 1 + IMPOTS.accisesEnergie.effetEmissionsParPoint * (e.impots.accisesEnergie.taux - 100) : 1;
  c.emissions = c.emissions0
    * Math.pow(e.macro.pibReel / 100, 0.5)
    * Math.pow(1 + p.tendanceAnnuelle, annees)
    * Math.max(0.3, 1 - 0.5 * (vert - 1))
    * Math.pow(e.macro.prixEnergieConso / e.reference.prixEnergieConso, -0.08)
    * taxe;
  c.emissions = Math.max(0.05 * c.emissions0, c.emissions - (e.effetsDurables?.emissionsEvitees ?? 0));
}

/**
 * Textes du moteur rédigés en euros : convertis en dollars pour les États-Unis
 * (les montants sont déjà exprimés dans la monnaie du pays).
 */
function adapterDevise(valeur) {
  if (typeof valeur === 'string') return valeur.replace(/Md€/g, 'Md$').replace(/ ?€/g, ' $');
  if (Array.isArray(valeur)) return valeur.map(adapterDevise);
  if (valeur && typeof valeur === 'object') return Object.fromEntries(Object.entries(valeur).map(([k, v]) => [k, adapterDevise(v)]));
  return valeur;
}

/** Photographie des indicateurs pour les graphiques. */
function instantane(e) {
  const m = e.macro, f = e.finances, s = e.social;
  return {
    tour: e.tour, trimestre: libelleTrimestre(e.trimestre),
    pib: m.pibNominal, croissanceT: m.croissanceTrimestrielle, croissanceA: m.croissanceAnnuelle,
    inflation: m.inflation, chomage: m.chomage, ecart: m.ecartProduction,
    deficit: f.deficitRatio, dette: f.detteRatio, interets: f.interets, taux10: f.taux10, spread: f.spread,
    recettes: f.recettes, depenses: f.depenses, tauxBCE: tauxDirecteur(e), energie: e.monde.energie,
    popularite: s.popularite, cohesion: s.cohesion, risqueSocial: s.risqueGlobal,
    emissions: e.climat.emissions, influence: e.international.influence,
    groupes: Object.fromEntries(Object.entries(s.groupes).map(([id, g]) => [id, g.popularite])),
  };
}

/**
 * Simule un trimestre.
 * @param {object} etat état courant (non modifié)
 * @param {object} decisions décisions du joueur pour ce trimestre
 * @param {object} options { evenementsActifs: true }
 * @returns {object} nouvel état
 */
export function jouerTour(etat, decisions = {}, options = {}) {
  const e = structuredClone(etat);
  if (e.termine) return e;
  e.mode = normaliserMode(e.mode); // sauvegardes antérieures (bac à sable, réaliste, difficile)
  const alea = creerAleatoire(e.graine);
  const mode = MODES[e.mode];
  const lib = libelleTrimestre(e.trimestre);
  e.resultatsTour = { reformes: [], diplomatie: [], alertes: [] };

  // Référence pour mesurer l'impulsion budgétaire : dépenses pondérées / PIB potentiel nominal
  const potNomAvant = e.reference.pibNominal * (e.macro.pibPotentiel / 100) * (e.macro.niveauPrix / 100);
  const depPondAvant = depensesPondereesMultiplicateur(e.budget);

  // --- 0. Événements en attente : application des choix du joueur ---------------
  const effEv = resoudreEvenements(e, decisions.evenements ?? {}, alea);

  // --- 1. Décisions du joueur ---------------------------------------------------
  for (const [id, v] of Object.entries(decisions.budget ?? {})) {
    if (e.budget[id] && MINISTERES[id].pilotage === 'curseur') e.budget[id].variationVolume = borner(Number(v) || 0, -25, 30);
  }
  const varDiscretionnaires = appliquerTaux(e, decisions.impots ?? {});
  // Une hausse de TVA est répercutée sur les prix sur environ un an
  if (e.impots.tva && e.impots.tva.taux !== etat.impots.tva.taux) {
    const tauxTvaAvant = etat.impots.tva.taux;
    const part = e.impots.tva.partPilotable ?? IMPOTS.tva.partPilotable;
    const choc = PARAMETRES.repercussionTVA * part * (e.impots.tva.taux - tauxTvaAvant) / (100 + tauxTvaAvant) * 100;
    for (let k = 0; k < 4; k++) e.macro.chocsPrixEnAttente.push(choc / 4);
  }
  // Droits de douane : hausse des prix (environ 60 % répercutés sur 15 % de la consommation importée),
  // représailles des partenaires et pertes d'exportations
  if (e.impots.droitsDouane && e.impots.droitsDouane.taux !== etat.impots.droitsDouane.taux) {
    const delta = e.impots.droitsDouane.taux - etat.impots.droitsDouane.taux;
    const choc = 0.6 * 0.15 * delta;
    for (let k = 0; k < 4; k++) e.macro.chocsPrixEnAttente.push(choc / 4);
    if (delta > 0) {
      for (const p of ['chine', 'ue', 'canada', 'mexique']) if (e.international.relations[p] !== undefined) e.international.relations[p] -= 1.5 * delta;
      e.international.chocExport -= 0.02 * delta;
      e.social.groupes.agriculteurs.chocs -= 0.8 * delta; // représailles sur le soja et les produits agricoles
      e.social.groupes.entrepreneurs.chocs -= 0.3 * delta;
    }
  }
  // Président : nomination d'un nouveau Premier ministre (avant les votes du trimestre)
  if (decisions.nominationPM && e.role === 'president' && !options.sansPolitique) {
    const n = nommerPremierMinistre(e, decisions.nominationPM);
    e.resultatsTour.nomination = n.erreur ? { erreur: n.erreur } : { profil: decisions.nominationPM };
  }
  // Réformes : passage devant le Parlement (sauf mesures réglementaires), puis adoption
  let defaite = null;
  if ((decisions.reformes ?? []).length) {
    const validation = options.forcerReformes
      ? { acceptees: decisions.reformes, rejet: null }
      : validerReformes(e, decisions.reformes, decisions.procedureReformes ?? 'vote');
    e.resultatsTour.vote = validation.vote ? { pour: validation.vote.pour, contre: validation.vote.contre, abstention: validation.vote.abstention } : null;
    if (validation.rejet) {
      e.resultatsTour.alertes.push({ type: 'rejet', texte: validation.rejet.raison });
      e.journal.push({ tour: e.tour, trimestre: lib, type: 'politique', texte: `Texte rejeté : ${validation.rejet.raison}` });
    }
    if (validation.censure?.adoptee) defaite = { cause: 'censure', texte: 'Le gouvernement a été renversé par une motion de censure après un 49.3.' };
    for (const r of validation.acceptees) {
      // Contrôle de constitutionnalité des lois (pas des décrets) avant promulgation
      const def = trouverReforme(r.id);
      const controle = !options.sansPolitique && def && def.vote !== false
        ? controleConstitutionnel(e, r.id, r.option, def.nom, alea)
        : { decision: 'conforme', facteur: 1 };
      if (controle.texte) (e.resultatsTour.constitution ??= []).push({ id: r.id, nom: def.nom, decision: controle.decision, texte: controle.texte });
      if (controle.decision === 'totale') {
        e.resultatsTour.reformes.push({ id: r.id, option: r.option, erreur: `Censurée par ${controle.juridiction ?? 'le juge constitutionnel'}` });
        continue;
      }
      const res = adopterReforme(e, r.id, r.option, alea, controle.facteur);
      e.resultatsTour.reformes.push({ id: r.id, option: r.option, erreur: res.erreur ?? null, censurePartielle: controle.decision === 'partielle' || undefined });
    }
    for (const r of decisions.reformes.filter((x) => !validation.acceptees.includes(x))) {
      e.resultatsTour.reformes.push({ id: r.id, option: r.option, erreur: validation.rejet?.raison ?? 'Rejetée' });
    }
  }
  // Référendum (France, article 11) : la réforme est soumise directement aux électeurs
  if (decisions.referendum && e.pays === 'france' && !options.sansPolitique) {
    const def = trouverReforme(decisions.referendum.id);
    const dernier = e.politique.dernierReferendum;
    if (def && (!dernier || dernier.annee < e.trimestre.annee)) {
      const reaction = def.reaction?.(e, decisions.referendum.option) ?? {};
      const r = referendum(e, def, reaction, alea);
      e.resultatsTour.referendum = { nom: def.nom, oui: r.oui, adopte: r.adopte };
      if (r.adopte) {
        const controle = controleConstitutionnel(e, def.id, decisions.referendum.option, def.nom, alea, { referendum: true });
        if (controle.texte) (e.resultatsTour.constitution ??= []).push({ id: def.id, nom: def.nom, decision: controle.decision, texte: controle.texte });
        const res = adopterReforme(e, def.id, decisions.referendum.option, alea);
        e.resultatsTour.reformes.push({ id: def.id, option: decisions.referendum.option, erreur: res.erreur ?? null, referendum: true });
      }
    } else if (def) {
      e.resultatsTour.alertes.push({ type: 'rejet', texte: 'Un seul référendum par an : celui-ci est reporté.' });
    }
  }
  // Communication : l'usure se dissipe, puis l'action du trimestre
  if (!options.sansPolitique) {
    majCommunication(e);
    if (decisions.communication) e.resultatsTour.communication = communiquer(e, decisions.communication, alea);
  }
  // G7 : préparation par les sherpas, puis sommet au deuxième trimestre
  if (e.g7 && !options.sansPolitique) {
    if (decisions.g7Preparation) preparerSommet(e);
    const sommet = tenirSommet(e, decisions.g7, alea);
    if (sommet) e.resultatsTour.g7 = sommet;
  }
  for (const a of decisions.diplomatie ?? []) {
    e.resultatsTour.diplomatie.push(executerAction(e, a.id, a.option, alea));
  }
  // Entreprises et État stratège : programmes, puis actions sur les fleurons (deux au plus par trimestre, hors rencontres)
  for (const p of decisions.programmes ?? []) piloterProgramme(e, p.id, p.commande);
  let operationsCapital = 0; // > 0 : cessions (la dette baisse) ; < 0 : acquisitions (la dette monte)
  e.resultatsTour.entreprises = [];
  let actionsLourdes = 0;
  for (const a of decisions.entreprises ?? []) {
    if (a.action !== 'rencontre' && ++actionsLourdes > ACTIONS_PAR_TRIMESTRE) {
      e.resultatsTour.entreprises.push({ ...a, erreur: `Au plus ${ACTIONS_PAR_TRIMESTRE} opérations sur le capital par trimestre.` });
      continue;
    }
    const r = executerActionEntreprise(e, a.id, a.action, alea);
    operationsCapital += (r.cession ?? 0) - (r.acquisition ?? 0);
    e.resultatsTour.entreprises.push({ ...a, texte: r.texte, erreur: r.erreur ?? null });
  }
  if (decisions.allocationCapitalisation && ALLOCATIONS[decisions.allocationCapitalisation]) {
    e.capitalisation ??= etatCapitalisationInitial();
    e.capitalisation.allocation = decisions.allocationCapitalisation;
  }
  if (decisions.partCourtTerme !== undefined) e.finances.partCourtTerme = borner(decisions.partCourtTerme, 0.05, 0.5);
  if (decisions.trajectoire) e.finances.trajectoireAnnoncee = { ...e.finances.trajectoireAnnoncee, ...decisions.trajectoire };

  // --- 2. Monde -------------------------------------------------------------------
  // Le monde a son propre générateur aléatoire : deux parties aux décisions différentes
  // traversent exactement le même contexte international (comparaisons à contexte identique).
  const aleaMonde = creerAleatoire(e.graineMonde);
  majMonde(e, aleaMonde, {
    macroPays: e.statique.banqueCentrale === 'fed' ? e.macro : null,
    pressionSurLaFed: e.politiqueMonetaire?.pression ?? 0,
    frequenceEvenements: options.evenementsActifs === false ? 0.0001 : mode.frequenceEvenements,
    contributionEcartPays: e.statique.poidsZoneEuro * (e.macro.ecartProduction - (etat.historique.at(-2)?.ecart ?? e.macro.ecartProduction)) * 0.5,
  });
  e.graineMonde = aleaMonde.etat();
  echeancesLegales(e);

  // --- 3. Réformes et sous-modèles ----------------------------------------------
  const effR = majReformes(e, alea);
  // Effets durables des réformes : influence, souveraineté économique, émissions évitées (Mt par an)
  e.effetsDurables = { influence: effR.influence, souverainete: effR.souverainete, emissionsEvitees: effR.emissionsEvitees };
  e.effetsCourants = { plafonnementEnergie: effR.plafonnementEnergie };
  const effT = majTempsTravail(e);
  const kReformes = e.intensiteReformes ?? 1; // effets accentués : le temps de travail est une réforme
  const effRet = majRetraites(e, effR);
  const effI = majInternational(e);
  const effEnt = effetsEntreprises(e);
  majPolitiques(e, e.macro.historiquePrix.at(-1) / e.macro.historiquePrix.at(-2));

  const ajustDepenses = { ...effR.depenses };
  for (const [poste, v] of Object.entries(effI.depenses)) ajustDepenses[poste] = (ajustDepenses[poste] ?? 0) + v;
  for (const [poste, v] of Object.entries(depensesTemporairesActives(e))) ajustDepenses[poste] = (ajustDepenses[poste] ?? 0) + v;
  for (const [poste, v] of Object.entries(effEnt.depenses)) ajustDepenses[poste] = (ajustDepenses[poste] ?? 0) + v;
  ajustDepenses.protectionSociale = (ajustDepenses.protectionSociale ?? 0) + effRet.autresPrestations;

  // --- 4. Dépenses ------------------------------------------------------------------
  majDepenses(e, { depenses: ajustDepenses });

  // --- 5. Impulsion budgétaire ----------------------------------------------------
  const gPotQ = e.macro.croissancePotentielle / 400;
  const potNomApres = potNomAvant * (1 + gPotQ) * (1 + e.macro.inflation / 400);
  const depPondApres = depensesPondereesMultiplicateur(e.budget);
  let impulsion = (depPondApres / potNomApres - depPondAvant / potNomAvant) * 100;
  for (const [id, v] of Object.entries(varDiscretionnaires)) impulsion -= IMPOTS[id].multiplicateur * v / potNomApres * 100;
  const recettesReformes = Object.values(effR.recettes).reduce((s, v) => s + v, 0) + effT.recettes + effI.recettes + (effEnt.recettes.impotSocietes ?? 0);
  impulsion -= 0.4 * (recettesReformes - (e.precedent?.recettesReformes ?? 0)) / potNomApres * 100;
  e.precedent = { recettesReformes };

  // --- 6. Macroéconomie -------------------------------------------------------
  const cot = e.impots.cotisations;
  const cibleEffetCot = cot ? IMPOTS.cotisations.effetChomageStructurelParPoint * (cot.taux - cot.tauxRef) : 0;
  e.macro.effetCotisations = (e.macro.effetCotisations ?? 0) + 0.25 * (cibleEffetCot - (e.macro.effetCotisations ?? 0));
  const is = e.impots.impotSocietes;
  const effetIS = is ? IMPOTS.impotSocietes.effetPotentielParPoint * (is.taux - is.tauxRef) : 0;
  const chocPrix = (e.macro.chocsPrixEnAttente.shift() ?? 0) + effR.chocPrix;
  // Shutdown fédéral en cours : environ −0,15 point de PIB par trimestre (ordre de grandeur des estimations de la CBO)
  const chocShutdown = e.politique?.shutdown ? -0.15 : 0;
  majMacro(e, { budget: impulsion, chocs: (options.chocs ?? 0) + effEv.chocPIB + chocShutdown + (effR.chocDemande ?? 0) }, {
    offreTravail: effR.offreTravail + kReformes * effT.offreTravail + effRet.offreTravail,
    actifsSupplementaires: (effRet.actifsSupplementaires ?? 0) + (effR.offreTravail / 100) * e.macro.populationActiveBase / 0.75,
    chomageStructurel: effR.chomageStructurel + kReformes * effT.chomageStructurel + e.macro.effetCotisations,
    potentielBonus: effR.potentielBonus + effI.potentielBonus + effetIS + effEnt.potentielBonus,
    chocPrix,
  });

  // --- 7. Recettes --------------------------------------------------------------
  const ajustRecettes = { ...effR.recettes };
  ajustRecettes.fixe = (ajustRecettes.fixe ?? 0) + effT.recettes + effI.recettes;
  for (const [cle, v] of Object.entries(effEnt.recettes)) ajustRecettes[cle] = (ajustRecettes[cle] ?? 0) + v;
  const recettes = calculerRecettes(e, ajustRecettes);

  // --- 8. Finances publiques ----------------------------------------------------
  majFinances(e, recettes, totalDepensesPrimaires(e), { cessions: effR.cessions + operationsCapital + (effEv.cessions ?? 0), economieInterets: effI.economieInterets, depensesExceptionnelles: effEv.depensesExceptionnelles });
  majEntreprises(e, etat);
  majCapitalisation(e);
  const bilan = bilanAnnuel(e);
  // Agences de notation : revues prévues ce trimestre
  if (!options.sansPolitique) {
    if (e.notation) e.notation.degradationRecente = null;
    const notes = majNotation(e, alea);
    if (notes.length) e.resultatsTour.notation = notes;
  }
  if (bilan) {
    const regles = bilan.regles.map((r) => `${r.nom} : ${r.realise.toFixed(1)} % pour un objectif de ${r.cible.toFixed(1)} % (${r.respect ? 'respectée' : 'NON respectée'})`).join(' ; ');
    e.journal.push({ tour: e.tour, trimestre: lib, type: 'bilan', texte: `Bilan ${bilan.annee} : déficit de ${bilan.deficit.toFixed(1)} % du PIB, dette de ${bilan.dette.toFixed(1)} %. ${regles}` });
  }

  // --- 9. Stocks, climat, ménages, opinion -------------------------------------
  majStocks(e);
  majClimat(e);
  majMenages(e, effR);
  const mobilisation = majSocial(e, alea);
  if (mobilisation) {
    const nom = e.statique.groupes[mobilisation.groupe] ? mobilisation.groupe : '';
    e.journal.push({ tour: e.tour, trimestre: lib, type: 'social', texte: `Mouvement social (${nom}) : grèves et manifestations. Coût estimé : ${(0.15 * mobilisation.intensite).toFixed(2)} point de PIB par trimestre.` });
    e.resultatsTour.alertes.push({ type: 'mobilisation', groupe: mobilisation.groupe });
  }

  // Baromètre : satisfaction par thème et intentions de vote
  if (!options.sansPolitique) majOpinion(e);

  // --- 10. Vie politique : vote du budget, coalition, censure, élections -------
  // France et Allemagne : budget voté au T4. États-Unis : exercice qui commence le 1er octobre,
  // donc crédits votés au T3, et au premier tour (fin du financement provisoire le 11 décembre 2026).
  const trimestreBudget = e.pays === 'etatsUnis' ? (e.trimestre.t === 3 || e.tour === 1) : e.trimestre.t === 4;
  if (trimestreBudget && !options.sansPolitique) {
    const vb = voterBudget(e, decisions.procedureBudget ?? 'auto');
    e.resultatsTour.budget = { adopte: vb.adopte, pour: vb.vote.pour, contre: vb.vote.contre, abstention: vb.vote.abstention, procedure: vb.procedure, senat: vb.senat?.pour ?? null, censure: vb.censure ? { voix: vb.censure.voix, majorite: vb.censure.majorite, adoptee: vb.censure.adoptee } : null };
    if (vb.censure?.adoptee) defaite = defaite ?? { cause: 'censure', texte: 'Le gouvernement a été renversé par une motion de censure sur le budget.' };
  }
  if (!options.sansPolitique) {
    const mp = majPolitique(e, alea, decisions);
    if (mp.defaite) defaite = defaite ?? mp.defaite;
  }
  // En mode « sans politique » (aperçu, chiffrage), l'instabilité politique reste figée.

  // --- 11. Conditions de défaite économiques -------------------------------------
  if (e.finances.crise) {
    e.finances.trimestresCrise = (e.finances.trimestresCrise ?? 0) + 1;
    e.resultatsTour.alertes.push({ type: 'marches', texte: `Écart de taux à ${Math.round(e.finances.spread)} pb : les marchés doutent de la soutenabilité de la dette.` });
    if (e.finances.trimestresCrise >= 2) {
      defaite = defaite ?? { cause: 'crise_dette', texte: e.statique.zoneEuro === false
        ? 'Crise de la dette : les taux longs s\'envolent, le dollar chute et le Trésor doit imposer en urgence un plan d\'austérité.'
        : 'Crise de la dette : l\'État ne peut plus emprunter à un taux soutenable et doit demander l\'aide du Mécanisme européen de stabilité.' };
    }
  } else e.finances.trimestresCrise = 0;
  // Partie longue (France) : une censure provoque un remaniement, pas la fin de la partie
  if (defaite?.cause === 'censure' && (e.horizon || e.role === 'president')) {
    const texte = remaniement(e, { budget: !!e.resultatsTour.budget?.censure?.adoptee });
    e.resultatsTour.alertes.push({ type: 'remaniement', texte });
    defaite = null;
  }
  if (defaite) {
    if (mode.defaitesActives && !e.bacASable) {
      e.termine = true;
      e.issue = { type: 'defaite', ...defaite };
    } else {
      e.journal.push({ tour: e.tour, trimestre: lib, type: 'alerte', texte: `${defaite.texte} (Mode bac à sable : la partie continue.)` });
      e.resultatsTour.alertes.push({ type: 'defaite_evitee', texte: defaite.texte });
    }
  }
  majObjectifs(e);
  e.resultatsTour.succes = options.sansPolitique ? [] : majSucces(e);

  // --- 12. Historique et passage au trimestre suivant ------------------------------
  majClassements(e);
  e.historique.push(instantane(e));
  e.tour += 1;
  e.trimestre = trimestreSuivant(e.trimestre);
  if (!e.termine && e.tour > e.nbTours) {
    e.termine = true;
    e.issue = { type: 'fin_mandat', texte: e.horizon ? `Vous avez gouverné jusqu'à la fin de ${e.horizon}.` : 'Vous avez mené votre mandat à son terme.' };
  }
  if (e.termine) {
    cloturerObjectifs(e);
    e.score = calculerScore(e);
  } else if (options.evenementsActifs !== false) {
    genererEvenements(e, alea, mode.frequenceEvenements, { max: mode.maxEvenements ?? 3 });
  }
  if (e.statique.devise === '$') {
    e.journal = e.journal.map((j, i) => (i >= etat.journal.length ? adapterDevise(j) : j));
    e.evenements.enAttente = adapterDevise(e.evenements.enAttente);
  }
  e.graine = alea.etat();
  return e;
}

/**
 * Après une défaite, poursuivre la partie en mode bac à sable : utile en
 * partie longue pour voir jusqu'en 2050 les effets des réformes engagées.
 * La défaite reste inscrite (score figé à la date de la défaite) ; les
 * défaites suivantes sont notées au journal sans arrêter la partie.
 */
export function continuerPartie(etat) {
  if (!etat.termine || etat.issue?.type !== 'defaite' || etat.tour > etat.nbTours) return etat;
  const e = structuredClone(etat);
  e.defaites = [...(e.defaites ?? []), { ...e.issue, tour: e.tour - 1, score: e.score?.total ?? null }];
  e.bacASable = true;
  e.termine = false;
  e.issue = null;
  e.score = null;
  // Les objectifs non échus redeviennent en cours
  for (const o of e.objectifs) if (!o.echeanceTour || o.echeanceTour >= e.tour) o.statut = 'en_cours';
  e.journal.push({ tour: e.tour, trimestre: libelleTrimestre(e.trimestre), type: 'alerte', texte: 'Vous poursuivez la partie en mode bac à sable : les défaites suivantes seront notées sans arrêter la partie.' });
  return e;
}

/**
 * Aperçu de l'effet de décisions : compare un tour (et quatre tours) joués
 * avec et sans ces décisions, avec le même tirage aléatoire.
 */
export function apercuDecisions(etat, decisions, horizon = 4) {
  const options = { evenementsActifs: false, sansPolitique: true, forcerReformes: true };
  let avec = etat, sans = etat;
  const res = [];
  for (let k = 0; k < horizon; k++) {
    avec = jouerTour(avec, k === 0 ? decisions : { budget: decisions.budget }, options);
    sans = jouerTour(sans, {}, options);
    res.push(ecarts(avec, sans));
    if (avec.termine || sans.termine) break;
  }
  return { immediat: res[0], unAn: res[res.length - 1] };
}

/** Écarts d'indicateurs clés entre deux états. */
function ecarts(a, b) {
  return {
    soldeMd: (b.finances.deficit - a.finances.deficit),
    deficitPct: a.finances.deficitRatio - b.finances.deficitRatio,
    dettePct: a.finances.detteRatio - b.finances.detteRatio,
    croissance: a.macro.croissanceAnnuelle - b.macro.croissanceAnnuelle,
    pib: (a.macro.pibReel / b.macro.pibReel - 1) * 100,
    inflation: a.macro.inflation - b.macro.inflation,
    chomage: a.macro.chomage - b.macro.chomage,
    popularite: a.social.popularite - b.social.popularite,
    groupes: Object.fromEntries(Object.keys(a.social.groupes).map((g) => [g, a.social.groupes[g].popularite - b.social.groupes[g].popularite])),
    menages: Object.fromEntries(a.menages.map((m, i) => [m.id, m.revenuReel - b.menages[i].revenuReel])),
    risqueSocial: a.social.risqueGlobal - b.social.risqueGlobal,
    emissions: a.climat.emissions - b.climat.emissions,
    taux10: a.finances.taux10 - b.finances.taux10,
  };
}

/**
 * Chiffre une réforme par simulation : écart, après `horizon` trimestres,
 * entre une trajectoire avec la réforme et une trajectoire sans.
 */
export function chiffrerReforme(etat, id, option, horizon = 12) {
  const options = { evenementsActifs: false, sansPolitique: true };
  let avec = jouerTour(etat, { reformes: [{ id, option }] }, { ...options, forcerReformes: true });
  let sans = jouerTour(etat, {}, options);
  const parAn = [];
  for (let k = 1; k < horizon && !avec.termine && !sans.termine; k++) {
    avec = jouerTour(avec, {}, options);
    sans = jouerTour(sans, {}, options);
    if (k % 4 === 3) parAn.push(ecarts(avec, sans));
  }
  return { final: ecarts(avec, sans), parAn };
}
