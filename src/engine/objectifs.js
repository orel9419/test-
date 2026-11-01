/**
 * Objectifs du mandat, générés automatiquement à partir de la situation de
 * départ et du régime politique.
 *
 * Les objectifs sont stockés dans l'état sous forme de données (sérialisables
 * pour la sauvegarde) ; les fonctions de mesure sont dans le registre MESURES.
 */
import { borner } from '../model/outils.js';

/** Registre des mesures : fonction qui renvoie la valeur courante d'un indicateur. */
export const MESURES = {
  deficit: (e) => e.finances.historiqueDeficit.reduce((s, x) => s + x, 0) / e.finances.historiqueDeficit.length,
  dette: (e) => e.finances.detteRatio,
  spread: (e) => e.finances.spread,
  defense: (e) => e.budget.defense.montant / e.macro.pibNominal * 100,
  emissions: (e) => e.climat.emissions,
  chomage: (e) => e.macro.chomage,
  effortRD: (e) => e.recherche?.effortPctPIB ?? e.statique.stocksInitiaux.recherche,
  cohesion: (e) => e.social.cohesion,
  popularite: (e) => e.social.popularite,
  influence: (e) => e.international.influence,
  pouvoirAchatModestes: (e) => {
    const m = e.menages.filter((x) => ['smic', 'jeune', 'agriculteur'].includes(x.id));
    return m.reduce((s, x) => s + (x.variationPct ?? 0), 0) / m.length;
  },
  survie: (e) => (e.issue?.cause && e.issue.type === 'defaite' ? 0 : 1),
  budget2027: (e) => (e.politique.budgetsAdoptes.includes(2027) ? 1 : 0),
  presidentielle: (e) => e.politique.presidentielle?.resultat ?? projectionPresidentielle(e),
  coalition: (e) => (e.politique.coalition && !e.politique.coalition.rompue ? e.politique.coalition.satisfaction : 0),
  schuldenbremse: (e) => e.finances.depassementsSchuldenbremse ?? 0,
  afd: (e) => e.politique.intentions?.AFD ?? 0,
  // 1 si le chancelier reste en place après le scrutin (ou si une majorité sans l'AfD est possible d'après les sondages)
  // États-Unis
  siegesRepublicains: (e) => e.politique.groupes.filter((g) => g.id !== 'DEM').reduce((s, g) => s + g.sieges, 0),
  trimestresShutdown: (e) => (e.politique.shutdowns ?? []).reduce((s, x) => s + x.trimestres, 0) + (e.politique.shutdown?.trimestres ?? 0),
  pasDeDefaut: (e) => (e.issue?.cause === 'defaut' || (e.politique.plafondDette?.trimestresMesuresExceptionnelles ?? 0) >= 3 ? 0 : 1),
  presidentielleEtatsUnis: (e) => e.politique.presidentielle?.resultat ?? projectionPresidentielleEtatsUnis(e),
  epuisementSocialSecurity: (e) => e.retraites.fondsSS?.epuisementProjete ?? 2100,
  election2029: (e) => {
    const pol = e.politique;
    if (pol.dernierScrutin) return pol.dernierScrutin.victoire ? 1 : 0;
    const i = pol.intentions ?? {};
    const representes = ['CDUCSU', 'AFD', 'SPD', 'GRUENE', 'LINKE'].filter((k) => (i[k] ?? 0) >= 5);
    const total = representes.reduce((s, k) => s + i[k], 0) || 1;
    const part = (k) => (representes.includes(k) ? i[k] / total : 0);
    return (part('CDUCSU') + part('SPD') >= 0.5 || part('CDUCSU') + part('SPD') + part('GRUENE') >= 0.5) && part('CDUCSU') >= part('SPD') ? 1 : 0;
  },
};

/** Projection du second tour de la présidentielle (France), avant le scrutin. */
export function projectionPresidentielle(e) {
  const m = e.macro;
  return (e.politique.presidentielle?.partCamp ?? 50) + 0.6 * (e.social.popularite - 26) + 1.5 * (m.croissanceAnnuelle - 0.5)
    - 1.5 * (m.chomage - 8.3) - 1.0 * Math.max(0, m.inflation - 2) + 0.2 * (e.social.cohesion - 70);
}

/**
 * Projection de la présidentielle américaine (part bipartite du candidat de
 * votre camp) : popularité du président, croissance, chômage et inflation.
 */
export function projectionPresidentielleEtatsUnis(e) {
  const m = e.macro;
  return 50 + 0.6 * (e.social.popularite - 42) + 1.2 * (m.croissanceAnnuelle - 2) - 1.5 * (m.chomage - 4.2) - 1.0 * Math.max(0, m.inflation - 2.5);
}

/** Facteur de difficulté des cibles selon le mode. */
const EXIGENCE = { facile: 0.7, intermediaire: 1, expert: 1.2 };

/**
 * Règles de génération. Chaque règle : condition (sur l'état de départ),
 * priorité (plus elle est élevée, plus l'objectif est principal), et
 * fabrique de l'objectif.
 */
const REGLES = [
  {
    id: 'deficit',
    condition: (e) => e.statique.regles.ue && MESURES.deficit(e) > 3,
    priorite: (e) => MESURES.deficit(e) - 3 + 1,
    creer: (e, k) => ({
      nom: e.statique.regles.ue.pde ? 'Ramener le déficit sous 3 % du PIB (règles européennes)' : 'Réduire le déficit public',
      description: `Déficit de départ : ${MESURES.deficit(e).toFixed(1)} % du PIB. La procédure européenne pour déficit excessif exige un retour sous 3 %.`,
      mesure: 'deficit', sens: '<=', cible: Math.round((e.statique.regles.ue.pde ? 3 + (1 - k) : Math.max(2, MESURES.deficit(e) - 1.5 * k)) * 10) / 10,
    }),
  },
  {
    id: 'deficitFederal',
    condition: (e) => e.statique.regles.nationale?.type === 'plafond_dette',
    priorite: (e) => MESURES.deficit(e) - 3,
    creer: (e, k) => ({
      nom: 'Réduire le déficit fédéral',
      description: `Déficit fédéral de départ : ${MESURES.deficit(e).toFixed(1)} % du PIB, avec des intérêts qui dépassent 1 000 Md$ par an, plus que le budget de la défense.`,
      mesure: 'deficit', sens: '<=', cible: Math.round((MESURES.deficit(e) - 1.2 * k) * 10) / 10,
    }),
  },
  {
    id: 'socialSecurity',
    condition: (e) => !!e.retraites.fondsSS,
    priorite: () => 1.2,
    creer: (e, k) => ({
      nom: 'Repousser l\'épuisement du fonds de la Social Security',
      description: `Épuisement projeté du fonds combiné : ${MESURES.epuisementSocialSecurity(e)} (2032 pour le seul fonds retraite). Ensuite, les pensions baisseraient automatiquement d'environ 20 %.`,
      mesure: 'epuisementSocialSecurity', sens: '>=', cible: MESURES.epuisementSocialSecurity(e) + Math.round(3 * k),
    }),
  },
  {
    id: 'dette',
    condition: (e) => MESURES.dette(e) > 90,
    priorite: (e) => (MESURES.dette(e) - 90) / 10,
    creer: (e, k) => ({
      nom: 'Stabiliser la dette publique',
      description: `Dette de départ : ${MESURES.dette(e).toFixed(1)} % du PIB. Sans mesure, elle dépasserait 130 % en 2031.`,
      mesure: 'dette', sens: '<=', cible: Math.round(MESURES.dette(e) + 4 / k),
    }),
  },
  {
    id: 'marches',
    condition: (e) => MESURES.spread(e) > 80,
    priorite: (e) => MESURES.spread(e) / 60,
    creer: (e, k) => ({
      nom: 'Regagner la confiance des marchés',
      description: `L'écart de taux avec l'Allemagne est de ${Math.round(MESURES.spread(e))} points de base, au plus haut depuis 2012.`,
      mesure: 'spread', sens: '<=', cible: Math.round(150 / k),
    }),
  },
  {
    id: 'defense',
    condition: (e) => MESURES.defense(e) < 3.5,
    priorite: (e) => (3.5 - MESURES.defense(e)) * 0.8,
    creer: (e, k) => ({
      nom: 'Financer le réarmement (objectif OTAN)',
      description: `Défense : ${MESURES.defense(e).toFixed(1)} % du PIB. L'OTAN vise 3,5 % d'ici 2035 (sommet de La Haye, juin 2025).`,
      mesure: 'defense', sens: '>=', cible: Math.round((MESURES.defense(e) + 0.5 * k + (e.pays === 'allemagne' ? 0.4 : 0)) * 10) / 10,
    }),
  },
  {
    id: 'climat',
    condition: (e) => e.climat.objectif2030 && MESURES.emissions(e) > e.climat.objectif2030 * 1.05,
    priorite: (e) => (MESURES.emissions(e) / e.climat.objectif2030 - 1) * 5,
    creer: (e, k) => {
      const e0 = MESURES.emissions(e), obj = e.climat.objectif2030;
      return {
        nom: 'Tenir la trajectoire climatique',
        description: `Émissions : ${Math.round(e0)} MtCO2e, pour un objectif de ${obj} Mt en 2030.`,
        mesure: 'emissions', sens: '<=', cible: Math.round(e0 - (e0 - obj) * 0.6 * k),
      };
    },
  },
  {
    id: 'schuldenbremse',
    condition: (e) => e.statique.regles.nationale?.type === 'schuldenbremse',
    priorite: () => 2.5,
    creer: () => ({
      nom: 'Respecter le frein à l\'endettement chaque année',
      description: 'Règle constitutionnelle. Un dépassement expose à une censure de la Cour constitutionnelle et fâche la CDU/CSU.',
      mesure: 'schuldenbremse', sens: '<=', cible: 0,
    }),
  },
  {
    id: 'chomage',
    condition: (e) => MESURES.chomage(e) > 5,
    priorite: (e) => (MESURES.chomage(e) - 6) / 3,
    creer: (e, k) => ({ nom: 'Faire reculer le chômage', description: `Chômage de départ : ${MESURES.chomage(e)} %.`, mesure: 'chomage', sens: '<=', cible: Math.round((MESURES.chomage(e) - 0.8 * k) * 10) / 10 }),
  },
  {
    id: 'recherche',
    condition: () => true,
    priorite: () => 0.5,
    creer: (e, k) => ({ nom: 'Investir dans la recherche et l\'innovation', description: `Effort de R&D : ${MESURES.effortRD(e).toFixed(2)} % du PIB.`, mesure: 'effortRD', sens: '>=', cible: Math.round((MESURES.effortRD(e) + 0.15 * k) * 100) / 100 }),
  },
  {
    id: 'cohesion',
    condition: () => true,
    priorite: () => 0.4,
    creer: (e, k) => ({ nom: 'Préserver la cohésion sociale', description: 'Éviter les fractures : pouvoir d\'achat des plus modestes, mouvements sociaux.', mesure: 'cohesion', sens: '>=', cible: Math.round(65 * k) }),
  },
  {
    id: 'modestes',
    condition: () => true,
    priorite: () => 0.4,
    creer: () => ({ nom: 'Protéger le pouvoir d\'achat des ménages modestes', description: 'Ménages au salaire minimum, jeunes actifs, agriculteurs.', mesure: 'pouvoirAchatModestes', sens: '>=', cible: 0 }),
  },
  {
    id: 'afd',
    condition: (e) => e.pays === 'allemagne',
    priorite: () => 0.6,
    creer: (e, k) => ({ nom: 'Faire reculer l\'AfD', description: 'L\'AfD est à 27-30 % dans les sondages et en tête en Saxe-Anhalt et en Mecklembourg-Poméranie-Occidentale.', mesure: 'afd', sens: '<=', cible: Math.round(25 / k) }),
  },
];

/** Objectifs propres au régime (toujours principaux). */
function objectifsRegime(e) {
  const reel = e.calendrierChoisi !== 'mandat_complet';
  if (e.pays === 'france') {
    return [
      { id: 'survie', nom: 'Gouverner sans être renversé', description: 'Sans majorité, le gouvernement peut tomber sur une motion de censure (289 voix). Le PS (69 sièges) est le groupe pivot.', mesure: 'survie', sens: '>=', cible: 1 },
      { id: 'budget2027', nom: 'Faire adopter le budget 2027', description: 'Le PLF 2027 est en séance ; la commission des finances a rejeté sa partie recettes, le PS menace de censure.', mesure: 'budget2027', sens: '>=', cible: 1, echeanceTour: 1 },
      reel
        ? { id: 'presidentielle', nom: 'Préparer la présidentielle d\'avril 2027', description: 'Le RN est en tête des intentions de vote. Votre bilan pèsera sur les chances de votre camp au second tour (T2 2027).', mesure: 'presidentielle', sens: '>=', cible: 50, echeanceTour: 3 }
        : { id: 'presidentielle', nom: 'Laisser à votre camp une chance de gagner la prochaine présidentielle', description: 'Projection du second tour face au RN en fin de mandat, selon votre bilan.', mesure: 'presidentielle', sens: '>=', cible: 50 },
    ];
  }
  if (e.pays === 'etatsUnis') {
    return [
      { id: 'miMandat', nom: 'Limiter la défaite aux élections de mi-mandat', description: 'Les démocrates sont favoris (54,6 % du vote bipartite dans les sondages, 241 à 253 sièges projetés). Gardez au moins 190 sièges républicains à la Chambre pour peser dans un Congrès divisé.', mesure: 'siegesRepublicains', sens: '>=', cible: 190, echeanceTour: 1 },
      { id: 'shutdown', nom: 'Éviter les shutdowns', description: 'Le financement provisoire expire le 11 décembre 2026, puis chaque exercice commence le 1er octobre. Il faut 60 sénateurs : les démocrates ont la main.', mesure: 'trimestresShutdown', sens: '<=', cible: 0 },
      { id: 'defaut', nom: 'Éviter un défaut sur la dette', description: 'La dette brute approche le plafond légal de 41 100 Md$. Il faudra le relever avec le Congrès.', mesure: 'pasDeDefaut', sens: '>=', cible: 1 },
      reel
        ? { id: 'successeur', nom: 'Faire élire un successeur de votre camp en 2028', description: 'Le président ne peut pas se représenter (22e amendement). Votre bilan portera ou plombera le candidat républicain.', mesure: 'presidentielleEtatsUnis', sens: '>=', cible: 50, echeanceTour: 8 }
        : { id: 'successeur', nom: 'Laisser à votre camp une chance de garder la Maison-Blanche', description: 'Projection de la présidentielle selon votre bilan.', mesure: 'presidentielleEtatsUnis', sens: '>=', cible: 50 },
    ];
  }
  return [
    { id: 'coalition', nom: 'Garder la coalition unie', description: 'Le SPD est le partenaire indispensable : 328 sièges sur 630, soit 12 de marge. Les engagements de l\'accord de coalition sont suivis.', mesure: 'coalition', sens: '>=', cible: 20 },
    { id: 'budget2027', nom: 'Faire adopter le budget fédéral 2027', description: 'Vote prévu en novembre 2026 : 555,4 Md€ de dépenses et un endettement record.', mesure: 'budget2027', sens: '>=', cible: 1, echeanceTour: 1 },
    { id: 'election2029', nom: reel ? 'Rester chancelier après les élections de 2029' : 'Rester en position de gagner les prochaines élections', description: 'Garder la CDU/CSU devant ses partenaires et une majorité possible sans l\'AfD.', mesure: 'election2029', sens: '>=', cible: 1, ...(reel ? { echeanceTour: 10 } : {}) },
  ];
}

/** Génère les objectifs de départ (3 à 5 principaux, le reste secondaires). */
export function genererObjectifs(e) {
  const k = EXIGENCE[e.mode] ?? 1;
  const regime = objectifsRegime(e).map((o) => ({ ...o, type: 'principal', categorie: 'politique' }));
  const candidats = REGLES.filter((r) => r.condition(e))
    .map((r) => ({ regle: r, priorite: r.priorite(e) }))
    .sort((a, b) => b.priorite - a.priorite);
  const nbPrincipauxEco = Math.max(1, 5 - regime.length + 1); // 2 à 3 objectifs économiques principaux
  const objectifs = [...regime];
  candidats.forEach((c, i) => {
    const o = c.regle.creer(e, k);
    objectifs.push({ id: c.regle.id, ...o, type: i < nbPrincipauxEco ? 'principal' : 'secondaire', categorie: 'politique_publique' });
  });
  for (const o of objectifs) {
    o.depart = MESURES[o.mesure](e);
    o.valeur = o.depart;
    o.progression = 0;
    o.statut = 'en_cours';
  }
  return objectifs.filter((o, i) => o.type === 'principal' || i < 11);
}

/** Met à jour la valeur, la progression et le statut des objectifs. */
export function majObjectifs(e) {
  for (const o of e.objectifs) {
    if (o.statut === 'atteint' && o.echeanceTour) continue;
    if (o.statut === 'echoue') continue;
    o.valeur = MESURES[o.mesure](e);
    const atteint = o.sens === '<=' ? o.valeur <= o.cible : o.valeur >= o.cible;
    // Progression : chemin parcouru entre le départ et la cible
    if (o.depart === o.cible) o.progression = atteint ? 1 : 0;
    else o.progression = borner((o.valeur - o.depart) / (o.cible - o.depart), 0, 1);
    if (atteint) o.progression = 1;
    if (o.echeanceTour && e.tour >= o.echeanceTour) o.statut = atteint ? 'atteint' : 'echoue';
    else o.statut = atteint ? 'en_voie' : 'en_cours';
    if (o.mesure === 'survie' && !atteint) o.statut = 'echoue';
  }
}

/** Bilan final : un objectif « en voie » à la fin du mandat est atteint. */
export function cloturerObjectifs(e) {
  majObjectifs(e);
  for (const o of e.objectifs) if (o.statut === 'en_voie') o.statut = 'atteint'; else if (o.statut === 'en_cours') o.statut = 'echoue';
}
