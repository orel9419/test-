/**
 * Protections contre les données venues de l'extérieur.
 *
 * Le jeu ne charge aucune donnée d'un serveur : la seule porte d'entrée est
 * une sauvegarde importée (fichier ou texte collé) ou relue dans le stockage
 * du navigateur. Une sauvegarde peut avoir été modifiée à la main ou piégée
 * par un tiers ; elle est donc filtrée avant d'être confiée au moteur :
 * - taille et profondeur bornées (pas de blocage du navigateur) ;
 * - clés « __proto__ », « constructor » et « prototype » retirées
 *   (pollution de prototype) ;
 * - liens limités à http et https (pas de « javascript: » cliquable) ;
 * - structure minimale vérifiée (pays connu, tour plausible, nombres finis).
 */

export const TAILLE_MAX_SAUVEGARDE = 5_000_000; // caractères (une partie complète pèse environ 0,4 Mo)
const PROFONDEUR_MAX = 40;
const NOEUDS_MAX = 2_000_000;
const CLES_INTERDITES = new Set(['__proto__', 'constructor', 'prototype']);
export const PAYS_AUTORISES = ['france', 'allemagne', 'etatsUnis'];

/**
 * Renvoie l'adresse si c'est un lien web (http ou https), sinon null.
 * À utiliser pour tout lien dont l'adresse ne vient pas du code du jeu.
 */
export function urlSure(url) {
  if (typeof url !== 'string' || url.length > 2048) return null;
  try {
    const u = new URL(url.trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
  } catch {
    return null;
  }
}

/** Erreur de sauvegarde, avec un message lisible par le joueur. */
export class SauvegardeInvalide extends Error {}

/**
 * Lit un texte JSON non fiable : taille bornée, clés dangereuses retirées.
 * @throws {SauvegardeInvalide}
 */
export function lireJSONNonFiable(texte) {
  if (typeof texte !== 'string') throw new SauvegardeInvalide('Sauvegarde illisible.');
  if (texte.length > TAILLE_MAX_SAUVEGARDE) throw new SauvegardeInvalide('Sauvegarde trop volumineuse (5 Mo au plus).');
  try {
    return JSON.parse(texte, (cle, valeur) => (CLES_INTERDITES.has(cle) ? undefined : valeur));
  } catch {
    throw new SauvegardeInvalide('Ce texte n\'est pas une sauvegarde du jeu (JSON invalide).');
  }
}

/**
 * Parcourt une valeur issue de JSON : borne la profondeur et le nombre
 * d'éléments, neutralise les liens qui ne sont pas http(s) et les nombres
 * non finis. Modifie la valeur en place et la renvoie.
 * @throws {SauvegardeInvalide}
 */
export function assainir(valeur) {
  let noeuds = 0;
  const pile = [[valeur, 0]];
  while (pile.length) {
    const [v, profondeur] = pile.pop();
    if (v === null || typeof v !== 'object') continue;
    if (profondeur > PROFONDEUR_MAX) throw new SauvegardeInvalide('Sauvegarde trop imbriquée.');
    for (const cle of Object.keys(v)) {
      if (++noeuds > NOEUDS_MAX) throw new SauvegardeInvalide('Sauvegarde trop volumineuse.');
      if (CLES_INTERDITES.has(cle)) { delete v[cle]; continue; }
      const x = v[cle];
      if (typeof x === 'string') {
        // Tout champ d'adresse doit être un lien web ; ailleurs, un « javascript: » n'a rien à faire
        if (/^(url|href|lien|src)$/i.test(cle)) v[cle] = x === '' ? x : urlSure(x);
        else if (/^[\s\u0000-\u001f]*(javascript|vbscript):/i.test(x)) v[cle] = '';
      } else if (typeof x === 'number' && !Number.isFinite(x)) {
        v[cle] = 0;
      } else if (x && typeof x === 'object') {
        pile.push([x, profondeur + 1]);
      }
    }
  }
  return valeur;
}

/**
 * Vérifie la structure minimale d'une sauvegarde et l'assainit.
 * @returns {object} la sauvegarde assainie { version, date, partie, decisions }
 * @throws {SauvegardeInvalide}
 */
export function validerSauvegarde(s, version) {
  if (!s || typeof s !== 'object' || Array.isArray(s)) throw new SauvegardeInvalide('Sauvegarde illisible.');
  if (s.version !== version) throw new SauvegardeInvalide('Sauvegarde incompatible avec cette version du jeu.');
  const p = s.partie;
  if (!p || typeof p !== 'object' || Array.isArray(p)) throw new SauvegardeInvalide('Sauvegarde incomplète.');
  if (!PAYS_AUTORISES.includes(p.pays)) throw new SauvegardeInvalide('Pays inconnu dans la sauvegarde.');
  if (!Number.isInteger(p.tour) || p.tour < 0 || p.tour > 1000) throw new SauvegardeInvalide('Tour de jeu invalide.');
  for (const bloc of ['macro', 'finances', 'budget', 'statique']) {
    if (!p[bloc] || typeof p[bloc] !== 'object' || Array.isArray(p[bloc])) throw new SauvegardeInvalide('Sauvegarde incomplète.');
  }
  if (s.decisions != null && (typeof s.decisions !== 'object' || Array.isArray(s.decisions))) throw new SauvegardeInvalide('Décisions invalides.');
  assainir(s);
  for (const cle of ['pibNominal', 'niveauPrix']) {
    if (typeof p.macro[cle] !== 'number' || p.macro[cle] <= 0) throw new SauvegardeInvalide('Données économiques invalides.');
  }
  return s;
}
