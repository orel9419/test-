/**
 * Contrôle de constitutionnalité des réformes.
 *
 * En France, une loi contestée est presque toujours déférée au Conseil
 * constitutionnel (60 députés ou 60 sénateurs suffisent), qui peut la censurer
 * en tout ou en partie avant sa promulgation. Une loi adoptée par référendum
 * échappe à ce contrôle (décision n° 62-20 DC du 6 novembre 1962), de même
 * qu'une révision de la Constitution.
 *
 * `risque` : probabilité de censure dans le jeu (hypothèse), selon la
 * jurisprudence connue. `type` : 'totale' (la réforme ne s'applique pas) ou
 * 'partielle' (des dispositions tombent : effets réduits d'environ 40 %).
 * Les précédents cités sont réels ; les probabilités sont des estimations de jeu.
 */

export const JURIDICTIONS = {
  france: 'Conseil constitutionnel',
  allemagne: 'Cour constitutionnelle fédérale (Karlsruhe)',
  etatsUnis: 'Cour suprême',
};

export const RISQUES_CONSTITUTIONNELS = {
  taxe_hauts_patrimoines: {
    france: {
      risque: 0.4, type: 'totale',
      motif: 'Caractère confiscatoire et égalité devant les charges publiques (article 13 de la Déclaration de 1789), surtout si les biens professionnels sont taxés.',
      precedent: 'En décembre 2012, le Conseil a censuré la taxe à 75 % sur les très hauts revenus (décision n° 2012-662 DC).',
    },
    allemagne: {
      risque: 0.35, type: 'totale',
      motif: 'Égalité devant l\'impôt : les biens doivent être évalués de façon homogène (immobilier, entreprises, placements).',
      precedent: 'En 1995, la Cour constitutionnelle fédérale a jugé l\'impôt sur la fortune contraire à la Loi fondamentale tel qu\'il était appliqué ; il n\'est plus prélevé depuis 1997.',
    },
    etatsUnis: {
      risque: 0.5, type: 'totale',
      motif: 'Un impôt fédéral « direct » doit être réparti entre les États selon leur population (article I de la Constitution) : un impôt sur la fortune serait très exposé.',
      precedent: 'En 2024 (Moore v. United States), la Cour suprême a évité de trancher la question d\'un impôt sur la fortune.',
    },
  },
  ifi: {
    france: {
      options: { isf: 0.15 }, type: 'partielle',
      motif: 'Sans plafonnement en fonction des revenus, un impôt sur la fortune peut devenir confiscatoire.',
      precedent: 'Le Conseil a plusieurs fois rappelé cette exigence de plafonnement lors des réformes de l\'ISF (notamment en 2012).',
    },
  },
  oqtf: {
    france: {
      options: { retention: 0.35 }, type: 'partielle',
      motif: 'Liberté individuelle (article 66 de la Constitution) : la privation de liberté doit rester strictement nécessaire et proportionnée.',
      precedent: 'Le 7 août 2025, le Conseil a censuré l\'allongement à 180 ou 210 jours de la rétention de certains étrangers jugés dangereux (décision n° 2025-895 DC). Une nouvelle loi, mieux encadrée, a ensuite été validée sous réserves.',
    },
  },
  immigration_travail: {
    france: {
      options: { durcir: 0.35 }, type: 'partielle',
      motif: 'Droit de mener une vie familiale normale, égalité, et « cavaliers » (articles sans lien avec le texte initial).',
      precedent: 'En janvier 2024, le Conseil a censuré 35 des 86 articles de la loi immigration, dont 32 comme cavaliers législatifs.',
    },
  },
  polices_municipales: {
    france: {
      risque: 0.35, type: 'partielle',
      motif: 'Les missions de police judiciaire doivent rester sous la direction et le contrôle de l\'autorité judiciaire (article 66).',
      precedent: 'Le 20 mai 2021, le Conseil a censuré l\'élargissement expérimental des pouvoirs de police judiciaire des polices municipales prévu par la loi « sécurité globale » (décision n° 2021-817 DC).',
    },
  },
  peines_planchers: {
    france: {
      risque: 0.2, type: 'partielle',
      motif: 'Individualisation des peines (article 8 de la Déclaration de 1789) : le juge doit pouvoir y déroger.',
      precedent: 'En 2007, le Conseil a validé les peines planchers parce que le juge pouvait y déroger par une décision motivée (décision n° 2007-554 DC).',
    },
  },
  narcotrafic: {
    france: {
      options: { offensive: 0.3 }, type: 'partielle',
      motif: 'Droits de la défense et respect de la vie privée (techniques d\'enquête, régimes de détention).',
      precedent: 'Les lois pénales et de procédure pénale sont fréquemment censurées en partie.',
    },
  },
  lfi_ultra_riches: {
    france: {
      options: { annonce: 0.35, prudent: 0.35 }, type: 'partielle',
      motif: 'Taxe Zucman : caractère confiscatoire et égalité devant les charges publiques (article 13 de la Déclaration de 1789), surtout si les biens professionnels sont taxés ; la réforme des successions est moins exposée.',
      precedent: 'En décembre 2012, le Conseil a censuré la taxe à 75 % sur les très hauts revenus (décision n° 2012-662 DC).',
    },
  },
  lfi_fiscalite_2017: {
    france: {
      options: { annonce: 0.15, prudent: 0.15 }, type: 'partielle',
      motif: 'Un impôt sur la fortune renforcé, sans plafonnement en fonction des revenus, peut devenir confiscatoire.',
      precedent: 'Le Conseil a plusieurs fois rappelé cette exigence de plafonnement lors des réformes de l\'ISF (notamment en 2012).',
    },
  },
  lfi_grandes_entreprises: {
    france: {
      options: { annonce: 0.2, prudent: 0.2 }, type: 'partielle',
      motif: 'Égalité devant l\'impôt : une taxe sur les multinationales assise sur leur activité mondiale doit reposer sur des critères objectifs et rationnels.',
      precedent: 'En octobre 2017, le Conseil a censuré la contribution de 3 % sur les dividendes (décision n° 2017-660 QPC) : son remboursement a coûté environ 10 Md€ à l\'État.',
    },
  },
  blocage_prix: {
    france: {
      options: { blocage: 0.3, carburant: 0.15 }, type: 'partielle',
      motif: 'Liberté d\'entreprendre (article 4 de la Déclaration de 1789) : un blocage général et durable des prix serait disproportionné.',
      precedent: 'Le Conseil admet des encadrements de prix limités et justifiés par l\'intérêt général ; un blocage général n\'a jamais été jugé.',
    },
  },
  encadrement_loyers: {
    france: {
      risque: 0.15, type: 'partielle',
      motif: 'Droit de propriété et liberté contractuelle des bailleurs.',
      precedent: 'En 2014, le Conseil a validé l\'encadrement des loyers de la loi ALUR, en censurant certaines de ses modalités.',
    },
  },
  ame: {
    france: {
      options: { urgence: 0.15 }, type: 'partielle',
      motif: 'Droit à la protection de la santé (alinéa 11 du Préambule de 1946) : les soins urgents doivent rester garantis.',
      precedent: 'Jamais tranché à ce jour.',
    },
  },
  autoroutes: {
    france: {
      options: { racheter: 0.25 }, type: 'partielle',
      motif: 'Droit de propriété (article 17 de la Déclaration de 1789) : l\'indemnisation des sociétés concessionnaires doit être juste.',
      precedent: 'En janvier 1982, le Conseil a validé le principe des nationalisations mais censuré le mode d\'indemnisation des actionnaires (décision n° 81-132 DC).',
    },
  },
};
