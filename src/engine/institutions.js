/**
 * Institutions de la Ve République (France).
 *
 *  - Élysée et Matignon : « entente » entre le président et le Premier
 *    ministre, configuration politique (fait majoritaire, majorité relative,
 *    cohabitation) et ce qu'elle change pour chacun.
 *  - Sénat : vote des textes, navette et commission mixte paritaire, dernier
 *    mot de l'Assemblée (article 45), accord obligatoire pour une révision de
 *    la Constitution (article 89) et les lois organiques relatives au Sénat
 *    (article 46), renouvellement par moitié tous les trois ans.
 *  - Pouvoirs propres : message au Congrès (article 18), question de
 *    confiance (article 49, alinéa 1), réponses du président aux textes d'un
 *    gouvernement de cohabitation (articles 10, 13 et 61).
 *
 * Les décisions prises par l'IA (Premier ministre ou président qui ne sont
 * pas le joueur) utilisent un aléa séparé, dérivé de la graine et du tour :
 * sans décision institutionnelle du joueur, les tirages du reste du jeu ne
 * changent pas.
 */
import { SENAT_GROUPES, SIEGES_SENAT, BIAIS_SENAT, ACCORD_SENAT_REQUIS, GOUVERNEMENTS_COHABITATION, PRIORITES_ELYSEE_2027, PALAIS } from '../data/institutions.js';
import { REFORMES } from '../data/reformes.js';
import { EVENEMENTS_INSTITUTIONS } from '../data/evenementsInstitutions.js';
import { creerAleatoire } from './aleatoire.js';
import { borner } from '../model/outils.js';
import { libelleTrimestre } from './calendrier.js';
import { contenuTexte, satisfactionTexte, voterTexte, voter, calculerPositions, majSatisfactions, validerReformes, PROFILS_PREMIER_MINISTRE } from './politique.js';
import { trouverReforme, adopterReforme } from './reformes.js';
import { controleConstitutionnel } from './constitution.js';
import { appliquerChocs } from './social.js';
import { intentions as intentionsCourantes } from './opinion.js';

const actif = (e) => e.pays === 'france' && !!e.institutions;
const aleaInst = (e, sel = 0) => creerAleatoire(((e.graine ^ Math.imul(e.tour + 53, 2654435761)) + sel) >>> 0);
const journal = (e, texte, type = 'politique') => e.journal.push({ tour: e.tour, trimestre: libelleTrimestre(e.trimestre), type, texte });
const session = (e) => (e.trimestre.t === 4 ? e.trimestre.annee : e.trimestre.annee - 1);

const BLOC_CENTRAL = ['EPR', 'DEM', 'HOR'];
const BLOCS_OPPOSES = { RN: ['RN', 'UDR'], gauche: ['SOC', 'LFI', 'ECOS', 'GDR'] };
/** Groupe dont un Premier ministre nommé par le joueur partage les vues. */
const PROXY_PM = { camp: 'EPR', droite: 'DR', gauche: 'SOC', technocrate: null };
/** Entente de départ selon le profil du Premier ministre nommé (hypothèses). */
export const ENTENTE_PROFIL = { camp: 70, droite: 55, gauche: 50, technocrate: 65 };
/** Familles d'électeurs dont chaque groupe du Sénat suit l'implantation locale. */
const FAMILLE_SENAT = { CRCE: 'gauche', GEST: 'ecolos', SER: 'gauche', RDSE: 'autres', RDPI: 'centre', UC: 'centre', LIRT: 'centre', LR: 'LR', UNT: 'RN' };
/** Décisions qui appartiennent au Gouvernement : ignorées pour un président de cohabitation. */
export const DECISIONS_GOUVERNEMENT = ['budget', 'impots', 'reformes', 'referendum', 'nominationPM', 'entreprises', 'programmes', 'relocalisations', 'chantiers', 'trajectoire', 'partCourtTerme', 'allocationCapitalisation', 'questionConfiance'];

export function initialiserInstitutions(e) {
  if (e.pays !== 'france') { e.institutions = null; return; }
  e.institutions = {
    entente: ENTENTE_PROFIL.camp,
    senat: { groupes: SENAT_GROUPES.map((g) => ({ ...g })), relation: 50, president: PALAIS.luxembourg.president, reference: e.opinion ? { ...intentionsCourantes(e) } : null, renouvellements: [] },
    conseil: { severite: 0, nominations: [] },
    cohabitation: null,
    congres: [],
    confiance: {},
    navettes: [],
    demissions: 0,
    historique: [],
  };
}

const siegesDe = (e, ids) => e.politique.groupes.filter((g) => ids.includes(g.id)).reduce((s, g) => s + g.sieges, 0);

/** Vrai pour un président joué en cohabitation. */
export function cohabitationJoueur(e) {
  return e.pays === 'france' && e.role === 'president' && !!e.institutions?.cohabitation;
}

/** Retire les décisions qui relèvent du Gouvernement quand le joueur est un président de cohabitation. */
export function neutraliserDecisions(e, decisions) {
  if (!cohabitationJoueur(e)) return decisions;
  const d = { ...decisions };
  for (const k of DECISIONS_GOUVERNEMENT) delete d[k];
  d.procedureBudget = 'auto';
  d.procedureReformes = 'vote';
  return d;
}

/**
 * Configuration politique de l'exécutif.
 * @returns {object} { id: 'fait_majoritaire'|'majorite_relative'|'cohabitation', nom, texte, gouvernement, soutien, majorite }
 */
export function configuration(e) {
  if (!actif(e)) return null;
  const pol = e.politique;
  const gouvernement = pol.groupes.filter((g) => g.posture === 'gouvernement').reduce((s, g) => s + g.sieges, 0);
  const soutien = pol.groupes.filter((g) => g.posture === 'soutien').reduce((s, g) => s + g.sieges, 0);
  const base = { gouvernement, soutien, majorite: pol.majorite };
  const c = e.institutions.cohabitation;
  if (c) {
    return { ...base, id: 'cohabitation', nom: 'Cohabitation', texte: `Une majorité absolue opposée au président gouverne. Le Premier ministre (${c.premierMinistre}) détermine et conduit la politique de la nation (article 20) ; le président garde ses pouvoirs propres (dissolution, nominations, saisine du Conseil constitutionnel) et pèse sur la défense et la diplomatie. Il ne peut pas renvoyer le Premier ministre.` };
  }
  if (gouvernement >= pol.majorite) {
    return { ...base, id: 'fait_majoritaire', nom: 'Fait majoritaire', texte: 'Le camp du président détient la majorité absolue : le président fixe les grandes orientations, le Premier ministre les met en œuvre. En pratique, un Premier ministre quitte Matignon quand le président le lui demande.' };
  }
  return { ...base, id: 'majorite_relative', nom: 'Majorité relative', texte: `Le Gouvernement ne compte que ${gouvernement} députés (${gouvernement + soutien} avec ses soutiens) pour une majorité absolue de ${pol.majorite} : il négocie texte par texte et reste exposé à la censure. Le président garde l'initiative, mais Matignon a plus de marge qu'en temps de fait majoritaire.` };
}

/** Qui occupe l'Élysée et Matignon. */
export function titulaires(e) {
  const pol = e.politique;
  const x = e.institutions;
  const elections = pol.presidentielles ?? [];
  const president = !elections.length
    ? { nom: e.role === 'president' ? 'Emmanuel Macron (vous)' : 'Emmanuel Macron', detail: 'Mandat jusqu\'en mai 2027 ; il ne peut pas se représenter.', joueur: e.role === 'president' }
    : { nom: e.role === 'president' ? 'Vous' : 'Un président issu de votre camp', detail: `Élu en ${elections.at(-1).annee} avec ${elections.at(-1).part.toFixed(1)} % au second tour.`, joueur: e.role === 'president' };
  let premierMinistre;
  if (x?.cohabitation) premierMinistre = { nom: x.cohabitation.premierMinistre, detail: `${x.cohabitation.etiquette} · Premier ministre de cohabitation depuis le tour ${x.cohabitation.depuis}.`, joueur: false };
  else if (e.role === 'president') {
    const p = pol.premierMinistre?.profil ?? 'camp';
    premierMinistre = { nom: p === 'camp' && !pol.nominations && !x?.demissions ? 'Sébastien Lecornu' : PROFILS_PREMIER_MINISTRE[p].nom, detail: PROFILS_PREMIER_MINISTRE[p].description, joueur: false };
  } else {
    premierMinistre = { nom: pol.gouvernementsRenverses ? 'Vous (nouveau gouvernement de votre camp)' : 'Sébastien Lecornu (vous)', detail: 'Gouvernement Lecornu II depuis octobre 2025.', joueur: true };
  }
  return { president, premierMinistre };
}

// ---------------------------------------------------------------------------
// Élysée et Matignon : entente
// ---------------------------------------------------------------------------

/** Avis d'un groupe sur une réforme (−1 à +1) : position déclarée, à défaut proximité des axes. */
function avis(e, def, option, groupe) {
  const p = def.positionsGroupesParOption?.[option]?.[groupe] ?? def.positionsGroupes?.[groupe];
  if (p !== undefined) return p;
  const g = e.politique.groupes.find((x) => x.id === groupe);
  if (!g) return 0;
  const axes = { ...(def.axes ?? {}), ...(def.axesParOption?.[option] ?? {}) };
  let s = 0;
  for (const [a, v] of Object.entries(axes)) s += v * (g.axes[a] ?? 0);
  return borner(s, -1, 1);
}

/**
 * Priorités de l'Élysée (quand le joueur est Premier ministre) : celles
 * d'Emmanuel Macron jusqu'à la présidentielle de 2027, puis les réformes que
 * le camp présidentiel soutient le plus et qui ne sont pas encore en vigueur.
 */
export function prioritesElysee(e) {
  if (!actif(e) || e.role === 'president' || e.institutions.cohabitation) return [];
  const actives = new Set(e.reformes.actives.map((a) => a.id));
  const nom = (id) => trouverReforme(id)?.nom ?? id;
  if (!(e.politique.presidentielles ?? []).length) return PRIORITES_ELYSEE_2027.filter((id) => !actives.has(id) && trouverReforme(id)).map((id) => ({ id, nom: nom(id) }));
  return REFORMES
    .filter((r) => (r.pays === 'tous' || r.pays.includes('france')) && !actives.has(r.id) && !r.majoriteRenforcee && !(r.unique && e.reformes.historique.some((h) => h.id === r.id)))
    .map((r) => ({ id: r.id, nom: r.nom, score: Math.max(...r.options.map((o) => avis(e, r, o.id, 'EPR'))) }))
    .filter((r) => r.score >= 0.5)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 3)
    .map(({ id, nom: n }) => ({ id, nom: n }));
}

/** Réaction de l'Élysée (ou de Matignon) aux réformes adoptées ce trimestre. */
export function reactionAuxReformes(e, adoptees) {
  if (!actif(e) || e.institutions.cohabitation || !adoptees.length) return;
  const x = e.institutions;
  const priorites = new Set(prioritesElysee(e).map((p) => p.id));
  for (const r of adoptees) {
    const def = trouverReforme(r.id);
    if (!def) continue;
    let d = 0;
    if (e.role === 'president') {
      const proxy = PROXY_PM[e.politique.premierMinistre?.profil ?? 'camp'];
      if (proxy) d = borner(5 * avis(e, def, r.option, proxy), -6, 3);
    } else {
      d = priorites.has(r.id) ? 6 : borner(5 * avis(e, def, r.option, 'EPR'), -6, 3);
    }
    x.entente = borner(x.entente + d, 0, 100);
  }
}

/** Le président accepte-t-il une demande de Matignon (dissolution, référendum) ? */
export function accordPresident(e, objet) {
  if (!actif(e) || e.role === 'president') return { accord: true };
  const x = e.institutions;
  if (x.entente < 40) return { accord: false, raison: `Le président de la République refuse ${objet === 'dissolution' ? 'de dissoudre l\'Assemblée' : 'de soumettre ce texte au référendum'} : l'entente avec Matignon est trop dégradée (${Math.round(x.entente)}/100). La décision lui appartient (article ${objet === 'dissolution' ? '12' : '11'}).` };
  return { accord: true };
}

/** Le Gouvernement propose-t-il le référendum voulu par le président (article 11) ? */
export function propositionGouvernement(e) {
  if (!actif(e) || e.role !== 'president') return { accord: true };
  const x = e.institutions;
  if (x.cohabitation) return { accord: false, raison: 'Cohabitation : le référendum de l\'article 11 exige une proposition du Gouvernement, que le Premier ministre refuse de faire.' };
  if (x.entente < 30) return { accord: false, raison: `Le Premier ministre refuse de proposer ce référendum (article 11 : sur proposition du Gouvernement) ; votre entente est au plus bas (${Math.round(x.entente)}/100).` };
  return { accord: true };
}

/** Message au Parlement réuni en Congrès (article 18) : une fois par an. */
export function messageCongres(e) {
  const x = e.institutions;
  if (x.congres.includes(e.trimestre.annee)) return { erreur: 'Vous vous êtes déjà adressé au Congrès cette année.' };
  x.congres.push(e.trimestre.annee);
  x.entente = borner(x.entente + (x.cohabitation ? 3 : 8), 0, 100);
  e.politique.chocInstabilite = (e.politique.chocInstabilite ?? 0) - 0.03;
  appliquerChocs(e, { retraites: 1, salaries: 0.5, entrepreneurs: 0.5, fonctionnaires: 0.3 });
  const texte = `Institutions — Vous vous exprimez devant le Parlement réuni en Congrès à Versailles (article 18). Le discours fixe un cap ; il est suivi d'un débat, hors de votre présence et sans vote.${x.cohabitation ? ' En cohabitation, il rappelle surtout vos prérogatives.' : ''}`;
  journal(e, texte);
  return { texte };
}

/**
 * Question de confiance (article 49, alinéa 1) : la confiance est refusée si
 * la majorité des suffrages exprimés s'y oppose ; le Gouvernement doit alors
 * démissionner (article 50).
 */
export function questionConfiance(e) {
  const x = e.institutions;
  const pol = e.politique;
  const s = session(e);
  if (x.confiance[s]) return { erreur: 'Vous avez déjà engagé la responsabilité du Gouvernement sur votre programme lors de cette session.' };
  const v = voter(e, pol.positions, {});
  const accordee = v.pour > v.contre;
  x.confiance[s] = { tour: e.tour, pour: v.pour, contre: v.contre, abstention: v.abstention, accordee };
  pol.votes.push({ tour: e.tour, texte: 'Question de confiance (49.1)', pour: v.pour, contre: v.contre, abstention: v.abstention, adopte: accordee });
  if (accordee) {
    pol.graceJusqua = Math.max(pol.graceJusqua ?? 0, e.tour + 2);
    pol.chocInstabilite = (pol.chocInstabilite ?? 0) - 0.05;
    e.finances.credibilite = borner(e.finances.credibilite + 0.02, -1, 1);
    x.entente = borner(x.entente + 5, 0, 100);
    journal(e, `Institutions — Article 49, alinéa 1 : l'Assemblée accorde sa confiance au Gouvernement (${v.pour} pour, ${v.contre} contre, ${v.abstention} abstentions). La menace de censure s'éloigne pour un temps.`);
  } else {
    journal(e, `Institutions — Article 49, alinéa 1 : la confiance est refusée (${v.pour} pour, ${v.contre} contre). Le Premier ministre doit remettre la démission du Gouvernement (article 50).`, 'alerte');
  }
  return { accordee, pour: v.pour, contre: v.contre, abstention: v.abstention };
}

/** Démission d'un Premier ministre nommé par le joueur, en désaccord avec l'Élysée. */
function demissionPremierMinistre(e) {
  const x = e.institutions;
  const pol = e.politique;
  x.demissions += 1;
  pol.premierMinistre = { profil: pol.premierMinistre?.profil ?? 'camp', depuis: e.tour };
  pol.graceJusqua = e.tour + 1;
  pol.chocInstabilite = (pol.chocInstabilite ?? 0) + 0.04;
  e.finances.credibilite = borner(e.finances.credibilite - 0.01, -1, 1);
  x.entente = 60;
  const texte = 'Institutions — En désaccord avec vos choix, le Premier ministre remet la démission de son gouvernement. Vous nommez un successeur de même sensibilité ; vous pouvez changer de profil dans l\'onglet Parlement.';
  journal(e, texte, 'alerte');
  return texte;
}

// ---------------------------------------------------------------------------
// Sénat
// ---------------------------------------------------------------------------

/**
 * Vote d'un texte au Sénat. Chaque groupe suit les positions du ou des
 * groupes de l'Assemblée qui lui correspondent, corrigées des préférences
 * propres au Sénat (collectivités, bicamérisme) et de sa relation avec le
 * Gouvernement.
 */
export function voteSenatTexte(e, reformes) {
  if (!actif(e) || !reformes.length) return null;
  const x = e.institutions;
  const contenu = contenuTexte(reformes);
  const biais = reformes.reduce((s, r) => s + (BIAIS_SENAT[r.id] ?? 0), 0);
  const relation = 0.006 * ((x.senat.relation ?? 50) - 50);
  let pour = 0, contre = 0, abstention = 0;
  const detail = [];
  for (const sg of x.senat.groupes) {
    let sat = 0, poids = 0;
    for (const [id, w] of Object.entries(sg.proxies ?? {})) {
      const g = e.politique.groupes.find((y) => y.id === id);
      if (!g) continue;
      sat += w * satisfactionTexte(e, g, contenu);
      poids += w;
    }
    sat = poids ? sat / poids + biais + relation : 0;
    const vote = !poids ? 'abstention' : sat > 0.25 ? 'pour' : sat < -0.25 ? 'contre' : 'abstention';
    if (vote === 'pour') pour += sg.sieges; else if (vote === 'contre') contre += sg.sieges; else abstention += sg.sieges;
    detail.push({ id: sg.id, nom: sg.court, sieges: sg.sieges, vote, satisfaction: sat });
  }
  return { adopte: pour > contre, pour, contre, abstention, detail };
}

/**
 * Navette d'un texte adopté par l'Assemblée (procédure accélérée) : accord du
 * Sénat, ou échec de la commission mixte paritaire et dernier mot de
 * l'Assemblée. Les lois organiques relatives au Sénat exigent son accord.
 * @returns {object|null} { senat, issue: 'accord'|'dernier_mot'|'bloque', texte, bloquees }
 */
export function navette(e, reformes) {
  if (!actif(e) || !reformes.length) return null;
  const x = e.institutions;
  const s = voteSenatTexte(e, reformes);
  const requis = reformes.filter((r) => ACCORD_SENAT_REQUIS.includes(r.id));
  let issue, texte;
  if (s.adopte) {
    issue = 'accord';
    x.senat.relation = borner(x.senat.relation + 1, 0, 100);
    texte = `Sénat : ${s.pour} pour, ${s.contre} contre. La commission mixte paritaire aboutit : le texte est adopté dans les mêmes termes par les deux assemblées.`;
  } else if (requis.length) {
    issue = 'bloque';
    texte = `Sénat : ${s.pour} pour, ${s.contre} contre. Une loi organique relative au Sénat doit être votée dans les mêmes termes par les deux assemblées (article 46) : ${requis.map((r) => trouverReforme(r.id)?.nom ?? r.id).join(', ')} est bloquée.`;
  } else {
    issue = 'dernier_mot';
    x.senat.relation = borner(x.senat.relation - 3, 0, 100);
    texte = `Sénat : ${s.pour} pour, ${s.contre} contre. La commission mixte paritaire échoue ; après une nouvelle lecture, l'Assemblée nationale statue définitivement (article 45).`;
  }
  x.navettes = [...x.navettes, { tour: e.tour, textes: reformes.map((r) => trouverReforme(r.id)?.nom ?? r.id), pour: s.pour, contre: s.contre, abstention: s.abstention, issue }].slice(-8);
  journal(e, `Navette — ${texte}`);
  return { senat: s, issue, texte, bloquees: issue === 'bloque' ? requis : [] };
}

/**
 * Révision de la Constitution (article 89) : vote dans les mêmes termes par
 * les deux assemblées, puis approbation par le Congrès à la majorité des
 * trois cinquièmes des suffrages exprimés.
 */
export function revisionConstitutionnelle(e, reformes) {
  const an = voterTexte(e, reformes);
  const senat = voteSenatTexte(e, reformes);
  const pour = an.pour + senat.pour;
  const exprimes = an.pour + an.contre + senat.pour + senat.contre;
  const requis = Math.ceil(0.6 * exprimes);
  let raison = null;
  if (!an.adopte) raison = `L'Assemblée nationale rejette le projet de révision (${an.pour} pour, ${an.contre} contre).`;
  else if (!senat.adopte) raison = `Le Sénat rejette le projet de révision (${senat.pour} pour, ${senat.contre} contre) : sans vote conforme des deux assemblées, pas de révision (article 89).`;
  else if (pour < requis) raison = `Congrès : ${pour} voix sur ${exprimes} suffrages exprimés, il en faut ${requis} (trois cinquièmes).`;
  if (e.institutions && senat.adopte) e.institutions.senat.relation = borner(e.institutions.senat.relation + 1, 0, 100);
  return { adopte: !raison, raison, an, senat, congres: { pour, exprimes, requis } };
}

/** Renouvellement de la moitié du Sénat (septembre, tous les trois ans) : les grands électeurs suivent l'implantation locale des partis. */
function renouvelerSenat(e) {
  const x = e.institutions;
  const i = intentionsCourantes(e);
  const ref = x.senat.reference ?? i;
  // Prime aux sortants locaux (hypothèse, comme aux municipales)
  const local = (o) => ({ ...o, LR: (o.LR ?? 0) + 6, gauche: (o.gauche ?? 0) + 5, ecolos: (o.ecolos ?? 0) + 2, RN: Math.max(0.5, (o.RN ?? 0) - 6) });
  const li = local(i), lr = local(ref);
  for (const g of x.senat.groupes) {
    const f = FAMILLE_SENAT[g.id];
    if (!f || !lr[f]) continue;
    const ratio = borner(li[f] / lr[f], 0.4, 2);
    g.sieges = Math.max(0, Math.round(g.sieges * (1 + 0.4 * (ratio - 1))));
  }
  const ecart = SIEGES_SENAT - x.senat.groupes.reduce((s, g) => s + g.sieges, 0);
  const plusGrand = [...x.senat.groupes].sort((a, b) => b.sieges - a.sieges)[0];
  plusGrand.sieges += ecart;
  x.senat.reference = { ...i };
  const n = (id) => x.senat.groupes.find((g) => g.id === id)?.sieges ?? 0;
  const droiteCentre = n('LR') + n('UC');
  const gauche = n('SER') + n('CRCE') + n('GEST');
  x.senat.president = droiteCentre >= 175 ? 'Président issu de la majorité de droite et du centre' : gauche >= 175 ? 'Président issu de la gauche sénatoriale' : 'Président élu sans majorité absolue d\'un camp';
  x.senat.renouvellements.push({ annee: e.trimestre.annee, LR: n('LR'), UC: n('UC'), SER: n('SER'), UNT: n('UNT') });
  journal(e, `Sénatoriales ${e.trimestre.annee} : la moitié du Sénat est renouvelée par les grands électeurs (élus locaux). LR ${n('LR')}, Union centriste ${n('UC')}, socialistes ${n('SER')}, RN-UDR ${n('UNT')} sièges. ${droiteCentre >= 175 ? 'La droite et le centre gardent la majorité sénatoriale.' : 'La droite et le centre perdent la majorité sénatoriale.'}`, 'election');
}

// ---------------------------------------------------------------------------
// Cohabitation
// ---------------------------------------------------------------------------

function demarrerCohabitation(e, bloc) {
  const gouv = GOUVERNEMENTS_COHABITATION[bloc];
  const pol = e.politique;
  const x = e.institutions;
  for (const g of pol.groupes) {
    g.posture = gouv.groupes.includes(g.id) ? 'gouvernement' : g.id === 'LIOT' ? 'pivot' : 'opposition';
    g.concessions = 0;
  }
  x.cohabitation = { bloc, premierMinistre: gouv.nom, etiquette: gouv.etiquette, depuis: e.tour, index: 0, texte: null, adoptes: [] };
  x.entente = 30;
  pol.graceJusqua = e.tour + 2;
  journal(e, `Cohabitation — ${gouv.etiquette} obtient la majorité absolue : vous devez nommer un Premier ministre issu de cette majorité (${gouv.nom}). Le Gouvernement détermine et conduit désormais la politique de la nation (article 20) ; vous gardez vos pouvoirs propres, la défense et la diplomatie.`, 'election');
  calculerPositions(e);
  majSatisfactions(e);
  preparerTexte(e);
}

function finCohabitation(e, raison) {
  const pol = e.politique;
  const x = e.institutions;
  for (const g of pol.groupes) { g.posture = g.postureInitiale ?? g.posture; g.concessions = 0; }
  pol.premierMinistre = { profil: 'camp', depuis: e.tour };
  x.historique.push({ type: 'cohabitation', bloc: x.cohabitation.bloc, debut: x.cohabitation.depuis, fin: e.tour, adoptes: x.cohabitation.adoptes.length });
  x.cohabitation = null;
  x.entente = ENTENTE_PROFIL.camp;
  journal(e, `Fin de la cohabitation : ${raison} Vous nommez un Premier ministre issu de votre camp.`, 'election');
  calculerPositions(e);
  majSatisfactions(e);
}

/** Prochain projet de loi du gouvernement de cohabitation (déposé pour le trimestre suivant). */
function preparerTexte(e) {
  const c = e.institutions.cohabitation;
  const gouv = GOUVERNEMENTS_COHABITATION[c.bloc];
  while (c.index < gouv.mesures.length) {
    const m = gouv.mesures[c.index];
    const def = trouverReforme(m.reforme);
    const active = e.reformes.actives.find((a) => a.id === m.reforme);
    if (def && (def.pays === 'tous' || def.pays.includes('france')) && active?.option !== m.option && !def.majoriteRenforcee && def.options.some((o) => o.id === m.option)) {
      c.texte = { reforme: m.reforme, option: m.option, nom: def.nom, option_nom: def.options.find((o) => o.id === m.option).nom, ordonnances: !!m.ordonnances, depuis: e.tour };
      return;
    }
    c.index += 1;
  }
  c.texte = null;
}

/**
 * Après des élections législatives : une majorité absolue opposée au
 * président impose la cohabitation. Joueur président : la partie continue en
 * cohabitation. Joueur Premier ministre : il quitte Matignon.
 * @returns {object} { defaite? }
 */
export function apresLegislatives(e) {
  if (!actif(e)) return {};
  const pol = e.politique;
  const x = e.institutions;
  const central = siegesDe(e, BLOC_CENTRAL);
  const opposant = Object.keys(BLOCS_OPPOSES).find((b) => siegesDe(e, BLOCS_OPPOSES[b]) >= pol.majorite);
  if (opposant && central < pol.majorite) {
    if (e.role === 'president') {
      if (x.cohabitation?.bloc !== opposant) demarrerCohabitation(e, opposant);
      return {};
    }
    const gouv = GOUVERNEMENTS_COHABITATION[opposant];
    return { defaite: { cause: 'cohabitation', texte: `${gouv.etiquette} obtient la majorité absolue à l'Assemblée : le président doit nommer un Premier ministre issu de cette majorité. Vous quittez Matignon ; une cohabitation commence.` } };
  }
  if (x.cohabitation) finCohabitation(e, 'aucune majorité absolue ne s\'oppose plus au président.');
  return {};
}

/**
 * Trimestre de cohabitation : le Gouvernement fait voter le texte déposé, et
 * le président (joueur) répond.
 * @param {string} reponse 'promulguer' | 'nouvelle_deliberation' (article 10) | 'saisir' (article 61) | 'refuser_signature' (article 13, ordonnances)
 */
export function gouvernementCohabitation(e, reponse = 'promulguer') {
  if (!cohabitationJoueur(e)) return null;
  const x = e.institutions;
  const c = x.cohabitation;
  const t = c.texte;
  if (!t) { preparerTexte(e); return null; }
  const def = trouverReforme(t.reforme);
  if (reponse === 'refuser_signature' && t.ordonnances && !t.reporte) {
    t.ordonnances = false; t.reporte = true;
    x.entente = borner(x.entente - 12, 0, 100);
    const texte = `Cohabitation — Vous refusez de signer les ordonnances « ${def.nom} » (article 13). Le Gouvernement doit déposer un projet de loi : un trimestre de retard.`;
    journal(e, texte);
    return { type: 'refus_signature', texte };
  }
  if (reponse === 'nouvelle_deliberation' && !t.deliberation && !t.ordonnances) {
    t.deliberation = true; t.reporte = true;
    x.entente = borner(x.entente - 6, 0, 100);
    const texte = `Cohabitation — Vous demandez au Parlement une nouvelle délibération de « ${def.nom} » (article 10) ; elle ne peut être refusée. Le texte reviendra au prochain trimestre.`;
    journal(e, texte);
    return { type: 'nouvelle_deliberation', texte };
  }
  const al = aleaInst(e, 11);
  const validation = validerReformes(e, [{ id: t.reforme, option: t.option }], 'vote');
  let res;
  if (!validation.acceptees.length) {
    res = { type: 'rejet', texte: `Cohabitation — Le projet du Gouvernement « ${def.nom} » est rejeté par le Parlement.` };
  } else {
    const saisine = reponse === 'saisir';
    if (saisine) { x.entente = borner(x.entente - 4, 0, 100); e.finances.credibilite = borner(e.finances.credibilite + 0.005, -1, 1); }
    const controle = controleConstitutionnel(e, t.reforme, t.option, def.nom, al, { saisinePresident: saisine });
    if (controle.decision === 'totale') {
      res = { type: 'censure', texte: `Cohabitation — « ${def.nom} » est censurée par le Conseil constitutionnel${saisine ? ', que vous aviez saisi' : ''}.` };
    } else {
      adopterReforme(e, t.reforme, t.option, al, controle.facteur);
      // L'opinion impute surtout au Gouvernement les mesures de cohabitation
      const reaction = def.reaction?.(e, t.option) ?? {};
      if (reaction.chocs) appliquerChocs(e, Object.fromEntries(Object.entries(reaction.chocs).map(([g, v]) => [g, -0.5 * v])));
      c.adoptes.push({ tour: e.tour, reforme: t.reforme, option: t.option, nom: def.nom });
      res = { type: 'adoption', texte: `Cohabitation — Le Gouvernement fait adopter « ${def.nom} » (${t.option_nom.charAt(0).toLowerCase()}${t.option_nom.slice(1)})${saisine ? ' ; vous avez saisi le Conseil constitutionnel (article 61)' : ''}${controle.decision === 'partielle' ? ', partiellement censurée' : ''}.` };
    }
  }
  journal(e, res.texte);
  c.index += 1;
  preparerTexte(e);
  return res;
}

// ---------------------------------------------------------------------------
// Trimestre
// ---------------------------------------------------------------------------

/**
 * Mise à jour trimestrielle : décisions institutionnelles du joueur, entente,
 * désaccords, renouvellement du Sénat. Appelée avant la vie politique du
 * trimestre (censure, dissolution, élections).
 * @returns {object} { defaite?, congres?, confiance?, alertes: [] }
 */
export function majInstitutions(e, decisions = {}) {
  if (!actif(e)) return { alertes: [] };
  const x = e.institutions;
  const res = { alertes: [] };
  if (decisions.congres && e.role === 'president') res.congres = messageCongres(e);
  if (decisions.questionConfiance && e.role !== 'president') {
    res.confiance = questionConfiance(e);
    if (res.confiance.accordee === false) res.defaite = { cause: 'censure', texte: 'La confiance a été refusée (article 49, alinéa 1) : le Gouvernement doit démissionner.' };
  }
  // L'entente revient lentement vers son niveau habituel
  const cible = x.cohabitation ? 30 : 60;
  x.entente = borner(x.entente + 0.15 * (cible - x.entente), 0, 100);
  x.senat.relation = borner(x.senat.relation + 0.1 * (50 - x.senat.relation), 0, 100);
  // Un président de cohabitation est épargné par l'usure du pouvoir (Mitterrand en 1988, Chirac en 2002 ont été réélus)
  if (x.cohabitation && e.role === 'president') appliquerChocs(e, Object.fromEntries(Object.keys(e.social.groupes).map((g) => [g, 0.3])));
  // Désaccord persistant entre l'Élysée et Matignon
  if (!x.cohabitation && !res.defaite && x.entente < 20) {
    const al = aleaInst(e, 5);
    if (e.role === 'president') {
      if (al.tirage(0.25)) res.alertes.push({ type: 'demission', texte: demissionPremierMinistre(e) });
    } else if (al.tirage(configuration(e).id === 'fait_majoritaire' ? 0.3 : 0.15)) {
      journal(e, 'Institutions — Le président de la République vous demande de remettre la démission du Gouvernement : la confiance entre l\'Élysée et Matignon est rompue.', 'alerte');
      res.defaite = { cause: 'demission', texte: 'Le président de la République vous a demandé votre démission : l\'entente entre l\'Élysée et Matignon était rompue.' };
    }
  }
  if (!x.cohabitation && !res.defaite && x.entente < 30) {
    res.alertes.push({ type: 'entente', texte: e.role === 'president'
      ? `Entente avec Matignon au plus bas (${Math.round(x.entente)}/100) : le Premier ministre pourrait démissionner.`
      : `Entente avec l'Élysée au plus bas (${Math.round(x.entente)}/100) : le président pourrait vous demander votre démission.` });
  }
  if (e.trimestre.t === 3 && e.trimestre.annee > 2026 && (e.trimestre.annee - 2026) % 3 === 0) renouvelerSenat(e);
  return res;
}

/** Prochains renouvellements (pour l'interface). */
function prochainRenouvellement(annee, depart, pas) {
  let a = depart;
  while (a < annee) a += pas;
  return a;
}

/** Résumé pour l'interface. */
export function resumeInstitutions(e) {
  if (!actif(e)) return null;
  const x = e.institutions;
  const pol = e.politique;
  const conf = configuration(e);
  const ecartDissolution = (e.trimestre.annee - pol.derniereDissolution.annee) * 4 + (e.trimestre.t - pol.derniereDissolution.t);
  const n = (id) => x.senat.groupes.find((g) => g.id === id)?.sieges ?? 0;
  const annee = e.trimestre.annee;
  return {
    configuration: conf,
    titulaires: titulaires(e),
    entente: x.entente,
    priorites: prioritesElysee(e),
    cohabitation: x.cohabitation ? { ...x.cohabitation } : null,
    senat: {
      groupes: x.senat.groupes,
      relation: x.senat.relation,
      president: x.senat.president,
      majoriteDroiteCentre: n('LR') + n('UC'),
      prochainRenouvellement: prochainRenouvellement(annee + (e.trimestre.t > 3 ? 1 : 0), 2029, 3),
      navettes: x.navettes,
    },
    assemblee: {
      majorite: pol.majorite,
      sieges: pol.sieges,
      gouvernement: conf.gouvernement,
      soutien: conf.soutien,
      censeurs: pol.siegesCenseurs ?? null,
    },
    conseil: { severite: x.conseil.severite, prochainRenouvellement: prochainRenouvellement(annee + (e.trimestre.t > 1 ? 1 : 0), 2028, 3), nominations: x.conseil.nominations },
    disponibles: {
      congres: e.role === 'president' && !x.congres.includes(annee),
      confiance: e.role !== 'president' && !x.cohabitation && !x.confiance[session(e)],
      dissolution: ecartDissolution >= 4,
      moisAvantDissolution: Math.max(0, 4 - ecartDissolution) * 3,
    },
    confiance: Object.values(x.confiance).at(-1) ?? null,
    previsionConfiance: e.role !== 'president' && !x.cohabitation ? (() => { const v = voter(e, pol.positions, {}); return { pour: v.pour, contre: v.contre, abstention: v.abstention, accordee: v.pour > v.contre }; })() : null,
    article16: x.article16 ?? null,
    historique: x.historique,
  };
}

// ---------------------------------------------------------------------------
// Événements institutionnels
// ---------------------------------------------------------------------------

/**
 * Après le tirage des événements du trimestre suivant : nominations au
 * Conseil constitutionnel (mars, tous les trois ans), demande de grâce
 * (président), crise extrême (article 16, une fois par partie au plus).
 */
export function injecterEvenementsInstitutions(e, max = 3) {
  if (!actif(e)) return;
  const x = e.institutions;
  const pousser = (id) => {
    const def = EVENEMENTS_INSTITUTIONS.find((d) => d.id === id);
    e.evenements.enAttente.push({ id: def.id, titre: def.titre, description: def.description(e), choix: def.choix.map((c) => ({ id: c.id, texte: c.texte })), tour: e.tour, institutionnel: true });
  };
  const annee = e.trimestre.annee;
  if (e.trimestre.t === 1 && annee >= 2028 && (annee - 2028) % 3 === 0 && !x.conseil.nominations.some((n) => n.annee === annee)) {
    x.conseil.nominations.push({ annee });
    if (e.role === 'president') pousser('nominations_conseil');
    else journal(e, 'Conseil constitutionnel : le président de la République et les présidents des deux assemblées nomment chacun un nouveau membre pour neuf ans (article 56).');
  }
  if (e.evenements.enAttente.length >= max + 1) return;
  const al = aleaInst(e, 23);
  if (e.role === 'president' && (x.derniereGrace ?? -99) < e.tour - 12 && al.tirage(0.03)) {
    x.derniereGrace = e.tour;
    pousser('demande_grace');
    return;
  }
  if (!x.crise16 && al.tirage(0.002)) {
    x.crise16 = e.tour;
    pousser('crise_article16');
  }
}
