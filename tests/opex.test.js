/**
 * Opérations extérieures (crises où l'on envoie des forces), escadron de chars
 * Leclerc, tir d'essai du missile M51.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { creerPartie, jouerTour, resumeDeploiements, resumeOpex, previsionOpex, declencherOpex, resumeDefense } from '../src/engine/index.js';
import { OPEX } from '../src/data/opex.js';
import { EVENEMENTS } from '../src/engine/evenements.js';

const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${f}.json`, import.meta.url), 'utf8'));
const contexte = lire('_contexte-mondial');
const nouvelle = (pays = 'france', options = {}) => creerPartie({ pays, donnees: lire(pays === 'france' ? 'france' : 'allemagne'), contexte, graine: 23, mode: 'facile', calendrier: 'horizon2050', ...options });
const OPT = { evenementsActifs: false, forcerReformes: true };
const jouer = (e, n, premier = {}) => { let x = jouerTour(e, premier, OPT); for (let k = 1; k < n; k++) x = jouerTour(x, {}, OPT); return x; };
const unite = (e, id) => resumeDeploiements(e).unites.find((u) => u.id === id);

describe('Opérations extérieures', () => {
  it('chaque opération a sa crise au catalogue, jamais tirée par le moteur des événements, avec des sources', () => {
    for (const [id, op] of Object.entries(OPEX)) {
      const ev = EVENEMENTS.find((x) => x.id === op.crise.id);
      expect(ev, id).toBeTruthy();
      expect(ev.condition()).toBe(false);
      expect(op.sources.length).toBeGreaterThan(0);
      expect(op.crise.choix.some((c) => c.unites?.length)).toBe(true);
      expect(op.crise.choix.some((c) => !c.unites)).toBe(true); // toujours une réponse sans engager de forces
    }
  });

  it('des crises d\'opérations éclatent au fil des trimestres (France seulement)', () => {
    let e = nouvelle();
    const vues = new Set();
    for (let k = 0; k < 40 && !e.termine; k++) {
      e = jouerTour(e, {}, {});
      for (const ev of e.evenements.enAttente) if (ev.opex) vues.add(ev.opex);
    }
    expect(vues.size).toBeGreaterThanOrEqual(2);
    let a = nouvelle('allemagne');
    for (let k = 0; k < 12; k++) a = jouerTour(a, {}, {});
    expect(resumeOpex(a)).toBeNull();
  });

  it('engager des forces au Liban : elles partent, coûtent, s\'usent, puis rentrent avec une issue', () => {
    let e = nouvelle();
    expect(declencherOpex(e, 'liban')).toBe(true);
    const prev = previsionOpex(e, 'liban', ['gtia', 'escadron_leclerc', 'chasse_1']);
    expect(prev.engageables.map((u) => u.id)).toEqual(['gtia', 'escadron_leclerc', 'chasse_1']);
    expect(prev.chance).toBeGreaterThan(0.6);
    expect(prev.cout).toBeGreaterThan(0.3);
    e = jouerTour(e, { evenements: { opex_liban: 'engager' } }, OPT);
    expect(unite(e, 'escadron_leclerc').enOperation).toBe(true);
    expect(unite(e, 'gtia').lieu).toMatch(/Liban/);
    expect(unite(e, 'forces_speciales').enOperation).toBe(false);
    expect(e.depensesTemporaires.some((d) => d.source === 'opex')).toBe(true);
    expect(resumeOpex(e).encours[0].id).toBe('liban');
    // Pas d'autre ordre possible pendant l'opération
    e = jouerTour(e, { deploiements: { gtia: 'djibouti' } }, OPT);
    expect(e.resultatsTour.deploiements[0].erreur).toMatch(/opération/);
    e = jouer(e, 1);
    const r = resumeOpex(e);
    expect(r.encours).toHaveLength(0);
    expect(r.historique[0].id).toBe('liban');
    expect(unite(e, 'gtia').position).toBe('metropole');
    expect(unite(e, 'gtia').repos).toBeGreaterThan(0);
    expect(unite(e, 'gtia').potentiel).toBeLessThan(60);
    expect(e.journal.some((j) => j.texte.startsWith('Opération — Sud-Liban') && /succès|échec/.test(j.texte))).toBe(true);
  });

  it('les forces mieux adaptées donnent de meilleures chances ; sans unité disponible, rien ne part', () => {
    const e = nouvelle();
    const lourd = previsionOpex(e, 'liban', ['gtia', 'escadron_leclerc', 'chasse_1']).chance;
    const leger = previsionOpex(e, 'liban', ['forces_speciales']).chance;
    expect(lourd).toBeGreaterThan(leger + 0.2);
    expect(previsionOpex(e, 'sahel', ['forces_speciales']).chance).toBeGreaterThan(previsionOpex(e, 'sahel', ['gtia']).chance);
    // Unités en remise en condition : l'opération ne part pas, la France perd un peu d'influence
    for (const id of ['gtia', 'escadron_leclerc']) e.geopolitique.forces[id].repos = 1;
    declencherOpex(e, 'flanc_est');
    const x = jouerTour(e, { evenements: { opex_flanc_est: 'blindes' } }, OPT);
    expect(resumeOpex(x).encours).toHaveLength(0);
    expect(x.journal.some((j) => j.texte.includes('aucune des forces demandées'))).toBe(true);
  });

  it('hors de l\'OTAN, la France ne peut plus renforcer le flanc est', () => {
    let e = jouer(nouvelle(), 8, { reformes: [{ id: 'otan', option: 'alliance' }] });
    expect(resumeDeploiements(e).horsOtan).toBe(true);
    expect(previsionOpex(e, 'flanc_est', ['escadron_leclerc']).indisponibles[0].motif).toMatch(/OTAN/);
    expect(previsionOpex(e, 'liban', ['escadron_leclerc']).engageables).toHaveLength(1);
  });

  it('un choix sans forces s\'applique tout de suite, tension comprise', () => {
    let e = nouvelle();
    declencherOpex(e, 'liban');
    const avant = e.geopolitique.tensions.mediterranee;
    e = jouerTour(e, { evenements: { opex_liban: 'abstention' } }, OPT);
    expect(resumeOpex(e).encours).toHaveLength(0);
    expect(e.evenements.historique.at(-1).choix).toBe('abstention');
    expect(e.geopolitique.tensions.mediterranee).not.toBe(avant);
  });
});

describe('Escadron de chars Leclerc', () => {
  it('se déploie sur le flanc est (Roumanie, Estonie), pas à Djibouti', () => {
    let e = jouer(nouvelle(), 1, { deploiements: { escadron_leclerc: 'djibouti' } });
    expect(unite(e, 'escadron_leclerc').position).toBe('metropole');
    expect(e.resultatsTour.deploiements[0].erreur).toMatch(/flanc est/);
    e = jouer(e, 1, { deploiements: { escadron_leclerc: 'roumanie' } });
    expect(unite(e, 'escadron_leclerc').position).toBe('roumanie');
    expect(unite(e, 'escadron_leclerc').scene).toBe('escadronLeclerc');
  });
});

describe('Tir d\'essai du missile M51', () => {
  it('le président ordonne un essai : réussi ou raté, il coûte et compte ; un par an au plus', () => {
    let e = nouvelle('france', { role: 'president' });
    e = jouer(e, 1, { defense: { essaiM51: true } });
    const d = resumeDefense(e);
    expect(d.essaisM51).toHaveLength(1);
    expect(d.essaisM51[0].lanceur).toMatch(/^Le /);
    expect(e.depensesTemporaires.some((x) => x.source === 'essai_m51')).toBe(true);
    expect(e.journal.some((j) => j.texte.startsWith('Dissuasion — ') && /essai/.test(j.texte))).toBe(true);
    e = jouer(e, 1, { defense: { essaiM51: true } });
    expect(resumeDefense(e).essaisM51).toHaveLength(1); // trop tôt
    expect(e.resultatsTour.defense.at(-1).type).toBe('erreur');
  });

  it('domaine réservé : le Premier ministre ne peut pas l\'ordonner', () => {
    const e = jouer(nouvelle(), 1, { defense: { essaiM51: true } });
    expect(resumeDefense(e).essaisM51).toHaveLength(0);
  });
});
