/**
 * Opérations extérieures (France) : des crises éclatent au fil des trimestres,
 * et le président, chef des armées, peut y répondre en engageant les forces
 * projetables de l'écran Géopolitique (groupement tactique, escadron de chars
 * Leclerc, forces spéciales, Rafale, soutien aérien).
 *
 * Une opération dure quelques trimestres. Elle coûte plus cher et use
 * davantage les unités qu'une présence sur une base ; son issue est tirée à la
 * fin (aléa séparé, sans effet sur les autres tirages du jeu). Les chances
 * dépendent des unités engagées (adaptées ou non à la mission), de leur
 * potentiel, et de la présence du groupe aéronaval sur le théâtre voisin.
 *
 * Faits : cités en exemple et sourcés (SOURCES_OPEX). Probabilités, durées,
 * coûts, chances et effets : hypothèses de jeu.
 */

export const SOURCES_OPEX = {
  finul: { titre: 'Nations unies : le Conseil de sécurité prolonge une dernière fois la FINUL, jusqu\'au 31 décembre 2026 (résolution 2790, 28 août 2025)', url: 'https://press.un.org/en/2025/sc16159.doc.htm' },
  finulRetrait: { titre: 'FINUL : fin des opérations le 31 décembre 2026, retrait en un an', url: 'https://unifil.unmissions.org/en/node/132643' },
  leclercLiban: { titre: 'Techno-Science : le char Leclerc (treize chars au Sud-Liban en 2006, avec la FINUL)', url: 'https://www.techno-science.net/definition/13615.html' },
  aigle: { titre: 'Ministère des Armées : mission Aigle, relève par un bataillon blindé (chars Leclerc à Cincu, novembre 2022)', url: 'https://www.defense.gouv.fr/sites/default/files/operations/20221020_AIGLE_dossier-de-presse_FR.pdf' },
  emirats: { titre: 'Arab News : la France aide les Émirats à protéger leur espace aérien après les attaques houthies (4 février 2022)', url: 'https://www.arabnews.pk/node/2018186' },
  sahel: { titre: 'Élysée : libération d\'otages au Sahel (10 mai 2019), deux commandos marine tués', url: 'https://www.elysee.fr/emmanuel-macron/2019/05/10/liberation-dotages-au-sahel' },
};

/**
 * Chaque opération : lieu (carte), terrain (décor 3D), théâtre de tension lié,
 * durée (trimestres), surcoût (multiplie le coût annuel de chaque unité
 * engagée), usure supplémentaire par trimestre, chance de base et apports de
 * chaque unité à la réussite, effets de la réussite et de l'échec, et la crise
 * qui la déclenche (avec ses choix ; « unites » : forces demandées).
 */
export const OPEX = {
  liban: {
    nom: 'Sud-Liban : appui à l\'armée libanaise', court: 'Liban', lon: 35.45, lat: 33.25, terrain: 'levant', theatre: 'mediterranee',
    duree: 3, surcout: 1.5, usure: 5, chanceBase: 0.3,
    apports: { gtia: 0.2, escadron_leclerc: 0.15, forces_speciales: 0.1, chasse_1: 0.06, chasse_2: 0.06, soutien_aerien: 0.03 },
    sources: ['finul', 'finulRetrait', 'leclercLiban'],
    probabilite: (e) => (e.trimestre.annee >= 2027 ? 0.09 : 0.05) + Math.max(0, (e.geopolitique?.tensions?.mediterranee ?? 45) - 45) / 400,
    reussite: { influence: 3, relations: { ue: 2, golfe: 1, etatsUnis: 1 }, fierte: 1, tensions: { mediterranee: -15 }, texte: 'Le Sud-Liban est stabilisé : l\'armée libanaise reprend le contrôle des villages et le groupe armé est repoussé. La France est saluée à Beyrouth et dans les capitales européennes.' },
    echec: { influence: -2, relations: { ue: -1 }, fierte: -1, tensions: { mediterranee: 10 }, texte: 'Les combats s\'enlisent : des soldats français sont blessés et le groupe armé tient toujours une partie du Sud. Les forces rentrent sans victoire nette.' },
    crise: {
      id: 'opex_liban', titre: 'Liban : un groupe terroriste déstabilise le Sud',
      description: (e) => `Un groupe armé terroriste multiplie les attaques au Sud-Liban et menace de faire basculer le pays ; Beyrouth demande l'aide de la France. ${e.trimestre.annee >= 2027 ? 'Les casques bleus de la FINUL ont cessé leurs opérations le 31 décembre 2026 (résolution 2790 du Conseil de sécurité) : l\'armée libanaise est seule au Sud.' : 'La FINUL, à laquelle la France contribue depuis 1978 (environ 700 soldats, opération Daman), doit cesser ses opérations le 31 décembre 2026.'} En 2006, la France avait envoyé treize chars Leclerc au Sud-Liban.`,
      choix: [
        { id: 'engager', texte: 'Engager un groupement tactique et l\'escadron de chars Leclerc, appuyés par des Rafale', unites: ['gtia', 'escadron_leclerc', 'chasse_1'] },
        { id: 'forces_speciales', texte: 'Envoyer les forces spéciales : renseignement, formation et appui de l\'armée libanaise', unites: ['forces_speciales'] },
        { id: 'diplomatie', texte: 'Réunir une conférence de soutien à l\'armée libanaise et envoyer une aide humanitaire', effets: { depensesExceptionnelles: 0.15, influence: 1, relations: { ue: 1, golfe: 1 }, texte: 'Les donateurs se réunissent à Paris ; sur le terrain, la situation reste fragile.' } },
        { id: 'abstention', texte: 'Ne pas intervenir', effets: { influence: -2, relations: { ue: -1 }, tensions: { mediterranee: 8 }, texte: 'La France, présente au Liban depuis des décennies, se tient à l\'écart ; la région s\'embrase.' } },
      ],
    },
  },
  sahel: {
    nom: 'Sahel : libération d\'otages', court: 'Sahel', lon: 0.5, lat: 14.6, terrain: 'desert', theatre: null,
    duree: 1, surcout: 2, usure: 10, chanceBase: 0.25,
    apports: { forces_speciales: 0.35, chasse_1: 0.06, chasse_2: 0.06, soutien_aerien: 0.06, gtia: 0.03 },
    sources: ['sahel'],
    probabilite: () => 0.05,
    reussite: { influence: 2, fierte: 2, relations: { afrique: 1 }, texte: 'De nuit, les commandos libèrent les otages sains et saufs ; le président les accueille à leur descente d\'avion.' },
    echec: { influence: -1, fierte: -1.5, relations: { afrique: -1 }, texte: 'L\'assaut tourne mal : un otage et un commando sont tués. Hommage national aux Invalides ; le pays s\'interroge sur les risques pris.' },
    crise: {
      id: 'opex_sahel', titre: 'Sahel : des Français pris en otage',
      description: () => 'Deux touristes français ont été enlevés près d\'une frontière et emmenés vers le nord ; le renseignement localise leur campement. Depuis le départ des forces françaises du Mali (2022), du Burkina Faso et du Niger (2023), la France n\'a plus de base dans la région. Précédent : en mai 2019, les commandos marine avaient libéré quatre otages au Burkina Faso ; deux d\'entre eux, Cédric de Pierrepont et Alain Bertoncello, y avaient perdu la vie.',
      choix: [
        { id: 'liberer', texte: 'Lancer une opération des forces spéciales, appuyées par des Rafale et le ravitailleur', unites: ['forces_speciales', 'chasse_2', 'soutien_aerien'] },
        { id: 'negocier', texte: 'Négocier discrètement par des intermédiaires', effets: { influence: -1, relations: { afrique: 1 }, texte: 'Après des mois d\'attente, les otages sont libérés ; on soupçonne le versement d\'une rançon, que Paris dément.' } },
        { id: 'partenaires', texte: 'Laisser les forces locales agir, avec le renseignement français', effets: { relations: { afrique: 2 }, fierte: -0.5, texte: 'Les forces locales préparent une opération ; les familles s\'impatientent et l\'issue reste incertaine.' } },
      ],
    },
  },
  flanc_est: {
    nom: 'Flanc est de l\'OTAN : réassurance', court: 'Flanc est', lon: 27.6, lat: 57.2, terrain: 'europe', theatre: 'baltique', otan: true,
    duree: 2, surcout: 1.3, usure: 4, chanceBase: 0.3,
    apports: { escadron_leclerc: 0.25, gtia: 0.15, chasse_1: 0.1, chasse_2: 0.1, soutien_aerien: 0.05, forces_speciales: 0.03 },
    sources: ['aigle'],
    probabilite: (e) => 0.05 + Math.max(0, (e.geopolitique?.tensions?.baltique ?? 50) - 50) / 300,
    reussite: { influence: 2, relations: { pologne: 3, ukraine: 2, norvege: 1, royaumeUni: 1 }, fierte: 0.5, tensions: { baltique: -12 }, texte: 'Les chars et les avions alliés arrivent en quelques jours : les provocations cessent. L\'Alliance a montré sa cohésion.' },
    echec: { influence: -1, relations: { pologne: -2, ukraine: -1 }, tensions: { baltique: 8 }, texte: 'Le renfort arrive trop tard et trop léger : les incidents se multiplient et les pays baltes doutent de leurs alliés.' },
    crise: {
      id: 'opex_flanc_est', titre: 'Flanc est : provocations à la frontière des pays baltes',
      description: (e) => `Drones au-dessus des casernes, brouillage du GPS, manœuvres massives près de la frontière : les pays baltes demandent un renfort immédiat de l'OTAN. ${(e.reformes?.actives ?? []).some((a) => a.id === 'otan' && a.option === 'alliance' && a.appliquee) ? 'La France a quitté l\'Alliance atlantique : elle ne peut plus s\'engager dans ses opérations.' : 'La France sert déjà en Estonie (mission Lynx) et en Roumanie, où un escadron de chars Leclerc est arrivé à Cincu en novembre 2022 (mission Aigle).'}`,
      choix: [
        { id: 'blindes', texte: 'Envoyer l\'escadron de chars Leclerc et un groupement tactique en renfort (OTAN)', unites: ['escadron_leclerc', 'gtia'] },
        { id: 'aviation', texte: 'Renforcer la police du ciel : Rafale et ravitailleur (OTAN)', unites: ['chasse_1', 'chasse_2', 'soutien_aerien'] },
        { id: 'desescalade', texte: 'Appeler à la désescalade, sans renfort', effets: { influence: -1, relations: { pologne: -2, ukraine: -2, royaumeUni: -1 }, tensions: { baltique: 6 }, texte: 'Paris appelle au dialogue ; Varsovie et Kiev dénoncent un manque de solidarité.' } },
      ],
    },
  },
  emirats: {
    nom: 'Émirats arabes unis : défense aérienne', court: 'Émirats', lon: 55.4, lat: 25.3, terrain: 'desert', interception: true, theatre: 'ormuz',
    duree: 2, surcout: 1.2, usure: 4, chanceBase: 0.3,
    apports: { chasse_1: 0.17, chasse_2: 0.17, soutien_aerien: 0.08 },
    sources: ['emirats'],
    probabilite: (e) => ((e.international?.relations?.golfe ?? 0) < -20 ? 0 : 0.05 + Math.max(0, (e.geopolitique?.tensions?.ormuz ?? 55) - 55) / 300),
    reussite: { influence: 2, relations: { golfe: 4, etatsUnis: 1 }, tensions: { ormuz: -10 }, texte: 'Les Rafale interceptent plusieurs drones ; les attaques cessent. Abou Dhabi salue un partenaire de confiance.' },
    echec: { influence: -1, relations: { golfe: -2 }, tensions: { ormuz: 6 }, texte: 'Un drone passe la défense aérienne et frappe un dépôt pétrolier ; les Émirats se tournent aussi vers d\'autres protecteurs.' },
    crise: {
      id: 'opex_emirats', titre: 'Émirats : des drones et des missiles frappent Abou Dhabi',
      description: () => 'Des drones et des missiles tirés depuis le Yémen visent un dépôt pétrolier et l\'aéroport d\'Abou Dhabi. Les Émirats invoquent l\'accord de défense qui les lie à la France (1995, renforcé en 2009). Précédent : après l\'attaque houthie du 17 janvier 2022 (trois morts), les Rafale de la base aérienne 104 d\'Al Dhafra avaient participé à la défense de l\'espace aérien émirien.',
      choix: [
        { id: 'defendre', texte: 'Défense aérienne : Rafale en alerte et ravitailleur, depuis la base 104', unites: ['chasse_1', 'chasse_2', 'soutien_aerien'] },
        { id: 'equipement', texte: 'Livrer des radars et des munitions, sans engager d\'avions', effets: { depensesExceptionnelles: 0.05, relations: { golfe: 2 }, texte: 'Le matériel arrive en quelques semaines ; les attaques se poursuivent un temps.' } },
        { id: 'condamner', texte: 'Condamner l\'attaque et appeler à un cessez-le-feu au Yémen', effets: { relations: { golfe: -2 }, influence: 0.5, texte: 'La diplomatie française est entendue à l\'ONU, mais Abou Dhabi attendait davantage de son allié.' } },
      ],
    },
  },
};

/** Au plus une nouvelle crise d'opération tous les ECART_MIN trimestres ; une même opération pas avant RECURRENCE trimestres. */
export const ECART_MIN = 3;
export const RECURRENCE = 12;
/** Repos (trimestres en métropole) après une opération. */
export const REPOS_APRES_OPEX = 1;

/**
 * Crises des opérations pour le catalogue des événements : jamais tirées par
 * le moteur des événements (elles sont injectées par le module des opérations).
 * Un choix qui engage des forces renvoie l'effet « envoiForces ».
 */
export const CRISES_OPEX = Object.entries(OPEX).map(([id, op]) => ({
  id: op.crise.id, titre: op.crise.titre, pays: ['france'], condition: () => false, probabilite: () => 0, geopolitique: true, opex: id,
  description: op.crise.description,
  choix: op.crise.choix.map((c) => ({
    id: c.id, texte: c.texte,
    effets: () => (c.unites ? { envoiForces: { operation: id, unites: [...c.unites] }, texte: `Opération lancée pour environ ${op.duree} trimestre(s).` } : { ...c.effets }),
  })),
}));
