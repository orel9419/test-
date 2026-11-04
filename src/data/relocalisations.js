/**
 * « Produire en France » : demandes de l'État aux grands groupes (France).
 *
 * Contexte : faits publics, sourcés quand ils sont précis. Montants
 * d'investissement, délais, emplois et probabilités d'accord : hypothèses de
 * jeu. L'État ne peut pas imposer à une entreprise privée où produire : il
 * négocie, aide, commande ou fait pression.
 */

export const SOURCES_RELOCALISATION = {
  opella: { titre: 'Le Journal des entreprises : entre Sanofi, CD&R et Bpifrance, la vente du Doliprane', url: 'https://www.lejournaldesentreprises.com/article/entre-sanofi-cd-r-et-bpifrance-la-vente-du-doliprane-fait-menage-trois-2105786' },
  doliprane: { titre: 'Franceinfo : « Il reste produit en France », le fabricant du Doliprane veut rassurer', url: 'https://www.franceinfo.fr/sante/medicament/reportage-il-reste-produit-en-france-desormais-a-moitie-americain-le-fabricant-du-doliprane-veut-rassurer-sur-la-production-du-medicament_7325916.html' },
  paracetamol: { titre: 'Europe 1 : la production de la molécule du Doliprane va être relocalisée en France', url: 'https://www.europe1.fr/economie/doliprane-100-francais-la-production-de-la-molecule-du-medicament-va-etre-relocalisee-en-france-883005' },
};

/**
 * Dossiers. `investissement` (Md€, à la charge de l'entreprise), `delai`
 * (trimestres de chantier), `emplois` (milliers), `base` (chances d'accord
 * par la seule persuasion), `achatPublic` (une commande publique a du sens).
 */
export const DOSSIERS = [
  {
    id: 'doliprane', entreprise: 'sanofi', icone: '💊', titre: 'Doliprane : produire aussi le paracétamol en France',
    contexte: 'Le Doliprane est fabriqué à Lisieux et à Compiègne par Opella, l\'ancienne branche santé grand public de Sanofi, détenue depuis 2025 par le fonds américain CD&R (50 %), Sanofi (48,2 %) et Bpifrance (1,8 %). Un accord avec l\'État garantit le maintien de la production en France, avec une pénalité pouvant atteindre 40 M€. Mais la molécule, le paracétamol, vient surtout d\'Asie ; une production doit démarrer à Roussillon (Isère) chez Seqens, pour environ 20 % des besoins à partir de fin 2026.',
    demande: 'Produire en France l\'essentiel du paracétamol du Doliprane, pas seulement la mise en boîte.',
    investissement: 0.15, delai: 4, emplois: 0.3, base: 0.5, achatPublic: true,
    effets: { souverainete: 4, opinion: { retraites: 1, salaries: 1 } }, resilience: 'medicaments',
    sources: ['opella', 'doliprane', 'paracetamol'],
  },
  {
    id: 'medicaments_essentiels', entreprise: 'sanofi', icone: '🧪', titre: 'Médicaments essentiels en pénurie',
    contexte: 'Pénuries d\'antibiotiques pour enfants en 2022-2023 ; une liste d\'environ 450 médicaments essentiels a été publiée en 2023. Beaucoup de principes actifs sont fabriqués en Chine et en Inde.',
    demande: 'Fabriquer en France plusieurs médicaments essentiels régulièrement en tension (antibiotiques, anticancéreux).',
    investissement: 0.5, delai: 8, emplois: 0.6, base: 0.3, achatPublic: true,
    effets: { souverainete: 4, opinion: { retraites: 1 } }, resilience: 'medicaments',
  },
  {
    id: 'twingo', entreprise: 'renault', icone: '🚗', titre: 'Assembler la petite voiture électrique en France',
    contexte: 'La Renault 5 électrique est produite à Douai ; la future Twingo électrique doit l\'être en Slovénie, où le coût de production est plus bas.',
    demande: 'Produire la Twingo électrique dans une usine française.',
    investissement: 0.4, delai: 8, emplois: 1.5, base: 0.15,
    effets: { souverainete: 2, opinion: { salaries: 1.5 } },
  },
  {
    id: 'batteries', entreprise: 'stellantis', icone: '🔋', titre: 'Batteries : agrandir la gigafactory du Pas-de-Calais',
    contexte: 'La gigafactory ACC (Stellantis, Mercedes-Benz, TotalEnergies) produit des batteries à Billy-Berclau et Douvrin depuis 2023 ; ses autres projets en Europe ont été ralentis.',
    demande: 'Lancer en France la deuxième tranche de production de batteries.',
    investissement: 1.0, delai: 8, emplois: 1.0, base: 0.3,
    effets: { souverainete: 3, opinion: { salaries: 1 } }, resilience: 'batteries',
  },
  {
    id: 'puces', entreprise: 'stmicro', icone: '🔬', titre: 'Puces électroniques : agrandir l\'usine de Crolles',
    contexte: 'L\'Europe produit environ un dixième des puces mondiales ; l\'usine de STMicroelectronics à Crolles (Isère) est l\'une des plus importantes du continent.',
    demande: 'Investir pour agrandir l\'usine de Crolles.',
    investissement: 2.0, delai: 12, emplois: 1.0, base: 0.3,
    effets: { souverainete: 5 }, resilience: 'puces',
  },
  {
    id: 'transformateurs', entreprise: 'schneider', icone: '⚡', titre: 'Transformateurs électriques',
    contexte: 'L\'électrification et les centres de données provoquent une pénurie mondiale de transformateurs : les délais de livraison se comptent en années.',
    demande: 'Produire davantage de transformateurs en France pour le réseau électrique.',
    investissement: 0.2, delai: 6, emplois: 0.4, base: 0.45, achatPublic: true,
    effets: { souverainete: 2 },
  },
  {
    id: 'munitions', entreprise: 'thales', icone: '🎯', titre: 'Munitions et roquettes',
    contexte: 'La guerre en Ukraine a révélé la faiblesse des stocks européens de munitions ; une partie de la production de Thales se fait hors de France, en Belgique notamment.',
    demande: 'Produire en France une nouvelle ligne de munitions et de roquettes.',
    investissement: 0.3, delai: 6, emplois: 0.4, base: 0.45, achatPublic: true,
    effets: { souverainete: 3 }, resilience: 'munitions',
  },
  {
    id: 'moteurs_rafale', entreprise: 'safran', icone: '✈️', titre: 'Moteurs du Rafale',
    contexte: 'Avec plus de 200 Rafale à livrer, l\'export dépend de la cadence de production des moteurs M88.',
    demande: 'Doubler la cadence de production des moteurs M88 en France.',
    investissement: 0.2, delai: 6, emplois: 0.5, base: 0.55, achatPublic: true,
    effets: { souverainete: 2 },
  },
  {
    id: 'hydrogene', entreprise: 'air_liquide', icone: '🫧', titre: 'Électrolyseurs pour l\'hydrogène',
    contexte: 'Air Liquide et Siemens Energy fabriquent des électrolyseurs à Berlin.',
    demande: 'Ouvrir une usine d\'électrolyseurs en France.',
    investissement: 0.3, delai: 8, emplois: 0.3, base: 0.35,
    effets: { souverainete: 2 },
  },
  {
    id: 'cloud', entreprise: 'dassault_systemes', icone: '☁️', titre: 'Cloud souverain pour les données de santé',
    contexte: 'Les données du Health Data Hub sont hébergées par Microsoft ; leur transfert vers un hébergeur européen est un engagement ancien.',
    demande: 'Héberger en France, sur un cloud qualifié « SecNumCloud », les données de santé et des administrations.',
    investissement: 0.3, delai: 6, emplois: 0.3, base: 0.5, achatPublic: true,
    effets: { souverainete: 4 }, resilience: 'cloud',
  },
  {
    id: 'maroquinerie', entreprise: 'hermes', icone: '👜', titre: 'Ateliers de maroquinerie dans les territoires',
    contexte: 'Hermès ouvre régulièrement de nouveaux ateliers en France, souvent dans des villes moyennes.',
    demande: 'Ouvrir de nouveaux ateliers dans des bassins d\'emploi en difficulté.',
    investissement: 0.1, delai: 4, emplois: 0.5, base: 0.6,
    effets: { opinion: { salaries: 1 } },
  },
  {
    id: 'solaire', entreprise: 'totalenergies', icone: '☀️', titre: 'Panneaux solaires',
    contexte: 'La Chine fabrique plus de 80 % des panneaux solaires du monde, à des prix que l\'Europe ne peut égaler.',
    demande: 'Produire des panneaux solaires en France pour les centrales de TotalEnergies.',
    investissement: 0.5, delai: 8, emplois: 0.6, base: 0.2,
    effets: { souverainete: 3 },
  },
  {
    id: 'pneus', entreprise: 'michelin', icone: '🛞', titre: 'Pneumatiques',
    contexte: 'Michelin a annoncé en novembre 2024 la fermeture de ses usines de Cholet et de Vannes, face à la concurrence asiatique.',
    demande: 'Maintenir une production de pneus pour véhicules légers en France.',
    investissement: 0.15, delai: 4, emplois: 0.6, base: 0.25,
    effets: { opinion: { salaries: 1.5 } },
  },
];

/** Leviers de l'État. `bonus` : chances en plus ; coûts publics en Md€. */
export const LEVIERS = {
  persuasion: { nom: 'Convaincre', aide: 'Rencontre à l\'Élysée, label « Fabriqué en France », visibilité. Gratuit, mais ne suffit pas toujours.', bonus: 0 },
  aide: { nom: 'Aide publique (30 % de l\'investissement)', aide: 'Subvention ou avance remboursable, compatible avec les règles européennes des aides d\'État pour les secteurs stratégiques.', bonus: 0.35 },
  commande: { nom: 'Commande publique sur 5 ans', aide: 'L\'État ou l\'Assurance maladie s\'engage à acheter une partie de la production (stocks stratégiques, marchés publics), un peu plus cher qu\'à l\'import.', bonus: 0.25 },
  contrainte: { nom: 'Faire pression', aide: 'Conditionner les aides et les marchés publics, menacer publiquement. Populaire, mais refroidit les investisseurs.', bonus: 0.15 },
};

/** Pénuries d'approvisionnement (injectées par le moteur, jamais tirées au hasard par le moteur des événements). */
const jamais = () => false;
const protege = (e, r) => !!e.relocalisation?.resilience?.[r];
export const PENURIES = [
  {
    id: 'penurie_medicaments', pays: ['france'], condition: jamais, probabilite: () => 0, geopolitique: true, resilience: 'medicaments',
    titre: 'Pénurie de médicaments : paracétamol et antibiotiques',
    description: (e) => (protege(e, 'medicaments')
      ? 'Tensions sur les exportations de principes actifs en Asie. Grâce à la production relocalisée, les pharmacies françaises restent approvisionnées.'
      : 'Les exportations de principes actifs depuis l\'Asie se tarissent : paracétamol et antibiotiques manquent en pharmacie.'),
    choix: [
      { id: 'rationner', texte: 'Rationner et puiser dans les stocks', effets: (e) => (protege(e, 'medicaments') ? { influence: 1, opinion: { retraites: 1 }, texte: 'La France peut même dépanner ses voisins : la relocalisation paie.' } : { chocs: { retraites: -3, salaries: -2 }, depensesExceptionnelles: 0.1, texte: 'Les ventes sont limitées à deux boîtes par personne ; la colère monte dans les familles.' }) },
      { id: 'importer', texte: 'Acheter en urgence, à n\'importe quel prix', effets: (e) => (protege(e, 'medicaments') ? { depensesExceptionnelles: 0.05, texte: 'Quelques achats complémentaires suffisent.' } : { depensesExceptionnelles: 0.4, chocs: { retraites: -1 }, texte: 'Des stocks arrivent à prix d\'or, avec des semaines de retard.' }) },
    ],
  },
  {
    id: 'penurie_puces', pays: ['france'], condition: jamais, probabilite: () => 0, geopolitique: true, resilience: 'puces',
    titre: 'Pénurie de puces électroniques',
    description: (e) => (protege(e, 'puces')
      ? 'Des restrictions d\'exportation en Asie perturbent l\'industrie mondiale ; l\'usine agrandie de Crolles limite les dégâts en France.'
      : 'Des restrictions d\'exportation en Asie privent les usines automobiles et aéronautiques de composants : des chaînes s\'arrêtent.'),
    choix: [
      { id: 'priorites', texte: 'Donner la priorité à la défense et à la santé', effets: (e) => (protege(e, 'puces') ? { souverainete: 1, texte: 'L\'approvisionnement des secteurs critiques est assuré.' } : { chocPIB: -0.08, souverainete: -1, texte: 'L\'automobile met des salariés au chômage partiel.' }) },
      { id: 'europe', texte: 'Négocier un achat groupé européen', effets: (e) => (protege(e, 'puces') ? { relations: { ue: 2 }, texte: 'La France apporte sa production à l\'effort européen.' } : { chocPIB: -0.05, relations: { ue: 1 }, texte: 'Les livraisons reprennent lentement.' }) },
    ],
  },
];
