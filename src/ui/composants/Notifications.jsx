import React, { useEffect } from 'react';

const ICONES = { succes: '🏅', election: '🗳️', alerte: '⚠️', bon: '✅', info: 'ℹ️', entreprise: '🏭', evenement: '🌐' };

/**
 * Pile de notifications éphémères (« toasts ») en bas de l'écran.
 * Chaque notification : { id, type, titre, texte }.
 */
export default function Notifications({ liste, onFermer }) {
  useEffect(() => {
    if (!liste.length) return undefined;
    const minuteries = liste.map((n) => setTimeout(() => onFermer(n.id), n.duree ?? 6500));
    return () => minuteries.forEach(clearTimeout);
  }, [liste, onFermer]);
  return (
    <div className="notifications" role="status" aria-live="polite">
      {liste.map((n) => (
        <div key={n.id} className={`notification ${n.type}`}>
          <span className="notification-icone" aria-hidden="true">{n.icone ?? ICONES[n.type] ?? 'ℹ️'}</span>
          <div>
            <strong>{n.titre}</strong>
            {n.texte && <div className="petit">{n.texte}</div>}
          </div>
          <button type="button" className="fermer" onClick={() => onFermer(n.id)} aria-label="Fermer la notification">×</button>
        </div>
      ))}
    </div>
  );
}
