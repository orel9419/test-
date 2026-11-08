/**
 * Programme de La France insoumise pour la présidentielle de 2027, traduit en
 * réformes jouables (France) :
 * - « L'Avenir en commun », 6e édition (1 069 mesures) ;
 * - « Comment nous allons remettre de l'ordre dans les comptes publics »,
 *   orientations budgétaires pour 2027 présentées le 14 octobre 2026 :
 *   106,4 Md€ de recettes nouvelles, 81,7 Md€ de dépenses d'urgence, soit
 *   24,7 Md€ de réduction du déficit, et 100 Md€ d'investissements de plus par
 *   an portés par un pôle public bancaire ;
 * - « Pour un pôle public bancaire au service des besoins » (octobre 2026).
 *
 * Les montants sont ceux de La France insoumise (première année, Md€ de 2027).
 * Leur répartition entre les postes du budget du jeu, les effets sur l'emploi,
 * la croissance et les émissions, et l'option « prudente » des recettes sont
 * des hypothèses de jeu, signalées comme telles.
 * Conventions : voir src/data/reformes.js.
 */

const rampe = (age, n) => Math.min(1, Math.max(0, (age + 1) / n));
const prix = (e) => e.macro.niveauPrix / 100;
const ans = (age) => Math.max(0, age) / 4;
const FR = ['france'];

/** Multiplie chaque montant d'un objet { poste: Md€ } par k. */
const echelle = (montants, k) => Object.fromEntries(Object.entries(montants).map(([id, v]) => [id, v * k]));
/** Somme des montants d'une liste de mesures [{ montant }]. */
const total = (mesures) => mesures.reduce((s, m) => s + m.montant, 0);
/** Nombre au format français (virgule décimale). */
const fr = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
/** « Texte » d'une mesure en début de liste : minuscule initiale (les sigles sont conservés). */
const enListe = (mesures) => mesures.map((m) => `${m.texte[0].toLowerCase()}${m.texte.slice(1)} (${fr(m.montant)})`).join(' ; ');
/** Rendement retenu par l'option « prudente » des recettes (hypothèse de jeu). */
export const PART_PRUDENTE = 0.5;

export const DOCUMENTS_LFI = {
  programme: { texte: 'Mélenchon 2027 : découvrir le programme (L\'Avenir en commun, 6e édition, 1 069 mesures)', url: 'https://melenchon2027.fr/programme/decouvrir/' },
  comptes: { texte: 'La France insoumise : « Comment nous allons remettre de l\'ordre dans les comptes publics », orientations budgétaires 2027 (octobre 2026)', url: 'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf' },
  banque: { texte: 'La France insoumise : « Pour un pôle public bancaire au service des besoins » (octobre 2026)', url: 'https://melenchon2027.fr/wp-content/uploads/2026/10/DP-POLE-PUBLIC-BANCAIRE_ST.pdf' },
  lcp: { texte: 'LCP : contre-budget, LFI propose 106,4 Md€ de recettes supplémentaires et 81,7 Md€ de dépenses nouvelles', url: 'https://lcp.fr/actualites/contre-budget-lfi-propose-1064-milliards-d-euros-de-recettes-supplementaires-et-817' },
  economistes: { texte: 'AFP (Fortuneo) : des économistes jugent « peu détaillé » et « optimiste » le contre-budget de LFI', url: 'https://bourse.fortuneo.fr/actualites/des-economistes-jugent-peu-detaille-et-optimiste-le-contre-budget-de-lfi-9369230' },
  senat: { texte: 'Public Sénat : Jean-Luc Mélenchon table sur 106 Md€ de recettes supplémentaires et 82 Md€ de dépenses nouvelles pour 2027', url: 'https://www.publicsenat.fr/actualites/politique/presidentielle-2027-jean-luc-melenchon-table-sur-106-milliards-de-recettes-supplementaires-et-82-milliards-de-depenses-nouvelles-pour-2027' },
  dette: { texte: 'Public Sénat : la piste d\'une annulation partielle de la dette se heurte à de nombreuses difficultés', url: 'https://www.publicsenat.fr/actualites/politique/dette-publique-la-piste-dune-annulation-partielle-defendue-par-jean-luc-melenchon-se-heurte-a-de-nombreuses-difficultes' },
  livretB: { texte: 'Selectra : le « livret B » de LFI, ce que prévoit le contre-budget', url: 'https://selectra.info/finance/actualites/marche/livret-b-lfi-assurance-vie-contre-budget' },
};
const D = DOCUMENTS_LFI;

/** Les mesures chiffrées du document budgétaire, par chapitre (Md€, première année). */
export const BUDGET_LFI_2027 = {
  revenus: [
    { texte: 'Point d\'indice des fonctionnaires +10 %', montant: 17 },
    { texte: 'Indexation de toutes les pensions, allocations familiales et APL, ces deux dernières rehaussées de 10 %', montant: 8 },
    { texte: 'Logements d\'urgence et réquisition de logements vacants', montant: 3 },
    { texte: 'Garantie d\'autonomie des jeunes (aucun jeune sous le seuil de pauvreté, 1 337 € par mois)', montant: 9.5 },
  ],
  servicesPublics: [
    { texte: '10 000 postes d\'enseignants', montant: 0.5 },
    { texte: 'Cantine scolaire gratuite', montant: 3.6 },
    { texte: '250 000 places à l\'université, abolition de Parcoursup et MonMaster', montant: 3.5 },
    { texte: 'Hôpital public, dont au moins 10 000 soignants', montant: 3 },
    { texte: 'Plan d\'urgence contre les violences sexistes et sexuelles', montant: 2.6 },
    { texte: 'Lutte contre les violences faites aux enfants', montant: 2 },
    { texte: 'Annulation des coupes depuis 2026 et indexation (travail, logement, culture, sport, diplomatie, aide au développement)', montant: 7 },
  ],
  planification: [
    { texte: 'Rénovation thermique (700 000 par an), bâtiments publics, adaptation aux canicules, pompiers et sécurité civile', montant: 10 },
  ],
  securiteSociale: [
    { texte: 'Abrogation de la réforme des retraites de 2023 (premier pas vers 60 ans et 40 annuités)', montant: 9 },
    { texte: 'Abrogation des réformes de l\'assurance chômage', montant: 3 },
  ],
  cadeauxFiscaux: [
    { texte: 'Suppression de la « flat tax » sur les revenus du capital', montant: 9 },
    { texte: 'Impôt sur la fortune renforcé (« ISF climatique »)', montant: 10 },
    { texte: 'Rabot et suppression de niches fiscales et sociales, dont les exonérations de cotisations au-dessus de 2 SMIC', montant: 22 },
    { texte: 'Rétablissement de la CVAE des plus grandes entreprises', montant: 3 },
  ],
  ultraRiches: [
    { texte: 'Taxe « Zucman » sur les patrimoines de plus de 100 M€', montant: 15 },
    { texte: 'Réforme des droits de succession', montant: 20 },
  ],
  entreprises: [
    { texte: 'Réforme de l\'impôt sur les sociétés', montant: 3 },
    { texte: 'Taxe universelle sur les multinationales (selon l\'activité réelle en France)', montant: 5 },
    { texte: 'Taxe sur les services numériques (« GAFAM ») renforcée', montant: 3.9 },
    { texte: 'Taxe sur les superprofits', montant: 5 },
    { texte: 'Taxes sur les transactions financières', montant: 5 },
    { texte: 'Taxe sur les rachats d\'actions', montant: 2.5 },
    { texte: 'Taxe sur les cryptoactifs', montant: 1 },
    { texte: 'Lutte contre la fraude fiscale (reconstruction des effectifs)', montant: 2 },
  ],
};
const B = BUDGET_LFI_2027;

/** Fiche de la source, pour le filtre et les étiquettes de l'écran Réformes. */
export const SOURCE_LFI = {
  lfi: {
    nom: 'La France insoumise',
    icone: 'φ',
    court: 'LFI',
    article: 'La France insoumise',
    deNom: 'de La France insoumise',
    description: 'Mouvement de Jean-Luc Mélenchon, candidat à l\'élection présidentielle de 2027. Son programme, « L\'Avenir en commun » (6e édition, 1 069 mesures), est complété par des plans thématiques et d\'investissement et, depuis le 14 octobre 2026, par des orientations budgétaires pour 2027 : faire payer les plus riches et les grandes entreprises pour financer des dépenses d\'urgence et réduire le déficit, et investir massivement par un pôle public bancaire. Les montants affichés sont ceux de LFI ; des économistes les jugent « optimistes », surtout pour les recettes.',
    documents: [D.programme, D.comptes, D.banque, D.economistes],
    bilan: [
      { libelle: 'Recettes nouvelles', montant: 106.4 },
      { libelle: 'Dépenses d\'urgence', montant: -81.7 },
      { libelle: 'Réduction du déficit annoncée', montant: 24.7, total: true },
      { libelle: 'Investissements du pôle public bancaire (hors budget de l\'État)', montant: 100, horsBudget: true },
    ],
  },
};

const RECETTES = [
  { id: 'annonce', nom: 'Rendement annoncé par La France insoumise' },
  { id: 'prudent', nom: 'Hypothèse prudente : moitié du rendement annoncé', description: 'Hypothèse de jeu : départs et optimisation des contribuables visés, montée en charge, contentieux devant le Conseil constitutionnel.' },
];
const partRecettes = (o) => (o === 'prudent' ? PART_PRUDENTE : 1);
const notePrudente = `Option prudente : ${Math.round(PART_PRUDENTE * 100)} % du rendement annoncé (hypothèse de jeu).`;

export const REFORMES_LFI = [
  // ======================================================================
  // DÉPENSES D'URGENCE (81,7 Md€ ; la sécurité sociale passe par les réformes existantes)
  // ======================================================================
  {
    id: 'lfi_revenus',
    nom: 'Budget LFI 2027 : relancer par les revenus populaires (37,5 Md€)',
    categorie: 'protection_sociale', pays: FR, vehicule: 'PLF', orientation: 'sociale', inspirations: ['lfi'],
    resume: 'Augmenter de 10 % le point d\'indice des fonctionnaires, indexer toutes les pensions, rehausser de 10 % les allocations familiales et les APL, financer des logements d\'urgence et créer une garantie d\'autonomie pour les jeunes.',
    pedagogie: 'Pour La France insoumise, la France est au bord de la récession parce que le pouvoir d\'achat des ménages a baissé deux années de suite : la consommation représente la moitié du PIB. Le budget doit donc relever d\'abord les revenus que l\'État fixe lui-même. Le point d\'indice a été gelé huit années sur dix sous Emmanuel Macron. La garantie d\'autonomie doit sortir tous les jeunes de la pauvreté (seuil de 1 337 € par mois). Dans le jeu, une hausse de dépense soutient l\'activité surtout quand l\'économie est en bas de cycle, mais elle creuse aussi le déficit si les recettes ne suivent pas : c\'est tout l\'enjeu du « contre-budget ».',
    pour: ['Soutien immédiat à la consommation, donc à l\'activité', 'Attractivité de la fonction publique, qui peine à recruter (enseignants, soignants)', 'Recul de la pauvreté des jeunes'],
    contre: ['37,5 Md€ de dépenses pérennes dès la première année', 'Une partie de la hausse est épargnée ou importée (effet sur l\'activité plus faible)', 'Le point d\'indice pèse aussi sur les collectivités et les hôpitaux'],
    exemples: ['2022 : hausse de 3,5 % du point d\'indice, environ 7,5 Md€ par an', 'Danemark : allocation d\'études (SU) versée à tous les étudiants'],
    sources: [D.comptes, D.lcp],
    options: [{ id: 'urgence', nom: 'Les quatre mesures d\'urgence (37,5 Md€ par an)' }],
    remplace: ['point_indice_hausse', 'gel_point_indice', 'rsa_jeunes'],
    delai: 1,
    effets(e, o, age) {
      const r = rampe(age, 2) * prix(e);
      return {
        depenses: echelle({ education: 6.8, sante: 3.8, interieurJustice: 3, economieFinances: 3.4, protectionSociale: 14.5, logement: 6 }, r),
        offreTravail: -0.02,
        menages: {
          fonctionnaire: [{ montant: 250, texte: 'Point d\'indice +10 %' }],
          jeune: [{ montant: 110, texte: 'Garantie d\'autonomie des jeunes (effet moyen)' }],
          couple: [{ montant: 20, texte: 'Allocations familiales et APL +10 %' }],
          smic: [{ montant: 15, texte: 'APL +10 %' }],
        },
      };
    },
    reaction: () => ({ chocs: { fonctionnaires: 14, jeunes: 9, salaries: 3, retraites: 1, entrepreneurs: -4 }, credibilite: -0.15 }),
    axes: { social: 0.9, rigueur: -0.9 },
    positionsGroupes: { LFI: 1, GDR: 1, ECOS: 0.7, SOC: 0.4, LIOT: -0.3, DEM: -0.7, EPR: -0.9, HOR: -1, DR: -1, UDR: -0.8, RN: -0.3 },
    chiffrage: `La France insoumise : ${enListe(B.revenus)}. Total ${fr(total(B.revenus))} Md€ par an. Répartition entre les postes du jeu : hypothèse de jeu.`,
  },
  {
    id: 'lfi_services_publics',
    nom: 'Budget LFI 2027 : services publics d\'urgence (22,2 Md€)',
    categorie: 'education', pays: FR, vehicule: 'PLF', orientation: 'sociale', inspirations: ['lfi'],
    resume: '10 000 postes d\'enseignants, cantine gratuite, 250 000 places à l\'université, 3 Md€ pour l\'hôpital, plans contre les violences sexistes et sexuelles et contre les violences faites aux enfants, annulation des coupes budgétaires depuis 2026.',
    pedagogie: 'LFI veut rapprocher la France de la moyenne européenne de 19 élèves par classe (23 aujourd\'hui ; 70 % des classes du secondaire public dépassent 30 élèves). Elle propose d\'abolir Parcoursup et MonMaster et d\'« adapter l\'université aux étudiants » plutôt que l\'inverse, et d\'atteindre les 3 Md€ demandés par les associations contre les violences sexistes et sexuelles. Le jeu compte ces dépenses dans les postes Éducation, Recherche et enseignement supérieur, Santé, Intérieur et justice, Protection sociale et dans les ministères touchés par les coupes de 2026 (travail, logement, culture, diplomatie).',
    pour: ['Réponse aux mobilisations lycéennes et étudiantes', 'Services publics plus présents, moins de renoncement aux soins', 'Investissement dans l\'éducation, favorable à la croissance à long terme'],
    contre: ['Recruter 10 000 enseignants et 10 000 soignants prend du temps (concours, formation)', 'Cantine gratuite aussi pour les familles aisées', 'Dépenses pérennes'],
    exemples: ['Finlande, Suède : repas scolaire gratuit pour tous les élèves', 'Paris et plusieurs villes : cantine gratuite ou presque pour les familles modestes'],
    sources: [D.comptes, D.lcp],
    options: [{ id: 'urgence', nom: 'Le plan complet (22,2 Md€ par an)' }],
    remplace: ['cantine', 'plan_hopital'],
    delai: 1,
    effets(e, o, age) {
      const r = rampe(age, 2) * prix(e);
      return {
        depenses: echelle({ education: 4.1, recherche: 3.5, sante: 3, interieurJustice: 2.3, protectionSociale: 2.3, travailEmploi: 1.5, logement: 1.5, culture: 1.5, affairesEtrangeres: 2.5 }, r),
        potentielBonus: 0.01 * rampe(age, 20),
        menages: {
          smic: [{ montant: 40, texte: 'Cantine gratuite' }],
          couple: [{ montant: 60, texte: 'Cantine gratuite' }],
          jeune: [{ montant: 10, texte: 'Places à l\'université' }],
        },
      };
    },
    reaction: () => ({ chocs: { fonctionnaires: 6, jeunes: 5, salaries: 2, retraites: 1, entrepreneurs: -2 }, credibilite: -0.08 }),
    axes: { social: 0.8, rigueur: -0.7 },
    positionsGroupes: { LFI: 1, GDR: 1, ECOS: 0.9, SOC: 0.7, LIOT: 0, DEM: -0.4, EPR: -0.6, HOR: -0.8, DR: -0.8, UDR: -0.7, RN: -0.2 },
    chiffrage: `La France insoumise : ${enListe(B.servicesPublics)}. Total ${fr(total(B.servicesPublics))} Md€ par an. Répartition entre les postes du jeu : hypothèse de jeu.`,
  },
  {
    id: 'lfi_planification',
    nom: 'Budget LFI 2027 : enclencher la planification écologique (10 Md€)',
    categorie: 'energie', pays: FR, vehicule: 'PLF', orientation: 'sociale', inspirations: ['lfi'],
    resume: 'Passer à 700 000 rénovations thermiques par an, rénover les écoles et les hôpitaux, adapter le pays aux canicules et aux sécheresses, équiper les pompiers et la sécurité civile.',
    pedagogie: 'Selon LFI, les effets du dérèglement climatique (canicules, incendies, sécheresses) ont coûté 16 Md€ à la France en 2026. Résorber les « passoires » et « bouilloires » thermiques (classes F et G) en un mandat suppose 700 000 rénovations par an. Le budget de l\'État n\'en finance qu\'une partie : la plupart des investissements de la planification écologique (énergie, transports, industrie) doivent passer par le pôle public bancaire, parce qu\'ils dégagent des revenus. Le rapport Pisani-Ferry–Mahfouz (2023) chiffrait à 34 Md€ par an d\'ici 2030 l\'effort public supplémentaire nécessaire pour le climat.',
    pour: ['Moins de dégâts et de décès lors des canicules', 'Baisse des factures et des émissions des logements', 'Emplois locaux dans le bâtiment'],
    contre: ['10 Md€ ne suffisent pas à financer 700 000 rénovations complètes (30 000 à 50 000 € chacune)', 'Pénurie d\'artisans qualifiés', 'Résultats sur les émissions lents'],
    exemples: ['MaPrimeRénov\' : environ 90 000 rénovations d\'ampleur en 2024'],
    sources: [D.comptes],
    options: [{ id: 'urgence', nom: 'Plan d\'urgence de 10 Md€ par an' }],
    remplace: ['maprimerenov'],
    delai: 1,
    effets(e, o, age) {
      const r = rampe(age, 2) * prix(e);
      return {
        depenses: echelle({ ecologieEnergie: 4, logement: 2, interieurJustice: 1.5, education: 1, sante: 1, agriculture: 0.5 }, r),
        emissionsEvitees: Math.min(6, 0.5 * ans(age)),
        menages: { smic: [{ montant: 10, texte: 'Rénovation et adaptation des logements (effet moyen)' }], agriculteur: [{ montant: 10, texte: 'Adaptation aux sécheresses' }] },
      };
    },
    reaction: () => ({ chocs: { jeunes: 3, salaries: 1, agriculteurs: 1, fonctionnaires: 1 }, credibilite: -0.04 }),
    axes: { ecologie: 0.9, social: 0.3, rigueur: -0.5 },
    positionsGroupes: { ECOS: 1, LFI: 1, GDR: 0.8, SOC: 0.7, LIOT: 0.1, DEM: -0.2, EPR: -0.3, HOR: -0.5, DR: -0.7, UDR: -0.8, RN: -0.5 },
    chiffrage: 'La France insoumise : 10 Md€ dès la première année. Répartition entre les postes du jeu et émissions évitées (jusqu\'à 6 Mt par an) : hypothèses de jeu.',
  },

  // ======================================================================
  // RECETTES (106,4 Md€)
  // ======================================================================
  {
    id: 'lfi_fiscalite_2017',
    nom: 'Budget LFI 2027 : revenir sur les baisses d\'impôts depuis 2017 (44 Md€)',
    categorie: 'fiscalite', pays: FR, vehicule: 'PLF', orientation: 'sociale', inspirations: ['lfi'],
    resume: 'Supprimer la « flat tax » sur le capital, rétablir un impôt sur la fortune renforcé, raboter les niches fiscales et sociales (dont les exonérations de cotisations au-dessus de 2 SMIC) et rétablir la CVAE des plus grandes entreprises.',
    pedagogie: 'Selon l\'Insee, les recettes publiques ont baissé de 2,1 points de PIB depuis 2017 ; LFI estime que le déficit approcherait 3 % du PIB si elles étaient restées à leur niveau. Le prélèvement forfaitaire unique de 30 % (2018) a remplacé le barème de l\'impôt sur le revenu pour les dividendes et les plus-values ; l\'ISF a laissé place à l\'IFI, limité à l\'immobilier. Les exonérations de cotisations atteignent 75,6 Md€ en 2025, soit 10 % de la masse salariale du privé : au-dessus de 2 SMIC, LFI y voit un effet d\'aubaine. Ses opposants rappellent que ces baisses visaient à attirer l\'investissement et à garder les contribuables mobiles en France.',
    pour: ['Le capital ne serait plus moins taxé que le travail', 'Recettes importantes sans toucher les classes moyennes, selon LFI', 'Les exonérations au-dessus de 2 SMIC ont peu d\'effet sur l\'emploi selon plusieurs évaluations'],
    contre: ['« 106 milliards de recettes, c\'est sur le papier : il y aurait une réponse des contribuables » (Alain Trannoy, EHESS)', 'Coût du travail qualifié en hausse', 'Risque d\'expatriation et de moindre investissement'],
    exemples: ['Avant 2018, l\'ISF rapportait environ 4 à 5 Md€ par an', 'Norvège, Espagne, Suisse : impôts sur la fortune toujours en vigueur'],
    sources: [D.comptes, D.economistes],
    options: RECETTES,
    remplace: ['flat_tax', 'ifi', 'rabot_niches', 'cvae', 'allegements_charges'],
    delai: 2,
    effets(e, o, age) {
      const k = rampe(age, 2) * prix(e) * partRecettes(o);
      return {
        recettes: echelle({ impotRevenu: 9, fixe: 10 + 14 + 3, cotisations: 8 }, k),
        potentielBonus: -0.05, chomageStructurel: 0.05,
        menages: { couple: [{ montant: -20, texte: 'Fin de niches fiscales (moyenne)' }], retraite: [{ montant: -10, texte: 'Fin de niches fiscales (moyenne)' }] },
      };
    },
    reaction: () => ({ chocs: { entrepreneurs: -10, retraites: -2, salaries: 2, jeunes: 2 }, instabilite: 0.02 }),
    axes: { fiscal: 1, social: 0.6, marche: -0.6 },
    positionsGroupes: { LFI: 1, GDR: 1, ECOS: 0.8, SOC: 0.5, LIOT: -0.4, DEM: -0.6, EPR: -1, HOR: -1, DR: -1, UDR: -1, RN: -0.5 },
    chiffrage: `La France insoumise : ${enListe(B.cadeauxFiscaux)}. Total 44 Md€. Partage des niches entre impôts (14) et cotisations (8) : hypothèse de jeu. ${notePrudente}`,
  },
  {
    id: 'lfi_ultra_riches',
    nom: 'Budget LFI 2027 : taxe Zucman et réforme des successions (35 Md€)',
    categorie: 'fiscalite', pays: FR, vehicule: 'PLF', orientation: 'sociale', inspirations: ['lfi'],
    resume: 'Un impôt minimum de 2 % sur les patrimoines de plus de 100 M€ (taxe « Zucman ») et une réforme des droits de succession visant les plus grosses transmissions.',
    pedagogie: 'Une étude du Conseil des prélèvements obligatoires (septembre 2026) confirme, selon LFI, que les 1 % de contribuables les plus aisés ont été les grands gagnants des réformes depuis 2017, et que quelques milliers d\'« ultra-riches » échappent largement à l\'impôt sur le revenu en logeant leur fortune dans des holdings. La taxe Zucman a été votée par l\'Assemblée en février 2025 puis rejetée par le Sénat ; ses chiffrages vont de quelques milliards à plus de 20 Md€ selon les départs à l\'étranger supposés. Les droits de succession rapportent environ 18 Md€ par an : en tirer 20 Md€ de plus dès la première année suppose une réforme profonde (abattements, assurance-vie, transmission d\'entreprises).',
    pour: ['Les 500 plus grandes fortunes ont doublé leur patrimoine depuis 2017', 'Limiter la reproduction des inégalités par l\'héritage', 'Rendement potentiellement élevé'],
    contre: ['Exil fiscal et évaluation délicate des patrimoines professionnels', 'Risque de censure constitutionnelle (caractère confiscatoire)', 'Les droits de succession sont très impopulaires, même chez ceux qui n\'en paient pas'],
    exemples: ['Février 2025 : l\'Assemblée vote la taxe Zucman, le Sénat la rejette', 'Japon, Corée du Sud : droits de succession jusqu\'à 55 % et 50 %'],
    sources: [D.comptes, D.economistes],
    options: RECETTES,
    remplace: ['taxe_hauts_patrimoines', 'successions_allegement'],
    delai: 2,
    effets(e, o, age) {
      const k = rampe(age, 2) * prix(e) * partRecettes(o);
      return { recettes: echelle({ fixe: 15, droitsSuccession: 20 }, k), potentielBonus: -0.025 };
    },
    reaction: () => ({ chocs: { entrepreneurs: -8, retraites: -3, salaries: 2, jeunes: 3 }, credibilite: -0.03, instabilite: 0.02 }),
    axes: { fiscal: 1, social: 0.6 },
    positionsGroupes: { LFI: 1, GDR: 1, ECOS: 0.9, SOC: 0.7, LIOT: -0.3, DEM: -0.5, EPR: -0.9, HOR: -1, DR: -1, UDR: -1, RN: -0.6 },
    chiffrage: `La France insoumise : taxe Zucman (15 Md€) et réforme des successions (20 Md€ la première année). ${notePrudente}`,
  },
  {
    id: 'lfi_grandes_entreprises',
    nom: 'Budget LFI 2027 : grandes entreprises et finance (27,4 Md€)',
    categorie: 'fiscalite', pays: FR, vehicule: 'PLF', orientation: 'sociale', inspirations: ['lfi'],
    resume: 'Réformer l\'impôt sur les sociétés, taxer les multinationales selon leur activité réelle en France, renforcer la taxe « GAFAM », taxer les superprofits, les transactions financières, les rachats d\'actions et les cryptoactifs, et renforcer la lutte contre la fraude fiscale.',
    pedagogie: 'LFI relève que le taux implicite d\'impôt sur les sociétés est de près de 24 % pour les PME contre 14,7 % pour les grandes entreprises, grâce aux niches et au transfert des profits vers des pays à fiscalité réduite. Une « taxe universelle » imposerait les multinationales selon leur chiffre d\'affaires réalisé en France. L\'impôt minimum mondial de 15 % (OCDE, 2024) va dans ce sens, mais à l\'échelle internationale. La lutte contre la fraude s\'appuierait sur la reconstruction des effectifs de contrôleurs (coût estimé par le jeu).',
    pour: ['Faire contribuer les profits délocalisés', 'Préserver les PME et les TPE', 'Freiner la spéculation (transactions, rachats d\'actions)'],
    contre: ['Une taxe nationale sur les multinationales peut se heurter aux conventions fiscales et aux représailles (États-Unis et taxe numérique)', 'Les transactions financières peuvent se déplacer vers d\'autres places', 'Rendement des superprofits très variable'],
    exemples: ['France : taxe sur les services numériques de 3 % depuis 2019', 'Royaume-Uni : droit de timbre de 0,5 % sur les achats d\'actions'],
    sources: [D.comptes, D.economistes],
    options: RECETTES,
    remplace: ['taxe_superprofits', 'rachats_actions', 'plan_antifraude'],
    delai: 2,
    appliquer(e) { if (e.entreprises) e.entreprises.rachats = true; },
    annuler(e) { if (e.entreprises) e.entreprises.rachats = false; },
    effets(e, o, age) {
      const k = rampe(age, 2) * prix(e) * partRecettes(o);
      return {
        recettes: echelle({ impotSocietes: 3 + 5 + 5 + 2.5, fixe: 3.9 + 5 + 1 + 2 }, k),
        depenses: { economieFinances: 0.3 * prix(e) },
        potentielBonus: -0.03,
      };
    },
    reaction: () => ({ chocs: { entrepreneurs: -8, salaries: 2, jeunes: 1 }, credibilite: -0.02 }),
    axes: { fiscal: 0.9, marche: -0.6 },
    positionsGroupes: { LFI: 1, GDR: 1, ECOS: 0.9, SOC: 0.6, LIOT: -0.2, DEM: -0.4, EPR: -0.8, HOR: -0.9, DR: -0.9, UDR: -1, RN: -0.2 },
    chiffrage: `La France insoumise : ${enListe(B.entreprises)}. Total 27,4 Md€. Coût des contrôleurs (0,3 Md€) : hypothèse de jeu. ${notePrudente}`,
  },

  // ======================================================================
  // HORS BUDGET : PÔLE PUBLIC BANCAIRE ET BCE
  // ======================================================================
  {
    id: 'lfi_pole_bancaire',
    nom: 'Pôle public bancaire : 100 Md€ d\'investissements de plus par an',
    categorie: 'dette', pays: FR, vehicule: 'loi', orientation: 'sociale', inspirations: ['lfi'],
    resume: 'Réunir la Caisse des dépôts, Bpifrance, la Banque postale et la SFIL en un pôle public bancaire qui finance la planification écologique et la souveraineté, avec davantage d\'épargne des livrets réglementés et un nouveau « livret B ».',
    pedagogie: 'Selon LFI, le « pôle financier public » injecte déjà environ 100 Md€ par an dans l\'économie (Bpifrance 29, Banque des territoires 43, Banque postale 14, SFIL 9) ; l\'objectif est d\'atteindre 200 Md€. Les ressources viendraient de la SFIL (30 Md€), de la part de l\'épargne des livrets reversée à la Caisse des dépôts portée de 60 % à 80 % (140 Md€), du plafond du livret A relevé de 22 950 € à 30 000 € (jusqu\'à 40 Md€ selon la Caisse des dépôts), d\'un « livret B » bloqué 3, 5 ou 10 ans et défiscalisé, et du refinancement auprès de la BCE. Ces prêts ne comptent pas dans le déficit public, mais une partie de l\'épargne déplacée aurait de toute façon financé l\'économie par les banques privées : le jeu suppose qu\'un quart seulement des investissements s\'ajoute vraiment à l\'existant. Il compte aussi un coût budgétaire : livrets rémunérés au moins à l\'inflation (aides à la pierre pour compenser les bailleurs sociaux) et défiscalisation du livret B.',
    pour: ['L\'investissement public net est passé de 3 % à 0,5 % du PIB depuis les années 1970', 'Financer les infrastructures de la transition sans creuser directement le déficit', 'Livrets réglementés mieux rémunérés pour les petits épargnants'],
    contre: ['« Les 100 milliards ne seraient pas du tout 100 milliards » (un économiste cité par l\'AFP)', 'Moins de dépôts pour les banques privées, donc moins de crédit privé', 'Risque de pertes pour l\'État si les projets sont mal choisis'],
    exemples: ['Allemagne : la KfW, banque publique de développement, prête plus de 100 Md€ certaines années', 'France : le circuit du Trésor finançait la reconstruction après 1945'],
    sources: [D.banque, D.comptes, D.livretB, D.economistes],
    options: [
      { id: 'complet', nom: 'Pôle public bancaire complet : livrets centralisés à 80 %, plafond du livret A à 30 000 €, livret B', description: 'Objectif de LFI : 100 Md€ d\'investissements de plus par an.' },
      { id: 'livret_a', nom: 'Premier pas : plafond du livret A relevé à 30 000 €', description: 'Jusqu\'à 40 Md€ de ressources en plus pour la Caisse des dépôts, investies en trois ans.' },
    ],
    delai: 2,
    effets(e, o, age) {
      const t = ans(age);
      if (o === 'livret_a') {
        const enCours = age < 12;
        return { chocDemande: enCours ? 0.02 : 0, potentielBonus: enCours ? 0.005 : 0, emissionsEvitees: Math.min(2, 0.3 * t), menages: { retraite: [{ montant: 3, texte: 'Plafond du livret A relevé' }] } };
      }
      const r = rampe(age, 12);
      return {
        // Hypothèse de jeu : un quart des 100 Md€ s'ajoute à l'investissement existant (environ 0,8 point de PIB)
        chocDemande: 0.15 * r,
        potentielBonus: 0.06 * r,
        emissionsEvitees: Math.min(25, 1.8 * t),
        depenses: { logement: 0.6 * r * prix(e) },
        recettes: { impotRevenu: -0.4 * r * prix(e) },
        menages: { retraite: [{ montant: 5, texte: 'Livrets réglementés rémunérés au moins à l\'inflation' }], couple: [{ montant: 4, texte: 'Livrets réglementés rémunérés au moins à l\'inflation' }] },
      };
    },
    reaction: (e, o) => (o === 'livret_a'
      ? { chocs: { retraites: 1, entrepreneurs: -1 } }
      : { chocs: { salaries: 2, jeunes: 2, retraites: 1, entrepreneurs: -3 }, credibilite: -0.06 }),
    axes: { marche: -0.8, social: 0.4, ecologie: 0.5 },
    axesParOption: { livret_a: { marche: -0.2, ecologie: 0.2 } },
    positionsGroupesParOption: {
      complet: { LFI: 1, GDR: 1, ECOS: 0.7, SOC: 0.4, LIOT: -0.2, DEM: -0.4, EPR: -0.7, HOR: -0.9, DR: -0.9, UDR: -0.9, RN: -0.2 },
      livret_a: { LFI: 1, GDR: 1, ECOS: 0.8, SOC: 0.7, LIOT: 0.3, DEM: 0.2, EPR: 0, HOR: -0.2, DR: -0.1, UDR: -0.2, RN: 0.3 },
    },
    chiffrage: 'La France insoumise : 100 Md€ d\'investissements de plus par an, hors budget de l\'État ; plafond du livret A à 30 000 € : jusqu\'à 40 Md€ selon la Caisse des dépôts. Part réellement additionnelle (un quart), effets sur l\'activité, la croissance potentielle et les émissions, coût des livrets (1 Md€ par an) : hypothèses de jeu.',
  },
  {
    id: 'lfi_bce_dette',
    nom: 'Demander à la BCE de geler ou d\'annuler les dettes publiques qu\'elle détient',
    categorie: 'dette', pays: FR, vehicule: 'initiative européenne', vote: false, orientation: 'sociale', inspirations: ['lfi'],
    resume: 'Plaider auprès de la Banque centrale européenne pour qu\'elle rachète de nouveau des dettes publiques afin de financer l\'investissement écologique et numérique, voire qu\'elle gèle ou annule celles qu\'elle détient.',
    pedagogie: 'La Banque de France détient, pour l\'Eurosystème, une part de la dette française achetée en 2015 et 2020 : environ 18 % en 2026, 13 % en 2027 selon LFI, car la BCE ne renouvelle plus les titres arrivés à échéance depuis 2024. LFI estime que l\'article 123 du traité, qui interdit le prêt direct aux États, n\'empêche pas un gel ou une annulation. La décision appartient toutefois au Conseil des gouverneurs de la BCE, indépendant, où la France ne dispose que d\'une voix : dans le jeu, la demande n\'a donc aucun effet direct sur la dette, mais elle inquiète les investisseurs. LFI évoque aussi un « circuit du Trésor » modernisé, pour se financer en partie hors des marchés.',
    pour: ['Réduire la dépendance aux marchés financiers et aux fonds spéculatifs', 'Les intérêts versés à la Banque de France reviennent en partie à l\'État', 'Une coalition de pays endettés pourrait peser'],
    contre: ['La BCE est indépendante ; une annulation est jugée contraire aux traités par la plupart des juristes', 'Une annulation créerait des pertes pour la Banque de France, donc pour l\'État actionnaire', 'Effet de signal négatif : hausse possible des taux'],
    exemples: ['2015-2022 : programmes de rachats de la BCE (PSPP, PEPP)', '2021 : appel de 150 économistes à annuler les dettes détenues par la BCE, refusé par sa présidente'],
    sources: [D.comptes, D.dette],
    options: [
      { id: 'reinvestir', nom: 'Demander de nouveaux rachats de dettes pour l\'investissement écologique' },
      { id: 'annuler', nom: 'Demander le gel ou l\'annulation des dettes détenues par la BCE' },
    ],
    delai: 1,
    effets: () => ({}),
    reaction: (e, o) => (o === 'annuler' ? { chocs: { entrepreneurs: -3, retraites: -1, jeunes: 1 }, credibilite: -0.15, instabilite: 0.03 } : { chocs: { entrepreneurs: -1 }, credibilite: -0.03 }),
    axes: { europe: -0.6, rigueur: -0.6, marche: -0.5 },
    axesParOption: { reinvestir: { europe: -0.1, rigueur: -0.3 } },
    positionsGroupesParOption: {
      reinvestir: { LFI: 1, GDR: 1, ECOS: 0.6, SOC: 0.3, LIOT: 0, DEM: -0.3, EPR: -0.5, HOR: -0.7, DR: -0.8, UDR: -0.5, RN: 0.2 },
      annuler: { LFI: 1, GDR: 0.9, ECOS: 0.2, SOC: -0.4, LIOT: -0.5, DEM: -0.8, EPR: -1, HOR: -1, DR: -1, UDR: -0.6, RN: -0.4 },
    },
    chiffrage: 'Aucun effet budgétaire direct dans le jeu : la décision appartient à la BCE. Effet sur la crédibilité auprès des marchés : hypothèse de jeu.',
  },
];

/**
 * Réformes déjà présentes dans le jeu qui reprennent une proposition de LFI,
 * avec ce que le programme propose précisément.
 */
export const INSPIRATIONS_LFI = {
  retraites_age: 'LFI abrogerait la réforme de 2023 dès 2027 (9 Md€ selon elle), premier pas vers le retour à 60 ans avec 40 annuités au cours du mandat. Option « Revenir à 60 ans ».',
  assurance_chomage: 'LFI abrogerait les réformes de l\'assurance chômage depuis 2017 (conditions d\'accès, montant, durée, dégressivité) : 3 Md€ selon elle. Option « Allonger la durée… ».',
  retraites_minimum: 'LFI veut porter la pension minimum au niveau du SMIC pour une carrière complète (le jeu retient 1 200 € brut).',
  retraites_indexation: 'LFI refuse toute désindexation des pensions : option « Revaloriser sur toute l\'inflation ».',
  smic_hausse: 'LFI propose un SMIC à 1 700 € net, avec une conférence exceptionnelle sur les salaires. Option « SMIC à 1 700 € net ».',
  echelle_mobile: 'LFI propose une indexation généralisée des salaires sur l\'inflation.',
  blocage_prix: 'LFI prendrait un décret de blocage du prix des carburants à 1,70 € le litre (option dédiée) ; « L\'Avenir en commun » prévoit aussi de bloquer les prix des produits de première nécessité.',
  ir_progressif: 'LFI rendrait l\'impôt sur le revenu plus progressif au cours du mandat, avec 14 tranches.',
  constituante: 'Partie 5 de « L\'Avenir en commun » : fonder la 6e République par une Assemblée constituante.',
  ifi: 'LFI rétablirait un impôt sur la fortune renforcé, avec un volet climatique (« ISF climatique ») : 10 Md€ selon elle, inclus dans « revenir sur les baisses d\'impôts depuis 2017 ».',
  taxe_hauts_patrimoines: 'LFI reprend la taxe Zucman au-delà de 100 M€ de patrimoine : 15 Md€ selon elle (voir « taxe Zucman et réforme des successions »).',
  allegements_charges: 'LFI supprimerait les exonérations de cotisations au-dessus de 2 SMIC (incluses dans les 22 Md€ de niches fiscales et sociales).',
  taxe_superprofits: 'LFI propose une « véritable taxe sur les superprofits » : 5 Md€ selon elle.',
  rachats_actions: 'LFI taxerait davantage les rachats d\'actions : 2,5 Md€ selon elle.',
  plan_antifraude: 'LFI renforcerait la lutte contre la fraude fiscale en reconstruisant les effectifs : 2 Md€ la première année selon elle.',
  point_indice_hausse: 'LFI propose bien plus : +10 % du point d\'indice (17 Md€), dans « relancer par les revenus populaires ».',
  rsa_jeunes: 'LFI propose une garantie d\'autonomie pour qu\'aucun jeune ne vive sous le seuil de pauvreté (9,5 Md€), dans « relancer par les revenus populaires ».',
  cantine: 'LFI propose la cantine scolaire gratuite (3,6 Md€), dans « services publics d\'urgence ».',
  plan_hopital: 'LFI propose 3 Md€ de plus pour l\'hôpital, avec au moins 10 000 soignants, dans « services publics d\'urgence ».',
  maprimerenov: 'LFI vise 700 000 rénovations par an pour résorber les passoires thermiques en un mandat, dans « enclencher la planification écologique ».',
  logement_social: 'LFI veut relancer la construction de logements publics par un plan d\'investissement.',
};
