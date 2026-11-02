import React, { useMemo } from 'react';
import { previsionG7, prochainSommet, peutNegocier } from '../../engine/index.js';
import { MEMBRES_G7, DOSSIERS_G7, CONCESSIONS_G7 } from '../../data/g7.js';
import { MODES, normaliserMode } from '../../model/parametres.js';
import Info from '../composants/Info.jsx';
import { pct } from '../format.js';

const LIBELLE_ISSUE = { ambitieux: 'Accord ambitieux', compromis: 'Compromis', echec: 'Échec' };

/** Position d'un membre : symbole + couleur (jamais la couleur seule). */
function Position({ v }) {
  const [classe, symbole, texte] = v >= 0.3 ? ['positif', '✓', 'favorable'] : v <= -0.3 ? ['negatif', '✗', 'opposé'] : ['muet', '~', 'réservé'];
  return <span className={classe} title={`${texte} (${v.toFixed(2).replace('.', ',')})`} aria-label={texte}>{symbole}</span>;
}

/** Probabilités en clair (mode Expert : appréciation qualitative). */
function Chances({ p, exactes }) {
  if (exactes) return <span className="tres-petit">{pct(p.ambitieux * 100, 0)} ambitieux · {pct(p.compromis * 100, 0)} compromis · <span className={p.echec > 0.5 ? 'negatif' : ''}>{pct(p.echec * 100, 0)} échec</span></span>;
  const qualif = (x) => (x >= 0.7 ? 'probable' : x >= 0.35 ? 'incertain' : 'peu probable');
  return <span className="tres-petit">accord {qualif(p.ambitieux + p.compromis)} · ambitieux {qualif(p.ambitieux)}</span>;
}

/**
 * Sommet du G7 : agenda, positions des membres, priorités et ambition,
 * concessions, bilatérales, préparation par les sherpas, prévisions et
 * historique des sommets.
 */
export default function G7({ partie, decisions, majDecisions, capitalRestant }) {
  const s = prochainSommet(partie);
  const negocie = peutNegocier(partie);
  const g = decisions.g7 ?? {};
  const prevision = useMemo(() => previsionG7(partie, g), [partie, g]);
  const exactes = MODES[normaliserMode(partie.mode)]?.previsionsExactes !== false;
  const membres = Object.keys(MEMBRES_G7).filter((m) => m !== partie.pays);
  const maj = (modif) => majDecisions((d) => ({ g7: { ...(d.g7 ?? {}), ...modif } }));
  const basculer = (cle, valeur, max) => {
    const liste = g[cle] ?? [];
    if (liste.includes(valeur)) maj({ [cle]: liste.filter((x) => x !== valeur) });
    else if (liste.length < max) maj({ [cle]: [...liste, valeur] });
  };
  const bilaterales = g.bilaterales ?? [];
  const capitalApres = capitalRestant - bilaterales.length - (decisions.g7Preparation ? 1 : 0);
  const historique = partie.g7?.historique ?? [];
  const agendaLibre = s.presidence && s.ceTrimestre && negocie;

  return (
    <div className="carte pile">
      <h3>Sommet du G7 {s.annee} <Info texte="Le G7 réunit chaque année les États-Unis, l'Allemagne, le Japon, le Royaume-Uni, l'Italie, le Canada et la France, avec l'Union européenne. La présidence tourne (France en 2026 à Évian, États-Unis en 2027, puis Royaume-Uni, Allemagne, Japon, Italie, Canada) et fixe l'agenda. Les décisions se prennent par consensus : un membre très hostile suffit à bloquer, d'où l'intérêt des bilatérales et des concessions." /></h3>
      <p className="petit" style={{ margin: 0 }}>
        {s.presidence ? <strong>Vous présidez le G7 cette année : vous fixez l'agenda. </strong> : <>Présidence : <strong>{MEMBRES_G7[s.hote].drapeau} {s.hoteNom}</strong>. </>}
        {s.ceTrimestre ? <strong>Le sommet a lieu ce trimestre.</strong> : <>Sommet au T2 {s.annee}, dans {s.trimestresAvant} trimestre{s.trimestresAvant > 1 ? 's' : ''}.</>}
      </p>
      {!negocie && (
        <div className="alerte petit">Domaine réservé : c'est le président de la République qui représente la France au G7 et y négocie. Le sommet se déroule avec les priorités de l'Élysée (Ukraine, énergie). Choisissez le rôle de président à l'accueil pour négocier vous-même.</div>
      )}

      {negocie && !s.ceTrimestre && (
        <label className="petit" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
          <input type="checkbox" checked={!!decisions.g7Preparation} disabled={!decisions.g7Preparation && (capitalRestant < 1 || (partie.g7?.preparation ?? 0) >= 3)} onChange={(ev) => majDecisions({ g7Preparation: ev.target.checked })} />
          <span>Mobiliser les sherpas pour préparer le sommet (1 point de capital diplomatique) : préparation {partie.g7?.preparation ?? 0}/3, chaque point facilite vos priorités.</span>
        </label>
      )}

      {agendaLibre && (
        <div className="petit">
          <strong>Votre agenda (4 dossiers au plus) :</strong>
          <div className="puces" style={{ marginTop: 4 }}>
            {Object.entries(DOSSIERS_G7).map(([id, d]) => {
              const choisi = (g.agenda ?? prevision.agenda.map((x) => x.id)).includes(id);
              return <button key={id} type="button" className={`puce ${choisi ? 'active' : ''}`} aria-pressed={choisi} onClick={() => { const actuel = g.agenda ?? prevision.agenda.map((x) => x.id); maj({ agenda: choisi ? actuel.filter((x) => x !== id) : [...actuel, id].slice(0, 4) }); }}>{d.nom}</button>;
            })}
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="petit">
          <thead>
            <tr>
              <th>Dossier</th>
              {negocie && s.ceTrimestre && <th>Priorité</th>}
              {membres.map((m) => <th key={m} className="nombre" title={MEMBRES_G7[m].nom}><span aria-label={MEMBRES_G7[m].nom}>{MEMBRES_G7[m].drapeau}</span></th>)}
              <th>Prévision</th>
            </tr>
          </thead>
          <tbody>
            {prevision.agenda.map((d) => (
              <tr key={d.id}>
                <td><strong>{d.nom}</strong> <Info texte={`${DOSSIERS_G7[d.id].description} ${DOSSIERS_G7[d.id].pedagogie}`} /></td>
                {negocie && s.ceTrimestre && (
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={(g.priorites ?? []).includes(d.id)} disabled={!(g.priorites ?? []).includes(d.id) && (g.priorites ?? []).length >= 2} onChange={() => basculer('priorites', d.id, 2)} aria-label={`Priorité : ${d.nom}`} />
                    {(g.priorites ?? []).includes(d.id) && (
                      <select value={g.ambition?.[d.id] ?? 'compromis'} onChange={(ev) => maj({ ambition: { ...(g.ambition ?? {}), [d.id]: ev.target.value } })} aria-label={`Ambition : ${d.nom}`} style={{ marginLeft: 4 }}>
                        <option value="compromis">compromis</option>
                        <option value="ambitieux">ambitieux</option>
                      </select>
                    )}
                  </td>
                )}
                {membres.map((m) => <td key={m} className="nombre"><Position v={d.positions[m]} /></td>)}
                <td><Chances p={d.probabilites} exactes={exactes} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="tres-petit muet" style={{ margin: 0 }}>✓ favorable · ~ réservé · ✗ opposé. Les positions tiennent compte de vos relations, de votre influence, de la préparation, de vos concessions et de vos bilatérales. Viser un accord ambitieux rend chaque membre plus exigeant. Les dossiers qui ne sont pas vos priorités sont tranchés sans votre appui.</p>

      {negocie && s.ceTrimestre && (
        <div className="grille-2">
          <div className="pile">
            <strong className="petit">Concessions à mettre sur la table</strong>
            {Object.entries(CONCESSIONS_G7).filter(([, c]) => !c.pays || c.pays.includes(partie.pays)).map(([id, c]) => (
              <label key={id} className="petit" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <input type="checkbox" checked={(g.concessions ?? []).includes(id)} onChange={() => basculer('concessions', id, 5)} />
                <span><strong>{c.nom}</strong> <span className="muet">— {c.description} Rapproche : {Object.entries(c.bonus).filter(([, v]) => v > 0).map(([m]) => MEMBRES_G7[m]?.nom).join(', ')}.</span></span>
              </label>
            ))}
          </div>
          <div className="pile">
            <strong className="petit">Réunions bilatérales (2 au plus, 1 point de capital chacune)</strong>
            <div className="puces">
              {membres.map((m) => {
                const choisi = bilaterales.includes(m);
                return <button key={m} type="button" className={`puce ${choisi ? 'active' : ''}`} aria-pressed={choisi} disabled={!choisi && (bilaterales.length >= 2 || capitalApres < 1)} onClick={() => basculer('bilaterales', m, 2)}>{MEMBRES_G7[m].drapeau} {MEMBRES_G7[m].nom}</button>;
              })}
            </div>
            <span className="tres-petit muet">Capital diplomatique restant après vos choix : {Math.max(0, capitalApres)} point(s). Une bilatérale rend ce dirigeant nettement plus conciliant sur tous les dossiers.</span>
          </div>
        </div>
      )}

      {historique.length > 0 && (
        <details>
          <summary className="petit">Sommets précédents ({historique.length})</summary>
          <ul className="petit" style={{ paddingLeft: '1.1rem' }}>
            {[...historique].reverse().map((h) => (
              <li key={h.annee}>
                <strong>G7 {h.annee}</strong> ({h.presidence ? 'votre présidence' : h.hoteNom}) : {h.resultats.map((r) => `${r.nom} — ${LIBELLE_ISSUE[r.niveau]}${r.priorite ? ' (priorité)' : ''}`).join(' ; ')}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
