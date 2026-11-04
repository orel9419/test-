/**
 * Agences de notation : Fitch, Moody's et S&P notent la dette publique selon
 * un calendrier publié à l'avance (règlement européen sur les agences de
 * notation : deux ou trois dates par an et par pays, fixées en fin d'année).
 *
 * Modèle de jeu :
 *  - un score « fondamental » combine la dette, sa dynamique, le déficit,
 *    l'instabilité politique et la crédibilité budgétaire ;
 *  - chaque agence est ancrée sur sa note réelle de départ (et sa perspective) :
 *    seule l'évolution des fondamentaux depuis le départ la fait bouger ;
 *  - à chaque revue, l'agence maintient, change la perspective, puis abaisse
 *    ou relève la note d'un cran. Une perspective négative est un avertissement :
 *    la dégradation vient souvent à la revue suivante si rien ne change ;
 *  - une dégradation renchérit un peu les emprunts (l'essentiel est déjà dans
 *    les prix des marchés), sauf aux seuils : catégorie BBB, puis perte de la
 *    catégorie « investissement » (BB+ et moins), beaucoup plus coûteuse.
 *
 * Coefficients : hypothèses de jeu documentées, calibrées pour que l'écart
 * France-Allemagne (environ 56 points de dette) corresponde à environ 4 crans.
 */
import { borner } from '../model/outils.js';
import { libelleTrimestre } from './calendrier.js';
import { appliquerChocs } from './social.js';

export const ECHELLE = ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-', 'BB+', 'BB', 'BB-', 'B+', 'B', 'B-', 'CCC'];
export const ECHELLE_MOODYS = ['Aaa', 'Aa1', 'Aa2', 'Aa3', 'A1', 'A2', 'A3', 'Baa1', 'Baa2', 'Baa3', 'Ba1', 'Ba2', 'Ba3', 'B1', 'B2', 'B3', 'Caa1'];
const SEUIL_BBB = 7;      // BBB+ et moins
const SEUIL_SPECULATIF = 10; // BB+ et moins : catégorie « spéculative »

/** Trimestres de revue de chaque agence (hypothèse de jeu proche des calendriers publiés). */
const CALENDRIER = { fitch: [1, 3], moodys: [2, 4], sp: [2, 4] };
const NOMS = { fitch: 'Fitch', moodys: 'Moody\'s', sp: 'S&P' };
const BIAIS_PERSPECTIVE = { negative: 0.4, stable: 0, positive: -0.4 };

/** Libellé d'une note selon l'échelle de l'agence. */
export function libelleNote(agence, cran) {
  const i = borner(Math.round(cran), 0, ECHELLE.length - 1);
  return agence === 'moodys' ? ECHELLE_MOODYS[i] : ECHELLE[i];
}

/** Score fondamental (en crans, plus haut = plus risqué). */
export function scoreFondamental(e) {
  const f = e.finances;
  const histo = f.historiqueDeficit ?? [f.deficitRatio];
  const deficitMoyen = histo.reduce((s, x) => s + x, 0) / Math.max(1, histo.length);
  // Dynamique de la dette (points de PIB par an) : observée dans la partie, complétée au début
  // par la tendance des données de départ pour éviter un saut artificiel
  const h = e.historique ?? [];
  const n = Math.min(4, Math.max(0, h.length - 1));
  const observee = n >= 1 ? (f.detteRatio - h.at(-1 - n).dette) * 4 / n : 0;
  const initiale = e.notation?.dynamiqueInitiale ?? observee;
  const dynamique = ((4 - n) * initiale + n * observee) / 4;
  // Pays émetteur de la monnaie de réserve : les agences réagissent moins (même coefficient que les marchés)
  const k = e.statique.sensibiliteMarches ?? 1;
  return k * (0.07 * (f.detteRatio - 60)
    + 0.35 * Math.max(0, deficitMoyen - 3)
    + 0.25 * borner(dynamique, -4, 6)
    + 1.5 * (e.macro.instabilitePolitique ?? 0)
    - 1.0 * (f.credibilite ?? 0));
}

/**
 * État initial à partir des notes réelles (données sourcées du pays).
 * @param {Array} notes [{ agence: 'fitch'|'moodys'|'sp', note: 'A+', perspective, date }]
 */
export function initialiserNotation(e, notes, dynamiqueInitiale = 0) {
  if (!notes?.length) { e.notation = null; return; }
  e.notation = { dynamiqueInitiale };
  const s0 = scoreFondamental(e);
  e.notation = {
    dynamiqueInitiale,
    agences: notes.map((n) => {
      const echelle = n.agence === 'moodys' ? ECHELLE_MOODYS : ECHELLE;
      const cran = Math.max(0, echelle.indexOf(n.note));
      return {
        id: n.agence, nom: NOMS[n.agence] ?? n.agence, cran, cranInitial: cran,
        perspective: n.perspective ?? 'stable', date: n.date ?? null,
        // Tour depuis lequel la perspective est en place (une perspective négative met en général
        // 6 à 18 mois à se traduire en dégradation)
        perspectiveDepuis: 1 - (trimestresDepuis(n.perspectiveDepuis ?? n.date, e.trimestre) ?? 4),
        // Une agence qui vient de se prononcer (même trimestre que le début de partie) attend sa revue suivante
        prochaineRevueMin: memeTrimestre(n.date, e.trimestre) ? 2 : 1,
        ancrage: cran + (BIAIS_PERSPECTIVE[n.perspective] ?? 0) - s0,
      };
    }),
    historique: [],
  };
}

/** Nombre de trimestres écoulés entre une date ISO (AAAA-MM…) et le trimestre donné. */
function trimestresDepuis(date, tr) {
  const m = /^(\d{4})-(\d{2})/.exec(date ?? '');
  if (!m) return null;
  return Math.max(0, (tr.annee - Number(m[1])) * 4 + (tr.t - Math.ceil(Number(m[2]) / 3)));
}

/** Vrai si une date ISO (AAAA-MM-JJ ou AAAA-MM) tombe dans le trimestre donné. */
function memeTrimestre(date, tr) {
  const m = /^(\d{4})-(\d{2})/.exec(date ?? '');
  return !!m && Number(m[1]) === tr.annee && Math.ceil(Number(m[2]) / 3) === tr.t;
}

/** Lit les notes sourcées d'un fichier de données pays (finances_publiques.notation). */
export function notesDepuisDonnees(donnees) {
  const fp = donnees?.finances_publiques ?? {};
  const notes = Object.entries(fp.notation ?? {}).map(([agence, n]) => ({ agence, note: n.valeur, perspective: n.perspective, date: n.date, perspectiveDepuis: n.perspective_depuis }));
  const avant = fp.dette_pct_pib?.valeur, apres = fp.dette_prevision_2026?.valeur;
  const dynamique = typeof avant === 'number' && typeof apres === 'number' ? apres - avant : 0;
  return { notes, dynamique };
}

/** Agences qui rendent leur verdict au trimestre donné. */
export function revuesDuTrimestre(e, trimestre = e.trimestre) {
  return (e.notation?.agences ?? []).filter((a) => (CALENDRIER[a.id] ?? [2, 4]).includes(trimestre.t) && e.tour >= (a.prochaineRevueMin ?? 1));
}

/** Pression sur une agence : écart entre la note « méritée » selon le modèle et la note actuelle (en crans). */
export function pression(e, a) {
  return scoreFondamental(e) + a.ancrage - a.cran;
}

/**
 * Revues du trimestre. Appelée après la mise à jour des finances.
 * @returns {Array} décisions { agence, action: 'maintien'|'perspective'|'degradation'|'relevement', note, perspective, texte }
 */
export function majNotation(e, alea) {
  if (!e.notation) return [];
  const lib = libelleTrimestre(e.trimestre);
  const decisions = [];
  for (const a of revuesDuTrimestre(e)) {
    const g = pression(e, a) + (alea ? alea.normale(0, 0.12) : 0);
    const avant = { cran: a.cran, perspective: a.perspective };
    let action = 'maintien';
    // Seuils asymétriques (hystérésis) : il faut une nette amélioration pour une perspective positive
    const perspectiveMure = e.tour - (a.perspectiveDepuis ?? 1) >= 3;
    const perspectiveAvant = a.perspective;
    if (g >= 1.0 || (g >= 0.5 && a.perspective === 'negative' && perspectiveMure)) {
      a.cran += 1; action = 'degradation';
      a.perspective = g >= 1.8 ? 'negative' : 'stable';
    } else if (a.cran > 0 && (g <= -1.2 || (g <= -0.8 && a.perspective === 'positive'))) {
      a.cran -= 1; action = 'relevement';
      a.perspective = 'stable';
    } else if (g >= 0.5 && a.perspective === 'negative') {
      // perspective négative maintenue : la dégradation viendra si rien ne change
    } else if (g >= 0.5 && a.perspective !== 'negative') {
      a.perspective = 'negative'; action = 'perspective';
    } else if (g <= -0.8 && a.perspective !== 'positive' && a.cran > 0) {
      a.perspective = a.perspective === 'negative' ? 'stable' : 'positive'; action = 'perspective';
    } else if (a.perspective === 'negative' && g < 0) {
      a.perspective = 'stable'; action = 'perspective';
    } else if (a.perspective === 'positive' && g > -0.4) {
      a.perspective = 'stable'; action = 'perspective';
    }
    if (a.perspective !== perspectiveAvant || action === 'degradation' || action === 'relevement') a.perspectiveDepuis = e.tour;
    // Après un changement de note, l'agence juge la nouvelle note adaptée : seule une nouvelle
    // évolution des fondamentaux la fera bouger (pas de va-et-vient d'une revue à l'autre)
    if (action === 'degradation' || action === 'relevement') a.ancrage = a.cran - scoreFondamental(e);
    a.date = lib;
    const note = libelleNote(a.id, a.cran);
    const persp = { negative: 'négative', stable: 'stable', positive: 'positive' }[a.perspective];
    let texte;
    if (action === 'degradation') texte = `${a.nom} abaisse la note du pays de ${libelleNote(a.id, avant.cran)} à ${note} (perspective ${persp}).`;
    else if (action === 'relevement') texte = `${a.nom} relève la note du pays de ${libelleNote(a.id, avant.cran)} à ${note}.`;
    else if (action === 'perspective') texte = `${a.nom} maintient la note ${note} mais passe la perspective de ${{ negative: 'négative', stable: 'stable', positive: 'positive' }[avant.perspective]} à ${persp}.`;
    else texte = `${a.nom} maintient la note ${note}, perspective ${persp}.`;

    // Effets : modestes en général, forts aux seuils (catégorie BBB, catégorie spéculative)
    const f = e.finances;
    if (action === 'degradation') {
      let choc = 0.06;
      if (a.cran === SEUIL_BBB) { choc = 0.15; texte += ' Le pays tombe dans la catégorie BBB : certains fonds doivent alléger leurs positions.'; }
      if (a.cran === SEUIL_SPECULATIF) { choc = 0.8; texte += ' La dette quitte la catégorie « investissement » : de nombreux investisseurs institutionnels ne peuvent plus la détenir.'; }
      f.chocTaux = (f.chocTaux ?? 0) + choc;
      f.credibilite = borner((f.credibilite ?? 0) - 0.03, -1, 1);
      appliquerChocs(e, Object.fromEntries(Object.keys(e.statique.groupes).map((gr) => [gr, -1])));
      e.notation.degradationRecente = { agence: a.nom, note, tour: e.tour };
    } else if (action === 'relevement') {
      f.chocTaux = (f.chocTaux ?? 0) - 0.05;
      f.credibilite = borner((f.credibilite ?? 0) + 0.03, -1, 1);
      appliquerChocs(e, Object.fromEntries(Object.keys(e.statique.groupes).map((gr) => [gr, 1])));
    }
    const d = { agence: a.id, nom: a.nom, action, note, perspective: a.perspective, texte, tour: e.tour };
    decisions.push(d);
    e.notation.historique.push(d);
    e.journal.push({ tour: e.tour, trimestre: lib, type: action === 'degradation' ? 'alerte' : 'finances', texte: `Notation — ${texte}` });
  }
  return decisions;
}

/** Résumé pour l'interface : notes, perspectives, prochaine revue, risque. */
export function resumeNotation(e) {
  if (!e.notation) return null;
  const prochain = { annee: e.trimestre.annee, t: e.trimestre.t };
  const agences = e.notation.agences.map((a) => {
    const g = pression(e, a);
    let dans = 0;
    let tr = { ...prochain };
    while ((!(CALENDRIER[a.id] ?? [2, 4]).includes(tr.t) || e.tour + dans < (a.prochaineRevueMin ?? 1)) && dans < 8) { tr = tr.t === 4 ? { annee: tr.annee + 1, t: 1 } : { annee: tr.annee, t: tr.t + 1 }; dans += 1; }
    const mure = e.tour + dans - (a.perspectiveDepuis ?? 1) >= 3;
    const risque = (a.perspective === 'negative' && g >= 0.3 && mure) || g >= 0.8 ? 'degradation' : (a.perspective === 'positive' && g <= -0.6) || g <= -1.0 ? 'relevement' : 'stable';
    return { id: a.id, nom: a.nom, note: libelleNote(a.id, a.cran), perspective: a.perspective, date: a.date, prochaineRevue: dans === 0 ? 'ce trimestre' : `dans ${dans} trimestre${dans > 1 ? 's' : ''}`, dans, risque, variation: a.cranInitial - a.cran };
  });
  return { agences, historique: e.notation.historique };
}
