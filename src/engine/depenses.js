/**
 * Dépenses publiques par poste (« ministères »).
 *
 * Le joueur fixe, pour chaque poste piloté par curseur, une variation EN
 * VOLUME par rapport au niveau de départ (−20 % à +30 %). La cible nominale
 * suit donc l'inflation : 0 % = maintenir le pouvoir d'achat du poste.
 * Le montant effectif rejoint la cible avec une inertie qui dépend de la
 * nature de la dépense (on ne licencie pas des enseignants en un trimestre,
 * on peut en revanche différer un investissement).
 */
import { MINISTERES } from '../model/ministeres.js';
import { PARAMETRES } from '../model/parametres.js';

/** Inertie trimestrielle maximale (part du montant) d'un poste. */
export function inertiePoste(id, mode) {
  const comp = MINISTERES[id].composition;
  let inertie = 0;
  for (const [nature, part] of Object.entries(comp)) inertie += part * PARAMETRES.inertie[nature];
  return inertie * (PARAMETRES.inertieParMode[mode] ?? 1);
}

/**
 * Somme des dépenses pondérées par leur multiplicateur, en Md€/an : sert à
 * mesurer l'impulsion budgétaire d'un trimestre sur l'autre.
 */
export function depensesPondereesMultiplicateur(budget) {
  let total = 0;
  for (const [id, ligne] of Object.entries(budget)) {
    const def = MINISTERES[id];
    const facteur = def.facteurMultiplicateur ?? 1;
    for (const [nature, part] of Object.entries(def.composition)) {
      total += ligne.montant * part * PARAMETRES.multiplicateursDepense[nature] * facteur;
    }
  }
  return total;
}

/**
 * Met à jour les postes de dépense pour le trimestre.
 * @param {object} e état
 * @param {object} effets effets agrégés des réformes ({ depenses: { poste: Md€ } })
 */
export function majDepenses(e, effets) {
  const indicePrix = e.macro.niveauPrix / e.reference.niveauPrix;
  const chomageRelatif = e.macro.chomage / e.reference.chomage;
  // Santé : à politique inchangée, la dépense suit les besoins liés au vieillissement
  const besoins = e.statique.vieillissement?.besoinsSanteParAn ?? 0;
  if (e.budget.sante) e.budget.sante.facteurBesoins = Math.pow(1 + besoins / 100, Math.max(0, e.tour - 1) / 4);
  for (const [id, ligne] of Object.entries(e.budget)) {
    const def = MINISTERES[id];
    if (def.pilotage === 'regles') continue; // retraites : sous-modèle dédié
    // Cible nominale = niveau de départ × besoins × prix × (1 + variation en volume)
    ligne.cible = ligne.montantInitial * (ligne.facteurBesoins ?? 1) * indicePrix * (1 + (ligne.variationVolume ?? 0) / 100);
    const pas = inertiePoste(id, e.mode) * ligne.base;
    const ecart = ligne.cible - ligne.base;
    ligne.base += Math.max(-pas, Math.min(pas, ecart));
    // Part cyclique (allocations chômage) : suit le taux de chômage
    const partCyclique = def.partCyclique ?? 0;
    const cyclique = partCyclique ? ligne.base * partCyclique * (chomageRelatif - 1) : 0;
    ligne.ajustementReformes = effets.depenses?.[id] ?? 0;
    ligne.montant = Math.max(0, ligne.base + cyclique + ligne.ajustementReformes);
  }
  // Retraites : montant calculé par le sous-modèle, plus ajustements éventuels
  const r = e.budget.retraites;
  r.ajustementReformes = effets.depenses?.retraites ?? 0;
  r.montant = e.retraites.depenses + r.ajustementReformes;
}

/**
 * Montant de référence d'un poste « à politique inchangée » : niveau de
 * départ, en prix courants, augmenté des besoins liés au vieillissement
 * (santé). Les variations « en volume » se mesurent par rapport à lui.
 */
export function referencePoste(e, id) {
  const l = e.budget[id];
  return l ? l.montantInitial * (l.facteurBesoins ?? 1) * e.macro.niveauPrix / 100 : 0;
}

/** Total des dépenses primaires (hors intérêts), Md€/an. */
export function totalDepensesPrimaires(e) {
  return Object.values(e.budget).reduce((s, l) => s + l.montant, 0);
}
