import React from 'react';
import Info from './Info.jsx';
import { resumeNotation } from '../../engine/index.js';

const PERSPECTIVE = {
  negative: { texte: 'négative', symbole: '▼', classe: 'negatif' },
  stable: { texte: 'stable', symbole: '■', classe: 'muet' },
  positive: { texte: 'positive', symbole: '▲', classe: 'positif' },
};
const RISQUE = {
  degradation: { texte: 'risque de dégradation', classe: 'critique' },
  relevement: { texte: 'relèvement possible', classe: 'bonne' },
  stable: null,
};

/**
 * Notes souveraines des trois grandes agences.
 * `compact` : une ligne pour le tableau de bord ; sinon carte détaillée.
 */
export default function NoteSouveraine({ partie, compact = false }) {
  const r = resumeNotation(partie);
  if (!r) return null;
  if (compact) {
    return (
      <span className="petit">
        Notes de la dette :{' '}
        {r.agences.map((a, i) => (
          <span key={a.id}>{i > 0 && ' · '}{a.nom} <strong>{a.note}</strong> <span className={PERSPECTIVE[a.perspective].classe} title={`Perspective ${PERSPECTIVE[a.perspective].texte}`}>{PERSPECTIVE[a.perspective].symbole}<span className="visuellement-cache">perspective {PERSPECTIVE[a.perspective].texte}</span></span></span>
        ))}
      </span>
    );
  }
  const dernieres = r.historique.filter((d) => d.action !== 'maintien').slice(-3).reverse();
  return (
    <div className="carte pile">
      <h3>Note de la dette <Info texte="Fitch, Moody's et S&P notent la capacité de l'État à rembourser. Elles se prononcent à dates fixes, publiées à l'avance. Une perspective négative annonce une possible dégradation à une prochaine revue. Elles regardent la dette et sa dynamique, le déficit, la stabilité politique et la crédibilité de vos engagements (trajectoire annoncée et tenue). Une dégradation renchérit un peu les emprunts, beaucoup plus si la note tombe en catégorie BBB ou sous BBB−." /></h3>
      <table className="petit">
        <thead><tr><th>Agence</th><th>Note</th><th>Perspective</th><th>Prochaine revue</th></tr></thead>
        <tbody>
          {r.agences.map((a) => {
            const p = PERSPECTIVE[a.perspective];
            const risque = RISQUE[a.risque];
            return (
              <tr key={a.id}>
                <td>{a.nom}</td>
                <td><strong>{a.note}</strong>{a.variation !== 0 && <span className={`tres-petit ${a.variation > 0 ? 'positif' : 'negatif'}`}> ({a.variation > 0 ? '+' : '−'}{Math.abs(a.variation)} cran{Math.abs(a.variation) > 1 ? 's' : ''})</span>}</td>
                <td className={p.classe}><span aria-hidden="true">{p.symbole}</span> {p.texte}</td>
                <td>{a.prochaineRevue}{risque && <> · <span className={`etiquette ${risque.classe}`}>{risque.texte}</span></>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {dernieres.length > 0 && <ul className="tres-petit muet" style={{ margin: 0, paddingLeft: '1rem' }}>{dernieres.map((d, i) => <li key={i}>{d.texte}</li>)}</ul>}
      <p className="tres-petit muet" style={{ margin: 0 }}>Pour éviter une dégradation : annoncer une trajectoire de déficit (ci-dessous) et la tenir, réduire le déficit, éviter l'instabilité politique.</p>
    </div>
  );
}
