/**
 * Catalogue des prélèvements pilotables.
 *
 * Rendement d'un prélèvement au trimestre t (en Md€/an) :
 *   R = R0 × facteurTaux × facteurComportement × indiceBase(t)
 * avec
 *   facteurTaux         = 1 − partPilotable + partPilotable × (taux / tauxRef)
 *   facteurComportement = (taux / tauxRef) ^ elasticiteComportement
 *                         (érosion de l'assiette : optimisation, évasion, moindre activité)
 *   indiceBase(t)       = évolution de l'assiette économique (consommation,
 *                         salaires, profits, volume d'énergie...) depuis le départ.
 *
 * Les rendements de départ R0 et les taux de référence viennent des données
 * sourcées de chaque pays ; les élasticités et multiplicateurs sont des
 * hypothèses de modélisation.
 */
export const IMPOTS = {
  tva: {
    nom: 'TVA (taux normal)',
    levier: 'taux',
    unite: '%',
    base: 'consommation',
    partPilotable: 0.8,           // environ 80 % de l'assiette au taux normal
    elasticiteComportement: -0.1,
    multiplicateur: 0.5,
    repercussionPrix: true,
    description: 'Taxe sur la consommation. Rendement élevé et stable, mais elle pèse plus lourd, en proportion du revenu, sur les ménages modestes qui consomment tout leur revenu.',
  },
  impotRevenu: {
    nom: 'Impôt sur le revenu (barème)',
    levier: 'indice',
    unite: 'indice (100 = barème actuel)',
    base: 'revenus',
    partPilotable: 1,
    elasticiteComportement: -0.15,
    multiplicateur: 0.6,
    description: 'Impôt progressif. Un indice de 95 baisse tous les montants dus de 5 %. Ne pas revaloriser le barème avec l\'inflation (« année blanche ») le fait rapporter davantage.',
  },
  impotSocietes: {
    nom: 'Impôt sur les sociétés',
    levier: 'taux',
    unite: '%',
    base: 'profits',
    partPilotable: 0.9,
    elasticiteComportement: -0.4,  // transfert de bénéfices, sensible à la concurrence fiscale
    multiplicateur: 0.3,
    effetPotentielParPoint: -0.01, // 1 point de taux en plus = -0,01 pt de croissance potentielle par an (investissement)
    description: 'Impôt sur les bénéfices des entreprises. L\'effet de court terme sur l\'activité est faible, celui de long terme sur l\'investissement et l\'attractivité est réel.',
  },
  csg: {
    nom: 'CSG (taux sur les revenus d\'activité)',
    levier: 'taux',
    unite: '%',
    base: 'revenusLarges',
    partPilotable: 1,
    elasticiteComportement: -0.05,
    multiplicateur: 0.55,
    description: 'Contribution sociale généralisée : assiette très large (salaires, pensions, revenus du capital), d\'où un rendement élevé par point de taux.',
  },
  cotisations: {
    nom: 'Cotisations sociales',
    levier: 'indice',
    unite: 'indice (100 = taux actuels)',
    base: 'masseSalariale',
    partPilotable: 1,
    elasticiteComportement: -0.15,
    multiplicateur: 0.5,
    effetChomageStructurelParPoint: 0.03, // +1 % de cotisations = +0,03 pt de chômage structurel (coût du travail)
    description: 'Financent la Sécurité sociale. Les alléger baisse le coût du travail et favorise l\'emploi, surtout au niveau du salaire minimum, mais il faut compenser la perte de recettes.',
  },
  accisesEnergie: {
    nom: 'Taxes sur l\'énergie et le carbone',
    levier: 'indice',
    unite: 'indice (100 = tarifs actuels)',
    base: 'volumeEnergie',
    partPilotable: 1,
    elasticiteComportement: -0.2,
    multiplicateur: 0.4,
    effetEmissionsParPoint: -0.0015, // +1 % de taxe = -0,15 % d'émissions à terme (volume)
    description: 'Accises sur les carburants, le gaz et l\'électricité. Outil de la transition, mais très sensible politiquement : la hausse de la taxe carbone a déclenché le mouvement des Gilets jaunes en 2018.',
  },
  droitsSuccession: {
    nom: 'Droits de succession et taxation du patrimoine',
    levier: 'indice',
    unite: 'indice (100 = barème actuel)',
    base: 'patrimoine',
    partPilotable: 1,
    elasticiteComportement: -0.3,
    multiplicateur: 0.05,
    description: 'Peu d\'effet sur l\'activité à court terme. Très impopulaires chez les retraités et les indépendants, alors qu\'ils touchent surtout les gros patrimoines.',
  },
  fixe: {
    nom: 'Autres prélèvements (non pilotés)',
    levier: null,
    base: 'pib',
    partPilotable: 0,
    elasticiteComportement: 0,
    multiplicateur: 0,
    description: 'Impôts locaux, taxes de production, autres taxes, recettes non fiscales (ventes, dividendes...). Leur montant suit l\'activité.',
  },
};
