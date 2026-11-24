/**
 * Réformes françaises de lutte contre le chômage, de soutien à la croissance
 * et d'avancées sociales. Même format que reformesFrance.js (voir les
 * conventions dans reformes.js : Md€ par an aux prix de départ, chômage
 * structurel en points, potentiel de croissance en points par an).
 *
 * Les faits et les montants observés sont sourcés ; les effets sur le chômage
 * et la croissance sont des hypothèses de jeu, signalées comme telles.
 */
const rampe = (age, n) => Math.min(1, Math.max(0, (age + 1) / n));
const prix = (e) => e.macro.niveauPrix / 100;
const FR = ['france'];
const S = 'sociale';
const L = 'liberale';
const decalerRelations = (e, d) => {
  const r = e.international?.relations;
  if (!r) return;
  for (const [p, v] of Object.entries(d)) if (r[p] !== undefined) r[p] = Math.max(-100, Math.min(100, r[p] + v));
};

export const REFORMES_EMPLOI_CROISSANCE = [
  // ======================================================================
  // EMPLOI : LUTTE CONTRE LE CHÔMAGE
  // ======================================================================
  {
    id: 'tzcld', orientation: S,
    nom: 'Territoires zéro chômeur de longue durée',
    categorie: 'travail', pays: FR, vehicule: 'loi',
    resume: 'Embaucher en CDI, au SMIC, des chômeurs de longue durée dans des « entreprises à but d\'emploi » qui font des travaux utiles non couverts par le marché, financées en partie par les prestations qu\'elles évitent.',
    pedagogie: 'L\'expérimentation, lancée en 2016 et étendue en 2020, emploie un peu plus de 4 000 personnes dans 83 territoires. Le comité scientifique (France Stratégie et Dares, septembre 2025) conclut à des effets positifs pour les personnes et les territoires, mais à un coût significatif, loin de la neutralité budgétaire ; la Cour des comptes juge le dispositif utile localement mais coûteux. Le généraliser revient à créer une garantie d\'emploi pour les chômeurs de très longue durée.',
    pour: ['Remet au travail des personnes très éloignées de l\'emploi', 'Une partie du coût est compensée par les prestations évitées (RSA, allocations)'],
    contre: ['Coût par emploi élevé', 'Risque de concurrence avec des entreprises ou des associations locales'],
    exemples: ['Autriche : expérimentation de garantie d\'emploi à Gramatneusiedl (2020)', 'Belgique : premiers « territoires zéro chômeur » en Wallonie'],
    sources: [
      { texte: 'France Stratégie et Dares : « Vers une garantie d\'emploi ? », rapport du comité scientifique (septembre 2025)', url: 'https://www.strategie-plan.gouv.fr/files/files/Publications/2025/2025-09-22%20-%20Rapport%20TZCLD/TZCLD%20Eval%20Lab%20Rapport%20%20et%20synthese%20VF%202025-09-22%2015H%20-%201.pdf' },
      { texte: 'Banque des Territoires : le comité scientifique appelle à poursuivre, malgré « un coût significatif »', url: 'https://www.banquedesterritoires.fr/territoires-zero-chomeur-de-longue-duree-le-comite-scientifique-appelle-poursuivre-malgre-un-cout' },
      { texte: 'Banque des Territoires : un projet « innovant » mais coûteux, selon la Cour des comptes', url: 'https://www.banquedesterritoires.fr/territoires-zero-chomeur-un-projet-innovant-mais-couteux-selon-la-cour-des-comptes' },
    ],
    options: [
      { id: 'perenniser', nom: 'Pérenniser l\'expérimentation et l\'étendre à 150 territoires', description: 'Environ 8 000 salariés à terme.' },
      { id: 'generaliser', nom: 'Généraliser : garantie d\'emploi pour les chômeurs de très longue durée (500 territoires)', description: 'Environ 30 000 salariés à terme (hypothèse de jeu).' },
    ],
    delai: 2,
    effets: (e, o, age) => {
      const g = o === 'generaliser';
      const r = rampe(age, g ? 16 : 8);
      return { depenses: { travailEmploi: (g ? 0.6 : 0.12) * r * prix(e) }, chomageStructurel: -(g ? 0.09 : 0.02) * r, menages: { smic: [{ montant: g ? 12 : 3, texte: 'Emplois en entreprise à but d\'emploi (effet moyen)' }] } };
    },
    reaction: (e, o) => ({ chocs: { salaries: 2, jeunes: 1, entrepreneurs: o === 'generaliser' ? -2 : -1 }, opinion: { salaries: 1 }, credibilite: o === 'generaliser' ? -0.03 : 0 }),
    axes: { social: 0.6, travail: -0.1 },
    chiffrage: 'Hypothèse de jeu : environ 20 000 € de dépense publique nette par emploi et par an, après les prestations évitées ; 0,12 Md€ par an pour 150 territoires, 0,6 Md€ pour 500. Chaque tranche de 30 000 emplois retire environ 0,09 point de chômage.',
  },
  {
    id: 'formation_chomeurs', orientation: S,
    nom: 'Former massivement les demandeurs d\'emploi aux métiers en tension',
    categorie: 'travail', pays: FR, vehicule: 'PLF',
    resume: 'Un plan de cinq ans pour financer des formations longues et qualifiantes aux métiers qui recrutent (industrie, soins, bâtiment, numérique).',
    pedagogie: 'Le Plan d\'investissement dans les compétences (2018-2022, près de 14 Md€) a laissé un bilan mitigé : il n\'a pas réussi à mener les moins diplômés vers des formations qualifiantes. Mais ses évaluateurs ont observé que les formations longues aux métiers en tension augmentent nettement les chances d\'embauche. Les crédits du plan ont reculé depuis 2024. Un nouveau plan concentré sur ces formations longues serait plus efficace par euro dépensé.',
    pour: ['Répond aux difficultés de recrutement de nombreux secteurs', 'Effet durable sur l\'employabilité'],
    contre: ['Coût élevé, effets lents (plusieurs années)', 'Le précédent plan a déçu sur les publics peu diplômés'],
    exemples: ['Danemark : formation au cœur de la « flexicurité »', 'Suède : centres de formation pour adultes (Komvux)'],
    sources: [
      { texte: 'Insee et Dares : Plan d\'investissement dans les compétences, un programme d\'ampleur évalué par un dispositif inédit (2025)', url: 'https://www.insee.fr/fr/statistiques/8305556' },
      { texte: 'Banque des Territoires : un bilan définitif plutôt mitigé', url: 'https://www.banquedesterritoires.fr/plan-dinvestissement-dans-les-competences-un-bilan-definitif-plutot-mitige' },
      { texte: 'Banque des Territoires : les formations longues augmentent les chances d\'embauche dans les métiers en tension', url: 'https://www.banquedesterritoires.fr/les-formations-longues-augmentent-les-chances-dembauche-dans-les-metiers-en-tension' },
    ],
    options: [
      { id: 'plan', nom: 'Plan de 3 Md€ par an pendant cinq ans, centré sur les formations longues' },
      { id: 'cible', nom: 'Plan ciblé de 1,5 Md€ par an sur les chômeurs de longue durée' },
    ],
    delai: 1,
    effets: (e, o, age) => {
      const fort = o === 'plan';
      const actif = age < 20 ? 1 : 0; // cinq ans de crédits
      return { depenses: { travailEmploi: (fort ? 3 : 1.5) * actif * prix(e) }, chomageStructurel: -(fort ? 0.15 : 0.08) * rampe(age - 2, 12), potentielBonus: fort ? 0.004 * rampe(age - 4, 12) : 0.002 * rampe(age - 4, 12) };
    },
    reaction: () => ({ chocs: { jeunes: 2, salaries: 2, entrepreneurs: 1 }, credibilite: -0.02 }),
    axes: { social: 0.4, rigueur: -0.3 },
    chiffrage: 'Hypothèses de jeu : 3 Md€ (ou 1,5 Md€) par an pendant cinq ans ; −0,15 point (ou −0,08) de chômage structurel au bout de trois à quatre ans, effet qui dure après la fin des crédits.',
  },
  {
    id: 'bonus_malus_contrats', orientation: S,
    nom: 'Généraliser le bonus-malus sur les contrats courts',
    categorie: 'travail', pays: FR, vehicule: 'décret',
    resume: 'Moduler les cotisations chômage des employeurs selon leur recours aux fins de contrat, dans tous les secteurs et avec un malus plus fort.',
    pedagogie: 'Depuis 2022, sept secteurs grands consommateurs de contrats courts paient une cotisation chômage modulée (de 3 % à 5,05 % au plus). L\'Unédic observe une baisse moyenne de 8 % des fins de contrat entre 2023 et 2024 dans ces secteurs, un effet jugé limité sur les contrats courts ; le dispositif est équilibré (298 M€ de malus pour 285 M€ de bonus en 2024).',
    pour: ['Fait payer aux employeurs le coût des contrats précaires pour l\'assurance chômage', 'Encourage les contrats plus longs'],
    contre: ['Hausse du coût du travail dans les secteurs saisonniers', 'Effet constaté modeste'],
    exemples: ['États-Unis : cotisations chômage modulées selon l\'historique de licenciements (experience rating) depuis les années 1930'],
    sources: [
      { texte: 'Unédic : premiers résultats d\'évaluation du bonus-malus (mars 2025)', url: 'https://www.unedic.org/publications/reforme-2019-2021-premiers-resultats-d-evaluation-du-bonus-malus' },
      { texte: 'Légisocial : bilan du bonus-malus (−8 % de fins de contrat dans les secteurs concernés)', url: 'https://www.legisocial.fr/actualites-sociales/7243-bilan-bonus-malus.html' },
    ],
    options: [{ id: 'oui', nom: 'Tous les secteurs, malus porté jusqu\'à 7 %' }],
    delai: 2,
    effets: (e, o, age) => ({ recettes: { cotisations: 0.3 * rampe(age, 4) * prix(e) }, chomageStructurel: -0.03 * rampe(age, 8) }),
    reaction: () => ({ chocs: { salaries: 2, jeunes: 2, entrepreneurs: -4, agriculteurs: -2 }, grief: { entrepreneurs: 2 } }),
    axes: { social: 0.4, marche: -0.4 },
    chiffrage: 'Hypothèses de jeu : environ 0,3 Md€ de malus net par an et −0,03 point de chômage structurel.',
  },
  {
    id: 'emploi_seniors', orientation: L,
    nom: 'Emploi des seniors : aide à l\'embauche des chômeurs de 57 ans et plus',
    categorie: 'travail', pays: FR, vehicule: 'PLFSS',
    resume: 'Une aide de 4 000 € par an pendant deux ans pour l\'embauche d\'un demandeur d\'emploi de 57 ans et plus, en complément du nouveau CDI senior.',
    pedagogie: 'Seuls 39 % des 60-64 ans travaillent en France (Dares, 2024), contre environ 51 % en moyenne dans l\'Union. Le contrat de valorisation de l\'expérience, un CDI expérimental créé par la loi du 24 octobre 2025, permet d\'embaucher un chômeur de 60 ans et plus (57 ans si la branche le prévoit) en pouvant le mettre à la retraite dès qu\'il a droit au taux plein. Une aide à l\'embauche renforcerait l\'incitation.',
    pour: ['Le chômage des seniors dure longtemps', 'Plus d\'actifs âgés : plus de cotisations, moins de prestations'],
    contre: ['Effet d\'aubaine pour des embauches qui auraient eu lieu', 'Coût'],
    exemples: ['Finlande et Suède : taux d\'emploi des 60-64 ans proches de 70 %'],
    sources: [
      { texte: 'Service-public.fr : le contrat de valorisation de l\'expérience (CDI senior)', url: 'https://entreprendre.service-public.gouv.fr/vosdroits/F39356' },
      { texte: 'Banque des Territoires : le gouvernement cherche des leviers pour maintenir les seniors dans l\'emploi', url: 'https://www.banquedesterritoires.fr/le-gouvernement-cherche-des-leviers-pour-maintenir-les-seniors-dans-lemploi' },
    ],
    options: [{ id: 'oui', nom: 'Aide de 4 000 € par an pendant deux ans' }],
    delai: 1,
    effets: (e, o, age) => ({ depenses: { travailEmploi: 0.5 * rampe(age, 4) * prix(e) }, offreTravail: 0.1 * rampe(age, 8), chomageStructurel: -0.05 * rampe(age, 8) }),
    reaction: () => ({ chocs: { salaries: 2, retraites: 1, entrepreneurs: 2 } }),
    axes: { travail: 0.3, marche: 0.2 },
    chiffrage: 'Hypothèses de jeu : 0,5 Md€ par an (environ 60 000 embauches aidées), +0,1 % d\'offre de travail et −0,05 point de chômage structurel.',
  },

  // ======================================================================
  // CROISSANCE
  // ======================================================================
  {
    id: 'france_2030_bis', orientation: L,
    nom: 'Nouveau plan d\'investissement d\'avenir (« France 2030 » bis)',
    categorie: 'croissance', pays: FR, vehicule: 'PLF',
    resume: 'Prolonger France 2030 par un nouveau plan de 50 Md€ sur cinq ans : intelligence artificielle, nucléaire, semi-conducteurs, santé, défense, décarbonation de l\'industrie.',
    pedagogie: 'France 2030 (54 Md€, dont 34 Md€ de crédits nouveaux, piloté par le Secrétariat général pour l\'investissement) a soutenu 8 727 projets à la fin de 2025 ; selon son bilan à mi-parcours (juillet 2026), il aurait suscité 12 Md€ d\'investissements privés supplémentaires et forme plus de 220 000 personnes par an. L\'investissement public dans l\'innovation soutient la productivité à long terme, mais pèse sur le déficit tout de suite.',
    pour: ['Prépare les filières d\'avenir et la souveraineté industrielle', 'Effet d\'entraînement sur l\'investissement privé'],
    contre: ['Dépense supplémentaire en pleine procédure pour déficit excessif', 'Rendement incertain, risque de saupoudrage'],
    exemples: ['États-Unis : Inflation Reduction Act et CHIPS Act (2022)', 'Allemagne : fonds spécial de 500 Md€ pour les infrastructures (2025)'],
    sources: [
      { texte: 'Gouvernement : France 2030, des résultats tangibles à mi-parcours (juillet 2026)', url: 'https://www.info.gouv.fr/actualite/france-2030-des-resultats-tangibles-a-mi-parcours' },
      { texte: 'Gouvernement : bilan de France 2030, ce qu\'il faut retenir', url: 'https://www.info.gouv.fr/actualite/bilan-de-france-2030-ce-quil-faut-retenir' },
    ],
    options: [
      { id: 'plan', nom: '50 Md€ sur cinq ans (10 Md€ par an)' },
      { id: 'reduit', nom: '20 Md€ sur cinq ans, concentrés sur l\'IA et le nucléaire' },
    ],
    delai: 2,
    effets: (e, o, age) => {
      const fort = o === 'plan';
      const actif = age < 20 ? 1 : 0;
      return { depenses: { economieFinances: (fort ? 10 : 4) * actif * prix(e) }, potentielBonus: (fort ? 0.05 : 0.025) * rampe(age - 6, 16), chomageStructurel: -(fort ? 0.04 : 0.015) * rampe(age - 4, 12) };
    },
    reaction: (e, o) => ({ chocs: { entrepreneurs: 3, jeunes: 1 }, credibilite: o === 'plan' ? -0.08 : -0.03 }),
    axes: { rigueur: -0.5, marche: 0.2, europe: 0.1 },
    chiffrage: 'Hypothèses de jeu : 10 Md€ (ou 4 Md€) par an pendant cinq ans ; à terme, +0,05 point (ou +0,025) de croissance potentielle par an, qui apparaît progressivement après deux à trois ans.',
  },
  {
    id: 'credit_impot_industrie', orientation: L,
    nom: 'Crédit d\'impôt pour l\'industrie verte et souveraine élargi',
    categorie: 'croissance', pays: FR, vehicule: 'PLF',
    resume: 'Étendre le crédit d\'impôt pour l\'industrie verte (C3IV) aux industries de souveraineté (semi-conducteurs, médicaments, défense) et le relever à 25 %.',
    pedagogie: 'Le C3IV, créé en 2023 et prorogé jusqu\'en 2028 par la loi de finances pour 2026, rembourse de 15 % à 35 % (davantage en zone aidée) les investissements dans les batteries, les panneaux solaires, les éoliennes et les pompes à chaleur, dans la limite de 150 M€ par projet. L\'élargir attirerait des usines, au prix d\'une perte de recettes et d\'un risque de course aux subventions avec les autres pays.',
    pour: ['Réindustrialisation et emplois industriels dans les territoires', 'Réponse aux subventions américaines et chinoises'],
    contre: ['Perte de recettes d\'impôt sur les sociétés', 'Effet d\'aubaine pour des projets déjà décidés'],
    exemples: ['États-Unis : crédits d\'impôt de l\'Inflation Reduction Act (2022)'],
    sources: [{ texte: 'Ministère de l\'Économie : crédit d\'impôt au titre des investissements dans l\'industrie verte (C3IV)', url: 'https://www.economie.gouv.fr/entreprises/credit-impot-investissements-industrie-verte-c3iv' }],
    options: [{ id: 'oui', nom: 'Élargir aux industries de souveraineté, taux de 25 %' }],
    delai: 1,
    effets: (e, o, age) => ({ recettes: { impotSocietes: -1.5 * rampe(age, 6) * prix(e) }, potentielBonus: 0.015 * rampe(age - 4, 12), chomageStructurel: -0.03 * rampe(age - 2, 12) }),
    reaction: () => ({ chocs: { entrepreneurs: 4, salaries: 1 }, credibilite: -0.03 }),
    axes: { fiscal: -0.3, marche: 0.3, ecologie: 0.2 },
    chiffrage: 'Hypothèses de jeu : 1,5 Md€ de recettes en moins par an à terme ; +0,015 point de croissance potentielle et −0,03 point de chômage structurel.',
  },
  {
    id: 'rapport_draghi', orientation: L,
    nom: 'Porter le rapport Draghi à Bruxelles : marché unique achevé et emprunt européen pour l\'innovation',
    categorie: 'croissance', pays: FR, vehicule: 'initiative européenne',
    resume: 'Pousser, avec l\'Allemagne et l\'Italie, les recommandations de Mario Draghi : union des marchés de capitaux, marché unique de l\'énergie et des télécoms, investissement commun de 750 à 800 Md€ par an.',
    pedagogie: 'Le rapport Draghi sur la compétitivité européenne (septembre 2024) constate un décrochage de productivité face aux États-Unis et chiffre à 750 à 800 Md€ par an (environ 5 % du PIB de l\'Union) l\'investissement supplémentaire nécessaire. Ses propositions dépendent de l\'accord des 27 : la France peut les porter, pas les décider seule.',
    pour: ['Taille critique européenne face aux États-Unis et à la Chine', 'Financement commun : moins de pression sur la dette française'],
    contre: ['Les pays « frugaux » refusent un nouvel emprunt commun', 'Effets lointains et incertains'],
    exemples: ['Plan de relance européen NextGenerationEU (2020) : premier grand emprunt commun'],
    sources: [{ texte: 'Commission européenne : le rapport Draghi sur l\'avenir de la compétitivité européenne (septembre 2024)', url: 'https://commission.europa.eu/topics/eu-competitiveness/draghi-report_en' }],
    options: [{ id: 'oui', nom: 'En faire la priorité de la France à Bruxelles' }],
    delai: 4,
    // Relations : plus proches de l'Allemagne et de l'Italie, plus tendues avec les pays « frugaux » (une fois, à l'application)
    appliquer(e) { decalerRelations(e, { allemagne: 2, italie: 2, frugaux: -4 }); },
    annuler(e) { decalerRelations(e, { allemagne: -2, italie: -2, frugaux: 4 }); },
    effets: (e, o, age) => ({ potentielBonus: 0.03 * rampe(age - 8, 16), influence: 1 }),
    reaction: () => ({ chocs: { entrepreneurs: 2 }, credibilite: 0.02 }),
    axes: { europe: 0.8, marche: 0.3 },
    chiffrage: 'Pas de coût pour le budget national dans le jeu ; à terme, +0,03 point de croissance potentielle si l\'Union suit (hypothèse). Relations : meilleures avec l\'Allemagne, plus tendues avec les pays frugaux.',
  },

  // ======================================================================
  // AVANCÉES SOCIALES
  // ======================================================================
  {
    id: 'petite_enfance', orientation: S,
    nom: 'Service public de la petite enfance : 100 000 places de crèche de plus',
    categorie: 'protection_sociale', pays: FR, vehicule: 'PLFSS',
    resume: 'Financer 100 000 places de crèche supplémentaires et former les professionnels qui manquent, pour que chaque famille trouve un mode de garde.',
    pedagogie: 'Le gouvernement a promis 200 000 places d\'ici 2030 ; le service public de la petite enfance, confié aux communes, existe depuis 2025. Mais le rythme réel est lent (7 200 places nettes créées selon l\'Observatoire national de la petite enfance) et une place en crèche coûte en moyenne 19 450 € par an à faire fonctionner. Faute de garde, beaucoup de mères réduisent ou arrêtent leur activité : plus de places, c\'est aussi plus d\'emploi.',
    pour: ['Égalité entre les femmes et les hommes au travail', 'Plus d\'emploi féminin et de cotisations', 'Égalité des chances des jeunes enfants'],
    contre: ['Coût de fonctionnement durable', 'Pénurie d\'auxiliaires de puériculture : difficile à recruter vite'],
    exemples: ['Danemark et Suède : droit opposable à une place d\'accueil'],
    sources: [
      { texte: 'Gouvernement : 200 000 nouvelles places en crèche d\'ici à 2030', url: 'https://www.info.gouv.fr/actualite/200-000-nouvelles-places-en-creche-dici-a-2030' },
      { texte: 'Ministère des Solidarités : qu\'est-ce que le service public de la petite enfance ?', url: 'https://solidarites.gouv.fr/quest-ce-que-le-service-public-de-la-petite-enfance' },
      { texte: 'Banque des Territoires : petite enfance, 17,5 Md€ de dépenses publiques en 2024 (coût moyen d\'une place)', url: 'https://www.banquedesterritoires.fr/petite-enfance-175-milliards-deuros-de-depenses-publiques-en-2024' },
    ],
    options: [{ id: 'oui', nom: '100 000 places en cinq ans' }],
    delai: 2,
    effets: (e, o, age) => {
      const r = rampe(age, 20);
      return { depenses: { protectionSociale: 1.6 * r * prix(e) }, offreTravail: 0.2 * r, menages: { couple: [{ montant: 40 * r, texte: 'Place en crèche (moins cher qu\'une garde privée, effet moyen)' }] } };
    },
    reaction: () => ({ chocs: { jeunes: 4, salaries: 3, fonctionnaires: 1 }, opinion: { jeunes: 1 } }),
    axes: { social: 0.6 },
    positionsGroupes: { RN: 0.2, DR: 0.1 },
    chiffrage: 'Environ 19 450 € par place et par an (Observatoire national de la petite enfance) ; avec la participation des familles et des communes, hypothèse de jeu de 1,6 Md€ par an de dépense publique supplémentaire à terme ; +0,2 % d\'offre de travail (retour à l\'emploi de parents).',
  },
  {
    id: 'allocations_premier_enfant', orientation: S,
    nom: 'Allocations familiales dès le premier enfant',
    categorie: 'protection_sociale', pays: FR, vehicule: 'PLFSS',
    resume: 'Verser des allocations familiales dès le premier enfant (environ 70 € par mois), alors qu\'elles ne commencent aujourd\'hui qu\'au deuxième.',
    pedagogie: 'La France est l\'un des rares pays européens où les allocations familiales ne sont pas versées pour un enfant unique. Avec une fécondité au plus bas depuis la fin de la Première Guerre mondiale (1,56 enfant par femme en 2025, Insee) et, pour la première fois depuis 1945, plus de décès que de naissances, plusieurs partis et associations familiales proposent de les ouvrir dès le premier enfant. L\'effet sur la natalité est débattu ; l\'effet sur le pouvoir d\'achat des jeunes parents est immédiat.',
    pour: ['Soutien aux jeunes familles, souvent les plus modestes', 'Signal en faveur de la natalité'],
    contre: ['Coût élevé et durable', 'Effet incertain sur la natalité'],
    exemples: ['Allemagne : 255 € par mois et par enfant dès le premier (Kindergeld, 2025)'],
    sources: [{ texte: 'Insee : bilan démographique 2025 (1,56 enfant par femme, solde naturel négatif)', url: 'https://www.insee.fr/fr/statistiques/8721209' }],
    options: [{ id: 'oui', nom: 'Environ 70 € par mois pour le premier enfant' }],
    delai: 2,
    effets: (e, o, age) => ({ depenses: { protectionSociale: 3 * rampe(age, 2) * prix(e) }, menages: { couple: [{ montant: 35, texte: 'Allocations familiales dès le premier enfant (effet moyen)' }], smic: [{ montant: 25, texte: 'Allocations familiales dès le premier enfant (effet moyen)' }], jeune: [{ montant: 15, texte: 'Allocations familiales dès le premier enfant (effet moyen)' }] } }),
    reaction: () => ({ chocs: { jeunes: 5, salaries: 3 }, opinion: { jeunes: 2 }, credibilite: -0.05 }),
    axes: { social: 0.7, rigueur: -0.4 },
    positionsGroupes: { RN: 0.5, DR: 0.3 },
    chiffrage: 'Hypothèse de jeu : environ 3 Md€ par an (près de 3,5 millions de familles d\'un enfant, 70 € par mois).',
  },
  {
    id: 'proches_aidants', orientation: S,
    nom: 'Proches aidants : congé mieux indemnisé et trimestres de retraite',
    categorie: 'protection_sociale', pays: FR, vehicule: 'PLFSS',
    resume: 'Porter de 66 à 132 jours par personne aidée l\'allocation journalière du proche aidant, et valider des trimestres de retraite pour les aidants qui réduisent leur activité.',
    pedagogie: 'Environ 9 à 11 millions de Français aident un proche malade, handicapé ou âgé. L\'allocation journalière du proche aidant (71,43 € par jour au 1er janvier 2026, indexée sur le SMIC) n\'est versée que 66 jours par personne aidée, dans la limite de quatre personnes sur une carrière. Avec le vieillissement, la question va peser de plus en plus.',
    pour: ['Reconnaissance d\'un travail invisible, souvent fait par des femmes', 'Moins coûteux que l\'hébergement en établissement'],
    contre: ['Coût croissant avec le vieillissement', 'Risque d\'éloigner durablement de l\'emploi'],
    exemples: ['Allemagne : congé d\'aidant de dix jours payé et temps partiel de 24 mois'],
    sources: [
      { texte: 'Ministère des Solidarités : allocation journalière du proche aidant', url: 'https://solidarites.gouv.fr/allocation-journaliere-du-proche-aidant' },
      { texte: 'Caf : barème de l\'allocation journalière du proche aidant', url: 'https://www.caf.fr/professionnels/offres-et-services/accompagnement-des-allocataires/bareme-allocation-journaliere-de-proche-aidant' },
    ],
    options: [{ id: 'oui', nom: '132 jours par personne aidée et trimestres de retraite' }],
    delai: 1,
    effets: (e, o, age) => ({ depenses: { protectionSociale: 0.4 * rampe(age, 4) * prix(e), retraites: 0.1 * rampe(age, 12) * prix(e) }, offreTravail: -0.02, menages: { retraite: [{ montant: 6, texte: 'Aide aux proches aidants (effet moyen)' }], couple: [{ montant: 6, texte: 'Aide aux proches aidants (effet moyen)' }] } }),
    reaction: () => ({ chocs: { retraites: 3, salaries: 2, fonctionnaires: 1 } }),
    axes: { social: 0.5 },
    positionsGroupes: { RN: 0.3, DR: 0.2 },
    chiffrage: 'Hypothèses de jeu : 0,4 Md€ par an pour l\'allocation, 0,1 Md€ de droits à la retraite à terme.',
  },
];
