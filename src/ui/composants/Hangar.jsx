import React, { useState } from 'react';
import Modale from './Modale.jsx';
import Visionneuse3D from '../3d/Visionneuse3D.jsx';

/** Hangar 3D : Rafale, porte-avions France Libre, SNLE 3G et SNLE Le Triomphant, à faire tourner et à photographier. */
export default function Hangar({ onFermer }) {
  const [modele, setModele] = useState('rafale');
  return (
    <Modale titre="Hangar 3D" onFermer={onFermer} largeur={900}>
      <div className="puces" role="tablist" aria-label="Modèle">
        {[['rafale', '✈️ Rafale'], ['porteAvions', '🚢 Porte-avions France Libre'], ['snle3g', '⚓ SNLE 3G'], ['snle', '⚓ SNLE Le Triomphant']].map(([id, nom]) => (
          <button key={id} type="button" role="tab" aria-selected={modele === id} className={`puce ${modele === id ? 'active' : ''}`} onClick={() => setModele(id)}>{nom}</button>
        ))}
      </div>
      <Visionneuse3D key={modele} modele={modele} hauteur={420} />
      <p className="tres-petit muet" style={{ margin: 0 }}>Modèles construits aux proportions réelles, formes simplifiées. Bouton « Photo » : enregistrez ou partagez votre plus belle vue.</p>
    </Modale>
  );
}
