/**
 * Propositions de deux think tanks aux orientations opposées, traduites en
 * réformes jouables (France) :
 * - la Fondation IFRAP (Agnès Verdier-Molinié), libérale, centrée sur la
 *   baisse de la dépense publique : programme de 110 Md€ d'économies
 *   (Revue n° 263, janvier 2025) et trajectoire de 180 Md€ d'économies d'ici
 *   2035 pour adopter une règle d'or (Revue n° 279, juin 2026) ;
 * - The Shift Project (Jean-Marc Jancovici), centré sur la décarbonation :
 *   « Plan robuste pour l'économie française » en 20 chantiers (14 avril 2026).
 *
 * Les montants de l'IFRAP sont les siens (économies en Md€, montée en charge) ;
 * le Shift Project ne chiffre pas le coût de son plan : coûts et émissions
 * évitées sont alors des hypothèses de jeu, signalées comme telles.
 * Conventions : voir src/data/reformes.js (Md€ par an aux prix de départ,
 * émissions évitées en MtCO2e par an).
 */

const rampe = (age, n) => Math.min(1, Math.max(0, (age + 1) / n));
const prix = (e) => e.macro.niveauPrix / 100;
const ans = (age) => Math.max(0, age) / 4;
const FR = ['france'];

/** Interpolation linéaire sur une liste de points [x, y] (plateau aux extrémités). */
function interpoler(points, x) {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x0, y0] = points[i - 1];
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return points.at(-1)[1];
}

/** Répartit des économies (Md€, positives) entre postes selon des poids ; renvoie des dépenses négatives. */
function repartir(e, montant, poids) {
  const depenses = {};
  const total = Object.entries(poids).filter(([id]) => e.budget[id]).reduce((s, [, p]) => s + p, 0);
  if (!total) return depenses;
  for (const [id, p] of Object.entries(poids)) if (e.budget[id]) depenses[id] = (depenses[id] ?? 0) - (montant * p) / total;
  return depenses;
}
const ajouter = (a, b) => { for (const [k, v] of Object.entries(b)) a[k] = (a[k] ?? 0) + v; return a; };

export const THINK_TANKS = {
  ifrap: {
    nom: 'Fondation IFRAP',
    icone: '📘',
    court: 'IFRAP',
    article: 'l\'IFRAP',
    deNom: 'de la Fondation IFRAP',
    description: 'Think tank libéral dirigé par Agnès Verdier-Molinié, spécialisé dans l\'évaluation des administrations et des politiques publiques. Il défend une baisse forte de la dépense publique, sans hausse d\'impôts, et un rapprochement des règles du public et du privé (retraites, temps de travail, absentéisme).',
    documents: [
      { texte: 'IFRAP, Revue n° 279 (juin 2026) : comment adopter une règle d\'or des finances publiques (180 Md€ d\'économies d\'ici 2035)', url: 'https://www.ifrap.org/sites/default/files/documents/2026-07/etude_ifrap_equilibre_des_comptes_publics.pdf' },
      { texte: 'IFRAP, Revue n° 263 (janvier 2025) : 110 Md€ de baisses de dépenses publiques pour sauver notre économie', url: 'https://www.ifrap.org/la-revue/110-mds-eu-de-baisses-de-depenses-publiques-pour-sauver-notre-economie' },
    ],
  },
  shift: {
    nom: 'The Shift Project',
    icone: '🌍',
    court: 'Shift Project',
    article: 'le Shift Project',
    deNom: 'de The Shift Project',
    description: 'Think tank de la décarbonation fondé par Jean-Marc Jancovici. Son « Plan robuste pour l\'économie française » (14 avril 2026) propose 20 chantiers pour atteindre la neutralité carbone en 2050, raisonnés surtout en flux physiques (énergie, matières, emplois) : son coût n\'est pas chiffré.',
    documents: [
      { texte: 'The Shift Project : « Réussir la transition dans l\'incertitude », premier volet du Plan robuste pour l\'économie française (avril 2026)', url: 'https://theshiftproject.org/publications/reussir-la-transition-dans-lincertitude/' },
      { texte: 'ICI (France Bleu) : transport, logement, agriculture, les 20 chantiers du Shift Project', url: 'https://www.ici.fr/infos/environnement/transport-logement-agriculture-les-20-chantiers-de-the-shift-project-pour-atteindre-la-neutralite-carbone-en-2050-7000543' },
      { texte: 'Connaissance des Énergies (AFP) : le Shift Project dévoile « 20 chantiers incontournables »', url: 'https://www.connaissancedesenergies.org/afp/shift-project-devoile-20-chantiers-incontournables-pour-esperer-la-neutralite-carbone-en-2050-260414' },
    ],
  },
};

const IFRAP_279 = THINK_TANKS.ifrap.documents[0];
const IFRAP_263 = THINK_TANKS.ifrap.documents[1];
const SHIFT = THINK_TANKS.shift.documents;

/**
 * Trajectoire de l'IFRAP (Revue n° 279) : économies cumulées par sous-secteur,
 * en Md€, années après l'entrée en vigueur (le plan commence en 2027).
 */
const TRAJECTOIRE_IFRAP = {
  etat: [[0, 18], [2, 65], [4, 94], [6, 98], [8, 100]], // État et opérateurs
  locales: [[0, 4], [2, 12], [4, 17], [6, 19], [8, 21]], // collectivités
  sociales: [[0, 7.7], [2, 27.8], [4, 46], [6, 54], [8, 59.2]], // Sécurité sociale, Unédic
  // Scénario alternatif (100 % dépense, prélèvements constants) : effort supplémentaire
  supplement: [[0, 15], [2, 29], [4, 21], [6, 11], [8, 8]],
};
/** Répartition indicative entre postes du budget (hypothèse de jeu) : le régalien est préservé. */
const POIDS_ETAT = { economieFinances: 0.25, education: 0.2, recherche: 0.07, culture: 0.05, travailEmploi: 0.12, logement: 0.08, ecologieEnergie: 0.08, transports: 0.08, agriculture: 0.04, affairesEtrangeres: 0.03 };
const POIDS_LOCALES = { economieFinances: 0.4, transports: 0.3, logement: 0.15, culture: 0.15 };
const POIDS_SOCIALES = { retraites: 0.38, sante: 0.38, protectionSociale: 0.19, travailEmploi: 0.05 };

export const REFORMES_THINK_TANKS = [
  // ======================================================================
  // FONDATION IFRAP
  // ======================================================================
  {
    id: 'ifrap_plan_2035',
    nom: 'Plan de l\'IFRAP : 180 Md€ d\'économies d\'ici 2035 pour une règle d\'or',
    categorie: 'depenses', pays: FR, vehicule: 'loi', orientation: 'liberale', inspirations: ['ifrap'],
    resume: 'Une trajectoire de « qualification » en dix ans : environ 30 Md€ d\'économies dès la première année, 105 Md€ au bout de trois ans, 180 Md€ au bout de neuf, dans l\'État, ses opérateurs, les collectivités et la Sécurité sociale, avant d\'activer une règle d\'or (équilibre des comptes sur le cycle économique).',
    pedagogie: 'L\'IFRAP s\'inspire du frein à l\'endettement allemand (emprunt fédéral limité à 0,35 % du PIB) et du modèle suisse (équilibre sur un cycle, compte de compensation qui oblige à corriger les dérapages). Sa trajectoire détaille les leviers : gel transitoire du point d\'indice, maîtrise des avancements, non-remplacement partiel des départs aidé par l\'IA, achats, immobilier, revue des subventions et des interventions, fusions d\'opérateurs, achats et investissement locaux, et pour la Sécurité sociale surtout la vieillesse et l\'assurance maladie. Selon l\'IFRAP, la dette reviendrait sous 105 à 108 % du PIB en 2035. Deux variantes : le scénario central mobilise aussi temporairement les recettes (hausse ciblée des prélèvements de l\'État), l\'alternatif repose à 100 % sur la dépense (jusqu\'à 29 Md€ de plus par an). Dans le jeu, la baisse de la dépense freine aussi l\'activité à court terme.',
    pour: ['Stopper la « boule de neige » de la dette : la charge d\'intérêts atteindrait 147 Md€ en 2032 selon l\'IFRAP', 'Effort réparti entre toutes les administrations, régalien préservé', 'Retrouver des marges pour la défense, le climat et le vieillissement'],
    contre: ['Choc sur les fonctionnaires (gel du point d\'indice) et les retraités', 'Ralentissement de l\'activité pendant la consolidation', 'Moins de services et d\'investissements publics non régaliens'],
    exemples: ['Allemagne : frein à l\'endettement inscrit dans la Loi fondamentale en 2009', 'Suisse : frein à l\'endettement depuis 2003, dette fédérale en baisse', 'Suède : plafond de dépenses et objectif d\'excédent depuis la fin des années 1990 (dette de 68,8 % à 35,1 % du PIB entre 1995 et 2025)'],
    sources: [IFRAP_279],
    options: [
      { id: 'central', nom: 'Scénario central : 180 Md€ d\'économies et hausse ciblée et temporaire des prélèvements', description: 'Règle d\'or atteignable vers 2031 selon l\'IFRAP.' },
      { id: 'alternatif', nom: 'Scénario alternatif IFRAP : 100 % dépense, sans hausse d\'impôts', description: 'Jusqu\'à 29 Md€ d\'économies de plus par an (pic au bout de trois ans).' },
    ],
    remplace: ['choc_depenses'],
    delai: 1,
    effets(e, o, age) {
      const t = ans(age);
      const p = prix(e);
      const etat = interpoler(TRAJECTOIRE_IFRAP.etat, t) * p;
      const locales = interpoler(TRAJECTOIRE_IFRAP.locales, t) * p;
      const sociales = interpoler(TRAJECTOIRE_IFRAP.sociales, t) * p;
      const supplement = o === 'alternatif' ? interpoler(TRAJECTOIRE_IFRAP.supplement, t) * p : 0;
      const depenses = repartir(e, etat + supplement * 0.85, POIDS_ETAT);
      ajouter(depenses, repartir(e, locales, POIDS_LOCALES));
      ajouter(depenses, repartir(e, sociales + supplement * 0.15, POIDS_SOCIALES));
      const total = etat + locales + sociales + supplement;
      // Scénario central : hausse ciblée des prélèvements (+0,7 point de PIB au pic, +0,2 point ensuite)
      const recettes = o === 'central' ? { fixe: (e.macro.pibNominal / 100) * interpoler([[0, 0.2], [2, 0.7], [4, 0.2]], t) } : {};
      const part = total / Math.max(1, e.finances.depenses + total);
      return {
        depenses, recettes,
        offreTravail: 0.8 * part, potentielBonus: 0.1 * part,
        menages: {
          fonctionnaire: [{ montant: -Math.round(45 * Math.min(1, t / 3 + 0.3)), texte: 'Gel transitoire du point d\'indice et des avancements (estimation)' }],
          retraite: [{ montant: -Math.round(18 * Math.min(1, t / 4 + 0.2)), texte: 'Économies sur la branche vieillesse (estimation)' }],
          smic: [{ montant: -8, texte: 'Revue des interventions et des aides (estimation)' }],
        },
      };
    },
    reaction: (e, o) => {
      const k = o === 'alternatif' ? 1.25 : 1;
      return { chocs: { fonctionnaires: -11 * k, retraites: -6 * k, jeunes: -2, salaries: o === 'central' ? -3 : -1, entrepreneurs: o === 'central' ? 3 : 6 }, grief: { fonctionnaires: 11 * k, retraites: 6 * k }, credibilite: o === 'alternatif' ? 0.25 : 0.2, instabilite: 0.06 * k };
    },
    axes: { rigueur: 1, marche: 0.7, social: -0.7 },
    axesParOption: { alternatif: { rigueur: 1.2, fiscal: -0.4, social: -0.9 } },
    positionsGroupesParOption: {
      central: { DR: 0.6, UDR: 0.5, HOR: 0.6, EPR: 0.3, DEM: 0.1, LIOT: -0.3, RN: -0.5, SOC: -1, ECOS: -1, LFI: -1, GDR: -1 },
      alternatif: { DR: 0.7, UDR: 0.8, HOR: 0.5, EPR: 0.1, DEM: -0.2, LIOT: -0.5, RN: -0.6, SOC: -1, ECOS: -1, LFI: -1, GDR: -1 },
    },
    chiffrage: 'Économies cumulées (IFRAP, Revue n° 279) : 29,7 Md€ la 1re année, 104,8 Md€ la 3e, 157 Md€ la 5e, 171 Md€ la 7e et 180,2 Md€ la 9e (dont État et opérateurs 100, collectivités 21, Sécurité sociale 59). Scénario alternatif : 44,7 puis 133,8, 178, 182 et 188,2 Md€. Répartition entre les postes du budget du jeu et hausse ciblée des prélèvements du scénario central (+0,7 point de PIB au pic) : hypothèses de jeu.',
  },
  {
    id: 'ifrap_collectivites',
    nom: 'Pacte d\'efficience de la dépense publique locale',
    categorie: 'depenses', pays: FR, vehicule: 'PLF', orientation: 'liberale', inspirations: ['ifrap'],
    resume: 'Lier les transferts de l\'État aux collectivités à la qualité de leur gestion : supprimer les doublons, mieux amortir, limiter les neutralisations comptables, réduire les transferts fiscaux et l\'investissement local.',
    pedagogie: 'L\'IFRAP estime le coût des doublons entre collectivités et avec l\'État à au moins 7,5 Md€. Son pacte rapporterait 25,6 Md€ d\'ici 2029 : suppression des doublons (5,95 Md€), extension de l\'amortissement (1,3), limitation des neutralisations (1,64), réduction des transferts fiscaux et gel des valeurs locatives (6,84), agences comptables locales (1,5) et baisse de l\'investissement local (8,4). Les collectivités réalisent l\'essentiel de l\'investissement public : couper l\'investissement pèse sur le BTP. Les maires, très présents au Sénat, y sont hostiles.',
    pour: ['Supprimer les doublons du « millefeuille » territorial', 'Responsabiliser la gestion locale'],
    contre: ['Baisse de l\'investissement local et de l\'activité du BTP', 'Hausse possible des impôts locaux', 'Opposition des élus locaux et du Sénat'],
    exemples: ['Allemagne : certains Länder encadrent les budgets communaux (validation par une autorité de tutelle)'],
    sources: [IFRAP_263],
    options: [
      { id: 'pacte', nom: 'Le pacte complet : 25,6 Md€ d\'économies en trois ans' },
      { id: 'doublons', nom: 'Seulement la suppression des doublons : 6 Md€' },
    ],
    delai: 1,
    effets(e, o, age) {
      const r = rampe(age, 12);
      const p = prix(e);
      if (o === 'doublons') return { depenses: repartir(e, 5.95 * r * p, { economieFinances: 0.7, culture: 0.15, logement: 0.15 }) };
      return {
        depenses: ajouter(repartir(e, 17.2 * r * p, { economieFinances: 0.75, culture: 0.1, logement: 0.15 }), repartir(e, 8.4 * r * p, { transports: 0.6, logement: 0.2, culture: 0.2 })),
        chocDemande: age < 8 ? -0.03 * r : 0,
      };
    },
    reaction: (e, o) => (o === 'doublons' ? { chocs: { fonctionnaires: -2 }, credibilite: 0.04 } : { chocs: { fonctionnaires: -4, agriculteurs: -2, salaries: -1, entrepreneurs: -1 }, grief: { fonctionnaires: 3 }, credibilite: 0.1 }),
    axes: { rigueur: 0.8, marche: 0.3, social: -0.3 },
    positionsGroupes: { DR: 0.2, UDR: 0.5, HOR: 0.5, EPR: 0.4, DEM: 0.1, LIOT: -0.6, RN: -0.4, SOC: -0.8, ECOS: -0.8, LFI: -1, GDR: -1 },
    chiffrage: 'IFRAP (Revue n° 263) : 25,63 Md€ d\'ici 2029, dont 8,4 Md€ de baisse de l\'investissement local. Répartition entre les postes du jeu : hypothèse de jeu.',
  },
  {
    id: 'ifrap_absenteisme',
    nom: 'Absentéisme dans la fonction publique : deux jours de carence de plus, arrêts payés à 90 %',
    categorie: 'fonction_publique', pays: FR, vehicule: 'loi', orientation: 'liberale', inspirations: ['ifrap'],
    resume: 'Passer d\'un à trois jours de carence pour les agents publics et indemniser les arrêts maladie à 90 % du traitement au lieu de 100 %.',
    pedagogie: 'En 2022, les agents publics ont été absents en moyenne 14,5 jours par an, contre 11,7 jours dans le privé (8,9 jours en 2019). L\'IGF a estimé à 15,1 Md€ le coût des jours non travaillés mais rémunérés en 2022. Selon l\'IFRAP, revenir au niveau de 2019 économiserait 5,8 Md€ ; la mesure proposée en rapporterait 1,36 (2e jour : 0,17 ; 3e jour : 0,29 ; indemnisation à 90 % : 0,9). Le taux de 90 % a été voté pour 2025 ; le passage à trois jours de carence a été étudié puis abandonné.',
    pour: ['Équité avec les salariés du privé', 'Moins d\'arrêts courts, meilleure continuité du service public'],
    contre: ['Pénalise des agents réellement malades, souvent dans des métiers pénibles (soignants)', 'Risque de « présentéisme »', 'Hostilité des syndicats de la fonction publique'],
    exemples: ['Privé : trois jours de carence, souvent compensés par l\'employeur'],
    sources: [IFRAP_263],
    options: [
      { id: 'trois_jours', nom: 'Trois jours de carence et indemnisation à 90 %' },
      { id: 'carence', nom: 'Seulement les deux jours de carence supplémentaires' },
    ],
    delai: 2,
    effets(e, o, age) {
      const m = (o === 'carence' ? 0.46 : 1.36) * rampe(age, 2) * prix(e);
      return { depenses: repartir(e, m, { sante: 0.3, education: 0.3, interieurJustice: 0.15, economieFinances: 0.25 }), menages: { fonctionnaire: [{ montant: o === 'carence' ? -6 : -15, texte: 'Jours de carence et indemnisation des arrêts (moyenne)' }] } };
    },
    reaction: (e, o) => ({ chocs: { fonctionnaires: o === 'carence' ? -4 : -6, entrepreneurs: 2, salaries: 1 }, grief: { fonctionnaires: o === 'carence' ? 3 : 5 }, credibilite: 0.02 }),
    axes: { rigueur: 0.5, social: -0.4, travail: 0.3 },
    positionsGroupes: { DR: 0.8, UDR: 0.9, HOR: 0.6, EPR: 0.4, DEM: 0.2, LIOT: -0.2, RN: 0.1, SOC: -0.8, ECOS: -0.8, LFI: -1, GDR: -1 },
    chiffrage: 'IFRAP (Revue n° 263) : 1,36 Md€ par an (0,46 Md€ pour les seuls jours de carence).',
  },
  {
    id: 'ifrap_retraites_publiques',
    nom: 'Converger les retraites publiques vers celles du privé',
    categorie: 'retraites', pays: FR, vehicule: 'PLFSS', orientation: 'liberale', inspirations: ['ifrap'],
    resume: 'Aligner progressivement le calcul des pensions des fonctionnaires (75 % du traitement des six derniers mois, hors primes) sur celui du privé (25 meilleures années), et, dans la version forte, geler quatre ans les pensions publiques.',
    pedagogie: 'Les employeurs publics versent une « surcotisation » pour équilibrer les retraites des fonctionnaires : 52 Md€ en 2024 selon l\'IFRAP, environ 14 000 € par retraité ; le taux de contribution de l\'État employeur pour les fonctionnaires civils a encore été relevé à 82,28 % en 2026. L\'écart s\'explique par des départs plus précoces (catégories actives), un calcul plus favorable et une grille plus élevée. L\'IFRAP propose d\'aligner les modes de calcul (environ 1 Md€ d\'économie en 2029, plus ensuite car seuls les nouveaux retraités sont concernés) et de geler les pensions publiques quatre ans en complément d\'une légère sous-indexation des pensions du privé.',
    pour: ['Équité entre retraités du public et du privé', 'Réduction d\'une subvention d\'équilibre de plus de 50 Md€'],
    contre: ['Baisse des futures pensions des fonctionnaires, dont les primes sont mal prises en compte', 'Gel des pensions : perte de pouvoir d\'achat pour les retraités du public', 'Conflit social probable (précédent de 1995)'],
    exemples: ['Réforme Fillon de 2003 : alignement de la durée de cotisation du public sur le privé'],
    sources: [IFRAP_263, { texte: 'IFRAP : retraites des fonctionnaires, la Cour n\'ouvre toujours pas la boîte noire', url: 'https://www.ifrap.org/retraite/retraites-des-fonctionnaires-la-cour-nouvre-toujours-pas-la-boite-noire' }],
    options: [
      { id: 'calcul', nom: 'Aligner le mode de calcul (nouveaux retraités)' },
      { id: 'calcul_gel', nom: 'Aligner le calcul et geler quatre ans les pensions publiques' },
    ],
    delai: 2,
    effets(e, o, age) {
      const t = ans(age);
      const p = prix(e);
      const calcul = Math.min(4, 0.35 * t) * p; // monte avec les nouvelles générations de retraités
      const gel = o === 'calcul_gel' ? Math.min(5.5, 1.4 * t) * p : 0;
      return {
        depenses: repartir(e, calcul + gel, { retraites: 1 }),
        menages: o === 'calcul_gel' ? { fonctionnaire: [{ montant: -Math.round(Math.min(60, 15 * t)), texte: 'Gel des pensions publiques (futur retraité, estimation)' }] } : {},
      };
    },
    reaction: (e, o) => ({ chocs: { fonctionnaires: o === 'calcul_gel' ? -9 : -6, retraites: o === 'calcul_gel' ? -3 : 0, salaries: 1, entrepreneurs: 2 }, grief: { fonctionnaires: o === 'calcul_gel' ? 9 : 6 }, credibilite: o === 'calcul_gel' ? 0.12 : 0.06, instabilite: 0.03 }),
    axes: { retraites: 0.6, rigueur: 0.6, social: -0.4 },
    positionsGroupes: { DR: 0.6, UDR: 0.8, HOR: 0.5, EPR: 0.3, DEM: 0.1, LIOT: -0.3, RN: -0.3, SOC: -0.9, ECOS: -0.9, LFI: -1, GDR: -1 },
    chiffrage: 'IFRAP (Revue n° 263) : environ 1 Md€ en 2029 pour la convergence des calculs ; gel des pensions publiques et sous-indexation du privé : 9 Md€ en 2029 ensemble. Montée en charge dans le jeu : hypothèse.',
  },
  {
    id: 'ifrap_sante',
    nom: 'Système de santé : pertinence des soins et coûts de gestion',
    categorie: 'sante', pays: FR, vehicule: 'PLFSS', orientation: 'liberale', inspirations: ['ifrap'],
    resume: 'Réformer les affections de longue durée et les transports sanitaires, aligner les tarifs du public et du privé, réduire les coûts de gestion, supprimer les agences régionales de santé, lutter contre les soins inutiles et gagner en productivité (ambulatoire, télémédecine).',
    pedagogie: 'L\'IFRAP chiffre son volet santé à 17,6 Md€ : affections de longue durée (1,88), transports sanitaires (0,87), alignement des tarifs public-privé (2), coûts de gestion des administrations de santé (3), soins inutiles grâce au dossier médical et aux données (4), suppression des ARS (0,83), productivité des hôpitaux (5). Les dépenses de santé publiques sont parmi les plus élevées d\'Europe, mais les économies attendues de la « pertinence des soins » sont difficiles à obtenir et lentes.',
    pour: ['Dépenser mieux sans dérembourser massivement', 'Moins d\'administration, plus de soins'],
    contre: ['Économies incertaines et lentes', 'Inquiétudes des patients en ALD et des soignants', 'Les ARS coordonnent les crises sanitaires'],
    exemples: ['Danemark : spécialisation et regroupement des hôpitaux'],
    sources: [IFRAP_263],
    options: [
      { id: 'complet', nom: 'Le volet santé complet (17,6 Md€ en trois ans)' },
      { id: 'gestion', nom: 'Seulement les coûts de gestion et les ARS (3,8 Md€)' },
    ],
    delai: 2,
    effets(e, o, age) {
      const r = rampe(age, 12);
      return { depenses: { sante: -(o === 'gestion' ? 3.83 : 17.59) * r * prix(e) }, menages: o === 'complet' ? { retraite: [{ montant: -6, texte: 'Prise en charge des ALD et des transports revue (moyenne)' }] } : {} };
    },
    reaction: (e, o) => (o === 'gestion' ? { chocs: { fonctionnaires: -2 }, credibilite: 0.04 } : { chocs: { retraites: -4, fonctionnaires: -4, salaries: -1 }, grief: { retraites: 3, fonctionnaires: 3 }, credibilite: 0.1 }),
    axes: { rigueur: 0.7, social: -0.4 },
    positionsGroupes: { DR: 0.4, UDR: 0.6, HOR: 0.5, EPR: 0.3, DEM: 0.1, LIOT: -0.4, RN: -0.5, SOC: -0.9, ECOS: -0.9, LFI: -1, GDR: -1 },
    chiffrage: 'IFRAP (Revue n° 263) : 17,59 Md€ d\'ici 2029 (3,83 Md€ pour les coûts de gestion et les ARS). Montée en charge sur trois ans : hypothèse de jeu.',
  },
  {
    id: 'ifrap_impots_production',
    nom: 'Impôts de production : supprimer la CFE et la C3S',
    categorie: 'fiscalite', pays: FR, vehicule: 'PLF', orientation: 'liberale', inspirations: ['ifrap'],
    resume: 'Supprimer la cotisation foncière des entreprises (6,3 Md€) et la contribution sociale de solidarité des sociétés (4,3 Md€), deux impôts payés avant tout bénéfice.',
    pedagogie: 'Les impôts de production atteignaient 126 Md€ en 2022 selon l\'IFRAP, bien plus que chez nos voisins ; ils pèsent surtout sur l\'industrie, qui a besoin de terrains et de bâtiments. L\'IFRAP propose de supprimer la CFE et la C3S (et d\'alléger les droits de succession), financées par ses baisses de dépenses. La CFE finance les intercommunalités : il faut compenser leur perte.',
    pour: ['Compétitivité de l\'industrie et des territoires industriels', 'Attractivité pour les usines (relocalisations)'],
    contre: ['Coût de 10,6 Md€ par an', 'Perte de ressources des intercommunalités, à compenser'],
    exemples: ['Allemagne : pas d\'équivalent de la C3S'],
    sources: [IFRAP_263],
    options: [
      { id: 'cfe_c3s', nom: 'Supprimer la CFE et la C3S (10,6 Md€)' },
      { id: 'c3s', nom: 'Supprimer seulement la C3S (4,3 Md€)' },
    ],
    delai: 2,
    appliquer(e) { if (e.entreprises) e.entreprises.bonusClimat += 3; },
    annuler(e) { if (e.entreprises) e.entreprises.bonusClimat -= 3; },
    effets: (e, o, age) => ({ recettes: { fixe: -(o === 'c3s' ? 4.3 : 10.6) * rampe(age, 2) * prix(e) }, potentielBonus: o === 'c3s' ? 0.02 : 0.05 }),
    reaction: (e, o) => ({ chocs: { entrepreneurs: o === 'c3s' ? 3 : 6, salaries: -1 }, credibilite: o === 'c3s' ? -0.03 : -0.08 }),
    axes: { marche: 0.7, fiscal: -0.6, rigueur: -0.3 },
    positionsGroupes: { DR: 0.8, UDR: 0.9, HOR: 0.7, EPR: 0.6, DEM: 0.4, LIOT: 0.1, RN: 0.3, SOC: -0.6, ECOS: -0.6, LFI: -1, GDR: -1 },
    chiffrage: 'IFRAP (Revue n° 263) : CFE 6,3 Md€, C3S 4,3 Md€. Effet sur la croissance potentielle : hypothèse de jeu.',
  },
  {
    id: 'ifrap_apd_associations',
    nom: 'Réduire l\'aide publique au développement et les subventions aux associations',
    categorie: 'depenses', pays: FR, vehicule: 'PLF', orientation: 'liberale', inspirations: ['ifrap'],
    resume: 'Baisser l\'aide publique au développement (2,6 Md€) et de 10 % les subventions aux associations (1,7 Md€).',
    pedagogie: 'L\'IFRAP propose ces deux économies dans son volet « divers ». L\'aide au développement finance la santé, l\'éducation et le climat dans les pays pauvres, et sert l\'influence de la France ; elle a déjà été réduite à partir de 2024. Les associations rendent beaucoup de services publics par délégation (social, sport, culture) : une baisse de leurs subventions se répercute sur ces services.',
    pour: ['Économies rapides, sans toucher aux services de l\'État', 'Mieux évaluer l\'efficacité des subventions'],
    contre: ['Influence de la France en Afrique et dans le monde', 'Fragilise le tissu associatif et des services rendus localement'],
    exemples: ['Royaume-Uni : aide au développement ramenée de 0,7 % à 0,5 % puis 0,3 % du revenu national'],
    sources: [IFRAP_263],
    options: [
      { id: 'les_deux', nom: 'Les deux économies (4,3 Md€)' },
      { id: 'apd', nom: 'Seulement l\'aide au développement (2,6 Md€)' },
      { id: 'associations', nom: 'Seulement les subventions aux associations (1,7 Md€)' },
    ],
    delai: 1,
    effets(e, o, age) {
      const r = rampe(age, 4);
      const p = prix(e);
      const depenses = {};
      if (o !== 'associations') ajouter(depenses, repartir(e, 2.6 * r * p, { affairesEtrangeres: 1 }));
      if (o !== 'apd') ajouter(depenses, repartir(e, 1.71 * r * p, { culture: 0.4, protectionSociale: 0.4, education: 0.2 }));
      return { depenses, influence: o === 'associations' ? 0 : -1.5 * r };
    },
    reaction: (e, o) => ({ chocs: { jeunes: o === 'apd' ? 0 : -2, retraites: o === 'apd' ? 0 : -1, salaries: 0 }, credibilite: 0.03 }),
    axes: { rigueur: 0.6, social: -0.3, europe: -0.2 },
    positionsGroupes: { DR: 0.6, UDR: 0.9, HOR: 0.3, EPR: 0, DEM: -0.3, LIOT: -0.3, RN: 0.6, SOC: -1, ECOS: -1, LFI: -1, GDR: -1 },
    chiffrage: 'IFRAP (Revue n° 263) : 2,6 Md€ (aide au développement) et 1,71 Md€ (subventions aux associations). Perte d\'influence : hypothèse de jeu.',
  },

  // ======================================================================
  // THE SHIFT PROJECT (Plan robuste pour l'économie française, avril 2026)
  // ======================================================================
  {
    id: 'shift_velo',
    nom: 'Système vélo : pistes sécurisées, vélos électriques, stationnement',
    categorie: 'infrastructures', pays: FR, vehicule: 'PLF', inspirations: ['shift'],
    resume: 'Un réseau cyclable continu et sécurisé dans les villes et entre les bourgs, des aides au vélo électrique et au vélo-cargo, du stationnement dans les gares et les immeubles.',
    pedagogie: 'Le transport représente environ un tiers des émissions françaises, dont la moitié pour les voitures. La moitié des trajets en voiture font moins de 5 km : c\'est le terrain du vélo, surtout électrique. Le Shift Project en fait l\'un de ses chantiers de mobilité, avec les transports en commun. L\'activité physique améliore aussi la santé publique.',
    pour: ['Moins d\'émissions et de dépenses de carburant', 'Santé publique', 'Infrastructures peu coûteuses comparées aux routes et au rail'],
    contre: ['Moins adapté aux zones rurales et aux longues distances', 'Partage de la voirie conflictuel dans les villes'],
    exemples: ['Pays-Bas : plus d\'un quart des déplacements à vélo', 'Paris : forte hausse de la pratique depuis 2020 avec les pistes cyclables'],
    sources: SHIFT,
    options: [
      { id: 'plan', nom: 'Plan vélo national : 1 Md€ par an' },
      { id: 'ambitieux', nom: 'Plan ambitieux : 2 Md€ par an, réseau entre les bourgs' },
    ],
    delai: 1,
    effets(e, o, age) {
      const t = ans(age);
      const k = o === 'ambitieux' ? 2 : 1;
      return { depenses: { transports: k * prix(e) }, emissionsEvitees: Math.min(1.5 * k, 0.15 * k * t), potentielBonus: 0.002 * k, menages: { jeune: [{ montant: 8, texte: 'Moins de carburant (vélo, estimation)' }] } };
    },
    reaction: (e, o) => ({ chocs: { jeunes: 2, salaries: 1, agriculteurs: o === 'ambitieux' ? -1 : 0 } }),
    axes: { ecologie: 0.7, rigueur: -0.2 },
    positionsGroupes: { ECOS: 1, SOC: 0.8, GDR: 0.6, LFI: 0.7, LIOT: 0.3, DEM: 0.4, EPR: 0.3, HOR: 0.1, DR: -0.3, UDR: -0.6, RN: -0.5 },
    chiffrage: 'Le Shift Project ne chiffre pas le coût de son plan : 1 à 2 Md€ par an et 1,5 à 3 Mt de CO2 évitées par an à terme sont des hypothèses de jeu.',
  },
  {
    id: 'shift_fret',
    nom: 'Fret ferroviaire : 30 % des marchandises par le train en 2050',
    categorie: 'infrastructures', pays: FR, vehicule: 'PLF', inspirations: ['shift'],
    resume: 'Faire passer la part du train dans le transport de marchandises de 9 % en 2025 à 30 % en 2050 : voies de service, gares de triage, autoroutes ferroviaires, terminaux de transport combiné.',
    pedagogie: 'Un camion émet environ dix fois plus de CO2 par tonne transportée qu\'un train électrique. La part du fret ferroviaire a reculé en France depuis les années 2000, faute d\'investissements et de fiabilité. C\'est l\'un des chantiers chiffrés du Shift Project (30 % en 2050). Le rail ne remplace pas le camion pour les derniers kilomètres : il faut des plateformes de transfert.',
    pour: ['Moins d\'émissions et de camions sur les routes', 'Résilience logistique et emplois industriels'],
    contre: ['Investissements lourds et lents à porter leurs fruits', 'Concurrence avec les trains de voyageurs sur un réseau saturé'],
    exemples: ['Suisse : environ 40 % des marchandises par le rail, transit alpin imposé', 'Autriche : près de 30 %'],
    sources: SHIFT,
    options: [{ id: 'plan', nom: 'Plan fret : 1,5 Md€ par an jusqu\'en 2050' }],
    delai: 1,
    effets(e, o, age) {
      const t = ans(age);
      return { depenses: { transports: 1.5 * prix(e) }, emissionsEvitees: Math.min(7, 0.3 * t), potentielBonus: 0.003 };
    },
    reaction: () => ({ chocs: { salaries: 1, entrepreneurs: -1 } }),
    axes: { ecologie: 0.7, rigueur: -0.2, souverainete: 0.2 },
    positionsGroupes: { ECOS: 1, SOC: 0.8, GDR: 0.9, LFI: 0.8, LIOT: 0.5, DEM: 0.5, EPR: 0.4, HOR: 0.2, DR: 0.1, UDR: -0.2, RN: 0.2 },
    chiffrage: 'Objectif du Shift Project : 30 % du fret en 2050, contre 9 % en 2025. Coût (1,5 Md€ par an) et émissions évitées (jusqu\'à 7 Mt par an) : hypothèses de jeu.',
  },
  {
    id: 'shift_voiture_electrique',
    nom: 'Petites voitures électriques abordables et bornes dans les zones peu denses',
    categorie: 'energie', pays: FR, vehicule: 'PLF', inspirations: ['shift'],
    resume: 'Orienter les aides vers des voitures électriques petites et légères, fabriquées en Europe, et équiper de bornes les campagnes et les petites villes.',
    pedagogie: 'Le Shift Project vise un parc automobile entièrement décarboné en 2050 et insiste sur la recharge dans les zones peu denses, là où la voiture reste indispensable, et sur des modèles petits et abordables : une voiture plus légère demande moins de batterie, donc moins de métaux et d\'énergie. Le malus au poids existe déjà pour les voitures thermiques lourdes.',
    pour: ['Moins d\'émissions et de pétrole importé', 'Économies de carburant pour les ménages ruraux', 'Débouchés pour l\'industrie automobile européenne'],
    contre: ['Coût des aides et des bornes', 'Prix d\'achat encore élevé', 'Concurrence des voitures chinoises'],
    exemples: ['Norvège : près de 90 % de voitures neuves électriques en 2024', 'France : leasing social de 2024'],
    sources: SHIFT,
    options: [{ id: 'plan', nom: 'Bonus pour les petites électriques et bornes rurales : 0,8 Md€ par an' }],
    delai: 1,
    effets(e, o, age) {
      const t = ans(age);
      return { depenses: { ecologieEnergie: 0.8 * prix(e) }, emissionsEvitees: Math.min(5, 0.4 * t), menages: { agriculteur: [{ montant: Math.round(Math.min(25, 4 * t)), texte: 'Moins de carburant (voiture électrique, si équipé)' }], smic: [{ montant: Math.round(Math.min(20, 3 * t)), texte: 'Moins de carburant (voiture électrique, si équipée)' }] } };
    },
    reaction: () => ({ chocs: { salaries: 1, agriculteurs: 1, entrepreneurs: 1 } }),
    axes: { ecologie: 0.6, social: 0.2, rigueur: -0.2 },
    positionsGroupes: { ECOS: 0.9, SOC: 0.7, GDR: 0.4, LFI: 0.5, LIOT: 0.5, DEM: 0.5, EPR: 0.6, HOR: 0.3, DR: 0, UDR: -0.4, RN: -0.3 },
    chiffrage: 'Coût et émissions évitées (jusqu\'à 5 Mt par an) : hypothèses de jeu ; le Shift Project ne chiffre pas son plan.',
  },
  {
    id: 'shift_poids_lourds',
    nom: 'Poids lourds électriques et recharge sur les grands axes',
    categorie: 'energie', pays: FR, vehicule: 'PLF', inspirations: ['shift'],
    resume: 'Aider les transporteurs à passer aux camions électriques et équiper les autoroutes et les plateformes logistiques de recharge rapide.',
    pedagogie: 'Selon le Shift Project, les poids lourds électriques, avec les voitures électriques et les pompes à chaleur, pourraient réduire d\'un tiers les émissions liées à la combustion d\'énergies fossiles d\'ici 2050. Les camions représentent environ un quart des émissions du transport. Le surcoût à l\'achat reste élevé, mais l\'électricité coûte moins cher que le gazole.',
    pour: ['Forte baisse des émissions du transport de marchandises', 'Moins de dépendance au gazole importé'],
    contre: ['Surcoût des camions et des bornes de forte puissance', 'Réseau électrique à renforcer'],
    exemples: ['Allemagne : réseau de recharge pour camions sur les autoroutes en cours de déploiement'],
    sources: SHIFT,
    options: [{ id: 'plan', nom: 'Aides et bornes : 0,7 Md€ par an' }],
    delai: 1,
    effets(e, o, age) {
      const t = ans(age);
      return { depenses: { ecologieEnergie: 0.7 * prix(e) }, emissionsEvitees: Math.min(6, 0.35 * t) };
    },
    reaction: () => ({ chocs: { entrepreneurs: 1 } }),
    axes: { ecologie: 0.6, rigueur: -0.2 },
    positionsGroupes: { ECOS: 0.9, SOC: 0.6, GDR: 0.4, LFI: 0.4, LIOT: 0.4, DEM: 0.5, EPR: 0.6, HOR: 0.4, DR: 0.1, UDR: -0.3, RN: -0.2 },
    chiffrage: 'Coût et émissions évitées (jusqu\'à 6 Mt par an) : hypothèses de jeu.',
  },
  {
    id: 'shift_pompes_chaleur',
    nom: 'Remplacer les chaudières au fioul et au gaz par des pompes à chaleur',
    categorie: 'logement', pays: FR, vehicule: 'loi', inspirations: ['shift'],
    resume: 'Avec la rénovation des logements, déployer massivement les pompes à chaleur : par des aides, ou en interdisant aussi l\'installation de chaudières fossiles neuves à partir de 2030.',
    pedagogie: 'Le chauffage au gaz et au fioul pèse lourd dans les émissions du bâtiment (environ un sixième des émissions françaises). Une pompe à chaleur produit 3 à 4 fois plus de chaleur qu\'elle ne consomme d\'électricité, et l\'électricité française est peu carbonée. Le Shift Project associe pompes à chaleur et rénovation dans son chantier logement. Une interdiction accélère le changement mais pèse sur les ménages qui doivent remplacer une chaudière en panne.',
    pour: ['Forte baisse des émissions et des importations de gaz', 'Factures plus stables, filière industrielle (pompes fabriquées en France)'],
    contre: ['Coût d\'installation élevé (10 000 à 15 000 €)', 'Logements mal isolés : efficacité réduite sans rénovation', 'Une interdiction est vécue comme une contrainte'],
    exemples: ['Pays-Bas et Royaume-Uni : fin programmée des chaudières à gaz dans le neuf', 'Allemagne : loi de 2023 sur le chauffage, très contestée puis assouplie'],
    sources: SHIFT,
    options: [
      { id: 'aides', nom: 'Aides renforcées : 2 Md€ par an' },
      { id: 'obligation', nom: 'Aides de 1 Md€ par an et interdiction des chaudières fossiles neuves en 2030' },
    ],
    delai: 2,
    effets(e, o, age) {
      const t = ans(age);
      const obligation = o === 'obligation';
      return {
        depenses: { logement: (obligation ? 1 : 2) * prix(e) },
        emissionsEvitees: obligation ? Math.min(10, (e.trimestre.annee >= 2030 ? 0.75 : 0.4) * t) : Math.min(8, 0.5 * t),
        chocDemande: age < 8 ? 0.02 : 0,
        menages: { retraite: [{ montant: Math.round(Math.min(30, 4 * t)), texte: 'Factures de chauffage en baisse (si équipé)' }] },
      };
    },
    reaction: (e, o) => (o === 'obligation' ? { chocs: { retraites: -4, salaries: -2, agriculteurs: -2, entrepreneurs: 1 }, grief: { retraites: 3, salaries: 2 } } : { chocs: { salaries: 1, entrepreneurs: 1 } }),
    axes: { ecologie: 0.8, rigueur: -0.2 },
    axesParOption: { obligation: { ecologie: 1, marche: -0.4 } },
    positionsGroupesParOption: {
      aides: { ECOS: 0.9, SOC: 0.7, GDR: 0.4, LFI: 0.5, LIOT: 0.4, DEM: 0.5, EPR: 0.6, HOR: 0.4, DR: 0.1, UDR: -0.3, RN: -0.2 },
      obligation: { ECOS: 1, SOC: 0.5, GDR: 0.1, LFI: 0.3, LIOT: -0.3, DEM: 0, EPR: 0, HOR: -0.3, DR: -0.7, UDR: -0.9, RN: -0.9 },
    },
    chiffrage: 'Coûts et émissions évitées (8 à 10 Mt par an à terme) : hypothèses de jeu ; le Shift Project ne chiffre pas son plan.',
  },
  {
    id: 'shift_acier',
    nom: 'Acier bas carbone : quitter le charbon des hauts fourneaux',
    categorie: 'energie', pays: FR, vehicule: 'loi', inspirations: ['shift'],
    resume: 'Produire l\'acier en France avec des fours à arc électriques et de l\'hydrogène bas carbone, grâce à des contrats qui compensent le surcoût pendant dix ans.',
    pedagogie: 'Les hauts fourneaux de Dunkerque et de Fos-sur-Mer, au charbon, figurent parmi les plus gros émetteurs industriels français. Le Shift Project demande de produire de l\'acier bas carbone en France, en passant à l\'hydrogène et au four à arc électrique. Un « contrat carbone pour différence » garantit à l\'industriel la différence entre le coût de l\'acier propre et le prix de marché. Sans cela, le risque est de fermer les usines et d\'importer l\'acier.',
    pour: ['Forte baisse des émissions industrielles', 'Souveraineté : garder une sidérurgie en France', 'Emplois industriels à Dunkerque et à Fos'],
    contre: ['Coût public de plusieurs milliards', 'Besoin massif d\'électricité et d\'hydrogène bas carbone', 'Dépend des choix de l\'industriel (ArcelorMittal)'],
    exemples: ['Suède : acier « vert » à l\'hydrogène (projets Hybrit, Stegra)', 'Allemagne : aides à la décarbonation de Thyssenkrupp et Salzgitter'],
    sources: SHIFT,
    options: [{ id: 'contrats', nom: 'Contrats carbone pour différence : 1 Md€ par an pendant dix ans' }],
    delai: 2,
    effets(e, o, age) {
      const t = ans(age);
      return { depenses: { economieFinances: (t < 10 ? 1 : 0) * prix(e) }, emissionsEvitees: t < 4 ? 0 : Math.min(8, 1.5 * (t - 4)), souverainete: 1 };
    },
    reaction: () => ({ chocs: { salaries: 2, entrepreneurs: 1 } }),
    axes: { ecologie: 0.6, souverainete: 0.6, rigueur: -0.2 },
    positionsGroupes: { ECOS: 0.8, SOC: 0.8, GDR: 0.8, LFI: 0.5, LIOT: 0.5, DEM: 0.5, EPR: 0.6, HOR: 0.4, DR: 0.3, UDR: 0.1, RN: 0.5 },
    chiffrage: 'Coût (1 Md€ par an pendant dix ans) et émissions évitées (jusqu\'à 8 Mt par an à partir de la cinquième année) : hypothèses de jeu.',
  },
  {
    id: 'shift_elevage',
    nom: 'Élevages bovins bas carbone et légumineuses',
    categorie: 'agriculture', pays: FR, vehicule: 'loi', inspirations: ['shift'],
    resume: 'Réduire progressivement et sélectivement le nombre de bovins pour limiter le méthane, accompagner les éleveurs vers des élevages résilients à l\'herbe, et remplacer une partie des engrais azotés de synthèse par des légumineuses.',
    pedagogie: 'L\'agriculture et la forêt pèsent environ 20 % des émissions françaises, surtout par le méthane des bovins et le protoxyde d\'azote des engrais. Le Shift Project propose des élevages bovins résilients et bas carbone, avec un cheptel en baisse progressive, et davantage de légumineuses (pois, lentilles, luzerne), qui fixent l\'azote de l\'air. Le cheptel bovin baisse déjà depuis des années. Sujet très sensible pour les éleveurs, déjà en crise.',
    pour: ['Moins de méthane et d\'engrais importés (souvent issus du gaz)', 'Protéines végétales produites en France', 'Prairies qui stockent du carbone'],
    contre: ['Revenus des éleveurs et vitalité des zones rurales', 'Risque d\'importer davantage de viande produite ailleurs', 'Colère agricole'],
    exemples: ['Danemark : taxe sur les émissions de l\'élevage votée en 2024, applicable en 2030', 'Pays-Bas : rachats volontaires d\'exploitations d\'élevage'],
    sources: SHIFT,
    options: [
      { id: 'accompagner', nom: 'Transition accompagnée des éleveurs et plan protéines : 1 Md€ par an' },
      { id: 'legumineuses', nom: 'Seulement le plan légumineuses : 0,3 Md€ par an' },
    ],
    delai: 2,
    effets(e, o, age) {
      const t = ans(age);
      const complet = o === 'accompagner';
      return { depenses: { agriculture: (complet ? 1 : 0.3) * prix(e) }, emissionsEvitees: complet ? Math.min(6, 0.4 * t) : Math.min(2, 0.15 * t), menages: complet ? { agriculteur: [{ montant: 40, texte: 'Aide à la transition des élevages' }] } : {} };
    },
    reaction: (e, o) => (o === 'accompagner' ? { chocs: { agriculteurs: -8, jeunes: 2 }, grief: { agriculteurs: 8 }, instabilite: 0.03 } : { chocs: { agriculteurs: 1 } }),
    axes: { ecologie: 0.8, social: 0.1 },
    axesParOption: { legumineuses: { ecologie: 0.4 } },
    positionsGroupesParOption: {
      accompagner: { ECOS: 1, SOC: 0.4, GDR: 0, LFI: 0.4, LIOT: -0.5, DEM: -0.1, EPR: 0, HOR: -0.3, DR: -0.9, UDR: -1, RN: -1 },
      legumineuses: { ECOS: 1, SOC: 0.8, GDR: 0.6, LFI: 0.6, LIOT: 0.4, DEM: 0.5, EPR: 0.5, HOR: 0.3, DR: 0.2, UDR: 0, RN: 0.1 },
    },
    chiffrage: 'Coûts et émissions évitées (jusqu\'à 6 Mt par an) : hypothèses de jeu ; le Shift Project ne chiffre pas son plan.',
  },
  {
    id: 'shift_puits_carbone',
    nom: 'Forêts, haies et sols : préserver les puits de carbone',
    categorie: 'agriculture', pays: FR, vehicule: 'PLF', inspirations: ['shift'],
    resume: 'Adapter les forêts au climat (essences, coupes raisonnées), replanter des haies, protéger les prairies et freiner l\'artificialisation des sols.',
    pedagogie: 'Les forêts françaises absorbent de moins en moins de carbone : sécheresses, incendies, scolytes et hausse des coupes ont divisé ce « puits » par deux environ en dix ans. Le Shift Project fait de la préservation des puits de carbone naturels, agricoles et forestiers l\'un de ses chantiers : sans eux, la neutralité carbone est hors d\'atteinte.',
    pour: ['Absorbe du CO2 et protège la biodiversité', 'Forêts plus résistantes aux incendies', 'Haies utiles aux agriculteurs (vent, eau, auxiliaires)'],
    contre: ['Résultats lents et incertains (climat)', 'Moins de bois récolté à court terme pour la filière'],
    exemples: ['Plan « 1 milliard d\'arbres » d\'ici 2032 annoncé en 2022'],
    sources: SHIFT,
    options: [{ id: 'plan', nom: 'Plan forêts et sols : 0,5 Md€ par an' }],
    delai: 1,
    effets(e, o, age) {
      const t = ans(age);
      return { depenses: { agriculture: 0.25 * prix(e), ecologieEnergie: 0.25 * prix(e) }, emissionsEvitees: Math.min(4, 0.2 * t), menages: { agriculteur: [{ montant: 10, texte: 'Aides aux haies et aux prairies' }] } };
    },
    reaction: () => ({ chocs: { agriculteurs: 1, jeunes: 1 } }),
    axes: { ecologie: 0.7, rigueur: -0.1 },
    positionsGroupes: { ECOS: 1, SOC: 0.8, GDR: 0.6, LFI: 0.7, LIOT: 0.4, DEM: 0.5, EPR: 0.5, HOR: 0.3, DR: 0.1, UDR: -0.2, RN: 0 },
    chiffrage: 'Coût et carbone absorbé en plus (jusqu\'à 4 Mt par an) : hypothèses de jeu.',
  },
];

/**
 * Réformes déjà présentes dans le jeu qui reprennent une proposition des deux
 * think tanks, avec ce qu'ils proposent précisément.
 */
export const INSPIRATIONS_EXISTANTES = {
  ifrap: {
    retraites_age: 'L\'IFRAP propose 63 ans dès 2026, 64,5 ans en 2029 puis 66 ans en 2032 (6 mois par an) : 10 Md€ d\'économies en 2029. Option « Proposition de l\'IFRAP ».',
    retraites_indexation: 'L\'IFRAP propose de geler quatre ans les pensions publiques et de revaloriser celles du privé un peu moins que l\'inflation : 9 Md€ en 2029.',
    gel_point_indice: 'L\'IFRAP propose de geler le point d\'indice (5,76 Md€ selon sa Revue n° 263), puis un gel transitoire jusqu\'en 2030 dans sa trajectoire de 2026.',
    fonction_publique_temps: 'L\'IFRAP demande l\'alignement des agents sur les 1 607 heures légales : 1,3 Md€ (estimation de la Cour des comptes reprise).',
    non_remplacement: 'L\'IFRAP propose un non-remplacement partiel des départs, notamment dans la fonction publique territoriale.',
    ia_fonction_publique: 'L\'IFRAP compte sur le non-remplacement partiel des départs avec l\'IA : 1,2 Md€ dès 2027 et plus de 10 Md€ à l\'horizon 2031 pour l\'État.',
    allocation_sociale_unique: 'L\'IFRAP propose une allocation sociale unique versée automatiquement (5 Md€) pour que le travail rapporte toujours plus que l\'aide sociale.',
    plafond_aides_smic: 'L\'IFRAP propose de plafonner le cumul des aides sociales : 12 Md€.',
    assurance_chomage: 'L\'IFRAP propose la dégressivité des allocations chômage : 2,67 Md€.',
    plan_antifraude: 'L\'IFRAP chiffre l\'optimisation de la lutte contre la fraude fiscale et sociale à 5 Md€ et propose de fusionner la DGFiP et l\'Urssaf (« France Recouvrement »).',
    agences_operateurs: 'L\'IFRAP propose de réduire de 10 % le nombre d\'opérateurs : 18 fusions, 6 suppressions, privatisation de VNF, Météo-France, l\'IGN et l\'IFCE (6,94 Md€).',
    apprentissage: 'L\'IFRAP propose de réduire les aides à l\'apprentissage : 3,81 Md€.',
    regle_or: 'L\'IFRAP propose d\'inscrire à l\'article 34 de la Constitution l\'équilibre des comptes sur un cycle économique, avec une clause de sauvegarde, après une phase de redressement (voir « Plan de l\'IFRAP »).',
    annee_blanche: 'Agnès Verdier-Molinié (IFRAP) a défendu l\'année blanche comme « la seule option crédible » pour le budget.',
    dotations_collectivites: 'L\'IFRAP propose de lier les dotations des collectivités à la qualité de leur gestion (voir « Pacte d\'efficience de la dépense publique locale »).',
    cvae: 'L\'IFRAP propose aussi de supprimer d\'autres impôts de production, la CFE et la C3S.',
  },
  shift: {
    maprimerenov: 'Le Shift Project fait de la rénovation des logements, avec les pompes à chaleur, l\'un de ses 20 chantiers.',
    plan_ferroviaire: 'Le Shift Project veut massifier le train de voyageurs et étendre les transports en commun.',
    leasing_social: 'Le Shift Project vise un parc automobile entièrement décarboné en 2050, avec des voitures électriques petites et abordables.',
    nucleaire_epr2: 'Le Shift Project compte sur l\'électrification de l\'économie, avec une électricité bas carbone (nucléaire et renouvelables).',
    eolien_mer: 'Le Shift Project compte sur l\'électrification de l\'économie, avec une électricité bas carbone (nucléaire et renouvelables).',
  },
};
