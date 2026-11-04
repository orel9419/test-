/**
 * Géopolitique (France) : tensions par théâtre, déploiement du groupe
 * aéronaval, et crises qui éclatent quand la tension monte.
 *
 * Le module utilise son propre générateur aléatoire (dérivé de la graine et du
 * tour) : il ne modifie pas les tirages du reste du jeu. Sans décision du
 * joueur, seules les crises s'ajoutent aux événements du trimestre.
 */
import { THEATRES, CRISES } from '../data/geopolitique.js';
import { creerAleatoire } from './aleatoire.js';
import { borner } from '../model/outils.js';
import { libelleTrimestre } from './calendrier.js';

const actif = (e) => e.pays === 'france';
const aleaGeo = (e, sel = 0) => creerAleatoire(((e.graine ^ Math.imul(e.tour + 17, 2246822519)) + sel) >>> 0);

const etatInitial = () => ({
  gan: { position: 'toulon', potentiel: 100, trimestresEnMer: 0, maintenance: 0 },
  tensions: Object.fromEntries(Object.entries(THEATRES).filter(([, t]) => !t.base).map(([id, t]) => [id, t.tension])),
  bonusExport: {},
  historique: [],
  dernieresCrises: {},
});

export function initialiserGeopolitique(e) {
  e.geopolitique = actif(e) ? etatInitial() : null;
}

/** Nom du porte-avions selon la date et le programme de son successeur. */
export function porteAvions(e) {
  const pa = e.defense?.programmes?.pang;
  if (e.defense?.jalons?.includes('pang')) return { nom: 'France Libre', disponible: true };
  if (e.trimestre.annee >= 2039 && pa?.abandonne) return { nom: null, disponible: false };
  return { nom: 'Charles-de-Gaulle', disponible: true };
}

/**
 * Ordonne le déplacement du groupe aéronaval vers un théâtre (ou le retour à Toulon).
 * @returns {object} { texte } ou { erreur }
 */
export function deplacerGroupe(e, destination) {
  if (!actif(e)) return { erreur: 'Disponible pour la France.' };
  if (!e.geopolitique) initialiserGeopolitique(e); // sauvegarde antérieure au module
  const g = e.geopolitique.gan;
  const t = THEATRES[destination];
  if (!t) return { erreur: 'Destination inconnue.' };
  if (g.position === destination) return { erreur: 'Le groupe aéronaval y est déjà.' };
  if (!porteAvions(e).disponible) return { erreur: 'La France n\'a plus de porte-avions.' };
  if (!t.base && g.maintenance > 0) return { erreur: `Entretien en cours à Toulon : encore ${g.maintenance} trimestre(s).` };
  if (!t.base && g.potentiel < t.usure) return { erreur: 'Potentiel insuffisant : le groupe doit rentrer à Toulon pour son entretien.' };
  const depart = THEATRES[g.position]?.court ?? g.position;
  g.position = destination;
  if (t.base) g.trimestresEnMer = 0;
  const texte = t.base ? `Le groupe aéronaval rentre à Toulon (depuis : ${depart}).` : `Le groupe aéronaval appareille pour : ${t.nom}.`;
  e.journal.push({ tour: e.tour, trimestre: libelleTrimestre(e.trimestre), type: 'politique', texte: `Géopolitique — ${texte}` });
  e.geopolitique.historique.push({ tour: e.tour, position: destination });
  return { texte };
}

/** Effets d'un trimestre de présence : influence, relations, tension apaisée, coût, usure. */
function presence(e, id) {
  const t = THEATRES[id];
  const x = e.geopolitique;
  const i = e.international;
  i.bonusInfluence += t.presence?.influence ?? 0;
  for (const [p, v] of Object.entries(t.presence?.relations ?? {})) if (i.relations[p] !== undefined) i.relations[p] = borner(i.relations[p] + v, -100, 100);
  x.tensions[id] = Math.max(0, x.tensions[id] - 8);
  // Sécurité des routes commerciales et énergétiques quand la tension est forte
  if ((t.protegeCommerce || t.protegeEnergie) && x.tensions[id] > 55 && e.monde) e.monde.energie *= 0.997;
  for (const [cle, v] of Object.entries(t.bonusExport ?? {})) x.bonusExport[cle] = { valeur: v, jusquA: e.tour + 4 };
  e.depensesTemporaires.push({ poste: 'defense', valeur: t.cout * 4, fin: e.tour + 1, source: 'groupe_aeronaval' });
  x.gan.potentiel = Math.max(0, x.gan.potentiel - t.usure);
  x.gan.trimestresEnMer += 1;
}

/**
 * Trimestre : présence et usure du groupe aéronaval, entretien à Toulon,
 * évolution des tensions (aléa séparé). Appelé avant le calcul des dépenses.
 */
export function majGeopolitique(e) {
  if (!actif(e)) return;
  if (!e.geopolitique) initialiserGeopolitique(e);
  const x = e.geopolitique;
  const g = x.gan;
  if (g.position === 'toulon') {
    if (g.maintenance > 0) g.maintenance -= 1;
    g.potentiel = Math.min(100, g.potentiel + 40);
  } else {
    presence(e, g.position);
    // Potentiel épuisé : retour obligatoire et entretien
    if (g.potentiel < 15) {
      e.journal.push({ tour: e.tour, trimestre: libelleTrimestre(e.trimestre), type: 'alerte', texte: `Géopolitique — Après ${g.trimestresEnMer} trimestre(s) en mer, le groupe aéronaval rentre à Toulon pour son entretien.` });
      g.position = 'toulon';
      g.trimestresEnMer = 0;
      g.maintenance = 1;
    }
  }
  // Tensions : marche aléatoire qui revient vers le niveau de base de chaque théâtre
  const alea = aleaGeo(e, 1);
  for (const id of Object.keys(x.tensions)) {
    const base = THEATRES[id].tension;
    x.tensions[id] = borner(x.tensions[id] + 0.15 * (base - x.tensions[id]) + alea.normale(0, 6), 0, 100);
  }
  for (const [cle, b] of Object.entries(x.bonusExport)) if (e.tour > b.jusquA) delete x.bonusExport[cle];
}

/**
 * Après le tirage des événements du trimestre suivant : une crise peut éclater
 * sur un théâtre très tendu (au plus une par trimestre, pas deux fois de suite au même endroit).
 */
export function injecterCrises(e, max = 3) {
  if (!actif(e) || !e.geopolitique || e.evenements.enAttente.length >= max + 1) return;
  const x = e.geopolitique;
  const alea = aleaGeo(e, 2);
  const candidates = CRISES.filter((c) => x.tensions[c.theatre] >= 64 && (x.dernieresCrises[c.theatre] ?? -99) < e.tour - 6);
  if (!candidates.length) return;
  const c = candidates.sort((a, b) => x.tensions[b.theatre] - x.tensions[a.theatre])[0];
  if (!alea.tirage(0.55)) return;
  x.dernieresCrises[c.theatre] = e.tour;
  x.tensions[c.theatre] = Math.max(40, x.tensions[c.theatre] - 20);
  e.evenements.enAttente.push({ id: c.id, titre: c.titre, description: c.description(e), choix: c.choix.map((ch) => ({ id: ch.id, texte: ch.texte })), tour: e.tour, geopolitique: true });
}

/** Résumé pour l'interface. */
export function resumeGeopolitique(e) {
  if (!actif(e)) return null;
  const x = e.geopolitique ?? etatInitial(); // sauvegarde antérieure au module : état de départ
  return {
    gan: { ...x.gan, porteAvions: porteAvions(e) },
    theatres: Object.entries(THEATRES).map(([id, t]) => ({ id, ...t, tensionActuelle: t.base ? null : x.tensions[id], present: x.gan.position === id })),
    bonusExport: x.bonusExport,
  };
}
