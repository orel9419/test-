import React from 'react';
import Jauge from '../composants/Jauge.jsx';
import { nombre } from '../format.js';

const STATUT = { atteint: '✓ Atteint', en_voie: '✓ En bonne voie', en_cours: 'En cours', echoue: '✗ Échoué' };
const UNITE = { deficit: ' % PIB', dette: ' % PIB', spread: ' pb', defense: ' % PIB', emissions: ' Mt', chomage: ' %', effortRD: ' % PIB', cohesion: '/100', pouvoirAchatModestes: ' %', presidentielle: ' %', coalition: '/100', afd: ' %' };

/** Liste permanente des objectifs du mandat, avec jauge de progression. */
export default function Objectifs({ partie }) {
  const groupes = [['principal', 'Objectifs principaux'], ['secondaire', 'Objectifs secondaires']];
  return (
    <div className="carte">
      <h3>Objectifs du mandat</h3>
      {groupes.map(([type, titre]) => (
        <div key={type}>
          <div className="tres-petit muet" style={{ marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{titre}</div>
          {partie.objectifs.filter((o) => o.type === type).map((o) => {
            const valeurLisible = ['survie', 'budget2027', 'election2029'].includes(o.mesure) ? null : `${nombre(o.valeur, o.mesure === 'effortRD' ? 2 : 1)}${UNITE[o.mesure] ?? ''} → cible ${o.sens === '<=' ? '≤' : '≥'} ${nombre(o.cible, o.mesure === 'effortRD' ? 2 : 1)}${UNITE[o.mesure] ?? ''}`;
            const couleur = o.statut === 'echoue' ? 'var(--critique)' : o.statut === 'atteint' || o.statut === 'en_voie' ? 'var(--bon)' : 'var(--accent)';
            return (
              <div className="objectif" key={o.id} title={o.description}>
                <div className="ligne espace" style={{ alignItems: 'flex-start' }}>
                  <span className="petit" style={{ fontWeight: type === 'principal' ? 600 : 400 }}>{o.nom}</span>
                  <span className={`statut ${o.statut}`}>{STATUT[o.statut]}</span>
                </div>
                {valeurLisible && <div className="tres-petit muet chiffres">{valeurLisible}</div>}
                <Jauge valeur={o.progression} couleur={couleur} libelle={o.nom} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
