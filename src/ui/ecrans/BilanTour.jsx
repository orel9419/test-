import React, { useEffect, useRef } from 'react';
import { nombre, signe, classeVariation, pct, md } from '../format.js';

/** Bilan chiffré du trimestre écoulé, affiché après validation. */
export default function BilanTour({ avant, apres, onFermer }) {
  const bouton = useRef(null);
  useEffect(() => { bouton.current?.focus(); }, []);
  const h0 = avant.historique.at(-1), h1 = apres.historique.at(-1);
  const r = apres.resultatsTour ?? {};
  const entrees = apres.journal.filter((j) => j.tour === avant.tour);
  const lignes = [
    ['Croissance sur un an', h1.croissanceA, h1.croissanceA - h0.croissanceA, pct, true],
    ['Inflation', h1.inflation, h1.inflation - h0.inflation, pct, false],
    ['Chômage', h1.chomage, h1.chomage - h0.chomage, pct, false],
    ['Déficit (% du PIB)', h1.deficit, h1.deficit - h0.deficit, pct, false],
    ['Dette (% du PIB)', h1.dette, h1.dette - h0.dette, pct, false],
    ['Charge d\'intérêts', h1.interets, h1.interets - h0.interets, (x) => md(x, 1), false],
    ['Taux à 10 ans', h1.taux10, h1.taux10 - h0.taux10, (x) => pct(x, 2), false],
    ['Popularité', h1.popularite, h1.popularite - h0.popularite, (x) => pct(x, 0), true],
    ['Cohésion sociale', h1.cohesion, h1.cohesion - h0.cohesion, (x) => nombre(x, 0), true],
  ];
  return (
    <div className="voile" role="dialog" aria-modal="true" aria-labelledby="titre-bilan" onKeyDown={(ev) => ev.key === 'Escape' && onFermer()}>
      <div className="modale pile">
        <h2 id="titre-bilan">Bilan du trimestre {h1.trimestre}</h2>
        {apres.termine && <div className={`alerte ${apres.issue?.type === 'defaite' ? 'critique' : 'bonne'}`}><strong>{apres.issue?.texte}</strong></div>}
        {r.budget && (
          <div className={`alerte ${r.budget.adopte ? 'bonne' : 'critique'}`}>
            <strong>Budget :</strong> {r.budget.pour} pour, {r.budget.contre} contre, {r.budget.abstention} abstentions{r.budget.procedure === '49.3' ? ', adopté par le 49.3' : ''}.
            {r.budget.censure && <> Censure : {r.budget.censure.voix} voix sur {r.budget.censure.majorite} — {r.budget.censure.adoptee ? 'adoptée' : 'rejetée'}.</>}
          </div>
        )}
        {(r.alertes ?? []).map((a, i) => <div key={i} className="alerte">{a.texte ?? (a.type === 'mobilisation' ? 'Un mouvement social a éclaté.' : a.type)}</div>)}
        <table className="petit">
          <thead><tr><th>Indicateur</th><th className="nombre">Niveau</th><th className="nombre">Variation</th></tr></thead>
          <tbody>{lignes.map(([nom, v, d, f, fav]) => (
            <tr key={nom}><td>{nom}</td><td className="nombre">{f(v)}</td><td className={`nombre ${classeVariation(d, fav)}`}>{signe(d, nom.includes('Taux') ? 2 : 1)}</td></tr>
          ))}</tbody>
        </table>
        {entrees.length > 0 && (
          <div>
            <h3>Ce qui s'est passé</h3>
            <ul className="petit" style={{ paddingLeft: '1.1rem' }}>{entrees.map((j, i) => <li key={i}>{j.texte}</li>)}</ul>
          </div>
        )}
        {apres.evenements.enAttente.length > 0 && !apres.termine && <p className="petit"><strong>{apres.evenements.enAttente.length} nouvel(s) événement(s)</strong> vous attendent pour le prochain trimestre.</p>}
        <button ref={bouton} type="button" className="bouton principal" onClick={onFermer}>Continuer</button>
      </div>
    </div>
  );
}
