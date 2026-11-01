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

const rampe = (age, n) => Math.min(1, Math.max(0, (age + 1) / n));
const indicePrix = (e) => e.macro.niveauPrix / 100;

/** Masse salariale publique estimée : part « personnel » de chaque poste (Md€/an). */
function masseSalarialePublique(e) {
  // Composition reprise du catalogue des ministères (import paresseux pour éviter un cycle)
  let total = 0;
  for (const [id, l] of Object.entries(e.budget)) total += l.montant * (COMPOSITION_PERSONNEL[id] ?? 0);
  return total;
}
const COMPOSITION_PERSONNEL = { sante: 0.35, education: 0.8, recherche: 0.55, defense: 0.35, affairesEtrangeres: 0.25, interieurJustice: 0.7, culture: 0.4, economieFinances: 0.35, protectionSociale: 0.05, travailEmploi: 0.05 };
const COMPOSITION_TRANSFERTS = { protectionSociale: 0.9, travailEmploi: 0.85, logement: 0.7 };

export const REFORMES = [
  // ======================================================================
  // RETRAITES (France)
  // ======================================================================
  {
    id: 'retraites_age',
    nom: 'Âge légal de départ à la retraite',
    categorie: 'retraites',
    pays: ['france'],
    resume: 'Le levier le plus puissant sur la dépense de retraite, et le plus conflictuel.',
    pedagogie: 'Les retraites représentent 422 Md€ en 2025, soit 14,1 % du PIB et près d\'un quart des dépenses publiques (COR). Il y a 2,5 personnes d\'âge actif pour une personne de 65 ans et plus, et ce ratio tomberait à 1,6 en 2070. Reculer l\'âge réduit le nombre de retraités et augmente le nombre d\'actifs, mais une partie des seniors maintenus ne sont pas en emploi et touchent d\'autres prestations. La réforme de 2023 (64 ans) est suspendue jusqu\'au 01/01/2028 par la LFSS 2026 ; sans nouvelle décision, le relèvement reprend en 2028.',
    sources: [
      { texte: 'COR, rapport annuel 2026', url: 'https://www.cor-retraites.fr/sites/default/files/2026-06/RA_2026_def.pdf' },
      { texte: 'Coût de la suspension (franceinfo)', url: 'https://www.franceinfo.fr/economie/retraite/reforme-des-retraites/la-suspension-de-la-reforme-des-retraites-coutera-1-4-milliard-d-euros-en-2027-les-complementaires-sante-et-les-retraites-mis-a-contribution_7570171.html' },
    ],
    options: [
      { id: 'abrogation_62', nom: 'Abroger la réforme : retour à 62 ans', description: 'Demande de la gauche et, en partie, du RN. Coût élevé et durable.' },
      { id: 'suspension', nom: 'Prolonger la suspension (62 ans et 9 mois)', description: 'Geler l\'âge au niveau actuel au-delà de 2028.' },
      { id: 'acceleration_64', nom: 'Lever la suspension dès 2027 et accélérer : 64 ans en 2029', description: 'Lever la suspension un an plus tôt que prévu, au rythme de 6 mois par an.' },
      { id: 'age_65', nom: 'Aller vers 65 ans (6 mois par an, 65 ans en 2031)', description: 'Position de la droite (LR) et d\'une partie du centre.' },
    ],
    delai: 2,
    appliquer(e, o) {
      const r = e.retraites;
      r.calendrier = 'libre';
      // [âge cible, rythme en années d'âge par an]
      const cibles = { abrogation_62: [62, 0.25], suspension: [62.75, 0], acceleration_64: [64, 0.5], age_65: [65, 0.5] };
      [r.ageCible, r.rythme] = cibles[o];
    },
    effets: () => ({}),
    reaction(e, o) {
      return {
        abrogation_62: { chocs: { salaries: 5, fonctionnaires: 6, jeunes: 2, entrepreneurs: -4 }, opinion: { salaries: 3, fonctionnaires: 3 }, credibilite: -0.3 },
        suspension: { chocs: { salaries: 3, fonctionnaires: 3, entrepreneurs: -2 }, opinion: { salaries: 1 }, credibilite: -0.12 },
        acceleration_64: { chocs: { salaries: -6, fonctionnaires: -6, jeunes: -3, entrepreneurs: 2 }, grief: { salaries: 10, fonctionnaires: 10, jeunes: 4 }, credibilite: 0.12 },
        age_65: { chocs: { salaries: -10, fonctionnaires: -10, jeunes: -5, retraites: 1, entrepreneurs: 3 }, grief: { salaries: 16, fonctionnaires: 16, jeunes: 7 }, credibilite: 0.25 },
      }[o];
    },
    axes: { retraites: 1 },
    axesParOption: { abrogation_62: { retraites: -1, social: 0.5 }, suspension: { retraites: -0.4 }, acceleration_64: { retraites: 0.6 }, age_65: { retraites: 1 } },
    chiffrage: 'Dans le modèle, chaque année d\'âge légal en plus réduit à terme la dépense de pensions d\'environ 10 Md€ par an (environ 400 000 retraités de moins), avant les prestations versées aux seniors sans emploi. Le gouvernement chiffrait la réforme de 2023 à 17,7 Md€ en 2030, avant 4,8 Md€ de mesures d\'accompagnement. La suspension actuelle coûte 0,1 Md€ en 2026 et 1,4 Md€ en 2027.',
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
    axesParOption: { pleine_inflation: { social: 0.5 } },
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
    pedagogie: 'Selon l\'Insee, les salariés à temps complet travaillent déjà 38,8 h par semaine en moyenne (cadres 42 h, employés 37,3 h). Passer à 39 h change donc surtout le seuil des heures majorées de 25 %. Les salariés à 35 h gagnent à travailler plus si les heures sont payées ; ceux qui faisaient déjà des heures supplémentaires peuvent y perdre (fin de la majoration). Exonérer les heures en plus d\'impôt et de cotisations augmente le pouvoir d\'achat, mais coûte au budget.',
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
      }[o];
    },
    axes: { travail: 1 },
    axesParOption: { heures_sup_libres: { travail: 0.4, fiscal: -0.3 }, '39h_non_payees': { travail: 1, social: -0.7 }, '39h_exo2': { travail: 0.8, fiscal: -0.3 }, '39h_exo4': { travail: 0.8, fiscal: -0.5 } },
    chiffrage: 'Modèle : 39 h ferait gagner de l\'ordre de 0,5 à 0,8 % de PIB potentiel à terme, selon l\'adhésion. Les exonérations coûtent environ 1 à 3 Md€ par an. Les heures supplémentaires défiscalisées actuelles coûtent environ 2 Md€ par an (franceinfo).',
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
    pays: 'tous',
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
      e.politiqueSociale.rendementPatrimoine = (4 + 12 * tirage) * (e.pays === 'allemagne' ? 1.3 : 1);
    },
    effets(e, o, age) {
      const r0 = e.politiqueSociale.rendementPatrimoine ?? 0;
      return { recettes: { fixe: r0 * Math.pow(0.97, age) * indicePrix(e) }, potentielBonus: -0.03 };
    },
    reaction: () => ({ chocs: { entrepreneurs: -8, jeunes: 3, salaries: 3, fonctionnaires: 2 }, opinion: { jeunes: 2, salaries: 2 }, credibilite: -0.05 }),
    axes: { fiscal: 0.8, social: 0.6, marche: -0.6 },
    chiffrage: 'Fourchette d\'hypothèses du jeu : 4 à 16 Md€ par an (France), en érosion de 3 % par trimestre (départs, optimisation).',
  },
  {
    id: 'rabot_niches',
    nom: 'Réduire de 10 % les niches fiscales',
    categorie: 'fiscalite',
    pays: 'tous',
    resume: 'Raboter crédits et réductions d\'impôt (emploi à domicile, investissement locatif, crédit d\'impôt recherche...).',
    options: [{ id: 'oui', nom: 'Rabot de 10 % sur les dépenses fiscales' }],
    delai: 2,
    effets: (e, o, age) => ({ recettes: { fixe: (e.pays === 'france' ? 8 : 6) * rampe(age, 4) * indicePrix(e) }, potentielBonus: -0.01 }),
    reaction: () => ({ chocs: { entrepreneurs: -4, salaries: -2, retraites: -1 }, credibilite: 0.08 }),
    axes: { fiscal: 0.5 },
    chiffrage: 'Hypothèse de jeu : 8 Md€ par an en France, 6 Md€ en Allemagne.',
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
    effets: (e, o, age) => ({ recettes: { fixe: 3 * rampe(age, 8) * indicePrix(e) }, depenses: { economieFinances: 0.3 * indicePrix(e) } }),
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
    effets: (e) => ({ recettes: { fixe: Math.max(0, (e.monde.energie - 130) / 100) * (e.pays === 'allemagne' ? 4 : 3) } }),
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
];

/** Répartit une variation de masse salariale publique sur les postes, au prorata de leur personnel. */
function repartirSurPersonnel(e, montant) {
  const total = masseSalarialePublique(e);
  const depenses = {};
  if (!total) return depenses;
  for (const [id, part] of Object.entries(COMPOSITION_PERSONNEL)) {
    if (!e.budget[id]) continue;
    depenses[id] = montant * (e.budget[id].montant * part) / total;
  }
  return depenses;
}
