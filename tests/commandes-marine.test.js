/**
 * Commandes supplémentaires renouvelables (tranches de 30 ou de 10, un
 * bâtiment de plus) et bâtiments de la Marine (SNA, PHA, frégates, BRF, Monge).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { creerPartie, jouerTour, resumeDefense, flotte, compositionGroupes } from '../src/engine/index.js';
const require_compo = () => ({ compositionGroupes });
import { deciderDefense, etatCommande } from '../src/engine/defense.js';
import { depensesTemporairesActives } from '../src/engine/evenements.js';
import { COMMANDES_DEFENSE, PROGRAMMES_DEFENSE } from '../src/data/defense.js';

const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${f}.json`, import.meta.url), 'utf8'));
const contexte = lire('_contexte-mondial');
const nouvelle = () => creerPartie({ pays: 'france', donnees: lire('france'), contexte, graine: 5, mode: 'facile', calendrier: 'horizon2050' });
const SANS = { evenementsActifs: false };
/** Joue n trimestres ; `decisions(k)` donne les décisions du k-ième trimestre. */
const jouer = (e, n, decisions = () => ({})) => { let x = e; for (let k = 0; k < n; k++) x = jouerTour(x, decisions(k), SANS); return x; };
const commande = (...ids) => ({ defense: { commandes: ids } });
const prog = (r, id) => r.programmes.find((p) => p.id === id);

describe('Bâtiments de la Marine', () => {
  it('part de la flotte réelle fin 2026', () => {
    const r = resumeDefense(nouvelle());
    expect(r.capacites).toMatchObject({ sna: 4, pha: 3, fda: 2, fremm: 8, brf: 2, monge: 1 });
    expect(r.programmes.map((p) => p.id)).toEqual(expect.arrayContaining(['sna', 'pha', 'fregates', 'brf', 'monge']));
  });

  it('livre les six SNA Suffren et les quatre BRF prévus', () => {
    const r = resumeDefense(jouer(nouvelle(), 24)); // fin 2032
    expect(r.capacites.sna).toBe(6);
    expect(r.capacites.brf).toBe(4);
  });

  it('chaque programme naval propose « un de plus », les avions et véhicules des tranches', () => {
    const c = COMMANDES_DEFENSE.france;
    for (const id of ['snle3g', 'sna', 'pang', 'pha', 'brf', 'monge']) expect(c[id].every((x) => x.quantite === 1)).toBe(true);
    expect(c.fregates.map((x) => x.id)).toEqual(['fda1', 'fremm1']);
    for (const id of ['rafale', 'mirage2000', 'scorpion', 'leclerc', 'artillerie']) expect(c[id].every((x) => x.quantite === 30)).toBe(true);
    for (const id of ['helicos', 'phenix']) expect(c[id].every((x) => x.quantite === 10)).toBe(true);
    // Toutes les commandes visent un programme existant
    const ids = PROGRAMMES_DEFENSE.france.map((p) => p.id);
    for (const id of Object.keys(c)) expect(ids).toContain(id);
  });
});

describe('Commandes supplémentaires', () => {
  it('30 Rafale de plus, livrés par 3 au-delà de la trajectoire de la loi de programmation', () => {
    const nominal = resumeDefense(jouer(nouvelle(), 20)).capacites.rafale;
    const e = jouer(nouvelle(), 20, (k) => (k === 0 ? commande('rafale30') : {}));
    const r = resumeDefense(e);
    expect(r.capacites.rafale - nominal).toBeCloseTo(30, 6);
    expect(Number.isInteger(r.capacites.rafale - nominal)).toBe(true);
  });

  it('une commande par matériel tous les quatre trimestres, avec son coût', () => {
    const e = nouvelle();
    const avant = depensesTemporairesActives(e).defense ?? 0;
    deciderDefense(e, { commandes: ['rafale30'] });
    expect((depensesTemporairesActives(e).defense ?? 0) - avant).toBeCloseTo(1.0 * (e.macro.niveauPrix / 100), 6);
    const refus = deciderDefense(e, { commandes: ['rafale30'] });
    expect(refus[0].type).toBe('erreur');
    expect(etatCommande(e, COMMANDES_DEFENSE.france.rafale[0]).prochain).toBeTruthy();
    // Une autre commande (Griffon) reste possible le même trimestre
    expect(deciderDefense(e, { commandes: ['griffon30'] })[0].type).toBe('commande');
    const plusTard = jouer(e, 4);
    expect(etatCommande(plusTard, COMMANDES_DEFENSE.france.rafale[0]).disponible).toBe(true);
  });

  it('jusqu\'à dix SNA : quatre commandes au plus', () => {
    const e = jouer(nouvelle(), 60, (k) => (k % 4 === 0 && k <= 16 ? commande('sna1') : {}));
    const r = resumeDefense(e);
    const c = prog(r, 'sna').commandes[0];
    expect(c.etat.nombre).toBe(4);
    expect(c.etat.plafond).toBe(true);
    expect(r.capacites.sna).toBe(10);
  });

  it('un porte-avions commandé rejoint la flotte après sa construction', () => {
    const e = jouer(nouvelle(), 50, (k) => (k === 0 ? commande('pa1') : {}));
    expect(flotte(e).some((p) => p.id === 'pa_supp_1')).toBe(true);
    const sans = jouer(nouvelle(), 50);
    expect(flotte(e).length).toBe(flotte(sans).length + 1);
  });

  it('les sauvegardes antérieures reçoivent les nouveaux compteurs', () => {
    const e = nouvelle();
    delete e.defense.commandes;
    delete e.defense.capacites.sna;
    delete e.defense.capacites.griffonSupp;
    delete e.defense.programmes.sna;
    const x = jouerTour(e, commande('griffon30'), SANS);
    expect(x.defense.capacites.sna).toBe(4);
    expect(x.defense.commandes.griffon30.nombre).toBe(1);
  });
});

describe('Groupes aéronavals vus par le président', () => {
  it('un groupe complet au départ, autour du Charles-de-Gaulle', () => {
    const { compositionGroupes } = require_compo();
    const c = compositionGroupes(nouvelle());
    expect(c.groupes.length).toBe(1);
    expect(c.groupes[0]).toMatchObject({ porteAvions: 'cdg', escorte: { fda: 1, fremm: 2, sna: 1, brf: 1 }, manques: [] });
  });

  it('avec un second porte-avions, l\'escorte manque : une seule FDA et un seul ravitailleur disponibles', () => {
    const { compositionGroupes } = require_compo();
    const e = nouvelle();
    e.defense.capacites.porteAvionsSupp = 1;
    const c = compositionGroupes(e);
    expect(c.groupes.length).toBe(2);
    expect(c.groupes.map((g) => g.porteAvions).sort()).toEqual(['cdg', 'pang']); // le plus récent d'abord
    expect(c.groupes[1].escorte.fda).toBe(0);
    expect(c.groupes[1].manques.join(' ')).toMatch(/défense aérienne/);
    expect(c.groupes[1].manques.join(' ')).toMatch(/ravitailleur/);
  });
});

describe('Porte-hélicoptères et lutte anti-sous-marine dans le groupe', () => {
  it('le porte-hélicoptères accompagne le groupe s\'il est disponible, sans être indispensable', () => {
    const e = nouvelle();
    expect(compositionGroupes(e).groupes[0].escorte.pha).toBe(1);
    e.defense.capacites.pha = 0;
    const c = compositionGroupes(e);
    expect(c.groupes[0].escorte.pha).toBe(0);
    expect(c.groupes[0].manques).toEqual([]);
  });
});
