/**
 * Catalogue des événements. Chaque événement propose 2 à 4 choix aux
 * conséquences contrastées.
 *
 * Champs : id, titre, pays ('tous' ou liste), condition(e), probabilite(e) par
 * trimestre, unique, description(e), choix [{ id, texte, effets(e) }].
 *
 * Effets possibles : depensesExceptionnelles (Md€, une fois),
 * depensesTemporaires [{ poste, valeur Md€/an, duree trimestres }], chocs,
 * opinion, grief { groupe: points }, relations { partenaire: Δ }, influence,
 * instabilite, credibilite, chocPIB (points d'écart de production),
 * chocTaux (points de taux), energie (multiplicateur du prix mondial),
 * coalition (Δ satisfaction du partenaire), chocAfD, retirerReforme (true),
 * texte (récit de la conséquence).
 * Les montants sont des hypothèses de jeu.
 */

const FR = ['france'];
const DE = ['allemagne'];

export const EVENEMENTS = [
  // --- Énergie et géopolitique ------------------------------------------------
  {
    id: 'escalade_ormuz',
    titre: 'Escalade dans le golfe Persique',
    pays: 'tous',
    condition: (e) => e.monde.conflit === 'escalade' && e.monde.trimestresDepuisChangement <= 1,
    probabilite: () => 1,
    description: () => 'De nouvelles frappes visent des terminaux pétroliers et gaziers. Le prix du gaz bondit et les industriels réclament une aide d\'urgence.',
    choix: [
      { id: 'aide_industrie', texte: 'Aider les industries grosses consommatrices d\'énergie (4 Md€ sur un an)', effets: () => ({ depensesTemporaires: [{ poste: 'economieFinances', valeur: 4, duree: 4 }], chocPIB: 0.15, opinion: { entrepreneurs: 3, salaries: 1 }, texte: 'Les usines restent ouvertes, au prix d\'une dépense supplémentaire.' }) },
      { id: 'sobriete', texte: 'Lancer un plan de sobriété énergétique national', effets: () => ({ energie: 0.97, chocPIB: -0.1, opinion: { jeunes: 2, entrepreneurs: -2 }, texte: 'La consommation baisse de quelques pour cent, la production aussi.' }) },
      { id: 'rien', texte: 'Laisser les marchés s\'ajuster', effets: () => ({ chocPIB: -0.2, opinion: { entrepreneurs: -3, salaries: -2 }, texte: 'Plusieurs sites industriels annoncent du chômage partiel.' }) },
    ],
  },
  {
    id: 'cessez_le_feu',
    titre: 'Cessez-le-feu au Moyen-Orient',
    pays: 'tous',
    condition: (e) => e.monde.conflit === 'desescalade' && e.monde.trimestresDepuisChangement === 0,
    probabilite: () => 1,
    description: () => 'Un cessez-le-feu permet la reprise progressive du trafic dans le détroit d\'Ormuz. Les prix de l\'énergie refluent. Faut-il en profiter pour relever la fiscalité carbone, gelée depuis 2018 ?',
    choix: [
      { id: 'carbone', texte: 'Relever les taxes sur l\'énergie de 10 % pendant que les prix baissent', effets: (e) => { if (e.impots.accisesEnergie) e.impots.accisesEnergie.taux = Math.min(e.impots.accisesEnergie.bornes[1], e.impots.accisesEnergie.taux + 10); return { opinion: { agriculteurs: -4, salaries: -2, jeunes: 2 }, texte: 'La baisse des prix à la pompe est en partie captée par l\'État.' }; } },
      { id: 'laisser', texte: 'Laisser la baisse des prix profiter aux ménages', effets: () => ({ opinion: { salaries: 2, retraites: 1 }, texte: 'Le pouvoir d\'achat se redresse.' }) },
    ],
  },

  // --- Finances et marchés ------------------------------------------------------
  {
    id: 'degradation_note',
    titre: 'Une agence de notation dégrade la note du pays',
    pays: 'tous',
    condition: (e) => e.finances.detteRatio > 110 && e.finances.deficitRatio > 4.5,
    probabilite: () => 0.12,
    description: (e) => `Avec une dette de ${e.finances.detteRatio.toFixed(0)} % du PIB et un déficit de ${e.finances.deficitRatio.toFixed(1)} %, l'agence abaisse sa note d'un cran. Les taux montent.`,
    choix: [
      { id: 'plan', texte: 'Annoncer un plan pluriannuel de redressement crédible', effets: (e) => { const a = e.trimestre.annee + 1; e.finances.trajectoireAnnoncee[a] = Math.max(2.5, e.finances.deficitRatio - 0.8); return { chocTaux: 0.08, credibilite: 0.1, texte: `Le gouvernement s'engage sur un déficit de ${e.finances.trajectoireAnnoncee[a].toFixed(1)} % l'an prochain : il faudra tenir parole.` }; } },
      { id: 'contester', texte: 'Contester publiquement la décision', effets: () => ({ chocTaux: 0.2, credibilite: -0.1, opinion: { salaries: 1 }, texte: 'Les marchés n\'apprécient pas.' }) },
    ],
  },
  {
    id: 'crise_bancaire',
    titre: 'Une banque régionale en difficulté',
    pays: 'tous',
    condition: (e) => e.finances.taux10 > 4 || e.macro.ecartProduction < -2,
    probabilite: () => 0.04,
    unique: true,
    description: () => 'Fragilisée par la hausse des taux et l\'immobilier commercial, une banque régionale voit les retraits s\'accélérer.',
    choix: [
      { id: 'renflouer', texte: 'Recapitaliser la banque avec de l\'argent public (12 Md€)', effets: () => ({ depensesExceptionnelles: 12, opinion: { salaries: -2, retraites: 1 }, texte: 'La panique est évitée ; les contribuables ont payé.' }) },
      { id: 'europeen', texte: 'Faire jouer le mécanisme européen de résolution', effets: (e) => (e.international.relations.ue > 10 ? { depensesExceptionnelles: 3, relations: { ue: 3 }, texte: 'Les actionnaires et créanciers paient en premier ; l\'Europe accompagne.' } : { chocPIB: -0.4, relations: { ue: -2 }, texte: 'Bruxelles traîne : la crise de confiance s\'étend.' }) },
      { id: 'laisser', texte: 'Laisser la banque faire faillite', effets: () => ({ chocPIB: -0.8, opinion: { retraites: -4, entrepreneurs: -3 }, texte: 'Le crédit se resserre brutalement.' }) },
    ],
  },
  {
    id: 'commission_pde',
    titre: 'La Commission européenne hausse le ton',
    pays: FR,
    condition: (e) => e.trimestre.t === 1 && e.finances.historiqueAnnuel.at(-1)?.regles.some((r) => r.id === 'pde' && !r.respect),
    probabilite: () => 1,
    description: (e) => `Le déficit ${e.finances.historiqueAnnuel.at(-1).annee} (${e.finances.historiqueAnnuel.at(-1).deficit.toFixed(1)} %) dépasse la trajectoire européenne. Bruxelles demande des mesures correctrices.`,
    choix: [
      { id: 'corriger', texte: 'Présenter des mesures correctrices', effets: (e) => { const a = e.trimestre.annee; e.finances.trajectoireAnnoncee[a] = Math.max(2.5, e.finances.deficitRatio - 0.6); return { credibilite: 0.1, relations: { ue: 5 }, texte: `Engagement : ${e.finances.trajectoireAnnoncee[a].toFixed(1)} % de déficit cette année.` }; } },
      { id: 'delai', texte: 'Négocier un délai en invoquant la défense et l\'énergie', effets: (e) => (e.international.relations.ue > 15 ? { relations: { ue: -2 }, texte: 'La Commission accorde un an de délai.' } : { relations: { ue: -6, frugaux: -5 }, chocTaux: 0.1, texte: 'Refus : la Commission recommande une procédure renforcée.' }) },
      { id: 'ignorer', texte: 'Ignorer la recommandation', effets: () => ({ relations: { ue: -10, frugaux: -8, allemagne: -4 }, chocTaux: 0.25, credibilite: -0.2, texte: 'Les marchés anticipent une sanction ; les taux montent.' }) },
    ],
  },

  // --- Social -------------------------------------------------------------------
  {
    id: 'mouvement_social',
    titre: 'Mouvement social',
    pays: 'tous',
    condition: (e) => !!e.social.mobilisation && e.social.mobilisation.debut === e.tour - 1,
    probabilite: () => 1,
    description: (e) => {
      const g = e.social.mobilisation.groupe;
      const noms = { salaries: 'Les syndicats de salariés', fonctionnaires: 'Les syndicats de la fonction publique', agriculteurs: 'Les agriculteurs', jeunes: 'Les étudiants et jeunes actifs', retraites: 'Les retraités', entrepreneurs: 'Les organisations patronales et les indépendants' };
      return `${noms[g] ?? 'Des collectifs'} appellent à la grève et à des manifestations massives. Le pays tourne au ralenti.`;
    },
    choix: [
      { id: 'tenir', texte: 'Tenir bon', effets: (e) => ({ chocs: { [e.social.mobilisation.groupe]: -4, entrepreneurs: 1, retraites: 1 }, instabilite: 0.05, texte: 'Le mouvement s\'installe dans la durée.' }) },
      { id: 'concessions', texte: 'Ouvrir des négociations et faire des concessions (2 Md€ par an)', effets: (e) => ({ depensesTemporaires: [{ poste: 'protectionSociale', valeur: 2, duree: 8 }], reduireGrief: { groupe: e.social.mobilisation.groupe, part: 0.4 }, chocs: { [e.social.mobilisation.groupe]: 3 }, texte: 'Les concessions apaisent une partie des manifestants.' }) },
      { id: 'retirer', texte: 'Retirer la réforme contestée', effets: () => ({ retirerReforme: true, credibilite: -0.15, chocs: { entrepreneurs: -3 }, texte: 'Le gouvernement recule. Les marchés y voient un aveu de faiblesse.' }) },
    ],
  },
  {
    id: 'blocages_agricoles',
    titre: 'Blocages agricoles',
    pays: 'tous',
    condition: (e) => e.social.groupes.agriculteurs.risque > 35 || e.international.actionsRealisees.some((a) => a.id === 'mercosur' && a.option === 'soutenir' && a.tour >= e.tour - 2),
    probabilite: () => 0.35,
    description: () => 'Les agriculteurs bloquent les autoroutes et déversent du fumier devant les préfectures. Ils dénoncent les normes, les prix trop bas et la concurrence étrangère.',
    choix: [
      { id: 'aides', texte: 'Débloquer une aide d\'urgence (1,5 Md€)', effets: () => ({ depensesExceptionnelles: 1.5, chocs: { agriculteurs: 8 }, reduireGrief: { groupe: 'agriculteurs', part: 0.5 }, texte: 'Les tracteurs repartent.' }) },
      { id: 'normes', texte: 'Suspendre des normes environnementales', effets: () => ({ chocs: { agriculteurs: 6, jeunes: -3 }, reduireGrief: { groupe: 'agriculteurs', part: 0.4 }, texte: 'Les écologistes dénoncent un recul.' }) },
      { id: 'fermete', texte: 'Faire lever les blocages', effets: () => ({ chocs: { agriculteurs: -8, retraites: 1 }, instabilite: 0.04, texte: 'Les heurts font la une.' }) },
    ],
  },
  {
    id: 'greve_transports',
    titre: 'Grève dans les transports',
    pays: 'tous',
    condition: (e) => e.social.groupes.salaries.risque > 35 || e.social.groupes.fonctionnaires.risque > 35,
    probabilite: () => 0.25,
    description: () => 'Les cheminots et les agents des transports publics lancent une grève reconductible.',
    choix: [
      { id: 'negocier', texte: 'Négocier des hausses de salaire (0,8 Md€ par an)', effets: () => ({ depensesTemporaires: [{ poste: 'transports', valeur: 0.8, duree: 8 }], chocs: { fonctionnaires: 3, salaries: 2 }, texte: 'Accord trouvé après une semaine.' }) },
      { id: 'service_minimum', texte: 'Imposer un service minimum renforcé', effets: () => ({ chocPIB: -0.05, chocs: { fonctionnaires: -4, retraites: 2, entrepreneurs: 2 }, texte: 'La grève s\'essouffle, la colère demeure.' }) },
    ],
  },
  {
    id: 'emeutes',
    titre: 'Émeutes urbaines',
    pays: FR,
    condition: (e) => e.social.cohesion < 60,
    probabilite: () => 0.15,
    description: () => 'Après la mort d\'un adolescent lors d\'un contrôle de police, des émeutes éclatent dans plusieurs villes.',
    choix: [
      { id: 'plan_quartiers', texte: 'Lancer un plan pour les quartiers (2 Md€ par an)', effets: () => ({ depensesTemporaires: [{ poste: 'logement', valeur: 2, duree: 12 }], chocs: { jeunes: 3, retraites: -2 }, texte: 'Le calme revient progressivement.' }) },
      { id: 'fermete', texte: 'Priorité à l\'ordre public (1 Md€ pour la police et la justice)', effets: () => ({ depensesTemporaires: [{ poste: 'interieurJustice', valeur: 1, duree: 8 }], chocs: { jeunes: -4, retraites: 4 }, texte: 'Les violences cessent, les tensions restent vives.' }) },
    ],
  },

  // --- Climat et santé ----------------------------------------------------------
  {
    id: 'secheresse',
    titre: 'Canicule et sécheresse historiques',
    pays: 'tous',
    condition: (e) => e.trimestre.t === 3,
    probabilite: () => 0.3,
    description: () => 'Une canicule prolongée fait chuter les récoltes et oblige à restreindre l\'usage de l\'eau. Les centrales nucléaires et thermiques doivent réduire leur production faute d\'eau de refroidissement.',
    choix: [
      { id: 'aide', texte: 'Indemniser les agriculteurs (1,2 Md€)', effets: () => ({ depensesExceptionnelles: 1.2, chocs: { agriculteurs: 5 }, chocPIB: -0.05, texte: 'Les exploitations les plus touchées sont aidées.' }) },
      { id: 'adaptation', texte: 'Lancer un plan d\'adaptation de l\'eau sur 5 ans (1 Md€ par an)', effets: () => ({ depensesTemporaires: [{ poste: 'ecologieEnergie', valeur: 1, duree: 20 }], chocs: { jeunes: 2, agriculteurs: 2 }, chocPIB: -0.05, texte: 'Les investissements dans l\'eau démarrent.' }) },
      { id: 'rien', texte: 'Ne rien faire de plus', effets: () => ({ chocs: { agriculteurs: -6 }, chocPIB: -0.1, texte: 'Plusieurs filières crient à l\'abandon.' }) },
    ],
  },
  {
    id: 'inondations',
    titre: 'Inondations meurtrières',
    pays: 'tous',
    condition: () => true,
    probabilite: () => 0.06,
    description: () => 'Des pluies diluviennes dévastent plusieurs vallées. Les dégâts sont estimés à plusieurs milliards.',
    choix: [
      { id: 'reconstruction', texte: 'Fonds de reconstruction (3 Md€)', effets: () => ({ depensesExceptionnelles: 3, chocs: { retraites: 2, salaries: 2 }, texte: 'L\'État répond présent.' }) },
      { id: 'assurances', texte: 'Laisser jouer les assurances et le régime des catastrophes naturelles', effets: () => ({ depensesExceptionnelles: 0.5, chocs: { retraites: -2, salaries: -2 }, texte: 'Les sinistrés dénoncent la lenteur des indemnisations.' }) },
    ],
  },
  {
    id: 'epidemie',
    titre: 'Épidémie hivernale sévère',
    pays: 'tous',
    condition: (e) => e.trimestre.t === 1,
    probabilite: () => 0.08,
    description: () => 'Une épidémie de grippe particulièrement virulente sature les hôpitaux.',
    choix: [
      { id: 'moyens', texte: 'Débloquer des moyens exceptionnels pour l\'hôpital (2 Md€)', effets: () => ({ depensesExceptionnelles: 2, chocs: { retraites: 3, fonctionnaires: 2 }, texte: 'Les urgences tiennent.' }) },
      { id: 'deprogrammer', texte: 'Déprogrammer les opérations non urgentes', effets: () => ({ chocs: { retraites: -4, fonctionnaires: -3 }, chocPIB: -0.05, texte: 'Les soignants sont épuisés.' }) },
    ],
  },
  {
    id: 'cyberattaque',
    titre: 'Cyberattaque massive',
    pays: 'tous',
    condition: () => true,
    probabilite: (e) => (e.international.actionsRealisees.some((a) => a.id === 'aide_ukraine') ? 0.1 : 0.04),
    description: () => 'Des hôpitaux et des collectivités sont paralysés par une attaque attribuée à un groupe lié à un État hostile.',
    choix: [
      { id: 'plan_cyber', texte: 'Plan national de cybersécurité (1,5 Md€ par an)', effets: () => ({ depensesTemporaires: [{ poste: 'defense', valeur: 1.5, duree: 12 }], influence: 1, texte: 'Les capacités de défense numérique sont renforcées.' }) },
      { id: 'minimal', texte: 'Réponse minimale', effets: () => ({ chocPIB: -0.05, chocs: { retraites: -2 }, texte: 'Les systèmes reprennent lentement.' }) },
    ],
  },

  // --- Industrie ----------------------------------------------------------------
  {
    id: 'fermeture_usine',
    titre: 'Fermeture d\'un grand site industriel',
    pays: 'tous',
    condition: (e) => e.monde.energie > 150 || e.macro.ecartProduction < -1,
    probabilite: () => 0.15,
    description: (e) => (e.pays === 'allemagne'
      ? 'Un équipementier automobile annonce la fermeture de trois usines en Allemagne : 8 000 emplois menacés.'
      : 'Un sidérurgiste annonce la fermeture d\'un haut-fourneau dans le Nord : 3 000 emplois menacés.'),
    choix: [
      { id: 'nationaliser', texte: 'Nationalisation temporaire (3 Md€)', effets: () => ({ depensesExceptionnelles: 3, chocs: { salaries: 4, entrepreneurs: -3 }, texte: 'Le site est sauvé, pour l\'instant.' }) },
      { id: 'aides', texte: 'Aides conditionnées au maintien de l\'emploi (1 Md€)', effets: () => ({ depensesExceptionnelles: 1, chocs: { salaries: 2 }, texte: 'Un repreneur partiel est trouvé.' }) },
      { id: 'reconversion', texte: 'Accompagner la reconversion des salariés', effets: () => ({ depensesTemporaires: [{ poste: 'travailEmploi', valeur: 0.4, duree: 8 }], chocs: { salaries: -3 }, texte: 'La région encaisse le choc.' }) },
    ],
  },

  // --- Europe et défense --------------------------------------------------------
  {
    id: 'sommet_otan',
    titre: 'Sommet de l\'OTAN',
    pays: 'tous',
    condition: (e) => e.trimestre.t === 3 && e.trimestre.annee >= 2027,
    probabilite: () => 0.6,
    description: (e) => `Washington exige une accélération vers 3,5 % du PIB de dépenses de défense. Votre pays est à ${(e.budget.defense.montant / e.macro.pibNominal * 100).toFixed(1)} %.`,
    choix: [
      { id: 'engager', texte: 'S\'engager sur une hausse supplémentaire de 5 % du budget de défense', effets: (e) => { e.budget.defense.variationVolume = (e.budget.defense.variationVolume ?? 0) + 5; return { relations: { etatsUnis: 8, pologne: 5 }, influence: 2, texte: 'Les alliés saluent l\'effort.' }; } },
      { id: 'temporiser', texte: 'Temporiser au nom des contraintes budgétaires', effets: () => ({ relations: { etatsUnis: -8 }, influence: -1, texte: 'Washington menace de réduire sa présence en Europe.' }) },
    ],
  },

  // --- Politique intérieure ----------------------------------------------------
  {
    id: 'scandale',
    titre: 'Scandale ministériel',
    pays: 'tous',
    condition: () => true,
    probabilite: () => 0.05,
    description: () => 'Un ministre est mis en cause dans une affaire de conflit d\'intérêts révélée par la presse.',
    choix: [
      { id: 'demission', texte: 'Exiger sa démission immédiate', effets: () => ({ instabilite: 0.03, chocs: { salaries: 1, retraites: 1 }, texte: 'La crise est contenue.' }) },
      { id: 'soutien', texte: 'Le maintenir en attendant la justice', effets: () => ({ chocs: { salaries: -3, retraites: -3, jeunes: -3, fonctionnaires: -3 }, texte: 'L\'affaire empoisonne l\'actualité pendant des semaines.' }) },
    ],
  },
  {
    id: 'crise_coalition',
    titre: 'Crise au comité de coalition',
    pays: DE,
    condition: (e) => e.politique.coalition && !e.politique.coalition.rompue && e.politique.coalition.satisfaction < 35,
    probabilite: () => 0.5,
    description: () => 'Le SPD menace de quitter la coalition : il exige des contreparties sociales sur les retraites, la dépendance et le salaire minimum.',
    choix: [
      { id: 'social', texte: 'Accorder un geste social (réforme de la dépendance, 3 Md€ par an)', effets: () => ({ depensesTemporaires: [{ poste: 'protectionSociale', valeur: 3, duree: 16 }], coalition: 15, opinion: { retraites: 2 }, texte: 'Le SPD obtient satisfaction.' }) },
      { id: 'investissement', texte: 'Accélérer les investissements du fonds spécial', effets: (e) => { e.budget.transports.variationVolume = (e.budget.transports.variationVolume ?? 0) + 5; return { coalition: 10, texte: 'Compromis sur les infrastructures.' }; } },
      { id: 'refuser', texte: 'Refuser : la ligne est fixée par le chancelier', effets: () => ({ coalition: -10, chocs: { entrepreneurs: 2 }, texte: 'Le SPD fait monter les enchères.' }) },
    ],
  },
  {
    id: 'karlsruhe',
    titre: 'Recours devant la Cour constitutionnelle',
    pays: DE,
    condition: (e) => (e.finances.depassementsSchuldenbremse ?? 0) > 0 && e.trimestre.t === 2,
    probabilite: () => 0.6,
    description: () => 'Des députés saisissent Karlsruhe : selon eux, le budget contourne le frein à l\'endettement. En 2023, la Cour avait annulé 60 Md€ de crédits.',
    choix: [
      { id: 'corriger', texte: 'Corriger le budget par anticipation (coupes de 2 %)', effets: (e) => { for (const p of ['economieFinances', 'transports', 'ecologieEnergie']) e.budget[p].variationVolume = (e.budget[p].variationVolume ?? 0) - 2; return { coalition: -8, credibilite: 0.05, texte: 'Le recours perd son objet ; le SPD proteste.' }; } },
      { id: 'defendre', texte: 'Défendre le budget devant la Cour', effets: (e, alea) => (alea.uniforme() < 0.5 ? { texte: 'La Cour valide le budget.' } : { depensesTemporaires: [{ poste: 'economieFinances', valeur: -15, duree: 4 }], instabilite: 0.1, coalition: -10, texte: 'Censure partielle : 15 Md€ de crédits sont annulés en urgence.' }) },
    ],
  },
  {
    id: 'afd_regionale',
    titre: 'L\'AfD aux portes d\'un gouvernement régional',
    pays: DE,
    condition: (e) => e.trimestre.annee === 2027 && e.trimestre.t === 1,
    probabilite: () => 0.8,
    unique: true,
    description: () => 'En Saxe-Anhalt, où l\'AfD a obtenu 43,8 % en septembre 2026, la formation du gouvernement régional est bloquée. Une partie de la CDU locale envisage de s\'appuyer sur l\'AfD.',
    choix: [
      { id: 'cordon', texte: 'Maintenir le « cordon sanitaire » (Brandmauer)', effets: () => ({ coalition: 5, chocAfD: 1, opinion: { jeunes: 2 }, texte: 'La CDU locale forme une coalition hétéroclite avec le SPD, les Verts et Die Linke.' }) },
      { id: 'laisser', texte: 'Laisser la CDU régionale décider', effets: () => ({ coalition: -20, chocAfD: -1, instabilite: 0.1, opinion: { jeunes: -4, fonctionnaires: -2 }, texte: 'Tollé national : le SPD parle de trahison.' }) },
    ],
  },
];
