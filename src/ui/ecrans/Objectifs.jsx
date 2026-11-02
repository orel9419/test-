import React from 'react';
import Jauge from '../composants/Jauge.jsx';
import { nombre } from '../format.js';

const STATUT = { atteint: '✓ Atteint', en_voie: '✓ En bonne voie', en_cours: 'En cours', echoue: '✗ Échoué' };
const UNITE = { retraitesPib: ' % PIB', censures: ' renversé(s)', deficit: ' % PIB', dette: ' % PIB', spread: ' pb', defense: ' % PIB', emissions: ' Mt', chomage: ' %', effortRD: ' % PIB', cohesion: '/100', pouvoirAchatModestes: ' %', presidentielle: ' %', coalition: '/100', afd: ' %', siegesRepublicains: ' sièges', trimestresShutdown: ' trim.', presidentielleEtatsUnis: ' %', epuisementSocialSecurity: '' };
const SANS_VALEUR = ['survie', 'budget2027', 'election2029', 'pasDeDefaut'];

/** Trimestre correspondant à un numéro de tour (le tour 1 est le premier trimestre de la partie). */
function trimestreDuTour(partie, tour) {
  const n = (partie.trimestre.annee * 4 + partie.trimestre.t - 1) + (tour - partie.tour);
  return `T${(n % 4) + 1} ${Math.floor(n / 4)}`;
}

/** Liste permanente des objectifs du mandat, avec jauge de progression. */
export default function Objectifs({ partie }) {
  const finMandat = partie.nbToursMandat ? trimestreDuTour(partie, partie.nbToursMandat).split(' ')[1] : null;
  const groupes = partie.horizon
    ? [['long_terme', `Objectifs ${partie.horizon}`, (o) => o.categorie === 'long_terme'],
      ['principal', `Objectifs principaux du mandat en cours (jusqu'en ${finMandat})`, (o) => o.categorie !== 'long_terme' && o.type === 'principal'],
      ['secondaire', 'Objectifs secondaires du mandat en cours', (o) => o.categorie !== 'long_terme' && o.type === 'secondaire']]
    : [['principal', 'Objectifs principaux', (o) => o.type === 'principal'], ['secondaire', 'Objectifs secondaires', (o) => o.type === 'secondaire']];
  return (
    <div className="carte">
      <h3>{partie.horizon ? `Objectifs jusqu'en ${partie.horizon}` : 'Objectifs du mandat'}</h3>
      {groupes.map(([type, titre, filtre]) => (
        <div key={type}>
          <div className="tres-petit muet" style={{ marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{titre}</div>
          {partie.objectifs.filter(filtre).map((o) => {
            const dec = o.mesure === 'effortRD' ? 2 : ['siegesRepublicains', 'trimestresShutdown', 'epuisementSocialSecurity'].includes(o.mesure) ? 0 : 1;
            const fmt = (x) => (o.mesure === 'epuisementSocialSecurity' ? String(Math.round(x)) : nombre(x, dec));
            const valeurLisible = SANS_VALEUR.includes(o.mesure) ? null : `${fmt(o.valeur)}${UNITE[o.mesure] ?? ''} → cible ${o.sens === '<=' ? '≤' : '≥'} ${fmt(o.cible)}${UNITE[o.mesure] ?? ''}`;
            const couleur = o.statut === 'echoue' ? 'var(--critique)' : o.statut === 'atteint' || o.statut === 'en_voie' ? 'var(--bon)' : 'var(--accent)';
            return (
              <div className="objectif" key={o.id} title={o.description}>
                <div className="ligne espace" style={{ alignItems: 'flex-start' }}>
                  <span className="petit" style={{ fontWeight: type !== 'secondaire' ? 600 : 400 }}>{o.nom}{o.echeanceTour && o.echeanceTour > 1 && <span className="tres-petit muet"> · échéance {trimestreDuTour(partie, o.echeanceTour)}</span>}</span>
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
