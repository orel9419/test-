/**
 * Mode Express : moteur pur (sans interface), déterministe pour une graine
 * donnée (défi du jour : tout le monde a les mêmes cartes, dans le même ordre,
 * tant qu'il fait les mêmes choix).
 *
 * Quatre jauges de 0 à 100, départ à 50. Une jauge à 0 ou à 100 met fin à la
 * partie. Chaque carte = une semaine. L'usure du pouvoir grignote l'opinion et
 * les finances, et les effets s'amplifient avec le temps.
 */
import { CARTES, FINS, JAUGES } from './cartes.js';
import { creerAleatoire } from '../engine/aleatoire.js';

export { CARTES, FINS, JAUGES };
const CLES = Object.keys(JAUGES);
const parId = Object.fromEntries(CARTES.map((c) => [c.id, c]));
const borner = (x) => Math.max(0, Math.min(100, x));

/** Graine du défi du jour (même pour tout le monde à une date donnée). */
export function graineDuJour(date = new Date()) {
  const j = typeof date === 'string' ? date : date.toISOString().slice(0, 10);
  let h = 2166136261;
  for (const ch of `defi-${j}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h % 2 ** 31;
}

/** Numéro du défi (n° 1 le 4 novembre 2026). */
export function numeroDefi(date = new Date()) {
  const j = new Date(`${typeof date === 'string' ? date : date.toISOString().slice(0, 10)}T12:00:00Z`);
  return Math.floor((j - new Date('2026-11-04T12:00:00Z')) / 86400000) + 1;
}

function tirer(etat) {
  const alea = creerAleatoire((etat.graine ^ Math.imul(etat.semaine + 1, 2654435761)) >>> 0);
  const recentes = new Set(etat.vues.slice(-Math.min(45, CARTES.length - 10)));
  const candidates = CARTES.filter((c) => !recentes.has(c.id));
  return candidates[Math.floor(alea.uniforme() * candidates.length)].id;
}

export function nouvellePartie({ graine = Math.floor(Math.random() * 2 ** 31), quotidien = false, date = null } = {}) {
  const e = { graine, quotidien, date, semaine: 0, jauges: Object.fromEntries(CLES.map((k) => [k, 50])), vues: [], carte: null, fin: null, choix: [] };
  e.carte = tirer(e);
  return e;
}

export function carte(id) { return parId[id]; }

/** Intensité des effets : elle croît doucement avec le temps (le pouvoir use). */
export function multiplicateur(semaine) { return 1 + Math.min(0.8, semaine / 90); }

/** Aperçu d'un choix : jauges touchées et ampleur (sans dire dans quel sens, comme un conseiller prudent). */
export function apercu(id, cote) {
  const r = carte(id)?.[cote] ?? {};
  return Object.fromEntries(CLES.filter((k) => r[k] || r.fixe?.[k] !== undefined).map((k) => [k, Math.abs(r[k] ?? 10) >= 8 ? 'fort' : 'faible']));
}

/**
 * Applique un choix ('gauche' ou 'droite') et renvoie le nouvel état.
 */
export function choisir(etat, cote) {
  if (etat.fin) return etat;
  const c = carte(etat.carte);
  const r = c[cote];
  const k = multiplicateur(etat.semaine);
  const jauges = { ...etat.jauges };
  for (const cle of CLES) {
    if (r.fixe?.[cle] !== undefined) jauges[cle] = r.fixe[cle];
    else jauges[cle] = borner(jauges[cle] + (r[cle] ?? 0) * k);
  }
  // Usure du pouvoir et pression de la dette, à partir de la 4e semaine
  if (etat.semaine >= 3) { jauges.o = borner(jauges.o - 0.4); jauges.f = borner(jauges.f - 0.5); }
  const suivant = { ...etat, jauges, semaine: etat.semaine + 1, vues: [...etat.vues, c.id], choix: [...etat.choix, cote] };
  const touche = CLES.find((x) => jauges[x] <= 0) ?? CLES.find((x) => jauges[x] >= 100);
  if (touche) suivant.fin = `${touche}${jauges[touche] <= 0 ? 0 : 100}`;
  else suivant.carte = tirer(suivant);
  return suivant;
}

/** Titre honorifique selon la durée. */
export function mention(semaines) {
  if (semaines < 8) return 'Gouvernement éclair';
  if (semaines < 20) return 'Locataire de passage';
  if (semaines < 40) return 'Chef de gouvernement aguerri';
  if (semaines < 70) return 'Animal politique';
  return 'Légende de Matignon';
}

/** Records et fins découvertes (stockés dans le navigateur par l'interface). */
export function majRecords(records = {}, etat) {
  const r = { meilleur: 0, parties: 0, fins: [], defis: {}, ...records };
  r.parties += 1;
  r.meilleur = Math.max(r.meilleur, etat.semaine);
  if (etat.fin && !r.fins.includes(etat.fin)) r.fins = [...r.fins, etat.fin];
  if (etat.quotidien && etat.date) r.defis = { ...r.defis, [etat.date]: Math.max(r.defis[etat.date] ?? 0, etat.semaine) };
  return r;
}

/** Série de jours consécutifs où le défi a été joué (jusqu'à la date donnée). */
export function serie(records, date) {
  let n = 0;
  const d = new Date(`${date}T12:00:00Z`);
  while (records?.defis?.[d.toISOString().slice(0, 10)] !== undefined) { n += 1; d.setUTCDate(d.getUTCDate() - 1); }
  return n;
}
