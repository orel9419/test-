/**
 * Baromètre d'opinion : satisfaction de la population sur dix grands thèmes
 * et intentions de vote par parti, mis à jour chaque trimestre selon les
 * décisions et la situation.
 *
 * Les niveaux de départ des thèmes sont des estimations de jeu, cohérentes
 * avec l'impopularité de départ des exécutifs (sourcée). Les intentions de
 * vote de départ sont sourcées quand c'est possible (voir countries/*.json).
 */
import { borner } from '../model/outils.js';

export const THEMES = {
  pouvoirAchat: { nom: 'Pouvoir d\'achat', description: 'Revenus réels des ménages, inflation, prix de l\'énergie.' },
  emploi: { nom: 'Emploi', description: 'Chômage et dynamisme de l\'activité.' },
  sante: { nom: 'Santé', description: 'Moyens de l\'hôpital et de l\'assurance maladie.' },
  education: { nom: 'Éducation', description: 'Moyens de l\'école et de l\'enseignement supérieur.' },
  securite: { nom: 'Sécurité et justice', description: 'Moyens de la police, de la gendarmerie et de la justice.' },
  environnement: { nom: 'Environnement', description: 'Baisse des émissions, transition énergétique.' },
  financesPubliques: { nom: 'Finances publiques', description: 'Déficit, dette, confiance des marchés.' },
  retraites: { nom: 'Retraites', description: 'Âge de départ, revalorisation des pensions.' },
  entreprises: { nom: 'Industrie et entreprises', description: 'Climat des affaires, souveraineté, fermetures d\'usines.' },
  international: { nom: 'Place dans le monde', description: 'Influence, défense, relations avec les partenaires.' },
};

/** Niveaux de départ (estimation de jeu, sur 100). */
const DEPART = {
  france: { pouvoirAchat: 28, emploi: 35, sante: 30, education: 32, securite: 35, environnement: 38, financesPubliques: 22, retraites: 30, entreprises: 40, international: 45 },
  allemagne: { pouvoirAchat: 30, emploi: 45, sante: 40, education: 38, securite: 33, environnement: 40, financesPubliques: 35, retraites: 35, entreprises: 30, international: 45 },
  etatsUnis: { pouvoirAchat: 30, emploi: 50, sante: 33, education: 40, securite: 40, environnement: 38, financesPubliques: 30, retraites: 40, entreprises: 50, international: 38 },
};

/**
 * Intentions de vote de départ par famille politique.
 * France : premier tour de la présidentielle (Ifop-Fiducial, 30/09/2026) pour RN, centre et
 * gauche sociale-démocrate ; autres familles estimées. États-Unis : vote générique bipartite
 * (PollCheck, 30/10/2026). Allemagne : intentions gérées par le module politique.
 */
export const FAMILLES = {
  france: {
    RN: { nom: 'RN et alliés', depart: 33, gouvernement: false, groupes: ['RN', 'UDR'] },
    centre: { nom: 'Bloc central', depart: 16, gouvernement: true, groupes: ['EPR', 'DEM', 'HOR'] },
    LR: { nom: 'Droite (LR)', depart: 9, gouvernement: false, groupes: ['DR'], estimation: true },
    gauche: { nom: 'Gauche sociale-démocrate (PS, Place publique)', depart: 15, gouvernement: false, groupes: ['SOC'] },
    LFI: { nom: 'La France insoumise', depart: 12, gouvernement: false, groupes: ['LFI', 'GDR'], estimation: true },
    ecolos: { nom: 'Écologistes', depart: 5, gouvernement: false, groupes: ['ECOS'], estimation: true },
    autres: { nom: 'Autres', depart: 10, gouvernement: false, groupes: ['LIOT'], estimation: true },
  },
  etatsUnis: {
    REP: { nom: 'Républicains', depart: 45.4, gouvernement: true },
    DEM: { nom: 'Démocrates', depart: 54.6, gouvernement: false },
  },
};

export function initialiserOpinion(e) {
  const themes = { ...DEPART[e.pays] };
  const intentions = FAMILLES[e.pays]
    ? Object.fromEntries(Object.entries(FAMILLES[e.pays]).map(([k, f]) => [k, f.depart]))
    : { ...(e.politique?.intentions ?? {}) };
  e.opinion = { themes, themes0: { ...themes }, intentions, intentions0: { ...intentions }, historique: [] };
  e.opinion.historique.push(instantane(e));
}

function instantane(e) {
  return { tour: e.tour, approbation: e.social.popularite, themes: { ...e.opinion.themes }, intentions: { ...intentions(e) } };
}

/** Intentions de vote courantes (l'Allemagne utilise celles du module politique). */
export function intentions(e) {
  return e.pays === 'allemagne' ? { ...(e.politique?.intentions ?? {}) } : { ...e.opinion.intentions };
}

/** Variation en volume (%) d'un poste de dépense depuis le départ. */
function varPoste(e, id) {
  const l = e.budget[id];
  return l ? (l.montant / (l.montantInitial * e.macro.niveauPrix / 100) - 1) * 100 : 0;
}

/** Met à jour le baromètre pour le trimestre. */
export function majOpinion(e) {
  const o = e.opinion;
  const m = e.macro, f = e.finances, r = e.reference;
  const h0 = e.historique[0];
  const pa = e.menages.reduce((s, x) => s + (x.variationPct ?? 0), 0) / e.menages.length;
  const pensions = e.menages.find((x) => x.id === 'retraite')?.variationPct ?? 0;
  const ageDelta = e.retraites.ageLegal - (e.statique.retraites.ageLegal ?? e.retraites.ageLegal);
  const cibles = {
    pouvoirAchat: 2.5 * pa - 3 * Math.max(0, m.inflation - 2) + 3 * Math.max(0, r.inflation - 2),
    emploi: -7 * (m.chomage - r.chomage) + 2 * (m.croissanceAnnuelle - m.croissancePotentielleBase),
    sante: 0.9 * varPoste(e, 'sante'),
    education: 0.9 * varPoste(e, 'education') + 0.3 * varPoste(e, 'recherche'),
    securite: 0.9 * varPoste(e, 'interieurJustice') + 0.2 * varPoste(e, 'defense'),
    environnement: 2.5 * (e.climat.emissions0 - e.climat.emissions) / e.climat.emissions0 * 100 + 0.3 * varPoste(e, 'ecologieEnergie'),
    financesPubliques: -5 * (f.deficitRatio - h0.deficit) - 0.8 * (f.detteRatio - h0.dette) - 0.04 * (f.spread - h0.spread) + 10 * f.credibilite,
    retraites: 2 * pensions - 8 * Math.max(0, ageDelta),
    entreprises: 0.6 * ((e.entreprises?.climatAffaires ?? 100) - 100) + 0.4 * ((e.entreprises?.souverainete ?? 50) - (e.entreprises?.souverainete0 ?? 50)),
    international: 1.2 * (e.international.influence - e.international.influenceInitiale),
  };
  for (const [k, delta] of Object.entries(cibles)) {
    const cible = borner(o.themes0[k] + delta, 0, 100);
    o.themes[k] = o.themes[k] + 0.5 * (cible - o.themes[k]);
  }
  majIntentions(e);
  o.historique.push(instantane(e));
}

/** Intentions de vote (France, États-Unis) selon la popularité et la situation. */
function majIntentions(e) {
  const o = e.opinion;
  if (e.pays === 'allemagne') return;
  const pop = e.social.popularite;
  const pop0 = e.historique[0]?.popularite ?? pop;
  const m = e.macro, r = e.reference, t = o.themes;
  const i0 = o.intentions0;
  const cible = {};
  if (e.pays === 'france') {
    cible.centre = i0.centre + 0.35 * (pop - pop0) + 0.04 * (t.financesPubliques - o.themes0.financesPubliques);
    cible.RN = i0.RN - 0.2 * (pop - pop0) + 0.8 * (m.chomage - r.chomage) + 1.2 * Math.max(0, m.inflation - 2.5) + 0.06 * (o.themes0.securite - t.securite) + 0.05 * (o.themes0.pouvoirAchat - t.pouvoirAchat);
    cible.gauche = i0.gauche + 0.05 * (o.themes0.sante - t.sante) + 0.04 * (o.themes0.retraites - t.retraites) - 0.05 * (pop - pop0);
    cible.LFI = i0.LFI + 0.05 * (o.themes0.pouvoirAchat - t.pouvoirAchat) + 0.04 * (o.themes0.retraites - t.retraites);
    cible.LR = i0.LR + 0.04 * (o.themes0.financesPubliques - t.financesPubliques) + 0.03 * (o.themes0.securite - t.securite);
    cible.ecolos = i0.ecolos + 0.04 * (o.themes0.environnement - t.environnement);
    cible.autres = i0.autres;
  } else {
    cible.REP = i0.REP + 0.35 * (pop - pop0) - 0.8 * Math.max(0, m.inflation - r.inflation) - 0.6 * (m.chomage - r.chomage);
    cible.DEM = 100 - cible.REP;
  }
  for (const k of Object.keys(cible)) cible[k] = Math.max(1, cible[k]);
  const total = Object.values(cible).reduce((s, x) => s + x, 0);
  for (const k of Object.keys(cible)) o.intentions[k] += 0.4 * (100 * cible[k] / total - o.intentions[k]);
}
