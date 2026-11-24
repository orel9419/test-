import React, { useState } from 'react';
import { resumeTerrorisme, resumeGuerreEconomique, previsionOpex } from '../../engine/index.js';
import { SOURCES_OPEX } from '../../data/opex.js';
import { SOURCES_GUERRE_ECO } from '../../data/guerreEconomique.js';
import { md, pct } from '../format.js';

const CLASSE_NIVEAU = { faible: 'bon', modérée: 'bon', élevée: 'attention', 'très élevée': 'critique', critique: 'critique' };

/** Jauge horizontale 0-100 avec un libellé. */
function Jauge({ valeur, classe, etiquette }) {
  return (
    <div className="jauge-menace" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(valeur)} aria-label={etiquette}>
      <div className={`remplissage ${classe}`} style={{ width: `${Math.max(2, Math.min(100, valeur))}%` }} />
    </div>
  );
}

/**
 * Menace terroriste (écran Sécurité) : niveau, posture Vigipirate, effectifs
 * de l'opération Sentinelle, risque d'attentat, historique.
 */
export function MenaceTerroriste({ partie, decisions, majDecisions, allerA }) {
  const r = resumeTerrorisme(partie);
  if (!r) return null;
  const voulu = decisions.securite ?? {};
  const vigipirate = voulu.vigipirate ?? r.vigipirate;
  const sentinelle = Number(voulu.sentinelle ?? r.sentinelle);
  const changer = (cle, v) => majDecisions((d) => ({ securite: { ...(d.securite ?? {}), [cle]: v } }));
  const classe = CLASSE_NIVEAU[r.niveau] ?? 'attention';
  return (
    <div className={`carte pile menace-terroriste ${classe === 'critique' ? 'en-alerte' : ''}`}>
      <h3 style={{ margin: 0 }}>🚨 Menace terroriste</h3>
      <div className="ligne espace petit"><span>Niveau de menace</span><strong className={classe === 'critique' ? 'negatif' : ''}>{Math.round(r.menace)}/100 · {r.niveau}</strong></div>
      <Jauge valeur={r.menace} classe={classe} etiquette="Niveau de menace terroriste" />
      <p className="tres-petit muet" style={{ margin: 0 }}>Risque d'attentat sur un an : <strong>{pct(r.risqueAnnuel * 100, 0)}</strong> · protection du dispositif : {pct(r.protection * 100, 0)}{r.etatUrgence > 0 ? ' · état d\'urgence en vigueur' : ''} · attentats déjoués depuis le début : {r.dejoues}.</p>
      <div className="grille-2 petit" style={{ gap: '0.4rem 1rem' }}>
        <label>Posture Vigipirate
          <select value={vigipirate} onChange={(ev) => changer('vigipirate', ev.target.value)} style={{ display: 'block', maxWidth: '100%' }}>
            {r.postures.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
        </label>
        <label>Opération Sentinelle
          <select value={sentinelle} onChange={(ev) => changer('sentinelle', Number(ev.target.value))} style={{ display: 'block', maxWidth: '100%' }}>
            {r.effectifs.map((p) => <option key={p.id} value={p.id}>{p.nom}{p.cout ? ` · ${md(p.cout, 2)}/an` : ''}</option>)}
          </select>
        </label>
      </div>
      {(voulu.vigipirate || voulu.sentinelle) && <span className="tres-petit alerte bonne">Changement appliqué à la validation du trimestre. <button type="button" className="lien" onClick={() => majDecisions({ securite: null })}>Annuler</button></span>}
      <p className="tres-petit muet" style={{ margin: 0 }}>La menace baisse quand les opérations antiterroristes réussissent et quand le renseignement est renforcé (réforme « Renseignement et cyberdéfense ») ; elle monte avec les tensions internationales et, un temps, après une intervention (risque de représailles). Les alertes et les attentats arrivent dans l'onglet <button type="button" className="lien" onClick={() => allerA?.('evenements')}>Événements</button>. Frapper les filières à l'étranger : onglet <button type="button" className="lien" onClick={() => allerA?.('geopolitique')}>Géopolitique</button>.</p>
      {r.attentats.length > 0 && (
        <ul className="tres-petit" style={{ margin: 0, paddingLeft: '1rem' }}>
          {r.attentats.slice(0, 5).map((a) => <li key={`${a.tour}-${a.ville}`}><span className="negatif">Attentat</span> à {a.ville} ({a.trimestre})</li>)}
        </ul>
      )}
      <p className="tres-petit muet" style={{ margin: 0 }}>Repères : <a href={SOURCES_OPEX.vigipirate?.url} target="_blank" rel="noreferrer">plan Vigipirate</a> · <a href={SOURCES_OPEX.sentinelle?.url} target="_blank" rel="noreferrer">opération Sentinelle</a>. Niveaux, probabilités et coûts : hypothèses de jeu.</p>
    </div>
  );
}

/**
 * Lutte contre le terrorisme (écran Géopolitique) : le président lance une
 * opération où il veut dans le monde, avec les forces de son choix.
 */
export function LutteAntiterroriste({ partie, decisions, majDecisions }) {
  const r = resumeTerrorisme(partie);
  const [ouverte, setOuverte] = useState(null);
  const [choix, setChoix] = useState({});
  if (!r) return null;
  const ordre = decisions.antiterrorisme;
  const unitesDe = (op) => choix[op.id] ?? op.unitesConseillees;
  const basculer = (op, id) => setChoix((c) => {
    const l = unitesDe(op);
    return { ...c, [op.id]: l.includes(id) ? l.filter((x) => x !== id) : [...l, id] };
  });
  return (
    <div className="carte pile antiterrorisme">
      <h3 style={{ margin: 0 }}>🎯 Lutte contre le terrorisme : frapper partout dans le monde</h3>
      <p className="petit muet" style={{ margin: 0 }}>Menace en France : <strong>{Math.round(r.menace)}/100 ({r.niveau})</strong>. Choisissez un théâtre et vos forces : chaque opération réussie fait reculer la menace, mais elle coûte, use les unités et peut provoquer des représailles. Une opération à la fois par théâtre.</p>
      {ordre && <span className="tres-petit alerte bonne">Ordre donné : {r.operations.find((o) => o.id === ordre.operation)?.nom} (au prochain trimestre). <button type="button" className="lien" onClick={() => majDecisions({ antiterrorisme: null })}>Annuler</button></span>}
      <div className="grille-operations">
        {r.operations.map((op) => {
          const unites = unitesDe(op);
          const prev = previsionOpex(partie, op.id, unites);
          const disponibles = [...op.engageables, ...op.indisponibles];
          const deplie = ouverte === op.id;
          return (
            <div key={op.id} className={`operation-possible ${op.enCours ? 'en-cours' : ''} ${ordre?.operation === op.id ? 'choisie' : ''}`}>
              <button type="button" className="entete-operation" onClick={() => setOuverte(deplie ? null : op.id)} aria-expanded={deplie}>
                <strong className="petit">{op.nom}</strong>
                <span className="tres-petit muet">{op.enCours ? 'en cours' : `${op.duree} trim. · menace ${op.reussiteMenace} si succès`}</span>
              </button>
              {deplie && (
                <div className="pile" style={{ gap: '0.35rem' }}>
                  <span className="tres-petit">{op.description}</span>
                  <div className="ligne tres-petit" style={{ flexWrap: 'wrap', gap: '0.3rem' }}>
                    {disponibles.map((u) => {
                      const ko = op.indisponibles.some((x) => x.id === u.id);
                      return (
                        <label key={u.id} className={`puce ${unites.includes(u.id) ? 'active' : ''}`} title={ko ? u.motif : ''} style={{ opacity: ko ? 0.5 : 1 }}>
                          <input type="checkbox" checked={unites.includes(u.id)} disabled={ko} onChange={() => basculer(op, u.id)} style={{ marginRight: 4 }} />{u.icone} {u.court}{ko ? ` (${u.motif})` : ''}
                        </label>
                      );
                    })}
                  </div>
                  {prev && <div className="tres-petit">Chances de succès : <strong>{Math.round(prev.chance * 100)} %</strong> · coût total environ {md(prev.cout, 2)}</div>}
                  <button type="button" className="bouton principal" style={{ alignSelf: 'flex-start' }} disabled={op.enCours || !prev?.engageables.length} onClick={() => majDecisions({ antiterrorisme: { operation: op.id, unites: prev.engageables.map((u) => u.id) } })}>
                    {op.enCours ? 'Déjà en cours' : '🎯 Lancer l\'opération'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="tres-petit muet" style={{ margin: 0 }}>Repères : <a href={SOURCES_OPEX.chammal?.url} target="_blank" rel="noreferrer">opération Chammal (Levant, depuis 2014)</a>. Les autres théâtres sont des scénarios de jeu fondés sur des faits sourcés dans chaque fiche ; chances, coûts et effets : hypothèses.</p>
    </div>
  );
}

/**
 * Guerre économique (écran Géopolitique) : mesures contre les États-Unis, la
 * Chine ou la Russie, intensité des deux camps, accord de Bruxelles.
 */
export function GuerreEconomique({ partie, decisions, majDecisions }) {
  const r = resumeGuerreEconomique(partie);
  if (!r) return null;
  const ordres = [].concat(decisions.guerreEconomique ?? []);
  const donner = (cible, mesure) => majDecisions((d) => ({ guerreEconomique: [...[].concat(d.guerreEconomique ?? []).filter((m) => m.cible !== cible), ...(mesure ? [{ cible, mesure }] : [])] }));
  const Crans = ({ n, classe }) => <span className="crans" aria-label={`${n} sur 3`}>{[1, 2, 3].map((k) => <span key={k} className={k <= n ? `plein ${classe}` : ''} />)}</span>;
  return (
    <div className="carte pile guerre-economique">
      <h3 style={{ margin: 0 }}>⚔️💶 Guerre économique</h3>
      <p className="petit muet" style={{ margin: 0 }}>La politique commerciale relève de l'Union européenne : la France agit seule sur les investissements étrangers et les achats publics, mais il lui faut l'accord de ses partenaires (l'Allemagne d'abord) pour des droits de douane, des sanctions ou l'instrument anti-coercition. Chaque escalade appelle des représailles : exportations perdues, secteurs touchés (agriculture, vins et spiritueux, luxe, aéronautique), prix des importations en hausse.</p>
      <div className="grille-2">
        {r.cibles.map((c) => {
          const ordre = ordres.find((m) => m.cible === c.id);
          const enGuerre = c.niveau > 0 || c.riposte > 0;
          return (
            <div key={c.id} className={`cible-guerre ${enGuerre ? 'en-guerre' : ''}`}>
              <div className="ligne espace"><strong className="petit">{c.nom}</strong>{enGuerre ? <span className="etiquette impopulaire">en guerre économique · {c.trimestres} trim.</span> : <span className="etiquette">paix commerciale</span>}</div>
              <span className="tres-petit muet">{c.contexte}</span>
              <div className="tres-petit ligne espace"><span>Nos mesures</span><Crans n={c.niveau} classe="nous" /></div>
              <div className="tres-petit ligne espace"><span>Ses représailles</span><Crans n={c.riposte} classe="eux" /></div>
              {c.riposte > 0 && <span className="tres-petit negatif">Effet sur l'activité à terme : environ −{c.perteExports.toFixed(2).replace('.', ',')} point de PIB tant que les représailles durent.</span>}
              <label className="tres-petit">Mesure :
                <select value={ordre?.mesure ?? ''} onChange={(ev) => donner(c.id, ev.target.value || null)} style={{ display: 'block', maxWidth: '100%' }}>
                  <option value="">— aucune —</option>
                  {c.mesures.map((m) => <option key={m.id} value={m.id} disabled={!m.possible}>{m.nom}{m.chance !== null ? ` (accord de l'UE : ${Math.round(m.chance * 100)} %)` : ''}</option>)}
                </select>
              </label>
              {ordre && <span className="tres-petit alerte bonne">Décidé pour ce trimestre. <button type="button" className="lien" onClick={() => donner(c.id, null)}>Annuler</button></span>}
              {c.sources.length > 0 && <span className="tres-petit muet">Sources : {c.sources.map((s, i) => <span key={s}>{i > 0 && ' · '}<a href={SOURCES_GUERRE_ECO[s].url} target="_blank" rel="noreferrer">{SOURCES_GUERRE_ECO[s].titre.split(' : ')[0]}</a></span>)}</span>}
            </div>
          );
        })}
      </div>
      <p className="tres-petit muet" style={{ margin: 0 }}>Intensités, chances d'accord et effets : hypothèses de jeu (une guerre commerciale totale avec les États-Unis coûterait de l'ordre de 0,4 point de PIB).</p>
    </div>
  );
}
