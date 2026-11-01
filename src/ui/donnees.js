/**
 * Données des pays jouables, chargées depuis countries/*.json (données sourcées).
 * Pour ajouter un pays : créer countries/<pays>.json et src/model/pays/<pays>.js,
 * puis l'enregistrer ici et dans src/engine/etatInitial.js (voir README).
 */
import france from '../../countries/france.json';
import allemagne from '../../countries/allemagne.json';
import etatsUnis from '../../countries/etats-unis.json';
import contexte from '../../countries/_contexte-mondial.json';

export const PAYS = {
  france: { donnees: france, regimeLibelle: 'Régime semi-présidentiel', mandat: '5 ans (20 trimestres)', role: 'Premier ministre' },
  allemagne: { donnees: allemagne, regimeLibelle: 'Régime parlementaire de coalition', mandat: '4 ans (16 trimestres)', role: 'Chancelier' },
  etatsUnis: { donnees: etatsUnis, regimeLibelle: 'Régime présidentiel', mandat: 'jusqu\'à l\'élection de 2028 (9 trimestres)', role: 'Président' },
};
export const PAYS_A_VENIR = [
  { nom: 'Suède', drapeau: '🇸🇪', regime: 'Minoritaire à consensus' },
  { nom: 'Danemark', drapeau: '🇩🇰', regime: 'Minoritaire à consensus' },
  { nom: 'Royaume-Uni', drapeau: '🇬🇧', regime: 'Parlementaire majoritaire' },
  { nom: 'Italie', drapeau: '🇮🇹', regime: 'Parlementaire de coalition' },
  { nom: 'Espagne', drapeau: '🇪🇸', regime: 'Parlementaire minoritaire' },
  { nom: 'Pays-Bas', drapeau: '🇳🇱', regime: 'Parlementaire de coalition' },
  { nom: 'Canada', drapeau: '🇨🇦', regime: 'Parlementaire majoritaire' },
  { nom: 'Japon', drapeau: '🇯🇵', regime: 'Parlementaire' },
];
export { contexte };
