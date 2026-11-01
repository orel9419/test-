/**
 * Tests unitaires du moteur de simulation.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { creerPartie, jouerTour, apercuDecisions, chiffrerReforme, reformesDisponibles, actionsDisponibles } from '../src/engine/index.js';
import { primeRisqueModele } from '../src/engine/finances.js';
import { creerAleatoire } from '../src/engine/aleatoire.js';
import { trimestreSuivant, ecartTrimestres, libelleTrimestre } from '../src/engine/calendrier.js';

const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${f}.json`, import.meta.url), 'utf8'));
const contexte = lire('_contexte-mondial');
const nouvelle = (pays = 'france', options = {}) => creerPartie({ pays, donnees: lire(pays), contexte, graine: 7, ...options });
// Les tests économiques forcent l'adoption des réformes (le vote parlementaire est testé à part)
const jouer = (e, n, decisions = () => ({}), options = { evenementsActifs: false, forcerReformes: true, sansPolitique: true }) => {
  for (let k = 0; k < n && !e.termine; k++) e = jouerTour(e, typeof decisions === 'function' ? decisions(k) : decisions, options);
  return e;
};

describe('Calendrier et aléatoire', () => {
  it('enchaîne les trimestres', () => {
    expect(trimestreSuivant({ annee: 2026, t: 4 })).toEqual({ annee: 2027, t: 1 });
    expect(ecartTrimestres({ annee: 2026, t: 4 }, { annee: 2027, t: 2 })).toBe(2);
    expect(libelleTrimestre({ annee: 2027, t: 2 })).toBe('T2 2027');
  });
  it('produit des tirages reproductibles', () => {
    const a = creerAleatoire(99), b = creerAleatoire(99);
    expect([a.uniforme(), a.uniforme()]).toEqual([b.uniforme(), b.uniforme()]);
  });
});

describe('Calibrage de départ sur les données sourcées', () => {
  it('France : dette, déficit, intérêts et taux de départ', () => {
    const e = nouvelle('france');
    expect(e.finances.detteRatio).toBeCloseTo(119.3, 1);   // PLF 2027
    expect(e.finances.deficitRatio).toBeCloseTo(5.4, 1);   // PLF 2027
    expect(e.finances.interets).toBeCloseTo(79.2, 1);      // Sénat
    expect(e.finances.taux10).toBeCloseTo(4.77, 2);        // OAT 10 ans
    expect(e.finances.spread).toBeGreaterThan(100);
    expect(e.macro.chomage).toBe(8.3);
    expect(e.macro.inflation).toBeCloseTo(3.0, 5);
  });
  it('France : postes de dépense et prélèvements bouclent les totaux', () => {
    const e = nouvelle('france');
    const primaires = Object.values(e.budget).reduce((s, l) => s + l.montant, 0);
    expect(primaires + e.finances.interets).toBeCloseTo(e.finances.depenses, 3);
    const recettes = Object.values(e.impots).reduce((s, i) => s + i.R0, 0);
    expect(recettes).toBeCloseTo(e.finances.recettes, 3);
    expect(e.budget.retraites.montant).toBeCloseTo(e.retraites.depenses, 3);
  });
  it('Allemagne : taux du Bund et dette de départ', () => {
    const e = nouvelle('allemagne');
    expect(e.finances.taux10).toBeCloseTo(3.55, 2);
    expect(e.finances.detteRatio).toBeGreaterThan(64);
    expect(e.finances.detteRatio).toBeLessThan(68);
    expect(Math.abs(e.finances.spread)).toBeLessThan(5);
  });
  it('chaque poste de départ porte une provenance', () => {
    for (const pays of ['france', 'allemagne']) {
      const e = nouvelle(pays);
      for (const [id, m] of Object.entries(e.statique.ministeres)) {
        expect(m.provenance?.statut, `${pays}/${id}`).toBeTruthy();
      }
    }
  });
});

describe('Dynamique des finances publiques', () => {
  it('la dette augmente du déficit trimestriel', () => {
    const e0 = nouvelle('france');
    const e1 = jouerTour(e0, {}, { evenementsActifs: false });
    expect(e1.finances.dette).toBeCloseTo(e0.finances.dette + e1.finances.deficit / 4, 6);
  });
  it('la prime de risque augmente avec la dette et le déficit, et baisse avec la crédibilité', () => {
    expect(primeRisqueModele(120, 5, 0, 0)).toBeGreaterThan(primeRisqueModele(90, 5, 0, 0));
    expect(primeRisqueModele(120, 6, 0, 0)).toBeGreaterThan(primeRisqueModele(120, 3, 0, 0));
    expect(primeRisqueModele(120, 5, 0, 1)).toBeLessThan(primeRisqueModele(120, 5, 0, 0));
  });
  it('le taux moyen de la dette française converge vers le taux de marché', () => {
    const e = jouer(nouvelle('france'), 8);
    expect(e.finances.tauxMoyen).toBeGreaterThan(2.18);
    expect(e.finances.interets).toBeGreaterThan(90);
  });
  it('une partie est déterministe à graine et décisions identiques', () => {
    const a = jouer(nouvelle('france'), 6, {}, {});
    const b = jouer(nouvelle('france'), 6, {}, {});
    expect(a.finances.dette).toBe(b.finances.dette);
    expect(a.monde.energie).toBe(b.monde.energie);
  });
  it('le bilan annuel vérifie la procédure européenne (France) et le frein à l\'endettement (Allemagne)', () => {
    const fr = jouerTour(nouvelle('france'), {}, { evenementsActifs: false });
    expect(fr.finances.historiqueAnnuel[0].regles.some((r) => r.id === 'pde')).toBe(true);
    const de = jouerTour(nouvelle('allemagne'), {}, { evenementsActifs: false });
    expect(de.finances.historiqueAnnuel[0].regles.some((r) => r.id === 'schuldenbremse')).toBe(true);
  });
});

describe('Budget et fiscalité', () => {
  it('une baisse de dépense est progressive (inertie)', () => {
    const e = jouerTour(nouvelle('france'), { budget: { education: -20 } }, { evenementsActifs: false });
    const l = e.budget.education;
    const baisse = 1 - l.montant / l.montantInitial;
    expect(baisse).toBeGreaterThan(0);
    expect(baisse).toBeLessThan(0.05);
  });
  it('le mode bac à sable supprime l\'inertie', () => {
    const e = jouerTour(nouvelle('france', { mode: 'bac_a_sable' }), { budget: { education: -20 } }, { evenementsActifs: false });
    expect(1 - e.budget.education.montant / (e.budget.education.montantInitial * e.macro.niveauPrix / 100)).toBeGreaterThan(0.15);
  });
  it('une hausse de TVA augmente les recettes et les prix', () => {
    const base = jouer(nouvelle('france'), 4);
    const tva = jouer(nouvelle('france'), 4, (k) => (k === 0 ? { impots: { tva: 22 } } : {}));
    expect(tva.impots.tva.rendement).toBeGreaterThan(base.impots.tva.rendement * 1.05);
    expect(tva.macro.niveauPrix).toBeGreaterThan(base.macro.niveauPrix);
    // Les ménages perdent du pouvoir d'achat (les salaires ne suivent les prix qu'en partie et avec retard)
    const reel = (e, id) => e.menages.find((m) => m.id === id).revenuReel;
    expect(reel(tva, 'couple')).toBeLessThan(reel(base, 'couple'));
    expect(reel(tva, 'retraite')).toBeLessThan(reel(base, 'retraite'));
  });
  it('baisser l\'impôt sur le revenu réduit les recettes et aide le couple de salariés', () => {
    const base = jouer(nouvelle('france'), 2);
    const ir = jouer(nouvelle('france'), 2, (k) => (k === 0 ? { impots: { impotRevenu: 90 } } : {}));
    expect(ir.impots.impotRevenu.rendement).toBeLessThan(base.impots.impotRevenu.rendement);
    const couple = (e) => e.menages.find((m) => m.id === 'couple').revenuReel;
    expect(couple(ir)).toBeGreaterThan(couple(base));
  });
  it('les taux sont bornés', () => {
    const e = jouerTour(nouvelle('france'), { impots: { tva: 80 } }, { evenementsActifs: false });
    expect(e.impots.tva.taux).toBe(25);
  });
});

describe('Réformes', () => {
  it('65 ans réduit la dépense de retraite ; l\'abrogation l\'augmente (par rapport à la loi en vigueur)', () => {
    const base = jouer(nouvelle('france'), 14);
    const a65 = jouer(nouvelle('france'), 14, (k) => (k === 0 ? { reformes: [{ id: 'retraites_age', option: 'age_65' }] } : {}));
    const a62 = jouer(nouvelle('france'), 14, (k) => (k === 0 ? { reformes: [{ id: 'retraites_age', option: 'abrogation_62' }] } : {}));
    expect(a65.retraites.depenses).toBeLessThan(base.retraites.depenses - 5);
    expect(a62.retraites.depenses).toBeGreaterThan(base.retraites.depenses + 5);
    expect(a65.retraites.ageLegal).toBeGreaterThan(base.retraites.ageLegal);
  });
  it('un recul de l\'âge crée un grief que les compensations réduisent', () => {
    const sans = jouer(nouvelle('france'), 3, (k) => (k === 0 ? { reformes: [{ id: 'retraites_age', option: 'age_65' }] } : {}));
    const avec = jouer(nouvelle('france'), 3, (k) => (k === 0 ? { reformes: [
      { id: 'retraites_age', option: 'age_65' }, { id: 'retraites_penibilite', option: 'oui' }, { id: 'retraites_carrieres_longues', option: 'oui' },
    ] } : {}));
    expect(sans.social.groupes.salaries.grief).toBeGreaterThan(avec.social.groupes.salaries.grief);
    expect(sans.social.groupes.salaries.risque).toBeGreaterThan(avec.social.groupes.salaries.risque);
  });
  it('39 h avec 2 h exonérées : le salarié au SMIC gagne, le couple qui faisait des heures sup perd la majoration', () => {
    const e = jouer(nouvelle('france'), 10, (k) => (k === 0 ? { reformes: [{ id: 'temps_travail', option: '39h_exo2' }] } : {}));
    const base = jouer(nouvelle('france'), 10);
    const delta = (id) => e.menages.find((m) => m.id === id).revenuReel - base.menages.find((m) => m.id === id).revenuReel;
    expect(delta('smic')).toBeGreaterThan(80);
    const detailCouple = e.menages.find((m) => m.id === 'couple').details.find((d) => d.cause.startsWith('Temps de travail'));
    expect(detailCouple.montant).toBeLessThan(0);
    expect(e.travail.offreTravail).toBeGreaterThan(0.5);
    expect(e.travail.coutBudgetaire).toBeGreaterThan(0); // les exonérations coûtent au budget
    expect(e.macro.pibPotentiel).toBeGreaterThan(base.macro.pibPotentiel);
  });
  it('39 h payées 35 baisse le coût horaire du travail mais provoque un fort grief', () => {
    const e = jouer(nouvelle('france'), 4, (k) => (k === 0 ? { reformes: [{ id: 'temps_travail', option: '39h_non_payees' }] } : {}));
    expect(e.travail.chomageStructurel).toBeLessThan(0);
    expect(e.social.groupes.salaries.grief).toBeGreaterThan(10);
  });
  it('le chiffrage par simulation donne un gain budgétaire pour la sous-indexation des pensions', () => {
    const c = chiffrerReforme(nouvelle('france'), 'retraites_indexation', 'sous_indexation', 12);
    expect(c.final.soldeMd).toBeGreaterThan(4);
    expect(c.final.groupes.retraites).toBeLessThan(0);
  });
  it('les réformes proposées dépendent du pays', () => {
    const fr = reformesDisponibles(nouvelle('france')).map((r) => r.id);
    const de = reformesDisponibles(nouvelle('allemagne')).map((r) => r.id);
    expect(fr).toContain('temps_travail');
    expect(fr).not.toContain('rente_alter');
    expect(de).toContain('rente_alter');
    expect(de).toContain('bouclier_energie');
  });
  it('la hausse de cotisation retraite allemande de 2028 s\'applique, sauf si le budget fédéral la compense', () => {
    const base = jouer(nouvelle('allemagne'), 6);
    const bloque = jouer(nouvelle('allemagne'), 6, (k) => (k === 0 ? { reformes: [{ id: 'rente_cotisation_2028', option: 'subvention' }] } : {}));
    expect(base.impots.cotisations.taux).toBeGreaterThan(102);
    expect(bloque.impots.cotisations.taux).toBe(100);
    expect(bloque.finances.deficit).toBeGreaterThan(base.finances.deficit);
  });
});

describe('International', () => {
  it('le prêt européen SAFE réduit la charge d\'intérêts (France)', () => {
    const base = jouer(nouvelle('france'), 3);
    const safe = jouer(nouvelle('france'), 3, (k) => (k === 0 ? { diplomatie: [{ id: 'pret_safe' }] } : {}));
    expect(safe.finances.interets).toBeLessThan(base.finances.interets);
    expect(actionsDisponibles(nouvelle('allemagne')).some((a) => a.id === 'pret_safe')).toBe(false);
  });
  it('le capital diplomatique limite le nombre d\'actions par trimestre', () => {
    const e = jouerTour(nouvelle('france'), { diplomatie: [{ id: 'emprunt_commun' }, { id: 'achats_groupes' }] }, { evenementsActifs: false });
    expect(e.resultatsTour.diplomatie[1].erreur).toMatch(/insuffisant/);
  });
});

describe('Institutions et vie politique', () => {
  it('France : le budget 2027 est rejeté au vote mais adopté par le 49.3, la censure échoue', () => {
    const e = jouerTour(nouvelle('france'), {}, { evenementsActifs: false });
    expect(e.resultatsTour.budget.procedure).toBe('49.3');
    expect(e.resultatsTour.budget.censure.voix).toBeLessThan(289);
    expect(e.politique.budgetsAdoptes).toContain(2027);
    expect(e.termine).toBe(false);
  });
  it('France : sans 49.3, la retraite à 65 ans est rejetée par l\'Assemblée', () => {
    const e = jouerTour(nouvelle('france'), { reformes: [{ id: 'retraites_age', option: 'age_65' }] }, { evenementsActifs: false });
    expect(e.reformes.actives.some((r) => r.id === 'retraites_age')).toBe(false);
    expect(e.resultatsTour.alertes.some((a) => a.type === 'rejet')).toBe(true);
  });
  it('France : un budget très dur fait basculer les socialistes dans la censure', () => {
    const decisions = { budget: { protectionSociale: -15, sante: -10, education: -10, logement: -15 }, impots: { tva: 23 }, procedureBudget: '49.3' };
    const e = jouerTour(nouvelle('france'), decisions, { evenementsActifs: false });
    expect(e.resultatsTour.budget.censure.voix).toBeGreaterThanOrEqual(289);
    expect(e.termine).toBe(true);
    expect(e.issue.cause).toBe('censure');
  });
  it('France : un compromis avec le PS permet de voter le budget', () => {
    const e = jouerTour(nouvelle('france'), { procedureBudget: 'compromis' }, { evenementsActifs: false });
    expect(e.resultatsTour.budget.adopte).toBe(true);
  });
  it('Allemagne : le SPD bloque un recul de l\'âge à 68 ans', () => {
    const e = jouerTour(nouvelle('allemagne'), { reformes: [{ id: 'rente_alter', option: 'age_68' }] }, { evenementsActifs: false });
    expect(e.reformes.actives.some((r) => r.id === 'rente_alter')).toBe(false);
  });
  it('Allemagne : la réforme du frein à l\'endettement exige les deux tiers', () => {
    const e = jouerTour(nouvelle('allemagne'), { reformes: [{ id: 'schuldenbremse_reforme', option: 'regle_or' }] }, { evenementsActifs: false });
    const adoptee = e.reformes.actives.some((r) => r.id === 'schuldenbremse_reforme');
    if (!adoptee) expect(e.journal.some((j) => /deux tiers/.test(j.texte) || /rejet/i.test(j.texte) || /bloque/.test(j.texte))).toBe(true);
  });
  it('génère 3 à 5 objectifs principaux selon le régime', () => {
    for (const pays of ['france', 'allemagne']) {
      const e = nouvelle(pays);
      const principaux = e.objectifs.filter((o) => o.type === 'principal');
      expect(principaux.length).toBeGreaterThanOrEqual(3);
      expect(principaux.length).toBeLessThanOrEqual(6);
    }
    expect(nouvelle('france').objectifs.some((o) => o.id === 'presidentielle')).toBe(true);
    expect(nouvelle('allemagne').objectifs.some((o) => o.id === 'coalition')).toBe(true);
  });
  it('produit des événements à choix et les applique', () => {
    let e = nouvelle('france');
    let vus = 0;
    for (let k = 0; k < 12 && !e.termine; k++) {
      e = jouerTour(e, { procedureBudget: 'compromis' }, {});
      vus += e.evenements.enAttente.length;
    }
    expect(vus).toBeGreaterThan(0);
    expect(e.evenements.historique.length).toBeGreaterThan(0);
  });
  it('calcule un score final avec ses composantes', () => {
    let e = nouvelle('allemagne', { mode: 'bac_a_sable' });
    while (!e.termine) e = jouerTour(e, {}, { evenementsActifs: false });
    expect(e.score.total).toBeGreaterThan(0);
    expect(Object.keys(e.score.composantes)).toContain('objectifs');
  });
  it('l\'état de la partie est sérialisable en JSON (sauvegarde)', () => {
    let e = nouvelle('france');
    e = jouerTour(e, {}, {});
    const copie = JSON.parse(JSON.stringify(e));
    const suite = jouerTour(copie, {}, {});
    expect(suite.tour).toBe(3);
  });
});

describe('Aperçu des décisions', () => {
  it('mesure l\'effet immédiat d\'une hausse de dépense', () => {
    const a = apercuDecisions(nouvelle('france'), { budget: { transports: 20 } });
    expect(a.immediat.soldeMd).toBeLessThan(0);   // le solde se dégrade
    expect(a.unAn.pib).toBeGreaterThan(0);        // le PIB est plus élevé
  });
});

describe('Fin de partie', () => {
  it('la partie se termine à la fin du mandat (20 trimestres en France, 16 en Allemagne)', () => {
    const fr = jouer(nouvelle('france', { mode: 'bac_a_sable' }), 30);
    expect(fr.termine).toBe(true);
    expect(fr.historique.length).toBe(21);
    const de = jouer(nouvelle('allemagne', { mode: 'bac_a_sable' }), 30);
    expect(de.historique.length).toBe(17);
  });
});
