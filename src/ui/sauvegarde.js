/**
 * Sauvegarde locale (localStorage) et export / import en JSON.
 * L'état d'une partie est entièrement sérialisable.
 */
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
    const s = JSON.parse(brut);
    return s.version === VERSION ? s : null;
  } catch {
    return null;
  }
}

export function effacerLocal() {
  localStorage.removeItem(CLE);
}

/** Télécharge la partie au format JSON. */
export function exporterJSON(partie, decisions) {
  const contenu = JSON.stringify({ version: VERSION, date: new Date().toISOString(), partie, decisions }, null, 1);
  const blob = new Blob([contenu], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chef-de-gouvernement-${partie.pays}-tour-${partie.tour}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Lit un fichier JSON exporté. Rejette les fichiers incompatibles. */
export async function importerJSON(fichier) {
  const texte = await fichier.text();
  const s = JSON.parse(texte);
  if (s.version !== VERSION || !s.partie?.pays || !s.partie?.macro) throw new Error('Fichier de sauvegarde incompatible.');
  return s;
}
