import React, { useEffect, useRef } from 'react';

const ICONES = { succes: '🏅', election: '🗳️', alerte: '⚠️', bon: '✅', info: 'ℹ️', entreprise: '🏭', evenement: '🌐' };
/** Notifications affichées en même temps au plus (les plus anciennes s'effacent d'elles-mêmes). */
const VISIBLES = 3;

/**
 * Pile de notifications éphémères (« toasts ») en bas de l'écran.
 * Chaque notification : { id, type, titre, texte, duree? }. Chacune garde sa
 * propre durée : l'arrivée d'une nouvelle ne prolonge pas les précédentes.
 * `masquees` : la pile s'efface (sans s'arrêter) pendant qu'une fenêtre est ouverte.
 */
export default function Notifications({ liste, onFermer, masquees = false }) {
  const lancees = useRef(new Set());
  useEffect(() => {
    for (const n of liste) {
      if (lancees.current.has(n.id)) continue;
      lancees.current.add(n.id);
      setTimeout(() => onFermer(n.id), n.duree ?? 6500);
    }
  }, [liste, onFermer]);
  const visibles = liste.slice(-VISIBLES);
  const cachees = liste.length - visibles.length;
  return (
    <div className={`notifications ${masquees ? 'masquees' : ''}`} role="status" aria-live="polite" aria-hidden={masquees || undefined}>
      {cachees > 0 && <span className="tres-petit muet notifications-reste">{cachees} notification{cachees > 1 ? 's' : ''} plus ancienne{cachees > 1 ? 's' : ''}</span>}
      {visibles.map((n) => (
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
