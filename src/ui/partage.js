/**
 * Partage : feuille de partage du téléphone quand elle existe, sinon copie
 * dans le presse-papiers. Renvoie un message à afficher au joueur.
 */

/** Adresse publique du jeu (sans paramètres ni ancre). */
export function adresseDuJeu() {
  try {
    const u = new URL(window.location.href);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return `${u.origin}${u.pathname}`;
  } catch {
    return null;
  }
}

export async function partager({ titre, texte, url = adresseDuJeu() }) {
  const complet = url ? `${texte}\n${url}` : texte;
  try {
    if (navigator.share) {
      await navigator.share({ title: titre, text: texte, ...(url ? { url } : {}) });
      return 'Merci du partage !';
    }
  } catch (err) {
    if (err?.name === 'AbortError') return null; // partage annulé par le joueur
  }
  try {
    await navigator.clipboard.writeText(complet);
    return 'Texte copié : collez-le dans un message.';
  } catch {
    return `Copiez ce texte pour le partager : ${complet}`;
  }
}
