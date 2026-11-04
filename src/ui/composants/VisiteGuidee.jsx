import React, { useState } from 'react';

const ETAPES = [
  { titre: 'Bienvenue au gouvernement', texte: 'Chaque tour dure un trimestre. Vous décidez, puis vous validez : l\'économie, l\'opinion, le Parlement et le monde réagissent. Les données de départ sont réelles et sourcées.', onglet: 'tableau' },
  { titre: '1. Le tableau de bord', texte: 'En haut, la solidité de votre pouvoir : popularité, prochaine élection, menace au Parlement. Puis les indicateurs clés et l\'impact de vos réformes. Le menu regroupe les rubriques, chacune avec ses sous-onglets. Pour voir aussi les entreprises, les ménages types et les classements : ☰ Menu, puis « Afficher toutes les rubriques ».', onglet: 'tableau' },
  { titre: '2. Le budget et les impôts', texte: 'Déplacez les curseurs des ministères et ajustez les impôts. L\'encadré « effet estimé » montre aussitôt l\'impact à un an sur le déficit, la croissance et la popularité.', onglet: 'budget' },
  { titre: '3. Les réformes', texte: 'Retraites, temps de travail, fiscalité... Chiffrez une réforme sur trois ans avant de la proposer, et ajoutez des compensations pour éviter la fronde.', onglet: 'reformes' },
  { titre: '4. Le Parlement', texte: 'Vos textes doivent trouver une majorité. Le pointage des votes est mis à jour à chaque décision : négociez, faites des compromis, ou passez en force à vos risques.', onglet: 'parlement' },
  { titre: '5. Garder l\'opinion', texte: 'Rubrique « Politique et opinion » : comprenez ce qui fait bouger votre popularité, choisissez une action de communication par trimestre (allocution, terrain, grand débat…) et repérez les mesures populaires.', onglet: 'communication' },
  { titre: '6. Entreprises, monde et grands rendez-vous', texte: 'Pilotez les participations de l\'État et les fleurons, suivez le baromètre et les élections, préparez les sommets et les Jeux.', onglet: 'entreprises' },
  { titre: 'À vous de jouer', texte: 'Quand vos décisions sont prêtes, cliquez sur « Valider le trimestre » (ou Ctrl + Entrée). En mode Facile, vous pouvez annuler le dernier tour.', onglet: 'tableau' },
];

/** Visite guidée en huit étapes, proposée au premier tour en mode Facile. */
export default function VisiteGuidee({ onFermer, allerA }) {
  const [k, setK] = useState(0);
  const e = ETAPES[k];
  const aller = (n) => { setK(n); allerA(ETAPES[n].onglet); };
  return (
    <div className="visite" role="dialog" aria-modal="false" aria-labelledby="titre-visite">
      <div className="ligne espace"><span className="tres-petit muet">Visite guidée · {k + 1}/{ETAPES.length}</span><button type="button" className="fermer" onClick={onFermer} aria-label="Fermer la visite">×</button></div>
      <h3 id="titre-visite">{e.titre}</h3>
      <p className="petit">{e.texte}</p>
      <div className="points" aria-hidden="true">{ETAPES.map((_, i) => <span key={i} className={i === k ? 'actif' : ''} />)}</div>
      <div className="ligne espace">
        <button type="button" className="bouton" onClick={() => aller(Math.max(0, k - 1))} disabled={k === 0}>Précédent</button>
        {k < ETAPES.length - 1
          ? <button type="button" className="bouton principal" onClick={() => aller(k + 1)}>Suivant</button>
          : <button type="button" className="bouton principal" onClick={onFermer}>C'est parti</button>}
      </div>
    </div>
  );
}
