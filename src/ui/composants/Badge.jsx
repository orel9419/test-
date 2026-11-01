import React from 'react';

const LIBELLES = {
  officiel: 'source officielle', prevision_officielle: 'prévision officielle', secondaire: 'source secondaire',
  derive: 'calculé', marche: 'marché', estimation: 'estimation de jeu', a_verifier: 'à vérifier', introuvable: 'introuvable',
};

/** Badge de provenance d'une donnée (avec la source en infobulle native). */
export default function Badge({ provenance }) {
  if (!provenance) return null;
  const { statut, texte, url } = provenance;
  const contenu = <span className={`badge ${statut}`} title={texte}>{LIBELLES[statut] ?? statut}</span>;
  return url ? <a href={url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>{contenu}</a> : contenu;
}
