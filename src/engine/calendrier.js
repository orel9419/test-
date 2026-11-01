/**
 * Calendrier trimestriel : un tour de jeu = un trimestre.
 */

/** Libellé lisible d'un trimestre, par exemple « T4 2026 ». */
export function libelleTrimestre({ annee, t }) {
  return `T${t} ${annee}`;
}

/** Trimestre suivant. */
export function trimestreSuivant({ annee, t }) {
  return t === 4 ? { annee: annee + 1, t: 1 } : { annee, t: t + 1 };
}

/** Nombre de trimestres entre deux dates (b − a). */
export function ecartTrimestres(a, b) {
  return (b.annee - a.annee) * 4 + (b.t - a.t);
}

/** Vrai si deux trimestres sont identiques. */
export function memeTrimestre(a, b) {
  return a.annee === b.annee && a.t === b.t;
}

/** Échéances du calendrier tombant au trimestre donné. */
export function echeancesDuTrimestre(calendrier, trimestre) {
  return (calendrier.echeances || []).filter((e) => e.annee === trimestre.annee && e.t === trimestre.t);
}

/** Mois de début d'un trimestre (1, 4, 7 ou 10). */
export function moisDebut({ t }) {
  return (t - 1) * 3 + 1;
}

/** Vrai si le trimestre contient le mois donné (1 à 12). */
export function contientMois(trimestre, mois) {
  const debut = moisDebut(trimestre);
  return mois >= debut && mois < debut + 3;
}
