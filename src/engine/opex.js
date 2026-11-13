/**
 * Opérations extérieures (France) : des crises éclatent au fil des
 * trimestres (Liban, otages au Sahel, flanc est de l'OTAN, Émirats) ; le
 * joueur peut y engager les forces projetables.
 *
 * Une unité engagée quitte sa base ou la métropole pour la durée de
 * l'opération : elle coûte (dépense de défense, plus qu'une simple présence),
 * s'use davantage, puis rentre en métropole pour sa remise en condition.
 * L'issue (succès ou échec) est tirée à la fin de l'opération ; les chances,
 * calculées à l'engagement, dépendent des unités envoyées et de leur
 * potentiel. Tirages avec un aléa séparé : le reste du jeu n'est pas modifié.
 */
import { OPEX, ECART_MIN, RECURRENCE, REPOS_APRES_OPEX } from '../data/opex.js';
import { UNITES, POTENTIEL_MIN } from '../data/deploiements.js';
import { etatForces, horsOtan } from './deploiements.js';
import { creerAleatoire } from './aleatoire.js';
import { appliquerChocs } from './social.js';
import { borner } from '../model/outils.js';
import { libelleTrimestre } from './calendrier.js';

const actif = (e) => e.pays === 'france';
const aleaOpex = (e, sel = 0) => creerAleatoire(((e.graine ^ Math.imul(e.tour + 29, 3266489917)) + sel) >>> 0);
const minuscule = (s) => `${s.charAt(0).toLowerCase()}${s.slice(1)}`;

/** État des opérations (créé à la demande : les sauvegardes antérieures restent jouables). */
function etat(e) {
  if (!e.geopolitique) return null;
  e.geopolitique.opex ??= { encours: [], historique: [], derniere: -99, dernieres: {} };
  return e.geopolitique.opex;
}

/** Effets d'une issue ou d'un choix : influence, relations, fierté nationale, tensions. */
function appliquer(e, eff = {}) {
  const i = e.international;
  if (eff.influence && i) i.bonusInfluence += eff.influence;
  for (const [p, v] of Object.entries(eff.relations ?? {})) if (i?.relations[p] !== undefined) i.relations[p] = borner(i.relations[p] + v, -100, 100);
  if (eff.fierte && e.social?.groupes) appliquerChocs(e, Object.fromEntries(Object.keys(e.social.groupes).map((g) => [g, eff.fierte])));
  appliquerTensions(e, eff.tensions);
}

/** Variation de la tension de théâtres géopolitiques (bornée entre 0 et 100). */
export function appliquerTensions(e, tensions = {}) {
  const t = e.geopolitique?.tensions;
  if (!t) return;
  for (const [id, v] of Object.entries(tensions ?? {})) if (t[id] !== undefined) t[id] = borner(t[id] + v, 0, 100);
}

/** Une unité peut-elle partir en opération ? */
export function disponibilite(e, uniteId, op = null) {
  const f = etatForces(e);
  const u = UNITES[uniteId];
  const g = f?.[uniteId];
  if (!u || !g) return { ok: false, motif: 'unité inconnue' };
  if (op?.otan && horsOtan(e)) return { ok: false, motif: 'la France a quitté l\'OTAN' };
  if (g.operation) return { ok: false, motif: `déjà engagée (${OPEX[g.operation.id]?.court ?? 'opération'})` };
  if (g.repos > 0) return { ok: false, motif: 'en remise en condition' };
  if (g.potentiel < POTENTIEL_MIN + u.usure) return { ok: false, motif: 'potentiel insuffisant' };
  return { ok: true, motif: null };
}

/** Chances de succès : base, apport de chaque unité, potentiel moyen, groupe aéronaval sur le théâtre voisin. */
function chance(e, op, unites) {
  const f = etatForces(e);
  let p = op.chanceBase;
  for (const id of unites) p += op.apports[id] ?? 0.02;
  const moyenne = unites.reduce((s, id) => s + f[id].potentiel, 0) / unites.length;
  p += (moyenne - 80) / 250;
  if (op.theatre && [e.geopolitique?.gan, e.geopolitique?.gan2].some((g) => g?.position === op.theatre)) p += 0.08;
  return borner(p, 0.1, 0.9);
}

/**
 * Prévision (interface) : unités engageables ou non, chances, coût total.
 * @returns {object|null} { engageables, indisponibles, chance, cout, duree }
 */
export function previsionOpex(e, opId, unites = []) {
  const op = OPEX[opId];
  if (!op || !actif(e) || !e.geopolitique) return null;
  const engageables = [];
  const indisponibles = [];
  for (const id of unites) {
    const d = disponibilite(e, id, op);
    const u = UNITES[id];
    (d.ok ? engageables : indisponibles).push({ id, nom: u?.nom ?? id, court: u?.court ?? id, icone: u?.icone ?? '', motif: d.motif });
  }
  const ids = engageables.map((u) => u.id);
  const coutAnnuel = ids.reduce((s, id) => s + UNITES[id].cout * op.surcout, 0);
  return { engageables, indisponibles, chance: ids.length ? chance(e, op, ids) : 0, cout: (coutAnnuel * op.duree) / 4, duree: op.duree };
}

/**
 * Engage des forces dans une opération (choix d'une crise). Les unités
 * indisponibles restent où elles sont ; sans aucune unité, l'opération ne
 * part pas et la France perd un peu de crédit.
 * @returns {object} { engagees, indisponibles, chance }
 */
export function engagerForces(e, opId, unites = []) {
  const op = OPEX[opId];
  if (!actif(e) || !op || !e.geopolitique) return { engagees: [], indisponibles: [] };
  const x = etat(e);
  const f = etatForces(e);
  const lib = libelleTrimestre(e.trimestre);
  if (x.encours.some((o) => o.id === opId)) return { engagees: [], indisponibles: [], erreur: 'Opération déjà en cours.' };
  const prev = previsionOpex(e, opId, unites);
  const absents = prev.indisponibles.map((u) => `${u.court} (${u.motif})`).join(', ');
  if (!prev.engageables.length) {
    appliquer(e, { influence: -1 });
    e.journal.push({ tour: e.tour, trimestre: lib, type: 'alerte', texte: `Opération — ${op.nom} : aucune des forces demandées n'est disponible (${absents}). La France n'envoie que quelques conseillers ; ses partenaires le remarquent.` });
    return { engagees: [], indisponibles: prev.indisponibles, chance: 0 };
  }
  const o = { id: opId, debut: e.tour, fin: e.tour + op.duree, unites: prev.engageables.map((u) => u.id), chance: prev.chance, trimestres: 0 };
  for (const id of o.unites) {
    const g = f[id];
    g.position = opId;
    g.operation = { id: opId, fin: o.fin };
    g.trimestres = 0;
  }
  x.encours.push(o);
  e.journal.push({ tour: e.tour, trimestre: lib, type: 'politique', texte: `Opération — ${op.nom} : ${prev.engageables.map((u) => minuscule(u.nom)).join(', ')} engagé(s) pour environ ${op.duree} trimestre(s) ; chances de succès estimées à ${Math.round(o.chance * 100)} %.${absents ? ` Non disponibles : ${absents}.` : ''}` });
  return { engagees: o.unites, indisponibles: prev.indisponibles, chance: o.chance };
}

/** Fin d'une opération : issue tirée à part, effets, retour des unités en métropole. */
function conclure(e, o) {
  const op = OPEX[o.id];
  const x = etat(e);
  const f = etatForces(e);
  const succes = aleaOpex(e, 101 + Object.keys(OPEX).indexOf(o.id)).tirage(o.chance);
  const eff = succes ? op.reussite : op.echec;
  appliquer(e, eff);
  for (const id of o.unites) {
    const g = f[id];
    g.position = 'metropole';
    g.operation = null;
    g.trimestres = 0;
    g.repos = Math.max(g.repos ?? 0, REPOS_APRES_OPEX);
  }
  x.encours = x.encours.filter((y) => y !== o);
  x.historique.push({ id: o.id, debut: o.debut, fin: e.tour, unites: o.unites, chance: o.chance, succes });
  e.journal.push({ tour: e.tour, trimestre: libelleTrimestre(e.trimestre), type: succes ? 'reforme' : 'alerte', texte: `Opération — ${op.nom} : ${succes ? 'succès' : 'échec'}. ${eff.texte} Les unités rentrent en métropole.` });
  if (e.resultatsTour) (e.resultatsTour.opex ??= []).push({ id: o.id, succes, texte: eff.texte });
}

/** Trimestre : coût et usure des unités engagées, tension apaisée, fin des opérations échues. */
export function majOpex(e) {
  if (!actif(e) || !e.geopolitique) return;
  const x = etat(e);
  const f = etatForces(e);
  for (const o of [...x.encours]) {
    const op = OPEX[o.id];
    for (const id of o.unites) {
      const u = UNITES[id];
      const g = f[id];
      e.depensesTemporaires.push({ poste: 'defense', valeur: u.cout * op.surcout, fin: e.tour + 1, source: 'opex' });
      g.potentiel = Math.max(0, g.potentiel - (u.usure + op.usure));
      g.trimestres += 1;
    }
    if (op.theatre) appliquerTensions(e, { [op.theatre]: -3 });
    o.trimestres += 1;
    if (e.tour + 1 >= o.fin) conclure(e, o);
  }
}

/** Place la crise d'une opération parmi les événements du prochain trimestre. */
export function declencherOpex(e, opId) {
  const op = OPEX[opId];
  const x = actif(e) ? etat(e) : null;
  if (!op || !x) return false;
  x.derniere = e.tour;
  x.dernieres[opId] = e.tour;
  e.evenements.enAttente.push({
    id: op.crise.id, titre: op.crise.titre, description: op.crise.description(e),
    choix: op.crise.choix.map((c) => ({ id: c.id, texte: c.texte, ...(c.unites ? { unites: [...c.unites] } : {}) })),
    tour: e.tour, geopolitique: true, opex: opId,
  });
  return true;
}

/**
 * Après le tirage des événements du trimestre suivant : une crise
 * d'opération peut éclater (au plus une tous les ECART_MIN trimestres, la
 * même pas avant RECURRENCE trimestres, jamais pendant qu'elle est en cours).
 */
export function injecterOpex(e, max = 3) {
  if (!actif(e) || !e.geopolitique || e.evenements.enAttente.length >= max + 1) return;
  const x = etat(e);
  if (e.tour - x.derniere < ECART_MIN) return;
  const alea = aleaOpex(e, 1);
  for (const [id, op] of Object.entries(OPEX)) {
    if ((x.dernieres[id] ?? -99) > e.tour - RECURRENCE || x.encours.some((o) => o.id === id)) continue;
    if (alea.tirage(op.probabilite(e))) { declencherOpex(e, id); return; }
  }
}

/** Résumé pour l'interface : opérations en cours et passées. */
export function resumeOpex(e) {
  if (!actif(e)) return null;
  const x = e.geopolitique?.opex ?? { encours: [], historique: [] };
  const fiche = (id) => { const op = OPEX[id]; return { nom: op.nom, court: op.court, lon: op.lon, lat: op.lat, terrain: op.terrain, interception: !!op.interception, sources: op.sources }; };
  return {
    encours: x.encours.map((o) => ({ ...o, ...fiche(o.id), restants: Math.max(1, o.fin - e.tour), unites: o.unites.map((id) => ({ id, ...UNITES[id] })) })),
    historique: x.historique.slice(-6).reverse().map((h) => ({ ...h, ...fiche(h.id) })),
  };
}
