import React, { lazy, Suspense } from 'react';
import Info from '../composants/Info.jsx';
import { resumeGeopolitique, compositionGroupes } from '../../engine/index.js';
import { GROUPE_AERONAVAL } from '../../data/geopolitique.js';
import { md } from '../format.js';

const Visionneuse3D = lazy(() => import('../3d/Visionneuse3D.jsx'));
const NOMS = { fda: 'frégate de défense aérienne', fremm: 'FREMM', sna: 'sous-marin nucléaire d\'attaque', brf: 'ravitailleur' };

/**
 * Le ou les groupes aéronavals du chef des armées (France) : vue 3D composée
 * d'après la partie (à quai à Toulon ou en mission), fiche de chaque groupe et
 * ordres de déploiement. Le président de la République décide (domaine
 * réservé) ; le Premier ministre propose.
 */
export default function GroupeAeronaval({ partie, decisions, majDecisions, allerA }) {
  if (partie.pays !== 'france') return <div className="carte"><h2>Groupe aéronaval</h2><p>Ce module est disponible pour la France.</p></div>;
  const r = resumeGeopolitique(partie);
  const c = compositionGroupes(partie);
  const president = partie.role === 'president';
  const theatres = r?.theatres ?? [];
  const nomTheatre = (id) => theatres.find((t) => t.id === id)?.nom ?? id;
  const etats = [r?.gan, r?.gan2];
  const groupes = c.groupes.map((g, i) => ({ ...g, etat: etats[i] ?? {}, cle: i === 0 ? 'gan' : 'gan2', destination: decisions[i === 0 ? 'gan' : 'gan2'] ?? null }));
  const deux = groupes.length > 1;
  const possible = (gr, t) => t.id !== gr.position && (t.base || (gr.porteAvions?.disponible && !(gr.maintenance > 0) && gr.potentiel >= t.usure));
  const donnees = { groupes: groupes.map((g) => ({ numero: g.numero, porteAvions: g.porteAvions, nom: g.nom, escorte: g.escorte, enMer: g.position !== 'toulon', theatre: nomTheatre(g.position) })) };

  return (
    <div className="pile">
      <h2>{deux ? 'Les groupes aéronavals' : 'Le groupe aéronaval'} <span className="muet petit">· chef des armées</span></h2>
      <p className={`petit ${president ? '' : 'alerte'}`} style={{ margin: 0 }}>
        {president
          ? 'Vous êtes le chef des armées (article 15 de la Constitution) : vous décidez seul du déploiement du groupe aéronaval. Le gouvernement en supporte le coût dans le budget des armées.'
          : 'Domaine réservé : le déploiement du groupe aéronaval relève du président de la République, chef des armées. Vous lui proposez vos ordres ; dans ce jeu, il les suit (même majorité).'}
        {' '}<Info texte={GROUPE_AERONAVAL.pedagogie} />
      </p>

      {!groupes.length ? (
        <div className="carte"><p className="petit" style={{ margin: 0 }}>Aucun porte-avions en service : pas de groupe aéronaval. Voir le programme « France Libre » dans l'onglet Armées.</p></div>
      ) : (
        <>
          <div className="carte pile">
            <Suspense fallback={<p className="petit muet">Chargement de la vue 3D…</p>}>
              <Visionneuse3D key={JSON.stringify(donnees)} modele="groupeAeronaval" hauteur={440} donnees={donnees} />
            </Suspense>
            <p className="tres-petit muet" style={{ margin: 0 }}>Composition de votre partie. À Toulon, les bâtiments sont à quai ; en mission, ils naviguent en formation, sillages et patrouille de Rafale compris. Distances resserrées et avions agrandis pour tout voir d'un coup d'œil.</p>
          </div>

          <div className={deux ? 'grille-2' : 'pile'}>
            {groupes.map((g) => {
              const e = g.etat;
              const pa = e.porteAvions ?? {};
              return (
                <div key={g.cle} className="carte pile">
                  <h3 style={{ margin: 0 }}>🚢 {deux ? `Groupe ${g.numero} · ` : ''}{g.nom}</h3>
                  {!pa.disponible && pa.motif && <p className={`alerte petit ${pa.enService ? '' : 'critique'}`} style={{ margin: 0 }}>{pa.motif}</p>}
                  <div className="ligne espace petit"><span>Position</span><strong>{g.position === 'toulon' ? 'à quai à Toulon' : nomTheatre(g.position)}</strong></div>
                  <div className="petit">Potentiel (équipages, munitions, maintenance) : <strong>{Math.round(e.potentiel ?? 100)} %</strong>
                    <div className="jauge-potentiel"><div style={{ width: `${e.potentiel ?? 100}%` }} className={(e.potentiel ?? 100) < 30 ? 'bas' : ''} /></div>
                  </div>
                  {e.trimestresEnMer > 0 && <div className="ligne espace petit"><span>En mer depuis</span><strong>{e.trimestresEnMer} trimestre(s)</strong></div>}
                  {e.maintenance > 0 && <p className="petit alerte" style={{ margin: 0 }}>Entretien à Toulon : encore {e.maintenance} trimestre(s).</p>}
                  <p className="petit" style={{ margin: 0 }}>Escorte : {Object.entries(g.escorte).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${NOMS[k]}${n > 1 && k !== 'fremm' ? 's' : ''}`).join(', ') || 'aucune'}.</p>
                  {g.manques.length > 0 && <p className="petit negatif" style={{ margin: 0 }}>Il manque : {g.manques.join(', ')}. <button type="button" className="lien" onClick={() => allerA?.('armees')}>Commander des bâtiments (Armées)</button></p>}
                  {g.destination && <p className="petit alerte bonne" style={{ margin: 0 }}>Ordre donné : {g.destination === 'toulon' ? 'rentrer à Toulon' : `appareiller pour ${nomTheatre(g.destination)}`} (à la validation du trimestre). <button type="button" className="lien" onClick={() => majDecisions({ [g.cle]: null })}>Annuler</button></p>}
                  <fieldset className="choix-option">
                    <legend className="petit">{president ? 'Votre ordre' : 'Votre proposition au président'}</legend>
                    <div className="puces">
                      {theatres.map((t) => {
                        const ici = t.id === g.position;
                        const ok = possible(e, t);
                        return (
                          <button key={t.id} type="button" className={`puce ${g.destination === t.id ? 'active' : ''}`} disabled={ici || !ok} aria-pressed={g.destination === t.id} title={ici ? 'Position actuelle' : !ok ? (e.maintenance > 0 ? 'Entretien en cours' : !pa.disponible ? pa.motif ?? '' : 'Potentiel insuffisant') : t.base ? 'Rentrer au port base' : `Environ ${md(t.cout, 2)} par trimestre, usure ${t.usure} points`} onClick={() => majDecisions({ [g.cle]: t.id })}>
                            {t.base ? '⚓ Toulon' : t.court}{ici ? ' (ici)' : ''}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                </div>
              );
            })}
          </div>
          <div className="carte pile">
            <h3 style={{ margin: 0 }}>Comprendre</h3>
            <ul className="petit" style={{ margin: 0, paddingLeft: '1.1rem' }}>{GROUPE_AERONAVAL.composition.map((x) => <li key={x}>{x}</li>)}</ul>
            <p className="tres-petit muet" style={{ margin: 0 }}>Environ deux bâtiments sur trois sont disponibles à un moment donné, les autres étant en entretien ou en entraînement (hypothèse de jeu) : armer deux groupes complets demande davantage de frégates et de ravitailleurs. Tensions, crises et effets de la présence : <button type="button" className="lien" onClick={() => allerA?.('geopolitique')}>carte de la Géopolitique</button>.</p>
          </div>
        </>
      )}
    </div>
  );
}
