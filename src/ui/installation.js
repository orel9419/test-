/**
 * Installation de l'application sur l'écran d'accueil.
 * - Android et ordinateurs (Chrome, Edge) : le navigateur propose une invite
 *   d'installation, que l'on garde pour l'afficher au bon moment ;
 * - iPhone et iPad (Safari) : pas d'invite, il faut passer par le menu
 *   Partager, puis « Sur l'écran d'accueil ».
 */
let invite = null;
const abonnes = new Set();
const prevenir = () => abonnes.forEach((f) => f());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (ev) => { ev.preventDefault(); invite = ev; prevenir(); });
  window.addEventListener('appinstalled', () => { invite = null; prevenir(); });
}

export function etatInstallation() {
  if (typeof window === 'undefined') return { installee: false, possible: false, ios: false };
  const installee = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !installee;
  const integree = window.self !== window.top;
  return { installee, possible: !!invite, ios, integree };
}

export function suivreInstallation(f) { abonnes.add(f); return () => abonnes.delete(f); }

export async function installer() {
  if (!invite) return false;
  invite.prompt();
  const choix = await invite.userChoice.catch(() => null);
  invite = null;
  prevenir();
  return choix?.outcome === 'accepted';
}
