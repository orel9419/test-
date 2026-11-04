/**
 * Grands rendez-vous internationaux : sommets (G7, G20, OTAN, COP),
 * Jeux olympiques, sommet Choose France, candidature olympique de Munich.
 *
 * Dates, lieux et budgets : countries/_grands-evenements.json (sourcés).
 * Effets (influence, popularité, coûts, tourisme) : hypothèses de jeu. Repère
 * pour les Jeux : la Cour des comptes chiffre l'effet de Paris 2024 à
 * +0,07 point de PIB et son coût public à 6,6 Md€.
 *
 * Ces événements suivent le format du catalogue des événements, avec
 * « calendrier: true » (ils tombent à date fixe) et, pour ceux que l'on
 * prépare, l'effet « grandEvenement » qui mémorise les choix du joueur.
 */
import { borner } from '../model/outils.js';
import { qualiteChantier } from '../engine/chantiers.js';

const FR = ['france'];
const DE = ['allemagne'];
const US = ['etatsUnis'];
const EU = ['france', 'allemagne'];
const quand = (annee, t) => (e) => e.trimestre.annee === annee && e.trimestre.t === t;
const prep = (e, id) => e.grandsEvenements?.[id] ?? {};

/** Calendrier affiché dans l'interface (rôle : hôte ou participant). */
export const CALENDRIER_GRANDS_EVENEMENTS = [
  { id: 'cop31', nom: 'COP31 (climat)', lieu: 'Antalya, Turquie', annee: 2026, t: 4, date: '9-20 novembre 2026', hotes: [], pays: ['france', 'allemagne', 'etatsUnis'], statut: 'secondaire' },
  { id: 'g20_miami', nom: 'Sommet du G20', lieu: 'Doral, Miami', annee: 2026, t: 4, date: '14-15 décembre 2026', hotes: ['etatsUnis'], pays: ['france', 'allemagne', 'etatsUnis'], statut: 'secondaire' },
  { id: 'munich', nom: 'Candidature olympique de Munich', lieu: 'Munich', annee: 2027, t: 1, date: 'choix du DOSB le 26/09/2026', hotes: ['allemagne'], pays: ['allemagne'], statut: 'officiel' },
  { id: 'choose_france', nom: 'Sommet Choose France (chaque année)', lieu: 'Versailles', annee: 2027, t: 2, date: 'mai-juin', hotes: ['france'], pays: ['france'], statut: 'secondaire' },
  { id: 'g7_2027', nom: 'Sommet du G7', lieu: 'États-Unis', annee: 2027, t: 2, date: '2027, date à préciser (jeu : T2)', hotes: ['etatsUnis'], pays: ['france', 'allemagne', 'etatsUnis'], statut: 'secondaire' },
  { id: 'otan_tirana', nom: 'Sommet de l\'OTAN', lieu: 'Tirana, Albanie', annee: 2027, t: 3, date: '2027, date à confirmer (jeu : T3)', hotes: [], pays: ['france', 'allemagne', 'etatsUnis'], statut: 'a_verifier' },
  { id: 'jo2030_budget', nom: 'JO d\'hiver 2030 : arbitrages budgétaires', lieu: 'Alpes françaises', annee: 2027, t: 4, date: 'budget révisé chaque année', hotes: ['france'], pays: ['france'], statut: 'secondaire' },
  { id: 'la28_preparation', nom: 'JO de Los Angeles : sécurité et transports', lieu: 'Los Angeles', annee: 2028, t: 1, date: 'préparation', hotes: ['etatsUnis'], pays: ['etatsUnis'], statut: 'secondaire' },
  { id: 'la28', nom: 'Jeux olympiques de Los Angeles', lieu: 'Los Angeles', annee: 2028, t: 3, date: 'ouverture le 14 juillet 2028', hotes: ['etatsUnis'], pays: ['etatsUnis'], statut: 'secondaire' },
  { id: 'jo2030_securite', nom: 'JO d\'hiver 2030 : plan de sécurité', lieu: 'Alpes françaises', annee: 2029, t: 2, date: 'préparation', hotes: ['france'], pays: ['france'], statut: 'secondaire' },
  { id: 'g7_2033_france', nom: 'Sommet du G7 sous présidence française', lieu: 'France', annee: 2033, t: 2, date: '2033, déduit de la rotation', hotes: ['france'], pays: ['france'], statut: 'derive' },
  { id: 'cdm2038', nom: 'Coupe du monde de football (si la France l\'obtient)', lieu: 'France', annee: 2038, t: 3, date: 'juin-juillet 2038 (scénario)', hotes: ['france'], pays: ['france'], statut: 'estimation' },
  { id: 'g7_2029', nom: 'Sommet du G7', lieu: 'Allemagne', annee: 2029, t: 2, date: '2029, déduit de la rotation', hotes: ['allemagne'], pays: ['allemagne'], statut: 'derive' },
  { id: 'cdm2038_candidature', nom: 'Coupe du monde 2038 : candidater ? (scénario de jeu)', lieu: 'France', annee: 2027, t: 3, date: 'scénario de jeu', hotes: ['france'], pays: ['france'], statut: 'estimation' },
  { id: 'cdm2038_vote', nom: 'Coupe du monde 2038 : vote de la FIFA (scénario de jeu)', lieu: 'Congrès de la FIFA', annee: 2030, t: 2, date: 'scénario de jeu', hotes: ['france'], pays: ['france'], statut: 'estimation' },
  { id: 'jo2030', nom: 'Jeux olympiques d\'hiver des Alpes françaises', lieu: 'Alpes françaises', annee: 2030, t: 1, date: 'février 2030', hotes: ['france'], pays: ['france'], statut: 'secondaire' },
];

/**
 * Réussite d'un grand événement accueilli : tirée une seule fois, puis
 * mémorisée (les différents choix de l'événement partagent le même résultat).
 */
function reussite(e, id, alea, p) {
  const g = (e.grandsEvenements ??= {});
  g[id] ??= {};
  if (g[id].reussite === undefined) g[id].reussite = alea ? alea.tirage(borner(p, 0.05, 0.97)) : p >= 0.5;
  return g[id].reussite;
}

/** Effets communs d'un grand événement réussi ou raté. */
function bilanJeux(ok, nom) {
  return ok
    ? { influence: 4, fierte: 3, chocPIB: 0.07, texte: `${nom} sont un succès populaire et médiatique. Le tourisme et l'image du pays en profitent (repère : +0,07 point de PIB pour Paris 2024 selon la Cour des comptes).` }
    : { influence: -2, fierte: -2, chocPIB: 0.02, texte: `${nom} sont ternis par des embouteillages géants, des incidents de sécurité et des polémiques sur les coûts.` };
}

export const GRANDS_EVENEMENTS = [
  // --- COP31 (Antalya, novembre 2026) -----------------------------------------------
  {
    id: 'cop31', titre: 'COP31 à Antalya : quelle ambition climatique ?', pays: EU, calendrier: true, unique: true,
    condition: quand(2026, 4), probabilite: () => 1,
    description: () => 'La conférence des Nations unies sur le climat se tient du 9 au 20 novembre 2026 en Turquie, l\'Australie conduisant les négociations. Les pays du Sud demandent des financements ; la guerre en Iran a remis le pétrole et le gaz au premier plan.',
    choix: [
      { id: 'ambition', texte: 'Porter avec l\'UE une sortie programmée des énergies fossiles', effets: () => ({ influence: 2, relations: { ue: 2, afrique: 3 }, opinion: { jeunes: 2, entrepreneurs: -1 }, texte: 'L\'Europe tient la ligne la plus ambitieuse ; les pays pétroliers freinent.' }) },
      { id: 'financement', texte: 'Promettre 1 Md€ par an de financement climat aux pays du Sud', effets: () => ({ depensesTemporaires: [{ poste: 'affairesEtrangeres', valeur: 1, duree: 8 }], influence: 3, relations: { afrique: 6, ue: 1 }, opinion: { jeunes: 1 }, texte: 'Votre promesse débloque un compromis sur l\'adaptation.' }) },
      { id: 'minimal', texte: 'Délégation réduite : priorité au pouvoir d\'achat', effets: () => ({ influence: -1, opinion: { jeunes: -2 }, texte: 'Votre absence est remarquée.' }) },
    ],
  },
  {
    id: 'cop31_us', titre: 'COP31 à Antalya : que fait Washington ?', pays: US, calendrier: true, unique: true,
    condition: quand(2026, 4), probabilite: () => 1,
    description: () => 'Les États-Unis ont quitté l\'accord de Paris. La conférence se tient du 9 au 20 novembre 2026 en Turquie.',
    choix: [
      { id: 'absent', texte: 'Ne pas envoyer de délégation de haut niveau', effets: () => ({ relations: { ue: -2 }, influence: -1, opinion: { agriculteurs: 1 }, texte: 'La Chine occupe l\'espace laissé vide.' }) },
      { id: 'gnl', texte: 'Venir vendre le gaz naturel liquéfié américain comme « énergie de transition »', effets: () => ({ relations: { ue: 2, japon: 2 }, influence: 1, opinion: { entrepreneurs: 2, jeunes: -1 }, texte: 'Plusieurs contrats d\'approvisionnement sont évoqués en marge de la conférence.' }) },
      { id: 'retour', texte: 'Annoncer le retour dans l\'accord de Paris', effets: () => ({ relations: { ue: 6, afrique: 3, chine: 2 }, influence: 3, opinion: { jeunes: 3, entrepreneurs: -3, agriculteurs: -3 }, instabilite: 0.03, texte: 'Volte-face spectaculaire : votre base électorale proteste.' }) },
    ],
  },

  // --- G20 (Doral, décembre 2026) -----------------------------------------------------
  {
    id: 'g20_miami', titre: 'Vous accueillez le G20 à Doral (14-15 décembre)', pays: US, calendrier: true, unique: true,
    condition: quand(2026, 4), probabilite: () => 1,
    description: () => 'Fin de la présidence américaine du G20. Le sommet se tient dans un complexe de golf appartenant au président, ce que l\'opposition dénonce ; l\'Afrique du Sud n\'est pas invitée. Quel agenda ?',
    choix: [
      { id: 'commerce', texte: 'Des accords commerciaux bilatéraux en série', effets: () => ({ depensesExceptionnelles: 0.3, relations: { japon: 3, mexique: 2, canada: 2, ue: 1 }, influence: 2, opinion: { entrepreneurs: 2, jeunes: -1 }, texte: 'Plusieurs accords de principe sont signés en marge du sommet.' }) },
      { id: 'energie', texte: 'L\'énergie et la sortie de crise au Moyen-Orient', effets: () => ({ depensesExceptionnelles: 0.3, relations: { golfe: 4, ue: 3, chine: 1 }, influence: 3, energie: 0.98, texte: 'Les producteurs du Golfe s\'engagent à augmenter leur production.' }) },
      { id: 'resserre', texte: 'Un format resserré, sans déclaration commune', effets: () => ({ depensesExceptionnelles: 0.1, relations: { ue: -2, afrique: -2 }, influence: -1, texte: 'Le sommet passe presque inaperçu.' }) },
    ],
  },
  {
    id: 'g20_participation', titre: 'G20 de Miami : quelle posture face à Washington ?', pays: EU, calendrier: true, unique: true,
    condition: quand(2026, 4), probabilite: () => 1,
    description: () => 'Le sommet se tient les 14 et 15 décembre 2026 à Doral, en Floride. Droits de douane, Ukraine et Iran sont au menu.',
    choix: [
      { id: 'front', texte: 'Parler d\'une seule voix avec les Européens', effets: () => ({ relations: { ue: 2, etatsUnis: -2 }, influence: 1, texte: 'L\'Europe pèse davantage, Washington s\'agace.' }) },
      { id: 'bilateral', texte: 'Jouer la relation bilatérale avec le président américain', effets: () => ({ relations: { etatsUnis: 4, ue: -2 }, texte: 'Un tête-à-tête cordial, des partenaires européens froissés.' }) },
      { id: 'afrique', texte: 'Défendre la place de l\'Afrique, absente du sommet', effets: () => ({ relations: { afrique: 5, etatsUnis: -3 }, influence: 1, texte: 'Le geste est salué à Johannesburg et à Addis-Abeba.' }) },
    ],
  },

  // --- Candidature olympique de Munich ---------------------------------------------
  {
    id: 'munich', titre: 'Candidature olympique de Munich : quel soutien fédéral ?', pays: DE, calendrier: true, unique: true,
    condition: quand(2027, 1), probabilite: () => 1,
    description: () => 'Le 26 septembre 2026, le DOSB a choisi Munich (91 voix contre 50 pour Cologne-Rhin-Ruhr) comme candidate pour les Jeux d\'été de 2036, 2040 ou 2044. Le CIO attend des garanties publiques. Repère : en 2015, les Hambourgeois avaient rejeté par référendum la candidature de leur ville.',
    choix: [
      { id: 'garanties', texte: 'Apporter les garanties financières de l\'État fédéral', effets: () => ({ grandEvenement: { id: 'munich', soutien: 'garanties' }, influence: 1, opinion: { jeunes: 1, retraites: -1 }, texte: 'La candidature gagne en crédibilité auprès du CIO.' }) },
      { id: 'referendum', texte: 'Conditionner ce soutien à un référendum local à Munich', effets: (e, alea) => {
        const oui = 50 + 0.3 * (e.social.popularite - 20) + (alea ? alea.normale(8, 6) : 8);
        return oui >= 50
          ? { grandEvenement: { id: 'munich', soutien: 'garanties', referendum: oui }, influence: 2, fierte: 1, texte: `Les Munichois approuvent la candidature (${oui.toFixed(1)} % de oui) : une légitimité précieuse face au CIO.` }
          : { grandEvenement: { id: 'munich', soutien: 'abandon', referendum: oui }, influence: -1, texte: `Les Munichois rejettent la candidature (${(100 - oui).toFixed(1)} % de non). Le projet est abandonné.` };
      } },
      { id: 'reserve', texte: 'Rester en retrait : l\'affaire du DOSB et de la Bavière', effets: () => ({ grandEvenement: { id: 'munich', soutien: 'reserve' }, texte: 'La Bavière porte seule le projet.' }) },
    ],
  },
  {
    id: 'munich_cio', titre: 'Le CIO ouvre un « dialogue ciblé » avec Munich (scénario de jeu)', pays: DE, calendrier: true, unique: true,
    condition: (e) => quand(2029, 2)(e) && prep(e, 'munich').soutien === 'garanties', probabilite: () => 1,
    description: () => 'Scénario de jeu : le calendrier réel du CIO n\'est pas connu. Munich entre en négociation exclusive ; il faut confirmer les investissements (transports, village olympique).',
    choix: [
      { id: 'investir', texte: 'Engager 0,5 Md€ par an d\'investissements fédéraux', effets: () => ({ depensesTemporaires: [{ poste: 'transports', valeur: 0.5, duree: 8 }], influence: 3, fierte: 2, texte: 'Munich devient favorite.' }) },
      { id: 'prudence', texte: 'Limiter l\'engagement fédéral', effets: () => ({ influence: -1, texte: 'Le CIO s\'interroge sur la solidité du soutien allemand.' }) },
    ],
  },

  // --- Choose France (chaque année) -----------------------------------------------
  {
    id: 'choose_france', titre: 'Sommet Choose France à Versailles', pays: FR, calendrier: true,
    condition: (e) => e.trimestre.t === 2 && e.trimestre.annee >= 2027, probabilite: () => 1,
    description: (e) => {
      const c = e.entreprises?.climatAffaires ?? 100;
      const annonce = Math.max(15, Math.round(40 + 5 * (c - 100)));
      return `Les dirigeants étrangers sont attendus à Versailles. Avec le climat des affaires actuel (${c.toFixed(0)}), environ ${annonce} Md€ d'investissements pourraient être annoncés. Repères : 40,8 Md€ en 2025 ; 93 Md€ en 2026, dont environ 45 Md€ d'engagements fermes.`;
    },
    choix: [
      { id: 'grand_format', texte: 'Grand format : un maximum d\'annonces', effets: (e) => { const c = e.entreprises?.climatAffaires ?? 100; const annonce = Math.max(15, 40 + 5 * (c - 100)); return { engagement: { id: 'choose_france', montant: 0.5 * annonce }, climatAffaires: 1, influence: 1, opinion: { entrepreneurs: 2 }, texte: `${Math.round(annonce)} Md€ d'investissements annoncés, dont environ la moitié fermes.` }; } },
      { id: 'fermes', texte: 'N\'afficher que des engagements fermes et datés', effets: (e) => { const c = e.entreprises?.climatAffaires ?? 100; const annonce = Math.max(15, 40 + 5 * (c - 100)); return { engagement: { id: 'choose_france', montant: 0.45 * annonce }, souverainete: 1, opinion: { salaries: 1 }, texte: `Des annonces plus modestes (${Math.round(0.45 * annonce)} Md€), mais crédibles.` }; } },
      { id: 'renoncer', texte: 'Ne pas organiser le sommet cette année', effets: () => ({ climatAffaires: -2, influence: -1, texte: 'Les investisseurs y voient un signal négatif.' }) },
    ],
  },

  // --- G7 2027 (États-Unis) ---------------------------------------------------------
  {
    id: 'g7_2027', titre: 'Vous présidez le G7 : quelle priorité ?', pays: US, calendrier: true, unique: true,
    condition: quand(2027, 2), probabilite: () => 1,
    description: () => 'Les États-Unis président le G7 depuis le 1er janvier 2027 (date et lieu du sommet à préciser).',
    choix: [
      { id: 'ukraine', texte: 'Un accord de paix et de reconstruction pour l\'Ukraine', effets: () => ({ depensesExceptionnelles: 0.2, relations: { ukraine: 6, ue: 4 }, influence: 3, texte: 'Les Européens s\'engagent sur le financement de la reconstruction.' }) },
      { id: 'chine', texte: 'Un front commun face aux surcapacités industrielles chinoises', effets: () => ({ depensesExceptionnelles: 0.2, relations: { ue: 2, japon: 4, chine: -6 }, influence: 2, opinion: { salaries: 1 }, texte: 'Pékin dénonce une « mentalité de guerre froide ».' }) },
      { id: 'ia', texte: 'Une charte du G7 sur l\'intelligence artificielle', effets: () => ({ depensesExceptionnelles: 0.2, relations: { ue: 2, japon: 2 }, influence: 2, souverainete: 1, texte: 'Les géants américains de l\'IA en sortent renforcés.' }) },
    ],
  },
  {
    id: 'g7_2027_participation', titre: 'Sommet du G7 aux États-Unis', pays: EU, calendrier: true, unique: true,
    condition: quand(2027, 2), probabilite: () => 1,
    description: () => 'Premier G7 de la présidence américaine (date et lieu à préciser). Les droits de douane américains pèsent sur vos exportations.',
    choix: [
      { id: 'treve', texte: 'Chercher une trêve commerciale', effets: (e, alea) => (alea && alea.tirage(0.5)
        ? { relations: { etatsUnis: 5 }, chocPIB: 0.05, texte: 'Washington suspend une partie des hausses de droits de douane.' }
        : { relations: { etatsUnis: 1 }, texte: 'Aucune avancée : la Maison-Blanche renvoie à des négociations bilatérales.' }) },
      { id: 'ukraine', texte: 'Défendre le soutien à l\'Ukraine', effets: () => ({ relations: { ukraine: 4, etatsUnis: -1 }, influence: 1, texte: 'Le communiqué final reprend vos formulations.' }) },
      { id: 'ia', texte: 'Défendre une régulation européenne de l\'IA', effets: () => ({ relations: { etatsUnis: -2, ue: 2 }, influence: 1, souverainete: 1, texte: 'Désaccord transatlantique assumé.' }) },
    ],
  },

  // --- JO de Los Angeles 2028 --------------------------------------------------------
  {
    id: 'la28_preparation', titre: 'JO de Los Angeles : la sécurité et les transports sont-ils prêts ?', pays: US, calendrier: true, unique: true,
    condition: quand(2028, 1), probabilite: () => 1,
    description: () => 'La loi de 2025 prévoit 1 Md$ pour la sécurité des Jeux (subventions de la FEMA). Los Angeles demande 875 M$ pour les transports et manquerait de 1,7 Md$ pour des Jeux « sans voiture ». Ouverture le 14 juillet 2028.',
    choix: [
      { id: 'securite', texte: 'Renforcer la sécurité fédérale (1,5 Md$ de plus, Garde nationale)', effets: () => ({ depensesTemporaires: [{ poste: 'interieurJustice', valeur: 3, duree: 2 }], grandEvenement: { id: 'la28', securite: 'renforcee' }, opinion: { retraites: 1 }, texte: 'Le dispositif fédéral est renforcé.' }) },
      { id: 'transports', texte: 'Financer les transports des Jeux (875 M$)', effets: () => ({ depensesTemporaires: [{ poste: 'transports', valeur: 1.75, duree: 2 }], grandEvenement: { id: 'la28', transports: true }, opinion: { jeunes: 1 }, texte: 'Bus et navettes supplémentaires sont commandés.' }) },
      { id: 'minimal', texte: 'S\'en tenir au milliard voté en 2025', effets: () => ({ grandEvenement: { id: 'la28', securite: 'base' }, texte: 'La ville et le comité d\'organisation devront se débrouiller.' }) },
    ],
  },
  {
    id: 'la28', titre: 'Ouverture des Jeux olympiques de Los Angeles', pays: US, calendrier: true, unique: true,
    condition: quand(2028, 3), probabilite: () => 1,
    description: () => 'Les Jeux s\'ouvrent le 14 juillet 2028 au Los Angeles Memorial Coliseum, quatre mois avant l\'élection présidentielle.',
    choix: [
      { id: 'heritage', texte: 'Pérenniser l\'héritage (lignes de transport, équipements)', effets: (e, alea) => ({ ...bilanJeux(reussite(e, 'la28', alea, 0.68 + (prep(e, 'la28').securite === 'renforcee' ? 0.15 : 0) + (prep(e, 'la28').transports ? 0.1 : 0) - 0.2 * e.social.risqueGlobal - (e.politique.shutdown ? 0.1 : 0)), 'Les Jeux de Los Angeles'), depensesTemporaires: [{ poste: 'transports', valeur: 1, duree: 8 }] }) },
      { id: 'celebrer', texte: 'Célébrer les médaillés à la Maison-Blanche', effets: (e, alea) => { const b = bilanJeux(reussite(e, 'la28', alea, 0.68 + (prep(e, 'la28').securite === 'renforcee' ? 0.15 : 0) + (prep(e, 'la28').transports ? 0.1 : 0) - 0.2 * e.social.risqueGlobal - (e.politique.shutdown ? 0.1 : 0)), 'Les Jeux de Los Angeles'); return { ...b, fierte: b.fierte + 1 }; } },
    ],
  },

  // --- JO d'hiver 2030 (Alpes françaises) --------------------------------------------
  {
    id: 'jo2030_budget', titre: 'JO d\'hiver 2030 : arbitrages sur le budget', pays: FR, calendrier: true, unique: true,
    condition: quand(2027, 4), probabilite: () => 1,
    description: () => 'Le budget du comité d\'organisation (2,13 Md€, financé à 75 % par des recettes privées) est révisé chaque année. L\'État et les régions garantissent un éventuel déficit à parts égales, dans la limite de 515 M€. Les écologistes dénoncent un « chèque en blanc ».',
    choix: [
      { id: 'sobres', texte: 'Des Jeux sobres : tenir le budget et le plafond de garantie', effets: () => ({ grandEvenement: { id: 'jo2030', budget: 'sobre' }, credibilite: 0.02, opinion: { jeunes: 1 }, texte: 'Le comité devra renoncer à certains équipements.' }) },
      { id: 'prestige', texte: 'Ajouter 1 Md€ d\'investissements publics (transports alpins, équipements)', effets: () => ({ depensesTemporaires: [{ poste: 'transports', valeur: 0.5, duree: 8 }], grandEvenement: { id: 'jo2030', budget: 'prestige' }, opinion: { entrepreneurs: 1, jeunes: -1 }, texte: 'Les vallées alpines obtiennent leurs projets d\'infrastructure.' }) },
      { id: 'garantie', texte: 'Relever la garantie publique pour rassurer le CIO', effets: () => ({ grandEvenement: { id: 'jo2030', budget: 'garantie' }, credibilite: -0.02, texte: 'Le CIO est rassuré ; les contribuables portent davantage de risque.' }) },
    ],
  },
  {
    id: 'jo2030_securite', titre: 'JO d\'hiver 2030 : quel plan de sécurité ?', pays: FR, calendrier: true, unique: true,
    condition: quand(2029, 2), probabilite: () => 1,
    description: () => 'Les sites sont dispersés entre la Haute-Savoie, la Savoie et la Côte d\'Azur, ce qui complique la sécurité et les transports.',
    choix: [
      { id: 'renforcee', texte: 'Mobilisation nationale des forces de l\'ordre (1,2 Md€ par an pendant neuf mois)', effets: () => ({ depensesTemporaires: [{ poste: 'interieurJustice', valeur: 1.2, duree: 3 }], grandEvenement: { id: 'jo2030', securite: 'renforcee' }, texte: 'Le dispositif rappelle celui de Paris 2024.' }) },
      { id: 'europeenne', texte: 'Coopération policière européenne et italienne', effets: () => ({ depensesTemporaires: [{ poste: 'interieurJustice', valeur: 0.5, duree: 3 }], grandEvenement: { id: 'jo2030', securite: 'europeenne' }, relations: { ue: 2, italie: 3 }, texte: 'Des policiers européens renforceront les équipes françaises.' }) },
      { id: 'normale', texte: 'Le dispositif ordinaire, renforcé localement', effets: () => ({ grandEvenement: { id: 'jo2030', securite: 'normale' }, texte: 'Les syndicats de police s\'inquiètent des effectifs.' }) },
    ],
  },
  {
    id: 'jo2030', titre: 'Ouverture des Jeux d\'hiver des Alpes françaises', pays: FR, calendrier: true, unique: true,
    condition: quand(2030, 1), probabilite: () => 1,
    description: () => 'Les athlètes du monde entier sont dans les Alpes. Enneigement, transports, sécurité : tout se joue maintenant.',
    choix: [
      { id: 'heritage', texte: 'Engager la transition des stations de moyenne montagne (héritage)', effets: (e, alea) => ({ ...bilanJeuxAlpes(e, alea), depensesTemporaires: [{ poste: 'ecologieEnergie', valeur: 0.3, duree: 8 }] }) },
      { id: 'cour_comptes', texte: 'Demander à la Cour des comptes un bilan public et complet', effets: (e, alea) => ({ ...bilanJeuxAlpes(e, alea), credibilite: 0.02 }) },
    ],
  },

  // --- Coupe du monde de football 2038 (France, scénario de jeu) -------------------------
  {
    id: 'cdm2038_candidature', titre: 'Candidater à l\'organisation de la Coupe du monde 2038 ? (scénario de jeu)', pays: FR, calendrier: true, unique: true,
    condition: quand(2027, 3), probabilite: () => 1,
    description: () => 'La Fédération française de football veut porter une candidature pour 2038. Aucune candidature n\'est déposée à ce jour : ce dossier est un scénario de jeu. La France a déjà accueilli la Coupe du monde 1998 et l\'Euro 2016 ; il faudrait surtout rénover des stades existants.',
    choix: [
      { id: 'candidater', texte: 'Soutenir une candidature ambitieuse, avec des garanties de l\'État', effets: () => ({ depensesExceptionnelles: 0.05, grandEvenement: { id: 'cdm2038', candidature: 'ambitieuse' }, influence: 1, opinion: { jeunes: 1.5, salaries: 0.5 }, texte: 'Le dossier est lancé : il faudra convaincre les fédérations du monde entier.' }) },
      { id: 'sobre', texte: 'Soutenir une candidature « sobre » : uniquement des stades existants', effets: () => ({ depensesExceptionnelles: 0.03, grandEvenement: { id: 'cdm2038', candidature: 'sobre' }, opinion: { jeunes: 1 }, credibilite: 0.01, texte: 'Une candidature économe, appréciée des contribuables, moins spectaculaire.' }) },
      { id: 'non', texte: 'Ne pas soutenir de candidature : priorité aux finances publiques', effets: () => ({ grandEvenement: { id: 'cdm2038', candidature: 'non' }, opinion: { jeunes: -1 }, texte: 'Les supporters sont déçus ; Bercy respire.' }) },
    ],
  },
  {
    id: 'cdm2038_vote', titre: 'La FIFA attribue la Coupe du monde 2038 (scénario de jeu)', pays: FR, calendrier: true, unique: true,
    condition: (e) => quand(2030, 2)(e) && ['ambitieuse', 'sobre'].includes(prep(e, 'cdm2038').candidature), probabilite: () => 1,
    description: () => 'Le congrès de la FIFA se réunit. Face à la France : des candidatures concurrentes d\'autres continents.',
    choix: [
      { id: 'president', texte: 'Le chef de l\'État défend lui-même la candidature devant le congrès', effets: (e, alea) => voteCoupeDuMonde(e, alea, 0.1) },
      { id: 'ministre', texte: 'Laisser la fédération et la ministre des Sports porter le dossier', effets: (e, alea) => voteCoupeDuMonde(e, alea, 0) },
    ],
  },
  {
    id: 'cdm2038', titre: 'Coup d\'envoi de la Coupe du monde en France', pays: FR, calendrier: true, unique: true,
    condition: (e) => quand(2038, 3)(e) && prep(e, 'cdm2038').attribuee === true, probabilite: () => 1,
    description: () => 'Quarante-huit équipes, des millions de visiteurs : la fête commence, et avec elle les risques (sécurité, transports, chaleur).',
    choix: [
      { id: 'fete', texte: 'Fan zones gratuites dans toutes les villes hôtes', effets: (e, alea) => ({ ...bilanCoupeDuMonde(e, alea), depensesExceptionnelles: 0.15 }) },
      { id: 'sobre', texte: 'Une organisation sobre, priorité à la sécurité', effets: (e, alea) => bilanCoupeDuMonde(e, alea, 0.05) },
    ],
  },

  // --- G7 2029 (Allemagne) -------------------------------------------------------------
  {
    id: 'g7_2029', titre: 'Vous présidez le G7 : quelle priorité ?', pays: DE, calendrier: true, unique: true,
    condition: quand(2029, 2), probabilite: () => 1,
    description: () => 'L\'Allemagne préside le G7 en 2029 (déduit de la rotation habituelle, à confirmer).',
    choix: [
      { id: 'ukraine', texte: 'La reconstruction de l\'Ukraine', effets: () => ({ depensesExceptionnelles: 0.2, relations: { ukraine: 6, ue: 3 }, influence: 3, texte: 'Une conférence des donateurs est organisée à Berlin.' }) },
      { id: 'industrie', texte: 'L\'énergie et l\'avenir de l\'industrie', effets: () => ({ depensesExceptionnelles: 0.2, relations: { etatsUnis: 3, chine: -2 }, influence: 2, climatAffaires: 1, texte: 'Accord sur le gaz naturel liquéfié et les matières premières critiques.' }) },
      { id: 'climat', texte: 'Le financement du climat dans les pays du Sud', effets: () => ({ depensesExceptionnelles: 0.2, relations: { afrique: 4 }, influence: 2, opinion: { jeunes: 2 }, texte: 'Un fonds commun est lancé.' }) },
    ],
  },
];

/** Bilan des Jeux d'hiver 2030 selon la préparation (budget, sécurité) et l'enneigement. */
function bilanJeuxAlpes(e, alea) {
  const p = prep(e, 'jo2030');
  const q = qualiteChantier(e, 'jo2030');
  const proba = 0.62 + ({ renforcee: 0.15, europeenne: 0.1 }[p.securite] ?? 0) + (p.budget === 'prestige' ? 0.08 : 0) - 0.25 * e.social.risqueGlobal + (q === null ? 0 : (q - 0.75) * 0.8);
  const ok = reussite(e, 'jo2030', alea, proba);
  const b = bilanJeux(ok, 'Les Jeux d\'hiver des Alpes françaises');
  // Déficit du comité d'organisation : la garantie publique joue (État et régions à parts égales)
  if (!ok && p.budget !== 'prestige') b.depensesExceptionnelles = p.budget === 'garantie' ? 0.5 : 0.26;
  return b;
}

/** Vote de la FIFA : influence, relations avec l'Afrique et le Golfe, type de candidature, engagement personnel. */
function voteCoupeDuMonde(e, alea, bonus) {
  const p = prep(e, 'cdm2038');
  const rel = ((e.international.relations.afrique ?? 0) + (e.international.relations.golfe ?? 0)) / 2;
  const proba = borner(0.32 + 0.004 * ((e.international.influence ?? 60) - 60) + 0.002 * rel + (p.candidature === 'ambitieuse' ? 0.05 : 0) + bonus, 0.1, 0.7);
  const ok = alea.tirage(proba);
  return ok
    ? { grandEvenement: { id: 'cdm2038', attribuee: true }, influence: 3, fierte: 2, texte: `La France organisera la Coupe du monde 2038 (chances estimées : ${Math.round(proba * 100)} %) ! Les chantiers peuvent commencer (onglet Grands rendez-vous).` }
    : { grandEvenement: { id: 'cdm2038', attribuee: false }, influence: -1, fierte: -0.5, texte: `La FIFA choisit une autre candidature (chances estimées : ${Math.round(proba * 100)} %).` };
}

/** Bilan de la Coupe du monde : qualité des chantiers, préparation, et parcours des Bleus. */
function bilanCoupeDuMonde(e, alea, bonus = 0) {
  const q = qualiteChantier(e, 'cdm2038');
  const proba = borner(0.6 + (q === null ? -0.05 : (q - 0.75) * 0.8) + bonus - 0.25 * e.social.risqueGlobal, 0.2, 0.95);
  const ok = alea.tirage(proba);
  const parcours = alea.uniforme();
  const titre = parcours < 0.14;
  const finale = parcours < 0.3;
  const sport = titre ? ' Et les Bleus remportent la Coupe du monde à domicile, comme en 1998 : liesse dans tout le pays !' : finale ? ' Les Bleus s\'inclinent en finale, la fierté est intacte.' : ' Les Bleus sortent avant la finale.';
  return {
    influence: ok ? 4 : -2, fierte: (ok ? 2 : -1) + (titre ? 4 : finale ? 1.5 : 0), chocPIB: ok ? 0.05 : 0,
    grandEvenement: { id: 'cdm2038', reussite: ok },
    texte: `${ok ? 'Organisation réussie, saluée dans le monde entier.' : 'Incidents de sécurité et transports saturés : l\'image du pays en souffre.'}${sport}`,
  };
}
