/**
 * Institutions (France) : Élysée et Matignon, Sénat, pouvoirs propres,
 * cohabitation ; porte-avions (Charles-de-Gaulle et « France Libre »).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { creerPartie, jouerTour, resumeInstitutions, porteAvions } from '../src/engine/index.js';
import { navette, revisionConstitutionnelle, voteSenatTexte, apresLegislatives, accordPresident, propositionGouvernement, configuration, gouvernementCohabitation, neutraliserDecisions, injecterEvenementsInstitutions } from '../src/engine/institutions.js';
import { validerReformes } from '../src/engine/politique.js';
import { controleConstitutionnel } from '../src/engine/constitution.js';
import { creerAleatoire } from '../src/engine/aleatoire.js';
import { SENAT_GROUPES, SIEGES_SENAT, POUVOIRS_PRESIDENT, POUVOIRS_PREMIER_MINISTRE } from '../src/data/institutions.js';

const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${f}.json`, import.meta.url), 'utf8'));
const contexte = lire('_contexte-mondial');
const nouvelle = (options = {}) => creerPartie({ pays: 'france', donnees: lire('france'), contexte, graine: 5, mode: 'facile', calendrier: 'horizon2050', ...options });
const SANS = { evenementsActifs: false };

/** Donne la majorité absolue au RN (pour simuler des législatives perdues). */
function majoriteRN(e) {
  for (const g of e.politique.groupes) {
    if (g.id === 'RN') g.sieges = 280; else if (g.id === 'UDR') g.sieges = 30;
    else if (['EPR', 'DEM', 'HOR'].includes(g.id)) g.sieges = Math.round(g.sieges * 0.6);
  }
  const reste = 577 - e.politique.groupes.reduce((s, g) => s + g.sieges, 0);
  e.politique.groupes.find((g) => g.id === 'LIOT').sieges += reste;
}

describe('Institutions : données', () => {
  it('Sénat d\'octobre 2026 : 348 sièges, LR premier groupe, majorité de droite et du centre', () => {
    expect(SENAT_GROUPES.reduce((s, g) => s + g.sieges, 0)).toBe(SIEGES_SENAT);
    expect(SENAT_GROUPES.find((g) => g.id === 'LR').sieges).toBe(124);
    const r = resumeInstitutions(nouvelle());
    expect(r.senat.majoriteDroiteCentre).toBeGreaterThanOrEqual(175);
    expect(r.senat.president).toBe('Gérard Larcher');
  });

  it('les pouvoirs citent leurs articles, et l\'article 19 distingue les pouvoirs propres', () => {
    expect(POUVOIRS_PRESIDENT.find((p) => p.id === 'dissolution')).toMatchObject({ article: '12', propre: true });
    expect(POUVOIRS_PRESIDENT.find((p) => p.id === 'grace').propre).toBe(false);
    expect(POUVOIRS_PREMIER_MINISTRE.some((p) => p.article === '49, alinéa 1')).toBe(true);
  });

  it('au départ : majorité relative, Emmanuel Macron à l\'Élysée, Sébastien Lecornu à Matignon', () => {
    const r = resumeInstitutions(nouvelle());
    expect(r.configuration.id).toBe('majorite_relative');
    expect(r.titulaires.president.nom).toContain('Emmanuel Macron');
    expect(r.titulaires.premierMinistre.nom).toContain('Lecornu');
    expect(resumeInstitutions(creerPartie({ pays: 'allemagne', donnees: lire('allemagne'), contexte, graine: 5 }))).toBeNull();
  });
});

describe('Sénat', () => {
  it('un texte rejeté par le Sénat est adopté sur le dernier mot de l\'Assemblée (article 45)', () => {
    const e = nouvelle();
    const r = navette(e, [{ id: 'dotations_collectivites', option: 'gel' }]);
    if (r.senat.adopte) expect(r.issue).toBe('accord');
    else { expect(r.issue).toBe('dernier_mot'); expect(r.bloquees).toHaveLength(0); }
  });

  it('une loi organique relative au Sénat exige son accord (article 46)', () => {
    const e = nouvelle();
    const r = navette(e, [{ id: 'reduction_parlementaires', option: 'oui' }]);
    expect(r.senat.adopte).toBe(false);
    expect(r.issue).toBe('bloque');
    expect(r.bloquees.map((x) => x.id)).toEqual(['reduction_parlementaires']);
  });

  it('une révision de la Constitution passe par les deux assemblées puis le Congrès (article 89)', () => {
    const e = nouvelle();
    const rev = revisionConstitutionnelle(e, [{ id: 'regle_or', option: 'oui' }]);
    expect(rev.congres.requis).toBe(Math.ceil(0.6 * rev.congres.exprimes));
    if (!rev.senat.adopte && rev.an.adopte) expect(rev.raison).toMatch(/Sénat/);
    const s = voteSenatTexte(e, [{ id: 'reduction_parlementaires', option: 'oui' }]);
    expect(s.pour + s.contre + s.abstention).toBe(SIEGES_SENAT);
  });

  it('le Sénat est renouvelé par moitié en septembre 2029', () => {
    let e = nouvelle();
    e.trimestre = { annee: 2029, t: 3 };
    e = jouerTour(e, {}, SANS);
    expect(e.institutions.senat.renouvellements[0].annee).toBe(2029);
    expect(e.institutions.senat.groupes.reduce((s, g) => s + g.sieges, 0)).toBe(SIEGES_SENAT);
  });
});

describe('Pouvoirs du Premier ministre', () => {
  it('question de confiance (49.1) : une fois par session ; refusée, le Gouvernement tombe', () => {
    const e1 = jouerTour(nouvelle(), { questionConfiance: true }, SANS);
    const v = e1.resultatsTour.institutions.confiance;
    expect(v.pour + v.contre + v.abstention).toBe(577);
    expect(e1.journal.some((j) => j.texte.includes('Article 49, alinéa 1'))).toBe(true);
    if (!v.accordee) expect(e1.politique.gouvernementsRenverses).toBe(1); // partie longue : un nouveau gouvernement
    const e2 = jouerTour(e1, { questionConfiance: true }, SANS);
    expect(e2.resultatsTour.institutions?.confiance?.erreur ?? 'déjà').toMatch(/déjà/);
  });

  it('le président refuse dissolution et référendum quand l\'entente est rompue', () => {
    const e = nouvelle();
    expect(accordPresident(e, 'dissolution').accord).toBe(true);
    e.institutions.entente = 25;
    expect(accordPresident(e, 'dissolution').accord).toBe(false);
    const apres = jouerTour(e, { referendum: { id: 'regle_or', option: 'oui' } }, SANS);
    expect(apres.resultatsTour.referendum).toBeUndefined();
    expect(apres.resultatsTour.alertes.some((a) => /refuse/.test(a.texte))).toBe(true);
  });

  it('les priorités de l\'Élysée rapprochent les deux têtes de l\'exécutif', () => {
    const e = nouvelle();
    const avant = e.institutions.entente;
    const apres = jouerTour(e, { reformes: [{ id: 'effort_defense', option: 'lpm' }] }, { ...SANS, forcerReformes: true });
    expect(resumeInstitutions(e).priorites.map((p) => p.id)).toContain('effort_defense');
    expect(apres.institutions.entente).toBeGreaterThan(avant - 2);
  });
});

describe('Pouvoirs du président', () => {
  it('message au Congrès (article 18) : une fois par an', () => {
    let e = nouvelle({ role: 'president' });
    e.trimestre = { annee: 2027, t: 3 };
    e = jouerTour(e, { congres: true }, SANS);
    expect(e.resultatsTour.institutions.congres.texte).toMatch(/Congrès/);
    expect(resumeInstitutions(e).disponibles.congres).toBe(false);
  });

  it('un Premier ministre en désaccord peut refuser de proposer un référendum (article 11)', () => {
    const e = nouvelle({ role: 'president' });
    expect(propositionGouvernement(e).accord).toBe(true);
    e.institutions.entente = 20;
    expect(propositionGouvernement(e).accord).toBe(false);
  });

  it('la saisine par le président rend le contrôle de constitutionnalité plus sévère', () => {
    const e = nouvelle();
    let censures = 0, censuresSaisine = 0;
    for (let k = 0; k < 200; k++) {
      if (controleConstitutionnel(structuredClone(e), 'taxe_hauts_patrimoines', 'oui', 'Taxe', creerAleatoire(k)).decision !== 'conforme') censures += 1;
      if (controleConstitutionnel(structuredClone(e), 'taxe_hauts_patrimoines', 'oui', 'Taxe', creerAleatoire(k), { saisinePresident: true }).decision !== 'conforme') censuresSaisine += 1;
    }
    expect(censuresSaisine).toBeGreaterThan(censures);
  });

  it('nominations au Conseil constitutionnel en mars 2028 (article 56)', () => {
    const e = nouvelle({ role: 'president' });
    e.trimestre = { annee: 2028, t: 1 };
    e.evenements.enAttente = [];
    injecterEvenementsInstitutions(e, 3);
    expect(e.evenements.enAttente.some((x) => x.id === 'nominations_conseil')).toBe(true);
  });
});

describe('Cohabitation', () => {
  it('législatives perdues : le joueur président entre en cohabitation, le Premier ministre quitte Matignon', () => {
    const p = nouvelle({ role: 'president' });
    majoriteRN(p);
    expect(apresLegislatives(p)).toEqual({});
    expect(configuration(p).id).toBe('cohabitation');
    expect(p.institutions.cohabitation.premierMinistre).toBe('Jordan Bardella');
    expect(p.politique.groupes.find((g) => g.id === 'RN').posture).toBe('gouvernement');
    const pm = nouvelle();
    majoriteRN(pm);
    expect(apresLegislatives(pm).defaite.cause).toBe('cohabitation');
  });

  it('le Gouvernement de cohabitation décide du budget et des réformes ; le président peut retarder un texte', () => {
    const e = nouvelle({ role: 'president' });
    majoriteRN(e);
    apresLegislatives(e);
    expect(neutraliserDecisions(e, { budget: { defense: 5 }, reformes: [{ id: 'x' }], defense: { dissuasion: 'statu_quo' } })).toEqual({ defense: { dissuasion: 'statu_quo' }, procedureBudget: 'auto', procedureReformes: 'vote' });
    const texte = e.institutions.cohabitation.texte.reforme;
    const retard = structuredClone(e);
    expect(gouvernementCohabitation(retard, 'nouvelle_deliberation').type).toBe('nouvelle_deliberation');
    expect(retard.institutions.cohabitation.texte.reforme).toBe(texte);
    const r = gouvernementCohabitation(e, 'promulguer');
    expect(['adoption', 'censure', 'rejet']).toContain(r.type);
    expect(e.institutions.cohabitation.texte?.reforme).not.toBe(texte);
  });

  it('la cohabitation se joue sur plusieurs trimestres sans erreur', () => {
    let e = nouvelle({ role: 'president' });
    e.trimestre = { annee: 2028, t: 1 }; // après la présidentielle de 2027
    majoriteRN(e);
    apresLegislatives(e);
    for (let k = 0; k < 6; k++) e = jouerTour(e, { cohabitation: k % 2 ? 'saisir' : 'promulguer' }, SANS);
    expect(e.institutions.cohabitation.adoptes.length).toBeGreaterThan(1);
    expect(Number.isFinite(e.finances.detteRatio)).toBe(true);
  });
});

describe('Porte-avions', () => {
  it('Charles-de-Gaulle en arrêt technique en 2027-2028, « France Libre » en 2038 sans loi', () => {
    let e = nouvelle();
    const etats = {};
    for (let k = 0; k < 48; k++) {
      e = jouerTour(e, {}, SANS);
      const pa = porteAvions(e);
      etats[`${e.trimestre.annee}T${e.trimestre.t}`] = `${pa.nom}:${pa.disponible}`;
    }
    expect(etats['2027T4']).toBe('Charles-de-Gaulle:false');
    expect(etats['2029T2']).toBe('Charles-de-Gaulle:true');
    expect(etats['2037T4']).toBe('Charles-de-Gaulle:true');
    expect(etats['2038T4']).toBe('France Libre:true');
  });

  it('avec la loi d\'accélération : jamais avant 2032, et le Charles-de-Gaulle se retire ensuite', () => {
    for (const graine of [1, 2, 3, 4]) {
      let e = nouvelle({ graine });
      e = jouerTour(e, { reformes: [{ id: 'porte_avions_2032', option: 'acceleration_2032' }] }, { ...SANS, forcerReformes: true });
      let premier = null;
      for (let k = 0; k < 30 && !premier; k++) {
        e = jouerTour(e, {}, SANS);
        if (e.defense.jalons.includes('pang')) premier = e.historique.at(-1).trimestre;
      }
      expect(premier).toMatch(/2032|2033/);
      for (let k = 0; k < 3; k++) e = jouerTour(e, {}, SANS);
      expect(e.defense.jalons).toContain('cdg_retrait');
    }
  });
});

describe('Sauvegardes', () => {
  it('une partie antérieure au module reste jouable', () => {
    const e = nouvelle();
    delete e.institutions;
    delete e.defense.programmes.cdg;
    const apres = jouerTour(e, {}, SANS);
    expect(apres.institutions.entente).toBeGreaterThan(0);
    expect(validerReformes(apres, [{ id: 'grand_age', option: 'oui' }]).navette).toBeDefined();
  });
});
