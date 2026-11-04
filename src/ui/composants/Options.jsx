import React from 'react';
import Modale from './Modale.jsx';

/** Groupe de boutons à choix unique (plus lisible qu'une liste déroulante sur téléphone). */
function Choix({ libelle, valeur, choix, onChange, aide }) {
  return (
    <fieldset className="choix-option">
      <legend>{libelle}</legend>
      <div className="ligne">
        {choix.map(([v, nom]) => (
          <button key={v} type="button" className={`puce ${valeur === v ? 'active' : ''}`} aria-pressed={valeur === v} onClick={() => onChange(v)}>{nom}</button>
        ))}
      </div>
      {aide && <p className="tres-petit muet" style={{ margin: '0.3rem 0 0' }}>{aide}</p>}
    </fieldset>
  );
}

/** Options de l'interface : enregistrées dans ce navigateur. */
export default function Options({ options, onChange, onFermer }) {
  const maj = (cle) => (v) => onChange({ ...options, [cle]: v });
  return (
    <Modale titre="Options" onFermer={onFermer}>
      <Choix libelle="Interface" valeur={options.interface} onChange={maj('interface')}
        choix={[['essentielle', 'Essentielle'], ['complete', 'Complète']]}
        aide="Essentielle : budget, impôts, réformes, régalien (armées, dissuasion, sécurité), opinion, Parlement, événements, entreprises, géopolitique, « Produire en France », diplomatie, classements et grands rendez-vous. Complète : ajoute les ménages types et les sources détaillées." />
      <Choix libelle="Thème" valeur={options.theme} onChange={maj('theme')}
        choix={[['auto', 'Comme l\'appareil'], ['clair', 'Clair'], ['sombre', 'Sombre']]} />
      <Choix libelle="Taille du texte" valeur={options.taille} onChange={maj('taille')}
        choix={[['normale', 'Normale'], ['grande', 'Grande'], ['tres_grande', 'Très grande']]} />
      <Choix libelle="Animations" valeur={options.animations} onChange={maj('animations')}
        choix={[['systeme', 'Comme l\'appareil'], ['reduites', 'Réduites']]}
        aide="Réduites : pas de chiffres animés, de confettis ni d'effets de transition." />
      <Choix libelle="Avant de valider un trimestre" valeur={options.confirmer ? 'oui' : 'non'} onChange={(v) => onChange({ ...options, confirmer: v === 'oui' })}
        choix={[['oui', 'Prévenir s\'il reste des événements'], ['non', 'Valider directement']]} />
      <p className="tres-petit muet" style={{ margin: 0 }}>Ces réglages sont enregistrés dans ce navigateur uniquement.</p>
      <div className="ligne"><button type="button" className="bouton principal" onClick={onFermer}>Terminé</button></div>
    </Modale>
  );
}
