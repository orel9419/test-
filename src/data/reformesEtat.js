/**
 * Réformes de l'État et mesures populaires (France) : intelligence
 * artificielle dans la fonction publique, règle de performance budgétaire,
 * train de vie de l'État, prime de partage de la valeur.
 *
 * Montants sans source : hypothèses de jeu, signalées comme telles.
 */

const rampe = (age, n) => Math.min(1, Math.max(0, (age + 1) / n));
const prix = (e) => e.macro.niveauPrix / 100;
const FR = ['france'];
const ans = (age) => Math.max(0, age) / 4;

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
];
