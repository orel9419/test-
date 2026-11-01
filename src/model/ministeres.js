/**
 * Catalogue des postes budgétaires (« ministères ») communs à tous les pays.
 *
 * Le joueur pilote la dépense de TOUTES les administrations publiques (État,
 * Sécurité sociale, collectivités / Länder), regroupée en grands postes
 * proches des ministères. Les montants de départ sont fixés par chaque profil
 * pays (à partir de la classification COFOG) ; ce fichier décrit seulement la
 * nature économique de chaque poste.
 *
 * - composition : part du poste en personnel, fonctionnement, investissement,
 *   transferts (aux ménages, entreprises, collectivités). Elle détermine le
 *   multiplicateur budgétaire et la vitesse d'ajustement possible (inertie).
 * - groupes : sensibilité de chaque groupe social à ce poste (0 à 1).
 * - stock : capital de long terme alimenté par le poste (effets différés).
 * - pilotage : 'curseur' (le joueur fixe une cible) ou 'regles' (le montant
 *   découle de règles, modifiables seulement par des réformes : retraites).
 */
export const MINISTERES = {
  retraites: {
    nom: 'Retraites',
    pilotage: 'regles',
    composition: { transferts: 1 },
    groupes: { retraites: 1, salaries: 0.2 },
    description: 'Pensions de base et complémentaires. Le montant dépend du nombre de retraités, de l\'âge de départ et de l\'indexation des pensions : on ne le change qu\'en réformant les règles.',
  },
  protectionSociale: {
    nom: 'Solidarités, famille et handicap',
    pilotage: 'curseur',
    composition: { transferts: 0.9, personnel: 0.05, fonctionnement: 0.05 },
    groupes: { jeunes: 0.4, salaries: 0.4, retraites: 0.2, fonctionnaires: 0.1 },
    description: 'Prestations familiales, minima sociaux, handicap, dépendance, indemnités maladie hors soins.',
  },
  travailEmploi: {
    nom: 'Travail, emploi et assurance chômage',
    pilotage: 'curseur',
    composition: { transferts: 0.85, fonctionnement: 0.1, personnel: 0.05 },
    groupes: { jeunes: 0.5, salaries: 0.5 },
    partCyclique: 0.6,
    description: 'Allocations chômage (qui montent automatiquement avec le chômage), politiques de l\'emploi, formation professionnelle, apprentissage.',
  },
  sante: {
    nom: 'Santé',
    pilotage: 'curseur',
    composition: { transferts: 0.55, personnel: 0.35, fonctionnement: 0.07, investissement: 0.03 },
    groupes: { retraites: 0.8, salaries: 0.4, jeunes: 0.2, fonctionnaires: 0.4 },
    description: 'Assurance maladie (soins de ville, médicaments), hôpitaux publics, prévention.',
  },
  education: {
    nom: 'Éducation',
    pilotage: 'curseur',
    composition: { personnel: 0.8, fonctionnement: 0.12, investissement: 0.08 },
    groupes: { jeunes: 0.6, salaries: 0.4, fonctionnaires: 0.6 },
    stock: 'capitalHumain',
    description: 'Écoles, collèges, lycées. Effet de long terme sur le capital humain (3 à 10 ans).',
  },
  recherche: {
    nom: 'Recherche et enseignement supérieur',
    pilotage: 'curseur',
    composition: { personnel: 0.55, fonctionnement: 0.2, investissement: 0.25 },
    groupes: { jeunes: 0.5, entrepreneurs: 0.2, fonctionnaires: 0.2 },
    stock: 'recherche',
    description: 'Universités, organismes de recherche, aides à l\'innovation. Effet sur la croissance potentielle après 2 à 5 ans.',
  },
  defense: {
    nom: 'Défense',
    pilotage: 'curseur',
    composition: { personnel: 0.35, fonctionnement: 0.2, investissement: 0.45 },
    groupes: { retraites: 0.2, entrepreneurs: 0.1 },
    facteurMultiplicateur: 0.7,
    description: 'Armées, équipements, dissuasion, aide militaire. Une partie des équipements est importée, d\'où un multiplicateur plus faible.',
  },
  affairesEtrangeres: {
    nom: 'Affaires étrangères et aide au développement',
    pilotage: 'curseur',
    composition: { transferts: 0.6, personnel: 0.25, fonctionnement: 0.15 },
    groupes: {},
    facteurMultiplicateur: 0.3,
    description: 'Réseau diplomatique, aide publique au développement, contributions internationales. Renforce l\'influence internationale.',
  },
  interieurJustice: {
    nom: 'Intérieur et justice',
    pilotage: 'curseur',
    composition: { personnel: 0.7, fonctionnement: 0.2, investissement: 0.1 },
    groupes: { retraites: 0.4, salaries: 0.2, fonctionnaires: 0.3 },
    description: 'Police, gendarmerie, sécurité civile, justice, prisons.',
  },
  ecologieEnergie: {
    nom: 'Transition écologique et énergie',
    pilotage: 'curseur',
    composition: { transferts: 0.5, investissement: 0.45, fonctionnement: 0.05 },
    groupes: { jeunes: 0.6, salaries: 0.1, agriculteurs: 0.1 },
    stock: 'vert',
    description: 'Rénovation énergétique, énergies renouvelables et nucléaire, biodiversité, eau. Réduit les émissions et la dépendance énergétique après 1 à 5 ans.',
  },
  transports: {
    nom: 'Transports',
    pilotage: 'curseur',
    composition: { investissement: 0.45, transferts: 0.35, fonctionnement: 0.2 },
    groupes: { salaries: 0.3, entrepreneurs: 0.2, jeunes: 0.2 },
    stock: 'infrastructures',
    description: 'Routes, rail, transports en commun.',
  },
  agriculture: {
    nom: 'Agriculture et alimentation',
    pilotage: 'curseur',
    composition: { transferts: 0.85, fonctionnement: 0.15 },
    groupes: { agriculteurs: 1 },
    description: 'Aides nationales à l\'agriculture (en plus de la PAC), sécurité sanitaire des aliments.',
  },
  logement: {
    nom: 'Logement et territoires',
    pilotage: 'curseur',
    composition: { transferts: 0.7, investissement: 0.3 },
    groupes: { jeunes: 0.6, salaries: 0.3 },
    description: 'Aides au logement, logement social, politique de la ville.',
  },
  culture: {
    nom: 'Culture, sport et médias',
    pilotage: 'curseur',
    composition: { personnel: 0.4, transferts: 0.4, investissement: 0.2 },
    groupes: { jeunes: 0.2, retraites: 0.1 },
    description: 'Patrimoine, création, audiovisuel public, sport.',
  },
  economieFinances: {
    nom: 'Économie, finances et administration générale',
    pilotage: 'curseur',
    composition: { personnel: 0.35, transferts: 0.45, fonctionnement: 0.2 },
    groupes: { entrepreneurs: 0.5, fonctionnaires: 0.4 },
    description: 'Administration générale, impôts et douanes, dotations aux collectivités, aides aux entreprises. Hors charge de la dette, comptée à part.',
  },
};

/** Groupes sociaux suivis par le jeu. */
export const GROUPES = {
  jeunes: { nom: 'Jeunes (18-29 ans)' },
  salaries: { nom: 'Salariés du privé' },
  fonctionnaires: { nom: 'Fonctionnaires' },
  entrepreneurs: { nom: 'Entrepreneurs et indépendants' },
  agriculteurs: { nom: 'Agriculteurs' },
  retraites: { nom: 'Retraités' },
};
