import React from 'react';
import GraphiqueLignes from '../composants/GraphiqueLignes.jsx';
import Info from '../composants/Info.jsx';
import { resumeFonds, ALLOCATIONS_FONDS, MARCHES_FONDS } from '../../engine/index.js';
import { nombre, md, pct, signe, classeVariation } from '../format.js';

const ORDRE = ['equilibre', 'france', 'monde', 'croissance'];
const libelle = (h) => `T${h.t} ${h.annee}`;

/** Barre empilée de la répartition entre les quatre marchés. */
function BarreRepartition({ parts }) {
  return (
    <div className="barre-repartition" role="img" aria-label={MARCHES_FONDS.map((m) => `${m.nom} ${Math.round(parts[m.id] * 100)} %`).join(', ')}>
      {MARCHES_FONDS.map((m) => (
        <span key={m.id} style={{ width: `${parts[m.id] * 100}%`, background: m.couleur }} title={`${m.nom} : ${Math.round(parts[m.id] * 100)} %`}>
          {parts[m.id] >= 0.12 ? `${Math.round(parts[m.id] * 100)} %` : ''}
        </span>
      ))}
    </div>
  );
}

/** Choix de la répartition du fonds (appliquée par un rééquilibrage à la validation du trimestre). */
function ChoixRepartition({ r, decisions, majDecisions }) {
  const choisie = decisions.fondsAllocation ?? r?.allocation ?? 'equilibre';
  return (
    <div className="carte pile">
      <h3 style={{ margin: 0 }}>Répartition entre les marchés <Info texte="Le fonds achète des actions de grandes entreprises cotées, à travers quatre indices. Changer de répartition revend une partie du portefeuille pour racheter l'autre (rééquilibrage, sans frais dans le jeu). Seule la part placée dans des entreprises françaises soutient l'investissement en France." /></h3>
      <div className="legende tres-petit">
        {MARCHES_FONDS.map((m) => <span key={m.id}><span style={{ width: 10, height: 10, borderRadius: 3, background: m.couleur, display: 'inline-block' }} /> {m.nom}</span>)}
      </div>
      <div className="pile" role="radiogroup" aria-label="Répartition du fonds" style={{ gap: '0.5rem' }}>
        {ORDRE.map((id) => {
          const a = ALLOCATIONS_FONDS[id];
          const actif = choisie === id;
          const france = a.parts.cac40 + 0.17 * a.parts.stoxx600;
          return (
            <label key={id} className={`option repartition-fonds ${actif ? 'choisie' : ''}`}>
              <span className="ligne" style={{ gap: '0.5rem', alignItems: 'baseline' }}>
                <input type="radio" name="repartition-fonds" checked={actif} onChange={() => majDecisions({ fondsAllocation: id === (r?.allocation ?? 'equilibre') ? null : id })} />
                <strong>{a.nom}</strong>
                <span className="tres-petit muet">environ {Math.round(france * 100)} % en France</span>
                {r?.allocationEnVigueur === id && <span className="etiquette bonne">en vigueur</span>}
              </span>
              <BarreRepartition parts={a.parts} />
              <span className="tres-petit muet">{a.texte}</span>
            </label>
          );
        })}
      </div>
      {decisions.fondsAllocation && <p className="tres-petit" role="status" style={{ margin: 0 }}>Nouvelle répartition appliquée à la validation du trimestre.</p>}
    </div>
  );
}

/**
 * Fonds souverain français : valeur, apports, plus-values et dividendes,
 * évolution depuis le vote de la loi, les quatre marchés (CAC 40, S&P 500,
 * STOXX Europe 600, marchés émergents) et la répartition choisie.
 */
export default function FondsSouverain({ partie, decisions, majDecisions, allerA }) {
  if (partie.pays !== 'france') return <div className="carte"><h2>Fonds souverain</h2><p>Ce module est disponible pour la France.</p></div>;
  const r = resumeFonds(partie);
  if (!r) {
    return (
      <div className="pile">
        <h2>Fonds souverain</h2>
        <div className="carte pile">
          <p style={{ margin: 0 }}>La France n'a pas encore de fonds souverain. Faites voter la réforme <strong>« Créer un fonds souverain français »</strong> (onglet Réformes) en choisissant son financement : participations de l'État, emprunt, livret souverain ou économies du plafond de dépense publique.</p>
          <p className="petit muet" style={{ margin: 0 }}>Dès que la loi s'applique, le fonds place chaque trimestre ses apports en actions de grandes entreprises : <strong>CAC 40</strong> (France), <strong>S&P 500</strong> (États-Unis), <strong>STOXX Europe 600</strong> (Europe) et <strong>marchés émergents</strong>. Vous suivrez ici son évolution.</p>
          <div><button type="button" className="bouton" onClick={() => allerA?.('reformes')}>Aller aux réformes</button></div>
        </div>
        <ChoixRepartition r={null} decisions={decisions} majDecisions={majDecisions} />
      </div>
    );
  }
  const h = r.historique;
  const etiquettes = h.map(libelle);
  const attente = r.tourEffet - partie.tour;
  const gainPct = r.apports > 0 ? (r.gain / r.apports) * 100 : 0;
  const option = { participations: 'dividendes des participations de l\'État', emprunt: 'emprunt de 20 Md€ par an pendant cinq ans', epargne: 'livret souverain (10 Md€ d\'épargne par an)', economies: '25 % des économies du plafond de dépense publique' }[r.option];
  return (
    <div className="pile">
      <h2>Fonds souverain</h2>
      <p className="petit muet">Financement : {option}. {r.debut ? `Créé au ${libelle(r.debut)}.` : ''} Le fonds investit à long terme dans quatre grands marchés d'actions ; ses dividendes sont réinvestis.</p>

      {!r.actif ? (
        <div className="alerte">Loi votée : le fonds sera créé {attente > 0 ? `dans ${attente} trimestre${attente > 1 ? 's' : ''}` : 'au prochain trimestre'}, au terme du délai d'application. Son évolution s'affichera ici dès son premier placement.</div>
      ) : (
        <>
          <div className="grille-tuiles">
            <div className="tuile">
              <span className="libelle">Valeur du fonds <Info texte="Valeur de marché des quatre poches d'actions (taux de change constants). Elle monte et baisse avec les marchés : c'est un actif de l'État, qui ne réduit pas la dette brute (la référence européenne)." /></span>
              <span className="valeur chiffres">{md(r.capital, 1)}</span>
              <span className="variation muet">{nombre(r.capital / partie.macro.pibNominal * 100, 1)} % du PIB</span>
            </div>
            <div className="tuile">
              <span className="libelle">Apports cumulés <Info texte="Argent versé au fonds depuis sa création. Apports annuels actuels indiqués dessous." /></span>
              <span className="valeur chiffres">{md(r.apports, 1)}</span>
              <span className="variation muet">{r.flux > 0.05 ? `${md(r.flux, 1)} par an actuellement` : 'versements terminés'}</span>
            </div>
            <div className="tuile">
              <span className="libelle">Plus-values <Info texte="Valeur du fonds moins les apports : ce que les marchés et les dividendes ont rapporté (ou coûté)." /></span>
              <span className={`valeur chiffres ${classeVariation(r.gain)}`}>{signe(r.gain, 1, ' Md€')}</span>
              <span className={`variation ${classeVariation(r.gain)}`}>{signe(gainPct, 1, ' %')} des apports</span>
            </div>
            <div className="tuile">
              <span className="libelle">Rendement annuel <Info texte="Performance d'une part du fonds, hors apports, ramenée à un an (il faut au moins un an d'historique). Repère : sur longue période, les actions mondiales ont rapporté de l'ordre de 6 à 8 % par an, avec de fortes baisses certaines années." /></span>
              <span className={`valeur chiffres ${r.rendementAnnuel !== null ? classeVariation(r.rendementAnnuel) : ''}`}>{r.rendementAnnuel !== null ? signe(r.rendementAnnuel, 1, ' %') : '—'}</span>
              <span className="variation muet">dividendes réinvestis : {md(r.dividendes, 1)}</span>
            </div>
          </div>

          {h.length > 1 ? (
            <div className="grille-2">
              <div className="carte"><GraphiqueLignes titre="Valeur du fonds et apports cumulés" unite="Md€" decimales={1} etiquettes={etiquettes} series={[{ id: 'capital', nom: 'Valeur', valeurs: h.map((x) => x.capital) }, { id: 'apports', nom: 'Apports', valeurs: h.map((x) => x.apports), couleur: 'var(--encre-2)' }]} /></div>
              <div className="carte"><GraphiqueLignes titre="Les quatre marchés depuis la création du fonds" unite="base 100" decimales={1} reference={{ valeur: 100, libelle: 'création' }} etiquettes={etiquettes} series={MARCHES_FONDS.map((m) => ({ id: m.id, nom: m.nom.replace(' (MSCI EM)', ''), valeurs: h.map((x) => x.niveaux[m.id]), couleur: m.couleur }))} /></div>
            </div>
          ) : (
            <p className="petit muet">Premier placement effectué : les courbes apparaîtront dès le trimestre prochain.</p>
          )}

          <div className="carte pile">
            <h3 style={{ margin: 0 }}>Composition du portefeuille</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="petit tableau-croissance">
                <thead><tr><th>Marché</th><th>Valeur</th><th>Part</th><th>Indice depuis la création</th><th>Dernier trimestre</th></tr></thead>
                <tbody>
                  {r.poches.map((p) => (
                    <tr key={p.id}>
                      <td><span style={{ width: 10, height: 10, borderRadius: 3, background: p.couleur, display: 'inline-block', marginRight: 6 }} />{p.nom}<div className="tres-petit muet">{p.zone}</div></td>
                      <td className="chiffres">{md(p.valeur, 1)}</td>
                      <td className="chiffres">{pct(p.part * 100, 0)}</td>
                      <td className={`chiffres ${classeVariation(p.niveau - 100)}`}>{signe(p.niveau - 100, 1, ' %')}</td>
                      <td className={`chiffres ${p.dernier !== null ? classeVariation(p.dernier) : ''}`}>{p.dernier !== null ? signe(p.dernier, 1, ' %') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="tres-petit muet" style={{ margin: 0 }}>Part investie dans des entreprises françaises : <strong>{pct(r.partFrance * 100, 0)}</strong> (CAC 40 et environ 17 % du STOXX Europe 600). C'est elle qui soutient l'investissement et l'activité en France ; le reste diversifie les risques. {r.krachs.length ? `Krachs mondiaux subis : ${r.krachs.map(libelle).join(', ')}.` : ''}</p>
          </div>
        </>
      )}

      <ChoixRepartition r={r} decisions={decisions} majDecisions={majDecisions} />

      <details className="carte">
        <summary><strong>Comprendre : comment fonctionne un fonds souverain</strong></summary>
        <ul className="petit">
          <li><strong>Diversifier</strong> : un fonds placé en un seul pays dépend de son économie. Le fonds norvégien (plus de 1 500 Md€) détient environ 1,5 % de toutes les actions cotées du monde, dans près de 9 000 entreprises, et presque rien en Norvège.</li>
          <li><strong>Le temps long</strong> : les actions baissent parfois de 20 à 50 % en quelques mois (2008, 2020), mais ont rapporté de l'ordre de 6 à 8 % par an sur longue période. Un fonds souverain n'a pas besoin de vendre dans la panique.</li>
          <li><strong>Le pari de l'emprunt</strong> : financé à crédit, le fonds n'est gagnant que si ses placements rapportent plus que le taux d'emprunt de l'État (le taux à 10 ans est affiché dans « Impôts et dette »).</li>
          <li><strong>Les devises</strong> : le S&P 500 et les marchés émergents sont cotés en dollars ou en monnaies locales ; dans le jeu, les taux de change sont constants (hypothèse).</li>
          <li><strong>Le CAC 40 du jeu</strong> réagit à vos décisions et à la conjoncture française ; les trois autres marchés suivent la demande mondiale et leurs propres aléas.</li>
        </ul>
      </details>
    </div>
  );
}
