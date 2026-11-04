/**
 * Chantiers des grands événements : attribution des lots aux entreprises,
 * coûts publics étalés jusqu'au jour J, aléas (retards, surcoûts) et qualité
 * d'ensemble, qui pèse sur la réussite de l'événement.
 */
import { CHANTIERS } from '../data/chantiers.js';
import { FLEURONS } from '../data/entreprises.js';
import { appliquerEffetsEntreprise } from './entreprises.js';
import { appliquerChocs } from './social.js';
import { libelleTrimestre } from './calendrier.js';

const rang = (x) => x.annee * 4 + x.t;

function etat(e, id) {
  e.chantiers ??= {};
  return (e.chantiers[id] ??= { lots: {}, incidents: 0, bilan: null });
}

/** Chantiers du pays, actifs (condition remplie) et pas encore terminés. */
export function chantiersActifs(e) {
  const maintenant = rang(e.trimestre);
  return CHANTIERS.filter((c) => c.pays === e.pays && (!c.condition || c.condition(e)) && maintenant <= rang(c.jourJ));
}

/** Nom affiché d'une offre (entreprise du catalogue ou concurrent). */
const definitionEntreprise = (e, id) => (FLEURONS[e.pays] ?? []).find((f) => f.id === id);
function nomOffre(e, o) {
  if (!o.entreprise) return o.nom;
  return definitionEntreprise(e, o.entreprise)?.nom ?? o.entreprise;
}

/**
 * Attribue un lot à une offre.
 * @returns {object} { texte } ou { erreur }
 */
export function attribuerLot(e, chantierId, lotId, indexOffre, nomEntreprise = null) {
  const c = CHANTIERS.find((x) => x.id === chantierId);
  if (!c || c.pays !== e.pays || (c.condition && !c.condition(e))) return { erreur: 'Chantier indisponible.' };
  const lot = c.lots.find((l) => l.id === lotId);
  const o = lot?.offres[indexOffre];
  if (!o) return { erreur: 'Offre inconnue.' };
  const s = etat(e, chantierId);
  if (s.lots[lotId]) return { erreur: 'Lot déjà attribué.' };
  const maintenant = rang(e.trimestre);
  if (maintenant > rang(c.dateLimite)) return { erreur: 'Date limite dépassée.' };
  // Coût public étalé jusqu'au jour J (rythme annuel)
  const cout = lot.montant * o.prix;
  const trimestres = Math.max(1, rang(c.jourJ) - maintenant + 1);
  e.depensesTemporaires.push({ poste: lot.poste, valeur: cout * 4 / trimestres, fin: e.tour + trimestres, source: `chantier:${chantierId}:${lotId}` });
  s.lots[lotId] = { offre: indexOffre, tour: e.tour, cout };
  // Effets : carnet de commandes de l'entreprise, souveraineté, emplois locaux
  if (o.entreprise) {
    appliquerEffetsEntreprise(e, { entreprise: { id: o.entreprise, valeur: Math.min(6, 1 + cout * 4), relation: 6 }, souverainete: 0.5 });
  } else {
    appliquerEffetsEntreprise(e, { souverainete: -1 });
  }
  if (o.local >= 0.75) appliquerChocs(e, { entrepreneurs: 0.5 * o.local, salaries: 0.3 * o.local });
  const nom = nomEntreprise ?? nomOffre(e, o);
  const texte = `${c.nom} — lot « ${lot.nom} » attribué à ${nom} (${(cout * 1000).toFixed(0)} M d'argent public).`;
  e.journal.push({ tour: e.tour, trimestre: libelleTrimestre(e.trimestre), type: 'politique', texte });
  return { texte };
}

/** Qualité d'ensemble d'un chantier (0 à 1), pondérée par les montants, moins les incidents. */
export function qualiteChantier(e, id) {
  const c = CHANTIERS.find((x) => x.id === id);
  const s = e.chantiers?.[id];
  if (!c || !s) return null;
  let somme = 0, poids = 0;
  for (const lot of c.lots) {
    const a = s.lots[lot.id];
    if (!a) continue;
    somme += lot.offres[a.offre].qualite * lot.montant;
    poids += lot.montant;
  }
  if (!poids) return null;
  return Math.max(0, somme / poids - 0.05 * s.incidents);
}

/**
 * Chaque trimestre : aléas des chantiers en cours, puis attribution d'office
 * (offre la moins chère) des lots oubliés à la date limite.
 */
export function majChantiers(e, alea) {
  const lib = libelleTrimestre(e.trimestre);
  const maintenant = rang(e.trimestre);
  for (const c of chantiersActifs(e)) {
    const s = etat(e, c.id);
    for (const lot of c.lots) {
      const a = s.lots[lot.id];
      if (a && alea && maintenant < rang(c.jourJ)) {
        const o = lot.offres[a.offre];
        if (alea.tirage(o.retard * 0.12)) {
          const surcout = a.cout * 0.1;
          s.incidents += 1;
          e.depensesTemporaires.push({ poste: lot.poste, valeur: surcout * 4, fin: e.tour + 1, source: `chantier:${c.id}:${lot.id}:surcout` });
          e.journal.push({ tour: e.tour, trimestre: lib, type: 'alerte', texte: `${c.nom} — retard sur le lot « ${lot.nom} » : surcoût d'environ ${(surcout * 1000).toFixed(0)} M.` });
        }
      }
      if (!a && maintenant === rang(c.dateLimite)) {
        const i = lot.offres.reduce((m, o, k, l) => (o.prix < l[m].prix ? k : m), 0);
        const r = attribuerLot(e, c.id, lot.id, i);
        if (r.texte) e.journal.push({ tour: e.tour, trimestre: lib, type: 'alerte', texte: `Faute de décision, l'organisateur retient l'offre la moins chère pour le lot « ${lot.nom} ».` });
      }
    }
    // Sommet sans événement dédié : bilan au jour J
    if (!c.evenement && maintenant === rang(c.jourJ) && !s.bilan) {
      const q = qualiteChantier(e, c.id) ?? 0.7;
      const ok = alea ? alea.tirage(Math.min(0.95, 0.55 + (q - 0.7) * 2)) : true;
      s.bilan = { reussite: ok, qualite: q };
      e.international.bonusInfluence += ok ? 2 : -1;
      e.journal.push({ tour: e.tour, trimestre: lib, type: ok ? 'reforme' : 'alerte', texte: ok ? `${c.nom} : organisation saluée par les délégations, la présidence française marque des points.` : `${c.nom} : incidents logistiques et de sécurité, la presse étrangère ironise.` });
    }
  }
}

/** Résumé pour l'interface. */
export function resumeChantiers(e) {
  return chantiersActifs(e).map((c) => {
    const s = e.chantiers?.[c.id] ?? { lots: {}, incidents: 0 };
    return {
      id: c.id, nom: c.nom, icone: c.icone, description: c.description, dateLimite: c.dateLimite, jourJ: c.jourJ,
      ouvert: rang(e.trimestre) <= rang(c.dateLimite), incidents: s.incidents, qualite: qualiteChantier(e, c.id),
      lots: c.lots.map((l) => {
        const offres = l.offres.map((o) => {
          const d = o.entreprise ? definitionEntreprise(e, o.entreprise) : null;
          return { ...o, nom: nomOffre(e, o), cac40: !!d?.cac40, cotee: d?.cotee ?? false, cout: l.montant * o.prix, francaise: !!o.entreprise };
        });
        const a = s.lots[l.id];
        return { ...l, offres, attribue: a ? { ...a, offre: offres[a.offre] } : null };
      }),
    };
  });
}
