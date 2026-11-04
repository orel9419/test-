import React from 'react';
import Modale from './Modale.jsx';

export const DEPOT = 'https://github.com/orel9419/test-';

/** À propos : objectif, avertissements, données, vie privée, code source. */
export default function APropos({ onFermer, codePartie }) {
  return (
    <Modale titre="À propos de « Chef de gouvernement »" onFermer={onFermer} largeur={640}>
      <div className="pile petit">
        <p style={{ margin: 0 }}><strong>Un jeu pour comprendre</strong> comment se décident un budget, une réforme ou une sortie de crise : arbitrages entre dette et services publics, majorités au Parlement, réactions de l'opinion et des marchés, contraintes européennes et constitutionnelles.</p>
        <div>
          <h3>Ce que le jeu est, et n'est pas</h3>
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
            <li>La situation de départ repose sur des <strong>données réelles et sourcées</strong> (Insee, Eurostat, FMI, lois de finances, agences de notation…), consultables dans « Données et sources ».</li>
            <li>Le fonctionnement repose sur un <strong>modèle simplifié</strong> dont les paramètres sont des hypothèses documentées. Ce n'est <strong>pas une prévision</strong> : les ordres de grandeur sont plausibles, les chiffres exacts ne le sont pas.</li>
            <li>Les programmes des personnalités politiques sont <strong>résumés et simplifiés</strong>, sans aucune citation inventée. Les réformes d'inspiration libérale comme sociale sont proposées, avec leurs arguments pour et contre.</li>
            <li>Le jeu n'est lié à aucun parti, institution ou administration.</li>
          </ul>
        </div>
        <div>
          <h3>Vie privée</h3>
          <p style={{ margin: 0 }}>Aucun compte, aucun cookie publicitaire, aucune mesure d'audience. Votre partie et vos réglages restent dans votre navigateur ; vous pouvez les exporter (menu « Sauvegarder ») ou les effacer à tout moment.</p>
        </div>
        <div>
          <h3>Code source et contributions</h3>
          <p style={{ margin: 0 }}>Le code, les données et les hypothèses sont publics : <a href={DEPOT} target="_blank" rel="noreferrer">dépôt du projet</a>. Une erreur, une source plus récente, une idée ? <a href={`${DEPOT}/issues`} target="_blank" rel="noreferrer">Signalez-la</a>.</p>
        </div>
        {codePartie && <p className="tres-petit muet" style={{ margin: 0 }}>Code de cette partie : <strong>{codePartie}</strong> (le même code et les mêmes décisions donnent les mêmes événements).</p>}
      </div>
    </Modale>
  );
}
