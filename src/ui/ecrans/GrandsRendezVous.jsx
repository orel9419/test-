import React from 'react';
import Badge from '../composants/Badge.jsx';
import Chantiers from '../composants/Chantiers.jsx';
import { CALENDRIER_GRANDS_EVENEMENTS } from '../../data/grandsEvenements.js';
import { SUCCES } from '../../engine/index.js';
import { libelleTrimestre } from '../../engine/calendrier.js';

const PREPARATION = {
  securite: { renforcee: 'sécurité renforcée', europeenne: 'coopération policière européenne', normale: 'dispositif ordinaire', base: 'crédits de 2025 seulement' },
  budget: { sobre: 'budget sobre', prestige: 'investissements de prestige', garantie: 'garantie publique relevée' },
  soutien: { garanties: 'garanties fédérales', reserve: 'soutien en retrait', abandon: 'candidature abandonnée' },
  candidature: { ambitieuse: 'candidature ambitieuse', sobre: 'candidature sobre', non: 'pas de candidature' },
};

/**
 * Grands rendez-vous : sommets internationaux, Jeux olympiques, candidatures.
 * Chronologie du mandat, préparatifs décidés et résultats, plus les succès
 * débloqués.
 */
export default function GrandsRendezVous({ partie, decisions, majDecisions, allerA }) {
  const t = partie.trimestre;
  const rang = (x) => x.annee * 4 + x.t;
  const maintenant = rang(t);
  const liste = CALENDRIER_GRANDS_EVENEMENTS.filter((x) => x.pays.includes(partie.pays)).sort((a, b) => rang(a) - rang(b));
  const enAttente = new Set(partie.evenements.enAttente.map((e) => e.id));
  const prepa = partie.grandsEvenements ?? {};
  const succes = partie.succes ?? [];
  return (
    <div className="pile">
      <h2>Grands rendez-vous</h2>
      <p className="petit muet">Accueillir un sommet ou des Jeux olympiques renforce l'influence et la fierté nationale, à condition de bien s'y préparer. Repère : la Cour des comptes chiffre le coût public de Paris 2024 à 6,6 Md€ et son effet sur l'activité à +0,07 point de PIB. Les sommets auxquels vous participez se jouent par vos choix d'agenda et d'alliances.</p>

      <ol className="chronologie">
        {liste.map((x) => {
          const r = rang(x);
          const etat = r < maintenant ? 'passe' : r === maintenant ? 'present' : 'avenir';
          const hote = x.hotes.includes(partie.pays);
          const p = prepa[x.id === 'la28_preparation' ? 'la28' : x.id.startsWith('jo2030') ? 'jo2030' : x.id.startsWith('cdm2038') ? 'cdm2038' : x.id] ?? {};
          const details = Object.entries(p).filter(([k]) => PREPARATION[k]).map(([k, v]) => PREPARATION[k][v] ?? v);
          return (
            <li key={x.id} className={`chronologie-point ${etat}`}>
              <div className="ligne espace">
                <strong>{x.nom}</strong>
                <span className="ligne">
                  <span className={`etiquette ${hote ? 'hote' : ''}`}>{hote ? 'Vous accueillez' : 'Participant'}</span>
                  <Badge provenance={{ statut: x.statut, texte: 'Voir countries/_grands-evenements.json' }} />
                </span>
              </div>
              <div className="petit muet">{libelleTrimestre(x)} · {x.date} · {x.lieu}</div>
              {details.length > 0 && <div className="petit">Préparatifs : {details.join(', ')}</div>}
              {p.referendum !== undefined && <div className="petit">Référendum local : {p.referendum.toFixed(1)} % de oui</div>}
              {p.attribuee !== undefined && x.id === 'cdm2038_vote' && <div className={`petit ${p.attribuee ? 'positif' : 'negatif'}`}>{p.attribuee ? '✓ Attribuée à la France' : 'Une autre candidature est retenue'}</div>}
              {p.reussite !== undefined && <div className={`petit ${p.reussite ? 'positif' : 'negatif'}`}>{p.reussite ? '🥇 Un succès' : 'Un événement terni'}</div>}
              {enAttente.has(x.id) || (x.id === 'cop31' && enAttente.has('cop31_us')) || (x.id === 'g20_miami' && enAttente.has('g20_participation')) || (x.id === 'g7_2027' && enAttente.has('g7_2027_participation'))
                ? <button type="button" className="bouton principal petit" onClick={() => allerA('evenements')}>Décider maintenant</button>
                : null}
            </li>
          );
        })}
      </ol>

      {decisions && <Chantiers partie={partie} decisions={decisions} majDecisions={majDecisions} />}

      <div className="carte">
        <h3>Succès débloqués ({succes.length}/{SUCCES.length})</h3>
        <div className="grille-succes">
          {SUCCES.map((s) => {
            const ok = succes.find((x) => x.id === s.id);
            return (
              <div key={s.id} className={`succes ${ok ? 'obtenu' : ''}`} title={s.description}>
                <span className="succes-icone" aria-hidden="true">{ok ? s.icone : '🔒'}</span>
                <span className="petit"><strong>{s.nom}</strong><br /><span className="tres-petit muet">{ok ? `Obtenu au tour ${ok.tour}` : s.description}</span></span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
