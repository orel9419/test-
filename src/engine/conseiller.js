/**
 * Conseiller du chef de gouvernement : repère les urgences et les
 * opportunités du trimestre et propose une piste d'action, avec l'onglet où
 * agir. Il s'appuie sur les mêmes prévisions que l'interface (votes, censure).
 * Disponible en modes Facile et Intermédiaire.
 */
import { libelleTrimestre } from './calendrier.js';
import { projectionPresidentielle, projectionPresidentielleEtatsUnis } from './objectifs.js';
import { prochainSommet, peutNegocier } from './g7.js';
import { GROUPES } from '../model/ministeres.js';
import { resumeNotation } from './notation.js';
import { risqueConstitutionnel } from './constitution.js';
import { trouverReforme } from './reformes.js';

const NIVEAUX = { alerte: 3, attention: 2, idee: 1 };

function trimestresAvant(e, ech) {
  return (ech.annee - e.trimestre.annee) * 4 + (ech.t - e.trimestre.t);
}

/**
 * @param {object} e état de la partie
 * @param {object|null} prevision résultat de previsionPolitique (facultatif)
 * @returns {Array} conseils triés par urgence : { niveau, titre, texte, onglet }
 */
export function conseils(e, prevision = null, decisions = null) {
  const c = [];
  const f = e.finances, m = e.macro, pol = e.politique;
  const devise = e.statique.devise ?? '€';
  const tr = e.trimestre;

  // --- Budget à voter ce trimestre ----------------------------------------------------
  const trimestreBudget = e.pays === 'etatsUnis' ? (tr.t === 3 || e.tour === 1) : tr.t === 4;
  if (trimestreBudget && prevision?.budget) {
    const b = prevision.budget;
    const passe = e.pays === 'etatsUnis' ? b.adopte && (b.senat ?? 0) >= 60 : b.adopte;
    if (!passe) {
      const piste = { france: 'Un compromis avec les socialistes (onglet Parlement) ou le 49.3, au risque d\'une censure.', allemagne: 'Des concessions au SPD (compromis) ou des économies moins douloureuses pour ses électeurs.', etatsUnis: 'Une loi de financement provisoire (CR) ou un compromis avec les démocrates, sinon c\'est le shutdown.' }[e.pays];
      c.push({ niveau: 'alerte', titre: 'Le budget ne passe pas en l\'état', texte: `Prévision : ${b.pour} pour, ${b.contre} contre${b.senat !== null && b.senat !== undefined ? `, ${b.senat} sénateurs (60 nécessaires)` : ''}. ${piste}`, onglet: 'parlement' });
    } else {
      c.push({ niveau: 'idee', titre: 'Le budget devrait être adopté', texte: 'Vos arbitrages réunissent une majorité ce trimestre. Attention aux réformes qui pourraient la faire basculer.', onglet: 'parlement' });
    }
  }
  // --- Censure (France) ---------------------------------------------------------------
  if (e.pays === 'france' && prevision?.censure) {
    const { voix, majorite } = prevision.censure;
    if (voix >= majorite - 20) c.push({ niveau: voix >= majorite ? 'alerte' : 'attention', titre: 'Menace de censure', texte: `Une motion de censure réunirait environ ${voix} voix (${majorite} nécessaires). Ménagez le PS et LIOT, ou évitez le 49.3 ce trimestre.`, onglet: 'parlement' });
  }
  // --- Coalition (Allemagne) ----------------------------------------------------------
  if (pol.coalition && !pol.coalition.rompue && pol.coalition.satisfaction < 35) {
    c.push({ niveau: pol.coalition.satisfaction < 22 ? 'alerte' : 'attention', titre: 'Le SPD perd patience', texte: `Satisfaction du partenaire : ${Math.round(pol.coalition.satisfaction)}/100. Deux trimestres sous 20 et la coalition se rompt. Respectez l'accord de coalition (retraites à 48 %, investissements).`, onglet: 'parlement' });
  }
  // --- États-Unis : shutdown, plafond de la dette ----------------------------------
  if (pol.shutdown) c.push({ niveau: 'alerte', titre: 'Shutdown en cours', texte: `Les administrations non essentielles sont fermées depuis ${pol.shutdown.trimestres} trimestre(s) : environ −0,15 point de PIB par trimestre. Une loi de financement provisoire sera retentée.`, onglet: 'parlement' });
  if (f.margePlafond !== undefined && f.margePlafond < 900) {
    const reste = f.margePlafond / Math.max(1, f.deficit / 4);
    c.push({ niveau: f.margePlafond < 0 ? 'alerte' : 'attention', titre: 'Plafond de la dette', texte: f.margePlafond < 0 ? 'Le plafond est atteint : le Trésor vit de mesures exceptionnelles. Négociez avec le Congrès ou passez par la réconciliation.' : `Il reste ${Math.round(f.margePlafond)} Md$ avant le plafond, soit environ ${Math.max(0, reste).toFixed(1)} trimestre(s) de déficit.`, onglet: 'parlement' });
  }
  // --- Marchés -----------------------------------------------------------------------
  if (f.spread > 120 || f.crise) {
    c.push({ niveau: f.spread > 200 ? 'alerte' : 'attention', titre: 'Les marchés s\'inquiètent', texte: `Écart de taux : ${Math.round(f.spread)} points de base. Annoncer une trajectoire crédible de déficit (onglet Impôts et dette) et la tenir rassure les investisseurs.`, onglet: 'fiscalite' });
  }
  // --- Agences de notation ------------------------------------------------------------
  const notes = resumeNotation(e);
  for (const a of (notes?.agences ?? []).filter((x) => x.risque === 'degradation' && x.dans <= 1)) {
    c.push({ niveau: a.dans === 0 ? 'alerte' : 'attention', titre: `${a.nom} pourrait dégrader la note`, texte: `Note ${a.note}, perspective ${a.perspective === 'negative' ? 'négative' : a.perspective}, revue ${a.prochaineRevue}. Annoncer une trajectoire de déficit crédible (et la tenir), réduire le déficit ou éviter l'instabilité peut l'empêcher.`, onglet: 'fiscalite' });
  }
  // --- Réformes exposées à une censure constitutionnelle ----------------------------------
  for (const r of decisions?.reformes ?? []) {
    const rc = risqueConstitutionnel(e.pays, r.id, r.option);
    if (rc && rc.risque >= 0.3) c.push({ niveau: 'attention', titre: 'Risque de censure constitutionnelle', texte: `${trouverReforme(r.id)?.nom ?? r.id} : environ ${Math.round(rc.risque * 100)} % de risque de censure ${rc.type === 'totale' ? 'totale' : 'partielle'} par ${rc.juridiction === 'Conseil constitutionnel' ? 'le Conseil constitutionnel' : `la ${rc.juridiction}`}. ${rc.motif}`, onglet: 'reformes' });
  }
  // --- Élections proches --------------------------------------------------------------
  for (const ech of e.statique.calendrier.echeances ?? []) {
    const n = trimestresAvant(e, ech);
    if (n < 0 || n > 2) continue;
    if (ech.type === 'presidentielle') {
      const p = e.pays === 'etatsUnis' ? projectionPresidentielleEtatsUnis(e) : projectionPresidentielle(e);
      c.push({ niveau: p < 50 ? 'alerte' : 'attention', titre: `${ech.nom} ${n === 0 ? 'ce trimestre' : `dans ${n} trimestre(s)`}`, texte: `Projection pour votre camp : ${p.toFixed(1)} %. La popularité, le chômage et l'inflation pèsent le plus.`, onglet: 'opinion' });
    } else if (['legislatives', 'mi_mandat', 'regionales', 'landtag', 'europeennes'].includes(ech.type)) {
      c.push({ niveau: 'attention', titre: `${ech.nom} ${n === 0 ? 'ce trimestre' : `dans ${n} trimestre(s)`}`, texte: 'Le résultat découlera des intentions de vote du baromètre : évitez les mesures impopulaires juste avant le scrutin.', onglet: 'opinion' });
    }
  }
  // --- Climat social ------------------------------------------------------------------
  const groupes = Object.entries(e.social.groupes);
  const pire = groupes.sort((a, b) => a[1].popularite - b[1].popularite)[0];
  if (e.social.risqueGlobal > 0.45) {
    c.push({ niveau: e.social.risqueGlobal > 0.65 ? 'alerte' : 'attention', titre: 'Risque de mouvement social', texte: `Risque élevé (${Math.round(e.social.risqueGlobal * 100)} %). Le groupe le plus mécontent : ${GROUPES[pire[0]]?.nom ?? pire[0]} (${Math.round(pire[1].popularite)} %). Une compensation ciblée (onglet Ménages pour mesurer) peut désamorcer la colère.`, onglet: 'menages' });
  }
  // --- Entreprises --------------------------------------------------------------------
  const x = e.entreprises;
  // Sommet du G7 : préparer, puis négocier
  if (e.g7 && peutNegocier(e)) {
    const s = prochainSommet(e);
    if (s.ceTrimestre) c.push({ niveau: 'idee', titre: `Sommet du G7 ce trimestre${s.presidence ? ' : vous présidez' : ` (${s.hoteNom})`}`, texte: 'Choisissez deux priorités et votre niveau d\'ambition. Face à un membre hostile, une bilatérale ou une concession peut débloquer le consensus.', onglet: 'diplomatie' });
    else if (s.trimestresAvant <= 2 && (e.g7.preparation ?? 0) < 3) c.push({ niveau: 'idee', titre: `G7 ${s.annee} dans ${s.trimestresAvant} trimestre(s)`, texte: 'Mobiliser vos sherpas (1 point de capital diplomatique) facilitera vos priorités au sommet.', onglet: 'diplomatie' });
  }
  if (x && x.climatAffaires < 93) c.push({ niveau: 'attention', titre: 'Les entreprises hésitent à investir', texte: `Climat des affaires : ${x.climatAffaires.toFixed(0)} (100 = moyenne). Stabilité fiscale, rencontres avec les dirigeants et programmes industriels peuvent l'améliorer.`, onglet: 'entreprises' });
  const fragile = x?.fleurons.filter((fl) => fl.sante < 35);
  if (fragile?.length) c.push({ niveau: 'attention', titre: 'Un fleuron national en difficulté', texte: `Santé financière basse : ${fragile.map((fl) => fl.id).join(', ')}. Une prise de participation ou une action spécifique peut le protéger d'un rachat.`, onglet: 'entreprises' });
  // --- Événements et grands rendez-vous -------------------------------------------
  const rdv = e.evenements.enAttente.filter((ev) => ev.grandRendezVous);
  if (rdv.length) c.push({ niveau: 'idee', titre: 'Grand rendez-vous ce trimestre', texte: `${rdv.map((ev) => ev.titre).join(' ; ')}. Vos choix pèsent sur l'influence et la fierté nationale.`, onglet: 'evenements' });
  const autres = e.evenements.enAttente.length - rdv.length;
  if (autres > 0) c.push({ niveau: 'attention', titre: `${autres} dossier(s) en attente de décision`, texte: 'Sans choix de votre part, la première option s\'appliquera.', onglet: 'evenements' });
  // --- Objectifs en retard ------------------------------------------------------------
  const retard = (e.objectifs ?? []).filter((o) => o.type === 'principal' && o.statut === 'en_cours' && o.progression < 0.2 && e.tour >= 2);
  if (retard.length) c.push({ niveau: 'attention', titre: 'Objectif principal en retard', texte: `${retard[0].nom} : ${Math.round(retard[0].progression * 100)} % du chemin parcouru.`, onglet: 'tableau' });
  // --- Pistes quand tout va bien ------------------------------------------------------
  if (!c.some((k) => k.niveau === 'alerte')) {
    if (x && !x.programmes.some((p) => p.fin === null)) c.push({ niveau: 'idee', titre: 'Mettre l\'État stratège en marche', texte: 'Aucun programme d\'investissement stratégique n\'est lancé : nucléaire, semi-conducteurs, défense, IA... Les effets sont lents, mieux vaut commencer tôt.', onglet: 'entreprises' });
    if (m.inflation > 3) c.push({ niveau: 'idee', titre: 'Inflation élevée', texte: `L'inflation atteint ${m.inflation.toFixed(1)} %. Protéger les ménages modestes coûte moins cher avec un chèque ciblé qu'avec un bouclier général.`, onglet: 'reformes' });
  }
  return c.sort((a, b) => NIVEAUX[b.niveau] - NIVEAUX[a.niveau]).slice(0, 6).map((k) => ({ ...k, texte: devise === '$' ? k.texte.replace(/Md€/g, 'Md$') : k.texte, trimestre: libelleTrimestre(tr) }));
}
