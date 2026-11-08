/**
 * Programmes de personnalités politiques françaises (présidentielle 2027).
 *
 * Chaque mesure renvoie à une réforme du catalogue et à une source. Le
 * statut indique la solidité de l'attribution :
 *  - 'programme' : mesure inscrite dans un programme publié ;
 *  - 'annonce'   : proposition faite publiquement (interview, discours) ;
 *  - 'a_verifier': attribution reprise de sites de suivi des candidats, à
 *                  confirmer dans les documents officiels.
 * Les programmes 2027 sont en cours d'écriture : le jeu les simplifie en
 * quelques mesures emblématiques, sans prétendre à l'exhaustivité. Aucune
 * citation n'est inventée.
 */

export const PROGRAMMES = [
  {
    id: 'melenchon',
    nom: 'Jean-Luc Mélenchon',
    mouvement: 'La France insoumise',
    couleur: '#c2185b',
    statut: 'Candidat déclaré ; programme « L\'Avenir en commun » (6e édition, 1 069 mesures) et orientations budgétaires pour 2027 présentées le 14 octobre 2026',
    resume: 'Rupture sociale et écologique financée par les plus riches et les grandes entreprises : selon LFI, 106,4 Md€ de recettes nouvelles, 81,7 Md€ de dépenses d\'urgence et 24,7 Md€ de baisse du déficit dès 2027, plus 100 Md€ d\'investissements par an via un pôle public bancaire. Retraite à 60 ans, SMIC à 1 700 €, VIe République.',
    mesures: [
      { reforme: 'lfi_revenus', option: 'urgence', texte: 'Point d\'indice +10 %, allocations familiales et APL +10 %, garantie d\'autonomie des jeunes, logements d\'urgence (37,5 Md€)', statut: 'programme' },
      { reforme: 'lfi_services_publics', option: 'urgence', texte: '10 000 enseignants, cantine gratuite, 250 000 places à l\'université, +3 Md€ pour l\'hôpital, plans contre les violences (22,2 Md€)', statut: 'programme' },
      { reforme: 'lfi_planification', option: 'urgence', texte: '700 000 rénovations par an, adaptation aux canicules, pompiers (10 Md€)', statut: 'programme' },
      { reforme: 'retraites_age', option: 'age_60', texte: 'Abroger la réforme de 2023 dès 2027 (9 Md€), puis revenir à 60 ans avec 40 annuités au cours du mandat', statut: 'programme' },
      { reforme: 'assurance_chomage', option: 'assouplir', texte: 'Abroger les réformes de l\'assurance chômage (3 Md€)', statut: 'programme' },
      { reforme: 'retraites_indexation', option: 'pleine_inflation', texte: 'Refuser la désindexation des pensions', statut: 'programme' },
      { reforme: 'retraites_minimum', option: 'oui', texte: 'Pension minimum au niveau du SMIC pour une carrière complète', statut: 'programme' },
      { reforme: 'smic_hausse', option: 'mille_sept_cents', texte: 'SMIC à 1 700 € net, conférence exceptionnelle sur les salaires', statut: 'programme' },
      { reforme: 'echelle_mobile', option: 'oui', texte: 'Indexation généralisée des salaires sur l\'inflation', statut: 'programme' },
      { reforme: 'blocage_prix', option: 'carburant', texte: 'Décret de blocage du prix des carburants à 1,70 € le litre', statut: 'programme' },
      { reforme: 'lfi_fiscalite_2017', option: 'annonce', texte: 'Supprimer la flat tax, rétablir un ISF renforcé, raboter les niches, rétablir la CVAE des grandes entreprises (44 Md€)', statut: 'programme' },
      { reforme: 'lfi_ultra_riches', option: 'annonce', texte: 'Taxe Zucman au-delà de 100 M€ et réforme des successions (35 Md€)', statut: 'programme' },
      { reforme: 'lfi_grandes_entreprises', option: 'annonce', texte: 'Impôt sur les sociétés, multinationales, GAFAM, superprofits, transactions financières, rachats d\'actions, cryptoactifs, fraude (27,4 Md€)', statut: 'programme' },
      { reforme: 'ir_progressif', option: 'quatorze', texte: 'Impôt sur le revenu à 14 tranches au cours du mandat', statut: 'programme' },
      { reforme: 'lfi_pole_bancaire', option: 'complet', texte: 'Pôle public bancaire : livrets centralisés à 80 %, livret A à 30 000 €, livret B (100 Md€ d\'investissements de plus par an)', statut: 'programme' },
      { reforme: 'lfi_bce_dette', option: 'annuler', texte: 'Obtenir de la BCE le gel ou l\'annulation des dettes publiques qu\'elle détient', statut: 'programme' },
      { reforme: 'constituante', option: 'convoquer', texte: 'Convoquer une Assemblée constituante pour une VIe République', statut: 'programme' },
      { reforme: 'autoroutes', option: 'racheter', texte: 'Renationaliser les autoroutes', statut: 'a_verifier' },
    ],
    sources: [
      { texte: 'Site de campagne : découvrir le programme (L\'Avenir en commun, 6e édition)', url: 'https://melenchon2027.fr/programme/decouvrir/' },
      { texte: 'LFI : « Comment nous allons remettre de l\'ordre dans les comptes publics » (octobre 2026)', url: 'https://melenchon2027.fr/wp-content/uploads/2026/10/Comment-nous-allons-remettre-de-l-ordre-dans-les-comptes-publics.pdf' },
      { texte: 'LFI : « Pour un pôle public bancaire au service des besoins » (octobre 2026)', url: 'https://melenchon2027.fr/wp-content/uploads/2026/10/DP-POLE-PUBLIC-BANCAIRE_ST.pdf' },
      { texte: 'LCP : le contre-budget de LFI (106,4 Md€ de recettes, 81,7 Md€ de dépenses)', url: 'https://lcp.fr/actualites/contre-budget-lfi-propose-1064-milliards-d-euros-de-recettes-supplementaires-et-817' },
      { texte: 'AFP (Fortuneo) : des économistes jugent le contre-budget « peu détaillé » et « optimiste »', url: 'https://bourse.fortuneo.fr/actualites/des-economistes-jugent-peu-detaille-et-optimiste-le-contre-budget-de-lfi-9369230' },
      { texte: 'Site de campagne : construction du programme', url: 'https://melenchon2027.fr/construction-programme/' },
    ],
  },
  {
    id: 'le_pen',
    nom: 'Marine Le Pen',
    mouvement: 'Rassemblement national',
    couleur: '#1b2a6b',
    statut: 'Condamnée en appel en juillet 2026 à une inéligibilité qui lui permet en théorie d\'être candidate en 2027 ; pourvoi en cassation. Jordan Bardella préside le parti.',
    resume: 'Pouvoir d\'achat par la baisse des taxes sur l\'énergie, retour sur la réforme des retraites, priorité nationale et fermeté migratoire. Le programme 2027 détaillé n\'est pas publié : le jeu reprend surtout le programme présidentiel de 2022.',
    mesures: [
      { reforme: 'tva_energie', option: 'cinq_cinq', texte: 'TVA à 5,5 % sur les carburants, le fioul, le gaz et l\'électricité', statut: 'programme' },
      { reforme: 'blocage_prix', option: 'tva_zero', texte: 'Supprimer la TVA sur un panier de produits de première nécessité', statut: 'a_verifier' },
      { reforme: 'retraites_age', option: 'abrogation_62', texte: 'Abroger la réforme de 2023 et revenir à 62 ans', statut: 'a_verifier' },
      { reforme: 'retraites_carrieres_longues', option: 'oui', texte: 'Départ anticipé pour les carrières commencées tôt', statut: 'programme' },
      { reforme: 'ir_moins_30', option: 'exonerer', texte: 'Exonérer d\'impôt sur le revenu les moins de 30 ans', statut: 'programme' },
      { reforme: 'priorite_nationale', option: 'referendum', texte: 'Priorité nationale inscrite dans la Constitution par référendum', statut: 'programme' },
      { reforme: 'autoroutes', option: 'racheter', texte: 'Nationaliser les autoroutes', statut: 'programme' },
      { reforme: 'eolien_mer', option: 'moratoire', texte: 'Moratoire sur l\'éolien', statut: 'programme' },
      { reforme: 'ame', option: 'urgence', texte: 'Remplacer l\'AME (le RN propose sa suppression)', statut: 'a_verifier' },
    ],
    sources: [
      { texte: 'IFRAP : chiffrage du programme de Marine Le Pen (2022)', url: 'https://www.ifrap.org/budget-et-fiscalite/chiffrage-du-programme-de-marine-le-pen' },
      { texte: 'Votons 2027 : le projet du RN', url: 'https://votons-2027.fr/candidats/le-pen/programme' },
      { texte: 'Public Sénat : la décision de la cour d\'appel', url: 'https://www.publicsenat.fr/actualites/politique/direct-suivez-le-delibere-du-proces-en-appel-de-marine-le-pen' },
    ],
  },
  {
    id: 'retailleau',
    nom: 'Bruno Retailleau',
    mouvement: 'Les Républicains',
    couleur: '#1565c0',
    statut: 'Président de LR ; candidat à la présidentielle 2027. Programme complet non publié (octobre 2026).',
    resume: 'Fermeté régalienne et migratoire, révision constitutionnelle par référendum, travail et logement : « renverser la table ».',
    mesures: [
      { reforme: 'revision_constitutionnelle', option: 'referendum', texte: 'Référendum élargi (article 11) et « bouclier constitutionnel » face au droit européen', statut: 'annonce' },
      { reforme: 'ame', option: 'urgence', texte: 'Remplacer l\'AME par une aide médicale d\'urgence', statut: 'annonce' },
      { reforme: 'dpe_location', option: 'supprimer', texte: 'Mettre fin aux interdictions de louer liées au DPE', statut: 'annonce' },
      { reforme: 'annualisation', option: '1623h_defisc', texte: 'Annualiser le temps de travail et défiscaliser les heures au-delà', statut: 'annonce' },
      { reforme: 'plafond_aides_smic', option: '70pct', texte: 'Plafonner le cumul des aides sociales à 70 % du SMIC (proposition de LR)', statut: 'a_verifier' },
      { reforme: 'prisons', option: 'plan_15000', texte: 'Construire des places de prison', statut: 'a_verifier' },
      { reforme: 'oqtf', option: 'retention', texte: 'Plus de centres de rétention pour exécuter les éloignements', statut: 'a_verifier' },
    ],
    sources: [
      { texte: 'Public Sénat : Bruno Retailleau veut « renverser la table » avec une profonde réforme constitutionnelle', url: 'https://www.publicsenat.fr/actualites/politique/presidentielle-2027-bruno-retailleau-veut-renverser-la-table-avec-une-profonde-reforme-constitutionnelle' },
      { texte: 'Le Club des juristes : Bruno Retailleau veut « toucher » à l\'aide médicale d\'État', url: 'https://www.leclubdesjuristes.com/en-bref/bruno-retailleau-veut-toucher-a-laide-medicale-detat-8859/' },
      { texte: 'Journal de l\'Agence : ses propositions sur le logement', url: 'https://www.journaldelagence.com/1411841-presidentielle-2027-les-propositions-de-bruno-retailleau-pour-relancer-le-logement' },
    ],
  },
  {
    id: 'lisnard',
    nom: 'David Lisnard',
    mouvement: 'Nouvelle Énergie',
    couleur: '#00897b',
    statut: 'Maire de Cannes, élu président de l\'Association des maires de France en 2021 ; candidat déclaré en 2026.',
    resume: 'Libéralisme assumé : baisse massive de la dépense publique, rendue en baisses de cotisations et d\'impôts de production, décentralisation et débureaucratisation.',
    mesures: [
      { reforme: 'choc_depenses', option: 'quinquennat', texte: '80 Md€ d\'économies la première année, 200 Md€ sur le quinquennat', statut: 'annonce' },
      { reforme: 'cvae', option: 'supprimer', texte: 'Baisser les impôts de production (suppression de la CVAE et de la C3S)', statut: 'a_verifier' },
      { reforme: 'decentralisation', option: 'un_niveau', texte: 'Décentraliser et débureaucratiser', statut: 'a_verifier' },
      { reforme: 'retraites_age', option: 'age_65', texte: 'Retraite à 65 ans', statut: 'a_verifier' },
      { reforme: 'capi_pilier', option: '1_1', texte: 'Compléter les retraites par de la capitalisation', statut: 'a_verifier' },
    ],
    sources: [
      { texte: 'Europe 1 : « on dépouille les actifs au profit des inactifs »', url: 'https://www.europe1.fr/politique/aujourdhui-en-france-on-depouille-les-actifs-au-profit-des-inactifs-denonce-david-lisnard-938960' },
      { texte: 'France-Vote : le programme de David Lisnard', url: 'https://www.france-vote.fr/actualites/programme-david-lisnard-2027' },
    ],
  },
  {
    id: 'glucksmann',
    nom: 'Raphaël Glucksmann',
    mouvement: 'Place publique',
    couleur: '#e91e63',
    statut: 'Député européen, candidat pressenti de la gauche sociale-démocrate. Programme peu détaillé à ce stade.',
    resume: 'Justice fiscale par la taxation des très grandes fortunes, Europe et transition écologique. Ses positions sur les retraites varient selon les sources : le jeu ne retient que la taxe sur les très hauts patrimoines.',
    mesures: [
      { reforme: 'taxe_hauts_patrimoines', option: 'oui', texte: 'Impôt plancher de 2 % sur les patrimoines de plus de 100 M€ (inspiré de la taxe Zucman)', statut: 'annonce' },
    ],
    sources: [
      { texte: 'ÉlyséeScope : Raphaël Glucksmann et la taxe Zucman', url: 'https://www.elyseescope.com/le-radar/raphael-glucksmann-taxe-zucman' },
      { texte: 'MonVote2027 : positions de Raphaël Glucksmann', url: 'https://monvote2027.fr/candidat/glucksmann' },
    ],
  },
  {
    id: 'philippe',
    nom: 'Édouard Philippe',
    mouvement: 'Horizons',
    couleur: '#29b6f6',
    statut: 'Ancien Premier ministre (2017-2020), maire du Havre ; candidat déclaré depuis septembre 2024. Programme écrit complet non publié (novembre 2026) : les sources divergent sur plusieurs chiffres.',
    resume: 'Redresser les comptes par la baisse des dépenses plutôt que par l\'impôt, introduire de la capitalisation dans les retraites et trancher par référendum (règle d\'or budgétaire notamment).',
    mesures: [
      { reforme: 'regle_or', option: 'oui', texte: 'Inscrire une « règle d\'or » budgétaire dans la Constitution, par référendum', statut: 'annonce' },
      { reforme: 'capi_pilier', option: '1_1', texte: 'Ajouter une part de capitalisation aux retraites par répartition', statut: 'annonce' },
      { reforme: 'agences_operateurs', option: 'fusion_poles', texte: 'Fusionner des agences et réduire le train de vie de l\'État pour repasser sous 3 % de déficit', statut: 'a_verifier' },
      { reforme: 'retraites_age', option: 'age_65', texte: 'Reculer l\'âge de départ (65 ans selon certaines sources, non confirmé par le candidat)', statut: 'a_verifier' },
    ],
    sources: [
      { texte: 'ÉlyséeScope : Édouard Philippe, programme et ambitions pour 2027', url: 'https://www.elyseescope.com/le-radar/edouard-philippe-programme-presidentielle-2027' },
      { texte: 'Parlons politique : retraites, immigration, déficit, ce que changerait le projet d\'Édouard Philippe', url: 'https://www.parlons-politique.fr/elections/presidentielle-2027-retraites-immigration-deficit-ce-que-le-projet-dedouard-philippe-changerait-pour-les-francais_25969/' },
      { texte: 'MonVote2027 : positions d\'Édouard Philippe', url: 'https://monvote2027.fr/candidat/philippe' },
    ],
  },
  {
    id: 'attal',
    nom: 'Gabriel Attal',
    mouvement: 'Renaissance',
    couleur: '#f2b630',
    statut: 'Ancien Premier ministre (2024), secrétaire général de Renaissance ; candidat déclaré. Programme en construction (site « La force d\'agir »).',
    resume: 'Aucune hausse d\'impôts pendant cinq ans, retraites refondées (capitalisation, fin d\'un âge légal unique), Code du travail réécrit et formation de tous les salariés à l\'intelligence artificielle.',
    mesures: [
      { reforme: 'capi_pilier', option: '1_1', texte: 'Une part de capitalisation dans les retraites, fléchée vers l\'innovation', statut: 'programme' },
      { reforme: 'retraite_points', option: 'oui', texte: 'Supprimer l\'âge légal au profit de décotes et de surcotes (proche d\'un système par points)', statut: 'annonce' },
      { reforme: 'simplification', option: 'oui', texte: 'Réduire le Code du travail à une « constitution du travail », le reste relevant du dialogue social', statut: 'annonce' },
      { reforme: 'cvae', option: 'supprimer', texte: 'Baisser les impôts de production ; aucune hausse d\'impôts pendant cinq ans', statut: 'a_verifier' },
    ],
    sources: [
      { texte: 'Site de campagne : « Mes chantiers capitaux »', url: 'https://attalpresident.fr/programme' },
      { texte: 'Planet : retraites, Gabriel Attal veut « renverser la table » en 2027 (entretien au Figaro, mai 2026)', url: 'https://www.planet.fr/politique-retraites-gabriel-attal-veut-renverser-la-table-en-2027.2996634.29334.html' },
      { texte: 'MonVote2027 : positions de Gabriel Attal', url: 'https://monvote2027.fr/candidat/attal' },
    ],
  },
  {
    id: 'roussel',
    nom: 'Fabien Roussel',
    mouvement: 'Parti communiste français',
    couleur: '#b71c1c',
    statut: 'Secrétaire national du PCF ; désigné candidat par 72 % des militants, candidature annoncée le 6 septembre 2026.',
    resume: 'Pouvoir d\'achat et réindustrialisation, électricité nucléaire et renouvelable publique, impôt sur la fortune renforcé, taxation des superprofits, VIe République à la proportionnelle.',
    mesures: [
      { reforme: 'nucleaire_epr2', option: 'quatorze', texte: 'Doubler la production d\'électricité nucléaire, renouvelable et hydraulique, autour d\'un nucléaire public', statut: 'annonce' },
      { reforme: 'retraites_age', option: 'age_60', texte: 'Retraite à 60 ans à taux plein', statut: 'a_verifier' },
      { reforme: 'ifi', option: 'isf', texte: 'Rétablir et renforcer l\'impôt sur la fortune', statut: 'a_verifier' },
      { reforme: 'taxe_superprofits', option: 'oui', texte: 'Taxer les superprofits', statut: 'a_verifier' },
      { reforme: 'proportionnelle', option: 'integrale', texte: 'VIe République et scrutin proportionnel', statut: 'a_verifier' },
    ],
    sources: [
      { texte: 'France 24 : Fabien Roussel officialise sa candidature (6 septembre 2026)', url: 'https://www.france24.com/fr/france/20260906-pr%C3%A9sidentielle-2027-fabien-roussel-officialise-sa-candidature-avec-le-pcf' },
      { texte: 'PCF : Fabien Roussel désigné candidat à 72 % par les communistes', url: 'https://www.pcf.fr/presidentielle2027_fabien_roussel_designe_candidat' },
      { texte: 'France-Vote : programme et positions de Fabien Roussel', url: 'https://www.france-vote.fr/candidats/fabien-roussel' },
    ],
  },
  {
    id: 'tondelier',
    nom: 'Marine Tondelier',
    mouvement: 'Les Écologistes',
    couleur: '#43a047',
    statut: 'Secrétaire nationale des Écologistes ; candidature validée par son parti. Les sources divergent sur son maintien après l\'abandon de la primaire de la gauche.',
    resume: 'Justice fiscale et climatique (taxe sur les ultra-riches, ISF climatique), retour à 62 ans, hausse du SMIC, sortie progressive du nucléaire et fiscalité écologique.',
    mesures: [
      { reforme: 'taxe_hauts_patrimoines', option: 'oui', texte: 'Taxe de 2 % sur les patrimoines de plus de 100 M€ (inspirée de la taxe Zucman)', statut: 'annonce' },
      { reforme: 'ifi', option: 'isf', texte: 'Rétablir l\'ISF avec un volet climatique', statut: 'annonce' },
      { reforme: 'retraites_age', option: 'abrogation_62', texte: 'Revenir à la retraite à 62 ans', statut: 'a_verifier' },
      { reforme: 'smic_hausse', option: 'coup_de_pouce', texte: 'Augmenter le SMIC (montant variable selon les sources)', statut: 'a_verifier' },
      { reforme: 'nucleaire_epr2', option: 'renoncer', texte: 'Sortie progressive du nucléaire, priorité aux renouvelables', statut: 'a_verifier' },
      { reforme: 'taxe_carbone', option: 'cheque', texte: 'Fiscalité climatique (billets d\'avion, fonds social pour le climat)', statut: 'a_verifier' },
    ],
    sources: [
      { texte: 'France-Vote : le programme de Marine Tondelier et des Écologistes', url: 'https://www.france-vote.fr/actualites/programme-marine-tondelier-2027' },
      { texte: 'Parlons politique : ce que le programme écologiste changerait pour les retraites, le nucléaire et les impôts', url: 'https://www.parlons-politique.fr/elections/ce-que-le-programme-ecologiste-de-marine-tondelier-changerait-pour-les-retraites-le-nucleaire-et-les-impots_23570/' },
      { texte: 'MonVote2027 : positions de Marine Tondelier', url: 'https://monvote2027.fr/candidat/tondelier' },
    ],
  },
  {
    id: 'zemmour',
    nom: 'Éric Zemmour',
    mouvement: 'Reconquête',
    couleur: '#0d47a1',
    statut: 'Président de Reconquête ; a annoncé sa candidature en septembre 2026. Le programme 2027 n\'est pas publié : le jeu reprend surtout des mesures de son programme de 2022.',
    resume: 'Immigration et identité au cœur du projet, baisse des dépenses, des charges et des impôts de production, relance du nucléaire.',
    mesures: [
      { reforme: 'ame', option: 'urgence', texte: 'Supprimer l\'AME (programme de 2022)', statut: 'a_verifier' },
      { reforme: 'priorite_nationale', option: 'referendum', texte: 'Référendum sur l\'immigration et priorité nationale (programme de 2022)', statut: 'a_verifier' },
      { reforme: 'cvae', option: 'supprimer', texte: 'Baisser les impôts de production (30 Md€ dans le programme de 2022)', statut: 'a_verifier' },
      { reforme: 'retraites_age', option: 'acceleration_64', texte: 'Relever l\'âge de départ (64 ans dans le programme de 2022)', statut: 'a_verifier' },
      { reforme: 'nucleaire_epr2', option: 'quatorze', texte: 'Construire 14 réacteurs nucléaires (programme de 2022)', statut: 'a_verifier' },
      { reforme: 'peines_planchers', option: 'retablir', texte: 'Rétablir les peines planchers', statut: 'a_verifier' },
    ],
    sources: [
      { texte: 'Public Sénat : Éric Zemmour annonce sa candidature à la présidentielle 2027', url: 'https://www.publicsenat.fr/actualites/politique/eric-zemmour-officialise-sa-candidature-a-la-presidentielle-2027' },
      { texte: 'Europe 1 : immigration, pouvoir d\'achat, narcotrafic, l\'interview d\'Éric Zemmour', url: 'https://www.europe1.fr/politique/en-direct-immigration-pouvoir-dachat-narcotrafic-ce-quil-faut-retenir-de-linterview-deric-zemmour-dans-la-france-en-face-936419' },
    ],
  },
  {
    id: 'ruffin',
    nom: 'François Ruffin',
    mouvement: 'Debout !',
    couleur: '#ef6c00',
    statut: 'Député de la Somme, candidat sous la bannière de son mouvement Debout ! (lancé en 2025) ; a renoncé en septembre 2026 à la primaire de la gauche.',
    resume: 'Une « gauche du travail » : salaires, retraite à 60 ans, services publics dans les territoires et réindustrialisation, financées par les plus hauts revenus.',
    mesures: [
      { reforme: 'smic_hausse', option: 'mille_six_cents', texte: 'SMIC à 1 700 € net (le jeu retient l\'option la plus proche, 1 600 €)', statut: 'annonce' },
      { reforme: 'retraites_age', option: 'age_60', texte: 'Retraite à 60 ans', statut: 'a_verifier' },
      { reforme: 'retraites_minimum', option: 'oui', texte: 'Pension minimale de 1 200 €', statut: 'a_verifier' },
      { reforme: 'cdhr', option: 'renforcer', texte: 'Faire contribuer davantage les plus hauts revenus', statut: 'a_verifier' },
    ],
    sources: [
      { texte: 'Slate : comment François Ruffin s\'est retrouvé marginalisé à gauche', url: 'https://www.slate.fr/politique/election-presidentielle-2027-comment-francois-ruffin-retrouve-marginalise-gauche-lfi-france-insoumise-melenchon-candidat' },
      { texte: 'ÉlyséeScope : François Ruffin et le SMIC à 1 700 € net', url: 'https://www.elyseescope.com/questions/francois-ruffin-propose-un-smic-rehausse-a-1700-euros-nets' },
      { texte: 'ÉlyséeScope : son plan pour la retraite à 60 ans', url: 'https://www.elyseescope.com/questions/francois-ruffin-son-plan-pour-la-retraite-a-60-ans-en-2027' },
    ],
  },
];

export const STATUTS_MESURE = {
  programme: 'programme publié',
  annonce: 'proposition publique',
  a_verifier: 'à vérifier',
};
