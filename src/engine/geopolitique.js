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
import { ANNEE_MIN_FRANCE_LIBRE } from './defense.js';

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

/**
 * Porte-avions en service : le Charles-de-Gaulle (indisponible pendant son
 * arrêt technique majeur de 2027-2028) jusqu'à son retrait, puis le « France
 * Libre », jamais avant 2032.
 * @returns {object} { nom, enService, disponible, arretTechnique, motif }
 */
export function porteAvions(e) {
  const pang = e.defense?.programmes?.pang;
  return flotte(e)[0] ?? { id: null, nom: null, enService: false, disponible: false, motif: pang?.abandonne ? 'La France n\'a plus de porte-avions : le Charles-de-Gaulle est retiré et son successeur a été abandonné.' : 'Le Charles-de-Gaulle est retiré et le « France Libre » n\'est pas encore en service.' };
}

/**
 * Porte-avions en service, le plus récent d'abord : « France Libre » (jamais
 * avant 2032), second porte-avions de nouvelle génération (si vous en avez
 * décidé deux), Charles-de-Gaulle (jusqu'à son retrait, ou 2040 s'il est gardé).
 * Deux porte-avions en service : deux groupes aéronavals.
 */
export function flotte(e) {
  const j = e.defense?.jalons ?? [];
  const liste = [];
  if (j.includes('pang') && e.trimestre.annee >= ANNEE_MIN_FRANCE_LIBRE) liste.push({ id: 'france_libre', nom: 'France Libre', enService: true, disponible: true });
  if (j.includes('pang2')) liste.push({ id: 'pang2', nom: 'second porte-avions de nouvelle génération', enService: true, disponible: true });
  // Porte-avions commandés en plus (commandes supplémentaires de l'écran Armées)
  for (let i = 1; i <= Math.floor(e.defense?.capacites?.porteAvionsSupp ?? 0); i++) liste.push({ id: `pa_supp_${i}`, nom: `porte-avions supplémentaire n° ${i}`, enService: true, disponible: true });
  if (!j.includes('cdg_retrait')) {
    const atm = j.includes('cdg_atm3') && !j.includes('cdg_atm3_fin');
    liste.push({ id: 'cdg', nom: 'Charles-de-Gaulle', enService: true, disponible: !atm, arretTechnique: atm, motif: atm ? 'Le Charles-de-Gaulle est en arrêt technique majeur à Toulon (rechargement des réacteurs) jusqu\'à fin 2028 environ : pas de porte-avions disponible.' : null });
  }
  return liste;
}

/** Escorte type d'un groupe aéronaval (frégate de défense aérienne, FREMM, SNA, ravitailleur). */
export const ESCORTE_TYPE = { fda: 1, fremm: 2, sna: 1, brf: 1, pha: 1 };
/** Renfort facultatif : le porte-hélicoptères amphibie accompagne le groupe s'il est disponible, sans être indispensable. */
const FACULTATIFS = new Set(['pha']);
const NOMS_ESCORTE = { fda: 'frégate de défense aérienne', fremm: 'frégate multi-missions', sna: 'sous-marin nucléaire d\'attaque', brf: 'ravitailleur', pha: 'porte-hélicoptères amphibie' };

/**
 * Composition des groupes aéronavals pour la vue 3D du président : porte-avions
 * en service et escorte (dont une FREMM anti-sous-marine et son Caïman Marine,
 * et un porte-hélicoptères en renfort) prélevée sur les bâtiments disponibles (environ deux
 * sur trois : les autres sont en entretien ou en entraînement), groupe 1 servi
 * en premier. Indique ce qui manque au second groupe.
 */
export function compositionGroupes(e) {
  const c = e.defense?.capacites ?? {};
  const disponibles = Object.fromEntries(Object.keys(ESCORTE_TYPE).map((k) => {
    const n = Math.floor(c[k] ?? 0);
    return [k, n > 0 ? Math.max(1, Math.floor((n * 2) / 3)) : 0];
  }));
  const reste = { ...disponibles };
  const groupes = flotte(e).slice(0, 2).map((pa, i) => {
    const escorte = {};
    const manques = [];
    for (const [k, besoin] of Object.entries(ESCORTE_TYPE)) {
      escorte[k] = Math.min(besoin, reste[k]);
      reste[k] -= escorte[k];
      if (escorte[k] < besoin && !FACULTATIFS.has(k)) manques.push(`${besoin - escorte[k] > 1 ? `${besoin - escorte[k]} ` : ''}${NOMS_ESCORTE[k]}${besoin - escorte[k] > 1 ? 's' : ''}`);
    }
    const position = i === 0 ? e.geopolitique?.gan?.position : e.geopolitique?.gan2?.position;
    return { numero: i + 1, porteAvions: pa.id === 'cdg' ? 'cdg' : 'pang', nom: pa.id === 'france_libre' ? 'France Libre' : pa.nom, position: position ?? 'toulon', escorte, manques };
  });
  return { groupes, disponibles };
}

const nouveauGroupe = () => ({ position: 'toulon', potentiel: 100, trimestresEnMer: 0, maintenance: 0 });
/** Porte-avions d'un groupe (1 : le plus récent, 2 : le second). */
const porteAvionsDuGroupe = (e, numero) => (numero === 2 ? flotte(e)[1] : porteAvions(e));

/**
 * Ordonne le déplacement du groupe aéronaval vers un théâtre (ou le retour à Toulon).
 * @returns {object} { texte } ou { erreur }
 */
export function deplacerGroupe(e, destination, numero = 1) {
  if (!actif(e)) return { erreur: 'Disponible pour la France.' };
  if (!e.geopolitique) initialiserGeopolitique(e); // sauvegarde antérieure au module
  const g = numero === 2 ? e.geopolitique.gan2 : e.geopolitique.gan;
  if (!g) return { erreur: 'Un second groupe aéronaval suppose deux porte-avions en service.' };
  const t = THEATRES[destination];
  if (!t) return { erreur: 'Destination inconnue.' };
  if (g.position === destination) return { erreur: 'Le groupe aéronaval y est déjà.' };
  const pa = porteAvionsDuGroupe(e, numero) ?? porteAvions(e);
  if (!t.base && !pa.disponible) return { erreur: pa.motif ?? 'Aucun porte-avions disponible.' };
  if (!t.base && g.maintenance > 0) return { erreur: `Entretien en cours à Toulon : encore ${g.maintenance} trimestre(s).` };
  if (!t.base && g.potentiel < t.usure) return { erreur: 'Potentiel insuffisant : le groupe doit rentrer à Toulon pour son entretien.' };
  const depart = THEATRES[g.position]?.court ?? g.position;
  g.position = destination;
  if (t.base) g.trimestresEnMer = 0;
  const nom = e.geopolitique.gan2 ? `Le groupe aéronaval du ${pa.nom}` : 'Le groupe aéronaval';
  const texte = t.base ? `${nom} rentre à Toulon (depuis : ${depart}).` : `${nom} appareille pour : ${t.nom}.`;
  e.journal.push({ tour: e.tour, trimestre: libelleTrimestre(e.trimestre), type: 'politique', texte: `Géopolitique — ${texte}` });
  e.geopolitique.historique.push({ tour: e.tour, position: destination });
  return { texte };
}

/** Effets d'un trimestre de présence : influence, relations, tension apaisée, coût, usure. */
function presence(e, id, g) {
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
  g.potentiel = Math.max(0, g.potentiel - t.usure);
  g.trimestresEnMer += 1;
}

/**
 * Trimestre : présence et usure du groupe aéronaval, entretien à Toulon,
 * évolution des tensions (aléa séparé). Appelé avant le calcul des dépenses.
 */
export function majGeopolitique(e) {
  if (!actif(e)) return;
  if (!e.geopolitique) initialiserGeopolitique(e);
  const x = e.geopolitique;
  const lib = libelleTrimestre(e.trimestre);
  // Deux porte-avions en service : un second groupe aéronaval ; un seul : il est dissous
  const navires = flotte(e);
  if (navires.length >= 2 && !x.gan2) {
    x.gan2 = nouveauGroupe();
    e.journal.push({ tour: e.tour, trimestre: lib, type: 'reforme', texte: `Géopolitique — Deux porte-avions en service (${navires[0].nom} et ${navires[1].nom}) : la France peut déployer deux groupes aéronavals à la fois.` });
  } else if (navires.length < 2 && x.gan2) {
    e.journal.push({ tour: e.tour, trimestre: lib, type: 'politique', texte: 'Géopolitique — Plus qu\'un porte-avions en service : le second groupe aéronaval est dissous.' });
    x.gan2 = null;
  }
  for (const [g, pa, nom] of [[x.gan, porteAvions(e), 'Le groupe aéronaval'], [x.gan2, navires[1], `Le groupe aéronaval du ${navires[1]?.nom}`]]) {
    if (!g) continue;
    // Porte-avions indisponible (arrêt technique, retrait) : le groupe rentre à Toulon
    if (!pa.disponible && g.position !== 'toulon') {
      e.journal.push({ tour: e.tour, trimestre: lib, type: 'alerte', texte: `Géopolitique — ${pa.motif} ${nom} rentre à Toulon.` });
      g.position = 'toulon';
      g.trimestresEnMer = 0;
    }
    if (g.position === 'toulon') {
      if (g.maintenance > 0) g.maintenance -= 1;
      g.potentiel = Math.min(100, g.potentiel + 40);
    } else {
      presence(e, g.position, g);
      // Potentiel épuisé : retour obligatoire et entretien
      if (g.potentiel < 15) {
        e.journal.push({ tour: e.tour, trimestre: lib, type: 'alerte', texte: `Géopolitique — Après ${g.trimestresEnMer} trimestre(s) en mer, ${nom.charAt(0).toLowerCase()}${nom.slice(1)} rentre à Toulon pour son entretien.` });
        g.position = 'toulon';
        g.trimestresEnMer = 0;
        g.maintenance = 1;
      }
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
  const navires = flotte(e);
  return {
    gan: { ...x.gan, porteAvions: porteAvions(e) },
    gan2: x.gan2 ? { ...x.gan2, porteAvions: navires[1] ?? null } : null,
    flotte: navires,
    theatres: Object.entries(THEATRES).map(([id, t]) => ({ id, ...t, tensionActuelle: t.base ? null : x.tensions[id], present: x.gan.position === id || x.gan2?.position === id })),
    bonusExport: x.bonusExport,
  };
}
