/**
 * Tests des modules ajoutés : États-Unis (Congrès, shutdown, plafond de la
 * dette, Social Security), entreprises et État stratège, baromètre et
 * élections, grands rendez-vous, modes de jeu, conseiller et succès.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { creerPartie, jouerTour, previsionPolitique, conseils } from '../src/engine/index.js';
import { validerReformes, voterBudget } from '../src/engine/politique.js';
import { executerActionEntreprise, valeurPortefeuille } from '../src/engine/entreprises.js';
import { siegesLegislativesFrance } from '../src/engine/elections.js';
import { creerAleatoire } from '../src/engine/aleatoire.js';
import { MODES, normaliserMode } from '../src/model/parametres.js';

const FICHIERS = { etatsUnis: 'etats-unis' };
const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${FICHIERS[f] ?? f}.json`, import.meta.url), 'utf8'));
const contexte = lire('_contexte-mondial');
const nouvelle = (pays = 'france', options = {}) => creerPartie({ pays, donnees: lire(pays), contexte, graine: 7, ...options });
const jouer = (e, n, decisions = {}, options = {}) => {
  for (let k = 0; k < n && !e.termine; k++) e = jouerTour(e, decisions, options);
  return e;
};

describe('États-Unis', () => {
  it('démarre sur les données fédérales sourcées', () => {
    const e = nouvelle('etatsUnis');
    expect(e.statique.devise).toBe('$');
    expect(e.finances.dette).toBeCloseTo(32400, 0);
    expect(e.finances.deficit).toBeCloseTo(2000, -1);
    expect(e.politique.senat).toEqual({ REP: 53, DEM: 47, obstruction: 60 });
    expect(e.finances.taux10).toBeCloseTo(5.25, 1);
  });
  it('organise les élections de mi-mandat au premier trimestre', () => {
    const e = jouer(nouvelle('etatsUnis'), 1);
    const mi = e.elections.historique.find((x) => x.type === 'mi_mandat');
    expect(mi).toBeTruthy();
    // Les démocrates sont favoris dans les sondages (54,6 % du vote bipartite)
    expect(e.politique.groupes.find((g) => g.id === 'DEM').sieges).toBeGreaterThan(218);
  });
  it('règle Byrd : la Social Security ne peut pas passer par la réconciliation', () => {
    const e = nouvelle('etatsUnis');
    const r = validerReformes(e, [{ id: 'social_security', option: 'plafond' }], 'reconciliation');
    expect(r.acceptees.length).toBe(0);
    expect(r.rejet.raison).toMatch(/Byrd/);
  });
  it('une loi de financement provisoire passe plus facilement qu\'un budget partisan', () => {
    const base = nouvelle('etatsUnis');
    const partisan = structuredClone(base);
    // Coupes dans les crédits discrétionnaires, que la loi de financement provisoire annule
    for (const p of ['education', 'transports', 'ecologieEnergie', 'logement', 'recherche']) partisan.budget[p].variationVolume = -20;
    const complet = voterBudget(structuredClone(partisan), 'complet');
    const cr = voterBudget(structuredClone(partisan), 'cr');
    expect(cr.senat.pour).toBeGreaterThan(complet.senat.pour);
  });
  it('le fonds de la Social Security s\'épuise vers 2034 sans réforme, plus tard avec', () => {
    let sans = nouvelle('etatsUnis');
    sans = jouer(sans, 4, {}, { evenementsActifs: false, sansPolitique: true });
    const ref = sans.retraites.fondsSS.epuisementProjete;
    expect(ref).toBeGreaterThanOrEqual(2033);
    expect(ref).toBeLessThanOrEqual(2035);
    let avec = jouerTour(nouvelle('etatsUnis'), { reformes: [{ id: 'social_security', option: 'paquet' }] }, { evenementsActifs: false, sansPolitique: true, forcerReformes: true });
    avec = jouer(avec, 3, {}, { evenementsActifs: false, sansPolitique: true });
    expect(avec.retraites.fondsSS.epuisementProjete).toBeGreaterThan(ref);
  });
  it('un bras de fer prolongé sur le plafond de la dette mène au défaut', () => {
    let e = nouvelle('etatsUnis');
    e.statique.regles.nationale.plafond = e.finances.dette + 7400 - 10; // plafond déjà atteint
    e = jouer(e, 3, { plafondDette: 'bras_de_fer' }, { evenementsActifs: false });
    expect(e.termine).toBe(true);
    expect(e.issue.cause).toBe('defaut');
  });
});

describe('Entreprises et État stratège', () => {
  it('une prise de participation augmente la dette, pas le déficit, et rapporte des dividendes', () => {
    const avant = nouvelle('france');
    const apres = jouerTour(avant, { entreprises: [{ id: 'totalenergies', action: 'participation' }] }, { evenementsActifs: false });
    const temoin = jouerTour(avant, {}, { evenementsActifs: false });
    expect(apres.finances.dette - temoin.finances.dette).toBeGreaterThan(10);
    expect(Math.abs(apres.finances.deficit - temoin.finances.deficit)).toBeLessThan(2);
    expect(apres.entreprises.fleurons.find((f) => f.id === 'totalenergies').partEtat).toBe(10);
    expect(valeurPortefeuille(apres)).toBeGreaterThan(valeurPortefeuille(temoin));
  });
  it('céder une participation réduit la dette', () => {
    const e = nouvelle('allemagne');
    const r = executerActionEntreprise(e, 'telekom', 'ceder', creerAleatoire(1));
    expect(r.cession).toBeGreaterThan(30);
    expect(e.entreprises.fleurons.find((f) => f.id === 'telekom').partEtat).toBe(0);
  });
  it('une nationalisation passe par un vote du Parlement', () => {
    const e = nouvelle('france');
    const r = executerActionEntreprise(e, 'lvmh', 'nationaliser', creerAleatoire(1));
    expect(r.texte).toMatch(/Loi/);
  });
  it('un programme stratégique coûte chaque année et renforce la souveraineté', () => {
    let e = nouvelle('france');
    e = jouerTour(e, { programmes: [{ id: 'semiconducteurs', commande: 'lancer' }] }, { evenementsActifs: false, sansPolitique: true });
    e = jouer(e, 8, {}, { evenementsActifs: false, sansPolitique: true });
    let t = jouer(nouvelle('france'), 9, {}, { evenementsActifs: false, sansPolitique: true });
    expect(e.entreprises.souverainete).toBeGreaterThan(t.entreprises.souverainete + 3);
    expect(e.budget.recherche.montant).toBeGreaterThan(t.budget.recherche.montant);
  });
  it('France : la contribution exceptionnelle des grandes entreprises disparaît en 2027 sauf prolongation', () => {
    const opts = { evenementsActifs: false, sansPolitique: true, forcerReformes: true };
    const sans = jouer(nouvelle('france'), 3, {}, opts);
    let avec = jouerTour(nouvelle('france'), { reformes: [{ id: 'surtaxe_grandes_entreprises', option: 'pleine' }] }, opts);
    avec = jouer(avec, 2, {}, opts);
    expect(avec.finances.recettes - sans.finances.recettes).toBeGreaterThan(5);
  });
});

describe('Baromètre et élections', () => {
  it('le baromètre suit dix thèmes et des intentions de vote', () => {
    const e = jouer(nouvelle('france'), 2);
    expect(Object.keys(e.opinion.themes).length).toBe(10);
    const somme = Object.values(e.opinion.intentions).reduce((s, x) => s + x, 0);
    expect(somme).toBeCloseTo(100, 0);
  });
  it('les reports de second tour profitent au bloc central', () => {
    const e = nouvelle('france');
    const { parGroupe } = siegesLegislativesFrance(e, { RN: 30, centre: 24, LR: 9, gauche: 15, LFI: 12, ecolos: 5, autres: 5 });
    const total = Object.values(parGroupe).reduce((s, x) => s + x, 0);
    expect(total).toBe(577);
    expect(parGroupe.EPR + parGroupe.DEM + parGroupe.HOR).toBeGreaterThan(parGroupe.RN + parGroupe.UDR - 40);
  });
  it('un référendum gagné adopte la réforme sans passer par l\'Assemblée', () => {
    const e = jouerTour(nouvelle('france', { mode: 'facile' }), { referendum: { id: 'plan_antifraude', option: 'oui' } }, { evenementsActifs: false });
    const r = e.elections.historique.find((x) => x.type === 'referendum');
    expect(r).toBeTruthy();
    if (r.victoireCamp) expect(e.reformes.actives.some((x) => x.id === 'plan_antifraude')).toBe(true);
  });
  it('les élections européennes et régionales ont lieu au calendrier (France)', () => {
    const e = jouer(nouvelle('france', { mode: 'facile', calendrier: 'mandat_complet' }), 12, {}, { evenementsActifs: false });
    const types = e.elections.historique.map((x) => x.type);
    expect(types).toContain('regionales');
    expect(types).toContain('europeennes');
  });
});

describe('Grands rendez-vous', () => {
  it('les sommets du premier trimestre sont proposés dès le départ', () => {
    const fr = nouvelle('france');
    expect(fr.evenements.enAttente.map((x) => x.id)).toEqual(expect.arrayContaining(['cop31', 'g20_participation']));
    const us = nouvelle('etatsUnis');
    expect(us.evenements.enAttente.map((x) => x.id)).toContain('g20_miami');
  });
  it('les choix de préparation des Jeux sont mémorisés', () => {
    let e = nouvelle('etatsUnis', { mode: 'facile' });
    e = jouer(e, 5, {}, { sansPolitique: true }); // jusqu'au T1 2028
    const id = e.evenements.enAttente.find((x) => x.id === 'la28_preparation')?.id;
    if (id) {
      e = jouerTour(e, { evenements: { la28_preparation: 'securite' } }, { sansPolitique: true });
      expect(e.grandsEvenements.la28.securite).toBe('renforcee');
    }
  });
});

describe('Modes, conseiller et succès', () => {
  it('les anciens modes sont convertis', () => {
    expect(normaliserMode('realiste')).toBe('intermediaire');
    expect(normaliserMode('bac_a_sable')).toBe('facile');
    expect(nouvelle('france', { mode: 'difficile' }).mode).toBe('expert');
    expect(MODES.expert.conseiller).toBe(false);
  });
  it('le mode expert rend les pointages incertains', () => {
    expect(previsionPolitique(nouvelle('france', { mode: 'expert' }), {}).incertitude).toBeGreaterThan(0);
    expect(previsionPolitique(nouvelle('france', { mode: 'facile' }), {}).incertitude).toBe(0);
  });
  it('le conseiller signale un budget qui ne passe pas', () => {
    const e = nouvelle('france');
    const decisions = { impots: { tva: 25 }, budget: { protectionSociale: -20, sante: -15 } };
    const liste = conseils(e, previsionPolitique(e, decisions));
    expect(liste.length).toBeGreaterThan(0);
    expect(liste[0].niveau).toBe('alerte');
  });
  it('débloque des succès au fil de la partie', () => {
    const e = jouer(nouvelle('allemagne', { mode: 'facile' }), 4);
    expect(Array.isArray(e.succes)).toBe(true);
    expect(e.succes.length).toBeGreaterThan(0);
  });
});
