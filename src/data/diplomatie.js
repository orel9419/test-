/**
 * Catalogue des actions diplomatiques et de coopération internationale.
 *
 * Chaque action coûte des points de « capital diplomatique » (2 par
 * trimestre, 3 si l'influence dépasse 70). Sa réussite dépend des relations
 * avec les partenaires concernés et de leur propre situation (par exemple,
 * l'Allemagne accepte difficilement un emprunt commun européen quand l'AfD
 * est haute dans les sondages et que le frein à l'endettement s'applique).
 *
 * Les montants sont des hypothèses de jeu, sauf mention d'une source.
 *
 * Effets possibles (objet renvoyé par succes / echec) :
 *   relations { partenaire: Δ }, influence Δ, credibilite Δ,
 *   chocs { groupe: points } (immédiat), opinion { groupe: points } (durable),
 *   modificateurs [{ type, valeur, duree (trimestres), poste? }]
 *     type : 'facteurEnergie' (multiplie le prix mondial de l'énergie payé par le pays),
 *            'recettes' (Md€/an), 'depense' (Md€/an sur un poste), 'potentiel' (pt de croissance potentielle),
 *            'effetPAC' (variation relative des aides agricoles), 'export' (impulsion en pt de PIB, une fois)
 *   regles : fonction de modification des règles budgétaires.
 */

const nomPartenaireAllie = (e) => (e.pays === 'france' ? 'allemagne' : 'france');

export const PARTENAIRES = {
  ue: 'Commission européenne',
  allemagne: 'Allemagne',
  france: 'France',
  etatsUnis: 'États-Unis',
  chine: 'Chine',
  royaumeUni: 'Royaume-Uni',
  italie: 'Italie',
  espagne: 'Espagne',
  pologne: 'Pologne',
  frugaux: 'Pays « frugaux » (Pays-Bas, Autriche, pays nordiques)',
  ukraine: 'Ukraine',
  golfe: 'Pays du Golfe (Qatar, Émirats)',
  norvege: 'Norvège',
  mercosur: 'Mercosur (Brésil, Argentine...)',
  afrique: 'Afrique',
};

export const ACTIONS_DIPLOMATIQUES = [
  {
    id: 'contrat_gnl',
    nom: 'Signer un contrat de gaz naturel liquéfié à long terme',
    cout: 1,
    description: 'Sécuriser des livraisons de GNL pour l\'hiver alors que les flux du Golfe ont chuté d\'environ 80 % et que les stocks européens sont au plus bas depuis 2011.',
    options: [
      { id: 'etatsUnis', nom: 'avec les États-Unis' },
      { id: 'norvege', nom: 'avec la Norvège' },
      { id: 'golfe', nom: 'avec le Qatar (si le détroit d\'Ormuz rouvre)' },
    ],
    probabilite: (e, o) => {
      const base = o === 'golfe' ? (e.monde.conflit === 'actif' || e.monde.conflit === 'escalade' ? 0.25 : 0.7) : 0.65;
      return base + (e.international.relations[o] ?? 0) / 250;
    },
    succes: (e, o) => ({
      relations: { [o]: 10 },
      modificateurs: [{ type: 'facteurEnergie', valeur: o === 'golfe' ? 0.93 : 0.95, duree: 12 }],
      opinion: { jeunes: o === 'etatsUnis' ? -1 : 0 },
      texte: `Contrat signé : le prix de l'énergie payé par le pays baisse d'environ ${o === 'golfe' ? 7 : 5} % pendant 3 ans. Le gaz de schiste américain reste critiqué par les écologistes.`,
    }),
    echec: (e, o) => ({ relations: { [o]: -3 }, texte: 'Les négociations échouent : les volumes disponibles sont déjà réservés par des acheteurs asiatiques.' }),
  },
  {
    id: 'achats_groupes',
    nom: 'Lancer des achats groupés de gaz au niveau européen',
    cout: 1,
    description: 'Mutualiser les achats de gaz entre États membres pour peser face aux vendeurs (sur le modèle de la plateforme européenne créée en 2022).',
    probabilite: (e) => 0.7 + (e.international.relations.ue ?? 0) / 300,
    succes: () => ({ relations: { ue: 5 }, influence: 1, modificateurs: [{ type: 'facteurEnergie', valeur: 0.97, duree: 8 }], texte: 'Les achats groupés réduisent d\'environ 3 % la facture énergétique pendant deux ans.' }),
    echec: () => ({ relations: { ue: -1 }, texte: 'Plusieurs États préfèrent leurs contrats bilatéraux : l\'initiative s\'enlise.' }),
  },
  {
    id: 'pret_safe',
    nom: 'Financer des équipements de défense par le prêt européen SAFE',
    cout: 0,
    unique: true,
    condition: (e) => (e.statique.pretSAFE ?? 0) > 0,
    description: 'La France dispose d\'une enveloppe de 15,09 Md€ de prêts européens SAFE pour des achats de défense (source : France Épargne). L\'UE emprunte à un taux proche de celui de l\'Allemagne : chaque euro emprunté ainsi coûte moins cher en intérêts qu\'une OAT.',
    probabilite: () => 1,
    succes: (e) => ({ relations: { ue: 3, pologne: 2 }, safe: e.statique.pretSAFE, texte: `${e.statique.pretSAFE.toFixed(1)} Md€ de dette de défense financés au taux européen : les intérêts économisés réduisent la charge de la dette.` }),
    echec: () => ({}),
  },
  {
    id: 'clause_derogatoire',
    nom: 'Demander l\'activation de la clause dérogatoire nationale pour la défense',
    cout: 1,
    unique: true,
    condition: (e) => e.statique.regles.ue?.pde && !e.statique.regles.ue.clauseDerogatoireDefense,
    description: 'Les règles européennes permettent d\'exclure de l\'évaluation, dans la limite de 1,5 point de PIB, les hausses de dépenses de défense. Cela desserre la trajectoire exigée, mais n\'efface pas la dette.',
    probabilite: (e) => 0.55 + (e.international.relations.ue ?? 0) / 200,
    succes: () => ({ relations: { ue: 2, frugaux: -5 }, credibilite: -0.05, regles: (r) => { r.ue.clauseDerogatoireDefense = true; }, texte: 'La Commission accepte : les hausses de dépenses de défense (jusqu\'à 1,5 point de PIB) ne comptent plus dans l\'évaluation de la trajectoire.' }),
    echec: () => ({ relations: { ue: -3 }, credibilite: -0.05, texte: 'La Commission demande d\'abord un plan crédible de réduction du déficit hors défense.' }),
  },
  {
    id: 'emprunt_commun',
    nom: 'Proposer un grand emprunt européen pour la défense et l\'énergie',
    cout: 2,
    unique: true,
    description: 'Un emprunt commun (comme le plan de relance de 2020) financerait des dépenses européennes de défense et d\'énergie. Les pays du Sud y sont favorables ; l\'Allemagne et les « frugaux » y sont réticents.',
    probabilite: (e) => {
      const allie = nomPartenaireAllie(e);
      let p = 0.12 + 0.003 * (e.international.relations[allie] ?? 0) + 0.002 * (e.international.relations.frugaux ?? 0);
      if (e.monde.energie > 180) p += 0.1;                // la crise rapproche les positions
      if (e.monde.conflit === 'escalade') p += 0.1;
      if (e.pays === 'allemagne') p += 0.25;              // une proposition allemande change la donne
      return p;
    },
    succes: (e) => {
      const part = e.pays === 'allemagne' ? 0.25 : 0.17;   // part du pays dans les dépenses financées (poids économique)
      const montant = 50 * part;                           // programme de 50 Md€/an (hypothèse)
      return {
        relations: { ue: 10, italie: 10, espagne: 10, pologne: 8, frugaux: -10, [nomPartenaireAllie(e)]: e.pays === 'france' ? -3 : 10 },
        influence: 8,
        modificateurs: [{ type: 'recettes', valeur: montant, duree: 16 }, { type: 'recettes', valeur: -montant * 0.3, duree: 99, delai: 16 }],
        opinion: e.pays === 'allemagne' ? { retraites: -3, salaries: -2, entrepreneurs: -1 } : { jeunes: 2 },
        texte: `Accord européen : ${montant.toFixed(1)} Md€ par an de dépenses de défense et d'énergie financés par l'UE pendant 4 ans, à rembourser ensuite en partie par des contributions accrues.`,
      };
    },
    echec: (e) => ({ relations: { frugaux: -5, [nomPartenaireAllie(e)]: -4 }, influence: -2, texte: 'Berlin et La Haye bloquent la proposition : pas de nouvelle dette commune.' }),
  },
  {
    id: 'cfp',
    nom: 'Fixer sa position dans la négociation du budget européen 2028-2034',
    cout: 1,
    unique: true,
    condition: (e) => e.trimestre.annee >= 2027,
    description: 'La Commission propose environ 2 000 Md€ sur sept ans. La France est contributrice nette (environ 9,5 Md€ par an selon l\'IRIS) mais première bénéficiaire de la PAC en volume. L\'Allemagne et cinq autres pays demandent des coupes.',
    options: [
      { id: 'defendre_pac', nom: 'Défendre la politique agricole commune' },
      { id: 'accepter_coupes', nom: 'Accepter des coupes pour réduire sa contribution' },
      { id: 'ressources_propres', nom: 'Créer de nouvelles ressources propres (taxe carbone aux frontières, numérique)' },
    ],
    probabilite: () => 0.75,
    succes: (e, o) => {
      if (o === 'defendre_pac') return { relations: { frugaux: -6, ue: 2 }, modificateurs: [{ type: 'recettes', valeur: -2, duree: 99, delai: 5 }, { type: 'effetPAC', valeur: 0.05, duree: 99, delai: 5 }], opinion: { agriculteurs: 8 }, texte: 'La PAC est préservée, mais la contribution nationale augmente d\'environ 2 Md€ par an à partir de 2028.' };
      if (o === 'accepter_coupes') return { relations: { frugaux: 8, ue: -3 }, modificateurs: [{ type: 'recettes', valeur: 3, duree: 99, delai: 5 }, { type: 'effetPAC', valeur: -0.08, duree: 99, delai: 5 }], opinion: { agriculteurs: -8 }, texte: 'La contribution baisse d\'environ 3 Md€ par an, au prix d\'une PAC réduite.' };
      return { relations: { ue: 6, etatsUnis: -5, chine: -3 }, influence: 2, modificateurs: [{ type: 'recettes', valeur: 1.5, duree: 99, delai: 5 }], texte: 'De nouvelles ressources propres allègent les contributions nationales. Washington dénonce la taxe numérique.' };
    },
    echec: () => ({ texte: 'Les négociations sont repoussées : le cadre actuel est prolongé.' }),
  },
  {
    id: 'mercosur',
    nom: 'Prendre position sur l\'accord commercial UE-Mercosur',
    cout: 1,
    unique: true,
    description: 'Approuvé à la majorité qualifiée en janvier 2026 malgré l\'opposition française. Il ouvre des débouchés à l\'industrie (automobile, machines) mais inquiète les éleveurs.',
    options: [
      { id: 'soutenir', nom: 'Soutenir l\'application de l\'accord' },
      { id: 'bloquer', nom: 'Tenter de bloquer (Cour de justice, Parlement européen)' },
      { id: 'clause', nom: 'Négocier une clause de sauvegarde agricole' },
    ],
    probabilite: (e, o) => (o === 'bloquer' ? 0.35 : o === 'clause' ? 0.55 : 0.9),
    succes: (e, o) => {
      const fr = e.pays === 'france';
      if (o === 'soutenir') return { relations: { mercosur: 15, espagne: 5, [nomPartenaireAllie(e)]: fr ? 6 : 3 }, modificateurs: [{ type: 'export', valeur: fr ? 0.08 : 0.15 }, { type: 'effetPAC', valeur: -0.04, duree: 99 }], opinion: { agriculteurs: fr ? -12 : -6, entrepreneurs: 3 }, grief: { agriculteurs: fr ? 8 : 4 }, texte: 'L\'accord s\'applique : gains pour les exportateurs, colère des éleveurs.' };
      if (o === 'bloquer') return { relations: { mercosur: -15, espagne: -5, ue: -5, [nomPartenaireAllie(e)]: -6 }, modificateurs: [{ type: 'export', valeur: -0.04 }], opinion: { agriculteurs: 8 }, texte: 'L\'application est suspendue dans l\'attente de la Cour de justice.' };
      return { relations: { mercosur: -3, ue: 2 }, modificateurs: [{ type: 'export', valeur: 0.04 }], opinion: { agriculteurs: 3 }, texte: 'Une clause de sauvegarde permet de suspendre les importations de bœuf en cas de chute des prix.' };
    },
    echec: (e, o) => ({ relations: { ue: -2 }, opinion: o === 'bloquer' ? { agriculteurs: -4 } : {}, texte: 'La manœuvre échoue : l\'accord s\'applique sans contrepartie.' }),
  },
  {
    id: 'aide_ukraine',
    nom: 'Augmenter l\'aide militaire à l\'Ukraine (+3 Md€ par an pendant 2 ans)',
    cout: 1,
    description: 'Les Européens et le Canada se sont engagés à 70 Md€ d\'aide militaire pour 2026-2027. L\'Allemagne prévoit 11,5 Md€ en 2026 et 11,6 Md€ en 2027.',
    probabilite: () => 1,
    succes: () => ({ relations: { ukraine: 15, pologne: 8, etatsUnis: 4, royaumeUni: 5 }, influence: 4, modificateurs: [{ type: 'depense', poste: 'defense', valeur: 3, duree: 8 }], opinion: { retraites: -1, jeunes: 1 }, texte: 'L\'aide supplémentaire renforce la position du pays dans la coalition de soutien.' }),
    echec: () => ({}),
  },
  {
    id: 'tarifs_usa',
    nom: 'Négocier sur les droits de douane avec les États-Unis',
    cout: 1,
    description: 'Les droits de douane américains pèsent sur les exportations européennes (excédent allemand avec les États-Unis : 51,9 Md€ en 2025).',
    options: [
      { id: 'concessions', nom: 'Faire des concessions (achats de GNL et d\'armement américains)' },
      { id: 'riposte', nom: 'Riposter avec des contre-mesures européennes' },
      { id: 'front_europeen', nom: 'Négocier en bloc derrière la Commission' },
    ],
    probabilite: (e, o) => (o === 'front_europeen' ? 0.5 + (e.international.relations.ue ?? 0) / 200 : o === 'concessions' ? 0.7 : 0.6),
    succes: (e, o) => {
      if (o === 'concessions') return { relations: { etatsUnis: 10, ue: -3 }, influence: -2, modificateurs: [{ type: 'export', valeur: e.pays === 'allemagne' ? 0.15 : 0.06 }, { type: 'facteurEnergie', valeur: 0.98, duree: 8 }], texte: 'Washington réduit certains droits de douane en échange d\'achats américains.' };
      if (o === 'riposte') return { relations: { etatsUnis: -15, ue: 4 }, influence: 2, modificateurs: [{ type: 'export', valeur: -0.08 }], chocs: { salaries: 1 }, texte: 'L\'escalade commerciale pénalise les exportateurs des deux côtés.' };
      return { relations: { ue: 6, etatsUnis: 3 }, influence: 2, modificateurs: [{ type: 'export', valeur: 0.06 }], texte: 'La Commission obtient un accord partiel au nom des Vingt-Sept.' };
    },
    echec: () => ({ relations: { etatsUnis: -4 }, modificateurs: [{ type: 'export', valeur: -0.03 }], texte: 'Pas d\'accord : les droits de douane restent en place.' }),
  },
  {
    id: 'partenariat_industriel',
    nom: 'Lancer un grand projet industriel franco-allemand (défense, batteries, IA)',
    cout: 2,
    description: 'Partager les coûts de recherche avec le partenaire. Ces projets sont souvent ralentis par les rivalités industrielles (avion de combat SCAF, char du futur).',
    probabilite: (e) => 0.35 + (e.international.relations[nomPartenaireAllie(e)] ?? 0) / 150,
    succes: (e) => ({ relations: { [nomPartenaireAllie(e)]: 10 }, influence: 3, modificateurs: [{ type: 'depense', poste: 'recherche', valeur: 1, duree: 20 }, { type: 'potentiel', valeur: 0.03, duree: 99, delai: 8 }], texte: 'Projet lancé : 2 Md€ par an de recherche, dont la moitié payée par le partenaire.' }),
    echec: (e) => ({ relations: { [nomPartenaireAllie(e)]: -6 }, texte: 'Désaccord sur le partage industriel : le projet est gelé.' }),
  },
  {
    id: 'sommet',
    nom: 'Organiser un sommet bilatéral',
    cout: 1,
    description: 'Améliorer la relation avec un partenaire clé.',
    options: [
      { id: 'allie', nom: 'avec le principal partenaire européen' },
      { id: 'etatsUnis', nom: 'avec les États-Unis' },
      { id: 'chine', nom: 'avec la Chine' },
      { id: 'afrique', nom: 'avec l\'Union africaine' },
    ],
    probabilite: () => 0.85,
    succes: (e, o) => {
      const cible = o === 'allie' ? nomPartenaireAllie(e) : o;
      const effets = { relations: { [cible]: 8 }, influence: 1, texte: 'Le sommet se conclut par une déclaration commune.' };
      if (o === 'chine') effets.relations.etatsUnis = -3;
      return effets;
    },
    echec: (e, o) => ({ relations: { [o === 'allie' ? nomPartenaireAllie(e) : o]: -2 }, texte: 'Le sommet tourne court sur un désaccord public.' }),
  },
  {
    id: 'aide_developpement',
    nom: 'Augmenter l\'aide au développement (+2 Md€ par an)',
    cout: 1,
    description: 'Renforcer les partenariats avec l\'Afrique et l\'influence internationale. Mesure peu populaire en période de restrictions budgétaires.',
    probabilite: () => 1,
    succes: () => ({ relations: { afrique: 12 }, influence: 3, modificateurs: [{ type: 'depense', poste: 'affairesEtrangeres', valeur: 2, duree: 99 }], opinion: { retraites: -1, salaries: -0.5 }, texte: 'L\'aide au développement augmente de 2 Md€ par an.' }),
    echec: () => ({}),
  },
  {
    id: 'investissements_chinois',
    nom: 'Accueillir une usine chinoise de batteries ou de véhicules électriques',
    cout: 1,
    description: 'Des emplois industriels et un transfert de savoir-faire, mais une dépendance accrue et des tensions avec Washington.',
    probabilite: (e) => 0.6 + (e.international.relations.chine ?? 0) / 200,
    succes: () => ({ relations: { chine: 10, etatsUnis: -8, ue: -2 }, influence: -1, modificateurs: [{ type: 'export', valeur: 0.05 }, { type: 'potentiel', valeur: 0.02, duree: 99, delai: 6 }], opinion: { salaries: 1 }, texte: 'L\'usine créera environ 3 000 emplois. Washington s\'inquiète.' }),
    echec: () => ({ relations: { chine: -3 }, texte: 'Le groupe chinois choisit finalement un autre pays européen.' }),
  },
];
