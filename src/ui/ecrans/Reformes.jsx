import React, { useMemo, useState } from 'react';
import { reformesDisponibles, chiffrerReforme, voterTexte, effetOpinionReforme } from '../../engine/index.js';
import { GROUPES } from '../../model/ministeres.js';
import Apercu from './Apercu.jsx';
import Capitalisation from './Capitalisation.jsx';
import Programmes from './Programmes.jsx';
import Info from '../composants/Info.jsx';
import { signe, classeVariation, devise } from '../format.js';

/** Thèmes, dans l'ordre d'affichage. */
const THEMES = {
  retraites: 'Retraites', capitalisation: 'Retraites : capitalisation', travail: 'Travail et emploi', depenses: 'Baisse des dépenses',
  fiscalite: 'Fiscalité et entreprises', sante: 'Santé', protection_sociale: 'Protection sociale', fonction_publique: 'Fonction publique',
  energie: 'Énergie et climat', education: 'Éducation', securite: 'Sécurité et justice', immigration: 'Immigration', logement: 'Logement',
  agriculture: 'Agriculture', outre_mer: 'Outre-mer', institutions: 'Institutions', dette: 'Dette et patrimoine public', regles: 'Règles budgétaires', defense: 'Défense', infrastructures: 'Infrastructures et transports',
};
const VEHICULES = {
  PLF: { nom: 'Loi de finances', aide: 'Projet de loi de finances : le 49.3 y est utilisable sans limite, au risque d\'une motion de censure.' },
  PLFSS: { nom: 'Financement de la Sécu', aide: 'Projet de loi de financement de la Sécurité sociale : le 49.3 y est utilisable sans limite.' },
  loi: { nom: 'Loi ordinaire', aide: 'Loi ordinaire : il faut une majorité ; un seul 49.3 par session pour les textes non financiers.' },
  'décret': { nom: 'Décret', aide: 'Décret ou mesure réglementaire : pas de vote au Parlement, application rapide.' },
  'loi constitutionnelle': { nom: 'Révision constitutionnelle', aide: 'Révision de la Constitution : trois cinquièmes des suffrages exprimés au Congrès, pas de 49.3 possible.' },
};

/** Résultat d'un chiffrage par simulation. */
function Chiffrage({ resultat, partie }) {
  const f = resultat.final;
  return (
    <div className="carte compacte" style={{ background: 'var(--surface-2)' }}>
      <div className="petit"><strong>Effet après 3 ans</strong> (simulation avec et sans la réforme, effets économiques seuls) :</div>
      <div className="grille-2 petit" style={{ gap: '0.3rem 1rem', marginTop: '0.3rem' }}>
        <span>Solde public : <strong className={classeVariation(f.soldeMd)}>{signe(f.soldeMd, 1)} Md{devise()}/an</strong></span>
        <span>Dette : <strong className={classeVariation(f.dettePct, false)}>{signe(f.dettePct, 2)} pt de PIB</strong></span>
        <span>PIB : <strong className={classeVariation(f.pib)}>{signe(f.pib, 2)} %</strong></span>
        <span>Chômage : <strong className={classeVariation(f.chomage, false)}>{signe(f.chomage, 2)} pt</strong></span>
      </div>
      <div className="tres-petit" style={{ marginTop: '0.4rem' }}>
        Popularité : {Object.entries(f.groupes).map(([g, v]) => <span key={g} className={classeVariation(v)} style={{ marginRight: 8 }}>{GROUPES[g].nom.split(' ')[0]} {signe(v, 1)}</span>)}
      </div>
      <div className="tres-petit" style={{ marginTop: '0.2rem' }}>
        Ménages : {partie.menages.map((m) => <span key={m.id} className={classeVariation(f.menages[m.id])} style={{ marginRight: 8 }}>{m.nom.split(',')[0]} {signe(f.menages[m.id], 0)} {devise()}</span>)}
      </div>
    </div>
  );
}

/** Pronostic de vote d'une réforme seule (France : le texte est jugé sur son contenu). */
function pronostic(partie, r, option) {
  if (!r.vote) return { classe: 'bon', texte: 'Pas de vote' };
  if (partie.pays !== 'france') return null;
  const v = voterTexte(partie, [{ id: r.id, option }]);
  if (r.majoriteRenforcee) {
    const ok = v.pour >= 0.6 * (v.pour + v.contre);
    return { classe: ok ? 'bon' : 'mauvais', texte: `${ok ? 'Trois cinquièmes atteints' : 'Trois cinquièmes non atteints'} (${v.pour} pour, ${v.contre} contre)`, vote: v };
  }
  const financier = ['PLF', 'PLFSS'].includes(r.vehicule);
  if (v.adopte) return { classe: 'bon', texte: `Majorité probable (${v.pour} pour, ${v.contre} contre)`, vote: v };
  return { classe: financier ? 'moyen' : 'mauvais', texte: `${financier ? '49.3 nécessaire' : 'Rejet probable'} (${v.pour} pour, ${v.contre} contre)`, vote: v };
}

export default function Reformes({ partie, decisions, majDecisions, apercu, prevision }) {
  const liste = useMemo(() => reformesDisponibles(partie), [partie]);
  const [options, setOptions] = useState({});
  const [chiffrages, setChiffrages] = useState({});
  const [enCours, setEnCours] = useState(null);
  const [theme, setTheme] = useState('tous');
  const [recherche, setRecherche] = useState('');
  const [majoritaires, setMajoritaires] = useState(false);
  const [populaires, setPopulaires] = useState(false);
  const [orientation, setOrientation] = useState('toutes');
  const proposees = decisions.reformes;
  const fr = partie.pays === 'france';
  const us = partie.pays === 'etatsUnis';

  const proposer = (r) => {
    const option = options[r.id] ?? r.options[0].id;
    majDecisions((d) => ({ reformes: [...d.reformes.filter((x) => x.id !== r.id), { id: r.id, option }] }));
  };
  const retirer = (id) => majDecisions((d) => ({ reformes: d.reformes.filter((x) => x.id !== id) }));
  const chiffrer = (r) => {
    const option = options[r.id] ?? r.options[0].id;
    setEnCours(r.id);
    setTimeout(() => {
      setChiffrages((c) => ({ ...c, [`${r.id}:${option}`]: chiffrerReforme(partie, r.id, option, 12) }));
      setEnCours(null);
    }, 20);
  };

  const selonOrientation = liste.filter((r) => orientation === 'toutes' || r.orientation === orientation);
  const themesPresents = Object.keys(THEMES).filter((t) => selonOrientation.some((r) => r.categorie === t));
  const filtre = recherche.trim().toLowerCase();
  const visibles = liste.filter((r) => {
    if (theme !== 'tous' && r.categorie !== theme) return false;
    if (orientation !== 'toutes' && r.orientation !== orientation) return false;
    if (filtre && !`${r.nom} ${r.resume}`.toLowerCase().includes(filtre)) return false;
    if (majoritaires) { const p = pronostic(partie, r, options[r.id] ?? r.options[0].id); if (p && p.classe === 'mauvais') return false; }
    if (populaires && effetOpinionReforme(partie, r.id, options[r.id] ?? r.options[0].id) < 1) return false;
    return true;
  });
  const parTheme = {};
  for (const r of visibles) (parTheme[r.categorie] ??= []).push(r);
  const pt = prevision?.texte;

  return (
    <div className="pile">
      <h2>Réformes <span className="muet petit">({liste.length} disponibles)</span></h2>
      <p className="petit muet">Chaque réforme agit sur le budget, l'économie et l'opinion. Les plus conflictuelles créent un <strong>grief</strong> que des <strong>compensations</strong> peuvent réduire. Le badge de vote indique si une majorité se dégage à l'Assemblée : les députés jugent d'abord le contenu du texte, ce qui permet des majorités différentes d'une réforme à l'autre.</p>

      {proposees.length > 0 && (
        <div className="carte pile">
          <h3>Programme du trimestre</h3>
          {proposees.map((p) => {
            const r = liste.find((x) => x.id === p.id);
            return (
              <div key={p.id} className="ligne espace petit">
                <span><strong>{r?.nom}</strong> — {r?.options.find((o) => o.id === p.option)?.nom} {r && <span className="etiquette">{VEHICULES[r.vehicule]?.nom ?? r.vehicule}</span>}</span>
                <button type="button" className="bouton petit danger" onClick={() => retirer(p.id)}>Retirer</button>
              </div>
            );
          })}
          {pt && (
            <div className={`alerte ${pt.adopte ? 'bonne' : ''}`}>
              <strong>Prévision du vote{prevision?.incertitude ? ' (± 25 voix)' : ''} :</strong> {pt.pour} pour, {pt.contre} contre, {pt.abstention} abstentions → {pt.adopte ? 'adoption probable' : 'rejet probable'}.
              {fr && !pt.adopte && pt.censureApres493 && <> Avec le 49.3, la motion de censure réunirait <strong>{pt.censureApres493.voix}</strong> voix sur {pt.censureApres493.majorite} : {pt.censureApres493.adoptee ? <strong className="negatif">le gouvernement tomberait.</strong> : 'elle échouerait.'}</>}
              {partie.pays === 'allemagne' && pt.accordPartenaire === false && <> <strong className="negatif">Le SPD bloquerait le texte au comité de coalition.</strong></>}
              {us && pt.senat && <> Sénat : <strong>{pt.senat.pour}</strong> voix pour {pt.senat.obstruction} nécessaires{pt.senat.pour < 60 ? ' (obstruction)' : ''}.{pt.senatReconciliation !== null && pt.senatReconciliation !== undefined && <> Par réconciliation (mesures budgétaires seulement) : {pt.senatReconciliation} voix pour 50 + le vice-président{pt.reconciliationDisponible ? '' : ', mais elle a déjà servi cet exercice'}.</>}</>}
            </div>
          )}
          {fr && (
            <label className="petit">Procédure :
              <select value={decisions.procedureReformes} onChange={(ev) => majDecisions({ procedureReformes: ev.target.value })} style={{ marginLeft: 6 }}>
                <option value="vote">Vote ordinaire</option>
                <option value="49.3">49.3 en cas de rejet (illimité pour les textes financiers, une fois par session sinon)</option>
              </select>
            </label>
          )}
          {us && (
            <label className="petit">Procédure :
              <select value={decisions.procedureReformes} onChange={(ev) => majDecisions({ procedureReformes: ev.target.value })} style={{ marginLeft: 6 }}>
                <option value="vote">Procédure ordinaire (60 voix au Sénat)</option>
                <option value="reconciliation">Réconciliation budgétaire (51 voix, une fois par exercice)</option>
              </select>
            </label>
          )}
          <Apercu apercu={apercu} partie={partie} titre="Impact estimé du programme et de vos curseurs" />
        </div>
      )}

      {partie.reformes.actives.filter((r) => !r.diplomatique).length > 0 && (
        <details className="carte">
          <summary>Réformes en vigueur ou votées ({partie.reformes.actives.filter((r) => !r.diplomatique && r.id !== 'evenement').length})</summary>
          <ul className="petit" style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem' }}>
            {partie.reformes.actives.filter((r) => !r.diplomatique).map((r) => (
              <li key={r.id}>{r.nom} — {r.libelleOption} {r.appliquee ? <span className="etiquette">en vigueur</span> : <span className="etiquette">entrée en vigueur au tour {r.tourApplication}</span>}</li>
            ))}
          </ul>
        </details>
      )}

      <div className="carte pile filtres-reformes">
        <div className="ligne">
          <input type="search" placeholder="Rechercher une réforme…" value={recherche} onChange={(ev) => setRecherche(ev.target.value)} aria-label="Rechercher une réforme" className="champ-recherche" />
          {fr && <label className="petit"><input type="checkbox" checked={majoritaires} onChange={(ev) => setMajoritaires(ev.target.checked)} /> Seulement celles qui peuvent passer</label>}
          <label className="petit"><input type="checkbox" checked={populaires} onChange={(ev) => setPopulaires(ev.target.checked)} /> Seulement les mesures populaires</label>
        </div>
        {fr && (
          <div className="puces" role="tablist" aria-label="Orientation">
            {[['toutes', 'Toutes orientations'], ['liberale', 'Libérales'], ['sociale', 'Sociales']].map(([id, nom]) => (
              <button key={id} type="button" role="tab" aria-selected={orientation === id} className={`puce orientation-${id} ${orientation === id ? 'active' : ''}`} onClick={() => setOrientation(id)}>
                {nom}{id !== 'toutes' && ` (${liste.filter((r) => r.orientation === id).length})`}
              </button>
            ))}
            <Info texte="Orientation indicative : libérale (marché, baisse des prélèvements et de la dépense, flexibilité) ou sociale (redistribution, protection, services publics). Beaucoup de réformes se discutent des deux côtés." />
          </div>
        )}
        <div className="puces" role="tablist" aria-label="Thèmes">
          <button type="button" role="tab" aria-selected={theme === 'tous'} className={`puce ${theme === 'tous' ? 'active' : ''}`} onClick={() => setTheme('tous')}>Tous ({selonOrientation.length})</button>
          {themesPresents.map((t) => (
            <button key={t} type="button" role="tab" aria-selected={theme === t} className={`puce ${theme === t ? 'active' : ''}`} onClick={() => setTheme(t)}>{THEMES[t]} ({selonOrientation.filter((r) => r.categorie === t).length})</button>
          ))}
        </div>
      </div>

      {fr && <Programmes partie={partie} liste={liste} decisions={decisions} majDecisions={majDecisions} />}

      {fr && (theme === 'tous' || theme === 'capitalisation' || theme === 'retraites') && !filtre && <Capitalisation partie={partie} decisions={decisions} majDecisions={majDecisions} />}

      {visibles.length === 0 && <div className="carte petit muet">Aucune réforme ne correspond à ces filtres.</div>}
      {Object.keys(THEMES).filter((t) => parTheme[t]).map((cat) => (
        <section key={cat} className="pile">
          <h3>{THEMES[cat]}</h3>
          {parTheme[cat].map((r) => {
            const option = options[r.id] ?? r.options[0].id;
            const cle = `${r.id}:${option}`;
            const proposee = proposees.find((p) => p.id === r.id);
            const pr = pronostic(partie, r, option);
            const v = VEHICULES[r.vehicule];
            return (
              <div key={r.id} className={`carte pile ${proposee ? 'reforme-proposee' : ''}`}>
                <div className="ligne espace">
                  <strong>{r.nom}</strong>
                  <span className="ligne">
                    {r.orientation && <span className={`etiquette orientation-${r.orientation}`}>{r.orientation === 'liberale' ? 'Libérale' : 'Sociale'}</span>}
                    {v && <span className="etiquette" title={v.aide}>{v.nom}</span>}
                    {pr && <span className={`pronostic ${pr.classe}`} title="Pronostic du vote à l'Assemblée pour cette réforme seule, avec l'option choisie">{pr.texte}</span>}
                    {(() => { const op = effetOpinionReforme(partie, r.id, option); return Math.abs(op) >= 0.5 ? <span className={`etiquette ${op > 0 ? 'populaire' : 'impopulaire'}`} title="Effet estimé sur votre popularité à l'adoption (chocs d'opinion et opinion durable, moins une partie des griefs)">{op > 0 ? '👍' : '👎'} {op > 0 ? '+' : '−'}{Math.abs(op).toFixed(1).replace('.', ',')} pt</span> : null; })()}
                    {r.compensation && <span className="etiquette">compensation</span>}
                    {r.majoriteRenforcee && <span className="etiquette">majorité des deux tiers</span>}
                    {r.active && <span className="etiquette">en vigueur : {r.options.find((o) => o.id === r.active)?.nom}</span>}
                  </span>
                </div>
                <p className="petit">{r.resume}</p>
                {r.remplace.map((id) => liste.find((x) => x.id === id && x.active)).filter(Boolean).map((x) => (
                  <p key={x.id} className="petit alerte">Adopter cette réforme remplace « {x.nom} », en vigueur.</p>
                ))}
                {(r.pedagogie || r.pour.length > 0) && (
                  <details><summary>Comprendre les enjeux</summary>
                    {r.pedagogie && <p className="petit" style={{ marginTop: '0.4rem' }}>{r.pedagogie}</p>}
                    {(r.pour.length > 0 || r.contre.length > 0) && (
                      <div className="grille-2 petit">
                        <div><strong className="positif">Arguments des partisans</strong><ul>{r.pour.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
                        <div><strong className="negatif">Arguments des opposants</strong><ul>{r.contre.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
                      </div>
                    )}
                    {r.exemples.length > 0 && <p className="petit"><strong>Ailleurs :</strong> {r.exemples.join(' ; ')}.</p>}
                    {pr?.vote && (
                      <p className="tres-petit">Votes prévus par groupe : {pr.vote.detail.map((d) => <span key={d.id} className={d.vote === 'pour' ? 'positif' : d.vote === 'contre' ? 'negatif' : 'muet'} style={{ marginRight: 8 }}>{d.id} {d.vote === 'pour' ? 'pour' : d.vote === 'contre' ? 'contre' : 'abst.'}</span>)}
                        <Info texte="Positions estimées à partir des programmes et des votes connus des groupes (hypothèses de jeu quand elles ne sont pas documentées)." /></p>
                    )}
                    {r.sources.length > 0 && <p className="tres-petit">Sources : {r.sources.map((s, i) => <a key={i} href={s.url} target="_blank" rel="noreferrer" style={{ marginRight: 8 }}>{s.texte}</a>)}</p>}
                  </details>
                )}
                <div role="radiogroup" aria-label={`Options : ${r.nom}`}>
                  {r.options.map((o) => (
                    <label key={o.id} className={`option ${option === o.id ? 'choisie' : ''}`}>
                      <input type="radio" name={`opt-${r.id}`} checked={option === o.id} onChange={() => setOptions((x) => ({ ...x, [r.id]: o.id }))} />
                      <span className="petit"><strong>{o.nom}</strong>{o.description && <span className="muet"> — {o.description}</span>}</span>
                    </label>
                  ))}
                </div>
                {r.chiffrage && <p className="tres-petit muet">Ordres de grandeur : {r.chiffrage}</p>}
                {chiffrages[cle] && <Chiffrage resultat={chiffrages[cle]} partie={partie} />}
                <div className="ligne">
                  <button type="button" className="bouton" onClick={() => chiffrer(r)} disabled={enCours === r.id}>{enCours === r.id ? 'Simulation…' : 'Chiffrer sur 3 ans'}</button>
                  {r.disponible
                    ? <button type="button" className="bouton principal" onClick={() => proposer(r)}>{proposee ? 'Mettre à jour la proposition' : 'Ajouter au programme du trimestre'}</button>
                    : <span className="petit muet">Mesure déjà réalisée.</span>}
                  {fr && r.disponible && r.vote && (
                    decisions.referendum?.id === r.id
                      ? <span className="etiquette">soumise au référendum ce trimestre</span>
                      : <button type="button" className="bouton" title="Article 11 : la réforme est soumise directement aux électeurs (un référendum par an)" onClick={() => majDecisions({ referendum: { id: r.id, option } })}>Soumettre au référendum</button>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      ))}
      <p className="tres-petit muet">Les chiffrages par simulation ne tiennent pas compte des votes ni des élections. Montants sans source : hypothèses de jeu.</p>
    </div>
  );
}
