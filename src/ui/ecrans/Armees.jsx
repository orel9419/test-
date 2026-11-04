import React from 'react';
import Info from '../composants/Info.jsx';
import { ILLUSTRATIONS } from '../composants/Illustrations.jsx';
import Visionneuse3D from '../3d/Visionneuse3D.jsx';
import { resumeDefense } from '../../engine/index.js';
import { SOURCES_DEFENSE } from '../../data/defense.js';
import { libelleTrimestre } from '../../engine/calendrier.js';
import { md, nombre, pct } from '../format.js';

/** Décisions de défense en préparation (fusion avec l'existant). */
export function majDefense(majDecisions, modif) {
  majDecisions((d) => {
    const x = d.defense ?? { programmes: {}, operations: {}, exports: [], dissuasion: null };
    return { defense: { ...x, ...modif(x) } };
  });
}

const trimestre = (x) => libelleTrimestre({ annee: x.annee, t: x.t });

/** Rubrique régalienne : les armées (programmes, capacités, opérations, exportations). */
export default function Armees({ partie, decisions, majDecisions, allerA }) {
  const r = resumeDefense(partie);
  if (!r) return null;
  const d = decisions.defense ?? { programmes: {}, operations: {}, exports: [] };
  const france = partie.pays === 'france';
  const chef = { france: 'Le président de la République est le chef des armées (article 15 de la Constitution). Le gouvernement « dispose de la force armée » et prépare le budget ; le Parlement vote la loi de programmation militaire.', allemagne: 'En temps de paix, le ministre fédéral de la Défense commande la Bundeswehr ; le chancelier en prend le commandement en cas de guerre. Toute opération extérieure armée exige un vote du Bundestag.', etatsUnis: 'Le président est commandant en chef ; le Congrès vote les crédits et, en principe, déclare la guerre (War Powers Resolution de 1973).' }[partie.pays];
  const rafale = r.capacites.rafale;
  const snle3g = r.capacites.snle3g;
  const pang = r.programmes.find((p) => p.id === 'pang');
  return (
    <div className="pile">
      <h2>Armées et programmes d'armement</h2>
      <p className="petit muet">{chef}</p>

      <div className="grille-tuiles">
        <div className="tuile">
          <span className="libelle">Budget de la défense <Info texte="Crédits du poste « défense » du budget, plus les décisions prises ici (commandes, accélérations, opérations). Repère : le projet de loi de finances 2027 prévoit 63,4 Md€ pour la mission Défense (hors pensions) et une trajectoire vers 2,5 % du PIB en 2030." /></span>
          <span className="valeur chiffres">{r.budget !== null ? md(r.budget + r.supplementaire, 1) : '—'}</span>
          <span className="variation muet">{r.pctPIB !== null ? `${pct(r.pctPIB, 2)} du PIB` : ''}{r.supplementaire ? ` · dont ${md(r.supplementaire, 1)} décidés ici` : ''}</span>
        </div>
        {rafale !== undefined && (
          <div className="tuile">
            <span className="libelle">Rafale en service <Info texte="Armée de l'Air et de l'Espace et Marine nationale. Objectif de la loi de programmation militaire : 178 fin 2030 et 225 en 2035." /></span>
            <span className="valeur chiffres">{nombre(rafale, 0)}</span>
            <span className="variation muet">objectif LPM : 178 fin 2030, 225 en 2035</span>
          </div>
        )}
        {snle3g !== undefined && (
          <div className="tuile">
            <span className="libelle">Sous-marins lanceurs d'engins</span>
            <span className="valeur chiffres">4</span>
            <span className="variation muet">{snle3g >= 1 ? `dont ${nombre(snle3g, 0)} de 3e génération` : 'classe Le Triomphant ; SNLE 3G vers 2035'}</span>
          </div>
        )}
        {pang && (
          <div className="tuile">
            <span className="libelle">Porte-avions</span>
            <span className="valeur chiffres">1</span>
            <span className="variation muet">{pang.etat?.abandonne ? 'Charles-de-Gaulle ; successeur abandonné' : `Charles-de-Gaulle ; « France Libre » vers ${pang.jalonsEffectifs[0]?.annee ?? 2038}`}</span>
          </div>
        )}
      </div>
      <div className="ligne">
        <button type="button" className="bouton" onClick={() => allerA?.('budget')}>Ajuster le budget de la défense</button>
        {france && <button type="button" className="bouton" onClick={() => allerA?.('reformes')}>Trajectoire de l'effort de défense (réformes)</button>}
        {france && <button type="button" className="bouton" onClick={() => allerA?.('dissuasion')}>Voir la dissuasion</button>}
      </div>

      <h3>Programmes</h3>
      <div className="grille-programmes">
        {r.programmes.map((p) => {
          const Illustration = ILLUSTRATIONS[p.illustration];
          const choisie = d.programmes?.[p.id];
          const enCours = p.etat && p.etat.option !== 'nominal' && partie.tour < p.etat.fin;
          const optionEnCours = p.options.find((o) => o.id === p.etat?.option);
          return (
            <article key={p.id} className="carte pile programme">
              {p.id === 'rafale' ? <Visionneuse3D modele="rafale" hauteur={300} />
                : p.id === 'snle3g' ? <Visionneuse3D modele="snle" hauteur={300} />
                  : Illustration && <Illustration legende={false} coupe={false} />}
              <div className="ligne espace">
                <div><h4 style={{ margin: 0 }}>{p.nom}</h4><span className="tres-petit muet">{p.sousTitre}</span></div>
                <span className="etiquette">{p.domaine}</span>
              </div>
              <ul className="petit" style={{ margin: 0, paddingLeft: '1.1rem' }}>{p.faits.map((f, i) => <li key={i}>{f}</li>)}</ul>
              <p className="tres-petit muet" style={{ margin: 0 }}>Industriels : {p.industriels.join(', ')}.</p>
              {p.jalonsEffectifs.length > 0 && (
                <p className="tres-petit" style={{ margin: 0 }}>{p.jalonsEffectifs.map((j) => <span key={j.id}>{j.atteint ? '✓' : '⏳'} {trimestre(j)} : {j.texte}{j.decalage > 0 ? ` (retard de ${j.decalage} trimestres)` : j.decalage < 0 ? ` (avance de ${-j.decalage} trimestres)` : ''}</span>)}</p>
              )}
              {p.etat?.abandonne && <p className="alerte critique petit" style={{ margin: 0 }}>Programme arrêté par la réforme « Renoncer au successeur du Charles-de-Gaulle ».</p>}
              {enCours ? (
                <p className="petit alerte" style={{ margin: 0 }}>Décision en cours : <strong>{optionEnCours?.nom}</strong>, jusqu'en {libelleTrimestre({ annee: partie.trimestre.annee + Math.floor((partie.trimestre.t - 1 + p.etat.fin - partie.tour) / 4), t: ((partie.trimestre.t - 1 + p.etat.fin - partie.tour) % 4) + 1 })}.</p>
              ) : p.options.length > 1 ? (
                <fieldset className="choix-option">
                  <legend className="petit">Votre décision</legend>
                  <div className="pile" style={{ gap: '0.3rem' }}>
                    {p.options.map((o) => {
                      const actif = (choisie ?? 'nominal') === o.id;
                      return (
                        <label key={o.id} className={`option-programme ${actif ? 'active' : ''}`}>
                          <input type="radio" name={`prog-${p.id}`} checked={actif} onChange={() => majDefense(majDecisions, (x) => ({ programmes: { ...x.programmes, [p.id]: o.id } }))} />
                          <span><strong className="petit">{o.nom}</strong>{o.cout ? <span className={`tres-petit ${o.cout > 0 ? 'negatif' : 'positif'}`}> · {o.cout > 0 ? '+' : '−'}{md(Math.abs(o.cout), 1)} par an pendant {o.duree / 4} an{o.duree > 4 ? 's' : ''}</span> : null}<br /><span className="tres-petit muet">{o.description}</span></span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ) : (
                <p className="tres-petit muet" style={{ margin: 0 }}>{p.options[0]?.description}</p>
              )}
              {p.reforme && <button type="button" className="lien petit" onClick={() => allerA?.('reformes')}>Décider par la réforme correspondante →</button>}
              {p.note && <p className="tres-petit muet" style={{ margin: 0 }}>{p.note}</p>}
              {p.sources?.length > 0 && <p className="tres-petit" style={{ margin: 0 }}>Sources : {p.sources.map((s, i) => <span key={s}>{i > 0 && ' · '}<a href={SOURCES_DEFENSE[s].url} target="_blank" rel="noreferrer">{SOURCES_DEFENSE[s].titre}</a></span>)}</p>}
            </article>
          );
        })}
      </div>

      {r.operations.length > 0 && (
        <div className="carte pile">
          <h3>Opérations et déploiements <Info texte="Coûts en milliards par an tant que la décision est en vigueur (hypothèses de jeu). Renforcer la présence sur le flanc est de l'OTAN rassure les alliés ; se retirer coûte en influence." /></h3>
          {r.domaineReserve && <p className="petit alerte" style={{ margin: 0 }}>Domaine réservé : l'engagement des forces relève du président de la République. Vos choix lui sont proposés ; dans ce jeu, il les suit (même majorité).</p>}
          {r.operations.map((o) => {
            const choix = d.operations?.[o.id] ?? o.actuelle;
            return (
              <div key={o.id} className="operation">
                <div><strong>{o.icone} {o.nom}</strong><p className="tres-petit muet" style={{ margin: 0 }}>{o.description}</p></div>
                <div className="ligne">
                  {o.options.map((x) => (
                    <button key={x.id} type="button" className={`puce ${choix === x.id ? 'active' : ''}`} aria-pressed={choix === x.id} onClick={() => majDefense(majDecisions, (y) => ({ operations: { ...y.operations, [o.id]: x.id } }))}>
                      {x.nom}{x.cout ? ` (${x.cout > 0 ? '+' : '−'}${md(Math.abs(x.cout), 2)}/an)` : ''}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {r.exports.length > 0 && (
        <div className="carte pile">
          <h3>Exportations d'armement <Info texte="Les contrats se gagnent par les relations politiques, l'influence et la qualité de l'offre. Une tentative par an et par client, pour un point de capital diplomatique (visites d'État, offres de coopération industrielle)." /></h3>
          {r.exports.map((x) => {
            const prevu = d.exports?.includes(x.id);
            return (
              <div key={x.id} className="operation">
                <div><strong>{x.icone} {x.nom}</strong><p className="tres-petit muet" style={{ margin: 0 }}>{x.description}</p></div>
                <div className="ligne">
                  {x.statut === 'gagne' && <span className="etiquette bonne">Contrat signé</span>}
                  {x.statut === 'perdu' && <span className="etiquette critique">Perdu face à un concurrent</span>}
                  {x.statut === 'ouvert' && <span className="petit">Chances : <strong>{pct(x.probabilite * 100, 0)}</strong></span>}
                  {x.statut === 'ouvert' && (x.disponible
                    ? <button type="button" className={`bouton ${prevu ? '' : 'principal'}`} aria-pressed={prevu} onClick={() => majDefense(majDecisions, (y) => ({ exports: prevu ? y.exports.filter((z) => z !== x.id) : [...(y.exports ?? []), x.id] }))}>{prevu ? '✓ Équipe France mobilisée' : 'Mobiliser l\'équipe France (1 point)'}</button>
                    : <span className="tres-petit muet">Nouvelle tentative possible l'an prochain</span>)}
                </div>
              </div>
            );
          })}
          <p className="tres-petit muet" style={{ margin: 0 }}>Capital diplomatique disponible : {partie.international.capitalDiplomatique} point(s).</p>
        </div>
      )}
      <p className="tres-petit muet">Sources générales : <a href={SOURCES_DEFENSE.plf2027.url} target="_blank" rel="noreferrer">{SOURCES_DEFENSE.plf2027.titre}</a> · <a href={SOURCES_DEFENSE.actualisation.url} target="_blank" rel="noreferrer">{SOURCES_DEFENSE.actualisation.titre}</a>. Coûts des options et effets : hypothèses de jeu.</p>
    </div>
  );
}
