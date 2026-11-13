/**
 * Déploiements (France) : forces terrestres et aériennes projetables, et
 * bases (françaises ou alliées) où les envoyer, comme le groupe aéronaval.
 *
 * Faits : bases et missions réelles citées à titre d'exemple. Effectifs
 * indicatifs, coûts, usure et effets : hypothèses de jeu.
 */

/**
 * Unités projetables.
 * type : 'terre' ou 'air' (une base n'accueille pas forcément les deux) ;
 * cout : Md€ par an de présence hors métropole ; usure : points de potentiel
 * perdus par trimestre ; poids : multiplicateur des effets de présence.
 */
export const UNITES = {
  gtia: {
    nom: 'Groupement tactique interarmes', court: 'GTIA', icone: '🪖', type: 'terre', scene: 'gtia', cout: 0.3, usure: 15, poids: 1,
    description: 'Environ un millier de soldats : infanterie sur Griffon, blindés Jaguar, artillerie Caesar, génie et soutien, prélevés sur l\'échelon national d\'urgence (dispositif d\'alerte « Guépard »).',
  },
  escadron_leclerc: {
    nom: 'Escadron de chars Leclerc', court: 'Leclerc', icone: '🛡️', type: 'terre', scene: 'escadronLeclerc', cout: 0.2, usure: 18, poids: 0.9,
    bases: ['roumanie', 'estonie'], motifBases: 'Hors opération, les chars Leclerc ne sont projetés que sur le flanc est de l\'OTAN (Roumanie, Estonie).',
    description: 'Treize chars Leclerc, leurs dépanneurs et environ 150 militaires : la puissance de feu du combat de haute intensité. Un escadron sert en Roumanie depuis novembre 2022 (mission Aigle) ; des Leclerc ont aussi servi en Estonie (mission Lynx, 2017) et au Sud-Liban (FINUL, 2006).',
  },
  forces_speciales: {
    nom: 'Détachement des forces spéciales', court: 'Forces spéciales', icone: '🎯', type: 'terre', scene: 'forcesSpeciales', cout: 0.12, usure: 20, poids: 0.6,
    description: 'Quelques centaines de commandos du Commandement des opérations spéciales (COS), avec leurs hélicoptères Caracal et Caïman : renseignement, libération d\'otages, appui aux armées partenaires.',
  },
  chasse_1: {
    nom: 'Détachement de chasse n° 1', court: 'Rafale (1)', icone: '✈️', type: 'air', scene: 'policeDuCiel', cout: 0.15, usure: 18, poids: 0.8,
    description: 'Quatre à six Rafale, leurs pilotes et leurs mécaniciens : police du ciel, frappes, dissuasion conventionnelle.',
  },
  chasse_2: {
    nom: 'Détachement de chasse n° 2', court: 'Rafale (2)', icone: '✈️', type: 'air', scene: 'policeDuCiel', cout: 0.15, usure: 18, poids: 0.8,
    description: 'Un second détachement de Rafale, pour tenir deux bases à la fois ou se relayer sur la même.',
  },
  soutien_aerien: {
    nom: 'Détachement de soutien aérien', court: 'Phénix et radar', icone: '🛩️', type: 'air', scene: 'ravitaillement', cout: 0.12, usure: 15, poids: 0.6,
    description: 'Un A330 Phénix (ravitaillement en vol, transport) et un avion radar E-3F : il démultiplie les chasseurs alliés et français présents dans la zone.',
  },
};

/**
 * Bases : métropole (retour, entretien), bases françaises à l'étranger et
 * bases alliées. partenaire : relation diplomatique exigée (seuil) pour y
 * être accueilli ; otan : mission de l'Alliance (impossible si la France l'a
 * quittée) ; theatre : théâtre de tension apaisé par la présence ;
 * terrain : décor de la scène 3D (désert, Europe, tropical) ; interception :
 * la mission y est la police du ciel (les autres bases : patrouille).
 */
export const BASES = {
  metropole: {
    nom: 'Métropole (garnisons et bases aériennes)', court: 'Métropole', lon: 2.35, lat: 46.6, metropole: true, types: ['terre', 'air'],
    description: 'Retour en métropole : les unités récupèrent leur potentiel (entraînement, entretien, repos des équipages).',
  },
  abou_dhabi: {
    terrain: 'desert',
    nom: 'Émirats arabes unis : base aérienne 104 d\'Al Dhafra et base navale d\'Abou Dhabi', court: 'Abou Dhabi', lon: 54.55, lat: 24.25, types: ['terre', 'air'],
    partenaire: 'golfe', seuil: 0, theatre: 'ormuz', distance: 1.15,
    presence: { influence: 1, relations: { golfe: 2 } },
    description: 'Implantation française permanente depuis 2009, face au détroit d\'Ormuz ; les Émirats ont commandé 80 Rafale en 2021.',
  },
  djibouti: {
    terrain: 'desert',
    nom: 'Djibouti : base aérienne 188 et forces françaises stationnées', court: 'Djibouti', lon: 43.15, lat: 11.55, types: ['terre', 'air'],
    partenaire: 'afrique', seuil: -30, theatre: 'mer_rouge', distance: 1.1,
    presence: { influence: 1, relations: { afrique: 1, ue: 1 } },
    description: 'Plus grande base française à l\'étranger, à l\'entrée de la mer Rouge : lutte contre la piraterie, appui à l\'opération européenne Aspides.',
  },
  jordanie: {
    terrain: 'desert',
    nom: 'Jordanie : base aérienne projetée (opération Chammal)', court: 'Jordanie', lon: 36.6, lat: 32.2, types: ['air'],
    partenaire: 'golfe', seuil: -10, theatre: 'mediterranee', distance: 1.1,
    presence: { influence: 1, relations: { etatsUnis: 1, golfe: 1 } },
    description: 'Depuis 2014, des Rafale y opèrent contre l\'État islamique au sein de la coalition internationale (opération Chammal).',
  },
  roumanie: {
    terrain: 'europe',
    nom: 'Roumanie : Cincu (mission Aigle, OTAN)', court: 'Roumanie', lon: 24.75, lat: 45.9, types: ['terre'],
    partenaire: 'ue', seuil: -20, otan: true, theatre: null, distance: 1,
    presence: { influence: 1, relations: { ue: 2, pologne: 1, ukraine: 1 } },
    description: 'La France y est nation-cadre d\'un groupement de l\'OTAN sur le flanc est depuis 2022 : un renfort y monte vers la brigade.',
  },
  estonie: {
    terrain: 'europe',
    nom: 'Estonie : Tapa (mission Lynx, OTAN)', court: 'Estonie', lon: 25.95, lat: 59.2, types: ['terre'],
    partenaire: 'royaumeUni', seuil: -20, otan: true, theatre: 'baltique', distance: 1,
    presence: { influence: 1, relations: { royaumeUni: 2, norvege: 1, pologne: 1 } },
    description: 'Un sous-groupement français sert dans le bataillon de l\'OTAN mené par le Royaume-Uni, face à la Russie.',
  },
  lituanie: {
    terrain: 'europe', interception: true,
    nom: 'Lituanie : Šiauliai (police du ciel balte, OTAN)', court: 'Lituanie', lon: 23.4, lat: 55.9, types: ['air'],
    partenaire: 'pologne', seuil: -20, otan: true, theatre: 'baltique', distance: 1,
    presence: { influence: 1, relations: { pologne: 2, norvege: 1, ukraine: 1 } },
    description: 'Les pays baltes n\'ont pas d\'aviation de chasse : les alliés, dont la France, s\'y relaient pour la police du ciel.',
  },
  nouvelle_caledonie: {
    terrain: 'tropical',
    nom: 'Nouvelle-Calédonie : forces armées de Nouméa', court: 'Nouméa', lon: 166.45, lat: -22.25, types: ['terre', 'air'],
    theatre: 'indo_pacifique', distance: 1.35,
    presence: { influence: 1, relations: { etatsUnis: 1, chine: -1 } },
    description: 'Territoire français : point d\'appui pour l\'Indo-Pacifique, l\'aide humanitaire dans le Pacifique Sud et la surveillance des pêches.',
  },
};

/** Potentiel sous lequel une unité rentre d'office en métropole. */
export const POTENTIEL_MIN = 20;
/** Potentiel regagné par trimestre en métropole. */
export const RECUPERATION = 35;
