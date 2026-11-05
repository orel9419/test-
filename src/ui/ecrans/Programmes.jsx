import React, { useState } from 'react';
import { apercuDecisions, voterTexte } from '../../engine/index.js';
import { PROGRAMMES, STATUTS_MESURE } from '../../data/programmes.js';
import Info from '../composants/Info.jsx';
import { nombre, signe, classeVariation, devise } from '../format.js';

/**
 * Programmes de personnalités politiques : mesures emblématiques reliées au
 * catalogue, pronostic de vote du programme entier à l'Assemblée, chiffrage
 * par simulation sur deux ans, et proposition en un clic.
 */
export default function Programmes({ partie, liste, decisions, majDecisions }) {
  const [ouvert, setOuvert] = useState(null);
  const [chiffrages, setChiffrages] = useState({});
  const parId = Object.fromEntries(liste.map((r) => [r.id, r]));

  const mesuresValides = (p) => p.mesures.filter((m) => parId[m.reforme] && parId[m.reforme].options.some((o) => o.id === m.option));
  const proposer = (p) => {
    const ajout = mesuresValides(p).filter((m) => parId[m.reforme].disponible && parId[m.reforme].active !== m.option).map((m) => ({ id: m.reforme, option: m.option }));
    majDecisions((d) => ({ reformes: [...d.reformes.filter((x) => !ajout.some((a) => a.id === x.id)), ...ajout] }));
  };
  const chiffrer = (p) => {
    const reformes = mesuresValides(p).map((m) => ({ id: m.reforme, option: m.option }));
    setChiffrages((c) => ({ ...c, [p.id]: 'calcul' }));
    setTimeout(() => {
      const r = apercuDecisions(partie, { reformes }, 8);
      setChiffrages((c) => ({ ...c, [p.id]: r.unAn }));
    }, 20);
  };

  return (
    <details className="carte pile">
      <summary><strong>Programmes des personnalités</strong> <span className="muet petit">({PROGRAMMES.map((p) => p.nom.split(' ').slice(1).join(' ')).join(', ')}) : les tester dans le jeu</span></summary>
      <p className="petit muet">
        Mesures emblématiques reliées aux réformes du jeu, avec leurs sources. Les programmes pour 2027 sont en cours d'écriture : le statut de chaque mesure indique si elle figure dans un programme publié, si elle a été annoncée publiquement, ou si elle reste à vérifier. Le jeu simplifie et ne reprend aucune citation.
        <Info texte="Le pronostic de vote porte sur le programme entier, jugé sur son contenu par les groupes de l'Assemblée actuelle. Les révisions constitutionnelles exigent en plus les trois cinquièmes du Parlement (ou un référendum). Le chiffrage simule deux ans avec et sans le programme, à contexte identique." />
      </p>
      <div className="grille-2">
        {PROGRAMMES.map((p) => {
          const mesures = mesuresValides(p);
          const vote = voterTexte(partie, mesures.map((m) => ({ id: m.reforme, option: m.option })));
          const constitutionnelles = mesures.filter((m) => parId[m.reforme].majoriteRenforcee).length;
          const ch = chiffrages[p.id];
          const proposees = mesures.filter((m) => decisions.reformes.some((x) => x.id === m.reforme && x.option === m.option)).length;
          return (
            <div key={p.id} className="carte pile programme" style={{ borderTop: `4px solid ${p.couleur}` }}>
              <div>
                <strong>{p.nom}</strong> <span className="etiquette">{p.mouvement}</span>
                <div className="tres-petit muet">{p.statut}</div>
              </div>
              <p className="petit" style={{ margin: 0 }}>{p.resume}</p>
              <button type="button" className="lien petit" onClick={() => setOuvert(ouvert === p.id ? null : p.id)} aria-expanded={ouvert === p.id}>
                {ouvert === p.id ? 'Masquer' : 'Voir'} les {mesures.length} mesures
              </button>
              {ouvert === p.id && (
                <ul className="petit" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                  {mesures.map((m) => (
                    <li key={`${m.reforme}-${m.option}`}>
                      {m.texte} <span className={`etiquette statut-${m.statut}`}>{STATUTS_MESURE[m.statut]}</span>
                      <div className="tres-petit muet">Dans le jeu : {parId[m.reforme].nom} — {parId[m.reforme].options.find((o) => o.id === m.option)?.nom}{parId[m.reforme].active === m.option ? ' (déjà en vigueur)' : ''}</div>
                    </li>
                  ))}
                </ul>
              )}
              <div className={`petit ${vote.adopte ? 'positif' : 'negatif'}`}>
                Assemblée : {vote.pour} pour, {vote.contre} contre → {vote.adopte ? 'majorité probable' : 'rejet probable'}{constitutionnelles ? ` ; ${constitutionnelles} révision(s) constitutionnelle(s) : trois cinquièmes requis` : ''}.
              </div>
              {ch && ch !== 'calcul' && (
                <div className="tres-petit">
                  Dans deux ans, par rapport à votre politique actuelle : solde public <span className={classeVariation(ch.soldeMd)}>{signe(ch.soldeMd, 1)} Md{devise()}</span> par an, dette <span className={classeVariation(-ch.dettePct)}>{signe(ch.dettePct, 1)} pt</span>, PIB <span className={classeVariation(ch.pib)}>{signe(ch.pib, 2)} %</span>, chômage <span className={classeVariation(-ch.chomage)}>{signe(ch.chomage, 2)} pt</span>, inflation {signe(ch.inflation, 2)} pt, popularité <span className={classeVariation(ch.popularite)}>{signe(ch.popularite, 1)} pt</span>.
                </div>
              )}
              <div className="ligne">
                <button type="button" className="bouton" onClick={() => chiffrer(p)} disabled={ch === 'calcul'}>{ch === 'calcul' ? 'Calcul…' : 'Chiffrer sur deux ans'}</button>
                <button type="button" className="bouton principal" onClick={() => proposer(p)}>{proposees === mesures.length && mesures.length ? 'Programme proposé' : 'Proposer ce programme ce trimestre'}</button>
              </div>
              <p className="tres-petit muet" style={{ margin: 0 }}>Sources : {p.sources.map((s, i) => <a key={i} href={s.url} target="_blank" rel="noreferrer" style={{ marginRight: 8 }}>{s.texte}</a>)}</p>
            </div>
          );
        })}
      </div>
      <p className="tres-petit muet">Chiffres : {nombre(PROGRAMMES.reduce((s, p) => s + p.mesures.length, 0), 0)} mesures reliées au catalogue. Proposer un programme remplace, pour chaque réforme concernée, l'option déjà choisie ce trimestre.</p>
    </details>
  );
}
