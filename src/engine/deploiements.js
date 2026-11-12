/**
 * Déploiements (France) : forces terrestres et aériennes projetables, à
 * envoyer sur des bases françaises ou alliées comme le groupe aéronaval.
 *
 * Une unité déployée coûte (dépense de défense), s'use et doit rentrer en
 * métropole pour récupérer ; sa présence apaise la tension du théâtre voisin,
 * renforce l'influence et les relations avec le pays hôte. Une base alliée
 * n'accueille que si la relation avec le pays hôte reste suffisante, et les
 * missions de l'OTAN supposent que la France n'a pas quitté l'Alliance.
 * Aucun tirage aléatoire : le reste du jeu n'est pas modifié.
 */
import { UNITES, BASES, POTENTIEL_MIN, RECUPERATION } from '../data/deploiements.js';
import { borner } from '../model/outils.js';
import { libelleTrimestre } from './calendrier.js';

const actif = (e) => e.pays === 'france';
const nouvelleUnite = () => ({ position: 'metropole', potentiel: 100, trimestres: 0, repos: 0 });

/** États des unités (créés à la demande : les sauvegardes antérieures restent jouables). */
function forces(e) {
  if (!e.geopolitique) return null;
  e.geopolitique.forces ??= {};
  for (const id of Object.keys(UNITES)) e.geopolitique.forces[id] ??= nouvelleUnite();
  return e.geopolitique.forces;
}

/** La France a-t-elle quitté l'Alliance atlantique (réforme « La France dans l'OTAN ») ? */
export function horsOtan(e) {
  return (e.reformes?.actives ?? []).some((a) => a.id === 'otan' && a.option === 'alliance' && a.appliquee);
}

/**
 * Accès à une base pour un type d'unité.
 * @returns {object} { ok, motif }
 */
export function accesBase(e, baseId, type = null) {
  const b = BASES[baseId];
  if (!b) return { ok: false, motif: 'Base inconnue.' };
  if (type && !b.types.includes(type)) return { ok: false, motif: type === 'air' ? 'Cette base n\'accueille pas d\'avions de combat français.' : 'Cette base n\'accueille pas de troupes françaises.' };
  if (b.otan && horsOtan(e)) return { ok: false, motif: 'Mission de l\'OTAN : la France a quitté l\'Alliance atlantique.' };
  if (b.partenaire) {
    const r = e.international?.relations?.[b.partenaire];
    if (r !== undefined && r < b.seuil) return { ok: false, motif: `Le pays hôte refuse : relations trop dégradées (${Math.round(r)}, il faut au moins ${b.seuil}).` };
  }
  return { ok: true, motif: null };
}

/**
 * Ordonne le déploiement d'une unité vers une base (ou son retour en métropole).
 * @returns {object} { texte } ou { erreur }
 */
export function deployerUnite(e, uniteId, baseId) {
  if (!actif(e)) return { erreur: 'Disponible pour la France.' };
  const f = forces(e);
  const u = UNITES[uniteId];
  if (!f || !u) return { erreur: 'Unité inconnue.' };
  const g = f[uniteId];
  const b = BASES[baseId];
  if (!b) return { erreur: 'Base inconnue.' };
  if (g.position === baseId) return { erreur: 'L\'unité y est déjà.' };
  if (!b.metropole) {
    const a = accesBase(e, baseId, u.type);
    if (!a.ok) return { erreur: a.motif };
    if (g.repos > 0) return { erreur: `Remise en condition en métropole : encore ${g.repos} trimestre(s).` };
    if (g.potentiel < POTENTIEL_MIN + u.usure) return { erreur: 'Potentiel insuffisant : l\'unité doit d\'abord récupérer en métropole.' };
  }
  const depart = BASES[g.position]?.court ?? g.position;
  g.position = baseId;
  if (b.metropole) g.trimestres = 0;
  const texte = b.metropole ? `${u.nom} : retour en métropole (depuis : ${depart}).` : `${u.nom} : déploiement vers ${b.court}.`;
  e.journal.push({ tour: e.tour, trimestre: libelleTrimestre(e.trimestre), type: 'politique', texte: `Déploiements — ${texte}` });
  return { texte };
}

/** Trimestre : présence (effets, coût, usure), récupération en métropole, retours forcés. */
export function majDeploiements(e) {
  if (!actif(e)) return;
  const f = forces(e);
  if (!f) return;
  const i = e.international;
  const lib = libelleTrimestre(e.trimestre);
  for (const [id, g] of Object.entries(f)) {
    const u = UNITES[id];
    if (!u) continue;
    const b = BASES[g.position];
    if (!b || b.metropole) {
      g.position = 'metropole';
      if (g.repos > 0) g.repos -= 1;
      g.potentiel = Math.min(100, g.potentiel + RECUPERATION);
      continue;
    }
    // Le pays hôte ne veut plus de nous, ou la France a quitté l'OTAN : retour forcé
    const acces = accesBase(e, g.position, u.type);
    if (!acces.ok) {
      e.journal.push({ tour: e.tour, trimestre: lib, type: 'alerte', texte: `Déploiements — ${u.nom} quitte ${b.court} : ${acces.motif.charAt(0).toLowerCase()}${acces.motif.slice(1)}` });
      g.position = 'metropole';
      g.trimestres = 0;
      continue;
    }
    // Présence : influence, relations avec l'hôte, tension apaisée, coût, usure
    if (i) {
      i.bonusInfluence += (b.presence?.influence ?? 0) * u.poids;
      for (const [p, v] of Object.entries(b.presence?.relations ?? {})) if (i.relations[p] !== undefined) i.relations[p] = borner(i.relations[p] + v * u.poids, -100, 100);
    }
    if (b.theatre && e.geopolitique.tensions?.[b.theatre] !== undefined) e.geopolitique.tensions[b.theatre] = Math.max(0, e.geopolitique.tensions[b.theatre] - 4 * u.poids);
    e.depensesTemporaires.push({ poste: 'defense', valeur: u.cout * (b.distance ?? 1) * (e.macro.niveauPrix / 100), fin: e.tour + 1, source: 'deploiement' });
    g.potentiel = Math.max(0, g.potentiel - u.usure);
    g.trimestres += 1;
    if (g.potentiel < POTENTIEL_MIN) {
      e.journal.push({ tour: e.tour, trimestre: lib, type: 'alerte', texte: `Déploiements — Après ${g.trimestres} trimestre(s) à ${b.court}, ${u.nom.charAt(0).toLowerCase()}${u.nom.slice(1)} rentre en métropole pour sa remise en condition.` });
      g.position = 'metropole';
      g.trimestres = 0;
      g.repos = 1;
    }
  }
}

/** Résumé pour l'interface : unités, bases et accès. */
export function resumeDeploiements(e) {
  if (!actif(e)) return null;
  const f = e.geopolitique ? forces(e) : Object.fromEntries(Object.keys(UNITES).map((id) => [id, nouvelleUnite()]));
  const unites = Object.entries(UNITES).map(([id, u]) => ({ id, ...u, ...f[id] }));
  const bases = Object.entries(BASES).map(([id, b]) => ({
    id, ...b,
    acces: { terre: accesBase(e, id, 'terre'), air: accesBase(e, id, 'air') },
    presents: unites.filter((u) => u.position === id).map((u) => u.id),
  }));
  const deployees = unites.filter((u) => u.position !== 'metropole');
  const coutAnnuel = deployees.reduce((s, u) => s + u.cout * (BASES[u.position]?.distance ?? 1), 0);
  return { unites, bases, coutAnnuel, horsOtan: horsOtan(e), potentielMin: POTENTIEL_MIN };
}
