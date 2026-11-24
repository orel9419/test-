/**
 * Menace terroriste (Vigipirate, Sentinelle, alertes, attentats, opérations
 * antiterroristes partout dans le monde) et guerre économique (mesures,
 * accord de Bruxelles, ripostes, trêve) : France.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { creerPartie, jouerTour, resumeTerrorisme, resumeGuerreEconomique, resumeOpex } from '../src/engine/index.js';
import { EVENEMENTS } from '../src/engine/evenements.js';
import { OPEX } from '../src/data/opex.js';
import { REFORMES } from '../src/data/reformes.js';

const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${f}.json`, import.meta.url), 'utf8'));
const contexte = lire('_contexte-mondial');
const nouvelle = (pays = 'france', options = {}) => creerPartie({ pays, donnees: lire(pays === 'france' ? 'france' : 'allemagne'), contexte, graine: 23, mode: 'facile', calendrier: 'horizon2050', ...options });
const OPT = { evenementsActifs: false, forcerReformes: true };

describe('Menace terroriste et opérations antiterroristes', () => {
  it('six opérations antiterroristes, jamais tirées au hasard, sourcées, qui font reculer la menace', () => {
    const ids = Object.keys(OPEX).filter((id) => OPEX[id].antiterrorisme);
    expect(ids).toEqual(['levant_daech', 'sahel_raid', 'golfe_guinee', 'corne_afrique', 'mozambique', 'libye']);
    for (const id of ids) {
      expect(OPEX[id].probabilite()).toBe(0);
      expect(OPEX[id].reussite.menace).toBeLessThan(0);
      expect(OPEX[id].sources.length).toBeGreaterThan(0);
    }
    for (const id of ['menace_alerte', 'attentat_dejoue', 'attentat']) expect(EVENEMENTS.find((x) => x.id === id)?.condition()).toBe(false);
  });

  it('le président lance une opération au Levant : forces engagées, menace qui recule si elle réussit', () => {
    let e = nouvelle('france', { role: 'president' });
    e = jouerTour(e, {}, OPT);
    const avant = resumeTerrorisme(e).menace;
    e = jouerTour(e, { antiterrorisme: { operation: 'levant_daech', unites: ['chasse_1', 'forces_speciales', 'soutien_aerien'] } }, OPT);
    expect(resumeOpex(e).encours.map((o) => o.id)).toContain('levant_daech');
    expect(e.depensesTemporaires.some((d) => d.source === 'opex')).toBe(true);
    for (let k = 0; k < 3; k++) e = jouerTour(e, {}, OPT);
    const h = resumeOpex(e).historique.find((x) => x.id === 'levant_daech');
    expect(h).toBeTruthy();
    if (h.succes) expect(resumeTerrorisme(e).menace).toBeLessThan(avant);
  });

  it('Vigipirate et Sentinelle : renfort coûteux, protection plus forte, risque d\'attentat plus faible', () => {
    let e = jouerTour(nouvelle(), {}, OPT);
    const r0 = resumeTerrorisme(e);
    expect(r0.vigipirate).toBe('urgence_attentat');
    e = jouerTour(e, { securite: { sentinelle: 10000 } }, OPT);
    const r1 = resumeTerrorisme(e);
    expect(r1.sentinelle).toBe(10000);
    expect(r1.protection).toBeGreaterThan(r0.protection);
    expect(e.depensesTemporaires.some((d) => d.source === 'securite_interieure' && d.valeur > 0)).toBe(true);
    e.securiteInterieure.menace = 85;
    const fort = resumeTerrorisme(e).risqueAnnuel;
    e = jouerTour(e, { securite: { sentinelle: 3000, vigipirate: 'securite_renforcee' } }, OPT);
    e.securiteInterieure.menace = 85;
    expect(resumeTerrorisme(e).risqueAnnuel).toBeGreaterThan(fort);
  });

  it('au fil d\'une partie, des alertes et des attentats déjoués arrivent ; un attentat a un coût et se répond', () => {
    let e = nouvelle();
    const vus = new Set();
    for (let k = 0; k < 40 && !e.termine; k++) {
      e = jouerTour(e, {}, {});
      for (const ev of e.evenements.enAttente) if (['menace_alerte', 'attentat_dejoue', 'attentat'].includes(ev.id)) vus.add(ev.id);
    }
    expect(vus.has('menace_alerte') || vus.has('attentat_dejoue')).toBe(true);
    // Attentat forcé : choc d'activité, attentat enregistré, Sentinelle renforcée (premier choix)
    let a = jouerTour(nouvelle(), {}, OPT);
    a.securiteInterieure.contexte = { origine: 'levant_daech', ville: 'Lyon', gravite: 2 };
    a.evenements.enAttente.push({ id: 'attentat', titre: 'Attentat terroriste à Lyon', description: '', choix: [], tour: a.tour });
    const b = jouerTour(a, {}, OPT);
    expect(b.securiteInterieure.attentats).toHaveLength(1);
    expect(b.securiteInterieure.sentinelle).toBe(7000);
    expect(b.journal.some((j) => /Attentat terroriste à Lyon/.test(j.texte))).toBe(true);
    // Riposte : une opération antiterroriste part
    a.evenements.enAttente = [{ id: 'attentat', titre: 'Attentat', description: '', choix: [], tour: a.tour }];
    const c = jouerTour(a, { evenements: { attentat: 'riposte' } }, OPT);
    expect(resumeOpex(c).encours.map((o) => o.id)).toContain('levant_daech');
  });

  it('sans objet hors de France', () => {
    expect(resumeTerrorisme(nouvelle('allemagne'))).toBeNull();
    expect(resumeGuerreEconomique(nouvelle('allemagne'))).toBeNull();
  });
});

describe('Guerre économique', () => {
  it('mesure nationale (sans Bruxelles) : intensité 1, relations dégradées, l\'adversaire riposte et les exportations souffrent', () => {
    let e = nouvelle();
    const rel = e.international.relations.chine;
    e = jouerTour(e, { guerreEconomique: { cible: 'chine', mesure: 'controle_investissements' } }, OPT);
    const c = resumeGuerreEconomique(e).cibles.find((x) => x.id === 'chine');
    expect(c.niveau).toBe(1);
    expect(e.international.relations.chine).toBeLessThan(rel);
    let k = 0;
    while (e.guerreEconomique.conflits.chine.riposte === 0 && k++ < 12) e = jouerTour(e, {}, OPT);
    expect(e.guerreEconomique.conflits.chine.riposte).toBeGreaterThan(0);
  });

  it('une guerre commerciale avec les États-Unis coûte de la croissance et pèse sur les secteurs exposés', () => {
    let paix = nouvelle(), guerre = nouvelle();
    guerre.guerreEconomique = { conflits: { etatsUnis: { niveau: 3, riposte: 3, debut: 0, trimestres: 0, mesures: [] } }, tension: {}, derniereCrise: -99, historique: [] };
    for (let k = 0; k < 6; k++) { paix = jouerTour(paix, {}, OPT); guerre = jouerTour(guerre, {}, OPT); }
    expect(guerre.historique.at(-1).pib).toBeLessThan(paix.historique.at(-1).pib * 0.997);
    expect(guerre.social.groupes.agriculteurs.popularite).toBeLessThan(paix.social.groupes.agriculteurs.popularite);
  });

  it('les mesures de l\'Union demandent l\'accord de Bruxelles (moins probable contre la Chine) ; négocier fait redescendre', () => {
    const e = nouvelle();
    const r = resumeGuerreEconomique(e);
    const chance = (cible) => r.cibles.find((x) => x.id === cible).mesures.find((m) => m.id === 'riposte_ue').chance;
    expect(chance('chine')).toBeLessThan(chance('etatsUnis'));
    expect(r.cibles.find((x) => x.id === 'chine').mesures.find((m) => m.id === 'anti_coercition').possible).toBe(false);
    let x = nouvelle();
    x = jouerTour(x, { guerreEconomique: { cible: 'etatsUnis', mesure: 'controle_investissements' } }, OPT);
    x = jouerTour(x, { guerreEconomique: { cible: 'etatsUnis', mesure: 'negocier' } }, OPT);
    expect(x.guerreEconomique.conflits.etatsUnis.niveau).toBe(0);
    expect(x.resultatsTour.guerreEconomique[0].ok).toBe(true);
  });

  it('crises subies : le choix par défaut négocie sans toucher à l\'économie ; une trêve peut mettre fin au conflit', () => {
    for (const id of ['menace_tarifs_us', 'terres_rares', 'treve_commerciale']) expect(EVENEMENTS.find((x) => x.id === id)?.condition()).toBe(false);
    let e = jouerTour(nouvelle(), {}, OPT);
    e.evenements.enAttente.push({ id: 'menace_tarifs_us', titre: 'Menace', description: '', choix: [], tour: e.tour });
    e = jouerTour(e, {}, OPT);
    expect(e.guerreEconomique.tension.etatsUnis).toBe(10);
    expect(e.guerreEconomique.conflits.etatsUnis).toBeUndefined();
    e.guerreEconomique.conflits.chine = { niveau: 2, riposte: 2, debut: 0, trimestres: 4, mesures: [] };
    e.guerreEconomique.cibleTreve = 'chine';
    e.evenements.enAttente.push({ id: 'treve_commerciale', titre: 'Trêve', description: '', choix: [], tour: e.tour });
    e = jouerTour(e, { evenements: { treve_commerciale: 'accepter' } }, OPT);
    expect(e.guerreEconomique.conflits.chine.niveau).toBe(0);
  });
});

describe('Réformes : emploi, croissance, avancées sociales', () => {
  const IDS = ['tzcld', 'formation_chomeurs', 'bonus_malus_contrats', 'emploi_seniors', 'france_2030_bis', 'credit_impot_industrie', 'rapport_draghi', 'petite_enfance', 'allocations_premier_enfant', 'proches_aidants'];
  it('dix réformes sourcées, adoptables, aux effets dans le bon sens', () => {
    for (const id of IDS) {
      const r = REFORMES.find((x) => x.id === id);
      expect(r, id).toBeTruthy();
      expect(r.sources.length, id).toBeGreaterThan(0);
    }
    const base = () => nouvelle();
    let ref = base(); for (let k = 0; k < 12; k++) ref = jouerTour(ref, {}, OPT);
    const jouer = (id) => { let e = jouerTour(base(), { reformes: [{ id, option: REFORMES.find((x) => x.id === id).options[0].id }] }, OPT); for (let k = 1; k < 12; k++) e = jouerTour(e, {}, OPT); return e.historique.at(-1); };
    expect(jouer('formation_chomeurs').chomage).toBeLessThan(ref.historique.at(-1).chomage);
    expect(jouer('france_2030_bis').pib).toBeGreaterThan(ref.historique.at(-1).pib);
    expect(jouer('allocations_premier_enfant').popularite).toBeGreaterThan(ref.historique.at(-1).popularite);
  });
});
