/**
 * Menace terroriste (France) : niveau de menace (sur 100), posture
 * Vigipirate, effectifs de l'opération Sentinelle, état d'urgence, effort de
 * renseignement ; alertes, attentats déjoués et attentats, tirés avec un aléa
 * séparé (le reste de la partie n'est pas modifié) ; opérations
 * antiterroristes que le président lance où il veut dans le monde.
 *
 * Le niveau de menace tend vers une cible qui dépend des tensions
 * géopolitiques, des opérations en cours (risque de représailles) et du
 * renseignement ; il baisse après une opération réussie. Le risque d'attentat
 * croît fortement au-dessus de 50 et diminue avec la protection (Vigipirate,
 * Sentinelle, état d'urgence). Hypothèses de jeu, ordres de grandeur.
 */
import { VIGIPIRATE, SENTINELLE, VILLES, MENACE_INITIALE, ECART_ALERTES } from '../data/terrorisme.js';
import { OPEX } from '../data/opex.js';
import { creerAleatoire } from './aleatoire.js';
import { engagerForces, previsionOpex } from './opex.js';
import { borner } from '../model/outils.js';
import { libelleTrimestre } from './calendrier.js';

const actif = (e) => e.pays === 'france' && !!e.geopolitique;
const aleaMenace = (e, sel = 0) => creerAleatoire(((e.graine ^ Math.imul(e.tour + 71, 2654435761)) + 0x5bd1e995 + sel) >>> 0);
/** Opérations antiterroristes du catalogue des opérations. */
export const ANTITERRORISTES = Object.keys(OPEX).filter((id) => OPEX[id].antiterrorisme);

/** État de la sécurité intérieure (créé à la demande : les sauvegardes antérieures restent jouables). */
export function etatSecurite(e) {
  if (!actif(e)) return null;
  e.securiteInterieure ??= {
    menace: MENACE_INITIALE, vigipirate: 'urgence_attentat', sentinelle: 3000, renfortJusqua: null, etatUrgence: 0,
    renseignement: 0, derniereAlerte: -99, attentats: [], dejoues: 0, contexte: null,
  };
  return e.securiteInterieure;
}

/** Protection contre un passage à l'acte (0 à 0,6). */
function protection(e, s) {
  const reforme = (e.reformes?.actives ?? []).some((a) => a.id === 'cyber_renseignement' && a.appliquee);
  return Math.min(0.6, VIGIPIRATE[s.vigipirate].protection + SENTINELLE[s.sentinelle].protection + (s.etatUrgence > 0 ? 0.08 : 0) + 0.05 * Math.min(3, s.renseignement) + (reforme ? 0.05 : 0));
}

/** Probabilité d'un attentat au prochain trimestre. */
function risqueAttentat(e, s) {
  const exces = Math.max(0, (s.menace - 50) / 50);
  return 0.003 + 0.08 * exces * exces * (1 - protection(e, s));
}

/** Libellé du niveau de menace. */
export function niveauMenace(m) {
  return m >= 80 ? 'critique' : m >= 65 ? 'très élevée' : m >= 45 ? 'élevée' : m >= 25 ? 'modérée' : 'faible';
}

/** Applique les effets d'un choix qui touchent à la sécurité intérieure (appelé par le moteur des événements). */
export function appliquerEffetsSecurite(e, eff) {
  const s = etatSecurite(e);
  if (!s) return;
  if (eff.menace) s.menace = borner(s.menace + eff.menace, 5, 95);
  if (eff.renseignement) s.renseignement += eff.renseignement;
  if (eff.securite?.sentinelle) {
    s.sentinelle = eff.securite.sentinelle;
    s.renfortJusqua = eff.securite.duree ? e.tour + eff.securite.duree : null;
  }
  if (eff.securite?.etatUrgence) s.etatUrgence = Math.max(s.etatUrgence, eff.securite.etatUrgence);
}

/** Trimestre : évolution de la menace, coût des renforts, fin des renforts et de l'état d'urgence. */
export function majTerrorisme(e) {
  const s = etatSecurite(e);
  if (!s) return;
  const t = Object.values(e.geopolitique.tensions ?? {});
  const tensions = t.length ? t.reduce((a, b) => a + b, 0) / t.length : 46;
  const ops = (e.geopolitique.opex?.encours ?? []).filter((o) => OPEX[o.id]?.antiterrorisme).length;
  const reforme = (e.reformes?.actives ?? []).some((a) => a.id === 'cyber_renseignement' && a.appliquee);
  const cible = 55 + 0.3 * (tensions - 46) + 3 * ops - 4 * Math.min(3, s.renseignement) - (reforme ? 5 : 0);
  s.menace = borner(s.menace + 0.12 * (cible - s.menace), 5, 95);
  s.renseignement *= 0.85;
  if (s.renfortJusqua !== null && e.tour >= s.renfortJusqua) { s.sentinelle = 3000; s.renfortJusqua = null; }
  // Coûts (Md€ par an) : renfort de Sentinelle, état d'urgence ; économie si Vigipirate est abaissé
  const cout = SENTINELLE[s.sentinelle].cout + (s.etatUrgence > 0 ? 0.05 : 0) - (s.vigipirate === 'securite_renforcee' ? 0.05 : 0);
  if (Math.abs(cout) > 1e-9) e.depensesTemporaires.push({ poste: 'defense', valeur: cout, fin: e.tour + 1, source: 'securite_interieure' });
  if (s.etatUrgence > 0) s.etatUrgence -= 1;
}

/**
 * Décisions du Gouvernement : posture Vigipirate et effectifs de Sentinelle.
 * @param {object} d { vigipirate?: 'securite_renforcee'|'urgence_attentat', sentinelle?: 3000|7000|10000 }
 */
export function deciderSecurite(e, d = {}) {
  const s = etatSecurite(e);
  if (!s) return { erreur: 'Sans objet pour ce pays.' };
  const lib = libelleTrimestre(e.trimestre);
  const textes = [];
  if (d.vigipirate && VIGIPIRATE[d.vigipirate] && d.vigipirate !== s.vigipirate) {
    s.vigipirate = d.vigipirate;
    textes.push(`posture Vigipirate « ${VIGIPIRATE[d.vigipirate].nom} »`);
  }
  if (d.sentinelle && SENTINELLE[d.sentinelle] && Number(d.sentinelle) !== s.sentinelle) {
    s.sentinelle = Number(d.sentinelle);
    s.renfortJusqua = null;
    textes.push(`opération Sentinelle à ${SENTINELLE[d.sentinelle].nom}`);
  }
  if (textes.length) e.journal.push({ tour: e.tour, trimestre: lib, type: 'politique', texte: `Sécurité intérieure : ${textes.join(' ; ')}.` });
  return { textes };
}

/**
 * Le président lance une opération antiterroriste, où il veut dans le monde.
 * Les représailles possibles font d'abord monter un peu la menace.
 * @param {object} d { operation, unites }
 */
export function lancerOperationAntiterroriste(e, d = {}) {
  const s = etatSecurite(e);
  const op = OPEX[d.operation];
  if (!s || !op?.antiterrorisme) return { erreur: 'Opération inconnue.' };
  const r = engagerForces(e, d.operation, d.unites ?? []);
  if (r.engagees?.length) s.menace = borner(s.menace + 2, 5, 95);
  return r;
}

/** Contexte d'une alerte ou d'un attentat : filière d'origine (opération pour la frapper), ville. */
function tirerContexte(e, alea, attentat) {
  const origines = ['levant_daech', 'levant_daech', 'sahel_raid', 'libye', 'corne_afrique'];
  const origine = origines[Math.floor(alea.uniforme() * origines.length)];
  const ville = VILLES[Math.floor(alea.uniforme() * VILLES.length)];
  return { origine, ville, gravite: attentat ? (alea.uniforme() < 0.25 ? 2 : 1) : 0, tour: e.tour };
}

const NOMS_ORIGINE = { levant_daech: 'en Syrie', sahel_raid: 'au Sahel', libye: 'dans le sud de la Libye', corne_afrique: 'en Somalie' };

/**
 * Après les autres événements du trimestre : une alerte, un attentat déjoué
 * ou (rarement) un attentat. Aléa séparé ; au plus un par trimestre.
 */
export function injecterMenaces(e, max = 3) {
  const s = etatSecurite(e);
  if (!s || e.evenements.enAttente.length >= max + 1) return;
  const alea = aleaMenace(e);
  const p = risqueAttentat(e, s);
  const pousser = (id, titre, contexte) => {
    s.contexte = contexte;
    const def = EVENEMENTS_MENACE.find((x) => x.id === id);
    e.evenements.enAttente.push({ id, titre, description: def.description(e), choix: def.choix.map((c) => ({ id: c.id, texte: c.texte })), tour: e.tour, menace: true });
  };
  if (alea.tirage(p)) {
    const c = tirerContexte(e, alea, true);
    pousser('attentat', `Attentat terroriste à ${c.ville}`, c);
    return;
  }
  if (e.tour - s.derniereAlerte >= ECART_ALERTES && alea.tirage(0.04 + s.menace / 1200)) {
    s.derniereAlerte = e.tour;
    pousser('menace_alerte', 'Alerte : une filière djihadiste prépare un attentat en France', tirerContexte(e, alea, false));
    return;
  }
  if (alea.tirage(0.03 + 0.03 * Math.min(3, s.renseignement) + s.menace / 2000)) {
    s.dejoues += 1;
    pousser('attentat_dejoue', 'Les services déjouent un projet d\'attentat', tirerContexte(e, alea, false));
  }
}

const contexte = (e) => e.securiteInterieure?.contexte ?? { origine: 'levant_daech', ville: 'Paris', gravite: 1 };
const unitesParDefaut = (id) => OPEX[id]?.crise.choix[0].unites ?? ['forces_speciales'];
/** Attentat : choc d'activité (tourisme, consommation) et, après plusieurs attentats rapprochés, colère contre l'exécutif. */
function effetsAttentat(e) {
  const c = contexte(e);
  const recents = (e.securiteInterieure?.attentats ?? []).filter((a) => e.tour - a.tour <= 8).length;
  const colere = recents >= 1 ? -2 * recents : 0;
  return {
    chocPIB: -0.06 * c.gravite,
    chocs: Object.fromEntries(['jeunes', 'salaries', 'fonctionnaires', 'entrepreneurs', 'agriculteurs', 'retraites'].map((g) => [g, colere])),
    attentat: { ville: c.ville, gravite: c.gravite },
  };
}

/**
 * Événements de la menace, pour le catalogue : jamais tirés par le moteur des
 * événements (ils sont injectés ci-dessus). Le premier choix, appliqué si le
 * joueur ne répond pas, ne touche qu'au niveau de menace (sauf pour un attentat).
 */
export const EVENEMENTS_MENACE = [
  {
    id: 'menace_alerte', titre: 'Alerte : une filière djihadiste prépare un attentat en France', pays: ['france'], condition: () => false, probabilite: () => 0, menace: true,
    description: (e) => {
      const s = etatSecurite(e);
      const c = contexte(e);
      return `La DGSI signale qu'une filière de l'État islamique basée ${NOMS_ORIGINE[c.origine] ?? 'à l\'étranger'} prépare un attentat en France et cherche des complices sur le territoire. Niveau de menace : ${Math.round(s?.menace ?? 60)}/100 (${niveauMenace(s?.menace ?? 60)}) ; posture Vigipirate « ${VIGIPIRATE[s?.vigipirate ?? 'urgence_attentat'].nom} » ; ${s?.sentinelle ?? 3000} militaires de l'opération Sentinelle dans les rues.`;
    },
    choix: [
      { id: 'renseignement', texte: 'Mobiliser la DGSI et les services pour entraver la filière, sans annonce publique', effets: () => ({ menace: -8, renseignement: 1, texte: 'Les services surveillent les contacts de la filière en France ; plusieurs suspects sont placés sous surveillance.' }) },
      { id: 'frappe', texte: 'Frapper la filière à sa source : lancer une opération antiterroriste', effets: (e) => { const c = contexte(e); return { envoiForces: { operation: c.origine, unites: unitesParDefaut(c.origine) }, menace: 2, texte: `Opération antiterroriste lancée (${OPEX[c.origine].court}).` }; } },
      { id: 'sentinelle', texte: 'Porter l\'opération Sentinelle à 10 000 militaires pendant six mois', effets: () => ({ securite: { sentinelle: 10000, duree: 2 }, menace: -4, texte: 'Les militaires de Sentinelle sont plus nombreux devant les gares, les lieux de culte et les écoles.' }) },
      { id: 'statu_quo', texte: 'Ne rien changer au dispositif', effets: () => ({ menace: 6, texte: 'Le dispositif reste inchangé ; la filière poursuit ses préparatifs.' }) },
    ],
  },
  {
    id: 'attentat_dejoue', titre: 'Les services déjouent un projet d\'attentat', pays: ['france'], condition: () => false, probabilite: () => 0, menace: true,
    description: (e) => `Les policiers de la DGSI ont interpellé à ${contexte(e).ville} plusieurs personnes qui préparaient un attentat, en lien avec une filière basée ${NOMS_ORIGINE[contexte(e).origine] ?? 'à l\'étranger'}. Les gardes à vue sont en cours.`,
    choix: [
      { id: 'discretion', texte: 'Rester discret pour protéger les sources et l\'enquête', effets: () => ({ menace: -3, texte: 'L\'enquête remonte la filière ; d\'autres interpellations suivent.' }) },
      { id: 'communiquer', texte: 'Le faire savoir : conférence de presse du ministre de l\'Intérieur', effets: () => ({ fierte: 0.5, texte: 'Le ministre salue l\'efficacité des services ; l\'opinion est rassurée.' }) },
    ],
  },
  {
    id: 'attentat', titre: 'Attentat terroriste', pays: ['france'], condition: () => false, probabilite: () => 0, menace: true,
    description: (e) => {
      const c = contexte(e);
      const n = (e.securiteInterieure?.attentats ?? []).filter((a) => e.tour - a.tour <= 8).length;
      return `Un attentat ${c.gravite > 1 ? 'de grande ampleur ' : ''}a frappé ${c.ville} et fait des victimes ; il est revendiqué par l'État islamique, dont une filière ${NOMS_ORIGINE[c.origine] ?? 'à l\'étranger'} a armé l'assaillant. Le pays est sous le choc.${n ? ` C'est le ${n + 1}e attentat en deux ans : la colère monte contre l'exécutif.` : ''} Les commerces, les spectacles et le tourisme vont souffrir quelques mois.`;
    },
    choix: [
      { id: 'unite_nationale', texte: 'Hommage national et unité : Sentinelle portée à 7 000 militaires pour un an', effets: (e) => ({ ...effetsAttentat(e), fierte: 1.5, securite: { sentinelle: 7000, duree: 4 }, menace: -2, texte: 'Le pays se rassemble autour des victimes ; les militaires sont plus nombreux dans les lieux publics.' }) },
      { id: 'etat_urgence', texte: 'Décréter l\'état d\'urgence pour trois mois (perquisitions, assignations à résidence)', effets: (e) => { const b = effetsAttentat(e); return { ...b, chocs: { ...b.chocs, jeunes: (b.chocs.jeunes ?? 0) - 2, retraites: (b.chocs.retraites ?? 0) + 2 }, securite: { etatUrgence: 1 }, menace: -10, instabilite: 0.02, texte: 'Des centaines de perquisitions administratives ont lieu ; les défenseurs des libertés s\'inquiètent.' }; } },
      { id: 'riposte', texte: 'Riposter : frapper la filière à l\'étranger', effets: (e) => { const c = contexte(e); return { ...effetsAttentat(e), fierte: 1, envoiForces: { operation: c.origine, unites: unitesParDefaut(c.origine) }, texte: `Le président annonce des frappes contre ceux qui ont commandité l'attentat (${OPEX[c.origine].court}).` }; } },
      { id: 'loi', texte: 'Loi antiterroriste : 0,5 Md€ par an pendant deux ans pour le renseignement et la police', effets: (e) => ({ ...effetsAttentat(e), depensesTemporaires: [{ poste: 'interieurJustice', valeur: 0.5, duree: 8 }], renseignement: 2, menace: -6, texte: 'Le Parlement vote des moyens supplémentaires pour la DGSI et la police.' }) },
    ],
  },
];

/** Enregistre un attentat (appelé à la résolution de l'événement). */
export function enregistrerAttentat(e, a) {
  const s = etatSecurite(e);
  if (s) s.attentats.push({ tour: e.tour, trimestre: libelleTrimestre(e.trimestre), ville: a.ville, gravite: a.gravite });
}

/** Résumé pour l'interface : menace, protection, risque annuel, opérations antiterroristes disponibles. */
export function resumeTerrorisme(e) {
  const s = actif(e) ? (e.securiteInterieure ?? null) : null;
  if (!actif(e)) return null;
  const x = s ?? { menace: MENACE_INITIALE, vigipirate: 'urgence_attentat', sentinelle: 3000, renseignement: 0, etatUrgence: 0, attentats: [], dejoues: 0 };
  const p = risqueAttentat(e, x);
  return {
    menace: x.menace, niveau: niveauMenace(x.menace), vigipirate: x.vigipirate, vigipirateNom: VIGIPIRATE[x.vigipirate].nom,
    sentinelle: x.sentinelle, renfortJusqua: x.renfortJusqua ?? null, etatUrgence: x.etatUrgence, renseignement: x.renseignement,
    protection: protection(e, x), risqueAnnuel: 1 - (1 - p) ** 4, attentats: [...x.attentats].reverse(), dejoues: x.dejoues,
    postures: Object.entries(VIGIPIRATE).map(([id, v]) => ({ id, ...v })), effectifs: Object.entries(SENTINELLE).map(([id, v]) => ({ id: Number(id), ...v })),
    operations: ANTITERRORISTES.map((id) => {
      const op = OPEX[id];
      const unites = op.crise.choix[0].unites;
      const prev = previsionOpex(e, id, Object.keys(op.apports));
      const enCours = (e.geopolitique.opex?.encours ?? []).some((o) => o.id === id);
      return { id, nom: op.nom, court: op.court, description: op.description, duree: op.duree, apports: op.apports, unitesConseillees: unites, enCours, engageables: prev?.engageables ?? [], indisponibles: prev?.indisponibles ?? [], lon: op.lon, lat: op.lat, reussiteMenace: op.reussite.menace };
    }),
  };
}
