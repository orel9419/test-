/* Modèles commerciaux, données contractuelles, benchmark et marchés. */
window.KBI = window.KBI || {};

/* ═══════════ MODULE 3 : MODÈLES COMMERCIAUX ═══════════ */
KBI.piliers = {
  conception: "Conception et développement",
  lancement: "Lancement commercial",
  prix: "Politique tarifaire",
  distribution: "Distribution et commercialisation"
};

KBI.modeles = [
  { id: "knds-fr", n: "KNDS France", ref: true,
    conception: { faits: ["Développement financé pour l'essentiel par la DGA dans le cadre de programmes d'armement (SCORPION, CAESAR Mk II), puis décliné à l'export.", "Cotraitance organisée en groupements : EBMR avec Arquus et Thales, CTA International avec BAE Systems, RAPIDFire avec Thales, munitions téléopérées avec Delair et EOS Technologie.", "Autofinancement de démonstrateurs pour peser sur les choix à venir : ASCALON, Leclerc Évolution, CAPINT, LORAS."],
      analyse: "Modèle de maître d'œuvre d'État : risque de développement faible, mais calendrier et spécifications dictés par le client national. Le cycle long (douze ans entre le marché EBMR et la moitié des livraisons) contraste avec les itérations de quelques mois observées en Ukraine.", src: ["senat_scorpion", "knds_capint", "fob_mataris"] },
    lancement: { faits: ["Eurosatory, organisé à domicile, sert de scène principale : CAPINT, LORAS, TARGAS et la munition téléopérée terrestre y ont été dévoilés en juin 2026.", "L'emploi au combat tient lieu de démonstration : CAESAR en Irak puis en Ukraine, VBCI et Griffon au Sahel.", "Les exercices de l'OTAN servent de vitrine : premiers CAESAR Mk II montrés en Estonie en mai 2026.", "Signature de contrats mise en scène pendant le salon, avec le ministère des Armées (Malaisie, 16 juin 2026)."],
      analyse: "L'argument « éprouvé au combat » est l'actif commercial le plus fort du CAESAR. Les produits sans emploi opérationnel (VBCI export, robots, TARGAS) n'en bénéficient pas et doivent être portés par des expérimentations chez le client.", src: ["knds_esy", "minarm_malaisie", "meta_caesar2"] },
    prix: { faits: ["Aucun tarif public. Les seuls repères sont les valeurs de contrats : 109 CAESAR Mk II pour environ 350 M€, soit un peu plus de 3 M€ par système.", "Le financement par la France de 12 CAESAR pour l'Ukraine, annoncé en janvier 2024, représente 50 M€, soit environ 4 M€ par pièce.", "Les contrats export incluent presque toujours formation, munitions, rechanges et part locale : le CAESAR 8x8 tchèque ressort à plus de 6 M€ par pièce.", "Le segment Munitions (612 M€ en 2025) et le soutien génèrent des revenus récurrents."],
      analyse: "Positionnement de prix bas sur l'artillerie (rapport coût-efficacité), intermédiaire sur les blindés SCORPION, et absence d'offre sur le char neuf. La marge se fait sur la durée (munitions, soutien, modernisation) plus que sur la vente initiale.", src: ["fob_109", "esd_caesar109", "knds_fy25", "spec_gen"] },
    distribution: { faits: ["Vente directe aux États, avec l'appui de la DGA et du ministère des Armées.", "Partenariat stratégique d'État à État avec la Belgique (CaMo) : même matériel, même doctrine, formation et soutien communs, étendu au Luxembourg.", "Transfert de technologie et assemblage local quand le client l'exige : Tchéquie (châssis Tatra, intégration locale), Malaisie (licence et assemblage), Pologne (munitions avec Grupa Niewiadów).", "Présence commerciale renforcée en Pologne (salon MSPO 2026)."],
      analyse: "Le modèle CaMo est très différenciant mais difficile à reproduire, car il suppose un alignement doctrinal complet. Hors de ce cadre, KNDS France vend surtout de l'artillerie ; ses blindés peinent face aux offres avec usine locale de GDELS, Patria ou Rheinmetall.", src: ["minarm_malaisie", "esd_pl155", "knds_mspo"] },
    avantages: ["Référence de combat du CAESAR", "Offre système SCORPION et partenariat CaMo", "Soutien politique et financier de l'État français", "Prix d'entrée compétitif en artillerie"],
    limites: ["Portefeuille export concentré sur une famille (CAESAR)", "Pas de char neuf à vendre avant la décennie 2030", "Capacités industrielles longtemps dimensionnées pour le seul client national", "Peu de coentreprises de production à l'étranger"],
    consequence: "Compétitif là où le prix et la preuve par le combat priment ; vulnérable là où le client achète d'abord une usine, des emplois et des délais courts." },

  { id: "knds-de", n: "KNDS Deutschland", ref: true,
    conception: { faits: ["Évolutions incrémentales de plateformes éprouvées (Leopard 2 A8, PzH 2000) financées par les commandes.", "Programmes en coentreprise avec Rheinmetall : Boxer (ARTEC) et Puma (PSM).", "Innovations autofinancées : module d'artillerie du RCH 155, Leopard 2 A-RC 3.0."],
      analyse: "Rente d'une base installée de plus de 2 000 Leopard 2 en Europe : chaque évolution trouve un marché de rétrofit. La dépendance à Rheinmetall (canons, coentreprises) limite l'autonomie commerciale.", src: ["knds_rollout", "esd_trophy"] },
    lancement: { faits: ["Présentations officielles en usine avec les clients (Leopard 2 A8 et PzH 2000 en 2026).", "Livraisons à l'Ukraine utilisées comme démonstration (RCH 155, PzH 2000, Gepard)."], analyse: "La communauté d'utilisateurs fait le travail commercial : les ventes se gagnent par alignement sur la flotte allemande.", src: ["knds_rollout", "die_rollout"] },
    prix: { faits: ["Leopard 2 A8 : 18 chars pour 525,6 M€ en mai 2023, développement du standard compris, soit environ 29 M€ par char.", "RCH 155 : 18 systèmes pour environ 216 M€ en 2022, puis 54 pour environ 890 M€, soit 12 à 16 M€ par système selon le périmètre.", "Protection active facturée à part : 330 M€ pour quatre flottes (EuroTrophy, 2026)."], analyse: "Positionnement haut de gamme assumé. Le prix est toléré tant que l'Allemagne finance, directement ou par ses contrats-cadres.", src: ["esut_l2a8", "esut_rch", "ar_rch54", "esd_trophy"] },
    distribution: { faits: ["Contrat-cadre allemand ouvert aux partenaires (Pays-Bas, Tchéquie, Lituanie, Croatie).", "Production sous licence en Norvège (37 Leopard 2 A8 assemblés à Levanger).", "Reprise du site Alstom de Görlitz pour augmenter les capacités."], analyse: "L'achat groupé derrière l'Allemagne mutualise coûts et soutien, un modèle parfaitement adapté aux financements européens.", src: ["janes_no", "die_rollout"] },
    avantages: ["Standard européen de fait pour le char de combat", "Contrats-cadres allemands ouverts", "Budget allemand en très forte hausse"],
    limites: ["Délais de livraison de quatre à six ans", "Prix élevés", "Partage de valeur imposé avec Rheinmetall"],
    consequence: "Position dominante en Europe tant que la capacité suit ; chaque retard ouvre la porte aux offres coréennes." },

  { id: "rheinmetall", n: "Rheinmetall",
    conception: { faits: ["Développements sur fonds propres dévoilés avant tout besoin exprimé : Lynx (2016-2018), KF51 Panther (2022), tube L60 (2026).", "Alliances technologiques avec de nouveaux entrants (Anduril, UVision) et coentreprises nationales (Leonardo, Hongrie)."],
      analyse: "Stratégie de l'offre : créer le produit, puis le besoin. Risque financier plus élevé, mais capacité à imposer ses standards (130 mm, 60 calibres).", src: ["rhm_fy25", "die_rhm_esy"] },
    lancement: { faits: ["Dévoilements spectaculaires à Eurosatory, communication financière très active (objectifs de carnet de 80 à 120 Md€).", "Présence démonstrative en Ukraine : usines de munitions et centres de réparation."], analyse: "La communication vise autant les marchés financiers que les clients : la promesse de croissance finance l'expansion.", src: ["rhm_q2"] },
    prix: { faits: ["Lynx hongrois : 218 véhicules pour plus de 2 Md€, usine comprise.", "Munitions : contrats-cadres pluriannuels de plusieurs milliards d'euros avec l'Allemagne."], analyse: "Le prix inclut la localisation industrielle. La marge opérationnelle visée (environ 19 %) est supérieure à celle de KNDS (15 %).", src: ["rhm_fy25", "knds_fy25"] },
    distribution: { faits: ["Coentreprise chez le client comme mode opératoire standard : Hongrie, Italie, Lituanie, Roumanie, Ukraine, Royaume-Uni (RBSL), Australie."], analyse: "Transforme chaque client en partenaire industriel captif. C'est le modèle le plus menaçant pour KNDS dans les pays qui veulent une filière nationale.", src: ["rhm_fy25", "leo_9m26"] },
    avantages: ["Vitesse de décision", "Capacité munitionnaire", "Localisation systématique"], limites: ["Exécution d'un carnet colossal", "Produits phares encore non éprouvés (KF51)"],
    consequence: "Fixe le tempo du marché européen ; oblige KNDS à annoncer plus tôt et à localiser davantage." },

  { id: "bae", n: "BAE Systems (Hägglunds, Bofors)",
    conception: { faits: ["Évolution continue du CV90 depuis trente ans, financée par un club de dix pays utilisateurs.", "Coopération avec KNDS France sur le canon de 40 mm télescopé et sur l'obus BONUS."], analyse: "Amortissement du développement sur une large communauté : chaque client finance une part des évolutions dont tous profitent.", src: ["bae_ar25"] },
    lancement: { faits: ["Le club d'utilisateurs CV90 sert d'outil de fidélisation et de prescription.", "Archer cédé à l'Ukraine et prêté au Royaume-Uni comme solution d'attente."], analyse: "Les solutions d'attente créent une habitude d'emploi, sans garantir la commande finale : le Royaume-Uni a finalement choisi le RCH 155.", src: ["spec_gen"] },
    prix: { faits: ["CV90 : 246 véhicules pour la Tchéquie pour 49,3 Md CZK hors TVA (2023), 29 véhicules de soutien, formation et rechanges compris, soit environ 8 M€ par véhicule.", "Archer : 48 systèmes pour la Suède pour environ 500 M$ (2023), soit environ 9 M€ par système."], analyse: "Prix moyens à élevés, justifiés par l'automatisation (Archer) et la part locale (CV90).", src: ["cz_cv90", "bae_archer"] },
    distribution: { faits: ["Jusqu'à 40 % de valeur produite chez le client pour le CV90.", "Ventes de gouvernement à gouvernement par l'agence suédoise FMV."], analyse: "Modèle proche du CaMo par la communauté, mais sans alignement doctrinal : plus facile à étendre.", src: ["bae_ar25"] },
    avantages: ["Communauté d'utilisateurs", "Solidité financière du groupe"], limites: ["Capacité de production", "Pas de char en propre"], consequence: "Verrouille le segment chenillé médian, où KNDS n'a pas d'offre exportable." },

  { id: "gdls", n: "General Dynamics (GDLS, GDELS)",
    conception: { faits: ["Développements financés par l'US Army (Abrams, Stryker, M10 abandonné en 2025, M1E3 en cours).", "En Europe, déclinaison de familles existantes (Piranha, Pandur, ASCOD, Eagle) selon les besoins nationaux."], analyse: "Deux modèles sous un même toit : programme d'État aux États-Unis, adaptation locale en Europe.", src: ["mb_gd"] },
    lancement: { faits: ["Références nationales successives : Danemark, Espagne, Roumanie, Autriche, Allemagne."], analyse: "Chaque usine nationale devient un argument de vente régional.", src: ["ind_gen"] },
    prix: { faits: ["Abrams : 250 chars pour la Pologne pour environ 4,75 Md$, soutien, munitions et véhicules d'appui compris."], analyse: "Les ventes FMS sont peu négociables en prix, mais apportent garantie politique et financement.", src: ["spec_gen"] },
    distribution: { faits: ["FMS pour l'Abrams ; usines en Suisse, Espagne, Autriche, Allemagne et Roumanie pour les blindés à roues."], analyse: "GDELS est perçu comme un industriel européen, ce qui neutralise l'argument de préférence européenne.", src: ["mb_gd"] },
    avantages: ["Ancrage local multiple", "Gamme à roues complète"], limites: ["Déboires de l'Ajax", "Abrams peu adapté aux budgets européens"], consequence: "Premier obstacle à l'export du VBCI et du Griffon en Europe." },

  { id: "leonardo", n: "Leonardo (IDV, coentreprise avec Rheinmetall)",
    conception: { faits: ["Achat de technologies par alliance : Lynx et Panther italianisés au sein de Leonardo Rheinmetall Military Vehicles.", "Intégration verticale par l'acquisition d'Iveco Defence Vehicles (mars 2026)."], analyse: "L'Italie renonce à développer seule ses chenillés et achète du temps contre de la dépendance.", src: ["leo_9m26"] },
    lancement: { faits: ["Lancement adossé à un plan national d'environ 23 Md€ sur plus de dix ans."], analyse: "Le marché domestique garantit la série ; l'export viendra ensuite avec un produit amorti.", src: ["leo_9m26"] },
    prix: { faits: ["Acquisition d'IDV pour environ 1,6 Md€, pour 1,37 Md€ de chiffre d'affaires 2025."], analyse: "Prix d'acquisition élevé qui témoigne de la valeur accordée à la maîtrise d'une filière terrestre complète.", src: ["leo_9m26"] },
    distribution: { faits: ["Marché italien, puis Amérique latine (Centauro II, Guarani au Brésil)."], analyse: "Concurrent ciblé plutôt que global ; partenaire de KNDS aux États-Unis via Leonardo DRS pour l'offre CAESAR du programme MTC.", src: ["bd_mtc"] },
    avantages: ["Marché national protégé", "Électronique et tourelles maison"], limites: ["Dépendance à Rheinmetall"], consequence: "Ferme le marché italien à KNDS et renforce l'axe germano-italien face à l'axe franco-allemand." },

  { id: "hanwha", n: "Hanwha Aerospace et Hyundai Rotem",
    conception: { faits: ["Développement financé par l'armée sud-coréenne, grandes séries nationales amortissant les coûts.", "Versions export conçues dès l'origine avec le client (Redback australien, K2PL polonais, K9MH américain)."], analyse: "L'effet de série coréen (plus de 1 000 K9 nationaux) donne un avantage de coût structurel.", src: ["kh_hanwha"] },
    lancement: { faits: ["Présence massive dans les salons européens (K9A2 et accords de coopération à Eurosatory 2026).", "Victoire au programme américain MTC en août 2026 face à cinq concurrents occidentaux."], analyse: "Chaque grand contrat (Pologne, Australie, États-Unis) sert de caution pour le suivant.", src: ["die_hanwha_esy", "bd_mtc"] },
    prix: { faits: ["Pologne : 212 K9 pour 2,4 Md$ (2022) ; 180 K2 pour 3,37 Md$ (2022), puis 180 K2 pour environ 6,5 Md$ avec transfert de production (2025).", "Roumanie : 54 K9 et 36 K10 pour environ 0,9 Md$."], analyse: "Le prix d'entrée est bas, puis le second contrat, qui inclut la localisation, coûte presque le double par char. C'est l'illustration type de l'écart entre prix d'équipement et valeur de contrat.", src: ["asiae_rotem", "spec_gen"] },
    distribution: { faits: ["Prélèvement sur les chaînes nationales pour livrer en quelques mois, crédits à l'export, puis usine locale."], analyse: "Séquence en deux temps que les Européens ne savent pas reproduire, faute de stocks et de chaînes en surcapacité.", src: ["kh_hanwha"] },
    avantages: ["Délais", "Prix d'entrée", "Financement"], limites: ["Contenu européen", "Soutien dans la durée"], consequence: "Menace principale sur le char et l'artillerie chenillée ; extension au canon à roues avec le K9MH." },

  { id: "elbit", n: "Elbit Systems",
    conception: { faits: ["Produits modulaires montés sur le châssis choisi par le client (ATMOS, PULS).", "Retour d'expérience opérationnel israélien intégré en continu."], analyse: "Faible coût de développement par contrat grâce à la modularité.", src: ["elbit_fy25"] },
    lancement: { faits: ["Réponse en urgence : choix par le Danemark, début 2023, de l'ATMOS et du PULS pour une livraison rapide, dans la foulée de la cession de ses CAESAR à l'Ukraine."], analyse: "Elbit a transformé un succès de KNDS (le don des CAESAR danois) en perte de client pour KNDS.", src: ["spec_gen"] },
    prix: { faits: ["Danemark : 19 ATMOS et 8 PULS pour environ 250 M$ ; le prix par système n'est pas séparable."], analyse: "Offres groupées qui rendent la comparaison de prix difficile pour l'acheteur comme pour le concurrent.", src: ["spec_gen"] },
    distribution: { faits: ["Filiales nationales dans une dizaine de pays européens ; partenariat EuroPULS avec KNDS Deutschland."], analyse: "Concurrent de KNDS France et partenaire de KNDS Deutschland : une ambiguïté à arbitrer au niveau du groupe.", src: ["elbit_fy25"] },
    avantages: ["Vitesse", "Offre groupée"], limites: ["Risque politique"], consequence: "Rival le plus direct du CAESAR sur tous les marchés hors Europe de l'Ouest." }
];

KBI.archetypes = [
  { n: "Programme national en maîtrise d'œuvre", ex: "SCORPION, CAESAR Mk II, Leopard 2 A8 allemand", av: "Développement financé, série garantie, référence nationale", li: "Spécifications nationales parfois peu exportables, cadence fixée par le budget", cq: "Socle de compétitivité, à condition de penser l'export dès la spécification." },
  { n: "Partenariat stratégique d'État à État", ex: "CaMo (Belgique, Luxembourg)", av: "Interopérabilité totale, relation de trente ans, soutien mutualisé", li: "Exige un alignement doctrinal rare ; négociation politique longue", cq: "Très défendable une fois signé ; peu de candidats." },
  { n: "Export avec transfert de technologie", ex: "CAESAR en Malaisie et en Tchéquie, K2PL en Pologne, Lynx en Hongrie", av: "Répond à la demande de souveraineté et d'emplois du client", li: "Marge diluée, risque de créer un concurrent, complexité d'exécution", cq: "Devenu la condition d'entrée sur la plupart des grands marchés." },
  { n: "Contrat-cadre multinational", ex: "Leopard 2 A8, Patria CAVS, achats financés par SAFE", av: "Effet de série, prix négocié en commun, éligibilité aux fonds européens", li: "Le pays chef de file capte la relation et le calendrier", cq: "Favorise les standards allemands et nordiques ; la France n'en pilote aucun dans le terrestre." },
  { n: "Soutien et disponibilité contractuelle", ex: "Soutien en service du Leclerc, centres de maintenance en Ukraine", av: "Revenus récurrents, connaissance fine de l'emploi réel", li: "Pénalités, dépendance à l'état du parc", cq: "Stabilise l'activité et protège la base installée." },
  { n: "Cession de matériels et recomplètement", ex: "CAESAR français et danois cédés à l'Ukraine", av: "Démonstration au combat, commandes de remplacement", li: "Le recomplètement peut échoir à un concurrent plus rapide (Danemark)", cq: "Positif pour la notoriété, risqué pour la part de marché si la capacité ne suit pas." },
  { n: "Vente d'État à État financée", ex: "FMS américain, crédits à l'export coréens", av: "Rapidité, financement, garantie politique", li: "Dépendance du client envers le pays vendeur", cq: "Standard de comparaison pour les acheteurs pressés ; KNDS doit y répondre par les délais et par SAFE." }
];

/* Données contractuelles publiques. v = valeur en millions dans la devise indiquée ; q = quantité principale.
   Le ratio v/q est une valeur contractuelle par unité, jamais un prix d'équipement. */
KBI.contrats = [
  { pid: "caesar-mk2", p: "CAESAR Mk II", ind: "KNDS France", f: "ART", client: "FR", an: 2024, q: 109, v: 350, dev: "EUR", perim: "Production des systèmes ; développement financé par un marché distinct de 2022", st: "C", src: ["fob_109", "esd_caesar109"] },
  { pid: "caesar-8x8", p: "CAESAR 8x8", ind: "KNDS France", f: "ART", client: "CZ", an: 2021, q: 52, v: 8500, dev: "CZK", perim: "Systèmes, formation, simulateurs, munitions initiales, forte part industrielle locale", st: "E", src: ["spec_gen"] },
  { pid: "caesar-mk1", p: "CAESAR 6x6 (coalition artillerie)", ind: "KNDS France", f: "ART", client: "UA", an: 2024, q: 12, v: 50, dev: "EUR", perim: "Financement français de 12 pièces, annoncé par le ministre des Armées", st: "A", src: ["spec_gen"] },
  { pid: "caesar-mk1", nc: "Montant non publié", p: "CAESAR 6x6 Mk I", ind: "KNDS France", f: "ART", client: "MY", an: 2026, q: 18, v: null, dev: "EUR", perim: "Montant non publié ; licence de transfert de technologie et assemblage local", st: "C", src: ["minarm_malaisie"] },
  { pid: "rch155", p: "RCH 155 (premier lot)", ind: "KNDS Deutschland", f: "ART", client: "UA", an: 2022, q: 18, v: 216, dev: "EUR", perim: "Premier lot financé par l'Allemagne ; signature non confirmée officiellement à l'époque", st: "E", src: ["esut_rch"] },
  { pid: "rch155", p: "RCH 155 (programme étendu)", ind: "KNDS Deutschland", f: "ART", client: "UA", an: 2023, q: 54, v: 890, dev: "EUR", perim: "Extension à 54 systèmes financés par l'Allemagne ; coût total cité par la presse", st: "E", src: ["ar_rch54"] },
  { pid: "pzh2000", p: "PzH 2000", ind: "KNDS Deutschland", f: "ART", client: "DE", an: 2023, q: 10, v: 184, dev: "EUR", perim: "Recomplètement après cessions à l'Ukraine ; options pour 18 de plus", st: "C", src: ["janes_pzh"] },
  { pid: "archer", p: "Archer", ind: "BAE Systems Bofors", f: "ART", client: "SE", an: 2023, q: 48, v: 500, dev: "USD", perim: "48 systèmes sur camion RMMV HX2 8x8, premières livraisons en 2025", st: "C", src: ["bae_archer"] },
  { pid: "k9", p: "K9A1", ind: "Hanwha Aerospace", f: "ART", client: "PL", an: 2022, q: 212, v: 2400, dev: "USD", perim: "Premier contrat d'exécution : pièces, formation, logistique, munitions", st: "E", src: ["spec_gen"] },
  { pid: "k9", nc: "Contrat mixte", p: "K9 et K10", ind: "Hanwha Aerospace", f: "ART", client: "RO", an: 2024, q: 54, v: 920, dev: "USD", perim: "54 obusiers, 36 véhicules de ravitaillement, munitions, production locale partielle", st: "E", src: ["spec_gen"] },
  { pid: "k9mh", nc: "Contrat de prototypage", p: "K9MH (programme MTC)", ind: "Hanwha Defense USA", f: "ART", client: "US", an: 2026, q: 6, v: 262.9, dev: "USD", perim: "Contrat de prototypage : 6 systèmes, essais, 12 en option. Non comparable à un prix de série", st: "C", src: ["bd_mtc"] },
  { pid: "atmos", nc: "Contrat mixte", p: "ATMOS et PULS", ind: "Elbit Systems", f: "ART", client: "DK", an: 2023, q: 19, v: 252, dev: "USD", perim: "19 ATMOS et 8 lance-roquettes PULS : prix par système non séparable", st: "E", src: ["spec_gen"] },
  { pid: "leo2a8", p: "Leopard 2 A8 (premier lot)", ind: "KNDS Deutschland", f: "MBT", client: "DE", an: 2023, q: 18, v: 525.6, dev: "EUR", perim: "Développement du standard A8 et livraison de 18 chars d'ici 2026", st: "C", src: ["esut_l2a8"] },
  { pid: "leo2a8", p: "Leopard 2 A8 (second lot)", ind: "KNDS Deutschland", f: "MBT", client: "DE", an: 2024, q: 105, v: 2400, dev: "EUR", perim: "Levée des options du contrat-cadre de 2023 (valeur des options ; surcoût signalé lors de l'approbation de juillet 2024)", st: "E", src: ["esut_l2a8", "esut_l2a8b"] },
  { pid: "leo2a8", p: "Leopard 2 A8", ind: "KNDS Deutschland", f: "MBT", client: "LT", an: 2024, q: 44, v: 950, dev: "EUR", perim: "Chars ; protection active contractualisée à part en 2026", st: "E", src: ["spec_gen", "esd_trophy"] },
  { pid: "k2", p: "K2 (premier contrat)", ind: "Hyundai Rotem", f: "MBT", client: "PL", an: 2022, q: 180, v: 3370, dev: "USD", perim: "Chars prélevés en partie sur la production coréenne, formation, logistique, munitions", st: "E", src: ["spec_gen"] },
  { pid: "k2", p: "K2 et K2PL (second contrat)", ind: "Hyundai Rotem", f: "MBT", client: "PL", an: 2025, q: 180, v: 6500, dev: "USD", perim: "180 chars dont une partie en version K2PL produite en Pologne, véhicules d'appui, transfert de technologie, maintenance", st: "E", src: ["asiae_rotem"] },
  { pid: "m1a2", p: "M1A2 SEPv3 Abrams", ind: "GDLS (FMS)", f: "MBT", client: "PL", an: 2022, q: 250, v: 4750, dev: "USD", perim: "Chars, dépanneurs, ponts d'assaut, munitions, formation", st: "E", src: ["spec_gen"] },
  { pid: "leclerc-xlr", nc: "Rénovation, pas un équipement neuf", p: "Rénovation Leclerc XLR (marché initial)", ind: "KNDS France", f: "MOD", client: "FR", an: 2015, q: 218, v: 330, dev: "EUR", perim: "Rénovation de 200 chars et 18 dépanneurs : ce n'est pas un prix de char", st: "E", src: ["spec_gen"] },
  { pid: "leclerc", nc: "Valeur de 1993, non actualisée", p: "Leclerc (contrat émirien)", ind: "GIAT Industries", f: "MBT", client: "AE", an: 1993, q: 434, v: 3200, dev: "USD", perim: "388 chars, 46 dépanneurs, version à moteur allemand ; contrat réputé déficitaire pour l'industriel", st: "E", src: ["spec_gen"] },
  { pid: "leo2a8", nc: "Sous-système", p: "Protection active Trophy pour Leopard 2 A8", ind: "EuroTrophy", f: "MBT", client: "LT", an: 2026, q: null, v: 330, dev: "EUR", perim: "Flottes de Lituanie, des Pays-Bas, de Tchéquie et de Croatie ; rechanges et formation. Illustre le coût d'un sous-système", st: "C", src: ["esd_trophy"] },
  { pid: "griffon", nc: "Deux véhicules différents", p: "Griffon et Jaguar (CaMo)", ind: "KNDS France, Arquus, Thales", f: "VEH", client: "BE", an: 2018, q: 442, v: 1500, dev: "EUR", perim: "382 Griffon et 60 Jaguar : deux véhicules de valeur très différente, ratio moyen sans signification unitaire", st: "E", src: ["spec_gen"] },
  { pid: "patria6x6", p: "Patria 6x6 (CAVS)", ind: "Patria", f: "VEH", client: "DE", an: 2025, q: 876, v: 2000, dev: "EUR", perim: "Plafond de 876 véhicules en quatre variantes, production locale à partir de 2027", st: "C", src: ["patria_de", "ar_patria"] },
  { pid: "boxer", p: "Boxer (programme MIV)", ind: "ARTEC", f: "VEH", client: "GB", an: 2019, q: 523, v: 2800, dev: "GBP", perim: "Véhicules produits au Royaume-Uni, soutien initial", st: "E", src: ["spec_gen"] },
  { pid: "cv90", p: "CV90 Mk IV", ind: "BAE Systems Hägglunds", f: "VEH", client: "CZ", an: 2023, q: 246, v: 49300, dev: "CZK", perim: "246 véhicules en sept variantes et 29 véhicules de soutien, formation, rechanges ; hors TVA ; au moins 40 % de part industrielle tchèque", st: "C", src: ["cz_cv90"] },
  { pid: "lynx", p: "Lynx KF41", ind: "Rheinmetall", f: "VEH", client: "HU", an: 2020, q: 218, v: 2000, dev: "EUR", perim: "Véhicules et création d'une usine en Hongrie", st: "E", src: ["spec_gen"] },
  { pid: "titus", p: "Titus", ind: "KNDS France", f: "VEH", client: "CZ", an: 2019, q: 62, v: 6000, dev: "CZK", perim: "TVA incluse ; formation et systèmes de communication et de chiffrement compris ; contrat passé avec Eldis Pardubice", st: "C", src: ["radio_titus"] }
];
KBI.devises = { EUR: ["€", 1], USD: ["$", 0.88], GBP: ["£", 1.17], CZK: ["CZK", 0.04], SEK: ["SEK", 0.09] };

/* ═══════════ MODULE 4 : BENCHMARK ═══════════ */
/* Critères qualitatifs notés de 1 à 5 par l'analyste (5 = le plus favorable). Ce sont des appréciations, pas des mesures. */
KBI.criteres = [
  { id: "maturite", n: "Maturité opérationnelle", d: "Années de service, emploi au combat, nombre d'utilisateurs", w: 20 },
  { id: "feu", n: "Puissance de feu et automatisation", d: "Portée, cadence, automatisation du service de l'arme", w: 15 },
  { id: "mobilite", n: "Mobilité et projection", d: "Masse, aérotransport, autonomie", w: 15 },
  { id: "protection", n: "Protection de l'équipage", d: "Blindage, cabine, protection active", w: 15 },
  { id: "cout", n: "Coût d'acquisition et de possession", d: "D'après les valeurs de contrats publiques ; 5 = le plus accessible", w: 20 },
  { id: "offre", n: "Offre industrielle et délais", d: "Production locale, transfert de technologie, délais de livraison", w: 15 }
];
KBI.benchmarks = [
  { id: "art-roues", n: "CAESAR face aux canons automoteurs à roues", f: "ART", type: "ART", defaut: ["caesar-mk2", "caesar-mk1", "archer", "atmos", "rch155"],
    ids: ["caesar-mk1", "caesar-8x8", "caesar-mk2", "rch155", "archer", "atmos", "zuzana2", "dita", "bohdana", "sh15"],
    note: "Les portées sont données pour un obus explosif à culot creux, seule base commune. Les portées avec munitions spéciales dépendent de l'obus, pas du canon." },
  { id: "art-chen", n: "Automoteurs chenillés et systèmes automatisés", f: "ART", type: "ART", defaut: ["pzh2000", "rch155", "k9", "krab"], ids: ["pzh2000", "rch155", "loras", "k9", "krab", "m109a7"],
    note: "LORAS est un démonstrateur : ses valeurs sont des annonces de l'industriel." },
  { id: "mbt", n: "Leclerc face aux chars de combat", f: "MBT", type: "MBT", defaut: ["leclerc-xlr", "leo2a8", "k2", "m1a2", "kf51"], ids: ["leclerc", "leclerc-xlr", "capint", "leo2a8", "k2", "m1a2", "kf51", "challenger3"],
    note: "Les niveaux de protection sont classifiés : aucune comparaison chiffrée du blindage n'est possible en source ouverte. KF51 et CAPINT sont des démonstrateurs." },
  { id: "reco", n: "Jaguar face aux engins de reconnaissance et de combat", f: "VEH", type: "VEH", defaut: ["jaguar", "ajax", "centauro2", "boxercrv"], ids: ["jaguar", "ajax", "centauro2", "boxercrv", "luchs2"],
    note: "Ces engins répondent à des doctrines différentes (cavalerie légère, reconnaissance lourde, chasseur de chars) : la comparaison éclaire des choix, elle ne désigne pas un vainqueur." },
  { id: "vtt6", n: "Griffon face aux blindés de transport 6x6", f: "VEH", type: "VEH", defaut: ["griffon", "patria6x6", "pandur6", "fuchsevo"], ids: ["griffon", "titus", "patria6x6", "pandur6", "fuchsevo", "arma6"],
    note: "Le Griffon est vendu avec le système SCORPION ; les concurrents sont en général comparés plateforme seule." },
  { id: "vci8", n: "VBCI et Boxer face aux 8x8 de combat", f: "VEH", type: "VEH", defaut: ["vbci", "boxer", "piranha5", "amvxp"], ids: ["vbci", "boxer", "piranha5", "amvxp", "freccia"], note: "Masse et armement varient fortement selon la version retenue par chaque client." },
  { id: "4x4", n: "Serval face aux 4x4 protégés", f: "VEH", type: "VEH", defaut: ["serval", "eaglev", "bushmaster", "cobra2"], ids: ["serval", "dingo", "eaglev", "bushmaster", "cobra2"], note: "Classes de masse différentes : de 10 à 17 t." }
];
/* Notes par produit, dans l'ordre : maturité, feu, mobilité, protection, coût, offre. null = donnée insuffisante pour apprécier. */
KBI.notes = {
  "caesar-mk1": [5, 3, 5, 2, 5, 4], "caesar-8x8": [4, 3, 4, 3, 4, 4], "caesar-mk2": [3, 3, 4, 4, 4, 4], "rch155": [3, 5, 3, 4, 2, 2], "archer": [4, 5, 3, 4, 2, 3],
  "atmos": [4, 3, 4, 2, 4, 5], "zuzana2": [3, 4, 3, 3, 3, 2], "dita": [2, 4, 3, 3, 4, 3], "bohdana": [4, 2, 4, 2, 5, 2], "sh15": [3, 3, 4, 2, 5, 3],
  "pzh2000": [5, 5, 2, 5, 1, 2], "loras": [1, 5, 2, 4, null, null], "k9": [5, 4, 2, 4, 3, 5], "krab": [4, 4, 2, 4, 3, 2], "m109a7": [5, 2, 3, 4, 3, 3],
  "leclerc": [4, 4, 5, 3, null, 1], "leclerc-xlr": [4, 4, 4, 3, null, 1], "capint": [1, 5, 3, 4, null, 2], "leo2a8": [4, 4, 3, 5, 2, 3], "k2": [3, 4, 4, 3, 4, 5], "m1a2": [5, 4, 2, 5, 3, 4], "kf51": [1, 5, 4, 4, null, 3], "challenger3": [2, 4, 2, 5, null, 1],
  "jaguar": [3, 4, 5, 3, 3, 3], "ajax": [2, 4, 2, 5, 1, 2], "centauro2": [3, 5, 4, 3, 2, 3], "boxercrv": [4, 4, 3, 5, 2, 4], "luchs2": [1, 2, 4, 3, null, 2],
  "griffon": [4, 2, 4, 4, 3, 3], "titus": [3, 2, 4, 3, 3, 4], "patria6x6": [4, 2, 4, 3, 5, 5], "pandur6": [4, 2, 4, 3, 4, 4], "fuchsevo": [2, 2, 4, 3, 3, 3], "arma6": [3, 3, 4, 3, 5, 4],
  "vbci": [5, 3, 4, 4, 3, 2], "boxer": [5, 4, 3, 5, 2, 5], "piranha5": [4, 4, 4, 4, 3, 5], "amvxp": [4, 4, 4, 4, 4, 5], "freccia": [4, 4, 4, 4, 3, 2],
  "serval": [3, 2, 4, 4, 3, 3], "dingo": [5, 2, 4, 4, 3, 3], "eaglev": [4, 2, 5, 3, 4, 4], "bushmaster": [5, 2, 4, 4, 4, 3], "cobra2": [4, 2, 5, 3, 5, 5]
};

/* Lecture des valeurs contractuelles par famille (ratios calculés par la plateforme à partir de KBI.contrats). */
KBI.lectureContrats = {
  ART: "Le CAESAR Mk II français ressort à environ 3,2 M€ par système, contre 9 à 10 M€ pour l'Archer suédois et le K9 polonais, et 12 à 18 M€ pour les systèmes automatisés ou chenillés du groupe (RCH 155, PzH 2000). L'écart tient à l'automatisation, à la protection et au périmètre des contrats ; il confirme que le CAESAR se vend sur le rapport coût-efficacité plus que sur la performance brute.",
  MBT: "Les contrats récents de chars ressortent entre 16 et 32 M€ par char. La valeur par char du K2 polonais a presque doublé entre le premier contrat (prélèvement sur la production coréenne) et le second (production locale et transfert de technologie) : un prix de char ne dit rien sans son périmètre industriel. La rénovation XLR du Leclerc relève d'un autre ordre de grandeur et ne se compare pas à un char neuf.",
  VEH: "Le Patria 6x6 allemand (environ 2,3 M€) et le Titus tchèque (environ 3,9 M€, TVA incluse) se situent en bas de l'échelle ; les 8x8 et chenillés modernes dépassent 6 à 9 M€ par véhicule, part locale comprise. Le contrat CaMo belge mêle deux véhicules de valeur très différente et n'est pas ramené à l'unité."
};

/* Avantages et limites des produits KNDS comparés (analyse de l'auteur, fondée sur les fiches). */
KBI.atoutsKnds = {
  "caesar-mk1": [["Référence de combat (Irak, Ukraine)", "18 t, transportable par A400M et C-130", "Valeur contractuelle par unité parmi les plus basses du marché"], ["Équipage non protégé pendant le tir", "Emport limité à 18 obus", "Chargement semi-automatique, équipage de 5"]],
  "caesar-8x8": [["Emport de 30 à 36 obus", "Cabine blindée", "Forte part industrielle locale en Tchéquie"], ["Masse proche de 30 t", "Peu de clients (Tchéquie, ex-Danemark)"]],
  "caesar-mk2": [["Cabine blindée et motorisation doublée", "Intégration native à SCORPION", "Commandes de plusieurs pays européens"], ["Livraisons étalées jusqu'à la fin de la décennie", "Automatisation inférieure à l'Archer et au RCH 155"]],
  "rch155": [["Automatisation complète, équipage de 2", "Tir en mouvement", "Retenu par le Royaume-Uni et la Suisse"], ["Valeur contractuelle par unité élevée (12 à 16 M€ pour l'Ukraine)", "Écarté du programme américain MTC"]],
  "pzh2000": [["Cadence et emport de référence", "Neuf pays utilisateurs"], ["57 t et maintenance lourde (retour d'Ukraine)", "Valeur contractuelle par unité la plus élevée de l'échantillon"]],
  "loras": [["Portée de 60 km annoncée en obus standard", "Compatible avec les munitions de 52 calibres"], ["Démonstrateur ; munitions spéciales en développement", "Aucun client"]],
  "leclerc": [["Chargement automatique et équipage de 3", "Mobilité élevée pour sa génération"], ["Production arrêtée en 2008", "Environ 200 chars en ligne en France"]],
  "leclerc-xlr": [["Intégration au combat collaboratif SCORPION", "Kits de protection et cage antidrones"], ["Pas de protection active", "Rythme de livraison lent", "Pas de gain de puissance de feu"]],
  "capint": [["Briques mûres du groupe (châssis Leopard 2, tourelle ASCALON)", "Tourelle inhabitée, évolutive vers 140 mm"], ["Démonstrateur sans contrat ni calendrier", "Valeur industrielle française limitée à la tourelle et à l'armement"]],
  "leo2a8": [["Plus de 300 commandes fermes", "Protection active de série", "Contrat-cadre ouvert aux partenaires"], ["Délais de livraison", "Valeur contractuelle par char de 22 à 29 M€"]],
  "jaguar": [["Canon de 40 mm et missiles Akeron MP sur un engin de 25 t", "Vétronique SCORPION"], ["Standard de munition propre à trois pays", "Exportation limitée au partenariat CaMo"]],
  "griffon": [["Vendu comme système complet (SCORPION, doctrine, formation)", "Gamme de variantes (MEPAC, génie, commandement)"], ["Exportation limitée au partenariat CaMo", "Pas de production chez le client"]],
  "titus": [["Châssis Tatra et intégration locale", "Polyvalence (commandement, sécurité intérieure)"], ["Petite série", "Peu présent dans les grandes compétitions"]],
  "vbci": [["Éprouvé au combat (Afghanistan, Mali)", "Protection et mobilité"], ["Jamais exporté", "Successeur non défini"]],
  "boxer": [["Modules de mission interchangeables", "Cinq pays utilisateurs et l'Ukraine"], ["Valeur partagée avec Rheinmetall", "Masse et coût élevés"]],
  "serval": [["Porteur des capacités antidrones et de guerre électronique", "Aérotransportable"], ["Pas encore exporté hors CaMo", "Concurrence de 4x4 moins chers"]],
  "dingo": [["Protection contre les mines reconnue", "Large base installée"], ["Conception ancienne", "Supplanté par l'Eagle V en Allemagne"]]
};

/* ═══════════ MODULE 5 : MARCHÉS ═══════════ */
KBI.depenses = { titre: "Dépenses militaires 2025", unite: "Md$", note: "Montants en dollars courants. L'Inde (5e), l'Ukraine (7e) et l'Italie (12e) figurent au classement, mais leurs montants n'ont pas pu être vérifiés dans la fiche d'origine au cours de cette étude.",
  monde: 2887, rows: [["US", "États-Unis", 954, "C"], ["CN", "Chine", 336, "E"], ["RU", "Russie", 190, "E"], ["DE", "Allemagne", 114, "C"], ["FR", "France", 68.0, "C"], ["KR", "Corée du Sud", 47.8, "C"], ["PL", "Pologne", 46.8, "C"]], src: ["sipri_milex", "al_sipri"] };

KBI.kndsChiffres = { src: ["knds_fy25", "bourso_res"],
  ca: [3.8, 4.4], caEvo: "+15,9 %", carnet: [23.5, 33.1], commandes: 13.5, ebit: 661, resultat: 996,
  segments: [["Systèmes terrestres Allemagne", 2.5, "+17,4 %", "s2"], ["Systèmes terrestres France", 1.3, "+9,6 %", "s1"], ["Munitions", 0.612, "+24,7 %", "s3"]],
  autres: "EBIT 2025 de 661 M€, soit 15 % du chiffre d'affaires ; résultat net de 996 M€, gonflé par un gain exceptionnel lié à la participation dans Renk. Objectif à moyen terme : 11 à 12 Md€ de chiffre d'affaires, tiré surtout par l'Allemagne, dont l'activité doit environ tripler." };

/* Indicateurs de position concurrentielle. Chaque bloc précise sa nature : valeur, volume, carnet ou livraisons. */
KBI.indicateurs = [
  { id: "ca", nature: "Valeur", titre: "Chiffre d'affaires 2025 des périmètres à dominante terrestre", unite: "Md€", st: "E",
    note: "Périmètres non homogènes : groupe entier pour Rheinmetall et CSG (munitions de petit calibre et activités civiles comprises), segment terrestre pour Hanwha et BAE Systems. Conversions indicatives : 1 € pour 0,855 £ et 1 600 wons. Ce graphique donne un ordre de grandeur, pas une part de marché.",
    rows: [["Rheinmetall (groupe)", 9.9, "rhm_fy25"], ["CSG (groupe)", 6.7, "csg_fy25"], ["BAE Systems, Platforms & Services", 5.9, "bae_ar25"], ["Hanwha Aerospace, défense terrestre", 5.1, "kh_hanwha"], ["KNDS", 4.4, "knds_fy25", true], ["Iveco Defence Vehicles (Leonardo)", 1.37, "leo_9m26"]] },
  { id: "carnet", nature: "Carnet de commandes", titre: "Carnets de commandes à fin 2025", unite: "Md€", st: "E",
    note: "Le carnet de Rheinmetall inclut des accords-cadres non fermes ; celui d'Elbit couvre tout le groupe. Conversions indicatives : 1 € pour 1,13 $ et 1 600 wons. Un carnet mesure l'activité future, pas la part de marché actuelle.",
    rows: [["Rheinmetall (groupe, accords-cadres inclus)", 63.8, "rhm_fy25"], ["KNDS", 33.1, "knds_fy25", true], ["Elbit Systems (groupe)", 24.9, "elbit_fy25"], ["General Dynamics, Combat Systems", 24.1, "mb_gd"], ["Hanwha Aerospace, défense terrestre", 23.3, "kh_hanwha"]] },
  { id: "chars", nature: "Volume", titre: "Chars de combat neufs commandés par des pays européens de l'OTAN depuis 2022", unite: "chars", st: "E",
    note: "Décompte de l'auteur d'après les contrats publics, hors chars d'occasion et hors rénovations. Le Leclerc n'y figure pas : KNDS France n'a plus de chaîne de char neuf. Le KF51 Panther n'a pas encore de commande de série ferme et n'est pas compté. Leopard 2 A8 : Allemagne 123, Norvège 54, Pays-Bas 46, Lituanie 44, Tchéquie 44.",
    rows: [["K2 et K2PL (Hyundai Rotem)", 360, "asiae_rotem"], ["Leopard 2 A8 (KNDS Deutschland)", 311, "die_rollout", true], ["M1A2 SEPv3 (GDLS)", 304, "spec_gen"]] },
  { id: "caesar", nature: "Commandes et livraisons", titre: "CAESAR : commandes cumulées et livraisons", unite: "canons", st: "E",
    note: "Chiffres de presse non recoupés par une publication officielle (fiabilité C). L'écart entre commandes et livraisons représente la charge restant à produire.",
    rows: [["Commandés (toutes versions)", 782, "vdf_caesar", true], ["Livrés", 470, "vdf_caesar", true]] }
];

KBI.baseInstallee = { note: "Faute de parts de marché fiables par segment, la base installée et le nombre de pays clients servent d'indicateurs de substitution.", src: ["spec_gen", "vdf_caesar", "kh_hanwha"],
  rows: [["CAESAR (toutes versions)", "KNDS France", "15 pays clients", "Canon à roues le plus diffusé au monde hors Chine", "C"], ["K9 Thunder", "Hanwha Aerospace", "Plus de 10 pays", "Automoteur chenillé le plus vendu ; plus de 1 500 exemplaires exportés selon la presse", "E"], ["PzH 2000", "KNDS Deutschland", "9 pays utilisateurs", "Série relancée en 2023", "E"], ["ATMOS 2000", "Elbit Systems", "Une dizaine de pays", "Clients surtout hors OTAN, plus le Danemark", "E"], ["Archer", "BAE Systems Bofors", "3 pays utilisateurs", "Suède, Royaume-Uni (solution d'attente), Ukraine", "E"], ["Leopard 2 (toutes versions)", "KNDS Deutschland", "Plus de 20 pays", "Plus de 2 000 chars en service en Europe", "E"], ["CV90", "BAE Systems Hägglunds", "10 pays", "Standard du chenillé médian en Europe", "E"], ["Boxer", "ARTEC", "5 pays et l'Ukraine", "Production sur quatre sites", "E"], ["Griffon, Jaguar, Serval", "KNDS France et partenaires", "3 pays", "France, Belgique, Luxembourg", "C"]] };

/* Programmes d'acquisition suivis. op : O opportunité, M menace, F marché fermé, S à surveiller. */
KBI.programmes = [
  { pays: "FR", prog: "Char intermédiaire", f: "MBT", besoin: "Successeur du Leclerc avant le MGCS, retrait du Leclerc vers 2037-2038", statut: "Lancement confirmé en avril 2026 ; choix de solution non arrêté", acteurs: "KNDS (CAPINT), achat sur étagère d'un char existant", op: "O", comm: "Enjeu existentiel pour la filière française du char.", src: ["opex_mgcs", "opex_lpm_char"] },
  { pays: "FR", prog: "CAESAR Mk II et lutte antidrone", f: "ART", besoin: "109 CAESAR Mk II d'ici 2030 ; 48 Serval antidrones", statut: "En exécution ; commandes supplémentaires évoquées par la LPM actualisée", acteurs: "KNDS France", op: "O", comm: "Socle de charge et vitrine export.", src: ["fob_109", "senat_lpm", "fob_budget26"] },
  { pays: "DE", prog: "Montée en puissance de la Bundeswehr", f: "MBT", besoin: "Leopard 2 A8 supplémentaires, Boxer, RCH 155, étude d'un Leopard 3", statut: "Commandes en série ; budget de 114 Md$ en 2025", acteurs: "KNDS Deutschland, Rheinmetall, GDELS, Patria", op: "O", comm: "Premier moteur de croissance du groupe : le chiffre d'affaires allemand doit tripler.", src: ["knds_fy25", "sipri_milex"] },
  { pays: "PL", prog: "Chars, artillerie et munitions", f: "MBT", besoin: "K2PL, K9 et Krab, production de munitions de 155 mm", statut: "Marché capté par les offres coréennes et américaines ; 43,7 Md€ de prêts SAFE alloués", acteurs: "Hyundai Rotem, Hanwha, GDLS ; KNDS France présent sur les munitions", op: "S", comm: "Entrée par les munitions (Grupa Niewiadów) faute de plateforme retenue.", src: ["esd_pl155", "tle_safe", "knds_mspo"] },
  { pays: "IT", prog: "Chars Panther et blindés Lynx", f: "MBT", besoin: "Char dérivé du Panther et environ 1 050 véhicules chenillés dérivés du Lynx", statut: "Attribué à la coentreprise Leonardo-Rheinmetall", acteurs: "Leonardo, Rheinmetall", op: "F", comm: "Marché fermé ; renforce un axe concurrent du MGCS.", src: ["leo_9m26"] },
  { pays: "GB", prog: "Mobile Fires Platform", f: "ART", besoin: "Remplacement de l'AS90", statut: "RCH 155 retenu en 2024 ; contrat de production attendu", acteurs: "KNDS Deutschland, Rheinmetall (Boxer)", op: "O", comm: "Référence majeure pour le RCH 155.", src: ["spec_gen"] },
  { pays: "US", prog: "Mobile Tactical Cannon", f: "ART", besoin: "Remplacement d'environ 500 obusiers tractés M777", statut: "K9MH de Hanwha retenu le 18 août 2026 pour la phase de prototypes", acteurs: "Hanwha ; écartés : CAESAR (Leonardo DRS et KNDS), RCH 155, Archer, SIGMA", op: "M", comm: "Perte d'une référence mondiale ; le K9 à roues devient un rival direct du CAESAR à l'export.", src: ["bd_mtc"] },
  { pays: "MY", prog: "Passage au 155 mm", f: "ART", besoin: "18 CAESAR Mk I avec assemblage local", statut: "Contrat signé le 16 juin 2026", acteurs: "KNDS France", op: "O", comm: "Quinzième pays client ; tremplin en Asie du Sud-Est.", src: ["minarm_malaisie"] },
  { pays: "BE", prog: "Capacité motorisée (CaMo)", f: "VEH", besoin: "382 Griffon, 60 Jaguar, 28 CAESAR Mk II, version MEPAC", statut: "Livraisons en cours", acteurs: "KNDS France, Arquus, Thales", op: "O", comm: "Modèle à étendre : munitions, antidrone, robotique.", src: ["senat_scorpion", "spec_gen"] },
  { pays: "CZ", prog: "Artillerie et chars", f: "ART", besoin: "62 CAESAR 8x8, 44 Leopard 2 A8", statut: "Livraisons en cours", acteurs: "KNDS France et Deutschland, CSG", op: "O", comm: "Rare pays client des deux branches du groupe.", src: ["esd_trophy", "spec_gen"] },
  { pays: "LT", prog: "Division lourde", f: "MBT", besoin: "44 Leopard 2 A8, 18 CAESAR Mk II, Boxer", statut: "Commandes passées", acteurs: "KNDS France et Deutschland", op: "O", comm: "Offre groupe complète sur le flanc est.", src: ["esd_trophy", "spec_gen"] },
  { pays: "HR", prog: "Modernisation financée par SAFE", f: "ART", besoin: "18 CAESAR Mk II, Leopard 2 A8", statut: "Commandes de 2025 ; plan SAFE approuvé en janvier 2026", acteurs: "KNDS France et Deutschland", op: "O", comm: "Démontre l'effet de levier de SAFE.", src: ["ce_safe", "fm_caesar", "esd_trophy"] },
  { pays: "SI", prog: "Artillerie", f: "ART", besoin: "12 CAESAR Mk II", statut: "Commande de 2025, livraisons à partir de 2030", acteurs: "KNDS France", op: "O", comm: "Délais longs à surveiller ; information de presse à confirmer.", src: ["fm_caesar"] },
  { pays: "PT", prog: "Plan SAFE national", f: "ART", besoin: "Modernisation financée par SAFE ; détail des besoins terrestres non vérifié dans cette étude", statut: "Plan approuvé par la Commission en janvier 2026", acteurs: "Non connus à la date de l'étude", op: "S", comm: "Plan à analyser : vérifier la part réservée à l'artillerie et aux blindés.", src: ["ce_safe"] },
  { pays: "EE", prog: "Artillerie", f: "ART", besoin: "12 CAESAR en complément des K9", statut: "Commande de 2024", acteurs: "KNDS France, Hanwha", op: "O", comm: "Coexistence avec le K9 : le CAESAR comme complément léger.", src: ["spec_gen"] },
  { pays: "DK", prog: "Recomplètement de l'artillerie", f: "ART", besoin: "Remplacement des CAESAR cédés à l'Ukraine", statut: "ATMOS et PULS retenus en 2023", acteurs: "Elbit", op: "M", comm: "Client perdu faute de pouvoir livrer vite.", src: ["spec_gen"] },
  { pays: "RO", prog: "Blindés et artillerie", f: "VEH", besoin: "K9, Lynx, Abrams, Cobra II", statut: "Attribués ; 16,7 Md€ de prêts SAFE alloués", acteurs: "Hanwha, Rheinmetall, GDLS, Otokar", op: "F", comm: "KNDS absent d'un des plus gros budgets SAFE.", src: ["tle_safe", "spec_gen"] },
  { pays: "ES", prog: "Artillerie automotrice", f: "ART", besoin: "Obusiers à roues et à chenilles", statut: "Attribué à des industriels nationaux en 2025", acteurs: "Indra, EM&E", op: "F", comm: "Préférence nationale ; un rôle de fournisseur de technologie reste possible.", src: ["spec_gen"] },
  { pays: "GR", prog: "Modernisation des forces mécanisées", f: "VEH", besoin: "Blindés de combat d'infanterie, modernisation des Leopard 2", statut: "Besoin exprimé ; offres françaises et allemandes évoquées par la presse, sans décision connue", acteurs: "KNDS France et Deutschland, Rheinmetall, autres", op: "S", comm: "Décision lente ; l'accord stratégique franco-grec est un atout.", src: ["analyse"] },
  { pays: "AE", prog: "Avenir du parc Leclerc", f: "MBT", besoin: "Modernisation ou remplacement de près de 300 chars", statut: "Non décidé publiquement", acteurs: "KNDS France, Hyundai Rotem", op: "S", comm: "Risque de perdre le seul client export du Leclerc.", src: ["analyse"] },
  { pays: "IN", prog: "Canon monté sur camion", f: "ART", besoin: "Plusieurs centaines de pièces, production en Inde", statut: "Procédure longue, préférence pour les solutions nationales", acteurs: "Industriels indiens, KNDS France, Elbit", op: "S", comm: "Potentiel de volume, exigence de production locale.", src: ["analyse"] },
  { pays: "UA", prog: "Soutien et production locale", f: "SOU", besoin: "Maintenance, munitions, canons", statut: "KNDS Ukraine ouverte en 2024", acteurs: "KNDS, Rheinmetall, industrie ukrainienne", op: "O", comm: "Retour d'expérience et marché de reconstruction ; concurrence du Bohdana local.", src: ["spec_gen"] }
];
KBI.notionsPdm = [
  ["Part de marché en valeur", "Non calculable de façon fiable : les industriels ne publient pas leurs ventes par segment et par pays sur une base comparable.", "Substitut : chiffre d'affaires des périmètres terrestres, en ordre de grandeur."],
  ["Part de marché en volume", "Calculable sur des segments étroits et bien documentés.", "Exemple : chars de combat neufs commandés par des pays européens de l'OTAN depuis 2022."],
  ["Part de marché par famille de produits", "Rarement publiée ; aucune étude commerciale payante n'est utilisée ici.", "Substitut : base installée et nombre de pays clients par produit."],
  ["Carnet de commandes", "Publié par les industriels cotés et par KNDS, sur des périmètres hétérogènes (accords-cadres, groupe entier).", "Mesure l'activité future, pas la position actuelle."],
  ["Livraisons effectives", "Rarement publiées par produit.", "Disponibles pour le CAESAR (presse) ; à suivre dans les rapports annuels des États."]
];
KBI.top100 = { txt: "Classement SIPRI des 100 premiers groupes d'armement (chiffres 2024, publiés en décembre 2025) : Rheinmetall 20e, KNDS 42e, classé parmi les groupes transeuropéens. Les 100 premiers totalisent 679 Md$ de ventes d'armes.", src: ["sipri_top100"] };

KBI.opLabels = { O: "Opportunité", M: "Menace", F: "Marché fermé", S: "À surveiller" };

KBI.exportFr = { faits: ["Prises de commandes à l'exportation de la France en 2025 : 21,2 Md€ (21,6 Md€ en 2024).", "Le Rafale représente environ 40 % des commandes de 2025 et les missiles 18 % ; l'Inde est le premier client avec 26 Rafale Marine pour 6,9 Md€.", "L'Asie pèse 43 % des commandes et l'Union européenne 27 %."],
  analyse: "L'armement terrestre reste minoritaire dans l'export français, dominé par l'aéronautique et le naval. Les succès du CAESAR sont nombreux, mais de valeur unitaire modeste : dix-huit canons ne pèsent pas un seul Rafale.", src: ["rap_export"] };
