import React, { useMemo, useState } from 'react';
import GraphiqueLignes from '../composants/GraphiqueLignes.jsx';
import Info from '../composants/Info.jsx';
import { ALLOCATIONS, fluxAnnuels, doubleCharge, projeterCapitalisation, parametresProjection, concentrationGains } from '../../engine/index.js';
import { md, nombre, pct } from '../format.js';

/** Paramètres des réformes de capitalisation (mêmes valeurs que le catalogue). */
const PILIERS = { '2_employeur': { employeur: 2, salarie: 0 }, '1_1': { employeur: 1, salarie: 1 }, '2_2': { employeur: 2, salarie: 2 }, '1_3': { employeur: 1, salarie: 3 } };
const NOMS = { per: 'PER renforcé', pilier: 'Deuxième pilier obligatoire', souverain: 'Fonds souverain', transition: 'Transition partielle' };

/**
 * État « en vigueur + proposé ce trimestre » de la capitalisation, pour la
 * projection : on montre au joueur l'effet des réformes qu'il envisage.
 */
function etatEnvisage(partie, decisions) {
  const c = { ...(partie.capitalisation ?? {}) };
  for (const r of decisions.reformes ?? []) {
    if (r.id === 'capi_per') c.per = r.option;
    if (r.id === 'capi_pilier') c.pilier = PILIERS[r.option];
    if (r.id === 'capi_fonds_souverain') c.souverain = r.option;
    if (r.id === 'capi_transition') c.transition = { points: 2, financement: r.option };
  }
  if (decisions.allocationCapitalisation) c.allocation = decisions.allocationCapitalisation;
  return { ...partie, capitalisation: c };
}

/**
 * Panneau de la retraite par capitalisation : dispositifs en vigueur ou
 * envisagés, double charge, allocation (volatilité), projection sur 30 ans
 * avec risque de krach, et gains de pension pour un salarié au SMIC et un cadre.
 */
export default function Capitalisation({ partie, decisions, majDecisions }) {
  const [volatilite, setVolatilite] = useState(null);
  const [krach, setKrach] = useState(6);
  const e = useMemo(() => etatEnvisage(partie, decisions), [partie, decisions]);
  const c = e.capitalisation;
  const flux = fluxAnnuels(e);
  const fluxTotal = Object.values(flux).reduce((s, x) => s + x, 0);
  const charge = doubleCharge(e);
  const concentration = concentrationGains(e);
  const allocation = ALLOCATIONS[c.allocation] ?? ALLOCATIONS.equilibree;
  const projection = useMemo(() => projeterCapitalisation(parametresProjection(e, { volatilite: volatilite ?? allocation.volatilite, probaKrach: krach / 100 })), [e, volatilite, krach, allocation.volatilite]);
  const encours = Object.values(partie.capitalisation?.encours ?? {}).reduce((s, x) => s + x, 0);
  const actifs = Object.entries(NOMS).filter(([k]) => c[k]);
  const annee0 = partie.trimestre.annee;

  return (
    <div className="carte pile capitalisation">
      <h3>Retraite par capitalisation <Info texte="Hypothèses de jeu : rendements réels annuels attendus de 2 % (prudente), 3,5 % (équilibrée) et 4,5 % (dynamique), volatilités de 5, 10 et 16 %, krach de −30 % sur un portefeuille très exposé aux actions, rente annuelle de 4 % du capital. Dans la partie, les fonds suivent l'indice boursier du jeu, krachs compris." /></h3>
      <p className="petit muet">Les quatre dispositifs ci-dessous se combinent. La projection tient compte de ceux en vigueur et de ceux que vous proposez ce trimestre.</p>

      <div className="grille-tuiles">
        <div className="tuile"><span className="libelle">Dispositifs</span><span className="valeur" style={{ fontSize: '1rem' }}>{actifs.length ? actifs.map(([, n]) => n).join(', ') : 'Aucun'}</span></div>
        <div className="tuile"><span className="libelle">Versements dans les fonds<Info texte="Ce qui est versé chaque année dans les fonds de capitalisation : cotisations du deuxième pilier, cotisations détournées de la répartition, dotations du fonds souverain, épargne retraite encouragée." /></span><span className="valeur chiffres">{md(fluxTotal, 1)}</span><span className="variation">par an</span></div>
        <div className="tuile"><span className="libelle">Double charge<Info texte="Effort supplémentaire des actifs pendant la transition : ils financent les pensions actuelles par répartition ET leur propre épargne (ou l'État s'endette pour combler les cotisations détournées)." /></span><span className="valeur chiffres">{md(charge, 1)}</span><span className="variation">par an</span></div>
        <div className="tuile"><span className="libelle">Fonds accumulés</span><span className="valeur chiffres">{md(encours, 1)}</span><span className={`variation ${(partie.capitalisation?.dernierRendement ?? 0) < 0 ? 'negatif' : 'positif'}`}>rendement du trimestre {nombre(partie.capitalisation?.dernierRendement ?? 0, 1)} %</span></div>
      </div>

      <div className="grille-2">
        <label className="petit">Allocation des fonds (volatilité)
          <select value={c.allocation} onChange={(ev) => majDecisions({ allocationCapitalisation: ev.target.value })} style={{ display: 'block', width: '100%', marginTop: 4 }}>
            {Object.entries(ALLOCATIONS).map(([id, a]) => <option key={id} value={id}>{a.nom} : {pct(a.actions * 100, 0)} d'actions, rendement attendu {nombre(a.rendement, 1)} %, volatilité {a.volatilite} %</option>)}
          </select>
        </label>
        <div className="petit">
          <label>Volatilité testée dans la projection : <strong>{volatilite ?? allocation.volatilite} %</strong>
            <input type="range" min={2} max={30} step={1} value={volatilite ?? allocation.volatilite} onChange={(ev) => setVolatilite(Number(ev.target.value))} aria-label="Volatilité annuelle testée" />
          </label>
          <label>Risque de krach par an : <strong>{krach} %</strong>
            <input type="range" min={0} max={20} step={1} value={krach} onChange={(ev) => setKrach(Number(ev.target.value))} aria-label="Probabilité annuelle de krach" />
          </label>
        </div>
      </div>

      {fluxTotal > 0 ? (
        <>
          <GraphiqueLignes titre="Projection des fonds de capitalisation sur 30 ans" unite="Md€ d'aujourd'hui" decimales={0}
            series={[
              { id: 'p90', nom: 'Scénario favorable (9 sur 10)', valeurs: projection.parAn.map((x) => x.p90) },
              { id: 'p50', nom: 'Scénario médian', valeurs: projection.parAn.map((x) => x.p50) },
              { id: 'p10', nom: 'Scénario défavorable (1 sur 10)', valeurs: projection.parAn.map((x) => x.p10) },
            ]}
            etiquettes={projection.parAn.map((x) => String(annee0 + x.annee))} />
          <table className="petit">
            <thead><tr><th>Supplément de pension en {annee0 + 30}, entrée dans le dispositif aujourd'hui</th><th className="nombre">Défavorable</th><th className="nombre">Médian</th><th className="nombre">Favorable</th></tr></thead>
            <tbody>
              <tr><td>Salarié au SMIC</td><td className="nombre">{nombre(projection.pensionSmic.p10, 0)} €/mois</td><td className="nombre">{nombre(projection.pensionSmic.p50, 0)} €/mois</td><td className="nombre">{nombre(projection.pensionSmic.p90, 0)} €/mois</td></tr>
              <tr><td>Cadre (55 000 € brut par an)</td><td className="nombre">{nombre(projection.pensionCadre.p10, 0)} €/mois</td><td className="nombre">{nombre(projection.pensionCadre.p50, 0)} €/mois</td><td className="nombre">{nombre(projection.pensionCadre.p90, 0)} €/mois</td></tr>
            </tbody>
          </table>
          <p className="petit">
            {concentration !== null && <>Inégalités : environ <strong>{pct(concentration * 100, 0)}</strong> des gains futurs iraient aux 20 % de ménages les plus aisés. </>}
            {c.per === 'plafond' && 'Une incitation fiscale profite surtout à ceux qui peuvent épargner. '}
            Le supplément de pension n'existe que pour les cotisations versées : un salarié proche de la retraite n'en profitera presque pas.
          </p>
        </>
      ) : (
        <p className="petit muet">Proposez un des dispositifs ci-dessous pour voir la projection sur 30 ans.</p>
      )}
    </div>
  );
}
