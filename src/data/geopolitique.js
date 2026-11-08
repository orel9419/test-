/**
 * Géopolitique (France) : théâtres où le groupe aéronaval peut être déployé,
 * et crises qui peuvent y éclater.
 *
 * Faits : missions réelles citées à titre d'exemple. Niveaux de tension,
 * coûts et effets : hypothèses de jeu.
 */

/** Théâtres d'opérations (coordonnées : longitude, latitude). */
export const THEATRES = {
  toulon: {
    nom: 'Toulon (port base)', court: 'Toulon', lon: 5.93, lat: 43.12, base: true,
    description: 'Port d\'attache du groupe aéronaval : entretien, entraînement, relève des équipages.',
  },
  mediterranee: {
    nom: 'Méditerranée orientale', court: 'Méditerranée', lon: 31, lat: 34, usure: 20, cout: 0.12, tension: 45,
    description: 'Liban, Libye, Chypre : présence de l\'OTAN sur son flanc sud et évacuations possibles de ressortissants. Exemple : mission Akila (2024).',
    presence: { influence: 1, relations: { ue: 1, italie: 1 } },
  },
  mer_rouge: {
    nom: 'Mer Rouge et golfe d\'Aden', court: 'Mer Rouge', lon: 42, lat: 15, usure: 25, cout: 0.15, tension: 60,
    description: 'Passage d\'environ 12 % du commerce maritime mondial (canal de Suez). Depuis fin 2023, des missiles et des drones visent des navires marchands ; l\'Union européenne y mène l\'opération Aspides.',
    presence: { influence: 1, relations: { ue: 1, golfe: 1, etatsUnis: 1 } }, protegeCommerce: true,
  },
  ormuz: {
    nom: 'Golfe arabo-persique et détroit d\'Ormuz', court: 'Ormuz', lon: 56.5, lat: 26, usure: 25, cout: 0.15, tension: 55,
    description: 'Environ un cinquième du pétrole consommé dans le monde transite par le détroit. La France dispose d\'une base à Abou Dhabi.',
    presence: { influence: 1, relations: { golfe: 2 } }, protegeEnergie: true,
  },
  ocean_indien: {
    nom: 'Océan Indien', court: 'Océan Indien', lon: 70, lat: -12, usure: 25, cout: 0.15, tension: 30,
    description: 'La Réunion, Mayotte, Djibouti : la France y est riveraine. Escales et exercices avec la marine indienne (exercice Varuna), cliente du Rafale Marine.',
    presence: { influence: 2, relations: { afrique: 1 } }, bonusExport: { inde_mrfa: 0.08 },
  },
  indo_pacifique: {
    nom: 'Indo-Pacifique', court: 'Indo-Pacifique', lon: 150, lat: -5, usure: 35, cout: 0.25, tension: 50,
    description: 'Nouvelle-Calédonie, Polynésie, liberté de navigation en mer de Chine. Exemple : mission Clemenceau 25 du Charles-de-Gaulle (fin 2024 - 2025), jusqu\'au Japon et aux Philippines.',
    presence: { influence: 3, relations: { chine: -2, etatsUnis: 1 } },
  },
  baltique: {
    nom: 'Atlantique Nord et Baltique', court: 'Baltique', lon: 18, lat: 58, usure: 20, cout: 0.12, tension: 50,
    description: 'Flanc nord de l\'OTAN : câbles sous-marins, réassurance des pays baltes et nordiques face à la Russie.',
    presence: { influence: 1, relations: { pologne: 2, norvege: 2, royaumeUni: 1, ukraine: 1 } },
  },
  golfe_guinee: {
    nom: 'Golfe de Guinée', court: 'Golfe de Guinée', lon: 3, lat: 2, usure: 20, cout: 0.12, tension: 35,
    description: 'Piraterie et pêche illégale ; la Marine y est présente en permanence depuis 1990 (mission Corymbe).',
    presence: { influence: 1, relations: { afrique: 2 } },
  },
};

/** Groupe aéronaval : composition (affichage). */
export const GROUPE_AERONAVAL = {
  composition: ['un porte-avions et son groupe aérien (Rafale Marine, avions de guet, hélicoptères)', 'deux à trois frégates : défense aérienne, et anti-sous-marine (FREMM à sonar remorqué, avec son hélicoptère Caïman Marine à sonar trempé)', 'un sous-marin nucléaire d\'attaque', 'un bâtiment ravitailleur', 'en renfort, un porte-hélicoptères amphibie (troupes, hélicoptères, hôpital), qui conduit d\'ordinaire son propre groupe amphibie'],
  pedagogie: 'Le Charles-de-Gaulle (261 m, 42 000 t, en service depuis 2001) est le seul porte-avions à propulsion nucléaire en service hors des États-Unis. Un déploiement dure en général quatre à cinq mois ; il faut ensuite plusieurs semaines d\'entretien à Toulon, et un arrêt technique majeur environ tous les dix ans.',
};

/** Crises : événements injectés par le module géopolitique (jamais tirés au hasard par le moteur des événements). */
const present = (e, t) => [e.geopolitique?.gan, e.geopolitique?.gan2].some((g) => g?.position === t);
const jamais = () => false;
const crise = (id, theatre, titre, description, choix) => ({ id, theatre, titre, pays: ['france'], condition: jamais, probabilite: () => 0, geopolitique: true, description, choix });

export const CRISES = [
  crise('crise_mer_rouge', 'mer_rouge', 'Mer Rouge : des missiles visent des porte-conteneurs',
    (e) => `Les armateurs détournent leurs navires par le cap de Bonne-Espérance : deux semaines de trajet en plus, des prix du fret en hausse.${present(e, 'mer_rouge') ? ' Votre groupe aéronaval est sur place.' : ''}`,
    [
      { id: 'escorter', texte: 'Escorter les navires marchands avec la Marine', effets: (e) => (present(e, 'mer_rouge')
        ? { influence: 3, relations: { ue: 3, golfe: 2, etatsUnis: 2 }, energie: 0.99, fierte: 0.5, texte: 'Le groupe aéronaval abat des drones et protège les convois : la route de Suez rouvre en partie.' }
        : { depensesExceptionnelles: 0.2, influence: 1, relations: { ue: 1 }, chocPIB: -0.03, texte: 'Deux frégates envoyées en urgence protègent quelques convois ; le trafic reste perturbé.' }) },
      { id: 'coalition', texte: 'Rejoindre une coalition internationale', effets: () => ({ depensesExceptionnelles: 0.1, relations: { etatsUnis: 3, ue: 2 }, influence: 1, texte: 'La France contribue à la coalition, sans en prendre la tête.' }) },
      { id: 'abstention', texte: 'Ne pas intervenir', effets: () => ({ chocPIB: -0.06, energie: 1.02, relations: { ue: -2 }, influence: -2, texte: 'Le fret renchérit les importations ; les partenaires européens regrettent l\'absence française.' }) },
    ]),
  crise('crise_ormuz', 'ormuz', 'Ormuz : menace de fermeture du détroit',
    (e) => `Après un incident avec un pétrolier, la menace d'un blocage du détroit fait bondir le prix du pétrole.${present(e, 'ormuz') ? ' Votre groupe aéronaval croise dans le golfe.' : ''}`,
    [
      { id: 'dissuader', texte: 'Montrer la force pour garder le détroit ouvert', effets: (e) => (present(e, 'ormuz')
        ? { influence: 3, relations: { golfe: 4, etatsUnis: 2 }, energie: 0.98, texte: 'La présence française et alliée rassure les marchés : le prix du pétrole reflue.' }
        : { energie: 1.02, relations: { golfe: 1 }, texte: 'Sans moyens sur place, la France ne peut que soutenir verbalement la liberté de navigation.' }) },
      { id: 'mediation', texte: 'Proposer une médiation diplomatique', effets: () => ({ influence: 2, relations: { golfe: 1, chine: 1 }, energie: 1.01, texte: 'Paris facilite des discussions ; la tension baisse lentement.' }) },
      { id: 'stocks', texte: 'Puiser dans les stocks stratégiques de pétrole', effets: () => ({ depensesExceptionnelles: 0.3, energie: 0.99, opinion: { salaries: 1 }, texte: 'Les prix à la pompe sont contenus quelques semaines.' }) },
    ]),
  crise('crise_mediterranee', 'mediterranee', 'Méditerranée orientale : des Français à évacuer',
    (e) => `Des combats éclatent ; des milliers de ressortissants français demandent à être rapatriés.${present(e, 'mediterranee') ? ' Votre groupe aéronaval est à quelques heures.' : ''}`,
    [
      { id: 'evacuer', texte: 'Évacuation par la Marine', effets: (e) => (present(e, 'mediterranee')
        ? { influence: 2, fierte: 1.5, opinion: { retraites: 1, salaries: 1 }, texte: 'Hélicoptères et bâtiments évacuent les ressortissants en quelques jours : opération saluée.' }
        : { depensesExceptionnelles: 0.15, fierte: 0.5, texte: 'Avions affrétés et navires civils : l\'évacuation est plus lente, mais réussie.' }) },
      { id: 'onu', texte: 'Saisir le Conseil de sécurité de l\'ONU', effets: () => ({ influence: 1, relations: { ue: 1 }, opinion: { retraites: -1 }, texte: 'Une résolution est discutée ; sur place, la situation reste confuse.' }) },
    ]),
  crise('crise_baltique', 'baltique', 'Baltique : des câbles sous-marins sectionnés',
    (e) => `Des câbles de télécommunication et d'électricité ont été endommagés ; un navire suspect est repéré.${present(e, 'baltique') ? ' Votre groupe aéronaval participe à la surveillance.' : ''}`,
    [
      { id: 'patrouilles', texte: 'Renforcer les patrouilles de l\'OTAN', effets: (e) => (present(e, 'baltique')
        ? { influence: 2, relations: { pologne: 3, norvege: 3, ukraine: 2 }, souverainete: 1, texte: 'Les patrouilles alliées dissuadent de nouveaux sabotages.' }
        : { depensesExceptionnelles: 0.1, relations: { pologne: 1, norvege: 1 }, texte: 'La France envoie un avion de patrouille maritime.' }) },
      { id: 'sanctions', texte: 'Demander des sanctions européennes', effets: () => ({ relations: { ue: 2, ukraine: 1 }, energie: 1.01, texte: 'De nouvelles sanctions sont adoptées ; Moscou dément.' }) },
    ]),
  crise('crise_indo_pacifique', 'indo_pacifique', 'Mer de Chine : incident avec une frégate française',
    (e) => `Un navire chinois manœuvre dangereusement près d'une frégate française qui transitait dans les eaux internationales.${present(e, 'indo_pacifique') ? ' Votre groupe aéronaval est dans la zone.' : ''}`,
    [
      { id: 'transit', texte: 'Maintenir les transits (liberté de navigation)', effets: (e) => ({ influence: present(e, 'indo_pacifique') ? 3 : 1, relations: { chine: -4, etatsUnis: 2 }, souverainete: 1, texte: 'La France réaffirme le droit de la mer ; Pékin proteste et menace sur le cognac et l\'aéronautique.' }) },
      { id: 'apaiser', texte: 'Éviter l\'escalade, dialogue avec Pékin', effets: () => ({ relations: { chine: 3, etatsUnis: -2 }, influence: -1, texte: 'L\'incident est clos discrètement ; les partenaires régionaux s\'interrogent.' }) },
    ]),
  crise('crise_golfe_guinee', 'golfe_guinee', 'Golfe de Guinée : un pétrolier détourné',
    (e) => `Des pirates retiennent l'équipage d'un pétrolier, dont des marins européens.${present(e, 'golfe_guinee') ? ' Votre groupe aéronaval est au large.' : ''}`,
    [
      { id: 'liberer', texte: 'Opération de libération', effets: (e) => (present(e, 'golfe_guinee') && [e.geopolitique.gan, e.geopolitique.gan2].some((g) => g?.position === 'golfe_guinee' && g.potentiel > 30)
        ? { influence: 2, fierte: 1, relations: { afrique: 2 }, texte: 'Les commandos marine libèrent l\'équipage sans perte.' }
        : { influence: -1, relations: { afrique: -1 }, opinion: { salaries: -1 }, texte: 'L\'opération, montée trop vite, échoue en partie ; une rançon est versée par l\'armateur.' }) },
      { id: 'cooperation', texte: 'Appuyer les marines africaines (formation, patrouilles)', effets: () => ({ depensesExceptionnelles: 0.05, relations: { afrique: 3 }, influence: 1, texte: 'Les marines du golfe de Guinée prennent le relais, avec l\'appui français.' }) },
    ]),
  crise('crise_ocean_indien', 'ocean_indien', 'Cyclone dévastateur dans l\'océan Indien',
    (e) => `Un cyclone ravage Mayotte et les îles voisines, comme Chido en décembre 2024.${present(e, 'ocean_indien') ? ' Votre groupe aéronaval peut arriver en quelques jours.' : ''}`,
    [
      { id: 'aide', texte: 'Engager les armées dans l\'aide humanitaire', effets: (e) => ({ depensesExceptionnelles: 0.2, fierte: present(e, 'ocean_indien') ? 1.5 : 0.5, influence: 1, opinion: { salaries: 1, retraites: 1 }, texte: present(e, 'ocean_indien') ? 'Hélicoptères et vivres arrivent très vite : la solidarité nationale est saluée.' : 'L\'aide arrive par avion, mais lentement.' }) },
      { id: 'collectivites', texte: 'Laisser la préfecture et les collectivités coordonner', effets: () => ({ depensesExceptionnelles: 0.1, opinion: { salaries: -1 }, texte: 'Les secours s\'organisent, mais les habitants dénoncent la lenteur de l\'État.' }) },
    ]),
];
