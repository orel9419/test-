/**
 * Réformes supplémentaires pour la France (catalogue séparé).
 *
 * Champs en plus du format commun (voir reformes.js) :
 *   vehicule          'PLF' | 'PLFSS' | 'loi' | 'décret' | 'loi constitutionnelle'.
 *                     Les textes financiers (PLF, PLFSS) peuvent passer par le
 *                     49.3 sans limite ; un décret ne passe pas devant le Parlement.
 *   pour, contre      arguments des partisans et des opposants
 *   exemples          exemples étrangers
 *   positionsGroupes  correction de la position d'un groupe sur ce texte,
 *                     quand ses votes ou son programme s'écartent de ce que
 *                     donnent ses positions générales (estimation de jeu)
 *
 * Les montants sans source sont des hypothèses de jeu, signalées comme telles.
 */
import { masseSalarialePrivee, CIBLE_MIXTE, SCENARIOS_MIXTE, PARTS_FINANCEMENT } from '../engine/capitalisation.js';

const rampe = (age, n) => Math.min(1, Math.max(0, (age + 1) / n));
const prix = (e) => e.macro.niveauPrix / 100;
const FR = ['france'];
const capi = (e) => (e.capitalisation ??= {
  allocation: 'equilibree', per: null, pilier: null, souverain: null, transition: null,
  encours: { per: 0, pilier: 0, souverain: 0, transition: 0 }, flux: { per: 0, pilier: 0, souverain: 0, transition: 0 },
  rendementCumule: 1, dernierRendement: 0, historique: [],
});
const salaire = (e, id) => e.menages.find((m) => m.id === id)?.salaireBrut ?? 0;
/** Opposition de principe de la gauche radicale à la capitalisation (estimation de jeu). */
const ANTI_CAPI = { LFI: -0.6, GDR: -0.6 };

export const REFORMES_FRANCE = [
  // ======================================================================
  // RETRAITES
  // ======================================================================
  {
    id: 'abattement_retraites',
    nom: 'Abattement de 10 % des retraités sur l\'impôt sur le revenu',
    categorie: 'retraites', pays: FR, vehicule: 'PLF',
    resume: 'Les pensions bénéficient, comme les salaires, d\'un abattement de 10 % pour « frais professionnels », alors que les retraités n\'en ont plus. Le supprimer était l\'alternative à la sous-indexation des pensions dans le débat sur le budget 2027.',
    pedagogie: 'L\'abattement est plafonné par foyer ; seuls les retraités imposables sont concernés, donc pas les plus modestes. Le remplacer par un forfait concentre l\'effort sur les pensions élevées.',
    pour: ['Mettre fin à un avantage sans justification pour des personnes sans frais professionnels', 'Épargner les retraités non imposables, contrairement à une sous-indexation'],
    contre: ['Hausse d\'impôt ciblée sur les retraités, électorat décisif', 'Effet de seuil : des retraités deviennent imposables'],
    exemples: ['Allemagne : les pensions sont imposées progressivement, sans abattement forfaitaire comparable'],
    options: [
      { id: 'forfait', nom: 'Remplacer l\'abattement par un forfait de 2 000 € par personne', description: 'Rendement estimé à environ la moitié de la suppression (hypothèse de jeu).' },
      { id: 'suppression', nom: 'Supprimer l\'abattement', description: 'De l\'ordre de 4 à 5 Md€ par an selon les chiffres cités dans le débat (à vérifier).' },
    ],
    delai: 2,
    effets: (e, o, age) => ({ recettes: { impotRevenu: (o === 'forfait' ? 2.2 : 4.4) * rampe(age, 4) * prix(e) }, menages: { retraite: [{ montant: o === 'forfait' ? -10 : -25, texte: 'Abattement de 10 % réduit ou supprimé (si imposable)' }] } }),
    reaction: (e, o) => ({ chocs: { retraites: o === 'forfait' ? -3 : -6 }, grief: { retraites: o === 'forfait' ? 2 : 4 }, credibilite: 0.05 }),
    axes: { fiscal: 0.4, social: -0.2, rigueur: 0.5 },
    positionsGroupes: { RN: -0.4, UDR: -0.3 },
    chiffrage: 'Suppression : de l\'ordre de 4 à 5 Md€ par an (chiffre cité dans le débat budgétaire, à vérifier) ; forfait : environ la moitié (hypothèse de jeu).',
  },
  {
    id: 'cumul_emploi_retraite',
    nom: 'Cumul emploi-retraite',
    categorie: 'retraites', pays: FR, vehicule: 'PLFSS',
    resume: 'Aujourd\'hui, un retraité qui reprend un emploi cotise sans acquérir de nouveaux droits (sauf exceptions). Faut-il rendre le travail des seniors plus attractif ?',
    pedagogie: 'Rendre le cumul créateur de droits augmente l\'emploi des seniors, mais coûte un peu aux caisses de retraite à long terme. Le restreindre rapporte peu.',
    pour: ['Encourager l\'activité des seniors, faible en France', 'Répondre aux pénuries de main-d\'œuvre'],
    contre: ['Coût futur pour les régimes', 'Profite surtout aux cadres et aux professions libérales'],
    exemples: ['Suède : on peut toucher sa pension et continuer à travailler en acquérant des droits supplémentaires'],
    options: [
      { id: 'createur_droits', nom: 'Rendre le cumul créateur de nouveaux droits' },
      { id: 'plafonner', nom: 'Plafonner les revenus cumulables' },
    ],
    delai: 2,
    effets: (e, o, age) => (o === 'createur_droits'
      ? { offreTravail: 0.06 * rampe(age, 8), depenses: { retraites: 0.3 * rampe(age, 8) * prix(e) } }
      : { offreTravail: -0.03, depenses: { retraites: -0.3 * prix(e) } }),
    reaction: (e, o) => (o === 'createur_droits' ? { chocs: { retraites: 2, entrepreneurs: 2 } } : { chocs: { retraites: -2 } }),
    axes: { travail: 0.5, retraites: 0.2 },
    axesParOption: { plafonner: { travail: -0.3, rigueur: 0.2 } },
    chiffrage: 'Hypothèses de jeu : +0,06 % de population active, coût d\'environ 0,3 Md€ par an à terme.',
  },

  // ======================================================================
  // RETRAITE PAR CAPITALISATION (combinable)
  // ======================================================================
  {
    id: 'capi_per',
    nom: 'Capitalisation, option légère : PER renforcé',
    categorie: 'capitalisation', pays: FR, vehicule: 'PLF',
    resume: 'Encourager l\'épargne retraite individuelle (plan d\'épargne retraite, PER) par l\'impôt ou par un abondement public.',
    pedagogie: 'Le PER existe depuis 2019. Une incitation fiscale coûte peu à court terme mais profite surtout aux ménages qui peuvent épargner, donc aux plus aisés. Un abondement public ciblé sur les bas salaires est plus équitable, mais plus coûteux par euro épargné. Selon l\'OCDE, la capitalisation pèse environ 2 % des prestations de retraite en France, contre 18 % en moyenne dans les pays concernés.',
    pour: ['Diversifier les sources de revenus à la retraite', 'Orienter l\'épargne vers les entreprises françaises'],
    contre: ['Niche fiscale concentrée sur les hauts revenus', 'Ne règle pas le déficit des régimes par répartition'],
    exemples: ['Allemagne : pension Riester subventionnée (succès limité)', 'Royaume-Uni : abondement de l\'État sur l\'épargne retraite des salariés'],
    sources: [{ texte: 'Meilleurtaux : la capitalisation s\'invite dans la présidentielle (sept. 2026)', url: 'https://placement.meilleurtaux.com/retraite/actualites/2026-septembre/presidentielle-2027-la-retraite-par-capitalisation-sinvite-dans-le-debat.html' }],
    options: [
      { id: 'plafond', nom: 'Relever les plafonds de déduction fiscale du PER', description: 'Coût fiscal faible, gains concentrés sur les plus aisés.' },
      { id: 'per_pour_tous', nom: 'Abondement public de 100 € par an sur le PER des salariés modestes', description: 'Plus équitable, plus coûteux par euro épargné.' },
    ],
    delai: 2,
    appliquer(e, o) { capi(e).per = o; },
    annuler(e) { capi(e).per = null; },
    effets: (e, o, age) => (o === 'plafond'
      ? { recettes: { impotRevenu: -1.2 * rampe(age, 4) * prix(e) }, potentielBonus: 0.003 }
      : { depenses: { protectionSociale: 1.0 * rampe(age, 4) * prix(e) }, potentielBonus: 0.002 }),
    reaction: (e, o) => (o === 'plafond' ? { chocs: { entrepreneurs: 3, salaries: 0, jeunes: -1 } } : { chocs: { salaries: 2, jeunes: 2 } }),
    axes: { marche: 0.5, retraites: 0.2, fiscal: -0.3 },
    axesParOption: { per_pour_tous: { marche: 0.3, social: 0.3, fiscal: 0 } },
    positionsGroupes: { ...ANTI_CAPI },
    chiffrage: 'Hypothèses de jeu : plafonds relevés, environ 1,2 Md€ de recettes en moins par an ; abondement public, environ 1 Md€ par an.',
  },
  {
    id: 'capi_pilier',
    nom: 'Capitalisation : deuxième pilier obligatoire',
    categorie: 'capitalisation', pays: FR, vehicule: 'loi',
    resume: 'Chaque salarié du privé verse une part de son salaire, complétée par l\'employeur, dans un fonds collectif de retraite géré par les partenaires sociaux.',
    pedagogie: 'C\'est la « double charge » : les actifs continuent de financer les pensions actuelles par répartition ET épargnent pour eux-mêmes. La part salariale réduit le salaire net et la consommation ; la part employeur renchérit le coût du travail. Les pensions supplémentaires n\'arrivent qu\'après 20 à 40 ans de versements, et leur montant dépend des marchés financiers.',
    pour: ['Compléter des pensions par répartition appelées à baisser relativement aux salaires', 'Créer une épargne longue qui finance l\'économie', 'Gestion paritaire possible, comme les régimes complémentaires'],
    contre: ['Baisse du salaire net ou hausse du coût du travail pendant des décennies', 'Risque de marché supporté par les salariés', 'Les syndicats y voient une privatisation rampante des retraites'],
    exemples: ['Suisse : 2e pilier (LPP) obligatoire, cotisations de 7 à 18 % selon l\'âge', 'Pays-Bas : fonds de pension par branche, parmi les plus capitalisés au monde', 'Australie : « superannuation » obligatoire, 12 % du salaire à la charge de l\'employeur'],
    sources: [{ texte: 'AFG : livre blanc sur la capitalisation (juin 2026)', url: 'https://www.afg.asso.fr/app/uploads/2026/06/AFG_CP-Livre-blanc-Capitalisation_17062026.pdf' }],
    options: [
      { id: '2_employeur', nom: '2 % du salaire, entièrement à la charge de l\'employeur' },
      { id: '1_1', nom: '2 % du salaire : 1 % employeur, 1 % salarié' },
      { id: '2_2', nom: '4 % du salaire : 2 % employeur, 2 % salarié' },
      { id: '1_3', nom: '4 % du salaire : 1 % employeur, 3 % salarié' },
    ],
    delai: 3,
    appliquer(e, o) { capi(e).pilier = { '2_employeur': { employeur: 2, salarie: 0 }, '1_1': { employeur: 1, salarie: 1 }, '2_2': { employeur: 2, salarie: 2 }, '1_3': { employeur: 1, salarie: 3 } }[o]; },
    annuler(e) { capi(e).pilier = null; },
    effets(e, o, age) {
      const p = capi(e).pilier ?? { employeur: 0, salarie: 0 };
      const masse = masseSalarialePrivee(e);
      const partConso = p.salarie / 100 * masse / e.macro.pibNominal * 100; // % du PIB d'épargne forcée prélevée sur les salaires
      const menage = (id) => [{ montant: -p.salarie / 100 * salaire(e, id) * 0.78, texte: 'Cotisation au fonds de retraite par capitalisation' }];
      return {
        chomageStructurel: 0.08 * p.employeur * rampe(age, 6),
        chocDemande: age < 4 ? -0.4 * partConso / 4 : 0,
        potentielBonus: 0.004 * (p.employeur + p.salarie) * rampe(age - 6, 8),
        menages: p.salarie ? { smic: menage('smic'), couple: menage('couple'), jeune: menage('jeune') } : {},
      };
    },
    reaction: (e, o) => {
      const p = { '2_employeur': [2, 0], '1_1': [1, 1], '2_2': [2, 2], '1_3': [1, 3] }[o];
      return { chocs: { salaries: -1.5 * p[1], jeunes: -p[1] + 1, entrepreneurs: -2 * p[0] + 1 }, grief: { salaries: p[1] }, credibilite: 0.03 };
    },
    axes: { retraites: 0.3, marche: 0.4, social: -0.1 },
    positionsGroupes: { ...ANTI_CAPI, ECOS: -0.3, SOC: -0.2, RN: -0.2, DR: 0.3, HOR: 0.4, EPR: 0.3 },
    chiffrage: 'Chaque point de salaire représente environ 7,6 Md€ par an versés au fonds (masse salariale privée estimée à 25 % du PIB). Effets : +0,08 point de chômage structurel par point de part employeur, consommation en baisse la première année (hypothèses de jeu).',
  },
  {
    id: 'capi_fonds_souverain',
    nom: 'Capitalisation : fonds souverain de retraite',
    categorie: 'capitalisation', pays: FR, vehicule: 'PLF',
    resume: 'Un fonds public de long terme, piloté par l\'État, qui investit pour financer les retraites futures.',
    pedagogie: 'Le Canada (CPP Investments), la Suède (fonds AP) et la Norvège (fonds souverain alimenté par le pétrole) gèrent des fonds publics qui soutiennent leurs retraites. La France a créé en 1999 le Fonds de réserve pour les retraites (FRR), mais ses ressources ont été réorientées dès 2010 vers le remboursement de la dette sociale. La question clé est le financement : des recettes existantes (qui manquent alors au budget), un impôt affecté, ou l\'emprunt, un pari que le rendement du fonds dépassera le taux de la dette (5 % pour l\'OAT à 10 ans fin octobre 2026).',
    pour: ['Lisser le choc démographique sans baisser les pensions', 'Pilotage public : pas de risque individuel', 'Placement de long terme dans l\'économie'],
    contre: ['Tentation de puiser dans le fonds en cas de crise (comme le FRR)', 'Emprunter à 5 % pour placer est risqué', 'Ne règle pas le déficit actuel'],
    exemples: ['Canada : CPP Investments, environ 700 Md$ canadiens gérés (ordre de grandeur)', 'Norvège : fonds souverain, plus de 1 500 Md€ (ordre de grandeur)', 'Suède : fonds AP, tampons du système par répartition'],
    options: [
      { id: 'dividendes', nom: 'Alimenté par les dividendes et cessions de l\'État (environ 4 Md€ par an)' },
      { id: 'csg', nom: 'Alimenté par 0,5 point de CSG affecté (environ 8 Md€ par an)' },
      { id: 'emprunt', nom: 'Alimenté par l\'emprunt (10 Md€ par an)', description: 'La dette augmente sans creuser le déficit : un pari sur le rendement.' },
    ],
    delai: 2,
    appliquer(e, o) { capi(e).souverain = o; if (o === 'emprunt') e.finances.credibilite = Math.max(-1, e.finances.credibilite - 0.05); },
    annuler(e) { capi(e).souverain = null; },
    effets(e, o, age) {
      const r = rampe(age, 2);
      if (o === 'dividendes') return { recettes: { fixe: -(e.entreprises?.dividendes ?? 4.3) * r } };
      if (o === 'csg') { const m = 0.5 / 9.2 * e.impots.csg.R0 * prix(e) * r; return { recettes: { csg: m }, depenses: { economieFinances: m }, menages: { smic: [{ montant: -8, texte: 'CSG affectée au fonds de retraite' }], couple: [{ montant: -25, texte: 'CSG affectée au fonds de retraite' }], retraite: [{ montant: -7, texte: 'CSG affectée au fonds de retraite' }] } }; }
      return { cessions: -2.5 * prix(e) }; // 10 Md€ empruntés et placés chaque année
    },
    reaction: (e, o) => ({ chocs: o === 'csg' ? { salaries: -3, retraites: -3, jeunes: 1 } : { retraites: 1 }, credibilite: o === 'emprunt' ? -0.05 : 0.03 }),
    axes: { retraites: 0.2, social: 0.2 },
    axesParOption: { csg: { fiscal: 0.4, social: 0.2 }, emprunt: { rigueur: -0.5 } },
    positionsGroupes: { LFI: -0.2, GDR: -0.2, SOC: 0.2, DEM: 0.3 },
    chiffrage: 'Dividendes de l\'État : 4,3 Md€ en 2025 (APE). 0,5 point de CSG : environ 8 Md€ par an (calcul du jeu). Emprunt : 10 Md€ par an (hypothèse).',
  },
  {
    id: 'capi_transition',
    nom: 'Capitalisation : transition partielle de la répartition',
    categorie: 'capitalisation', pays: FR, vehicule: 'PLFSS',
    resume: 'Verser 2 points des cotisations retraite sur des comptes individuels de capitalisation, au lieu de financer les pensions actuelles.',
    pedagogie: 'C\'est la forme la plus radicale : les 15 Md€ par an ainsi détournés manquent aux pensions d\'aujourd\'hui. Il faut les compenser par de la dette, un impôt ou une baisse des pensions : c\'est la double charge, portée par une ou deux générations. Le Chili (1981) a fait une transition totale ; la Suède (1998) n\'a basculé que 2,5 points sur 18,5.',
    pour: ['Réduire à terme la dépendance des retraites à la démographie', 'Créer des droits individuels propriété de chaque salarié'],
    contre: ['Double charge : coût de transition massif', 'Risque de marché sur les retraites', 'Rejet syndical quasi unanime'],
    exemples: ['Suède : 2,5 points de cotisation en capitalisation individuelle (« premium pension »)', 'Chili : transition totale en 1981, avec des pensions jugées trop faibles et des réformes depuis 2008'],
    options: [
      { id: 'dette', nom: '2 points, financés par la dette' },
      { id: 'csg', nom: '2 points, financés par environ 0,9 point de CSG' },
      { id: 'pensions', nom: '2 points, financés par une baisse progressive des pensions' },
    ],
    delai: 3,
    appliquer(e, o) { capi(e).transition = { points: 2, financement: o }; },
    annuler(e) { capi(e).transition = null; },
    effets(e, o, age) {
      const montant = 0.02 * masseSalarialePrivee(e) * rampe(age, 4);
      const eff = { recettes: { cotisations: -montant }, potentielBonus: 0.006 * rampe(age - 6, 8) };
      if (o === 'csg') { eff.recettes.csg = montant; eff.menages = { smic: [{ montant: -14, texte: 'CSG de transition vers la capitalisation' }], couple: [{ montant: -45, texte: 'CSG de transition vers la capitalisation' }], retraite: [{ montant: -12, texte: 'CSG de transition vers la capitalisation' }] }; }
      if (o === 'pensions') { eff.depenses = { retraites: -montant * rampe(age, 8) }; eff.menages = { retraite: [{ montant: -55 * rampe(age, 8), texte: 'Baisse des pensions pour financer la transition' }] }; }
      return eff;
    },
    reaction: (e, o) => ({ chocs: { salaries: -5, fonctionnaires: -5, retraites: o === 'pensions' ? -10 : -3, entrepreneurs: 3, jeunes: o === 'dette' ? 1 : -2 }, grief: { salaries: 5, fonctionnaires: 5, retraites: o === 'pensions' ? 8 : 2 }, credibilite: o === 'dette' ? -0.12 : 0.02, instabilite: 0.05 }),
    axes: { retraites: 0.6, marche: 0.7, social: -0.4 },
    axesParOption: { dette: { retraites: 0.6, marche: 0.7, social: -0.2, rigueur: -0.8 } },
    positionsGroupes: { LFI: -1, GDR: -1, ECOS: -0.6, SOC: -0.6, RN: -0.5, LIOT: -0.2, DR: 0.3, HOR: 0.4, EPR: 0.2 },
    chiffrage: '2 points de cotisation : environ 15 Md€ par an retirés aux régimes par répartition (masse salariale privée estimée à 25 % du PIB).',
    remplace: ['capi_mixte'],
  },
  {
    id: 'capi_mixte',
    nom: 'Système mixte : mi-capitalisation, mi-répartition',
    categorie: 'capitalisation', pays: FR, vehicule: 'loi',
    resume: 'Basculer progressivement la moitié des cotisations retraite (14 points sur environ 28) vers des comptes de capitalisation. À terme, chaque retraité toucherait une pension par répartition et une rente par capitalisation de poids comparables.',
    pedagogie: 'Les salariés du privé cotisent environ 28 % de leur salaire brut pour la retraite (base et complémentaire, parts salariale et patronale, ordre de grandeur). En verser la moitié sur des comptes de capitalisation, c\'est retirer environ 100 Md€ par an aux pensions actuelles une fois la bascule achevée, soit plus de 3 points de PIB : c\'est la double charge, portée par les générations de la transition. Il faut la financer par la dette, par l\'impôt (environ 6 points de CSG) ou par une baisse des pensions (environ un quart). Les économies côté répartition n\'arrivent que très lentement : les nouveaux retraités ont moins de droits par répartition, mais il faut 40 à 60 ans pour que tous les retraités soient concernés. Une transition financée par la dette n\'augmente presque pas l\'épargne nationale : l\'État s\'endette d\'un côté ce que les ménages épargnent de l\'autre.',
    pour: ['Diversifier les risques : démographie pour la répartition, marchés pour la capitalisation', 'Des droits individuels, propriété de chaque salarié', 'Une épargne longue de plusieurs centaines de milliards pour financer les entreprises', 'Moins de dépendance à la démographie : 2,5 personnes d\'âge actif pour une personne de 65 ans et plus aujourd\'hui, 1,6 en 2070 selon le COR'],
    contre: ['Double charge de l\'ordre de 100 Md€ par an pendant des décennies', 'Pensions dépendantes des marchés : un krach à la veille du départ peut amputer la rente', 'Rejet syndical et politique quasi unanime, de la gauche au RN', 'Frais de gestion et inégalités : les gains de marché profitent davantage aux carrières longues et bien payées'],
    exemples: ['Suède (1998) : 18,5 % du salaire, dont 16 points en répartition par comptes notionnels et 2,5 points en capitalisation', 'Suisse : AVS par répartition et prévoyance professionnelle (LPP) par capitalisation, deux piliers obligatoires de poids comparable', 'Pays-Bas : pension de base par répartition et fonds de pension professionnels, parmi les plus capitalisés au monde', 'Chili : capitalisation intégrale en 1981, puis pilier solidaire (2008) et réforme de 2025 qui réintroduit une cotisation patronale et une part de solidarité'],
    sources: [
      { texte: 'COR, rapport annuel 2026', url: 'https://www.cor-retraites.fr/sites/default/files/2026-06/RA_2026_def.pdf' },
      { texte: 'AFG : livre blanc sur la capitalisation (juin 2026)', url: 'https://www.afg.asso.fr/app/uploads/2026/06/AFG_CP-Livre-blanc-Capitalisation_17062026.pdf' },
      { texte: 'Meilleurtaux : la capitalisation s\'invite dans la présidentielle (sept. 2026)', url: 'https://placement.meilleurtaux.com/retraite/actualites/2026-septembre/presidentielle-2027-la-retraite-par-capitalisation-sinvite-dans-le-debat.html' },
    ],
    options: [
      { id: 'etale', nom: 'Bascule lente (0,5 point par an, 28 ans), double charge partagée : un tiers dette, un tiers CSG, un tiers pensions', description: 'Le scénario le moins brutal : chacun porte une part de l\'effort, étalé sur une génération.' },
      { id: 'dette', nom: 'Bascule en 14 ans (1 point par an), financée par la dette', description: 'Indolore au début pour les ménages ; le déficit se creuse de 7 Md€ de plus chaque année et les marchés s\'inquiètent.' },
      { id: 'impots', nom: 'Bascule en 14 ans, financée par la CSG (jusqu\'à environ 6 points)', description: 'Les actifs et les retraités paient deux fois : leurs cotisations et l\'impôt de transition.' },
      { id: 'pensions', nom: 'Bascule en 14 ans, financée par une baisse des pensions (jusqu\'à environ un quart)', description: 'Les retraités actuels financent la transition : rejet massif de l\'électorat le plus mobilisé.' },
    ],
    delai: 4,
    appliquer(e, o) {
      const s = SCENARIOS_MIXTE[o] ?? SCENARIOS_MIXTE.etale;
      capi(e).transition = { points: 0, cible: CIBLE_MIXTE, rythme: s.rythme, financement: s.financement };
    },
    annuler(e) { capi(e).transition = null; },
    effets(e, o, age) {
      const t = capi(e).transition;
      const points = t?.cible ? t.points : 0;
      const montant = points / 100 * masseSalarialePrivee(e);
      const [pDette, pCsg, pPensions] = PARTS_FINANCEMENT[t?.financement] ?? PARTS_FINANCEMENT.dette;
      // Économie lente sur la répartition : les nouveaux retraités ont moins de droits (plein effet après environ 60 ans)
      const economie = montant * Math.min(1, Math.max(0, age) / 4 / 60) ** 1.5;
      const md = montant / prix(e); // Md€ d'aujourd'hui
      const eff = {
        recettes: { cotisations: -montant },
        depenses: { retraites: -economie },
        // Seule la part financée par l'impôt ou les pensions crée une épargne nationale nouvelle
        potentielBonus: points * (0.0005 + 0.0025 * (1 - pDette)),
        menages: {},
      };
      if (pCsg) {
        eff.recettes.csg = pCsg * montant;
        const k = pCsg * md / 15;
        eff.menages.smic = [{ montant: -14 * k, texte: 'CSG de transition vers le système mixte' }];
        eff.menages.couple = [{ montant: -45 * k, texte: 'CSG de transition vers le système mixte' }];
        eff.menages.retraite = [{ montant: -12 * k, texte: 'CSG de transition vers le système mixte' }];
      }
      if (pPensions) {
        eff.depenses.retraites -= pPensions * Math.max(0, montant - economie);
        eff.menages.retraite = [...(eff.menages.retraite ?? []), { montant: -55 * pPensions * md / 15, texte: 'Baisse des pensions pour financer le système mixte' }];
      }
      return eff;
    },
    reaction(e, o) {
      return {
        etale: { chocs: { salaries: -5, fonctionnaires: -6, retraites: -5, entrepreneurs: 3 }, grief: { salaries: 6, fonctionnaires: 6, retraites: 5 }, credibilite: 0, instabilite: 0.06 },
        dette: { chocs: { salaries: -4, fonctionnaires: -6, retraites: -3, entrepreneurs: 3, jeunes: 1 }, grief: { salaries: 5, fonctionnaires: 6, retraites: 2 }, credibilite: -0.25, instabilite: 0.08 },
        impots: { chocs: { salaries: -9, fonctionnaires: -8, retraites: -7, entrepreneurs: 2, jeunes: -3 }, grief: { salaries: 9, fonctionnaires: 8, retraites: 6 }, credibilite: 0.05, instabilite: 0.08 },
        pensions: { chocs: { salaries: -5, fonctionnaires: -7, retraites: -16, entrepreneurs: 3 }, grief: { salaries: 5, fonctionnaires: 6, retraites: 16 }, credibilite: 0.08, instabilite: 0.1 },
      }[o];
    },
    axes: { retraites: 0.9, marche: 1, social: -0.6 },
    axesParOption: {
      dette: { retraites: 0.9, marche: 1, social: -0.3, rigueur: -1 },
      impots: { retraites: 0.9, marche: 0.8, social: -0.4, fiscal: 0.6 },
      pensions: { retraites: 1, marche: 1, social: -1 },
    },
    positionsGroupes: { LFI: -1, GDR: -1, ECOS: -0.8, SOC: -0.8, RN: -0.7, LIOT: -0.4, DEM: -0.2, HOR: 0.3, DR: 0.2, UDR: 0.4 },
    chiffrage: '14 points de cotisation : environ 106 Md€ par an une fois la bascule achevée (masse salariale privée estimée à 25 % du PIB, environ 760 Md€ en 2026), soit 7,6 Md€ de plus chaque année au rythme d\'un point par an. Les économies sur la répartition ne représentent que quelques pour cent de ce montant au bout de 10 ans (hypothèses de jeu).',
    remplace: ['capi_transition'],
  },

  // ======================================================================
  // TRAVAIL
  // ======================================================================
  {
    id: 'annualisation',
    nom: 'Annualiser le temps de travail',
    categorie: 'travail', pays: FR, vehicule: 'loi',
    resume: 'Proposition portée par Bruno Retailleau quand il présidait LR : passer d\'une durée hebdomadaire à une durée annuelle (1 607 heures, soit 35 h, portées à 1 623 heures) et exonérer de cotisations et d\'impôt les heures au-delà, hors CSG-CRDS.',
    pedagogie: 'L\'annualisation donne de la souplesse aux entreprises (périodes hautes et basses). Défiscaliser les heures au-delà augmente le revenu des salariés qui en font, mais coûte aux finances publiques et peut se substituer à des embauches.',
    pour: ['Plus d\'heures travaillées, donc plus de production', 'Gain de pouvoir d\'achat pour ceux qui font des heures en plus'],
    contre: ['Coût des exonérations', 'Moins de majoration des heures supplémentaires pour certains salariés', 'Remise en cause symbolique des 35 heures'],
    exemples: ['Allemagne : comptes épargne-temps et annualisation par accords de branche', 'Danemark : flexibilité négociée par les partenaires sociaux'],
    sources: [{ texte: 'Public Sénat : les propositions économiques de Bruno Retailleau', url: 'https://www.publicsenat.fr/actualites/politique/la-fete-est-finie-bruno-retailleau-veut-supprimer-les-35-heures-inciter-a-la-reprise-dactivite-et-plafonner-les-aides-sociales-pour-relancer-lemploi' }],
    options: [
      { id: '1623h_defisc', nom: '1 623 heures par an, au-delà : zéro cotisation et zéro impôt (hors CSG-CRDS)' },
      { id: 'accords', nom: 'Annualisation par accord d\'entreprise, sans défiscalisation' },
    ],
    delai: 3,
    effets: (e, o, age) => (o === '1623h_defisc'
      ? { offreTravail: 0.45 * rampe(age, 6), recettes: { cotisations: -2.0 * rampe(age, 4) * prix(e), impotRevenu: -0.8 * rampe(age, 4) * prix(e) }, menages: { couple: [{ montant: 45 * rampe(age, 4), texte: 'Heures au-delà de 1 623 h exonérées' }], smic: [{ montant: 20 * rampe(age, 4), texte: 'Heures exonérées' }] } }
      : { offreTravail: 0.15 * rampe(age, 6), potentielBonus: 0.005 }),
    reaction: (e, o) => (o === '1623h_defisc' ? { chocs: { entrepreneurs: 5, salaries: -1 }, grief: { salaries: 2, fonctionnaires: 1 } } : { chocs: { entrepreneurs: 3, salaries: -2 }, grief: { salaries: 1 } }),
    axes: { travail: 0.9, fiscal: -0.4, marche: 0.4 },
    axesParOption: { accords: { travail: 0.6, marche: 0.5 } },
    positionsGroupes: { UDR: 0.3 },
    chiffrage: 'Hypothèses de jeu : +0,45 % d\'heures travaillées à terme, environ 2,8 Md€ d\'exonérations par an.',
  },
  {
    id: 'plafond_aides_smic',
    nom: 'Plafonner le cumul des aides sociales',
    categorie: 'protection_sociale', pays: FR, vehicule: 'loi',
    resume: 'Un « compte social unique » qui plafonne le total des aides sociales (RSA, APL, prime d\'activité...) par rapport au SMIC, pour que le travail paie toujours plus que l\'assistance.',
    pedagogie: 'Proposition de Bruno Retailleau quand il présidait LR : plafond à 70 % du SMIC, avec 15 heures d\'activité pour les allocataires du RSA. Un couple avec deux enfants passerait de 2 375 € à 1 685 € d\'aides cumulées, selon l\'exemple cité. En janvier 2025, la mesure de plafonnement avait été supprimée en commission à l\'Assemblée.',
    pour: ['Que le travail rapporte toujours plus que les aides', 'Économies budgétaires'],
    contre: ['Pénalise les familles nombreuses et les parents isolés', 'Risque de pauvreté accrue des enfants'],
    exemples: ['Royaume-Uni : plafond global des allocations (« benefit cap ») depuis 2013'],
    sources: [{ texte: 'AEF : le compte social unique plafonné à 70 % du SMIC', url: 'https://www.aefinfo.fr/depeche/744138-avec-le-compte-social-unique-bruno-retailleau-veut-plafonner-le-montant-d-aide-sociale-percue-a-70-du-smic' }],
    options: [
      { id: '70pct', nom: 'Plafond à 70 % du SMIC (proposition LR)' },
      { id: '100pct', nom: 'Plafond à 100 % du SMIC' },
    ],
    delai: 3,
    effets: (e, o, age) => ({ depenses: { protectionSociale: -(o === '70pct' ? 2.5 : 0.8) * rampe(age, 4) * prix(e), logement: -(o === '70pct' ? 0.8 : 0.3) * rampe(age, 4) * prix(e) }, offreTravail: (o === '70pct' ? 0.08 : 0.03) * rampe(age, 8) }),
    reaction: (e, o) => ({ chocs: { jeunes: o === '70pct' ? -5 : -2, salaries: 1, retraites: 2, entrepreneurs: 2 }, grief: { jeunes: o === '70pct' ? 4 : 1 }, credibilite: 0.04 }),
    axes: { social: -0.8, travail: 0.4, rigueur: 0.5 },
    axesParOption: { '100pct': { social: -0.4, travail: 0.3, rigueur: 0.3 } },
    chiffrage: 'Hypothèses de jeu : environ 3,3 Md€ par an d\'économies avec un plafond à 70 % du SMIC, 1,1 Md€ à 100 %.',
  },
  {
    id: 'prime_activite',
    nom: 'Revaloriser la prime d\'activité',
    categorie: 'travail', pays: FR, vehicule: 'décret', vote: false,
    resume: 'Augmenter le complément de revenu versé aux salariés modestes : le moyen le plus direct de « faire payer le travail ».',
    pedagogie: 'En 2019, après les Gilets jaunes, la prime d\'activité a été augmentée de 90 € au niveau du SMIC. C\'est rapide et ciblé, mais coûteux.',
    pour: ['Pouvoir d\'achat immédiat des travailleurs modestes', 'Incitation à reprendre un emploi'],
    contre: ['Coût budgétaire', 'Subventionne indirectement les bas salaires'],
    exemples: ['États-Unis : crédit d\'impôt EITC', 'Royaume-Uni : crédits d\'impôt pour les travailleurs modestes'],
    options: [{ id: 'cinquante', nom: '+50 € par mois au niveau du SMIC' }],
    delai: 1,
    effets: (e, o, age) => ({ depenses: { protectionSociale: 2.5 * prix(e) }, offreTravail: 0.04 * rampe(age, 4), menages: { smic: [{ montant: 50, texte: 'Prime d\'activité revalorisée' }], jeune: [{ montant: 40, texte: 'Prime d\'activité revalorisée' }] } }),
    reaction: () => ({ chocs: { salaries: 4, jeunes: 4 }, credibilite: -0.03 }),
    axes: { social: 0.6, travail: 0.3 },
    chiffrage: 'Hypothèse de jeu : environ 2,5 Md€ par an pour +50 € au SMIC.',
  },
  {
    id: 'travail_dimanche',
    nom: 'Élargir le travail du dimanche',
    categorie: 'travail', pays: FR, vehicule: 'loi',
    resume: 'Étendre les zones et les secteurs où les commerces peuvent ouvrir le dimanche, avec majoration de salaire.',
    pedagogie: 'Les « lois Macron » de 2015 ont créé des zones touristiques internationales. L\'effet sur l\'emploi est positif mais modeste ; une partie des achats est simplement déplacée du samedi au dimanche.',
    pour: ['Emplois dans le commerce et le tourisme', 'Liberté pour les consommateurs'],
    contre: ['Vie de famille des salariés du commerce', 'Petits commerces concurrencés par les grandes surfaces'],
    exemples: ['Royaume-Uni : ouverture le dimanche limitée à 6 heures pour les grands magasins'],
    options: [{ id: 'zones', nom: 'Élargir les zones touristiques et commerciales' }],
    delai: 2,
    effets: (e, o, age) => ({ chomageStructurel: -0.02 * rampe(age, 6), potentielBonus: 0.003 }),
    reaction: () => ({ chocs: { entrepreneurs: 2, salaries: -2 }, grief: { salaries: 1 } }),
    axes: { marche: 0.5, travail: 0.4, social: -0.2 },
    chiffrage: 'Effet modeste : environ −0,02 point de chômage structurel (hypothèse de jeu).',
  },
  {
    id: 'apprentissage',
    nom: 'Aides à l\'apprentissage',
    categorie: 'travail', pays: FR, vehicule: 'décret', vote: false,
    resume: 'Les aides à l\'embauche d\'apprentis ont fait exploser l\'apprentissage depuis 2019 (plus de 850 000 contrats), mais leur coût et leur ciblage sont discutés.',
    pedagogie: 'Une grande partie des nouveaux apprentis préparent un diplôme du supérieur, qu\'ils auraient sans doute obtenu sans ces aides. Les recentrer sur les CAP et les bacs professionnels économise sans trop réduire l\'insertion des jeunes peu qualifiés.',
    pour: ['Recentrer : économies et meilleur ciblage', 'Renforcer : l\'apprentissage réduit le chômage des jeunes'],
    contre: ['Recentrer : moins de contrats dans le supérieur', 'Renforcer : effet d\'aubaine coûteux'],
    exemples: ['Allemagne : système dual, financé surtout par les entreprises', 'Suisse : apprentissage majoritaire après la scolarité obligatoire'],
    options: [
      { id: 'recentrer', nom: 'Recentrer les aides sur les CAP et bacs professionnels' },
      { id: 'renforcer', nom: 'Renforcer les aides pour les jeunes peu qualifiés' },
    ],
    delai: 1,
    effets: (e, o, age) => (o === 'recentrer'
      ? { depenses: { travailEmploi: -1.5 * rampe(age, 4) * prix(e) }, chomageStructurel: 0.03 }
      : { depenses: { travailEmploi: 1.0 * prix(e) }, chomageStructurel: -0.05 * rampe(age, 6) }),
    reaction: (e, o) => (o === 'recentrer' ? { chocs: { entrepreneurs: -3, jeunes: -2 }, credibilite: 0.03 } : { chocs: { jeunes: 3, entrepreneurs: 2 } }),
    axes: { marche: 0.2 },
    axesParOption: { recentrer: { rigueur: 0.4, social: -0.1 }, renforcer: { social: 0.3, rigueur: -0.2 } },
    chiffrage: 'Hypothèses de jeu : −1,5 Md€ par an en recentrant, +1 Md€ en renforçant.',
  },

  // ======================================================================
  // SANTÉ
  // ======================================================================
  {
    id: 'franchises_medicales',
    nom: 'Franchises médicales',
    categorie: 'sante', pays: FR, vehicule: 'décret', vote: false,
    resume: 'Augmenter le reste à charge des patients sur les médicaments et les consultations (franchises, participations forfaitaires).',
    pedagogie: 'Les franchises ont été doublées par décret en 2024. Elles rapportent vite, mais pèsent sur les malades chroniques et les ménages modestes, avec un risque de renoncement aux soins.',
    pour: ['Responsabiliser les patients', 'Économie rapide sans vote'],
    contre: ['Taxe sur les malades', 'Renoncement aux soins des plus modestes'],
    exemples: ['Suisse : franchise annuelle élevée (au moins 300 CHF)', 'Allemagne : ticket modérateur supprimé en 2013'],
    options: [{ id: 'doubler', nom: 'Doubler à nouveau les franchises et participations forfaitaires' }],
    delai: 1,
    effets: (e, o, age) => ({ depenses: { sante: -1.2 * rampe(age, 2) * prix(e) }, menages: { retraite: [{ montant: -8, texte: 'Franchises médicales' }], smic: [{ montant: -4, texte: 'Franchises médicales' }] } }),
    reaction: () => ({ chocs: { retraites: -4, salaries: -2, jeunes: -1 }, grief: { retraites: 2 }, credibilite: 0.03 }),
    axes: { social: -0.5, rigueur: 0.4 },
    chiffrage: 'Hypothèse de jeu : environ 1,2 Md€ par an.',
  },
  {
    id: 'arrets_maladie',
    nom: 'Arrêts maladie',
    categorie: 'sante', pays: FR, vehicule: 'PLFSS',
    resume: 'Les indemnités journalières d\'arrêt maladie progressent vite. Faut-il instaurer un jour de carence pour tous ou plafonner davantage les indemnités ?',
    pedagogie: 'Dans le privé, trois jours de carence sont souvent compensés par l\'employeur ; dans la fonction publique, un jour de carence s\'applique. Un jour de carence non compensable réduit surtout les arrêts courts.',
    pour: ['Réduire les arrêts courts et leur coût', 'Équité entre public et privé'],
    contre: ['Pénalise les salariés réellement malades', 'Risque de « présentéisme » et de contagion'],
    exemples: ['Suède : un jour de carence', 'Allemagne : maintien du salaire par l\'employeur pendant six semaines'],
    options: [
      { id: 'carence', nom: 'Un jour de carence d\'ordre public (non compensable)' },
      { id: 'plafond_ij', nom: 'Plafonner davantage les indemnités journalières' },
    ],
    delai: 2,
    effets: (e, o, age) => ({ depenses: { sante: -(o === 'carence' ? 0.8 : 0.6) * rampe(age, 2) * prix(e) } }),
    reaction: () => ({ chocs: { salaries: -3, fonctionnaires: -2, entrepreneurs: 2 }, grief: { salaries: 1 }, credibilite: 0.02 }),
    axes: { social: -0.4, rigueur: 0.3, travail: 0.2 },
    chiffrage: 'Hypothèses de jeu : 0,6 à 0,8 Md€ par an.',
  },
  {
    id: 'deserts_medicaux',
    nom: 'Déserts médicaux',
    categorie: 'sante', pays: FR, vehicule: 'loi',
    resume: 'Près d\'un Français sur dix n\'a pas de médecin traitant. Faut-il réguler l\'installation des médecins ou multiplier les incitations ?',
    pedagogie: 'En mai 2025, une proposition de loi transpartisane de régulation de l\'installation a été adoptée en première lecture à l\'Assemblée, avec des voix de gauche, du RN et du centre, contre l\'avis des syndicats de médecins. Les incitations financières ont, jusqu\'ici, peu changé la carte des installations.',
    pour: ['Égalité d\'accès aux soins sur le territoire', 'Mesure populaire, notamment dans les zones rurales'],
    contre: ['Les médecins redoutent une baisse de l\'attractivité de la profession', 'Effet limité tant que le nombre de médecins reste insuffisant'],
    exemples: ['Allemagne : installation régulée par zones pour les médecins conventionnés', 'Infirmiers en France : régulation déjà en place'],
    options: [
      { id: 'regulation', nom: 'Réguler l\'installation dans les zones bien dotées' },
      { id: 'incitations', nom: 'Renforcer les incitations à l\'installation (0,5 Md€ par an)' },
    ],
    delai: 2,
    effets: (e, o) => (o === 'regulation' ? { depenses: { sante: 0.1 * prix(e) } } : { depenses: { sante: 0.5 * prix(e) } }),
    reaction: (e, o) => (o === 'regulation' ? { chocs: { retraites: 3, agriculteurs: 3, jeunes: 1, entrepreneurs: -1 } } : { chocs: { retraites: 2, agriculteurs: 2 } }),
    axes: { social: 0.4 },
    axesParOption: { regulation: { social: 0.4, marche: -0.3 } },
    positionsGroupes: { RN: 0.4, LIOT: 0.4, DR: -0.3 },
    chiffrage: 'Coût faible pour la régulation, 0,5 Md€ par an pour les incitations (hypothèses de jeu).',
  },
  {
    id: 'plan_hopital',
    nom: 'Plan pour l\'hôpital',
    categorie: 'sante', pays: FR, vehicule: 'PLFSS',
    resume: 'Recruter et revaloriser à l\'hôpital public, rouvrir des lits et soulager les urgences.',
    pedagogie: 'Le « Ségur de la santé » (2020) a coûté environ 10 Md€ par an en revalorisations. Un nouveau plan améliore l\'accès aux soins et la popularité, mais pèse sur l\'Ondam (objectif de dépenses d\'assurance maladie).',
    pour: ['Urgences saturées, déprogrammations', 'Attractivité des métiers du soin'],
    contre: ['Coût élevé en pleine procédure pour déficit excessif'],
    exemples: ['Royaume-Uni : plans successifs pour le NHS'],
    options: [{ id: 'deux_md', nom: 'Plan de 2 Md€ par an' }],
    delai: 1,
    effets: (e, o, age) => ({ depenses: { sante: 2 * rampe(age, 2) * prix(e) } }),
    reaction: () => ({ chocs: { retraites: 3, fonctionnaires: 3, salaries: 1 }, credibilite: -0.03 }),
    axes: { social: 0.6, rigueur: -0.3 },
    chiffrage: '2 Md€ par an.',
  },

  // ======================================================================
  // FISCALITÉ (niches et hauts revenus)
  // ======================================================================
  {
    id: 'cdhr',
    nom: 'Contribution différentielle sur les hauts revenus',
    categorie: 'fiscalite', pays: FR, vehicule: 'PLF',
    resume: 'Une imposition minimale de 20 % sur les très hauts revenus (au-delà de 250 000 € pour un célibataire), créée par la loi de finances pour 2025 à titre temporaire. Faut-il la prolonger ou la renforcer ?',
    pedagogie: 'Certains très hauts revenus sont faiblement imposés grâce aux niches et à la fiscalité du capital. Un impôt minimum corrige cela, avec un rendement qui dépend des comportements d\'optimisation.',
    pour: ['Justice fiscale : tout le monde paie au moins 20 %', 'Rendement sans toucher les classes moyennes'],
    contre: ['Instabilité fiscale', 'Départs ou optimisation des plus aisés'],
    exemples: ['États-Unis : impôt minimum alternatif (AMT)'],
    options: [
      { id: 'prolonger', nom: 'Prolonger la contribution (20 % minimum)' },
      { id: 'renforcer', nom: 'La porter à 25 % minimum' },
    ],
    delai: 1,
    effets: (e, o, age) => ({ recettes: { impotRevenu: (o === 'prolonger' ? 1.5 : 2.5) * Math.pow(0.98, age) * prix(e) } }),
    reaction: () => ({ chocs: { entrepreneurs: -3, salaries: 2, jeunes: 2 } }),
    axes: { fiscal: 0.6, social: 0.3 },
    positionsGroupes: { RN: 0.2 },
    chiffrage: 'Hypothèses de jeu : 1,5 Md€ par an en prolongeant, 2,5 Md€ à 25 %, en érosion lente.',
  },
  {
    id: 'taxe_holdings',
    nom: 'Taxer les holdings patrimoniales',
    categorie: 'fiscalite', pays: FR, vehicule: 'PLF',
    resume: 'Taxer les actifs non professionnels (immobilier, liquidités) logés dans des sociétés holding pour échapper à l\'impôt.',
    pedagogie: 'Les holdings permettent de différer l\'impôt sur les dividendes. Une taxe ciblée sur leurs actifs non productifs vise l\'optimisation sans toucher l\'investissement productif, mais sa conception est délicate.',
    pour: ['Lutter contre l\'optimisation des grands patrimoines'],
    contre: ['Complexité, risque juridique', 'Rendement incertain'],
    exemples: ['Belgique : taxe sur les comptes-titres'],
    options: [{ id: 'oui', nom: 'Taxe de 2 % sur les actifs non professionnels des holdings' }],
    delai: 2,
    effets: (e, o, age) => ({ recettes: { fixe: 1.0 * Math.pow(0.97, age) * prix(e) } }),
    reaction: () => ({ chocs: { entrepreneurs: -3, salaries: 1 } }),
    axes: { fiscal: 0.6, marche: -0.2 },
    chiffrage: 'Hypothèse de jeu : environ 1 Md€ par an, en érosion.',
  },
  {
    id: 'emploi_domicile',
    nom: 'Crédit d\'impôt pour l\'emploi à domicile',
    categorie: 'fiscalite', pays: FR, vehicule: 'PLF',
    resume: 'Une des plus grosses niches fiscales (environ 6 Md€) : 50 % des dépenses de ménage, garde d\'enfants ou aide aux personnes âgées, jusqu\'à un plafond.',
    pedagogie: 'Elle soutient l\'emploi déclaré et le maintien à domicile des personnes âgées, mais profite davantage aux ménages aisés. Abaisser le plafond cible l\'effort sur les plus gros utilisateurs.',
    pour: ['Une niche coûteuse et concentrée sur les ménages aisés'],
    contre: ['Retour du travail non déclaré', 'Pénalise des personnes âgées dépendantes'],
    exemples: ['Belgique : titres-services subventionnés'],
    options: [{ id: 'plafond', nom: 'Abaisser le plafond de 12 000 € à 8 000 € (hors dépendance)' }],
    delai: 2,
    effets: (e, o, age) => ({ recettes: { impotRevenu: 1.0 * rampe(age, 4) * prix(e) }, chomageStructurel: 0.02 }),
    reaction: () => ({ chocs: { retraites: -2, entrepreneurs: -1 }, credibilite: 0.02 }),
    axes: { fiscal: 0.4 },
    chiffrage: 'Hypothèse de jeu : environ 1 Md€ par an.',
  },
  {
    id: 'cir',
    nom: 'Crédit d\'impôt recherche',
    categorie: 'fiscalite', pays: FR, vehicule: 'PLF',
    resume: 'Environ 7 Md€ par an : le CIR est l\'un des soutiens à la recherche privée les plus généreux au monde. Faut-il le recentrer ?',
    pedagogie: 'Les évaluations montrent un effet réel sur la recherche des PME, plus discuté pour les grands groupes. Le recentrer économit, au prix d\'un signal négatif pour l\'attractivité.',
    pour: ['Économies et meilleur ciblage sur les PME', 'Effet d\'aubaine pour les grands groupes'],
    contre: ['Atout d\'attractivité pour les centres de recherche', 'Instabilité fiscale'],
    exemples: ['Royaume-Uni : crédit d\'impôt R&D réformé en 2024'],
    options: [{ id: 'recentrer', nom: 'Recentrer le CIR sur les PME et ETI' }],
    delai: 2,
    effets: (e, o, age) => ({ recettes: { impotSocietes: 1.5 * rampe(age, 4) * prix(e) }, potentielBonus: -0.01 }),
    reaction: () => ({ chocs: { entrepreneurs: -3 }, credibilite: 0.02 }),
    axes: { fiscal: 0.4, marche: -0.3 },
    chiffrage: 'Hypothèse de jeu : environ 1,5 Md€ par an.',
  },
  {
    id: 'ir_classes_moyennes',
    nom: 'Baisser l\'impôt des classes moyennes',
    categorie: 'fiscalite', pays: FR, vehicule: 'PLF',
    resume: 'Réduire le taux de la deuxième tranche de l\'impôt sur le revenu (11 %).',
    pedagogie: 'Une baisse d\'impôt soutient le pouvoir d\'achat et la popularité, mais creuse le déficit au moment où la France est sous procédure pour déficit excessif et où les marchés s\'inquiètent.',
    pour: ['Pouvoir d\'achat des classes moyennes, qui se sentent les grandes perdantes'],
    contre: ['Coût élevé', 'Mauvais signal envoyé aux marchés et à Bruxelles'],
    exemples: ['Italie : baisse de l\'impôt des tranches moyennes en 2025'],
    options: [{ id: 'baisse', nom: 'Baisser la deuxième tranche de 11 % à 10 %' }],
    delai: 1,
    effets: (e) => ({ recettes: { impotRevenu: -4.5 * prix(e) }, menages: { couple: [{ montant: 35, texte: 'Baisse de l\'impôt sur le revenu' }], fonctionnaire: [{ montant: 15, texte: 'Baisse de l\'impôt sur le revenu' }], artisan: [{ montant: 20, texte: 'Baisse de l\'impôt sur le revenu' }] } }),
    reaction: () => ({ chocs: { salaries: 4, fonctionnaires: 3, retraites: 2, entrepreneurs: 2 }, credibilite: -0.08 }),
    axes: { fiscal: -0.6, rigueur: -0.6 },
    positionsGroupes: { RN: 0.3 },
    chiffrage: 'Hypothèse de jeu : environ 4,5 Md€ par an.',
  },
  {
    id: 'cvae',
    nom: 'Impôts de production : supprimer la CVAE',
    categorie: 'fiscalite', pays: FR, vehicule: 'PLF',
    resume: 'La suppression de la cotisation sur la valeur ajoutée des entreprises, engagée en 2023, a été repoussée faute de moyens. La terminer ?',
    pedagogie: 'Les impôts de production pèsent sur les entreprises avant même tout bénéfice, ce qui pénalise l\'industrie. Les supprimer améliore la compétitivité à long terme, mais coûte environ 4 Md€ par an.',
    pour: ['Compétitivité de l\'industrie', 'Promesse ancienne faite aux entreprises'],
    contre: ['Coût en pleine crise budgétaire', 'Cadeau aux entreprises sans contrepartie'],
    exemples: ['Allemagne : pas d\'impôt de production comparable hors taxe professionnelle locale'],
    options: [{ id: 'supprimer', nom: 'Supprimer la CVAE restante' }],
    delai: 2,
    appliquer(e) { if (e.entreprises) e.entreprises.bonusClimat += 3; },
    effets: (e) => ({ recettes: { fixe: -4 * prix(e) }, potentielBonus: 0.02 }),
    reaction: () => ({ chocs: { entrepreneurs: 5, salaries: -1 }, credibilite: -0.05 }),
    axes: { marche: 0.6, fiscal: -0.4, rigueur: -0.3 },
    chiffrage: 'Hypothèse de jeu : environ 4 Md€ par an.',
  },
  {
    id: 'taxe_carbone',
    nom: 'Relancer la taxe carbone avec un chèque vert',
    categorie: 'energie', pays: FR, vehicule: 'PLF',
    resume: 'La trajectoire de la taxe carbone est gelée depuis les Gilets jaunes (2018). La relancer, en reversant l\'essentiel aux ménages modestes ?',
    pedagogie: 'Une taxe carbone est l\'outil le plus efficace pour réduire les émissions à coût minimal. Sa redistribution sous forme de chèque rend la mesure progressive : les ménages modestes peuvent y gagner. L\'acceptabilité reste le problème central, surtout pour les ménages ruraux dépendants de la voiture.',
    pour: ['Efficacité climatique', 'Redistribution possible'],
    contre: ['Risque de nouveau mouvement social', 'Pénalise les zones rurales et les agriculteurs'],
    exemples: ['Suède : taxe carbone à plus de 100 € la tonne depuis les années 2000', 'Canada : redevance carbone redistribuée aux ménages (supprimée pour les particuliers en 2025)'],
    options: [{ id: 'cheque', nom: '+10 % de taxes sur l\'énergie, 60 % reversés aux ménages modestes' }],
    delai: 2,
    appliquer(e) { if (e.impots.accisesEnergie) e.impots.accisesEnergie.taux = Math.min(e.impots.accisesEnergie.bornes[1], e.impots.accisesEnergie.taux + 10); },
    annuler(e) { if (e.impots.accisesEnergie) e.impots.accisesEnergie.taux -= 10; },
    effets: (e) => ({ depenses: { protectionSociale: 0.6 * 0.1 * e.impots.accisesEnergie.R0 * prix(e) }, menages: { smic: [{ montant: 12, texte: 'Chèque vert' }], jeune: [{ montant: 10, texte: 'Chèque vert' }], agriculteur: [{ montant: -15, texte: 'Taxe carbone sur le carburant' }] } }),
    reaction: () => ({ chocs: { agriculteurs: -8, salaries: -3, jeunes: 2 }, grief: { agriculteurs: 5, salaries: 2 } }),
    axes: { ecologie: 0.8, fiscal: 0.4, social: 0.2 },
    chiffrage: 'Environ 10 % du rendement des taxes énergétiques, dont 60 % reversés (hypothèse de jeu).',
  },

  // ======================================================================
  // ÉNERGIE, ÉDUCATION
  // ======================================================================
  {
    id: 'prix_electricite',
    nom: 'Baisser le prix de l\'électricité',
    categorie: 'energie', pays: FR, vehicule: 'PLF',
    resume: 'Avec la guerre en Iran, l\'énergie a bondi de plus de 20 % sur un an. Baisser les taxes sur l\'électricité ?',
    pedagogie: 'L\'accise sur l\'électricité a été relevée en 2024-2025 après le bouclier tarifaire. Baisser la TVA sur l\'électricité à 5,5 % est plus coûteux mais plus visible. Les deux réduisent l\'inflation mesurée, au prix de recettes en moins.',
    pour: ['Pouvoir d\'achat immédiat', 'Favorise l\'électrification (voitures, pompes à chaleur)'],
    contre: ['Coût budgétaire', 'Profite aussi aux gros consommateurs'],
    exemples: ['Espagne et Portugal : « exception ibérique » sur le prix de l\'électricité en 2022'],
    options: [
      { id: 'accise', nom: 'Baisser l\'accise sur l\'électricité (2 Md€)' },
      { id: 'tva', nom: 'TVA à 5,5 % sur l\'électricité (environ 4 Md€)' },
    ],
    delai: 1,
    effets: (e, o, age) => ({ recettes: { fixe: -(o === 'tva' ? 4 : 2) * prix(e) }, chocPrix: age === 0 ? -(o === 'tva' ? 0.15 : 0.08) : 0, menages: Object.fromEntries(['smic', 'couple', 'retraite', 'jeune', 'agriculteur'].map((id) => [id, [{ montant: o === 'tva' ? 9 : 5, texte: 'Électricité moins taxée' }]])) }),
    reaction: (e, o) => ({ chocs: { salaries: o === 'tva' ? 3 : 2, retraites: o === 'tva' ? 3 : 2, jeunes: 1 }, credibilite: -0.04 }),
    axes: { social: 0.4, rigueur: -0.4 },
    positionsGroupes: { RN: 0.5, UDR: 0.4, LFI: 0.2 },
    chiffrage: 'Hypothèses de jeu : 2 Md€ (accise) ou 4 Md€ (TVA) par an.',
  },
  {
    id: 'enseignants',
    nom: 'Revaloriser les enseignants',
    categorie: 'education', pays: FR, vehicule: 'décret', vote: false,
    resume: 'Les enseignants français sont moins payés que la moyenne de l\'OCDE en milieu de carrière, et les concours peinent à recruter.',
    pedagogie: 'Une revalorisation améliore l\'attractivité du métier et, à long terme, le capital humain. Son coût est élevé : l\'éducation emploie plus d\'un million d\'agents.',
    pour: ['Crise du recrutement', 'Effet de long terme sur les compétences'],
    contre: ['Coût permanent', 'Sans réforme des carrières, effet incertain'],
    exemples: ['Allemagne : enseignants parmi les mieux payés de l\'OCDE'],
    options: [{ id: 'deux_md', nom: '+2 Md€ par an de revalorisations' }],
    delai: 1,
    effets: (e, o, age) => ({ depenses: { education: 2 * rampe(age, 2) * prix(e) }, potentielBonus: 0.005, menages: { fonctionnaire: [{ montant: 60, texte: 'Revalorisation des enseignants' }] } }),
    reaction: () => ({ chocs: { fonctionnaires: 5, jeunes: 1 }, credibilite: -0.03 }),
    axes: { social: 0.4, rigueur: -0.3 },
    chiffrage: '2 Md€ par an.',
  },

  // ======================================================================
  // SÉCURITÉ, IMMIGRATION, LOGEMENT, AGRICULTURE, OUTRE-MER, INSTITUTIONS
  // ======================================================================
  {
    id: 'police_justice',
    nom: 'Plan police-justice',
    categorie: 'securite', pays: FR, vehicule: 'PLF',
    resume: 'Recruter des magistrats, des greffiers et des policiers, construire des places de prison.',
    pedagogie: 'La France compte environ 11 juges pour 100 000 habitants, contre 22 en moyenne en Europe (CEPEJ). Les prisons sont surpeuplées. Un plan pèse sur le budget, mais il est populaire.',
    pour: ['Délais de justice', 'Sentiment d\'insécurité'],
    contre: ['Coût en période de rigueur'],
    exemples: ['Allemagne : « pacte pour l\'État de droit » de recrutements de magistrats (2019)'],
    options: [{ id: 'plan', nom: 'Plan de 1,5 Md€ par an' }],
    delai: 1,
    effets: (e, o, age) => ({ depenses: { interieurJustice: 1.5 * rampe(age, 2) * prix(e) } }),
    reaction: () => ({ chocs: { retraites: 3, salaries: 1, fonctionnaires: 2 }, credibilite: -0.02 }),
    axes: { securite: 0.8, rigueur: -0.2 },
    chiffrage: '1,5 Md€ par an.',
  },
  {
    id: 'immigration_travail',
    nom: 'Immigration de travail',
    categorie: 'immigration', pays: FR, vehicule: 'loi',
    resume: 'Faut-il régulariser les travailleurs sans papiers des métiers en tension, ou durcir les conditions d\'entrée et de séjour ?',
    pedagogie: 'Le bâtiment, la restauration, l\'aide à domicile et l\'agriculture manquent de main-d\'œuvre. Une régularisation ciblée augmente l\'emploi déclaré et les cotisations ; un durcissement répond à une demande forte de l\'opinion, au prix de pénuries accrues.',
    pour: ['Régulariser : pénuries de main-d\'œuvre, cotisations', 'Durcir : maîtrise des flux, attente de l\'opinion'],
    contre: ['Régulariser : « appel d\'air » selon ses opposants', 'Durcir : pénuries dans les secteurs en tension'],
    exemples: ['Espagne : régularisation de plus de 500 000 personnes décidée en 2024-2025', 'Danemark : politique très restrictive depuis les années 2000'],
    options: [
      { id: 'regulariser', nom: 'Régulariser les travailleurs des métiers en tension' },
      { id: 'durcir', nom: 'Durcir les conditions d\'entrée et de séjour' },
    ],
    delai: 2,
    effets: (e, o, age) => (o === 'regulariser'
      ? { offreTravail: 0.12 * rampe(age, 4), recettes: { cotisations: 0.6 * rampe(age, 4) * prix(e) } }
      : { offreTravail: -0.04 * rampe(age, 4), depenses: { interieurJustice: 0.3 * prix(e) } }),
    reaction: (e, o) => (o === 'regulariser' ? { chocs: { entrepreneurs: 3, retraites: -4, salaries: -1 } } : { chocs: { retraites: 4, salaries: 1, entrepreneurs: -2, jeunes: -2 } }),
    axes: { securite: -0.6, social: 0.3, marche: 0.3 },
    axesParOption: { durcir: { securite: 0.9, social: -0.3, marche: -0.1 } },
    chiffrage: 'Hypothèses de jeu : +0,12 % d\'actifs et 0,6 Md€ de cotisations (régularisation) ; 0,3 Md€ de coûts (durcissement).',
  },
  {
    id: 'ame',
    nom: 'Aide médicale de l\'État (AME)',
    categorie: 'immigration', pays: FR, vehicule: 'PLF',
    resume: 'L\'AME couvre les soins des étrangers en situation irrégulière (environ 1,2 Md€). La transformer en aide médicale d\'urgence ?',
    pedagogie: 'Le rapport Évin-Stefanini (2023) jugeait l\'AME « utile » sur le plan sanitaire et sans effet d\'attraction démontré, tout en proposant des ajustements. La droite et le RN veulent la réduire aux urgences.',
    pour: ['Économies', 'Message de fermeté'],
    contre: ['Risque sanitaire (maladies non soignées qui s\'aggravent)', 'Report vers les urgences, plus coûteuses'],
    exemples: ['Allemagne : soins limités aux urgences et aux douleurs aiguës pour les demandeurs d\'asile pendant 36 mois'],
    options: [{ id: 'urgence', nom: 'Transformer l\'AME en aide médicale d\'urgence' }],
    delai: 2,
    effets: (e, o, age) => ({ depenses: { sante: -0.4 * rampe(age, 4) * prix(e) } }),
    reaction: () => ({ chocs: { retraites: 3, jeunes: -2 } }),
    axes: { securite: 0.6, social: -0.6 },
    chiffrage: 'Hypothèse de jeu : environ 0,4 Md€ par an d\'économies nettes, une partie des soins se reportant sur l\'hôpital.',
  },
  {
    id: 'logement_relance',
    nom: 'Relancer la construction de logements',
    categorie: 'logement', pays: FR, vehicule: 'PLF',
    resume: 'La construction est au plus bas depuis des décennies. Créer un statut fiscal du bailleur privé et élargir le prêt à taux zéro ?',
    pedagogie: 'Le logement neuf crée de l\'activité et des emplois ; les aides fiscales à l\'investissement locatif ont un coût élevé et des effets d\'aubaine. La crise du logement pèse sur les jeunes actifs.',
    pour: ['Activité du bâtiment', 'Accès au logement des jeunes'],
    contre: ['Coût fiscal', 'Profite aux investisseurs aisés'],
    exemples: ['Allemagne : amortissement fiscal majoré pour les logements neufs (2023)'],
    options: [{ id: 'relance', nom: 'Statut du bailleur privé et prêt à taux zéro élargi' }],
    delai: 2,
    effets: (e, o, age) => ({ recettes: { fixe: -1.5 * rampe(age, 4) * prix(e) }, potentielBonus: 0.01, chomageStructurel: -0.03 * rampe(age, 6) }),
    reaction: () => ({ chocs: { jeunes: 3, entrepreneurs: 3, salaries: 1 } }),
    axes: { marche: 0.4, social: 0.2, rigueur: -0.2 },
    chiffrage: 'Hypothèse de jeu : environ 1,5 Md€ par an.',
  },
  {
    id: 'urgence_agricole',
    nom: 'Loi d\'urgence agricole',
    categorie: 'agriculture', pays: FR, vehicule: 'loi',
    resume: 'Simplifier les normes, faciliter l\'accès à l\'eau et soutenir le revenu des agriculteurs, après les mobilisations répétées contre le Mercosur.',
    pedagogie: 'Les agriculteurs réclament moins de normes et des prix rémunérateurs ; les écologistes craignent un recul environnemental (pesticides, retenues d\'eau).',
    pour: ['Revenu agricole', 'Souveraineté alimentaire'],
    contre: ['Reculs environnementaux', 'Coût des aides'],
    exemples: ['Pays-Bas : rachat d\'exploitations pour réduire les émissions d\'azote, très contesté'],
    options: [{ id: 'oui', nom: 'Simplification et 0,5 Md€ d\'aides par an' }],
    delai: 1,
    effets: (e, o, age) => ({ depenses: { agriculture: 0.5 * prix(e) }, menages: { agriculteur: [{ montant: 60, texte: 'Aides de la loi d\'urgence agricole' }] } }),
    reaction: () => ({ chocs: { agriculteurs: 8, jeunes: -1 } }),
    axes: { ecologie: -0.4, marche: 0.2, social: 0.2 },
    positionsGroupes: { RN: 0.3, ECOS: -0.4 },
    chiffrage: '0,5 Md€ par an.',
  },
  {
    id: 'vie_chere_outremer',
    nom: 'Vie chère dans les outre-mer',
    categorie: 'outre_mer', pays: FR, vehicule: 'loi',
    resume: 'Les prix alimentaires sont jusqu\'à 40 % plus élevés qu\'en métropole, source d\'émeutes en Martinique en 2024.',
    pedagogie: 'L\'octroi de mer (une taxe sur les produits importés) finance les collectivités d\'outre-mer ; le réformer baisse les prix mais demande de compenser leurs recettes.',
    pour: ['Pouvoir d\'achat, apaisement social'],
    contre: ['Recettes des collectivités à compenser'],
    exemples: ['Martinique : protocole de baisse des prix de 2024'],
    options: [{ id: 'oui', nom: 'Réformer l\'octroi de mer et plafonner les marges' }],
    delai: 2,
    effets: (e) => ({ depenses: { economieFinances: 0.3 * prix(e) } }),
    reaction: () => ({ chocs: { salaries: 1, jeunes: 1 } }),
    axes: { social: 0.4 },
    positionsGroupes: { LIOT: 0.4, GDR: 0.3 },
    chiffrage: 'Hypothèse de jeu : 0,3 Md€ de compensation par an.',
  },
  {
    id: 'proportionnelle',
    nom: 'Scrutin proportionnel aux législatives',
    categorie: 'institutions', pays: FR, vehicule: 'loi',
    resume: 'Élire les députés à la proportionnelle, comme en 1986. Promesse récurrente, défendue notamment par le RN et le MoDem.',
    pedagogie: 'La proportionnelle représente mieux la diversité des votes mais rend les majorités plus difficiles : il faut des coalitions. Effet contre-intuitif avec les sondages actuels : elle donnerait au RN un nombre de sièges proche de son score (environ un tiers), donc plus qu\'au scrutin à deux tours, où les reports de voix du second tour le pénalisent, et elle priverait le bloc central de ces reports. Changer le mode de scrutin relève d\'une loi ordinaire.',
    pour: ['Représentation fidèle des électeurs', 'Culture du compromis'],
    contre: ['Majorités plus fragiles', 'Lien plus faible entre le député et sa circonscription'],
    exemples: ['Allemagne : proportionnelle personnalisée', 'Pays-Bas : proportionnelle intégrale, coalitions longues à former'],
    options: [
      { id: 'integrale', nom: 'Proportionnelle intégrale par département' },
      { id: 'mixte', nom: 'Système mixte : 30 % des sièges à la proportionnelle' },
    ],
    delai: 1,
    appliquer(e, o) { e.politique.proportionnelle = o; },
    annuler(e) { e.politique.proportionnelle = null; },
    effets: () => ({}),
    reaction: () => ({ chocs: { jeunes: 1 } }),
    axes: {},
    positionsGroupes: { RN: 0.9, UDR: 0.6, DEM: 0.9, ECOS: 0.6, LFI: 0.5, GDR: 0.3, SOC: 0.2, LIOT: 0.2, EPR: 0.1, HOR: -0.3, DR: -0.8 },
    chiffrage: 'Sans effet budgétaire. Change la répartition des sièges aux prochaines législatives.',
  },

  // ======================================================================
  // BAISSE DES DÉPENSES PUBLIQUES
  // ======================================================================
  {
    id: 'agences_operateurs',
    nom: 'Fusionner ou supprimer des agences et opérateurs de l\'État',
    categorie: 'depenses', pays: FR, vehicule: 'décret', vote: false,
    resume: 'L\'État compte plusieurs centaines d\'agences et d\'opérateurs. Les fusionner promet des économies souvent surestimées ; supprimer celles qui font doublon avec les préfets et les collectivités va plus loin.',
    pedagogie: 'Les missions des agences ne disparaissent pas avec elles : l\'économie réelle vient des fonctions support mutualisées et met plusieurs années à se matérialiser. Les annonces de 2 à 3 Md€ se traduisent généralement par beaucoup moins (hypothèse de jeu). La commission d\'enquête du Sénat sur les agences (juillet 2025, 61 recommandations) juge les économies possibles « à missions constantes ». Jean-Louis Borloo y a dénoncé des agences devenues « une machine à penser à la place des élus », transformées d\'opérateurs en contrôleurs : il propose de rendre leurs missions aux préfets et aux collectivités.',
    pour: ['Lisibilité de l\'action publique', 'Économies de fonctions support'],
    contre: ['Rendement réel faible et lent', 'Désorganisation temporaire'],
    exemples: ['Royaume-Uni : « bonfire of the quangos » (2010), économies inférieures aux annonces'],
    sources: [{ texte: 'Public Sénat : Jean-Louis Borloo et les agences de l\'État', url: 'https://www.publicsenat.fr/actualites/parlementaire/agences-de-letat-jean-louis-borloo-pointe-une-machine-a-penser-a-la-place-des-elus' }],
    options: [
      { id: 'oui', nom: 'Programme de fusion et de suppression (annonce : 2 Md€)' },
      { id: 'doublons', nom: 'Supprimer les agences qui doublonnent avec les préfets et les collectivités (idée défendue par Jean-Louis Borloo)', description: 'Missions rendues aux préfets, aux régions et aux départements ; économie plus forte, désorganisation plus grande.' },
    ],
    delai: 1,
    effets: (e, o, age) => ({ depenses: { economieFinances: (o === 'doublons' ? -2.5 * rampe(age - 2, 12) + (age < 4 ? 0.3 : 0) : -0.8 * rampe(age, 8)) * prix(e) } }),
    reaction: (e, o) => (o === 'doublons' ? { chocs: { fonctionnaires: -5, retraites: 2, entrepreneurs: 1 }, grief: { fonctionnaires: 4 }, credibilite: 0.04, instabilite: 0.02 } : { chocs: { fonctionnaires: -3, retraites: 1 }, credibilite: 0.02 }),
    axes: { rigueur: 0.4, marche: 0.3 },
    chiffrage: 'Annoncé : 2 Md€. Rendement réel retenu : 0,8 Md€ par an au bout de deux ans ; suppression des doublons : 2,5 Md€ par an au bout de trois à quatre ans, après un coût de transition (hypothèses de jeu).',
  },
  {
    id: 'dotations_collectivites',
    nom: 'Dotations aux collectivités locales',
    categorie: 'depenses', pays: FR, vehicule: 'PLF',
    resume: 'Geler la dotation globale de fonctionnement (DGF) des communes, départements et régions.',
    pedagogie: 'Les collectivités réalisent l\'essentiel de l\'investissement public. Les priver de ressources les conduit à couper d\'abord dans l\'investissement, ce qui pèse sur l\'activité du bâtiment. Les maires, nombreux au Sénat, s\'y opposent.',
    pour: ['Associer les collectivités à l\'effort', 'Économie rapide'],
    contre: ['Baisse de l\'investissement local', 'Hausse possible des impôts locaux'],
    exemples: ['France 2014-2017 : baisse de la DGF de 11 Md€, suivie d\'un recul de l\'investissement local'],
    options: [{ id: 'gel', nom: 'Gel en valeur de la DGF' }],
    delai: 1,
    effets: (e, o, age) => ({ depenses: { economieFinances: -1.5 * rampe(age, 4) * prix(e), transports: -0.5 * rampe(age, 4) * prix(e) } }),
    reaction: () => ({ chocs: { fonctionnaires: -2, agriculteurs: -1 }, credibilite: 0.03 }),
    axes: { rigueur: 0.5, social: -0.2 },
    positionsGroupes: { LIOT: -0.5, DR: -0.3 },
    chiffrage: 'Hypothèse de jeu : environ 2 Md€ par an, dont 0,5 Md€ d\'investissement local en moins.',
  },
  {
    id: 'jour_ferie',
    nom: 'Supprimer des jours fériés',
    categorie: 'depenses', pays: FR, vehicule: 'loi',
    resume: 'Proposition du Premier ministre de l\'époque, en juillet 2025 : supprimer deux jours fériés (lundi de Pâques et 8 mai), avec une contribution des employeurs reversée à l\'État.',
    pedagogie: 'Un jour travaillé en plus augmente la production ; la contribution des employeurs (comme la « journée de solidarité » de 2004) capte une partie du gain pour l\'État. La mesure est très impopulaire.',
    pour: ['Rendement élevé : 4,2 Md€ annoncés pour deux jours', 'Plus de production'],
    contre: ['Très impopulaire', 'Valeur symbolique et mémorielle du 8 mai'],
    exemples: ['Danemark : suppression d\'un jour férié (2023) pour financer la défense'],
    options: [
      { id: 'un', nom: 'Supprimer un jour férié' },
      { id: 'deux', nom: 'Supprimer deux jours fériés (proposition de 2025)' },
    ],
    delai: 2,
    effets: (e, o, age) => ({ recettes: { fixe: (o === 'deux' ? 4.2 : 2.1) * rampe(age, 2) * prix(e) }, offreTravail: o === 'deux' ? 0.35 : 0.17 }),
    reaction: (e, o) => ({ chocs: { salaries: o === 'deux' ? -8 : -5, fonctionnaires: -5, jeunes: -4, retraites: 1, entrepreneurs: -1 }, grief: { salaries: o === 'deux' ? 5 : 3, fonctionnaires: 3 }, credibilite: 0.06 }),
    axes: { travail: 0.7, rigueur: 0.6, social: -0.3 },
    chiffrage: '4,2 Md€ annoncés pour deux jours (annonce de juillet 2025) ; moitié pour un jour.',
  },
  {
    id: 'annee_blanche',
    nom: 'Année blanche',
    categorie: 'depenses', pays: FR, vehicule: 'PLF',
    resume: 'Geler en valeur, pendant un an, les prestations sociales, les pensions, le barème de l\'impôt et les crédits de l\'État.',
    pedagogie: 'Avec 3 % d\'inflation, une année blanche rapporte beaucoup, car tout le monde participe un peu. Elle frappe davantage les ménages modestes et les retraités (en termes réels), et peut fragiliser la consommation.',
    pour: ['Effort partagé par tous', 'Rendement élevé'],
    contre: ['Perte de pouvoir d\'achat généralisée', 'Effet récessif'],
    exemples: ['Grèce et Portugal : gels prolongés pendant la crise des dettes souveraines'],
    options: [{ id: 'oui', nom: 'Année blanche en 2027' }],
    delai: 1,
    effets: (e, o, age) => {
      const inflation = Math.max(0, e.macro.inflation) / 100;
      const r = age < 4 ? rampe(age, 4) : 1;
      return {
        depenses: { retraites: -inflation * 0.7 * e.budget.retraites.montant * r, protectionSociale: -inflation * 0.5 * e.budget.protectionSociale.montant * r, economieFinances: -inflation * 0.3 * e.budget.economieFinances.montant * r },
        recettes: { impotRevenu: inflation * 1.5 * e.impots.impotRevenu.R0 * r },
        menages: { retraite: [{ montant: -inflation * 1700 * r, texte: 'Pension gelée (année blanche)' }], smic: [{ montant: -inflation * 300 * r, texte: 'Prestations gelées' }] },
      };
    },
    reaction: () => ({ chocs: { retraites: -7, salaries: -4, jeunes: -3, fonctionnaires: -4 }, grief: { retraites: 4, salaries: 2 }, credibilite: 0.1 }),
    axes: { rigueur: 0.9, social: -0.6 },
    chiffrage: 'Calculé avec l\'inflation de l\'année : de l\'ordre de 10 à 15 Md€ avec 3 % d\'inflation (calcul du jeu).',
  },
];
