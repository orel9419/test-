/**
 * Profil de calibrage de la France.
 *
 * Construit, à partir de countries/france.json (données sourcées), l'état
 * économique de départ du jeu (T4 2026, flux annualisés de 2026).
 *
 * Toute valeur qui n'est pas directement lue dans les données est marquée
 * « derive » (calcul indiqué) ou « estimation » (hypothèse de jeu, à remplacer
 * dès qu'une source est disponible).
 */
import { lire, provenance as prov } from '../outils.js';

export function profilFrance(d) {
  const fp = d.finances_publiques;
  const cofog = fp.depenses_par_fonction_cofog.valeurs;

  // --- Agrégats 2025 (sourcés) puis projection 2026 -----------------------
  const pib2025 = lire(d.macro.pib_nominal);                     // 2 991,1 Md€
  const croissanceNominale2026 = 0.019;                          // hypothèse : 0,3 % réel + 1,6 % de prix
  const pib2026 = pib2025 * (1 + croissanceNominale2026);
  const deficit2026Pct = lire(fp.deficit_prevision_2026);       // 5,4 % (PLF 2027)
  const dette2026Pct = lire(fp.dette_prevision_2026);           // 119,3 % (PLF 2027)
  const depensesPct = lire(fp.depenses_pct_pib);                // 57,3 % (2025)
  const interets2026 = fp.charge_interets_apu.valeur['2026'];   // 79,2 Md€ (Sénat, PLF 2027)

  const depenses2026 = (depensesPct / 100) * pib2026;
  const deficit2026 = (deficit2026Pct / 100) * pib2026;
  const recettes2026 = depenses2026 - deficit2026;
  const primaires2026 = depenses2026 - interets2026;

  // --- Retraites ----------------------------------------------------------
  const rt = fp.retraites;
  const depRetraites2025 = lire(rt.depenses);                   // 422,2 Md€ (COR)
  const depRetraites2026 = depRetraites2025 * 1.022;            // hypothèse : +1,2 % d'effectifs, +1 % de revalorisation et d'effet noria
  const retraites2026 = lire(rt.retraites_droit_direct) * 1.017; // 17,3 M fin 2024, environ +0,85 %/an
  const pensionMoyenne2026 = lire(rt.pension_moyenne_brute) * 1.025; // 1 705 € fin 2024

  // --- Ventilation des dépenses primaires hors retraites (COFOG 2024) -----
  // Les intérêts 2024 ne sont pas sourcés : on retient 59 Md€ (estimation)
  // pour isoler les services généraux hors charge de la dette.
  const interets2024Estimes = 59;
  const gf01HorsInterets = cofog.GF01_services_generaux - interets2024Estimes;
  const detailSocial = fp.depenses_par_fonction_cofog.detail_protection_sociale_drees_2024.valeurs;
  const gf04 = cofog.GF04_affaires_economiques;
  // Hypothèses de ventilation des « affaires économiques » (COFOG niveau 2 non collecté)
  const partTransports = 0.33, partAgriculture = 0.08, energieDansGF04 = 15;
  const base2024 = {
    protectionSociale: cofog.GF10_dont_hors_vieillesse - detailSocial.emploi_chomage - detailSocial.logement,
    travailEmploi: detailSocial.emploi_chomage,
    sante: cofog.GF07_sante,
    education: cofog.GF09_enseignement * 0.8,
    recherche: cofog.GF09_enseignement * 0.2 + 8,
    defense: cofog.GF02_defense,
    affairesEtrangeres: 8,
    interieurJustice: cofog.GF03_ordre_securite,
    ecologieEnergie: cofog.GF05_environnement + energieDansGF04,
    transports: gf04 * partTransports,
    agriculture: gf04 * partAgriculture,
    logement: cofog.GF06_logement_equipements + detailSocial.logement,
    culture: cofog.GF08_loisirs_culture_culte,
    economieFinances: gf01HorsInterets - 8 - 8 + (gf04 - energieDansGF04 - gf04 * partTransports - gf04 * partAgriculture),
  };
  const totalBase2024 = Object.values(base2024).reduce((s, v) => s + v, 0);
  const aRepartir2026 = primaires2026 - depRetraites2026;
  const facteur = aRepartir2026 / totalBase2024;

  const sourceCofog = 'COFOG 2024 (Insee Première 2093), projetée en 2026 au prorata des dépenses primaires';
  const ministeres = {
    retraites: { montant: depRetraites2026, provenance: prov('derive', 'COR : 422,2 Md€ en 2025, projeté en 2026 (+2,2 %)', rt.depenses.url) },
  };
  const notes = {
    protectionSociale: 'GF10 hors vieillesse, moins l\'emploi et le logement (DREES)',
    travailEmploi: 'Risque « emploi » de la DREES (51,1 Md€ en 2024)',
    sante: 'GF07 Santé',
    education: 'Hypothèse : 80 % de GF09 Enseignement',
    recherche: 'Hypothèse : 20 % de GF09 (supérieur) + 8 Md€ de recherche fondamentale (GF01)',
    defense: 'GF02 Défense',
    affairesEtrangeres: 'Estimation : 8 Md€ pris sur GF01 (action extérieure et aide au développement)',
    interieurJustice: 'GF03 Ordre et sécurité publics',
    ecologieEnergie: 'GF05 Environnement + estimation de 15 Md€ d\'énergie (GF04)',
    transports: 'Hypothèse : 33 % de GF04 Affaires économiques',
    agriculture: 'Hypothèse : 8 % de GF04 (aides nationales, hors PAC)',
    logement: 'GF06 + aides au logement (DREES)',
    culture: 'GF08 Loisirs, culture et culte',
    economieFinances: 'Reste de GF01 (hors intérêts estimés à 59 Md€) + reste de GF04',
  };
  for (const [id, v] of Object.entries(base2024)) {
    const statut = ['sante', 'defense', 'interieurJustice', 'culture', 'travailEmploi'].includes(id) ? 'derive' : 'estimation';
    ministeres[id] = { montant: v * facteur, provenance: prov(statut, `${notes[id]}. ${sourceCofog}.`, fp.depenses_par_fonction_cofog.url) };
  }
  // Défense : la loi de programmation militaire prévoit une hausse rapide ; on cale 2026 à 60 Md€ (COFOG),
  // en prenant la différence sur « Économie et finances » pour garder le total.
  const defense2026 = 60;
  ministeres.economieFinances.montant -= defense2026 - ministeres.defense.montant;
  ministeres.defense.montant = defense2026;
  ministeres.defense.provenance = prov('estimation', 'COFOG 2024 (54,2 Md€) + deux annuités de la loi de programmation militaire. Mission Défense de l\'État : 66,5 Md€ en 2026 (pensions comprises).', fp.depenses_par_fonction_cofog.url);

  // --- Prélèvements 2026 ----------------------------------------------------
  const rp = fp.recettes_par_prelevement.valeurs;
  const g = 1 + croissanceNominale2026;
  const impots = {
    tva: { R0: rp.tva.valeur * g, taux: 20, tauxRef: 20, bornes: [15, 25], pas: 0.5, provenance: prov('derive', 'DGFiP 2025 : 211,7 Md€, projeté en 2026', rp.tva.url) },
    impotRevenu: { R0: rp.impot_revenu.valeur * g, taux: 100, tauxRef: 100, bornes: [80, 120], pas: 1, provenance: prov('derive', 'Sénat, gestion 2025 : 94,9 Md€', rp.impot_revenu.url) },
    impotSocietes: { R0: rp.impot_societes.valeur * g, taux: 25, tauxRef: 25, bornes: [15, 35], pas: 0.5, provenance: prov('derive', 'Sénat, gestion 2025 : 59,9 Md€ (taux normal 25 %)', rp.impot_societes.url) },
    csg: { R0: rp.csg.valeur * g, taux: 9.2, tauxRef: 9.2, bornes: [7, 12], pas: 0.1, provenance: prov('derive', 'CSG 2025 : 157 Md€ (taux de 9,2 % sur les revenus d\'activité)', rp.csg.url) },
    cotisations: { R0: rp.cotisations_sociales.valeur * g, taux: 100, tauxRef: 100, bornes: [85, 110], pas: 1, provenance: prov('derive', 'Cotisations sociales 2025 : 443 Md€ (comptes nationaux)', rp.cotisations_sociales.url) },
    accisesEnergie: { R0: rp.accises_energie.valeur, taux: 100, tauxRef: 100, bornes: [70, 150], pas: 5, provenance: prov('secondaire', 'Accises sur l\'énergie 2025 : 28,8 Md€', rp.accises_energie.url) },
    droitsSuccession: { R0: rp.droits_succession.valeur * g, taux: 100, tauxRef: 100, bornes: [70, 150], pas: 5, provenance: prov('secondaire', 'Droits de succession 2025 : environ 16 Md€', rp.droits_succession.url) },
  };
  const sommeImpots = Object.values(impots).reduce((s, i) => s + i.R0, 0);
  impots.fixe = {
    R0: recettes2026 - sommeImpots, taux: null, tauxRef: null,
    provenance: prov('derive', 'Résidu : recettes publiques 2026 (calées sur le déficit de 5,4 % du PLF 2027) moins les prélèvements détaillés. Comprend la taxe foncière (44,2 Md€), les taxes de production et les recettes non fiscales.'),
  };

  return {
    id: 'france',
    nom: 'France',
    drapeau: '🇫🇷',
    regime: 'semi-presidentiel',
    zoneEuro: true,
    poidsZoneEuro: 0.2,
    chefGouvernement: { titre: 'Premier ministre', nomActuel: 'Sébastien Lecornu' },
    dateDonnees: d.meta.derniere_mise_a_jour,
    calendrier: {
      debut: { annee: 2026, t: 4 },
      nbTours: 20, // mandat de 5 ans
      echeances: [
        { id: 'budget2027', annee: 2026, t: 4, type: 'vote_budget', nom: 'Vote du budget 2027 (PLF et PLFSS)' },
        { id: 'presidentielle2027', annee: 2027, t: 2, type: 'presidentielle', nom: 'Élection présidentielle (avril-mai 2027)' },
        { id: 'pde2029', annee: 2029, t: 4, type: 'regle_ue', nom: 'Retour visé sous 3 % de déficit (procédure européenne)' },
      ],
    },

    macro: {
      pibNominal: pib2026,
      croissancePotentielle: 0.9,   // estimation (% par an)
      ecartProduction: -1.2,        // estimation : récession technique en 2026
      croissancesRecentes: [-0.2, 0.0, -0.1], // Insee : T1, T2, T3 2026 (% t/t)
      inflation: lire(d.macro.inflation_ipc),          // 3,0 %
      inflationSousJacente: 1.1,    // dérivé : 3,0 - 0,09 × 21,2 % d'énergie
      poidsEnergieConso: 0.09,      // estimation : poids de l'énergie dans l'indice des prix
      hausseEnergieConsoAnnuelle: 21.2, // Insee, septembre 2026
      chomage: lire(d.macro.chomage_bit),              // 8,3 %
      populationActive: 32.5,       // estimation (millions)
      tauxDirecteur: lire(d.macro.taux_directeur_bce_depot), // 2,50 %
      taux10ans: lire(d.macro.taux_10_ans),            // 4,77 %
      instabilitePolitique: 0.45,   // estimation : budget sans majorité, menace de censure
    },

    finances: {
      dette: (dette2026Pct / 100) * pib2026,
      interets: interets2026,
      maturiteMoyenne: 8.5,         // estimation (Agence France Trésor non collectée)
      recettes: recettes2026,
      depenses: depenses2026,
    },

    ministeres,
    impots,

    retraites: {
      ageLegal: 62.75,              // 62 ans et 9 mois (génération 1964, réforme suspendue)
      calendrierLegal: 'suspendu_reprise_2028', // LFSS 2026 : reprise du relèvement en 2028
      ageCible2023: 64,
      nbRetraites: retraites2026,
      pensionMoyenne: pensionMoyenne2026,
      coefDepense: depRetraites2026 / (retraites2026 * pensionMoyenne2026 * 12 / 1000), // réversions, minimum vieillesse...
      croissanceDemographique: 0.012, // estimation : hausse annuelle du nombre de retraités à âge constant
      effetNoria: 0.004,            // estimation : les nouveaux retraités ont des pensions plus élevées
      cohorteAnnuelle: 0.8,         // estimation : millions de personnes atteignant l'âge de départ chaque année
      partContrainteParAge: 0.5,    // estimation : part dont le départ dépend de l'âge légal
      tauxEmploiSeniors: 0.55,      // estimation : part des seniors maintenus qui restent en emploi
      moisRevalorisation: 1,        // revalorisation au 1er janvier
      sousIndexationPrevue: { 2027: 0.9 }, // LFSS 2026 : sous-indexation de 0,9 pt en 2027
      provenance: prov('secondaire', 'COR 2026, DREES 2026, LFSS 2026', rt.depenses.url),
    },

    travail: {
      dureeLegale: 35,
      dureeHabituelle: lire(d.travail.duree_habituelle_temps_complet), // 38,8 h
      salariesTempsComplet: 17,     // estimation (millions, secteur privé)
      fonctionnaires: 5.7,          // estimation (millions)
      coutHeuresSupDefisc: lire(d.travail.heures_sup_defiscalisees_cout), // 2,0 Md€
      smicNet: d.travail.smic.valeur.net_mensuel,
      smicBrut: d.travail.smic.valeur.brut_mensuel,
    },

    menages: menagesFrance(d),

    groupes: {
      jeunes: { poids: 0.14, popularite: 22, mobilisation: 0.8 },
      salaries: { poids: 0.34, popularite: 24, mobilisation: 1.0 },
      fonctionnaires: { poids: 0.13, popularite: 22, mobilisation: 1.2 },
      entrepreneurs: { poids: 0.08, popularite: 30, mobilisation: 0.5 },
      agriculteurs: { poids: 0.02, popularite: 20, mobilisation: 1.6 },
      retraites: { poids: 0.29, popularite: 32, mobilisation: 0.4 },
    },

    stocksInitiaux: { recherche: lire(d.recherche_climat.dird_pct_pib) },

    climat: {
      emissions: lire(d.recherche_climat.emissions_ges),   // 364 MtCO2e (2025, Citepa)
      objectif2030: 279,            // SNBC 3 (à vérifier)
      tendanceAnnuelle: -0.015,     // estimation : baisse spontanée (efficacité, électrification)
      partBasCarbone: 95.2,
    },

    regles: {
      ue: { pde: true, cibleDeficit: { 2026: 5.4, 2027: 5.0, 2028: 4.1, 2029: 2.9 }, plafondDette: 60 },
      nationale: null,
    },

    partenaires: ['ue', 'allemagne', 'etatsUnis', 'chine', 'royaumeUni', 'italie', 'espagne', 'pologne', 'frugaux', 'ukraine', 'golfe', 'norvege', 'mercosur', 'afrique'],
    relationsInitiales: { ue: 20, allemagne: 35, etatsUnis: 5, chine: -5, royaumeUni: 25, italie: 20, espagne: 25, pologne: 20, frugaux: -10, ukraine: 50, golfe: 15, norvege: 30, mercosur: -15, afrique: -10 },
    influenceInitiale: 62,
    pretSAFE: lire(d.international.pret_safe_ue),          // 15,09 Md€
  };
}

/**
 * Ménages types : des cas concrets pour rendre visibles les effets des
 * décisions. Le SMIC et la pension moyenne sont sourcés ; les autres revenus
 * sont des ordres de grandeur illustratifs (estimation).
 */
function menagesFrance(d) {
  const smicNet = d.travail.smic.valeur.net_mensuel;
  const pensionBrute = lire(d.finances_publiques.retraites.pension_moyenne_brute);
  return [
    { id: 'smic', nom: 'Sandrine, caissière au SMIC', groupe: 'salaries', revenuNet: smicNet, salaireBrut: d.travail.smic.valeur.brut_mensuel, heures: 35, impotRevenu: 0, partConso: 0.97, partEnergie: 0.10, prestations: 80, statut: 'officiel', note: 'SMIC net depuis le 01/06/2026 (info.gouv.fr). Prime d\'activité incluse dans les prestations (estimation).' },
    { id: 'couple', nom: 'Karim et Julie, deux salariés, deux enfants', groupe: 'salaries', revenuNet: 4200, salaireBrut: 5400, heures: 38.8, impotRevenu: 180, partConso: 0.85, partEnergie: 0.08, prestations: 150, statut: 'estimation' },
    { id: 'retraite', nom: 'Michel, retraité', groupe: 'retraites', revenuNet: pensionBrute * (1 - 0.091), pensionBrute, heures: 0, impotRevenu: 40, partConso: 0.88, partEnergie: 0.10, prestations: 0, statut: 'derive', note: 'Pension brute moyenne DREES (1 705 €) moins 9,1 % de CSG, CRDS et Casa.' },
    { id: 'jeune', nom: 'Léa, 24 ans, employée en CDD', groupe: 'jeunes', revenuNet: 1650, salaireBrut: 2100, heures: 35, impotRevenu: 20, partConso: 0.98, partEnergie: 0.07, prestations: 60, statut: 'estimation' },
    { id: 'fonctionnaire', nom: 'Nathalie, professeure des écoles', groupe: 'fonctionnaires', revenuNet: 2350, salaireBrut: 2900, heures: 0, impotRevenu: 90, partConso: 0.9, partEnergie: 0.08, prestations: 0, statut: 'estimation' },
    { id: 'artisan', nom: 'Thomas, artisan avec deux salariés', groupe: 'entrepreneurs', revenuNet: 2900, heures: 0, impotRevenu: 160, partConso: 0.85, partEnergie: 0.12, prestations: 0, beneficeEntreprise: 60000, statut: 'estimation' },
    { id: 'agriculteur', nom: 'Jean, éleveur laitier', groupe: 'agriculteurs', revenuNet: 1600, heures: 0, impotRevenu: 0, partConso: 0.95, partEnergie: 0.15, prestations: 0, aidesPAC: 1800, statut: 'estimation' },
  ];
}
