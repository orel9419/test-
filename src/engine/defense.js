/**
 * Défense et régalien : programmes d'armement (rythme, commandes, jalons),
 * capacités (Rafale, SNLE 3G...), opérations, exportations d'armement et
 * dimension européenne de la dissuasion (France).
 *
 * Les coûts passent par les dépenses du poste « défense » (dépenses
 * temporaires) : ils pèsent donc sur le déficit comme le reste du budget.
 */
import { PROGRAMMES_DEFENSE, OPERATIONS, EXPORTS, DISSUASION_EUROPE } from '../data/defense.js';
import { appliquerEffetsEntreprise } from './entreprises.js';
import { borner } from '../model/outils.js';
import { libelleTrimestre } from './calendrier.js';

const rang = (x) => x.annee * 4 + x.t;

export function programmesDuPays(pays) { return PROGRAMMES_DEFENSE[pays] ?? []; }
export function operationsDuPays(pays) { return OPERATIONS[pays] ?? []; }
export function exportsDuPays(pays) { return EXPORTS[pays] ?? []; }

export function initialiserDefense(e) {
  const programmes = {};
  const capacites = {};
  for (const p of programmesDuPays(e.pays)) {
    programmes[p.id] = { option: 'nominal', debut: 1, fin: 1, retard: 0, securise: false };
    if (p.capacite) capacites[p.capacite.cle] = p.capacite.depart;
  }
  e.defense = {
    programmes,
    capacites,
    supplements: {},
    operations: Object.fromEntries(operationsDuPays(e.pays).map((o) => [o.id, o.defaut])),
    exports: Object.fromEntries(exportsDuPays(e.pays).map((x) => [x.id, { statut: 'ouvert', derniereTentative: null }])),
    dissuasion: e.pays === 'france' ? 'statu_quo' : null,
    jalons: [],
  };
}

/** Effets génériques (souveraineté, influence, relations, opinion, entreprises, instabilité). */
function appliquer(e, eff = {}, source = 'defense', signe = 1) {
  const i = e.international;
  if (eff.souverainete) appliquerEffetsEntreprise(e, { souverainete: signe * eff.souverainete });
  if (eff.influence) i.bonusInfluence += signe * eff.influence;
  for (const [p, v] of Object.entries(eff.relations ?? {})) if (i.relations[p] !== undefined) i.relations[p] = borner(i.relations[p] + signe * v, -100, 100);
  for (const [id, v] of Object.entries(eff.fleurons ?? {})) appliquerEffetsEntreprise(e, { entreprise: { id, valeur: signe * v, relation: signe * Math.sign(v) * 4 } });
  if (eff.opinion && signe > 0) e.reformes.actives.push({ id: `defense:${source}`, nom: source, diplomatique: true, opinion: { ...eff.opinion }, grief: {}, appliquee: true, tourAdoption: e.tour });
  if (eff.instabilite && signe > 0) e.politique.chocInstabilite = (e.politique.chocInstabilite ?? 0) + eff.instabilite;
}

/** Jalons d'un programme avec leur date effective (retards et avances compris). */
export function jalonsEffectifs(e, p) {
  const etat = e.defense?.programmes[p.id];
  return (p.jalons ?? []).map((j) => {
    const decalage = (etat?.retard ?? 0) - (etat?.avance?.[j.id] ?? 0);
    const r = rang(j) + decalage;
    return { ...j, annee: Math.floor((r - 1) / 4), t: ((r - 1) % 4) + 1, decalage, atteint: (e.defense?.jalons ?? []).includes(j.id) };
  });
}

/** Le président seul décide des opérations et de la dissuasion en France (le Premier ministre propose). */
export function domaineReserve(e) {
  return e.pays === 'france' && e.role !== 'president';
}

/**
 * Applique les décisions de défense du trimestre.
 * @param {object} d { programmes: {id: option}, operations: {id: option}, exports: [id], dissuasion }
 * @returns {Array} textes de résultat
 */
export function deciderDefense(e, d = {}, alea) {
  if (!e.defense) initialiserDefense(e);
  const x = e.defense;
  const lib = libelleTrimestre(e.trimestre);
  const res = [];
  // Programmes
  for (const [id, optionId] of Object.entries(d.programmes ?? {})) {
    const p = programmesDuPays(e.pays).find((y) => y.id === id);
    const o = p?.options.find((y) => y.id === optionId);
    const etat = x.programmes[id];
    if (!p || !o || !etat || optionId === 'nominal' || etat.option === optionId) continue;
    if (etat.option !== 'nominal' && e.tour < etat.fin) { res.push({ type: 'erreur', texte: `${p.nom} : une décision est déjà en cours d'exécution.` }); continue; }
    etat.option = optionId; etat.debut = e.tour; etat.fin = e.tour + (o.duree ?? 0) + (o.puis?.duree ?? 0);
    if (o.cout) e.depensesTemporaires.push({ poste: 'defense', valeur: o.cout, fin: e.tour + o.duree, source: `programme:${id}` });
    if (o.puis) e.depensesTemporaires.push({ poste: 'defense', valeur: o.puis.cout, fin: e.tour + o.duree + o.puis.duree, debut: e.tour + o.duree, source: `programme:${id}` });
    if (o.retard) etat.retard += o.retard.trimestres;
    if (o.avance) etat.avance = { ...(etat.avance ?? {}), [o.avance.jalon]: (etat.avance?.[o.avance.jalon] ?? 0) + o.avance.trimestres };
    if (o.securise) etat.securise = true;
    if (o.supplement && p.capacite) x.supplements[p.capacite.cle] = { restant: o.supplement, debut: e.tour + 8, rythme: o.supplement / 16 };
    appliquer(e, o.effets, p.nom);
    const texte = `Défense — ${p.nom} : ${o.nom.charAt(0).toLowerCase()}${o.nom.slice(1)}.`;
    e.journal.push({ tour: e.tour, trimestre: lib, type: 'politique', texte });
    res.push({ type: 'programme', texte });
  }
  // Opérations : le coût annuel suit l'option en vigueur
  for (const [id, optionId] of Object.entries(d.operations ?? {})) {
    const op = operationsDuPays(e.pays).find((y) => y.id === id);
    const o = op?.options.find((y) => y.id === optionId);
    if (!op || !o || x.operations[id] === optionId) continue;
    const avant = op.options.find((y) => y.id === x.operations[id]);
    appliquer(e, avant?.effets, op.nom, -1); // on défait l'effet structurel de l'option précédente (sauf l'opinion)
    e.depensesTemporaires = e.depensesTemporaires.filter((t) => t.source !== `operation:${id}`);
    if (o.cout) e.depensesTemporaires.push({ poste: 'defense', valeur: o.cout, fin: e.tour + 400, source: `operation:${id}` });
    appliquer(e, o.effets, op.nom);
    x.operations[id] = optionId;
    const texte = `Opérations — ${op.nom} : ${o.nom.charAt(0).toLowerCase()}${o.nom.slice(1)}${domaineReserve(e) ? ' (décision du président de la République, sur proposition du gouvernement)' : ''}.`;
    e.journal.push({ tour: e.tour, trimestre: lib, type: 'politique', texte });
    res.push({ type: 'operation', texte });
  }
  // Exportations : une tentative par an et par prospect, un point de capital diplomatique
  for (const id of d.exports ?? []) {
    const p = exportsDuPays(e.pays).find((y) => y.id === id);
    const s = x.exports[id];
    if (!p || !s || s.statut !== 'ouvert') continue;
    if (s.derniereTentative !== null && e.tour - s.derniereTentative < 4) continue;
    if (e.international.capitalDiplomatique < 1) { res.push({ type: 'erreur', texte: 'Capital diplomatique insuffisant pour soutenir une exportation.' }); continue; }
    e.international.capitalDiplomatique -= 1;
    s.derniereTentative = e.tour;
    const proba = probabiliteExport(e, p);
    const ok = alea.tirage(proba);
    let texte;
    if (ok) {
      s.statut = 'gagne';
      appliquer(e, p.effets, p.nom);
      texte = `Exportation — ${p.nom} : contrat signé ! ${p.montant}.`;
    } else {
      texte = `Exportation — ${p.nom} : pas de décision cette année (chances estimées à ${Math.round(proba * 100)} %). Vous pourrez relancer l'an prochain.`;
      s.echecs = (s.echecs ?? 0) + 1;
      if (s.echecs >= 2 && alea.tirage(0.3)) { s.statut = 'perdu'; texte = `Exportation — ${p.nom} : le client choisit un concurrent.`; }
    }
    e.journal.push({ tour: e.tour, trimestre: lib, type: ok ? 'reforme' : 'politique', texte });
    res.push({ type: 'export', texte, succes: ok });
  }
  // Dissuasion : dimension européenne
  if (d.dissuasion && e.pays === 'france' && d.dissuasion !== x.dissuasion) {
    const avant = DISSUASION_EUROPE.find((y) => y.id === x.dissuasion);
    const o = DISSUASION_EUROPE.find((y) => y.id === d.dissuasion);
    if (o && !domaineReserve(e)) {
      appliquer(e, avant?.effets, 'Dissuasion', -1);
      appliquer(e, o.effets, 'Dissuasion');
      x.dissuasion = o.id;
      const texte = `Dissuasion — ${o.nom}.`;
      e.journal.push({ tour: e.tour, trimestre: lib, type: 'politique', texte });
      res.push({ type: 'dissuasion', texte });
    } else if (o) {
      res.push({ type: 'erreur', texte: 'La dissuasion relève du seul président de la République.' });
    }
  }
  return res;
}

/** Chances d'emporter un contrat d'armement (relations, influence, carnet de commandes déjà gagné). */
export function probabiliteExport(e, p) {
  const rel = e.international.relations[p.partenaire] ?? 20;
  return borner(p.base + 0.002 * rel + 0.003 * ((e.international.influence ?? 60) - 60), 0.05, 0.6);
}

/** Évolution trimestrielle : livraisons, jalons (et leurs aléas), effets des opérations. */
export function majDefense(e, alea) {
  if (!e.defense) initialiserDefense(e);
  const x = e.defense;
  const lib = libelleTrimestre(e.trimestre);
  const maintenant = rang(e.trimestre);
  for (const p of programmesDuPays(e.pays)) {
    const etat = x.programmes[p.id];
    // Livraisons : on suit la trajectoire de la loi de programmation, ralentie en cas d'étalement
    if (p.capacite?.cibles) {
      const cle = p.capacite.cle;
      const manque = x.manques?.[cle] ?? 0;
      const base = x.capacites[cle] - (x.supplementsLivres?.[cle] ?? 0);
      const cible = p.capacite.cibles.find((c) => rang(c) >= maintenant);
      if (cible) {
        const restant = Math.max(0, cible.valeur - manque - base);
        const rythme = restant / Math.max(1, rang(cible) - maintenant + 1);
        const o = p.options.find((y) => y.id === etat.option);
        const etale = o?.livraisons && e.tour < etat.debut + (o.duree ?? 0);
        const livre = etale ? rythme * o.livraisons : rythme;
        // Les avions non livrés pendant l'étalement arrivent après l'horizon de la programmation
        if (etale) x.manques = { ...(x.manques ?? {}), [cle]: manque + (rythme - livre) };
        x.capacites[cle] += livre;
      }
      const s = x.supplements[cle];
      if (s && s.restant > 0 && e.tour >= s.debut) {
        const n = Math.min(s.restant, s.rythme);
        s.restant -= n; x.capacites[cle] += n;
        x.supplementsLivres = { ...(x.supplementsLivres ?? {}), [cle]: (x.supplementsLivres?.[cle] ?? 0) + n };
      }
    }
    // Jalons : un programme non sécurisé peut glisser au dernier moment
    for (const j of jalonsEffectifs(e, p)) {
      if (j.atteint || rang(j) > maintenant) continue;
      if (j.risqueRetard && !etat.securise && !etat.aleaJoue?.[j.id] && alea?.tirage(j.risqueRetard)) {
        etat.retard += 4;
        etat.aleaJoue = { ...(etat.aleaJoue ?? {}), [j.id]: true };
        e.journal.push({ tour: e.tour, trimestre: lib, type: 'alerte', texte: `Défense — ${p.nom} : difficultés industrielles, le jalon « ${j.texte} » glisse d'un an.` });
        continue;
      }
      x.jalons.push(j.id);
      if (j.capacite && p.capacite) x.capacites[p.capacite.cle] += j.capacite;
      e.international.bonusInfluence += 1;
      e.journal.push({ tour: e.tour, trimestre: lib, type: 'reforme', texte: `Défense — ${j.texte}` });
    }
  }
  // Porte-avions : si la réforme « renoncer » est en vigueur, le programme est arrêté
  const pa = e.reformes?.actives?.find((a) => a.id === 'porte_avions');
  if (x.programmes.pang) x.programmes.pang.abandonne = pa?.option === 'renoncer';
}

/** Résumé pour l'interface et les tests. */
export function resumeDefense(e) {
  if (!e.defense) return null;
  const x = e.defense;
  const budget = e.budget?.defense?.montant ?? null;
  const pib = e.macro.pibNominal;
  const temporaires = e.depensesTemporaires.filter((d) => d.poste === 'defense' && e.tour < d.fin && (d.debut ?? 0) <= e.tour).reduce((s, d) => s + d.valeur, 0);
  return {
    budget, pctPIB: budget && pib ? (budget + temporaires) / pib * 100 : null, supplementaire: temporaires,
    capacites: { ...x.capacites },
    programmes: programmesDuPays(e.pays).map((p) => ({ ...p, etat: x.programmes[p.id], jalonsEffectifs: jalonsEffectifs(e, p) })),
    operations: operationsDuPays(e.pays).map((o) => ({ ...o, actuelle: x.operations[o.id] })),
    exports: exportsDuPays(e.pays).map((p) => ({ ...p, ...x.exports[p.id], probabilite: probabiliteExport(e, p), disponible: x.exports[p.id]?.statut === 'ouvert' && (x.exports[p.id].derniereTentative === null || e.tour - x.exports[p.id].derniereTentative >= 4) })),
    dissuasion: x.dissuasion,
    domaineReserve: domaineReserve(e),
  };
}
