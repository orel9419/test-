import React, { useEffect, useRef, useState } from 'react';
import Info from '../composants/Info.jsx';
import { ILLUSTRATIONS } from '../composants/Illustrations.jsx';
import Visionneuse3D from '../3d/Visionneuse3D.jsx';

/** Modèles 3D de chaque programme (plusieurs : puces pour passer de l'un à l'autre). */
const MODELES_3D = {
  rafale: [['rafale', 'Rafale']], f35: [['f35a', 'F-35A'], ['f35b', 'F-35B (comparaison)'], ['f35c', 'F-35C (comparaison)']], mirage2000: [['mirage2000', 'Mirage 2000-5F']], phenix: [['phenix', 'A330 Phénix']],
  helicos: [['tigre', 'Tigre'], ['caiman', 'Caïman'], ['caimanFS', 'Caïman forces spéciales'], ['caimanMarine', 'Caïman Marine'], ['puma', 'Puma']], mco: [['caracal', 'Caracal']], snle3g: [['snle3g', 'SNLE 3G']], pang: [['porteAvions', 'France Libre']], cdg: [['charlesDeGaulle', 'Charles-de-Gaulle']],
  leclerc: [['leclerc', 'Leclerc']], artillerie: [['caesar', 'Caesar MkII']], drones: [['patroller', 'Drone Patroller']],
  scorpion: [['griffon', 'Griffon'], ['jaguar', 'Jaguar']], espace: [['satellite', 'Satellite d\'observation']],
  sna: [['sna', 'SNA Suffren']], pha: [['pha', 'PHA Mistral']], fregates: [['fda', 'Chevalier Paul (FDA)'], ['fremm', 'FREMM']], brf: [['brf', 'Ravitailleur (BRF)']], monge: [['monge', 'Monge']],
};

/** Variantes par pays (les États-Unis utilisent les trois versions du F-35). */
const MODELES_3D_PAYS = {
  etatsUnis: { f35: [['f35a', 'F-35A (Air Force)'], ['f35b', 'F-35B (Marine Corps)'], ['f35c', 'F-35C (Navy)']] },
};

/** Commandes supplémentaires d'un programme : renouvelables tous les quatre trimestres. */
function Commandes({ commandes, choisies, basculer }) {
  return (
    <div className="pile commandes-programme" style={{ gap: '0.35rem' }}>
      <span className="petit"><strong>Commandes supplémentaires</strong> <span className="tres-petit muet">· une par matériel tous les 4 trimestres</span></span>
      {commandes.map((c) => {
        const choisie = choisies.includes(c.id);
        const e = c.etat;
        return (
          <div key={c.id} className={`commande-programme ${choisie ? 'active' : ''}`}>
            <button type="button" className={`bouton ${choisie ? 'principal' : ''}`} aria-pressed={choisie} disabled={!e.disponible && !choisie} onClick={() => basculer(c.id)}>
              {choisie ? '✓ ' : '🛒 '}{c.nom}
            </button>
            <span className="tres-petit"><span className="negatif">+{md(c.cout, 2)} par an pendant {c.duree / 4} ans</span> (≈ {md(c.cout * c.duree / 4, 1)}) · {c.quantite > 1 ? `premières livraisons ${c.delai / 4} ans après, ${c.parTrimestre} par trimestre` : `livré ${c.delai / 4} ans après la commande`}</span>
            <span className="tres-petit muet">{c.description}</span>
            {(choisie || e.nombre > 0 || !e.disponible) && (
              <span className="tres-petit" role="status">
                {choisie ? 'Commande passée à la validation du trimestre. ' : ''}
                {e.nombre > 0 ? `${e.nombre} commande${e.nombre > 1 ? 's' : ''} déjà passée${e.nombre > 1 ? 's' : ''}${e.restant > 0 ? `, ${e.restant} ${c.unite} en attente de livraison (${e.enCours.map((l) => libelleTrimestre(l.debutTrimestre)).join(', ')})` : ''}. ` : ''}
                {!e.disponible && !choisie ? `Indisponible : ${e.motif}.` : ''}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Modèles 3D d'une carte de programme. La visionneuse n'est créée que lorsque
 * la carte approche de l'écran, et libérée quand elle s'en éloigne : les
 * navigateurs limitent le nombre de contextes WebGL actifs (environ 16).
 */
function Modeles3D({ modeles }) {
  const [actif, setActif] = useState(modeles[0][0]);
  const [visible, setVisible] = useState(false);
  const [hauteurBloc, setHauteurBloc] = useState(300);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setVisible(true); return undefined; }
    const io = new IntersectionObserver(([x]) => {
      if (!x.isIntersecting) setHauteurBloc((h) => Math.max(h, el.offsetHeight));
      setVisible(x.isIntersecting);
    }, { rootMargin: '300px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="pile" style={{ gap: '0.35rem', minHeight: visible ? undefined : hauteurBloc }}>
      {modeles.length > 1 && (
        <div className="puces">{modeles.map(([id, nom]) => <button key={id} type="button" className={`puce ${actif === id ? 'active' : ''}`} aria-pressed={actif === id} onClick={() => setActif(id)}>{nom}</button>)}</div>
      )}
      {visible ? <Visionneuse3D key={actif} modele={actif} hauteur={300} /> : <div className="visionneuse-scene" style={{ height: 300, background: 'var(--surface-2)' }} aria-hidden="true" />}
    </div>
  );
}
import { resumeDefense, porteAvions, flotte } from '../../engine/index.js';
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
  const [domaine, setDomaine] = useState('Tous');
  const r = resumeDefense(partie);
  if (!r) return null;
  const d = decisions.defense ?? { programmes: {}, operations: {}, exports: [] };
  const france = partie.pays === 'france';
  const chef = { france: 'Le président de la République est le chef des armées (article 15 de la Constitution). Le gouvernement « dispose de la force armée » et prépare le budget ; le Parlement vote la loi de programmation militaire.', allemagne: 'En temps de paix, le ministre fédéral de la Défense commande la Bundeswehr ; le chancelier en prend le commandement en cas de guerre. Toute opération extérieure armée exige un vote du Bundestag.', etatsUnis: 'Le président est commandant en chef ; le Congrès vote les crédits et, en principe, déclare la guerre (War Powers Resolution de 1973).' }[partie.pays];
  const rafale = r.capacites.rafale;
  const snle3g = r.capacites.snle3g;
  const mirage = r.capacites.mirage2000d;
  const phenix = r.capacites.phenix;
  const dispo = r.capacites.disponibilite;
  const retraitMirage = r.programmes.find((p) => p.id === 'mirage2000')?.jalonsEffectifs.find((j) => j.id === 'm2000d_retrait');
  const pang = r.programmes.find((p) => p.id === 'pang');
  const pa = porteAvions(partie);
  const domaines = ['Tous', ...new Set(r.programmes.flatMap((p) => p.domaine.split(' et ')))];
  const visibles = r.programmes.filter((p) => domaine === 'Tous' || p.domaine.split(' et ').includes(domaine));
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
        {phenix !== undefined && (
          <div className="tuile">
            <span className="libelle">Ravitailleurs Phénix <Info texte="A330 MRTT Phénix de l'armée de l'Air et de l'Espace : 15 prévus en 2028 (ministère des Armées). Sans ravitailleurs, les Rafale ne peuvent ni frapper loin ni rester longtemps en l'air." /></span>
            <span className="valeur chiffres">{nombre(phenix, 0)}</span>
            <span className="variation muet">objectif : 15 en 2028</span>
          </div>
        )}
        {dispo !== undefined && (
          <div className="tuile">
            <span className="libelle">Disponibilité des hélicoptères <Info texte="Indice de jeu : part moyenne des hélicoptères en état de voler. Les taux publiés varient selon les flottes (environ 36 % pour le NH90 de l'armée de Terre en 2018, objectif de 55 % pour celui de la Marine). Programme « Maintien en condition opérationnelle » pour l'améliorer." /></span>
            <span className={`valeur chiffres ${dispo >= 55 ? 'positif' : dispo < 40 ? 'negatif' : ''}`}>{nombre(dispo, 0)} %</span>
            <span className="variation muet">{dispo >= 55 ? 'bonne' : dispo >= 45 ? 'moyenne' : 'insuffisante'}</span>
          </div>
        )}
        {mirage !== undefined && (
          <div className="tuile">
            <span className="libelle">Mirage 2000D rénovés <Info texte="50 Mirage 2000D rénovés à mi-vie (le dernier livré en juin 2026), en service jusque vers 2035 ; les Mirage 2000-5F de défense aérienne partent vers 2030. Vos décisions (prolonger, céder à l'Ukraine, retirer plus tôt) déplacent ces dates." /></span>
            <span className="valeur chiffres">{nombre(Math.max(0, mirage), 0)}</span>
            <span className="variation muet">{mirage > 0 && retraitMirage ? `derniers retraits : T${retraitMirage.t} ${retraitMirage.annee}` : 'tout Rafale'}</span>
          </div>
        )}
        {snle3g !== undefined && (
          <div className="tuile">
            <span className="libelle">Sous-marins lanceurs d'engins</span>
            <span className="valeur chiffres">{4 + Math.floor(r.capacites.snleSupp ?? 0)}</span>
            <span className="variation muet">{snle3g >= 1 ? `dont ${nombre(snle3g, 0)} de 3e génération` : 'classe Le Triomphant ; SNLE 3G vers 2035'}</span>
          </div>
        )}
        {r.capacites.sna !== undefined && (
          <div className="tuile">
            <span className="libelle">Sous-marins d'attaque (Suffren) <Info texte="SNA de la classe Suffren livrés (programme Barracuda) : quatre fin 2026, six prévus vers 2030. Vous pouvez en commander jusqu'à quatre de plus (dix au total), un tous les quatre trimestres." /></span>
            <span className="valeur chiffres">{nombre(r.capacites.sna, 0)}</span>
            <span className="variation muet">6 prévus vers 2030, 10 au plus</span>
          </div>
        )}
        {r.capacites.pha !== undefined && (
          <div className="tuile">
            <span className="libelle">Grands bâtiments de surface <Info texte="Porte-hélicoptères amphibies (Mistral, Tonnerre, Dixmude), frégates de défense aérienne (Forbin, Chevalier Paul), frégates multi-missions FREMM, ravitailleurs de forces (BRF) et bâtiment d'essais et de mesures Monge. Les frégates FDI, qui complètent le format de 15 frégates de premier rang, ne sont pas détaillées ici." /></span>
            <span className="valeur chiffres">{nombre(['pha', 'fda', 'fremm', 'brf', 'monge'].reduce((t, k) => t + (r.capacites[k] ?? 0), 0), 0)}</span>
            <span className="variation muet">{nombre(r.capacites.pha, 0)} PHA · {nombre(r.capacites.fda, 0)} FDA · {nombre(r.capacites.fremm, 0)} FREMM · {nombre(r.capacites.brf, 0)} BRF · {nombre(r.capacites.monge, 0)} BEM</span>
          </div>
        )}
        {france && (
          <div className="tuile">
            <span className="libelle">Armée de Terre <Info texte="Force opérationnelle terrestre : 77 000 combattants ; l'armée de Terre assure 60 % de l'engagement opérationnel des armées (ministère des Armées, chiffres clés 2025). Objectifs de la loi de programmation : 1 437 Griffon et 238 Jaguar en 2030, 160 Leclerc rénovés fin 2030 et 200 fin 2035, 109 Caesar MkII commandés." /></span>
            <span className="valeur chiffres">77 000</span>
            <span className="variation muet">combattants · {r.programmes.find((p) => p.id === 'leclerc')?.jalonsEffectifs.find((j) => j.id === 'leclerc_160')?.atteint ? '160 Leclerc rénovés ✓' : '160 Leclerc rénovés visés fin 2030'}</span>
          </div>
        )}
        {pang && (
          <div className="tuile">
            <span className="libelle">Porte-avions</span>
            <span className="valeur chiffres">{flotte(partie).length}</span>
            <span className="variation muet">{flotte(partie).length > 1 ? `${flotte(partie).map((x) => x.nom).join(' et ')} : deux groupes aéronavals` : pa.nom === 'France Libre' ? '« France Libre » en service' : pa.nom ? `${pa.nom}${pa.arretTechnique ? ' (arrêt technique)' : ''} ; ${pang.etat?.abandonne ? 'successeur abandonné' : `« France Libre » vers ${pang.jalonsEffectifs[0]?.annee ?? 2038}`}` : pang.etat?.abandonne ? 'successeur abandonné' : `« France Libre » attendu en ${pang.jalonsEffectifs[0]?.annee ?? 2038}`}</span>
          </div>
        )}
      </div>
      <div className="ligne">
        <button type="button" className="bouton" onClick={() => allerA?.('budget')}>Ajuster le budget de la défense</button>
        {france && <button type="button" className="bouton" onClick={() => allerA?.('reformes')}>Trajectoire de l'effort de défense (réformes)</button>}
        {france && <button type="button" className="bouton" onClick={() => allerA?.('dissuasion')}>Voir la dissuasion</button>}
      </div>

      <h3>Programmes</h3>
      {domaines.length > 2 && (
        <div className="puces" role="tablist" aria-label="Armée ou domaine">
          {domaines.map((x) => <button key={x} type="button" role="tab" aria-selected={domaine === x} className={`puce ${domaine === x ? 'active' : ''}`} onClick={() => setDomaine(x)}>{x === 'Terre' ? '🪖 Terre' : x === 'Air' ? '✈️ Air' : x === 'Marine' ? '⚓ Marine' : x}</button>)}
        </div>
      )}
      <div className="grille-programmes">
        {visibles.map((p) => {
          const Illustration = ILLUSTRATIONS[p.illustration];
          const choisie = d.programmes?.[p.id];
          const enCours = p.etat && p.etat.option !== 'nominal' && partie.tour < p.etat.fin;
          const optionEnCours = p.options.find((o) => o.id === p.etat?.option);
          const modeles = MODELES_3D_PAYS[partie.pays]?.[p.id] ?? MODELES_3D[p.id];
          return (
            <article key={p.id} className="carte pile programme">
              {modeles ? <Modeles3D modeles={modeles} />
                : Illustration && <Illustration legende={false} coupe={false} />}
              <div className="ligne espace">
                <div><h4 style={{ margin: 0 }}>{p.nom}</h4><span className="tres-petit muet">{p.sousTitre}</span></div>
                <span className="etiquette">{p.domaine}</span>
              </div>
              <ul className="petit" style={{ margin: 0, paddingLeft: '1.1rem' }}>{p.faits.map((f, i) => <li key={i}>{f}</li>)}</ul>
              <p className="tres-petit muet" style={{ margin: 0 }}>Industriels : {p.industriels.join(', ')}.</p>
              {p.jalonsEffectifs.length > 0 && (
                <p className="tres-petit" style={{ margin: 0 }}>{p.jalonsEffectifs.map((j) => <span key={j.id} style={{ display: 'block' }}>{j.atteint ? '✓' : '⏳'} {trimestre(j)} : {j.texte}{j.decalage > 0 ? ` (retard de ${j.decalage} trimestres)` : j.decalage < 0 ? ` (avance de ${-j.decalage} trimestres)` : ''}</span>)}</p>
              )}
              {p.etat?.abandonne && <p className="alerte critique petit" style={{ margin: 0 }}>Programme arrêté par la réforme « Renoncer au successeur du Charles-de-Gaulle ».</p>}
              {enCours ? (
                <p className="petit alerte" style={{ margin: 0 }}>Décision en cours : <strong>{optionEnCours?.nom}</strong>, jusqu'en {libelleTrimestre({ annee: partie.trimestre.annee + Math.floor((partie.trimestre.t - 1 + p.etat.fin - partie.tour) / 4), t: ((partie.trimestre.t - 1 + p.etat.fin - partie.tour) % 4) + 1 })}.</p>
              ) : p.options.length > 1 ? (
                <fieldset className="choix-option">
                  <legend className="petit">Votre décision</legend>
                  <div className="pile" style={{ gap: '0.3rem' }}>
                    {p.options.filter((o) => !o.remplaceePar || p.etat?.option === o.id || choisie === o.id).map((o) => {
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
              {p.commandes?.length > 0 && (
                <Commandes commandes={p.commandes} choisies={d.commandes ?? []} basculer={(id) => majDefense(majDecisions, (x) => ({ commandes: (x.commandes ?? []).includes(id) ? x.commandes.filter((y) => y !== id) : [...(x.commandes ?? []), id] }))} />
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
