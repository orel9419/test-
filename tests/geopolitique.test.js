/**
 * Géopolitique (groupe aéronaval, théâtres, crises) et « Produire en France ».
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { creerPartie, jouerTour, resumeGeopolitique, resumeRelocalisation, resumeDefense } from '../src/engine/index.js';
import { deplacerGroupe, majGeopolitique, injecterCrises, porteAvions } from '../src/engine/geopolitique.js';
import { demanderProduction, chances, majRelocalisation } from '../src/engine/relocalisation.js';
import { DOSSIERS, PENURIES } from '../src/data/relocalisations.js';
import { CRISES } from '../src/data/geopolitique.js';
import { depensesTemporairesActives } from '../src/engine/evenements.js';

const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${f}.json`, import.meta.url), 'utf8'));
const contexte = lire('_contexte-mondial');
const nouvelle = (pays = 'france', options = {}) => creerPartie({ pays, donnees: lire(pays === 'etatsUnis' ? 'etats-unis' : pays), contexte, graine: 9, mode: 'facile', calendrier: 'horizon2050', ...options });
const SANS = { evenementsActifs: false };

describe('Groupe aéronaval', () => {
  it('part de Toulon (France seulement), avec le Charles-de-Gaulle', () => {
    const r = resumeGeopolitique(nouvelle());
    expect(r.gan.position).toBe('toulon');
    expect(r.gan.porteAvions.nom).toBe('Charles-de-Gaulle');
    expect(resumeGeopolitique(nouvelle('allemagne'))).toBeNull();
  });

  it('un déploiement coûte, use le potentiel, apaise la tension et rapporte de l\'influence', () => {
    const a = nouvelle(), b = nouvelle();
    const tension = a.geopolitique.tensions.mer_rouge;
    expect(deplacerGroupe(a, 'mer_rouge').texte).toContain('Mer Rouge');
    majGeopolitique(a); majGeopolitique(b);
    expect(depensesTemporairesActives(a).defense).toBeGreaterThan(0);
    expect(a.geopolitique.gan.potentiel).toBe(75);
    expect(a.international.bonusInfluence).toBeGreaterThan(b.international.bonusInfluence);
    expect(a.geopolitique.tensions.mer_rouge).toBeLessThan(tension + 20);
  });

  it('rentre à Toulon quand le potentiel est épuisé, et doit y être entretenu', () => {
    let e = nouvelle();
    e = jouerTour(e, { gan: 'indo_pacifique' }, SANS);
    for (let k = 0; k < 4 && e.geopolitique.gan.position !== 'toulon'; k++) e = jouerTour(e, {}, SANS);
    expect(e.geopolitique.gan.position).toBe('toulon');
    expect(e.journal.some((j) => j.texte.includes('rentre à Toulon pour son entretien'))).toBe(true);
    const r = deplacerGroupe(e, 'mediterranee');
    expect(r.erreur ?? '').toMatch(/Entretien|Potentiel/);
  });

  it('une escale dans l\'océan Indien améliore les chances du Rafale en Inde', () => {
    const e = nouvelle();
    const avant = resumeDefense(e).exports.find((x) => x.id === 'inde_mrfa').probabilite;
    deplacerGroupe(e, 'ocean_indien');
    majGeopolitique(e);
    expect(resumeDefense(e).exports.find((x) => x.id === 'inde_mrfa').probabilite).toBeGreaterThan(avant);
  });

  it('une sauvegarde antérieure au module reste jouable', () => {
    const e = nouvelle();
    delete e.geopolitique;
    expect(resumeGeopolitique(e).gan.position).toBe('toulon');
    expect(deplacerGroupe(e, 'mediterranee').texte).toContain('Méditerranée');
  });

  it('le porte-avions « France Libre » prend le relais après sa mise en service', () => {
    const e = nouvelle();
    e.defense.jalons.push('pang');
    expect(porteAvions(e).nom).toBe('France Libre');
  });
});

describe('Crises géopolitiques', () => {
  it('éclatent sur un théâtre très tendu, sans être tirées par le moteur des événements', () => {
    let trouvee = null;
    for (let tour = 1; tour < 30 && !trouvee; tour++) {
      const e = nouvelle();
      e.tour = tour;
      e.evenements.enAttente = [];
      e.geopolitique.tensions.ormuz = 95;
      injecterCrises(e, 3);
      trouvee = e.evenements.enAttente.find((x) => x.geopolitique);
    }
    expect(trouvee?.id).toBe('crise_ormuz');
    expect(CRISES.every((c) => c.condition() === false)).toBe(true);
  });

  it('la présence du groupe aéronaval donne une meilleure issue', () => {
    const c = CRISES.find((x) => x.id === 'crise_mer_rouge');
    const e = nouvelle();
    const sans = c.choix[0].effets(e);
    e.geopolitique.gan.position = 'mer_rouge';
    const avec = c.choix[0].effets(e);
    expect(avec.influence).toBeGreaterThan(sans.influence);
    expect(sans.chocPIB ?? 0).toBeLessThan(0);
  });
});

describe('Produire en France', () => {
  it('propose le Doliprane avec Sanofi et des leviers aux chances différentes', () => {
    const e = nouvelle();
    const d = resumeRelocalisation(e).find((x) => x.id === 'doliprane');
    expect(d.nomEntreprise).toBe('Sanofi');
    expect(d.cac40).toBe(true);
    const dossier = DOSSIERS.find((x) => x.id === 'doliprane');
    expect(chances(e, dossier, 'aide')).toBeGreaterThan(chances(e, dossier, 'persuasion'));
    expect(chances(e, DOSSIERS.find((x) => x.id === 'twingo'), 'commande')).toBe(0); // pas d'achat public de voitures
  });

  it('une usine acceptée est construite, puis protège des pénuries', () => {
    let e = null, r = null;
    for (let graine = 1; graine < 40; graine++) {
      e = nouvelle('france', { graine });
      r = demanderProduction(e, 'doliprane', 'aide');
      if (r.accepte) break;
    }
    expect(r.accepte).toBe(true);
    expect(depensesTemporairesActives(e).economieFinances).toBeGreaterThan(0); // aide publique
    e.tour += 4;
    majRelocalisation(e);
    expect(e.relocalisation.dossiers.doliprane.statut).toBe('en_service');
    expect(e.relocalisation.resilience.medicaments).toBe(true);
    const penurie = PENURIES.find((x) => x.id === 'penurie_medicaments');
    const protege = penurie.choix[0].effets(e);
    const sansUsine = penurie.choix[0].effets(nouvelle());
    expect(protege.chocs).toBeUndefined();
    expect(Object.values(sansUsine.chocs).every((v) => v < 0)).toBe(true);
  });

  it('un refus impose d\'attendre un an avant de revenir à la charge', () => {
    let e = null, r = null;
    for (let graine = 1; graine < 40; graine++) {
      e = nouvelle('france', { graine });
      r = demanderProduction(e, 'solaire', 'persuasion');
      if (!r.accepte) break;
    }
    expect(r.accepte).toBe(false);
    expect(demanderProduction(e, 'solaire', 'aide').erreur).toMatch(/attendez un an/);
  });

  it('passe par les décisions du trimestre et ne s\'applique qu\'à la France', () => {
    const e = jouerTour(nouvelle(), { relocalisations: [{ id: 'maroquinerie', levier: 'aide' }] }, SANS);
    expect(e.resultatsTour.relocalisations[0].id).toBe('maroquinerie');
    expect(resumeRelocalisation(nouvelle('allemagne'))).toBeNull();
  });
});
