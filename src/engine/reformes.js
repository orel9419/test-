/**
 * Moteur des réformes : adoption, application après délai, effets continus,
 * réactions de l'opinion.
 */
import { REFORMES } from '../data/reformes.js';
import { appliquerChocs } from './social.js';
import { libelleTrimestre } from './calendrier.js';
import { borner } from '../model/outils.js';

export function trouverReforme(id) {
  return REFORMES.find((r) => r.id === id);
}

/** Réformes proposables par le joueur dans ce pays. */
export function reformesDisponibles(e) {
  return REFORMES.filter((r) => r.pays === 'tous' || r.pays.includes(e.pays)).map((r) => {
    const active = e.reformes.actives.find((a) => a.id === r.id);
    const dejaUnique = r.unique && e.reformes.historique.some((h) => h.id === r.id);
    return {
      id: r.id, nom: r.nom, categorie: r.categorie, resume: r.resume, pedagogie: r.pedagogie, sources: r.sources ?? [],
      options: r.options, chiffrage: r.chiffrage, compensation: !!r.compensation, majoriteRenforcee: !!r.majoriteRenforcee,
      vehicule: r.vote === false ? (r.vehicule ?? 'décret') : (r.vehicule ?? 'loi'), vote: r.vote !== false,
      pour: r.pour ?? [], contre: r.contre ?? [], exemples: r.exemples ?? [], orientation: r.orientation ?? null,
      remplace: r.remplace ?? [],
      active: active ? active.option : null, disponible: !dejaUnique,
    };
  });
}

/** Effets réduits d'un facteur (censure partielle) : montants, effets structurels et ménages. */
function reduire(r, facteur) {
  if (facteur === undefined || facteur === 1) return r;
  const fois = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v * facteur]));
  const res = { ...r };
  if (r.depenses) res.depenses = fois(r.depenses);
  if (r.recettes) res.recettes = fois(r.recettes);
  for (const cle of ['offreTravail', 'chomageStructurel', 'potentielBonus', 'chocPrix', 'cessions', 'fondsSS', 'chocDemande', 'influence', 'souverainete', 'emissionsEvitees']) {
    if (typeof r[cle] === 'number') res[cle] = r[cle] * facteur;
  }
  return res;
}

/** Clés d'effets « structurels » amplifiées en mode « effets accentués » (pas les montants budgétaires). */
const CLES_STRUCTURELLES = ['offreTravail', 'chomageStructurel', 'potentielBonus', 'chocDemande', 'emissionsEvitees', 'influence', 'souverainete'];

/** Réaction amplifiée : chocs d'opinion, griefs, compensations, crédibilité et instabilité. */
function accentuer(reaction, k) {
  if (k === 1) return reaction;
  const fois = (o) => (o ? Object.fromEntries(Object.entries(o).map(([g, v]) => [g, v * k])) : o);
  return { ...reaction, chocs: fois(reaction.chocs), opinion: fois(reaction.opinion), grief: fois(reaction.grief), compensation: fois(reaction.compensation), credibilite: reaction.credibilite !== undefined ? reaction.credibilite * k : undefined, instabilite: reaction.instabilite !== undefined ? reaction.instabilite * k : undefined };
}

/**
 * Effet estimé d'une réforme sur la popularité de l'exécutif (points), au
 * moment de son adoption : chocs et opinion durable, moins une partie des
 * griefs, plus les compensations, pondérés par le poids électoral des groupes.
 */
export function effetOpinionReforme(e, id, option) {
  const def = trouverReforme(id);
  if (!def?.reaction) return 0;
  let r;
  try { r = accentuer(def.reaction(e, option) ?? {}, Math.sqrt(e.intensiteReformes ?? 1)); } catch { return 0; }
  let total = 0;
  for (const [g, def2] of Object.entries(e.statique.groupes)) {
    total += def2.poids * ((r.chocs?.[g] ?? 0) + (r.opinion?.[g] ?? 0) - 0.5 * (r.grief?.[g] ?? 0) + 0.5 * (r.compensation?.[g] ?? 0));
  }
  return total;
}

/**
 * Bilan, au trimestre courant, de l'effet de chaque réforme en vigueur :
 * budget (Md€ par an), emploi, croissance potentielle, émissions, influence.
 * Sert au tableau de bord (« Impact de vos réformes »).
 */
export function bilanReformes(e) {
  const k = e.intensiteReformes ?? 1;
  const somme = (o) => Object.values(o ?? {}).reduce((s, x) => s + x, 0);
  return e.reformes.actives.filter((a) => !a.diplomatique).map((a) => {
    const def = trouverReforme(a.id);
    let r = {};
    if (a.appliquee) {
      try { r = reduire(def?.effets?.(e, a.option, e.tour - a.tourEffet, a) ?? {}, a.facteur); } catch { r = {}; }
    }
    const ligne = {
      id: a.id, nom: def?.nom ?? a.nom, option: a.libelleOption, appliquee: a.appliquee, tourApplication: a.tourApplication,
      depenses: somme(r.depenses), recettes: somme(r.recettes), pret: -(r.cessions ?? 0) * 4,
      emploi: (r.offreTravail ?? 0) * k, chomage: (r.chomageStructurel ?? 0) * k, croissance: (r.potentielBonus ?? 0) * k,
      emissions: (r.emissionsEvitees ?? 0) * k, influence: (r.influence ?? 0) * k, souverainete: (r.souverainete ?? 0) * k,
    };
    // Réformes pilotées par un sous-modèle : temps de travail et âge de départ
    if (a.id === 'temps_travail' && a.appliquee) { ligne.emploi = e.travail.offreTravail * k; ligne.chomage = e.travail.chomageStructurel * k; ligne.recettes = -e.travail.coutBudgetaire; }
    if (a.id === 'retraites_age') ligne.note = `âge légal ${e.retraites.ageLegal.toFixed(2).replace('.', ',')} ans, cible ${String(e.retraites.ageCible).replace('.', ',')}`;
    if (a.pilotage?.cible !== undefined) ligne.note = `dépense publique ${a.pilotage.ratio.toFixed(1).replace('.', ',')} % du PIB, trajectoire ${a.pilotage.cible.toFixed(1).replace('.', ',')} %`;
    if (a.pilotage?.capital !== undefined) ligne.note = `fonds souverain : ${Math.round(a.pilotage.capital)} Md€ investis (${Math.round(a.pilotage.flux)} Md€ par an)`;
    ligne.solde = ligne.recettes - ligne.depenses;
    return ligne;
  });
}

/**
 * Adopte une réforme (après validation politique, gérée par le module politique).
 * Si la même réforme est déjà active avec une autre option, elle est remplacée.
 * @returns {object} entrée de la réforme active, ou { erreur }
 */
export function adopterReforme(e, id, option, alea, facteur = 1) {
  const def = trouverReforme(id);
  if (!def) return { erreur: `Réforme inconnue : ${id}` };
  if (!(def.pays === 'tous' || def.pays.includes(e.pays))) return { erreur: 'Réforme non disponible dans ce pays.' };
  if (!def.options.some((o) => o.id === option)) option = def.options[0].id;
  if (def.unique && e.reformes.historique.some((h) => h.id === id)) return { erreur: 'Mesure déjà réalisée.' };

  // Réformes incompatibles (ex. deux scénarios de transition vers la capitalisation) : la nouvelle remplace l'ancienne
  for (const autre of def.remplace ?? []) {
    const i = e.reformes.actives.findIndex((a) => a.id === autre);
    if (i < 0) continue;
    const ancienne = e.reformes.actives[i];
    if (ancienne.appliquee) trouverReforme(autre)?.annuler?.(e, ancienne.option);
    e.reformes.actives.splice(i, 1);
    e.journal.push({ tour: e.tour, trimestre: libelleTrimestre(e.trimestre), type: 'reforme', texte: `${ancienne.nom} est remplacée par : ${def.nom}.` });
  }

  const existante = e.reformes.actives.findIndex((a) => a.id === id);
  if (existante >= 0) {
    const ancienne = e.reformes.actives[existante];
    if (ancienne.option === option) return { erreur: 'Cette réforme est déjà en vigueur.' };
    if (ancienne.appliquee && def.annuler) def.annuler(e, ancienne.option);
    e.reformes.actives.splice(existante, 1);
  }

  // Effets accentués : les réactions de l'opinion sont amplifiées moins fortement que l'économie (racine du facteur)
  const reaction = accentuer(def.reaction?.(e, option) ?? {}, Math.sqrt(e.intensiteReformes ?? 1));
  appliquerChocs(e, reaction.chocs);
  if (reaction.credibilite) e.finances.credibilite = borner(e.finances.credibilite + reaction.credibilite, -1, 1);
  if (reaction.instabilite) e.macro.instabilitePolitique = borner(e.macro.instabilitePolitique + reaction.instabilite, 0, 1);

  const entree = {
    id, option, nom: def.nom,
    libelleOption: def.options.find((o) => o.id === option)?.nom,
    tourAdoption: e.tour,
    tourApplication: e.tour + (def.delai ?? 0),
    appliquee: false,
    opinion: { ...(reaction.opinion ?? {}) },
    grief: { ...(reaction.grief ?? {}) },
    compensation: { ...(reaction.compensation ?? {}) },
  };
  // Censure partielle du juge constitutionnel : une partie des dispositions tombe
  if (facteur !== 1) { entree.facteur = facteur; entree.censurePartielle = true; }
  e.reformes.actives.push(entree);
  e.reformes.historique.push({ id, option, tour: e.tour });
  e.journal.push({ tour: e.tour, trimestre: libelleTrimestre(e.trimestre), type: 'reforme', texte: `Réforme adoptée : ${def.nom} — ${entree.libelleOption}. Entrée en vigueur : ${def.delai ? `dans ${def.delai} trimestre(s)` : 'immédiate'}.` });
  if (!def.delai) appliquerSiEcheance(e, entree, alea);
  return entree;
}

function appliquerSiEcheance(e, entree, alea) {
  if (entree.appliquee || e.tour < entree.tourApplication || entree.diplomatique) return;
  const def = trouverReforme(entree.id);
  def?.appliquer?.(e, entree.option, alea);
  entree.appliquee = true;
  entree.tourEffet = e.tour;
}

/**
 * Applique les réformes arrivées à échéance et agrège les effets continus.
 * @returns {object} effets agrégés
 */
export function majReformes(e, alea) {
  const effets = { depenses: {}, recettes: {}, offreTravail: 0, chomageStructurel: 0, potentielBonus: 0, chocPrix: 0, plafonnementEnergie: 0, menages: {}, cessions: 0, fondsSS: 0, chocDemande: 0, influence: 0, souverainete: 0, emissionsEvitees: 0 };
  for (const entree of e.reformes.actives) {
    if (entree.diplomatique) continue;
    appliquerSiEcheance(e, entree, alea);
    if (!entree.appliquee) continue;
    const def = trouverReforme(entree.id);
    const age = e.tour - entree.tourEffet;
    // Réformes pilotées (trajectoire de dépense...) : mise à jour de leur état, une fois par trimestre
    def.piloter?.(e, entree, age);
    const r = reduire(def.effets?.(e, entree.option, age, entree) ?? {}, entree.facteur);
    for (const [poste, v] of Object.entries(r.depenses ?? {})) effets.depenses[poste] = (effets.depenses[poste] ?? 0) + v;
    for (const [cle, v] of Object.entries(r.recettes ?? {})) effets.recettes[cle] = (effets.recettes[cle] ?? 0) + v;
    for (const cle of ['offreTravail', 'chomageStructurel', 'potentielBonus', 'chocPrix', 'cessions', 'fondsSS', 'chocDemande', 'influence', 'souverainete', 'emissionsEvitees']) effets[cle] += (r[cle] ?? 0) * (CLES_STRUCTURELLES.includes(cle) ? (e.intensiteReformes ?? 1) : 1);
    effets.plafonnementEnergie = Math.max(effets.plafonnementEnergie, r.plafonnementEnergie ?? 0);
    for (const [id, liste] of Object.entries(r.menages ?? {})) effets.menages[id] = [...(effets.menages[id] ?? []), ...liste];
  }
  return effets;
}
