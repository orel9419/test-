/**
 * Guerre économique (France) : le Gouvernement peut riposter aux pressions
 * commerciales d'une grande puissance, ou en prendre l'initiative.
 *
 * La politique commerciale est une compétence exclusive de l'Union
 * européenne : la France ne peut pas fixer seule des droits de douane. Elle
 * peut agir seule sur les investissements étrangers et les achats publics,
 * et pousser Bruxelles à riposter (droits de douane, instrument
 * anti-coercition, sanctions) ; il faut alors convaincre ses partenaires,
 * à commencer par l'Allemagne.
 *
 * Faits sourcés ; intensités, probabilités et effets : hypothèses de jeu.
 */

export const SOURCES_GUERRE_ECO = {
  accordUeUsa: { titre: 'Commission européenne : l\'accord commercial entre l\'UE et les États-Unis expliqué (droits de 15 % depuis le 1er août 2025)', url: 'https://france.representation.ec.europa.eu/informations/laccord-commercial-entre-lue-et-les-etats-unis-explique-2025-07-29_fr' },
  exportsUsa: { titre: 'Banque des Territoires : droits de douane de 15 %, l\'accord menace plus de 2 000 entreprises (48,6 Md€ d\'exportations françaises vers les États-Unis en 2024)', url: 'https://www.banquedesterritoires.fr/droits-de-douanes-15-laccord-trouve-entre-les-etats-unis-et-lunion-europeenne-menace-plus-de-2000-0' },
  douanes: { titre: 'Douane : historique des mesures tarifaires des États-Unis et de l\'Union européenne', url: 'https://www.douane.gouv.fr/fiche/historique-des-mesures-tarifaires-des-etats-unis-et-de-lunion-europeenne' },
  terresRares: { titre: 'Parlement européen (EPRS) : les restrictions chinoises sur les exportations de terres rares (novembre 2025)', url: 'https://epthinktank.eu/2025/11/24/chinas-rare-earth-export-restrictions/' },
  terresRaresGc: { titre: 'Le Grand Continent : restrictions à l\'exportation des terres rares et droits de douane, comprendre l\'escalade', url: 'https://legrandcontinent.eu/fr/2025/10/12/restrictions-a-lexportation-des-terres-rares-et-droits-de-douane-comprendre-lescalade-entre-la-chine-et-les-etats-unis/' },
  antiCoercition: { titre: 'MERICS : comment l\'UE peut répondre aux contrôles chinois sur les terres rares (instrument anti-coercition)', url: 'https://merics.org/en/comment/merics-forum-how-can-eu-navigate-chinas-rare-earths-export-controls' },
  ecfr: { titre: 'ECFR : « Escalate to negotiate », comment l\'Europe devrait répondre aux restrictions chinoises', url: 'https://ecfr.eu/article/escalate-to-negotiate-how-europe-should-respond-to-chinese-export-restrictions/' },
};

/**
 * Adversaires possibles. poids : exposition de l'économie française (1 pour
 * les États-Unis, premier client hors d'Europe) ; secteurs visés par leurs
 * ripostes ; relation suivie dans le jeu.
 */
export const CIBLES = {
  etatsUnis: {
    nom: 'États-Unis', relation: 'etatsUnis', poids: 1,
    contexte: 'Premier client de la France hors d\'Europe : 48,6 Md€ de biens exportés en 2024. Depuis l\'accord de Turnberry (27 juillet 2025), la plupart des exportations européennes paient 15 % de droits de douane.',
    secteurs: 'vins et spiritueux, aéronautique, luxe, cosmétiques',
    sources: ['accordUeUsa', 'exportsUsa', 'douanes'],
  },
  chine: {
    nom: 'Chine', relation: 'chine', poids: 0.55,
    contexte: 'La Chine fournit près de 99 % des terres rares et 98 % des aimants permanents utilisés dans l\'Union. Le 9 octobre 2025, elle a étendu ses contrôles à l\'exportation à douze terres rares et aux produits qui en contiennent.',
    secteurs: 'cognac, porc, produits laitiers, aéronautique',
    sources: ['terresRares', 'terresRaresGc', 'antiCoercition', 'ecfr'],
  },
  russie: {
    nom: 'Russie', relation: null, poids: 0.15,
    contexte: 'Depuis l\'invasion de l\'Ukraine (2022), l\'Union a adopté de nombreux paquets de sanctions contre la Russie. Les échanges avec la France sont devenus faibles, mais l\'énergie reste sensible.',
    secteurs: 'énergie, engrais',
    sources: [],
  },
};

/**
 * Mesures du Gouvernement. niveau : intensité de la guerre économique
 * (0 à 3) ; ue : il faut l'accord de Bruxelles (chance de l'obtenir) ;
 * requiert : niveau minimal déjà atteint.
 */
export const MESURES = {
  controle_investissements: { nom: 'Bloquer les rachats d\'entreprises stratégiques et réserver les achats publics aux entreprises européennes', niveau: 1, ue: false, texte: 'mesures nationales : contrôle renforcé des investissements étrangers et préférence européenne dans les achats publics' },
  riposte_ue: { nom: 'Obtenir de Bruxelles des droits de douane de riposte', niveau: 2, ue: true, texte: 'droits de douane européens de riposte' },
  anti_coercition: { nom: 'Faire activer l\'instrument anti-coercition (jamais utilisé) : services, marchés publics, propriété intellectuelle', niveau: 3, ue: true, requiert: 2, texte: 'instrument anti-coercition de l\'Union' },
  sanctions: { nom: 'Proposer un nouveau paquet de sanctions européennes', niveau: 2, ue: true, seulement: ['russie'], texte: 'nouveau paquet de sanctions' },
  negocier: { nom: 'Ouvrir des négociations (désescalade d\'un cran)', niveau: -1, ue: false, texte: 'négociations' },
  cesser: { nom: 'Mettre fin à la guerre économique', niveau: -9, ue: false, texte: 'fin des mesures' },
};

/**
 * Effets par trimestre selon l'intensité des ripostes de l'adversaire
 * (impulsion sur l'écart de production, en points ; la persistance de l'écart
 * la multiplie environ par cinq) et selon nos propres mesures (hausse des
 * prix importés, en %, une fois par cran, étalée sur un an).
 */
export const EXPORTS_PERDUS = [0, 0.02, 0.045, 0.08];
export const PRIX_PAR_CRAN = 0.12;
/** Au moins six trimestres entre deux crises commerciales subies. */
export const ECART_CRISES = 6;
