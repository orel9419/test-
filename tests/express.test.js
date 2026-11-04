/**
 * Mode Express : cartes, moteur déterministe, fins, défi du jour, records.
 */
import { describe, it, expect } from 'vitest';
import { CARTES, FINS, nouvellePartie, choisir, carte, apercu, graineDuJour, numeroDefi, majRecords, serie, mention } from '../src/express/moteur.js';
import { FLEURONS } from '../src/data/entreprises.js';

describe('Cartes du mode Express', () => {
  it('chaque carte a deux réponses qui touchent au moins une jauge', () => {
    for (const c of CARTES) {
      for (const cote of ['gauche', 'droite']) {
        const r = c[cote];
        expect(r.label, c.id).toBeTruthy();
        expect(['o', 'f', 'm', 's'].some((k) => r[k] || r.fixe?.[k] !== undefined), `${c.id} ${cote}`).toBe(true);
      }
    }
    expect(new Set(CARTES.map((c) => c.id)).size).toBe(CARTES.length);
  });

  it('les 40 entreprises du CAC 40 du jeu ont chacune une carte', () => {
    const cac40 = FLEURONS.france.filter((f) => f.cac40);
    expect(cac40).toHaveLength(40);
    const textes = CARTES.map((c) => `${c.perso.role} ${c.texte}`).join(' ');
    for (const f of cac40) expect(textes.includes(f.nom.replace(' France', '')), f.nom).toBe(true);
  });
});

describe('Moteur', () => {
  it('est déterministe pour une graine donnée (défi du jour)', () => {
    const jouer = () => { let e = nouvellePartie({ graine: graineDuJour('2026-11-04'), quotidien: true, date: '2026-11-04' }); for (let k = 0; k < 10 && !e.fin; k++) e = choisir(e, k % 2 ? 'gauche' : 'droite'); return e; };
    const a = jouer(), b = jouer();
    expect(a.vues).toEqual(b.vues);
    expect(a.jauges).toEqual(b.jauges);
    expect(graineDuJour('2026-11-04')).not.toBe(graineDuJour('2026-11-05'));
    expect(numeroDefi('2026-11-04')).toBe(1);
  });

  it('une jauge à 0 ou à 100 termine la partie avec la bonne fin', () => {
    let e = nouvellePartie({ graine: 3 });
    e = { ...e, jauges: { ...e.jauges, m: 2 }, carte: 'budget_493' };
    e = choisir(e, 'droite'); // 49.3 : majorité −12
    expect(e.fin).toBe('m0');
    expect(FINS[e.fin].titre).toMatch(/censure/);
    expect(choisir(e, 'gauche')).toBe(e); // plus rien ne bouge
  });

  it('la dissolution remet la majorité à 50', () => {
    let e = nouvellePartie({ graine: 4 });
    e = { ...e, jauges: { ...e.jauges, m: 12 }, carte: 'dissolution' };
    expect(choisir(e, 'droite').jauges.m).toBe(50);
  });

  it('on ne revoit pas une carte trop tôt, et l\'aperçu indique les jauges touchées', () => {
    let e = nouvellePartie({ graine: 11 });
    const vues = [];
    for (let k = 0; k < 30 && !e.fin; k++) { vues.push(e.carte); e = choisir(e, 'gauche'); e.jauges = { o: 50, f: 50, m: 50, s: 50 }; }
    expect(new Set(vues).size).toBe(vues.length);
    expect(Object.keys(apercu('retraites68', 'droite')).sort()).toEqual(['f', 'm', 'o']);
    expect(apercu('retraites68', 'droite').o).toBe('fort');
    expect(carte('vinci').perso.role).toContain('Vinci');
  });

  it('records, série de défis et mention', () => {
    let r = majRecords({}, { semaine: 12, fin: 'o0', quotidien: true, date: '2026-11-04' });
    r = majRecords(r, { semaine: 30, fin: 'f0', quotidien: true, date: '2026-11-05' });
    expect(r.meilleur).toBe(30);
    expect(r.fins).toEqual(['o0', 'f0']);
    expect(serie(r, '2026-11-05')).toBe(2);
    expect(mention(45)).toBe('Animal politique');
  });
});
