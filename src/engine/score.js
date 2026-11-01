/**
 * Score de fin de partie, pondéré selon le régime politique.
 *
 * Sept composantes notées de 0 à 100 :
 * - soutenabilité : évolution de la dette et du déficit, absence de crise ;
 * - bien-être social : pouvoir d'achat des ménages, chômage, cohésion ;
 * - transition écologique : baisse des émissions par rapport à l'objectif ;
 * - innovation : effort de recherche, croissance potentielle ;
 * - stabilité politique : durée au pouvoir, instabilité, coalition ;
 * - influence internationale ;
 * - objectifs du mandat (principaux comptés double).
 */
import { borner } from '../model/outils.js';

export const PONDERATIONS = {
  'semi-presidentiel': { soutenabilite: 0.2, bienEtre: 0.15, transition: 0.1, innovation: 0.08, stabilite: 0.15, influence: 0.07, objectifs: 0.25 },
  'parlementaire-coalition': { soutenabilite: 0.17, bienEtre: 0.15, transition: 0.13, innovation: 0.1, stabilite: 0.18, influence: 0.07, objectifs: 0.2 },
  presidentiel: { soutenabilite: 0.15, bienEtre: 0.2, transition: 0.1, innovation: 0.12, stabilite: 0.13, influence: 0.1, objectifs: 0.2 },
  'parlementaire-minoritaire': { soutenabilite: 0.2, bienEtre: 0.2, transition: 0.12, innovation: 0.08, stabilite: 0.15, influence: 0.05, objectifs: 0.2 },
};

export const LIBELLES_COMPOSANTES = {
  soutenabilite: 'Soutenabilité de la dette',
  bienEtre: 'Bien-être social',
  transition: 'Transition écologique',
  innovation: 'Innovation',
  stabilite: 'Stabilité politique',
  influence: 'Influence internationale',
  objectifs: 'Objectifs du mandat',
};

export function calculerScore(e) {
  const depart = e.historique[0];
  const f = e.finances, m = e.macro;
  const c = {};
  c.soutenabilite = borner(55 + 4 * (depart.dette - f.detteRatio) + 6 * (depart.deficit - f.deficitRatio) - (f.crise || e.issue?.cause === 'crise_dette' ? 50 : 0) + 8 * f.credibilite, 0, 100);
  const pa = e.menages.reduce((s, x) => s + (x.variationPct ?? 0), 0) / e.menages.length;
  c.bienEtre = borner(50 + 4 * pa - 6 * (m.chomage - depart.chomage) + 0.8 * (e.social.cohesion - depart.cohesion), 0, 100);
  const baisseEmissions = (e.climat.emissions0 - e.climat.emissions) / e.climat.emissions0 * 100;
  const baisseVisee = (e.climat.emissions0 - e.climat.objectif2030) / e.climat.emissions0 * 100;
  c.transition = borner(100 * baisseEmissions / Math.max(1, baisseVisee), 0, 100);
  const rd0 = e.statique.stocksInitiaux.recherche;
  const potentielGagne = (m.pibPotentiel / (e.historique.length > 1 ? 100 / (1 + depart.ecart / 100) : m.pibPotentiel) - 1) * 100;
  c.innovation = borner(50 + 60 * ((e.recherche?.effortPctPIB ?? rd0) - rd0) + 4 * (potentielGagne - (e.tour - 1) / 4 * m.croissancePotentielleBase), 0, 100);
  const duree = Math.min(1, (e.tour - 1) / e.nbTours);
  const instabiliteMoyenne = m.instabilitePolitique;
  c.stabilite = borner(100 * duree - 30 * instabiliteMoyenne - (e.issue?.type === 'defaite' ? 25 : 0), 0, 100);
  c.influence = borner(50 + 2.5 * (e.international.influence - e.international.influenceInitiale), 0, 100);
  const objs = e.objectifs ?? [];
  const poids = objs.reduce((s, o) => s + (o.type === 'principal' ? 2 : 1), 0) || 1;
  c.objectifs = 100 * objs.reduce((s, o) => s + (o.type === 'principal' ? 2 : 1) * (o.statut === 'atteint' || o.statut === 'en_voie' ? 1 : o.progression * 0.5), 0) / poids;

  const pond = PONDERATIONS[e.statique.regime] ?? PONDERATIONS['semi-presidentiel'];
  let total = 0;
  for (const [k, w] of Object.entries(pond)) total += w * c[k];
  const bonusMode = { bac_a_sable: 0.8, realiste: 1, difficile: 1.15 }[e.mode] ?? 1;
  total = Math.round(total * bonusMode);
  const mention = total >= 80 ? 'Homme ou femme d\'État' : total >= 65 ? 'Mandat réussi' : total >= 50 ? 'Bilan honorable' : total >= 35 ? 'Bilan contesté' : 'Mandat chaotique';
  return { total, composantes: c, ponderations: pond, mention };
}
