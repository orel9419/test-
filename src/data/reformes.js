/**
 * Catalogue des réformes structurelles.
 *
 * Une réforme modifie les règles d'un sous-modèle (âge légal, indexation,
 * durée du travail...) ou produit des effets budgétaires directs. Elle
 * provoque aussi des réactions : chocs de popularité immédiats, opinions
 * durables, griefs (mécontentement non monétaire que des compensations
 * peuvent réduire), effet sur la crédibilité auprès des marchés.
 *
 * Interface d'une réforme :
 *   id, nom, categorie, pays ('tous' ou liste), resume, pedagogie, sources
 *   options [{ id, nom, description }]
 *   delai          trimestres entre l'adoption et l'application (vote, décrets)
 *   appliquer(e, o)  modifie les sous-modèles au moment de l'application
 *   annuler(e, o)    rétablit l'état antérieur si la réforme est abrogée
 *   effets(e, o, age) effets continus : { depenses: {poste: Md€/an}, recettes: {impot|'fixe': Md€/an},
 *                    offreTravail %, chomageStructurel pt, potentielBonus pt/an, chocPrix %,
 *                    plafonnementEnergie (0-1), menages: { id: [{ montant, texte }] }, cessions Md€ }
 *   reaction(e, o)   { chocs, opinion, grief, compensation, credibilite, instabilite }
 *   axes           positions politiques (−1 à 1) : social, fiscal, retraites, travail, ecologie, europe, marche
 *   chiffrage      texte d'ordre de grandeur, avec sources quand elles existent
 *
 * Les montants non sourcés sont des hypothèses de jeu, signalées comme telles.
 */

import { REFORMES_FRANCE } from './reformesFrance.js';
import { REFORMES_LIBERALES, REFORMES_SOCIALES } from './reformesOrientations.js';
import { REFORMES_CONCRETES } from './reformesConcretes.js';
import { REFORMES_PROGRAMMES } from './reformesProgrammes.js';

const rampe = (age, n) => Math.min(1, Math.max(0, (age + 1) / n));
const indicePrix = (e) => e.macro.niveauPrix / 100;

/** Masse salariale publique estimée : part « personnel » de chaque poste (Md€/an). */
function masseSalarialePublique(e) {
  // Composition reprise du catalogue des ministères (import paresseux pour éviter un cycle)
  const comp = compositionPersonnel(e);
  let total = 0;
  for (const [id, l] of Object.entries(e.budget)) total += l.montant * (comp[id] ?? 0);
  return total;
}
/**
 * Budget fédéral américain : Medicare, Medicaid et l'éducation sont surtout des
 * transferts ; le personnel civil fédéral pèse environ 300 Md$ (estimation).
 */
const COMPOSITION_PERSONNEL_ETATS_UNIS = { defense: 0.2, interieurJustice: 0.3, affairesEtrangeres: 0.15, recherche: 0.15, economieFinances: 0.3, sante: 0.02, education: 0.02, protectionSociale: 0.03, culture: 0.4 };
const compositionPersonnel = (e) => (e.pays === 'etatsUnis' ? COMPOSITION_PERSONNEL_ETATS_UNIS : COMPOSITION_PERSONNEL);
/** Montant d'hypothèse selon le pays (Md€ ou Md$ par an). */
const parPays = (e, valeurs) => valeurs[e.pays] ?? valeurs.defaut ?? 0;
const COMPOSITION_PERSONNEL = { sante: 0.35, education: 0.8, recherche: 0.55, defense: 0.35, affairesEtrangeres: 0.25, interieurJustice: 0.7, culture: 0.4, economieFinances: 0.35, protectionSociale: 0.05, travailEmploi: 0.05 };
const COMPOSITION_TRANSFERTS = { protectionSociale: 0.9, travailEmploi: 0.85, logement: 0.7 };

const REFORMES_COMMUNES = [
  // ======================================================================
  // RETRAITES (France)
  // ======================================================================
  {
    id: 'retraites_age',
    nom: 'Âge légal de départ à la retraite',
    categorie: 'retraites',
    pays: ['france'],
    resume: 'Le levier le plus puissant sur la dépense de retraite, et le plus conflictuel.',
    pedagogie: 'Les retraites représentent 422 Md€ en 2025, soit 14,1 % du PIB et près d\'un quart des dépenses publiques (COR). Il y a 2,5 personnes d\'âge actif pour une personne de 65 ans et plus, et ce ratio tomberait à 1,6 en 2070. Reculer l\'âge réduit le nombre de retraités et augmente le nombre d\'actifs, mais une partie des seniors maintenus ne sont pas en emploi et touchent d\'autres prestations. La réforme de 2023 (64 ans) est suspendue jusqu\'au 01/01/2028 par la LFSS 2026 ; sans nouvelle décision, le relèvement reprend en 2028. Aller jusqu\'à 68 ans : l\'âge du taux plein automatique est déjà de 67 ans en France, et plusieurs pays européens lient l\'âge à l\'espérance de vie (Danemark : 68 ans en 2030, 70 ans en 2040, loi votée en mai 2025). Mais l\'espérance de vie sans incapacité à 65 ans reste d\'environ 10 à 12 ans, et les écarts entre ouvriers et cadres sont importants : sans compensation (pénibilité, carrières longues), le rejet est massif.',
    sources: [
      { texte: 'COR, rapport annuel 2026', url: 'https://www.cor-retraites.fr/sites/default/files/2026-06/RA_2026_def.pdf' },
      { texte: 'Coût de la suspension (franceinfo)', url: 'https://www.franceinfo.fr/economie/retraite/reforme-des-retraites/la-suspension-de-la-reforme-des-retraites-coutera-1-4-milliard-d-euros-en-2027-les-complementaires-sante-et-les-retraites-mis-a-contribution_7570171.html' },
      { texte: 'Danemark : retraite à 70 ans en 2040 (The Local, mai 2025)', url: 'https://www.thelocal.dk/20250522/denmark-formally-raises-retirement-age-to-70-in-2040' },
    ],
    options: [
      { id: 'abrogation_62', nom: 'Abroger la réforme : retour à 62 ans', description: 'Demande de la gauche et, en partie, du RN. Coût élevé et durable.' },
      { id: 'suspension', nom: 'Prolonger la suspension (62 ans et 9 mois)', description: 'Geler l\'âge au niveau actuel au-delà de 2028.' },
      { id: 'acceleration_64', nom: 'Lever la suspension dès 2027 et accélérer : 64 ans en 2029', description: 'Lever la suspension un an plus tôt que prévu, au rythme de 6 mois par an.' },
      { id: 'age_65', nom: 'Aller vers 65 ans (6 mois par an, 65 ans en 2031)', description: 'Position de la droite (LR) et d\'une partie du centre.' },
      { id: 'age_68', nom: 'Aller vers 68 ans (6 mois par an, 68 ans vers 2037)', description: 'Rupture forte : l\'âge légal rejoindrait l\'âge actuel du taux plein automatique (67 ans) puis le dépasserait. Le Danemark vise 68 ans en 2030 et 70 ans en 2040. Jusqu\'en 2031, l\'effet budgétaire est le même qu\'avec 65 ans : la différence vient après, mais les marchés la prennent en compte dès le vote.' },
      { id: 'age_68_rapide', nom: 'Aller vite vers 68 ans (9 mois par an, 68 ans en 2034)', description: 'Rythme trois fois plus rapide que la réforme de 2023 (3 mois par génération) : économies visibles dès ce quinquennat, rejet maximal.' },
      { id: 'age_60', nom: 'Revenir à 60 ans (avec 40 annuités pour le taux plein)', description: 'Proposition de La France insoumise (L\'Avenir en commun). Selon l\'IFRAP, une mesure comparable coûterait de l\'ordre de 50 Md€ par an à terme (chiffrage contesté).' },
    ],
    delai: 2,
    appliquer(e, o) {
      const r = e.retraites;
      r.calendrier = 'libre';
      // [âge cible, rythme en années d'âge par an]
      const cibles = { abrogation_62: [62, 0.25], suspension: [62.75, 0], acceleration_64: [64, 0.5], age_65: [65, 0.5], age_68: [68, 0.5], age_68_rapide: [68, 0.75], age_60: [60, 0.5] };
      [r.ageCible, r.rythme] = cibles[o];
    },
    effets: () => ({}),
    reaction(e, o) {
      return {
        abrogation_62: { chocs: { salaries: 5, fonctionnaires: 6, jeunes: 2, entrepreneurs: -4 }, opinion: { salaries: 3, fonctionnaires: 3 }, credibilite: -0.3 },
        suspension: { chocs: { salaries: 3, fonctionnaires: 3, entrepreneurs: -2 }, opinion: { salaries: 1 }, credibilite: -0.12 },
        acceleration_64: { chocs: { salaries: -6, fonctionnaires: -6, jeunes: -3, entrepreneurs: 2 }, grief: { salaries: 10, fonctionnaires: 10, jeunes: 4 }, credibilite: 0.12 },
        age_65: { chocs: { salaries: -10, fonctionnaires: -10, jeunes: -5, retraites: 1, entrepreneurs: 3 }, grief: { salaries: 16, fonctionnaires: 16, jeunes: 7 }, credibilite: 0.25 },
        age_68: { chocs: { salaries: -16, fonctionnaires: -16, jeunes: -9, retraites: 1, entrepreneurs: 4 }, grief: { salaries: 26, fonctionnaires: 26, jeunes: 12 }, credibilite: 0.35, instabilite: 0.08 },
        age_68_rapide: { chocs: { salaries: -20, fonctionnaires: -20, jeunes: -11, retraites: 1, entrepreneurs: 4 }, grief: { salaries: 32, fonctionnaires: 32, jeunes: 14 }, credibilite: 0.4, instabilite: 0.12 },
        age_60: { chocs: { salaries: 8, fonctionnaires: 8, jeunes: 3, entrepreneurs: -6 }, opinion: { salaries: 4, fonctionnaires: 4 }, credibilite: -0.45 },
      }[o];
    },
    axes: { retraites: 1 },
    axesParOption: { abrogation_62: { retraites: -1, social: 0.5 }, suspension: { retraites: -0.4 }, acceleration_64: { retraites: 0.6 }, age_65: { retraites: 1 }, age_68: { retraites: 1.6, social: -0.4 }, age_68_rapide: { retraites: 1.8, social: -0.6 }, age_60: { retraites: -1.4, social: 0.8, rigueur: -0.6 } },
    chiffrage: 'Dans le modèle, chaque année d\'âge légal en plus réduit à terme la dépense de pensions d\'environ 10 Md€ par an (environ 400 000 retraités de moins), avant les prestations versées aux seniors sans emploi. Le gouvernement chiffrait la réforme de 2023 à 17,7 Md€ en 2030, avant 4,8 Md€ de mesures d\'accompagnement. La suspension actuelle coûte 0,1 Md€ en 2026 et 1,4 Md€ en 2027. 68 ans : environ 5 ans de plus qu\'aujourd\'hui, soit de l\'ordre de 50 Md€ par an à l\'horizon 2037 dans le modèle, avant les prestations versées aux seniors sans emploi (hypothèse de jeu).',
  },
  {
    id: 'retraites_indexation',
    nom: 'Revalorisation des pensions',
    categorie: 'retraites',
    pays: ['france'],
    resume: 'Revaloriser les pensions moins vite que les prix rapporte vite, mais réduit le pouvoir d\'achat des retraités.',
    pedagogie: 'Un point de sous-indexation sur environ 430 Md€ de pensions représente environ 4 Md€ dès la première année, et cette économie se cumule les années suivantes car la base reste plus basse. La LFSS 2026 prévoit déjà une sous-indexation de 0,9 point en 2027 pour financer la suspension de la réforme des retraites.',
    sources: [{ texte: 'LFSS 2026, sous-indexation de 2027 (franceinfo)', url: 'https://www.franceinfo.fr/economie/retraite/reforme-des-retraites/la-suspension-de-la-reforme-des-retraites-coutera-1-4-milliard-d-euros-en-2027-les-complementaires-sante-et-les-retraites-mis-a-contribution_7570171.html' }],
    options: [
      { id: 'pleine_inflation', nom: 'Revaloriser sur toute l\'inflation (annuler la sous-indexation de 2027)' },
      { id: 'sous_indexation', nom: 'Revaloriser à l\'inflation moins 1 point pendant 3 ans' },
      { id: 'annee_blanche', nom: 'Geler les pensions une année (« année blanche »)' },
    ],
    delai: 1,
    appliquer(e, o) {
      const r = e.retraites;
      const a = e.trimestre.annee + 1;
      if (o === 'pleine_inflation') { for (const k of Object.keys(r.sousIndexationPrevue)) r.sousIndexationPrevue[k] = 0; r.ecartIndexation = 0; }
      if (o === 'sous_indexation') { for (let k = 0; k < 3; k++) r.sousIndexationPrevue[a + k] = Math.max(r.sousIndexationPrevue[a + k] ?? 0, 1); }
      if (o === 'annee_blanche') { r.gel = { ...(r.gel ?? {}), [a]: true }; } // aucune revalorisation cette année-là
    },
    effets: () => ({}),
    reaction(e, o) {
      return {
        pleine_inflation: { chocs: { retraites: 4 }, opinion: { retraites: 2 }, credibilite: -0.05 },
        sous_indexation: { chocs: { retraites: -7 }, opinion: { retraites: -3 }, grief: { retraites: 6 }, credibilite: 0.1 },
        annee_blanche: { chocs: { retraites: -9 }, opinion: { retraites: -3 }, grief: { retraites: 8 }, credibilite: 0.1 },
      }[o];
    },
    axes: { social: -0.5, retraites: 0.4 },
    axesParOption: { pleine_inflation: { social: 0.5, retraites: 0 } },
    chiffrage: 'Environ 4 Md€ par point de sous-indexation la première année, montant qui se cumule ensuite. Une année blanche avec 2 % d\'inflation : environ 8,5 Md€.',
  },
  {
    id: 'retraites_penibilite',
    nom: 'Compensation : départs anticipés pour les métiers pénibles',
    categorie: 'retraites',
    pays: ['france'],
    compensation: true,
    resume: 'Permet aux salariés exposés (port de charges, travail de nuit...) de partir plus tôt. Réduit fortement le rejet d\'un recul de l\'âge.',
    pedagogie: 'Les syndicats ont fait de la pénibilité une condition de toute discussion sur l\'âge. Une compensation ne change pas l\'économie globale du recul, mais rend la réforme plus juste aux yeux des salariés concernés.',
    options: [{ id: 'oui', nom: 'Créer un compte pénibilité élargi' }],
    delai: 2,
    effets: (e, o, age) => ({ depenses: { retraites: 1.5 * rampe(age, 4) * indicePrix(e) } }),
    reaction: () => ({ chocs: { salaries: 2, fonctionnaires: 1 }, compensation: { salaries: 6, fonctionnaires: 2 } }),
    axes: { social: 0.6 },
    chiffrage: 'Hypothèse de jeu : 1,5 Md€ par an.',
  },
  {
    id: 'retraites_minimum',
    nom: 'Compensation : minimum de pension à 1 200 € pour une carrière complète',
    categorie: 'retraites',
    pays: ['france'],
    compensation: true,
    resume: 'Revaloriser les petites pensions des carrières complètes.',
    options: [{ id: 'oui', nom: 'Porter le minimum contributif à 1 200 € brut' }],
    delai: 2,
    effets: (e, o, age) => ({ depenses: { retraites: 1.2 * rampe(age, 2) * indicePrix(e) } }),
    reaction: () => ({ chocs: { retraites: 3, salaries: 1 }, opinion: { retraites: 2 }, compensation: { retraites: 4, salaries: 2 } }),
    axes: { social: 0.5 },
    chiffrage: 'Hypothèse de jeu : 1,2 Md€ par an.',
  },
  {
    id: 'retraites_carrieres_longues',
    nom: 'Compensation : élargir le dispositif carrières longues',
    categorie: 'retraites',
    pays: ['france'],
    compensation: true,
    resume: 'Ceux qui ont commencé à travailler avant 20 ans partent plus tôt.',
    options: [{ id: 'oui', nom: 'Élargir les carrières longues' }],
    delai: 2,
    effets: (e, o, age) => ({ depenses: { retraites: 2 * rampe(age, 4) * indicePrix(e) } }),
    reaction: () => ({ chocs: { salaries: 2 }, compensation: { salaries: 5, fonctionnaires: 1 } }),
    axes: { social: 0.4 },
    chiffrage: 'Hypothèse de jeu : 2 Md€ par an.',
  },

  // ======================================================================
  // TEMPS DE TRAVAIL (France)
  // ======================================================================
  {
    id: 'temps_travail',
    nom: 'Durée légale du travail et heures supplémentaires',
    categorie: 'travail',
    pays: ['france'],
    resume: 'Travailler plus pour produire plus, mais qui paie les heures en plus, et qui y perd ?',
    pedagogie: 'Selon l\'Insee, les salariés à temps complet travaillent déjà 38,8 h par semaine en moyenne (cadres 42 h, employés 37,3 h). Passer à 39 h change donc surtout le seuil des heures majorées de 25 %. Les salariés à 35 h gagnent à travailler plus si les heures sont payées ; ceux qui faisaient déjà des heures supplémentaires peuvent y perdre (fin de la majoration). Exonérer les heures en plus d\'impôt et de cotisations augmente le pouvoir d\'achat, mais coûte au budget. À 40 h, la France rejoindrait la norme légale de l\'Espagne (où le Parlement a rejeté en septembre 2025 un passage à 37,5 h), de l\'Italie ou du Portugal ; la directive européenne plafonne de son côté la durée à 48 h en moyenne.',
    sources: [
      { texte: 'Insee, durée du travail (2024)', url: 'https://www.insee.fr/fr/statistiques/8733071' },
      { texte: 'Coût des heures supplémentaires défiscalisées (franceinfo)', url: 'https://www.franceinfo.fr/replay-radio/le-decryptage-eco/budget-2026-heures-supplementaires-et-primes-defiscalisees-ou-desocialisees-le-retour-des-vieilles-recettes_7500832.html' },
    ],
    options: [
      { id: 'heures_sup_libres', nom: 'Garder 35 h, exonérer totalement les heures supplémentaires (sans plafond)' },
      { id: '37h_normal', nom: '37 h payées 37, heures imposées normalement' },
      { id: '39h_normal', nom: '39 h payées 39, heures imposées normalement' },
      { id: '39h_exo2', nom: '39 h payées 39, dont 2 h exonérées d\'impôt et de cotisations' },
      { id: '39h_exo4', nom: '39 h payées 39, les 4 h en plus exonérées' },
      { id: '39h_non_payees', nom: '39 h payées 35 (travailler plus sans gagner plus)' },
      { id: '40h_normal', nom: '40 h payées 40, heures imposées normalement', description: 'La norme légale de l\'Espagne, de l\'Italie ou du Portugal. Les heures majorées ne commencent qu\'à la 41e heure.' },
      { id: '40h_exo5', nom: '40 h payées 40, les 5 h en plus exonérées d\'impôt et de cotisations', description: 'Plus attractif pour les salariés, mais coûteux pour le budget.' },
      { id: '40h_non_payees', nom: '40 h payées 35 (5 h de plus sans hausse de salaire)', description: 'Pour un salarié à 35 h, le salaire horaire baisse de 12,5 % : choc de compétitivité, mais perte de pouvoir d\'achat horaire.' },
    ],
    delai: 2,
    appliquer(e, o) {
      const t = e.travail;
      t.trimestreDebut = e.tour;
      if (o === 'heures_sup_libres') { t.heuresSupLibres = true; t.traitement = null; t.dureeReference = 35; return; }
      t.heuresSupLibres = false;
      const conf = {
        '37h_normal': [37, 'normal', 0], '39h_normal': [39, 'normal', 0], '39h_exo2': [39, 'exonere', 2],
        '39h_exo4': [39, 'exonere', 4], '39h_non_payees': [39, 'non_paye', 0],
        '40h_normal': [40, 'normal', 0], '40h_exo5': [40, 'exonere', 5], '40h_non_payees': [40, 'non_paye', 0],
      }[o];
      [t.dureeReference, t.traitement, t.heuresExonerees] = conf;
    },
    annuler(e) { Object.assign(e.travail, { traitement: null, heuresSupLibres: false, dureeReference: 35, trimestreDebut: null }); },
    effets: () => ({}), // calculés par le sous-modèle du temps de travail
    reaction(e, o) {
      return {
        heures_sup_libres: { chocs: { salaries: 2, entrepreneurs: 2 }, opinion: { salaries: 1 } },
        '37h_normal': { chocs: { salaries: -4, fonctionnaires: -2, entrepreneurs: 4 }, grief: { salaries: 5 } },
        '39h_normal': { chocs: { salaries: -7, fonctionnaires: -3, jeunes: -2, entrepreneurs: 6 }, grief: { salaries: 9, jeunes: 2 }, credibilite: 0.05 },
        '39h_exo2': { chocs: { salaries: -3, fonctionnaires: -2, entrepreneurs: 5 }, grief: { salaries: 5 }, credibilite: 0.03 },
        '39h_exo4': { chocs: { salaries: -2, fonctionnaires: -2, entrepreneurs: 5 }, grief: { salaries: 4 } },
        '39h_non_payees': { chocs: { salaries: -14, fonctionnaires: -5, jeunes: -5, entrepreneurs: 8 }, grief: { salaries: 18, jeunes: 6 }, credibilite: 0.08 },
        '40h_normal': { chocs: { salaries: -9, fonctionnaires: -4, jeunes: -3, entrepreneurs: 7 }, grief: { salaries: 12, jeunes: 3 }, credibilite: 0.06 },
        '40h_exo5': { chocs: { salaries: -3, fonctionnaires: -3, entrepreneurs: 6 }, grief: { salaries: 6 }, credibilite: -0.02 },
        '40h_non_payees': { chocs: { salaries: -18, fonctionnaires: -6, jeunes: -7, entrepreneurs: 10 }, grief: { salaries: 24, jeunes: 8 }, credibilite: 0.1, instabilite: 0.05 },
      }[o];
    },
    axes: { travail: 1 },
    axesParOption: { heures_sup_libres: { travail: 0.4, fiscal: -0.3 }, '39h_non_payees': { travail: 1, social: -0.7 }, '39h_exo2': { travail: 0.8, fiscal: -0.3 }, '39h_exo4': { travail: 0.8, fiscal: -0.5 }, '40h_normal': { travail: 1.2 }, '40h_exo5': { travail: 1, fiscal: -0.7 }, '40h_non_payees': { travail: 1.3, social: -1 } },
    chiffrage: 'Modèle : 39 h ferait gagner de l\'ordre de 0,5 à 0,8 % de PIB potentiel à terme, selon l\'adhésion. Les exonérations coûtent environ 1 à 3 Md€ par an. Les heures supplémentaires défiscalisées actuelles coûtent environ 2 Md€ par an (franceinfo). 40 h : un peu plus d\'heures que 39 h pour les salariés à 35-37 h, rien ne change pour les cadres déjà à 42 h ; 5 h exonérées coûtent de l\'ordre de 6 à 7 Md€ par an (calcul du modèle). Paradoxe instructif : 40 h payées 35 baissent le coût du travail et le chômage, mais améliorent moins le déficit que 40 h payées 40, car la masse salariale (donc les cotisations et l\'impôt) baisse.',
  },
  {
    id: 'fonction_publique_temps',
    nom: 'Temps de travail effectif dans la fonction publique (1 607 h)',
    categorie: 'travail',
    pays: ['france'],
    resume: 'Faire respecter partout la durée annuelle légale de 1 607 h et réduire les jours de RTT, puis ne pas remplacer une partie des départs.',
    options: [{ id: 'oui', nom: 'Appliquer 1 607 h partout et réduire les effectifs par non-remplacement' }],
    delai: 2,
    effets(e, o, age) {
      const economie = 0.02 * masseSalarialePublique(e) * rampe(age, 8);
      return { depenses: repartirSurPersonnel(e, -economie) };
    },
    reaction: () => ({ chocs: { fonctionnaires: -8, entrepreneurs: 2, retraites: 1 }, grief: { fonctionnaires: 10 }, credibilite: 0.05 }),
    axes: { travail: 0.8, marche: 0.4 },
    chiffrage: 'Hypothèse de jeu : environ 2 % de la masse salariale publique à terme (plus de 6 Md€).',
  },

  // ======================================================================
  // FONCTION PUBLIQUE, PRESTATIONS (communes)
  // ======================================================================
  {
    id: 'gel_point_indice',
    vote: false, // mesure réglementaire ou budgétaire : pas de vote d'une loi spécifique
    nom: 'Geler la rémunération des fonctionnaires',
    categorie: 'fonction_publique',
    pays: 'tous',
    resume: 'Point d\'indice gelé en France, ou augmentation nulle (« Nullrunde ») pour les fonctionnaires allemands.',
    pedagogie: 'Geler la rémunération pendant que les prix montent fait baisser la dépense en termes réels. Le pouvoir d\'achat des fonctionnaires recule, et l\'attractivité de métiers déjà en tension (enseignants, soignants) aussi.',
    options: [{ id: 'deux_ans', nom: 'Gel pendant deux ans' }],
    delai: 1,
    appliquer(e) { e.politiqueSalariale.gel = { debut: e.tour, fin: e.tour + 8, prixDebut: e.macro.niveauPrix }; },
    effets(e) {
      const g = e.politiqueSalariale.gel;
      if (!g) return {};
      if (e.tour >= g.fin && !g.prixFin) g.prixFin = e.macro.niveauPrix;
      // Écart réel accumulé pendant le gel : les rémunérations restent fixes pendant que les prix montent
      const ecartReel = 1 - g.prixDebut / (g.prixFin ?? e.macro.niveauPrix);
      return { depenses: repartirSurPersonnel(e, -0.8 * ecartReel * masseSalarialePublique(e)) };
    },
    reaction: () => ({ chocs: { fonctionnaires: -9 }, opinion: { fonctionnaires: -3 }, grief: { fonctionnaires: 6 }, credibilite: 0.05 }),
    axes: { social: -0.4, marche: 0.3 },
    chiffrage: 'Environ 0,8 × l\'inflation × la masse salariale publique, chaque année de gel.',
  },
  {
    id: 'gel_prestations',
    nom: 'Geler les prestations sociales une année',
    categorie: 'protection_sociale',
    pays: 'tous',
    resume: 'Ne pas revaloriser les allocations (famille, logement, minima sociaux) pendant un an.',
    pedagogie: 'Mesure à fort rendement et rapide, mais concentrée sur les ménages modestes, qui touchent le plus de prestations.',
    options: [{ id: 'un_an', nom: 'Gel pendant un an' }],
    delai: 1,
    appliquer(e) { e.politiqueSociale.gel = { debut: e.tour, fin: e.tour + 4, prixDebut: e.macro.niveauPrix }; },
    effets(e) {
      const g = e.politiqueSociale.gel;
      if (!g) return {};
      if (e.tour >= g.fin && !g.prixFin) g.prixFin = e.macro.niveauPrix;
      const ecartReel = 1 - g.prixDebut / (g.prixFin ?? e.macro.niveauPrix);
      const depenses = {};
      for (const [poste, part] of Object.entries(COMPOSITION_TRANSFERTS)) depenses[poste] = -ecartReel * part * e.budget[poste].base * 0.7;
      return { depenses };
    },
    reaction: () => ({ chocs: { jeunes: -4, salaries: -3 }, grief: { jeunes: 3, salaries: 2 }, credibilite: 0.05 }),
    axes: { social: -0.7 },
    chiffrage: 'De l\'ordre de 0,7 × l\'inflation × 300 Md€ de prestations (France) : environ 4 à 6 Md€ par an.',
  },
  {
    id: 'gel_bareme',
    nom: 'Ne pas revaloriser le barème de l\'impôt sur le revenu',
    categorie: 'fiscalite',
    pays: 'tous',
    resume: 'Un impôt « invisible » : avec l\'inflation, davantage de revenus passent dans les tranches supérieures.',
    options: [{ id: 'un_an', nom: 'Barème gelé pendant un an' }],
    delai: 1,
    // Avec un barème gelé, l'impôt augmente d'environ 1,5 fois l'inflation (progressivité), sans rattrapage ensuite
    appliquer(e) { e.politiqueSociale.surplusBaremeGele += Math.max(0, e.macro.inflation) / 100 * 1.5; },
    effets: (e) => ({ recettes: { impotRevenu: e.politiqueSociale.surplusBaremeGele * e.impots.impotRevenu.R0 * indicePrix(e) } }),
    reaction: () => ({ chocs: { salaries: -3, retraites: -2, fonctionnaires: -2 }, credibilite: 0.03 }),
    axes: { fiscal: 0.5 },
    chiffrage: 'Environ 1,5 × l\'inflation × le rendement de l\'impôt sur le revenu (France : environ 3 Md€ avec 2 % d\'inflation).',
  },
  {
    id: 'non_remplacement',
    vote: false, // mesure réglementaire ou budgétaire : pas de vote d'une loi spécifique
    nom: 'Ne pas remplacer un fonctionnaire sur trois partant à la retraite',
    categorie: 'fonction_publique',
    pays: 'tous',
    resume: 'Réduit progressivement les effectifs et la masse salariale publique.',
    pedagogie: 'L\'économie monte lentement (environ 0,6 % de la masse salariale par an). Si elle touche l\'éducation et la santé, la qualité du service et le capital humain en pâtissent.',
    options: [{ id: 'oui', nom: 'Non-remplacement d\'un départ sur trois' }],
    delai: 1,
    effets(e, o, age) {
      const economie = 0.006 * (age + 1) / 4 * masseSalarialePublique(e);
      return { depenses: repartirSurPersonnel(e, -Math.min(economie, 0.05 * masseSalarialePublique(e))) };
    },
    reaction: () => ({ chocs: { fonctionnaires: -6, entrepreneurs: 2 }, grief: { fonctionnaires: 6 }, opinion: { retraites: -1 }, credibilite: 0.05 }),
    axes: { marche: 0.6, social: -0.3 },
    chiffrage: 'Environ 0,6 % de la masse salariale publique de moins chaque année.',
  },
  {
    id: 'assurance_chomage',
    vote: false, // mesure réglementaire ou budgétaire : pas de vote d'une loi spécifique
    nom: 'Règles de l\'assurance chômage',
    categorie: 'travail',
    pays: ['france'],
    resume: 'Durée et montant d\'indemnisation : un arbitrage entre protection et retour à l\'emploi.',
    options: [
      { id: 'durcir', nom: 'Réduire la durée d\'indemnisation de 25 %' },
      { id: 'assouplir', nom: 'Allonger la durée d\'indemnisation et améliorer les allocations' },
    ],
    delai: 2,
    effets(e, o, age) {
      const r = rampe(age, 4);
      const base = e.budget.travailEmploi.base;
      return o === 'durcir'
        ? { depenses: { travailEmploi: -0.07 * base * r }, chomageStructurel: -0.2 * rampe(age, 8) }
        : { depenses: { travailEmploi: 0.06 * base * r }, chomageStructurel: 0.1 * rampe(age, 8) };
    },
    reaction: (e, o) => (o === 'durcir'
      ? { chocs: { jeunes: -5, salaries: -3, entrepreneurs: 2 }, grief: { jeunes: 4, salaries: 2 }, credibilite: 0.05 }
      : { chocs: { jeunes: 4, salaries: 2, entrepreneurs: -2 }, credibilite: -0.03 }),
    axes: { social: -0.5, marche: 0.5 },
    axesParOption: { assouplir: { social: 0.6, marche: -0.4 } },
    chiffrage: 'Hypothèse de jeu : environ 3,5 Md€ d\'économie par an, et −0,2 point de chômage structurel à terme.',
  },

  // ======================================================================
  // FISCALITÉ (France, communes)
  // ======================================================================
  {
    id: 'tva_sociale',
    nom: 'TVA sociale : +2 points de TVA, baisse des cotisations patronales',
    categorie: 'fiscalite',
    pays: ['france', 'allemagne'],
    resume: 'Faire financer la protection sociale par la consommation (y compris des produits importés) plutôt que par le travail.',
    pedagogie: 'Le coût du travail baisse, ce qui favorise l\'emploi et la compétitivité. Les prix montent : les retraités et les ménages modestes, qui ne profitent pas de la baisse des cotisations, y perdent.',
    options: [{ id: 'oui', nom: '+2 points de TVA, cotisations patronales réduites d\'autant' }],
    delai: 2,
    appliquer(e) {
      const tva = e.impots.tva, cot = e.impots.cotisations;
      const gain = tva.R0 * 0.8 * (2 / tva.tauxRef);
      tva.taux = Math.min(tva.bornes[1], tva.taux + 2);
      cot.taux = Math.max(cot.bornes[0], cot.taux - gain / cot.R0 * 100);
    },
    effets: (e, o, age) => ({ chomageStructurel: -0.25 * rampe(age, 6) }),
    reaction: () => ({ chocs: { retraites: -5, salaries: -2, jeunes: -2, entrepreneurs: 5 }, grief: { retraites: 3 } }),
    axes: { fiscal: 0.2, marche: 0.6 },
    chiffrage: 'Neutre pour le budget à court terme ; environ −0,25 point de chômage structurel à terme (hypothèse).',
  },
  {
    id: 'taxe_hauts_patrimoines',
    nom: 'Impôt minimum sur les très hauts patrimoines',
    categorie: 'fiscalite',
    pays: 'tous',
    resume: 'Un impôt plancher de 2 % sur les patrimoines de plus de 100 M€ (proposition « Zucman », réclamée par la gauche en 2025-2026).',
    pedagogie: 'Les chiffrages publics de ce type d\'impôt sont très débattus, de quelques milliards à plus de 20 Md€ selon les hypothèses de départ à l\'étranger et d\'évaluation des patrimoines professionnels. Le jeu tire un rendement incertain dans une fourchette d\'hypothèses et l\'érode avec le temps. Il pèse sur la confiance des investisseurs.',
    options: [{ id: 'oui', nom: 'Impôt plancher de 2 % au-delà de 100 M€' }],
    delai: 3,
    appliquer(e, o, alea) {
      const tirage = alea ? alea.uniforme() : 0.5;
      // États-Unis : impôt minimum sur les milliardaires (fourchette élargie, hypothèse de jeu)
      e.politiqueSociale.rendementPatrimoine = (4 + 12 * tirage) * parPays(e, { allemagne: 1.3, etatsUnis: 4, defaut: 1 });
    },
    effets(e, o, age) {
      const r0 = e.politiqueSociale.rendementPatrimoine ?? 0;
      return { recettes: { fixe: r0 * Math.pow(0.97, age) * indicePrix(e) }, potentielBonus: -0.03 };
    },
    reaction: () => ({ chocs: { entrepreneurs: -8, jeunes: 3, salaries: 3, fonctionnaires: 2 }, opinion: { jeunes: 2, salaries: 2 }, credibilite: -0.05 }),
    axes: { fiscal: 0.8, social: 0.6, marche: -0.6 },
    chiffrage: 'Fourchette d\'hypothèses du jeu : 4 à 16 Md€ par an (France), 16 à 64 Md$ aux États-Unis, en érosion de 3 % par trimestre (départs, optimisation).',
  },
  {
    id: 'rabot_niches',
    nom: 'Réduire de 10 % les niches fiscales',
    categorie: 'fiscalite',
    pays: 'tous',
    resume: 'Raboter crédits et réductions d\'impôt (emploi à domicile, investissement locatif, crédit d\'impôt recherche...).',
    options: [{ id: 'oui', nom: 'Rabot de 10 % sur les dépenses fiscales' }],
    delai: 2,
    effets: (e, o, age) => ({ recettes: { fixe: parPays(e, { france: 8, allemagne: 6, etatsUnis: 60 }) * rampe(age, 4) * indicePrix(e) }, potentielBonus: -0.01 }),
    reaction: () => ({ chocs: { entrepreneurs: -4, salaries: -2, retraites: -1 }, credibilite: 0.08 }),
    axes: { fiscal: 0.5 },
    chiffrage: 'Hypothèse de jeu : 8 Md€ par an en France, 6 Md€ en Allemagne, 60 Md$ aux États-Unis.',
  },
  {
    id: 'allegements_charges',
    nom: 'Allègements de cotisations patronales',
    categorie: 'fiscalite',
    pays: ['france'],
    resume: 'Les allègements sur les salaires proches du SMIC soutiennent l\'emploi peu qualifié ; au-dessus, leur efficacité est discutée.',
    options: [
      { id: 'recentrer', nom: 'Supprimer les allègements au-dessus de 2 SMIC' },
      { id: 'renforcer', nom: 'Renforcer les allègements près du SMIC' },
    ],
    delai: 2,
    effets: (e, o, age) => (o === 'recentrer'
      ? { recettes: { cotisations: 4 * rampe(age, 4) * indicePrix(e) }, chomageStructurel: 0.05 }
      : { recettes: { cotisations: -4 * rampe(age, 4) * indicePrix(e) }, chomageStructurel: -0.12 * rampe(age, 8) }),
    reaction: (e, o) => (o === 'recentrer' ? { chocs: { entrepreneurs: -5 }, credibilite: 0.05 } : { chocs: { entrepreneurs: 4, salaries: 1 }, credibilite: -0.03 }),
    axes: { marche: 0.5 },
    axesParOption: { recentrer: { marche: -0.3, fiscal: 0.4 } },
    chiffrage: 'Hypothèse de jeu : ±4 Md€ par an.',
  },
  {
    id: 'plan_antifraude',
    vote: false, // mesure réglementaire ou budgétaire : pas de vote d'une loi spécifique
    nom: 'Plan de lutte contre la fraude fiscale et sociale',
    categorie: 'fiscalite',
    pays: 'tous',
    resume: 'Plus de contrôleurs et le croisement des données : un rendement réel mais progressif, souvent surestimé.',
    options: [{ id: 'oui', nom: 'Recruter des contrôleurs et croiser les fichiers' }],
    delai: 1,
    effets: (e, o, age) => {
      const k = parPays(e, { etatsUnis: 8, defaut: 1 }); // États-Unis : contrôles fiscaux de l'IRS
      return { recettes: { fixe: 3 * k * rampe(age, 8) * indicePrix(e) }, depenses: { economieFinances: 0.3 * k * indicePrix(e) } };
    },
    reaction: () => ({ chocs: { salaries: 1, retraites: 1, jeunes: 1 } }),
    axes: { fiscal: 0.2 },
    chiffrage: 'Hypothèse de jeu : jusqu\'à 3 Md€ par an après deux ans, pour 0,3 Md€ de coût.',
  },
  {
    id: 'privatisations',
    vote: false, // mesure réglementaire ou budgétaire : pas de vote d'une loi spécifique
    nom: 'Céder des participations de l\'État',
    categorie: 'dette',
    pays: 'tous',
    resume: 'Vendre des actions détenues par l\'État pour rembourser de la dette.',
    pedagogie: 'La dette baisse d\'un coup, mais l\'État perd les dividendes futurs. Si le rendement des dividendes est supérieur au taux de la dette, c\'est une mauvaise affaire à long terme.',
    options: [{ id: 'dix', nom: 'Céder 10 Md€ de participations' }],
    delai: 1,
    unique: true,
    effets: (e, o, age) => ({ cessions: age === 0 ? 10 : 0, recettes: { fixe: -0.45 } }),
    reaction: () => ({ chocs: { fonctionnaires: -2, salaries: -1, entrepreneurs: 1 }, credibilite: 0.03 }),
    axes: { marche: 0.8 },
    chiffrage: '10 Md€ de dette en moins, environ 0,45 Md€ de dividendes perdus chaque année (hypothèse).',
  },

  // ======================================================================
  // ÉNERGIE (communes)
  // ======================================================================
  {
    id: 'bouclier_energie',
    vote: false, // mesure réglementaire ou budgétaire : pas de vote d'une loi spécifique
    nom: 'Protéger les ménages contre le choc énergétique',
    categorie: 'energie',
    pays: 'tous',
    resume: 'Avec la guerre en Iran, le gaz a triplé par rapport à février 2026. Faut-il protéger tout le monde ou cibler ?',
    pedagogie: 'Un bouclier général limite l\'inflation et protège tous les ménages, mais il coûte très cher, profite aussi aux gros consommateurs et freine les économies d\'énergie. Un chèque ciblé coûte beaucoup moins cher et protège les plus modestes, sans effet sur l\'inflation mesurée. En 2022-2023, les boucliers tarifaires français ont coûté plusieurs dizaines de milliards d\'euros.',
    options: [
      { id: 'cheque_cible', nom: 'Chèque énergie ciblé sur les 30 % les plus modestes' },
      { id: 'bouclier_general', nom: 'Bouclier tarifaire : l\'État absorbe la moitié de la hausse' },
    ],
    delai: 1,
    effets(e, o) {
      const hausse = Math.max(0, e.macro.prixEnergieConso / 100 - 1);
      const factureMenages = e.statique.energie.poidsConso * 0.55 * e.macro.pibNominal * 0.7; // estimation de la facture énergétique des ménages
      if (o === 'bouclier_general') {
        return {
          plafonnementEnergie: 0.5,
          depenses: { ecologieEnergie: 0.5 * hausse / (1 + hausse) * factureMenages },
        };
      }
      const montant = 0.12 * hausse / (1 + hausse) * factureMenages + 0.5;
      const aide = 35 * Math.min(1.5, hausse / 0.2);
      return {
        depenses: { protectionSociale: montant },
        menages: Object.fromEntries(['smic', 'jeune', 'agriculteur'].map((id) => [id, [{ montant: aide, texte: 'Chèque énergie' }]])),
      };
    },
    reaction: (e, o) => (o === 'bouclier_general'
      ? { chocs: { salaries: 4, retraites: 4, jeunes: 2, agriculteurs: 4, entrepreneurs: 2 }, credibilite: -0.1 }
      : { chocs: { jeunes: 2, salaries: 1 } }),
    axes: { social: 0.5 },
    axesParOption: { bouclier_general: { social: 0.7, ecologie: -0.5 } },
    chiffrage: 'Le coût dépend du prix mondial de l\'énergie : de l\'ordre de 10 Md€ par an pour un bouclier général au niveau actuel, contre 2 à 3 Md€ pour un chèque ciblé (modèle).',
  },
  {
    id: 'taxe_superprofits',
    vote: false, // mesure réglementaire ou budgétaire : pas de vote d'une loi spécifique
    nom: 'Contribution exceptionnelle sur les profits des énergéticiens',
    categorie: 'energie',
    pays: 'tous',
    resume: 'Taxer les gains exceptionnels liés à la flambée des prix pour financer l\'aide aux ménages.',
    options: [{ id: 'oui', nom: 'Contribution sur les profits exceptionnels' }],
    delai: 2,
    effets: (e) => ({ recettes: { fixe: Math.max(0, (e.monde.energie - 130) / 100) * parPays(e, { allemagne: 4, etatsUnis: 20, defaut: 3 }) } }),
    reaction: () => ({ chocs: { salaries: 2, jeunes: 2, retraites: 1, entrepreneurs: -2 } }),
    axes: { fiscal: 0.6, social: 0.4 },
    chiffrage: 'Rendement lié au prix mondial de l\'énergie : environ 2 à 4 Md€ par an au niveau actuel (hypothèse).',
  },

  // ======================================================================
  // ALLEMAGNE
  // ======================================================================
  {
    id: 'rente_alter',
    nom: 'Âge de la retraite (Regelaltersgrenze)',
    categorie: 'retraites',
    pays: ['allemagne'],
    resume: 'L\'âge légal atteint 67 ans en 2031. La commission des retraites de 2026 propose de l\'indexer sur l\'espérance de vie.',
    pedagogie: 'La commission propose 67,5 ans d\'ici 2041 et la fin du départ sans décote après 45 ans de cotisation (« Rente mit 63 »). Le taux de cotisation passerait de 18,6 % à 19,8 % en 2028 selon les projections : chaque point de cotisation représente 21,1 Md€.',
    sources: [
      { texte: 'Propositions de la commission des retraites (ZDF)', url: 'https://www.zdfheute.de/politik/deutschland/rente-reform-kommission-vorschlaege-100.html' },
      { texte: 'DRV, chiffres de référence (Bundestag)', url: 'https://dserver.bundestag.de/btd/21/030/2103080.pdf' },
    ],
    options: [
      { id: 'esperance_vie', nom: 'Indexer l\'âge sur l\'espérance de vie (67,5 ans en 2041)' },
      { id: 'age_68', nom: 'Aller vers 68 ans (2 mois par an après 2031)' },
      { id: 'fin_rente_63', nom: 'Supprimer le départ sans décote après 45 ans de cotisation' },
    ],
    delai: 2,
    appliquer(e, o) {
      const r = e.retraites;
      if (o === 'fin_rente_63') { e.politiqueSociale.finRente63 = e.tour; return; }
      r.calendrier = 'libre';
      if (o === 'esperance_vie') { r.ageCible = 67.5; r.rythme = Math.max(r.rythme, 2 / 12); }
      if (o === 'age_68') { r.ageCible = 68; r.rythme = 2 / 12; }
    },
    effets(e, o, age) {
      if (o !== 'fin_rente_63') return {};
      return { depenses: { retraites: -4 * rampe(age, 12) * indicePrix(e) }, offreTravail: 0.25 * rampe(age, 12) };
    },
    reaction: (e, o) => ({
      esperance_vie: { chocs: { salaries: -5, fonctionnaires: -3, jeunes: -2 }, grief: { salaries: 6 }, credibilite: 0.1 },
      age_68: { chocs: { salaries: -9, fonctionnaires: -5, jeunes: -3 }, grief: { salaries: 12, fonctionnaires: 4 }, credibilite: 0.15 },
      fin_rente_63: { chocs: { salaries: -7, retraites: -1 }, grief: { salaries: 9 }, credibilite: 0.08 },
    }[o]),
    axes: { retraites: 1 },
    chiffrage: 'Fin du départ sans décote après 45 ans : hypothèse de jeu de 4 Md€ par an à terme.',
  },
  {
    id: 'rente_cotisation_2028',
    nom: 'Financement des retraites en 2028 : cotisations ou impôt ?',
    categorie: 'retraites',
    pays: ['allemagne'],
    resume: 'La projection prévoit une cotisation retraite à 19,8 % en 2028. Le budget fédéral peut prendre le relais, au prix d\'un déficit plus élevé.',
    options: [{ id: 'subvention', nom: 'Bloquer la cotisation à 18,6 % et compenser par le budget fédéral' }],
    delai: 1,
    appliquer(e) { e.politiqueSociale.bloquerCotisation2028 = true; },
    effets: () => ({}),
    reaction: () => ({ chocs: { salaries: 3, entrepreneurs: 3 }, credibilite: -0.1 }),
    axes: { fiscal: -0.3, social: 0.3 },
    chiffrage: '1,2 point de cotisation × 21,1 Md€ ≈ 25 Md€ par an à la charge du budget fédéral à partir de 2028 (DRV).',
  },
  {
    id: 'mehrarbeit_steuerfrei',
    nom: 'Exonérer d\'impôt les majorations pour heures supplémentaires',
    categorie: 'travail',
    pays: ['allemagne'],
    resume: 'Mesure inscrite dans l\'accord de coalition CDU/CSU-SPD.',
    options: [{ id: 'oui', nom: 'Majorations d\'heures supplémentaires exonérées' }],
    delai: 2,
    appliquer(e) { e.travail.heuresSupLibres = true; e.travail.trimestreDebut = e.tour; },
    annuler(e) { e.travail.heuresSupLibres = false; },
    effets: () => ({}),
    reaction: () => ({ chocs: { salaries: 2, entrepreneurs: 2 } }),
    axes: { travail: 0.4, fiscal: -0.3 },
    chiffrage: 'Hypothèse de jeu : environ 1,5 Md€ par an.',
  },
  {
    id: 'grundsicherung',
    nom: 'Remplacer le revenu citoyen (Bürgergeld) par une nouvelle aide minimale',
    categorie: 'protection_sociale',
    pays: ['allemagne'],
    resume: 'Durcir les obligations et les sanctions pour les demandeurs d\'emploi aptes au travail.',
    options: [{ id: 'oui', nom: 'Nouvelle aide minimale plus exigeante' }],
    delai: 2,
    effets: (e, o, age) => ({ depenses: { travailEmploi: -3 * rampe(age, 6) * indicePrix(e) }, chomageStructurel: -0.15 * rampe(age, 8) }),
    reaction: () => ({ chocs: { jeunes: -3, salaries: 2, retraites: 2 }, grief: { jeunes: 3 }, credibilite: 0.05 }),
    axes: { social: -0.5, marche: 0.4 },
    chiffrage: 'Hypothèse de jeu : environ 3 Md€ par an d\'économie.',
  },
  {
    id: 'schuldenbremse_reforme',
    nom: 'Réformer le frein à l\'endettement : exclure l\'investissement public',
    categorie: 'regles',
    pays: ['allemagne'],
    resume: 'Une « règle d\'or » qui autorise l\'emprunt pour l\'investissement net. Il faut une majorité des deux tiers au Bundestag et au Bundesrat.',
    pedagogie: 'Avec 328 sièges, la coalition et les Verts (85) ne réunissent que 413 voix, sous les 420 nécessaires : il faut aussi Die Linke ou l\'AfD. La réforme de mars 2025 avait été votée par l\'ancien Bundestag pour cette raison.',
    options: [{ id: 'regle_or', nom: 'Exclure l\'investissement net (environ 1 % du PIB) du frein' }],
    delai: 2,
    appliquer(e) { const n = e.statique.regles.nationale; if (n) n.plafondStructurelBund += 1.0; },
    effets: () => ({}),
    reaction: () => ({ chocs: { jeunes: 3, salaries: 1, retraites: -2, entrepreneurs: 1 }, credibilite: -0.05 }),
    axes: { fiscal: -0.2, social: 0.3, europe: 0.2 },
    majoriteRenforcee: true,
    chiffrage: 'Environ 45 Md€ par an de capacité d\'emprunt supplémentaire.',
  },
  {
    id: 'service_militaire',
    nom: 'Rétablir un service militaire obligatoire',
    categorie: 'defense',
    pays: ['allemagne'],
    resume: 'Pour atteindre les effectifs visés par l\'OTAN.',
    options: [{ id: 'oui', nom: 'Service militaire obligatoire de 6 mois' }],
    delai: 3,
    effets: (e, o, age) => ({ depenses: { defense: 3 * rampe(age, 4) * indicePrix(e) }, offreTravail: -0.1 * rampe(age, 4) }),
    reaction: () => ({ chocs: { jeunes: -7, retraites: 3 }, grief: { jeunes: 5 } }),
    axes: { securite: 0.8 },
    chiffrage: 'Hypothèse de jeu : 3 Md€ par an.',
  },


  // ======================================================================
  // ENTREPRISES : CONTRIBUTIONS ET AIDES (communes)
  // ======================================================================
  {
    id: 'surtaxe_grandes_entreprises',
    nom: 'Contribution exceptionnelle des grandes entreprises',
    categorie: 'fiscalite',
    pays: 'tous',
    resume: 'Faire contribuer les plus grands groupes au redressement des comptes, au prix d\'un climat des affaires dégradé.',
    pedagogie: 'En France, une surtaxe d\'impôt sur les sociétés frappe environ 300 groupes : 8 Md€ en 2025, 7,3 Md€ en 2026. Le PLF 2027 proposait une troisième année à taux réduits ; les députés ont supprimé cette prolongation le 28/10/2026. Sans nouvelle décision, ces recettes disparaissent en 2027 (le jeu l\'intègre). Les grands groupes font valoir que leur taux d\'imposition dépasse alors celui de leurs concurrents européens.',
    sources: [{ texte: 'L\'Argus de l\'assurance, 28/10/2026', url: 'https://www.argusdelassurance.com/reglementation/vie-publique/plf/budget-2027-les-deputes-suppriment-la-prolongation-de-la-surtaxe-exceptionnelle-dimpot-sur-les-societes-pour-les-grandes-entreprises.PHXG6G4DTNAQ5HPE4ZBMPVTA7E.html' }],
    options: [
      { id: 'reduite', nom: 'Prolonger à taux réduits (proposition du PLF 2027)' },
      { id: 'pleine', nom: 'Reconduire au niveau de 2026' },
    ],
    delai: 1,
    appliquer(e, o) { e.entreprises.surtaxe = o; },
    annuler(e) { e.entreprises.surtaxe = null; },
    effets(e, o) {
      // France : la suppression de la recette de base (7,3 Md€) est annulée ; la version réduite rapporte moins (hypothèse : 4,5 Md€)
      if (e.pays === 'france') return { recettes: { impotSocietes: o === 'reduite' ? -(7.3 - 4.5) * indicePrix(e) : 0 }, potentielBonus: -0.01 };
      const base = parPays(e, { allemagne: 6, etatsUnis: 50, defaut: 5 });
      return { recettes: { impotSocietes: (o === 'reduite' ? 0.6 : 1) * base * indicePrix(e) }, potentielBonus: -0.01 };
    },
    reaction: () => ({ chocs: { entrepreneurs: -5, salaries: 2, jeunes: 1 }, credibilite: 0.03 }),
    axes: { fiscal: 0.7, marche: -0.5, rigueur: 0.4 },
    chiffrage: 'France : 7,3 Md€ en 2026 ; version réduite estimée à 4,5 Md€ (hypothèse de jeu). Allemagne : 6 Md€ et États-Unis : 50 Md$ (hypothèses de jeu).',
  },
  {
    id: 'aides_entreprises',
    nom: 'Aides publiques aux entreprises',
    categorie: 'fiscalite',
    pays: 'tous',
    resume: 'Exonérations de cotisations, niches fiscales, subventions : 112 à 211 Md€ par an en France selon le périmètre retenu.',
    pedagogie: 'La commission d\'enquête du Sénat a chiffré les aides publiques aux entreprises à 211 Md€ en 2023 ; le Haut-Commissariat au Plan retient 112 Md€ sur un périmètre plus étroit. Le Sénat recommande de les conditionner (remboursement en cas de délocalisation ou de licenciements après versement). Les réduire rapporte gros, mais une grande partie sert à baisser le coût du travail peu qualifié : l\'emploi en pâtit.',
    sources: [{ texte: 'Public Sénat : sur quoi repose le calcul des 211 Md€', url: 'https://www.publicsenat.fr/actualites/economie/211-milliards-deuros-daides-publiques-aux-entreprises-sur-quoi-repose-le-calcul-de-la-commission-denquete-du-senat' }],
    options: [
      { id: 'conditionner', nom: 'Conditionner les aides (remboursement en cas de délocalisation)' },
      { id: 'reduire', nom: 'Réduire les aides de 10 %' },
    ],
    delai: 2,
    appliquer(e, o) { e.entreprises.aides = o; if (o === 'conditionner') e.entreprises.bonusSouverainete += 3; },
    annuler(e) { e.entreprises.aides = null; },
    effets(e, o, age) {
      if (o === 'conditionner') return { recettes: { fixe: 0.5 * parPays(e, { etatsUnis: 4, defaut: 1 }) * rampe(age, 8) * indicePrix(e) } };
      const total = parPays(e, { france: 11.2, allemagne: 5, etatsUnis: 15 });
      const r = rampe(age, 4);
      return {
        recettes: { cotisations: 0.4 * total * r * indicePrix(e), fixe: 0.35 * total * r * indicePrix(e) },
        depenses: { economieFinances: -0.25 * total * r * indicePrix(e) },
        chomageStructurel: 0.1 * rampe(age, 8), potentielBonus: -0.01,
      };
    },
    reaction: (e, o) => (o === 'reduire'
      ? { chocs: { entrepreneurs: -8, agriculteurs: -3, salaries: 1 }, credibilite: 0.08 }
      : { chocs: { salaries: 3, jeunes: 2, entrepreneurs: -3 } }),
    axes: { marche: -0.4, fiscal: 0.3 },
    axesParOption: { reduire: { marche: -0.6, rigueur: 0.6, fiscal: 0.4 }, conditionner: { social: 0.3, marche: -0.3 } },
    chiffrage: 'Réduire de 10 % : environ 11 Md€ en France (10 % du périmètre du Haut-Commissariat au Plan), 5 Md€ en Allemagne, 15 Md$ aux États-Unis (hypothèses de jeu).',
  },
  {
    id: 'rachats_actions',
    nom: 'Taxer les rachats d\'actions',
    categorie: 'fiscalite',
    pays: 'tous',
    resume: 'Les grands groupes rachètent leurs propres actions pour soutenir leur cours : faut-il taxer cette pratique plutôt que l\'investissement ?',
    pedagogie: 'Les États-Unis taxent les rachats d\'actions à 1 % depuis 2023 (Inflation Reduction Act) ; quadrupler ce taux a été proposé en 2024. L\'effet sur l\'investissement est débattu : les rachats rendent aux actionnaires des liquidités qui peuvent être réinvesties ailleurs.',
    options: [{ id: 'oui', nom: 'Taxe de 4 % sur les rachats d\'actions' }],
    delai: 2,
    appliquer(e) { e.entreprises.rachats = true; },
    annuler(e) { e.entreprises.rachats = false; },
    effets: (e, o, age) => ({ recettes: { impotSocietes: parPays(e, { france: 1, allemagne: 0.6, etatsUnis: 15 }) * rampe(age, 4) * indicePrix(e) } }),
    reaction: () => ({ chocs: { entrepreneurs: -3, salaries: 1 } }),
    axes: { fiscal: 0.5, marche: -0.3 },
    chiffrage: 'Hypothèses de jeu : environ 1 Md€ en France, 0,6 Md€ en Allemagne, 15 Md$ aux États-Unis par an.',
  },

  // ======================================================================
  // ÉTATS-UNIS
  // ======================================================================
  {
    id: 'social_security',
    nom: 'Sauver la Social Security',
    categorie: 'retraites',
    horsReconciliation: true, // la règle Byrd interdit de toucher la Social Security par réconciliation
    pays: ['etatsUnis'],
    resume: 'Le fonds de retraite (OASI) sera épuisé fin 2032 : sans réforme, les pensions baisseront alors automatiquement d\'environ 20 %.',
    pedagogie: 'Selon le rapport des administrateurs de juin 2026, les réserves combinées de la Social Security sont tombées à 2 560 Md$ fin 2025 (−160 Md$ en un an) ; le fonds retraite serait épuisé au T4 2032 et le fonds combiné au T3 2034. Ensuite, les cotisations ne financent plus qu\'environ 78 à 81 % des pensions promises. Aucune réforme ne peut passer par la réconciliation : il faut 60 sénateurs, donc des voix démocrates. Les ordres de grandeur publiés : supprimer le plafond des cotisations comblerait de la moitié (CBO) aux deux tiers (actuaire en chef) du déficit à 75 ans ; passer à l\'indice des prix « chaîné » environ 17 % ; relever l\'âge du taux plein de 67 à 68 ans environ 12 %.',
    sources: [
      { texte: 'Rapport 2026 des administrateurs (communiqué SSA)', url: 'https://www.ssa.gov/news/en/press/releases/2026-06-09.html' },
      { texte: 'CRS : principaux résultats du rapport 2026', url: 'https://www.everycrsreport.com/reports/IF13256.html' },
      { texte: 'CRFB : supprimer le plafond suffit-il ?', url: 'https://www.crfb.org/blogs/can-social-securitys-shortfall-be-closed-simply-raising-taxes-or-means-testing-benefits' },
    ],
    options: [
      { id: 'plafond', nom: 'Soumettre aux cotisations les salaires au-delà de 250 000 $', description: 'Plafond actuel : 184 500 $ en 2026 (192 300 $ en 2027). Réclamé par les démocrates ; refusé par la majorité des républicains.' },
      { id: 'indexation_chainee', nom: 'Revaloriser les pensions sur l\'indice des prix « chaîné »', description: 'Environ 0,25 point de revalorisation en moins chaque année.' },
      { id: 'age_69', nom: 'Porter l\'âge du taux plein à 69 ans (3 mois par an)', description: 'Proposé par le Republican Study Committee ; très impopulaire.' },
      { id: 'paquet', nom: 'Paquet bipartisan : plafond relevé + indice chaîné + âge à 68 ans', description: 'Inspiré des commissions bipartisanes (Simpson-Bowles, 2010).' },
    ],
    delai: 2,
    appliquer(e, o) {
      if (o === 'indexation_chainee' || o === 'paquet') e.retraites.ecartIndexation += 0.25;
      if (o === 'age_69') { e.retraites.ageCible = 69; e.retraites.rythme = 0.25; }
      if (o === 'paquet') { e.retraites.ageCible = 68; e.retraites.rythme = 0.25; }
    },
    annuler(e, o) {
      if (o === 'indexation_chainee' || o === 'paquet') e.retraites.ecartIndexation -= 0.25;
      if (o === 'age_69' || o === 'paquet') { e.retraites.ageCible = 67; }
    },
    effets(e, o, age) {
      if (o !== 'plafond' && o !== 'paquet') return {};
      // 12,4 % sur les salaires au-delà de 250 000 $ (environ 1 400 Md$, estimation), moins les réactions (optimisation)
      const montant = (o === 'plafond' ? 140 : 90) * rampe(age, 4) * indicePrix(e);
      return { recettes: { cotisations: montant }, fondsSS: montant, potentielBonus: -0.01 };
    },
    reaction: (e, o) => ({
      plafond: { chocs: { entrepreneurs: -6, salaries: 2, retraites: 3, jeunes: 2 }, credibilite: 0.05 },
      indexation_chainee: { chocs: { retraites: -6 }, grief: { retraites: 4 }, credibilite: 0.08 },
      age_69: { chocs: { salaries: -8, jeunes: -4, retraites: -2 }, grief: { salaries: 6, jeunes: 3 }, credibilite: 0.1 },
      paquet: { chocs: { salaries: -3, retraites: -3, entrepreneurs: -3 }, grief: { salaries: 2, retraites: 2 }, credibilite: 0.15 },
    }[o]),
    axes: { retraites: 0.5, rigueur: 0.5 },
    axesParOption: { plafond: { retraites: -0.3, fiscal: 0.8, social: 0.4, rigueur: 0.3 }, age_69: { retraites: 1, social: -0.4 }, indexation_chainee: { social: -0.3 } },
    chiffrage: 'Plafond porté au-delà de 250 000 $ : environ 140 Md$ par an (hypothèse de jeu : 12,4 % d\'un montant estimé de salaires au-delà du seuil, moins l\'optimisation). Indice chaîné : environ 0,25 point de revalorisation en moins par an, cumulatif.',
  },
  {
    id: 'aca_subventions',
    nom: 'Rétablir les aides renforcées à l\'assurance santé (Obamacare)',
    categorie: 'sante',
    pays: ['etatsUnis'],
    resume: 'Les crédits d\'impôt renforcés de l\'ACA ont expiré le 1er janvier 2026, après l\'échec de deux votes au Sénat ; la Chambre a voté en janvier 2026 une prolongation de trois ans (230 voix contre 196), sans adoption connue au Sénat (à vérifier). C\'était l\'enjeu du shutdown d\'octobre-novembre 2025.',
    pedagogie: 'La CBO a estimé en septembre 2025 que prolonger durablement ces aides coûterait environ 350 Md$ sur 10 ans, couvrirait 3,8 millions de personnes de plus et ferait baisser de 7,6 % les primes de référence. C\'est la première demande des démocrates dans toute négociation budgétaire.',
    sources: [
      { texte: 'CBO, septembre 2025 (via States Newsroom)', url: 'https://floridaphoenix.com/2025/09/18/repub/permanent-extension-of-federal-health-care-subsidies-estimated-to-cost-350-billion/' },
      { texte: 'Ballotpedia : la Chambre adopte une prolongation de trois ans (janvier 2026)', url: 'https://news.ballotpedia.org/2026/01/12/house-passes-three-year-extension-of-expanded-aca-subsidies/' },
      { texte: 'ASTHO : évolutions législatives 2025-2026 (projet bipartisan CARE Act)', url: 'https://www.astho.org/communications/blog/2026/aca-enhanced-premium-tax-credits-legislative-developments-2025-2026/' },
    ],
    options: [
      { id: 'retablir', nom: 'Rétablir durablement les aides renforcées' },
      { id: 'temporaire', nom: 'Les rétablir pour deux ans, avec plafond de revenus et prime minimale (projet bipartisan CARE Act)' },
    ],
    delai: 1,
    effets: (e, o, age) => ({ depenses: { sante: (o === 'retablir' ? 35 : 22) * indicePrix(e) * (o === 'temporaire' && age >= 8 ? 0 : 1) }, menages: Object.fromEntries(['couple', 'artisan', 'jeune'].map((id) => [id, [{ montant: o === 'retablir' ? 120 : 80, texte: 'Aide à l\'assurance santé (ACA)' }]])) }),
    reaction: () => ({ chocs: { salaries: 4, jeunes: 4, entrepreneurs: 3, retraites: 1 }, opinion: { salaries: 2 }, credibilite: -0.05 }),
    axes: { social: 0.8, rigueur: -0.4 },
    chiffrage: 'CBO : environ 350 Md$ sur 10 ans pour une prolongation durable (35 Md$ par an) ; la version temporaire est une hypothèse de jeu.',
  },
  {
    id: 'salaire_minimum_federal',
    nom: 'Relever le salaire minimum fédéral (7,25 $ depuis 2009)',
    categorie: 'travail',
    pays: ['etatsUnis'],
    resume: 'Inchangé depuis 2009 ; 30 États appliquent déjà un minimum plus élevé.',
    pedagogie: 'En 2021, la CBO estimait qu\'un minimum à 15 $ en 2025 sortirait 0,9 million de personnes de la pauvreté et augmenterait les revenus de 17 millions de salariés, mais pourrait supprimer environ 1,4 million d\'emplois (fourchette de 0 à 3,7 millions). L\'effet dépend du niveau des salaires locaux : il est faible là où les salaires dépassent déjà 15 $.',
    sources: [{ texte: 'CBO, The Budgetary Effects of the Raise the Wage Act of 2021', url: 'https://www.cbo.gov/publication/56975' }],
    options: [
      { id: 'quinze', nom: '15 $ de l\'heure en quatre ans' },
      { id: 'douze', nom: '12 $ de l\'heure, puis indexé sur les salaires' },
    ],
    delai: 2,
    effets: (e, o, age) => {
      const r = rampe(age, 16);
      return { chomageStructurel: (o === 'quinze' ? 0.4 : 0.15) * r, depenses: { protectionSociale: -(o === 'quinze' ? 12 : 5) * r * indicePrix(e) }, chocPrix: age < 16 ? (o === 'quinze' ? 0.03 : 0.01) : 0, menages: { jeune: [{ montant: (o === 'quinze' ? 180 : 60) * r, texte: 'Hausse du salaire minimum' }] } };
    },
    reaction: (e, o) => ({ chocs: { jeunes: o === 'quinze' ? 6 : 3, salaries: 3, entrepreneurs: o === 'quinze' ? -7 : -3, agriculteurs: -3 }, opinion: { jeunes: 2 } }),
    axes: { social: 0.6, marche: -0.6, travail: -0.2 },
    chiffrage: 'Ordres de grandeur CBO (2021) pour 15 $ : 0,9 M de personnes sorties de la pauvreté, environ 1,4 M d\'emplois en moins (médiane). Le jeu traduit ce dernier effet par +0,4 point de chômage structurel (hypothèse).',
  },
];

/** Répartit une variation de masse salariale publique sur les postes, au prorata de leur personnel. */
function repartirSurPersonnel(e, montant) {
  const total = masseSalarialePublique(e);
  const depenses = {};
  if (!total) return depenses;
  for (const [id, part] of Object.entries(compositionPersonnel(e))) {
    if (!e.budget[id]) continue;
    depenses[id] = montant * (e.budget[id].montant * part) / total;
  }
  return depenses;
}

/**
 * Véhicule législatif des réformes communes (France). Les textes financiers
 * (PLF, PLFSS) peuvent passer par le 49.3 sans limite ; un décret n'est pas voté.
 */
const VEHICULES = {
  retraites_age: 'PLFSS', retraites_indexation: 'PLFSS', retraites_penibilite: 'PLFSS', retraites_minimum: 'PLFSS', retraites_carrieres_longues: 'PLFSS',
  temps_travail: 'loi', fonction_publique_temps: 'loi', gel_point_indice: 'décret', gel_prestations: 'PLFSS', gel_bareme: 'PLF',
  non_remplacement: 'décret', assurance_chomage: 'décret', tva_sociale: 'PLFSS', taxe_hauts_patrimoines: 'PLF', rabot_niches: 'PLF',
  allegements_charges: 'PLFSS', plan_antifraude: 'décret', privatisations: 'décret', bouclier_energie: 'décret', taxe_superprofits: 'PLF',
  surtaxe_grandes_entreprises: 'PLF', aides_entreprises: 'PLF', rachats_actions: 'PLF',
};
for (const r of REFORMES_COMMUNES) if (!r.vehicule && VEHICULES[r.id]) r.vehicule = VEHICULES[r.id];

/**
 * Orientation indicative des réformes existantes (les nouvelles la portent
 * directement). Beaucoup de réformes se discutent des deux côtés : seules
 * celles dont l'inspiration est nette sont classées.
 */
const ORIENTATIONS = {
  liberale: ['annualisation', 'plafond_aides_smic', 'travail_dimanche', 'non_remplacement', 'privatisations', 'tva_sociale', 'cvae', 'capi_per', 'capi_pilier', 'capi_transition', 'capi_mixte', 'jour_ferie', 'agences_operateurs', 'fonction_publique_temps', 'ir_classes_moyennes', 'cumul_emploi_retraite'],
  sociale: ['retraites_penibilite', 'retraites_minimum', 'retraites_carrieres_longues', 'taxe_hauts_patrimoines', 'surtaxe_grandes_entreprises', 'rachats_actions', 'cdhr', 'taxe_holdings', 'prime_activite', 'deserts_medicaux', 'plan_hopital', 'enseignants', 'bouclier_energie', 'taxe_superprofits', 'vie_chere_outremer'],
};
for (const [orientation, ids] of Object.entries(ORIENTATIONS)) for (const r of [...REFORMES_COMMUNES, ...REFORMES_FRANCE]) if (ids.includes(r.id)) r.orientation = orientation;

export const REFORMES = [...REFORMES_COMMUNES, ...REFORMES_FRANCE, ...REFORMES_LIBERALES, ...REFORMES_SOCIALES, ...REFORMES_CONCRETES, ...REFORMES_PROGRAMMES];
