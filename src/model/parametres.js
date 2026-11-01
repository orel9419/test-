/**
 * Hypothèses de modélisation communes à tous les pays.
 *
 * IMPORTANT : ce fichier ne contient PAS de données sourcées. Il regroupe les
 * paramètres du modèle (multiplicateurs, élasticités, vitesses d'ajustement)
 * choisis dans les fourchettes usuelles de la littérature économique (FMI,
 * OCDE, Commission européenne, Trésor). Chaque valeur est une hypothèse
 * assumée, modifiable, et documentée ici pour rester transparente.
 */

export const PARAMETRES = {
  /**
   * Multiplicateurs budgétaires d'impact : variation du PIB (en points de PIB)
   * provoquée par une hausse de 1 point de PIB de la dépense, selon sa nature.
   * Fourchettes de la littérature pour une économie de la zone euro, sans
   * réaction monétaire propre : investissement 0,8-1,5 ; consommation publique
   * 0,6-1,0 ; transferts 0,3-0,8.
   */
  multiplicateursDepense: {
    personnel: 0.8,
    fonctionnement: 0.7,
    investissement: 1.1,
    transferts: 0.5,
  },

  /**
   * Amplification des multiplicateurs en bas de cycle : le multiplicateur est
   * multiplié par (1 + amplification × |écart de production| / 2) quand
   * l'économie est sous son potentiel (Auerbach-Gorodnichenko, FMI 2012).
   */
  amplificationBasCycle: 0.4,

  /** Persistance trimestrielle de l'écart de production (0 = pas de mémoire). */
  persistanceEcart: 0.8,
  /**
   * Persistance de la composante budgétaire de l'écart : demi-vie d'environ 2 ans,
   * soit un multiplicateur cumulé proche de l'unité sur deux ans pour l'investissement.
   */
  persistanceBudgetaire: 0.92,

  /** Loi d'Okun : baisse du chômage (pt) pour 1 pt d'écart de production. */
  okun: 0.45,
  /** Vitesse de convergence trimestrielle du chômage vers sa cible. */
  vitesseChomage: 0.5,

  /** Courbe de Phillips : effet d'1 pt d'écart de production sur l'inflation sous-jacente (annuelle). */
  pentePhillips: 0.12,
  /** Ancrage des anticipations sur la cible de 2 % de la BCE (0 à 1). */
  ancrageAnticipations: 0.7,
  /** Vitesse d'ajustement trimestrielle de l'inflation sous-jacente vers les anticipations. */
  vitesseInflation: 0.25,
  /** Part d'une hausse de TVA répercutée sur les prix (sur environ un an). */
  repercussionTVA: 0.7,

  /** Banque centrale européenne : règle de Taylor simplifiée et lissée. */
  bce: {
    tauxNeutreReel: 0.25,
    poidsInflationSousJacente: 1.0,
    poidsInflationTotale: 0.25,
    poidsEcart: 0.3,
    lissage: 0.5,
    pas: 0.25,
  },

  /**
   * Taux à 10 ans = taux BCE + prime de terme + prime de risque souverain.
   * Prime de risque (en points) :
   *   a × max(0, dette − 60) / 10
   * + c × (max(0, dette − 100) / 10)²      (convexité : les marchés s'inquiètent plus vite au-delà de 100 %)
   * + b × max(0, déficit − 3)
   * + p × instabilité politique (0 à 1)
   * + crédibilité (écart entre trajectoire annoncée et réalisée)
   * Calibré pour retrouver au premier tour 4,77 % (OAT) et 3,55 % (Bund).
   */
  primeRisque: { a: 0.08, c: 0.12, b: 0.12, p: 0.4, credibilite: 0.15 },
  primeTerme: 0.9,
  /** Écart de taux (pb) au-delà duquel les marchés déclenchent une crise de dette. */
  seuilCriseSpread: 300,

  /** Part des émissions de dette à court terme (titres à moins d'un an). */
  partCourtTerme: 0.2,

  /** Effets différés : stocks de capital et leurs effets sur le PIB potentiel. */
  stocks: {
    recherche: { depreciationAnnuelle: 0.15, delaiTrimestres: 8, elasticitePIB: 0.08 },
    capitalHumain: { depreciationAnnuelle: 0.025, delaiTrimestres: 12, elasticitePIB: 0.25 },
    infrastructures: { depreciationAnnuelle: 0.04, delaiTrimestres: 4, elasticitePIB: 0.08 },
    vert: { depreciationAnnuelle: 0.04, delaiTrimestres: 4, elasticitePIB: 0.02 },
  },

  /** Choc énergétique : effet sur l'écart de production d'une hausse de 10 % du prix mondial de l'énergie. */
  sensibiliteEnergie: { france: 0.10, allemagne: 0.18, defaut: 0.14 },

  /** Popularité : vitesse de retour vers l'ancrage et poids de l'économie. */
  popularite: {
    retourAncrage: 0.15,
    effetChomage: -1.5,       // points par point de chômage au-dessus du niveau initial
    effetInflation: -1.2,     // points par point d'inflation au-dessus de 2 %
    effetPouvoirAchat: 1.5,   // points par % de revenu disponible gagné
    plafondPouvoirAchat: 12,  // effet maximal (en points) du pouvoir d'achat sur l'ancrage
    aversionPerte: 2.0,       // une perte pèse deux fois plus qu'un gain équivalent
    decroissanceChocs: 0.75,  // part d'un choc ponctuel qui subsiste au trimestre suivant
  },

  /** Inertie budgétaire : variation maximale par trimestre selon la nature de la dépense (mode réaliste). */
  inertie: {
    personnel: 0.01,
    fonctionnement: 0.02,
    investissement: 0.06,
    transferts: 0.015,
  },
  /** Multiplicateur d'inertie par mode de jeu (bac à sable = pas d'inertie). */
  inertieParMode: { bac_a_sable: 20, realiste: 1, difficile: 0.8 },
};

/** Paramètres spécifiques au mode de difficulté. */
export const MODES = {
  bac_a_sable: {
    nom: 'Bac à sable',
    description: 'Aucune défaite, pas d\'inertie budgétaire. Pour expérimenter librement.',
    defaitesActives: false,
    nervositeMarches: 0.6,
    frequenceEvenements: 0.6,
    exigencePartenaires: 0.7,
  },
  realiste: {
    nom: 'Réaliste',
    description: 'Calibré sur les données réelles. Les défaites sont actives.',
    defaitesActives: true,
    nervositeMarches: 1.0,
    frequenceEvenements: 1.0,
    exigencePartenaires: 1.0,
  },
  difficile: {
    nom: 'Difficile',
    description: 'Marchés nerveux, plus d\'événements, partenaires plus exigeants.',
    defaitesActives: true,
    nervositeMarches: 1.4,
    frequenceEvenements: 1.4,
    exigencePartenaires: 1.3,
  },
};
