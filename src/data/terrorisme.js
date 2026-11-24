/**
 * Menace terroriste (France) : niveau de menace, posture Vigipirate,
 * opération Sentinelle, alertes du renseignement, attentats déjoués ou
 * commis, et réponses du Gouvernement.
 *
 * Faits sourcés (SOURCES_TERRORISME) ; niveaux, probabilités, coûts et
 * effets : hypothèses de jeu. Les événements sont tirés avec un aléa séparé
 * (le reste de la partie n'en est pas modifié) et leur choix par défaut
 * (le premier) ne touche qu'au niveau de menace.
 */

export const SOURCES_TERRORISME = {
  vigipirate: { titre: 'Gouvernement : le plan Vigipirate (niveaux « sécurité renforcée – risque attentat » et « urgence attentat »)', url: 'https://www.info.gouv.fr/risques/le-plan-vigipirate' },
  vigipirate2026: { titre: 'Ministère de l\'Intérieur : mise en œuvre du plan Vigipirate 2026', url: 'https://www.interieur.gouv.fr/actualites/actualites-du-ministere/mise-en-oeuvre-du-plan-vigipirate-2026' },
  sentinelle: { titre: 'Revue Conflits : repenser l\'opération Sentinelle (3 000 militaires déployés en permanence, jusqu\'à 10 000)', url: 'https://www.revueconflits.com/repenser-loperation-sentinelle/' },
  chammal: { titre: 'Ministère des Armées : opération Chammal, volet français de la coalition contre Daech (depuis septembre 2014)', url: 'https://www.defense.gouv.fr/operations/actualites/chammal-fin-mission-rafale-c-base-aerienne-projetee-bap-au-levant' },
  chammalDates: { titre: 'Public Sénat : les dates de l\'intervention française contre l\'État islamique', url: 'https://www.publicsenat.fr/actualites/politique/terrorisme-les-dates-de-l-intervention-francaise-contre-l-ei-52334' },
  benin: { titre: 'Africanews : 15 soldats tués dans une attaque djihadiste dans le nord du Bénin (mars 2026)', url: 'https://www.africanews.com/2026/03/06/15-soldiers-killed-in-jihadist-attack-in-northern-benin/' },
  beninJnim: { titre: 'The Defense Post : un groupe lié à Al-Qaïda revendique une attaque meurtrière au Bénin (janvier 2025)', url: 'https://thedefensepost.com/2025/01/11/al-qaeda-linked-group-benin-attack/' },
  djibouti: { titre: 'Élysée : visite aux forces armées à Djibouti (décembre 2024)', url: 'https://www.elysee.fr/emmanuel-macron/2024/12/21/visite-aux-forces-armees-a-djibouti' },
  mozambique: { titre: 'Al Jazeera : Total suspend son projet gazier de 20 Md$ au Mozambique (avril 2021)', url: 'https://www.aljazeera.com/economy/2021/4/26/total-suspends-20bn-lng-project-in-mozambique-indefinitely' },
  libye: { titre: 'Jamestown Foundation : l\'État islamique affaibli cherche à renaître en Libye (rapport de l\'ONU d\'août 2025)', url: 'https://jamestown.org/weakened-islamic-state-eyes-resurgence-in-libya/' },
};

/** Postures Vigipirate : protection (réduction du risque d'attentat), coût additionnel (Md€ par an). */
export const VIGIPIRATE = {
  securite_renforcee: { nom: 'Sécurité renforcée – risque attentat', protection: 0.18, cout: 0 },
  urgence_attentat: { nom: 'Urgence attentat', protection: 0.3, cout: 0 },
};

/** Effectifs de l'opération Sentinelle : 3 000 militaires déployés en permanence (référence), jusqu'à 10 000. */
export const SENTINELLE = {
  3000: { nom: '3 000 militaires (posture permanente)', protection: 0.04, cout: 0 },
  7000: { nom: '7 000 militaires (renfort)', protection: 0.08, cout: 0.2 },
  10000: { nom: '10 000 militaires (renfort maximal, comme en 2015)', protection: 0.11, cout: 0.35 },
};

/** Villes où un attentat peut frapper (texte des événements). */
export const VILLES = ['Paris', 'Lyon', 'Marseille', 'Nice', 'Lille', 'Strasbourg', 'Toulouse', 'Bordeaux', 'Nantes', 'Montpellier'];

/** Niveau de menace de départ (sur 100) : la France est en « urgence attentat » depuis mars 2024. */
export const MENACE_INITIALE = 60;
/** Au moins quatre trimestres entre deux alertes du renseignement. */
export const ECART_ALERTES = 4;

/**
 * Opérations antiterroristes que le président peut lancer lui-même, partout
 * dans le monde (écran Géopolitique), ou en réponse à une alerte ou à un
 * attentat. Même format que les opérations extérieures (data/opex.js), avec
 * l'effet sur la menace en France (« menace », en points sur 100).
 */
export const OPERATIONS_ANTITERRORISTES = {
  levant_daech: {
    nom: 'Levant : frappes contre Daech (opération Chammal)', court: 'Levant', lon: 40.5, lat: 35.3, terrain: 'desert', theatre: 'mediterranee',
    duree: 2, surcout: 1.4, usure: 5, chanceBase: 0.35,
    apports: { chasse_1: 0.14, chasse_2: 0.12, chasse_mirage: 0.08, soutien_aerien: 0.1, forces_speciales: 0.15, gtia: 0.03 },
    sources: ['chammal', 'chammalDates'],
    description: 'Depuis septembre 2014, la France frappe l\'État islamique en Irak et en Syrie au sein de la coalition (opération Chammal), avec des Rafale basés en Jordanie et aux Émirats. Frapper les camps et les cadres qui préparent des attentats en Europe.',
    reussite: { menace: -14, influence: 2, relations: { etatsUnis: 1, royaumeUni: 1 }, tensions: { mediterranee: -4 }, fierte: 0.5, texte: 'Les frappes détruisent des camps d\'entraînement et tuent plusieurs cadres chargés des attentats à l\'étranger. La menace recule en France.' },
    echec: { menace: 5, influence: -1, texte: 'Les cibles avaient été déplacées ; une frappe fait des victimes civiles, que la propagande djihadiste exploite.' },
  },
  sahel_raid: {
    nom: 'Sahel : raid contre un chef djihadiste', court: 'Sahel (raid)', lon: -1.5, lat: 15.2, terrain: 'desert', theatre: null,
    duree: 1, surcout: 2, usure: 9, chanceBase: 0.25,
    apports: { forces_speciales: 0.35, chasse_1: 0.06, chasse_2: 0.05, chasse_mirage: 0.05, soutien_aerien: 0.07 },
    sources: ['chammalDates'],
    description: 'La France n\'a plus de base au Mali, au Burkina Faso ni au Niger, dont les juntes ont rompu avec elle (2022-2023). Un raid des forces spéciales contre un chef du JNIM ou de l\'État islamique au Sahel, sans l\'accord de ces gouvernements, irriterait la région (scénario de jeu).',
    reussite: { menace: -7, fierte: 1, relations: { afrique: -2 }, texte: 'De nuit, les commandos neutralisent un chef djihadiste qui préparait des attaques contre des intérêts français. Bamako proteste contre une violation de son territoire.' },
    echec: { menace: 4, relations: { afrique: -4 }, fierte: -1, texte: 'Le raid échoue : la cible s\'est enfuie et un hélicoptère est endommagé. Les juntes sahéliennes dénoncent une agression.' },
  },
  golfe_guinee: {
    nom: 'Golfe de Guinée : appui au Bénin et au Togo contre les groupes djihadistes', court: 'Golfe de Guinée', lon: 1.6, lat: 10.6, terrain: 'tropical', theatre: 'golfe_guinee',
    duree: 3, surcout: 1.3, usure: 4, chanceBase: 0.35,
    apports: { forces_speciales: 0.2, gtia: 0.2, chasse_1: 0.05, chasse_2: 0.05, soutien_aerien: 0.06 },
    sources: ['benin', 'beninJnim'],
    description: 'Les groupes djihadistes du Sahel, dont le JNIM affilié à Al-Qaïda, attaquent le nord du Bénin : 2025 a été l\'année la plus meurtrière pour son armée (au moins 54 soldats tués en avril 2025). Former et appuyer les armées côtières, à leur demande (scénario de jeu).',
    reussite: { menace: -4, influence: 2, relations: { afrique: 3 }, tensions: { golfe_guinee: -6 }, texte: 'Les armées béninoise et togolaise reprennent le contrôle de leurs frontières nord, avec le renseignement et l\'appui français.' },
    echec: { menace: 2, relations: { afrique: -1 }, texte: 'Les attaques continuent ; la présence française devient un sujet de polémique à Cotonou.' },
  },
  corne_afrique: {
    nom: 'Somalie : frappes contre les Chabab depuis Djibouti', court: 'Somalie', lon: 45.3, lat: 2.0, terrain: 'desert', theatre: 'ocean_indien',
    duree: 2, surcout: 1.3, usure: 4, chanceBase: 0.35,
    apports: { chasse_1: 0.12, chasse_2: 0.1, chasse_mirage: 0.1, soutien_aerien: 0.08, forces_speciales: 0.15 },
    sources: ['djibouti'],
    description: 'Les Chabab, affiliés à Al-Qaïda, tiennent une partie du sud de la Somalie et menacent Djibouti. Depuis la base de Djibouti, la plus grande base française à l\'étranger (environ 1 500 militaires), frapper leurs camps aux côtés des États-Unis (scénario de jeu).',
    reussite: { menace: -4, influence: 1, relations: { etatsUnis: 2, afrique: 1 }, tensions: { ocean_indien: -6 }, texte: 'Les frappes désorganisent les Chabab ; l\'armée somalienne reprend plusieurs localités.' },
    echec: { menace: 2, texte: 'Les Chabab se dispersent et frappent Mogadiscio ; l\'opération n\'a rien changé.' },
  },
  mozambique: {
    nom: 'Mozambique (Cabo Delgado) : appui contre l\'État islamique', court: 'Mozambique', lon: 40.3, lat: -11.6, terrain: 'tropical', theatre: 'ocean_indien',
    duree: 3, surcout: 1.4, usure: 4, chanceBase: 0.3,
    apports: { forces_speciales: 0.25, gtia: 0.15, soutien_aerien: 0.06, chasse_1: 0.04 },
    sources: ['mozambique'],
    description: 'Dans la province de Cabo Delgado, une insurrection affiliée à l\'État islamique a attaqué la ville de Palma en mars 2021 et forcé TotalEnergies à suspendre son grand projet gazier (force majeure en avril 2021). Appuyer l\'armée mozambicaine et les troupes rwandaises (scénario de jeu).',
    reussite: { menace: -3, influence: 1, relations: { afrique: 2, ue: 1 }, tensions: { ocean_indien: -4 }, texte: 'La région se stabilise ; le chantier gazier reprend sous protection.' },
    echec: { menace: 2, relations: { afrique: -1 }, texte: 'L\'insurrection reprend plusieurs villages ; le chantier reste à l\'arrêt.' },
  },
  libye: {
    nom: 'Libye : frappes contre les camps de l\'État islamique dans le Fezzan', court: 'Libye', lon: 14.4, lat: 26.2, terrain: 'desert', theatre: 'mediterranee',
    duree: 1, surcout: 1.5, usure: 6, chanceBase: 0.35,
    apports: { chasse_1: 0.15, chasse_2: 0.12, chasse_mirage: 0.08, soutien_aerien: 0.1, forces_speciales: 0.12 },
    sources: ['libye'],
    description: 'Selon un rapport de l\'ONU d\'août 2025, les réseaux de l\'État islamique au Fezzan, dans le sud libyen sans État, font passer hommes, véhicules et armes du Soudan vers le Sahel. Frapper leurs camps depuis la métropole, avec ravitaillement en vol (scénario de jeu).',
    reussite: { menace: -6, tensions: { mediterranee: -3 }, texte: 'Les frappes détruisent plusieurs camps et dépôts d\'armes dans le Fezzan.' },
    echec: { menace: 3, influence: -1, texte: 'Les camps étaient vides ; Tripoli et Benghazi protestent contre des frappes non concertées.' },
  },
};
