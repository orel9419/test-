/**
 * Profil de calibrage des États-Unis.
 *
 * Périmètre : budget FÉDÉRAL (exercice 2026, d'octobre 2025 à septembre 2026),
 * en milliards de dollars (Md$). Les États fédérés, qui financent l'essentiel
 * de l'éducation, de la police et une partie de Medicaid, ne sont pas inclus.
 */
import { lire, provenance as prov } from '../outils.js';

export function profilEtatsUnis(d) {
  const fp = d.finances_publiques;
  const pib = lire(d.macro.pib_nominal);                       // 31 800 Md$ (dérivé)
  const depenses = lire(fp.depenses_md);                       // 7 400 Md$ (CBO)
  const recettes = lire(fp.recettes_md);                       // 5 403 Md$ (CBO)
  const interets = lire(fp.interets_nets);                     // 1 052 Md$
  const postes = fp.depenses_par_poste.valeurs;
  const primaires = depenses - interets;

  // Grandes masses sourcées (Monthly Treasury Statement via agrégateur)
  const retraites = postes.social_security;                    // 1 670
  const sante = postes.medicare + postes.sante_dont_medicaid;  // 2 099
  const defense = postes.defense;                              // 965,2
  const reste = primaires - retraites - sante - defense;
  // Répartition du reste selon les grandes fonctions budgétaires fédérales (estimation de jeu)
  const parts = {
    protectionSociale: 0.60,   // sécurité du revenu (SNAP, SSI, crédits d'impôt remboursables, retraites fédérales) + anciens combattants
    travailEmploi: 0.025, education: 0.06, recherche: 0.03, affairesEtrangeres: 0.04, interieurJustice: 0.07,
    ecologieEnergie: 0.045, transports: 0.08, agriculture: 0.025, logement: 0.02, culture: 0.003, economieFinances: 0.022,
  };
  const somme = Object.values(parts).reduce((s, x) => s + x, 0);
  const src = fp.depenses_par_poste.url;
  const ministeres = {
    retraites: { montant: retraites, provenance: prov('secondaire', 'Social Security, exercice 2026 (Monthly Treasury Statement, via agrégateur)', src) },
    sante: { montant: sante, provenance: prov('secondaire', 'Medicare (1 073 Md$) + santé dont Medicaid (1 026 Md$), exercice 2026', src) },
    defense: { montant: defense, provenance: prov('secondaire', 'Défense nationale, exercice 2026', src) },
  };
  const libelles = {
    protectionSociale: 'Sécurité du revenu (aide alimentaire, SSI, crédits d\'impôt) et anciens combattants',
    travailEmploi: 'Assurance chômage et formation', education: 'Ministère de l\'Éducation et aides aux étudiants',
    recherche: 'Science générale et espace (NSF, NASA, recherche du DOE)', affairesEtrangeres: 'Affaires internationales',
    interieurJustice: 'Justice et sécurité intérieure', ecologieEnergie: 'Énergie, ressources naturelles et environnement',
    transports: 'Transports', agriculture: 'Agriculture', logement: 'Logement et développement local', culture: 'Culture (NEA, Smithsonian...)',
    economieFinances: 'Administration générale et commerce',
  };
  for (const [id, part] of Object.entries(parts)) {
    ministeres[id] = { montant: reste * part / somme, provenance: prov('estimation', `${libelles[id]} : part estimée du reste des dépenses fédérales (${Math.round(reste)} Md$).`) };
  }

  const rp = fp.recettes_par_prelevement.valeurs;
  const accisesCarburants = 40; // estimation : taxe fédérale sur les carburants (comprise dans « autres »)
  const impots = {
    impotRevenu: { R0: rp.impot_revenu, taux: 100, tauxRef: 100, bornes: [80, 125], pas: 1, provenance: prov('officiel', 'Impôt fédéral sur le revenu, exercice 2026 : 2 844 Md$ (CBO)', fp.recettes_par_prelevement.url) },
    cotisations: { R0: rp.cotisations_sociales, taux: 100, tauxRef: 100, bornes: [85, 120], pas: 1, provenance: prov('officiel', 'Cotisations sociales (payroll taxes) : 1 815 Md$ (CBO)', fp.recettes_par_prelevement.url) },
    impotSocietes: { R0: rp.impot_societes, taux: 21, tauxRef: 21, bornes: [10, 35], pas: 0.5, provenance: prov('officiel', 'Impôt fédéral sur les sociétés : 382 Md$ (taux de 21 %)', fp.recettes_par_prelevement.url) },
    droitsDouane: { R0: rp.droits_douane, taux: 5.2, tauxRef: 5.2, bornes: [0, 30], pas: 0.5, provenance: prov('derive', 'Droits de douane : 172 Md$ (CBO). Taux effectif moyen estimé à 5,2 % (environ 3 300 Md$ d\'importations, estimation)', fp.recettes_par_prelevement.url) },
    accisesEnergie: { R0: accisesCarburants, taux: 100, tauxRef: 100, bornes: [0, 200], pas: 5, provenance: prov('estimation', 'Taxe fédérale sur les carburants : environ 40 Md$ (estimation, comprise dans les « autres recettes » de la CBO)') },
  };
  impots.fixe = { R0: recettes - Object.values(impots).reduce((s, i) => s + i.R0, 0), taux: null, tauxRef: null, provenance: prov('derive', 'Autres recettes (droits de succession, Réserve fédérale, redevances...)') };

  const ss = fp.social_security;
  const nbRetraites = lire(ss.beneficiaires_retraite);          // 62 M
  const pension = lire(ss.pension_moyenne);                    // 2 086 $/mois

  return {
    id: 'etatsUnis',
    nom: 'États-Unis',
    drapeau: '🇺🇸',
    devise: '$',
    regime: 'presidentiel',
    zoneEuro: false,
    banqueCentrale: 'fed',
    poidsZoneEuro: 0,
    chefGouvernement: { titre: 'Président', nomActuel: 'Donald Trump' },
    dateDonnees: d.meta.derniere_mise_a_jour,
    calendrier: {
      debut: { annee: 2026, t: 4 },
      nbTours: 9, // jusqu'à l'élection de novembre 2028 (le mandat s'achève le 20 janvier 2029)
      echeances: [
        { id: 'miMandat2026', annee: 2026, t: 4, type: 'mi_mandat', nom: 'Élections de mi-mandat (3 novembre 2026)' },
        { id: 'financement2026', annee: 2026, t: 4, type: 'vote_budget', nom: 'Fin du financement provisoire (11 décembre 2026)' },
        { id: 'presidentielle2028', annee: 2028, t: 4, type: 'presidentielle', nom: 'Élection présidentielle (7 novembre 2028)' },
      ],
    },

    macro: {
      pibNominal: pib,
      croissancePotentielle: 2.0,     // estimation
      ecartProduction: 0.3,           // estimation : chômage proche de son niveau d'équilibre
      croissancesRecentes: [0.4, 0.55, 0.62], // T1 estimé ; T2 2,2 % et T3 2,5 % en rythme annualisé (BEA, à vérifier)
      inflation: lire(d.macro.inflation_ipc),            // 3,7 %
      inflationSousJacente: lire(d.macro.inflation_sous_jacente), // 2,6 %
      poidsEnergieConso: 0.07,        // estimation
      hausseEnergieConsoAnnuelle: (lire(d.macro.inflation_ipc) - lire(d.macro.inflation_sous_jacente)) / 0.07, // dérivé : environ 15,7 %
      chomage: lire(d.macro.chomage),                    // 4,2 %
      populationActive: lire(d.macro.population_active),  // 170 M (estimation)
      tauxDirecteur: lire(d.macro.taux_directeur),       // 3,875 %
      taux10ans: lire(d.macro.taux_10_ans),              // 5,25 %
      instabilitePolitique: 0.35,     // estimation : polarisation, shutdowns récents
    },

    finances: {
      dette: lire(fp.dette_detenue_public),              // 32 400 Md$
      interets,
      maturiteMoyenne: 6,             // estimation
      recettes,
      depenses,
      detteIntragouvernementale: 7400, // estimation (fonds fiduciaires fédéraux)
    },

    ministeres,
    impots,

    // Medicare et Medicaid : hausse des besoins liée au vieillissement et aux coûts médicaux, en volume (hypothèse de jeu ;
    // le CBO projette Medicare de 3,1 % du PIB en 2025 à environ 5,5 % au milieu des années 2050)
    vieillissement: { besoinsSanteParAn: 3.2 },

    retraites: {
      ageLegal: 66.83,                // âge du taux plein : 67 ans pour les générations nées à partir de 1960
      calendrierLegal: 'fra_67',
      nbRetraites,
      pensionMoyenne: pension,
      coefDepense: retraites / (nbRetraites * pension * 12 / 1000),
      croissanceDemographique: 0.022, // estimation : départs des baby-boomers
      // Les derniers baby-boomers (nés en 1964) atteignent 65 ans vers 2030, puis la hausse ralentit (estimation)
      profilDemographique: [{ jusqua: 2030, taux: 0.022 }, { jusqua: 2040, taux: 0.011 }, { jusqua: 2100, taux: 0.006 }],
      effetNoria: 0.009,             // estimation : droits calculés sur les salaires indexés (wage indexing), la pension moyenne progresse plus vite que les prix
      cohorteAnnuelle: 4.0,           // estimation
      partContrainteParAge: 0.3,      // départ possible dès 62 ans avec décote : l'âge du taux plein contraint moins
      tauxEmploiSeniors: 0.65,
      moisRevalorisation: 1,          // revalorisation (COLA) en janvier, indexée sur l'inflation
      anneeEpuisementFonds: lire(ss.epuisement_fonds),   // 2032 (fonds retraite OASI)
      // Fonds combiné OASDI : 2 560 Md$ fin 2025, −160 Md$ en 2025, épuisement projeté au T3 2034 (administrateurs, 2026)
      fondsSS: { reservesDepart: 2560 - 0.75 * 187, deficitDepart: 187 + 0.75 * 27, hausseDeficitAnnuelle: 27, partPayableApresEpuisement: 0.81 },
      provenance: prov('secondaire', 'Social Security : 62 M de bénéficiaires, pension moyenne de 2 086 $, fonds épuisé en 2032', ss.epuisement_fonds.url),
    },

    travail: { dureeLegale: null, dureeHabituelle: 40, salariesTempsComplet: 120, fonctionnaires: 3, coutHeuresSupDefisc: 0 },

    menages: [
      { id: 'smic', nom: 'Maria, caissière à 15 $/h au Texas', groupe: 'salaries', revenuNet: 2300, salaireBrut: 2600, heures: 40, impotRevenu: 60, partConso: 0.98, partEnergie: 0.09, prestations: 150, statut: 'estimation', note: 'Salaire minimum fédéral : 7,25 $/h ; la plupart des employeurs paient davantage.' },
      { id: 'couple', nom: 'Mike et Jessica, deux salariés, deux enfants (Ohio)', groupe: 'salaries', revenuNet: 7800, salaireBrut: 10000, heures: 40, impotRevenu: 700, partConso: 0.85, partEnergie: 0.07, prestations: 0, statut: 'estimation' },
      { id: 'retraite', nom: 'Linda, retraitée', groupe: 'retraites', revenuNet: pension - 200, pensionBrute: pension, heures: 0, impotRevenu: 0, partConso: 0.9, partEnergie: 0.09, prestations: 0, statut: 'derive', note: 'Pension moyenne de la Social Security (2 086 $, AARP) moins la cotisation Medicare (environ 200 $, estimation).' },
      { id: 'jeune', nom: 'Tyler, 24 ans, livreur', groupe: 'jeunes', revenuNet: 2600, salaireBrut: 3000, heures: 40, impotRevenu: 150, partConso: 0.98, partEnergie: 0.10, prestations: 0, statut: 'estimation' },
      { id: 'fonctionnaire', nom: 'Denise, agente fédérale', groupe: 'fonctionnaires', revenuNet: 4600, salaireBrut: 6200, heures: 0, impotRevenu: 450, partConso: 0.88, partEnergie: 0.07, prestations: 0, statut: 'estimation' },
      { id: 'artisan', nom: 'Carlos, entrepreneur du bâtiment', groupe: 'entrepreneurs', revenuNet: 5500, heures: 0, impotRevenu: 600, partConso: 0.85, partEnergie: 0.10, prestations: 0, beneficeEntreprise: 120000, statut: 'estimation' },
      { id: 'agriculteur', nom: 'Dale, producteur de soja (Iowa)', groupe: 'agriculteurs', revenuNet: 4000, heures: 0, impotRevenu: 200, partConso: 0.9, partEnergie: 0.14, prestations: 0, aidesPAC: 1500, statut: 'estimation', note: 'Très exposé aux représailles commerciales chinoises sur le soja.' },
    ],

    groupes: {
      jeunes: { poids: 0.14, popularite: 28, mobilisation: 0.6 },
      salaries: { poids: 0.38, popularite: 34, mobilisation: 0.5 },
      fonctionnaires: { poids: 0.06, popularite: 22, mobilisation: 0.6 },
      entrepreneurs: { poids: 0.10, popularite: 45, mobilisation: 0.4 },
      agriculteurs: { poids: 0.02, popularite: 50, mobilisation: 0.8 },
      retraites: { poids: 0.30, popularite: 42, mobilisation: 0.3 },
    },

    stocksInitiaux: { recherche: lire(d.recherche_climat.dird_pct_pib) },

    climat: {
      emissions: lire(d.recherche_climat.emissions_ges),   // 5 350 MtCO2e (Rhodium)
      objectif2030: null,             // pas d'objectif fédéral (sortie de l'accord de Paris)
      tendanceAnnuelle: -0.005,       // estimation
    },

    regles: {
      ue: null,
      nationale: { type: 'plafond_dette', plafond: lire(fp.plafond_dette), note: 'Plafond légal de la dette brute : 41 100 Md$ depuis juillet 2025.' },
    },

    partenaires: ['ue', 'chine', 'canada', 'mexique', 'japon', 'royaumeUni', 'ukraine', 'golfe', 'afrique'],
    relationsInitiales: { ue: -10, chine: -40, canada: -15, mexique: -10, japon: 20, royaumeUni: 25, ukraine: 10, golfe: 40, afrique: -5 },
    influenceInitiale: 85,
    pretSAFE: 0,
    sensibiliteMarches: 0.6,          // « privilège du dollar » : la prime de risque réagit moins (estimation)
  };
}
