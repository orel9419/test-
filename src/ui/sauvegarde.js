/**
 * Sauvegarde locale (localStorage) et export / import en JSON.
 * L'état d'une partie est entièrement sérialisable. Toute sauvegarde relue
 * (fichier, texte collé ou stockage du navigateur) passe par les contrôles
 * de src/ui/securite.js avant d'être confiée au moteur.
 */
import { lireJSONNonFiable, validerSauvegarde, SauvegardeInvalide } from './securite.js';

const CLE = 'chef-de-gouvernement:partie';
const VERSION = 1;

export function sauvegarderLocal(partie, decisions) {
  try {
    localStorage.setItem(CLE, JSON.stringify({ version: VERSION, date: new Date().toISOString(), partie, decisions }));
    return true;
  } catch {
    return false; // quota dépassé ou navigation privée
  }
}

export function chargerLocal() {
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return null;
    return validerSauvegarde(lireJSONNonFiable(brut), VERSION);
  } catch {
    return null;
  }
}

export function effacerLocal() {
  try { localStorage.removeItem(CLE); } catch { /* stockage indisponible */ }
}

/**
 * Préférences de l'interface (thème, visite guidée déjà vue). Le stockage
 * local peut être indisponible (navigation privée, page intégrée dans un
 * cadre sécurisé) : le jeu fonctionne alors sans mémoriser ces réglages.
 */
export function lirePreference(cle) {
  try { return localStorage.getItem(cle); } catch { return null; }
}
export function ecrirePreference(cle, valeur) {
  try { localStorage.setItem(cle, valeur); } catch { /* stockage indisponible */ }
}

/** Texte JSON d'une sauvegarde (pour la copier ou la télécharger). */
export function texteSauvegarde(partie, decisions) {
  return JSON.stringify({ version: VERSION, date: new Date().toISOString(), partie, decisions });
}

/** Lit une sauvegarde collée sous forme de texte (taille, structure et liens contrôlés). */
export function lireSauvegardeTexte(texte) {
  return validerSauvegarde(lireJSONNonFiable(texte), VERSION);
}

/** Télécharge la partie au format JSON. */
export function exporterJSON(partie, decisions) {
  const contenu = texteSauvegarde(partie, decisions);
  const blob = new Blob([contenu], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chef-de-gouvernement-${partie.pays}-tour-${partie.tour}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Lit un fichier JSON exporté. Rejette les fichiers incompatibles, trop gros ou malformés. */
export async function importerJSON(fichier) {
  if (!fichier || fichier.size > 5_000_000) throw new SauvegardeInvalide('Fichier trop volumineux (5 Mo au plus).');
  return lireSauvegardeTexte(await fichier.text());
}
