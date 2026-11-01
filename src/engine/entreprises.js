/**
 * Entreprises, fleurons nationaux et « État stratège ».
 *
 * - Indice boursier (CAC 40, DAX, S&P 500) : suit la croissance nominale, la
 *   conjoncture, les taux longs et le climat des affaires, avec un aléa propre.
 * - Climat des affaires (100 = moyenne de long terme, comme l'indicateur de
 *   l'Insee) : fiscalité des entreprises, coût du travail, stabilité politique,
 *   contributions exceptionnelles, nationalisations récentes.
 * - Souveraineté économique (0 à 100) : contrôle public des actifs
 *   stratégiques, actions spécifiques, programmes d'investissement.
 * - Portefeuille de participations : les dividendes s'ajoutent aux recettes ;
 *   acheter des actions augmente la dette sans creuser le déficit (opération
 *   financière), les vendre la réduit.
 *
 * Coefficients : hypothèses de jeu, signalées comme telles dans l'interface.
 */
import { FLEURONS, INDICES, SOUVERAINETE_DEPART, PROGRAMMES, ACTIONS_ENTREPRISES } from '../data/entreprises.js';
import { creerAleatoire } from './aleatoire.js';
import { borner } from '../model/outils.js';
import { libelleTrimestre } from './calendrier.js';
import { appliquerChocs } from './social.js';
import { calculerPositions, voter, voteSenat } from './politique.js';

/** Rendement des dividendes supposé (estimation de jeu : environ 3,5 % en Europe, 1,3 % pour les grandes valeurs américaines). */
const RENDEMENT_DIVIDENDE = { etatsUnis: 0.013, defaut: 0.035 };
const rendement = (e) => RENDEMENT_DIVIDENDE[e.pays] ?? RENDEMENT_DIVIDENDE.defaut;
/** « Md€ » ou « Md$ » selon le pays. */
const md = (e, x) => `${x.toFixed(1).replace('.', ',')} Md${e.statique.devise ?? '€'}`;
/** Prime payée aux actionnaires en cas de nationalisation (estimation de jeu, ordre de grandeur des offres publiques). */
const PRIME_NATIONALISATION = 0.3;
/** Nombre d'actions sur les entreprises par trimestre (hors rencontres). */
export const ACTIONS_PAR_TRIMESTRE = 2;

export function initialiserEntreprises(e) {
  const defs = FLEURONS[e.pays] ?? [];
  const S0 = SOUVERAINETE_DEPART[e.pays] ?? 50;
  const indice = INDICES[e.pays] ?? { nom: 'Indice', valeur: 100, base100: true };
  e.entreprises = {
    indice: { nom: indice.nom, valeur: indice.valeur, valeur0: indice.valeur, base100: indice.base100, note: indice.note },
    climatAffaires: 100,
    souverainete: S0,
    souverainete0: S0,
    fleurons: defs.map((f) => ({ id: f.id, partEtat: f.partEtat, partEtat0: f.partEtat, valeur: 100, relation: 50, sante: 60, actionSpecifique: !!f.actionSpecifique, emplois: f.emplois, emplois0: f.emplois })),
    programmes: [],
    engagements: [],          // annonces d'investissement obtenues lors des rencontres
    nationalisationsRecentes: 0,
    bonusClimat: 0,
    bonusSouverainete: 0,
    surtaxe: null,            // contribution exceptionnelle des grandes entreprises (réforme)
    aides: null,              // politique des aides aux entreprises (réforme)
    rachats: false,           // taxe sur les rachats d'actions (réforme)
    instabilite0: e.macro.instabilitePolitique,
    graine: ((e.graine ?? 1) * 40503 + 977) >>> 0,
    historique: [],
  };
  e.entreprises.dividendes0 = dividendesModele(e);
  e.entreprises.dividendes = e.entreprises.dividendes0;
  e.entreprises.historique.push(instantane(e));
}

function definition(e, id) {
  return (FLEURONS[e.pays] ?? []).find((f) => f.id === id);
}

/** Valeur de marché d'une entreprise (Md, dans la monnaie du pays). */
export function valeurMarche(e, f) {
  return definition(e, f.id).capitalisation * f.valeur / 100;
}

/** Dividendes annuels perçus par l'État selon le portefeuille modélisé. */
function dividendesModele(e) {
  return e.entreprises.fleurons.reduce((s, f) => s + valeurMarche(e, f) * f.partEtat / 100 * rendement(e) * (f.sante > 30 ? 1 : 0.3), 0);
}

/** Valeur du portefeuille modélisé (Md). */
export function valeurPortefeuille(e) {
  return e.entreprises.fleurons.reduce((s, f) => s + valeurMarche(e, f) * f.partEtat / 100, 0);
}

function instantane(e) {
  const x = e.entreprises;
  return { tour: e.tour, indice: x.indice.valeur, climat: x.climatAffaires, souverainete: x.souverainete, portefeuille: valeurPortefeuille(e) };
}

/** Programmes État stratège disponibles dans le pays. */
export function programmesDisponibles(e) {
  return PROGRAMMES.filter((p) => p.pays === 'tous' || p.pays.includes(e.pays)).map((p) => ({
    ...p, cout: p.coutPctPIB / 100 * e.macro.pibNominal, actif: e.entreprises.programmes.some((x) => x.id === p.id && x.fin === null),
  }));
}

/**
 * Lance ou arrête un programme d'investissement stratégique.
 * @param {string} commande 'lancer' | 'arreter'
 */
export function piloterProgramme(e, id, commande) {
  const def = PROGRAMMES.find((p) => p.id === id);
  if (!def) return { erreur: 'Programme inconnu.' };
  const actif = e.entreprises.programmes.find((x) => x.id === id && x.fin === null);
  const lib = libelleTrimestre(e.trimestre);
  if (commande === 'lancer' && !actif) {
    e.entreprises.programmes.push({ id, debut: e.tour, fin: null });
    e.journal.push({ tour: e.tour, trimestre: lib, type: 'entreprises', texte: `État stratège : lancement du programme « ${def.nom} » (${md(e, def.coutPctPIB / 100 * e.macro.pibNominal)} par an).` });
    return { texte: 'Programme lancé.' };
  }
  if (commande === 'arreter' && actif) {
    actif.fin = e.tour;
    e.entreprises.bonusClimat -= 2; // les industriels n'aiment pas les revirements
    e.journal.push({ tour: e.tour, trimestre: lib, type: 'entreprises', texte: `État stratège : arrêt du programme « ${def.nom} ». Les industriels engagés protestent.` });
    return { texte: 'Programme arrêté.' };
  }
  return { erreur: 'Rien à faire.' };
}

/**
 * Vote d'une loi de nationalisation (Parlement ; Chambre et Sénat aux États-Unis).
 */
function voterNationalisation(e, def) {
  const positions = { ...calculerPositions(e) };
  positions.marche -= 0.8;
  positions.social += 0.3;
  positions.securite += 0.4 * def.strategique;
  positions.europe -= 0.2;
  const saillance = { marche: 2, social: 1.5, securite: 1.5 };
  const vote = voter(e, positions, saillance);
  if (e.pays === 'etatsUnis') {
    const senat = voteSenat(e, positions, saillance);
    return { adopte: vote.adopte && senat.pour >= 60, texte: `Chambre : ${vote.pour} pour, ${vote.contre} contre ; Sénat : ${senat.pour} voix (60 nécessaires)` };
  }
  return { adopte: vote.adopte, texte: `${vote.pour} pour, ${vote.contre} contre, ${vote.abstention} abstentions` };
}

/**
 * Action sur un fleuron.
 * @returns {object} { texte, acquisition, cession } ou { erreur }
 */
export function executerActionEntreprise(e, id, action, alea) {
  const x = e.entreprises;
  const f = x.fleurons.find((y) => y.id === id);
  const def = definition(e, id);
  if (!f || !def) return { erreur: 'Entreprise inconnue.' };
  if (!ACTIONS_ENTREPRISES[action]) return { erreur: 'Action inconnue.' };
  const lib = libelleTrimestre(e.trimestre);
  const v = valeurMarche(e, f);
  const ue = e.statique.zoneEuro !== false;
  let res = { texte: '', acquisition: 0, cession: 0 };

  if (action === 'rencontre') {
    f.relation = borner(f.relation + 12, 0, 100);
    const chance = borner(0.15 + 0.02 * (x.climatAffaires - 95) + 0.006 * (f.relation - 50) + 0.003 * (f.sante - 50), 0.05, 0.85);
    if (alea.tirage(chance)) {
      const montant = Math.max(0.5, Math.round(def.capitalisation * 0.01 * 10) / 10);
      x.engagements.push({ id, montant, debut: e.tour, fin: e.tour + 8 });
      f.emplois *= 1.01;
      res.texte = `${def.nom} annonce ${md(e, montant)} d'investissements dans le pays et des créations d'emplois.`;
      appliquerChocs(e, { salaries: 0.5, entrepreneurs: 0.5 });
    } else {
      res.texte = x.climatAffaires < 95
        ? `La direction de ${def.nom} se dit inquiète du climat des affaires et ne prend aucun engagement.`
        : `Rencontre cordiale avec la direction de ${def.nom}, sans annonce.`;
    }
  } else if (action === 'participation') {
    if (f.partEtat >= 100) return { erreur: 'L\'État détient déjà tout le capital.' };
    const points = Math.min(10, 100 - f.partEtat);
    res.acquisition = v * points / 100 * 1.1;
    f.partEtat += points;
    f.relation = borner(f.relation + (f.sante < 40 ? 10 : -6), 0, 100);
    x.bonusClimat -= 0.5;
    res.texte = `L'État prend ${points} % du capital de ${def.nom} pour ${md(e, res.acquisition)} (financés par l'emprunt). Part de l'État : ${f.partEtat.toFixed(0)} %.`;
  } else if (action === 'nationaliser') {
    if (f.partEtat >= 100) return { erreur: 'Entreprise déjà publique.' };
    const vote = voterNationalisation(e, def);
    if (!vote.adopte) {
      res.texte = `Loi de nationalisation de ${def.nom} rejetée (${vote.texte}).`;
      e.journal.push({ tour: e.tour, trimestre: lib, type: 'entreprises', texte: res.texte });
      return { ...res, rejet: true };
    }
    res.acquisition = v * (100 - f.partEtat) / 100 * (1 + PRIME_NATIONALISATION);
    f.partEtat = 100;
    f.relation = 60;
    x.nationalisationsRecentes += 1;
    e.finances.credibilite = borner(e.finances.credibilite - 0.04, -1, 1);
    appliquerChocs(e, { salaries: 2, jeunes: 1, entrepreneurs: -5 });
    if (ue) { e.international.relations.ue = borner((e.international.relations.ue ?? 0) - 4, -100, 100); if (e.international.relations.frugaux !== undefined) e.international.relations.frugaux -= 3; }
    res.texte = `Loi adoptée (${vote.texte}) : ${def.nom} est nationalisée. Indemnisation des actionnaires : ${md(e, res.acquisition)}, prime de ${PRIME_NATIONALISATION * 100} % comprise.${ue ? ' La Commission européenne examine l\'opération au titre des aides d\'État.' : ''}`;
  } else if (action === 'ceder') {
    if (f.partEtat <= 0) return { erreur: 'L\'État ne détient rien dans cette entreprise.' };
    res.cession = v * f.partEtat / 100 * 0.97;
    const ancienne = f.partEtat;
    f.partEtat = 0;
    x.bonusClimat += 1;
    if (def.strategique >= 0.8) appliquerChocs(e, { salaries: -1, fonctionnaires: -1 });
    res.texte = `L'État cède ses ${ancienne.toFixed(0)} % de ${def.nom} pour ${md(e, res.cession)}, affectés au désendettement.${f.actionSpecifique ? ' L\'action spécifique est conservée.' : ''}`;
  } else if (action === 'action_specifique') {
    if (f.actionSpecifique) return { erreur: 'Une action spécifique existe déjà.' };
    if (def.strategique < 0.5) return { erreur: 'Réservé aux entreprises stratégiques (défense, énergie, technologies critiques).' };
    f.actionSpecifique = true;
    f.relation = borner(f.relation - 5, 0, 100);
    x.bonusClimat -= 0.5;
    res.texte = e.pays === 'allemagne'
      ? `Contrôle renforcé des investissements étrangers (règlement AWV) sur ${def.nom} : toute prise de contrôle devra être autorisée.`
      : `Action spécifique (« golden share ») instituée dans ${def.nom} : l'État pourra s'opposer à la cession d'actifs stratégiques.`;
  }
  e.journal.push({ tour: e.tour, trimestre: lib, type: 'entreprises', texte: res.texte });
  return res;
}

/**
 * Effets budgétaires et économiques du trimestre, calculés AVANT la
 * macroéconomie : coût des programmes, dividendes (versés sur la base de la
 * valorisation du trimestre précédent), contributions, croissance potentielle.
 * @returns {object} { recettes, depenses, potentielBonus }
 */
export function effetsEntreprises(e) {
  const x = e.entreprises;
  if (!x) return { recettes: {}, depenses: {}, potentielBonus: 0 };
  const prix = e.macro.niveauPrix / 100;
  let potentielBonus = 0;
  const depenses = {};
  for (const p of x.programmes) {
    const def = PROGRAMMES.find((d) => d.id === p.id);
    if (p.fin !== null) continue;
    depenses[def.poste] = (depenses[def.poste] ?? 0) + def.coutPctPIB / 100 * e.macro.pibNominal;
    potentielBonus += (def.effets.potentiel ?? 0) * borner((e.tour - p.debut - def.delai) / 8, 0, 1);
  }
  // Engagements d'investissement obtenus : léger supplément de croissance potentielle pendant deux ans
  x.engagements = x.engagements.filter((g) => e.tour < g.fin);
  potentielBonus += 0.002 * x.engagements.reduce((s, g) => s + g.montant, 0) / Math.max(1, e.macro.pibNominal / 1000);
  // Climat des affaires : effet sur l'investissement, donc sur la croissance potentielle (hypothèse)
  potentielBonus += 0.004 * (x.climatAffaires - 100);

  const recettes = { fixe: (x.dividendes - x.dividendes0) * prix };
  // France : la contribution exceptionnelle des grandes entreprises (7,3 Md€ en 2026) prend fin en 2027,
  // les députés ayant supprimé sa prolongation (28/10/2026), sauf si le joueur la rétablit (réforme).
  if (e.pays === 'france' && e.trimestre.annee >= 2027 && !x.surtaxe) recettes.impotSocietes = -7.3 * prix;
  return { recettes, depenses, potentielBonus };
}

/**
 * Évolution trimestrielle APRÈS la macroéconomie et les finances : climat des
 * affaires, Bourse, santé des fleurons, souveraineté, dividendes.
 * @param {object} prev état du trimestre précédent (pour les variations)
 */
export function majEntreprises(e, prev) {
  const x = e.entreprises;
  if (!x) return;
  const alea = creerAleatoire(x.graine);
  const m = e.macro, f = e.finances;

  // --- Climat des affaires -------------------------------------------------------
  const is = e.impots.impotSocietes;
  const cot = e.impots.cotisations;
  const cible = 100 + 1.0 * m.ecartProduction
    - 1.5 * (is ? is.taux - is.tauxRef : 0)
    - 0.25 * (cot ? cot.taux - cot.tauxRef : 0)
    - 25 * (m.instabilitePolitique - x.instabilite0)
    + 6 * f.credibilite
    - (x.surtaxe ? 2.5 : 0) - (x.aides === 'reduire' ? 5 : x.aides === 'conditionner' ? 2 : 0) - (x.rachats ? 1.5 : 0)
    - 4 * x.nationalisationsRecentes
    + 0.8 * x.programmes.filter((p) => p.fin === null).length
    + x.bonusClimat;
  const climatAvant = x.climatAffaires;
  x.climatAffaires = borner(x.climatAffaires + 0.3 * (cible - x.climatAffaires), 60, 140);
  x.nationalisationsRecentes *= 0.85;
  x.bonusClimat *= 0.85;

  // --- Bourse --------------------------------------------------------------------
  const dEcart = m.ecartProduction - (prev?.macro.ecartProduction ?? m.ecartProduction);
  const dTaux = f.taux10 - (prev?.finances.taux10 ?? f.taux10);
  const energieAvant = prev?.monde.energie ?? e.monde.energie;
  const varEnergie = (e.monde.energie - energieAvant) / energieAvant;
  const tendance = (m.croissanceAnnuelle + m.inflation) / 4 + 0.5; // croissance nominale des profits + prime de risque (hypothèse)
  // Krach boursier : environ 1,5 % de risque par trimestre, soit un tous les 15 à 20 ans (hypothèse de jeu)
  const krach = alea.tirage(0.015) ? -20 : 0;
  if (krach) e.journal.push({ tour: e.tour, trimestre: libelleTrimestre(e.trimestre), type: 'alerte', texte: `Krach boursier : le ${x.indice.nom} perd environ 20 %. Les fonds de retraite investis en actions sont touchés.` });
  const rIndice = tendance + 2 * dEcart - 4 * dTaux + 0.15 * (x.climatAffaires - climatAvant) + alea.normale(0, 3) + krach;
  x.indice.valeur *= 1 + rIndice / 100;
  x.indice.variation = rIndice;
  for (const fl of x.fleurons) {
    const def = definition(e, fl.id);
    const idio = -12 * def.exposition.energie * varEnergie - 2 * def.exposition.taux * dTaux + alea.normale(0, 4);
    fl.valeur = Math.max(5, fl.valeur * (1 + (rIndice + idio) / 100));
    const cibleSante = 55 + 0.25 * (fl.valeur - 100) + 0.5 * (x.climatAffaires - 100) - 15 * Math.max(0, def.exposition.energie) * Math.max(0, (e.monde.energie - 150) / 100);
    fl.sante = borner(fl.sante + 0.2 * (cibleSante - fl.sante), 0, 100);
    fl.relation += 0.05 * (50 - fl.relation);
    if (fl.sante < 30) fl.emplois *= 0.995;
  }

  // --- Souveraineté --------------------------------------------------------------
  let cibleSouv = x.souverainete0 + x.bonusSouverainete;
  for (const fl of x.fleurons) {
    const def = definition(e, fl.id);
    cibleSouv += 10 * def.strategique * (fl.partEtat - fl.partEtat0) / 100;
    if (fl.actionSpecifique && !def.actionSpecifique) cibleSouv += 2 * def.strategique;
  }
  for (const p of x.programmes) {
    const def = PROGRAMMES.find((d) => d.id === p.id);
    const age = (p.fin === null ? e.tour : p.fin) - p.debut;
    cibleSouv += (def.effets.souverainete ?? 0) * borner(age / 8, 0, 1) * (p.fin === null ? 1 : 0.5);
  }
  x.souverainete = borner(x.souverainete + 0.25 * (cibleSouv - x.souverainete), 0, 100);
  x.bonusSouverainete *= 0.97;

  x.dividendes = dividendesModele(e);
  x.graine = alea.etat();
  x.historique.push(instantane(e));
}

/** Effets « entreprises » des événements (dossiers). */
export function appliquerEffetsEntreprise(e, eff) {
  const x = e.entreprises;
  if (!x) return;
  if (eff.climatAffaires) x.bonusClimat += eff.climatAffaires;
  if (eff.souverainete) x.bonusSouverainete += eff.souverainete;
  const c = eff.entreprise;
  if (c) {
    const f = x.fleurons.find((y) => y.id === c.id);
    if (!f) return;
    if (c.partEtat !== undefined) f.partEtat = c.partEtat;
    if (c.relation) f.relation = borner(f.relation + c.relation, 0, 100);
    if (c.sante) f.sante = borner(f.sante + c.sante, 0, 100);
    if (c.valeur) f.valeur *= 1 + c.valeur / 100;
    if (c.emplois) f.emplois *= 1 + c.emplois / 100;
    if (c.actionSpecifique) f.actionSpecifique = true;
    if (c.nationalisation) x.nationalisationsRecentes += 1;
  }
}

/** Un fleuron (définition + état) pour les dossiers et l'interface. */
export function fleuron(e, id) {
  const f = e.entreprises?.fleurons.find((y) => y.id === id);
  const def = definition(e, id);
  return f && def ? { ...def, ...f, valeurMarche: valeurMarche(e, f) } : null;
}
