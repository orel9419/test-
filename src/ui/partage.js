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

/**
 * Partage d'une image (capture 3D, carte de score) : feuille de partage du
 * téléphone avec le fichier quand c'est possible, sinon téléchargement.
 */
export async function partagerImage(dataUrl, nomFichier, texte = '', url = adresseDuJeu()) {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const fichier = new File([blob], nomFichier, { type: blob.type || 'image/png' });
    if (navigator.canShare?.({ files: [fichier] })) {
      await navigator.share({ files: [fichier], text: url ? `${texte}\n${url}` : texte, title: 'Chef de gouvernement' });
      return 'Merci du partage !';
    }
  } catch (err) {
    if (err?.name === 'AbortError') return null;
  }
  try {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = nomFichier;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return 'Image téléchargée : publiez-la sur vos réseaux !';
  } catch {
    return 'Impossible d\'enregistrer l\'image sur cet appareil.';
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
