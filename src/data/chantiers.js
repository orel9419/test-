/**
 * Chantiers et partenaires des grands événements accueillis par le pays :
 * Jeux d'hiver 2030, Coupe du monde 2038 (scénario de jeu) et sommet du G7.
 *
 * Dans la réalité, ce sont les acheteurs publics (comité d'organisation,
 * établissement chargé des ouvrages, préfecture) qui attribuent les marchés
 * après une mise en concurrence (Code de la commande publique) ; l'État fixe
 * le cahier des charges et finance une partie des équipements. Ici, le joueur
 * retient l'offre de chaque lot parmi celles reçues.
 *
 * `montant` : part publique du lot (milliards, hypothèse de jeu) ; pour chaque
 * offre, `prix` (multiplicateur), `qualite` (0 à 1), `retard` (risque de
 * retard ou de surcoût), `local` (part des emplois dans la région).
 */

const etranger = (nom, prix, qualite, retard, argument) => ({ entreprise: null, nom, prix, qualite, retard, local: 0.3, argument });

const LOTS_SECURITE = (montant) => ({
  id: 'securite', nom: 'Sécurité, vidéoprotection et cybersécurité', poste: 'interieurJustice', montant, offres: [
    { entreprise: 'thales', prix: 1.1, qualite: 0.9, retard: 0.08, local: 0.7, argument: 'Spécialiste des systèmes de sécurité et de la cyberdéfense, partenaire historique de l\'État.' },
    { entreprise: 'orange', prix: 0.98, qualite: 0.82, retard: 0.1, local: 0.75, argument: 'Réseaux et cybersécurité (Orange Cyberdefense) ; partenaire premium de Paris 2024.' },
    { entreprise: 'capgemini', prix: 0.95, qualite: 0.8, retard: 0.12, local: 0.7, argument: 'Intégration de systèmes et cybersécurité.' },
    etranger('Éditeur étranger de vidéoprotection', 0.8, 0.68, 0.18, 'Moins cher, mais données hébergées hors de l\'Union européenne : risque pour la souveraineté.'),
  ],
});
const LOTS_ACCUEIL = (montant) => ({
  id: 'accueil', nom: 'Hébergement et restauration', poste: 'culture', montant, offres: [
    { entreprise: 'accor', prix: 1.0, qualite: 0.85, retard: 0.06, local: 0.75, argument: 'Premier groupe hôtelier européen ; partenaire premium de Paris 2024.' },
    { entreprise: 'sodexo', prix: 0.95, qualite: 0.85, retard: 0.08, local: 0.75, argument: 'Restauration de masse ; Sodexo Live! a nourri le village olympique de Paris 2024.' },
    { entreprise: null, nom: 'Groupement de PME régionales', prix: 0.9, qualite: 0.7, retard: 0.16, local: 1, argument: 'Retombées locales maximales, capacité plus limitée.' },
  ],
});
const LOTS_NUMERIQUE = (montant) => ({
  id: 'numerique', nom: 'Billetterie, résultats et réseaux', poste: 'culture', montant, offres: [
    { entreprise: 'orange', prix: 1.0, qualite: 0.85, retard: 0.08, local: 0.7, argument: 'Opérateur des réseaux de Paris 2024.' },
    { entreprise: 'capgemini', prix: 0.95, qualite: 0.8, retard: 0.1, local: 0.65, argument: 'Logiciels et intégration.' },
    etranger('Géant américain du numérique', 0.85, 0.82, 0.08, 'Efficace et moins cher, mais dépendance et données hors d\'Europe.'),
  ],
});

export const CHANTIERS = [
  {
    id: 'jo2030', pays: 'france', evenement: 'jo2030', icone: '⛷️', nom: 'Jeux d\'hiver 2030 (Alpes françaises)',
    dateLimite: { annee: 2029, t: 3 }, jourJ: { annee: 2030, t: 1 },
    description: 'Peu de constructions nouvelles (les stations existent), mais un village, des patinoires, l\'énergie et la sécurité à organiser en montagne.',
    lots: [
      { id: 'sites', nom: 'Sites et village des athlètes', poste: 'transports', montant: 0.5, offres: [
        { entreprise: 'vinci', prix: 1.0, qualite: 0.85, retard: 0.1, local: 0.8, argument: 'Premier groupe de BTP français, habitué des chantiers complexes.' },
        { entreprise: 'bouygues', prix: 0.97, qualite: 0.82, retard: 0.12, local: 0.8, argument: 'A construit le centre aquatique olympique de Paris 2024.' },
        { entreprise: 'eiffage', prix: 0.92, qualite: 0.78, retard: 0.14, local: 0.85, argument: 'Très implanté en Auvergne-Rhône-Alpes.' },
        etranger('Groupement européen (offre la moins chère)', 0.85, 0.65, 0.25, 'Prix bas, mais sous-traitance lointaine et risque de retard.'),
      ] },
      { id: 'energie', nom: 'Énergie, neige de culture et mobilité décarbonée', poste: 'ecologieEnergie', montant: 0.1, offres: [
        { entreprise: 'edf', prix: 1.0, qualite: 0.85, retard: 0.08, local: 0.8, argument: 'Électricité bas carbone ; partenaire premium de Paris 2024.' },
        { entreprise: 'engie', prix: 0.95, qualite: 0.8, retard: 0.1, local: 0.75, argument: 'Réseaux de chaleur et solutions locales.' },
        { entreprise: 'totalenergies', prix: 0.92, qualite: 0.75, retard: 0.1, local: 0.6, argument: 'Moins cher, mais image climatique discutée pour des Jeux « sobres ».' },
      ] },
      LOTS_SECURITE(0.15),
      LOTS_ACCUEIL(0.08),
      LOTS_NUMERIQUE(0.07),
    ],
  },
  {
    id: 'cdm2038', pays: 'france', evenement: 'cdm2038', icone: '⚽', nom: 'Coupe du monde de football 2038 (scénario de jeu)',
    condition: (e) => e.grandsEvenements?.cdm2038?.attribuee === true,
    dateLimite: { annee: 2036, t: 4 }, jourJ: { annee: 2038, t: 3 },
    description: '48 équipes et environ 100 matchs : il faut une quinzaine de grands stades. La France en a déjà beaucoup (Coupe du monde 1998, Euro 2016) : surtout des rénovations.',
    lots: [
      { id: 'stades', nom: 'Rénovation et extension des stades', poste: 'culture', montant: 1.2, offres: [
        { entreprise: 'vinci', prix: 1.0, qualite: 0.85, retard: 0.1, local: 0.75, argument: 'A construit et exploite de grands stades.' },
        { entreprise: 'bouygues', prix: 0.97, qualite: 0.83, retard: 0.12, local: 0.75, argument: 'Grandes enceintes sportives et chantiers olympiques.' },
        { entreprise: 'eiffage', prix: 0.93, qualite: 0.8, retard: 0.13, local: 0.8, argument: 'Prix serré, solide réseau régional.' },
        etranger('Groupement international', 0.85, 0.7, 0.22, 'Le moins cher, mais retards fréquents sur ce type de chantier.'),
      ] },
      { id: 'transports', nom: 'Transports des supporters et énergie des stades', poste: 'transports', montant: 0.4, offres: [
        { entreprise: 'veolia', prix: 1.0, qualite: 0.8, retard: 0.1, local: 0.75, argument: 'Transports urbains, eau et déchets des sites.' },
        { entreprise: 'edf', prix: 1.02, qualite: 0.82, retard: 0.1, local: 0.75, argument: 'Électrification et sobriété énergétique des stades.' },
        { entreprise: 'engie', prix: 0.96, qualite: 0.78, retard: 0.12, local: 0.7, argument: 'Solutions énergétiques locales.' },
      ] },
      LOTS_SECURITE(0.3),
      LOTS_ACCUEIL(0.1),
      LOTS_NUMERIQUE(0.1),
    ],
  },
  {
    id: 'g7_2033', pays: 'france', evenement: null, icone: '🤝', nom: 'Sommet du G7 2033 (présidence française)',
    dateLimite: { annee: 2033, t: 1 }, jourJ: { annee: 2033, t: 2 },
    description: 'La France préside à nouveau le G7 en 2033 (rotation) : sécurité des délégations, centre de presse, hébergement.',
    lots: [LOTS_SECURITE(0.05), LOTS_ACCUEIL(0.02), LOTS_NUMERIQUE(0.01)],
  },
];
