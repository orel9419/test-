/**
 * Négociations au G7.
 *
 * Chaque année au deuxième trimestre, les dirigeants du G7 se réunissent chez
 * le pays qui exerce la présidence (rotation fixe). L'agenda compte quatre
 * dossiers ; le joueur en choisit deux comme priorités, avec un niveau
 * d'ambition, peut mettre des concessions sur la table et tenir des réunions
 * bilatérales (capital diplomatique). Les trimestres précédents, il peut
 * mobiliser ses sherpas pour préparer le sommet.
 *
 * Règle du consensus : un dossier aboutit si l'acceptation moyenne pondérée
 * est suffisante ET si aucun membre n'est franchement hostile. Les autres
 * dossiers de l'agenda sont aussi tranchés, sans votre appui, avec des effets
 * réduits de moitié.
 *
 * En France, la politique étrangère relève du « domaine réservé » : seul le
 * président de la République négocie ; un Premier ministre voit le sommet se
 * dérouler avec les priorités par défaut de l'Élysée.
 */
import { MEMBRES_G7, ROTATION_G7, ANNEE_REFERENCE_G7, AGENDA_HOTE, DOSSIERS_G7, CONCESSIONS_G7 } from '../data/g7.js';
import { creerAleatoire } from './aleatoire.js';
import { borner } from '../model/outils.js';
import { libelleTrimestre } from './calendrier.js';
import { appliquerChocs } from './social.js';

export const T_SOMMET = 2;
const SEUIL_ACCORD = 0.3, VETO_ACCORD = -0.35, SEUIL_COMPROMIS = 0, VETO_COMPROMIS = -0.7;
const PRIORITES_DEFAUT = ['ukraine', 'energie'];

/** Le pays joué est-il membre du G7 ? */
export const membreG7 = (e) => ['france', 'allemagne', 'etatsUnis'].includes(e.pays);

/** Seuls les chefs d'État ou de gouvernement qui siègent au G7 négocient (pas le Premier ministre français). */
export const peutNegocier = (e) => membreG7(e) && (e.pays !== 'france' || e.role === 'president');

export function initialiserG7(e) {
  if (!membreG7(e)) return null;
  e.g7 = { historique: [], preparation: 0 };
  return e.g7;
}

/** Pays qui préside le G7 une année donnée. */
export function hoteG7(annee) {
  return ROTATION_G7[((annee - ANNEE_REFERENCE_G7) % ROTATION_G7.length + ROTATION_G7.length) % ROTATION_G7.length];
}

/** Prochain sommet : cette année si le deuxième trimestre n'est pas passé (le sommet de 2026 a eu lieu à Évian). */
export function prochainSommet(e) {
  const tr = e.trimestre;
  const annee = tr.t <= T_SOMMET ? tr.annee : tr.annee + 1;
  const hote = hoteG7(annee);
  const trimestresAvant = (annee - tr.annee) * 4 + (T_SOMMET - tr.t);
  return { annee, hote, hoteNom: MEMBRES_G7[hote].nom, trimestresAvant, ceTrimestre: trimestresAvant === 0, presidence: hote === e.pays };
}

/** Agenda du sommet : choisi par la présidence (par le joueur s'il préside). */
export function agendaSommet(e, annee, agendaChoisi = null) {
  const hote = hoteG7(annee);
  if (hote === e.pays && agendaChoisi?.length) return agendaChoisi.filter((d) => DOSSIERS_G7[d]).slice(0, 4);
  const base = [...AGENDA_HOTE[hote]];
  // Le dossier énergie s'impose tant que la crise énergétique dure
  if ((e.monde?.energie ?? 100) > 140 && !base.includes('energie')) base[3] = 'energie';
  return base.slice(0, 4);
}

/** Relation du pays joué avec un membre (les pays de l'Union sans relation propre reprennent la relation avec l'UE). */
function relation(e, membre) {
  const r = e.international.relations;
  if (r[membre] !== undefined) return r[membre];
  if (MEMBRES_G7[membre]?.ue && r.ue !== undefined) return r.ue;
  return 20;
}

/** Membres autour de la table (hors pays joué). */
export const autresMembres = (e) => Object.keys(MEMBRES_G7).filter((m) => m !== e.pays);

/** Bonus d'acceptation par membre issu des concessions, des bilatérales et de la préparation. */
function bonus(e, decision, membre) {
  let b = 0;
  for (const c of decision.concessions ?? []) b += CONCESSIONS_G7[c]?.bonus?.[membre] ?? 0;
  if ((decision.bilaterales ?? []).includes(membre)) b += 0.35;
  return b;
}

/** Acceptation d'un membre sur un dossier (sans aléa). */
export function acceptation(e, dossier, membre, decision = {}, priorite = true) {
  const d = DOSSIERS_G7[dossier];
  const ambition = priorite && decision.ambition?.[dossier] === 'ambitieux' ? 0.3 : 0;
  const hote = prochainSommet(e).presidence ? 0.2 : 0;
  const pousse = priorite ? 0.06 * (e.g7?.preparation ?? 0) + (e.international.influence - 60) / 250 + hote + bonus(e, decision, membre) : 0;
  return (d.positions[membre] ?? 0) + 0.004 * (relation(e, membre) - 20) + pousse - ambition;
}

/** Issue d'un dossier pour un tirage d'aléas donné. */
function issue(e, dossier, decision, priorite, alea) {
  let somme = 0, poids = 0, min = Infinity;
  for (const m of autresMembres(e)) {
    const a = acceptation(e, dossier, m, decision, priorite) + alea.normale(0, 0.15);
    somme += MEMBRES_G7[m].poids * a; poids += MEMBRES_G7[m].poids; min = Math.min(min, a);
  }
  const moyenne = somme / poids;
  const voulu = priorite && decision.ambition?.[dossier] === 'ambitieux' ? 'ambitieux' : 'compromis';
  if (moyenne >= SEUIL_ACCORD && min >= VETO_ACCORD) return voulu;
  if (moyenne >= SEUIL_COMPROMIS && min >= VETO_COMPROMIS) return 'compromis';
  return 'echec';
}

/** Décision normalisée : priorités valides (2 au plus), bilatérales (2 au plus), concessions autorisées. */
function normaliser(e, decision = {}, agenda) {
  const priorites = (decision.priorites ?? []).filter((d) => agenda.includes(d)).slice(0, 2);
  return {
    priorites,
    ambition: decision.ambition ?? {},
    concessions: (decision.concessions ?? []).filter((c) => CONCESSIONS_G7[c] && (!CONCESSIONS_G7[c].pays || CONCESSIONS_G7[c].pays.includes(e.pays))),
    bilaterales: (decision.bilaterales ?? []).filter((m) => MEMBRES_G7[m] && m !== e.pays).slice(0, 2),
    agenda: decision.agenda,
  };
}

/**
 * Prévision (sans modifier l'état) : probabilités d'accord ambitieux, de
 * compromis et d'échec pour chaque dossier de l'agenda, et position de
 * chaque membre.
 */
export function previsionG7(e, decisionBrute = {}) {
  const s = prochainSommet(e);
  const agenda = agendaSommet(e, s.annee, decisionBrute.agenda);
  const decision = normaliser(e, decisionBrute, agenda);
  const N = 300;
  const alea = creerAleatoire(97531);
  return {
    sommet: s,
    agenda: agenda.map((dossier) => {
      const priorite = decision.priorites.includes(dossier);
      const comptes = { ambitieux: 0, compromis: 0, echec: 0 };
      for (let k = 0; k < N; k++) comptes[issue(e, dossier, decision, priorite, alea)] += 1;
      return {
        id: dossier, nom: DOSSIERS_G7[dossier].nom, priorite,
        probabilites: Object.fromEntries(Object.entries(comptes).map(([k, v]) => [k, v / N])),
        positions: Object.fromEntries(autresMembres(e).map((m) => [m, acceptation(e, dossier, m, decision, priorite)])),
      };
    }),
  };
}

/** Applique les effets d'une issue au pays joué (facteur : 1 pour une priorité, 0,5 sinon). */
function appliquer(e, eff, facteur, source) {
  const i = e.international;
  for (const [p, v] of Object.entries(eff.relations ?? {})) if (i.relations[p] !== undefined) i.relations[p] = borner(i.relations[p] + v * facteur, -100, 100);
  if (eff.influence) i.bonusInfluence += eff.influence * facteur;
  if (eff.credibilite) e.finances.credibilite = borner(e.finances.credibilite + eff.credibilite * facteur, -1, 1);
  if (eff.chocs) appliquerChocs(e, Object.fromEntries(Object.entries(eff.chocs).map(([g, v]) => [g, v * facteur])));
  if (eff.grief) e.reformes.actives.push({ id: `g7:${source}`, nom: source, diplomatique: true, opinion: {}, grief: { ...eff.grief }, appliquee: true, tourAdoption: e.tour });
  if (eff.souverainete && e.entreprises) e.entreprises.bonusSouverainete += eff.souverainete * facteur;
  for (const mod of eff.modificateurs ?? []) {
    const valeur = mod.type === 'facteurEnergie' ? 1 - (1 - mod.valeur) * facteur : mod.valeur * facteur;
    i.modificateurs.push({ ...mod, valeur, source, debut: e.tour, fin: e.tour + (mod.duree ?? 1) });
  }
}

const LIBELLE_ISSUE = { ambitieux: 'accord ambitieux', compromis: 'compromis', echec: 'échec' };

/**
 * Tient le sommet du trimestre : issue de chaque dossier, effets, coûts des
 * concessions et des bilatérales. Renvoie le résumé pour le bilan du tour.
 */
export function tenirSommet(e, decisionBrute, alea) {
  const s = prochainSommet(e);
  if (!e.g7 || !s.ceTrimestre) return null;
  const negocie = peutNegocier(e);
  const agenda = agendaSommet(e, s.annee, negocie ? decisionBrute?.agenda : null);
  let decision = normaliser(e, negocie ? (decisionBrute ?? {}) : {}, agenda);
  if (!decision.priorites.length) decision = { ...decision, priorites: PRIORITES_DEFAUT.filter((d) => agenda.includes(d)).slice(0, 2) };
  if (!decision.priorites.length) decision.priorites = agenda.slice(0, 1);
  // Bilatérales : un point de capital diplomatique chacune (si disponible)
  const bilaterales = decision.bilaterales.filter((m, k) => k < e.international.capitalDiplomatique);
  e.international.capitalDiplomatique -= bilaterales.length;
  decision = { ...decision, bilaterales };

  const resultats = agenda.map((dossier) => {
    const priorite = decision.priorites.includes(dossier);
    const niveau = issue(e, dossier, decision, priorite, alea);
    const eff = DOSSIERS_G7[dossier].effets(niveau, priorite ? decision.ambition[dossier] : 'compromis');
    // Hors priorités : seuls les accords profitent (à moitié) ; un échec ne vous est pas imputé
    if (priorite || niveau !== 'echec') appliquer(e, eff, priorite ? 1 : 0.5, `G7 ${s.annee} : ${DOSSIERS_G7[dossier].nom}`);
    return { id: dossier, nom: DOSSIERS_G7[dossier].nom, priorite, niveau, texte: eff.texte };
  });
  for (const c of decision.concessions) appliquer(e, CONCESSIONS_G7[c].cout, 1, `Concession au G7 : ${CONCESSIONS_G7[c].nom}`);
  for (const m of bilaterales) if (e.international.relations[m] !== undefined) e.international.relations[m] = borner(e.international.relations[m] + 3, -100, 100);
  // Présider le G7 : visibilité, mais coût d'organisation (hypothèse de jeu : 0,3 Md€)
  if (s.presidence) {
    e.international.bonusInfluence += 3;
    e.international.modificateurs.push({ type: 'depense', poste: 'affairesEtrangeres', valeur: 1.2, source: `Présidence du G7 ${s.annee}`, debut: e.tour, fin: e.tour + 1 });
  }
  const succesPriorites = resultats.filter((r) => r.priorite && r.niveau !== 'echec').length;
  if (succesPriorites === decision.priorites.length && resultats.some((r) => r.priorite && r.niveau === 'ambitieux')) appliquerChocs(e, { salaries: 1, retraites: 1, jeunes: 1 });

  const bilan = {
    annee: s.annee, hote: s.hote, hoteNom: s.hoteNom, presidence: s.presidence, negocie,
    priorites: decision.priorites, concessions: decision.concessions, bilaterales, resultats,
  };
  e.g7.historique.push(bilan);
  e.g7.preparation = 0;
  const lib = libelleTrimestre(e.trimestre);
  const qui = negocie ? '' : ' (le président de la République négocie : domaine réservé)';
  e.journal.push({
    tour: e.tour, trimestre: lib, type: 'diplomatie',
    texte: `Sommet du G7 ${s.annee} (${s.presidence ? 'sous votre présidence' : `présidence : ${s.hoteNom}`})${qui}. ${resultats.map((r) => `${r.nom} : ${LIBELLE_ISSUE[r.niveau]}${r.priorite ? ' (votre priorité)' : ''}${r.priorite || r.niveau !== 'echec' ? `, ${r.texte}` : ''}`).join(' ; ')}.${decision.concessions.length ? ` Concessions : ${decision.concessions.map((c) => CONCESSIONS_G7[c].texte).join(' ; ')}.` : ''}`,
  });
  return bilan;
}

/** Mobiliser les sherpas (avant le sommet) : un point de capital diplomatique, préparation +1 (3 au plus). */
export function preparerSommet(e) {
  if (!e.g7 || !peutNegocier(e) || prochainSommet(e).ceTrimestre) return false;
  if (e.international.capitalDiplomatique < 1 || e.g7.preparation >= 3) return false;
  e.international.capitalDiplomatique -= 1;
  e.g7.preparation += 1;
  return true;
}
