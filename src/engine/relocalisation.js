/**
 * « Produire en France » : l'État demande aux grands groupes de produire en
 * France, avec un levier (persuasion, aide, commande publique, pression). Si
 * l'entreprise accepte, l'usine est construite en quelques trimestres, puis
 * apporte souveraineté, emplois et résilience face aux pénuries.
 *
 * Aléa séparé (dérivé de la graine et du tour) : le reste du jeu n'est pas modifié.
 */
import { DOSSIERS, LEVIERS, PENURIES } from '../data/relocalisations.js';
import { FLEURONS } from '../data/entreprises.js';
import { appliquerEffetsEntreprise } from './entreprises.js';
import { appliquerChocs } from './social.js';
import { creerAleatoire } from './aleatoire.js';
import { borner } from '../model/outils.js';
import { libelleTrimestre } from './calendrier.js';

const actif = (e) => e.pays === 'france';
const aleaReloc = (e, sel) => creerAleatoire(((e.graine ^ Math.imul(e.tour + 29, 3266489917)) + sel) >>> 0);
const nomEntreprise = (id) => FLEURONS.france.find((f) => f.id === id)?.nom ?? id;

export function initialiserRelocalisation(e) {
  e.relocalisation = actif(e) ? { dossiers: {}, resilience: {}, derniere: {} } : null;
}

/** Chances d'accord pour un levier : base du dossier, relation avec l'entreprise, climat des affaires. */
export function chances(e, dossier, levier) {
  const f = e.entreprises?.fleurons.find((x) => x.id === dossier.entreprise);
  const relation = f?.relation ?? 50;
  const climat = (e.entreprises?.climatAffaires ?? 100) - 100;
  const l = LEVIERS[levier];
  if (!l || (levier === 'commande' && !dossier.achatPublic)) return 0;
  return borner(dossier.base + l.bonus + 0.004 * (relation - 50) + 0.01 * climat, 0.05, 0.92);
}

/** Coût public d'un levier (Md€ au total) et durée (trimestres). */
export function coutLevier(dossier, levier) {
  if (levier === 'aide') return { total: 0.3 * dossier.investissement, duree: dossier.delai };
  if (levier === 'commande') return { total: Math.max(0.1, 0.25 * dossier.investissement), duree: 20 };
  return { total: 0, duree: 0 };
}

/**
 * Demande à une entreprise de produire en France.
 * @returns {object} { texte, accepte } ou { erreur }
 */
export function demanderProduction(e, id, levier) {
  if (!actif(e)) return { erreur: 'Disponible pour la France.' };
  if (!e.relocalisation) initialiserRelocalisation(e);
  const d = DOSSIERS.find((x) => x.id === id);
  if (!d || !LEVIERS[levier]) return { erreur: 'Demande inconnue.' };
  const s = e.relocalisation.dossiers[id];
  if (s && s.statut !== 'refuse') return { erreur: 'Demande déjà acceptée.' };
  if (s?.statut === 'refuse' && e.tour - s.tour < 4) return { erreur: 'L\'entreprise vient de refuser : attendez un an avant de revenir à la charge.' };
  const p = chances(e, d, levier);
  if (!p) return { erreur: 'Levier non adapté à ce dossier.' };
  const accepte = aleaReloc(e, d.id.length * 7 + levier.length).tirage(p);
  const nom = nomEntreprise(d.entreprise);
  const lib = libelleTrimestre(e.trimestre);
  // La pression a un prix, quelle que soit la réponse
  if (levier === 'contrainte') {
    appliquerEffetsEntreprise(e, { entreprise: { id: d.entreprise, relation: -15 }, climatAffaires: -1 });
    appliquerChocs(e, { salaries: 0.5 });
  }
  let texte;
  if (accepte) {
    const c = coutLevier(d, levier);
    if (c.total) e.depensesTemporaires.push({ poste: 'economieFinances', valeur: (c.total * 4) / c.duree, fin: e.tour + c.duree, source: `relocalisation:${id}` });
    e.relocalisation.dossiers[id] = { statut: 'chantier', tour: e.tour, fin: e.tour + d.delai, levier };
    if (e.entreprises) e.entreprises.engagements.push({ id: `relocalisation:${id}`, montant: d.investissement, debut: e.tour, fin: e.tour + d.delai });
    appliquerEffetsEntreprise(e, { entreprise: { id: d.entreprise, relation: levier === 'contrainte' ? 0 : 5 } });
    texte = `${nom} accepte : ${d.demande.charAt(0).toLowerCase()}${d.demande.slice(1)} Mise en service prévue dans ${d.delai} trimestre(s).`;
  } else {
    e.relocalisation.dossiers[id] = { statut: 'refuse', tour: e.tour, levier };
    appliquerEffetsEntreprise(e, { entreprise: { id: d.entreprise, relation: -3 } });
    texte = `${nom} refuse pour l'instant (chances estimées : ${Math.round(p * 100)} %) : coûts de production trop élevés en France. Vous pourrez revenir à la charge dans un an.`;
  }
  e.journal.push({ tour: e.tour, trimestre: lib, type: accepte ? 'reforme' : 'politique', texte: `Produire en France — ${texte}` });
  return { texte, accepte };
}

/** Trimestre : mises en service des usines. */
export function majRelocalisation(e) {
  if (!actif(e) || !e.relocalisation) return;
  for (const [id, s] of Object.entries(e.relocalisation.dossiers)) {
    if (s.statut !== 'chantier' || e.tour < s.fin) continue;
    const d = DOSSIERS.find((x) => x.id === id);
    s.statut = 'en_service';
    appliquerEffetsEntreprise(e, { souverainete: d.effets?.souverainete ?? 0, entreprise: { id: d.entreprise, emplois: 1 } });
    if (d.effets?.opinion) appliquerChocs(e, d.effets.opinion);
    if (d.resilience) e.relocalisation.resilience[d.resilience] = true;
    e.international.bonusInfluence += 0.5;
    e.journal.push({ tour: e.tour, trimestre: libelleTrimestre(e.trimestre), type: 'reforme', texte: `Produire en France — Inauguration : ${d.titre} (${nomEntreprise(d.entreprise)}), environ ${Math.round(d.emplois * 1000)} emplois.` });
  }
}

/** Après le tirage des événements : une pénurie peut survenir (rare, plus probable si les relations avec la Chine se dégradent). */
export function injecterPenuries(e, max = 3) {
  if (!actif(e) || !e.relocalisation || e.evenements.enAttente.length >= max + 1) return;
  const alea = aleaReloc(e, 101);
  const chine = e.international?.relations?.chine ?? 0;
  const tension = e.geopolitique?.tensions?.indo_pacifique ?? 50;
  const p = 0.03 + (chine < -30 ? 0.03 : 0) + (tension > 70 ? 0.03 : 0);
  if (!alea.tirage(p)) return;
  const candidates = PENURIES.filter((x) => (e.relocalisation.derniere[x.id] ?? -99) < e.tour - 8);
  if (!candidates.length) return;
  const x = candidates[Math.floor(alea.uniforme() * candidates.length)];
  e.relocalisation.derniere[x.id] = e.tour;
  e.evenements.enAttente.push({ id: x.id, titre: x.titre, description: x.description(e), choix: x.choix.map((c) => ({ id: c.id, texte: c.texte })), tour: e.tour, geopolitique: true });
}

/** Résumé pour l'interface. */
export function resumeRelocalisation(e) {
  if (!actif(e)) return null;
  const r = e.relocalisation ?? { dossiers: {}, resilience: {} };
  return DOSSIERS.map((d) => {
    const s = r.dossiers[d.id] ?? null;
    const f = FLEURONS.france.find((x) => x.id === d.entreprise);
    return {
      ...d, nomEntreprise: f?.nom ?? d.entreprise, cac40: !!f?.cac40, etat: s,
      peutDemander: !s || (s.statut === 'refuse' && e.tour - s.tour >= 4),
      leviers: Object.entries(LEVIERS).map(([id, l]) => ({ id, ...l, chances: chances(e, d, id), cout: coutLevier(d, id) })).filter((l) => l.chances > 0),
    };
  });
}
