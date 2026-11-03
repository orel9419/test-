/**
 * Communication et rassemblement : une action par trimestre pour regagner
 * l'opinion, sans coût budgétaire (ou presque).
 *
 * Mécaniques :
 *  - l'effet immédiat (choc de popularité) s'estompe, mais une partie laisse
 *    une opinion durable, qui décroît lentement ;
 *  - l'usure : multiplier les prises de parole lasse l'opinion (efficacité
 *    réduite), elle se dissipe d'un trimestre à l'autre ;
 *  - le risque de « petite phrase » malheureuse croît avec l'usure ;
 *  - certaines actions ne sont possibles qu'une fois par an ou tous les deux ans.
 *
 * Paramètres : hypothèses de jeu. Exemples réels : grand débat national
 * (2019), convention citoyenne pour le climat (2019-2020).
 */
import { borner } from '../model/outils.js';
import { appliquerChocs } from './social.js';
import { libelleTrimestre } from './calendrier.js';

export const GROUPES_CIBLES = { salaries: 'Salariés', fonctionnaires: 'Fonctionnaires', retraites: 'Retraités', jeunes: 'Jeunes', entrepreneurs: 'Entrepreneurs', agriculteurs: 'Agriculteurs' };

export const ACTIONS_COMMUNICATION = {
  allocution: {
    nom: 'Allocution télévisée au 20 h',
    icone: '📺',
    description: 'Expliquer vos choix à tous les Français. Effet large mais fugace, et vite lassant.',
    usure: 0.35, recharge: 0,
    effets: (e, k) => ({ chocs: tous(2.5 * k), opinion: tous(0.5 * k) }),
  },
  terrain: {
    nom: 'Déplacement de terrain',
    icone: '🚶',
    description: 'Usine, hôpital, exploitation agricole, lycée : un groupe se sent écouté, l\'effet dure.',
    options: GROUPES_CIBLES, usure: 0.2, recharge: 0,
    effets: (e, k, cible) => ({ chocs: { ...tous(0.5 * k), [cible]: 6 * k }, opinion: { [cible]: 2.5 * k } }),
  },
  elus: {
    nom: 'Rencontre avec les maires et les élus locaux',
    icone: '🏛️',
    description: 'Les territoires ruraux et les retraités y sont sensibles ; apaise aussi les relations avec le Sénat.',
    usure: 0.15, recharge: 0,
    effets: (e, k) => ({ chocs: { agriculteurs: 3 * k, retraites: 2 * k, salaries: 1 * k }, opinion: { agriculteurs: 1.5 * k, retraites: 1 * k } }),
  },
  cap: {
    nom: 'Fixer un cap : feuille de route chiffrée',
    icone: '🧭',
    description: 'Un discours de politique générale avec des objectifs chiffrés : rassure les marchés et les électeurs centraux. Une fois par an.',
    usure: 0.2, recharge: 4,
    effets: (e, k) => ({ chocs: tous(1.5 * k), opinion: { entrepreneurs: 1.5 * k, retraites: 1 * k, salaries: 0.5 * k }, credibilite: 0.05 }),
  },
  grand_debat: {
    nom: 'Grand débat national',
    icone: '🗣️',
    description: 'Comme en 2019 après les « gilets jaunes » : des réunions dans tout le pays. Apaise la colère liée aux réformes (griefs) et améliore la cohésion. Tous les deux ans.',
    usure: 0.3, recharge: 8, cout: 0.15,
    effets: (e, k) => ({ chocs: tous(1 * k), opinion: tous(1.5 * k), apaisement: 0.3 }),
  },
  convention: {
    nom: 'Convention citoyenne',
    icone: '🎲',
    description: 'Des citoyens tirés au sort délibèrent (climat en 2019-2020, fin de vie en 2022-2023). Plaît aux jeunes, mais crée une attente : ses propositions devront être reprises. Tous les deux ans.',
    usure: 0.2, recharge: 8, cout: 0.01,
    effets: (e, k) => ({ chocs: { jeunes: 4 * k, salaries: 1 * k }, opinion: { jeunes: 2 * k, fonctionnaires: 0.5 * k } }),
  },
};

const tous = (v) => Object.fromEntries(Object.keys(GROUPES_CIBLES).map((g) => [g, v]));

export function etatCommunicationInitial() {
  return { usure: 0, historique: [], derniersTours: {} };
}

/** Actions possibles ce trimestre, avec leur efficacité attendue et leur disponibilité. */
export function actionsCommunication(e) {
  const c = e.communication ?? etatCommunicationInitial();
  return Object.entries(ACTIONS_COMMUNICATION).map(([id, a]) => {
    const dernier = c.derniersTours[id];
    const disponibleDans = a.recharge && dernier !== undefined ? Math.max(0, dernier + a.recharge - e.tour) : 0;
    return { id, nom: a.nom, icone: a.icone, description: a.description, options: a.options ?? null, disponible: disponibleDans === 0, disponibleDans, efficacite: efficacite(e) };
  });
}

/** Efficacité d'une prise de parole : baisse avec l'usure (40 % au moins quand l'opinion est saturée). */
export function efficacite(e) {
  const u = e.communication?.usure ?? 0;
  return borner(1 - 0.6 * u, 0.4, 1);
}

/**
 * Exécute l'action de communication du trimestre.
 * @returns {object|null} { id, nom, texte, gaffe }
 */
export function communiquer(e, decision, alea) {
  if (!decision?.id || !ACTIONS_COMMUNICATION[decision.id]) return null;
  const c = (e.communication ??= etatCommunicationInitial());
  const a = ACTIONS_COMMUNICATION[decision.id];
  const dispo = actionsCommunication(e).find((x) => x.id === decision.id);
  if (!dispo?.disponible) return { erreur: `${a.nom} : pas encore possible (encore ${dispo?.disponibleDans} trimestre(s)).` };
  const cible = a.options ? (a.options[decision.option] ? decision.option : Object.keys(a.options)[0]) : null;
  const k = efficacite(e);
  const eff = a.effets(e, k, cible);
  appliquerChocs(e, eff.chocs);
  if (eff.opinion) e.reformes.actives.push({ id: `communication:${decision.id}:${e.tour}`, nom: a.nom, diplomatique: true, opinion: { ...eff.opinion }, grief: {}, appliquee: true, tourAdoption: e.tour });
  if (eff.credibilite) e.finances.credibilite = borner(e.finances.credibilite + eff.credibilite, -1, 1);
  if (eff.apaisement) for (const r of e.reformes.actives) for (const g of Object.keys(r.grief ?? {})) r.grief[g] *= 1 - eff.apaisement;
  if (a.cout) e.depensesTemporaires.push({ poste: 'economieFinances', valeur: a.cout * 4, fin: e.tour + 1 });
  // Petite phrase malheureuse : plus probable quand on parle trop
  const gaffe = alea.tirage(0.04 + 0.15 * c.usure);
  if (gaffe) appliquerChocs(e, tous(-2));
  c.usure = borner(c.usure + a.usure, 0, 1.5);
  c.derniersTours[decision.id] = e.tour;
  const texte = `${a.nom}${cible ? ` (${GROUPES_CIBLES[cible].toLowerCase()})` : ''} : efficacité ${Math.round(k * 100)} %.${gaffe ? ' Une petite phrase malheureuse fait polémique et gâche une partie de l\'effet.' : ''}`;
  c.historique.push({ tour: e.tour, id: decision.id, cible, efficacite: k, gaffe });
  e.journal.push({ tour: e.tour, trimestre: libelleTrimestre(e.trimestre), type: 'politique', texte: `Communication — ${texte}` });
  return { id: decision.id, nom: a.nom, texte, gaffe };
}

/** L'usure se dissipe d'un trimestre à l'autre. */
export function majCommunication(e) {
  if (e.communication) e.communication.usure = Math.max(0, e.communication.usure - 0.2);
}
