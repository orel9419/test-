import React, { useState } from 'react';
import Modale from './Modale.jsx';
import Visionneuse3D from '../3d/Visionneuse3D.jsx';

/** Matériels et lieux de pouvoir proposés dans le Hangar 3D, par famille. */
const FAMILLES = [
  { titre: 'Air, mer et dissuasion', modeles: [['rafale', '✈️ Rafale'], ['mirage2000', '✈️ Mirage 2000-5'], ['charlesDeGaulle', '🚢 Charles-de-Gaulle'], ['porteAvions', '🚢 France Libre'], ['snle3g', '⚓ SNLE 3G'], ['snle', '⚓ SNLE Le Triomphant'], ['sna', '⚓ SNA Suffren'], ['groupeAeronaval', '🎖️ Groupe aéronaval']] },
  { titre: 'Avions étrangers (pour comparer)', modeles: [['f35a', '✈️ F-35A'], ['f35b', '✈️ F-35B'], ['f35c', '✈️ F-35C']] },
  { titre: 'Bâtiments de surface', modeles: [['pha', '🚢 PHA Mistral'], ['fda', '🚢 Chevalier Paul (FDA)'], ['fremm', '🚢 FREMM'], ['brf', '🚢 Ravitailleur (BRF)'], ['monge', '📡 Monge']] },
  { titre: 'Hélicoptères et ravitailleur', modeles: [['caiman', '🚁 Caïman (Terre)'], ['caimanFS', '🚁 Caïman (forces spéciales)'], ['caimanMarine', '🚁 Caïman Marine'], ['tigre', '🚁 Tigre'], ['puma', '🚁 Puma'], ['caracal', '🚁 Caracal'], ['phenix', '✈️ A330 Phénix']] },
  { titre: 'Terre, drones et espace', modeles: [['leclerc', '🪖 Char Leclerc'], ['caesar', '💥 Canon Caesar'], ['griffon', '🛡️ Griffon'], ['jaguar', '🛡️ Jaguar'], ['patroller', '🛩️ Drone Patroller'], ['satellite', '🛰️ Satellite']] },
  { titre: 'Lieux de pouvoir', modeles: [['elysee', '🏛️ Élysée'], ['matignon', '🏛️ Matignon'], ['assemblee', '🏛️ Assemblée nationale'], ['senat', '🏛️ Sénat']] },
];

/** Hangar 3D : les matériels des armées et les palais de la République. */
export default function Hangar({ onFermer }) {
  const [modele, setModele] = useState('rafale');
  return (
    <Modale titre="Hangar 3D" onFermer={onFermer} largeur={900}>
      {FAMILLES.map((f) => (
        <div key={f.titre} className="pile" style={{ gap: '0.25rem' }}>
          <div className="tres-petit muet">{f.titre}</div>
          <div className="puces" role="tablist" aria-label={f.titre}>
            {f.modeles.map(([id, nom]) => (
              <button key={id} type="button" role="tab" aria-selected={modele === id} className={`puce ${modele === id ? 'active' : ''}`} onClick={() => setModele(id)}>{nom}</button>
            ))}
          </div>
        </div>
      ))}
      <Visionneuse3D key={modele} modele={modele} hauteur={420} />
      <p className="tres-petit muet" style={{ margin: 0 }}>Modèles construits aux proportions réelles quand elles sont publiques, formes simplifiées. Les hémicycles aux couleurs de votre partie sont dans l'écran Institutions. Bouton « Photo » : enregistrez ou partagez votre plus belle vue.</p>
    </Modale>
  );
}
