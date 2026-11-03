/**
 * Solidité du pouvoir : un indicateur de synthèse (0 à 100) pour le joueur,
 * qui combine la popularité, la marge à la prochaine élection décisive et la
 * menace parlementaire (censure en France, coalition en Allemagne).
 * Indicateur de jeu, sans équivalent officiel.
 */
import { borner } from '../model/outils.js';
import { projectionPresidentielle, projectionPresidentielleEtatsUnis } from './objectifs.js';

const DECISIVES = ['presidentielle', 'legislatives', 'mi_mandat'];

/** Projection (% pour votre camp) et seuil de victoire pour une élection. */
function projection(e, ech) {
  if (ech.type === 'presidentielle') return e.pays === 'etatsUnis' ? projectionPresidentielleEtatsUnis(e) : projectionPresidentielle(e);
  if (ech.type === 'mi_mandat') return e.opinion?.intentions?.REP ?? 50;
  if (ech.type === 'legislatives' && e.pays === 'allemagne') {
    const i = e.politique.intentions ?? {};
    const representes = ['CDUCSU', 'AFD', 'SPD', 'GRUENE', 'LINKE'].filter((k) => (i[k] ?? 0) >= 5);
    const total = representes.reduce((s, k) => s + i[k], 0) || 1;
    const part = (k) => (representes.includes(k) ? i[k] / total * 100 : 0);
    return Math.max(part('CDUCSU') + part('SPD'), part('CDUCSU') + part('SPD') + part('GRUENE') - 3);
  }
  return null;
}

export function soliditePouvoir(e) {
  const h = e.historique;
  const popularite = e.social.popularite;
  const variation = h.length >= 2 ? popularite - (h.at(-2)?.popularite ?? popularite) : 0;
  const tr = e.trimestre;
  const prochaine = (e.statique.calendrier.echeances ?? [])
    .filter((x) => DECISIVES.includes(x.type) && (x.annee > tr.annee || (x.annee === tr.annee && x.t >= tr.t)))
    .map((x) => ({ ...x, projection: projection(e, x) }))
    .find((x) => x.projection !== null);
  const election = prochaine ? {
    nom: prochaine.nom.replace(/\s*\(.*\)$/, ''),
    dans: (prochaine.annee - tr.annee) * 4 + (prochaine.t - tr.t),
    projection: prochaine.projection,
    marge: prochaine.projection - 50,
  } : null;

  let menace = null, termeMenace = 0;
  const pol = e.politique;
  if (e.pays === 'france') {
    const voix = pol.siegesCenseurs ?? 0;
    menace = { texte: `Censure : ${voix} voix potentielles sur ${pol.majorite} nécessaires`, niveau: voix >= pol.majorite ? 'critique' : voix >= pol.majorite - 40 ? 'attention' : 'bon' };
    termeMenace = -22 * borner((voix - 230) / (pol.majorite - 230), 0, 1.4);
  } else if (e.pays === 'allemagne' && pol.coalition) {
    const sat = pol.coalition.satisfaction;
    menace = { texte: `Coalition : satisfaction du SPD ${Math.round(sat)}/100`, niveau: sat < 25 ? 'critique' : sat < 40 ? 'attention' : 'bon' };
    termeMenace = (sat - 45) / 2;
  } else if (e.pays === 'etatsUnis') {
    menace = { texte: pol.gouvernementDivise ? 'Congrès divisé : vos textes exigent l\'accord des démocrates' : 'Votre camp contrôle le Congrès', niveau: pol.gouvernementDivise ? 'attention' : 'bon' };
    termeMenace = pol.gouvernementDivise ? -8 : 5;
  }
  const termeElection = election ? 3 * borner(election.marge, -8, 8) * (election.dans <= 4 ? 1.3 : 1) : 0;
  const score = Math.round(borner(55 + 1.2 * (popularite - 28) + termeElection + termeMenace, 0, 100));
  const etat = score >= 60 ? { libelle: 'Solide', icone: '💪', classe: 'bon' } : score >= 30 ? { libelle: 'Fragile', icone: '⚠️', classe: 'attention' } : { libelle: 'En danger', icone: '🔥', classe: 'critique' };
  return { score, ...etat, popularite, variation, election, menace };
}
