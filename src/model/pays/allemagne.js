/**
 * Profil de calibrage de l'Allemagne.
 *
 * Même logique que la France : l'état de départ (T4 2026, flux annualisés 2026)
 * est construit à partir de countries/allemagne.json. La ventilation par
 * fonction (COFOG) n'a pas été trouvée : on utilise les ordres de grandeur
 * marqués « estimation de jeu » dans le fichier de données, recalés sur les
 * totaux sourcés (dépenses, protection sociale, défense fédérale).
 */
import { lire, provenance as prov } from '../outils.js';

export function profilAllemagne(d) {
  const fp = d.finances_publiques;
  // Ventilation par fonction : données Eurostat si `npm run update-data` les a récupérées,
  // sinon ordres de grandeur marqués « estimation de jeu ».
  const eurostat = fp.depenses_par_fonction_cofog_eurostat?.valeurs_pct_pib;
  const avecEurostat = !!(eurostat?.GF01 && eurostat?.GF10 && eurostat?.GF07);
  const est = avecEurostat
    ? {
      GF01_services_generaux_hors_interets: eurostat.GF01 - (eurostat.GF0107 ?? 0), GF03_ordre_securite: eurostat.GF03, GF04_affaires_economiques: eurostat.GF04,
      GF05_environnement: eurostat.GF05, GF06_logement_equipements: eurostat.GF06, GF07_sante: eurostat.GF07, GF08_loisirs_culture_culte: eurostat.GF08, GF09_enseignement: eurostat.GF09,
    }
    : fp.depenses_par_fonction_cofog.estimation_jeu.valeurs;
  const bf = fp.budget_federal_2027_projet.valeurs;

  // --- Agrégats ------------------------------------------------------------
  const pib2025 = lire(d.macro.pib_nominal);              // 4 470 Md€ (dérivé)
  const croissanceNominale2026 = 0.03;                    // hypothèse : 0,7 % réel (Bundesbank) + 2,3 % de prix
  const pib2026 = pib2025 * (1 + croissanceNominale2026);
  const deficit2026Pct = fp.deficit_prevision.valeur['2026'];  // environ 4 % (Bundesbank, juin 2026)
  const recettes2026 = lire(fp.recettes_md) * 1.035;      // 2 140,2 Md€ en 2025, +3,5 % (hypothèse)
  const deficit2026 = (deficit2026Pct / 100) * pib2026;
  const depenses2026 = recettes2026 + deficit2026;
  const interets2026 = lire(fp.interets_apu);             // 48 Md€ (estimation)
  const primaires2026 = depenses2026 - interets2026;
  const dette2026 = lire(fp.dette_md) + deficit2026 + 20; // 2 838 Md€ + déficit + 20 Md€ d'ajustements (estimation)

  // --- Dépenses par poste ----------------------------------------------------
  const protectionSocialeTotale = ((avecEurostat ? eurostat.GF10 : lire(fp.depenses_par_fonction_cofog.valeurs.GF10_protection_sociale)) / 100) * pib2026; // 20,4 % (Eurostat)
  const retraitesDRV = lire(fp.retraites.depenses_drv) * 1.02;  // DRV (à vérifier) projeté en 2026
  const pensionsFonctionnaires = 60;                            // estimation
  const retraites2026 = retraitesDRV + pensionsFonctionnaires;
  const travailEmploi = 50.8 + 25; // minimum vital des demandeurs d'emploi 50,8 Md€ (budget fédéral 2027) + assurance chômage 25 Md€ (estimation)
  const allocationLogement = 5;                                  // estimation (Wohngeld)
  const defense = bf.ep14_defense['2026'] + bf.aide_militaire_ukraine['2026']; // 82,7 + 11,5 Md€ (budget fédéral)

  const reste = primaires2026 - protectionSocialeTotale - defense;
  const partsEstimees = {
    GF01: est.GF01_services_generaux_hors_interets, GF03: est.GF03_ordre_securite, GF04: est.GF04_affaires_economiques,
    GF05: est.GF05_environnement, GF06: est.GF06_logement_equipements, GF07: est.GF07_sante, GF08: est.GF08_loisirs_culture_culte, GF09: est.GF09_enseignement,
  };
  const sommeParts = Object.values(partsEstimees).reduce((s, v) => s + v, 0);
  const k = reste / ((sommeParts / 100) * pib2026);
  const m = (pct) => (pct / 100) * pib2026 * k;
  const gf04 = m(partsEstimees.GF04);
  const rechercheGF01 = 20, aeGF01 = 16;                         // estimations (recherche fédérale, Affaires étrangères + coopération)

  const e = (texte) => (avecEurostat
    ? prov('derive', `${texte} Ventilation Eurostat (gov_10a_exp), recalée sur les dépenses primaires 2026.`, fp.depenses_par_fonction_cofog_eurostat.url)
    : prov('estimation', `${texte} Ventilation COFOG estimée, recalée sur les dépenses primaires 2026.`));
  const ministeres = {
    retraites: { montant: retraites2026, provenance: prov('estimation', 'Assurance retraite DRV (421,3 Md€, à vérifier) + 60 Md€ de pensions des fonctionnaires (estimation)', fp.retraites.depenses_drv.url) },
    protectionSociale: { montant: protectionSocialeTotale - retraites2026 - travailEmploi - allocationLogement, provenance: prov('derive', 'Protection sociale (20,4 % du PIB, Eurostat) moins retraites, emploi et allocation logement') },
    travailEmploi: { montant: travailEmploi, provenance: prov('estimation', 'Minimum vital des demandeurs d\'emploi (50,8 Md€, budget 2027) + assurance chômage (25 Md€, estimation)', fp.budget_federal_2027_projet.url) },
    sante: { montant: m(partsEstimees.GF07), provenance: e('GF07 Santé.') },
    education: { montant: m(partsEstimees.GF09) * 0.75, provenance: e('75 % de GF09 Enseignement.') },
    recherche: { montant: m(partsEstimees.GF09) * 0.25 + rechercheGF01, provenance: e('25 % de GF09 + 20 Md€ de recherche (GF01).') },
    defense: { montant: defense, provenance: prov('officiel', 'Budget fédéral 2026 : défense 82,7 Md€ + aide militaire à l\'Ukraine 11,5 Md€', fp.budget_federal_2027_projet.url) },
    affairesEtrangeres: { montant: aeGF01, provenance: e('Affaires étrangères et coopération : 16 Md€ (GF01).') },
    interieurJustice: { montant: m(partsEstimees.GF03), provenance: e('GF03 Ordre et sécurité publics.') },
    ecologieEnergie: { montant: m(partsEstimees.GF05) + gf04 * 0.25, provenance: e('GF05 + 25 % de GF04 (fonds climat et transformation).') },
    transports: { montant: gf04 * 0.35, provenance: e('35 % de GF04 (fonds spécial infrastructures compris).') },
    agriculture: { montant: gf04 * 0.04, provenance: e('4 % de GF04 (hors PAC).') },
    logement: { montant: m(partsEstimees.GF06) + allocationLogement, provenance: e('GF06 + allocation logement (Wohngeld).') },
    culture: { montant: m(partsEstimees.GF08), provenance: e('GF08 Loisirs, culture et culte.') },
    economieFinances: { montant: m(partsEstimees.GF01) - rechercheGF01 - aeGF01 + gf04 * 0.36, provenance: e('Reste de GF01 + 36 % de GF04 (aides aux entreprises, dotations).') },
  };

  // --- Prélèvements 2026 -----------------------------------------------------
  const rp = fp.recettes_par_prelevement.valeurs;
  const g = 1.035;
  const impots = {
    tva: { R0: rp.tva_umsatzsteuer.valeur * g, taux: 19, tauxRef: 19, bornes: [15, 24], pas: 0.5, partPilotable: 0.85, provenance: prov('derive', 'TVA 2025 : 310,2 Md€ (Destatis), projetée en 2026', rp.tva_umsatzsteuer.url) },
    impotRevenu: { R0: (rp.impot_salaires_lohnsteuer.valeur + rp.impot_revenu_veranlagt.valeur) * g, taux: 100, tauxRef: 100, bornes: [80, 120], pas: 1, provenance: prov('derive', 'Impôt sur les salaires 262,7 + impôt sur le revenu 78,2 Md€ (2025)', rp.impot_salaires_lohnsteuer.url) },
    impotSocietes: { R0: rp.impot_societes.valeur * g, taux: 15, tauxRef: 15, bornes: [8, 25], pas: 0.5, provenance: prov('secondaire', 'Impôt sur les sociétés 2025 : 39,2 Md€ (taux 15 %)', rp.impot_societes.url) },
    cotisations: { R0: rp.cotisations_sociales.valeur * g, taux: 100, tauxRef: 100, bornes: [85, 115], pas: 1, provenance: prov('derive', 'Cotisations sociales : 756,6 Md€ en 2024 (Destatis), +8,9 % en 2025', rp.cotisations_sociales.url) },
    accisesEnergie: { R0: rp.accises_energie.valeur, taux: 100, tauxRef: 100, bornes: [70, 150], pas: 5, provenance: prov('officiel', 'Taxe sur l\'énergie 2025 : 37,6 Md€ (Destatis)', rp.accises_energie.url) },
    droitsSuccession: { R0: 13, taux: 100, tauxRef: 100, bornes: [70, 200], pas: 5, provenance: prov('estimation', 'Impôt sur les successions : environ 13 Md€ (ordre de grandeur, non sourcé)') },
  };
  const sommeImpots = Object.values(impots).reduce((s, i) => s + i.R0, 0);
  impots.fixe = {
    R0: recettes2026 - sommeImpots, taux: null, tauxRef: null,
    provenance: prov('derive', 'Résidu : recettes 2026 moins les prélèvements détaillés. Comprend la taxe professionnelle (Gewerbesteuer, 76,4 Md€), la contribution de solidarité et les recettes non fiscales.'),
  };

  const pensions = lire(d.finances_publiques.retraites.nombre_pensions); // 25,47 M (à vérifier)
  const pensionMoyenne = (retraitesDRV * 1000) / (pensions * 12);

  return {
    id: 'allemagne',
    nom: 'Allemagne',
    drapeau: '🇩🇪',
    regime: 'parlementaire-coalition',
    zoneEuro: true,
    poidsZoneEuro: 0.28,
    chefGouvernement: { titre: 'Chancelier', nomActuel: 'Friedrich Merz' },
    dateDonnees: d.meta.derniere_mise_a_jour,
    calendrier: {
      debut: { annee: 2026, t: 4 },
      nbTours: 16, // mandat de 4 ans
      echeances: [
        { id: 'budget2027', annee: 2026, t: 4, type: 'vote_budget', nom: 'Vote du budget fédéral 2027 (novembre)' },
        { id: 'landtag2027a', annee: 2027, t: 2, type: 'landtag', laender: ['Schleswig-Holstein', 'Sarre', 'Rhénanie-du-Nord-Westphalie', 'Brême'], nom: 'Élections régionales : Schleswig-Holstein et Sarre (18 avril), Rhénanie-du-Nord-Westphalie (25 avril), Brême (mai, à vérifier)' },
        { id: 'landtag2027b', annee: 2027, t: 3, type: 'landtag', laender: ['Basse-Saxe'], nom: 'Élection régionale en Basse-Saxe (septembre 2027)' },
        { id: 'cotisationsRetraite2028', annee: 2028, t: 1, type: 'loi', nom: 'Cotisation retraite prévue à 19,8 % (projection)' },
        { id: 'europeennes2029', annee: 2029, t: 2, type: 'europeennes', nom: 'Élections européennes (juin 2029, date à vérifier)' },
        { id: 'bundestag2029', annee: 2029, t: 1, type: 'legislatives', nom: 'Élections fédérales (Bundestag)', note: 'Date dérivée : 46 à 48 mois après la constitution du Bundestag (25/03/2025).' },
      ],
    },

    macro: {
      pibNominal: pib2026,
      croissancePotentielle: 0.6,   // estimation
      ecartProduction: -1.0,        // estimation
      croissancesRecentes: [0.3, 0.3, 0.2], // T3 2026 : Destatis ; T1 et T2 estimés (+1,3 % sur un an)
      inflation: lire(d.macro.inflation_ipc),        // 3,3 %
      inflationSousJacente: 2.4,    // Destatis, septembre 2026
      poidsEnergieConso: 0.06,      // estimation : 3,3 - 2,4 ≈ 0,06 × 14,9 %
      hausseEnergieConsoAnnuelle: 14.9,
      chomage: lire(d.macro.chomage_national_ba),    // 6,4 % (définition nationale)
      populationActive: 46.8,       // estimation (millions)
      tauxDirecteur: lire(d.macro.taux_directeur_bce_depot),
      taux10ans: lire(d.macro.taux_10_ans),          // 3,55 %
      instabilitePolitique: 0.2,    // estimation
    },

    finances: {
      dette: dette2026,
      interets: interets2026,
      maturiteMoyenne: 7,           // estimation
      recettes: recettes2026,
      depenses: depenses2026,
      fondsSpecialInfrastructures: { total: 500, annees: 12, decaissementAnnuel: 500 / 12 },
    },

    ministeres,
    impots,

    // Hausse des besoins de santé et de dépendance liée au vieillissement, en volume (hypothèse de jeu)
    vieillissement: { besoinsSanteParAn: 0.9 },

    retraites: {
      ageLegal: 66.33,              // 66 ans et 4 mois (génération 1960), 67 ans en 2031
      calendrierLegal: 'hausse_67_2031',
      nbRetraites: pensions,
      pensionMoyenne,
      coefDepense: retraites2026 / retraitesDRV,
      croissanceDemographique: 0.012, // estimation : départs des générations nombreuses
      // Les générations du baby-boom allemand (nées jusqu'à la fin des années 1960) partent jusqu'au milieu des années 2030 (estimation)
      profilDemographique: [{ jusqua: 2036, taux: 0.012 }, { jusqua: 2100, taux: 0.002 }],
      effetNoria: 0.002,
      cohorteAnnuelle: 1.3,
      partContrainteParAge: 0.5,
      tauxEmploiSeniors: 0.6,
      moisRevalorisation: 7,        // revalorisation au 1er juillet, indexée sur les salaires (taux de remplacement garanti à 48 %)
      indexationSalaires: true,
      tauxCotisation: lire(d.finances_publiques.retraites.taux_cotisation), // 18,6 %
      rendementPointCotisation: lire(d.finances_publiques.retraites.rendement_point_cotisation), // 21,1 Md€
      hausseCotisationPrevue: { annee: 2028, nouveauTaux: 19.8 },
      provenance: prov('secondaire', 'DRV 2026, Bundestag (documents 21/1929 et 21/3080)', d.finances_publiques.retraites.taux_cotisation.url),
    },

    travail: {
      dureeLegale: null,            // pas de durée légale hebdomadaire de référence comparable aux 35 h
      dureeHabituelle: 40.0,        // estimation (temps complet)
      salariesTempsComplet: 25,     // estimation (millions)
      fonctionnaires: 5.3,          // estimation (millions)
      coutHeuresSupDefisc: 0,
      salaireMinimumHoraire: d.travail.salaire_minimum.valeur['2026'],
    },

    menages: [
      { id: 'smic', nom: 'Aylin, vendeuse au salaire minimum', groupe: 'salaries', revenuNet: 1760, salaireBrut: 2407, heures: 40, impotRevenu: 160, partConso: 0.97, partEnergie: 0.09, prestations: 0, statut: 'derive', note: '13,90 €/h × 40 h (Bundesregierung) ; salaire net estimé.' },
      { id: 'couple', nom: 'Jonas et Mia, deux salariés, deux enfants', groupe: 'salaries', revenuNet: 5100, salaireBrut: 7400, heures: 40, impotRevenu: 650, partConso: 0.85, partEnergie: 0.08, prestations: 518, statut: 'estimation' },
      { id: 'retraite', nom: 'Helga, retraitée', groupe: 'retraites', revenuNet: pensionMoyenne * 0.89, pensionBrute: pensionMoyenne, heures: 0, impotRevenu: 20, partConso: 0.9, partEnergie: 0.10, prestations: 0, statut: 'derive', note: 'Pension moyenne par pension DRV, moins environ 11 % de cotisations maladie et dépendance.' },
      { id: 'jeune', nom: 'Lukas, 25 ans, technicien', groupe: 'jeunes', revenuNet: 2000, salaireBrut: 3000, heures: 40, impotRevenu: 260, partConso: 0.95, partEnergie: 0.07, prestations: 0, statut: 'estimation' },
      { id: 'fonctionnaire', nom: 'Stefan, enseignant fonctionnaire', groupe: 'fonctionnaires', revenuNet: 3700, salaireBrut: 4600, heures: 0, impotRevenu: 600, partConso: 0.85, partEnergie: 0.08, prestations: 0, statut: 'estimation' },
      { id: 'artisan', nom: 'Petra, maîtresse artisane', groupe: 'entrepreneurs', revenuNet: 3300, heures: 0, impotRevenu: 700, partConso: 0.85, partEnergie: 0.12, prestations: 0, beneficeEntreprise: 80000, statut: 'estimation' },
      { id: 'agriculteur', nom: 'Klaus, agriculteur', groupe: 'agriculteurs', revenuNet: 2100, heures: 0, impotRevenu: 100, partConso: 0.95, partEnergie: 0.15, prestations: 0, aidesPAC: 2500, statut: 'estimation' },
    ],

    groupes: {
      jeunes: { poids: 0.13, popularite: 16, mobilisation: 0.7 },
      salaries: { poids: 0.36, popularite: 18, mobilisation: 0.7 },
      fonctionnaires: { poids: 0.10, popularite: 20, mobilisation: 0.5 },
      entrepreneurs: { poids: 0.09, popularite: 22, mobilisation: 0.5 },
      agriculteurs: { poids: 0.01, popularite: 15, mobilisation: 1.4 },
      retraites: { poids: 0.31, popularite: 24, mobilisation: 0.3 },
    },

    stocksInitiaux: { recherche: lire(d.recherche_climat.dird_pct_pib) },

    climat: {
      emissions: lire(d.recherche_climat.emissions_ges),   // 648,9 MtCO2e (UBA)
      objectif2030: Math.round((lire(d.recherche_climat.emissions_ges) / 0.52) * 0.35), // dérivé : -48 % en 2025, objectif -65 %
      // Loi climat : −88 % par rapport à 1990 en 2040, neutralité en 2045 (cible du jeu : l'étape de 2040)
      objectifLongTerme: { annee: 2045, cible: Math.round((lire(d.recherche_climat.emissions_ges) / 0.52) * 0.12), nom: 'Loi climat : −88 % par rapport à 1990 en 2040, puis neutralité en 2045' },
      tendanceAnnuelle: -0.02,
      partRenouvelablesElectricite: 55.1,
    },

    regles: {
      ue: { pde: false, clauseDerogatoireDefense: true, plafondDette: 60 },
      nationale: {
        type: 'schuldenbremse',
        plafondStructurelBund: 0.35,
        plafondStructurelLaender: 0.35,
        seuilExemptionDefense: 1.0,
        note: 'Frein à l\'endettement : 0,35 % du PIB pour le Bund (et 0,35 % pour les Länder depuis 2025). Défense au-delà de 1 % du PIB exemptée. Fonds spécial de 500 Md€ sur 12 ans.',
      },
    },

    partenaires: ['ue', 'france', 'etatsUnis', 'chine', 'royaumeUni', 'italie', 'espagne', 'pologne', 'frugaux', 'ukraine', 'golfe', 'norvege', 'mercosur', 'afrique'],
    relationsInitiales: { ue: 25, france: 35, etatsUnis: 10, chine: 5, royaumeUni: 20, italie: 15, espagne: 20, pologne: 15, frugaux: 30, ukraine: 45, golfe: 10, norvege: 40, mercosur: 25, afrique: 5 },
    influenceInitiale: 66,
    pretSAFE: 0,
  };
}
