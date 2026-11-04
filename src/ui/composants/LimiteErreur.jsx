import React from 'react';
import { effacerLocal } from '../sauvegarde.js';

/**
 * Filet de sécurité : si un écran plante, le joueur garde la main (recharger,
 * revenir à l'accueil) au lieu d'une page blanche. La sauvegarde est conservée,
 * sauf s'il choisit explicitement de l'effacer.
 */
export default class LimiteErreur extends React.Component {
  constructor(props) {
    super(props);
    this.state = { erreur: null };
  }

  static getDerivedStateFromError(erreur) {
    return { erreur };
  }

  componentDidCatch(erreur, info) {
    console.error(erreur, info?.componentStack);
  }

  render() {
    const { erreur } = this.state;
    if (!erreur) return this.props.children;
    return (
      <div className="accueil pile" role="alert">
        <h1>Oups, un écran a rencontré une erreur</h1>
        <p>Votre partie est sauvegardée dans ce navigateur à la fin de chaque trimestre. Rechargez la page pour la reprendre.</p>
        <div className="ligne">
          <button type="button" className="bouton principal" onClick={() => window.location.reload()}>Recharger la page</button>
          <button type="button" className="bouton" onClick={() => { if (window.confirm('Effacer la partie sauvegardée et recommencer ?')) { effacerLocal(); window.location.reload(); } }}>Effacer la sauvegarde et recommencer</button>
        </div>
        <details className="petit muet"><summary>Détail technique (à joindre si vous signalez le problème)</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{String(erreur?.stack ?? erreur)}</pre></details>
      </div>
    );
  }
}
