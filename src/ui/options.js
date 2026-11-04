/**
 * Options de l'interface, mémorisées dans le navigateur quand c'est possible :
 * thème, taille du texte, animations, interface essentielle ou complète,
 * confirmation avant de valider un trimestre.
 */
import { lirePreference, ecrirePreference } from './sauvegarde.js';

const CLE = 'cdg:options';

export const OPTIONS_DEFAUT = {
  theme: 'auto',            // 'auto' | 'clair' | 'sombre'
  taille: 'normale',        // 'normale' | 'grande' | 'tres_grande'
  animations: 'systeme',    // 'systeme' | 'reduites'
  interface: 'essentielle', // 'essentielle' | 'complete'
  confirmer: true,          // demander confirmation s'il reste des événements à trancher
};

/** Onglets masqués en interface essentielle (toujours accessibles en interface complète). Les classements
 * internationaux, les grands rendez-vous et la rubrique régalienne restent toujours visibles. */
export const ONGLETS_AVANCES = ['menages', 'sources'];

export function lireOptions() {
  let o = {};
  try { o = JSON.parse(lirePreference(CLE) ?? '{}') ?? {}; } catch { o = {}; }
  // Reprise de l'ancien réglage de thème
  if (!o.theme) {
    const ancien = lirePreference('cdg:theme');
    if (ancien === 'dark') o.theme = 'sombre';
    else if (ancien === 'light') o.theme = 'clair';
  }
  return { ...OPTIONS_DEFAUT, ...o };
}

export function ecrireOptions(o) {
  ecrirePreference(CLE, JSON.stringify(o));
}

/** Thème effectif ('light' ou 'dark') selon l'option et le réglage du système. */
export function themeEffectif(o) {
  if (o.theme === 'clair') return 'light';
  if (o.theme === 'sombre') return 'dark';
  try { return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch { return 'light'; }
}

/** Applique les options au document (attributs lus par la feuille de style). */
export function appliquerOptions(o) {
  const d = document.documentElement.dataset;
  d.theme = themeEffectif(o);
  d.taille = o.taille;
  d.animations = o.animations;
}

/** Vrai si les animations doivent être réduites (réglage du jeu ou du système). */
export function mouvementReduit() {
  if (typeof window === 'undefined') return true;
  if (document.documentElement.dataset.animations === 'reduites') return true;
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

/** Code de partie lisible (base 36) à partir de la graine, et inversement. */
export function codeDePartie(graine) {
  return (graine >>> 0).toString(36).toUpperCase();
}
export function graineDepuisCode(code) {
  const c = String(code ?? '').trim().toUpperCase();
  if (!c) return null;
  if (/^[0-9A-Z]{1,7}$/.test(c)) {
    const n = parseInt(c, 36);
    if (Number.isFinite(n) && n < 2 ** 31) return n;
  }
  // Texte libre (« défi du lycée ») : empreinte stable
  let h = 2166136261;
  for (const ch of c) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h % 2 ** 31;
}
