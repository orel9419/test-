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
      active: active ? active.option : null, disponible: !dejaUnique,
    };
  });
}

/**
 * Adopte une réforme (après validation politique, gérée par le module politique).
 * Si la même réforme est déjà active avec une autre option, elle est remplacée.
 * @returns {object} entrée de la réforme active, ou { erreur }
 */
export function adopterReforme(e, id, option, alea) {
  const def = trouverReforme(id);
  if (!def) return { erreur: `Réforme inconnue : ${id}` };
  if (!(def.pays === 'tous' || def.pays.includes(e.pays))) return { erreur: 'Réforme non disponible dans ce pays.' };
  if (!def.options.some((o) => o.id === option)) option = def.options[0].id;
  if (def.unique && e.reformes.historique.some((h) => h.id === id)) return { erreur: 'Mesure déjà réalisée.' };

  const existante = e.reformes.actives.findIndex((a) => a.id === id);
  if (existante >= 0) {
    const ancienne = e.reformes.actives[existante];
    if (ancienne.option === option) return { erreur: 'Cette réforme est déjà en vigueur.' };
    if (ancienne.appliquee && def.annuler) def.annuler(e, ancienne.option);
    e.reformes.actives.splice(existante, 1);
  }

  const reaction = def.reaction?.(e, option) ?? {};
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
  const effets = { depenses: {}, recettes: {}, offreTravail: 0, chomageStructurel: 0, potentielBonus: 0, chocPrix: 0, plafonnementEnergie: 0, menages: {}, cessions: 0, fondsSS: 0, chocDemande: 0 };
  for (const entree of e.reformes.actives) {
    if (entree.diplomatique) continue;
    appliquerSiEcheance(e, entree, alea);
    if (!entree.appliquee) continue;
    const def = trouverReforme(entree.id);
    const age = e.tour - entree.tourEffet;
    const r = def.effets?.(e, entree.option, age) ?? {};
    for (const [poste, v] of Object.entries(r.depenses ?? {})) effets.depenses[poste] = (effets.depenses[poste] ?? 0) + v;
    for (const [cle, v] of Object.entries(r.recettes ?? {})) effets.recettes[cle] = (effets.recettes[cle] ?? 0) + v;
    for (const cle of ['offreTravail', 'chomageStructurel', 'potentielBonus', 'chocPrix', 'cessions', 'fondsSS', 'chocDemande']) effets[cle] += r[cle] ?? 0;
    effets.plafonnementEnergie = Math.max(effets.plafonnementEnergie, r.plafonnementEnergie ?? 0);
    for (const [id, liste] of Object.entries(r.menages ?? {})) effets.menages[id] = [...(effets.menages[id] ?? []), ...liste];
  }
  return effets;
}
