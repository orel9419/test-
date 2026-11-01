/**
 * Fleurons nationaux, participations de l'État et programmes « État stratège ».
 *
 * Parts de l'État : sourcées quand c'est possible (countries/*.json, rapports de
 * l'Agence des participations de l'État), sinon signalées « à vérifier ».
 * Capitalisations et emplois : ORDRES DE GRANDEUR (estimation de jeu, fin
 * 2025-2026), à remplacer par des données de marché ; ils servent à chiffrer
 * le coût d'une prise de participation et le poids dans l'indice.
 *
 * Champs : id, nom, secteur, partEtat (%), statutPart ('secondaire' |
 * 'a_verifier'), capitalisation (Md€ ou Md$), emplois (milliers dans le pays),
 * strategique (0 à 1 : énergie, défense, technologies critiques...),
 * exposition { energie, chine, taux } (sensibilités de 0 à 1), cotee.
 */

export const INDICES = {
  france: { nom: 'CAC 40', valeur: 100, base100: true, note: 'Indice du jeu, base 100 au départ (niveau réel du CAC 40 non collecté).' },
  allemagne: { nom: 'DAX', valeur: 25622.61, base100: false, note: 'Niveau de mi-octobre 2026 (Deutsche Börse, via ms-aktuell).' },
  etatsUnis: { nom: 'S&P 500', valeur: 100, base100: true, note: 'Indice du jeu, base 100 au départ (niveau réel non collecté).' },
};

/** Niveau de départ de la souveraineté économique (0 à 100, estimation de jeu). */
export const SOUVERAINETE_DEPART = { france: 52, allemagne: 45, etatsUnis: 68 };

/** Agences qui gèrent les participations publiques. */
export const AGENCES = {
  france: { nom: 'Agence des participations de l\'État (APE) et Bpifrance', note: 'Portefeuille de 209,1 Md€ au 30/06/2025 (dont 67,9 Md€ coté), 86 entités ; 4,3 Md€ de dividendes en 2025.', dividendes: 4.3 },
  allemagne: { nom: 'Ministère fédéral des Finances et KfW', note: 'L\'État fédéral détient ses participations directement ou via la KfW (TenneT Germany, Deutsche Telekom, Uniper...).', dividendes: null },
  etatsUnis: { nom: 'Départements du Commerce, de la Défense et de l\'Énergie', note: 'Pas d\'agence des participations : depuis 2025, l\'administration prend des participations au cas par cas (Intel, MP Materials, Lithium Americas, Trilogy Metals) et une « action de contrôle » dans U.S. Steel.', dividendes: null },
};

const F = (id, nom, secteur, partEtat, capitalisation, emplois, strategique, exposition = {}, autres = {}) => ({ id, nom, secteur, partEtat, capitalisation, emplois, strategique, exposition: { energie: 0.2, chine: 0.2, taux: 0.3, ...exposition }, cotee: true, ...autres });

export const FLEURONS = {
  france: [
    F('edf', 'EDF', 'Énergie (nucléaire)', 100, 60, 130, 1, { energie: -0.4, taux: 0.8 }, { cotee: false, note: 'Renationalisée en 2023. Valeur : estimation de jeu. Doit financer six réacteurs EPR2.' }),
    F('totalenergies', 'TotalEnergies', 'Pétrole, gaz, électricité', 0, 130, 35, 0.8, { energie: -0.8 }, { note: '9,9 Md€ de bénéfice au 1er semestre 2026 (Tradingsat).' }),
    F('airbus', 'Airbus', 'Aéronautique, défense', 10.9, 160, 50, 0.9, { chine: 0.4 }, { statutPart: 'a_verifier', note: 'Participation via la Sogepa (environ 11 %, à vérifier).' }),
    F('safran', 'Safran', 'Moteurs d\'avion, défense', 11, 130, 50, 0.9, { chine: 0.3 }, { statutPart: 'a_verifier' }),
    F('thales', 'Thales', 'Défense, électronique', 26, 55, 45, 1, { chine: 0.1 }, { statutPart: 'a_verifier', actionSpecifique: true }),
    F('lvmh', 'LVMH', 'Luxe', 0, 300, 40, 0.2, { chine: 0.8, energie: 0.05 }, { note: '5,7 Md€ de bénéfice au 1er semestre 2026 (Tradingsat).' }),
    F('sanofi', 'Sanofi', 'Santé, médicaments', 0, 110, 20, 0.7, { chine: 0.2 }),
    F('bnp', 'BNP Paribas', 'Banque', 0, 85, 60, 0.6, { taux: 0.9, energie: 0.1 }, { note: '7,56 Md€ de bénéfice au 1er semestre 2026 (Tradingsat).' }),
    F('orange', 'Orange', 'Télécommunications', 23, 40, 70, 0.8, { chine: 0.05 }, { statutPart: 'a_verifier', note: 'État (APE) et Bpifrance, environ 23 % (à vérifier).' }),
    F('engie', 'Engie', 'Énergie, gaz', 23.6, 50, 25, 0.8, { energie: 0.3 }, { statutPart: 'a_verifier', actionSpecifique: true }),
    F('renault', 'Renault', 'Automobile', 15, 12, 40, 0.5, { energie: 0.5, chine: 0.5 }, { statutPart: 'a_verifier' }),
    F('stellantis', 'Stellantis', 'Automobile', 6, 30, 40, 0.5, { energie: 0.5, chine: 0.5 }, { statutPart: 'a_verifier', note: 'Participation de Bpifrance (environ 6 %, à vérifier).' }),
    F('stmicro', 'STMicroelectronics', 'Semi-conducteurs', 14, 22, 11, 0.9, { chine: 0.6 }, { statutPart: 'a_verifier', note: 'Contrôle conjoint franco-italien (holding commune), part française estimée.' }),
    F('arcelor', 'ArcelorMittal France', 'Sidérurgie', 0, 3, 15, 0.8, { energie: 1, chine: 0.7 }, { cotee: false, note: 'Filiale française du groupe ArcelorMittal (environ 40 sites, dont Dunkerque et Fos-sur-Mer). Proposition de loi de nationalisation votée à l\'Assemblée en deuxième lecture le 11/06/2026, rejetée une première fois par le Sénat.' }),
  ],
  allemagne: [
    F('sap', 'SAP', 'Logiciels', 0, 250, 30, 0.7, { chine: 0.1 }),
    F('siemens', 'Siemens', 'Industrie, automatisation', 0, 190, 85, 0.7, { chine: 0.5, energie: 0.3 }),
    F('telekom', 'Deutsche Telekom', 'Télécommunications', 30, 150, 80, 0.8, { chine: 0.05 }, { statutPart: 'a_verifier', note: 'État fédéral et KfW ; ordre de grandeur non vérifié.' }),
    F('rheinmetall', 'Rheinmetall', 'Défense', 0, 80, 20, 1, { chine: 0 }),
    F('volkswagen', 'Volkswagen', 'Automobile', 0, 50, 300, 0.6, { energie: 0.5, chine: 0.9 }, { note: 'La Basse-Saxe (Land, pas l\'État fédéral) détient 20 % des droits de vote.' }),
    F('mercedes', 'Mercedes-Benz', 'Automobile', 0, 55, 170, 0.5, { energie: 0.4, chine: 0.8 }),
    F('basf', 'BASF', 'Chimie', 0, 40, 50, 0.6, { energie: 1, chine: 0.6 }),
    F('commerzbank', 'Commerzbank', 'Banque', 12, 40, 25, 0.5, { taux: 0.9 }, { statutPart: 'a_verifier', note: 'Offre d\'UniCredit, à laquelle le gouvernement s\'oppose.' }),
    F('thyssenkrupp', 'Thyssenkrupp', 'Sidérurgie, sous-marins', 0, 6, 60, 0.8, { energie: 1, chine: 0.5 }),
    F('uniper', 'Uniper', 'Gaz, électricité', 99, 15, 7, 0.9, { energie: 0.6 }, { note: 'Sauvée en 2022 ; vente lancée en mai 2026 (JPMorgan, UBS).' }),
    F('tennet', 'TenneT Germany', 'Réseau électrique', 25.1, 30, 4, 1, { energie: 0.1, taux: 0.6 }, { cotee: false, note: 'Contrat signé le 03/02/2026 par la KfW ; droit de veto sur les décisions stratégiques. Valeur : estimation de jeu.' }),
    F('hensoldt', 'Hensoldt', 'Électronique de défense', 25.1, 10, 5, 1, { chine: 0 }, { statutPart: 'a_verifier' }),
  ],
  etatsUnis: [
    F('nvidia', 'Nvidia', 'Semi-conducteurs (IA)', 0, 4500, 30, 0.9, { chine: 0.4, energie: 0.05 }),
    F('apple', 'Apple', 'Électronique grand public', 0, 4000, 90, 0.6, { chine: 0.9, energie: 0.05 }),
    F('microsoft', 'Microsoft', 'Logiciels, cloud', 0, 3800, 125, 0.8, { chine: 0.2, energie: 0.05 }),
    F('jpmorgan', 'JPMorgan Chase', 'Banque', 0, 850, 230, 0.6, { taux: 0.9 }),
    F('exxon', 'ExxonMobil', 'Pétrole, gaz', 0, 480, 40, 0.7, { energie: -0.8 }),
    F('tesla', 'Tesla', 'Automobile électrique', 0, 1400, 80, 0.5, { chine: 0.6, energie: 0.2 }),
    F('boeing', 'Boeing', 'Aéronautique, défense', 0, 160, 150, 1, { chine: 0.4 }),
    F('lockheed', 'Lockheed Martin', 'Défense', 0, 110, 120, 1, { chine: 0 }),
    F('intel', 'Intel', 'Semi-conducteurs', 10, 180, 100, 1, { chine: 0.3 }, { note: 'Subventions du CHIPS Act converties en capital en 2025 (environ 10 %).' }),
    F('ussteel', 'U.S. Steel', 'Sidérurgie', 0, 15, 20, 0.8, { energie: 0.8, chine: 0.6 }, { cotee: false, actionSpecifique: true, note: 'Rachetée par Nippon Steel en 2025 ; l\'État détient une « action de contrôle » (golden share).' }),
    F('mpmaterials', 'MP Materials', 'Terres rares', 15, 10, 1, 1, { chine: 0.9 }, { note: 'Le département de la Défense détient environ 15 % (400 M$ d\'actions préférentielles convertibles).' }),
  ],
};

/**
 * Programmes d'investissement de l'« État stratège » : coût annuel (en part
 * du PIB, pour s'adapter au pays), poste budgétaire, délai avant les premiers
 * effets, effets à pleine montée en charge.
 * Repères réels : France 2030 (54 Md€ sur cinq ans, lancé en 2021),
 * CHIPS and Science Act (52,7 Md$ pour les semi-conducteurs, 2022),
 * Fonds pour le climat et la transformation en Allemagne (KTF).
 */
export const PROGRAMMES = [
  { id: 'nucleaire', nom: 'Nouveau nucléaire et réseaux électriques', secteur: 'energie', poste: 'ecologieEnergie', coutPctPIB: 0.12, delai: 12, effets: { potentiel: 0.03, souverainete: 6, emissions: -0.015, climat: 1 }, pays: ['france', 'etatsUnis'], description: 'Prêts bonifiés et garanties pour construire des réacteurs (EPR2 en France, petits réacteurs modulaires aux États-Unis). Effets très lents : un réacteur prend plus de dix ans.' },
  { id: 'reseaux', nom: 'Réseaux électriques et stockage', secteur: 'energie', poste: 'ecologieEnergie', coutPctPIB: 0.1, delai: 6, effets: { potentiel: 0.02, souverainete: 4, emissions: -0.01, climat: 1 }, pays: ['allemagne'], description: 'Lignes à haute tension nord-sud, stockage, participation dans TenneT : le goulet d\'étranglement de l\'Energiewende.' },
  { id: 'defense_industrie', nom: 'Économie de guerre : capacités de l\'industrie de défense', secteur: 'defense', poste: 'defense', coutPctPIB: 0.1, delai: 4, effets: { potentiel: 0.01, souverainete: 6, climat: 1, influence: 2 }, pays: 'tous', description: 'Commandes pluriannuelles d\'obus, de missiles et de drones pour que les industriels investissent dans leurs chaînes de production.' },
  { id: 'semiconducteurs', nom: 'Semi-conducteurs', secteur: 'technologie', poste: 'recherche', coutPctPIB: 0.08, delai: 8, effets: { potentiel: 0.04, souverainete: 7, climat: 2 }, pays: 'tous', description: 'Subventions aux usines de puces (modèle du CHIPS Act américain et de l\'European Chips Act). Coûteux, dépend de la venue d\'industriels étrangers.' },
  { id: 'batteries', nom: 'Batteries et véhicules électriques', secteur: 'industrie', poste: 'ecologieEnergie', coutPctPIB: 0.06, delai: 6, effets: { potentiel: 0.02, souverainete: 4, emissions: -0.01, climat: 1 }, pays: 'tous', description: 'Gigafactories et chaîne de valeur des batteries face à la concurrence chinoise.' },
  { id: 'ia', nom: 'Intelligence artificielle et calcul', secteur: 'technologie', poste: 'recherche', coutPctPIB: 0.05, delai: 4, effets: { potentiel: 0.04, souverainete: 4, climat: 3 }, pays: 'tous', description: 'Supercalculateurs, centres de données, formation : un effet sur la productivité encore très incertain.' },
  { id: 'sante_souveraine', nom: 'Relocalisation des médicaments essentiels', secteur: 'sante', poste: 'sante', coutPctPIB: 0.03, delai: 6, effets: { potentiel: 0.005, souverainete: 4, climat: 1 }, pays: 'tous', description: 'Produire dans le pays les principes actifs critiques (paracétamol, amoxicilline...), après les pénuries de 2022-2023.' },
  { id: 'hydrogene', nom: 'Hydrogène vert et acier décarboné', secteur: 'industrie', poste: 'ecologieEnergie', coutPctPIB: 0.06, delai: 10, effets: { potentiel: 0.01, souverainete: 3, emissions: -0.012, climat: 1 }, pays: 'tous', description: 'Aider la sidérurgie et la chimie à passer à l\'hydrogène : un pari technologique cher, aux effets lointains.' },
  { id: 'terres_rares', nom: 'Métaux critiques et terres rares', secteur: 'industrie', poste: 'economieFinances', coutPctPIB: 0.03, delai: 8, effets: { potentiel: 0.005, souverainete: 6, climat: 1 }, pays: 'tous', description: 'Mines, raffinage et recyclage pour réduire la dépendance à la Chine, qui raffine l\'essentiel des terres rares.' },
];

/** Actions possibles sur un fleuron. */
export const ACTIONS_ENTREPRISES = {
  rencontre: { nom: 'Recevoir la direction', description: 'Écouter, demander des engagements d\'investissement et d\'emploi. Gratuit, mais l\'issue dépend du climat des affaires.' },
  participation: { nom: 'Prendre 10 % du capital', description: 'L\'État achète des actions : la dette augmente (sans creuser le déficit), les dividendes aussi, et l\'État pèse dans les décisions.' },
  nationaliser: { nom: 'Nationaliser', description: 'Prendre 100 % du capital. Il faut une loi, une indemnisation des actionnaires (avec une prime) et, dans l\'Union européenne, le contrôle des aides d\'État.' },
  ceder: { nom: 'Céder la participation', description: 'Vendre les actions de l\'État : la dette baisse, mais les dividendes et le pouvoir d\'influence disparaissent.' },
  action_specifique: { nom: 'Instituer une action spécifique', description: 'Une « golden share » donne un droit de veto sur la cession d\'actifs stratégiques, sans acheter le capital.' },
};
