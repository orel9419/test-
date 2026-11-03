import React, { useMemo } from 'react';
import Info from '../composants/Info.jsx';
import { actionsCommunication, GROUPES_CIBLES, reformesDisponibles, effetOpinionReforme } from '../../engine/index.js';
import { GROUPES } from '../../model/ministeres.js';
import { nombre, pct } from '../format.js';

/** Composantes de la popularité : libellé, explication et onglet où agir. */
const COMPOSANTES = {
  economie: { nom: 'Chômage et inflation', aide: 'Comparés à la situation de départ. Un chômage ou une inflation en hausse pèsent sur tous les groupes.', onglet: 'fiscalite' },
  pouvoirAchat: { nom: 'Pouvoir d\'achat', aide: 'Revenu des ménages types après impôts et prestations. Les pertes pèsent deux fois plus que les gains.', onglet: 'menages' },
  budget: { nom: 'Services publics', aide: 'Moyens des ministères auxquels chaque groupe est attaché (santé, éducation, sécurité…). Les coupes se voient vite.', onglet: 'budget' },
  fiscalite: { nom: 'Impôts', aide: 'Effet symbolique des hausses ou des baisses d\'impôts, au-delà du pouvoir d\'achat.', onglet: 'fiscalite' },
  reformes: { nom: 'Réformes et communication', aide: 'Opinion durable laissée par vos réformes et vos actions de communication ; elle s\'estompe lentement.', onglet: 'reformes' },
};

/** Barre divergente : négatif à gauche, positif à droite (symbole et texte, jamais la couleur seule). */
function Barre({ valeur, max = 6 }) {
  const l = Math.min(50, Math.abs(valeur) / max * 50);
  return (
    <div className="barre-divergente" aria-hidden="true">
      <div className="axe" />
      <div className={valeur >= 0 ? 'pos' : 'neg'} style={{ width: `${l}%`, [valeur >= 0 ? 'left' : 'right']: '50%' }} />
    </div>
  );
}

/**
 * Communication et opinion : pourquoi la popularité bouge, une action de
 * communication par trimestre, et les mesures les plus populaires.
 */
export default function Communication({ partie, decisions, majDecisions, allerA }) {
  const s = partie.social;
  const actions = useMemo(() => actionsCommunication(partie), [partie]);
  const choix = decisions.communication;
  const usure = partie.communication?.usure ?? 0;
  const composantes = Object.entries(s.composantes ?? {}).sort((a, b) => a[1] - b[1]);
  const groupes = Object.entries(s.groupes).sort((a, b) => a[1].popularite - b[1].popularite);
  const populaires = useMemo(() => {
    if (partie.pays !== 'france' && partie.pays !== 'allemagne' && partie.pays !== 'etatsUnis') return [];
    return reformesDisponibles(partie)
      .filter((r) => r.disponible && !r.active)
      .map((r) => {
        const meilleure = r.options.map((o) => ({ o, v: effetOpinionReforme(partie, r.id, o.id) })).sort((a, b) => b.v - a.v)[0];
        return { r, option: meilleure.o, effet: meilleure.v };
      })
      .filter((x) => x.effet >= 1)
      .sort((a, b) => b.effet - a.effet)
      .slice(0, 8);
  }, [partie]);
  const proposer = (r, option) => majDecisions((d) => ({ reformes: [...d.reformes.filter((x) => x.id !== r.id), { id: r.id, option: option.id }] }));

  return (
    <div className="pile">
      <h2>Communication et opinion</h2>
      <p className="petit muet">Garder le pouvoir, c'est garder l'opinion. Trois leviers : comprendre ce qui fait bouger votre popularité, agir chaque trimestre par une action de communication, et proposer des mesures populaires pour compenser les réformes difficiles.</p>

      <div className="grille-2">
        <div className="carte pile">
          <h3>Pourquoi votre popularité bouge <Info texte="Chaque groupe juge l'exécutif selon l'économie, son pouvoir d'achat, les services publics, les impôts et les réformes. Les valeurs sont des écarts par rapport au départ, en points de popularité, pondérés par le poids électoral des groupes." /></h3>
          <div className="ligne espace"><span>Popularité de l'exécutif</span><strong className="chiffres" style={{ fontSize: '1.4rem' }}>{pct(s.popularite, 0)}</strong></div>
          {composantes.length === 0 && <p className="petit muet">Le détail s'affichera après votre premier trimestre : il compare la situation à celle de votre prise de fonctions.</p>}
          {composantes.map(([k, v]) => (
            <div key={k} className="composante">
              <span className="petit">{COMPOSANTES[k]?.nom ?? k} <Info texte={COMPOSANTES[k]?.aide ?? ''} /></span>
              <Barre valeur={v} />
              <span className={`chiffres petit ${v >= 0.05 ? 'positif' : v <= -0.05 ? 'negatif' : 'muet'}`} style={{ textAlign: 'right' }}>{v >= 0 ? '+' : '−'}{nombre(Math.abs(v), 1)}</span>
              {v <= -0.5 && COMPOSANTES[k]?.onglet && <button type="button" className="lien tres-petit" onClick={() => allerA?.(COMPOSANTES[k].onglet)}>Agir</button>}
            </div>
          ))}
          <p className="tres-petit muet" style={{ margin: 0 }}>Groupes les plus mécontents : {groupes.slice(0, 2).map(([id, g]) => `${GROUPES[id]?.nom ?? id} (${pct(g.popularite, 0)})`).join(', ')}.</p>
        </div>

        <div className="carte pile">
          <h3>Mesures populaires <Info texte="Réformes disponibles qui améliorent le plus votre popularité à leur adoption (estimation : chocs d'opinion et opinion durable, moins une partie des griefs). Vérifiez leur coût et leur chance d'adoption dans l'onglet Réformes." /></h3>
          {populaires.length === 0 && <p className="petit muet">Aucune mesure nettement populaire disponible pour l'instant.</p>}
          <ul className="petit liste-populaires">
            {populaires.map(({ r, option, effet }) => {
              const proposee = decisions.reformes.some((x) => x.id === r.id && x.option === option.id);
              return (
                <li key={r.id}>
                  <span><strong>{r.nom}</strong><span className="tres-petit muet"> — {option.nom}</span></span>
                  <span className="etiquette populaire">+{nombre(effet, 1)} pt</span>
                  <button type="button" className={`bouton ${proposee ? '' : 'principal'}`} onClick={() => proposer(r, option)} disabled={proposee}>{proposee ? 'Proposée' : 'Proposer'}</button>
                </li>
              );
            })}
          </ul>
          <p className="tres-petit muet" style={{ margin: 0 }}>Populaire ne veut pas dire finançable : vérifiez le coût et les chances d'adoption (bouton « Chiffrer » dans les réformes). Les marchés et la dette finissent toujours par se rappeler à vous.</p>
          <button type="button" className="lien petit" onClick={() => allerA?.('reformes')}>Voir tout le catalogue des réformes</button>
        </div>
      </div>

      <div className="carte pile">
        <h3>Votre action de communication du trimestre <Info texte="Une action par trimestre. Une partie de l'effet est immédiate et s'estompe ; une autre laisse une opinion durable. Parler trop souvent use l'opinion (efficacité réduite) et augmente le risque de petite phrase malheureuse." /></h3>
        <div className="ligne espace petit">
          <span>Efficacité actuelle : <strong>{pct((actions[0]?.efficacite ?? 1) * 100, 0)}</strong>{usure > 0.4 ? ' : vous saturez l\'opinion, espacez vos prises de parole.' : '.'}</span>
          {choix && <button type="button" className="lien" onClick={() => majDecisions({ communication: null })}>Annuler le choix</button>}
        </div>
        <div className="grille-actions">
          {actions.map((a) => {
            const choisie = choix?.id === a.id;
            return (
              <div key={a.id} className={`carte action-com ${choisie ? 'choisie' : ''} ${a.disponible ? '' : 'indisponible'}`}>
                <div className="ligne espace"><strong><span aria-hidden="true">{a.icone}</span> {a.nom}</strong></div>
                <p className="tres-petit muet" style={{ margin: 0 }}>{a.description}</p>
                {a.options && (
                  <label className="tres-petit">Auprès de :{' '}
                    <select value={choisie ? choix.option : Object.keys(a.options)[0]} onChange={(ev) => majDecisions({ communication: { id: a.id, option: ev.target.value } })} disabled={!a.disponible}>
                      {Object.entries(GROUPES_CIBLES).map(([g, nom]) => <option key={g} value={g}>{nom}</option>)}
                    </select>
                  </label>
                )}
                {a.disponible
                  ? <button type="button" className={`bouton ${choisie ? '' : 'principal'}`} onClick={() => majDecisions({ communication: { id: a.id, option: choisie ? choix.option : a.options ? Object.keys(a.options)[0] : undefined } })} aria-pressed={choisie}>{choisie ? '✓ Choisie' : 'Choisir'}</button>
                  : <span className="tres-petit muet">Possible dans {a.disponibleDans} trimestre(s)</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
