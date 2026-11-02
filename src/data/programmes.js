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
    statut: 'Candidat déclaré ; programme « L\'Avenir en commun » (édition 2025, 831 mesures)',
    resume: 'Rupture sociale et institutionnelle : retraite à 60 ans, hausse du SMIC, blocage des prix, fiscalité plus progressive, VIe République.',
    mesures: [
      { reforme: 'retraites_age', option: 'age_60', texte: 'Abroger la réforme de 2023 et revenir à 60 ans avec 40 annuités', statut: 'programme' },
      { reforme: 'smic_hausse', option: 'mille_six_cents', texte: 'SMIC à 1 600 € net (la campagne évoque désormais 1 700 €)', statut: 'programme' },
      { reforme: 'blocage_prix', option: 'blocage', texte: 'Bloquer les prix des produits de première nécessité', statut: 'programme' },
      { reforme: 'ir_progressif', option: 'quatorze', texte: 'Impôt sur le revenu à 14 tranches', statut: 'programme' },
      { reforme: 'ifi', option: 'isf', texte: 'Rétablir l\'ISF avec un volet climatique', statut: 'programme' },
      { reforme: 'rsa_jeunes', option: 'sous_condition', texte: 'Allocation d\'autonomie pour les jeunes', statut: 'a_verifier' },
      { reforme: 'autoroutes', option: 'racheter', texte: 'Renationaliser les autoroutes', statut: 'a_verifier' },
      { reforme: 'constituante', option: 'convoquer', texte: 'Convoquer une Assemblée constituante pour une VIe République', statut: 'programme' },
    ],
    sources: [
      { texte: 'Site de campagne : construction du programme', url: 'https://melenchon2027.fr/construction-programme/' },
      { texte: 'France-Vote : le programme de Jean-Luc Mélenchon pour 2027', url: 'https://www.france-vote.fr/actualites/programme-melenchon-lfi-2027' },
      { texte: 'ÉlyséeScope : SMIC à 1 600 €', url: 'https://www.elyseescope.com/le-radar/melenchon-propose-de-porter-le-smic-a-1600-euros-pour-2027' },
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
];

export const STATUTS_MESURE = {
  programme: 'programme publié',
  annonce: 'proposition publique',
  a_verifier: 'à vérifier',
};
