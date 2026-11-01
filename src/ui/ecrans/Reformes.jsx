import React, { useMemo, useState } from 'react';
import { reformesDisponibles, chiffrerReforme } from '../../engine/index.js';
import { GROUPES } from '../../model/ministeres.js';
import Apercu from './Apercu.jsx';
import { nombre, signe, classeVariation } from '../format.js';

const CATEGORIES = {
  retraites: 'Retraites', travail: 'Travail et emploi', fiscalite: 'Fiscalité', fonction_publique: 'Fonction publique',
  protection_sociale: 'Protection sociale', energie: 'Énergie', dette: 'Dette et patrimoine public', regles: 'Règles budgétaires', defense: 'Défense',
};

/** Résultat d'un chiffrage par simulation. */
function Chiffrage({ resultat, partie }) {
  const f = resultat.final;
  return (
    <div className="carte compacte" style={{ background: 'var(--surface-2)' }}>
      <div className="petit"><strong>Effet après 3 ans</strong> (simulation avec et sans la réforme, effets économiques seuls) :</div>
      <div className="grille-2 petit" style={{ gap: '0.3rem 1rem', marginTop: '0.3rem' }}>
        <span>Solde public : <strong className={classeVariation(f.soldeMd)}>{signe(f.soldeMd, 1)} Md€/an</strong></span>
        <span>Dette : <strong className={classeVariation(f.dettePct, false)}>{signe(f.dettePct, 2)} pt de PIB</strong></span>
        <span>PIB : <strong className={classeVariation(f.pib)}>{signe(f.pib, 2)} %</strong></span>
        <span>Chômage : <strong className={classeVariation(f.chomage, false)}>{signe(f.chomage, 2)} pt</strong></span>
      </div>
      <div className="tres-petit" style={{ marginTop: '0.4rem' }}>
        Popularité : {Object.entries(f.groupes).map(([g, v]) => <span key={g} className={classeVariation(v)} style={{ marginRight: 8 }}>{GROUPES[g].nom.split(' ')[0]} {signe(v, 1)}</span>)}
      </div>
      <div className="tres-petit" style={{ marginTop: '0.2rem' }}>
        Ménages : {partie.menages.map((m) => <span key={m.id} className={classeVariation(f.menages[m.id])} style={{ marginRight: 8 }}>{m.nom.split(',')[0]} {signe(f.menages[m.id], 0)} €</span>)}
      </div>
    </div>
  );
}

export default function Reformes({ partie, decisions, majDecisions, apercu, prevision }) {
  const liste = useMemo(() => reformesDisponibles(partie), [partie]);
  const [options, setOptions] = useState({});
  const [chiffrages, setChiffrages] = useState({});
  const [enCours, setEnCours] = useState(null);
  const proposees = decisions.reformes;
  const fr = partie.pays === 'france';

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

  const parCategorie = {};
  for (const r of liste) (parCategorie[r.categorie] ??= []).push(r);
  const pt = prevision?.texte;

  return (
    <div className="pile">
      <h2>Réformes structurelles</h2>
      <p className="petit muet">Chaque réforme agit sur le budget, l'économie et l'opinion. Les plus conflictuelles créent un <strong>grief</strong> dans certains groupes, que des <strong>compensations</strong> peuvent réduire : par exemple, un recul de l'âge de la retraite accompagné de mesures sur la pénibilité et les carrières longues. Les réformes législatives passent devant le Parlement à la fin du trimestre.</p>

      {proposees.length > 0 && (
        <div className="carte pile">
          <h3>Programme du trimestre</h3>
          {proposees.map((p) => {
            const r = liste.find((x) => x.id === p.id);
            return (
              <div key={p.id} className="ligne espace petit">
                <span><strong>{r?.nom}</strong> — {r?.options.find((o) => o.id === p.option)?.nom}</span>
                <button type="button" className="bouton petit danger" onClick={() => retirer(p.id)}>Retirer</button>
              </div>
            );
          })}
          {pt && (
            <div className={`alerte ${pt.adopte ? 'bonne' : ''}`}>
              <strong>Prévision du vote :</strong> {pt.pour} pour, {pt.contre} contre, {pt.abstention} abstentions → {pt.adopte ? 'adoption probable' : 'rejet probable'}.
              {fr && !pt.adopte && pt.censureApres493 && <> Avec le 49.3, la motion de censure réunirait <strong>{pt.censureApres493.voix}</strong> voix sur {pt.censureApres493.majorite} : {pt.censureApres493.adoptee ? <strong className="negatif">le gouvernement tomberait.</strong> : 'elle échouerait.'}</>}
              {!fr && pt.accordPartenaire === false && <> <strong className="negatif">Le SPD bloquerait le texte au comité de coalition.</strong></>}
            </div>
          )}
          {fr && (
            <label className="petit">Procédure :
              <select value={decisions.procedureReformes} onChange={(ev) => majDecisions({ procedureReformes: ev.target.value })} style={{ marginLeft: 6 }}>
                <option value="vote">Vote ordinaire</option>
                <option value="49.3">49.3 en cas de rejet (une fois par session hors budget)</option>
              </select>
            </label>
          )}
          <Apercu apercu={apercu} partie={partie} titre="Impact estimé du programme et de vos curseurs" />
        </div>
      )}

      {partie.reformes.actives.filter((r) => !r.diplomatique).length > 0 && (
        <div className="carte">
          <h3>Réformes en vigueur ou votées</h3>
          <ul className="petit" style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {partie.reformes.actives.filter((r) => !r.diplomatique).map((r) => (
              <li key={r.id}>{r.nom} — {r.libelleOption} {r.appliquee ? <span className="etiquette">en vigueur</span> : <span className="etiquette">entrée en vigueur au tour {r.tourApplication}</span>}</li>
            ))}
          </ul>
        </div>
      )}

      {Object.entries(parCategorie).map(([cat, rs]) => (
        <section key={cat} className="pile">
          <h3>{CATEGORIES[cat] ?? cat}</h3>
          {rs.map((r) => {
            const option = options[r.id] ?? r.options[0].id;
            const cle = `${r.id}:${option}`;
            const proposee = proposees.find((p) => p.id === r.id);
            return (
              <div key={r.id} className="carte pile">
                <div className="ligne espace">
                  <strong>{r.nom}</strong>
                  <span className="ligne">
                    {r.compensation && <span className="etiquette">compensation</span>}
                    {r.majoriteRenforcee && <span className="etiquette">majorité des deux tiers</span>}
                    {r.active && <span className="etiquette">en vigueur : {r.options.find((o) => o.id === r.active)?.nom}</span>}
                  </span>
                </div>
                <p className="petit">{r.resume}</p>
                {r.pedagogie && (
                  <details><summary>Comprendre les enjeux</summary>
                    <p className="petit" style={{ marginTop: '0.4rem' }}>{r.pedagogie}</p>
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
                </div>
              </div>
            );
          })}
        </section>
      ))}
      <p className="tres-petit muet">Les chiffrages par simulation ne tiennent pas compte des votes ni des élections.</p>
    </div>
  );
}
