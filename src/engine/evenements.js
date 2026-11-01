/**
 * Moteur des événements : tirage en fin de trimestre, présentation au
 * joueur au trimestre suivant, application du choix retenu.
 */
import { EVENEMENTS } from '../data/evenements.js';
import { appliquerChocs } from './social.js';
import { trouverReforme } from './reformes.js';
import { borner } from '../model/outils.js';
import { libelleTrimestre } from './calendrier.js';

/** Tire les événements du prochain trimestre (au plus deux, plus un mouvement social éventuel). */
export function genererEvenements(e, alea, frequence = 1) {
  const deja = new Set(e.evenements.historique.map((h) => h.id));
  const candidats = EVENEMENTS.filter((ev) => (ev.pays === 'tous' || ev.pays.includes(e.pays)) && !(ev.unique && deja.has(ev.id)));
  const tires = [];
  for (const ev of candidats) {
    let ok = false;
    try { ok = ev.condition(e); } catch { ok = false; }
    if (!ok) continue;
    const p = Math.min(1, ev.probabilite(e) * (ev.probabilite(e) >= 1 ? 1 : frequence));
    if (alea.tirage(p)) tires.push(ev);
  }
  // Les événements certains passent en premier, puis deux au plus
  tires.sort((a, b) => b.probabilite(e) - a.probabilite(e));
  e.evenements.enAttente = tires.slice(0, 3).map((ev) => ({
    id: ev.id,
    titre: ev.titre,
    description: ev.description(e),
    choix: ev.choix.map((c) => ({ id: c.id, texte: c.texte })),
    tour: e.tour,
  }));
}

/** Applique les effets d'un choix. */
function appliquerEffets(e, eff, alea) {
  const r = { depensesExceptionnelles: 0, chocPIB: 0 };
  if (eff.depensesExceptionnelles) r.depensesExceptionnelles += eff.depensesExceptionnelles;
  for (const d of eff.depensesTemporaires ?? []) e.depensesTemporaires.push({ ...d, fin: e.tour + d.duree });
  appliquerChocs(e, eff.chocs);
  if (eff.opinion) e.reformes.actives.push({ id: 'evenement', nom: 'Événement', diplomatique: true, opinion: { ...eff.opinion }, grief: {}, appliquee: true, tourAdoption: e.tour });
  for (const [p, v] of Object.entries(eff.relations ?? {})) e.international.relations[p] = borner((e.international.relations[p] ?? 0) + v, -100, 100);
  if (eff.influence) e.international.bonusInfluence += eff.influence;
  if (eff.instabilite) e.politique.chocInstabilite = (e.politique.chocInstabilite ?? 0) + eff.instabilite;
  if (eff.credibilite) e.finances.credibilite = borner(e.finances.credibilite + eff.credibilite, -1, 1);
  if (eff.chocPIB) r.chocPIB += eff.chocPIB;
  if (eff.chocTaux) e.finances.chocTaux = (e.finances.chocTaux ?? 0) + eff.chocTaux;
  if (eff.energie) e.monde.energie *= eff.energie;
  if (eff.coalition && e.politique.coalition) e.politique.coalition.choc = (e.politique.coalition.choc ?? 0) + eff.coalition;
  if (eff.chocAfD) e.politique.chocAfD = (e.politique.chocAfD ?? 0) + eff.chocAfD;
  if (eff.reduireGrief) {
    for (const ref of e.reformes.actives) if (ref.grief?.[eff.reduireGrief.groupe]) ref.grief[eff.reduireGrief.groupe] *= 1 - eff.reduireGrief.part;
  }
  if (eff.retirerReforme) {
    // Retire la réforme qui crée le plus de grief dans le groupe mobilisé
    const groupe = e.social.mobilisation?.groupe;
    const cible = e.reformes.actives.filter((x) => !x.diplomatique)
      .sort((a, b) => (b.grief?.[groupe] ?? 0) - (a.grief?.[groupe] ?? 0))[0];
    if (cible) {
      const def = trouverReforme(cible.id);
      if (cible.appliquee && def?.annuler) def.annuler(e, cible.option);
      e.reformes.actives = e.reformes.actives.filter((x) => x !== cible);
      e.journal.push({ tour: e.tour, trimestre: libelleTrimestre(e.trimestre), type: 'reforme', texte: `Réforme retirée : ${cible.nom}.` });
    }
    if (e.social.mobilisation) e.social.mobilisation.trimestres = 0;
  }
  return r;
}

/**
 * Résout les événements en attente avec les choix du joueur (premier choix par défaut).
 * @returns {object} effets immédiats agrégés { depensesExceptionnelles, chocPIB }
 */
export function resoudreEvenements(e, choix = {}, alea) {
  const total = { depensesExceptionnelles: 0, chocPIB: 0 };
  for (const ev of e.evenements.enAttente) {
    const def = EVENEMENTS.find((x) => x.id === ev.id);
    if (!def) continue;
    const c = def.choix.find((x) => x.id === choix[ev.id]) ?? def.choix[0];
    const eff = c.effets(e, alea) ?? {};
    const r = appliquerEffets(e, eff, alea);
    total.depensesExceptionnelles += r.depensesExceptionnelles;
    total.chocPIB += r.chocPIB;
    e.evenements.historique.push({ id: ev.id, titre: ev.titre, choix: c.id, texteChoix: c.texte, tour: e.tour });
    e.journal.push({ tour: e.tour, trimestre: libelleTrimestre(e.trimestre), type: 'evenement', texte: `${ev.titre} — ${c.texte}. ${eff.texte ?? ''}`.trim() });
  }
  e.evenements.enAttente = [];
  return total;
}

/** Dépenses temporaires actives (Md€/an par poste), nettoyage des échues. */
export function depensesTemporairesActives(e) {
  e.depensesTemporaires = e.depensesTemporaires.filter((d) => e.tour < d.fin);
  const parPoste = {};
  for (const d of e.depensesTemporaires) parPoste[d.poste] = (parPoste[d.poste] ?? 0) + d.valeur * (e.macro.niveauPrix / 100);
  return parPoste;
}
