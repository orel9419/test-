/**
 * Petits utilitaires partagés par les profils pays et le moteur.
 */

/** Lit une valeur numérique dans un objet de données sourcées ({ valeur, ... } ou nombre). */
export function lire(donnee, defaut = null) {
  if (donnee === undefined || donnee === null) return defaut;
  if (typeof donnee === 'number') return donnee;
  if (typeof donnee === 'object' && typeof donnee.valeur === 'number') return donnee.valeur;
  return defaut;
}

/** Arrondi à n décimales. */
export function arrondi(x, n = 1) {
  const f = 10 ** n;
  return Math.round(x * f) / f;
}

/** Borne une valeur dans [min, max]. */
export function borner(x, min, max) {
  return Math.min(max, Math.max(min, x));
}

/** Somme des valeurs d'un objet. */
export function somme(obj) {
  return Object.values(obj).reduce((s, v) => s + v, 0);
}

/**
 * Construit une « provenance » attachée à une valeur de départ, pour l'afficher
 * dans l'interface (badge officiel / dérivé / estimation).
 */
export function provenance(statut, texte, url = null) {
  return { statut, texte, url };
}
