/**
 * Sous-modèle du temps de travail.
 *
 * Fait clé (Insee, enquête Emploi 2024) : en France, les salariés à temps
 * complet travaillent en moyenne 38,8 h par semaine (cadres 42,0 h, employés
 * 37,3 h). Passer la durée légale de 35 h à 39 h ne veut donc pas dire « 4 h
 * de plus pour tout le monde » : cela déplace surtout le seuil à partir duquel
 * les heures sont majorées de 25 %.
 *
 * Le joueur choisit :
 * - la durée de référence (35, 37 ou 39 h) ;
 * - le traitement des heures situées entre 35 h et la nouvelle durée :
 *     'normal'   payées au taux normal, imposées normalement ;
 *     'exonere'  payées au taux normal, exonérées d'impôt sur le revenu et
 *                de cotisations salariales (sur un nombre d'heures choisi) ;
 *     'non_paye' sans hausse de salaire (travailler plus pour le même salaire) ;
 * - et/ou la défiscalisation totale des heures supplémentaires.
 *
 * Distribution des salariés à temps complet (hypothèse calée sur 38,8 h) :
 * 40 % autour de 35,5 h, 15 % autour de 37,3 h (dont 2,3 h supplémentaires),
 * 45 % de cadres et assimilés à 42 h (au forfait, sans heures supplémentaires).
 */

const DISTRIBUTION = {
  france: [
    { heures: 35.5, part: 0.40, heuresSup: 0.5 },
    { heures: 37.3, part: 0.15, heuresSup: 2.3 },
    { heures: 42.0, part: 0.45, heuresSup: 0 },
  ],
  allemagne: [
    { heures: 38.5, part: 0.45, heuresSup: 0.5 },
    { heures: 40.0, part: 0.30, heuresSup: 1.0 },
    { heures: 42.5, part: 0.25, heuresSup: 0 },
  ],
};

/** Masse salariale brute des salariés à temps complet du privé (Md€/an, estimation). */
const MASSE_SALARIALE_TC = { france: 600, allemagne: 950 };
/** Taux de prélèvement salarial moyen évité par l'exonération (cotisations salariales + impôt sur le revenu). */
const TAUX_PRELEVEMENT_SALARIE = { france: 0.28, allemagne: 0.35 };
/** Part des salariés concernés qui font effectivement les heures en plus, selon le traitement. */
const ADHESION = { normal: 0.6, exonere: 0.7, non_paye: 0.9 };
/** Rendement des heures supplémentaires sur la production (fatigue, organisation) : hypothèse. */
const EFFICACITE_HEURES = 0.5;
/** Effet du coût horaire du travail sur le chômage structurel (pt par % de coût). */
const ELASTICITE_CHOMAGE_COUT = 0.15;

export function etatTravailInitial(p, pays) {
  return {
    pays,
    dureeLegale: p.dureeLegale,
    dureeReference: p.dureeLegale,
    traitement: null,
    heuresExonerees: 0,
    heuresSupLibres: false,
    trimestreDebut: null,
    rampe: 0,
    deltaHeures: 0,
    variationMasseSalariale: 0,
    offreTravail: 0,
    coutBudgetaire: 0,
    chomageStructurel: 0,
  };
}

/** Durée et traitement effectifs d'une catégorie de salariés après réforme. */
function effetCategorie(c, L, traitement, adhesion, heuresExonerees) {
  const nouvellesHeures = c.heures < L ? c.heures + adhesion * (L - c.heures) : c.heures;
  const dh = nouvellesHeures - c.heures;
  // Heures supplémentaires actuelles comprises entre 35 h et L : elles deviennent des heures « normales »
  const converties = Math.min(c.heuresSup, Math.max(0, L - 35));
  let dPaie; // variation de la paie brute, en heures payées au taux normal
  if (traitement === 'non_paye') dPaie = -1.25 * converties;
  else dPaie = dh - 0.25 * converties;
  // Heures exonérées (traitement 'exonere') : seules les nouvelles heures entre 35 h et L le sont, dans la limite choisie
  const heuresExo = traitement === 'exonere' ? Math.min(dh, heuresExonerees) : 0;
  return { dh, dPaie, converties, heuresExo, paieInitiale: Math.min(c.heures, 35) + 1.25 * c.heuresSup + Math.max(0, c.heures - 35 - c.heuresSup) };
}

/**
 * Calcule les effets agrégés du temps de travail au trimestre courant.
 * @returns {object} { offreTravail %, variationMasseSalariale %, recettes Md€, chomageStructurel pt }
 */
export function majTempsTravail(e) {
  const t = e.travail;
  const dist = DISTRIBUTION[t.pays] ?? DISTRIBUTION.france;
  const neutre = { offreTravail: 0, variationMasseSalariale: 0, recettes: 0, chomageStructurel: 0 };
  if (!t.traitement && !t.heuresSupLibres) { Object.assign(t, { deltaHeures: 0, ...neutre, coutBudgetaire: 0 }); return neutre; }

  const age = t.trimestreDebut !== null ? e.tour - t.trimestreDebut : 0;
  t.rampe = Math.min(1, Math.max(0, age / 6)); // montée en charge sur 6 trimestres (négociations de branche)
  const L = t.dureeReference ?? 35;
  const traitement = t.traitement ?? 'normal';
  const adhesion = ADHESION[traitement];

  let heures0 = 0, dh = 0, paie0 = 0, dPaie = 0, heuresExo = 0, converties = 0;
  for (const c of dist) {
    heures0 += c.part * c.heures;
    paie0 += c.part * effetCategorie(c, 35, 'normal', 0, 0).paieInitiale;
    if (t.traitement) {
      const r = effetCategorie(c, L, traitement, adhesion, t.heuresExonerees);
      dh += c.part * r.dh;
      dPaie += c.part * r.dPaie;
      heuresExo += c.part * r.heuresExo;
      converties += c.part * r.converties;
    }
  }
  // Défiscalisation totale des heures supplémentaires : incitation modeste (+0,3 h pour les non-cadres)
  if (t.heuresSupLibres) { dh += 0.55 * 0.3; dPaie += 0.55 * 0.3 * 1.25; }

  dh *= t.rampe; dPaie *= t.rampe; heuresExo *= t.rampe; converties *= t.rampe;
  const masse = MASSE_SALARIALE_TC[t.pays] ?? 600;
  const taux = TAUX_PRELEVEMENT_SALARIE[t.pays] ?? 0.28;

  t.deltaHeures = dh;
  const variationHeures = dh / heures0 * 100;              // % d'heures des temps complets
  t.offreTravail = variationHeures * 0.7 * EFFICACITE_HEURES; // les temps complets du privé font environ 70 % des heures
  // Rapportée à toute la masse salariale : les temps complets du privé en représentent environ 55 % (hypothèse)
  t.variationMasseSalariale = dPaie / paie0 * 100 * 0.55;

  // Coût horaire du travail pour les employeurs : variation de la paie moins variation des heures
  const variationCoutHoraire = dPaie / paie0 * 100 - variationHeures;
  t.chomageStructurel = ELASTICITE_CHOMAGE_COUT * variationCoutHoraire;

  // Budget : coût des exonérations, gain de la fin d'exonération sur les heures sup « converties » (traitement normal)
  let recettes = 0;
  const valeurHeure = masse / paie0; // Md€/an par heure hebdomadaire payée en moyenne
  if (traitement === 'exonere') recettes -= heuresExo * valeurHeure * taux;
  if (t.traitement === 'normal') {
    const partHeuresSupConverties = converties / dist.reduce((s, c) => s + c.part * c.heuresSup, 0);
    recettes += (e.statique.travail.coutHeuresSupDefisc ?? 0) * Math.min(1, partHeuresSupConverties) * 0.8;
  }
  if (t.heuresSupLibres) recettes -= 1.5 * t.rampe; // suppression du plafond et exonération totale (estimation)
  t.coutBudgetaire = -recettes;
  return { offreTravail: t.offreTravail, variationMasseSalariale: t.variationMasseSalariale, recettes, chomageStructurel: t.chomageStructurel };
}

/**
 * Effet de la réforme du temps de travail sur un ménage type, en €/mois,
 * en supposant qu'il fasse les heures proposées (cas illustratif).
 * @returns {object|null} { montant, texte }
 */
export function effetMenageTempsTravail(e, menage) {
  const t = e.travail;
  if ((!t.traitement && !t.heuresSupLibres) || !menage.heures || !menage.salaireBrut) return null;
  const L = t.dureeReference ?? 35;
  const traitement = t.traitement ?? 'normal';
  const heuresSup = Math.max(0, menage.heures - 35);
  const brutHoraire = menage.salaireBrut / ((35 + 1.25 * heuresSup) * 52 / 12);
  const netSurBrut = menage.revenuNet0 / menage.salaireBrut;
  const tauxPrelevement = TAUX_PRELEVEMENT_SALARIE[t.pays] ?? 0.28;
  const semaines = 52 / 12;
  let montant = 0;
  const morceaux = [];
  if (t.traitement && menage.heures < L) {
    const dh = L - menage.heures;
    if (traitement === 'non_paye') {
      morceaux.push(`${dh.toFixed(1)} h de plus par semaine sans hausse de salaire`);
    } else {
      const exo = traitement === 'exonere' ? Math.min(dh, t.heuresExonerees) : 0;
      const gainNormal = (dh - exo) * brutHoraire * semaines * netSurBrut;
      const gainExo = exo * brutHoraire * semaines; // ni cotisations salariales ni impôt
      montant += gainNormal + gainExo;
      morceaux.push(`+${dh.toFixed(1)} h/semaine payées${exo ? `, dont ${exo} h exonérées` : ''}`);
    }
  }
  if (t.traitement && heuresSup > 0) {
    const converties = Math.min(heuresSup, Math.max(0, L - 35));
    if (converties > 0) {
      const perteMajoration = traitement === 'non_paye'
        ? 1.25 * converties * brutHoraire * semaines
        : 0.25 * converties * brutHoraire * semaines;
      // En traitement normal, ces heures perdent aussi l'exonération des heures supplémentaires
      const perteExoneration = traitement === 'normal' ? converties * brutHoraire * 1.25 * semaines * tauxPrelevement * 0.6 : 0;
      montant -= perteMajoration + perteExoneration;
      morceaux.push(`${converties.toFixed(1)} h sup deviennent des heures normales (perte de la majoration de 25 %${traitement === 'normal' ? ' et de l\'exonération' : ''})`);
    }
  }
  if (t.heuresSupLibres && heuresSup > 0) {
    montant += heuresSup * brutHoraire * 1.25 * semaines * 0.1;
    morceaux.push('heures sup totalement exonérées');
  }
  // Revenu attendu : seule une partie des salariés fait effectivement les heures proposées (adhésion).
  // Le texte affiche le gain pour le cas où le ménage fait les heures.
  const gainHeures = montant > 0 && t.traitement && menage.heures < L ? ADHESION[traitement] : 1;
  const texte = `${morceaux.join(' ; ')}${montant ? ` (${montant >= 0 ? '+' : ''}${Math.round(montant)} €/mois s'il fait les heures)` : ''}`;
  return { montant: montant * gainHeures * t.rampe, montantSiHeures: montant * t.rampe, texte };
}
