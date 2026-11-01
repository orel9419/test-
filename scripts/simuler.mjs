/**
 * Simulation en ligne de commande : joue une partie avec des décisions
 * scénarisées et affiche les indicateurs clés. Sert à vérifier le moteur.
 *
 * Usage : npm run simuler -- [france|allemagne|etatsUnis] [scenario]
 * Scénarios : statu_quo, retraites_65_compensees, 39h_exo2, rigueur, rigueur_compromis, relance
 * Options : --sans-politique (ni vote ni élection : effets économiques seuls),
 *           --mode=facile|intermediaire|expert, --mandat-complet
 */
import { readFileSync } from 'node:fs';
import { creerPartie, jouerTour } from '../src/engine/index.js';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const pays = args[0] ?? 'france';
const scenario = args[1] ?? 'statu_quo';
const options = process.argv.includes('--sans-politique') ? { sansPolitique: true, forcerReformes: true } : {};
const FICHIERS = { etatsUnis: 'etats-unis' };
const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${FICHIERS[f] ?? f}.json`, import.meta.url), 'utf8'));

const SCENARIOS = {
  statu_quo: () => ({}),
  retraites_65_compensees: (tour) => (tour === 1 ? { reformes: [{ id: 'retraites_age', option: 'age_65' }, { id: 'retraites_penibilite', option: 'oui' }, { id: 'retraites_carrieres_longues', option: 'oui' }], procedureReformes: '49.3', impots: { impotRevenu: 97 } } : {}),
  '39h_exo2': (tour) => (tour === 1 ? { reformes: [{ id: 'temps_travail', option: '39h_exo2' }] } : {}),
  rigueur: (tour) => (tour === 1 ? { budget: { economieFinances: -8, protectionSociale: -5, sante: -3, logement: -8, culture: -10, transports: -6 }, impots: { tva: 21 }, reformes: [{ id: 'gel_point_indice', option: 'deux_ans' }, { id: 'retraites_indexation', option: 'sous_indexation' }] } : {}),
  rigueur_compromis: (tour) => (tour === 1 ? { budget: { economieFinances: -6, protectionSociale: -2, logement: -5, culture: -8, transports: -4 }, reformes: [{ id: 'gel_point_indice', option: 'deux_ans' }, { id: 'plan_antifraude', option: 'oui' }], procedureBudget: 'compromis' } : { procedureBudget: 'compromis' }),
  relance: (tour) => (tour === 1 ? { budget: { transports: 15, ecologieEnergie: 20, recherche: 15, education: 5 } } : {}),
};

const calendrier = process.argv.includes('--mandat-complet') ? 'mandat_complet' : 'reel';
let e = creerPartie({ pays, donnees: lire(pays), contexte: lire('_contexte-mondial'), mode: process.argv.find((a) => a.startsWith('--mode='))?.slice(7) ?? 'intermediaire', graine: 42, calendrier });
const fmt = (x, n = 1) => (x === undefined || x === null || Number.isNaN(x) ? '—' : x.toFixed(n));
console.log(`\n${e.statique.drapeau} ${e.statique.nom} — scénario « ${scenario} » — données du ${e.statique.dateDonnees}`);
console.log('Trim.    PIB Md€  Crois.a  Infl.  Chôm.  Déficit  Dette   Intérêts  OAT/Bund  Spread  BCE   Popul.  Cohés.  Émiss.  Énergie');
const ligne = (h) => console.log(`${h.trimestre.padEnd(8)} ${fmt(h.pib, 0).padStart(7)}  ${fmt(h.croissanceA).padStart(6)}  ${fmt(h.inflation).padStart(5)}  ${fmt(h.chomage).padStart(5)}  ${fmt(h.deficit).padStart(7)}  ${fmt(h.dette).padStart(6)}  ${fmt(h.interets, 0).padStart(8)}  ${fmt(h.taux10, 2).padStart(8)}  ${fmt(h.spread, 0).padStart(6)}  ${fmt(h.tauxBCE, 2).padStart(4)}  ${fmt(h.popularite).padStart(6)}  ${fmt(h.cohesion).padStart(6)}  ${fmt(h.emissions, 0).padStart(6)}  ${fmt(h.energie, 0).padStart(6)}`);
ligne(e.historique[0]);
while (!e.termine) {
  e = jouerTour(e, SCENARIOS[scenario](e.tour), options);
  ligne(e.historique.at(-1));
}
console.log(`\nIssue : ${e.issue?.texte}`);
if (e.score) console.log(`Score : ${e.score.total}/100 — ${e.score.mention}`, Object.entries(e.score.composantes).map(([k, v]) => `${k} ${Math.round(v)}`).join(', '));
console.log('Objectifs :', e.objectifs.map((o) => `${o.nom} [${o.statut}]`).join(' | '));
console.log('\nMénages types (pouvoir d\'achat réel, €/mois, depuis le départ) :');
for (const m of e.menages) console.log(`  ${m.nom.padEnd(48)} ${fmt(m.revenuNet0, 0).padStart(6)} € → ${fmt(m.revenuReel, 0).padStart(6)} €  (${m.delta >= 0 ? '+' : ''}${fmt(m.delta, 0)} €)`);
console.log('\nPopularité par groupe :', Object.entries(e.social.groupes).map(([g, x]) => `${g} ${fmt(x.popularite, 0)}`).join(' | '));
console.log('\nJournal (extraits) :');
for (const j of e.journal.slice(-12)) console.log(`  [${j.trimestre}] ${j.texte}`);
