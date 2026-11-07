/**
 * Réformes de l'État et mesures populaires (France) : intelligence
 * artificielle dans la fonction publique, règle de performance budgétaire,
 * train de vie de l'État, prime de partage de la valeur.
 *
 * Montants sans source : hypothèses de jeu, signalées comme telles.
 */

import { avancerFonds, partFrance } from '../engine/fondsSouverain.js';
const rampe = (age, n) => Math.min(1, Math.max(0, (age + 1) / n));
const prix = (e) => e.macro.niveauPrix / 100;
const FR = ['france'];
const ans = (age) => Math.max(0, age) / 4;

/** Trajectoires de dépense publique (en % du PIB) : cible à cinq ans, puis à dix ans. */
export const TRAJECTOIRES_DEPENSE = {
  '47_43': { cinq: 47.5, dix: 43 },
  '45_40': { cinq: 45, dix: 40 },
  '43_38': { cinq: 43, dix: 38 },
};

/**
 * Répartition des économies (hypothèse de jeu) : au prorata de la dépense de
 * chaque poste, davantage sur les aides, subventions et interventions, moins
 * sur la défense, la sécurité, la justice et la recherche.
 */
const POIDS_ECONOMIES = { retraites: 0.9, sante: 0.9, protectionSociale: 1.1, travailEmploi: 1.3, education: 0.7, recherche: 0.5, defense: 0.2, affairesEtrangeres: 1, interieurJustice: 0.3, ecologieEnergie: 1.2, transports: 1, agriculture: 1.2, logement: 1.3, culture: 1.2, economieFinances: 1.3 };

/** Part maximale de la dépense publique que le pilotage peut supprimer. */
const ECONOMIE_MAX = 0.45;

/** Cible de dépense (% du PIB) après `age` trimestres : linéaire vers la cible à cinq ans, puis vers celle à dix ans. */
export function cibleDepensePIB(option, age, depart) {
  const t = TRAJECTOIRES_DEPENSE[option] ?? TRAJECTOIRES_DEPENSE['47_43'];
  const q = Math.max(0, age + 1);
  const cinq = Math.min(depart, t.cinq);
  const dix = Math.min(cinq, t.dix);
  if (q <= 20) return depart + (cinq - depart) * q / 20;
  if (q <= 40) return cinq + (dix - cinq) * (q - 20) / 20;
  return dix;
}

function repartirParPoids(e, montant) {
  const postes = Object.entries(e.budget).map(([id, l]) => [id, (POIDS_ECONOMIES[id] ?? 1) * (l.montantInitial ?? l.montant)]);
  const total = postes.reduce((s, [, w]) => s + w, 0);
  return Object.fromEntries(postes.map(([id, w]) => [id, montant * w / total]));
}

export const REFORMES_ETAT = [
  {
    id: 'ia_fonction_publique',
    nom: 'Remplacer un départ à la retraite sur trois par l\'IA et l\'automatisation',
    categorie: 'fonction_publique', pays: FR, vehicule: 'PLF', orientation: 'liberale',
    resume: 'Ne pas remplacer un fonctionnaire sur trois partant à la retraite, en confiant les tâches répétitives (instruction de dossiers simples, accueil, saisie, traduction) à des outils d\'intelligence artificielle et à des robots logiciels.',
    pedagogie: 'Environ 50 600 fonctionnaires de l\'État sont partis à la retraite en 2024, et 157 000 dans l\'ensemble de la fonction publique en 2023 (DGAFP). Ne pas en remplacer un sur trois supprime environ 17 000 postes par an à l\'État. Le plan présenté par François Bayrou en juillet 2025 prévoyait déjà ce « un sur trois » à partir de 2027 ; en décembre 2025, le Sénat a voté le « un sur deux » hors régalien, mesure retirée ensuite par le gouvernement. Sans investissement, les usagers le ressentent (files d\'attente, délais) ; avec l\'IA, le service peut tenir, à condition que les projets informatiques ne dérapent pas, comme le logiciel de paie des militaires Louvois au début des années 2010.',
    pour: ['Économies durables sur la masse salariale (environ 0,85 Md€ de plus chaque année à l\'État)', 'Les agents se concentrent sur l\'accueil humain et les cas complexes', 'Moderniser un État en retard sur le numérique'],
    contre: ['Coût initial des outils et de la formation', 'Risque d\'échecs informatiques coûteux', 'Opposition des syndicats ; usagers éloignés du numérique pénalisés'],
    exemples: ['Estonie : État presque entièrement numérique', 'Albanie : une « ministre » virtuelle à base d\'IA chargée des marchés publics (2025)', 'France : la règle du « un sur deux » (2007-2012) a supprimé de l\'ordre de 150 000 postes à l\'État'],
    sources: [{ texte: 'Acteurs publics : François Bayrou annonce le non-remplacement d\'un fonctionnaire sur trois', url: 'https://acteurspublics.fr/articles/francois-bayrou-annonce-le-non-remplacement-dun-fonctionnaire-sur-trois-partant-a-la-retraite-francois-bayrou-annonce-le-non-remplacement-dun-fonctionnaire-sur-trois-suppression-de-postes-non/' }],
    options: [
      { id: 'etat', nom: 'Fonction publique de l\'État (environ 17 000 postes par an)', description: 'Investissement de 1,5 Md€ par an pendant cinq ans dans l\'IA et la formation (hypothèse de jeu).' },
      { id: 'trois_fonctions', nom: 'Les trois fonctions publiques, hôpitaux et collectivités compris (environ 52 000 postes par an)', description: 'Économies trois fois plus fortes, mais tensions à l\'hôpital et dans les mairies.' },
    ],
    positionsGroupes: { DR: 0.8, UDR: 0.8, HOR: 0.7, EPR: 0.5, DEM: 0.3, RN: -0.2, LIOT: 0, SOC: -0.7, LFI: -1, GDR: -1, ECOS: -0.6 },
    delai: 2,
    effets(e, o, age) {
      const t = ans(age);
      const parAn = o === 'trois_fonctions' ? 2.6 : 0.85; // Md€ de masse salariale en moins par an, cumulés
      const economie = Math.min(o === 'trois_fonctions' ? 26 : 8.5, parAn * (t + 0.25)) * prix(e);
      const investissement = (t < 5 ? (o === 'trois_fonctions' ? 3 : 1.5) : 0.5) * prix(e);
      return {
        depenses: { economieFinances: investissement - economie },
        potentielBonus: (o === 'trois_fonctions' ? 0.015 : 0.01) * rampe(age - 4, 12),
      };
    },
    reaction: (e, o) => (o === 'trois_fonctions'
      ? { chocs: { fonctionnaires: -9, retraites: -2, entrepreneurs: 3 }, grief: { fonctionnaires: 9 }, credibilite: 0.08 }
      : { chocs: { fonctionnaires: -5, entrepreneurs: 3, retraites: 1 }, grief: { fonctionnaires: 5 }, credibilite: 0.06 }),
    axes: { marche: 0.6, rigueur: 0.6, social: -0.2 },
    chiffrage: 'Hypothèses de jeu : environ 50 000 € de coût complet par poste ; 0,85 Md€ d\'économies supplémentaires chaque année à l\'État (2,6 Md€ pour les trois fonctions publiques), plafonnées au bout de dix ans ; investissement de 1,5 Md€ (ou 3 Md€) par an pendant cinq ans, puis 0,5 Md€ d\'entretien. Bilan net positif au bout de deux à trois ans.',
  },
  {
    id: 'regle_performance',
    nom: 'Règle de performance budgétaire',
    categorie: 'regles', pays: FR, vehicule: 'loi', orientation: 'liberale',
    resume: 'Obliger chaque euro dépensé à prouver son efficacité : norme de dépense, budget « base zéro » ou règle du gage.',
    pedagogie: 'La loi organique relative aux lois de finances (LOLF, 2001) a introduit des objectifs et des indicateurs de performance pour chaque programme, mais ils pèsent peu dans les arbitrages. D\'autres pays vont plus loin : plafond de dépenses pluriannuel en Suède depuis 1997, règle du « PAYGO » aux États-Unis (toute dépense nouvelle doit être compensée), budget « base zéro » où chaque programme est rejustifié à partir de zéro. Les règles européennes réformées en 2024 reposent elles aussi sur une trajectoire de dépenses. Une règle crédible rassure les marchés et fait baisser les taux ; son efficacité dépend de la volonté de la respecter.',
    pour: ['Crédibilité budgétaire : taux d\'intérêt plus bas', 'Supprimer les dépenses inefficaces plutôt que raboter partout', 'Transparence pour le Parlement'],
    contre: ['Rigidité en cas de crise (sauf clause de sauvegarde)', 'Lourdeur administrative du budget base zéro', 'Risque de contournement (débudgétisation)'],
    exemples: ['Suède : plafond de dépenses et objectif d\'excédent depuis 1997', 'États-Unis : loi « Statutory PAYGO » de 2010', 'Pays-Bas : budget par tendance avec plafonds réels de dépenses'],
    options: [
      { id: 'norme', nom: 'Norme de dépense : dépenses primaires limitées à +0,5 % par an en volume, avec mécanisme de correction' },
      { id: 'base_zero', nom: 'Budget base zéro : chaque programme rejustifié tous les cinq ans, les moins efficaces supprimés' },
      { id: 'gage', nom: 'Règle du gage : toute dépense nouvelle compensée par une économie équivalente' },
    ],
    positionsGroupes: { DR: 0.7, UDR: 0.6, HOR: 0.8, EPR: 0.6, DEM: 0.5, LIOT: 0.3, RN: 0.1, SOC: -0.3, ECOS: -0.4, GDR: -0.8, LFI: -0.9 },
    delai: 2,
    effets(e, o, age) {
      const t = ans(age);
      if (o === 'base_zero') return { depenses: { economieFinances: (age < 4 ? 0.3 : 0) - Math.min(8, 2 * t) * prix(e) }, potentielBonus: 0.004 };
      if (o === 'gage') return { depenses: { economieFinances: -Math.min(3, 1.5 * t) * prix(e) } };
      return { depenses: { economieFinances: -Math.min(6, 1.5 * t) * prix(e) } };
    },
    reaction: (e, o) => ({ norme: { chocs: { fonctionnaires: -2, entrepreneurs: 2 }, credibilite: 0.15 }, base_zero: { chocs: { fonctionnaires: -3, entrepreneurs: 2 }, credibilite: 0.1, instabilite: 0.03 }, gage: { chocs: { entrepreneurs: 1 }, credibilite: 0.1 } }[o]),
    axes: { rigueur: 1, marche: 0.3 },
    chiffrage: 'Hypothèses de jeu : norme de dépense, jusqu\'à 6 Md€ d\'économies par an après quatre ans ; base zéro, jusqu\'à 8 Md€ par an après quatre ans (coût de mise en place la première année) ; gage, jusqu\'à 3 Md€ par an. Gain de crédibilité auprès des marchés dans tous les cas.',
  },
  {
    id: 'train_de_vie',
    nom: 'Réduire le train de vie de l\'État',
    categorie: 'depenses', pays: FR, vehicule: 'décret', vote: false,
    resume: 'Gouvernement resserré, moins de voitures et de logements de fonction, dépenses de communication des ministères réduites : un signal d\'exemplarité.',
    pedagogie: 'L\'économie est symbolique à l\'échelle du budget (de l\'ordre de 0,2 Md€ par an, hypothèse de jeu), mais l\'exemplarité compte pour faire accepter les efforts. Depuis le 1er janvier 2026, un décret limite à dix ans les avantages (voiture, chauffeur) des anciens Premiers ministres, qui coûtaient environ 4,4 M€ par an en 2019.',
    pour: ['Exemplarité : condition pour demander des efforts aux Français', 'Mesure très populaire'],
    contre: ['Économie négligeable', 'Risque de démagogie si elle remplace de vraies réformes'],
    exemples: ['Italie : réduction d\'un tiers du nombre de parlementaires approuvée par référendum en 2020'],
    sources: [{ texte: 'Le Club des juristes : fin des « privilèges à vie » des anciens ministres', url: 'https://www.leclubdesjuristes.com/en-bref/sebastien-lecornu-annonce-mettre-fin-aux-privileges-a-vie-des-anciens-ministres-des-janvier-2026-12017/' }],
    options: [{ id: 'exemplarite', nom: 'Gouvernement de 20 ministres, flotte de véhicules et communication réduites' }],
    unique: true,
    delai: 1,
    effets: (e) => ({ depenses: { economieFinances: -0.2 * prix(e) } }),
    reaction: () => ({ chocs: { salaries: 3, retraites: 3, jeunes: 2, agriculteurs: 2, fonctionnaires: 1, entrepreneurs: 2 }, opinion: { salaries: 1.5, retraites: 1.5, jeunes: 1, agriculteurs: 1, entrepreneurs: 1 } }),
    axes: { rigueur: 0.2 },
    chiffrage: 'Hypothèse de jeu : environ 0,2 Md€ par an.',
  },
  {
    id: 'prime_partage_valeur',
    nom: 'Prime de partage de la valeur renforcée',
    categorie: 'travail', pays: FR, vehicule: 'PLF', orientation: 'liberale',
    resume: 'Relever le plafond de la prime que les entreprises peuvent verser à leurs salariés sans cotisations ni impôt, et prolonger l\'exonération.',
    pedagogie: 'La prime de partage de la valeur, créée en 2022 après la « prime Macron » de 2019, permet de verser jusqu\'à 3 000 € par an (6 000 € avec un accord d\'intéressement) exonérés de cotisations. Elle soutient le pouvoir d\'achat sans peser sur les entreprises qui ne la versent pas, mais elle peut se substituer à des hausses de salaire et prive la Sécurité sociale de cotisations.',
    pour: ['Pouvoir d\'achat immédiat, à la main des entreprises', 'Populaire chez les salariés et les patrons'],
    contre: ['Remplace parfois des augmentations de salaire', 'Manque à gagner pour la Sécurité sociale', 'Inégalitaire : surtout versée par les grandes entreprises'],
    options: [{ id: 'relever', nom: 'Plafond relevé et exonération d\'impôt prolongée' }],
    positionsGroupes: { EPR: 0.6, HOR: 0.5, DEM: 0.5, DR: 0.6, UDR: 0.5, RN: 0.4, LIOT: 0.3, SOC: -0.2, ECOS: -0.3, LFI: -0.5, GDR: -0.5 },
    delai: 1,
    effets: (e) => ({ recettes: { cotisations: -1.2 * prix(e) }, chocDemande: 0.02, menages: { smic: [{ montant: 20, texte: 'Prime de partage de la valeur (moyenne, si versée)' }], couple: [{ montant: 35, texte: 'Prime de partage de la valeur (moyenne, si versée)' }] } }),
    reaction: () => ({ chocs: { salaries: 4, entrepreneurs: 2, jeunes: 1 }, opinion: { salaries: 1.5 } }),
    axes: { marche: 0.3, social: 0.2, rigueur: -0.2 },
    chiffrage: 'Hypothèse de jeu : environ 1,2 Md€ de cotisations en moins par an.',
  },
  {
    id: 'plafond_depense_pib',
    nom: 'Ramener la dépense publique de 57 % à 47,5 %, 45 % ou 43 % du PIB en cinq ans',
    categorie: 'depenses', pays: FR, vehicule: 'loi', orientation: 'liberale',
    resume: 'Une loi de programmation fixe un plafond de dépense publique en part du PIB, atteint en cinq ans puis abaissé encore pendant cinq ans. Chaque trimestre, les économies s\'ajustent pour suivre la trajectoire, sur tous les postes, retraites et santé comprises.',
    pedagogie: 'En 2025, la dépense publique a atteint 57,3 % du PIB selon l\'Insee (57,2 % en première estimation, 57,0 % en 2024), l\'un des niveaux les plus élevés d\'Europe : 49,5 % dans l\'Union européenne et 49,8 % dans la zone euro. Un point de PIB vaut environ 30 Md€. Passer à 47,5 % en cinq ans, c\'est près de 300 Md€ d\'économies par an aux prix de 2026, plus que toute la dépense de santé ; descendre à 38 %, proche du niveau de la France du milieu des années 1960, en demande près de 600. Les retraites (un quart de la dépense) et la santé ne peuvent pas être épargnées. Dans le jeu, la trajectoire est suivie chaque trimestre : moins de dépense freine aussi l\'activité, donc le PIB, et il faut couper davantage que l\'écart initial. Sans baisse d\'impôts décidée par ailleurs (onglet Impôts), l\'État dégagerait vite un excédent. Dans la réalité, une loi de programmation n\'oblige pas : chaque budget doit ensuite être voté.',
    pour: ['Rapprocher la France de ses voisins et redresser durablement les comptes', 'Désendettement rapide, taux d\'intérêt plus bas, marges pour baisser les impôts', 'Oblige à réformer l\'État et à évaluer chaque dépense'],
    contre: ['Choc récessif : chômage en hausse pendant plusieurs années', 'Baisse des pensions, des remboursements de soins et des prestations', 'Services publics dégradés, rejet social et politique très fort'],
    exemples: ['Suède : dépense publique ramenée d\'environ 72 % du PIB en 1993 à 55 % en 2000, après une crise bancaire et avec une forte croissance', 'France : environ 35 % du PIB au début des années 1960, 41,9 % en 1968', 'Zone euro : 49,8 % du PIB en 2025'],
    sources: [
      { texte: 'Insee Première n° 2106 : comptes des administrations publiques en 2025 (57,3 % du PIB)', url: 'https://www.insee.fr/fr/statistiques/8997691' },
      { texte: 'Insee : première estimation des comptes publics 2025 (mars 2026, 57,2 % du PIB)', url: 'https://www.insee.fr/fr/statistiques/8956575' },
      { texte: 'Insee : dépenses des administrations publiques dans l\'Union européenne', url: 'https://www.insee.fr/fr/statistiques/2381406' },
      { texte: 'CESifo, rapport EEAG 2012 : la consolidation budgétaire suédoise (71,7 % du PIB en 1993, 55,1 % en 2000)', url: 'https://www.cesifo.org/DocDL/eeag_report_chap4_2012.pdf' },
    ],
    options: [
      { id: '47_43', nom: '47,5 % du PIB en cinq ans, puis 43 % en dix ans' },
      { id: '45_40', nom: '45 % du PIB en cinq ans, puis 40 % en dix ans' },
      { id: '43_38', nom: '43 % du PIB en cinq ans, puis 38 % en dix ans' },
    ],
    remplace: ['choc_depenses'],
    delai: 1,
    /** Pilotage trimestriel : anticipation de la trajectoire, puis correction de l'écart constaté. */
    piloter(e, entree, age) {
      const pib = e.macro.pibNominal;
      const ratio = (e.finances.depenses / pib) * 100;
      const p = (entree.pilotage ??= { depart: ratio, economie: 0, age: -1, ratio, cible: ratio });
      if (p.age === age) return;
      const avant = cibleDepensePIB(entree.option, age - 1, p.depart);
      const cible = cibleDepensePIB(entree.option, age, p.depart);
      const plafond = ECONOMIE_MAX * (e.finances.depenses + p.economie);
      p.economie = Math.min(plafond, Math.max(0, p.economie + (pib / 100) * ((avant - cible) + 0.6 * (ratio - avant))));
      p.horsAtteinte = p.economie >= plafond - 1e-6;
      p.age = age; p.ratio = ratio; p.cible = cible;
    },
    effets(e, o, age, entree) {
      const economie = entree?.pilotage?.economie ?? 0;
      if (economie <= 0) return {};
      const depenses = repartirParPoids(e, -economie);
      const part = economie / (e.finances.depenses + economie);
      const partRetraites = Math.min(0.6, -depenses.retraites / Math.max(1, e.retraites?.depenses ?? e.budget.retraites.montant));
      const pension = e.statique.retraites?.pensionMoyenne ?? 1750;
      return {
        depenses,
        // Moins de transferts : un peu plus d'incitations à travailler (hypothèse de jeu, modeste)
        offreTravail: 1.2 * part, potentielBonus: 0.15 * part,
        menages: {
          retraite: [{ montant: -Math.round(partRetraites * pension), texte: 'Baisse des pensions (plafond de dépense publique)' }],
          smic: [{ montant: -Math.round(400 * 1.2 * part), texte: 'Baisse de la prime d\'activité et des aides au logement (estimation)' }],
          fonctionnaire: [{ montant: -Math.round(2400 * 0.5 * part), texte: 'Gel puis baisse des rémunérations publiques (estimation)' }],
        },
      };
    },
    reaction: (e, o) => {
      const k = { '47_43': 1, '45_40': 1.3, '43_38': 1.6 }[o] ?? 1;
      return { chocs: { fonctionnaires: -14 * k, retraites: -10 * k, jeunes: -4 * k, salaries: -3 * k, agriculteurs: -3 * k, entrepreneurs: 5 }, grief: { fonctionnaires: 14 * k, retraites: 10 * k, salaries: 3 * k }, credibilite: 0.15, instabilite: 0.1 * k };
    },
    axes: { rigueur: 1, marche: 0.8, social: -1, fiscal: -0.3 },
    axesParOption: { '45_40': { rigueur: 1.2, social: -1.3 }, '43_38': { rigueur: 1.4, social: -1.6 } },
    positionsGroupesParOption: {
      '47_43': { DR: 0.6, UDR: 0.7, HOR: 0.5, EPR: 0.1, DEM: -0.2, LIOT: -0.4, RN: -0.6, SOC: -1, ECOS: -1, LFI: -1, GDR: -1 },
      '45_40': { DR: 0.4, UDR: 0.6, HOR: 0.2, EPR: -0.2, DEM: -0.5, LIOT: -0.6, RN: -0.8, SOC: -1, ECOS: -1, LFI: -1, GDR: -1 },
      '43_38': { DR: 0.1, UDR: 0.4, HOR: -0.2, EPR: -0.5, DEM: -0.7, LIOT: -0.8, RN: -0.9, SOC: -1, ECOS: -1, LFI: -1, GDR: -1 },
    },
    chiffrage: 'Écart à combler aux prix de 2026 : environ 300 Md€ par an à cinq ans pour 47,5 %, 375 Md€ pour 45 %, 435 Md€ pour 43 % ; à dix ans, environ 435, 525 et 590 Md€. Comme la baisse de la dépense réduit aussi le PIB, il faut couper davantage : dans le jeu, de l\'ordre de 450 à 650 Md€ par an au bout de cinq ans selon la trajectoire. Les économies sont recalculées chaque trimestre ; répartition et plafond (45 % de la dépense au plus) : hypothèses de jeu.',
  },
  {
    id: 'fonds_souverain',
    nom: 'Créer un fonds souverain français',
    categorie: 'depenses', pays: FR, vehicule: 'loi',
    resume: 'Un fonds public d\'investissement de long terme, géré de façon indépendante, qui prend des participations dans les entreprises stratégiques et innovantes (énergie, défense, santé, intelligence artificielle) pour soutenir l\'investissement, la croissance et la souveraineté.',
    pedagogie: 'Un fonds souverain place de l\'argent public dans des entreprises plutôt que de le dépenser. Pour les comptes publics, acheter des actions à des conditions de marché est une opération financière : la dette augmente si l\'achat est emprunté, mais pas le déficit. L\'effet économique passe par l\'investissement : à court terme, il soutient l\'activité (utile pour amortir la perte de PIB d\'une forte baisse de la dépense publique) ; à long terme, il augmente le capital productif. La Norvège a accumulé plus de 1 500 Md€ grâce au pétrole et ne dépense chaque année que le rendement attendu (environ 3 %). La France a eu le Fonds stratégique d\'investissement (2008), intégré à Bpifrance, le Fonds pour l\'innovation et l\'industrie (2018, 10 Md€ issus de privatisations) et le plan France 2030 (54 Md€). Risques : emprunter à près de 5 % pour placer en actions est un pari ; un fonds trop proche du pouvoir peut soutenir des entreprises condamnées plutôt que les plus prometteuses.',
    pour: ['Soutenir l\'investissement et la croissance de long terme', 'Garder en France le capital des entreprises stratégiques', 'Amortir le choc récessif d\'une forte baisse de la dépense publique'],
    contre: ['Risque financier (rendement incertain, emprunt à près de 5 %)', 'Risque de choix politiques plutôt qu\'économiques', 'Dette publique plus élevée si le fonds est financé à crédit'],
    exemples: ['Norvège : fonds souverain alimenté par le pétrole, plus de 1 500 Md€ (ordre de grandeur)', 'Singapour : Temasek et GIC', 'France : Fonds stratégique d\'investissement (2008), Fonds pour l\'innovation et l\'industrie (2018), France 2030 (54 Md€)'],
    sources: [
      { texte: 'Norges Bank Investment Management : le fonds souverain norvégien', url: 'https://www.nbim.no/' },
      { texte: 'Bpifrance : la banque publique d\'investissement', url: 'https://www.bpifrance.fr/' },
    ],
    options: [
      { id: 'participations', nom: 'Apporter les participations de l\'État et réinvestir leurs dividendes (environ 4 Md€ par an)' },
      { id: 'emprunt', nom: 'Emprunter 20 Md€ par an pendant cinq ans pour investir (100 Md€)' },
      { id: 'epargne', nom: 'Un livret souverain : flécher 10 Md€ d\'épargne des Français par an' },
      { id: 'economies', nom: 'Réinvestir 25 % des économies du plafond de dépense publique (pour amortir la perte de PIB)' },
    ],
    delai: 2,
    /**
     * Portefeuille du fonds : apports du trimestre placés sur le CAC 40, le
     * S&P 500, le STOXX Europe 600 et les marchés émergents selon la
     * répartition choisie ; cours et dividendes réinvestis (voir engine/fondsSouverain.js).
     */
    piloter(e, entree, age) {
      const p = (entree.pilotage ??= { capital: 0, flux: 0, age: -1 });
      if (p.age === age) return;
      let flux = 0;
      if (entree.option === 'participations') flux = e.entreprises?.dividendes ?? 4.3;
      else if (entree.option === 'emprunt') flux = age < 20 ? 20 * prix(e) : 0;
      else if (entree.option === 'epargne') flux = 10 * prix(e) * rampe(age, 4);
      else if (entree.option === 'economies') flux = 0.25 * (e.reformes.actives.find((a) => a.id === 'plafond_depense_pib')?.pilotage?.economie ?? 0);
      avancerFonds(e, entree, flux);
      p.age = age;
    },
    effets(e, o, age, entree) {
      const p = entree?.pilotage;
      if (!p) return {};
      const pib = e.macro.pibNominal;
      const fluxPIB = (p.flux / pib) * 100;
      const capitalPIB = (p.capital / pib) * 100;
      // Seule la part placée dans des entreprises françaises (CAC 40, part française du STOXX Europe 600)
      // soutient l'investissement en France ; le reste diversifie les risques et rapporte, sans effet sur l'activité
      const france = partFrance(p);
      const k = o === 'epargne' ? 0.3 : 0.6;
      const eff = {
        chocDemande: k * fluxPIB * 0.2 * france,
        potentielBonus: Math.min(0.3, 0.012 * capitalPIB * france),
        souverainete: Math.min(4, 0.3 * capitalPIB * france),
        influence: Math.min(1.5, 0.04 * capitalPIB),
      };
      if (o === 'participations') eff.recettes = { fixe: -p.flux };
      if (o === 'emprunt' || o === 'economies') eff.cessions = -p.flux / 4;
      return eff;
    },
    reaction: (e, o) => ({ chocs: o === 'emprunt' ? { entrepreneurs: 2 } : { entrepreneurs: 2, salaries: 1 }, credibilite: o === 'emprunt' ? -0.05 : 0.02 }),
    axes: { marche: 0.2, europe: -0.1 },
    axesParOption: { emprunt: { rigueur: -0.6, marche: 0.1 }, economies: { rigueur: 0.4 } },
    positionsGroupesParOption: {
      participations: { DR: 0.3, UDR: 0.3, EPR: 0.4, HOR: 0.3, DEM: 0.4, RN: 0.3, LIOT: 0.2, SOC: 0.2, ECOS: 0, LFI: -0.2, GDR: -0.1 },
      emprunt: { DR: -0.4, UDR: -0.3, EPR: -0.1, HOR: -0.4, DEM: 0, RN: 0.4, LIOT: 0, SOC: 0.3, ECOS: 0.2, LFI: 0.4, GDR: 0.4 },
      epargne: { DR: 0.4, UDR: 0.4, EPR: 0.4, HOR: 0.3, DEM: 0.4, RN: 0.5, LIOT: 0.3, SOC: 0.2, ECOS: 0, LFI: -0.1, GDR: 0 },
      economies: { DR: 0.5, UDR: 0.5, EPR: 0.3, HOR: 0.5, DEM: 0.2, RN: 0.1, LIOT: -0.2, SOC: -0.5, ECOS: -0.5, LFI: -0.8, GDR: -0.8 },
    },
    chiffrage: 'Apports : dividendes de l\'État (4,3 Md€ en 2025, APE), 20 Md€ empruntés par an pendant cinq ans, 10 Md€ d\'épargne par an, ou 25 % des économies du plafond de dépense (de 70 à 160 Md€ par an selon la trajectoire). Rendement de 5 % par an réinvesti, effets sur l\'activité et la croissance potentielle : hypothèses de jeu.',
  },
];
