/**
 * Réformes concrètes pour la France : grands programmes (nucléaire, défense,
 * infrastructures), régalien (prisons, narcotrafic, peines, renseignement),
 * organisation de l'État (décentralisation inspirée de Jean-Louis Borloo,
 * provinces, parlementaires) et quelques mesures emblématiques.
 *
 * Conventions (voir src/data/reformes.js) : montants en Md€ par an aux prix
 * de départ, `cessions` en Md€ par trimestre (négatif = prêt ou achat de
 * l'État, qui augmente la dette sans creuser le déficit), `emissionsEvitees`
 * en MtCO2e par an, `influence` et `souverainete` en points d'indice.
 * Les montants sans source sont des hypothèses de jeu, signalées comme telles.
 */

const rampe = (age, n) => Math.min(1, Math.max(0, (age + 1) / n));
const prix = (e) => e.macro.niveauPrix / 100;
const borne = (x, a, b) => Math.min(b, Math.max(a, x));
const FR = ['france'];
/** Part d'un programme réalisée, entre deux années (0 avant, 1 après). */
const entre = (e, debut, fin) => borne((e.trimestre.annee + (e.trimestre.t - 1) / 4 - debut) / (fin - debut), 0, 1);
/** Années écoulées depuis l'entrée en vigueur. */
const ans = (age) => Math.max(0, age) / 4;

/** Diplomatie : recul (ou progrès) des relations selon le choix sur l'OTAN ; la moitié du recul est durable. */
const DIPLOMATIE_OTAN = {
  rester: { etatsUnis: 4, pologne: 4, ue: 2, ukraine: 2 },
  commandement: { etatsUnis: -10, pologne: -12, allemagne: -6, royaumeUni: -6, ue: -5, ukraine: -6, norvege: -5 },
  alliance: { etatsUnis: -25, pologne: -30, allemagne: -18, royaumeUni: -18, ue: -12, ukraine: -20, norvege: -15, italie: -8, espagne: -8, chine: 5 },
};
const SOURCES_OTAN = [
  { texte: 'OTAN : le traité de l\'Atlantique Nord (article 5 : défense mutuelle ; article 13 : retrait un an après notification aux États-Unis)', url: 'https://www.nato.int/cps/fr/natohq/official_texts_17120.htm' },
  { texte: 'OTAN : le financement de l\'Alliance (budgets civil, militaire et d\'investissement communs)', url: 'https://www.nato.int/cps/en/natohq/topics_67655.htm' },
  { texte: 'Élysée : discours du 11 mars 2009 sur le retour de la France dans le commandement intégré', url: 'https://www.elysee.fr/nicolas-sarkozy/2009/03/11/declaration-de-m-nicolas-sarkozy-president-de-la-republique-sur-le-retour-de-la-france-dans-le-commandement-integre-de-lotan-et-la-defense-europeenne-a-paris-le-11-mars-2009' },
  { texte: 'Assemblée nationale : audition de 2009 (environ 900 militaires français dans les structures de l\'OTAN après le retour, contre une centaine)', url: 'https://www.assemblee-nationale.fr/13/pdf/cr-cdef/08-09/c0809035.pdf' },
];
const SOURCES_JOBS_ETUDIANTS = [
  { texte: 'impots.gouv.fr : salaires des étudiants exonérés dans la limite de 3 SMIC mensuels (5 405 € pour les revenus de 2025), jusqu\'à 25 ans', url: 'https://www.impots.gouv.fr/particulier/questions/mon-enfant-est-etudiant-les-revenus-quil-percus-sont-ils-imposables' },
  { texte: 'Observatoire national de la vie étudiante : 44 % des étudiants ont une activité rémunérée pendant l\'année (enquête 2023)', url: 'https://www.ove-national.education.fr/wp-content/uploads/2025/12/Fiche-CDV2023-Activite-remuneree.pdf' },
];

const SOURCES_EPR = [
  { texte: 'World Nuclear News : EDF estime le programme EPR2 à 72,8 Md€ (décembre 2025)', url: 'https://wnn.world-nuclear.org/articles/edf-estimates-epr2-programme-costs-at-eur728-billion' },
  { texte: 'Banque des territoires : première mise en service des EPR2 « d\'ici 2038 »', url: 'https://www.banquedesterritoires.fr/nucleaire-lelysee-evoque-une-premiere-mise-en-service-des-reacteurs-epr2-dici-2038' },
];
const SOURCES_SCAF = [
  { texte: 'Boursorama : Dassault Aviation affirme pouvoir construire seul un nouvel avion de combat (septembre 2025)', url: 'https://www.boursorama.com/bourse/actualites/programme-scaf-dassault-aviation-affirme-pouvoir-construire-seul-un-nouvel-avion-de-combat-si-necessaire-0131d7c237f86b870a7c80ca166ebb1f' },
  { texte: 'Toute l\'Europe : le SCAF, entre ambitions et tensions', url: 'https://www.touteleurope.eu/l-ue-dans-le-monde/scaf-un-futur-avion-de-combat-europeen-entre-ambitions-et-tensions/' },
];
const SOURCES_AUTOROUTES = [
  { texte: 'IFRAP : nationalisation des autoroutes, ce que cela coûterait vraiment à l\'État', url: 'https://www.ifrap.org/etat-et-collectivites/nationalisation-des-autoroutes-ce-que-cela-couterait-vraiment-letat' },
  { texte: 'Public Sénat : renationaliser les autoroutes, à quel coût ?', url: 'https://www.publicsenat.fr/article/politique/montebourg-souhaite-renationaliser-les-autoroutes-mais-a-quel-cout-et-de-quelle' },
];
const SOURCES_BORLOO = [
  { texte: 'Public Sénat : Jean-Louis Borloo et les agences de l\'État, « une machine à penser à la place des élus »', url: 'https://www.publicsenat.fr/actualites/parlementaire/agences-de-letat-jean-louis-borloo-pointe-une-machine-a-penser-a-la-place-des-elus' },
  { texte: 'ABP : Jean-Louis Borloo, du cri d\'alarme à la République fédérale des provinces', url: 'https://abp.bzh/jean-louis-borloo-du-cri-dalarme-a-la-republique-federale-de-72967' },
  { texte: '21 News : l\'État recentré sur la sécurité, la justice, la recherche, l\'équité et l\'impôt', url: 'https://www.21news.be/jean-louis-borloo-latout-liberal-que-la-droite-ne-voit-pas-venir/' },
];

export const REFORMES_CONCRETES = [
  // ======================================================================
  // ÉNERGIE ET INDUSTRIE
  // ======================================================================
  {
    id: 'nucleaire_epr2',
    nom: 'Nouveaux réacteurs nucléaires EPR2',
    categorie: 'energie', pays: FR, vehicule: 'loi',
    resume: 'Construire de nouveaux réacteurs pour remplacer le parc vieillissant et électrifier l\'économie. Un programme de 15 à 25 ans, financé en partie par un prêt de l\'État à EDF.',
    pedagogie: 'EDF a estimé en décembre 2025 le coût des six premiers EPR2 (Penly, Gravelines, Bugey) à 72,8 Md€, contre 51,7 Md€ en 2022 ; l\'État prévoit un prêt bonifié couvrant au moins la moitié du coût. La première mise en service est attendue « d\'ici 2038 » plutôt qu\'en 2035. L\'électricité française étant déjà très décarbonée, les nouveaux réacteurs ne réduisent les émissions que s\'ils servent à remplacer du pétrole et du gaz (voitures, chauffage, industrie) : c\'est le pari de l\'électrification. Le précédent de Flamanville 3 (chantier lancé en 2007, raccordé en 2024) rappelle le risque de retards et de surcoûts.',
    pour: ['Électricité pilotable et bas carbone pour électrifier l\'économie', 'Souveraineté énergétique et filière industrielle (plus de 200 000 emplois revendiqués)', 'Prix de l\'électricité plus stables à long terme'],
    contre: ['Coûts et délais historiquement dépassés (Flamanville 3)', 'Pas d\'électricité avant la fin des années 2030', 'Prêt de l\'État : la dette augmente', 'Déchets et sûreté'],
    exemples: ['Royaume-Uni : Hinkley Point C, deux EPR dont le coût et le calendrier ont fortement dérivé', 'Finlande : Olkiluoto 3, mis en service en 2023 avec plus de dix ans de retard'],
    sources: SOURCES_EPR,
    options: [
      { id: 'six', nom: 'Confirmer les 6 EPR2 avec un prêt bonifié de l\'État', description: 'Environ 40 Md€ prêtés à EDF jusqu\'en 2040 (hypothèse : 55 % du coût).' },
      { id: 'quatorze', nom: 'Aller jusqu\'à 14 EPR2 (les 8 réacteurs en option)', description: 'Effet de série espéré, mais une dette et un risque industriel doublés.' },
      { id: 'renoncer', nom: 'Renoncer aux EPR2 et accélérer les renouvelables', description: 'Plus rapide à déployer, mais intermittent : stockage et réseaux à financer.' },
    ],
    positionsGroupesParOption: {
      six: { RN: 0.8, UDR: 0.8, DR: 0.8, EPR: 0.6, HOR: 0.6, DEM: 0.4, GDR: 0.4, SOC: 0, LFI: -0.8, ECOS: -1 },
      quatorze: { RN: 0.8, UDR: 0.8, DR: 0.7, EPR: 0.3, HOR: 0.4, GDR: 0.2, SOC: -0.3, LFI: -1, ECOS: -1 },
      renoncer: { ECOS: 1, LFI: 0.6, SOC: 0.2, RN: -1, UDR: -1, DR: -1, EPR: -0.6, HOR: -0.8, GDR: -0.6 },
    },
    delai: 2,
    effets(e, o) {
      const an = e.trimestre.annee;
      if (o === 'renoncer') {
        return { depenses: { ecologieEnergie: 2.5 * prix(e) }, emissionsEvitees: borne((an - 2028) * 0.6, 0, 10), souverainete: -2 };
      }
      const n = o === 'quatorze' ? borne((an - 2037) / 1.2, 0, 14) : borne((an - 2037) / 1.5, 0, 6); // réacteurs en service
      const pret = o === 'quatorze' ? (an <= 2045 ? 1.4 : 0) : (an <= 2040 ? 0.72 : 0);
      return {
        cessions: -pret * prix(e),
        depenses: { economieFinances: (o === 'quatorze' ? 0.6 : 0.3) * prix(e) }, // bonification du prêt
        potentielBonus: an <= 2045 ? (o === 'quatorze' ? 0.015 : 0.01) : 0.005,
        emissionsEvitees: 2 * n,
        souverainete: (o === 'quatorze' ? 3 : 2) + 0.4 * n,
        influence: 0.5,
      };
    },
    reaction: (e, o) => ({ six: { chocs: { entrepreneurs: 2, salaries: 1 } }, quatorze: { chocs: { entrepreneurs: 3 }, credibilite: -0.05 }, renoncer: { chocs: { entrepreneurs: -3, jeunes: 1 }, credibilite: -0.02 } }[o]),
    axes: { ecologie: 0.3, marche: 0.2, rigueur: -0.2 },
    axesParOption: { renoncer: { ecologie: 0.6, marche: -0.2, rigueur: -0.2 } },
    chiffrage: '6 EPR2 : 72,8 Md€ (estimation EDF de décembre 2025, à auditer), dont environ 40 Md€ prêtés par l\'État d\'ici 2040 (hypothèse de jeu) ; réacteurs mis en service de 2038 à 2045 environ. Émissions évitées : environ 2 Mt par réacteur et par an grâce à l\'électrification (hypothèse de jeu). Renoncer : environ 2,5 Md€ par an de soutien supplémentaire aux renouvelables, au stockage et aux réseaux (hypothèse).',
  },
  {
    id: 'smr',
    nom: 'Petits réacteurs modulaires (SMR) et nucléaire innovant',
    categorie: 'energie', pays: FR, vehicule: 'PLF',
    resume: 'Financer des réacteurs de petite taille, fabriqués en série, pour l\'industrie et les réseaux de chaleur.',
    pedagogie: 'Les SMR promettent des chantiers plus courts et une production en série. Aucun n\'est encore en service commercial en Europe ; EDF a revu en 2024 la conception de son projet Nuward. Le plan France 2030 finance plusieurs jeunes pousses du nucléaire. C\'est un pari technologique : coût faible aujourd\'hui, résultat incertain.',
    pour: ['Innovation et exportations potentielles', 'Décarbonation de sites industriels'],
    contre: ['Technologie non éprouvée commercialement', 'Coût par MWh incertain'],
    exemples: ['Canada : premier SMR (BWRX-300) en construction à Darlington', 'Royaume-Uni : concours de SMR lancé en 2023'],
    options: [
      { id: 'soutenir', nom: 'Soutenir les projets (0,4 Md€ par an pendant 8 ans)' },
      { id: 'prototype', nom: 'Financer un prototype public (1 Md€ par an)' },
    ],
    delai: 1,
    effets: (e, o, age) => (age < 32 ? { depenses: { recherche: (o === 'prototype' ? 1 : 0.4) * prix(e) }, souverainete: o === 'prototype' ? 2 : 1, potentielBonus: o === 'prototype' ? 0.006 : 0.003 } : { souverainete: 1 }),
    reaction: () => ({ chocs: { entrepreneurs: 1 } }),
    axes: { securite: 0.2, marche: 0.1 },
    positionsGroupes: { ECOS: -0.6, LFI: -0.4, RN: 0.7, UDR: 0.6, DR: 0.6, EPR: 0.4, HOR: 0.4, GDR: 0.3 },
    chiffrage: 'Hypothèses de jeu : 0,4 ou 1 Md€ par an pendant 8 ans ; aucun effet sur les émissions avant 2040.',
  },
  {
    id: 'eolien_mer',
    nom: 'Éolien en mer',
    categorie: 'energie', pays: FR, vehicule: 'loi',
    resume: 'Accélérer les parcs en mer (environ 40 GW visés en 2050 lors du discours de Belfort en 2022) ou décréter un moratoire sur l\'éolien.',
    pedagogie: 'L\'éolien en mer produit plus régulièrement que l\'éolien terrestre, mais ses parcs mettent près de dix ans entre l\'appel d\'offres et la mise en service. Le soutien public prend la forme d\'un complément de rémunération : il coûte quand les prix de marché sont bas et rapporte quand ils sont hauts. Le RN propose un moratoire sur l\'éolien.',
    pour: ['Production bas carbone rapide à ajouter au nucléaire', 'Filière industrielle portuaire (Saint-Nazaire, Cherbourg)'],
    contre: ['Conflits d\'usage (pêche, paysages)', 'Intermittence : besoin de réseaux et de stockage'],
    exemples: ['Royaume-Uni : premier parc éolien en mer d\'Europe, plus de 14 GW installés', 'Danemark : îles énergétiques en projet'],
    options: [
      { id: 'accelerer', nom: 'Accélérer les appels d\'offres (environ 40 GW en 2050)' },
      { id: 'moratoire', nom: 'Moratoire sur l\'éolien, terrestre et en mer' },
    ],
    positionsGroupesParOption: {
      accelerer: { ECOS: 0.8, SOC: 0.4, EPR: 0.3, LFI: 0.3, RN: -0.8, UDR: -0.6, DR: -0.3 },
      moratoire: { RN: 0.9, UDR: 0.8, DR: 0.4, ECOS: -1, SOC: -0.6, LFI: -0.6, EPR: -0.4, DEM: -0.3 },
    },
    delai: 2,
    effets(e, o, age) {
      const t = ans(age);
      if (o === 'moratoire') return { depenses: { ecologieEnergie: -0.5 * prix(e) }, emissionsEvitees: -Math.min(4, 0.3 * t), souverainete: -1 };
      return { depenses: { ecologieEnergie: 1 * prix(e) }, emissionsEvitees: Math.min(6, 0.4 * Math.max(0, t - 4)), souverainete: 1 };
    },
    reaction: (e, o) => (o === 'moratoire' ? { chocs: { agriculteurs: 2, retraites: 1, jeunes: -2 } } : { chocs: { jeunes: 1, entrepreneurs: 1 } }),
    axes: { ecologie: 0.6 },
    axesParOption: { moratoire: { ecologie: -0.8 } },
    chiffrage: 'Hypothèses de jeu : soutien public d\'environ 1 Md€ par an ; jusqu\'à 6 Mt de CO2 évitées par an après 2035. Moratoire : 0,5 Md€ économisé, émissions plus élevées.',
  },
  {
    id: 'leasing_social',
    nom: 'Leasing social de voitures électriques',
    categorie: 'energie', pays: FR, vehicule: 'décret', vote: false,
    resume: 'Louer des voitures électriques autour de 100 € par mois aux ménages modestes qui roulent beaucoup.',
    pedagogie: 'Lancé en 2024 (environ 50 000 voitures), le dispositif a été relancé fin 2025, financé par les certificats d\'économies d\'énergie (CEE), c\'est-à-dire, au bout du compte, par les factures d\'énergie de tous les ménages. Il aide les ménages modestes et la filière, pour un effet modeste sur les émissions.',
    pour: ['Mesure ciblée sur les ménages modestes dépendants de la voiture', 'Soutien aux ventes de voitures électriques'],
    contre: ['Coût répercuté sur toutes les factures d\'énergie', 'Effet limité sur les émissions'],
    exemples: ['Allemagne : bonus écologique supprimé fin 2023, chute des ventes électriques en 2024'],
    options: [{ id: 'relancer', nom: 'Relancer chaque année (environ 50 000 voitures)' }],
    delai: 1,
    effets: (e, o, age) => ({ emissionsEvitees: Math.min(1, 0.1 * ans(age)), chocPrix: age === 0 ? 0.02 : 0, menages: { smic: [{ montant: 25, texte: 'Leasing social : moins de carburant (si éligible)' }], jeune: [{ montant: 15, texte: 'Leasing social (si éligible)' }] } }),
    reaction: () => ({ chocs: { salaries: 1, jeunes: 1 } }),
    axes: { ecologie: 0.4, social: 0.3 },
    chiffrage: 'Financement par les CEE : coût pour les finances publiques nul, mais légère hausse des prix de l\'énergie (hypothèse de jeu). Émissions évitées : jusqu\'à 1 Mt par an.',
  },
  {
    id: 'maprimerenov',
    nom: 'Rénovation énergétique des logements (MaPrimeRénov\')',
    categorie: 'logement', pays: FR, vehicule: 'PLF',
    resume: 'Augmenter ou recentrer les aides à la rénovation thermique.',
    pedagogie: 'Le bâtiment représente environ un sixième des émissions françaises. Les rénovations « d\'ampleur » sont les plus efficaces mais les plus coûteuses ; le guichet a été suspendu à l\'été 2025 faute de crédits et à cause de fraudes. Les aides soutiennent aussi l\'artisanat du bâtiment.',
    pour: ['Baisse durable des factures et des émissions', 'Activité pour l\'artisanat local'],
    contre: ['Fraudes et effets d\'aubaine', 'Coût élevé par tonne de CO2 évitée'],
    exemples: ['Allemagne : prêts de la KfW pour la rénovation, à grande échelle depuis les années 2000'],
    options: [
      { id: 'renforcer', nom: 'Renforcer : +1,5 Md€ par an pour les rénovations d\'ampleur' },
      { id: 'recentrer', nom: 'Recentrer sur les ménages modestes : −1 Md€ par an' },
    ],
    delai: 1,
    effets(e, o, age) {
      const t = ans(age);
      if (o === 'recentrer') return { depenses: { ecologieEnergie: -1 * prix(e) }, emissionsEvitees: -Math.min(1.5, 0.15 * t) };
      return { depenses: { ecologieEnergie: 1.5 * prix(e) }, emissionsEvitees: Math.min(4, 0.3 * t), chocDemande: age < 4 ? 0.02 : 0 };
    },
    reaction: (e, o) => (o === 'recentrer' ? { chocs: { salaries: -1, entrepreneurs: -1 }, credibilite: 0.02 } : { chocs: { salaries: 1, entrepreneurs: 1 } }),
    axes: { ecologie: 0.5, social: 0.2, rigueur: -0.2 },
    axesParOption: { recentrer: { ecologie: -0.3, rigueur: 0.4 } },
    chiffrage: 'Hypothèses de jeu : 1,5 Md€ par an ; jusqu\'à 4 Mt évitées par an au bout d\'une douzaine d\'années.',
  },
  {
    id: 'livret_defense',
    nom: 'Livret d\'épargne défense et souveraineté',
    categorie: 'fiscalite', pays: FR, vehicule: 'PLF',
    resume: 'Un livret réglementé dont l\'épargne finance les entreprises de la défense et de l\'industrie stratégique.',
    pedagogie: 'Idée débattue en 2025 : orienter une partie de l\'épargne des Français (plus de 6 000 Md€ de patrimoine financier) vers les fournisseurs des armées, qui peinent à se financer. Coût budgétaire faible (exonération d\'impôt), mais l\'épargne déplacée manque ailleurs.',
    pour: ['Financer la montée en cadence de l\'industrie de défense', 'Épargne populaire et patriotique'],
    contre: ['Concurrence avec le livret A et le logement social', 'Risque supporté par les épargnants si mal garanti'],
    options: [{ id: 'creer', nom: 'Créer le livret (exonéré d\'impôt)' }],
    delai: 1,
    effets: () => ({ recettes: { impotRevenu: -0.1 }, souverainete: 1.5, potentielBonus: 0.003 }),
    reaction: () => ({ chocs: { entrepreneurs: 2, retraites: 1 } }),
    axes: { securite: 0.4, marche: 0.2 },
    positionsGroupes: { RN: 0.5, DR: 0.5, EPR: 0.4, HOR: 0.4, LFI: -0.4, ECOS: -0.3 },
    chiffrage: 'Hypothèse de jeu : 0,1 Md€ par an d\'exonérations.',
  },

  // ======================================================================
  // DÉFENSE
  // ======================================================================
  {
    id: 'avion_combat',
    nom: 'Avion de combat de nouvelle génération (successeur du Rafale)',
    categorie: 'defense', pays: FR, vehicule: 'loi',
    resume: 'Poursuivre le programme européen SCAF avec l\'Allemagne et l\'Espagne, ou confier à Dassault Aviation un programme national.',
    pedagogie: 'Le SCAF, lancé en 2017 avec l\'Allemagne (l\'Espagne a rejoint en 2019), devait remplacer le Rafale et l\'Eurofighter vers 2040. Les désaccords entre Dassault Aviation et Airbus sur le partage du travail l\'ont paralysé. En septembre 2025, le PDG de Dassault, Éric Trappier, a affirmé pouvoir construire seul le futur avion ; en février 2026, le chancelier Merz a estimé que l\'Allemagne n\'avait « pas besoin » du même avion que la France. Un programme national coûte plus cher au budget français, mais garantit la maîtrise de la technologie et des exportations, comme pour le Rafale (exporté notamment en Égypte, en Inde, en Grèce, aux Émirats et en Indonésie). Selon la presse (AFP, JDD), Paris et Berlin ont renoncé en juin 2026 au chasseur commun (NGF) ; d\'autres volets du SCAF (drones, « cloud de combat ») pourraient être poursuivis.',
    pour: ['Souveraineté : maîtrise de l\'avion, de son moteur et de ses exportations', 'Savoir-faire de Dassault, Safran et Thales, emplois qualifiés', 'Pas de veto d\'un partenaire sur les ventes à l\'étranger'],
    contre: ['Coût de développement porté seul (plusieurs dizaines de milliards)', 'Rupture avec l\'Allemagne, coup dur pour la défense européenne', 'Risque de série trop courte sans partenaires'],
    exemples: ['Royaume-Uni, Italie et Japon : programme GCAP lancé en 2022', 'Rafale : développé seul par la France après la sortie du programme européen qui a donné l\'Eurofighter (1985)'],
    sources: SOURCES_SCAF,
    options: [
      { id: 'scaf', nom: 'Relancer un chasseur européen commun (Allemagne, Espagne)', description: 'Après l\'échec de 2026 : coût partagé, mais il faudrait refonder la coopération industrielle.' },
      { id: 'national', nom: 'Programme national confié à Dassault Aviation', description: 'Environ 60 Md€ de développement sur 25 ans (hypothèse de jeu).' },
      { id: 'f5_drone', nom: 'Rafale F5 et drone de combat d\'abord, décision sur le successeur en 2030', description: 'Moins cher à court terme, la question reste ouverte.' },
    ],
    positionsGroupesParOption: {
      scaf: { EPR: 0.3, DEM: 0.4, HOR: 0.2, ECOS: 0.2, SOC: 0.2, RN: -0.6, UDR: -0.5, LFI: -0.4 },
      national: { RN: 0.7, UDR: 0.6, DR: 0.6, EPR: 0.3, HOR: 0.4, GDR: 0.2, LFI: -0.2, ECOS: -0.4 },
      f5_drone: { EPR: 0.3, DR: 0.3, HOR: 0.3, DEM: 0.2 },
    },
    delai: 2,
    effets(e, o) {
      const an = e.trimestre.annee;
      const enCours = an <= 2048;
      if (o === 'scaf') return { depenses: { defense: (enCours ? 1.2 : 0.3) * prix(e) }, influence: 1.5, souverainete: 1 };
      if (o === 'national') return { depenses: { defense: (enCours ? 2.5 : 0.8) * prix(e) }, influence: 2, souverainete: 4, potentielBonus: 0.01 };
      return { depenses: { defense: (an <= 2033 ? 0.8 : 0.3) * prix(e) }, influence: 0.5, souverainete: 1.5 };
    },
    reaction: (e, o) => ({ scaf: { chocs: { entrepreneurs: 0 } }, national: { chocs: { entrepreneurs: 2, salaries: 1 }, credibilite: -0.02 }, f5_drone: { chocs: { entrepreneurs: 1 } } }[o]),
    axes: { securite: 0.7, rigueur: -0.2 },
    axesParOption: { scaf: { securite: 0.6, europe: 0.6 }, national: { securite: 0.8, europe: -0.4, rigueur: -0.3 } },
    chiffrage: 'Hypothèses de jeu : SCAF, part française d\'environ 1,2 Md€ par an ; programme national, environ 2,5 Md€ par an jusqu\'à la fin des années 2040 ; Rafale F5 et drone, environ 0,8 Md€ par an jusqu\'en 2033.',
  },
  {
    id: 'effort_defense',
    nom: 'Trajectoire de l\'effort de défense',
    categorie: 'defense', pays: FR, vehicule: 'loi',
    resume: 'Fixer la part du PIB consacrée aux armées : tenir la loi de programmation militaire, ou viser 3 % puis 3,5 % du PIB comme l\'OTAN l\'a décidé à La Haye en juin 2025.',
    pedagogie: 'La loi de programmation militaire 2024-2030 prévoit 413 Md€ ; son actualisation à la hausse a été annoncée en 2025 face à la menace russe. L\'OTAN demande 3,5 % du PIB pour la défense au sens strict d\'ici 2035 (et 1,5 % pour la sécurité au sens large). Chaque dixième de point de PIB représente environ 3 Md€ par an. Les dépenses militaires soutiennent l\'industrie, mais leur effet d\'entraînement sur la croissance est plus faible que celui de l\'investissement civil.',
    pour: ['Menace russe et incertitude sur l\'engagement américain', 'Influence et crédibilité de la France en Europe', 'Base industrielle de défense'],
    contre: ['Coût élevé en pleine consolidation budgétaire', 'Effet modeste sur la croissance'],
    exemples: ['Pologne : plus de 4 % du PIB consacrés à la défense', 'Allemagne : réforme du frein à l\'endettement en 2025 pour exclure une partie des dépenses de défense'],
    options: [
      { id: 'lpm', nom: 'Tenir la LPM rehaussée (+0,1 point de PIB par an jusqu\'en 2030)' },
      { id: 'trois', nom: 'Atteindre 3 % du PIB en 2030' },
      { id: 'otan', nom: '3 % en 2030 puis 3,5 % en 2035 (engagement de l\'OTAN)' },
    ],
    delai: 1,
    effets(e, o) {
      const pib0 = e.reference.pibNominal;
      const pct0 = e.budget.defense.montantInitial / pib0 * 100;
      const t = e.trimestre.annee + (e.trimestre.t - 1) / 4 - 2027;
      let cible = pct0;
      if (o === 'lpm') cible = pct0 + 0.1 * borne(t, 0, 4);
      if (o === 'trois') cible = pct0 + (3 - pct0) * borne(t / 3.5, 0, 1);
      if (o === 'otan') cible = t <= 3.5 ? pct0 + (3 - pct0) * borne(t / 3.5, 0, 1) : 3 + 0.5 * borne((t - 3.5) / 5, 0, 1);
      // Complément nécessaire pour atteindre la part visée, compte tenu du curseur « Défense » du joueur
      const l = e.budget.defense;
      const base = l.cible ?? l.montantInitial * prix(e);
      const surcroit = Math.max(0, cible / 100 * e.macro.pibNominal - base);
      const k = { lpm: 1, trois: 2, otan: 3 }[o];
      return { depenses: { defense: surcroit }, influence: k, souverainete: k * 0.8, potentielBonus: 0.004 * k };
    },
    reaction: (e, o) => ({ lpm: {}, trois: { credibilite: -0.02 }, otan: { credibilite: -0.04, chocs: { salaries: -1 } } }[o]),
    axes: { securite: 0.8, rigueur: -0.3 },
    axesParOption: { otan: { securite: 1, rigueur: -0.5 } },
    positionsGroupes: { RN: 0.4, UDR: 0.4, DR: 0.6, EPR: 0.5, HOR: 0.6, DEM: 0.4, SOC: 0.2, LIOT: 0.2, LFI: -0.6, GDR: -0.5, ECOS: -0.2 },
    chiffrage: 'Calcul du jeu : écart entre la part visée et la part de départ, multiplié par le PIB. 3,5 % du PIB en 2035 représente plusieurs dizaines de milliards d\'euros de plus par an.',
  },
  {
    id: 'otan',
    nom: 'La France dans l\'OTAN',
    categorie: 'defense', pays: FR, vehicule: 'loi',
    resume: 'Rester dans l\'Alliance atlantique et son commandement militaire intégré, quitter seulement le commandement intégré comme en 1966, ou quitter l\'Alliance.',
    pedagogie: 'L\'OTAN, ce sont deux choses : une alliance, le traité de Washington de 1949 dont l\'article 5 engage chaque membre à assister celui qui est attaqué, et une organisation militaire intégrée (états-majors communs, plans de défense, exercices). En 1966, le général de Gaulle a retiré la France du commandement intégré sans quitter l\'Alliance ; Nicolas Sarkozy l\'y a fait revenir en 2009, sauf au groupe des plans nucléaires : la dissuasion française reste strictement nationale. Le retour devait porter à environ 900 le nombre de militaires français dans les états-majors de l\'OTAN, contre une centaine auparavant. Quitter l\'Alliance se fait par une notification aux États-Unis, effective un an plus tard (article 13) : la France perdrait la garantie de l\'article 5 et compterait sur ses propres forces, sa dissuasion et la clause d\'assistance mutuelle entre Européens (article 42.7 du traité sur l\'Union européenne). Les budgets communs de l\'OTAN représentent environ 4,5 Md€ par an, dont la France paie de l\'ordre de 10 %. En pratique, ces choix relèvent du président de la République ; en 2009, le gouvernement avait engagé sa responsabilité devant l\'Assemblée (article 49-1).',
    sources: SOURCES_OTAN,
    pour: ['Indépendance de décision, comme entre 1966 et 2009', 'Ne pas être entraîné dans les choix américains', 'Petite économie sur les contributions communes'],
    contre: ['Perte de la garantie de défense mutuelle (si l\'on quitte l\'Alliance)', 'Défiance des alliés européens de l\'Est, en pleine menace russe', 'Moins de poids dans les décisions et les commandements alliés', 'Capacités jusque-là partagées à financer seul (renseignement, avions radar, défense antimissile)'],
    exemples: ['France, 1966 : retrait du commandement intégré, départ des bases américaines en 1967', 'Finlande et Suède : adhésion en 2023 et 2024 après l\'invasion de l\'Ukraine'],
    options: [
      { id: 'rester', nom: 'Rester dans l\'OTAN et son commandement intégré, en y renforçant le pilier européen' },
      { id: 'commandement', nom: 'Quitter le commandement militaire intégré, rester dans l\'Alliance (comme en 1966)' },
      { id: 'alliance', nom: 'Quitter l\'Alliance atlantique (notification aux États-Unis, effective un an plus tard)' },
    ],
    delai: 4,
    appliquer(e, o) {
      const i = e.international;
      if (!i) return;
      const durable = {};
      for (const [p, v] of Object.entries(DIPLOMATIE_OTAN[o] ?? {})) {
        if (i.relations[p] === undefined) continue;
        i.relations[p] = borne(i.relations[p] + v, -100, 100);
        durable[p] = v / 2;
        i.relationsInitiales[p] = (i.relationsInitiales[p] ?? 0) + durable[p];
      }
      i.decalageOtan = durable;
    },
    annuler(e) {
      const i = e.international;
      if (!i?.decalageOtan) return;
      for (const [p, v] of Object.entries(i.decalageOtan)) i.relationsInitiales[p] -= v;
      i.decalageOtan = null;
    },
    effets(e, o, age) {
      if (o === 'rester') return { influence: 1 };
      if (o === 'commandement') return { depenses: { defense: -0.3 * prix(e) }, influence: -2, souverainete: 1.5 };
      // Hors de l'Alliance : plus de contributions, mais il faut financer seul ce qui était partagé (environ 0,1 point de PIB)
      return { depenses: { defense: -0.45 * prix(e) + 0.001 * e.macro.pibNominal * rampe(age, 8) }, influence: -5, souverainete: 2.5 };
    },
    reaction: (e, o) => ({
      rester: { chocs: { retraites: 1, entrepreneurs: 1 }, credibilite: 0.01 },
      commandement: { chocs: { retraites: -2, entrepreneurs: -2, jeunes: 1 }, grief: { retraites: 2 }, credibilite: -0.02, instabilite: 0.02 },
      alliance: { chocs: { retraites: -5, entrepreneurs: -4, salaries: -1, jeunes: 1 }, grief: { retraites: 5, entrepreneurs: 3 }, credibilite: -0.06, instabilite: 0.05 },
    }[o]),
    axes: { securite: 0.2 },
    axesParOption: { rester: { europe: 0.4, securite: 0.4 }, commandement: { souverainete: 0.6, europe: -0.2 }, alliance: { souverainete: 1, europe: -0.5, securite: -0.4 } },
    positionsGroupesParOption: {
      rester: { RN: 0.2, UDR: 0.3, DR: 0.8, EPR: 0.9, HOR: 0.9, DEM: 0.9, SOC: 0.6, LIOT: 0.5, LFI: -0.8, GDR: -0.6, ECOS: 0.3 },
      commandement: { RN: 0.4, UDR: 0.2, DR: -0.5, EPR: -0.9, HOR: -0.9, DEM: -0.8, SOC: -0.6, LIOT: -0.3, LFI: 0.9, GDR: 0.8, ECOS: -0.2 },
      alliance: { RN: -0.5, UDR: -0.6, DR: -0.9, EPR: -1, HOR: -1, DEM: -1, SOC: -0.9, LIOT: -0.7, LFI: 0.8, GDR: 0.7, ECOS: -0.6 },
    },
    chiffrage: 'Hypothèses de jeu : quitter le commandement intégré économise environ 0,3 Md€ par an (contributions aux budgets militaires communs) ; quitter l\'Alliance économise environ 0,45 Md€ de contributions, mais coûte environ 0,1 point de PIB par an (près de 3 Md€) pour financer seul le renseignement, les avions radar, le ravitaillement et la défense antimissile jusque-là partagés. Relations : recul net avec les États-Unis, la Pologne, l\'Allemagne, le Royaume-Uni et l\'Ukraine, dont la moitié est durable.',
  },
  {
    id: 'porte_avions',
    nom: 'Porte-avions de nouvelle génération (PANG)',
    categorie: 'defense', pays: FR, vehicule: 'PLF',
    resume: 'Remplacer le Charles-de-Gaulle, dont le retrait est prévu vers 2038, par un ou deux porte-avions.',
    pedagogie: 'Un seul porte-avions n\'est pas disponible en permanence : il passe régulièrement en arrêt technique. Le PANG est estimé à une dizaine de milliards d\'euros (ordre de grandeur, à vérifier). Le porte-avions est l\'outil de projection qui place la France dans un club très restreint (États-Unis, Chine, Royaume-Uni, Inde...).',
    pour: ['Capacité de projection et influence', 'Chantiers navals (Saint-Nazaire) et filière nucléaire de propulsion'],
    contre: ['Coût élevé et vulnérabilité croissante face aux missiles', 'Un seul bâtiment : absent un tiers du temps'],
    options: [
      { id: 'pang', nom: 'Construire un porte-avions nouvelle génération (service vers 2038)' },
      { id: 'deux', nom: 'Deux porte-avions, pour une présence permanente à la mer' },
      { id: 'renoncer', nom: 'Renoncer au successeur du Charles-de-Gaulle' },
    ],
    delai: 1,
    effets(e, o) {
      const an = e.trimestre.annee;
      if (o === 'renoncer') return { influence: an >= 2038 ? -3 : -0.5, souverainete: -1 };
      const cout = o === 'deux' ? (an <= 2042 ? 1.3 : 0.4) : (an <= 2038 ? 0.75 : 0.25);
      return { depenses: { defense: cout * prix(e) }, influence: an >= 2038 ? (o === 'deux' ? 3 : 2) : 0.5, souverainete: 1 };
    },
    reaction: (e, o) => (o === 'renoncer' ? { credibilite: 0.01, chocs: { retraites: -1 } } : {}),
    axes: { securite: 0.6, rigueur: -0.2 },
    axesParOption: { renoncer: { securite: -0.5, rigueur: 0.3 } },
    positionsGroupesParOption: {
      pang: { RN: 0.5, DR: 0.6, EPR: 0.4, HOR: 0.5, LFI: -0.4 },
      deux: { RN: 0.6, DR: 0.5, EPR: 0.1, LFI: -0.6, ECOS: -0.4, SOC: -0.2 },
      renoncer: { LFI: 0.4, ECOS: 0.3, RN: -0.8, DR: -0.8, EPR: -0.5, HOR: -0.6 },
    },
    chiffrage: 'Hypothèses de jeu : un porte-avions, environ 0,75 Md€ par an jusqu\'en 2038 ; deux, environ 1,3 Md€ par an jusqu\'en 2042.',
  },
  {
    id: 'porte_avions_2032',
    nom: 'Loi d\'accélération du porte-avions « France Libre » (mise en service en 2032)',
    categorie: 'defense', pays: FR, vehicule: 'loi', unique: true,
    resume: 'Avancer de 2038 à 2032 la mise en service du « France Libre » : commandes anticipées, étapes menées en parallèle à Saint-Nazaire et chez TechnicAtome, équipes renforcées.',
    pedagogie: 'Le calendrier officiel prévoit des essais en mer en 2036 et une mise en service en 2038, avec deux ans de recouvrement avec le Charles-de-Gaulle. Gagner six ans suppose de mener en même temps des étapes aujourd\'hui successives : études, coque, chaufferies nucléaires K22, catapultes électromagnétiques achetées aux États-Unis. Dans le jeu, le navire n\'est jamais disponible avant 2032 (au moins cinq ans après le vote), il peut glisser d\'un an, et le Charles-de-Gaulle est retiré six mois après son arrivée.',
    pour: ['Réduire la période où la France dépend d\'un porte-avions unique et vieillissant', 'Charge de travail pour les chantiers navals et la filière de propulsion nucléaire', 'Signal de puissance vis-à-vis des alliés et des compétiteurs'],
    contre: ['Surcoût de plusieurs milliards d\'euros pris sur d\'autres priorités (munitions, drones, défense aérienne)', 'Risque industriel : chaufferies et catapultes ont leurs propres délais', 'Calendrier jugé irréaliste par une partie des experts'],
    exemples: ['Royaume-Uni : deux porte-avions de la classe Queen Elizabeth, mis en service en 2017 et 2019', 'Chine : trois porte-avions lancés en douze ans (2012, 2019, 2024)'],
    sources: [
      { texte: 'Naval News : le futur porte-avions s\'appellera « France Libre » (mars 2026)', url: 'https://www.navalnews.com/?p=84324' },
      { texte: 'L\'Essentiel de l\'éco : la France sans porte-avions pendant dix-huit mois', url: 'https://lessentieldeleco.fr/7946-la-france-sans-porte-avions-pendant-dix-huit-mois/' },
    ],
    options: [{ id: 'acceleration_2032', nom: 'Accélérer pour une mise en service en 2032' }],
    delai: 1,
    effets(e) {
      const an = e.trimestre.annee;
      return { depenses: { defense: (an <= 2032 ? 0.9 : 0) * prix(e) }, souverainete: an <= 2032 ? 0.2 : 0 };
    },
    axes: { securite: 0.5, rigueur: -0.3 },
    positionsGroupes: { RN: 0.5, UDR: 0.5, DR: 0.5, EPR: 0.3, HOR: 0.4, DEM: 0.2, LIOT: 0, SOC: -0.3, ECOS: -0.6, LFI: -0.7, GDR: -0.4 },
    chiffrage: 'Hypothèse de jeu : environ 0,9 Md€ par an de surcoût jusqu\'en 2032. Le coût du programme n\'est pas publié officiellement (10 à 15 Md€ selon la presse).',
  },
  {
    id: 'service_militaire',
    nom: 'Service national militaire',
    categorie: 'defense', pays: FR, vehicule: 'loi',
    resume: 'Le service militaire volontaire de dix mois annoncé en novembre 2025, ou un service obligatoire pour toute une classe d\'âge, ou une réserve renforcée.',
    pedagogie: 'Le service volontaire annoncé le 27 novembre 2025 dure dix mois (un mois de formation, neuf en unité), sur le territoire national, pour des jeunes de 18-19 ans payés au moins 800 € par mois : 3 000 la première année, 10 000 en 2030 et jusqu\'à 50 000 en 2035, pour environ 2,3 Md€ entre 2026 et 2030. Un service obligatoire concernerait environ 800 000 jeunes par an : coût, encadrement et casernes manquent depuis la suspension de la conscription en 1997.',
    pour: ['Réserve de soldats formés face à la menace', 'Cohésion et brassage social', 'Insertion de jeunes sans qualification'],
    contre: ['Coût et encadrement prélevés sur l\'armée professionnelle', 'Obligatoire : retarde l\'entrée dans les études ou l\'emploi'],
    exemples: ['Suède : conscription rétablie en 2017, sélective', 'Danemark : service militaire étendu aux femmes (décision de 2024)'],
    sources: [{ texte: 'Public Sénat : le nouveau service national militaire et volontaire', url: 'https://www.publicsenat.fr/actualites/politique/emmanuel-macron-devoile-un-nouveau-service-national-militaire-et-volontaire-a-quoi-va-t-il-ressembler' }],
    options: [
      { id: 'volontaire', nom: 'Service volontaire de 10 mois (jusqu\'à 50 000 jeunes en 2035)' },
      { id: 'obligatoire', nom: 'Service militaire obligatoire de 3 mois pour toute une classe d\'âge' },
      { id: 'reserve', nom: 'Doubler la réserve opérationnelle' },
    ],
    positionsGroupesParOption: {
      volontaire: { EPR: 0.5, DEM: 0.4, HOR: 0.5, DR: 0.4, RN: 0.3, SOC: 0.1, LFI: -0.3 },
      obligatoire: { RN: 0.6, UDR: 0.6, DR: 0.4, EPR: -0.2, HOR: 0, LFI: -0.7, ECOS: -0.7, SOC: -0.3 },
      reserve: { EPR: 0.4, DR: 0.5, RN: 0.4, HOR: 0.5, SOC: 0.2 },
    },
    delai: 1,
    effets(e, o, age) {
      if (o === 'obligatoire') return { depenses: { defense: 4 * rampe(age, 8) * prix(e) }, offreTravail: -0.15 * rampe(age, 8), influence: 1, souverainete: 1 };
      if (o === 'reserve') return { depenses: { defense: 0.4 * rampe(age, 4) * prix(e) }, influence: 0.5, souverainete: 0.5 };
      const t = e.trimestre.annee - 2026;
      return { depenses: { defense: (0.4 + 0.11 * borne(t, 0, 9)) * prix(e) }, influence: 0.5, souverainete: 0.5 };
    },
    reaction: (e, o) => ({ volontaire: { chocs: { jeunes: 1, retraites: 1 } }, obligatoire: { chocs: { jeunes: -6, retraites: 3, salaries: -1 }, grief: { jeunes: 6 } }, reserve: { chocs: { retraites: 1 } } }[o]),
    axes: { securite: 0.6 },
    chiffrage: 'Volontaire : environ 0,4 Md€ par an au départ, 1,4 Md€ en 2035 (calé sur les 2,3 Md€ annoncés pour 2026-2030). Obligatoire : environ 4 Md€ par an (hypothèse de jeu). Réserve : 0,4 Md€ par an.',
  },
  {
    id: 'cyber_renseignement',
    nom: 'Renseignement et cyberdéfense',
    categorie: 'defense', pays: FR, vehicule: 'PLF',
    resume: 'Renforcer la DGSI, la DGSE et l\'ANSSI face aux cyberattaques, au terrorisme et aux ingérences étrangères.',
    pedagogie: 'Les attaques informatiques contre les hôpitaux, les collectivités et les entreprises se multiplient, de même que les ingérences étrangères (désinformation, sabotages). Le renseignement coûte peu à l\'échelle du budget, pour un rendement élevé en sécurité.',
    pour: ['Protection des infrastructures critiques', 'Lutte contre les ingérences et le terrorisme'],
    contre: ['Contrôle démocratique des services', 'Recrutements difficiles face au privé'],
    options: [{ id: 'plan', nom: 'Plan de 0,6 Md€ par an' }],
    delai: 1,
    effets: (e, o, age) => ({ depenses: { defense: 0.6 * rampe(age, 4) * prix(e) }, souverainete: 1.5, influence: 0.5 }),
    reaction: () => ({ chocs: { entrepreneurs: 1, retraites: 1 } }),
    axes: { securite: 0.6 },
    positionsGroupes: { RN: 0.4, DR: 0.5, EPR: 0.5, HOR: 0.5, DEM: 0.4, SOC: 0.3, LFI: -0.3 },
    chiffrage: 'Hypothèse de jeu : 0,6 Md€ par an.',
  },

  // ======================================================================
  // RÉGALIEN : SÉCURITÉ ET JUSTICE
  // ======================================================================
  {
    id: 'prisons',
    nom: 'Prisons : places et surpopulation',
    categorie: 'securite', pays: FR, vehicule: 'PLF',
    resume: 'Construire des places, installer des prisons modulaires, ou réguler la population carcérale.',
    pedagogie: 'Les prisons comptent plus de 84 000 détenus pour environ 62 500 places (2025), un record : matelas au sol, violences, réinsertion compromise. Le plan de 15 000 places lancé en 2018 a pris du retard. Construire coûte cher et prend des années ; la régulation (aménagements de peine, bracelets électroniques) est rapide et peu coûteuse, mais impopulaire.',
    pour: ['Dignité des détenus et sécurité des surveillants', 'Exécution effective des peines'],
    contre: ['Construire : coûteux et lent', 'Réguler : sentiment d\'impunité'],
    exemples: ['Pays-Bas : fermeture de prisons après une baisse de la population carcérale', 'Allemagne : environ 70 détenus pour 100 000 habitants, contre plus de 120 en France'],
    options: [
      { id: 'plan_15000', nom: 'Achever le plan de 15 000 places' },
      { id: 'modulaires', nom: 'Prisons modulaires rapides (3 000 places en deux ans)' },
      { id: 'regulation', nom: 'Régulation carcérale : aménagements de peine et bracelets' },
    ],
    positionsGroupesParOption: {
      plan_15000: { RN: 0.5, UDR: 0.5, DR: 0.6, EPR: 0.4, HOR: 0.4, LIOT: 0.2 },
      modulaires: { RN: 0.3, DR: 0.5, EPR: 0.4, HOR: 0.4 },
      regulation: { LFI: 0.6, ECOS: 0.5, GDR: 0.5, SOC: 0.3, RN: -1, UDR: -1, DR: -0.8, HOR: -0.3 },
    },
    delai: 1,
    effets(e, o, age) {
      if (o === 'regulation') return { depenses: { interieurJustice: -0.2 * prix(e) } };
      if (o === 'modulaires') return { depenses: { interieurJustice: (age < 8 ? 0.4 : 0.12) * prix(e) } };
      return { depenses: { interieurJustice: (age < 24 ? 0.8 : 0.3) * prix(e) } };
    },
    reaction: (e, o) => (o === 'regulation' ? { chocs: { retraites: -3, salaries: -1 }, grief: { retraites: 3 } } : { chocs: { retraites: 2, fonctionnaires: 1 } }),
    axes: { securite: 0.6, rigueur: -0.2 },
    axesParOption: { regulation: { securite: -0.6, social: 0.3, rigueur: 0.2 } },
    chiffrage: 'Hypothèses de jeu : plan de 15 000 places, environ 0,8 Md€ par an pendant six ans, puis 0,3 Md€ de fonctionnement ; modulaires, 0,4 Md€ par an pendant deux ans.',
  },
  {
    id: 'narcotrafic',
    nom: 'Narcotrafic : offensive ou légalisation du cannabis',
    categorie: 'securite', pays: FR, vehicule: 'loi',
    resume: 'Renforcer la loi de 2025 contre le narcotrafic, ou légaliser le cannabis sous monopole public pour assécher les trafics.',
    pedagogie: 'La loi du 13 juin 2025 « visant à sortir la France du piège du narcotrafic » a créé un parquet national anticriminalité organisée et des quartiers de haute sécurité dans les prisons. Les partisans de la légalisation citent le Conseil d\'analyse économique (2019), qui y voyait une source de recettes fiscales (de l\'ordre de 2 Md€ par an, à vérifier) et un moyen de réduire le marché noir ; ses opposants craignent une hausse de la consommation des jeunes.',
    pour: ['Offensive : reprendre le contrôle des quartiers et des ports', 'Légalisation : recettes fiscales, contrôle de la qualité, moins d\'interpellations'],
    contre: ['Offensive : coûteuse, le trafic se déplace', 'Légalisation : signal envoyé aux jeunes, le marché noir subsiste pour les drogues dures'],
    exemples: ['Allemagne : légalisation partielle depuis avril 2024 (possession, culture, clubs)', 'Canada : légalisation en 2018 ; Uruguay en 2013'],
    options: [
      { id: 'offensive', nom: 'Offensive : douaniers, enquêteurs, scanners portuaires (+0,7 Md€ par an)' },
      { id: 'legalisation', nom: 'Légaliser le cannabis sous monopole public' },
    ],
    positionsGroupesParOption: {
      offensive: { RN: 0.6, UDR: 0.6, DR: 0.7, EPR: 0.5, HOR: 0.5, DEM: 0.4, SOC: 0.3, LIOT: 0.3 },
      legalisation: { LFI: 0.6, ECOS: 0.8, GDR: 0.2, SOC: 0.2, RN: -1, UDR: -1, DR: -1, EPR: -0.4, HOR: -0.4, DEM: -0.3, LIOT: -0.3 },
    },
    delai: 2,
    effets(e, o, age) {
      if (o === 'legalisation') return { recettes: { fixe: 1.5 * rampe(age, 12) * prix(e) }, depenses: { interieurJustice: -0.3 * prix(e) } };
      return { depenses: { interieurJustice: 0.7 * rampe(age, 4) * prix(e) } };
    },
    reaction: (e, o) => (o === 'legalisation' ? { chocs: { jeunes: 3, retraites: -4 }, grief: { retraites: 3 } } : { chocs: { retraites: 2, salaries: 1 } }),
    axes: { securite: 0.6 },
    axesParOption: { legalisation: { securite: -0.6, marche: 0.2, social: 0.2 } },
    chiffrage: 'Hypothèses de jeu : offensive, 0,7 Md€ par an ; légalisation, environ 1,5 Md€ de recettes par an au bout de trois ans et 0,3 Md€ d\'économies de police et de justice.',
  },
  {
    id: 'peines_planchers',
    nom: 'Peines minimales pour les récidivistes (« peines planchers »)',
    categorie: 'securite', pays: FR, vehicule: 'loi',
    resume: 'Rétablir des peines minimales pour les récidivistes, comme entre 2007 et 2014.',
    pedagogie: 'Les peines planchers, créées par la loi du 10 août 2007, ont été supprimées en 2014. Les juges pouvaient y déroger en motivant leur décision. Leur effet sur la récidive est discuté ; elles augmentent la population carcérale, déjà record.',
    pour: ['Message de fermeté et prévisibilité des sanctions', 'Demande forte de l\'opinion'],
    contre: ['Surpopulation carcérale accrue', 'Atteinte à l\'individualisation des peines', 'Effet sur la récidive non démontré'],
    options: [{ id: 'retablir', nom: 'Rétablir les peines planchers' }],
    delai: 1,
    effets: () => ({ depenses: { interieurJustice: 0.3 } }),
    reaction: () => ({ chocs: { retraites: 3, salaries: 1, jeunes: -1 } }),
    axes: { securite: 0.9 },
    positionsGroupes: { RN: 0.8, UDR: 0.8, DR: 0.8, HOR: 0.3, EPR: 0, LFI: -1, ECOS: -0.8, GDR: -0.8, SOC: -0.6 },
    chiffrage: 'Hypothèse de jeu : 0,3 Md€ par an de détention supplémentaire.',
  },
  {
    id: 'oqtf',
    nom: 'Exécution des obligations de quitter le territoire (OQTF)',
    categorie: 'immigration', pays: FR, vehicule: 'PLF',
    resume: 'Faire exécuter davantage de décisions d\'éloignement : places de rétention, et visas conditionnés à la reprise des ressortissants par leur pays.',
    pedagogie: 'Une faible part des OQTF est exécutée (de l\'ordre de 10 à 20 % selon les années et les modes de calcul) : les pays d\'origine refusent souvent de délivrer les laissez-passer consulaires. Conditionner les visas met la diplomatie sous tension, comme avec l\'Algérie depuis 2024.',
    pour: ['Crédibilité des décisions de justice et d\'administration', 'Attente forte de l\'opinion'],
    contre: ['Coût de la rétention', 'Crises diplomatiques avec les pays d\'origine'],
    options: [
      { id: 'retention', nom: 'Doubler les places de rétention et les éloignements' },
      { id: 'visas', nom: 'Conditionner les visas à la réadmission des ressortissants' },
    ],
    positionsGroupes: { RN: 0.8, UDR: 0.8, DR: 0.8, EPR: 0.3, HOR: 0.4, LFI: -1, ECOS: -0.8, GDR: -0.8, SOC: -0.5 },
    delai: 1,
    effets: (e, o, age) => (o === 'visas' ? { influence: -1 } : { depenses: { interieurJustice: 0.4 * rampe(age, 4) * prix(e) } }),
    reaction: () => ({ chocs: { retraites: 2, salaries: 1, jeunes: -1 } }),
    axes: { securite: 0.7 },
    chiffrage: 'Hypothèses de jeu : rétention, 0,4 Md€ par an ; visas, coût diplomatique (influence).',
  },
  {
    id: 'polices_municipales',
    nom: 'Élargir les pouvoirs des polices municipales',
    categorie: 'securite', pays: FR, vehicule: 'loi',
    resume: 'Permettre aux polices municipales de faire davantage d\'actes de police judiciaire (amendes délictuelles, contrôles, fouilles).',
    pedagogie: 'Les polices municipales comptent environ 28 000 agents, financés par les communes. Élargir leurs pouvoirs soulage la police nationale sans coût pour l\'État, mais accroît les inégalités entre communes riches et pauvres.',
    pour: ['Présence de terrain et réactivité', 'Aucun coût pour l\'État'],
    contre: ['Inégalités entre communes', 'Encadrement et formation à renforcer'],
    options: [{ id: 'pouvoirs', nom: 'Élargir les pouvoirs des polices municipales' }],
    delai: 2,
    effets: () => ({}),
    reaction: () => ({ chocs: { retraites: 2 } }),
    axes: { securite: 0.5 },
    positionsGroupes: { RN: 0.6, UDR: 0.6, DR: 0.6, EPR: 0.4, HOR: 0.5, DEM: 0.3, LIOT: 0.3, LFI: -0.6, ECOS: -0.4, GDR: -0.4 },
    chiffrage: 'Pas de coût pour l\'État dans le jeu (dépense communale).',
  },

  // ======================================================================
  // INFRASTRUCTURES ET TRANSPORTS
  // ======================================================================
  {
    id: 'autoroutes',
    nom: 'Avenir des autoroutes concédées',
    categorie: 'infrastructures', pays: FR, vehicule: 'loi',
    resume: 'Les concessions historiques (Vinci, Eiffage, Abertis) arrivent à échéance entre 2031 et 2036 : racheter tout de suite, reprendre en régie à l\'échéance, rendre gratuit, ou remettre en concurrence.',
    pedagogie: 'Les autoroutes n\'ont jamais été privatisées : l\'État a vendu en 2006 ses parts dans les sociétés concessionnaires, qui exploitent le réseau jusqu\'à la fin des contrats. Une rupture anticipée oblige à indemniser les actionnaires : les estimations publiées vont d\'environ 15 à plus de 40 Md€ selon les méthodes. Attendre l\'échéance ne coûte rien, et l\'État peut alors encaisser lui-même les péages ou les confier à de nouveaux concessionnaires. La gratuité supprimerait les péages, mais l\'entretien (environ 1,6 Md€ par an selon l\'IFRAP) et la TVA et l\'impôt sur les sociétés perdus (environ 3,8 Md€) retomberaient sur le budget. L\'Inspection générale des finances a estimé en 2021 la rentabilité des concessions d\'ASF-Escota et d\'APRR-Area à environ 12 %.',
    pour: ['Récupérer la rente des péages pour financer les transports', 'Maîtrise publique des tarifs', 'Gratuité : pouvoir d\'achat des automobilistes'],
    contre: ['Rachat anticipé : indemnisation coûteuse et contentieux', 'Gratuité : coût pour tous les contribuables et plus de trafic', 'Gestion publique moins efficace selon ses détracteurs'],
    exemples: ['Allemagne : autoroutes gratuites pour les voitures, péage pour les poids lourds', 'Espagne : concessions non renouvelées et autoroutes devenues gratuites depuis 2018'],
    sources: SOURCES_AUTOROUTES,
    options: [
      { id: 'racheter', nom: 'Nationaliser dès maintenant (rachat estimé à 30 Md€)', description: 'Hypothèse de jeu au milieu des estimations publiées.' },
      { id: 'regie', nom: 'Reprendre en régie publique à l\'échéance (2031-2036), péages maintenus' },
      { id: 'gratuite', nom: 'Rendre les autoroutes gratuites à l\'échéance' },
      { id: 'concurrence', nom: 'Remettre en concurrence avec des concessions plus courtes' },
    ],
    positionsGroupesParOption: {
      racheter: { LFI: 1, GDR: 1, RN: 0.7, UDR: 0.2, SOC: 0.5, ECOS: 0.4, LIOT: 0.2, DR: -0.7, HOR: -0.7, EPR: -0.5, DEM: -0.3 },
      regie: { SOC: 0.8, LFI: 0.8, GDR: 0.8, ECOS: 0.6, RN: 0.5, LIOT: 0.4, DEM: 0.2, EPR: 0, DR: -0.2, HOR: -0.3 },
      gratuite: { RN: 0.4, LFI: 0.4, GDR: 0.3, DR: -0.5, EPR: -0.6, HOR: -0.8, ECOS: -0.6, SOC: -0.2 },
      concurrence: { DR: 0.6, HOR: 0.6, EPR: 0.4, DEM: 0.2, LFI: -0.8, GDR: -0.8, RN: -0.4, SOC: -0.3 },
    },
    delai: 1,
    effets(e, o, age) {
      const fin = entre(e, 2031, 2036); // part du réseau sortie de concession
      if (o === 'racheter') return { cessions: age === 0 ? -30 * prix(e) : 0, recettes: { fixe: 2 * prix(e) }, souverainete: 1 };
      if (o === 'regie') return { recettes: { fixe: 2.5 * fin * prix(e) }, souverainete: fin };
      if (o === 'gratuite') return { depenses: { transports: 1.6 * fin * prix(e) }, recettes: { fixe: -3.8 * fin * prix(e) }, emissionsEvitees: -1.5 * fin, menages: { couple: [{ montant: 20 * fin, texte: 'Autoroutes gratuites' }], retraite: [{ montant: 8 * fin, texte: 'Autoroutes gratuites' }] } };
      return { recettes: { fixe: 1.5 * fin * prix(e) } };
    },
    reaction: (e, o) => ({ racheter: { chocs: { salaries: 3, retraites: 2, entrepreneurs: -4 }, credibilite: -0.08 }, regie: { chocs: { salaries: 2, retraites: 1, entrepreneurs: -1 } }, gratuite: { chocs: { salaries: 4, retraites: 3, jeunes: 2 }, credibilite: -0.06 }, concurrence: { chocs: { entrepreneurs: 2, salaries: -1 } } }[o]),
    axes: { marche: -0.4 },
    axesParOption: { racheter: { marche: -0.9, rigueur: -0.4 }, regie: { marche: -0.5 }, gratuite: { marche: -0.3, social: 0.4, rigueur: -0.6 }, concurrence: { marche: 0.6 } },
    chiffrage: 'Hypothèses de jeu : rachat 30 Md€ (dette) puis environ 2 Md€ de recettes nettes par an ; régie à l\'échéance, jusqu\'à 2,5 Md€ par an vers 2036 ; gratuité, environ 5,4 Md€ par an de coût (entretien et recettes fiscales perdues) ; concurrence, environ 1,5 Md€ par an de redevances.',
  },
  {
    id: 'plan_ferroviaire',
    nom: 'Plan ferroviaire',
    categorie: 'infrastructures', pays: FR, vehicule: 'PLF',
    resume: 'Financer le plan de 100 Md€ d\'ici 2040 annoncé en février 2023, ou cibler les RER métropolitains ou les lignes à grande vitesse.',
    pedagogie: 'Le réseau ferré français est âgé : une grande partie des voies a plus de 30 ans. Le plan de 100 Md€ d\'ici 2040, annoncé par Élisabeth Borne, devait être partagé entre l\'État, SNCF Réseau, les collectivités et l\'Union européenne ; son financement n\'a jamais été bouclé. Les « services express régionaux métropolitains » (SERM) visent les déplacements quotidiens autour des grandes villes.',
    pour: ['Report de la voiture vers le train : moins d\'émissions', 'Désenclavement et aménagement du territoire'],
    contre: ['Coûts élevés et délais longs', 'Lignes nouvelles : impact sur les terres agricoles'],
    exemples: ['Suisse : investissement ferroviaire par habitant parmi les plus élevés d\'Europe', 'Allemagne : retards massifs de la Deutsche Bahn faute d\'investissement'],
    options: [
      { id: 'cent_milliards', nom: 'Financer la part de l\'État du plan de 100 Md€ (+2,5 Md€ par an)' },
      { id: 'serm', nom: 'Priorité aux RER métropolitains (+1 Md€ par an)' },
      { id: 'lgv', nom: 'Lignes nouvelles : Bordeaux-Toulouse, Montpellier-Perpignan (+1,5 Md€ par an jusqu\'en 2040)' },
    ],
    delai: 1,
    effets(e, o, age) {
      const t = ans(age);
      if (o === 'serm') return { depenses: { transports: 1 * prix(e) }, emissionsEvitees: Math.min(1.5, 0.15 * t) };
      if (o === 'lgv') return { depenses: { transports: (e.trimestre.annee <= 2040 ? 1.5 : 0.2) * prix(e) }, emissionsEvitees: e.trimestre.annee >= 2033 ? 1 : 0, potentielBonus: 0.004 };
      return { depenses: { transports: 2.5 * prix(e) }, emissionsEvitees: Math.min(3, 0.2 * t), potentielBonus: 0.008 };
    },
    reaction: () => ({ chocs: { salaries: 1, jeunes: 2 } }),
    axes: { ecologie: 0.6, rigueur: -0.3 },
    positionsGroupes: { ECOS: 0.7, SOC: 0.6, GDR: 0.6, LFI: 0.4, LIOT: 0.4, EPR: 0.2, DEM: 0.3, RN: 0, DR: -0.2 },
    chiffrage: 'Hypothèses de jeu : 1 à 2,5 Md€ par an ; jusqu\'à 3 Mt de CO2 évitées par an à long terme.',
  },

  // ======================================================================
  // ORGANISATION DE L'ÉTAT (inspiré de Jean-Louis Borloo)
  // ======================================================================
  {
    id: 'decentralisation',
    nom: '« Big bang » de la décentralisation (inspiré de Jean-Louis Borloo)',
    categorie: 'institutions', pays: FR, vehicule: 'loi',
    resume: 'Une compétence, un seul niveau : l\'État se recentre sur le régalien et les grands équilibres, les régions et les départements gèrent le quotidien, les doublons disparaissent.',
    pedagogie: 'Jean-Louis Borloo dénonce une « désorganisation unique au monde » : État, régions, départements, intercommunalités et agences interviennent sur les mêmes sujets (« parfois cinq équipes pour s\'occuper d\'un enfant dans une crèche », a-t-il dit au Sénat). Il propose que chaque mission relève d\'un seul niveau, que l\'État se concentre sur la sécurité, la justice, la recherche, l\'équité et l\'impôt, et que les élus locaux décident davantage. Il chiffre le coût de cette désorganisation à près de 150 Md€, un chiffre non vérifié : les réformes territoriales passées ont produit des économies bien plus modestes et lentes que promis. Le jeu retient donc une économie prudente.',
    pour: ['Clarté : on sait qui fait quoi et qui est responsable', 'Décisions plus proches du terrain', 'Économies sur les doublons et les fonctions support'],
    contre: ['Transition longue et coûteuse (transferts de personnels, de patrimoine, de budgets)', 'Risque d\'inégalités entre territoires', 'Résistances des administrations et des élus'],
    exemples: ['Allemagne : Länder dotés de compétences propres et de pouvoirs législatifs', 'Espagne : communautés autonomes', 'Italie : régionalisation de la santé'],
    sources: SOURCES_BORLOO,
    options: [
      { id: 'un_niveau', nom: 'Une compétence, un seul niveau : transferts de blocs entiers (logement, emploi, routes, santé de proximité)', description: 'Économie visée de 5 Md€ par an au bout de huit ans (hypothèse de jeu).' },
      { id: 'pouvoir_reglementaire', nom: 'Donner aux régions un pouvoir réglementaire et le droit à la différenciation', description: 'Réforme plus légère, économies limitées.' },
    ],
    positionsGroupes: { LIOT: 0.6, DEM: 0.6, HOR: 0.5, DR: 0.4, EPR: 0.3, SOC: 0.2, ECOS: 0.2, RN: -0.6, UDR: -0.4, LFI: -0.5, GDR: -0.4 },
    delai: 2,
    effets(e, o, age) {
      if (o === 'pouvoir_reglementaire') return { depenses: { economieFinances: -1 * rampe(age - 4, 12) * prix(e) }, potentielBonus: 0.004 };
      const transition = age < 8 ? 0.8 : 0;
      return { depenses: { economieFinances: (transition - 5 * rampe(age - 8, 24)) * prix(e) }, potentielBonus: 0.008 * rampe(age - 8, 16) };
    },
    reaction: (e, o) => (o === 'un_niveau' ? { chocs: { fonctionnaires: -3, entrepreneurs: 2 }, grief: { fonctionnaires: 3 }, instabilite: 0.04, credibilite: 0.04 } : { chocs: { entrepreneurs: 1 } }),
    axes: { marche: 0.3, rigueur: 0.3 },
    chiffrage: 'Hypothèses de jeu : coût de transition de 0,8 Md€ par an pendant deux ans, puis économies montant à 5 Md€ par an après huit à dix ans. Pouvoir réglementaire : 1 Md€ par an au bout de quatre ans.',
  },
  {
    id: 'provinces',
    nom: 'Fusionner régions et départements en « provinces »',
    categorie: 'institutions', pays: FR, vehicule: 'loi',
    majoriteRenforcee: true,
    resume: 'Remplacer les régions et les départements par des « provinces » aux compétences uniques : une révision de la Constitution, qui mentionne les départements.',
    pedagogie: 'Supprimer un échelon est un serpent de mer : le « conseiller territorial » de 2010, qui devait siéger à la fois au département et à la région, a été abrogé en 2013. Une fusion exige une révision constitutionnelle (trois cinquièmes du Parlement réuni en Congrès, ou référendum). Les départements gèrent l\'action sociale (RSA, aide sociale à l\'enfance, dépendance) et sont très défendus par les élus ruraux et le Sénat.',
    pour: ['Un échelon de moins, moins de doublons', 'Des provinces de taille européenne'],
    contre: ['Éloignement des services sociaux en zone rurale', 'Coût et durée de la transition', 'Opposition du Sénat et des élus départementaux'],
    exemples: ['Danemark : suppression des comtés en 2007, remplacés par cinq régions', 'Italie : suppression partielle des provinces en 2014'],
    sources: SOURCES_BORLOO,
    options: [{ id: 'oui', nom: 'Réviser la Constitution et créer les provinces' }],
    positionsGroupes: { HOR: 0.4, DEM: 0.4, EPR: 0.3, LIOT: -0.2, DR: -0.4, SOC: -0.3, RN: -0.8, UDR: -0.6, LFI: -0.6, GDR: -0.7, ECOS: -0.2 },
    delai: 4,
    effets: (e, o, age) => ({ depenses: { economieFinances: ((age < 8 ? 1.5 : 0) - 7 * rampe(age - 8, 32)) * prix(e) }, potentielBonus: 0.006 * rampe(age - 8, 20) }),
    reaction: () => ({ chocs: { fonctionnaires: -5, retraites: -2, agriculteurs: -3, entrepreneurs: 2 }, grief: { fonctionnaires: 5, agriculteurs: 3 }, instabilite: 0.06, credibilite: 0.05 }),
    axes: { marche: 0.4, rigueur: 0.4 },
    chiffrage: 'Hypothèses de jeu : transition de 1,5 Md€ par an pendant deux ans, puis économies montant à 7 Md€ par an après une dizaine d\'années.',
  },
  {
    id: 'reduction_parlementaires',
    nom: 'Réduire d\'un quart le nombre de parlementaires',
    categorie: 'institutions', pays: FR, vehicule: 'loi',
    resume: 'Passer de 577 à environ 430 députés et de 348 à environ 260 sénateurs, comme le prévoyait le projet de réforme de 2019, abandonné.',
    pedagogie: 'Mesure populaire mais à l\'économie symbolique (de l\'ordre de 0,1 Md€ par an). Moins d\'élus, ce sont des circonscriptions plus grandes et un lien plus distendu avec les électeurs. Elle passe par une loi organique ; le Sénat doit l\'approuver pour ce qui le concerne.',
    pour: ['Mesure d\'exemplarité, très populaire', 'Assemblée plus efficace selon ses partisans'],
    contre: ['Économie symbolique', 'Territoires ruraux moins représentés'],
    options: [{ id: 'oui', nom: 'Réduire d\'un quart le nombre de parlementaires' }],
    positionsGroupes: { EPR: 0.6, HOR: 0.4, DEM: 0.3, RN: 0.2, DR: -0.3, SOC: -0.4, LFI: -0.4, GDR: -0.6, LIOT: -0.8, ECOS: -0.4 },
    delai: 4,
    effets: () => ({ depenses: { economieFinances: -0.1 } }),
    reaction: () => ({ opinion: { salaries: 2, retraites: 2 }, chocs: { retraites: 1 } }),
    axes: { rigueur: 0.2 },
    chiffrage: 'Environ 0,1 Md€ par an (ordre de grandeur).',
  },

  // ======================================================================
  // ÉDUCATION
  // ======================================================================
  {
    id: 'uniforme',
    nom: 'Tenue unique à l\'école',
    categorie: 'education', pays: FR, vehicule: 'décret', vote: false,
    resume: 'Généraliser la tenue unique expérimentée depuis la rentrée 2024 dans une centaine d\'établissements volontaires.',
    pedagogie: 'L\'expérimentation finançait environ 200 € de tenue par élève, à parts égales entre l\'État et la collectivité. Ses effets sur le climat scolaire et les inégalités sont encore évalués. Généraliser à plus de 12 millions d\'élèves représente plusieurs centaines de millions d\'euros par an.',
    pour: ['Atténuer les marques sociales et la pression des marques', 'Sentiment d\'appartenance'],
    contre: ['Effet sur les résultats non démontré', 'Coût et contrainte pour les familles'],
    exemples: ['Royaume-Uni : uniforme généralisé de longue date'],
    options: [{ id: 'generaliser', nom: 'Généraliser la tenue unique' }],
    delai: 2,
    effets: () => ({ depenses: { education: 0.4 } }),
    reaction: () => ({ chocs: { retraites: 2, jeunes: -2, salaries: 0 } }),
    axes: { securite: 0.3, social: -0.1 },
    positionsGroupes: { RN: 0.9, UDR: 0.8, DR: 0.8, EPR: 0.2, HOR: 0.3, LFI: -0.8, ECOS: -0.6, GDR: -0.6, SOC: -0.4 },
    chiffrage: 'Hypothèse de jeu : 0,4 Md€ par an pour la part de l\'État.',
  },
  {
    id: 'groupes_niveau',
    nom: 'Groupes de niveau au collège (« choc des savoirs »)',
    categorie: 'education', pays: FR, vehicule: 'décret', vote: false,
    resume: 'Généraliser les groupes de niveau en français et en mathématiques, ou y renoncer.',
    pedagogie: 'Introduits en 6e et 5e à la rentrée 2024 puis assouplis en « groupes de besoins », ils exigent des enseignants supplémentaires. Les études internationales montrent des effets contrastés : gains pour les bons élèves, risque de décrochage pour les plus faibles si les groupes sont figés.',
    pour: ['Enseignement adapté au niveau de chacun', 'Lutte contre la baisse du niveau en mathématiques (enquêtes PISA, TIMSS)'],
    contre: ['Risque de stigmatisation et de tri social', 'Besoin de milliers d\'enseignants'],
    options: [
      { id: 'generaliser', nom: 'Généraliser au collège (+0,5 Md€ par an)' },
      { id: 'abandonner', nom: 'Abandonner et revenir aux classes hétérogènes' },
    ],
    positionsGroupesParOption: {
      generaliser: { DR: 0.6, RN: 0.4, UDR: 0.4, EPR: 0.3, HOR: 0.3, LFI: -0.8, SOC: -0.6, ECOS: -0.6, GDR: -0.7 },
      abandonner: { LFI: 0.6, SOC: 0.5, ECOS: 0.5, GDR: 0.6, DR: -0.6, RN: -0.4, EPR: -0.2 },
    },
    delai: 2,
    effets: (e, o, age) => (o === 'abandonner' ? { depenses: { education: -0.2 } } : { depenses: { education: 0.5 * prix(e) }, potentielBonus: 0.004 * rampe(age - 20, 20) }),
    reaction: (e, o) => (o === 'abandonner' ? { chocs: { fonctionnaires: 2, retraites: -1 } } : { chocs: { fonctionnaires: -2, retraites: 1 } }),
    axes: { social: -0.1 },
    chiffrage: 'Hypothèses de jeu : 0,5 Md€ par an ; effet sur la croissance potentielle seulement après une dizaine d\'années.',
  },
  {
    id: 'jobs_etudiants',
    nom: 'Exonérer d\'impôt les jobs étudiants',
    categorie: 'fiscalite', pays: FR, vehicule: 'PLF',
    resume: 'Le salaire d\'un étudiant de 25 ans au plus n\'est aujourd\'hui exonéré d\'impôt sur le revenu que jusqu\'à trois SMIC mensuels par an (5 405 € pour les revenus de 2025). Supprimer ce plafond, la limite d\'âge, ou aussi les cotisations salariales.',
    pedagogie: 'L\'exonération existe déjà en grande partie : un étudiant qui gagne moins de 5 405 € par an ne paie pas d\'impôt sur ce salaire. Elle compte surtout pour les familles qui rattachent leur enfant à leur foyer fiscal, car son salaire s\'ajoute sinon à leurs revenus imposables. Supprimer le plafond profite aux étudiants qui travaillent beaucoup ; supprimer la limite d\'âge, aux étudiants plus âgés (reprise d\'études, doctorants). Exonérer aussi les cotisations salariales augmenterait le salaire net d\'environ un quart, mais réduirait les droits à la retraite si l\'État ne les compense pas. Selon l\'Observatoire national de la vie étudiante, 44 % des étudiants ont une activité rémunérée pendant l\'année ; un emploi très prenant fait concurrence aux études, alors qu\'un petit job peut aider à construire un projet professionnel.',
    sources: SOURCES_JOBS_ETUDIANTS,
    pour: ['Récompenser le travail des étudiants', 'Plus de pouvoir d\'achat pour les étudiants et leurs familles', 'Main-d\'œuvre pour la restauration, le commerce et l\'animation'],
    contre: ['Mesure en partie déjà en vigueur', 'Peut inciter à trop travailler pendant les études', 'Sans cotisations, moins de droits à la retraite'],
    options: [
      { id: 'plafond', nom: 'Supprimer le plafond de trois SMIC (étudiants de 25 ans au plus)' },
      { id: 'tous', nom: 'Sans plafond ni limite d\'âge : tous les étudiants' },
      { id: 'cotisations', nom: 'Sans plafond ni limite d\'âge, et sans cotisations salariales jusqu\'à trois SMIC' },
    ],
    delai: 2,
    effets(e, o, age) {
      const k = rampe(age, 2) * prix(e);
      if (o === 'plafond') return { recettes: { impotRevenu: -0.15 * k } };
      if (o === 'tous') return { recettes: { impotRevenu: -0.35 * k } };
      return { recettes: { impotRevenu: -0.35 * k, cotisations: -1.4 * k }, offreTravail: 0.03 * rampe(age, 4) };
    },
    reaction: (e, o) => ({
      plafond: { chocs: { jeunes: 3, salaries: 0.5 } },
      tous: { chocs: { jeunes: 4, salaries: 0.5 } },
      cotisations: { chocs: { jeunes: 6, salaries: 1, entrepreneurs: 1 }, credibilite: -0.01 },
    }[o]),
    axes: { fiscal: -0.3, social: 0.2, travail: 0.2 },
    positionsGroupes: { RN: 0.7, UDR: 0.6, DR: 0.6, EPR: 0.5, HOR: 0.5, DEM: 0.5, SOC: 0.3, LIOT: 0.5, LFI: 0.2, GDR: 0.2, ECOS: 0.2 },
    positionsGroupesParOption: { cotisations: { SOC: 0, LFI: -0.3, GDR: -0.3, ECOS: -0.1 } },
    chiffrage: 'Hypothèses de jeu : environ 1,3 million d\'étudiants travaillent (44 % d\'environ 3 millions). Supprimer le plafond : environ 0,15 Md€ par an ; sans limite d\'âge : environ 0,35 Md€ ; sans cotisations salariales en plus (environ 22 % d\'un salaire moyen de 5 000 € par an) : environ 1,75 Md€ par an au total.',
  },
];
