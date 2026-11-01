/**
 * Relations internationales et coopération.
 *
 * - relations : de −100 (hostile) à +100 (allié proche), qui reviennent
 *   lentement vers leur niveau de départ ;
 * - influence : de 0 à 100, nourrie par la défense, la diplomatie, l'aide au
 *   développement, la crédibilité budgétaire et les initiatives réussies ;
 * - capital diplomatique : points disponibles chaque trimestre pour agir ;
 * - modificateurs durables issus des accords (prix de l'énergie, recettes,
 *   dépenses, croissance potentielle...).
 */
import { ACTIONS_DIPLOMATIQUES, PARTENAIRES } from '../data/diplomatie.js';
import { borner } from '../model/outils.js';
import { appliquerChocs } from './social.js';
import { libelleTrimestre } from './calendrier.js';

export function initialiserInternational(e, p) {
  return {
    relations: { ...p.relationsInitiales },
    relationsInitiales: { ...p.relationsInitiales },
    influence: p.influenceInitiale,
    influenceInitiale: p.influenceInitiale,
    bonusInfluence: 0,
    capitalDiplomatique: 2,
    modificateurs: [],
    actionsRealisees: [],
    safe: 0,                 // montant de dette financé par les prêts européens SAFE
    facteurEnergie: 1,
    chocExport: 0,
    effetPAC: 0,
    recettesExterieures: 0,
    potentielBonus: 0,
    depenses: {},
    defense0: e.budget.defense.montant / e.macro.pibNominal * 100,
  };
}

/** Actions diplomatiques disponibles ce trimestre. */
export function actionsDisponibles(e) {
  return ACTIONS_DIPLOMATIQUES.filter((a) => {
    if (a.unique && e.international.actionsRealisees.some((x) => x.id === a.id && x.reussite)) return false;
    if (a.condition && !a.condition(e)) return false;
    return true;
  }).map((a) => ({ id: a.id, nom: a.nom, cout: a.cout, description: a.description, options: a.options ?? null }));
}

/** Applique un ensemble d'effets diplomatiques à l'état. */
function appliquerEffets(e, eff, source) {
  const i = e.international;
  for (const [p, v] of Object.entries(eff.relations ?? {})) {
    i.relations[p] = borner((i.relations[p] ?? 0) + v, -100, 100);
  }
  if (eff.influence) i.bonusInfluence += eff.influence;
  if (eff.credibilite) e.finances.credibilite = borner(e.finances.credibilite + eff.credibilite, -1, 1);
  if (eff.chocs) appliquerChocs(e, eff.chocs);
  if (eff.opinion || eff.grief) {
    // Une opinion durable se comporte comme une « réforme » sans coût budgétaire
    e.reformes.actives.push({ id: `diplomatie:${source}`, nom: source, diplomatique: true, opinion: { ...(eff.opinion ?? {}) }, grief: { ...(eff.grief ?? {}) }, appliquee: true, tourAdoption: e.tour });
  }
  for (const mod of eff.modificateurs ?? []) {
    if (mod.type === 'export') { i.chocExport += mod.valeur; continue; }
    i.modificateurs.push({ ...mod, source, debut: e.tour + (mod.delai ?? 0), fin: e.tour + (mod.delai ?? 0) + (mod.duree ?? 1) });
  }
  if (eff.regles) eff.regles(e.statique.regles);
  if (eff.safe) i.safe += eff.safe;
}

/**
 * Exécute une action diplomatique.
 * @returns {object} { reussite, texte } ou { erreur }
 */
export function executerAction(e, id, option, alea) {
  const a = ACTIONS_DIPLOMATIQUES.find((x) => x.id === id);
  if (!a) return { erreur: `Action inconnue : ${id}` };
  if (a.condition && !a.condition(e)) return { erreur: 'Action indisponible.' };
  if (a.unique && e.international.actionsRealisees.some((x) => x.id === id && x.reussite)) return { erreur: 'Action déjà réalisée.' };
  if (e.international.capitalDiplomatique < a.cout) return { erreur: 'Capital diplomatique insuffisant ce trimestre.' };
  if (a.options && !a.options.some((o) => o.id === option)) option = a.options[0].id;
  e.international.capitalDiplomatique -= a.cout;
  const p = borner(a.probabilite(e, option), 0.02, 0.98);
  const reussite = alea.tirage(p);
  const eff = reussite ? a.succes(e, option) : a.echec(e, option);
  appliquerEffets(e, eff, a.nom);
  const libelleOption = a.options?.find((o) => o.id === option)?.nom;
  const texte = `${a.nom}${libelleOption ? ` (${libelleOption})` : ''} : ${reussite ? 'réussite' : 'échec'}. ${eff.texte ?? ''}`.trim();
  e.international.actionsRealisees.push({ id, option, tour: e.tour, reussite });
  e.journal.push({ tour: e.tour, trimestre: libelleTrimestre(e.trimestre), type: 'diplomatie', texte });
  return { reussite, texte, probabilite: p };
}

/**
 * Met à jour la situation internationale pour le trimestre.
 * @returns {object} effets agrégés { recettes, depenses: { poste }, potentielBonus, economieInterets }
 */
export function majInternational(e) {
  const i = e.international;
  // Capital diplomatique : 2 points par trimestre, 3 si l'influence dépasse 70 (non cumulable au-delà de 4)
  i.capitalDiplomatique = Math.min(4, i.capitalDiplomatique + (i.influence > 70 ? 3 : 2));

  // Modificateurs actifs
  i.facteurEnergie = 1; i.recettesExterieures = 0; i.potentielBonus = 0; i.effetPAC = 0; i.depenses = {};
  i.modificateurs = i.modificateurs.filter((m) => e.tour < m.fin);
  for (const m of i.modificateurs) {
    if (e.tour < m.debut) continue;
    if (m.type === 'facteurEnergie') i.facteurEnergie *= m.valeur;
    if (m.type === 'recettes') i.recettesExterieures += m.valeur;
    if (m.type === 'potentiel') i.potentielBonus += m.valeur;
    if (m.type === 'effetPAC') i.effetPAC += m.valeur;
    if (m.type === 'depense') i.depenses[m.poste] = (i.depenses[m.poste] ?? 0) + m.valeur;
  }

  // Prêts SAFE : intérêts économisés = montant × (taux souverain − taux européen)
  const tauxUE = e.monde.tauxBCE + 1.05;
  const economieInterets = i.safe * Math.max(0, e.finances.taux10 - tauxUE) / 100;

  // Réactions des partenaires à la politique budgétaire (procédure européenne)
  const ue = e.statique.regles.ue;
  const cible = ue?.cibleDeficit?.[e.trimestre.annee];
  if (ue?.pde && cible !== undefined && e.finances.deficitRatio > cible + 0.5) {
    i.relations.ue = borner(i.relations.ue - 1.5, -100, 100);
    i.relations.frugaux = borner((i.relations.frugaux ?? 0) - 1.5, -100, 100);
  }
  // Retour lent vers les relations de départ
  for (const p of Object.keys(i.relations)) i.relations[p] += 0.04 * ((i.relationsInitiales[p] ?? 0) - i.relations[p]);

  // Influence : fondamentaux (défense, diplomatie, crédibilité, croissance) + initiatives
  const defensePct = e.budget.defense.montant / e.macro.pibNominal * 100;
  const variationAE = e.budget.affairesEtrangeres.montant / (e.budget.affairesEtrangeres.montantInitial * e.macro.niveauPrix / 100) - 1;
  const moyenneRelations = Object.values(i.relations).reduce((s, v) => s + v, 0) / Object.keys(i.relations).length;
  const moyenneInitiale = Object.values(i.relationsInitiales).reduce((s, v) => s + v, 0) / Object.keys(i.relationsInitiales).length;
  const cibleInfluence = i.influenceInitiale + 5 * (defensePct - i.defense0) + 8 * variationAE + 0.15 * (moyenneRelations - moyenneInitiale)
    + 4 * e.finances.credibilite + 0.5 * (e.macro.croissanceAnnuelle - 1) - (e.finances.crise ? 10 : 0);
  i.bonusInfluence *= 0.97;
  i.influence = borner(i.influence + 0.25 * (cibleInfluence + i.bonusInfluence - i.influence), 0, 100);

  return { recettes: i.recettesExterieures, depenses: i.depenses, potentielBonus: i.potentielBonus, economieInterets };
}

export { PARTENAIRES };
