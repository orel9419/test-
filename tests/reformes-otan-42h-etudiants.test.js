/**
 * Trois réformes : la France dans l'OTAN, la semaine de 42 h (5 h exonérées,
 * 2 h pour rembourser la dette) et l'exonération des jobs étudiants.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { creerPartie, jouerTour, reformesDisponibles } from '../src/engine/index.js';

const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${f}.json`, import.meta.url), 'utf8'));
const contexte = lire('_contexte-mondial');
const nouvelle = () => creerPartie({ pays: 'france', donnees: lire('france'), contexte, graine: 13 });
const SANS = { evenementsActifs: false, sansPolitique: true, forcerReformes: true };
const jouer = (e, n, premier = {}) => { let x = jouerTour(e, premier, SANS); for (let k = 1; k < n; k++) x = jouerTour(x, {}, SANS); return x; };
const actives = (e) => e.reformes.actives.map((a) => a.id);

describe('Trois nouvelles réformes', () => {
  it('sont proposées en France, avec leurs sources', () => {
    const liste = reformesDisponibles(nouvelle());
    for (const id of ['otan', 'semaine_42h', 'jobs_etudiants']) {
      const r = liste.find((x) => x.id === id);
      expect(r, id).toBeTruthy();
      expect(r.sources?.length, id).toBeGreaterThan(0);
    }
    expect(liste.find((x) => x.id === 'otan').options.map((o) => o.id)).toEqual(['rester', 'commandement', 'alliance']);
  });

  it('semaine de 42 h : les 2 h versées au désendettement rapportent plus que ne coûtent les 5 h exonérées', () => {
    const e = jouer(nouvelle(), 11, { reformes: [{ id: 'semaine_42h', option: '42h' }] });
    const q40 = jouer(nouvelle(), 11, { reformes: [{ id: 'temps_travail', option: '40h_exo5' }] });
    expect(e.travail.contributionDette).toBeGreaterThan(8);          // Md€ par an pour la caisse d'amortissement
    expect(e.travail.coutBudgetaire).toBeLessThan(0);                // gain net pour les finances publiques
    expect(q40.travail.coutBudgetaire).toBeGreaterThan(0);           // 40 h avec 5 h exonérées : coût net
    expect(e.travail.offreTravail).toBeGreaterThan(q40.travail.offreTravail);
    expect(e.travail.cumulDette).toBeGreaterThan(e.travail.contributionDette);
    // Le salarié au SMIC fait 5 h payées et exonérées, et 2 h pour la dette
    const smic = e.menages.find((m) => m.id === 'smic').details.find((d) => d.cause.startsWith('Temps de travail'));
    expect(smic.cause).toMatch(/versées au désendettement/);
    expect(smic.montant).toBeGreaterThan(0);
  });

  it('42 h et durée légale s\'excluent : l\'une remplace l\'autre', () => {
    let e = jouer(nouvelle(), 4, { reformes: [{ id: 'temps_travail', option: '39h_exo2' }] });
    e = jouer(e, 4, { reformes: [{ id: 'semaine_42h', option: '42h' }] });
    expect(actives(e)).toContain('semaine_42h');
    expect(actives(e)).not.toContain('temps_travail');
    expect(e.travail.dureeReference).toBe(42);
  });

  it('OTAN : quitter l\'Alliance dégrade durablement les relations et coûte en défense ; y rester les améliore', () => {
    const base = jouer(nouvelle(), 14);
    const sortie = jouer(nouvelle(), 14, { reformes: [{ id: 'otan', option: 'alliance' }] });
    const rester = jouer(nouvelle(), 14, { reformes: [{ id: 'otan', option: 'rester' }] });
    expect(sortie.international.relations.etatsUnis).toBeLessThan(base.international.relations.etatsUnis - 8);
    expect(sortie.international.relations.pologne).toBeLessThan(base.international.relations.pologne - 10);
    expect(sortie.international.relationsInitiales.etatsUnis).toBeLessThan(base.international.relationsInitiales.etatsUnis);
    expect(sortie.budget.defense.montant).toBeGreaterThan(base.budget.defense.montant);
    expect(sortie.international.influence).toBeLessThan(base.international.influence);
    expect(rester.international.relations.etatsUnis).toBeGreaterThan(base.international.relations.etatsUnis);
  });

  it('jobs étudiants : coût modeste sans plafond, plus élevé sans cotisations', () => {
    const plafond = jouer(nouvelle(), 6, { reformes: [{ id: 'jobs_etudiants', option: 'plafond' }] });
    const cotisations = jouer(nouvelle(), 6, { reformes: [{ id: 'jobs_etudiants', option: 'cotisations' }] });
    const solde = (e) => e.historique.at(-1).deficit;
    const base = jouer(nouvelle(), 6);
    // Le solde se dégrade (déficit plus grand) davantage quand on exonère aussi les cotisations
    expect(Math.abs(solde(cotisations) - solde(base))).toBeGreaterThan(Math.abs(solde(plafond) - solde(base)));
    expect(actives(plafond)).toContain('jobs_etudiants');
  });
});
