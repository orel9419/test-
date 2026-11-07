import React, { useEffect, useRef, useState } from 'react';
import { partagerImage } from '../partage.js';

/** Fiches techniques affichées sous les modèles (sources publiques). */
const FICHES = {
  rafale: {
    titre: 'Rafale',
    lignes: ['Longueur 15,27 m · envergure 10,80 m · hauteur 5,34 m (ministère des Armées)', 'Deux réacteurs Safran M88 (7,5 t de poussée chacun avec postcombustion)', 'Vitesse maximale Mach 1,8 · 14 points d\'emport · 24,5 t au décollage au maximum', 'Versions : C (monoplace, armée de l\'Air et de l\'Espace), B (biplace), M (Marine)', 'Configuration affichée : 2 MICA, 2 Meteor, 2 réservoirs de 2 000 litres'],
  },
  snle: {
    titre: 'SNLE de la classe Le Triomphant',
    lignes: ['Longueur 138 m · diamètre 12,5 m · environ 14 000 t en plongée', '16 missiles balistiques M51 · propulsion nucléaire, hydrojet silencieux', 'Deux équipages (bleu et rouge) d\'environ 110 marins qui se relaient', 'Au moins un SNLE en patrouille en permanence depuis 1972'],
  },
  snle3g: {
    titre: 'SNLE de 3e génération (L\'Invincible)',
    lignes: ['Construction lancée le 20 mars 2024 à Cherbourg (Naval Group) · premier en service vers 2035', 'Quatre sous-marins prévus, environ un tous les cinq ans · 16 missiles M51', 'Le plus grand sous-marin jamais construit en France', 'Environ 150 m et 15 000 t en plongée, une centaine de marins (sources ouvertes, non confirmées officiellement) · nom du premier annoncé le 2 mars 2026', 'D\'après une image de présentation : kiosque avancé à congé de raccordement, trappes au ras du pont, antenne latérale, gouvernes en X et aileron du sonar remorqué, hydrojet ; les plans définitifs ne sont pas publics'],
  },
  porteAvions: {
    titre: 'Porte-avions « France Libre »',
    lignes: ['310 m · 78 000 t · 2 réacteurs nucléaires de 220 MW · 27 nœuds (50 km/h)', 'Environ 2 000 marins · mise en service prévue en 2038 · durée de vie estimée : 45 ans', 'Groupe aérien : jusqu\'à 30 avions de combat, 2 avions de guet aérien, 6 hélicoptères, des drones', '9e porte-avions français · construit à Saint-Nazaire (Chantiers de l\'Atlantique, avec Naval Group) · source : Marine nationale'],
  },
  charlesDeGaulle: {
    titre: 'Porte-avions « Charles-de-Gaulle »',
    lignes: ['261,5 m de long · 64,4 m de large · mis en service en mai 2001 · port d\'attache : base navale de Toulon', '2 réacteurs nucléaires et 2 groupes turbo-réducteurs : 61 MW (83 000 ch) · 27 nœuds (50 km/h)', 'Équipage : 1 900 marins · 40 aéronefs, dont 24 Rafale Marine · 2 catapultes de 75 m', '8e porte-avions français · seul bâtiment de combat de surface à propulsion nucléaire en Europe · source : Marine nationale'],
  },
  mirage2000: {
    titre: 'Mirage 2000-5F',
    lignes: ['Avion de défense aérienne de Dassault Aviation · longueur 14,36 m · envergure 9,13 m · hauteur 5,20 m', 'Réacteur M53-P2 (95 kN avec postcombustion) · Mach 2,2 · aile delta à commandes de vol électriques, sans plans canard mobiles', 'Version -5 : radar RDY et missiles MICA ; la France a livré des Mirage 2000-5F à l\'Ukraine à partir de février 2025', 'Configuration affichée : 2 réservoirs de 1 700 litres et 2 MICA, camouflage deux tons de gris'],
  },
  phenix: {
    titre: 'Airbus A330 MRTT « Phénix »',
    lignes: ['Ravitailleur et avion de transport stratégique : 58,80 m de long, 60,30 m d\'envergure, 17,40 m de haut (Airbus)', 'Jusqu\'à 110 t de carburant dans les ailes : il ravitaille deux chasseurs à la fois (tuyaux et paniers) ou un avion lourd par sa perche rigide', 'Transport de troupes et évacuation sanitaire (jusqu\'à 272 passagers ou des blessés couchés) · deux pilotes', '15 Phénix prévus en 2028, en remplacement des C-135 · 31e escadre aérienne de ravitaillement et de transport stratégiques (Istres) · sources : ministère des Armées, Airbus'],
  },
  caiman: {
    titre: 'NH90 Caïman (armée de Terre)',
    lignes: ['Hélicoptère de manœuvre : fuselage de 16,13 m, rotor de 16,30 m, environ 5,3 m de haut (Airbus, NHIndustries)', 'Deux pilotes et jusqu\'à 20 soldats, porte coulissante de chaque côté, rampe arrière', 'Environ 64 Caïman standard 1 livrés à l\'armée de Terre, le dernier début 2025', 'Camouflage centre-Europe · bouton : livrée forces spéciales · descente en corde lisse'],
  },
  caimanFS: {
    titre: 'NH90 Caïman standard 2 (forces spéciales)',
    lignes: ['Version du 4e régiment d\'hélicoptères des forces spéciales (Pau) : 18 commandés, le premier livré le 30 juillet 2026, le dernier vers le printemps 2029', 'Boule optronique Safran Euroflir 410 (jour, nuit, désignation laser), mitrailleuses de sabord, équipements de vol de nuit', 'Remplace les Caracal et les Cougar des forces spéciales', 'Livrée sombre unie : couleur exacte non confirmée par une source · bouton : livrée armée de Terre'],
  },
  caimanMarine: {
    titre: 'NH90 Caïman Marine (NFH)',
    lignes: ['Hélicoptère de frégate de la Marine nationale : 27 en service, flottilles 31F (Hyères) et 33F (Lanvéoc-Poulmic), en service depuis décembre 2011 (remplace les Lynx et les Super Frelon)', 'Lutte anti-sous-marine (sonar trempé FLASH, bouées acoustiques, torpilles MU90 : capacité opérationnelle en mars 2015), lutte contre les navires, sauvetage en mer', 'Radar de surveillance sous le nez, boule optronique, treuil, flotteurs de secours pour se poser sur l\'eau en cas d\'urgence', 'Livrée gris deux tons, cocarde de l\'aéronavale avec son ancre, rotor de queue à bouts rouges · d\'après une photo · sources : ministère des Armées (fiche LPM), Naval News'],
  },
  tigre: {
    titre: 'Tigre (hélicoptère d\'appui et de destruction)',
    lignes: ['14,08 m de long, rotor de 13 m, 3,83 m de haut · deux pilotes en tandem (le pilote derrière, le tireur devant)', 'Canon de 30 mm en tourelle, roquettes de 68 mm, missiles ; viseur de toit pour observer caché derrière un relief', 'Rénovation au standard 3 prévue pour 42 Tigre français (avec 18 espagnols) : combat collaboratif SCORPION, liaison avec les drones', 'Livrée de la photo (un Tigre australien, sable, vert et noir) ou vert olive · détails simplifiés'],
  },
  puma: {
    titre: 'SA330 Puma',
    lignes: ['Hélicoptère de manœuvre conçu par Sud-Aviation, en service en France depuis le début des années 1970', 'Deux turbines Turmo, rotor à quatre pales d\'environ 15 m, 16 à 20 soldats', 'En retrait progressif : remplacé par le Caïman dans l\'armée de Terre et par le Caracal dans l\'armée de l\'Air et de l\'Espace (Guyane en 2026, Nouvelle-Calédonie)', 'Camouflage vert, brun et noir de l\'armée de Terre · dimensions approximatives'],
  },
  caracal: {
    titre: 'H225M Caracal',
    lignes: ['Hélicoptère de transport et de recherche et sauvetage au combat : rotor à cinq pales de 16,20 m (Airbus)', 'Ravitaillable en vol grâce à sa perche, grands réservoirs dans les sponsons : plusieurs heures d\'autonomie', 'Armée de l\'Air et de l\'Espace et forces spéciales ; huit Caracal commandés en 2021 pour remplacer des Puma, le dernier livré en juin 2026', 'Livrée gris bleuté · porte ouverte avec deux tireurs de sabord, comme sur la photo'],
  },
  caesar: {
    titre: 'Canon Caesar MkII',
    lignes: ['Camion équipé d\'un système d\'artillerie : canon de 155 mm (52 calibres) sur châssis 6×6 Arquus, cabine blindée à quatre portes, moteur de 460 ch', 'Portée d\'environ 40 km (plus de 50 km avec des obus à propulsion additionnelle) · 6 coups par minute · 18 coups à bord', 'Mise en batterie en moins d\'une minute : il tire puis repart avant la riposte · 5 artilleurs · transportable par A400M', '109 Caesar MkII commandés par la France en 2024, premières livraisons en 2026 · livrée brune du rendu KNDS (bouton : camouflage) · sources : KNDS, ministère des Armées'],
  },
  griffon: {
    titre: 'Véhicule blindé multirôle Griffon',
    lignes: ['6×6 du programme SCORPION (KNDS, Arquus, Thales) · environ 24 t · remplace le VAB', 'Équipage de 3 et 8 fantassins · tourelleau téléopéré (mitrailleuse de 12,7 mm ou lance-grenades), détecteur de tirs, lance-pots fumigènes', 'Partage environ 70 % de ses composants avec le Jaguar · 1 437 en service prévus en 2030 (loi de programmation militaire)', 'Livrée sable (bouton : camouflage centre-Europe) · proportions approximatives, détails simplifiés'],
  },
  jaguar: {
    titre: 'Engin blindé de reconnaissance et de combat Jaguar',
    lignes: ['6×6 du programme SCORPION · 25 t · 7,8 m canon compris (châssis 7,1 m) · 2,99 m de large · 2,8 m de haut', 'Canon de 40 mm à munitions télescopées (CTA) et deux missiles MMP (portée 4 000 m) sur un lanceur escamotable', 'Équipage de 3 · remplace les AMX-10 RC, ERC-90 Sagaie et VAB HOT · 238 en service prévus en 2030', 'Livrée brune (bouton : camouflage centre-Europe) · sources : ministère des Armées (fiche LPM), détails simplifiés'],
  },
  patroller: {
    titre: 'Drone tactique Patroller (SDT)',
    lignes: ['Drone de renseignement de l\'armée de Terre (Safran), mis en œuvre par le 61e régiment d\'artillerie de Chaumont', 'Envergure 18 m · longueur 8,5 m · autonomie de l\'ordre de 20 heures · jusqu\'à 250 kg de capteurs', 'Boule optronique Euroflir sous le fuselage : observation de jour comme de nuit, désignation de cibles pour l\'artillerie', 'Dérivé d\'un motoplaneur (Stemme) · source : ministère des Armées (fiche LPM), Safran'],
  },
  satellite: {
    titre: 'Satellite d\'observation militaire (type CSO)',
    lignes: ['Composante spatiale optique : CSO-1 (2018), CSO-2 (2020) et CSO-3 (2025, lancé par Ariane 6)', 'Images à très haute résolution pour le renseignement et le ciblage, partagées avec des partenaires européens', 'Orbite basse (quelques centaines de kilomètres) : un passage au-dessus d\'un même point à intervalles réguliers', 'Silhouette indicative : télescope, panneaux solaires et antennes ; la forme exacte n\'est pas publique'],
  },
  elysee: {
    titre: 'Palais de l\'Élysée',
    lignes: ['Siège de la présidence de la République, rue du Faubourg-Saint-Honoré (Paris 8e)', 'Hôtel construit de 1718 à 1722 par Armand-Claude Mollet pour le comte d\'Évreux · cour d\'honneur devant, parc derrière', 'Le président accueille ses hôtes sur le perron, sous la marquise ; le Conseil des ministres s\'y réunit chaque semaine', 'Proportions approximatives, façades simplifiées'],
  },
  matignon: {
    titre: 'Hôtel de Matignon',
    lignes: ['Résidence et bureau du Premier ministre, rue de Varenne (Paris 7e)', 'Construit de 1722 à 1725 (architecte Jean Courtonne) · portail en hémicycle sur la rue, cour d\'honneur', 'Parc d\'environ 3 hectares dessiné en 1902 par Achille Duchêne : le plus grand jardin privé de Paris', 'Proportions approximatives, façades simplifiées'],
  },
  assemblee: {
    titre: 'Palais Bourbon (Assemblée nationale)',
    lignes: ['Siège de l\'Assemblée nationale (577 députés), face à la Seine et au pont de la Concorde', 'Façade sur la Seine de Bernard Poyet (1806-1810) : péristyle de douze colonnes corinthiennes sur un grand escalier, fronton', 'Statues de quatre grands serviteurs de l\'État au pied de l\'escalier (Sully, Colbert, L\'Hospital, d\'Aguesseau)', 'Proportions approximatives · bouton « Hémicycle » dans l\'écran Institutions : les sièges aux couleurs de votre partie'],
  },
  senat: {
    titre: 'Palais du Luxembourg (Sénat)',
    lignes: ['Siège du Sénat (348 sénateurs) depuis 1799, au bord du jardin du Luxembourg (Paris 6e)', 'Construit à partir de 1615 par Salomon de Brosse pour Marie de Médicis, sur le modèle du palais Pitti de Florence', 'Pavillon central à dôme, pavillons d\'angle, bossages à la florentine ; grand bassin octogonal dans le jardin', 'Proportions approximatives, façades simplifiées'],
  },
  hemicycleAN: {
    titre: 'Hémicycle de l\'Assemblée nationale',
    lignes: ['577 sièges aux couleurs des groupes de votre partie, de la gauche à la droite vue du « perchoir » (le fauteuil du président)', 'Au centre : la tribune des orateurs et, au premier rang, le banc du Gouvernement', 'Les places réelles dépendent du règlement et des groupes : la répartition affichée est schématique'],
  },
  hemicycleSenat: {
    titre: 'Hémicycle du Sénat',
    lignes: ['348 sièges aux couleurs des groupes de votre partie, de la gauche à la droite vue du fauteuil du président du Sénat', 'Hémicycle aménagé au XIXe siècle dans le palais du Luxembourg', 'Répartition schématique des places'],
  },
  leclerc: {
    titre: 'Char Leclerc rénové (XLR)',
    lignes: ['Char de combat de l\'armée de Terre, en service depuis 1992 · 9,87 m canon compris · 3,71 m de large · environ 57 t', 'Canon de 120 mm à chargement automatique : trois hommes d\'équipage au lieu de quatre · 72 km/h sur route', 'Rénovation XLR : intégration au combat collaboratif SCORPION, protection renforcée, tourelleau téléopéré ; 160 chars rénovés fin 2030, 200 fin 2035', 'Livrée sable (opérations extérieures) ou camouflage centre-Europe · silhouette fidèle, détails simplifiés'],
  },
};

const VUES = {
  rafale: { '3/4': [-13, 4.5, 15], Profil: [0, 1.2, 21], Dessus: [0, 27, 0.01], Face: [-20, 1.6, 0.01], Arrière: [13, 6, 15] },
  snle: { '3/4': [11, 6.5, 13], Profil: [0, 1.5, 19], Dessus: [0, 21, 0.01], Face: [-18, 2, 0.01] },
  snle3g: { '3/4': [-12, 8, -14], Profil: [0, 1.5, 20], Dessus: [0, 22, 0.01], Face: [-19, 2, 0.01], Arrière: [12, 6.5, 14] },
  porteAvions: { '3/4': [-11, 7.5, -13], Profil: [0, 2.5, -21], Dessus: [0, 24, -0.01], Face: [-20, 4, -0.01] },
  charlesDeGaulle: { '3/4': [-10, 7, -12], Profil: [0, 2.3, -19], Dessus: [0, 21, -0.01], Face: [-18, 3.5, -0.01] },
  leclerc: { '3/4': [-11, 5.5, 13], Profil: [0, 1, 18], Dessus: [0, 21, 0.01], Face: [-18, 1.5, 0.01] },
  mirage2000: { '3/4': [-13.5, 0.4, 13.5], Profil: [0, -0.2, 20], Dessus: [0, 26, 0.01], Dessous: [0.01, -14, 6], Face: [-19, 0.4, 0.01], Haut: [-13, 4, 15], Arrière: [13, 5.5, 14] },
  phenix: { '3/4': [-17, 7, 19], Profil: [0, 1.5, 27], 'Côté droit': [0, 1.5, -27], Dessus: [0, 32, 0.01], Dessous: [0.01, -26, 8], Face: [-27, 2, 0.01], Arrière: [18, 6, 18] },
  caiman: { '3/4': [-13, 5, 15], Profil: [0, 2, 20], Dessus: [0, 24, 0.01], Face: [-20, 2.5, 0.01], Arrière: [14, 6, 14] },
  caimanFS: { '3/4': [-13, 5, 15], Profil: [0, 2, 20], Dessus: [0, 24, 0.01], Face: [-20, 2.5, 0.01], Arrière: [14, 6, 14] },
  caimanMarine: { '3/4': [-13, 2, 15], Profil: [0, 1.2, 20], 'Côté droit': [0, 1.2, -20], Dessous: [0.01, -14, 6], Face: [-20, 1.5, 0.01], Arrière: [14, 6, 14] },
  tigre: { '3/4': [-12, 4.5, 13], Profil: [0, 1.5, 18], Dessus: [0, 21, 0.01], Face: [-18, 2, 0.01], Arrière: [13, 5, 13] },
  puma: { '3/4': [-12, 5, 14], Profil: [0, 2, 19], Dessus: [0, 22, 0.01], Face: [-19, 2.5, 0.01], Arrière: [13, 6, 13] },
  caracal: { '3/4': [-13, 5, 15], Profil: [0, 2, 20], Dessus: [0, 24, 0.01], Face: [-20, 2.5, 0.01], Arrière: [14, 6, 14] },
  caesar: { '3/4': [-12, 6, 13], Profil: [0, 1.5, 19], Dessus: [0, 22, 0.01], Face: [-19, 2, 0.01] },
  griffon: { '3/4': [-11, 5.5, 13], Profil: [0, 1.2, 18], Dessus: [0, 21, 0.01], Face: [-18, 1.8, 0.01] },
  jaguar: { '3/4': [-11, 5.5, 13], Profil: [0, 1.2, 18], Dessus: [0, 21, 0.01], Face: [-18, 1.8, 0.01] },
  patroller: { '3/4': [-11, 6, 14], Profil: [0, 0.5, 20], Dessus: [0, 23, 0.01], Face: [-20, 1, 0.01] },
  satellite: { '3/4': [-10, 5, 12], Profil: [0, 0.5, 17], Dessus: [0, 18, 0.01], Face: [-17, 0.5, 0.01] },
  elysee: { '3/4': [-11, 9, 15], Face: [0, 5, 20], Dessus: [0, 24, 0.01], Jardin: [0, 6, -20] },
  matignon: { '3/4': [-11, 9, 15], Face: [0, 5, 20], Dessus: [0, 26, 0.01], Jardin: [0, 7, -22] },
  assemblee: { '3/4': [-11, 8, 15], Face: [0, 4, 20], Dessus: [0, 24, 0.01], Côté: [-20, 6, 2] },
  senat: { '3/4': [-11, 8, 15], Face: [0, 4.5, 20], Dessus: [0, 25, 0.01], Cour: [0, 7, -20] },
  hemicycleAN: { Tribunes: [0, 9, -15], Perchoir: [0, 12.5, 12], Dessus: [0, 21, 0.01], Côté: [-17, 8, 3] },
  hemicycleSenat: { Tribunes: [0, 9, -15], Perchoir: [0, 12.5, 12], Dessus: [0, 21, 0.01], Côté: [-17, 8, 3] },
};
/** Recule la caméra sur les écrans étroits (téléphone en portrait) pour que l'appareil tienne dans le cadre. */
const recul = (aspect) => Math.max(1, 1.45 / Math.max(0.5, aspect));
/** Fichiers de modèles chargés à la demande (un par famille, pour ne télécharger que le nécessaire). */
const MODULES = {
  modeles: () => import('./modeles.js'),
  materiels: () => import('./materiels.js'),
  palais: () => import('./palais.js'),
  avions: () => import('./avions.js'),
  aeronefs: () => import('./aeronefs.js'),
};
const CONSTRUCTEURS = {
  rafale: ['modeles', 'construireRafale'], snle: ['modeles', 'construireSnle'], snle3g: ['modeles', 'construireSnle3G'],
  porteAvions: ['modeles', 'construirePorteAvions'], charlesDeGaulle: ['modeles', 'construireCharlesDeGaulle'], leclerc: ['modeles', 'construireLeclerc'],
  mirage2000: ['avions', 'construireMirage2000'], phenix: ['aeronefs', 'construirePhenix'],
  caiman: ['aeronefs', 'construireCaiman'], caimanFS: ['aeronefs', 'construireCaiman'], caimanMarine: ['aeronefs', 'construireCaiman'], tigre: ['aeronefs', 'construireTigre'], puma: ['aeronefs', 'construirePuma'], caracal: ['aeronefs', 'construireCaracal'], caesar: ['materiels', 'construireCaesar'], griffon: ['materiels', 'construireGriffon'], jaguar: ['materiels', 'construireJaguar'],
  patroller: ['materiels', 'construirePatroller'], satellite: ['materiels', 'construireSatellite'],
  elysee: ['palais', 'construireElysee'], matignon: ['palais', 'construireMatignon'], assemblee: ['palais', 'construireAssemblee'], senat: ['palais', 'construireSenat'],
  hemicycleAN: ['palais', 'construireHemicycle'], hemicycleSenat: ['palais', 'construireHemicycle'],
};
/** Modèles posés sur leur propre sol (palais, hémicycles) et modèles dans l'espace. */
const TERRAIN = new Set(['elysee', 'matignon', 'assemblee', 'senat', 'hemicycleAN', 'hemicycleSenat']);
const ESPACE = new Set(['satellite']);

/**
 * Visionneuse 3D interactive (three.js, chargé à la demande) : rotation au
 * doigt ou à la souris, vues prédéfinies, légendes, photo à partager ; options
 * propres à chaque modèle (biplace et train du Rafale, trappes et tir d'essai
 * des SNLE, catapultage depuis le porte-avions).
 */
export default function Visionneuse3D({ modele = 'rafale', hauteur = 360, donnees = null }) {
  const conteneur = useRef(null);
  const legendesRef = useRef(null);
  const api = useRef({});
  const [etat, setEtat] = useState('chargement'); // 'chargement' | 'pret' | 'indisponible'
  const [noms, setNoms] = useState([]);
  const [rotation, setRotation] = useState(true);
  const [legendes, setLegendes] = useState(false);
  const [trappes, setTrappes] = useState(false);
  const [biplace, setBiplace] = useState(false);
  const [train, setTrain] = useState(false);
  const [tourelle, setTourelle] = useState(false);
  const [livree, setLivree] = useState('sable');
  const [commandes, setCommandes] = useState([]);
  const [etats, setEtats] = useState({});
  const [message, setMessage] = useState(null);
  const sous = modele === 'snle' || modele === 'snle3g';
  const navire = modele === 'porteAvions' || modele === 'charlesDeGaulle';
  const terrain = TERRAIN.has(modele);
  const espace = ESPACE.has(modele);
  const cleDonnees = donnees ? JSON.stringify(donnees) : '';

  useEffect(() => {
    let annule = false;
    let nettoyer = () => {};
    (async () => {
      try {
        const c = document.createElement('canvas');
        if (!(c.getContext('webgl2') || c.getContext('webgl'))) throw new Error('WebGL');
      } catch { setEtat('indisponible'); return; }
      const [THREE, { OrbitControls }, { RoomEnvironment }, modeles] = await Promise.all([
        import('three'),
        import('three/examples/jsm/controls/OrbitControls.js'),
        import('three/examples/jsm/environments/RoomEnvironment.js'),
        MODULES[CONSTRUCTEURS[modele][0]](),
      ]);
      if (annule || !conteneur.current) return;
      const el = conteneur.current;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, terrain ? 400 : 600);
      if (sous) scene.fog = new THREE.Fog(0x0d2a48, 18, 60);
      if (navire) scene.fog = new THREE.Fog(0xc9dcec, 120, 420);
      if (terrain) scene.fog = new THREE.Fog(0xdfe6ee, 38, 110);

      scene.add(new THREE.HemisphereLight(sous ? 0x9fc6ff : 0xeaf2ff, sous ? 0x0a1a2c : espace ? 0x10141c : 0x6b6f75, sous ? 1.0 : espace ? 0.35 : 0.75));
      const soleil = new THREE.DirectionalLight(0xffffff, sous ? 1.5 : espace ? 3 : 2.2);
      soleil.position.set(6, 14, 8);
      soleil.castShadow = true;
      soleil.shadow.mapSize.set(2048, 2048);
      const borne = navire ? 14 : terrain ? 16 : 12;
      Object.assign(soleil.shadow.camera, { left: -borne, right: borne, top: borne, bottom: -borne, near: 1, far: 60 });
      scene.add(soleil);
      const contre = new THREE.DirectionalLight(0xbfd4ff, 0.6);
      contre.position.set(-8, 4, -10);
      scene.add(contre);

      const objet = modeles[CONSTRUCTEURS[modele][1]](THREE, { modele, donnees });
      scene.add(objet);
      if (!navire && !terrain && !espace) {
        // Ombre portée douce sous l'appareil (sol invisible)
        const sol = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: sous ? 0.25 : 0.18 }));
        sol.rotation.x = -Math.PI / 2;
        sol.position.y = sous ? -1.6 : -2.2;
        sol.receiveShadow = true;
        scene.add(sol);
      }

      const controles = new OrbitControls(camera, renderer.domElement);
      controles.enableDamping = true;
      controles.enablePan = false;
      controles.minDistance = 6;
      controles.maxDistance = 60;
      controles.autoRotate = true;
      controles.autoRotateSpeed = 0.9;
      if (navire || terrain) controles.maxPolarAngle = Math.PI / 2 - 0.06; // ne pas passer sous la mer ni sous le sol
      if (terrain) controles.maxDistance = 45;
      controles.target.set(0, sous ? 0.3 : 0.2, 0);
      const placer = (nom) => {
        const k = recul(camera.aspect);
        const [x, y, z] = VUES[modele][nom];
        camera.position.set(x * k, y * k, z * k);
        controles.update();
      };
      const taille = () => {
        const l = el.clientWidth || 600;
        renderer.setSize(l, hauteur);
        camera.aspect = l / hauteur;
        camera.updateProjectionMatrix();
      };
      taille();
      placer(Object.keys(VUES[modele])[0]);
      const ro = new ResizeObserver(taille);
      ro.observe(el);

      // Animations : trappes et missile (SNLE), catapultage (porte-avions), légendes
      const trappesObj = objet.userData.trappes ?? [];
      const missile = objet.userData.missile;
      const cat = objet.userData.catapulte;
      let tir = null;
      let lancement = null;
      const v = new THREE.Vector3();
      let boucle = 0;
      let visible = true;
      const io = new IntersectionObserver(([x]) => { visible = x.isIntersecting; }, { threshold: 0.05 });
      io.observe(el);
      const animer = (t) => {
        boucle = requestAnimationFrame(animer);
        if (!visible) return;
        const cible = api.current.trappes ? 1.75 : 0;
        for (const tr of trappesObj) {
          tr.userData.angle += (cible - tr.userData.angle) * 0.08;
          tr.rotation.x = tr.userData.cote * tr.userData.angle;
        }
        if (missile) {
          if (api.current.tir && !tir) { tir = t; missile.visible = true; api.current.tir = false; }
          if (tir) {
            const d = (t - tir) / 1000;
            missile.position.y = objet.userData.dessusDos - 1.2 + d * d * 1.6;
            if (d > 4.5) { tir = null; missile.visible = false; missile.position.y = objet.userData.dessusDos - 1.2; }
          }
        }
        if (cat) {
          // Catapulte électromagnétique : environ 3,8 g pendant 2,2 s, puis montée
          if (api.current.lancer && !lancement) { lancement = t; api.current.lancer = false; }
          if (lancement) {
            const d = (t - lancement) / 1000;
            const a = 37, tc = 2.2;
            const av = cat.avion;
            if (d < tc) { av.position.x = cat.x0 - 0.5 * a * d * d; av.position.y = cat.y0; av.rotation.z = 0; }
            else {
              const u = d - tc;
              av.position.x = cat.x0 - 0.5 * a * tc * tc - a * tc * u;
              av.position.y = cat.y0 + 6 * u * u + 4 * u;
              av.rotation.z = -Math.min(0.25, u * 0.2);
            }
            if (d > 6) { lancement = null; av.position.set(cat.x0, cat.y0, av.position.z); av.rotation.z = 0; }
          }
        }
        objet.userData.animer?.(t, api.current);
        controles.update();
        renderer.render(scene, camera);
        const conteneurLegendes = legendesRef.current;
        if (conteneurLegendes) {
          const l = el.clientWidth;
          [...conteneurLegendes.children].forEach((n, i) => {
            const p = objet.userData.legendes[i];
            if (!p) return;
            v.copy(p.point).applyMatrix4(objet.matrixWorld).project(camera);
            const montrer = api.current.legendes && v.z < 1;
            n.style.display = montrer ? 'block' : 'none';
            n.style.transform = `translate(${(v.x * 0.5 + 0.5) * l}px, ${(-v.y * 0.5 + 0.5) * hauteur}px)`;
          });
        }
      };
      boucle = requestAnimationFrame(animer);

      api.current = {
        ...api.current,
        legendes: false,
        rotation: (on) => { controles.autoRotate = on; },
        vue: placer,
        basculer: objet.userData.basculer ?? {},
        photo: () => renderer.domElement.toDataURL('image/png'),
      };
      for (const c of objet.userData.commandes ?? []) api.current[c.id] = false;
      setNoms(objet.userData.legendes.map((l) => l.texte));
      setCommandes(objet.userData.commandes ?? []);
      setEtats({});
      setEtat('pret');

      nettoyer = () => {
        cancelAnimationFrame(boucle);
        ro.disconnect();
        io.disconnect();
        controles.dispose();
        scene.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.map?.dispose(); m.dispose(); });
        });
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })().catch(() => setEtat('indisponible'));
    return () => { annule = true; nettoyer(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modele, hauteur, sous, navire, cleDonnees]);

  const fiche = FICHES[modele];
  const photo = async () => {
    const url = api.current.photo?.();
    if (!url) return;
    setMessage(await partagerImage(url, `${modele}-chef-de-gouvernement.png`, `${fiche.titre} en 3D, dans le jeu « Chef de gouvernement »`));
  };
  return (
    <figure className={`visionneuse visionneuse-${modele}`}>
      <div className="visionneuse-scene" ref={conteneur} style={{ height: hauteur }}>
        {etat === 'chargement' && <div className="visionneuse-attente">Chargement du modèle 3D…</div>}
        {etat === 'indisponible' && <div className="visionneuse-attente">La 3D n'est pas disponible sur cet appareil (WebGL désactivé).</div>}
        <div className="visionneuse-legendes" ref={legendesRef} aria-hidden="true">
          {noms.map((t) => <span key={t} className="legende-3d">{t}</span>)}
        </div>
      </div>
      {etat === 'pret' && (
        <div className="visionneuse-commandes">
          {Object.keys(VUES[modele]).map((n) => <button key={n} type="button" className="puce" onClick={() => api.current.vue?.(n)}>{n}</button>)}
          <button type="button" className={`puce ${rotation ? 'active' : ''}`} aria-pressed={rotation} onClick={() => { api.current.rotation?.(!rotation); setRotation(!rotation); }}>⟳ Rotation</button>
          <button type="button" className={`puce ${legendes ? 'active' : ''}`} aria-pressed={legendes} onClick={() => { api.current.legendes = !legendes; setLegendes(!legendes); }}>Légendes</button>
          {modele === 'rafale' && <button type="button" className={`puce ${biplace ? 'active' : ''}`} aria-pressed={biplace} onClick={() => { api.current.basculer.biplace?.(!biplace); setBiplace(!biplace); }}>{biplace ? 'Biplace (B)' : 'Monoplace (C)'}</button>}
          {modele === 'rafale' && <button type="button" className={`puce ${train ? 'active' : ''}`} aria-pressed={train} onClick={() => { api.current.basculer.train?.(!train); setTrain(!train); }}>{train ? 'Train sorti' : 'Sortir le train'}</button>}
          {sous && <button type="button" className={`puce ${trappes ? 'active' : ''}`} aria-pressed={trappes} onClick={() => { api.current.trappes = !trappes; setTrappes(!trappes); }}>{trappes ? 'Fermer les trappes' : 'Ouvrir les trappes'}</button>}
          {sous && <button type="button" className="puce" disabled={!trappes} onClick={() => { api.current.tir = true; }} title={trappes ? '' : 'Ouvrez d\'abord les trappes'}>🚀 Tir d'essai (simulation)</button>}
          {navire && <button type="button" className="puce" onClick={() => { api.current.lancer = true; }}>🛫 Catapulter un Rafale</button>}
          {modele === 'leclerc' && <button type="button" className={`puce ${tourelle ? 'active' : ''}`} aria-pressed={tourelle} onClick={() => { api.current.tourelle = !tourelle; setTourelle(!tourelle); }}>{tourelle ? 'Tourelle en veille' : 'Faire pivoter la tourelle'}</button>}
          {commandes.map((c) => (c.type === 'action'
            ? <button key={c.id} type="button" className="puce" disabled={c.requiert && !etats[c.requiert]} title={c.requiert && !etats[c.requiert] ? c.aide : ''} onClick={() => { api.current[c.id] = true; }}>{c.libelle}</button>
            : <button key={c.id} type="button" className={`puce ${etats[c.id] ? 'active' : ''}`} aria-pressed={!!etats[c.id]} onClick={() => { const v = !etats[c.id]; api.current[c.id] = v; setEtats({ ...etats, [c.id]: v }); }}>{etats[c.id] ? c.actif : c.libelle}</button>))}
          {modele === 'leclerc' && <button type="button" className="puce" onClick={() => { const l = livree === 'sable' ? 'centreEurope' : 'sable'; api.current.livree = l; setLivree(l); }}>{livree === 'sable' ? 'Livrée : sable' : 'Livrée : centre-Europe'}</button>}
          <button type="button" className="puce" onClick={photo}>📸 Photo</button>
        </div>
      )}
      <figcaption className="petit">
        <strong>{fiche.titre}</strong> <span className="tres-petit muet">· faites tourner le modèle au doigt ou à la souris, zoomez en pinçant</span>
        <ul className="tres-petit muet" style={{ margin: '0.2rem 0 0', paddingLeft: '1rem' }}>{fiche.lignes.map((l) => <li key={l}>{l}</li>)}</ul>
        {message && <span className="tres-petit" role="status">{message}</span>}
      </figcaption>
    </figure>
  );
}
