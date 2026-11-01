/**
 * Partis et groupes parlementaires.
 *
 * Les sièges viennent des données sourcées (countries/*.json). Les positions
 * sur les axes politiques (−1 à +1) sont des hypothèses de jeu, choisies pour
 * refléter les programmes et les votes récents :
 *   social    : +1 = plus de dépenses sociales
 *   fiscal    : +1 = plus d'impôts, surtout sur les hauts revenus et le capital
 *   retraites : +1 = accepte de travailler plus longtemps
 *   travail   : +1 = favorable à l'allongement du temps de travail
 *   ecologie  : +1 = priorité à la transition écologique
 *   europe    : +1 = favorable à l'intégration européenne
 *   marche    : +1 = favorable aux entreprises, à la concurrence
 *   securite  : +1 = priorité à la défense et à la sécurité
 *   rigueur   : +1 = priorité à la réduction du déficit
 *
 * posture : 'gouvernement', 'soutien' (soutien sans participation),
 *           'pivot' (vote au cas par cas), 'opposition'.
 */
export const PARTIS = {
  france: [
    { id: 'RN', nom: 'Rassemblement national', posture: 'opposition', couleur: '#1b2a6b', axes: { social: 0.4, fiscal: -0.3, retraites: -0.8, travail: -0.2, ecologie: -0.6, europe: -0.8, marche: 0, securite: 0.9, rigueur: 0.1 }, seuilCensure: -0.5 },
    { id: 'EPR', nom: 'Ensemble pour la République', posture: 'gouvernement', couleur: '#f2b630', axes: { social: -0.2, fiscal: -0.5, retraites: 0.6, travail: 0.6, ecologie: 0.2, europe: 0.9, marche: 0.7, securite: 0.4, rigueur: 0.7 } },
    { id: 'LFI', nom: 'La France insoumise', posture: 'opposition', couleur: '#c2185b', axes: { social: 1, fiscal: 1, retraites: -1, travail: -0.8, ecologie: 0.8, europe: -0.3, marche: -1, securite: -0.5, rigueur: -0.8 }, seuilCensure: 0.5 },
    { id: 'SOC', nom: 'Socialistes et apparentés', posture: 'pivot', couleur: '#e91e63', axes: { social: 0.7, fiscal: 0.7, retraites: -0.6, travail: -0.4, ecologie: 0.6, europe: 0.8, marche: -0.3, securite: 0, rigueur: -0.2 }, seuilCensure: -0.6 },
    { id: 'DR', nom: 'Droite républicaine', posture: 'soutien', couleur: '#1565c0', axes: { social: -0.4, fiscal: -0.8, retraites: 0.8, travail: 0.8, ecologie: -0.3, europe: 0.3, marche: 0.8, securite: 0.9, rigueur: 0.9 }, seuilCensure: -1.5 },
    { id: 'ECOS', nom: 'Écologiste et social', posture: 'opposition', couleur: '#43a047', axes: { social: 0.7, fiscal: 0.8, retraites: -0.7, travail: -0.5, ecologie: 1, europe: 0.8, marche: -0.5, securite: -0.3, rigueur: -0.3 }, seuilCensure: 0 },
    { id: 'DEM', nom: 'Les Démocrates', posture: 'gouvernement', couleur: '#ff9800', axes: { social: 0, fiscal: -0.2, retraites: 0.4, travail: 0.3, ecologie: 0.3, europe: 0.9, marche: 0.4, securite: 0.3, rigueur: 0.6 } },
    { id: 'HOR', nom: 'Horizons et indépendants', posture: 'gouvernement', couleur: '#29b6f6', axes: { social: -0.3, fiscal: -0.6, retraites: 0.7, travail: 0.7, ecologie: 0.1, europe: 0.8, marche: 0.8, securite: 0.6, rigueur: 0.9 } },
    { id: 'GDR', nom: 'Gauche démocrate et républicaine', posture: 'opposition', couleur: '#b71c1c', axes: { social: 1, fiscal: 0.9, retraites: -1, travail: -0.7, ecologie: 0.4, europe: -0.2, marche: -0.8, securite: -0.2, rigueur: -0.7 }, seuilCensure: 0.3 },
    // Sièges non ventilés dans les données sourcées (50) : répartition estimée pour le jeu
    { id: 'LIOT', nom: 'LIOT et non-inscrits (répartition estimée)', posture: 'pivot', couleur: '#9e9e9e', axes: { social: 0.2, fiscal: 0, retraites: -0.2, travail: 0.1, ecologie: 0.2, europe: 0.4, marche: 0.2, securite: 0.3, rigueur: 0.4 }, seuilCensure: -1.2, siegesEstimes: 34, estimation: true },
    { id: 'UDR', nom: 'UDR (alliés du RN, répartition estimée)', posture: 'opposition', couleur: '#283593', axes: { social: 0, fiscal: -0.8, retraites: 0.2, travail: 0.5, ecologie: -0.7, europe: -0.6, marche: 0.6, securite: 0.9, rigueur: 0.4 }, seuilCensure: -0.4, siegesEstimes: 16, estimation: true },
  ],
  allemagne: [
    { id: 'CDUCSU', nom: 'CDU/CSU', posture: 'gouvernement', couleur: '#212121', axes: { social: -0.3, fiscal: -0.7, retraites: 0.5, travail: 0.7, ecologie: 0, europe: 0.6, marche: 0.8, securite: 0.8, rigueur: 0.8 } },
    { id: 'SPD', nom: 'SPD', posture: 'gouvernement', couleur: '#e53935', partenaire: true, axes: { social: 0.7, fiscal: 0.5, retraites: -0.6, travail: -0.3, ecologie: 0.5, europe: 0.8, marche: -0.1, securite: 0.4, rigueur: -0.2 } },
    { id: 'AFD', nom: 'AfD', posture: 'opposition', couleur: '#039be5', axes: { social: 0.2, fiscal: -0.6, retraites: -0.6, travail: 0.1, ecologie: -1, europe: -1, marche: 0.3, securite: 0.8, rigueur: 0.5 } },
    { id: 'GRUENE', nom: 'Bündnis 90/Die Grünen', posture: 'opposition', couleur: '#43a047', axes: { social: 0.5, fiscal: 0.6, retraites: -0.2, travail: 0, ecologie: 1, europe: 1, marche: 0.1, securite: 0.5, rigueur: -0.3 } },
    { id: 'LINKE', nom: 'Die Linke', posture: 'opposition', couleur: '#8e24aa', axes: { social: 1, fiscal: 1, retraites: -1, travail: -0.8, ecologie: 0.6, europe: 0.2, marche: -1, securite: -0.6, rigueur: -0.8 } },
    { id: 'SSW', nom: 'SSW', posture: 'pivot', couleur: '#1e88e5', axes: { social: 0.4, fiscal: 0.2, retraites: -0.2, travail: 0, ecologie: 0.4, europe: 0.6, marche: 0, securite: 0, rigueur: 0 } },
  ],
  // Chambre des représentants. Aux États-Unis, l'axe « europe » se lit comme l'attachement aux
  // alliances et au multilatéralisme (OTAN, libre-échange, organisations internationales).
  etatsUnis: [
    { id: 'REP', nom: 'Républicains (conférence majoritaire)', posture: 'gouvernement', couleur: '#c62828', axes: { social: -0.5, fiscal: -0.9, retraites: -0.2, travail: 0.4, ecologie: -0.8, europe: -0.6, marche: 0.5, securite: 0.9, rigueur: 0.2 }, siegesEstimes: 187, estimation: true },
    // Le Freedom Caucus ne publie pas sa liste de membres : environ 30 élus (estimation)
    { id: 'FREEDOM', nom: 'Freedom Caucus (aile droite républicaine, effectif estimé)', posture: 'soutien', couleur: '#7f0000', axes: { social: -0.9, fiscal: -1, retraites: 0.3, travail: 0.5, ecologie: -1, europe: -0.9, marche: 0.6, securite: 0.7, rigueur: 1 }, siegesEstimes: 30, estimation: true },
    { id: 'DEM', nom: 'Démocrates (et l\'élu indépendant apparenté)', posture: 'opposition', couleur: '#1565c0', axes: { social: 0.8, fiscal: 0.7, retraites: -0.7, travail: -0.3, ecologie: 0.8, europe: 0.7, marche: -0.3, securite: 0.2, rigueur: -0.1 }, siegesEstimes: 215 },
  ],
};

/**
 * Intentions de vote de départ (pour les élections simulées). Sources : voir
 * countries/*.json (France : Ifop-Fiducial du 30/09/2026 ; Allemagne :
 * INSA, YouGov, DeutschlandTrend d'octobre 2026). Les partis non couverts par
 * les sources sont des estimations.
 */
export const SONDAGES_DEPART = {
  france: {
    presidentielle2ndTour: { camp: 50, rn: 50, note: 'Second tour : Odoxa (mars 2026) donnait Philippe 52 % contre Bardella 48 % ; d\'autres sondages donnent le RN gagnant. Point de départ du jeu : 50/50 (estimation).' },
  },
  etatsUnis: {
    presidentielle: { camp: 50, note: 'Élection de 2028 : point de départ 50/50 (estimation), modulé par la popularité et l\'économie.' },
  },
  allemagne: {
    intentions: { CDUCSU: 19, AFD: 28, SPD: 14, GRUENE: 11, LINKE: 10, autres: 18 },
    note: 'CDU/CSU 18-20 % et AfD 27-30 % (sourcés) ; SPD, Verts et Linke estimés.',
  },
};

/**
 * Engagements de l'accord de coalition allemand suivis par le jeu (CDU/CSU-SPD, 2025).
 * Formulations simplifiées, à vérifier dans le texte de l'accord.
 */
export const ACCORD_COALITION = [
  { id: 'pas_hausse_impots', nom: 'Pas de hausse de l\'impôt sur le revenu ni de la TVA', porteur: 'CDUCSU', test: (e) => e.impots.impotRevenu.taux <= 100 && e.impots.tva.taux <= 19 },
  { id: 'retraites_48', nom: 'Taux de remplacement des retraites garanti à 48 % jusqu\'en 2031', porteur: 'SPD', test: (e) => !e.retraites.gel || Object.keys(e.retraites.gel).length === 0 },
  { id: 'frein_respecte', nom: 'Respect du frein à l\'endettement', porteur: 'CDUCSU', test: (e) => !(e.finances.depassementsSchuldenbremse > 0) },
  { id: 'investissement', nom: 'Investir dans les infrastructures (fonds spécial de 500 Md€)', porteur: 'SPD', test: (e) => (e.budget.transports.variationVolume ?? 0) >= 0 && (e.budget.ecologieEnergie.variationVolume ?? 0) >= 0 },
  { id: 'defense', nom: 'Hausse continue de la défense (objectif OTAN)', porteur: 'CDUCSU', test: (e) => (e.budget.defense.variationVolume ?? 0) >= 0 },
  { id: 'pas_67_plus', nom: 'Pas de recul de l\'âge légal au-delà de 67 ans', porteur: 'SPD', test: (e) => e.retraites.ageCible <= 67.01 },
  { id: 'prestations', nom: 'Pas de gel des prestations sociales', porteur: 'SPD', test: (e) => !e.politiqueSociale.gel },
];
