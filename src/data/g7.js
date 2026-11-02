/**
 * G7 : membres, dossiers de négociation, concessions possibles.
 *
 * Le G7 réunit chaque année les dirigeants des États-Unis, de l'Allemagne, du
 * Japon, du Royaume-Uni, de l'Italie, du Canada et de la France, avec l'Union
 * européenne. La présidence tourne dans un ordre fixe (France 2019, États-Unis
 * 2020, Royaume-Uni 2021, Allemagne 2022, Japon 2023, Italie 2024, Canada 2025,
 * France 2026 à Évian…) ; le pays hôte fixe l'agenda. Les décisions se prennent
 * par consensus : il suffit d'un membre très réticent pour bloquer.
 *
 * Positions de départ (−1 opposé, +1 favorable) : hypothèses de jeu fondées sur
 * les positions publiques connues (sommets de Kananaskis 2025 et d'Évian 2026).
 */

export const MEMBRES_G7 = {
  etatsUnis: { nom: 'États-Unis', drapeau: '🇺🇸', poids: 3 },
  allemagne: { nom: 'Allemagne', drapeau: '🇩🇪', poids: 1.5, ue: true },
  france: { nom: 'France', drapeau: '🇫🇷', poids: 1.5, ue: true },
  japon: { nom: 'Japon', drapeau: '🇯🇵', poids: 1.2 },
  royaumeUni: { nom: 'Royaume-Uni', drapeau: '🇬🇧', poids: 1.2 },
  italie: { nom: 'Italie', drapeau: '🇮🇹', poids: 1, ue: true },
  canada: { nom: 'Canada', drapeau: '🇨🇦', poids: 1 },
  ue: { nom: 'Union européenne', drapeau: '🇪🇺', poids: 1 },
};

/** Ordre de rotation de la présidence (2026 : France). */
export const ROTATION_G7 = ['france', 'etatsUnis', 'royaumeUni', 'allemagne', 'japon', 'italie', 'canada'];
export const ANNEE_REFERENCE_G7 = 2026;

/** Dossiers préférés par chaque présidence pour son agenda (hypothèses de jeu). */
export const AGENDA_HOTE = {
  etatsUnis: ['commerce', 'chine', 'energie', 'mineraux'],
  royaumeUni: ['ukraine', 'ia', 'commerce', 'climat'],
  allemagne: ['ukraine', 'commerce', 'climat', 'mineraux'],
  japon: ['chine', 'ia', 'mineraux', 'energie'],
  italie: ['afrique', 'energie', 'ukraine', 'commerce'],
  canada: ['mineraux', 'ukraine', 'climat', 'commerce'],
  france: ['ukraine', 'energie', 'afrique', 'ia'],
};

/**
 * Dossiers. `positions` : position de départ de chaque membre ; `effets(niveau)`
 * renvoie les effets pour le pays joué selon l'issue : 'ambitieux' (accord
 * ambitieux), 'compromis' (déclaration a minima) ou 'echec'.
 * Clés d'effets : relations, influence, credibilite, chocs (opinion),
 * souverainete, modificateurs (exportDurable, facteurEnergie, recettes,
 * potentiel, depense) avec leur durée en trimestres.
 */
export const DOSSIERS_G7 = {
  commerce: {
    nom: 'Commerce et droits de douane',
    description: 'Obtenir une baisse des droits de douane américains sur les exportations européennes et une trêve commerciale.',
    pedagogie: 'Depuis 2025, les États-Unis utilisent les droits de douane comme levier de négociation. L\'Allemagne, très exportatrice, et le Canada y sont les plus exposés. Un accord se paie souvent de concessions : achats d\'énergie et d\'armement américains, ouverture agricole.',
    positions: { etatsUnis: -0.6, allemagne: 0.6, france: 0.4, japon: 0.4, royaumeUni: 0.3, italie: 0.4, canada: 0.6, ue: 0.5 },
    effets: (n) => ({
      ambitieux: { modificateurs: [{ type: 'exportDurable', valeur: 0.12, duree: 8 }], relations: { etatsUnis: 6 }, influence: 2, chocs: { entrepreneurs: 3, agriculteurs: 1 }, texte: 'trêve commerciale et baisse des droits de douane : les exportations repartent' },
      compromis: { modificateurs: [{ type: 'exportDurable', valeur: 0.05, duree: 8 }], relations: { etatsUnis: 2 }, influence: 1, texte: 'gel des nouvelles hausses de droits de douane' },
      echec: { modificateurs: [{ type: 'exportDurable', valeur: -0.04, duree: 4 }], relations: { etatsUnis: -3 }, influence: -1, chocs: { entrepreneurs: -2 }, texte: 'pas d\'accord : les droits de douane restent, les exportateurs s\'inquiètent' },
    }[n]),
  },
  ukraine: {
    nom: 'Ukraine : soutien et avoirs russes gelés',
    description: 'Financer l\'Ukraine en mobilisant les avoirs russes gelés plutôt que les budgets nationaux.',
    pedagogie: 'Environ 210 Md€ d\'avoirs de la banque centrale russe sont gelés dans l\'Union, dont la majorité chez Euroclear en Belgique. En décembre 2025, faute d\'accord sur ces avoirs, l\'Union a prêté 90 Md€ à l\'Ukraine par un emprunt commun. Le Royaume-Uni et le Canada poussent à une mobilisation des avoirs ; Washington oscille.',
    positions: { etatsUnis: -0.2, allemagne: 0.5, france: 0.5, japon: 0.4, royaumeUni: 0.9, italie: 0.3, canada: 0.8, ue: 0.6 },
    effets: (n) => ({
      ambitieux: { relations: { ukraine: 10, ue: 5 }, influence: 3, credibilite: 0.02, modificateurs: [{ type: 'depense', poste: 'defense', valeur: -1.5, duree: 8 }], texte: 'les avoirs russes gelés financeront l\'aide : moins de charge pour votre budget' },
      compromis: { relations: { ukraine: 5 }, influence: 1.5, texte: 'soutien réaffirmé et sanctions renforcées sur le pétrole russe' },
      echec: { relations: { ukraine: -3 }, influence: -1, texte: 'divisions affichées sur l\'Ukraine' },
    }[n]),
  },
  energie: {
    nom: 'Énergie : stocks stratégiques et détroit d\'Ormuz',
    description: 'Libérer des stocks stratégiques de façon coordonnée et sécuriser le détroit d\'Ormuz pour faire baisser les prix.',
    pedagogie: 'Les pays importateurs (Japon, Europe) ont le plus à gagner d\'une action coordonnée ; les producteurs (États-Unis, Canada) moins. Une libération coordonnée de stocks, comme celles de l\'Agence internationale de l\'énergie en 2022, fait baisser les prix pendant quelques mois.',
    positions: { etatsUnis: 0.3, allemagne: 0.7, france: 0.7, japon: 0.9, royaumeUni: 0.5, italie: 0.7, canada: 0.1, ue: 0.8 },
    effets: (n) => ({
      ambitieux: { modificateurs: [{ type: 'facteurEnergie', valeur: 0.88, duree: 6 }], influence: 2, chocs: { salaries: 1, retraites: 1 }, texte: 'libération coordonnée des stocks et escorte navale : les prix de l\'énergie reculent' },
      compromis: { modificateurs: [{ type: 'facteurEnergie', valeur: 0.94, duree: 4 }], influence: 1, texte: 'engagement à libérer des stocks si nécessaire' },
      echec: { influence: -0.5, texte: 'chacun pour soi sur l\'énergie' },
    }[n]),
  },
  fiscalite: {
    nom: 'Taxation des multinationales et du numérique',
    description: 'Appliquer l\'impôt minimum mondial de 15 % aux grands groupes, y compris américains, et préserver les taxes sur les services numériques.',
    pedagogie: 'L\'accord de l\'OCDE de 2021 prévoit un impôt minimum de 15 % sur les bénéfices des multinationales. En juin 2025, le G7 a accepté que les groupes américains en soient exemptés en échange de l\'abandon d\'une mesure de rétorsion fiscale américaine. Le Canada a renoncé à sa taxe sur le numérique la même année sous la pression de Washington. La France applique depuis 2019 une taxe de 3 % sur certains services numériques.',
    positions: { etatsUnis: -0.9, allemagne: 0.3, france: 0.7, japon: 0.3, royaumeUni: 0.2, italie: 0.4, canada: 0.1, ue: 0.6 },
    effets: (n, ambition) => ({
      ambitieux: { modificateurs: [{ type: 'recettes', valeur: 2, duree: 12 }], influence: 2, chocs: { salaries: 1 }, texte: 'impôt minimum appliqué aux grands groupes, y compris américains' },
      compromis: { modificateurs: [{ type: 'recettes', valeur: 0.8, duree: 12 }], influence: 1, texte: 'engagement à lutter contre l\'évasion fiscale' },
      echec: ambition === 'ambitieux'
        ? { relations: { etatsUnis: -5 }, modificateurs: [{ type: 'exportDurable', valeur: -0.03, duree: 4 }], texte: 'échec, et Washington menace de représailles commerciales' }
        : { texte: 'pas d\'accord sur la fiscalité' },
    }[n]),
  },
  mineraux: {
    nom: 'Minerais critiques et chaînes d\'approvisionnement',
    description: 'Réduire la dépendance à la Chine pour le lithium, les terres rares et le graphite : achats groupés, stocks, projets miniers.',
    pedagogie: 'Au sommet de Kananaskis (2025), le G7 a adopté un plan d\'action sur les minerais critiques ; le sujet est revenu à Évian en 2026. C\'est un dossier consensuel : les gains sont modestes mais faciles à obtenir.',
    positions: { etatsUnis: 0.8, allemagne: 0.7, france: 0.7, japon: 0.9, royaumeUni: 0.6, italie: 0.6, canada: 0.9, ue: 0.8 },
    effets: (n) => ({
      ambitieux: { souverainete: 3, modificateurs: [{ type: 'potentiel', valeur: 0.005, duree: 20 }], influence: 1, texte: 'alliance d\'achats et de stocks de minerais critiques' },
      compromis: { souverainete: 1.5, influence: 0.5, texte: 'déclaration sur la diversification des approvisionnements' },
      echec: { texte: 'pas d\'avancée sur les minerais' },
    }[n]),
  },
  ia: {
    nom: 'Intelligence artificielle et protection des mineurs en ligne',
    description: 'Des règles communes pour l\'IA et la protection des enfants sur les réseaux sociaux.',
    pedagogie: 'L\'Europe a adopté l\'AI Act ; les États-Unis privilégient la déréglementation pour soutenir leurs champions. Le Japon porte le « processus d\'Hiroshima » sur l\'IA depuis 2023. La protection des mineurs en ligne a fait l\'objet d\'une déclaration à Évian.',
    positions: { etatsUnis: -0.3, allemagne: 0.5, france: 0.7, japon: 0.6, royaumeUni: 0.3, italie: 0.4, canada: 0.5, ue: 0.8 },
    effets: (n) => ({
      ambitieux: { influence: 2, souverainete: 1.5, modificateurs: [{ type: 'potentiel', valeur: 0.003, duree: 20 }], chocs: { retraites: 1 }, texte: 'charte commune sur l\'IA et la protection des mineurs' },
      compromis: { influence: 1, texte: 'principes non contraignants sur l\'IA' },
      echec: { texte: 'pas d\'accord sur l\'IA' },
    }[n]),
  },
  climat: {
    nom: 'Climat et financement de la transition',
    description: 'Réaffirmer la sortie des énergies fossiles et financer la transition des pays du Sud.',
    pedagogie: 'Les États-Unis sont sortis de l\'accord de Paris en 2025 : un texte climat ambitieux au G7 suppose de les isoler ou de les faire céder. Les Européens et le Royaume-Uni y tiennent ; le Japon et l\'Italie sont plus prudents.',
    positions: { etatsUnis: -0.9, allemagne: 0.6, france: 0.8, japon: 0.3, royaumeUni: 0.6, italie: 0.3, canada: 0.4, ue: 0.9 },
    effets: (n) => ({
      ambitieux: { influence: 3, relations: { afrique: 5, ue: 3 }, chocs: { jeunes: 2 }, texte: 'engagement commun sur le climat et la finance verte' },
      compromis: { influence: 1.5, relations: { afrique: 2 }, texte: 'déclaration climat a minima' },
      echec: { influence: -1, chocs: { jeunes: -1 }, texte: 'le climat disparaît du communiqué' },
    }[n]),
  },
  afrique: {
    nom: 'Afrique, dette et santé mondiale',
    description: 'Restructurer la dette des pays pauvres et financer la santé mondiale (Ebola, vaccins).',
    pedagogie: 'Les coupes dans l\'aide américaine (démantèlement de l\'USAID en 2025) et britannique ont réduit les financements ; l\'Italie porte un « plan Mattei » pour l\'Afrique. À Évian, le G7 a annoncé plus d\'un milliard de dollars contre Ebola. Le coût budgétaire est faible, le gain d\'influence réel.',
    positions: { etatsUnis: -0.4, allemagne: 0.3, france: 0.7, japon: 0.4, royaumeUni: 0, italie: 0.6, canada: 0.4, ue: 0.6 },
    effets: (n) => ({
      ambitieux: { relations: { afrique: 10 }, influence: 3, modificateurs: [{ type: 'depense', poste: 'affairesEtrangeres', valeur: 0.8, duree: 12 }], texte: 'allègement de dette et fonds santé : la France en paie sa part' },
      compromis: { relations: { afrique: 5 }, influence: 1.5, modificateurs: [{ type: 'depense', poste: 'affairesEtrangeres', valeur: 0.3, duree: 12 }], texte: 'engagements sur la santé mondiale' },
      echec: { relations: { afrique: -3 }, texte: 'promesses non tenues envers l\'Afrique' },
    }[n]),
  },
  chine: {
    nom: 'Surcapacités chinoises et sécurité économique',
    description: 'Une réponse commune aux exportations chinoises subventionnées (voitures électriques, acier) et au contrôle des exportations de technologies.',
    pedagogie: 'Washington pousse à un front commun contre Pékin ; l\'Allemagne, dont l\'industrie automobile dépend du marché chinois, freine. Le sommet d\'Évian n\'a pas adopté de déclaration commune sur la Chine. Pékin répond par des représailles ciblées (cognac, porc, produits laitiers en 2024-2025).',
    positions: { etatsUnis: 0.8, allemagne: -0.3, france: 0.2, japon: 0.5, royaumeUni: 0.1, italie: 0.1, canada: 0.6, ue: 0.4 },
    effets: (n) => ({
      ambitieux: { souverainete: 2.5, relations: { chine: -10, etatsUnis: 4 }, chocs: { agriculteurs: -2 }, modificateurs: [{ type: 'exportDurable', valeur: -0.03, duree: 4 }], texte: 'front commun face à la Chine, qui riposte sur les produits agricoles' },
      compromis: { souverainete: 1, relations: { chine: -4 }, texte: 'déclaration sur la sécurité économique' },
      echec: { influence: -0.5, texte: 'désaccord sur la Chine' },
    }[n]),
  },
};

/**
 * Concessions que le pays joué peut mettre sur la table : elles rapprochent
 * certains membres (bonus d'acceptation sur tous les dossiers) contre un coût.
 */
export const CONCESSIONS_G7 = {
  gnl: {
    nom: 'Acheter du GNL et des armes américains',
    description: 'Contrats d\'achat de gaz naturel liquéfié et d\'équipements militaires américains.',
    bonus: { etatsUnis: 0.45 },
    cout: { relations: { ue: -3 }, souverainete: -1.5, emissionsTexte: true },
    texte: 'achats de GNL et d\'armement américains (souveraineté et relations européennes en baisse)',
  },
  numerique: {
    nom: 'Suspendre la taxe sur les services numériques',
    description: 'La taxe française de 3 % sur certains services numériques, qui vise surtout les géants américains (de l\'ordre de 0,8 Md€ par an, à vérifier).',
    bonus: { etatsUnis: 0.55 },
    pays: ['france'],
    cout: { modificateurs: [{ type: 'recettes', valeur: -0.8, duree: 12 }], chocs: { salaries: -1 } },
    texte: 'taxe sur les services numériques suspendue (−0,8 Md€ par an)',
  },
  ukraine: {
    nom: 'Augmenter l\'aide militaire à l\'Ukraine (+3 Md€)',
    description: 'Un geste attendu par le Royaume-Uni, le Canada, l\'Allemagne et l\'Union européenne.',
    bonus: { royaumeUni: 0.35, canada: 0.35, allemagne: 0.25, ue: 0.3 },
    cout: { modificateurs: [{ type: 'depense', poste: 'defense', valeur: 3, duree: 4 }], relations: { ukraine: 5 } },
    texte: 'aide militaire supplémentaire de 3 Md€ à l\'Ukraine',
  },
  chine: {
    nom: 'S\'aligner sur la fermeté américaine face à la Chine',
    description: 'Contrôles des exportations de technologies et filtrage des investissements chinois.',
    bonus: { etatsUnis: 0.35, japon: 0.3, allemagne: -0.15 },
    cout: { relations: { chine: -10 }, chocs: { agriculteurs: -1 } },
    texte: 'alignement sur Washington face à Pékin (relations avec la Chine dégradées)',
  },
  agriculture: {
    nom: 'Ouvrir le marché agricole (bœuf, éthanol)',
    description: 'Des quotas d\'importation supplémentaires pour les produits agricoles américains et canadiens.',
    bonus: { etatsUnis: 0.35, canada: 0.35 },
    cout: { chocs: { agriculteurs: -6 }, grief: { agriculteurs: 4 } },
    texte: 'quotas agricoles ouverts aux Américains et aux Canadiens (colère des agriculteurs)',
  },
};
