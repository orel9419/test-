import React, { useMemo, useState } from 'react';
import { urlSure } from '../securite.js';
import { PAYS, contexte } from '../donnees.js';
import { PARAMETRES } from '../../model/parametres.js';

const STATUTS = {
  officiel: 'Source officielle', prevision_officielle: 'Prévision officielle', secondaire: 'Source secondaire (chiffre officiel relayé)',
  derive: 'Calculé à partir de données sourcées', marche: 'Donnée de marché', a_verifier: 'À vérifier', introuvable: 'Introuvable', estimation: 'Estimation de jeu',
};

/** Parcourt un fichier de données et liste chaque valeur sourcée. */
function aplatir(obj, chemin = []) {
  const res = [];
  if (!obj || typeof obj !== 'object') return res;
  if ('statut' in obj && ('valeur' in obj || 'valeurs' in obj || 'source' in obj)) {
    res.push({ chemin: chemin.join(' › '), ...obj });
    return res;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'meta') continue;
    if (Array.isArray(v)) continue;
    res.push(...aplatir(v, [...chemin, k.replaceAll('_', ' ')]));
  }
  return res;
}

function valeurLisible(x) {
  const v = x.valeur ?? x.valeurs;
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') return Object.entries(v).slice(0, 6).map(([k, y]) => `${k} : ${typeof y === 'object' ? JSON.stringify(y) : y}`).join(' · ');
  return `${v}${x.unite ? ` ${x.unite}` : ''}`;
}

export default function Sources({ partie }) {
  const d = PAYS[partie.pays].donnees;
  const [filtre, setFiltre] = useState('tous');
  const lignes = useMemo(() => [...aplatir(d), ...aplatir(contexte).map((x) => ({ ...x, chemin: `monde › ${x.chemin}` }))], [d]);
  const visibles = lignes.filter((l) => filtre === 'tous' || l.statut === filtre);
  const manquantes = lignes.filter((l) => l.statut === 'introuvable' || l.statut === 'a_verifier' || l.statut === 'estimation');
  return (
    <div className="pile">
      <h2>Données et sources</h2>
      <div className="carte pile petit">
        <p><strong>Dernière mise à jour des données :</strong> {new Date(d.meta.derniere_mise_a_jour).toLocaleDateString('fr-FR')}.</p>
        <p>{d.meta.methode}</p>
        <p>Pour rafraîchir les données, lancez <code>npm run update-data</code> (voir le README) : le script interroge Eurostat, le FMI et la Banque mondiale et conserve, pour chaque valeur, la source et la date.</p>
        <p className="muet">Le moteur distingue les <strong>données</strong> (ce fichier, sourcé) des <strong>hypothèses de modélisation</strong> (multiplicateurs, élasticités), regroupées dans <code>src/model/parametres.js</code>. Exemples : multiplicateur de l'investissement public {PARAMETRES.multiplicateursDepense.investissement}, des transferts {PARAMETRES.multiplicateursDepense.transferts} ; loi d'Okun {PARAMETRES.okun} ; seuil de crise des marchés {PARAMETRES.seuilCriseSpread} pb.</p>
      </div>
      {manquantes.length > 0 && (
        <div className="carte">
          <h3>Données manquantes, estimées ou à vérifier ({manquantes.length})</h3>
          <ul className="petit" style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {manquantes.map((m, i) => <li key={i}><strong>{m.chemin}</strong> — {STATUTS[m.statut]}{m.note ? ` : ${m.note}` : ''}</li>)}
          </ul>
        </div>
      )}
      <div className="carte" style={{ overflowX: 'auto' }}>
        <div className="ligne espace">
          <h3>Toutes les valeurs ({visibles.length})</h3>
          <select value={filtre} onChange={(ev) => setFiltre(ev.target.value)} aria-label="Filtrer par statut">
            <option value="tous">Tous les statuts</option>
            {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <table className="petit">
          <thead><tr><th>Donnée</th><th>Valeur</th><th>Source</th><th>Date</th><th>Statut</th></tr></thead>
          <tbody>{visibles.map((l, i) => (
            <tr key={i}>
              <td>{l.chemin}</td>
              <td style={{ maxWidth: 260 }}>{valeurLisible(l)}{l.note && <div className="tres-petit muet">{l.note}</div>}</td>
              <td>{urlSure(l.url) ? <a href={urlSure(l.url)} target="_blank" rel="noopener noreferrer">{l.source ?? 'lien'}</a> : (l.source ?? '—')}</td>
              <td className="chiffres">{l.date ?? l.periode ?? '—'}</td>
              <td><span className={`badge ${l.statut}`}>{STATUTS[l.statut] ?? l.statut}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
