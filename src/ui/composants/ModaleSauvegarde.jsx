import React, { useState } from 'react';
import { texteSauvegarde, exporterJSON, lireSauvegardeTexte } from '../sauvegarde.js';

/**
 * Sauvegarder ou charger une partie sous forme de texte JSON : télécharger un
 * fichier, copier le texte, ou coller un texte copié plus tôt. Le copier-
 * coller sert quand le navigateur bloque les téléchargements (page intégrée).
 */
export default function ModaleSauvegarde({ mode, partie, decisions, onCharger, onImporterFichier, onFermer }) {
  const [texte, setTexte] = useState(mode === 'export' ? texteSauvegarde(partie, decisions) : '');
  const [etat, setEtat] = useState(null);
  const copier = async () => {
    try { await navigator.clipboard.writeText(texte); setEtat({ ok: true, texte: 'Copié dans le presse-papiers : collez-le dans un fichier ou une note pour le garder.' }); }
    catch { setEtat({ ok: false, texte: 'Copie automatique refusée : sélectionnez le texte ci-dessous et copiez-le (Ctrl + C).' }); }
  };
  const charger = () => {
    try { onCharger(lireSauvegardeTexte(texte.trim())); } catch (err) { setEtat({ ok: false, texte: err.message || 'Texte illisible.' }); }
  };
  return (
    <div className="voile" role="dialog" aria-modal="true" aria-labelledby="titre-sauvegarde" onKeyDown={(ev) => ev.key === 'Escape' && onFermer()}>
      <div className="modale pile entree-modale">
        <div className="ligne espace"><h2 id="titre-sauvegarde">{mode === 'export' ? 'Sauvegarder la partie' : 'Charger une partie'}</h2><button type="button" className="fermer" onClick={onFermer} aria-label="Fermer">×</button></div>
        {mode === 'export' ? (
          <>
            <p className="petit">La partie est enregistrée automatiquement dans ce navigateur quand c'est possible. Pour la garder ailleurs ou la reprendre sur un autre appareil, téléchargez-la ou copiez son texte.</p>
            <div className="ligne">
              <button type="button" className="bouton principal" onClick={() => exporterJSON(partie, decisions)}>Télécharger le fichier JSON</button>
              <button type="button" className="bouton" onClick={copier}>Copier le texte</button>
            </div>
          </>
        ) : (
          <>
            <p className="petit">Choisissez un fichier exporté, ou collez le texte d'une sauvegarde copiée plus tôt.</p>
            <label className="bouton" style={{ alignSelf: 'flex-start' }}>Choisir un fichier JSON<input type="file" accept="application/json" onChange={onImporterFichier} hidden /></label>
          </>
        )}
        {etat && <div className={`alerte ${etat.ok ? 'bonne' : ''}`} role="status">{etat.texte}</div>}
        <textarea className="zone-sauvegarde" value={texte} readOnly={mode === 'export'} onChange={(ev) => setTexte(ev.target.value)} onFocus={(ev) => mode === 'export' && ev.target.select()} aria-label="Texte de la sauvegarde" placeholder="Collez ici le texte de la sauvegarde…" rows={6} />
        {mode === 'import' && <button type="button" className="bouton principal" onClick={charger} disabled={!texte.trim()}>Charger cette partie</button>}
      </div>
    </div>
  );
}
