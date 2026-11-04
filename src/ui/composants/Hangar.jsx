import React, { useState } from 'react';
import Modale from './Modale.jsx';
import Visionneuse3D from '../3d/Visionneuse3D.jsx';

/** Hangar 3D : le Rafale et le SNLE, à faire tourner et à photographier. */
export default function Hangar({ onFermer }) {
  const [modele, setModele] = useState('rafale');
  return (
    <Modale titre="Hangar 3D" onFermer={onFermer} largeur={900}>
      <div className="puces" role="tablist" aria-label="Modèle">
        <button type="button" role="tab" aria-selected={modele === 'rafale'} className={`puce ${modele === 'rafale' ? 'active' : ''}`} onClick={() => setModele('rafale')}>✈️ Rafale</button>
        <button type="button" role="tab" aria-selected={modele === 'snle'} className={`puce ${modele === 'snle' ? 'active' : ''}`} onClick={() => setModele('snle')}>⚓ SNLE Le Triomphant</button>
      </div>
      <Visionneuse3D key={modele} modele={modele} hauteur={420} />
      <p className="tres-petit muet" style={{ margin: 0 }}>Modèles construits aux proportions réelles, formes simplifiées. Bouton « Photo » : enregistrez ou partagez votre plus belle vue.</p>
    </Modale>
  );
}
