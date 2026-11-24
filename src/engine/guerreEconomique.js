/**
 * Guerre économique (France) : mesures du Gouvernement contre une grande
 * puissance (États-Unis, Chine, Russie), ripostes de l'adversaire, effets
 * sur les exportations, les prix, les secteurs visés et les relations ;
 * crises commerciales subies (menace de droits de douane américains,
 * restrictions chinoises sur les terres rares) ; trêves.
 *
 * Tous les tirages (accord de Bruxelles, ripostes, crises) ont un aléa
 * séparé : le reste de la partie n'en est pas modifié. Sans guerre en cours,
 * rien ne change ; le choix par défaut des crises subies (négocier par
 * l'intermédiaire de la Commission) ne touche qu'à la tension commerciale.
 */
import { CIBLES, MESURES, EXPORTS_PERDUS, PRIX_PAR_CRAN, ECART_CRISES } from '../data/guerreEconomique.js';
import { creerAleatoire } from './aleatoire.js';
import { appliquerChocs } from './social.js';
import { borner } from '../model/outils.js';
import { libelleTrimestre } from './calendrier.js';

const actif = (e) => e.pays === 'france';
const aleaGuerre = (e, sel = 0) => creerAleatoire(((e.graine ^ Math.imul(e.tour + 113, 2246822519)) + 0x27d4eb2f + sel) >>> 0);
const GROUPES = ['jeunes', 'salaries', 'fonctionnaires', 'entrepreneurs', 'agriculteurs', 'retraites'];

/** État (créé à la demande). */
export function etatGuerre(e) {
  if (!actif(e)) return null;
  e.guerreEconomique ??= { conflits: {}, tension: {}, derniereCrise: -99, historique: [] };
  return e.guerreEconomique;
}

function conflit(e, cible) {
  const g = etatGuerre(e);
  g.conflits[cible] ??= { niveau: 0, riposte: 0, debut: e.tour, trimestres: 0, mesures: [] };
  return g.conflits[cible];
}

const relation = (e, p, v) => {
  const r = e.international?.relations;
  if (p && r?.[p] !== undefined) r[p] = borner(r[p] + v, -100, 100);
};
/** Choc de prix étalé sur quatre trimestres (s'ajoute aux chocs déjà en attente). */
function chocPrix(e, total) {
  const q = e.macro.chocsPrixEnAttente;
  for (let k = 0; k < 4; k++) q[k] = (q[k] ?? 0) + total / 4;
}

/** Chance d'obtenir l'accord des partenaires européens pour une mesure de l'Union. */
export function chanceAccordUE(e, cible, mesure) {
  const r = e.international?.relations ?? {};
  let p = 0.45 + (r.ue ?? 0) / 200 + (r.allemagne ?? 0) / 300;
  if (cible === 'etatsUnis' && (e.guerreEconomique?.conflits?.etatsUnis?.riposte ?? 0) >= 1) p += 0.15; // l'Union fait bloc face à une agression
  if (cible === 'chine') p -= 0.12; // l'Allemagne craint pour ses exportations et ses usines en Chine
  if (cible === 'russie') p += 0.15;
  if (mesure === 'anti_coercition') p -= 0.1;
  return borner(p, 0.1, 0.9);
}

/**
 * Applique une mesure de guerre économique (décision du Gouvernement ou choix d'une crise).
 * @returns {object} { ok, texte, erreur }
 */
export function deciderGuerreEconomique(e, { cible, mesure } = {}) {
  const g = etatGuerre(e);
  const c0 = CIBLES[cible];
  const m = MESURES[mesure];
  if (!g || !c0 || !m) return { ok: false, erreur: 'Mesure inconnue.' };
  if (m.seulement && !m.seulement.includes(cible)) return { ok: false, erreur: 'Mesure sans objet pour ce pays.' };
  const c = conflit(e, cible);
  if (m.requiert && c.niveau < m.requiert) return { ok: false, erreur: 'Il faut d\'abord des droits de douane de riposte.' };
  const lib = libelleTrimestre(e.trimestre);
  const journal = (texte, type = 'politique') => { e.journal.push({ tour: e.tour, trimestre: lib, type, texte: `Guerre économique (${c0.nom}) : ${texte}` }); return { ok: true, texte }; };
  if (m.niveau < 0) {
    if (c.niveau === 0 && c.riposte === 0) return { ok: false, erreur: 'Aucune guerre économique en cours avec ce pays.' };
    const avant = c.niveau;
    c.niveau = m.niveau === -9 ? 0 : Math.max(0, c.niveau - 1);
    relation(e, c0.relation, mesure === 'cesser' ? 5 : 3);
    if (mesure === 'cesser' && e.international) e.international.bonusInfluence -= 1;
    c.mesures.push({ tour: e.tour, mesure });
    // Les droits de riposte levés font baisser les prix importés
    if (avant > c.niveau) chocPrix(e, -PRIX_PAR_CRAN * c0.poids * (avant - c.niveau) * 0.5);
    return journal(mesure === 'cesser' ? 'la France lève ses mesures et propose une trêve.' : `ouverture de négociations ; la France retire une partie de ses mesures (intensité ${c.niveau}/3).`);
  }
  if (c.niveau >= m.niveau && mesure !== 'sanctions') return { ok: false, erreur: 'Mesure déjà en vigueur.' };
  if (m.ue) {
    const p = chanceAccordUE(e, cible, mesure);
    const accord = aleaGuerre(e, 7 + Object.keys(MESURES).indexOf(mesure)).tirage(p);
    if (!accord) {
      relation(e, 'allemagne', -2);
      return journal(`Paris demande à Bruxelles ${m.texte}, mais les États membres refusent (chance estimée : ${Math.round(p * 100)} %). L'Allemagne redoute une escalade.`, 'alerte');
    }
  }
  const avant = c.niveau;
  if (c.niveau === 0 && c.riposte === 0) {
    c.debut = e.tour;
    c.trimestres = 0;
    // Tenir tête à une puissance qui fait pression : sursaut national les premiers temps
    appliquerChocs(e, Object.fromEntries(GROUPES.map((x) => [x, 1])));
    if (e.international) e.international.bonusInfluence += 1;
  }
  c.niveau = Math.min(3, Math.max(c.niveau, m.niveau));
  c.mesures.push({ tour: e.tour, mesure });
  relation(e, c0.relation, -5 * Math.max(1, c.niveau - avant));
  if (cible === 'chine') relation(e, 'allemagne', -2);
  if (cible === 'russie') { relation(e, 'ukraine', 3); relation(e, 'pologne', 2); }
  if (m.ue) relation(e, 'ue', 1);
  // Droits de douane sur les importations : hausse des prix (étalée sur un an)
  if (mesure !== 'controle_investissements' && c.niveau > avant) chocPrix(e, PRIX_PAR_CRAN * c0.poids * (c.niveau - avant));
  // Sanctions contre la Russie : tension sur le prix de l'énergie
  if (mesure === 'sanctions' && e.monde) e.monde.energie *= 1.03;
  return journal(`${m.texte} (intensité ${c.niveau}/3). Les secteurs exposés (${c0.secteurs}) craignent des représailles.`);
}

/**
 * Trimestre : exportations perdues sous les ripostes de l'adversaire,
 * secteurs touchés, relations qui se dégradent, ripostes et trêves (aléa séparé).
 */
export function majGuerreEconomique(e) {
  const g = actif(e) ? e.guerreEconomique : null;
  if (!g) return;
  const lib = libelleTrimestre(e.trimestre);
  for (const [cible, c] of Object.entries(g.conflits)) {
    if (c.niveau === 0 && c.riposte === 0) continue;
    const c0 = CIBLES[cible];
    const alea = aleaGuerre(e, 31 + Object.keys(CIBLES).indexOf(cible));
    c.trimestres += 1;
    // L'adversaire riposte (souvent à la hauteur, parfois au-delà), ou se retire quand la France désarme
    if (c.riposte < c.niveau && alea.tirage(0.6)) {
      c.riposte += 1;
      e.journal.push({ tour: e.tour, trimestre: lib, type: 'alerte', texte: `Guerre économique : ${c0.nom === 'États-Unis' ? 'Washington' : c0.nom === 'Chine' ? 'Pékin' : 'Moscou'} riposte et frappe ${c0.secteurs} (intensité ${c.riposte}/3).` });
      (e.resultatsTour.alertes ??= []).push(`Riposte : ${c0.nom}`);
    } else if (c.riposte >= c.niveau && c.riposte < 3 && c.niveau >= 2 && alea.tirage(0.12)) {
      c.riposte += 1;
      e.journal.push({ tour: e.tour, trimestre: lib, type: 'alerte', texte: `Guerre économique : escalade, ${c0.nom} élargit ses représailles (intensité ${c.riposte}/3).` });
    } else if (c.riposte > c.niveau && alea.tirage(0.5)) {
      c.riposte -= 1;
    }
    // Exportations perdues et secteurs touchés
    if (c.riposte > 0) {
      e.international.chocExport -= EXPORTS_PERDUS[c.riposte] * c0.poids;
      appliquerChocs(e, { agriculteurs: -0.5 * c.riposte * c0.poids, entrepreneurs: -0.4 * c.riposte * c0.poids, salaries: -0.15 * c.riposte * c0.poids });
    }
    relation(e, c0.relation, -1.5 * c.niveau);
    // Trêve proposée par l'adversaire, quand le conflit dure et coûte aux deux
    if (c.niveau >= 2 && c.trimestres >= 3 && !g.treveProposee && alea.tirage(0.15)) g.treveProposee = { cible, tour: e.tour };
    if (c.niveau === 0 && c.riposte === 0) g.historique.push({ cible, debut: c.debut, fin: e.tour });
  }
}

const NOMS_CAPITALE = { etatsUnis: 'Washington', chine: 'Pékin', russie: 'Moscou' };

/**
 * Après les autres événements : une trêve proposée par l'adversaire, ou une
 * crise commerciale subie (menace américaine, terres rares chinoises).
 */
export function injecterCrisesCommerciales(e, max = 3) {
  const g = etatGuerre(e);
  if (!g || e.evenements.enAttente.length >= max + 1) return;
  const pousser = (id, titre) => {
    const def = EVENEMENTS_GUERRE_ECO.find((x) => x.id === id);
    e.evenements.enAttente.push({ id, titre, description: def.description(e), choix: def.choix.map((c) => ({ id: c.id, texte: c.texte })), tour: e.tour, guerreEconomique: true });
  };
  if (g.treveProposee) {
    g.cibleTreve = g.treveProposee.cible;
    g.treveProposee = null;
    pousser('treve_commerciale', `${NOMS_CAPITALE[g.cibleTreve]} propose une trêve commerciale`);
    return;
  }
  if (e.tour - g.derniereCrise < ECART_CRISES) return;
  const alea = aleaGuerre(e, 3);
  const r = e.international?.relations ?? {};
  if (!(g.conflits.etatsUnis?.niveau >= 2) && alea.tirage(0.025 + ((r.etatsUnis ?? 0) < 0 ? 0.02 : 0))) {
    g.derniereCrise = e.tour;
    pousser('menace_tarifs_us', 'Washington menace de doubler ses droits de douane sur l\'Union');
    return;
  }
  if (!(g.conflits.chine?.niveau >= 2) && alea.tirage(0.022 + ((r.chine ?? 0) < -20 ? 0.02 : 0))) {
    g.derniereCrise = e.tour;
    pousser('terres_rares', 'Pékin durcit ses restrictions sur les terres rares');
  }
}

/** Effets des choix des crises commerciales (appelé par le moteur des événements). */
export function appliquerEffetsGuerre(e, eff) {
  const g = etatGuerre(e);
  if (!g) return;
  for (const [cible, v] of Object.entries(eff.tensionCommerciale ?? {})) g.tension[cible] = (g.tension[cible] ?? 0) + v;
  if (eff.mesureGuerre) {
    const r = deciderGuerreEconomique(e, eff.mesureGuerre);
    if (r.erreur && e.resultatsTour) (e.resultatsTour.guerreEconomique ??= []).push(r);
  }
  if (eff.treve) {
    const c = g.conflits[eff.treve];
    if (c) {
      if (c.niveau > 0) chocPrix(e, -PRIX_PAR_CRAN * CIBLES[eff.treve].poids * c.niveau * 0.5);
      c.niveau = 0; c.riposte = 0;
      relation(e, CIBLES[eff.treve].relation, 6);
      g.historique.push({ cible: eff.treve, debut: c.debut, fin: e.tour });
    }
  }
}

/**
 * Crises commerciales subies, pour le catalogue des événements : jamais tirées
 * par le moteur des événements (elles sont injectées ci-dessus).
 */
export const EVENEMENTS_GUERRE_ECO = [
  {
    id: 'menace_tarifs_us', titre: 'Washington menace de doubler ses droits de douane sur l\'Union', pays: ['france'], condition: () => false, probabilite: () => 0, guerreEconomique: true,
    description: () => `La Maison-Blanche menace de porter de 15 % à 30 % les droits de douane sur la plupart des produits européens si l'Union ne réduit pas son excédent commercial et ne renonce pas à réguler les géants américains du numérique. ${CIBLES.etatsUnis.contexte}`,
    choix: [
      { id: 'negocier', texte: 'Laisser la Commission négocier un report, sans riposte', effets: () => ({ tensionCommerciale: { etatsUnis: 10 }, texte: 'La Commission obtient un report de la menace ; les discussions continuent.' }) },
      { id: 'riposter', texte: 'Exiger une riposte européenne : droits de douane sur les produits américains', effets: () => ({ mesureGuerre: { cible: 'etatsUnis', mesure: 'riposte_ue' }, texte: 'Paris demande à Bruxelles une riposte immédiate.' }) },
      { id: 'concessions', texte: 'Désamorcer : acheter davantage de gaz naturel liquéfié et d\'armement américains', effets: () => ({ relations: { etatsUnis: 4, ue: -2, allemagne: -1 }, influence: -1, texte: 'Washington salue le geste ; plusieurs partenaires européens dénoncent une concession unilatérale.' }) },
    ],
  },
  {
    id: 'terres_rares', titre: 'Pékin durcit ses restrictions sur les terres rares', pays: ['france'], condition: () => false, probabilite: () => 0, guerreEconomique: true,
    description: () => `Pékin impose de nouvelles licences pour exporter des terres rares et des aimants : des usines automobiles et d'armement européennes risquent l'arrêt faute de pièces. ${CIBLES.chine.contexte}`,
    choix: [
      { id: 'negocier', texte: 'Négocier, avec la Commission, des licences pour l\'industrie européenne', effets: () => ({ tensionCommerciale: { chine: 10 }, texte: 'Pékin accorde des licences au compte-gouttes ; les industriels restent inquiets.' }) },
      { id: 'anti_coercition', texte: 'Riposter : droits de douane européens, puis instrument anti-coercition', effets: () => ({ mesureGuerre: { cible: 'chine', mesure: 'riposte_ue' }, texte: 'Paris demande à Bruxelles de riposter.' }) },
      { id: 'stocks', texte: 'Plan de souveraineté : stocks stratégiques, recyclage et mines en Europe (0,4 Md€)', effets: () => ({ depensesExceptionnelles: 0.4, relations: { chine: -2 }, chocs: { entrepreneurs: 1 }, texte: 'L\'État lance des achats communs et finance une usine de recyclage d\'aimants ; il faudra des années pour réduire la dépendance.' }) },
    ],
  },
  {
    id: 'treve_commerciale', titre: 'Proposition de trêve commerciale', pays: ['france'], condition: () => false, probabilite: () => 0, guerreEconomique: true,
    description: (e) => {
      const cible = e.guerreEconomique?.cibleTreve ?? 'etatsUnis';
      const c = e.guerreEconomique?.conflits?.[cible];
      return `${NOMS_CAPITALE[cible]} propose de suspendre les mesures de part et d'autre et d'ouvrir des négociations. La guerre économique dure depuis ${c?.trimestres ?? 0} trimestre(s) : vos mesures sont d'intensité ${c?.niveau ?? 0}/3, ses représailles d'intensité ${c?.riposte ?? 0}/3.`;
    },
    choix: [
      { id: 'accepter', texte: 'Accepter la trêve', effets: (e) => ({ treve: e.guerreEconomique?.cibleTreve ?? 'etatsUnis', texte: 'Les deux camps suspendent leurs mesures ; les échanges reprennent peu à peu.' }) },
      { id: 'refuser', texte: 'Refuser : maintenir la pression', effets: (e) => { const rel = CIBLES[e.guerreEconomique?.cibleTreve ?? 'etatsUnis'].relation; return { relations: rel ? { [rel]: -3 } : {}, fierte: 0.5, texte: 'Paris maintient ses mesures ; l\'adversaire promet de nouvelles représailles.' }; } },
    ],
  },
];

/** Résumé pour l'interface. */
export function resumeGuerreEconomique(e) {
  if (!actif(e)) return null;
  const g = e.guerreEconomique ?? { conflits: {}, tension: {}, historique: [] };
  return {
    cibles: Object.entries(CIBLES).map(([id, c]) => {
      const x = g.conflits[id] ?? { niveau: 0, riposte: 0, trimestres: 0, mesures: [] };
      const mesures = Object.entries(MESURES).filter(([, m]) => !m.seulement || m.seulement.includes(id)).map(([mid, m]) => ({
        id: mid, nom: m.nom, ue: m.ue, chance: m.ue ? chanceAccordUE(e, id, mid) : null,
        possible: m.niveau < 0 ? (x.niveau > 0 || x.riposte > 0) : (m.requiert ? x.niveau >= m.requiert : true) && (mid === 'sanctions' || x.niveau < m.niveau),
      }));
      return { id, nom: c.nom, contexte: c.contexte, secteurs: c.secteurs, poids: c.poids, niveau: x.niveau, riposte: x.riposte, trimestres: x.trimestres, tension: g.tension[id] ?? 0, mesures, sources: c.sources, perteExports: EXPORTS_PERDUS[x.riposte] * c.poids * 5 };
    }),
    historique: g.historique.slice(-6).reverse(),
  };
}
