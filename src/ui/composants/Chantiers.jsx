import React from 'react';
import Info from './Info.jsx';
import { resumeChantiers } from '../../engine/index.js';
import { libelleTrimestre } from '../../engine/calendrier.js';
import { md, pct } from '../format.js';

const etoiles = (q) => '★'.repeat(Math.round(q * 5)) + '☆'.repeat(5 - Math.round(q * 5));

/**
 * Chantiers et partenaires des grands événements : pour chaque lot, les offres
 * des grandes entreprises (CAC 40 et autres) et de concurrents étrangers.
 */
export default function Chantiers({ partie, decisions, majDecisions }) {
  const liste = resumeChantiers(partie);
  if (!liste.length) return null;
  const prevus = decisions.chantiers ?? [];
  const choisir = (c, l, i) => majDecisions((d) => ({ chantiers: [...(d.chantiers ?? []).filter((x) => !(x.chantier === c && x.lot === l)), { chantier: c, lot: l, offre: i }] }));
  const annuler = (c, l) => majDecisions((d) => ({ chantiers: (d.chantiers ?? []).filter((x) => !(x.chantier === c && x.lot === l)) }));
  return (
    <div className="pile">
      <h3 style={{ margin: 0 }}>Chantiers et partenaires <Info texte="Dans la réalité, les marchés sont attribués par les acheteurs publics (comité d'organisation, établissement chargé des ouvrages, préfecture) après une mise en concurrence : l'État fixe le cahier des charges, les critères et une partie du financement. Ici, vous retenez l'offre de chaque lot. Une offre bon marché peut coûter cher en retards ; une entreprise étrangère réduit la souveraineté." /></h3>
      {liste.map((c) => (
        <div key={c.id} className="carte pile">
          <div className="ligne espace">
            <strong>{c.icone} {c.nom}</strong>
            <span className="tres-petit muet">Jour J : {libelleTrimestre(c.jourJ)} · attribution avant {libelleTrimestre(c.dateLimite)}</span>
          </div>
          <p className="petit muet" style={{ margin: 0 }}>{c.description}</p>
          {c.qualite !== null && <p className="petit" style={{ margin: 0 }}>Qualité d'ensemble : <strong>{etoiles(c.qualite)}</strong>{c.incidents ? ` · ${c.incidents} incident(s) de chantier` : ''}. Elle pèse sur la réussite de l'événement.</p>}
          {c.lots.map((l) => {
            const prevu = prevus.find((x) => x.chantier === c.id && x.lot === l.id);
            return (
              <div key={l.id} className="lot">
                <div className="ligne espace">
                  <strong className="petit">{l.nom}</strong>
                  <span className="tres-petit muet">Part publique de référence : {md(l.montant, 2)}</span>
                </div>
                {l.attribue ? (
                  <p className="petit" style={{ margin: 0 }}>✓ Attribué à <strong>{l.attribue.offre.nom}</strong> pour {md(l.attribue.cout, 2)}.</p>
                ) : !c.ouvert ? (
                  <p className="petit muet" style={{ margin: 0 }}>Date limite passée.</p>
                ) : (
                  <div className="offres">
                    {l.offres.map((o, i) => {
                      const actif = prevu?.offre === i;
                      return (
                        <button key={i} type="button" className={`offre ${actif ? 'active' : ''}`} aria-pressed={actif} onClick={() => (actif ? annuler(c.id, l.id) : choisir(c.id, l.id, i))}>
                          <span className="ligne espace" style={{ flexWrap: 'nowrap' }}>
                            <strong className="petit">{o.nom}</strong>
                            {o.cac40 ? <span className="etiquette cac40">CAC 40</span> : o.francaise ? <span className="etiquette">France</span> : <span className="etiquette critique">Étranger</span>}
                          </span>
                          <span className="tres-petit">{md(o.cout, 2)} · qualité {etoiles(o.qualite)} · risque de retard {pct(o.retard * 100, 0)}</span>
                          <span className="tres-petit muet">{o.argument}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
