import React, { useState } from 'react';

const TYPES = { tous: 'Tout', politique: 'Politique', reforme: 'Réformes', evenement: 'Événements', diplomatie: 'Diplomatie', bilan: 'Bilans', election: 'Élections', social: 'Social', loi: 'Lois', alerte: 'Alertes', info: 'Infos' };

/** Journal des événements de la partie, filtrable. */
export default function Journal({ partie }) {
  const [filtre, setFiltre] = useState('tous');
  const entrees = partie.journal.filter((j) => filtre === 'tous' || j.type === filtre).slice().reverse();
  return (
    <div className="pile">
      <div className="ligne espace">
        <h2>Journal</h2>
        <label className="petit">Filtrer :
          <select value={filtre} onChange={(ev) => setFiltre(ev.target.value)} style={{ marginLeft: 6 }}>
            {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>
      <div className="carte">
        {entrees.length === 0 && <p className="petit muet">Rien à afficher.</p>}
        {entrees.map((j, i) => (
          <div key={i} className="journal-ligne"><span className="muet">{j.trimestre}</span><span>{j.texte}</span></div>
        ))}
      </div>
    </div>
  );
}
