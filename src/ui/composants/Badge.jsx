import React from 'react';
import { urlSure } from '../securite.js';

const LIBELLES = {
  officiel: 'source officielle', prevision_officielle: 'prévision officielle', secondaire: 'source secondaire',
  derive: 'calculé', marche: 'marché', estimation: 'estimation de jeu', a_verifier: 'à vérifier', introuvable: 'introuvable',
};

/** Badge de provenance d'une donnée (avec la source en infobulle native). */
export default function Badge({ provenance }) {
  if (!provenance) return null;
  const { statut, texte } = provenance;
  // L'adresse vient de l'état de la partie, qui peut provenir d'une sauvegarde importée : liens web seulement
  const url = urlSure(provenance.url);
  const contenu = <span className={`badge ${statut}`} title={typeof texte === 'string' ? texte : undefined}>{LIBELLES[statut] ?? String(statut ?? '')}</span>;
  return url ? <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{contenu}</a> : contenu;
}
