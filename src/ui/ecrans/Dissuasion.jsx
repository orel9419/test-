import React, { useState } from 'react';
import Info from '../composants/Info.jsx';
import { Snle } from '../composants/Illustrations.jsx';
import Visionneuse3D from '../3d/Visionneuse3D.jsx';
import { resumeDefense } from '../../engine/index.js';
import { DISSUASION_EUROPE, SOURCES_DEFENSE } from '../../data/defense.js';
import { libelleTrimestre } from '../../engine/calendrier.js';
import { majDefense } from './Armees.jsx';

/** Dissuasion nucléaire : composantes, SNLE 3G, et dimension européenne (domaine réservé). */
export default function Dissuasion({ partie, decisions, majDecisions, allerA }) {
  const [coupe, setCoupe] = useState(true);
  const r = resumeDefense(partie);
  if (partie.pays !== 'france') {
    return (
      <div className="pile">
        <h2>Dissuasion nucléaire</h2>
        <Snle coupe={coupe} nom={partie.pays === 'etatsUnis' ? 'Sous-marin de la classe Columbia' : 'Sous-marin lanceur d\'engins'} />
        <p className="petit">{partie.pays === 'allemagne'
          ? 'L\'Allemagne ne possède pas l\'arme nucléaire. Elle participe au partage nucléaire de l\'OTAN : des bombes américaines sont stockées sur son sol et ses avions (bientôt des F-35A, à Büchel) peuvent les emporter, sur décision américaine. Le débat sur une protection européenne, avec la France et le Royaume-Uni, s\'est ouvert en 2025.'
          : 'La triade nucléaire américaine : missiles intercontinentaux (programme Sentinel), sous-marins lanceurs d\'engins (classe Columbia en construction) et bombardiers (B-21). Le président seul peut ordonner l\'emploi de l\'arme nucléaire.'}</p>
        <button type="button" className="bouton" onClick={() => setCoupe((c) => !c)}>{coupe ? 'Masquer la vue en coupe' : 'Afficher la vue en coupe'}</button>
      </div>
    );
  }
  const d = decisions.defense ?? {};
  const choix = d.dissuasion ?? r.dissuasion;
  const snle = r.programmes.find((p) => p.id === 'snle3g');
  const jalon = snle?.jalonsEffectifs[0];
  return (
    <div className="pile">
      <h2>Dissuasion nucléaire</h2>
      <p className="petit muet">Clé de voûte de la défense française depuis les années 1960. Le président de la République est seul à pouvoir ordonner l'emploi de l'arme nucléaire. Le coût de la dissuasion représente environ 13 % de la loi de programmation militaire 2024-2030, soit environ 7,7 Md€ par an en moyenne.</p>

      <div className="carte pile">
        <div className="ligne espace">
          <h3 style={{ margin: 0 }}>La composante océanique : les SNLE</h3>
          <button type="button" className="bouton" onClick={() => setCoupe((c) => !c)} aria-pressed={coupe}>{coupe ? 'Masquer la vue en coupe' : 'Afficher la vue en coupe'}</button>
        </div>
        <Visionneuse3D modele="snle" hauteur={340} />
        {coupe && <Snle coupe nom="SNLE de la classe Le Triomphant" />}
        <ul className="petit" style={{ margin: 0, paddingLeft: '1.1rem' }}>
          <li><strong>4 SNLE</strong> (Le Triomphant, Le Téméraire, Le Vigilant, Le Terrible), mis en service de 1997 à 2010. Basés à l'Île Longue, près de Brest.</li>
          <li><strong>Permanence à la mer</strong> : au moins un SNLE en patrouille, indétectable, depuis 1972. C'est la garantie de pouvoir riposter en toutes circonstances (« frappe en second »).</li>
          <li><strong>16 missiles M51</strong> par sous-marin, d'une portée de plusieurs milliers de kilomètres.</li>
          <li><strong>SNLE de 3e génération</strong> : construction de L'Invincible lancée à Cherbourg le 20 mars 2024 ; {jalon ? `entrée en service prévue ${libelleTrimestre({ annee: jalon.annee, t: jalon.t })}${jalon.decalage > 0 ? ` (retard de ${jalon.decalage} trimestres)` : ''}` : 'vers 2035'}. Le plus grand sous-marin jamais construit en France.</li>
        </ul>
        <button type="button" className="lien petit" onClick={() => allerA?.('armees')}>Décider du rythme du programme SNLE 3G (onglet Armées) →</button>
      </div>

      <div className="carte pile">
        <h3 style={{ margin: 0 }}>La composante aéroportée</h3>
        <Visionneuse3D modele="rafale" hauteur={320} />
        <p className="petit" style={{ margin: 0 }}>Des Rafale des Forces aériennes stratégiques et de la Marine (depuis le porte-avions) emportent le missile nucléaire ASMPA-R ; son successeur, l'ASN4G (hypersonique), est en développement. Deux composantes plutôt qu'une : des modes de pénétration différents, et la possibilité d'un « avertissement » démonstratif.</p>
      </div>

      <div className="carte pile">
        <h3 style={{ margin: 0 }}>Dimension européenne de la dissuasion <Info texte="Le président a proposé en 2020 puis en 2025 un dialogue stratégique avec les Européens sur le rôle de la dissuasion française. La décision d'emploi reste exclusivement française." /></h3>
        {r.domaineReserve && <p className="petit alerte" style={{ margin: 0 }}>Domaine réservé du président de la République : en tant que Premier ministre, vous ne pouvez pas décider de la doctrine. Jouez le président (accueil, « Personnaliser la partie ») pour trancher.</p>}
        <div className="pile" style={{ gap: '0.35rem' }}>
          {DISSUASION_EUROPE.map((o) => (
            <label key={o.id} className={`option-programme ${choix === o.id ? 'active' : ''}`}>
              <input type="radio" name="dissuasion" checked={choix === o.id} disabled={r.domaineReserve} onChange={() => majDefense(majDecisions, () => ({ dissuasion: o.id }))} />
              <span><strong className="petit">{o.nom}</strong>{r.dissuasion === o.id && <span className="etiquette" style={{ marginLeft: 6 }}>en vigueur</span>}<br /><span className="tres-petit muet">{o.description}</span></span>
            </label>
          ))}
        </div>
      </div>
      <p className="tres-petit muet">Sources : <a href={SOURCES_DEFENSE.snle.url} target="_blank" rel="noreferrer">{SOURCES_DEFENSE.snle.titre}</a> · <a href={SOURCES_DEFENSE.dissuasion.url} target="_blank" rel="noreferrer">{SOURCES_DEFENSE.dissuasion.titre}</a>. Les dessins sont des illustrations stylisées, pas des plans.</p>
    </div>
  );
}
