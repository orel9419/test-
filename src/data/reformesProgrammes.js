/**
 * Réformes issues des programmes de personnalités politiques (France),
 * quand elles n'existaient pas déjà dans le catalogue. Chaque mesure est
 * rattachée à des propositions publiques et sourcées (voir
 * src/data/programmes.js) ; les montants sans source sont des hypothèses de
 * jeu, signalées comme telles.
 */

const rampe = (age, n) => Math.min(1, Math.max(0, (age + 1) / n));
const prix = (e) => e.macro.niveauPrix / 100;
const FR = ['france'];
const ans = (age) => Math.max(0, age) / 4;

/** Répartit une économie (négative) sur les postes de dépense, hors retraites, défense, police et justice. */
function repartirEconomie(e, montant) {
  const exclus = ['retraites', 'defense', 'interieurJustice'];
  const postes = Object.entries(e.budget).filter(([id]) => !exclus.includes(id));
  const total = postes.reduce((s, [, l]) => s + l.montantInitial, 0);
  return Object.fromEntries(postes.map(([id, l]) => [id, montant * l.montantInitial / total]));
}

export const REFORMES_PROGRAMMES = [
  {
    id: 'blocage_prix',
    nom: 'Bloquer les prix des produits de première nécessité',
    categorie: 'protection_sociale', pays: FR, vehicule: 'loi',
    resume: 'Geler les prix de l\'alimentation de base, de l\'énergie et des produits d\'hygiène, ou y supprimer la TVA.',
    pedagogie: 'Le blocage protège immédiatement le pouvoir d\'achat, mais il comprime les marges des producteurs et des distributeurs : risque de pénuries, de baisse de qualité ou de rattrapage à la sortie du blocage. Supprimer la TVA sur ces produits coûte au budget et ne se répercute pas toujours entièrement sur les prix. La France a déjà encadré des prix (bouclier tarifaire sur l\'énergie en 2022-2023).',
    pour: ['Effet immédiat sur le pouvoir d\'achat des ménages modestes', 'Lutte contre les marges jugées excessives'],
    contre: ['Pénuries et effets pervers sur l\'offre', 'Coût budgétaire (TVA à 0 %)', 'Rattrapage des prix à la sortie'],
    exemples: ['Hongrie : plafonnement des prix de produits alimentaires en 2022, suivi de pénuries et d\'une inflation alimentaire record', 'Espagne : TVA à 0 % sur les produits de base en 2023-2024'],
    options: [
      { id: 'blocage', nom: 'Bloquer les prix (alimentation de base, énergie, hygiène)' },
      { id: 'tva_zero', nom: 'TVA à 0 % sur un panier de produits de première nécessité' },
    ],
    positionsGroupesParOption: {
      blocage: { LFI: 1, GDR: 1, ECOS: 0.6, SOC: 0.4, RN: 0.2, DR: -0.8, HOR: -0.8, EPR: -0.6, DEM: -0.4 },
      tva_zero: { LFI: 0.8, GDR: 0.8, RN: 0.6, UDR: 0.4, ECOS: 0.3, SOC: 0.3, DR: -0.5, HOR: -0.6, EPR: -0.5 },
    },
    delai: 1,
    effets(e, o, age) {
      if (o === 'tva_zero') return { recettes: { tva: -8 * prix(e) }, chocPrix: age === 0 ? -0.6 : 0, menages: { smic: [{ montant: 20, texte: 'TVA à 0 % sur les produits de première nécessité' }], couple: [{ montant: 30, texte: 'TVA à 0 % sur les produits de première nécessité' }], retraite: [{ montant: 15, texte: 'TVA à 0 % sur les produits de première nécessité' }] } };
      return { depenses: { economieFinances: 1.5 * prix(e) }, chocPrix: age === 0 ? -0.5 : 0, potentielBonus: -0.01, menages: { smic: [{ montant: 15, texte: 'Blocage des prix' }], retraite: [{ montant: 10, texte: 'Blocage des prix' }] } };
    },
    reaction: (e, o) => ({ chocs: { salaries: 4, retraites: 3, jeunes: 2, entrepreneurs: o === 'blocage' ? -6 : -1, agriculteurs: o === 'blocage' ? -4 : 0 }, credibilite: o === 'blocage' ? -0.05 : -0.08 }),
    axes: { social: 0.8, marche: -0.8 },
    axesParOption: { tva_zero: { social: 0.6, marche: -0.2, rigueur: -0.5 } },
    chiffrage: 'Hypothèses de jeu : blocage, 1,5 Md€ par an d\'aides aux petits producteurs et commerçants ; TVA à 0 %, environ 8 Md€ par an. Baisse ponctuelle des prix d\'environ 0,5 point.',
  },
  {
    id: 'ir_progressif',
    nom: 'Impôt sur le revenu à 14 tranches',
    categorie: 'fiscalite', pays: FR, vehicule: 'PLF',
    resume: 'Rendre l\'impôt sur le revenu plus progressif : 14 tranches au lieu de 5 ; selon La France insoumise, baisse pour les revenus inférieurs à environ 4 000 € par mois, hausse au-delà.',
    pedagogie: 'Proposition de La France insoumise. L\'impôt sur le revenu est payé par environ 45 % des foyers et très concentré : les 10 % les plus aisés en acquittent environ 70 %. Plus de tranches permettent de cibler la hausse sur les hauts revenus, au risque d\'encourager l\'optimisation et l\'expatriation fiscale.',
    pour: ['Justice fiscale : faire contribuer davantage les hauts revenus', 'Baisse d\'impôt pour les classes moyennes'],
    contre: ['Rendement incertain (optimisation, départs)', 'Hausse sur les cadres qualifiés, déjà très taxés'],
    options: [{ id: 'quatorze', nom: 'Passer à 14 tranches, plus progressives' }],
    positionsGroupes: { LFI: 1, GDR: 1, ECOS: 0.7, SOC: 0.5, RN: -0.3, DR: -1, HOR: -1, EPR: -0.8, DEM: -0.5, UDR: -1 },
    delai: 2,
    effets: (e) => ({ recettes: { impotRevenu: 6 * prix(e) }, potentielBonus: -0.005, menages: { couple: [{ montant: -25, texte: 'Impôt sur le revenu à 14 tranches' }], smic: [{ montant: 5, texte: 'Impôt sur le revenu à 14 tranches' }], fonctionnaire: [{ montant: 5, texte: 'Impôt sur le revenu à 14 tranches' }] } }),
    reaction: () => ({ chocs: { entrepreneurs: -5, salaries: 1, jeunes: 1 }, credibilite: -0.03 }),
    axes: { fiscal: 1, social: 0.5 },
    chiffrage: 'Hypothèse de jeu : environ 6 Md€ de recettes nettes par an.',
  },
  {
    id: 'constituante',
    nom: 'VIe République : Assemblée constituante',
    categorie: 'institutions', pays: FR, vehicule: 'loi',
    majoriteRenforcee: true,
    resume: 'Convoquer une Assemblée constituante élue à la proportionnelle pour écrire une nouvelle Constitution.',
    pedagogie: 'Proposition de La France insoumise : les membres de la constituante ne pourraient pas se présenter ensuite. Changer de Constitution suppose une révision de la Constitution actuelle ou un référendum ; la période de transition crée de l\'incertitude pour les institutions et les marchés. La Ve République a été modifiée 25 fois depuis 1958.',
    pour: ['Rééquilibrer les pouvoirs au profit du Parlement et des citoyens', 'Répondre à la défiance envers les institutions'],
    contre: ['Instabilité pendant la transition', 'Risque de blocage institutionnel'],
    options: [{ id: 'convoquer', nom: 'Convoquer une Assemblée constituante' }],
    positionsGroupes: { LFI: 1, GDR: 0.6, ECOS: 0.4, SOC: -0.3, RN: -0.8, UDR: -0.9, DR: -1, EPR: -1, HOR: -1, DEM: -0.8, LIOT: -0.4 },
    delai: 4,
    effets: () => ({}),
    reaction: () => ({ chocs: { entrepreneurs: -4, retraites: -2, jeunes: 2 }, credibilite: -0.15, instabilite: 0.2 }),
    axes: { social: 0.3 },
    chiffrage: 'Pas d\'effet budgétaire direct ; instabilité et méfiance des marchés pendant la transition (hypothèse de jeu).',
  },
  {
    id: 'tva_energie',
    nom: 'TVA à 5,5 % sur l\'énergie',
    categorie: 'energie', pays: FR, vehicule: 'PLF',
    resume: 'Baisser la TVA de 20 % à 5,5 % sur les carburants, le fioul, le gaz et l\'électricité.',
    pedagogie: 'Proposition du Rassemblement national (programme présidentiel de 2022). Mesure très visible sur les factures, mais coûteuse, et qui profite davantage aux ménages qui consomment beaucoup d\'énergie. Elle réduit le signal-prix sur les énergies fossiles, donc augmente les émissions. Sa compatibilité avec la directive européenne sur la TVA est à vérifier pour les carburants.',
    pour: ['Pouvoir d\'achat immédiat, surtout pour les ménages qui dépendent de la voiture', 'L\'énergie est un bien de première nécessité'],
    contre: ['Coût budgétaire élevé', 'Favorise les gros consommateurs', 'Contraire à la transition climatique'],
    exemples: ['Allemagne : TVA réduite sur le gaz en 2022-2024', 'Bouclier tarifaire français de 2022-2023'],
    options: [{ id: 'cinq_cinq', nom: 'TVA à 5,5 % sur toute l\'énergie' }],
    positionsGroupes: { RN: 1, UDR: 0.8, GDR: 0.3, LFI: 0.2, DR: 0.1, LIOT: 0.2, ECOS: -0.8, EPR: -0.5, HOR: -0.6, DEM: -0.4, SOC: -0.2 },
    delai: 1,
    effets: (e, o, age) => ({ recettes: { tva: -12 * prix(e) }, chocPrix: age === 0 ? -0.9 : 0, emissionsEvitees: -2, menages: { smic: [{ montant: 30, texte: 'TVA à 5,5 % sur l\'énergie' }], couple: [{ montant: 45, texte: 'TVA à 5,5 % sur l\'énergie' }], retraite: [{ montant: 25, texte: 'TVA à 5,5 % sur l\'énergie' }], jeune: [{ montant: 20, texte: 'TVA à 5,5 % sur l\'énergie' }], agriculteur: [{ montant: 30, texte: 'TVA à 5,5 % sur l\'énergie' }] } }),
    reaction: () => ({ chocs: { salaries: 5, retraites: 4, jeunes: 3, agriculteurs: 3 }, credibilite: -0.08 }),
    axes: { social: 0.4, ecologie: -0.8, rigueur: -0.6 },
    chiffrage: 'Hypothèse de jeu : environ 12 Md€ de recettes en moins par an ; baisse ponctuelle des prix d\'environ 0,9 point ; environ 2 Mt de CO2 de plus par an.',
  },
  {
    id: 'ir_moins_30',
    nom: 'Exonérer d\'impôt sur le revenu les moins de 30 ans',
    categorie: 'fiscalite', pays: FR, vehicule: 'PLF',
    resume: 'Supprimer l\'impôt sur le revenu des jeunes actifs jusqu\'à 30 ans, pour les retenir en France.',
    pedagogie: 'Proposition du Rassemblement national (programme de 2022). Beaucoup de jeunes paient peu ou pas d\'impôt sur le revenu : le gain est concentré sur les jeunes diplômés les mieux payés. La mesure crée un effet de seuil à 30 ans et une différence de traitement selon l\'âge, dont la constitutionnalité est discutée.',
    pour: ['Retenir les jeunes diplômés', 'Soutenir l\'entrée dans la vie active'],
    contre: ['Profite surtout aux jeunes les mieux payés', 'Rupture d\'égalité devant l\'impôt', 'Effet de seuil à 30 ans'],
    exemples: ['Portugal : IRS Jovem, exonération partielle des jeunes pendant dix ans', 'Pologne : exonération des moins de 26 ans depuis 2019'],
    options: [{ id: 'exonerer', nom: 'Exonérer les moins de 30 ans' }],
    positionsGroupes: { RN: 1, UDR: 0.8, DR: 0.2, HOR: 0, EPR: -0.4, LFI: -0.6, ECOS: -0.5, SOC: -0.5, GDR: -0.5 },
    delai: 1,
    effets: (e) => ({ recettes: { impotRevenu: -3 * prix(e) }, offreTravail: 0.03, menages: { jeune: [{ montant: 60, texte: 'Exonération d\'impôt sur le revenu (moins de 30 ans)' }] } }),
    reaction: () => ({ chocs: { jeunes: 6, salaries: -1, retraites: -1 }, credibilite: -0.03 }),
    axes: { fiscal: -0.5 },
    chiffrage: 'Hypothèse de jeu : environ 3 Md€ par an.',
  },
  {
    id: 'priorite_nationale',
    nom: 'Priorité nationale (référendum)',
    categorie: 'immigration', pays: FR, vehicule: 'loi',
    majoriteRenforcee: true,
    resume: 'Inscrire dans la Constitution une priorité aux Français pour le logement social, l\'emploi et certaines prestations sociales.',
    pedagogie: 'Proposition centrale du Rassemblement national, qui veut l\'adopter par référendum. Elle se heurte au principe d\'égalité de la Constitution actuelle, à la Convention européenne des droits de l\'homme et au droit de l\'Union (libre circulation des citoyens européens), d\'où le passage par une révision constitutionnelle. Les économies annoncées par ses promoteurs sont discutées.',
    pour: ['Réserver la solidarité nationale aux nationaux selon ses partisans', 'Réduire l\'attractivité sociale de l\'immigration'],
    contre: ['Discrimination contraire aux engagements européens et internationaux', 'Conflits juridiques et diplomatiques', 'Pénuries de main-d\'œuvre dans certains métiers'],
    exemples: ['Danemark : conditions de résidence pour certaines prestations', 'Royaume-Uni : accès aux prestations restreint pour les étrangers non résidents permanents'],
    options: [{ id: 'referendum', nom: 'Réviser la Constitution pour instaurer la priorité nationale' }],
    positionsGroupes: { RN: 1, UDR: 1, DR: 0.1, EPR: -0.8, HOR: -0.6, DEM: -0.8, LIOT: -0.5, SOC: -1, LFI: -1, ECOS: -1, GDR: -1 },
    delai: 4,
    effets: (e, o, age) => ({ depenses: { protectionSociale: -2 * rampe(age, 8) * prix(e), logement: -0.3 * prix(e) }, influence: -1.5 }),
    reaction: () => ({ chocs: { retraites: 3, salaries: 1, jeunes: -3, entrepreneurs: -1 }, instabilite: 0.08 }),
    axes: { securite: 0.6, social: -0.3, europe: -0.6 },
    chiffrage: 'Hypothèse de jeu : environ 2 Md€ d\'économies par an ; coût diplomatique (influence) et contentieux juridiques.',
  },
  {
    id: 'revision_constitutionnelle',
    nom: 'Référendum élargi et « bouclier constitutionnel »',
    categorie: 'institutions', pays: FR, vehicule: 'loi',
    majoriteRenforcee: true,
    resume: 'Élargir le champ du référendum (article 11), notamment à l\'immigration, et permettre au droit français de primer sur le droit européen dans certains cas.',
    pedagogie: 'Proposition de Bruno Retailleau pour 2027, qu\'il veut soumettre directement aux Français à la rentrée 2027. Aujourd\'hui, l\'article 11 ne permet pas de référendum sur l\'immigration au sens large. Faire primer la loi nationale sur le droit européen ouvrirait un conflit avec la Cour de justice de l\'Union, qui juge que le droit de l\'Union prime sur les Constitutions nationales.',
    pour: ['Rendre la parole au peuple sur l\'immigration', 'Reprendre la maîtrise de la politique migratoire'],
    contre: ['Conflit avec le droit européen et la CEDH', 'Risque de référendums de division'],
    sources: [{ texte: 'Public Sénat : Bruno Retailleau veut « renverser la table » avec une réforme constitutionnelle', url: 'https://www.publicsenat.fr/actualites/politique/presidentielle-2027-bruno-retailleau-veut-renverser-la-table-avec-une-profonde-reforme-constitutionnelle' }],
    options: [{ id: 'referendum', nom: 'Réviser la Constitution par référendum' }],
    positionsGroupes: { DR: 1, UDR: 0.8, RN: 0.6, HOR: 0.1, EPR: -0.3, DEM: -0.6, LIOT: -0.2, SOC: -0.8, LFI: -0.8, ECOS: -0.8, GDR: -0.8 },
    delai: 4,
    effets: () => ({ influence: -1 }),
    reaction: () => ({ chocs: { retraites: 2, jeunes: -1 }, instabilite: 0.05 }),
    axes: { securite: 0.6, europe: -0.6 },
    chiffrage: 'Pas d\'effet budgétaire direct ; tensions avec les institutions européennes (influence).',
  },
  {
    id: 'dpe_location',
    nom: 'Supprimer les interdictions de louer les « passoires thermiques »',
    categorie: 'logement', pays: FR, vehicule: 'loi',
    resume: 'Revenir sur le calendrier de la loi Climat et résilience : les logements classés G ne peuvent plus être proposés à la location depuis 2025, les F à partir de 2028, les E à partir de 2034.',
    pedagogie: 'Les interdictions de louer poussent à rénover, mais elles retirent aussi des logements du marché locatif quand les propriétaires ne peuvent pas financer les travaux. Bruno Retailleau propose d\'y mettre fin dans son programme sur le logement. Le diagnostic de performance énergétique (DPE) est lui-même critiqué pour sa fiabilité.',
    pour: ['Plus de logements à louer', 'Moins de contraintes pour les petits propriétaires'],
    contre: ['Moins de rénovations, des factures et des émissions plus élevées', 'Des locataires modestes dans des logements mal isolés'],
    sources: [{ texte: 'Journal de l\'Agence : les propositions de Bruno Retailleau pour relancer le logement', url: 'https://www.journaldelagence.com/1411841-presidentielle-2027-les-propositions-de-bruno-retailleau-pour-relancer-le-logement' }],
    options: [{ id: 'supprimer', nom: 'Supprimer les interdictions de louer liées au DPE' }],
    positionsGroupes: { DR: 0.8, UDR: 0.8, RN: 0.6, HOR: 0.4, EPR: 0.2, DEM: 0, LIOT: 0.2, ECOS: -1, LFI: -0.8, SOC: -0.5, GDR: -0.6 },
    delai: 1,
    effets: (e, o, age) => ({ emissionsEvitees: -Math.min(1.5, 0.15 * ans(age)), chocDemande: age < 4 ? 0.01 : 0 }),
    reaction: () => ({ chocs: { retraites: 2, jeunes: 1, entrepreneurs: 1 } }),
    axes: { marche: 0.5, ecologie: -0.6 },
    chiffrage: 'Hypothèse de jeu : jusqu\'à 1,5 Mt de CO2 de plus par an à terme, faute de rénovations.',
  },
  {
    id: 'choc_depenses',
    nom: 'Choc de baisse de la dépense publique (200 Md€ en cinq ans)',
    categorie: 'depenses', pays: FR, vehicule: 'PLF',
    resume: '80 Md€ d\'économies la première année, 200 Md€ sur le quinquennat, rendus aux actifs par une baisse des cotisations (120 Md€) et aux entreprises par une baisse des impôts de production (40 Md€), le reste réduisant le déficit.',
    pedagogie: 'Proposition de David Lisnard (Nouvelle Énergie), qui vise une dépense publique ramenée vers 50 % du PIB, contre environ 57 % aujourd\'hui. 200 Md€, c\'est environ 6 points de PIB : un effort sans précédent en France. À court terme, la baisse des dépenses freine l\'activité ; à moyen terme, la baisse des prélèvements soutient l\'emploi et l\'investissement. Les économies portent ici sur tous les postes sauf les retraites, la défense, la police et la justice.',
    pour: ['Rendre du pouvoir d\'achat aux actifs (salaire net)', 'Restaurer la compétitivité et la soutenabilité de la dette'],
    contre: ['Choc récessif à court terme', 'Coupes massives dans les services publics et les prestations', 'Rejet social et politique très fort'],
    exemples: ['Canada : réduction des dépenses fédérales d\'environ 20 % au milieu des années 1990', 'Suède : consolidation budgétaire de 1993 à 1998'],
    sources: [{ texte: 'Europe 1 : David Lisnard, 80 Md€ d\'économies la première année et 200 Md€ sur le quinquennat', url: 'https://www.europe1.fr/politique/aujourdhui-en-france-on-depouille-les-actifs-au-profit-des-inactifs-denonce-david-lisnard-938960' }],
    options: [{ id: 'quinquennat', nom: '200 Md€ d\'économies en cinq ans, dont 160 Md€ rendus en baisses de prélèvements' }],
    positionsGroupes: { DR: 0.6, UDR: 0.8, HOR: 0.4, EPR: 0.1, DEM: -0.2, LIOT: -0.4, RN: -0.6, LFI: -1, GDR: -1, ECOS: -1, SOC: -1 },
    delai: 1,
    effets(e, o, age) {
      const t = ans(age);
      const economie = Math.min(200, 80 + 30 * t) * prix(e);
      const part = economie / (200 * prix(e));
      return {
        depenses: repartirEconomie(e, -economie),
        recettes: { cotisations: -120 * part * prix(e), fixe: -40 * part * prix(e) },
        offreTravail: 0.6 * part, chomageStructurel: -0.5 * part, potentielBonus: 0.05 * part,
        menages: { smic: [{ montant: 150 * part, texte: 'Baisse des cotisations : hausse du salaire net' }], couple: [{ montant: 350 * part, texte: 'Baisse des cotisations : hausse du salaire net' }], retraite: [{ montant: -40 * part, texte: 'Économies sur les prestations et les services' }], fonctionnaire: [{ montant: 60 * part, texte: 'Baisse des cotisations' }] },
      };
    },
    reaction: () => ({ chocs: { fonctionnaires: -15, retraites: -6, jeunes: -2, salaries: 2, entrepreneurs: 10 }, grief: { fonctionnaires: 15, retraites: 6 }, credibilite: 0.2, instabilite: 0.12 }),
    axes: { rigueur: 1, marche: 1, fiscal: -0.8, social: -0.8 },
    chiffrage: 'Montée en charge : 80 Md€ d\'économies la première année, 200 Md€ au bout de quatre ans ; 120 Md€ de cotisations et 40 Md€ d\'impôts de production en moins à terme (répartition annoncée, à vérifier).',
  },
];
