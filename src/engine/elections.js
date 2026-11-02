/**
 * Élections : scrutins prévus au calendrier (intermédiaires et nationaux) et
 * scrutins déclenchés par le joueur (dissolution, référendum, question de
 * confiance). Les résultats découlent des intentions de vote du baromètre,
 * donc des décisions prises pendant la partie.
 *
 * Les décalages régionaux (Länder) et les clés de répartition des sièges sont
 * des hypothèses de jeu.
 */
import { borner } from '../model/outils.js';
import { libelleTrimestre } from './calendrier.js';
import { intentions as intentionsCourantes, FAMILLES } from './opinion.js';
import { appliquerChocs } from './social.js';
import { projectionPresidentielleEtatsUnis } from './objectifs.js';

/** Enregistre un résultat d'élection et l'écrit au journal. */
function enregistrer(e, resultat) {
  const r = { tour: e.tour, trimestre: libelleTrimestre(e.trimestre), ...resultat };
  (e.elections ??= { historique: [] }).historique.push(r);
  e.journal.push({ tour: e.tour, trimestre: r.trimestre, type: 'election', texte: `${r.nom} : ${r.resume}` });
  return r;
}

// ---------------------------------------------------------------------------
// France
// ---------------------------------------------------------------------------

/**
 * Sièges à l'Assemblée selon les intentions de vote. Le scrutin majoritaire à
 * deux tours amplifie les blocs en tête : sièges ∝ part^1,6 (hypothèse), la
 * gauche étant supposée unie au second tour comme en 2024, et les reports de
 * voix favorisant le bloc central face au RN.
 */
export function siegesLegislativesFrance(e, intentions) {
  const i = intentions;
  const blocs = {
    RN: i.RN ?? 0, centre: i.centre ?? 0, LR: i.LR ?? 0,
    gauche: (i.gauche ?? 0) + (i.LFI ?? 0) + (i.ecolos ?? 0), autres: i.autres ?? 0,
  };
  // Second tour : le bloc central bénéficie des reports (« front républicain »), le RN en pâtit (hypothèse calée sur 2022 et 2024).
  // Proportionnelle intégrale : sièges proportionnels aux voix (seuil de 5 %) ; système mixte : entre les deux.
  const prop = e.politique?.proportionnelle;
  const reports = prop === 'integrale' ? {} : { centre: 1.6, RN: 0.85 };
  const puissance = prop === 'integrale' ? 1 : prop === 'mixte' ? 1.4 : 1.6;
  const poids = Object.fromEntries(Object.entries(blocs).map(([k, v]) => [k, prop === 'integrale' && v < 5 ? 0 : (reports[k] ?? 1) * Math.pow(Math.max(0.1, v), puissance)]));
  const total = Object.values(poids).reduce((s, x) => s + x, 0);
  const sieges = Object.fromEntries(Object.entries(poids).map(([k, v]) => [k, Math.round(577 * v / total)]));
  const gaucheTotal = (i.gauche ?? 0) + (i.LFI ?? 0) + (i.ecolos ?? 0) || 1;
  const parGroupe = {
    RN: Math.round(sieges.RN * 0.88), UDR: Math.round(sieges.RN * 0.12),
    EPR: Math.round(sieges.centre * 0.57), DEM: Math.round(sieges.centre * 0.22), HOR: Math.round(sieges.centre * 0.21),
    DR: sieges.LR, LIOT: sieges.autres,
    SOC: Math.round(sieges.gauche * (i.gauche ?? 0) / gaucheTotal),
    LFI: Math.round(sieges.gauche * (i.LFI ?? 0) * 0.8 / gaucheTotal),
    GDR: Math.round(sieges.gauche * (i.LFI ?? 0) * 0.2 / gaucheTotal),
    ECOS: Math.round(sieges.gauche * (i.ecolos ?? 0) / gaucheTotal),
  };
  const ecart = 577 - Object.values(parGroupe).reduce((s, x) => s + x, 0);
  parGroupe.LIOT += ecart;
  return { blocs: sieges, parGroupe };
}

/** Élections législatives françaises (après une dissolution ou une présidentielle). */
export function legislativesFrance(e, alea, bonusCentre = 0) {
  const i = intentionsCourantes(e);
  i.centre = (i.centre ?? 0) + bonusCentre;
  for (const k of Object.keys(i)) i[k] = Math.max(0.5, i[k] + alea.normale(0, 1.2));
  const { blocs, parGroupe } = siegesLegislativesFrance(e, i);
  for (const g of e.politique.groupes) if (parGroupe[g.id] !== undefined) g.sieges = parGroupe[g.id];
  const central = blocs.centre;
  const majorite = e.politique.majorite;
  return enregistrer(e, {
    type: 'legislatives', nom: 'Élections législatives',
    resultats: Object.entries(blocs).map(([k, s]) => ({ nom: { RN: 'RN et alliés', centre: 'Bloc central', LR: 'Droite (LR)', gauche: 'Gauche (union)', autres: 'Divers' }[k], part: k === 'gauche' ? (i.gauche + i.LFI + i.ecolos) : i[k], sieges: s })),
    victoireCamp: central >= majorite,
    resume: `bloc central ${central} sièges, RN et alliés ${blocs.RN}, gauche ${blocs.gauche}, LR ${blocs.LR} (majorité absolue : ${majorite}).`,
  });
}

/** Élections régionales et départementales françaises : un test pour le gouvernement. */
function regionalesFrance(e, alea) {
  const i = intentionsCourantes(e);
  // Prime aux sortants locaux (LR et PS dirigent la plupart des régions) : hypothèse
  const loc = { ...i, LR: (i.LR ?? 0) + 4, gauche: (i.gauche ?? 0) + 4, RN: (i.RN ?? 0) - 3 };
  for (const k of Object.keys(loc)) loc[k] = Math.max(0, loc[k] + alea.normale(0, 1.5));
  const regionsRN = borner(Math.round(((loc.RN ?? 0) - 26) / 2), 0, 10);
  const centre = loc.centre ?? 0;
  appliquerChocs(e, centre < 14 ? { salaries: -2, retraites: -2, jeunes: -2 } : { retraites: 1 });
  e.politique.chocInstabilite = (e.politique.chocInstabilite ?? 0) + 0.02 * regionsRN;
  return enregistrer(e, {
    type: 'regionales', nom: 'Élections régionales et départementales',
    resultats: Object.entries(loc).map(([k, v]) => ({ nom: FAMILLES.france[k]?.nom ?? k, part: v })),
    victoireCamp: centre >= 18,
    resume: `RN ${loc.RN.toFixed(0)} %, bloc central ${centre.toFixed(0)} %. Le RN remporte ${regionsRN} région(s) sur 13 en métropole.${centre < 14 ? ' Revers net pour le camp gouvernemental.' : ''}`,
  });
}

/**
 * Élections municipales (partie longue) : scrutin local où les maires
 * sortants, souvent LR ou de gauche, résistent ; le RN y reste plus faible
 * qu'aux scrutins nationaux (hypothèses de jeu).
 */
function municipalesFrance(e, alea) {
  const i = intentionsCourantes(e);
  const loc = { ...i, LR: (i.LR ?? 0) + 6, gauche: (i.gauche ?? 0) + 5, ecolos: (i.ecolos ?? 0) + 2, RN: (i.RN ?? 0) - 6 };
  for (const k of Object.keys(loc)) loc[k] = Math.max(0, loc[k] + alea.normale(0, 1.5));
  const centre = loc.centre ?? 0;
  appliquerChocs(e, centre < 12 ? { salaries: -1, retraites: -2 } : { retraites: 1 });
  return enregistrer(e, {
    type: 'municipales', nom: 'Élections municipales',
    resultats: Object.entries(loc).map(([k, v]) => ({ nom: FAMILLES.france[k]?.nom ?? k, part: v })),
    victoireCamp: centre >= 15,
    resume: `Les maires sortants résistent : droite ${loc.LR.toFixed(0)} %, gauche ${(loc.gauche + (loc.ecolos ?? 0)).toFixed(0)} %, RN ${loc.RN.toFixed(0)} %, votre camp ${centre.toFixed(0)} %.${centre < 12 ? ' Revers pour le camp gouvernemental, faute d\'implantation locale.' : ''}`,
  });
}

// ---------------------------------------------------------------------------
// Allemagne
// ---------------------------------------------------------------------------

/** Décalages régionaux par rapport aux intentions nationales (hypothèses) et parti dirigeant (estimation). */
const LAENDER = {
  'Schleswig-Holstein': { voix: 4, dirigeant: 'CDUCSU', decalage: { CDUCSU: 12, SPD: 2, GRUENE: 4, AFD: -10, LINKE: -4 } },
  Sarre: { voix: 3, dirigeant: 'SPD', decalage: { CDUCSU: 6, SPD: 16, GRUENE: -5, AFD: -6, LINKE: -5 } },
  'Rhénanie-du-Nord-Westphalie': { voix: 6, dirigeant: 'CDUCSU', decalage: { CDUCSU: 8, SPD: 6, GRUENE: 2, AFD: -9, LINKE: -4 } },
  Brême: { voix: 3, dirigeant: 'SPD', decalage: { CDUCSU: 4, SPD: 14, GRUENE: 4, AFD: -10, LINKE: 2 } },
  'Basse-Saxe': { voix: 6, dirigeant: 'SPD', decalage: { CDUCSU: 6, SPD: 12, GRUENE: 2, AFD: -8, LINKE: -5 } },
};

function landtag(e, ech, alea) {
  const nat = intentionsCourantes(e);
  const resume = [];
  for (const land of ech.laender ?? []) {
    const L = LAENDER[land];
    if (!L) continue;
    const r = {};
    for (const p of ['CDUCSU', 'SPD', 'GRUENE', 'AFD', 'LINKE']) r[p] = Math.max(1, (nat[p] ?? 0) + (L.decalage[p] ?? 0) + alea.normale(0, 1.5));
    const premier = Object.entries(r).sort((a, b) => b[1] - a[1])[0][0];
    const conserve = premier === L.dirigeant;
    if (!conserve) {
      e.politique.bundesrat.soutien = Math.max(0, e.politique.bundesrat.soutien - Math.round(L.voix / 2));
      if (L.dirigeant === 'SPD' && e.politique.coalition) e.politique.coalition.choc = (e.politique.coalition.choc ?? 0) - 8;
    }
    if (r.AFD > 20) e.politique.chocAfD = (e.politique.chocAfD ?? 0) + 0.5;
    resume.push(`${land} : ${premier === 'CDUCSU' ? 'CDU' : premier === 'AFD' ? 'AfD' : premier} en tête (CDU ${r.CDUCSU.toFixed(0)} %, SPD ${r.SPD.toFixed(0)} %, AfD ${r.AFD.toFixed(0)} %)${conserve ? '' : ' — le parti sortant perd la tête'}`);
  }
  return enregistrer(e, { type: 'landtag', nom: `Élections régionales (${(ech.laender ?? []).join(', ')})`, resultats: [], victoireCamp: null, resume: `${resume.join(' ; ')}. Soutien estimé au Bundesrat : ${e.politique.bundesrat.soutien} voix.` });
}

// ---------------------------------------------------------------------------
// Élections européennes (France, Allemagne)
// ---------------------------------------------------------------------------

function europeennes(e, alea) {
  const i = intentionsCourantes(e);
  for (const k of Object.keys(i)) i[k] = Math.max(0, i[k] + alea.normale(0, 1.5));
  const tri = Object.entries(i).sort((a, b) => b[1] - a[1]);
  const extremeDroite = e.pays === 'france' ? 'RN' : 'AFD';
  const enTete = tri[0][0];
  const camp = e.pays === 'france' ? i.centre : i.CDUCSU;
  if (enTete === extremeDroite) {
    e.international.relations.ue -= 5;
    e.politique.chocInstabilite = (e.politique.chocInstabilite ?? 0) + 0.05;
  }
  appliquerChocs(e, camp < (e.pays === 'france' ? 15 : 20) ? { retraites: -2, salaries: -1 } : { retraites: 1 });
  const nom = (k) => (e.pays === 'france' ? FAMILLES.france[k]?.nom : { CDUCSU: 'CDU/CSU', AFD: 'AfD', SPD: 'SPD', GRUENE: 'Verts', LINKE: 'Die Linke', autres: 'Autres' }[k]) ?? k;
  return enregistrer(e, {
    type: 'europeennes', nom: 'Élections européennes',
    resultats: tri.map(([k, v]) => ({ nom: nom(k), part: v })),
    victoireCamp: enTete !== extremeDroite,
    resume: `${nom(enTete)} en tête avec ${tri[0][1].toFixed(1)} %. Votre camp : ${camp.toFixed(1)} %.`,
  });
}

// ---------------------------------------------------------------------------
// États-Unis
// ---------------------------------------------------------------------------

/**
 * Élections de mi-mandat : toute la Chambre et un tiers du Sénat. Sièges
 * démocrates à la Chambre ≈ 214 + 7 × (part démocrate − 50,5) ; au Sénat
 * ≈ 47 + 1,4 × (part − 51). Calibrage : avec 54,6 % au vote générique, on
 * retrouve les projections publiées (environ 243 sièges et 52 sénateurs).
 */
function miMandat(e, alea, nom = 'Élections de mi-mandat') {
  const pol = e.politique;
  const partD = e.opinion.intentions.DEM + alea.normale(0, 1.5);
  const dem = borner(Math.round(214 + 7 * (partD - 50.5)), 150, 290);
  const rep = 435 - dem;
  const senatD = borner(Math.round(47 + 1.4 * (partD - 51)), 40, 60);
  const freedom = Math.round(rep * 0.14);
  for (const g of pol.groupes) {
    if (g.id === 'DEM') g.sieges = dem;
    if (g.id === 'REP') g.sieges = rep - freedom;
    if (g.id === 'FREEDOM') g.sieges = freedom;
  }
  pol.sieges = 435;
  pol.majorite = 218;
  pol.senat.DEM = senatD;
  pol.senat.REP = 100 - senatD;
  const chambreDem = dem >= 218, senatDem = senatD >= 51;
  pol.gouvernementDivise = chambreDem || senatDem;
  return enregistrer(e, {
    type: 'mi_mandat', nom,
    resultats: [{ nom: 'Démocrates', part: partD, sieges: dem }, { nom: 'Républicains', part: 100 - partD, sieges: rep }],
    victoireCamp: !chambreDem,
    resume: `Chambre : ${dem} démocrates, ${rep} républicains ; Sénat : ${senatD} démocrates, ${100 - senatD} républicains. ${chambreDem ? 'Les démocrates prennent la Chambre' : 'Les républicains gardent la Chambre'}${senatDem ? ' et le Sénat.' : '.'} ${pol.gouvernementDivise ? 'Gouvernement divisé : vos textes devront obtenir l\'accord des démocrates.' : ''}`,
  });
}

function presidentielleEtatsUnis(e, alea) {
  const part = projectionPresidentielleEtatsUnis(e) + alea.normale(0, 2);
  const victoire = part >= 50;
  const p = e.politique.presidentielle ?? {};
  // Mandats consécutifs du camp à la Maison-Blanche (usure du pouvoir, modèle « time for change »)
  const mandats = victoire ? (p.mandatsConsecutifs ?? 1) + 1 : 0;
  e.politique.presidentielle = { ...p, tenue: true, resultat: part, mandatsConsecutifs: mandats };
  enregistrer(e, {
    type: 'presidentielle', nom: 'Élection présidentielle',
    resultats: [{ nom: 'Candidat républicain (votre camp)', part }, { nom: 'Candidat démocrate', part: 100 - part }],
    victoireCamp: victoire,
    resume: `${victoire ? 'Le candidat de votre camp l\'emporte' : 'Le candidat démocrate l\'emporte'} avec ${Math.max(part, 100 - part).toFixed(1)} % du vote bipartite.${victoire && e.horizon ? ' Vous incarnez la nouvelle administration, qui prend ses fonctions le 20 janvier.' : ''}`,
  });
  // Toute la Chambre et un tiers du Sénat sont renouvelés le même jour
  miMandat(e, alea, 'Élections au Congrès (en même temps que la présidentielle)');
  return { victoire, part };
}

// ---------------------------------------------------------------------------
// Scrutins du calendrier
// ---------------------------------------------------------------------------

/**
 * Organise les élections prévues ce trimestre (hors présidentielle française
 * et élection fédérale allemande, gérées par le module politique).
 * @returns {object|null} défaite éventuelle
 */
export function electionsDuTrimestre(e, alea) {
  let defaite = null;
  for (const ech of (e.statique.calendrier.echeances || [])) {
    if (ech.annee !== e.trimestre.annee || ech.t !== e.trimestre.t) continue;
    if (ech.type === 'regionales') regionalesFrance(e, alea);
    if (ech.type === 'municipales') municipalesFrance(e, alea);
    if (ech.type === 'landtag') landtag(e, ech, alea);
    if (ech.type === 'europeennes') europeennes(e, alea);
    if (ech.type === 'mi_mandat') miMandat(e, alea);
    // Le président sortant ne se représente pas : le scrutin juge son bilan (objectif), sans « défaite » en cours de mandat.
    // En partie longue, perdre la Maison-Blanche met fin à la partie.
    if (ech.type === 'presidentielle' && e.pays === 'etatsUnis') {
      const r = presidentielleEtatsUnis(e, alea);
      if (!r.victoire && e.horizon) defaite = { cause: 'presidentielle', texte: 'Le candidat démocrate a remporté la présidentielle : votre camp quitte la Maison-Blanche.' };
    }
  }
  return defaite;
}

// ---------------------------------------------------------------------------
// Scrutins déclenchés par le joueur
// ---------------------------------------------------------------------------

/**
 * Référendum (France, article 11) sur une réforme. Le « oui » dépend de
 * l'accueil de la réforme par chaque groupe ET de la popularité du
 * gouvernement : un référendum devient vite un plébiscite (1969, 2005).
 * @returns {object} { oui (%), adopte }
 */
export function referendum(e, entreeReforme, reaction, alea) {
  let soutien = 0;
  for (const [g, def] of Object.entries(e.statique.groupes)) {
    const avis = (reaction?.chocs?.[g] ?? 0) + (reaction?.opinion?.[g] ?? 0) - 1.2 * (reaction?.grief?.[g] ?? 0) + 0.8 * (reaction?.compensation?.[g] ?? 0);
    soutien += def.poids * avis;
  }
  const oui = borner(50 + 1.2 * soutien + 0.35 * (e.social.popularite - 35) + alea.normale(0, 3), 15, 85);
  const adopte = oui >= 50;
  e.politique.dernierReferendum = { annee: e.trimestre.annee, oui };
  if (adopte) {
    appliquerChocs(e, { salaries: 2, retraites: 2, jeunes: 2 });
    e.politique.chocInstabilite = (e.politique.chocInstabilite ?? 0) - 0.05;
  } else {
    appliquerChocs(e, { salaries: -4, retraites: -4, jeunes: -4, fonctionnaires: -4, entrepreneurs: -3 });
    e.politique.chocInstabilite = (e.politique.chocInstabilite ?? 0) + 0.15;
  }
  enregistrer(e, {
    type: 'referendum', nom: `Référendum : ${entreeReforme.nom}`,
    resultats: [{ nom: 'Oui', part: oui }, { nom: 'Non', part: 100 - oui }],
    victoireCamp: adopte,
    resume: `${adopte ? 'Le oui l\'emporte' : 'Le non l\'emporte'} avec ${Math.max(oui, 100 - oui).toFixed(1)} %. ${adopte ? 'La réforme est adoptée sans passer par le Parlement.' : 'La réforme est abandonnée ; le gouvernement sort affaibli.'}`,
  });
  return { oui, adopte };
}
