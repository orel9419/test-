/**
 * Défense : programmes d'armement, opérations, exportations et dissuasion.
 *
 * Faits (dates, quantités, industriels) : sources citées, publiques.
 * Coûts des options, effets sur l'influence, la souveraineté et l'opinion :
 * hypothèses de jeu (le coût exact de la plupart des programmes, et en
 * particulier de la dissuasion, n'est pas publié en valeur absolue).
 */

export const SOURCES_DEFENSE = {
  plf2027: { titre: 'Ministère des Armées : projet de loi de finances 2027, LPM année 4', url: 'https://www.defense.gouv.fr/ministere/politique-defense/loi-programmation-militaire-2024-2030/projet-loi-finances-armees-2027-lpm-annee-4' },
  actualisation: { titre: 'Ministère des Armées : actualisation de la LPM (+36 Md€ de 2026 à 2030)', url: 'https://www.defense.gouv.fr/actualites/actualisation-lpm-france-intensifie-son-effort-rearmement' },
  rafale: { titre: 'Gifas : vers le début du renouvellement de la flotte Rafale (livraisons et carnet de commandes 2025)', url: 'https://www.gifas.fr/press-summary/vers-le-debut-du-renouvellement-de-la-flotte-rafale' },
  snle: { titre: 'Ministère des Armées : lancement de la construction du premier SNLE 3G (20 mars 2024)', url: 'https://prod-site-internet-minarm-admin.cloud.defense.gouv.fr/sites/default/files/ministere-armees/Lancement%20de%20la%20construction%20du%20premier%20sous-marin%20nucl%C3%A9aire%20lanceur%20d%E2%80%99engins%20de%203e%20g%C3%A9n%C3%A9ration%20%28SNLE%203G%29.pdf' },
  pang: { titre: 'Le Journal des entreprises : le président lance la construction du porte-avions de nouvelle génération', url: 'https://www.lejournaldesentreprises.com/article/le-president-emmanuel-macron-lance-officiellement-la-construction-du-porte-avions-de-nouvelle-2133664' },
  cdgAtm: { titre: 'L\'Essentiel de l\'éco : la France sans porte-avions pendant dix-huit mois (arrêt technique majeur 2027-2028)', url: 'https://lessentieldeleco.fr/7946-la-france-sans-porte-avions-pendant-dix-huit-mois/' },
  cdgProlongation: { titre: 'Baird Maritime : la France envisage de prolonger le Charles-de-Gaulle jusqu\'en 2040', url: 'https://www.bairdmaritime.com/security/naval/naval-ships/charles-de-gaulle-carrier-extension' },
  cdgQuestion: { titre: 'Assemblée nationale : question écrite sur le retrait du Charles-de-Gaulle et son arrêt technique majeur', url: 'https://questions.assemblee-nationale.fr/dyn/17/questions/QANR5L17QE12713.pdf' },
  lpmTerre: { titre: 'Forces Operations Blog : LPM 2024-2030, cibles relevées à 1 437 Griffon et 238 Jaguar en 2030', url: 'https://forcesoperations.com/amp/lpm-2024-2030-feu-vert-pour-la-rehausse-des-cibles-de-griffon-et-de-jaguar/' },
  chiffresTerre: { titre: 'Ministère des Armées : armée de Terre, chiffres clés 2025', url: 'https://www.defense.gouv.fr/sites/default/files/terre/PRAT%20-%20Livret%20Chiffres%20cle%CC%81s%202025_.pdf' },
  leclercDga: { titre: 'DGA : livraison du 15e char Leclerc rénové (160 fin 2030, 200 fin 2035)', url: 'https://www.defense.gouv.fr/dga/actualites/dga-livre-15e-char-leclerc-renove-larmee-terre' },
  caesar: { titre: 'KNDS : le ministère des Armées commande 109 Caesar MkII', url: 'https://knds.com/en/press-releases/the-french-mod-orders-109-caesar-mk-ii-from-nexter-a-company-of-knds' },
  pangNom: { titre: 'Defence Industry Europe : le porte-avions s\'appellera « France Libre »', url: 'https://defence-industry.eu/france-unveils-name-of-next-generation-nuclear-aircraft-carrier-as-pang-programme-advances-toward-build-phase/' },
  scaf: { titre: 'Le JDD : comment Dassault et Airbus ont enterré le futur avion de combat européen (juin 2026)', url: 'https://www.lejdd.fr/International/scaf-comment-dassault-et-airbus-ont-enterre-le-futur-avion-de-combat-europeen-176046' },
  dissuasion: { titre: 'Vie publique : les objectifs de la loi de programmation militaire (dissuasion : environ 13 % de la LPM)', url: 'https://www.vie-publique.fr/eclairage/284741-budget-de-la-defense-quelles-etapes-pour-le-porter-5-du-pib' },
  mirage2000d: { titre: 'Le Journal de l\'Aviation : la flotte de Mirage 2000D rénovés à mi-vie est au complet (juillet 2026)', url: 'https://www.journal-aviation.com/actualites-defense-espace/forces-armees/la-flotte-de-mirage-2000d-renoves-a-mi-vie-est-au-complet-20260702.html' },
  mirageUkraine: { titre: 'The Aviationist : premiers Mirage 2000-5F livrés à l\'Ukraine (6 février 2025)', url: 'https://theaviationist.com/2025/02/06/mirage-2000-delivered-ukraine/' },
  mirageRetrait: { titre: 'Wikipédia : aéronefs en service dans les armées françaises (retrait du Mirage 2000-5F vers 2030)', url: 'https://en.wikipedia.org/wiki/List_of_active_military_aircraft_of_the_French_Armed_Forces' },
  formatChasse: { titre: 'AeroTime : la DGA confirme l\'objectif de 225 Rafale (185 pour l\'armée de l\'Air et de l\'Espace, 40 pour la Marine)', url: 'https://www.aerotime.aero/?p=129471' },
  phenix: { titre: 'Ministère des Armées : quinze A330 Phénix prévus en 2028', url: 'https://www.defense.gouv.fr/sites/default/files/air/Fiche%20technique%20A330.pdf' },
  phenixAirbus: { titre: 'Airbus : fiche technique de l\'A330 MRTT (58,80 m, 17,40 m, 60,30 m)', url: 'https://www.airbus.com/sites/g/files/jlcbta136/files/2023-08/TMMP0015_01_2023_A330%20MRTT%20Dataposter_ENG_Low.pdf' },
  caimanStd2: { titre: 'Army Recognition : premier NH90 Caïman standard 2 livré aux forces spéciales (juillet 2026, 18 commandés)', url: 'https://www.armyrecognition.com/news/aerospace-news/2026/france-receives-first-nh90-caiman-standard-2-helicopter-for-special-forces' },
  tigreMk3: { titre: 'Ministère des Armées : fiche LPM de l\'hélicoptère Tigre (standard 3, 42 appareils français)', url: 'https://prod-site-internet-minarm-admin.cloud.defense.gouv.fr/sites/default/files/ministere-armees/Fiche%20LPM%20-%20H%C3%A9licopt%C3%A8re%20Tigre.pdf' },
  pumaGuyane: { titre: 'Ministère des Armées : le Puma tire sa révérence en Guyane après 47 ans (2026)', url: 'https://www.defense.gouv.fr/air/actualites/puma-tire-sa-reverence-guyane-47-ans-mission' },
  caimanMarine: { titre: 'Ministère des Armées : fiche LPM du Caïman Marine (NH90 NFH)', url: 'https://prod-site-internet-minarm-admin.cloud.defense.gouv.fr/sites/default/files/ministere-armees/Fiche%20LPM%20-%20Ca%C3%AFman%20Marine%20%28NH90%20NFH%29.pdf' },
  caimanMarineNN: { titre: 'Naval News : le NH90 NFH Caïman de la Marine nationale (27 commandés)', url: 'https://www.navalnews.com/naval-news/2020/04/video-nh90-nfh-caiman-maritime-helicopter-of-the-french-navy/' },
  disponibilite: { titre: 'Assemblée nationale : réponse ministérielle sur la disponibilité des hélicoptères (NH90, plan de transformation du MCO aéronautique)', url: 'https://www.assemblee-nationale.fr/dyn/15/questions/QANR5L15QE14094.pdf' },
  flancEst: { titre: 'Ministère des Armées : renforcement sur le flanc est (missions Aigle et Lynx)', url: 'https://www.defense.gouv.fr/renforcement-flanc-est' },
};

/**
 * Programmes. Options : `cout` en milliards par an pendant `duree` trimestres
 * (négatif = économie), `puis` pour un rattrapage après un étalement,
 * `retard` en trimestres sur les jalons, `livraisons` (multiplicateur du
 * rythme de livraison pendant la durée), `supplement` (appareils en plus).
 */
export const PROGRAMMES_DEFENSE = {
  france: [
    {
      id: 'rafale', nom: 'Rafale', sousTitre: 'Avion de combat polyvalent, standards F4 puis F5', illustration: 'rafale', domaine: 'Air et Marine',
      industriels: ['Dassault Aviation', 'Safran (moteurs M88)', 'Thales (radar, électronique)', 'MBDA (missiles)'], fleurons: ['dassault', 'safran', 'thales'],
      faits: [
        'Environ 150 Rafale en service dans l\'armée de l\'Air et de l\'Espace et la Marine nationale.',
        'Objectif de la loi de programmation militaire : 178 Rafale fin 2030 et 225 en 2035.',
        'En 2025, Dassault a livré 26 Rafale (11 pour la France, 15 à l\'export) ; 175 Rafale restaient à construire pour l\'étranger fin 2025.',
        'Standard F5, associé à un drone de combat, attendu au début des années 2030 (calendrier à vérifier).',
      ],
      capacite: { cle: 'rafale', libelle: 'Rafale en service', depart: 150, cibles: [{ annee: 2030, t: 4, valeur: 178 }, { annee: 2035, t: 4, valeur: 225 }] },
      options: [
        { id: 'nominal', nom: 'Suivre la loi de programmation militaire', description: 'Livraisons au rythme prévu.' },
        { id: 'tranche', nom: 'Commander une tranche de 30 Rafale de plus', description: 'Environ 4 Md€ étalés sur quatre ans (hypothèse de jeu). Remplit les escadrons et soutient les exportations.', cout: 1.0, duree: 16, supplement: 30, effets: { souverainete: 2, influence: 1, fleurons: { dassault: 6, safran: 2, thales: 2 }, opinion: { entrepreneurs: 1 } } },
        { id: 'f5', nom: 'Accélérer le standard F5 et le drone de combat', description: 'Environ 0,4 Md€ de plus par an pendant trois ans : l\'avion reste à niveau face aux défenses aériennes modernes.', cout: 0.4, duree: 12, effets: { souverainete: 2, potentiel: 0.005, fleurons: { dassault: 3, thales: 3 } }, avance: { jalon: 'rafale_f5', trimestres: 4 } },
        { id: 'etaler', nom: 'Étaler les livraisons pour économiser', description: '0,5 Md€ d\'économie par an pendant trois ans, puis un rattrapage plus coûteux : l\'étalement renchérit le coût de chaque avion.', cout: -0.5, duree: 12, puis: { cout: 0.65, duree: 12 }, livraisons: 0.5, effets: { souverainete: -2, fleurons: { dassault: -4 } }, retard: { jalon: 'rafale_f5', trimestres: 4 } },
      ],
      jalons: [{ id: 'rafale_f5', annee: 2033, t: 2, texte: 'Premier Rafale au standard F5, avec son drone de combat.' }],
      sources: ['rafale'],
    },
    {
      id: 'phenix', nom: 'Ravitailleurs A330 Phénix', sousTitre: 'Ravitaillement en vol et transport stratégique', illustration: 'chasseur', domaine: 'Air',
      industriels: ['Airbus', 'Rolls-Royce (réacteurs)', 'Safran et Thales (équipements)'], fleurons: ['airbus'],
      faits: [
        'L\'A330 MRTT Phénix remplace les C-135 : il ravitaille les Rafale de la dissuasion et des opérations, transporte troupes et blessés (jusqu\'à 272 passagers) et emporte jusqu\'à 110 t de carburant.',
        'Environ 12 à 13 en service fin 2026 selon les sources ; le ministère des Armées en prévoit 15 en 2028.',
        'Sans ravitailleurs, un Rafale ne peut ni frapper loin ni rester longtemps en l\'air : c\'est un « multiplicateur de forces ». L\'Europe dépend encore beaucoup des ravitailleurs américains.',
      ],
      capacite: { cle: 'phenix', libelle: 'Phénix en service', depart: 13, cibles: [{ annee: 2028, t: 4, valeur: 15 }] },
      options: [
        { id: 'nominal', nom: 'Suivre la loi de programmation', description: '15 Phénix en 2028.' },
        { id: 'tranche', nom: 'Commander 3 Phénix de plus', description: 'Environ 0,25 Md€ par an pendant quatre ans (hypothèse de jeu, de l\'ordre de 300 M€ par appareil avec son soutien) : plus d\'autonomie pour les opérations lointaines et l\'appui aux alliés européens.', cout: 0.25, duree: 16, supplement: 3, effets: { souverainete: 2, influence: 1, relations: { ue: 1 }, fleurons: { airbus: 2 } } },
        { id: 'soutien', nom: 'Renforcer le contrat de soutien (disponibilité)', description: '0,1 Md€ par an pendant quatre ans (hypothèse de jeu) : plus de pièces et d\'équipes de maintenance, moins d\'avions immobilisés.', cout: 0.1, duree: 16, effets: { souverainete: 1, fleurons: { airbus: 1 } } },
      ],
      jalons: [{ id: 'phenix_15', influence: 0, annee: 2028, t: 4, texte: 'Le 15e A330 Phénix est livré : les C-135 sont entièrement remplacés.' }],
      sources: ['phenix', 'phenixAirbus'],
    },
    {
      id: 'helicos', nom: 'Hélicoptères : Tigre, Caïman, Puma, Caracal', sousTitre: 'Aviation légère de l\'armée de Terre, forces spéciales et armée de l\'Air et de l\'Espace', illustration: 'chasseur', domaine: 'Terre et Air',
      industriels: ['Airbus Helicopters', 'NHIndustries (NH90)', 'Safran (moteurs, optronique)', 'Thales (électronique)'], fleurons: ['airbus', 'safran', 'thales'],
      faits: [
        'NH90 Caïman : environ 64 au standard 1 livrés à l\'armée de Terre (le dernier début 2025) ; 18 au standard 2 commandés pour les forces spéciales, le premier livré le 30 juillet 2026, le dernier vers le printemps 2029.',
        'Tigre : rénovation au standard 3 de 42 appareils français (avec 18 espagnols) pour les connecter à SCORPION et aux drones et les garder au-delà de 2040.',
        'Puma : en service depuis les années 1970, en retrait progressif ; huit Caracal commandés en 2021 pour en remplacer, le dernier livré en juin 2026 (Guyane, Nouvelle-Calédonie).',
        'Caïman Marine (NH90 NFH) : 27 hélicoptères de frégate des flottilles 31F (Hyères) et 33F (Lanvéoc-Poulmic), en service depuis décembre 2011 : lutte anti-sous-marine (sonar trempé, torpilles MU90), sauvetage en mer.',
      ],
      options: [
        { id: 'nominal', nom: 'Suivre la loi de programmation', description: 'Caïman standard 2 jusqu\'en 2029, Tigre standard 3, retrait progressif des Puma.' },
        { id: 'caiman', nom: 'Commander 12 Caïman de plus pour remplacer les derniers Puma', description: 'Environ 0,15 Md€ par an pendant quatre ans (hypothèse de jeu) : les Puma partent deux ans plus tôt, la flotte est plus homogène, donc plus simple à entretenir.', cout: 0.15, duree: 16, effets: { souverainete: 1, fleurons: { airbus: 2, safran: 1 } }, avance: { jalon: 'puma_retrait', trimestres: 8 } },
        { id: 'tigre', nom: 'Rénover tous les Tigre au standard 3 (environ 67 au lieu de 42)', description: 'Environ 0,3 Md€ par an pendant quatre ans (hypothèse de jeu) : plus d\'hélicoptères d\'attaque modernes, appréciés face aux drones et aux blindés.', cout: 0.3, duree: 16, effets: { souverainete: 2, influence: 1, fleurons: { airbus: 2, thales: 2, safran: 1 } } },
        { id: 'puma', nom: 'Prolonger les Puma de deux ans', description: 'Environ 0,05 Md€ par an pendant trois ans (hypothèse de jeu) : du volume en attendant, mais un entretien de plus en plus coûteux pour des appareils de plus de 50 ans.', cout: 0.05, duree: 12, effets: { souverainete: -1 }, retard: { jalon: 'puma_retrait', trimestres: 8 } },
      ],
      jalons: [
        { id: 'nh90_std2', influence: 0, annee: 2029, t: 2, texte: 'Le 18e et dernier Caïman standard 2 est livré au 4e régiment d\'hélicoptères des forces spéciales.' },
        { id: 'tigre_std3', influence: 0, annee: 2030, t: 4, texte: 'Premiers Tigre au standard 3 en service (date indicative, hypothèse de jeu).' },
        { id: 'puma_retrait', influence: 0, annee: 2031, t: 4, texte: 'Les derniers Puma quittent l\'armée de Terre (date indicative, hypothèse de jeu).' },
      ],
      sources: ['caimanStd2', 'tigreMk3', 'pumaGuyane', 'caimanMarine', 'caimanMarineNN'],
    },
    {
      id: 'mco', nom: 'Maintien en condition opérationnelle', sousTitre: 'Disponibilité des matériels : pièces, mécaniciens, contrats de soutien', illustration: 'chasseur', domaine: 'Terre et Air et Marine',
      industriels: ['Airbus Helicopters', 'Dassault Aviation', 'Safran', 'Service industriel de l\'aéronautique (SIAé)', 'Naval Group'], fleurons: ['airbus', 'safran', 'dassault'],
      faits: [
        'Un matériel n\'est utile que s\'il est disponible : en 2018, environ 36 % des NH90 de l\'armée de Terre étaient disponibles ; un plan de transformation visait par exemple 55 % au lieu de 44 % pour le NH90 de la Marine.',
        'Les causes : pièces de rechange en retard, flottes trop variées, manque de mécaniciens, contrats éclatés entre de nombreux industriels. Les contrats « verticalisés » confient à un seul industriel la disponibilité d\'une flotte entière.',
        'L\'indice affiché ici est une moyenne de jeu pour les hélicoptères : il ne correspond pas à une statistique officielle unique.',
      ],
      capacite: { cle: 'disponibilite', libelle: 'Disponibilité des hélicoptères (indice de jeu)', depart: 45, cibles: [] },
      options: [
        { id: 'nominal', nom: 'Suivre la loi de programmation', description: 'La disponibilité reste autour de son niveau actuel.' },
        { id: 'renforcer', nom: 'Plan de disponibilité : pièces, mécaniciens, contrats verticalisés', description: '0,6 Md€ de plus par an pendant quatre ans (hypothèse de jeu) : la disponibilité monte progressivement d\'une douzaine de points entre la troisième et la sixième année (le temps de reconstituer les stocks de pièces et de former des mécaniciens).', cout: 0.6, duree: 16, supplement: 12, effets: { souverainete: 2, influence: 1, fleurons: { airbus: 2, safran: 1, dassault: 1 } } },
        { id: 'reduire', nom: 'Réduire les crédits d\'entretien', description: '0,4 Md€ d\'économie par an pendant trois ans (hypothèse de jeu) : la disponibilité baisse progressivement d\'une dizaine de points, plus d\'appareils cloués au sol.', cout: -0.4, duree: 12, supplement: -10, effets: { souverainete: -2, influence: -1 } },
      ],
      jalons: [],
      sources: ['disponibilite'],
    },
    {
      id: 'mirage2000', nom: 'Mirage 2000', sousTitre: 'Mirage 2000D rénovés (attaque au sol) et 2000-5F (défense aérienne), jusqu\'au « tout Rafale »', illustration: 'chasseur', domaine: 'Air',
      industriels: ['Dassault Aviation', 'Safran (réacteur M53)', 'Thales (électronique)', 'MBDA (missiles)'], fleurons: ['dassault', 'safran', 'thales'],
      faits: [
        'Le 16 juin 2026, la DGA a livré le 50e et dernier Mirage 2000D rénové à mi-vie (RMV) : un biplace d\'attaque au sol qui doit voler jusque vers 2035, quand l\'armée de l\'Air et de l\'Espace passera au « tout Rafale », à condition que de nouveaux Rafale soient commandés.',
        'Le Mirage 2000-5F de défense aérienne doit quitter le service vers 2030 (date indicative) ; la France en cède à l\'Ukraine depuis février 2025.',
        'Objectif confirmé par la DGA : 225 Rafale vers 2035, dont 185 pour l\'armée de l\'Air et de l\'Espace et 40 pour la Marine.',
      ],
      capacite: { cle: 'mirage2000d', libelle: 'Mirage 2000D rénovés en service', depart: 50 },
      options: [
        { id: 'nominal', nom: 'Suivre la loi de programmation', description: 'Mirage 2000-5F retirés vers 2030, Mirage 2000D rénovés vers 2035 : les Rafale prennent le relais.' },
        { id: 'prolonger', nom: 'Prolonger les Mirage 2000 de trois ans', description: '0,25 Md€ de plus par an pendant quatre ans (pièces, visites, hypothèse de jeu) : la flotte de chasse garde du volume en attendant davantage de Rafale ; tous les retraits glissent de trois ans.', cout: 0.25, duree: 16, effets: { souverainete: 1, fleurons: { dassault: 1, safran: 1 } }, retard: { jalon: 'm2000d_retrait', trimestres: 12 } },
        { id: 'ukraine', nom: 'Céder davantage de Mirage 2000-5F à l\'Ukraine', description: 'Avions, formation des pilotes et pièces : environ 0,15 Md€ par an pendant deux ans (hypothèse de jeu). Les 2000-5F quittent l\'armée de l\'Air et de l\'Espace deux ans plus tôt ; l\'Ukraine renforce sa défense aérienne.', cout: 0.15, duree: 8, effets: { influence: 2, souverainete: -1, relations: { ukraine: 5, ue: 1 } }, avance: { jalon: 'm2000_5f_retrait', trimestres: 8 } },
        { id: 'retirer', nom: 'Retirer les Mirage plus tôt pour financer le Rafale', description: 'Environ 0,3 Md€ d\'économie par an pendant trois ans (hypothèse de jeu), mais deux ans avec moins d\'avions de chasse : tous les retraits avancent de deux ans.', cout: -0.3, duree: 12, effets: { souverainete: -2, influence: -1, fleurons: { dassault: -1 } }, retard: { jalon: 'm2000d_retrait', trimestres: -8 } },
      ],
      jalons: [
        { id: 'm2000_5f_retrait', influence: 0, annee: 2030, t: 4, texte: 'Les derniers Mirage 2000-5F de défense aérienne quittent le service.' },
        { id: 'm2000d_retrait_1', influence: 0, annee: 2033, t: 4, capacite: -25, texte: 'Un premier groupe de Mirage 2000D rénovés est retiré, remplacé par des Rafale (étape intermédiaire : hypothèse de jeu).' },
        { id: 'm2000d_retrait', influence: 0, annee: 2035, t: 4, capacite: -25, texte: 'Les derniers Mirage 2000D quittent le service : l\'armée de l\'Air et de l\'Espace passe au « tout Rafale ».' },
      ],
      sources: ['mirage2000d', 'mirageUkraine', 'mirageRetrait', 'formatChasse'],
    },
    {
      id: 'snle3g', nom: 'SNLE de 3e génération', sousTitre: 'Sous-marins nucléaires lanceurs d\'engins : la dissuasion océanique', illustration: 'snle', domaine: 'Dissuasion',
      industriels: ['Naval Group (Cherbourg)', 'TechnicAtome (chaufferie nucléaire)', 'ArianeGroup (missile M51)'], fleurons: ['naval_group'],
      faits: [
        'Quatre SNLE de la classe Le Triomphant (mis en service de 1997 à 2010) ; au moins un est en patrouille en permanence depuis 1972.',
        'Chaque SNLE emporte 16 missiles balistiques M51.',
        'Construction du premier SNLE 3G, L\'Invincible, lancée à Cherbourg le 20 mars 2024 : quatre bâtiments, le premier vers 2035, puis environ un tous les cinq ans.',
      ],
      capacite: { cle: 'snle3g', libelle: 'SNLE 3G en service', depart: 0 },
      options: [
        { id: 'nominal', nom: 'Suivre la loi de programmation militaire', description: 'Premier SNLE 3G vers 2035.' },
        { id: 'securiser', nom: 'Sécuriser le calendrier (compétences, chaîne d\'approvisionnement)', description: '0,3 Md€ de plus par an pendant quatre ans : moins de risque de retard sur le chantier de Cherbourg.', cout: 0.3, duree: 16, effets: { souverainete: 2, fleurons: { naval_group: 3 } }, securise: true },
        { id: 'etaler', nom: 'Étaler le programme', description: '0,4 Md€ d\'économie par an pendant deux ans, mais deux ans de retard : les vieux SNLE devront naviguer plus longtemps, au risque de rompre la permanence à la mer.', cout: -0.4, duree: 8, puis: { cout: 0.5, duree: 8 }, effets: { souverainete: -3, influence: -2, fleurons: { naval_group: -4 } }, retard: { jalon: 'snle3g_1', trimestres: 8 } },
      ],
      jalons: [{ id: 'snle3g_1', annee: 2035, t: 4, texte: 'L\'Invincible, premier SNLE de 3e génération, part en patrouille.', capacite: 1, risqueRetard: 0.25 }],
      sources: ['snle', 'dissuasion'],
      note: 'Renoncer à la composante océanique de la dissuasion n\'est pas proposé : aucun gouvernement ne l\'a envisagé depuis 1972.',
    },
    {
      id: 'cdg', nom: 'Porte-avions « Charles-de-Gaulle »', sousTitre: 'En service depuis 2001, jusqu\'à l\'arrivée de son successeur', illustration: 'porteAvions', domaine: 'Marine',
      industriels: ['Naval Group (entretien à Toulon)', 'TechnicAtome (chaufferies nucléaires K15)'], fleurons: ['naval_group'],
      faits: [
        '8e porte-avions français, mis en service en mai 2001, port d\'attache Toulon : 261,5 m de long, 64,4 m de large, environ 42 000 t. Seul bâtiment de combat de surface à propulsion nucléaire en Europe : 2 réacteurs nucléaires et 2 groupes turbo-réducteurs (61 MW, 83 000 ch), 27 nœuds.',
        'Équipage de 1 900 marins ; jusqu\'à 40 aéronefs, dont 24 Rafale Marine, un avion de guet aérien Hawkeye et des hélicoptères ; 2 catapultes de 75 m (Marine nationale).',
        'Un porte-avions unique n\'est pas disponible en permanence. Son troisième arrêt technique majeur (rechargement des réacteurs) est prévu à Toulon à partir de 2027, pour dix-huit à vingt-quatre mois selon la presse spécialisée : la France n\'aura pas de porte-avions disponible pendant cette période.',
        'Son retrait est prévu vers 2038, à l\'arrivée du « France Libre ». Une étude menée pendant l\'arrêt technique doit dire si ses chaufferies permettent de le prolonger de quelques années (jusqu\'à 2040 environ).',
      ],
      options: [
        { id: 'nominal', nom: 'Retrait à l\'arrivée du « France Libre »', description: 'Le Charles-de-Gaulle quitte le service quelques mois après la mise en service de son successeur (vers 2038 sans accélération).' },
        { id: 'prolonger', nom: 'Garder le Charles-de-Gaulle jusqu\'en 2040', description: 'Il reste en service même après l\'arrivée du « France Libre » : avec la loi d\'accélération (France Libre en 2032), la France aligne deux groupes aéronavals de 2032 à 2040. Coût : 0,25 Md€ par an pendant trois ans (études, combustible), puis environ 0,5 Md€ par an tant que les deux porte-avions naviguent (équipages, entretien).', cout: 0.25, duree: 12, effets: { souverainete: 1, fleurons: { naval_group: 1 } }, avance: { jalon: 'cdg_retrait', trimestres: -8 } },
      ],
      jalons: [
        { id: 'cdg_atm3', annee: 2027, t: 2, influence: 0, texte: 'Le Charles-de-Gaulle entre en arrêt technique majeur à Toulon (rechargement des réacteurs) : pas de porte-avions disponible pendant environ dix-huit mois.' },
        { id: 'cdg_atm3_fin', annee: 2028, t: 4, influence: 0, texte: 'Fin de l\'arrêt technique majeur : le Charles-de-Gaulle reprend la mer avec ses chaufferies rechargées.' },
        { id: 'cdg_retrait', annee: 2038, t: 4, influence: 0, texte: 'Le Charles-de-Gaulle est retiré du service actif.' },
      ],
      sources: ['cdgAtm', 'cdgProlongation', 'cdgQuestion'],
      note: 'Dates de l\'arrêt technique : presse spécialisée, non confirmées officiellement. Sans décision, le retrait a lieu quand le « France Libre » est opérationnel (deux trimestres de recouvrement), au plus tard fin 2038. Gardé, il navigue jusqu\'à fin 2040, aux côtés du « France Libre » s\'il est arrivé.',
    },
    {
      id: 'pang', nom: 'Porte-avions « France Libre »', sousTitre: 'Porte-avions de nouvelle génération à propulsion nucléaire', illustration: 'porteAvions', domaine: 'Marine',
      industriels: ['Naval Group et Chantiers de l\'Atlantique (MO Porte-Avions)', 'TechnicAtome (réacteurs)'], fleurons: ['naval_group'],
      faits: [
        'Construction lancée par le président de la République le 21 décembre 2025 ; navire baptisé « France Libre » le 18 mars 2026.',
        '310 m, 78 000 t, deux réacteurs nucléaires de 220 MW, 27 nœuds, environ 2 000 marins (Marine nationale). Mise en service prévue en 2038 pour remplacer le Charles-de-Gaulle ; durée de vie estimée à 45 ans.',
        'Groupe aérien : jusqu\'à 30 avions de combat de nouvelle génération, 2 avions de guet aérien, 6 hélicoptères et des drones. Construit à Saint-Nazaire par les Chantiers de l\'Atlantique, avec Naval Group.',
      ],
      reforme: 'porte_avions',
      options: [
        { id: 'nominal', nom: 'Suivre le calendrier (livraison vers 2038)', description: 'Pour l\'avancer à 2032, faites voter la « loi d\'accélération du porte-avions France Libre » (onglet Réformes). Pour construire un second porte-avions ou y renoncer, passez par la réforme « Porte-avions de nouvelle génération ».' },
      ],
      jalons: [
        { id: 'pang', annee: 2038, t: 2, texte: 'Le porte-avions « France Libre » entre en service.' },
        { id: 'pang2', annee: 2042, t: 2, siReforme: ['porte_avions', 'deux'], texte: 'Le second porte-avions de nouvelle génération entre en service : deux groupes aéronavals.' },
      ],
      note: 'Jamais disponible avant 2032, même avec la loi d\'accélération ; sans elle, mise en service vers 2038.',
      sources: ['pang', 'pangNom'],
    },
    {
      id: 'successeur', nom: 'Successeur du Rafale', sousTitre: 'Après l\'abandon du chasseur commun du SCAF (juin 2026, selon la presse)', illustration: 'chasseurFutur', domaine: 'Air',
      industriels: ['Dassault Aviation', 'Safran', 'Thales', 'MBDA'], fleurons: ['dassault', 'safran', 'thales'],
      faits: [
        'Le SCAF, lancé en 2017 avec l\'Allemagne puis l\'Espagne, devait remplacer le Rafale vers 2040. Selon la presse, le chasseur commun a été abandonné en juin 2026 après l\'échec des discussions entre Dassault Aviation et Airbus ; d\'autres volets (drones, « cloud de combat ») pourraient survivre.',
      ],
      reforme: 'avion_combat',
      options: [{ id: 'nominal', nom: 'Décision par la réforme « Avion de combat de nouvelle génération »', description: 'Programme national, relance européenne, ou Rafale F5 d\'abord.' }],
      jalons: [],
      sources: ['scaf'],
    },
    {
      id: 'scorpion', nom: 'SCORPION : Griffon, Jaguar, Serval', sousTitre: 'Renouvellement des blindés de l\'armée de Terre et combat collaboratif', illustration: 'blinde', domaine: 'Terre',
      industriels: ['KNDS France, Arquus et Thales (groupement d\'entreprises)', 'Thales (système d\'information du combat, radios)', 'Safran (optronique)'], fleurons: ['thales', 'safran'],
      faits: [
        'SCORPION remplace les blindés des années 1970-1980 (VAB, AMX-10 RC, ERC 90) par le Griffon (transport de troupes 6×6), le Jaguar (reconnaissance et combat, canon de 40 mm) et le Serval (blindé léger 4×4), reliés par un système d\'information commun : chaque véhicule voit ce que voient les autres.',
        'Objectifs de la loi de programmation militaire, relevés par amendement en 2023 : 1 437 Griffon et 238 Jaguar en 2030.',
        'L\'armée de Terre aligne une force opérationnelle terrestre de 77 000 combattants et assure 60 % de l\'engagement opérationnel des armées (ministère des Armées, chiffres clés 2025).',
      ],
      options: [
        { id: 'nominal', nom: 'Suivre la loi de programmation militaire', description: 'Livraisons au rythme prévu.' },
        { id: 'accelerer', nom: 'Accélérer les livraisons', description: '0,6 Md€ de plus par an pendant quatre ans (hypothèse de jeu) : chaînes de production renforcées, régiments équipés plus tôt.', cout: 0.6, duree: 16, effets: { souverainete: 2, influence: 1, relations: { ue: 1 }, fleurons: { thales: 2 } }, avance: { jalon: 'scorpion_2030', trimestres: 4 } },
        { id: 'etaler', nom: 'Étaler les livraisons pour économiser', description: '0,5 Md€ d\'économie par an pendant trois ans, puis un rattrapage plus coûteux ; les vieux VAB roulent plus longtemps.', cout: -0.5, duree: 12, puis: { cout: 0.6, duree: 12 }, effets: { souverainete: -2, influence: -1, fleurons: { thales: -2 } }, retard: { jalon: 'scorpion_2030', trimestres: 8 } },
      ],
      jalons: [{ id: 'scorpion_2030', influence: 0, annee: 2030, t: 4, texte: 'SCORPION : 1 437 Griffon et 238 Jaguar en service (objectif de la loi de programmation).' }],
      sources: ['lpmTerre', 'chiffresTerre'],
    },
    {
      id: 'leclerc', nom: 'Char Leclerc rénové et char du futur', sousTitre: 'Le blindé lourd de l\'armée de Terre, en attendant son successeur', illustration: 'char', domaine: 'Terre',
      industriels: ['KNDS France (ex-Nexter)', 'Thales (vétronique, optronique)'], fleurons: ['thales'],
      faits: [
        'Char de combat en service depuis 1992 : canon de 120 mm à chargement automatique, trois hommes d\'équipage. Des Leclerc sont déployés en Estonie avec la mission Lynx, sur le flanc est de l\'OTAN.',
        'Rénovation à mi-vie (XLR) : intégration au système SCORPION, protection renforcée, tourelleau téléopéré ; 160 chars rénovés fin 2030 et 40 de plus fin 2035 (DGA).',
        'Son successeur, le char franco-allemand MGCS (avec l\'Allemagne), en est toujours au stade des études ; une partie de la classe politique réclame un char national.',
      ],
      options: [
        { id: 'nominal', nom: 'Suivre la loi de programmation', description: '200 Leclerc rénovés en 2035 ; successeur étudié avec l\'Allemagne (MGCS).' },
        { id: 'char_national', nom: 'Lancer un char de combat national', description: '0,5 Md€ de plus par an pendant huit ans (hypothèse de jeu) : bureau d\'études et démonstrateur, souveraineté industrielle, mais froid avec Berlin.', cout: 0.5, duree: 32, effets: { souverainete: 3, relations: { allemagne: -4 }, fleurons: { thales: 2 } } },
        { id: 'accelerer', nom: 'Accélérer la rénovation', description: '0,3 Md€ de plus par an pendant quatre ans : les 160 chars rénovés un an plus tôt.', cout: 0.3, duree: 16, effets: { souverainete: 1, influence: 1 }, avance: { jalon: 'leclerc_160', trimestres: 4 } },
        { id: 'etaler', nom: 'Étaler la rénovation', description: '0,3 Md€ d\'économie par an pendant trois ans, puis un rattrapage ; deux ans de retard.', cout: -0.3, duree: 12, puis: { cout: 0.4, duree: 8 }, effets: { souverainete: -1, influence: -1 }, retard: { jalon: 'leclerc_160', trimestres: 8 } },
      ],
      jalons: [
        { id: 'leclerc_160', influence: 0, annee: 2030, t: 4, texte: '160 chars Leclerc rénovés (XLR) en service.' },
        { id: 'leclerc_200', influence: 0, annee: 2035, t: 4, texte: '200 chars Leclerc rénovés : fin de la rénovation.' },
      ],
      sources: ['leclercDga'],
    },
    {
      id: 'artillerie', nom: 'Artillerie : Caesar MkII et frappe longue portée', sousTitre: 'Canons automoteurs de 155 mm et lance-roquettes', illustration: 'artillerie', domaine: 'Terre',
      industriels: ['KNDS France (Caesar)', 'Safran et MBDA (frappe longue portée)'], fleurons: ['safran'],
      faits: [
        'Le Caesar, canon de 155 mm monté sur camion, s\'est imposé en Ukraine par sa mobilité : il tire puis change de position en quelques minutes.',
        '109 Caesar MkII (cabine blindée, nouveau châssis) commandés en 2024 pour environ 350 M€, livrables à partir de 2026 : ils remplacent les automoteurs AuF1, puis les premiers Caesar.',
        'Les lance-roquettes unitaires arrivent en fin de vie : la loi de programmation prévoit une capacité de frappe longue portée terrestre de conception française.',
      ],
      options: [
        { id: 'nominal', nom: 'Suivre la loi de programmation militaire', description: 'Caesar MkII livrés au rythme prévu.' },
        { id: 'doubler', nom: 'Doubler les commandes d\'artillerie', description: '0,6 Md€ de plus par an pendant quatre ans (hypothèse de jeu) : Caesar MkII supplémentaires et lance-roquettes souverain plus tôt.', cout: 0.6, duree: 16, effets: { souverainete: 3, influence: 1, relations: { ukraine: 2 }, fleurons: { safran: 2 } } },
      ],
      jalons: [{ id: 'caesar_mk2', influence: 0, annee: 2027, t: 2, texte: 'Premiers Caesar MkII en service dans les régiments d\'artillerie.' }],
      sources: ['caesar'],
    },
    {
      id: 'drones', nom: 'Drones et munitions', sousTitre: '« Économie de guerre » : stocks d\'obus, de missiles et de drones', illustration: 'drone', domaine: 'Terre',
      industriels: ['KNDS France (obus, canons Caesar)', 'MBDA (missiles)', 'Safran et Thales (drones, optronique)'], fleurons: ['thales', 'safran'],
      faits: ['La guerre en Ukraine a montré la consommation massive de munitions et de drones ; le budget 2027 donne la priorité aux munitions et à la préparation opérationnelle.'],
      options: [
        { id: 'nominal', nom: 'Suivre la loi de programmation militaire', description: 'Montée en cadence progressive.' },
        { id: 'stocks', nom: 'Doubler les commandes pluriannuelles de munitions et de drones', description: '0,8 Md€ de plus par an pendant quatre ans ; les industriels investissent dans leurs chaînes.', cout: 0.8, duree: 16, effets: { souverainete: 3, influence: 1, fleurons: { thales: 3, safran: 2 }, relations: { ukraine: 3 } } },
      ],
      jalons: [],
      sources: ['plf2027'],
    },
    {
      id: 'espace', nom: 'Espace militaire', sousTitre: 'Satellites d\'observation et de télécommunications, surveillance de l\'espace', illustration: 'satellite', domaine: 'Espace',
      industriels: ['Airbus Defence and Space', 'Thales Alenia Space', 'Safran'], fleurons: ['airbus', 'thales'],
      faits: ['Satellites d\'observation CSO et de télécommunications Syracuse IV ; la constellation européenne IRIS² est prévue vers 2030.'],
      options: [
        { id: 'nominal', nom: 'Suivre la loi de programmation militaire', description: 'Renouvellement prévu des satellites.' },
        { id: 'autonomie', nom: 'Programme d\'autonomie spatiale (surveillance, satellites manœuvrants)', description: '0,5 Md€ de plus par an pendant quatre ans : moins de dépendance aux données américaines.', cout: 0.5, duree: 16, effets: { souverainete: 3, potentiel: 0.005, fleurons: { airbus: 2, thales: 3 } } },
      ],
      jalons: [],
      sources: ['plf2027'],
    },
  ],
  allemagne: [
    {
      id: 'f35', nom: 'F-35A', sousTitre: '35 avions furtifs américains, porteurs de l\'arme nucléaire de l\'OTAN', illustration: 'chasseur', domaine: 'Air',
      industriels: ['Lockheed Martin (États-Unis)', 'Rheinmetall (tronçons de fuselage)'], fleurons: ['rheinmetall'],
      faits: ['Commande de 35 F-35A fin 2022 pour remplacer les Tornado dans le partage nucléaire de l\'OTAN ; base de Büchel. Livraisons à partir de 2026.'],
      options: [
        { id: 'nominal', nom: 'Suivre le contrat', description: '35 avions.' },
        { id: 'plus', nom: 'Commander 15 F-35 de plus', description: 'Environ 2,5 Md€ sur quatre ans (hypothèse de jeu) ; renforce le lien avec Washington, au détriment des industriels européens.', cout: 0.6, duree: 16, effets: { souverainete: -1, relations: { etatsUnis: 4, france: -2 }, influence: 1 } },
      ],
      jalons: [], sources: [],
    },
    {
      id: 'arrow3', nom: 'Bouclier antimissile Arrow 3', sousTitre: 'Défense contre les missiles balistiques (achat à Israël)', illustration: 'defenseAerienne', domaine: 'Air',
      industriels: ['IAI et Boeing (Arrow 3)', 'Diehl (IRIS-T SLM)'], fleurons: [],
      faits: ['Système acheté à Israël en 2023, première capacité opérationnelle annoncée fin 2025 ; pilier de l\'initiative européenne de bouclier du ciel (ESSI).'],
      options: [
        { id: 'nominal', nom: 'Suivre le contrat', description: 'Premières batteries.' },
        { id: 'etendre', nom: 'Étendre la couverture (batteries IRIS-T et Arrow supplémentaires)', description: '1 Md€ de plus par an pendant quatre ans.', cout: 1.0, duree: 16, effets: { souverainete: 2, influence: 1, relations: { ue: 2, france: -1 } } },
      ],
      jalons: [], sources: [],
    },
  ],
  etatsUnis: [
    {
      id: 'b21', nom: 'B-21 Raider', sousTitre: 'Bombardier furtif à long rayon d\'action', illustration: 'bombardier', domaine: 'Air',
      industriels: ['Northrop Grumman'], fleurons: [],
      faits: ['Premier vol en novembre 2023 ; au moins une centaine d\'appareils prévus pour remplacer les B-1 et B-2.'],
      options: [
        { id: 'nominal', nom: 'Suivre le programme', description: 'Production à cadence prévue.' },
        { id: 'accelerer', nom: 'Accélérer la production', description: '3 Md$ de plus par an pendant quatre ans (hypothèse de jeu).', cout: 3, duree: 16, effets: { influence: 2, relations: { chine: -3, japon: 2 } } },
      ],
      jalons: [], sources: [],
    },
    {
      id: 'columbia', nom: 'Sous-marins de la classe Columbia', sousTitre: '12 sous-marins nucléaires lanceurs d\'engins', illustration: 'snle', domaine: 'Dissuasion',
      industriels: ['General Dynamics Electric Boat', 'HII'], fleurons: [],
      faits: ['Programme naval prioritaire : douze sous-marins pour remplacer la classe Ohio ; le premier accuse des retards.'],
      options: [
        { id: 'nominal', nom: 'Suivre le programme', description: 'Calendrier actuel.' },
        { id: 'chantiers', nom: 'Investir dans les chantiers navals (main-d\'œuvre, fournisseurs)', description: '2 Md$ de plus par an pendant quatre ans pour rattraper les retards.', cout: 2, duree: 16, effets: { influence: 1, potentiel: 0.002 } },
      ],
      jalons: [], sources: [],
    },
    {
      id: 'golden_dome', nom: 'Golden Dome', sousTitre: 'Bouclier antimissile du territoire américain, en partie spatial', illustration: 'defenseAerienne', domaine: 'Espace',
      industriels: ['Lockheed Martin', 'SpaceX', 'RTX', 'Northrop Grumman'], fleurons: [],
      faits: ['Annoncé en mai 2025 ; l\'administration l\'a chiffré à 175 Md$, des estimations indépendantes vont bien au-delà.'],
      options: [
        { id: 'nominal', nom: 'Financement de base', description: 'Études et premiers capteurs.' },
        { id: 'deploiement', nom: 'Déploiement accéléré', description: '15 Md$ de plus par an pendant quatre ans (hypothèse de jeu).', cout: 15, duree: 16, effets: { influence: 1, relations: { chine: -4, ue: -1 }, opinion: { entrepreneurs: 1 } } },
      ],
      jalons: [], sources: [],
    },
  ],
};

/** Opérations et déploiements. Coût en milliards par an tant que l'option est en vigueur. */
export const OPERATIONS = {
  france: [
    {
      id: 'aigle', nom: 'Mission Aigle (Roumanie)', icone: '🦅',
      description: 'La France est nation-cadre d\'un bataillon multinational de l\'OTAN à Cincu, avec la Belgique, les Pays-Bas, le Luxembourg et l\'Espagne.',
      options: [
        { id: 'renforcer', nom: 'Monter à une brigade', cout: 0.4, effets: { influence: 2, relations: { ue: 3, etatsUnis: 1 }, opinion: { retraites: -0.5 } } },
        { id: 'maintenir', nom: 'Maintenir le bataillon', cout: 0, effets: {} },
        { id: 'reduire', nom: 'Réduire la présence', cout: -0.1, effets: { influence: -2, relations: { ue: -3 } } },
      ], defaut: 'maintenir', sources: ['flancEst'],
    },
    {
      id: 'lynx', nom: 'Mission Lynx (Estonie)', icone: '🐆',
      description: 'Un sous-groupement tactique interarmes au sein d\'un bataillon de l\'OTAN mené par le Royaume-Uni.',
      options: [
        { id: 'renforcer', nom: 'Renforcer (chars, défense aérienne)', cout: 0.2, effets: { influence: 1, relations: { ue: 2, royaumeUni: 2 } } },
        { id: 'maintenir', nom: 'Maintenir', cout: 0, effets: {} },
        { id: 'retirer', nom: 'Retirer le détachement', cout: -0.08, effets: { influence: -2, relations: { ue: -3, royaumeUni: -3 } } },
      ], defaut: 'maintenir', sources: ['flancEst'],
    },
    {
      id: 'formation_ukraine', nom: 'Formation des soldats ukrainiens (EUMAM)', icone: '🇺🇦',
      description: 'La France forme des soldats ukrainiens dans le cadre de la mission de l\'Union européenne, notamment en Pologne.',
      options: [
        { id: 'amplifier', nom: 'Doubler les formations', cout: 0.15, effets: { influence: 1, relations: { ukraine: 4, ue: 1 } } },
        { id: 'maintenir', nom: 'Maintenir', cout: 0, effets: {} },
        { id: 'reduire', nom: 'Réduire', cout: -0.05, effets: { relations: { ukraine: -4, ue: -1 } } },
      ], defaut: 'maintenir', sources: [],
    },
    {
      id: 'reassurance', nom: 'Force de réassurance en Ukraine (scénario de jeu)', icone: '🛡️',
      description: 'Hypothèse discutée par plusieurs pays européens : déployer des troupes en Ukraine pour garantir un futur cessez-le-feu. Aucun déploiement de ce type n\'existe à ce jour.',
      options: [
        { id: 'participer', nom: 'Participer avec 2 000 soldats après un cessez-le-feu', cout: 0.8, effets: { influence: 3, relations: { ukraine: 6, ue: 3, etatsUnis: 1 }, opinion: { retraites: -1.5, salaries: -1 }, instabilite: 0.02 } },
        { id: 'non', nom: 'Ne pas déployer de troupes', cout: 0, effets: {} },
      ], defaut: 'non', sources: [],
    },
  ],
  allemagne: [
    {
      id: 'lituanie', nom: 'Brigade permanente en Lituanie', icone: '🇱🇹',
      description: 'Première brigade allemande stationnée en permanence à l\'étranger depuis 1945, montée en puissance jusqu\'en 2027.',
      options: [
        { id: 'accelerer', nom: 'Accélérer la montée en puissance', cout: 0.5, effets: { influence: 2, relations: { ue: 3 } } },
        { id: 'maintenir', nom: 'Maintenir le calendrier', cout: 0, effets: {} },
      ], defaut: 'maintenir', sources: [],
    },
  ],
  etatsUnis: [
    {
      id: 'europe', nom: 'Troupes américaines en Europe', icone: '🇪🇺',
      description: 'Environ 80 000 militaires américains sont stationnés en Europe ; leur réduction est débattue à Washington.',
      options: [
        { id: 'maintenir', nom: 'Maintenir', cout: 0, effets: {} },
        { id: 'reduire', nom: 'Rapatrier une brigade', cout: -1.5, effets: { influence: -2, relations: { ue: -5, royaumeUni: -2 }, opinion: { salaries: 0.5 } } },
      ], defaut: 'maintenir', sources: [],
    },
  ],
};

/** Prospects d'exportation (France : Rafale). */
export const EXPORTS = {
  france: [
    {
      id: 'inde_mrfa', nom: 'Inde : 114 avions de combat (appel d\'offres MRFA)', partenaire: 'inde', icone: '🇮🇳',
      description: 'L\'armée de l\'air indienne cherche 114 avions ; elle utilise déjà 36 Rafale et la marine indienne en a commandé 26 en 2025. Concurrents américains, européens et russes.',
      base: 0.18, montant: '15 à 20 Md€ pour l\'industrie française (ordre de grandeur)', effets: { influence: 3, souverainete: 2, fleurons: { dassault: 12, safran: 4, thales: 4 }, opinion: { salaries: 1, entrepreneurs: 2 } },
    },
    {
      id: 'golfe', nom: 'Un pays du Golfe : une nouvelle commande de Rafale (prospect générique)', partenaire: 'golfe', icone: '🕌',
      description: 'Après les Émirats arabes unis (80 Rafale commandés en 2021) et le Qatar, d\'autres monarchies du Golfe modernisent leur aviation. Prospect de jeu, sans négociation publique connue.',
      base: 0.2, montant: '5 à 8 Md€ (ordre de grandeur)', effets: { influence: 2, fleurons: { dassault: 6, safran: 2, thales: 2 }, opinion: { entrepreneurs: 1, jeunes: -0.5 } },
    },
  ],
};

/** Dimension européenne de la dissuasion (France, domaine réservé du président). */
export const DISSUASION_EUROPE = [
  { id: 'statu_quo', nom: 'Doctrine inchangée', description: 'La dissuasion protège les « intérêts vitaux » de la France, qui ont une dimension européenne sans plus de précision.', effets: {} },
  { id: 'dialogue', nom: 'Ouvrir un dialogue stratégique avec les partenaires européens', description: 'Comme proposé par le président en 2020 puis en 2025 : discuter du rôle de la dissuasion française pour la sécurité de l\'Europe, sans partage de la décision.', effets: { influence: 2, relations: { ue: 4 }, opinion: { retraites: -0.5 } } },
  { id: 'exercices', nom: 'Associer des partenaires aux exercices des forces aériennes stratégiques', description: 'Un signal fort de solidarité, discuté publiquement en Europe. La décision d\'emploi reste exclusivement française.', effets: { influence: 3, relations: { ue: 6, etatsUnis: -1 }, opinion: { retraites: -1, agriculteurs: -0.5 }, instabilite: 0.01 } },
];
