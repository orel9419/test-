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
 * }
 */
import { creerEtatInitial } from './etatInitial.js';
import { creerAleatoire } from './aleatoire.js';
import { libelleTrimestre, trimestreSuivant } from './calendrier.js';
import { majMonde } from './monde.js';
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
import { MINISTERES } from '../model/ministeres.js';
import { IMPOTS } from '../model/impots.js';
import { PARAMETRES, MODES } from '../model/parametres.js';
import { borner } from '../model/outils.js';

export { reformesDisponibles, actionsDisponibles };

export function creerPartie(options) {
  const e = creerEtatInitial(options);
  e.politiqueSociale = { indicePrestations: 1, gel: null, surplusBaremeGele: 0, rendementPatrimoine: 0, bloquerCotisation2028: false };
  e.politiqueSalariale = { indicePoint: 1, gel: null, indiceSmic: 1 };
  e.macro.chocsPrixEnAttente = [];
  e.precedent = { recettesReformes: 0 };
  e.historique.push({ ...instantane(e), trimestre: 'Départ' });
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
}

/** Photographie des indicateurs pour les graphiques. */
function instantane(e) {
  const m = e.macro, f = e.finances, s = e.social;
  return {
    tour: e.tour, trimestre: libelleTrimestre(e.trimestre),
    pib: m.pibNominal, croissanceT: m.croissanceTrimestrielle, croissanceA: m.croissanceAnnuelle,
    inflation: m.inflation, chomage: m.chomage, ecart: m.ecartProduction,
    deficit: f.deficitRatio, dette: f.detteRatio, interets: f.interets, taux10: f.taux10, spread: f.spread,
    recettes: f.recettes, depenses: f.depenses, tauxBCE: e.monde.tauxBCE, energie: e.monde.energie,
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
  const alea = creerAleatoire(e.graine);
  const mode = MODES[e.mode];
  const lib = libelleTrimestre(e.trimestre);
  e.resultatsTour = { reformes: [], diplomatie: [], alertes: [] };

  // Référence pour mesurer l'impulsion budgétaire : dépenses pondérées / PIB potentiel nominal
  const potNomAvant = e.reference.pibNominal * (e.macro.pibPotentiel / 100) * (e.macro.niveauPrix / 100);
  const depPondAvant = depensesPondereesMultiplicateur(e.budget);

  // --- 1. Décisions du joueur ---------------------------------------------------
  for (const [id, v] of Object.entries(decisions.budget ?? {})) {
    if (e.budget[id] && MINISTERES[id].pilotage === 'curseur') e.budget[id].variationVolume = borner(Number(v) || 0, -25, 30);
  }
  const varDiscretionnaires = appliquerTaux(e, decisions.impots ?? {});
  // Une hausse de TVA est répercutée sur les prix sur environ un an
  const tauxTvaAvant = etat.impots.tva.taux;
  if (e.impots.tva.taux !== tauxTvaAvant) {
    const part = e.impots.tva.partPilotable ?? IMPOTS.tva.partPilotable;
    const choc = PARAMETRES.repercussionTVA * part * (e.impots.tva.taux - tauxTvaAvant) / (100 + tauxTvaAvant) * 100;
    for (let k = 0; k < 4; k++) e.macro.chocsPrixEnAttente.push(choc / 4);
  }
  for (const r of decisions.reformes ?? []) {
    const res = adopterReforme(e, r.id, r.option, alea);
    e.resultatsTour.reformes.push({ id: r.id, option: r.option, erreur: res.erreur ?? null });
  }
  for (const a of decisions.diplomatie ?? []) {
    e.resultatsTour.diplomatie.push(executerAction(e, a.id, a.option, alea));
  }
  if (decisions.partCourtTerme !== undefined) e.finances.partCourtTerme = borner(decisions.partCourtTerme, 0.05, 0.5);
  if (decisions.trajectoire) e.finances.trajectoireAnnoncee = { ...e.finances.trajectoireAnnoncee, ...decisions.trajectoire };

  // --- 2. Monde -------------------------------------------------------------------
  majMonde(e, alea, {
    frequenceEvenements: options.evenementsActifs === false ? 0.0001 : mode.frequenceEvenements,
    contributionEcartPays: e.statique.poidsZoneEuro * (e.macro.ecartProduction - (etat.historique.at(-2)?.ecart ?? e.macro.ecartProduction)) * 0.5,
  });
  echeancesLegales(e);

  // --- 3. Réformes et sous-modèles ----------------------------------------------
  const effR = majReformes(e, alea);
  e.effetsCourants = { plafonnementEnergie: effR.plafonnementEnergie };
  const effT = majTempsTravail(e);
  const effRet = majRetraites(e);
  const effI = majInternational(e);
  majPolitiques(e, e.macro.historiquePrix.at(-1) / e.macro.historiquePrix.at(-2));

  const ajustDepenses = { ...effR.depenses };
  for (const [poste, v] of Object.entries(effI.depenses)) ajustDepenses[poste] = (ajustDepenses[poste] ?? 0) + v;
  ajustDepenses.protectionSociale = (ajustDepenses.protectionSociale ?? 0) + effRet.autresPrestations;

  // --- 4. Dépenses ------------------------------------------------------------------
  majDepenses(e, { depenses: ajustDepenses });

  // --- 5. Impulsion budgétaire ----------------------------------------------------
  const gPotQ = e.macro.croissancePotentielle / 400;
  const potNomApres = potNomAvant * (1 + gPotQ) * (1 + e.macro.inflation / 400);
  const depPondApres = depensesPondereesMultiplicateur(e.budget);
  let impulsion = (depPondApres / potNomApres - depPondAvant / potNomAvant) * 100;
  for (const [id, v] of Object.entries(varDiscretionnaires)) impulsion -= IMPOTS[id].multiplicateur * v / potNomApres * 100;
  const recettesReformes = Object.values(effR.recettes).reduce((s, v) => s + v, 0) + effT.recettes + effI.recettes;
  impulsion -= 0.4 * (recettesReformes - (e.precedent?.recettesReformes ?? 0)) / potNomApres * 100;
  e.precedent = { recettesReformes };

  // --- 6. Macroéconomie -------------------------------------------------------
  const cot = e.impots.cotisations;
  const cibleEffetCot = cot ? IMPOTS.cotisations.effetChomageStructurelParPoint * (cot.taux - cot.tauxRef) : 0;
  e.macro.effetCotisations = (e.macro.effetCotisations ?? 0) + 0.25 * (cibleEffetCot - (e.macro.effetCotisations ?? 0));
  const is = e.impots.impotSocietes;
  const effetIS = is ? IMPOTS.impotSocietes.effetPotentielParPoint * (is.taux - is.tauxRef) : 0;
  const chocPrix = (e.macro.chocsPrixEnAttente.shift() ?? 0) + effR.chocPrix;
  majMacro(e, { budget: impulsion, chocs: options.chocs ?? 0 }, {
    offreTravail: effR.offreTravail + effT.offreTravail + effRet.offreTravail,
    actifsSupplementaires: (effRet.actifsSupplementaires ?? 0) + (effR.offreTravail / 100) * e.macro.populationActiveBase / 0.75,
    chomageStructurel: effR.chomageStructurel + effT.chomageStructurel + e.macro.effetCotisations,
    potentielBonus: effR.potentielBonus + effI.potentielBonus + effetIS,
    chocPrix,
  });

  // --- 7. Recettes --------------------------------------------------------------
  const ajustRecettes = { ...effR.recettes };
  ajustRecettes.fixe = (ajustRecettes.fixe ?? 0) + effT.recettes + effI.recettes;
  const recettes = calculerRecettes(e, ajustRecettes);

  // --- 8. Finances publiques ----------------------------------------------------
  majFinances(e, recettes, totalDepensesPrimaires(e), { cessions: effR.cessions, economieInterets: effI.economieInterets });
  const bilan = bilanAnnuel(e);
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

  // --- 10. Conditions de défaite économiques -------------------------------------
  if (e.finances.crise) {
    e.finances.trimestresCrise = (e.finances.trimestresCrise ?? 0) + 1;
    e.resultatsTour.alertes.push({ type: 'marches', texte: `Écart de taux à ${Math.round(e.finances.spread)} pb : les marchés doutent de la soutenabilité de la dette.` });
    if (e.finances.trimestresCrise >= 2 && mode.defaitesActives) {
      e.termine = true;
      e.issue = { type: 'defaite', cause: 'crise_dette', texte: 'Crise de la dette : l\'État ne peut plus emprunter à un taux soutenable et doit demander l\'aide du Mécanisme européen de stabilité.' };
    }
  } else e.finances.trimestresCrise = 0;

  // --- 11. Historique et passage au trimestre suivant ------------------------------
  e.historique.push(instantane(e));
  e.graine = alea.etat();
  e.tour += 1;
  e.trimestre = trimestreSuivant(e.trimestre);
  if (!e.termine && e.tour > e.nbTours) {
    e.termine = true;
    e.issue = { type: 'fin_mandat', texte: 'Fin du mandat.' };
  }
  return e;
}

/**
 * Aperçu de l'effet de décisions : compare un tour (et quatre tours) joués
 * avec et sans ces décisions, avec le même tirage aléatoire.
 */
export function apercuDecisions(etat, decisions, horizon = 4) {
  const options = { evenementsActifs: false };
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
  const options = { evenementsActifs: false };
  let avec = jouerTour(etat, { reformes: [{ id, option }] }, options);
  let sans = jouerTour(etat, {}, options);
  const parAn = [];
  for (let k = 1; k < horizon && !avec.termine && !sans.termine; k++) {
    avec = jouerTour(avec, {}, options);
    sans = jouerTour(sans, {}, options);
    if (k % 4 === 3) parAn.push(ecarts(avec, sans));
  }
  return { final: ecarts(avec, sans), parAn };
}
