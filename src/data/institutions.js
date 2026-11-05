/**
 * Institutions de la Ve République (France) : Élysée, Matignon, Assemblée
 * nationale, Sénat et Conseil constitutionnel ; pouvoirs du président de la
 * République et du Premier ministre (Constitution du 4 octobre 1958).
 *
 * Les articles cités, les compositions et les précédents sont des faits
 * sourcés. Leur traduction dans le jeu (entente entre l'Élysée et Matignon,
 * votes du Sénat, effets sur l'opinion) relève d'hypothèses de jeu.
 */

export const SOURCES_INSTITUTIONS = {
  constitution: { titre: 'Légifrance : Constitution du 4 octobre 1958', url: 'https://www.legifrance.gouv.fr/loda/id/LEGITEXT000006071194' },
  conseil: { titre: 'Conseil constitutionnel : texte intégral de la Constitution en vigueur', url: 'https://www.conseil-constitutionnel.fr/le-bloc-de-constitutionnalite/texte-integral-de-la-constitution-du-4-octobre-1958-en-vigueur' },
  senat2026: { titre: 'Sénat : renouvellement des instances du Sénat (2026)', url: 'https://www.senat.fr/connaitre-le-senat/renouvellement-des-instances-du-senat-2026.html' },
  groupesSenat: { titre: 'Public Sénat : la nouvelle composition du Sénat après la formation des groupes (octobre 2026)', url: 'https://www.publicsenat.fr/actualites/politique/decouvrez-la-nouvelle-composition-du-senat-apres-la-formation-des-groupes-politiques' },
  senatoriales: { titre: 'Public Sénat : résultats des sénatoriales 2026, stabilité de la majorité sénatoriale', url: 'https://www.publicsenat.fr/actualites/politique/en-direct-elections-senatoriales-2026-suivez-tous-les-resultats-les-enjeux-les-reactions-politiques' },
  larcher: { titre: 'Infos Yvelines : Gérard Larcher réélu président du Sénat (1er octobre 2026)', url: 'https://www.infosyvelines.fr/articles/rambouillet-gerard-larcher-senat-reelu-2026' },
};

/** Les cinq lieux du pouvoir modélisés. */
export const PALAIS = {
  elysee: { nom: 'Palais de l\'Élysée', fonction: 'Président de la République', role: 'Chef de l\'État', textes: 'Titre II, articles 5 à 19', mandat: 'Élu au suffrage universel direct pour cinq ans (article 6), deux mandats consécutifs au plus.' },
  matignon: { nom: 'Hôtel de Matignon', fonction: 'Premier ministre', role: 'Chef du Gouvernement', textes: 'Titre III, articles 20 à 23', mandat: 'Nommé par le président (article 8), responsable devant l\'Assemblée nationale (articles 49 et 50).' },
  bourbon: { nom: 'Palais Bourbon', fonction: 'Assemblée nationale', role: 'Vote la loi, contrôle le Gouvernement, peut le renverser', textes: 'Titres IV et V', mandat: '577 députés élus au suffrage direct pour cinq ans ; dissolution possible (article 12).', president: 'Yaël Braun-Pivet', depuisPresident: 'présidente depuis 2022, réélue en juillet 2024' },
  luxembourg: { nom: 'Palais du Luxembourg', fonction: 'Sénat', role: 'Représente les collectivités territoriales (article 24)', textes: 'Titres IV et V', mandat: '348 sénateurs élus au suffrage indirect pour six ans, renouvelés par moitié tous les trois ans ; le Sénat ne peut pas être dissous ni renverser le Gouvernement.', president: 'Gérard Larcher', depuisPresident: 'réélu le 1er octobre 2026 pour un sixième mandat' },
  montpensier: { nom: 'Palais-Royal (rue de Montpensier)', fonction: 'Conseil constitutionnel', role: 'Juge la conformité des lois à la Constitution', textes: 'Titre VII, articles 56 à 63', mandat: 'Neuf membres nommés pour neuf ans, renouvelés par tiers tous les trois ans (trois par le président de la République, trois par le président de l\'Assemblée, trois par le président du Sénat).', president: 'Richard Ferrand', depuisPresident: 'président depuis mars 2025, nommé par Emmanuel Macron' },
};

/**
 * Sénat après le renouvellement du 27 septembre 2026 (listes des groupes du
 * 5 octobre 2026). `proxies` : groupes de l'Assemblée dont les sénateurs
 * partagent les positions (hypothèse de jeu) ; `ordre` : de gauche à droite.
 */
export const SENAT_GROUPES = [
  { id: 'CRCE', nom: 'Communiste, républicain, citoyen et écologiste – Kanaky', court: 'CRCE-K', sieges: 18, couleur: '#b71c1c', proxies: { GDR: 1 } },
  { id: 'GEST', nom: 'Écologiste – Solidarité et territoires', court: 'Écologistes', sieges: 15, couleur: '#43a047', proxies: { ECOS: 1 } },
  { id: 'SER', nom: 'Socialiste, écologiste et républicain', court: 'PS (SER)', sieges: 62, couleur: '#e91e63', proxies: { SOC: 1 } },
  { id: 'RDSE', nom: 'Rassemblement démocratique et social européen', court: 'RDSE', sieges: 18, couleur: '#ff8a65', proxies: { LIOT: 1 } },
  { id: 'RDPI', nom: 'Rassemblement des démocrates, progressistes et indépendants', court: 'RDPI', sieges: 16, couleur: '#f2b630', proxies: { EPR: 1 } },
  { id: 'UC', nom: 'Union centriste', court: 'Union centriste', sieges: 63, couleur: '#ff9800', proxies: { DEM: 0.6, HOR: 0.4 } },
  { id: 'LIRT', nom: 'Les Indépendants – République et territoires', court: 'Indépendants', sieges: 15, couleur: '#29b6f6', proxies: { HOR: 1 } },
  { id: 'LR', nom: 'Les Républicains', court: 'LR', sieges: 124, couleur: '#1565c0', proxies: { DR: 1 } },
  { id: 'UNT', nom: 'Union nationale pour les territoires (RN et UDR)', court: 'RN-UDR', sieges: 15, couleur: '#1b2a6b', proxies: { RN: 0.8, UDR: 0.2 } },
  { id: 'NI', nom: 'Non-inscrits', court: 'Non-inscrits', sieges: 2, couleur: '#9e9e9e', proxies: {} },
];
export const SIEGES_SENAT = 348;

/**
 * Préférences propres au Sénat, au-delà des positions des partis : défense
 * des collectivités et du bicamérisme (hypothèses de jeu).
 */
export const BIAIS_SENAT = {
  reduction_parlementaires: -1.4,
  provinces: -0.8,
  constituante: -1.5,
  dotations_collectivites: -0.6,
  proportionnelle: -0.4,
  decentralisation: 0.3,
  agences_operateurs: 0.3,
};

/**
 * Textes qui exigent l'accord du Sénat : lois organiques relatives au Sénat
 * (article 46, alinéa 4). Les révisions de la Constitution (article 89) le
 * demandent aussi : elles sont repérées par `majoriteRenforcee`.
 */
export const ACCORD_SENAT_REQUIS = ['reduction_parlementaires'];

/** Pouvoirs du président de la République. `propre` : dispensé de contreseing (article 19). */
export const POUVOIRS_PRESIDENT = [
  { id: 'nommer_pm', article: '8', nom: 'Nommer le Premier ministre', propre: true, texte: 'Il nomme le Premier ministre et met fin à ses fonctions quand celui-ci présente la démission du Gouvernement. Il nomme les ministres sur proposition du Premier ministre.', jeu: 'Rôle de président : onglet Parlement. En cohabitation, la majorité de l\'Assemblée impose son choix.' },
  { id: 'conseil_ministres', article: '9 et 13', nom: 'Présider le Conseil des ministres, signer ordonnances et décrets', propre: false, texte: 'Les grandes décisions du Gouvernement y sont délibérées. Il signe les ordonnances et les décrets délibérés en Conseil des ministres.', jeu: 'En cohabitation, vous pouvez refuser de signer des ordonnances : le Gouvernement doit alors passer par une loi (un trimestre de retard), comme en 1986.' },
  { id: 'promulguer', article: '10', nom: 'Promulguer les lois ou demander une nouvelle délibération', propre: false, texte: 'Il promulgue les lois dans les quinze jours. Il peut demander au Parlement une nouvelle délibération, qui ne peut être refusée.', jeu: 'En cohabitation : nouvelle délibération d\'un texte du Gouvernement (un trimestre de report).' },
  { id: 'referendum', article: '11', nom: 'Soumettre un projet de loi au référendum', propre: true, texte: 'Sur proposition du Gouvernement ou des deux assemblées : organisation des pouvoirs publics, réformes de la politique économique, sociale ou environnementale et services publics, ratification de certains traités.', jeu: 'Onglet Réformes. Il faut une proposition du Gouvernement : un Premier ministre en désaccord, ou de cohabitation, peut la refuser.' },
  { id: 'dissolution', article: '12', nom: 'Dissoudre l\'Assemblée nationale', propre: true, texte: 'Après consultation du Premier ministre et des présidents des assemblées. Élections dans les 20 à 40 jours ; pas de nouvelle dissolution dans l\'année qui suit.', jeu: 'Onglet Parlement. Gagner rend une majorité, perdre peut mener à la cohabitation.' },
  { id: 'chef_armees', article: '15', nom: 'Chef des armées', propre: false, texte: 'Il préside les conseils et comités supérieurs de la défense nationale ; il décide de l\'emploi de la dissuasion nucléaire.', jeu: 'Onglets Armées, Dissuasion et Géopolitique : opérations, dissuasion, groupe aéronaval. Il les garde en cohabitation.' },
  { id: 'diplomatie', article: '14 et 52', nom: 'Représenter la France, négocier et ratifier les traités', propre: false, texte: 'Les ambassadeurs sont accrédités auprès de lui ; il négocie et ratifie les traités.', jeu: 'Sommets du G7 (onglet Grands rendez-vous), diplomatie.' },
  { id: 'article16', article: '16', nom: 'Pouvoirs exceptionnels', propre: true, texte: 'En cas de menace grave et immédiate sur les institutions, l\'indépendance de la nation, l\'intégrité du territoire ou les engagements internationaux, quand le fonctionnement régulier des pouvoirs publics est interrompu. Consultations obligatoires ; contrôle du Conseil constitutionnel après 30 jours.', jeu: 'Seulement lors d\'une crise extrême (événement rare) : efficace à court terme, très coûteux pour la crédibilité démocratique.' },
  { id: 'grace', article: '17', nom: 'Droit de grâce', propre: false, texte: 'À titre individuel : la grâce dispense de tout ou partie de la peine, sans effacer la condamnation.', jeu: 'Événement : une demande de grâce médiatisée.' },
  { id: 'message', article: '18', nom: 'S\'adresser au Parlement réuni en Congrès', propre: true, texte: 'Il communique avec les assemblées par des messages lus sans débat, ou prend la parole devant le Parlement réuni en Congrès à Versailles (depuis 2008).', jeu: 'Une fois par an : fixe un cap, rapproche l\'Élysée et Matignon.' },
  { id: 'conseil_constitutionnel', article: '56 et 61', nom: 'Nommer au Conseil constitutionnel et le saisir', propre: true, texte: 'Il nomme trois des neuf membres, dont le président du Conseil. Il peut le saisir d\'une loi avant sa promulgation.', jeu: 'Nominations lors des renouvellements (mars 2028, 2031...) ; en cohabitation, saisine des lois du Gouvernement.' },
  { id: 'revision', article: '89', nom: 'Initiative de la révision de la Constitution', propre: false, texte: 'Sur proposition du Premier ministre. Le texte doit être voté dans les mêmes termes par les deux assemblées, puis approuvé par référendum ou par le Congrès à la majorité des trois cinquièmes.', jeu: 'Réformes « révision constitutionnelle » : le Sénat peut les bloquer.' },
];

/** Pouvoirs du Premier ministre et du Gouvernement. */
export const POUVOIRS_PREMIER_MINISTRE = [
  { id: 'diriger', article: '20 et 21', nom: 'Diriger l\'action du Gouvernement', texte: 'Le Gouvernement détermine et conduit la politique de la nation ; le Premier ministre coordonne les ministres et arbitre leurs désaccords.', jeu: 'Rôle de Premier ministre : budget (arbitrages entre ministères), impôts, réformes.' },
  { id: 'reglementaire', article: '21 et 37', nom: 'Pouvoir réglementaire et exécution des lois', texte: 'Il prend les décrets d\'application et les règlements dans les matières qui ne relèvent pas de la loi.', jeu: 'Les mesures réglementaires (décrets) s\'appliquent sans vote du Parlement.' },
  { id: 'initiative', article: '39', nom: 'Initiative des lois', texte: 'Il dépose les projets de loi, délibérés en Conseil des ministres après avis du Conseil d\'État.', jeu: 'Onglet Réformes : chaque trimestre, un projet de loi regroupe vos réformes.' },
  { id: 'procedure', article: '44, 45 et 48', nom: 'Maîtriser la procédure parlementaire', texte: 'Inscription prioritaire à l\'ordre du jour, procédure accélérée, convocation d\'une commission mixte paritaire, vote bloqué ; en cas de désaccord persistant, il peut demander à l\'Assemblée de statuer définitivement.', jeu: 'Le jeu suppose la procédure accélérée : si le Sénat s\'oppose, la commission mixte paritaire échoue et l\'Assemblée a le dernier mot.' },
  { id: 'confiance', article: '49, alinéa 1', nom: 'Engager la responsabilité du Gouvernement sur son programme', texte: 'La confiance est accordée si la majorité des suffrages exprimés ne s\'y oppose pas ; sinon le Gouvernement doit démissionner (article 50).', jeu: 'Onglet Institutions : une fois par session. Gagner donne du répit ; perdre renverse le Gouvernement.' },
  { id: '493', article: '49, alinéa 3', nom: 'Engager la responsabilité sur un texte (49.3)', texte: 'Le texte est adopté sans vote, sauf si une motion de censure réunit la majorité absolue des députés. Illimité pour les lois de finances et de financement de la Sécurité sociale, une fois par session pour un autre texte.', jeu: 'Onglets Réformes et Parlement (procédure).' },
  { id: 'defense_nationale', article: '20 et 21', nom: 'Responsable de la défense nationale', texte: 'Le Gouvernement dispose de la force armée ; le Premier ministre coordonne l\'action des ministères pour la défense et peut suppléer le président à la tête des conseils de défense.', jeu: 'Onglet Armées : budget et programmes ; opérations et dissuasion restent décidées par le président.' },
  { id: 'proposer', article: '11, 12 et 89', nom: 'Proposer un référendum, être consulté sur la dissolution, proposer une révision', texte: 'Le référendum de l\'article 11 et la révision de l\'article 89 partent d\'une proposition du Premier ministre ; il est consulté avant une dissolution.', jeu: 'Rôle de Premier ministre : le président accepte ou refuse selon votre entente.' },
];

/** Les trois cohabitations de la Ve République. */
export const COHABITATIONS = [
  { periode: '1986-1988', president: 'François Mitterrand', premierMinistre: 'Jacques Chirac' },
  { periode: '1993-1995', president: 'François Mitterrand', premierMinistre: 'Édouard Balladur' },
  { periode: '1997-2002', president: 'Jacques Chirac', premierMinistre: 'Lionel Jospin' },
];

/** Précédents réels cités dans le jeu. */
export const PRECEDENTS = {
  article16: 'L\'article 16 n\'a été appliqué qu\'une fois, du 23 avril au 29 septembre 1961, après le putsch des généraux à Alger.',
  confiance: 'Le 8 septembre 2025, François Bayrou a engagé la responsabilité de son gouvernement (49.1) : 364 députés ont voté contre, 194 pour ; il a dû remettre sa démission.',
  censure: 'Le 4 décembre 2024, le gouvernement de Michel Barnier a été renversé par une motion de censure (331 voix), une première depuis 1962.',
  dissolution: 'Emmanuel Macron a dissous l\'Assemblée le 9 juin 2024, au soir des élections européennes ; aucun bloc n\'a obtenu la majorité absolue.',
  saisine: 'Fin 2023, Emmanuel Macron a lui-même saisi le Conseil constitutionnel de la loi immigration ; le 25 janvier 2024, une trentaine d\'articles ont été censurés.',
  ordonnances: 'En juillet 1986, François Mitterrand a refusé de signer les ordonnances de privatisation du gouvernement Chirac, qui a dû passer par une loi.',
  demission: 'Jacques Chirac est le seul Premier ministre à avoir quitté Matignon de sa propre initiative, en août 1976, en désaccord avec Valéry Giscard d\'Estaing.',
  congres: 'Le président s\'est adressé au Congrès à Versailles en 2009 (Nicolas Sarkozy), le 16 novembre 2015 après les attentats (François Hollande), en 2017 et en 2018 (Emmanuel Macron).',
  grace: 'Depuis 2008, la grâce ne peut être qu\'individuelle. En 2016, Jacqueline Sauvage a été graciée partiellement puis totalement par François Hollande.',
  referendum: 'Dernier référendum : le 29 mai 2005, sur le traité constitutionnel européen (près de 55 % de non). En 1969, le général de Gaulle a quitté le pouvoir après la victoire du non.',
  senat: 'Une révision de la Constitution doit être votée dans les mêmes termes par les deux assemblées : la réforme institutionnelle de 2018-2019 (réduction du nombre de parlementaires) n\'a jamais abouti faute d\'accord avec le Sénat.',
};

/**
 * Cohabitation : Premier ministre imposé par une majorité absolue opposée au
 * président, et mesures que son gouvernement met en œuvre, une par trimestre
 * (programmes publics des partis, voir src/data/programmes.js). Hypothèses de
 * jeu : le RN a présenté Jordan Bardella comme son candidat à Matignon en 2024.
 */
export const GOUVERNEMENTS_COHABITATION = {
  RN: {
    bloc: 'RN', nom: 'Jordan Bardella', etiquette: 'Rassemblement national', groupes: ['RN', 'UDR'],
    mesures: [
      { reforme: 'tva_energie', option: 'cinq_cinq' },
      { reforme: 'retraites_age', option: 'abrogation_62' },
      { reforme: 'ir_moins_30', option: 'exonerer' },
      { reforme: 'ame', option: 'urgence' },
      { reforme: 'autoroutes', option: 'racheter', ordonnances: true },
      { reforme: 'eolien_mer', option: 'moratoire' },
      { reforme: 'retraites_carrieres_longues', option: 'oui' },
      { reforme: 'oqtf', option: 'retention' },
    ],
    referendum: 'priorite_nationale',
  },
  gauche: {
    bloc: 'gauche', nom: 'Un Premier ministre de la gauche unie', etiquette: 'Union de la gauche', groupes: ['SOC', 'LFI', 'ECOS', 'GDR'],
    mesures: [
      { reforme: 'retraites_age', option: 'abrogation_62' },
      { reforme: 'smic_hausse', option: 'mille_six_cents' },
      { reforme: 'ifi', option: 'isf' },
      { reforme: 'taxe_superprofits', option: 'oui' },
      { reforme: 'blocage_prix', option: 'blocage', ordonnances: true },
      { reforme: 'encadrement_loyers', option: 'oui' },
      { reforme: 'point_indice_hausse', option: 'deux' },
      { reforme: 'taxe_hauts_patrimoines', option: 'oui' },
    ],
    referendum: null,
  },
};

/** Orientations du président Emmanuel Macron (2026-2027), reprises comme « priorités de l'Élysée ». */
export const PRIORITES_ELYSEE_2027 = ['effort_defense', 'nucleaire_epr2', 'service_militaire'];
