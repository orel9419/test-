/**
 * Environnement mondial et zone euro : chocs exogènes que le joueur ne
 * contrôle pas directement (prix de l'énergie, conjoncture de la zone euro,
 * politique monétaire de la BCE, demande mondiale).
 *
 * Situation de départ (sourcée, voir countries/_contexte-mondial.json) :
 * guerre en Iran depuis fin février 2026, Brent ≈ 117 $, gaz TTF ≈ 97 €/MWh
 * (contre ≈ 32 avant la guerre), inflation de la zone euro 3,8 %, taux de
 * dépôt de la BCE 2,50 %.
 */
import { PARAMETRES } from '../model/parametres.js';
import { borner } from '../model/outils.js';

/**
 * Indice mondial de l'énergie (100 = avant la guerre, février 2026).
 * Panier 60 % pétrole, 40 % gaz : 0,6 × 117/73 + 0,4 × 97/32 ≈ 2,17.
 */
export const ENERGIE_DEPART = 0.6 * (117 / 73) * 100 + 0.4 * (97.15 / 32) * 100;

/**
 * Taux directeur qui s'applique au pays : BCE pour la zone euro, Réserve
 * fédérale pour les États-Unis.
 */
export function tauxDirecteur(e) {
  return e.statique?.banqueCentrale === 'fed' ? e.monde.tauxFed : e.monde.tauxBCE;
}

export function etatMondeInitial(contexte) {
  return {
    energie: ENERGIE_DEPART,
    energiePrecedente: ENERGIE_DEPART,
    conflit: 'actif',              // 'actif' | 'desescalade' | 'apaise' | 'escalade'
    trimestresDepuisChangement: 0,
    inflationZE: contexte?.zone_euro?.inflation?.valeur ?? 3.8,
    inflationSousJacenteZE: 2.5,   // estimation
    ecartZE: -0.5,                 // estimation
    tauxBCE: 2.5,
    demandeMondiale: 100,
    croissanceDemandeMondiale: 2.5, // % par an, estimation
  };
}

/**
 * Fait évoluer le monde d'un trimestre.
 * @param {object} e état de la partie (modifié en place)
 * @param {object} alea générateur aléatoire
 * @param {object} options { frequenceEvenements, contributionPays }
 */
export function majMonde(e, alea, options = {}) {
  const m = e.monde;
  const freq = options.frequenceEvenements ?? 1;
  m.energiePrecedente = m.energie;
  m.trimestresDepuisChangement += 1;

  // --- Scénario géopolitique de l'énergie -------------------------------
  if (m.conflit === 'actif' || m.conflit === 'escalade') {
    // Probabilité de désescalade d'environ 18 % par trimestre ; 5 % d'escalade (modulée par le mode).
    if (alea.tirage(0.18 / Math.sqrt(freq))) {
      m.conflit = 'desescalade';
      m.trimestresDepuisChangement = 0;
    } else if (alea.tirage(0.05 * freq)) {
      m.conflit = 'escalade';
      m.trimestresDepuisChangement = 0;
    }
  } else if (m.conflit === 'desescalade' && m.trimestresDepuisChangement >= 4) {
    m.conflit = 'apaise';
  }
  const cible = { actif: 210, escalade: 270, desescalade: 130, apaise: 120 }[m.conflit];
  const vitesse = m.conflit === 'escalade' ? 0.6 : m.conflit === 'desescalade' ? 0.35 : 0.25;
  const bruit = alea.normale(0, 0.04);
  m.energie = borner(m.energie + vitesse * (cible - m.energie) + bruit * m.energie, 70, 400);

  // --- Demande mondiale --------------------------------------------------
  const chocDemande = m.conflit === 'escalade' ? -0.6 : 0;
  m.croissanceDemandeMondiale = borner(0.8 * m.croissanceDemandeMondiale + 0.2 * 2.8 + chocDemande + alea.normale(0, 0.3), -3, 6);
  m.demandeMondiale *= 1 + m.croissanceDemandeMondiale / 400;

  // --- Zone euro ----------------------------------------------------------
  const varEnergie = (m.energie - m.energiePrecedente) / m.energiePrecedente;
  m.ecartZE = borner(0.85 * m.ecartZE - 0.12 * varEnergie * 10 + (options.contributionEcartPays ?? 0), -6, 4);
  const energieConsoZE = 0.6 * Math.pow(m.energie / 100, 0.5) + 0.4;
  if (!m.historiqueEnergieZE) m.historiqueEnergieZE = [1, 1, 1, 1];
  m.historiqueEnergieZE.push(energieConsoZE);
  const ilYaUnAn = m.historiqueEnergieZE.shift();
  const glissementEnergieZE = (energieConsoZE / ilYaUnAn - 1) * 100;
  const ancrage = 2 + 0.3 * (m.inflationZE - 2);
  m.inflationSousJacenteZE = borner(m.inflationSousJacenteZE + 0.2 * (ancrage - m.inflationSousJacenteZE) + 0.03 * m.ecartZE, -1, 8);
  m.inflationZE = borner(m.inflationSousJacenteZE + 0.05 * glissementEnergieZE + (options.contributionInflationPays ?? 0), -2, 12);

  // --- BCE : règle de Taylor lissée, par pas de 0,25 point ----------------
  const b = PARAMETRES.bce;
  const cibleTaux = b.tauxNeutreReel + 2
    + b.poidsInflationSousJacente * (m.inflationSousJacenteZE - 2)
    + b.poidsInflationTotale * (m.inflationZE - 2)
    + b.poidsEcart * m.ecartZE;
  const brut = m.tauxBCE + b.lissage * (cibleTaux - m.tauxBCE);
  m.tauxBCE = borner(Math.round(brut / b.pas) * b.pas, 0, 6);

  // Réserve fédérale (si le pays joué est les États-Unis) : règle de Taylor sur l'inflation
  // sous-jacente américaine, l'inflation totale et l'écart de production, lissée, par pas de 0,25.
  if (options.macroPays && m.tauxFed !== undefined) {
    const mp = options.macroPays;
    const cible = 0.75 + mp.inflationSousJacente + 0.5 * (mp.inflationSousJacente - 2) + 0.25 * (mp.inflation - 2) + 0.5 * mp.ecartProduction - (options.pressionSurLaFed ?? 0);
    const brutFed = m.tauxFed + b.lissage * (cible - m.tauxFed);
    m.tauxFed = borner(Math.round(brutFed / b.pas) * b.pas, 0, 8);
  }
}

/** Initialise l'historique d'énergie de la zone euro pour que le glissement de départ soit cohérent. */
export function initialiserHistoriqueEnergieZE(m) {
  const pre = 0.6 * 1 + 0.4; // avant guerre
  const maintenant = 0.6 * Math.pow(m.energie / 100, 0.5) + 0.4;
  // T4 2025, T1 2026 (avant guerre), T2 2026, T3 2026
  m.historiqueEnergieZE = [pre, pre, pre + 0.8 * (maintenant - pre), pre + 0.95 * (maintenant - pre)];
}
