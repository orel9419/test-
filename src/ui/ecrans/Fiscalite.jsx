import React from 'react';
import { IMPOTS } from '../../model/impots.js';
import Badge from '../composants/Badge.jsx';
import Info from '../composants/Info.jsx';
import Apercu from './Apercu.jsx';
import { md, nombre, pct, signe } from '../format.js';
import { structurelSchuldenbremse } from '../../engine/finances.js';

export default function Fiscalite({ partie, decisions, majDecisions, apercu }) {
  const f = partie.finances;
  const impots = Object.entries(partie.impots).filter(([, c]) => c.taux !== null && c.tauxRef !== null);
  const fixe = partie.impots.fixe;
  const total = Object.values(partie.impots).reduce((s, c) => s + (c.rendement ?? c.R0), 0);
  const annee = partie.trimestre.annee;
  const regles = partie.statique.regles;
  const dernier = f.historiqueAnnuel.at(-1);
  const trajectoire = decisions.trajectoire ?? {};

  return (
    <div className="pile">
      <h2>Impôts et dette</h2>
      <div className="grille-2">
        <div className="carte pile">
          <h3>Prélèvements <Info texte="Les rendements dépendent du taux, de l'assiette (consommation, salaires, profits...) et du comportement des contribuables : une forte hausse rapporte moins que prévu, car l'assiette s'érode." /></h3>
          {impots.map(([id, c]) => {
            const def = IMPOTS[id];
            const t = decisions.impots[id] ?? c.taux;
            return (
              <div key={id}>
                <div className="ligne espace">
                  <span className="ligne" style={{ gap: '0.35rem' }}><strong className="petit">{def.nom}</strong><Info texte={def.description} /></span>
                  <span className="petit chiffres">{nombre(t, def.unite === '%' ? 1 : 0)}{def.unite === '%' ? ' %' : ''} · {md(c.rendement ?? c.R0, 1)}</span>
                </div>
                <input type="range" min={c.bornes[0]} max={c.bornes[1]} step={c.pas} value={t} aria-label={def.nom}
                  onChange={(ev) => majDecisions((d) => ({ impots: { ...d.impots, [id]: Number(ev.target.value) } }))} />
                <div className="ligne espace tres-petit muet">
                  <span>{def.unite === '%' ? `Taux de départ : ${nombre(c.tauxRef, 1)} %` : 'Indice 100 = barème ou tarifs de départ'}</span>
                  <Badge provenance={partie.statique.impots[id]?.provenance} />
                </div>
              </div>
            );
          })}
          <div className="ligne espace petit muet"><span>Autres prélèvements et recettes (non pilotés)</span><span className="chiffres">{md(fixe.rendement ?? fixe.R0, 0)}</span></div>
          <div className="ligne espace"><strong>Total des recettes</strong><strong className="chiffres">{md(total, 0)}</strong></div>
        </div>
        <div className="pile">
          <Apercu apercu={apercu} partie={partie} />
          <div className="carte pile">
            <h3>Gestion de la dette <Info texte="L'Agence de la dette émet chaque trimestre de quoi rembourser la dette arrivant à échéance et financer le déficit. Emprunter plus à court terme coûte moins cher aujourd'hui quand les taux courts sont bas, mais raccourcit la maturité : la dette se refinance plus vite, au risque de taux plus élevés demain." /></h3>
            <div className="ligne espace petit"><span>Dette</span><strong className="chiffres">{md(f.dette, 0)} ({pct(f.detteRatio)})</strong></div>
            <div className="ligne espace petit"><span>Taux moyen de la dette</span><strong className="chiffres">{pct(f.tauxMoyen, 2)}</strong></div>
            <div className="ligne espace petit"><span>Taux des nouvelles émissions</span><strong className="chiffres">{pct(f.tauxEmission ?? f.taux10, 2)}</strong></div>
            <div className="ligne espace petit"><span>Maturité moyenne (hypothèse)</span><strong className="chiffres">{nombre(f.maturiteMoyenne, 1)} ans</strong></div>
            <label className="petit">Part des émissions à court terme : <strong>{pct((decisions.partCourtTerme ?? f.partCourtTerme) * 100, 0)}</strong>
              <input type="range" min={0.05} max={0.5} step={0.05} value={decisions.partCourtTerme ?? f.partCourtTerme} onChange={(ev) => majDecisions({ partCourtTerme: Number(ev.target.value) })} />
            </label>
            <p className="tres-petit muet">Pour rembourser par anticipation, il faut un excédent ou des cessions d'actifs (voir la réforme « Céder des participations de l'État »).</p>
          </div>
        </div>
      </div>

      <div className="carte pile">
        <h3>Stratégie budgétaire pluriannuelle <Info texte="Annoncer une trajectoire de déficit et la tenir renforce la crédibilité et réduit la prime de risque. La manquer coûte plus cher que de ne rien annoncer." /></h3>
        <p className="petit muet">Crédibilité actuelle auprès des marchés : <strong>{signe(f.credibilite, 2)}</strong> (de −1 à +1).</p>
        <div className="ligne">
          {[annee, annee + 1, annee + 2, annee + 3].filter((a) => a >= partie.trimestre.annee).map((a) => (
            <label key={a} className="petit">Déficit visé {a} (%)
              <input type="number" step={0.1} min={0} max={10} style={{ width: 80, marginLeft: 6 }} value={trajectoire[a] ?? f.trajectoireAnnoncee[a] ?? ''}
                placeholder="—" onChange={(ev) => majDecisions((d) => ({ trajectoire: { ...(d.trajectoire ?? {}), [a]: ev.target.value === '' ? undefined : Number(ev.target.value) } }))} />
            </label>
          ))}
        </div>
      </div>

      <div className="carte pile">
        <h3>Règles budgétaires</h3>
        {regles.ue?.pde && <p className="petit">Procédure européenne pour déficit excessif : objectifs de déficit {Object.entries(regles.ue.cibleDeficit).map(([a, v]) => `${a} : ${nombre(v, 1)} %`).join(' · ')}{regles.ue.clauseDerogatoireDefense ? ' (clause dérogatoire défense activée)' : ''}.</p>}
        {regles.nationale?.type === 'plafond_dette' && (
          <p className="petit">Plafond légal de la dette brute : <strong>{md(regles.nationale.plafond, 0)}</strong> ; dette brute {md(f.detteBrute ?? 0, 0)} (dette détenue par le public + dette intragouvernementale), marge {md(f.margePlafond ?? 0, 0)}. Fonds de la Social Security : réserves {md(partie.retraites.fondsSS?.reserves ?? 0, 0)}, épuisement projeté en {partie.retraites.fondsSS?.epuisementProjete ?? 'au-delà de 2100'}.</p>
        )}
        {regles.nationale?.type === 'schuldenbremse' && (
          <p className="petit">Frein à l'endettement : déficit structurel estimé à <strong>{pct(structurelSchuldenbremse(partie, f.deficitRatio), 2)}</strong> du PIB pour un plafond de {pct(regles.nationale.plafondStructurelBund + regles.nationale.plafondStructurelLaender, 2)} (défense au-delà de 1 % du PIB et fonds spécial exclus). <span className="muet">{regles.nationale.note}</span></p>
        )}
        {dernier ? (
          <table className="petit">
            <thead><tr><th>Année</th><th className="nombre">Déficit</th><th className="nombre">Dette</th><th>Règles</th></tr></thead>
            <tbody>{f.historiqueAnnuel.map((b) => (
              <tr key={b.annee}><td>{b.annee}</td><td className="nombre">{pct(b.deficit)}</td><td className="nombre">{pct(b.dette)}</td>
                <td>{b.regles.map((r) => <span key={r.id} className={r.respect ? 'positif' : 'negatif'} style={{ marginRight: 8 }}>{r.respect ? '✓' : '✗'} {r.nom}</span>)}</td></tr>
            ))}</tbody>
          </table>
        ) : <p className="petit muet">Le premier bilan annuel sera établi à la fin du trimestre (T4).</p>}
      </div>
    </div>
  );
}
