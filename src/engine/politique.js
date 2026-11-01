/**
 * Vie politique et institutions.
 *
 * Chaque groupe parlementaire a une « satisfaction » vis-à-vis du
 * gouvernement : posture de départ + adéquation entre ses positions et la
 * politique menée (sur neuf axes) + popularité du gouvernement + concessions
 * obtenues. La satisfaction détermine les votes (pour, abstention, contre) et
 * la participation à une motion de censure.
 *
 * France (semi-présidentiel) : vote du budget au T4, 49.3 (sans limite pour
 * le budget, une fois par session pour un autre texte), motion de censure à
 * la majorité absolue, ordonnances budgétaires (art. 47), dissolution,
 * présidentielle d'avril 2027 suivie de législatives.
 * Allemagne (coalition) : accord de coalition, satisfaction du partenaire
 * (SPD), défections, Bundesrat pour les lois fiscales, majorité des deux
 * tiers pour réviser la Constitution, élection fédérale de 2029.
 * États-Unis (présidentiel) : le président ne dissout pas et ne peut pas être
 * renversé, mais il lui faut la Chambre (majorité simple) ET le Sénat
 * (60 voix pour vaincre l'obstruction, ou 51 par la « réconciliation »
 * budgétaire, une fois par exercice et hors Social Security), un budget voté
 * avant le 1er octobre (sinon shutdown) et le relèvement du plafond de la dette.
 */
import { PARTIS, SONDAGES_DEPART, ACCORD_COALITION } from '../data/partis.js';
import { trouverReforme } from './reformes.js';
import { borner } from '../model/outils.js';
import { libelleTrimestre } from './calendrier.js';
import { legislativesFrance, electionsDuTrimestre } from './elections.js';

const AXES = ['social', 'fiscal', 'retraites', 'travail', 'ecologie', 'europe', 'marche', 'securite', 'rigueur'];
const POSTURE = { gouvernement: 1.5, soutien: 0.5, pivot: -0.3, opposition: -1.5 };
/** Popularité « normale » de l'exécutif, au-delà de laquelle les partis hésitants se rallient (estimation). */
const POPULARITE_REFERENCE = { france: 26, allemagne: 26, etatsUnis: 38 };

export function initialiserPolitique(e, donnees) {
  const defs = PARTIS[e.pays];
  let groupes;
  if (e.pays === 'france') {
    const sources = donnees.politique.assemblee_nationale.groupes;
    groupes = defs.map((p) => ({ ...p, sieges: p.siegesEstimes ?? sources.find((g) => g.id === p.id)?.sieges ?? 0 }));
  } else if (e.pays === 'etatsUnis') {
    // Chambre : 217 républicains (dont environ 30 au Freedom Caucus), 214 démocrates + 1 indépendant, 3 sièges vacants
    groupes = defs.map((p) => ({ ...p, sieges: p.siegesEstimes }));
  } else {
    const sources = donnees.politique.bundestag.groupes;
    groupes = defs.map((p) => ({ ...p, sieges: sources.find((g) => g.id === p.id)?.sieges ?? 0 }));
  }
  const total = groupes.reduce((s, g) => s + g.sieges, 0);
  const pol = {
    regime: e.statique.regime,
    sieges: total,
    majorite: Math.floor(total / 2) + 1,
    groupes: groupes.map((g) => ({ ...g, satisfaction: 0, concessions: 0 })),
    positions: Object.fromEntries(AXES.map((a) => [a, 0])),
    utilisations493: {},
    derniereDissolution: { annee: 2024, t: 2 },
    cohabitation: false,
    budgetsAdoptes: [],
    votes: [],
    anneeBudget: e.trimestre.annee,
    tauxDebutAnnee: Object.fromEntries(Object.entries(e.impots).map(([id, c]) => [id, c.taux])),
    variationsDebutAnnee: Object.fromEntries(Object.entries(e.budget).map(([id, l]) => [id, l.variationVolume])),
  };
  if (e.pays === 'allemagne') {
    pol.coalition = { partenaire: 'SPD', satisfaction: 45, trimestresCrise: 0, rompue: false, engagements: ACCORD_COALITION.map((x) => ({ id: x.id, nom: x.nom, porteur: x.porteur, respecte: true })) };
    pol.bundesrat = { voix: 69, majorite: 35, soutien: 36, note: 'Soutien estimé : composition après les élections régionales de 2026 non collectée.' };
    pol.intentions = { ...SONDAGES_DEPART.allemagne.intentions };
  } else if (e.pays === 'etatsUnis') {
    const senat = donnees?.politique?.senat?.groupes ?? [];
    pol.senat = { REP: senat.find((g) => g.id === 'REP')?.sieges ?? 53, DEM: senat.find((g) => g.id === 'DEM')?.sieges ?? 47, obstruction: 60 };
    pol.gouvernementDivise = false;
    pol.reconciliations = [];
    pol.shutdown = null;
    pol.shutdowns = [];
    pol.plafondDette = { trimestresMesuresExceptionnelles: 0, relevements: [] };
    pol.presidentielle = { partCamp: SONDAGES_DEPART.etatsUnis.presidentielle.camp, tenue: false };
  } else {
    pol.presidentielle = { partCamp: SONDAGES_DEPART.france.presidentielle2ndTour.camp, tenue: false };
  }
  e.politique = pol;
  calculerPositions(e);
  majSatisfactions(e);
  return pol;
}

/** Variation en volume moyenne (%) d'une liste de postes. */
function variationPostes(e, postes) {
  const prix = e.macro.niveauPrix / 100;
  const v = postes.filter((p) => e.budget[p]).map((p) => (e.budget[p].montant / (e.budget[p].montantInitial * prix) - 1) * 100);
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0;
}

/** Position de la politique gouvernementale sur chaque axe (−1 à +1). */
export function calculerPositions(e, reformesEnPlus = []) {
  const imp = e.impots;
  const p = Object.fromEntries(AXES.map((a) => [a, 0]));
  p.social += variationPostes(e, ['protectionSociale', 'sante', 'logement', 'education', 'travailEmploi']) / 8;
  p.fiscal += (imp.impotRevenu.taux - 100) / 10 + ((imp.impotSocietes?.taux ?? 0) - (imp.impotSocietes?.tauxRef ?? 0)) / 5
    + ((imp.droitsSuccession?.taux ?? 100) - 100) / 60;
  p.social -= (imp.tva ? (imp.tva.taux - imp.tva.tauxRef) / 4 : 0) + ((imp.csg ? imp.csg.taux - imp.csg.tauxRef : 0) / 2)
    + (imp.droitsDouane ? (imp.droitsDouane.taux - imp.droitsDouane.tauxRef) / 10 : 0);
  // Droits de douane : position protectionniste (contre l'Europe et le marché ouvert)
  if (imp.droitsDouane) { p.marche -= (imp.droitsDouane.taux - imp.droitsDouane.tauxRef) / 15; p.europe -= (imp.droitsDouane.taux - imp.droitsDouane.tauxRef) / 15; }
  p.ecologie += variationPostes(e, ['ecologieEnergie', 'transports']) / 10 + ((imp.accisesEnergie?.taux ?? 100) - 100) / 40;
  p.marche += -((imp.impotSocietes?.taux ?? 0) - (imp.impotSocietes?.tauxRef ?? 0)) / 5 - ((imp.cotisations?.taux ?? 100) - 100) / 10;
  p.securite += variationPostes(e, ['defense', 'interieurJustice']) / 10;
  const deficit0 = e.reference.deficitRatio ?? e.finances.deficitRatio;
  p.rigueur += (deficit0 - e.finances.deficitRatio) / 1.5;
  const reformes = [...e.reformes.actives.filter((r) => !r.diplomatique), ...reformesEnPlus];
  for (const r of reformes) {
    const def = trouverReforme(r.id);
    if (!def) continue;
    const axes = { ...(def.axes ?? {}), ...(def.axesParOption?.[r.option] ?? {}) };
    for (const [a, v] of Object.entries(axes)) p[a] = (p[a] ?? 0) + v * 0.6;
  }
  for (const a of e.international?.actionsRealisees ?? []) {
    if (!a.reussite) continue;
    if (['emprunt_commun', 'achats_groupes', 'pret_safe'].includes(a.id) || a.option === 'front_europeen') p.europe += 0.3;
    if (a.id === 'mercosur' && a.option === 'bloquer') p.europe -= 0.3;
    if (a.id === 'aide_ukraine') p.securite += 0.2;
  }
  for (const a of AXES) p[a] = borner(p[a], -1.5, 1.5);
  if (!reformesEnPlus.length) e.politique.positions = p;
  return p;
}

/** Satisfaction d'un groupe pour une politique donnée (positions). */
export function satisfaction(e, g, positions = e.politique.positions, saillance = {}) {
  let s = POSTURE[g.posture] ?? 0;
  for (const a of AXES) s += 0.8 * (saillance[a] ?? 1) * (g.axes[a] ?? 0) * (positions[a] ?? 0);
  const pop = e.social?.popularite ?? 25;
  const ref = POPULARITE_REFERENCE[e.pays] ?? 26;
  if (g.posture === 'pivot' || g.posture === 'soutien') s += 0.03 * (pop - ref);
  else if (g.posture === 'opposition') s += 0.01 * (pop - ref);
  // Approche des élections : les oppositions durcissent leur position
  if (g.posture === 'opposition' && trimestresAvantElection(e) <= 3) s -= 0.3;
  return s + (g.concessions ?? 0);
}

function trimestresAvantElection(e) {
  const prochaine = (e.statique.calendrier.echeances || []).find((x) => ['presidentielle', 'legislatives', 'mi_mandat'].includes(x.type) && (x.annee > e.trimestre.annee || (x.annee === e.trimestre.annee && x.t >= e.trimestre.t)));
  if (!prochaine) return 99;
  return (prochaine.annee - e.trimestre.annee) * 4 + (prochaine.t - e.trimestre.t);
}

/** Recalcule la satisfaction de chaque groupe et l'instabilité politique. */
export function majSatisfactions(e) {
  const pol = e.politique;
  for (const g of pol.groupes) {
    g.satisfaction = satisfaction(e, g);
    g.concessions = (g.concessions ?? 0) * 0.9;
  }
  if (e.pays === 'france') {
    const censeurs = pol.groupes.filter((g) => g.posture !== 'gouvernement' && g.satisfaction < (g.seuilCensure ?? -0.5)).reduce((s, g) => s + g.sieges, 0);
    pol.siegesCenseurs = censeurs;
    const base = 0.2 + 0.5 * Math.max(0, censeurs - 240) / 50 + (pol.cohabitation ? 0.3 : 0);
    e.macro.instabilitePolitique = borner(0.7 * e.macro.instabilitePolitique + 0.3 * base + (pol.chocInstabilite ?? 0), 0, 1);
  } else if (e.pays === 'etatsUnis') {
    // Instabilité : gouvernement divisé, shutdown, bras de fer sur le plafond de la dette
    const base = 0.25 + (pol.gouvernementDivise ? 0.15 : 0) + (pol.shutdown ? 0.2 : 0) + (pol.plafondDette?.trimestresMesuresExceptionnelles ? 0.25 : 0);
    e.macro.instabilitePolitique = borner(0.7 * e.macro.instabilitePolitique + 0.3 * base + (pol.chocInstabilite ?? 0), 0, 1);
  } else {
    const c = pol.coalition;
    const base = 0.15 + 0.5 * Math.max(0, 50 - c.satisfaction) / 50 + (c.rompue ? 0.4 : 0);
    e.macro.instabilitePolitique = borner(0.7 * e.macro.instabilitePolitique + 0.3 * base + (pol.chocInstabilite ?? 0), 0, 1);
  }
  pol.chocInstabilite = 0;
}

/**
 * Vote d'un texte à l'Assemblée nationale ou au Bundestag.
 * @param {object} positions politique évaluée
 * @param {object} saillance poids des axes concernés par le texte
 * @returns {object} { adopte, pour, contre, abstention, detail }
 */
export function voter(e, positions, saillance = {}) {
  const pol = e.politique;
  let pour = 0, contre = 0, abstention = 0;
  const detail = [];
  for (const g of pol.groupes) {
    let sat = satisfaction(e, g, positions, saillance);
    // Au Congrès américain, on vote pour ou contre (l'abstention « present » est rarissime)
    let vote = e.pays === 'etatsUnis' ? (sat > 0 ? 'pour' : 'contre') : sat > 0.3 ? 'pour' : sat < -0.3 ? 'contre' : 'abstention';
    let sieges = g.sieges;
    let defections = 0;
    // Allemagne : défections dans la coalition si le partenaire est mécontent
    if (e.pays === 'allemagne' && g.posture === 'gouvernement') {
      vote = 'pour';
      const satCoalition = g.partenaire ? pol.coalition.satisfaction : 60;
      defections = Math.round(Math.max(0, 35 - satCoalition) / 2);
      if (pol.coalition.rompue && g.partenaire) { vote = sat > 0.3 ? 'pour' : 'contre'; defections = 0; }
    }
    if (e.pays === 'etatsUnis') {
      // Élus peu disciplinés : la part de « oui » croît avec la satisfaction du groupe (de 0 à −0,5 jusqu'à 100 % à +0,5)
      const oui = Math.round(sieges * borner(0.5 + sat, 0, 1));
      pour += oui; contre += sieges - oui;
      defections = vote === 'pour' ? sieges - oui : oui;
    } else if (vote === 'pour') { pour += sieges - defections; contre += defections; } else if (vote === 'contre') contre += sieges; else abstention += sieges;
    detail.push({ id: g.id, nom: g.nom, sieges, vote, defections, satisfaction: sat });
  }
  return { adopte: pour > contre && (e.pays !== 'allemagne' || pour >= pol.majorite || pour > contre), pour, contre, abstention, detail };
}

/** Motion de censure (France). */
export function motionCensure(e, decalage = 0) {
  const pol = e.politique;
  let voix = 0;
  const detail = [];
  for (const g of pol.groupes) {
    if (g.posture === 'gouvernement') continue;
    const sat = g.satisfaction + decalage;
    const vote = sat < (g.seuilCensure ?? -0.5);
    if (vote) voix += g.sieges;
    detail.push({ id: g.id, vote, sieges: g.sieges });
  }
  return { adoptee: voix >= pol.majorite, voix, majorite: pol.majorite, detail };
}

function session(e) {
  // Session parlementaire française : d'octobre à juin
  return e.trimestre.t === 4 ? e.trimestre.annee : e.trimestre.annee - 1;
}

/** Saillance d'un texte : les axes des réformes concernées pèsent davantage. */
function saillanceReformes(reformes) {
  const s = {};
  for (const r of reformes) {
    const def = trouverReforme(r.id);
    const axes = { ...(def?.axes ?? {}), ...(def?.axesParOption?.[r.option] ?? {}) };
    for (const a of Object.keys(axes)) s[a] = 2;
  }
  return s;
}

/**
 * Filtre les réformes proposées ce trimestre selon le processus législatif.
 * @param {string} procedure 'vote' | '49.3' (France)
 * @returns {object} { acceptees: [...], rejet: { raison, vote } | null, censure }
 */
export function validerReformes(e, reformes, procedure = 'vote') {
  const legislatives = reformes.filter((r) => trouverReforme(r.id)?.vote !== false);
  const directes = reformes.filter((r) => trouverReforme(r.id)?.vote === false);
  if (!legislatives.length) return { acceptees: directes, rejet: null };
  const positions = calculerPositions(e, legislatives);
  const saillance = saillanceReformes(legislatives);
  const pol = e.politique;
  const lib = libelleTrimestre(e.trimestre);

  if (e.pays === 'allemagne') {
    // 1. Accord du partenaire de coalition
    // Le partenaire juge le texte sur le fond (sans le bonus de participation au gouvernement)
    const spd = pol.groupes.find((g) => g.partenaire);
    const surLeFond = satisfaction(e, { ...spd, posture: 'pivot', concessions: 0 }, positions, saillance);
    const accordSPD = pol.coalition.rompue ? true : surLeFond > -0.4 || pol.coalition.satisfaction > 70;
    if (!accordSPD) return { acceptees: directes, rejet: { raison: 'Le SPD bloque le texte au comité de coalition.' } };
    // 2. Majorité des deux tiers pour une révision constitutionnelle
    const constitutionnelles = legislatives.filter((r) => trouverReforme(r.id)?.majoriteRenforcee);
    if (constitutionnelles.length) {
      const vote = voter(e, positions, saillance);
      const deuxTiers = Math.ceil(pol.sieges * 2 / 3);
      if (vote.pour < deuxTiers) {
        e.journal.push({ tour: e.tour, trimestre: lib, type: 'politique', texte: `Révision constitutionnelle rejetée : ${vote.pour} voix pour, ${deuxTiers} nécessaires (deux tiers).` });
        return { acceptees: [...directes, ...legislatives.filter((r) => !constitutionnelles.includes(r))], rejet: { raison: `Majorité des deux tiers non atteinte (${vote.pour}/${deuxTiers}).`, vote } };
      }
    }
    const vote = voter(e, positions, saillance);
    pol.votes.push({ tour: e.tour, texte: 'Réformes', ...resumeVote(vote) });
    if (!vote.adopte) return { acceptees: directes, rejet: { raison: `Rejet au Bundestag (${vote.pour} pour, ${vote.contre} contre).`, vote } };
    // 3. Bundesrat pour les textes fiscaux
    const fiscales = legislatives.filter((r) => trouverReforme(r.id)?.categorie === 'fiscalite');
    if (fiscales.length && pol.bundesrat.soutien < pol.bundesrat.majorite) {
      return { acceptees: [...directes, ...legislatives.filter((r) => !fiscales.includes(r))], rejet: { raison: 'Le Bundesrat bloque les mesures fiscales (les Länder exigent une compensation).' } };
    }
    return { acceptees: reformes, rejet: null, vote };
  }

  if (e.pays === 'etatsUnis') return validerReformesEtatsUnis(e, legislatives, directes, positions, saillance, procedure);

  // France
  const vote = voter(e, positions, saillance);
  pol.votes.push({ tour: e.tour, texte: 'Projet de loi de réformes', ...resumeVote(vote) });
  if (vote.adopte) return { acceptees: reformes, rejet: null, vote };
  if (procedure === '49.3') {
    const s = session(e);
    if ((pol.utilisations493[s] ?? 0) >= 1) {
      return { acceptees: directes, rejet: { raison: 'Le 49.3 a déjà été utilisé pour un texte hors budget lors de cette session.', vote } };
    }
    pol.utilisations493[s] = (pol.utilisations493[s] ?? 0) + 1;
    pol.chocInstabilite = (pol.chocInstabilite ?? 0) + 0.08;
    for (const g of pol.groupes) g.satisfaction = satisfaction(e, g, positions, saillance);
    const censure = motionCensure(e, -0.2);
    e.journal.push({ tour: e.tour, trimestre: lib, type: 'politique', texte: `49.3 sur le projet de loi de réformes. Motion de censure : ${censure.voix} voix (majorité requise : ${censure.majorite}). ${censure.adoptee ? 'ADOPTÉE : le gouvernement est renversé.' : 'Rejetée.'}` });
    return { acceptees: censure.adoptee ? [] : reformes, rejet: null, vote, censure };
  }
  return { acceptees: directes, rejet: { raison: `Rejet à l'Assemblée (${vote.pour} pour, ${vote.contre} contre, ${vote.abstention} abstentions).`, vote } };
}

// ---------------------------------------------------------------------------
// États-Unis : Sénat, réconciliation, shutdown, plafond de la dette
// ---------------------------------------------------------------------------

/** Exercice budgétaire fédéral (du 1er octobre au 30 septembre) : FY2027 commence en octobre 2026. */
export function exerciceBudgetaire(e) {
  return e.trimestre.annee + (e.trimestre.t === 4 ? 1 : 0);
}

/**
 * Catégories de réformes qui peuvent passer par la réconciliation budgétaire
 * (recettes, dépenses obligatoires, dette). La « règle Byrd » exclut les
 * dispositions sans effet budgétaire et toute modification de la Social Security.
 */
const RECONCILIABLE = ['fiscalite', 'protection_sociale', 'sante', 'energie', 'dette', 'fonction_publique'];
export function reconciliable(id) {
  const def = trouverReforme(id);
  return !!def && RECONCILIABLE.includes(def.categorie) && !def.horsReconciliation;
}

/**
 * Vote au Sénat. Chaque camp vote selon la satisfaction de son groupe à la
 * Chambre ; une fraction des sénateurs franchit la ligne quand le texte leur
 * convient à moitié (de 0 % à une satisfaction de −0,3 jusqu'à 100 % à +0,5).
 */
export function voteSenat(e, positions, saillance = {}) {
  const pol = e.politique;
  const g = (id) => pol.groupes.find((x) => x.id === id);
  const satR = 0.85 * satisfaction(e, g('REP'), positions, saillance) + 0.15 * satisfaction(e, g('FREEDOM'), positions, saillance);
  const satD = satisfaction(e, g('DEM'), positions, saillance);
  const part = (x) => borner((x + 0.3) / 0.8, 0, 1);
  // Le camp présidentiel occupe la vice-présidence, qui départage les égalités
  const pourR = Math.round(pol.senat.REP * part(satR));
  const pourD = Math.round(pol.senat.DEM * part(satD));
  return { pour: pourR + pourD, contre: 100 - pourR - pourD, pourR, pourD, satR, satD };
}

function validerReformesEtatsUnis(e, legislatives, directes, positions, saillance, procedure) {
  const pol = e.politique;
  const vote = voter(e, positions, saillance);
  pol.votes.push({ tour: e.tour, texte: 'Projet de loi (Chambre)', ...resumeVote(vote) });
  if (!vote.adopte) return { acceptees: directes, rejet: { raison: `Rejet à la Chambre des représentants (${vote.pour} pour, ${vote.contre} contre).`, vote } };
  let textes = legislatives;
  let exclues = [];
  let seuil = pol.senat.obstruction;
  if (procedure === 'reconciliation') {
    const fy = exerciceBudgetaire(e);
    if (pol.reconciliations.includes(fy)) {
      return { acceptees: directes, rejet: { raison: `Une loi de réconciliation a déjà été adoptée pour l'exercice ${fy} : ce texte doit réunir 60 sénateurs.`, vote } };
    }
    exclues = legislatives.filter((r) => !reconciliable(r.id));
    textes = legislatives.filter((r) => reconciliable(r.id));
    if (!textes.length) return { acceptees: directes, rejet: { raison: 'Règle Byrd : aucune de ces mesures ne peut passer par la réconciliation (sans effet budgétaire direct, ou touchant la Social Security).', vote } };
    seuil = 50; // 50 voix + la voix du vice-président
  }
  const senat = voteSenat(e, calculerPositions(e, textes), saillance);
  const lib = libelleTrimestre(e.trimestre);
  pol.votes.push({ tour: e.tour, texte: 'Projet de loi (Sénat)', adopte: senat.pour >= seuil, pour: senat.pour, contre: senat.contre, abstention: 0, detail: [{ id: 'REP', vote: `${senat.pourR} pour`, sieges: pol.senat.REP }, { id: 'DEM', vote: `${senat.pourD} pour`, sieges: pol.senat.DEM }] });
  if (senat.pour < seuil) {
    const raison = seuil === 50
      ? `Le Sénat rejette la loi de réconciliation (${senat.pour} voix, il en faut 50 plus celle du vice-président).`
      : `Obstruction au Sénat : ${senat.pour} voix seulement, il en faut 60 pour clore les débats. Essayez la réconciliation (mesures budgétaires) ou un compromis avec les démocrates.`;
    return { acceptees: directes, rejet: { raison, vote }, senat };
  }
  if (procedure === 'reconciliation') {
    pol.reconciliations.push(exerciceBudgetaire(e));
    e.journal.push({ tour: e.tour, trimestre: lib, type: 'politique', texte: `Loi de réconciliation adoptée au Sénat (${senat.pour} voix) pour l'exercice ${exerciceBudgetaire(e)}.` });
  }
  return {
    acceptees: [...directes, ...textes],
    rejet: exclues.length ? { raison: `Règle Byrd : ${exclues.map((r) => trouverReforme(r.id)?.nom).join(', ')} ne peut pas figurer dans une loi de réconciliation.` } : null,
    vote, senat,
  };
}

/** Postes discrétionnaires du budget fédéral (votés chaque année ; le reste est « obligatoire »). */
const POSTES_DISCRETIONNAIRES = ['defense', 'education', 'recherche', 'affairesEtrangeres', 'interieurJustice', 'ecologieEnergie', 'transports', 'logement', 'culture', 'economieFinances', 'agriculture'];

/**
 * Vote des crédits annuels (appropriations) aux États-Unis : Chambre, puis
 * 60 voix au Sénat. Procédures :
 *  - 'complet'   : vos crédits, tels quels ;
 *  - 'cr'        : loi de financement provisoire (continuing resolution) qui
 *                  reconduit les crédits discrétionnaires de l'an passé ;
 *  - 'compromis' : concessions aux démocrates (santé, solidarités, éducation).
 * Sans accord : shutdown des administrations non essentielles.
 */
function voterBudgetEtatsUnis(e, procedure) {
  const pol = e.politique;
  const lib = libelleTrimestre(e.trimestre);
  const fy = exerciceBudgetaire(e) + (e.trimestre.t === 3 ? 1 : 0);
  let note = '';
  if (procedure === 'compromis') {
    for (const p of ['protectionSociale', 'education', 'sante']) e.budget[p].variationVolume = (e.budget[p].variationVolume ?? 0) + (p === 'sante' ? 1 : 2);
    pol.groupes.find((g) => g.id === 'DEM').concessions += 1.2;
    pol.groupes.find((g) => g.id === 'FREEDOM').concessions -= 0.6;
    note = 'Compromis avec les démocrates : +2 % pour les solidarités et l\'éducation, +1 % pour la santé.';
  }
  if (procedure === 'cr' || procedure === 'auto_cr') {
    for (const id of POSTES_DISCRETIONNAIRES) if (e.budget[id] && pol.variationsDebutAnnee[id] !== undefined) e.budget[id].variationVolume = pol.variationsDebutAnnee[id];
    note = 'Financement provisoire : les crédits discrétionnaires de l\'an passé sont reconduits.';
  }
  const { vote, senat, adopte } = scrutinBudgetEtatsUnis(e, procedure);
  pol.votes.push({ tour: e.tour, texte: `Crédits de l'exercice ${fy}`, ...resumeVote(vote) });
  const resultat = { vote, senat, procedure, adopte, censure: null, note };
  if (adopte) {
    pol.budgetsAdoptes.push(fy);
    pol.variationsDebutAnnee = Object.fromEntries(Object.entries(e.budget).map(([id, l]) => [id, l.variationVolume]));
    pol.tauxDebutAnnee = Object.fromEntries(Object.entries(e.impots).map(([id, c]) => [id, c.taux]));
    if (pol.shutdown) {
      pol.shutdowns.push({ ...pol.shutdown, fin: e.tour });
      note += ` Fin du shutdown après ${pol.shutdown.trimestres} trimestre(s).`;
      pol.shutdown = null;
    }
  } else {
    // Shutdown : les dépenses obligatoires (Social Security, Medicare) continuent, pas les administrations
    if (!pol.shutdown) pol.shutdown = { debut: e.tour, trimestres: 0, exercice: fy };
    pol.shutdown.trimestres += 1;
    appliquerChocsSociaux(e, { fonctionnaires: -6, salaries: -2, retraites: -1, jeunes: -2, entrepreneurs: -2, agriculteurs: -2 });
    pol.chocInstabilite = (pol.chocInstabilite ?? 0) + 0.08;
    note += ' SHUTDOWN : environ 750 000 agents fédéraux au chômage technique, parcs et services fermés, versements agricoles suspendus.';
  }
  e.journal.push({ tour: e.tour, trimestre: lib, type: 'politique', texte: `Crédits de l'exercice ${fy} : Chambre ${vote.pour} pour, ${vote.contre} contre ; Sénat ${senat.pour} voix (60 nécessaires). ${adopte ? 'Adoptés.' : 'Rejetés.'} ${note}`.trim() });
  return resultat;
}

/**
 * Scrutin sur les crédits (Chambre puis Sénat), sans effet de bord durable.
 * Une loi de financement provisoire « propre » est le véhicule habituel du
 * compromis : les démocrates la jugent bien moins sévèrement qu'un budget
 * complet, et d'autant moins que le shutdown dure (hypothèse de jeu).
 */
function scrutinBudgetEtatsUnis(e, procedure) {
  const pol = e.politique;
  calculerPositions(e);
  majSatisfactions(e);
  const saillance = { social: 1.5, fiscal: 1.5, rigueur: 1.5 };
  const bonusCR = (procedure === 'cr' || procedure === 'auto_cr') ? 1.3 + 0.4 * (pol.shutdown?.trimestres ?? 0) : 0;
  const sauvegarde = pol.groupes.map((g) => g.concessions);
  for (const g of pol.groupes) if (g.id === 'DEM') g.concessions += bonusCR;
  const vote = voter(e, pol.positions, saillance);
  const senat = voteSenat(e, pol.positions, saillance);
  pol.groupes.forEach((g, i) => { g.concessions = sauvegarde[i]; });
  return { vote, senat, adopte: vote.adopte && senat.pour >= pol.senat.obstruction };
}

/** Chocs de popularité par groupe (sans dépendance circulaire avec social.js). */
function appliquerChocsSociaux(e, chocs) {
  for (const [g, v] of Object.entries(chocs)) if (e.social.groupes[g]) e.social.groupes[g].chocs += v;
}

/**
 * Plafond légal de la dette. Quand la dette brute l'atteint, le Trésor recourt
 * à des « mesures exceptionnelles » pendant environ un trimestre (la « date X »),
 * puis ne peut plus payer toutes ses factures.
 * @param {string} choix 'negocier' | 'reconciliation' | 'bras_de_fer'
 * @returns {object|null} défaite éventuelle
 */
function gererPlafondDette(e, choix = 'negocier') {
  const f = e.finances;
  const pol = e.politique;
  const pl = pol.plafondDette;
  const lib = libelleTrimestre(e.trimestre);
  if (f.margePlafond === undefined || f.margePlafond > 0) { pl.trimestresMesuresExceptionnelles = 0; return null; }
  pl.trimestresMesuresExceptionnelles += 1;
  const releve = (montant, comment) => {
    e.statique.regles.nationale.plafond += montant;
    f.margePlafond += montant;
    pl.relevements.push({ tour: e.tour, montant, comment });
    pl.trimestresMesuresExceptionnelles = 0;
    e.journal.push({ tour: e.tour, trimestre: lib, type: 'politique', texte: `Plafond de la dette relevé de ${montant} Md$ (${comment}). Nouveau plafond : ${Math.round(e.statique.regles.nationale.plafond)} Md$.` });
  };
  if (choix === 'reconciliation') {
    const fy = exerciceBudgetaire(e);
    const senat = voteSenat(e, pol.positions, { rigueur: 2 });
    if (!pol.reconciliations.includes(fy) && senat.pourR >= 50 && voter(e, pol.positions, { rigueur: 2 }).adopte) {
      pol.reconciliations.push(fy);
      // Le Freedom Caucus exige des économies en échange de son vote
      pol.groupes.find((g) => g.id === 'FREEDOM').concessions -= 0.4;
      releve(5000, 'par une loi de réconciliation votée par les seuls républicains');
      return null;
    }
  } else if (choix === 'negocier') {
    const senat = voteSenat(e, pol.positions, { rigueur: 1 });
    const chambre = voter(e, pol.positions, { rigueur: 1 });
    // Personne ne veut porter la responsabilité d'un défaut : chaque trimestre de mesures exceptionnelles rapproche les camps
    const pression = 0.6 * pl.trimestresMesuresExceptionnelles;
    if ((chambre.adopte || pol.gouvernementDivise) && senat.pour + Math.round(pol.senat.DEM * borner(pression, 0, 1)) >= 60) {
      pol.groupes.find((g) => g.id === 'DEM').concessions += 0.3;
      releve(2500, 'après un accord bipartisan qui plafonne les dépenses discrétionnaires');
      for (const id of POSTES_DISCRETIONNAIRES) if (e.budget[id]) e.budget[id].variationVolume = (e.budget[id].variationVolume ?? 0) - 1;
      return null;
    }
  }
  // Bras de fer ou échec : les marchés s'inquiètent, la note souveraine est menacée
  f.chocTaux = (f.chocTaux ?? 0) + 0.25;
  f.credibilite = borner(f.credibilite - 0.15, -1, 1);
  appliquerChocsSociaux(e, { retraites: -3, salaries: -2, entrepreneurs: -3 });
  e.journal.push({ tour: e.tour, trimestre: lib, type: 'alerte', texte: `Plafond de la dette atteint : le Trésor recourt aux mesures exceptionnelles (${pl.trimestresMesuresExceptionnelles}e trimestre). Les taux montent, les agences de notation menacent.` });
  if (pl.trimestresMesuresExceptionnelles >= 3) {
    return { cause: 'defaut', texte: 'Le plafond de la dette n\'a pas été relevé à temps : les États-Unis ont fait défaut sur une partie de leurs paiements, une première historique.' };
  }
  return null;
}

function resumeVote(v) {
  return { adopte: v.adopte, pour: v.pour, contre: v.contre, abstention: v.abstention, detail: v.detail.map((d) => ({ id: d.id, vote: d.vote, sieges: d.sieges })) };
}

/**
 * Concessions accordées pour faire voter le budget (France : aux socialistes ;
 * Allemagne : au SPD). Elles modifient le budget et la satisfaction.
 */
function compromisBudgetaire(e) {
  const pol = e.politique;
  for (const p of ['protectionSociale', 'education', 'sante']) e.budget[p].variationVolume = (e.budget[p].variationVolume ?? 0) + (p === 'protectionSociale' ? 2 : 1);
  if (e.impots.droitsSuccession) e.impots.droitsSuccession.taux = Math.min(e.impots.droitsSuccession.bornes[1], e.impots.droitsSuccession.taux + 10);
  const cible = pol.groupes.find((g) => (e.pays === 'france' ? g.id === 'SOC' : g.partenaire));
  if (cible) cible.concessions += 1.2;
  for (const g of pol.groupes) if (g.axes.rigueur > 0.6 && g.posture !== 'gouvernement') g.concessions -= 0.3;
  if (pol.coalition) pol.coalition.satisfaction = Math.min(100, pol.coalition.satisfaction + 10);
  return 'Compromis : +2 % pour les solidarités, +1 % pour l\'éducation et la santé, droits de succession relevés.';
}

/**
 * Vote annuel du budget (au T4).
 * @param {string} procedure 'vote' | '49.3' | 'ordonnances' | 'compromis' | 'auto'
 * @returns {object} résultat
 */
export function voterBudget(e, procedure = 'auto') {
  if (e.pays === 'etatsUnis') {
    // Par défaut : le budget complet s'il passe, sinon une loi de financement provisoire
    if (procedure === 'auto' || procedure === 'vote') procedure = scrutinBudgetEtatsUnis(e, 'complet').adopte ? 'complet' : 'cr';
    return voterBudgetEtatsUnis(e, procedure);
  }
  const pol = e.politique;
  const lib = libelleTrimestre(e.trimestre);
  let note = '';
  if (procedure === 'compromis') note = compromisBudgetaire(e);
  calculerPositions(e);
  majSatisfactions(e);
  const saillance = { social: 1.5, fiscal: 1.5, rigueur: 1.5 };
  const vote = voter(e, pol.positions, saillance);
  pol.votes.push({ tour: e.tour, texte: `Budget ${e.trimestre.annee + 1}`, ...resumeVote(vote) });
  const resultat = { vote, procedure, adopte: vote.adopte, censure: null, note };

  if (!vote.adopte && e.pays === 'france') {
    // Le compromis vise l'abstention des socialistes ; s'il ne suffit pas pour une majorité, on engage le 49.3
    if (procedure === '49.3' || procedure === 'auto' || procedure === 'compromis') {
      pol.chocInstabilite = (pol.chocInstabilite ?? 0) + 0.05;
      const censure = motionCensure(e);
      resultat.censure = censure;
      resultat.adopte = !censure.adoptee;
      resultat.procedure = '49.3';
    } else if (procedure === 'ordonnances') {
      resultat.adopte = true;
      pol.chocInstabilite = (pol.chocInstabilite ?? 0) + 0.2;
      for (const g of Object.values(e.social.groupes)) g.chocs -= 3;
      resultat.note = 'Budget mis en œuvre par ordonnances (article 47) : une première sous la Ve République, très contestée.';
    }
  }
  if (!resultat.adopte && !(resultat.censure?.adoptee)) {
    // Loi spéciale / gestion budgétaire provisoire : on revient au budget de l'année précédente
    for (const [id, v] of Object.entries(pol.variationsDebutAnnee)) e.budget[id].variationVolume = v;
    for (const [id, t] of Object.entries(pol.tauxDebutAnnee)) if (e.impots[id] && t !== null && t !== undefined) e.impots[id].taux = t;
    pol.chocInstabilite = (pol.chocInstabilite ?? 0) + 0.15;
    resultat.note = e.pays === 'france'
      ? 'Budget rejeté : une loi spéciale reconduit les crédits et les impôts de l\'année précédente.'
      : 'Budget rejeté : gestion budgétaire provisoire, sur la base de l\'année précédente.';
  }
  if (resultat.adopte) {
    pol.budgetsAdoptes.push(e.trimestre.annee + 1);
    pol.tauxDebutAnnee = Object.fromEntries(Object.entries(e.impots).map(([id, c]) => [id, c.taux]));
    pol.variationsDebutAnnee = Object.fromEntries(Object.entries(e.budget).map(([id, l]) => [id, l.variationVolume]));
  }
  const texteVote = `${vote.pour} pour, ${vote.contre} contre, ${vote.abstention} abstentions`;
  let texte = `Budget ${e.trimestre.annee + 1} : ${texteVote}. `;
  if (resultat.censure) texte += `Adoption par le 49.3. Motion de censure : ${resultat.censure.voix} voix sur ${resultat.censure.majorite} nécessaires — ${resultat.censure.adoptee ? 'ADOPTÉE, le gouvernement est renversé.' : 'rejetée, le budget est adopté.'}`;
  else texte += resultat.adopte ? 'Budget adopté.' : '';
  if (resultat.note) texte += ` ${resultat.note}`;
  e.journal.push({ tour: e.tour, trimestre: lib, type: 'politique', texte });
  return resultat;
}

/** Satisfaction du partenaire de coalition (Allemagne) et respect de l'accord. */
function majCoalition(e) {
  const pol = e.politique;
  const c = pol.coalition;
  if (!c || c.rompue) return null;
  let violationsSPD = 0, violationsCDU = 0;
  for (const eng of c.engagements) {
    const def = ACCORD_COALITION.find((x) => x.id === eng.id);
    eng.respecte = def.test(e);
    if (!eng.respecte) { if (eng.porteur === 'SPD') violationsSPD++; else violationsCDU++; }
  }
  const spd = pol.groupes.find((g) => g.partenaire);
  const alignement = satisfaction(e, { ...spd, posture: 'pivot', concessions: 0 }, pol.positions);
  const popSPD = pol.intentions.SPD;
  const cible = 50 + 18 * alignement - 8 * violationsSPD - 2 * violationsCDU - 0.8 * Math.max(0, 14 - popSPD) - (e.social.mobilisation ? 5 : 0);
  c.satisfaction = borner(c.satisfaction + 0.2 * (cible - c.satisfaction) + (c.choc ?? 0), 0, 100);
  c.choc = 0;
  c.violations = { SPD: violationsSPD, CDUCSU: violationsCDU };
  // Revendications internes de la CDU/CSU : leur non-respect pèse sur la popularité chez les entrepreneurs
  if (violationsCDU) e.social.groupes.entrepreneurs.chocs -= 0.5 * violationsCDU;
  if (c.satisfaction < 20) c.trimestresCrise += 1; else c.trimestresCrise = 0;
  if (c.trimestresCrise >= 2) {
    c.rompue = true;
    return { rupture: true };
  }
  return null;
}

/** Intentions de vote allemandes, mises à jour selon la situation. */
function majIntentions(e) {
  const i = e.politique.intentions;
  const m = e.macro;
  const pop = e.social.popularite;
  const cibleUnion = 19 + 0.35 * (pop - 20) + 0.8 * (m.croissanceAnnuelle - 1) - 0.6 * (m.chomage - 6.4);
  const cibleAfD = 28 - 0.25 * (pop - 20) + 0.6 * (m.chomage - 6.4) + 1.5 * Math.max(0, m.inflation - 2.5) + (e.politique.chocAfD ?? 0);
  const cibleSPD = 14 + 0.1 * ((e.politique.coalition?.satisfaction ?? 45) - 45) + 0.1 * (pop - 20);
  i.CDUCSU = borner(i.CDUCSU + 0.25 * (cibleUnion - i.CDUCSU), 8, 45);
  i.AFD = borner(i.AFD + 0.25 * (cibleAfD - i.AFD), 8, 45);
  i.SPD = borner(i.SPD + 0.25 * (cibleSPD - i.SPD), 5, 30);
  e.politique.chocAfD = (e.politique.chocAfD ?? 0) * 0.8;
}

/** Élection présidentielle française (au T2 2027). */
function presidentielle(e, alea) {
  const pol = e.politique;
  const m = e.macro;
  const part = pol.presidentielle.partCamp
    + 0.6 * (e.social.popularite - 26)
    + 1.5 * (m.croissanceAnnuelle - 0.5)
    - 1.5 * (m.chomage - 8.3)
    - 1.0 * Math.max(0, m.inflation - 2)
    + 0.2 * (e.social.cohesion - 70)
    + alea.normale(0, 2);
  pol.presidentielle = { ...pol.presidentielle, tenue: true, resultat: part };
  const victoire = part >= 50;
  const lib = libelleTrimestre(e.trimestre);
  if (victoire) {
    e.journal.push({ tour: e.tour, trimestre: lib, type: 'election', texte: `Présidentielle : la candidate ou le candidat de votre camp l'emporte avec ${part.toFixed(1)} % au second tour.` });
    // Législatives qui suivent : le « fait majoritaire » donne un élan au camp présidentiel (hypothèse : 8 points + l'avance du second tour)
    legislativesFrance(e, alea, 8 + 0.8 * (part - 50));
    if (e.opinion) e.opinion.intentions.centre += 3; // état de grâce
  } else {
    pol.cohabitation = true;
    e.journal.push({ tour: e.tour, trimestre: lib, type: 'election', texte: `Présidentielle : le Rassemblement national l'emporte (${(100 - part).toFixed(1)} % au second tour). Votre camp perd l'Élysée.` });
  }
  return { victoire, part };
}

/** Élection fédérale allemande. */
function electionFederale(e, alea) {
  const pol = e.politique;
  majIntentions(e);
  const i = { ...pol.intentions };
  for (const k of Object.keys(i)) i[k] = Math.max(0, i[k] + alea.normale(0, 1));
  const representes = ['CDUCSU', 'AFD', 'SPD', 'GRUENE', 'LINKE'].filter((k) => (i[k] ?? 0) >= 5);
  const total = representes.reduce((s, k) => s + i[k], 0);
  const sieges = Object.fromEntries(representes.map((k) => [k, Math.round(630 * i[k] / total)]));
  for (const g of pol.groupes) g.sieges = sieges[g.id] ?? 0;
  const majorite = 316;
  const coalitionsPossibles = [['CDUCSU', 'SPD'], ['CDUCSU', 'GRUENE'], ['CDUCSU', 'SPD', 'GRUENE']];
  const possible = coalitionsPossibles.find((c) => c.reduce((s, k) => s + (sieges[k] ?? 0), 0) >= majorite);
  const premierHorsAfD = (sieges.CDUCSU ?? 0) >= Math.max(sieges.SPD ?? 0, sieges.GRUENE ?? 0);
  const victoire = !!possible && premierHorsAfD;
  const lib = libelleTrimestre(e.trimestre);
  e.journal.push({ tour: e.tour, trimestre: lib, type: 'election', texte: `Élections fédérales : CDU/CSU ${i.CDUCSU.toFixed(1)} %, AfD ${i.AFD.toFixed(1)} %, SPD ${i.SPD.toFixed(1)} %. ${victoire ? `Une coalition ${possible.join('-')} dispose de la majorité : vous restez chancelier.` : 'Aucune majorité sans l\'AfD ne se dessine autour de la CDU/CSU : vous perdez la chancellerie.'}` });
  if (victoire && pol.coalition) { pol.coalition.rompue = false; pol.coalition.satisfaction = 55; pol.coalition.trimestresCrise = 0; }
  pol.dernierScrutin = { victoire, tour: e.tour, intentions: i, coalition: possible ?? null };
  return { victoire, intentions: i, sieges };
}

/**
 * Mise à jour politique de fin de trimestre : satisfactions, coalition,
 * censure spontanée, élections prévues au calendrier.
 * @returns {object} { defaite: { cause, texte } | null }
 */
export function majPolitique(e, alea, decisions = {}) {
  const pol = e.politique;
  const lib = libelleTrimestre(e.trimestre);
  calculerPositions(e);
  majSatisfactions(e);
  let defaite = null;

  if (e.pays === 'etatsUnis') {
    // Shutdown en cours : nouvelle tentative de financement provisoire à chaque trimestre
    if (pol.shutdown && pol.shutdown.debut !== e.tour) voterBudgetEtatsUnis(e, 'auto_cr');
    const d = gererPlafondDette(e, decisions.plafondDette);
    if (d) defaite = d;
  } else if (e.pays === 'allemagne') {
    majIntentions(e);
    const r = majCoalition(e);
    if (r?.rupture) {
      e.journal.push({ tour: e.tour, trimestre: lib, type: 'politique', texte: 'Rupture de la coalition : le SPD quitte le gouvernement. Vous posez la question de confiance, qui ouvre la voie à des élections anticipées.' });
      const el = electionFederale(e, alea);
      if (!el.victoire) defaite = { cause: 'coalition', texte: 'La coalition s\'est rompue et les élections anticipées vous ont fait perdre la chancellerie.' };
    }
  } else {
    // Motion de censure spontanée (article 49.2) : il faut une hostilité nettement plus forte
    // qu'en réponse à un 49.3, car l'opposition doit en prendre l'initiative et s'unir.
    const censure = motionCensure(e, 0.4);
    if (censure.adoptee && alea.tirage(0.5)) {
      e.journal.push({ tour: e.tour, trimestre: lib, type: 'politique', texte: `Motion de censure spontanée adoptée (${censure.voix} voix) : le gouvernement est renversé.` });
      defaite = { cause: 'censure', texte: 'Une motion de censure a renversé votre gouvernement.' };
    }
    // Dissolution demandée par le joueur (article 12 : pas de nouvelle dissolution dans l'année qui suit)
    if (decisions.dissolution && !defaite) {
      const d = pol.derniereDissolution;
      const ecart = (e.trimestre.annee - d.annee) * 4 + (e.trimestre.t - d.t);
      if (ecart >= 4 && !pol.cohabitation) {
        // Le résultat découle des intentions de vote du baromètre, donc de votre bilan
        legislativesFrance(e, alea, 0);
        pol.derniereDissolution = { ...e.trimestre };
        majSatisfactions(e);
      }
    }
  }

  // Allemagne : question de confiance (article 68 de la Loi fondamentale)
  if (e.pays === 'allemagne' && decisions.questionConfiance && !defaite) {
    const c = pol.coalition;
    if (!c.rompue && c.satisfaction >= 30) {
      c.satisfaction = Math.min(100, c.satisfaction + 10);
      pol.chocInstabilite = (pol.chocInstabilite ?? 0) - 0.05;
      e.journal.push({ tour: e.tour, trimestre: lib, type: 'politique', texte: 'Question de confiance : le Bundestag vous renouvelle sa confiance. La coalition se ressoude, pour un temps.' });
    } else {
      e.journal.push({ tour: e.tour, trimestre: lib, type: 'politique', texte: 'Question de confiance perdue : le président fédéral dissout le Bundestag (comme en décembre 2024). Élections anticipées.' });
      const el = electionFederale(e, alea);
      if (!el.victoire) defaite = { cause: 'election', texte: 'Les élections anticipées après la question de confiance vous ont fait perdre la chancellerie.' };
    }
  }

  // Élections intermédiaires et nationales du calendrier (régionales, Länder, européennes, mi-mandat, présidentielle américaine)
  const dEl = electionsDuTrimestre(e, alea);
  if (dEl) defaite = defaite ?? dEl;
  majSatisfactions(e);

  // Élections prévues au calendrier
  for (const ech of (e.statique.calendrier.echeances || [])) {
    if (ech.annee !== e.trimestre.annee || ech.t !== e.trimestre.t) continue;
    if (ech.type === 'presidentielle' && e.pays === 'france') {
      const r = presidentielle(e, alea);
      if (!r.victoire) defaite = { cause: 'presidentielle', texte: 'Votre camp a perdu l\'élection présidentielle : un nouveau Premier ministre est nommé.' };
    }
    if (ech.type === 'legislatives' && e.pays === 'allemagne') {
      const r = electionFederale(e, alea);
      if (!r.victoire) defaite = { cause: 'election', texte: 'Vous avez perdu les élections fédérales.' };
    }
  }
  return { defaite };
}

/**
 * Prévision des votes pour l'interface, sans modifier l'état : vote du budget
 * avec les décisions en cours, vote des réformes proposées, menace de censure.
 * @param {object} e état déjà modifié par les décisions envisagées (copie)
 * @param {Array} reformes réformes proposées ce trimestre
 */
export function prevoirVotes(e, reformes = []) {
  calculerPositions(e);
  majSatisfactions(e);
  const budget = voter(e, e.politique.positions, { social: 1.5, fiscal: 1.5, rigueur: 1.5 });
  const censure = e.pays === 'france' ? motionCensure(e) : null;
  const senatBudget = e.pays === 'etatsUnis' ? voteSenat(e, e.politique.positions, { social: 1.5, fiscal: 1.5, rigueur: 1.5 }).pour : null;
  let texte = null;
  const legislatives = reformes.filter((r) => trouverReforme(r.id)?.vote !== false);
  if (legislatives.length) {
    const positions = calculerPositions(e, legislatives);
    const saillance = saillanceReformes(legislatives);
    texte = voter(e, positions, saillance);
    if (e.pays === 'france') {
      const sauvegarde = e.politique.groupes.map((g) => g.satisfaction);
      for (const g of e.politique.groupes) g.satisfaction = satisfaction(e, g, positions, saillance);
      texte.censureApres493 = motionCensure(e, -0.2);
      e.politique.groupes.forEach((g, i) => { g.satisfaction = sauvegarde[i]; });
    } else if (e.pays === 'etatsUnis') {
      const senat = voteSenat(e, positions, saillance);
      texte.senat = { pour: senat.pour, obstruction: e.politique.senat.obstruction };
      const recon = legislatives.filter((r) => reconciliable(r.id));
      texte.senatReconciliation = recon.length ? voteSenat(e, calculerPositions(e, recon), saillance).pour : null;
      texte.reconciliationDisponible = !e.politique.reconciliations.includes(exerciceBudgetaire(e));
    } else {
      const spd = e.politique.groupes.find((g) => g.partenaire);
      texte.accordPartenaire = e.politique.coalition.rompue || satisfaction(e, { ...spd, posture: 'pivot', concessions: 0 }, positions, saillance) > -0.4 || e.politique.coalition.satisfaction > 70;
      texte.deuxTiers = Math.ceil(e.politique.sieges * 2 / 3);
    }
  }
  return {
    budget: { ...resumeVote(budget), senat: senatBudget },
    censure: censure ? { voix: censure.voix, majorite: censure.majorite, adoptee: censure.adoptee } : null,
    texte: texte ? { ...resumeVote(texte), censureApres493: texte.censureApres493 ? { voix: texte.censureApres493.voix, majorite: texte.censureApres493.majorite, adoptee: texte.censureApres493.adoptee } : null, accordPartenaire: texte.accordPartenaire, deuxTiers: texte.deuxTiers, senat: texte.senat, senatReconciliation: texte.senatReconciliation, reconciliationDisponible: texte.reconciliationDisponible } : null,
    satisfactions: e.politique.groupes.map((g) => ({ id: g.id, nom: g.nom, sieges: g.sieges, satisfaction: g.satisfaction, posture: g.posture, couleur: g.couleur })),
  };
}
