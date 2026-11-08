/**
 * Programme de La France insoumise (présidentielle 2027) : contre-budget 2027,
 * pôle public bancaire, BCE, options SMIC à 1 700 € et carburant à 1,70 €.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { creerPartie, jouerTour, reformesDisponibles } from '../src/engine/index.js';
import { trouverReforme } from '../src/engine/reformes.js';
import { REFORMES_LFI, BUDGET_LFI_2027, INSPIRATIONS_LFI, SOURCE_LFI, PART_PRUDENTE } from '../src/data/reformesLFI.js';
import { PROGRAMMES } from '../src/data/programmes.js';

const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${f}.json`, import.meta.url), 'utf8'));
const contexte = lire('_contexte-mondial');
const nouvelle = () => creerPartie({ pays: 'france', donnees: lire('france'), contexte, graine: 13, mode: 'facile', calendrier: 'horizon2050' });
const SANS = { evenementsActifs: false, sansPolitique: true, forcerReformes: true };
const jouer = (e, n, premier = {}) => { let x = jouerTour(e, premier, SANS); for (let k = 1; k < n; k++) x = jouerTour(x, {}, SANS); return x; };
const somme = (o = {}) => Object.values(o).reduce((s, v) => s + v, 0);
const total = (l) => l.reduce((s, m) => s + m.montant, 0);
/** Montants d'une réforme une fois montée en charge, en Md€ de départ. */
const regime = (e, id, option) => {
  const eff = trouverReforme(id).effets(e, option, 8, {});
  const k = e.macro.niveauPrix / 100;
  return { depenses: somme(eff.depenses) / k, recettes: somme(eff.recettes) / k, eff };
};
const BLOCS_DEPENSES = ['lfi_revenus', 'lfi_services_publics', 'lfi_planification'];
const BLOCS_RECETTES = ['lfi_fiscalite_2017', 'lfi_ultra_riches', 'lfi_grandes_entreprises'];

describe('Le contre-budget 2027 de LFI', () => {
  it('reprend les montants du document : 106,4 Md€ de recettes, 81,7 de dépenses, 24,7 de baisse du déficit', () => {
    const recettes = total(BUDGET_LFI_2027.cadeauxFiscaux) + total(BUDGET_LFI_2027.ultraRiches) + total(BUDGET_LFI_2027.entreprises);
    const depenses = total(BUDGET_LFI_2027.revenus) + total(BUDGET_LFI_2027.servicesPublics) + total(BUDGET_LFI_2027.planification) + total(BUDGET_LFI_2027.securiteSociale);
    expect(recettes).toBeCloseTo(106.4, 6);
    expect(depenses).toBeCloseTo(81.7, 6);
    expect(recettes - depenses).toBeCloseTo(24.7, 6);
    const bilan = SOURCE_LFI.lfi.bilan;
    expect(bilan.find((l) => l.total).montant).toBeCloseTo(recettes - depenses, 6);
  });

  it('chaque réforme LFI est sourcée, chiffrée et rattachée à LFI', () => {
    expect(REFORMES_LFI.length).toBe(8);
    for (const r of REFORMES_LFI) {
      expect(r.sources.length, r.id).toBeGreaterThan(0);
      expect(r.chiffrage, r.id).toBeTruthy();
      expect(r.inspirations).toEqual(['lfi']);
      expect(r.chiffrage, r.id).not.toMatch(/\d\.\d{3,}/); // pas de décimales parasites
    }
  });

  it('les réformes de dépenses et de recettes montent en charge jusqu\'aux montants annoncés', () => {
    const e = nouvelle();
    expect(regime(e, 'lfi_revenus', 'urgence').depenses).toBeCloseTo(37.5, 6);
    expect(regime(e, 'lfi_services_publics', 'urgence').depenses).toBeCloseTo(22.2, 6);
    expect(regime(e, 'lfi_planification', 'urgence').depenses).toBeCloseTo(10, 6);
    expect(regime(e, 'lfi_fiscalite_2017', 'annonce').recettes).toBeCloseTo(44, 6);
    expect(regime(e, 'lfi_ultra_riches', 'annonce').recettes).toBeCloseTo(35, 6);
    expect(regime(e, 'lfi_grandes_entreprises', 'annonce').recettes).toBeCloseTo(27.4, 6);
    // Option prudente : la moitié du rendement annoncé
    for (const id of BLOCS_RECETTES) expect(regime(e, id, 'prudent').recettes).toBeCloseTo(regime(e, id, 'annonce').recettes * PART_PRUDENTE, 6);
  });

  it('les réformes existantes reprises par LFI portent son étiquette et sa note', () => {
    const liste = reformesDisponibles(nouvelle());
    for (const id of Object.keys(INSPIRATIONS_LFI)) {
      const r = liste.find((x) => x.id === id);
      expect(r, id).toBeTruthy();
      expect(r.inspirations).toContain('lfi');
      expect(r.notesInspiration.lfi).toBeTruthy();
    }
  });

  it('la fiche de Jean-Luc Mélenchon s\'appuie sur le contre-budget et les nouvelles options', () => {
    const m = PROGRAMMES.find((p) => p.id === 'melenchon');
    const ids = m.mesures.map((x) => x.reforme);
    for (const id of [...BLOCS_DEPENSES, ...BLOCS_RECETTES, 'lfi_pole_bancaire', 'lfi_bce_dette']) expect(ids).toContain(id);
    expect(m.mesures.find((x) => x.reforme === 'smic_hausse').option).toBe('mille_sept_cents');
    expect(m.mesures.find((x) => x.reforme === 'blocage_prix').option).toBe('carburant');
    expect(m.sources.some((s) => s.url.includes('remettre-de-l-ordre'))).toBe(true);
    // Aucune mesure du programme n'est remplacée par une autre mesure du même programme
    for (const x of m.mesures) for (const autre of trouverReforme(x.reforme).remplace ?? []) expect(ids, `${x.reforme} remplace ${autre}`).not.toContain(autre);
  });

  it('adopter les revenus d\'urgence remplace la hausse de 2 % du point d\'indice', () => {
    const e = jouer(nouvelle(), 3, { reformes: [{ id: 'point_indice_hausse', option: 'deux' }] });
    expect(e.reformes.actives.some((a) => a.id === 'point_indice_hausse')).toBe(true);
    const x = jouer(e, 1, { reformes: [{ id: 'lfi_revenus', option: 'urgence' }] });
    expect(x.reformes.actives.some((a) => a.id === 'point_indice_hausse')).toBe(false);
    expect(x.reformes.actives.some((a) => a.id === 'lfi_revenus')).toBe(true);
  });

  it('le contre-budget réduit le déficit avec les recettes annoncées, l\'aggrave avec l\'hypothèse prudente', () => {
    const budget = (option) => [...BLOCS_DEPENSES.map((id) => ({ id, option: 'urgence' })), ...BLOCS_RECETTES.map((id) => ({ id, option }))];
    const sans = jouer(nouvelle(), 8);
    const annonce = jouer(nouvelle(), 8, { reformes: budget('annonce') });
    const prudent = jouer(nouvelle(), 8, { reformes: budget('prudent') });
    expect(Number.isFinite(annonce.finances.deficitRatio)).toBe(true);
    expect(annonce.finances.deficitRatio).toBeLessThan(sans.finances.deficitRatio);
    expect(prudent.finances.deficitRatio).toBeGreaterThan(annonce.finances.deficitRatio + 1);
  });
});

describe('Hors budget : pôle public bancaire et BCE', () => {
  it('le pôle public bancaire soutient l\'activité et réduit les émissions', () => {
    const sans = jouer(nouvelle(), 16);
    const avec = jouer(nouvelle(), 16, { reformes: [{ id: 'lfi_pole_bancaire', option: 'complet' }] });
    expect(avec.macro.pibReel).toBeGreaterThan(sans.macro.pibReel * 1.003);
    // La croissance supplémentaire émet aussi : une partie des tonnes évitées est reprise
    expect(avec.climat.emissions).toBeLessThan(sans.climat.emissions - 2);
    // Hors budget de l'État : seul le coût des livrets pèse sur les comptes (environ 1 Md€)
    const { depenses, recettes } = regime(nouvelle(), 'lfi_pole_bancaire', 'complet');
    expect(depenses - recettes).toBeLessThan(1.5);
  });

  it('demander à la BCE d\'annuler sa dette n\'a pas d\'effet budgétaire mais inquiète les marchés', () => {
    const def = trouverReforme('lfi_bce_dette');
    expect(def.effets(nouvelle(), 'annuler', 4)).toEqual({});
    expect(def.reaction(nouvelle(), 'annuler').credibilite).toBeLessThan(def.reaction(nouvelle(), 'reinvestir').credibilite);
    expect(reformesDisponibles(nouvelle()).find((r) => r.id === 'lfi_bce_dette').vote).toBe(false);
  });
});

describe('Nouvelles options', () => {
  it('SMIC à 1 700 € net : plus de pouvoir d\'achat et plus de chômage qu\'à 1 600 €', () => {
    const def = trouverReforme('smic_hausse');
    const e = nouvelle();
    const a = def.effets(e, 'mille_six_cents', 8);
    const b = def.effets(e, 'mille_sept_cents', 8);
    expect(b.chomageStructurel).toBeGreaterThan(a.chomageStructurel);
    expect(b.menages.smic[0].montant).toBeGreaterThan(a.menages.smic[0].montant);
    // Les options existantes ne changent pas
    expect(a.chomageStructurel).toBeCloseTo(0.35, 6);
  });

  it('carburant bloqué à 1,70 € : baisse ponctuelle des prix, coût qui croît avec le prix de l\'énergie', () => {
    const def = trouverReforme('blocage_prix');
    const e = nouvelle();
    const depart = def.effets(e, 'carburant', 0);
    expect(depart.chocPrix).toBeLessThan(0);
    expect(depart.depenses.economieFinances).toBeCloseTo(1.5 * e.macro.niveauPrix / 100, 6);
    const cher = { ...e, monde: { ...e.monde, energie: e.monde.energie * 1.3 } };
    expect(def.effets(cher, 'carburant', 4).depenses.economieFinances).toBeGreaterThan(depart.depenses.economieFinances);
  });
});
