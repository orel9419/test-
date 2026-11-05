/**
 * Événements institutionnels (France) : ils ne sont jamais tirés par le
 * moteur des événements ; le module des institutions les injecte (aléa
 * séparé) quand ils deviennent possibles.
 *  - nominations au Conseil constitutionnel (article 56) : en mars, tous les
 *    trois ans à partir de 2028, si le joueur est président ;
 *  - demande de grâce (article 17) : rare, si le joueur est président ;
 *  - crise extrême et article 16 : très rare, une fois par partie au plus.
 * Cas présentés : situations types inspirées de faits réels, sans personnes
 * réelles. Effets : hypothèses de jeu.
 */
const jamais = () => false;
const evt = (x) => ({ pays: ['france'], condition: jamais, probabilite: () => 0, institutionnel: true, ...x });

export const EVENEMENTS_INSTITUTIONS = [
  evt({
    id: 'nominations_conseil',
    titre: 'Renouvellement du Conseil constitutionnel (article 56)',
    description: () => 'Trois des neuf membres arrivent au terme de leur mandat de neuf ans. Vous en nommez un ; les présidents de l\'Assemblée nationale et du Sénat nomment les deux autres. Votre choix passe devant les commissions des lois des deux assemblées, qui peuvent s\'y opposer à la majorité des trois cinquièmes (article 13).',
    choix: [
      { id: 'juriste', texte: 'Nommer un juriste reconnu (professeur de droit, haut magistrat)', effets: () => ({ credibilite: 0.01, institutions: { severiteCC: 0.03 }, texte: 'La nomination est saluée par les juristes de tous bords ; le Conseil restera exigeant envers les lois, y compris les vôtres.' }) },
      { id: 'politique', texte: 'Nommer un responsable politique de votre camp', effets: () => ({ credibilite: -0.02, institutions: { severiteCC: -0.06 }, chocs: { jeunes: -0.5, salaries: -0.3 }, texte: 'Les oppositions dénoncent une nomination de complaisance. Le Conseil pourrait se montrer un peu moins sévère envers vos lois, mais son autorité en pâtit.' }) },
      { id: 'societe_civile', texte: 'Nommer une personnalité de la société civile', effets: () => ({ institutions: { severiteCC: 0 }, chocs: { jeunes: 0.3 }, texte: 'Un choix d\'ouverture, bien accueilli ; les spécialistes s\'interrogent sur sa connaissance du contentieux constitutionnel.' }) },
    ],
  }),
  evt({
    id: 'demande_grace',
    titre: 'Une demande de grâce présidentielle (article 17)',
    description: () => 'Condamnée à dix ans de réclusion pour avoir tué son mari après des années de violences conjugales, une femme de 66 ans demande la grâce présidentielle. Une pétition a recueilli des centaines de milliers de signatures ; des magistrats rappellent que deux cours d\'assises ont tranché.',
    choix: [
      { id: 'partielle', texte: 'Accorder une grâce partielle (libération conditionnelle possible)', effets: () => ({ chocs: { salaries: 0.6, jeunes: 0.8, retraites: 0.3 }, texte: 'La grâce dispense d\'une partie de la peine sans effacer la condamnation. Les associations saluent un geste d\'humanité ; le juge de l\'application des peines garde la main.' }) },
      { id: 'totale', texte: 'Accorder une grâce totale', effets: () => ({ chocs: { jeunes: 1, salaries: 0.5, retraites: -0.3 }, credibilite: -0.005, texte: 'Libérée le jour même, elle remercie le président. Des magistrats et une partie de la droite dénoncent une remise en cause de la décision de deux jurys populaires.' }) },
      { id: 'refuser', texte: 'Refuser : la justice a tranché', effets: () => ({ chocs: { jeunes: -0.8, salaries: -0.3, retraites: 0.3 }, texte: 'Vous invoquez l\'indépendance de l\'autorité judiciaire. Les associations de lutte contre les violences faites aux femmes expriment leur colère.' }) },
    ],
  }),
  evt({
    id: 'crise_article16',
    titre: 'Cyberattaque et sabotages : l\'État paralysé',
    description: () => 'Une cyberattaque massive, doublée de sabotages, coupe l\'électricité et les télécommunications dans plusieurs régions. Ministères, préfectures et hôpitaux fonctionnent en mode dégradé ; le Parlement ne peut plus siéger normalement. La piste d\'une puissance étrangère est évoquée.',
    choix: [
      { id: 'etat_urgence', texte: 'Décréter l\'état d\'urgence (loi de 1955) et réunir le Conseil de défense', effets: () => ({ depensesExceptionnelles: 0.4, chocPIB: -0.15, instabilite: 0.03, chocs: { salaries: 0.5, retraites: 1 }, texte: 'L\'état d\'urgence, décrété en Conseil des ministres, renforce les pouvoirs de police ; au-delà de douze jours, sa prorogation exige une loi. Les réseaux sont rétablis en trois semaines.' }) },
      { id: 'article16', texte: 'Recourir à l\'article 16 (pouvoirs exceptionnels du président)', effets: () => ({ depensesExceptionnelles: 0.3, chocPIB: -0.08, instabilite: 0.12, credibilite: -0.03, influence: -1, chocs: { retraites: 1, salaries: -0.5, jeunes: -1.5, fonctionnaires: -0.5 }, institutions: { article16: true }, texte: 'Après avoir consulté le Premier ministre, les présidents des assemblées et le Conseil constitutionnel, le président concentre les pouvoirs et en informe la nation par un message. Le Parlement se réunit de plein droit et ne peut être dissous. Les réseaux reviennent plus vite, mais l\'opposition dénonce une dérive et, au bout de trente jours, saisit le Conseil constitutionnel, qui juge que les conditions ne sont plus réunies.' }) },
      { id: 'moyens_ordinaires', texte: 'S\'en tenir aux moyens ordinaires', effets: () => ({ chocPIB: -0.3, chocs: { salaries: -1, entrepreneurs: -1.5, retraites: -1 }, texte: 'Les administrations improvisent ; la paralysie dure plus d\'un mois et pèse sur l\'activité.' }) },
    ],
  }),
];
