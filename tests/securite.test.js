/**
 * Sécurité : sauvegardes importées non fiables, liens, politique de sécurité
 * du contenu.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { creerPartie, jouerTour } from '../src/engine/index.js';
import { urlSure, lireJSONNonFiable, validerSauvegarde, assainir, SauvegardeInvalide, TAILLE_MAX_SAUVEGARDE } from '../src/ui/securite.js';
import { lireSauvegardeTexte, texteSauvegarde } from '../src/ui/sauvegarde.js';
import { CSP } from '../vite.config.js';

const lire = (f) => JSON.parse(readFileSync(new URL(`../countries/${f}.json`, import.meta.url), 'utf8'));
const contexte = lire('_contexte-mondial');
const nouvelle = (pays = 'france', fichier = 'france') => creerPartie({ pays, donnees: lire(fichier), contexte, graine: 9, mode: 'facile', calendrier: 'horizon2050' });
const texte = (partie, decisions = {}) => texteSauvegarde(partie, decisions);

describe('Liens', () => {
  it('seuls les liens web sont acceptés', () => {
    expect(urlSure('https://www.insee.fr/fr/statistiques')).toBe('https://www.insee.fr/fr/statistiques');
    expect(urlSure('http://exemple.fr')).toBe('http://exemple.fr/');
    for (const x of ['javascript:alert(1)', ' JavaScript:alert(1)', 'java\tscript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:x', '/relatif', '', null, 42, `https://a.fr/${'x'.repeat(3000)}`]) {
      expect(urlSure(x), String(x).slice(0, 30)).toBe(null);
    }
  });
});

describe('Sauvegardes importées', () => {
  it('une vraie sauvegarde se recharge et la partie continue', () => {
    for (const [pays, fichier] of [['france', 'france'], ['allemagne', 'allemagne'], ['etatsUnis', 'etats-unis']]) {
      const e = jouerTour(nouvelle(pays, fichier), {}, { evenementsActifs: false });
      const s = lireSauvegardeTexte(texte(e));
      expect(s.partie.tour).toBe(e.tour);
      expect(() => jouerTour(s.partie, {}, { evenementsActifs: false })).not.toThrow();
    }
  });

  it('retire les clés de pollution de prototype', () => {
    const brut = texte(nouvelle()).replace('"pays":"france"', '"__proto__":{"pollue":true},"constructor":{"prototype":{"pollue2":true}},"pays":"france"');
    const s = lireSauvegardeTexte(brut);
    expect({}.pollue).toBeUndefined();
    expect({}.pollue2).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(s.partie, '__proto__')).toBe(false);
    expect(Object.getPrototypeOf(s.partie)).toBe(Object.prototype);
  });

  it('neutralise un lien « javascript: » glissé dans la partie', () => {
    const e = nouvelle();
    const id = Object.keys(e.statique.impots)[0];
    e.statique.impots[id].provenance = { statut: 'officiel', texte: 'piège', url: 'javascript:alert(document.domain)' };
    e.journal.push({ tour: 0, texte: 'javascript:alert(1)', url: 'https://www.legifrance.gouv.fr/' });
    const s = lireSauvegardeTexte(texte(e));
    expect(s.partie.statique.impots[id].provenance.url).toBe(null);
    expect(s.partie.journal.at(-1).texte).toBe('');
    expect(s.partie.journal.at(-1).url).toBe('https://www.legifrance.gouv.fr/');
  });

  it('rejette les sauvegardes incohérentes, trop grosses ou trop imbriquées', () => {
    const e = nouvelle();
    const essai = (modif) => { const p = JSON.parse(texte(e)); modif(p); return () => lireSauvegardeTexte(JSON.stringify(p)); };
    expect(essai((p) => { p.partie.pays = 'atlantide'; })).toThrow(SauvegardeInvalide);
    expect(essai((p) => { p.partie.tour = 1e9; })).toThrow(SauvegardeInvalide);
    expect(essai((p) => { p.partie.tour = 'deux'; })).toThrow(SauvegardeInvalide);
    expect(essai((p) => { delete p.partie.macro; })).toThrow(SauvegardeInvalide);
    expect(essai((p) => { p.version = 99; })).toThrow(SauvegardeInvalide);
    expect(essai((p) => { p.decisions = [1, 2]; })).toThrow(SauvegardeInvalide);
    expect(() => lireSauvegardeTexte('pas du JSON')).toThrow(SauvegardeInvalide);
    expect(() => lireSauvegardeTexte(' '.repeat(TAILLE_MAX_SAUVEGARDE + 1))).toThrow(/volumineuse/);
    let profond = {}; const racine = profond;
    for (let i = 0; i < 100; i++) { profond.x = {}; profond = profond.x; }
    expect(essai((p) => { p.partie.piege = racine; })).toThrow(/imbriquée/);
  });

  it('remplace les nombres infinis (1e999 en JSON) par zéro', () => {
    const brut = texte(nouvelle()).replace(/"inflation":[-0-9.e]+/, '"inflation":1e999');
    const s = lireSauvegardeTexte(brut);
    expect(s.partie.macro.inflation).toBe(0);
  });

  it('assainir et lireJSONNonFiable refusent les entrées non textuelles', () => {
    expect(() => lireJSONNonFiable(null)).toThrow(SauvegardeInvalide);
    expect(() => validerSauvegarde(null, 1)).toThrow(SauvegardeInvalide);
    expect(assainir({ a: { url: 'ftp://x' } }).a.url).toBe(null);
  });
});

describe('Politique de sécurité du contenu', () => {
  it('n\'autorise que les scripts du site, sans eval ni script en ligne', () => {
    const script = CSP.split('; ').find((d) => d.startsWith('script-src'));
    expect(script).toBe("script-src 'self'");
    expect(CSP).not.toMatch(/unsafe-eval/);
    expect(CSP).toMatch(/object-src 'none'/);
    expect(CSP).toMatch(/base-uri 'self'/);
    expect(CSP).toMatch(/form-action 'none'/);
  });

  it('la page d\'entrée n\'a plus de script en ligne', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
    for (const [, attributs, contenu] of scripts) {
      expect(attributs).toMatch(/src=/);
      expect(contenu.trim()).toBe('');
    }
  });
});
