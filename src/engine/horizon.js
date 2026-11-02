/**
 * Partie longue : jusqu'en 2050.
 *
 * Le calendrier sourcé des pays s'arrête à la fin du mandat en cours. Pour
 * jouer jusqu'en 2050, les scrutins sont prolongés selon leur périodicité
 * légale (dates théoriques, sans dissolution ni élection anticipée) :
 * - France : présidentielle tous les 5 ans (suivie des législatives),
 *   régionales et départementales tous les 6 ans, municipales tous les 6 ans
 *   (mars 2026, puis 2032…), européennes tous les 5 ans ;
 * - Allemagne : Bundestag tous les 4 ans (décalé après une élection
 *   anticipée), élections régionales des Länder tous les 5 ans, européennes ;
 * - États-Unis : présidentielle tous les 4 ans, Congrès tous les 2 ans
 *   (mi-mandat, et en même temps que la présidentielle).
 */
import { libelleTrimestre } from './calendrier.js';

export const ANNEE_FIN = 2050;

/** Nombre de tours (trimestres) entre le début et la fin de l'année visée incluse. */
export function nbToursJusqua(debut, annee = ANNEE_FIN) {
  return (annee - debut.annee) * 4 + (4 - debut.t) + 1;
}

/** Dates de a0 à aMax, tous les `pas` ans. */
const annees = (a0, pas, aMax) => {
  const l = [];
  for (let a = a0; a <= aMax; a += pas) l.push(a);
  return l;
};

const VAGUE_LAENDER_A = ['Schleswig-Holstein', 'Sarre', 'Rhénanie-du-Nord-Westphalie', 'Brême'];

/**
 * Échéances récurrentes ajoutées au calendrier sourcé pour une partie
 * jusqu'en `aMax`. Chaque échéance porte `theorique: true`.
 */
export function echeancesRecurrentes(pays, aMax = ANNEE_FIN) {
  const l = [];
  const ajouter = (x) => l.push({ ...x, theorique: true });
  if (pays === 'france') {
    for (const a of annees(2032, 5, aMax)) ajouter({ id: `presidentielle${a}`, annee: a, t: 2, type: 'presidentielle', nom: `Élection présidentielle (avril-mai ${a}), suivie des législatives` });
    for (const a of annees(2034, 6, aMax)) ajouter({ id: `regionales${a}`, annee: a, t: 1, type: 'regionales', nom: `Élections régionales et départementales (mars ${a}, date théorique)` });
    for (const a of annees(2032, 6, aMax)) ajouter({ id: `municipales${a}`, annee: a, t: 1, type: 'municipales', nom: `Élections municipales (mars ${a}, date théorique)` });
    for (const a of annees(2034, 5, aMax)) ajouter({ id: `europeennes${a}`, annee: a, t: 2, type: 'europeennes', nom: `Élections européennes (juin ${a})` });
  } else if (pays === 'allemagne') {
    for (const a of annees(2033, 4, aMax)) ajouter({ id: `bundestag${a}`, annee: a, t: 1, type: 'legislatives', nom: `Élections fédérales (Bundestag, ${a})` });
    for (const a of annees(2032, 5, aMax)) {
      ajouter({ id: `landtag${a}a`, annee: a, t: 2, type: 'landtag', laender: VAGUE_LAENDER_A, nom: `Élections régionales : Schleswig-Holstein, Sarre, Rhénanie-du-Nord-Westphalie, Brême (${a})` });
      ajouter({ id: `landtag${a}b`, annee: a, t: 3, type: 'landtag', laender: ['Basse-Saxe'], nom: `Élection régionale en Basse-Saxe (${a})` });
    }
    for (const a of annees(2034, 5, aMax)) ajouter({ id: `europeennes${a}`, annee: a, t: 2, type: 'europeennes', nom: `Élections européennes (juin ${a})` });
  } else if (pays === 'etatsUnis') {
    for (const a of annees(2032, 4, aMax)) ajouter({ id: `presidentielle${a}`, annee: a, t: 4, type: 'presidentielle', nom: `Élection présidentielle et renouvellement du Congrès (novembre ${a})` });
    for (const a of annees(2030, 4, aMax)) ajouter({ id: `miMandat${a}`, annee: a, t: 4, type: 'mi_mandat', nom: `Élections de mi-mandat (novembre ${a})` });
  }
  return l;
}

/** Calendrier complet d'une partie jusqu'en 2050 : échéances sourcées puis récurrentes, triées. */
export function calendrierJusqua2050(calendrier, pays) {
  const ids = new Set(calendrier.echeances.map((x) => x.id));
  const echeances = [...calendrier.echeances, ...echeancesRecurrentes(pays).filter((x) => !ids.has(x.id))]
    .sort((a, b) => a.annee - b.annee || a.t - b.t);
  return { ...calendrier, echeances };
}

/**
 * Après une élection anticipée (Allemagne), les scrutins suivants du même
 * type sont recalés : prochain dans `pas` ans, puis tous les `pas` ans.
 */
export function replanifier(e, type, pas) {
  const cal = e.statique.calendrier;
  const tr = e.trimestre;
  const apres = (x) => x.annee > tr.annee || (x.annee === tr.annee && x.t > tr.t);
  const modele = cal.echeances.find((x) => x.type === type && apres(x));
  const garder = cal.echeances.filter((x) => !(x.type === type && apres(x)));
  const nouvelles = [];
  for (let a = tr.annee + pas; a <= (e.horizon ?? tr.annee + pas); a += pas) {
    nouvelles.push({ ...(modele ?? {}), id: `${type}${a}_${tr.t}`, annee: a, t: tr.t, type, theorique: true, nom: `${modele?.nom?.replace(/\s*\(.*\)$/, '') ?? 'Élection'} (${libelleTrimestre({ annee: a, t: tr.t })})` });
  }
  e.statique.calendrier = { ...cal, echeances: [...garder, ...nouvelles].sort((a, b) => a.annee - b.annee || a.t - b.t) };
}
