/**
 * Défense et régalien : programmes d'armement (rythme, commandes, jalons),
 * capacités (Rafale, SNLE 3G...), opérations, exportations d'armement et
 * dimension européenne de la dissuasion (France).
 *
 * Les coûts passent par les dépenses du poste « défense » (dépenses
 * temporaires) : ils pèsent donc sur le déficit comme le reste du budget.
 */
import { PROGRAMMES_DEFENSE, OPERATIONS, EXPORTS, DISSUASION_EUROPE, INTERVALLE_COMMANDES, commandesDuProgramme } from '../data/defense.js';
import { appliquerEffetsEntreprise } from './entreprises.js';
import { borner } from '../model/outils.js';
import { libelleTrimestre } from './calendrier.js';
import { creerAleatoire } from './aleatoire.js';

const rang = (x) => x.annee * 4 + x.t;
/** Le « France Libre » n'est jamais disponible avant 2032 (loi d'accélération comprise). */
export const ANNEE_MIN_FRANCE_LIBRE = 2032;
const RANG_PANG_NOMINAL = 2038 * 4 + 2;
const RANG_RETRAIT_CDG = 2038 * 4 + 4;
const etatProgrammeDefaut = () => ({ option: 'nominal', debut: 1, fin: 1, retard: 0, securise: false });

/** Sauvegardes antérieures : programmes, compteurs et commandes ajoutés depuis (Charles-de-Gaulle, SNA...). */
function completerProgrammes(e) {
  const x = e.defense;
  x.commandes ??= {};
  for (const p of programmesDuPays(e.pays)) {
    x.programmes[p.id] ??= etatProgrammeDefaut();
    if (p.capacite) x.capacites[p.capacite.cle] ??= p.capacite.depart;
    for (const c of commandesDuProgramme(e.pays, p.id)) x.capacites[c.cle] ??= c.depart ?? 0;
  }
}

export function programmesDuPays(pays) { return PROGRAMMES_DEFENSE[pays] ?? []; }
export function operationsDuPays(pays) { return OPERATIONS[pays] ?? []; }
export function exportsDuPays(pays) { return EXPORTS[pays] ?? []; }

export function initialiserDefense(e) {
  const programmes = {};
  const capacites = {};
  for (const p of programmesDuPays(e.pays)) {
    programmes[p.id] = etatProgrammeDefaut();
    if (p.capacite) capacites[p.capacite.cle] = p.capacite.depart;
    for (const c of commandesDuProgramme(e.pays, p.id)) capacites[c.cle] ??= c.depart ?? 0;
  }
  e.defense = {
    programmes,
    capacites,
    supplements: {},
    commandes: {},
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
/** Vrai si la réforme (id, option) est en vigueur. */
const reformeActive = (e, [id, option]) => e.reformes?.actives?.some((a) => a.id === id && a.option === option);

export function jalonsEffectifs(e, p) {
  const etat = e.defense?.programmes[p.id];
  return (p.jalons ?? []).filter((j) => !j.siReforme || reformeActive(e, j.siReforme)).map((j) => {
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
  completerProgrammes(e);
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
  // Commandes supplémentaires (renouvelables tous les quatre trimestres)
  for (const id of new Set(d.commandes ?? [])) {
    const trouve = trouverCommande(e.pays, id);
    if (!trouve) continue;
    const [p, c] = trouve;
    const etat = etatCommande(e, c);
    if (!etat.disponible) { res.push({ type: 'erreur', texte: `${c.nom} : ${etat.motif}` }); continue; }
    const suivi = x.commandes[id] ?? { nombre: 0, dernier: null, lots: [] };
    x.commandes[id] = { nombre: suivi.nombre + 1, dernier: e.tour, lots: [...suivi.lots, { tour: e.tour, trimestre: lib, restant: c.quantite, debut: e.tour + c.delai }] };
    if (c.cout) e.depensesTemporaires.push({ poste: 'defense', valeur: c.cout, fin: e.tour + c.duree, source: `commande:${id}` });
    appliquer(e, c.effets, p.nom);
    const texte = `Défense — ${c.nom.charAt(0).toLowerCase()}${c.nom.slice(1)} : ${c.quantite > 1 ? `${c.quantite} ${c.unite}` : `un ${c.unite}`} ${c.quantite > 1 ? 'livrés' : 'livré'} à partir du ${libelleTrimestre(trimestreDans(e, c.delai))}.`;
    e.journal.push({ tour: e.tour, trimestre: lib, type: 'politique', texte });
    res.push({ type: 'commande', texte });
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
  // Dissuasion : tir d'essai d'un missile M51 (au plus un par an, aléa séparé)
  if (d.essaiM51 && e.pays === 'france') res.push(essaiM51(e));
  return res;
}

/** Sous-marins nucléaires lanceurs d'engins en service, d'où partent les tirs d'essai à tour de rôle. */
const LANCEURS_M51 = ['Le Téméraire', 'Le Terrible', 'Le Triomphant', 'Le Vigilant'];
/** Chance de succès d'un tir d'essai (hypothèse de jeu : un seul échec public, en 2013, sur une quinzaine de tirs). */
export const CHANCE_ESSAI_M51 = 0.9;
/** Coût d'un tir d'essai, en Md€ (missile, campagne de mesure : hypothèse de jeu). */
export const COUT_ESSAI_M51 = 0.1;

/** Prochain trimestre (rang de tour) où un essai est possible : un par an au plus. */
export function prochainEssaiM51(e) {
  const dernier = e.defense?.essaisM51?.at(-1);
  return dernier ? dernier.tour + 4 : e.tour;
}

/**
 * Tir d'essai d'un M51, sans charge nucléaire, depuis un SNLE au large du
 * Finistère, suivi par le bâtiment d'essais et de mesures Monge. Réussi, il
 * conforte la crédibilité de la dissuasion (influence) ; raté, il impose une
 * enquête et coûte un peu de crédit. Décision du seul président.
 */
export function essaiM51(e) {
  const x = e.defense;
  if (domaineReserve(e)) return { type: 'erreur', texte: 'La dissuasion relève du seul président de la République.' };
  if (e.tour < prochainEssaiM51(e)) return { type: 'erreur', texte: `Un tir d'essai par an au plus : encore ${prochainEssaiM51(e) - e.tour} trimestre(s) à attendre.` };
  const n = x.essaisM51?.length ?? 0;
  const lanceur = LANCEURS_M51[n % LANCEURS_M51.length];
  const succes = creerAleatoire(((e.graine ^ Math.imul(e.tour + 41, 2654435761)) + 7) >>> 0).tirage(CHANCE_ESSAI_M51);
  e.depensesTemporaires.push({ poste: 'defense', valeur: COUT_ESSAI_M51 * 4, fin: e.tour + 1, source: 'essai_m51' });
  appliquer(e, { influence: succes ? 1 : -1 }, 'Essai M51');
  x.essaisM51 = [...(x.essaisM51 ?? []), { tour: e.tour, trimestre: libelleTrimestre(e.trimestre), lanceur, succes }];
  const texte = succes
    ? `Dissuasion — Tir d'essai réussi : un missile M51 sans charge nucléaire, tiré en plongée par le SNLE ${lanceur} au large du Finistère, a atteint sa zone de retombée en Atlantique Nord, suivi par le Monge. Message de crédibilité adressé à tous.`
    : `Dissuasion — Échec du tir d'essai : le missile M51 tiré par le SNLE ${lanceur} s'est autodétruit peu après sa sortie de l'eau, comme le 5 mai 2013 depuis Le Vigilant. Enquête de la DGA ; les autres missiles ne sont pas en cause.`;
  e.journal.push({ tour: e.tour, trimestre: libelleTrimestre(e.trimestre), type: succes ? 'reforme' : 'alerte', texte });
  return { type: 'essaiM51', succes, texte };
}

/** Chances d'emporter un contrat d'armement (relations, influence, carnet de commandes déjà gagné). */
export function probabiliteExport(e, p) {
  const rel = e.international.relations[p.partenaire] ?? 20;
  // Bonus d'une escale récente du groupe aéronaval (ex. océan Indien pour l'Inde)
  const escale = e.geopolitique?.bonusExport?.[p.id]?.valeur ?? 0;
  return borner(p.base + 0.002 * rel + 0.003 * ((e.international.influence ?? 60) - 60) + escale, 0.05, 0.65);
}

/** Évolution trimestrielle : livraisons, jalons (et leurs aléas), effets des opérations. */
export function majDefense(e, alea) {
  if (!e.defense) initialiserDefense(e);
  completerProgrammes(e);
  const x = e.defense;
  const lib = libelleTrimestre(e.trimestre);
  const maintenant = rang(e.trimestre);
  if (e.pays === 'france') accelererFranceLibre(e, maintenant, lib);
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
      if (s && Math.abs(s.restant) > 1e-9 && e.tour >= s.debut) {
        // Supplément positif (commande, plan de disponibilité) ou négatif (baisse de l'entretien)
        const n = s.restant > 0 ? Math.min(s.restant, s.rythme) : Math.max(s.restant, s.rythme);
        s.restant -= n; x.capacites[cle] += n;
        x.supplementsLivres = { ...(x.supplementsLivres ?? {}), [cle]: (x.supplementsLivres?.[cle] ?? 0) + n };
      }
    }
    // Jalons : un programme non sécurisé peut glisser au dernier moment
    for (const j of jalonsEffectifs(e, p)) {
      if (j.atteint || rang(j) > maintenant) continue;
      if (!jalonPossible(e, j, maintenant, lib)) continue;
      if (j.risqueRetard && !etat.securise && !etat.aleaJoue?.[j.id] && alea?.tirage(j.risqueRetard)) {
        etat.retard += 4;
        etat.aleaJoue = { ...(etat.aleaJoue ?? {}), [j.id]: true };
        e.journal.push({ tour: e.tour, trimestre: lib, type: 'alerte', texte: `Défense — ${p.nom} : difficultés industrielles, le jalon « ${j.texte} » glisse d'un an.` });
        continue;
      }
      x.jalons.push(j.id);
      if (j.id === 'pang') x.franceLibreDepuis = maintenant;
      if (j.capacite && p.capacite) x.capacites[p.capacite.cle] += j.capacite;
      e.international.bonusInfluence += j.influence ?? 1;
      e.journal.push({ tour: e.tour, trimestre: lib, type: 'reforme', texte: `Défense — ${j.texte}` });
    }
    livrerCommandes(e, p, lib);
  }
  // Deux porte-avions en même temps (Charles-de-Gaulle gardé à côté du « France Libre ») : équipages et entretien
  if (x.jalons.includes('pang') && !x.jalons.includes('cdg_retrait') && e.trimestre.annee >= ANNEE_MIN_FRANCE_LIBRE) {
    e.depensesTemporaires.push({ poste: 'defense', valeur: 0.5, fin: e.tour + 1, source: 'deux_porte_avions' });
  }
  // Porte-avions : si la réforme « renoncer » est en vigueur, le programme est arrêté
  const pa = e.reformes?.actives?.find((a) => a.id === 'porte_avions');
  if (x.programmes.pang) x.programmes.pang.abandonne = pa?.option === 'renoncer';
}

/**
 * Porte-avions : conditions propres à certains jalons.
 * - « France Libre » : jamais avant 2032, pas si le programme est abandonné ;
 *   accéléré, il peut glisser d'un an (aléa séparé, joué une fois).
 * - Retrait du Charles-de-Gaulle : deux trimestres après l'arrivée de son
 *   successeur, au plus tard fin 2038 (fin 2040 s'il est prolongé).
 */
function jalonPossible(e, j, maintenant, lib) {
  const x = e.defense;
  if (j.id === 'pang') {
    const pang = x.programmes.pang;
    if (pang?.abandonne || e.trimestre.annee < ANNEE_MIN_FRANCE_LIBRE) return false;
    if (pang?.accelere && !pang.aleaAcceleration) {
      pang.aleaAcceleration = true;
      if (creerAleatoire(((e.graine ^ 0x5f3759df) + maintenant) >>> 0).tirage(0.3)) {
        pang.retard = (pang.retard ?? 0) + 4;
        e.journal.push({ tour: e.tour, trimestre: lib, type: 'alerte', texte: 'Défense — « France Libre » : les essais des chaufferies nucléaires prennent du retard ; la mise en service glisse d\'un an malgré la loi d\'accélération.' });
        return false;
      }
    }
    return true;
  }
  if (j.id === 'pang2') return !x.programmes.pang?.abandonne && x.jalons.includes('pang') && reformeActive(e, j.siReforme);
  if (j.id === 'cdg_retrait') {
    // Gardé jusqu'en 2040 : il navigue aux côtés du « France Libre » ; sinon il part quand son successeur est prêt
    if (x.programmes.cdg?.option === 'prolonger') return maintenant >= RANG_RETRAIT_CDG + 8;
    const successeur = x.franceLibreDepuis !== undefined && maintenant >= x.franceLibreDepuis + 2;
    return successeur || maintenant >= RANG_RETRAIT_CDG;
  }
  return true;
}

/**
 * Loi d'accélération du « France Libre » : une fois votée, le jalon de mise en
 * service est avancé (au plus tôt au 2e trimestre 2032, et au moins cinq ans
 * après le vote) ; le retrait du Charles-de-Gaulle suit.
 */
function accelererFranceLibre(e, maintenant, lib) {
  const x = e.defense;
  const pang = x.programmes.pang;
  const loi = e.reformes?.actives?.find((a) => a.id === 'porte_avions_2032');
  if (!loi || !pang || pang.accelere || pang.abandonne || x.jalons.includes('pang')) return;
  const cible = Math.max(ANNEE_MIN_FRANCE_LIBRE * 4 + 2, maintenant + 20);
  const actuel = RANG_PANG_NOMINAL + (pang.retard ?? 0) - (pang.avance?.pang ?? 0);
  const gain = actuel - cible;
  pang.accelere = { tour: e.tour, cible };
  if (gain <= 0) return;
  pang.avance = { ...(pang.avance ?? {}), pang: (pang.avance?.pang ?? 0) + gain, pang2: (pang.avance?.pang2 ?? 0) + gain };
  const cdg = x.programmes.cdg;
  if (cdg) cdg.avance = { ...(cdg.avance ?? {}), cdg_retrait: (cdg.avance?.cdg_retrait ?? 0) + gain };
  const an = Math.floor((cible - 1) / 4), t = ((cible - 1) % 4) + 1;
  e.journal.push({ tour: e.tour, trimestre: lib, type: 'reforme', texte: `Défense — Loi d'accélération : le « France Libre » est désormais attendu au T${t} ${an} (au lieu de 2038). Chantiers en parallèle à Saint-Nazaire et chez TechnicAtome.` });
}

/** Trimestre situé n trimestres après le trimestre courant. */
function trimestreDans(e, n) {
  const r = rang(e.trimestre) + n;
  return { annee: Math.floor((r - 1) / 4), t: ((r - 1) % 4) + 1 };
}

/** [programme, commande] d'après l'identifiant de la commande. */
function trouverCommande(pays, id) {
  for (const p of programmesDuPays(pays)) {
    const c = commandesDuProgramme(pays, p.id).find((y) => y.id === id);
    if (c) return [p, c];
  }
  return null;
}

/**
 * État d'une commande supplémentaire : nombre déjà passé, prochaine date
 * possible (une commande tous les quatre trimestres), plafond éventuel, lots
 * en cours de livraison.
 */
export function etatCommande(e, c) {
  const suivi = e.defense?.commandes?.[c.id] ?? { nombre: 0, dernier: null, lots: [] };
  const prochainTour = suivi.dernier === null ? e.tour : suivi.dernier + INTERVALLE_COMMANDES;
  const plafond = c.maxCommandes !== undefined && suivi.nombre >= c.maxCommandes;
  const attente = prochainTour > e.tour;
  const enCours = suivi.lots.filter((l) => l.restant > 0);
  return {
    nombre: suivi.nombre,
    disponible: !plafond && !attente,
    plafond,
    prochain: attente ? trimestreDans(e, prochainTour - e.tour) : null,
    motif: plafond ? `plafond atteint (${c.maxCommandes} commandes au plus)` : attente ? `une seule commande tous les ${INTERVALLE_COMMANDES} trimestres (prochaine au ${libelleTrimestre(trimestreDans(e, prochainTour - e.tour))})` : null,
    enCours: enCours.map((l) => ({ ...l, debutTrimestre: trimestreDans(e, l.debut - e.tour) })),
    restant: enCours.reduce((s, l) => s + l.restant, 0),
  };
}

/**
 * Livraisons des commandes supplémentaires : un nombre entier d'unités par
 * trimestre, comptées comme « en plus » de la trajectoire de la loi de
 * programmation (elles ne remplacent pas les livraisons prévues).
 */
function livrerCommandes(e, p, lib) {
  const x = e.defense;
  for (const c of commandesDuProgramme(e.pays, p.id)) {
    for (const lot of x.commandes?.[c.id]?.lots ?? []) {
      if (lot.restant <= 0 || e.tour < lot.debut) continue;
      const n = Math.min(lot.restant, c.parTrimestre);
      lot.restant -= n;
      x.capacites[c.cle] = (x.capacites[c.cle] ?? 0) + n;
      x.supplementsLivres = { ...(x.supplementsLivres ?? {}), [c.cle]: (x.supplementsLivres?.[c.cle] ?? 0) + n };
      if (lot.restant === 0) {
        const quoi = c.quantite > 1 ? `les ${c.quantite} ${c.unite} commandés au ${lot.trimestre} sont tous livrés` : `le ${c.unite} commandé au ${lot.trimestre} est livré`;
        e.journal.push({ tour: e.tour, trimestre: lib, type: 'reforme', texte: `Défense — ${p.nom} : ${quoi}.` });
      }
    }
  }
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
    programmes: programmesDuPays(e.pays).map((p) => ({ ...p, etat: x.programmes[p.id] ?? etatProgrammeDefaut(), jalonsEffectifs: jalonsEffectifs(e, p), commandes: commandesDuProgramme(e.pays, p.id).map((c) => ({ ...c, etat: etatCommande(e, c) })) })),
    operations: operationsDuPays(e.pays).map((o) => ({ ...o, actuelle: x.operations[o.id] })),
    exports: exportsDuPays(e.pays).map((p) => ({ ...p, ...x.exports[p.id], probabilite: probabiliteExport(e, p), disponible: x.exports[p.id]?.statut === 'ouvert' && (x.exports[p.id].derniereTentative === null || e.tour - x.exports[p.id].derniereTentative >= 4) })),
    dissuasion: x.dissuasion,
    domaineReserve: domaineReserve(e),
    essaisM51: x.essaisM51 ?? [],
    prochainEssaiM51: prochainEssaiM51(e),
  };
}
