import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './ui/App.jsx';
import LimiteErreur from './ui/composants/LimiteErreur.jsx';
import './ui/styles.css';

createRoot(document.getElementById('racine')).render(
  <React.StrictMode>
    <LimiteErreur>
      <App />
    </LimiteErreur>
  </React.StrictMode>,
);

// Application installable : le service worker permet de jouer hors connexion.
// Il n'est pas enregistré quand le jeu est affiché dans un cadre (page intégrée).
if ('serviceWorker' in navigator && window.isSecureContext && window.self === window.top && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* navigateur ou cadre qui refuse : le jeu fonctionne quand même */ });
  });
}
