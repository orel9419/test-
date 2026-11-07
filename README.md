# 🏛️ Chef de gouvernement

Jeu de simulation en français : vous dirigez le gouvernement d'un pays réel (France, Allemagne, États-Unis) à partir de sa **situation réelle au 1er novembre 2026**. Vous gérez le budget ministère par ministère, la fiscalité, la dette, les réformes structurelles et leurs compensations, le Parlement ou le Congrès, les entreprises et les participations de l'État, l'opinion et les élections, l'Europe, la diplomatie et les grands rendez-vous internationaux (sommets, Jeux olympiques). Les effets sur la population sont visibles en euros (ou en dollars) par mois pour des ménages types.

Application 100 % front-end (React + Vite), sans serveur, sans compte et sans mesure d'audience. Sauvegarde automatique dans le navigateur, export et import en JSON.

**Jouer en ligne** : https://orel9419.github.io/test-/ · **Mode Express** : https://orel9419.github.io/test-/?express · **Défi du jour** : https://orel9419.github.io/test-/?defi (une fois GitHub Pages activé, voir « Publier le jeu »). Le bouton « Jouer maintenant » lance une partie en France, comme Premier ministre, en mode Facile avec visite guidée ; « Personnaliser la partie » donne accès à tous les réglages.

## Lancer le jeu

Prérequis : Node.js 18 ou plus récent.

```bash
npm install
npm run dev        # serveur de développement : http://localhost:5173
npm test           # tests unitaires du moteur (Vitest)
npm run build      # version de production dans dist/
npm run preview    # sert la version de production
```

Simulation en ligne de commande, utile pour tester des scénarios :

```bash
npm run simuler -- france statu_quo
npm run simuler -- france 39h_exo2 --sans-politique
npm run simuler -- france retraites_65_compensees --mandat-complet
npm run simuler -- allemagne rigueur
npm run simuler -- etatsUnis statu_quo --mode=expert
```

## Installer l'application sur un téléphone ou un ordinateur

Le jeu est une **application web installable** (PWA). Une fois installée, elle s'ouvre en plein écran depuis une icône et fonctionne **hors connexion** après la première visite.

1. Publication : à chaque mise à jour, le workflow `.github/workflows/publier-application.yml` construit le jeu et le publie sur la branche `gh-pages`. Il faut l'activer une fois dans le dépôt : **Settings → Pages → Source : « Deploy from a branch », branche `gh-pages`, dossier `/ (root)`**. L'adresse est alors `https://<compte>.github.io/<dépôt>/`.
2. Installation :
   - **Android** (Chrome) : ouvrir l'adresse, puis toucher « Installer » sur l'écran d'accueil du jeu, ou le menu ⋮ → « Installer l'application » ;
   - **iPhone et iPad** (Safari) : bouton Partager → « Sur l'écran d'accueil » ;
   - **ordinateur** (Chrome, Edge) : icône d'installation dans la barre d'adresse.

Sur mobile, la navigation passe dans une barre en bas de l'écran, avec un bouton « Valider le trimestre » toujours accessible. La partie est sauvegardée sur l'appareil ; « ☰ Menu → Sauvegarder » permet aussi de la copier pour la reprendre ailleurs.

## Mode Express (3 minutes, à partager)

Un jeu de décisions rapides, pensé pour le téléphone et les réseaux sociaux :
- une carte par semaine : un ministre, un syndicat, une agence de notation, le chef d'état-major ou la direction d'une des **40 entreprises du CAC 40** vous soumet un dilemme ; **glissez à gauche ou à droite** (ou utilisez les boutons, ou les flèches du clavier) ;
- quatre jauges : **opinion, finances publiques, majorité, sécurité et souveraineté**. Si l'une tombe à zéro **ou monte au maximum**, c'est la chute (huit fins différentes, à collectionner : censure, crise de la dette, rue, dérive sécuritaire…). Pendant que vous hésitez, des points indiquent quelles jauges vont bouger, sans dire dans quel sens ;
- l'usure du pouvoir grignote l'opinion et les finances, et les effets s'amplifient avec le temps ;
- après une décision, un encadré « Le saviez-vous ? » donne un fait réel (49.3, censure de 1962 et de 2024, dissuasion, EPR de Flamanville, notes des agences…) ;
- **défi du jour** : les mêmes cartes pour tout le monde le même jour, une série de jours consécutifs ; records et fins découvertes enregistrés dans le navigateur ;
- **partage** : une image de score au format portrait (1080 × 1350) prête pour Instagram, X, WhatsApp ou LinkedIn, et des liens directs (`?express`, `?defi`) qui ouvrent la partie en un clic.

Les situations sont fictives, inspirées de l'actualité ; les entreprises citées n'ont pas fait ces demandes.

## Matériels des armées et palais de la République en 3D

Dans la rubrique Régalien (Armées, Dissuasion), dans l'onglet Géopolitique, dans l'écran Institutions et dans le **Hangar 3D** (écran d'accueil, quatre familles : air, mer et dissuasion ; bâtiments de surface ; terre, drones et espace ; lieux de pouvoir), des modèles 3D (three.js) aux **proportions réelles** quand elles sont publiques :
- **Rafale**, relevé sur un plan trois vues (dessus, profil, face) et d'après les photos de l'armée de l'Air et de l'Espace (livrée gris Rafale, cocarde rouge, blanc, bleu au centre) : 15,27 m de long, 10,80 m d'envergure (ministère des Armées), aile delta, plans canard, entrées d'air, dérive unique avec drapeau tricolore, verrière dorée et habitacle, perche de ravitaillement, deux réacteurs M88, cocardes, et une configuration air-air (2 MICA, 2 Meteor, 2 réservoirs de 2 000 litres) ;
- **SNLE Le Triomphant** : 138 m de long, 12,5 m de diamètre, kiosque et barres de plongée, 16 tubes de missiles M51 avec leurs trappes, gouvernes en croix, hydrojet ; position et hauteur du kiosque, arrière et hydrojet recalés sur un plan de profil du domaine public (Wikimedia Commons) ; on peut **ouvrir les trappes** et lancer un **tir d'essai simulé** ;
- **SNA de la classe Suffren** (programme Barracuda), d'après les infographies de Naval Group et de la Marine nationale : 99 m, 8,8 m de diamètre, kiosque à grand congé avant et mâts optroniques, **hangar de pont** amovible (environ 15 m) dont on ouvre la porte pour faire sortir les **nageurs de combat**, antennes sonar de flanc, barres avant escamotables, tubes de 533 mm, gouvernes en X et hydrojet ; bouton **« Missile de croisière (simulation) »** ;
- **SNLE de 3e génération** (classe L'Invincible), d'après une image de présentation du programme : environ 150 m et 15 000 t (sources ouvertes), kiosque avancé à grand congé de raccordement et barres de plongée en flèche, 16 trappes de missiles M51 au ras du pont derrière le kiosque, longue antenne sonar sur chaque flanc, gouvernes arrière en X avec l'aileron du sonar remorqué, hydrojet ; les plans définitifs ne sont pas publics ;
- **porte-avions « France Libre »**, d'après les chiffres de la Marine nationale : 310 m, 78 000 t, deux réacteurs de 220 MW, 27 nœuds, environ 2 000 marins, mise en service prévue en 2038 ; île à tribord vers l'arrière, piste oblique, trois catapultes, deux ascenseurs latéraux, Rafale Marine, avion de guet et hélicoptères sur le pont, coque peinte en rouge sous la flottaison ; bouton **« Catapulter un Rafale »** (environ 3,8 g pendant 2,2 s, comme une catapulte électromagnétique) ;
- **porte-avions « Charles-de-Gaulle »**, d'après l'infographie de la Marine nationale (profil, plan du pont, photographies) : 261,5 m × 64,4 m, mis en service en mai 2001, port d'attache Toulon, 1 900 marins, 40 aéronefs dont 24 Rafale, 2 réacteurs nucléaires (61 MW, 83 000 ch), 27 nœuds ; pont relevé sur le plan (étrave large, bord bâbord dans l'axe de la piste oblique, piste sombre, zone hachurée, lignes de sécurité rouges et blanches, bande jaune à l'arrière, ascenseurs à bordure hachurée), île à tribord vers l'avant, sans cheminée, avec passerelles vitrées, numéro « R91 », tour, mât treillis, radars et radômes, 2 catapultes de 75 m, 2 ascenseurs en arrière de l'île, radeaux de survie, Rafale Marine, Hawkeye et hélicoptère sur le pont ; lui aussi peut catapulter un Rafale ;
- **bâtiments de surface**, posés sur la mer : **porte-hélicoptères amphibie Mistral** (L9013, 199 m × 32 m, d'après des photos : coque haute, étrave à bulbe, pont d'envol à six spots, île à tribord avec passerelle vitrée, mât treillis et radômes, ascenseurs, porte du radier ; un Caïman **décolle** du pont) ; **frégate de défense aérienne Chevalier Paul** (D621, 153 m : 48 cellules Sylver pour les Aster, deux canons de 76 mm, tour du radar multifonction sous son grand radôme, mât treillis, radar de veille à antenne tournante, Exocet, hangar et plateforme) ; **FREMM** (142 m, d'après un plan trois vues : canon de 76 mm, Sylver, façade de passerelle inclinée, mât intégré et radar Herakles, mât arrière, cheminée à sommet noir, logement d'embarcation) ; **ravitailleur de forces BRF** (A725, 194 m : grue, quatre portiques dont on **déploie les tuyaux** de ravitaillement, superstructure arrière, embarcations, plateforme hélicoptère) ; **bâtiment d'essais et de mesures Monge** (A601, environ 225 m : grand bloc blanc de l'avant, trois grandes paraboles de trajectographie et de télémesure qui **suivent un tir de missile**, radômes, mât arrière, plateforme en porte-à-faux) ;
- **char Leclerc rénové (XLR)**, d'après une maquette de référence : 9,87 m canon compris, 3,71 m de large, canon de 120 mm à chargement automatique (manchon thermique en segments, housse de masque en toile verte), modules de blindage autour du masque, tourelleau téléopéré et seconde mitrailleuse, viseurs, antennes, briques de blindage nervurées sur l'arrière des flancs, jupes à bavette noire, grilles anti-roquettes à l'arrière de la caisse et de la tourelle, phares ; six galets par côté ; **livrée sable** (opérations extérieures) ou **camouflage centre-Europe** au choix ; bouton **« Faire pivoter la tourelle »** ;
- **Mirage 2000-5F**, relevé sur un plan trois vues coté et d'après une photo du 188-EF : aile delta pure, entrées d'air à demi-cônes, perche de ravitaillement fixe, camouflage deux tons de gris, 2 réservoirs de 1 700 L et 2 MICA ; train sorti ou rentré (14,36 m, 9,13 m d'envergure, réacteur M53-P2) ;
- **canon Caesar MkII**, d'après le rendu de KNDS (livrée brune) : canon de 155 mm (52 calibres) sur camion 6×6 Arquus à cabine blindée au capot en pointe, freins de recul au-dessus du tube, rambardes, coffres à munitions (18 coups), bêche arrière ; boutons **« Mettre en batterie »** (la bêche descend, le tube bascule vers l'arrière à 45°) et **« Tir (simulation) »** (recul, flamme, fumée) ;
- **Griffon** (véhicule blindé multirôle 6×6), d'après une photo de l'armée de Terre (livrée sable) : capot à grilles, grand pare-brise blindé, essieu avant et tandem arrière à pneus à crampons, tourelleau téléopéré sur couronne de lance-pots, mât et antennes, filet de camouflage roulé ; porte arrière qui s'ouvre ;
- **Jaguar** (engin blindé de reconnaissance et de combat), d'après une photo de l'armée de Terre (livrée brune) : nez en pointe à bandeau de phares, canon de 40 mm CTA décalé à droite, caisson du lanceur MMP qui se dresse capot ouvert, grappes de lance-pots, viseur panoramique, tourelleau ; tourelle qui pivote ;
- pour le Caesar, le Griffon et le Jaguar, un bouton remet le **camouflage centre-Europe** ;
- **A330 MRTT Phénix** (58,80 m, 60,30 m d'envergure), d'après des photos et un schéma de livrée : bande gris foncé en deux parties (fine sous le poste, elle monte jusque sous les hublots ; double filet arrière jusqu'à la cocarde), « ARMEE DE L'AIR » au-dessus des hublots, portes cerclées de jaune, feux de formation, barres de guidage et bande d'alignement sous le ventre (repères pour l'avion ravitaillé), dérive redessinée avec son trait sombre, son badge et son numéro, bords d'attaque en métal nu, réacteurs Trent 772, winglets ; vues de côté droit et de dessous ; boutons pour **déployer la perche rigide**, **dérouler les tuyaux et paniers** des nacelles et sortir le train ;
- hélicoptères aux rotors animés : **NH90 Caïman** (porte, hublots, roue avant et poutre de queue recalés sur un plan trois vues de Wikimedia Commons, CC BY-SA 4.0) en camouflage de l'armée de Terre ou en livrée sombre des **forces spéciales** (standard 2, boule optronique Euroflir 410, mitrailleuses de sabord), avec une **descente en corde lisse** ; **Caïman Marine** (NH90 NFH, d'après une photo : gris deux tons, radar sous le nez, boule optronique, flotteurs de secours, cocarde de l'aéronavale à l'ancre, rotor de queue à bouts rouges), qui **trempe son sonar** et **hélitreuille un sauveteur** ; **Tigre** (canon de 30 mm orientable, roquettes, missiles, viseur de toit ; livrée de la photo ou vert olive) ; **Puma** (camouflage vert, brun et noir, « armée de TERRE ») ; **H225M Caracal** (gris, perche de ravitaillement, sponsons, porte ouverte et tireurs de sabord) ;
- **drone tactique Patroller** : 18 m d'envergure, hélice, empennage en T, boule optronique qui balaie le terrain, représenté en vol ;
- **satellite d'observation** (type CSO, silhouette indicative) au-dessus de la Terre, panneaux solaires repliables ;
- **palais de l'Élysée** (portail à colonnes, cour d'honneur, perron et marquise, drapeaux français et européen, parc), **hôtel de Matignon** (portail en hémicycle, cour, avant-corps à fronton, parc d'environ 3 hectares), **palais Bourbon** (grand escalier, péristyle de douze colonnes corinthiennes, fronton, statues, verrière de l'hémicycle, Seine et pont de la Concorde) et **palais du Luxembourg** (pavillon central à dôme, pavillons d'angle, bossages, grand bassin du jardin) ; les drapeaux flottent au vent ;
- les **hémicycles de l'Assemblée et du Sénat** (écran Institutions, bouton « L'hémicycle en 3D ») : un fauteuil par élu, coloré selon son groupe **dans votre partie**, de la gauche à la droite vues du fauteuil du président, avec la tribune, le perchoir et le banc du Gouvernement.

Le Rafale existe en monoplace (C) et en biplace (B), train d'atterrissage rentré ou sorti.

Rotation au doigt ou à la souris, vues de profil, de dessus et de face, légendes, et bouton **Photo** pour partager sa plus belle vue. Les formes sont simplifiées : ce ne sont pas des plans. La 3D n'est chargée qu'à l'ouverture de ces écrans ; dans l'écran Armées, chaque visionneuse n'est créée que lorsque sa carte arrive à l'écran (les navigateurs limitent le nombre de contextes WebGL actifs, environ 16).

Pour la fidélité des formes, des plans libres de droits ont été cherchés sur Wikimedia Commons (NH90, Tigre, Super Puma, SNLE Le Triomphant, PANG) : ils servent seulement de référence de mesure et ne sont pas inclus dans le jeu. Le serveur de Wikimedia limite le nombre de téléchargements ; les plans manquants (Puma, Caracal, Leclerc, A330, Caesar) pourront compléter le travail plus tard.

## Publier le jeu

Le dépôt est public et le workflow `.github/workflows/publier-application.yml` publie automatiquement le jeu sur la branche `gh-pages` à chaque mise à jour (après les tests). Pour qu'il soit accessible à tous :

1. **Activer GitHub Pages** (une seule fois) : Settings → Pages → Build and deployment → Source : « Deploy from a branch », branche `gh-pages`, dossier `/ (root)`. Le jeu est alors en ligne à `https://orel9419.github.io/test-/` en une à deux minutes.
2. **Recommandé** : renommer le dépôt (Settings → General → Repository name), par exemple `chef-de-gouvernement`, pour une adresse plus parlante. Le jeu fonctionne quel que soit le nom (chemins relatifs) ; il faut seulement mettre à jour les deux adresses `og:url` et `og:image` dans `index.html` (aperçu du lien dans les messageries) et le lien du dépôt dans `src/ui/composants/APropos.jsx`.
3. **Facultatif** : choisir une licence (fichier `LICENSE`) pour dire ce que les autres ont le droit de faire du code ; activer les « Issues » pour recevoir les signalements (le jeu y renvoie depuis « À propos »).

Le partage d'un lien affiche un aperçu (titre, description, image `public/apercu-partage.jpg`).

## Comment jouer

Un tour = un trimestre. Par défaut, la partie dure **jusqu'en 2050** (97 trimestres, du T4 2026 au T4 2050). Vous pouvez aussi jouer un seul mandat : 20 trimestres pour la France, 16 pour l'Allemagne, 9 pour les États-Unis (jusqu'à la présidentielle de novembre 2028). À chaque tour, vous pouvez :

1. **Consulter le tableau de bord** : en tête, la carte **« Solidité du pouvoir »** (note sur 100, popularité et sa variation, projection pour la prochaine élection décisive, menace de censure ou état de la coalition) ; puis PIB, croissance, inflation, chômage, dette, déficit, charge d'intérêts, taux à 10 ans et écart avec l'Allemagne, popularité, rapport de force parlementaire, cohésion sociale, émissions, effort de R&D, influence. Chaque indicateur a une infobulle explicative.
2. **Répartir le budget** entre 15 postes, avec des curseurs en volume (hors inflation). Le panneau d'impact estime en temps réel l'effet sur le solde, la croissance, le chômage, la popularité par groupe et le revenu de chaque ménage type. Une **inertie** réaliste s'applique : on réduit plus vite un investissement qu'une masse salariale.
3. **Fixer les impôts** (TVA, impôt sur le revenu, impôt sur les sociétés, CSG, cotisations, taxes sur l'énergie, successions), la part de dette émise à court terme, et annoncer une **trajectoire de déficit** (la tenir renforce la crédibilité, la manquer coûte cher).
4. **Proposer des réformes**, par exemple :
   - retraites : âge (de 62 à 68 ans, à deux rythmes possibles pour 68 ans), indexation, compensations sur la pénibilité, le minimum de pension, les carrières longues ;
   - temps de travail : 35, 37, 39 ou 40 h, heures payées, exonérées ou non payées ;
   - fonction publique, assurance chômage, TVA sociale, impôt sur les très hauts patrimoines, bouclier énergétique ;
   - pour l'Allemagne : âge de la retraite, cotisation de 2028, frein à l'endettement, revenu citoyen.

   En France, **125 réformes** (dont 34 d'inspiration libérale et 30 d'inspiration sociale, filtrables) couvrent 20 thèmes : retraites, capitalisation, travail, fonction publique, baisse des dépenses, règles budgétaires, fiscalité, santé, énergie, éducation, sécurité, défense, immigration, logement, agriculture, outre-mer, institutions… Chacune indique :
   - son **véhicule législatif** (loi de finances, financement de la Sécurité sociale, loi ordinaire, décret) ;
   - un **pronostic de vote** à l'Assemblée et le vote prévu de chaque groupe ;
   - les arguments des partisans et des opposants, et des exemples étrangers.

   Parmi elles, des **grands programmes et mesures régaliennes** :
   - énergie : nouveaux réacteurs EPR2 (6 ou 14, prêt de l'État, mises en service à partir de 2038), petits réacteurs modulaires, éolien en mer ou moratoire, leasing social, rénovation des logements ;
   - défense : successeur du Rafale (SCAF européen ou programme national confié à Dassault Aviation), trajectoire vers 3 ou 3,5 % du PIB, porte-avions de nouvelle génération, service militaire volontaire ou obligatoire, renseignement et cyberdéfense ;
   - sécurité et justice : prisons, narcotrafic (offensive ou légalisation du cannabis), peines planchers, exécution des OQTF, polices municipales ;
   - infrastructures : autoroutes (rachat immédiat, régie publique à la fin des concessions en 2031-2036, gratuité ou remise en concurrence), plan ferroviaire ;
   - dépense publique : ramener la dépense de 57,3 % du PIB (Insee, 2025) à 47,5 % en cinq ans puis 43 % en dix ans, à 45 % puis 40 %, ou à 43 % puis 38 % ; les économies, retraites et santé comprises, sont recalculées chaque trimestre pour suivre la trajectoire ;
   - **fonds souverain français** : apporter les participations de l'État et réinvestir leurs dividendes (environ 4 Md€ par an), emprunter 20 Md€ par an pendant cinq ans, flécher 10 Md€ d'épargne par an (livret souverain) ou réinvestir 25 % des économies du plafond de dépense publique. Le fonds place ses apports en actions de grandes entreprises sur **quatre marchés : CAC 40, S&P 500, STOXX Europe 600 et marchés émergents (MSCI EM)**, selon une répartition au choix (équilibrée, priorité France, mondiale sur le modèle norvégien, pari sur les émergents) ; les dividendes sont réinvestis. Dès que la loi s'applique, l'onglet **« Fonds souverain »** (rubrique Économie) montre son évolution trimestre par trimestre : valeur, apports cumulés, plus-values, rendement annuel, courbe des quatre marchés depuis sa création (base 100) et composition du portefeuille. Le CAC 40 est celui de la partie (il réagit à vos décisions) ; les trois autres suivent la demande mondiale, un facteur commun et leurs propres aléas, avec des krachs possibles. Seule la part placée dans des entreprises françaises (CAC 40 et environ 17 % du STOXX Europe 600) soutient l'activité et la croissance potentielle en France : combiné au plafond de dépense (trajectoire 47,5 % puis 43 %), le fonds « Priorité France » relève le PIB réel de 2030 d'environ 2 points, la répartition équilibrée d'environ 1 point, la répartition mondiale presque pas, mais celle-ci diversifie mieux les risques. Financé par l'emprunt, il augmente la dette mais pas le déficit (c'est une acquisition d'actifs) ;
   - organisation de l'État, inspirée de Jean-Louis Borloo : « une compétence, un seul niveau », suppression des agences qui doublonnent avec les préfets et les collectivités, **fusion des opérateurs publics par grands pôles** (un tiers en moins, et suppression des 24 agences ciblées par le Sénat), fusion des régions et des départements en provinces (révision constitutionnelle), réduction du nombre de parlementaires ;
   - modernisation et performance de l'État :
     - **IA et robotisation** : un départ à la retraite sur trois non remplacé grâce à l'automatisation (variante prudente limitée aux fonctions support : 1 sur 5). Il faut d'abord investir (environ 1,5 Md€ par an au départ), les économies nettes viennent après 4 à 5 ans ;
     - **règle de performance budgétaire** : norme de dépense pluriannuelle avec revue annuelle des dispositifs, budget « base zéro » ou règle du gage (toute dépense nouvelle compensée) ;
     - **train de vie de l'État** (décret) : fin des avantages à vie des anciens ministres, réduction des véhicules et des cabinets. Économie symbolique, mais populaire ;
     - **prime de partage de la valeur** relevée et défiscalisée : du pouvoir d'achat sans dépense publique directe, mais avec un coût en cotisations.

   Les filtres par thème, la recherche et l'option « seulement celles qui peuvent passer » aident à s'y retrouver. Chaque réforme peut être **chiffrée sur 3 ans par simulation** avant d'être soumise au Parlement (ou à référendum).

   Les députés jugent d'abord le **contenu** de chaque texte, ce qui permet des majorités d'idées différentes d'un texte à l'autre. Le 49.3 est illimité pour les textes financiers et limité à un par session pour les autres.

   **Retraite par capitalisation** : quatre dispositifs combinables (PER renforcé, deuxième pilier obligatoire avec parts employeur et salarié, fonds souverain, transition partielle de la répartition), et un **système mixte mi-capitalisation, mi-répartition** : 14 points de cotisation sur environ 28 basculent progressivement (0,5 ou 1 point par an), avec une double charge d'environ 100 Md€ par an à terme, financée par la dette, la CSG, une baisse des pensions ou un panachage. Le système mixte remplace la transition partielle (les deux ne se cumulent pas). Le panneau dédié montre :
   - la double charge de transition ;
   - l'allocation des fonds et sa volatilité ;
   - le risque de krach ;
   - une projection sur 30 ans (scénarios défavorable, médian et favorable) et le supplément de pension d'un salarié au SMIC et d'un cadre ;
   - la part des gains captée par les ménages aisés.
5. **Agir à l'international** avec un capital diplomatique limité :
   - contrats de gaz, achats groupés ;
   - prêts européens SAFE, clause dérogatoire défense, emprunt commun européen ;
   - budget de l'UE 2028-2034, Mercosur, aide à l'Ukraine, droits de douane américains, projets franco-allemands.
6. **Piloter les entreprises et l'État stratège** (onglet « Entreprises et État stratège ») :
   - suivre l'indice boursier (CAC 40, DAX, S&P 500), le climat des affaires et la souveraineté économique ;
   - agir sur les fleurons nationaux : recevoir la direction, prendre 10 % du capital, nationaliser (il faut une loi), céder une participation, instituer une action spécifique ;
   - lancer des programmes d'investissement stratégique (nouveau nucléaire, défense, semi-conducteurs, batteries, IA, médicaments, hydrogène, terres rares) ;
   - faire contribuer les grandes entreprises (surtaxe d'impôt sur les sociétés, conditionnalité des aides, taxe sur les rachats d'actions) ;
   - trancher des dossiers : ArcelorMittal à Dunkerque, financement des EPR2, UniCredit et Commerzbank, Thyssenkrupp, vente d'Uniper, Intel, puces Nvidia vers la Chine…

   Une prise de participation augmente la dette sans creuser le déficit (opération financière) ; les dividendes s'ajoutent aux recettes.
7. **Garder l'opinion** (onglet « Communication », rubrique « Politique et opinion ») :
   - **pourquoi votre popularité bouge** : chômage et inflation, pouvoir d'achat, services publics, impôts, réformes et communication, chacun avec un bouton « Agir » qui mène au bon onglet ;
   - **une action de communication par trimestre** : allocution au 20 h, déplacement de terrain auprès d'un groupe, rencontre avec les maires, feuille de route chiffrée (une fois par an), grand débat national ou convention citoyenne (tous les deux ans). Parler trop souvent use l'opinion : l'efficacité baisse (jusqu'à 40 %) et le risque de « petite phrase » malheureuse augmente ;
   - **mesures populaires** : les réformes disponibles qui font le plus gagner en popularité, avec un bouton « Proposer ». Dans l'onglet « Réformes », un badge 👍/👎 indique l'effet de chaque mesure sur l'opinion, et un filtre « Seulement les mesures populaires » les isole.

   Ordre de grandeur (France, mode Intermédiaire, sans autre décision) : une action de communication bien choisie chaque trimestre porte la popularité vers 38 % au bout de deux ans, contre 27 % sans rien faire.
8. **Exercer les missions régaliennes** (rubrique « Régalien ») :
   - **Armées** : budget de la défense (63,4 Md€ prévus en 2027 pour la mission Défense, hors pensions) et capacités (environ 150 Rafale en service ; objectif 178 fin 2030 et 225 en 2035). Les grands programmes sont illustrés (dessins originaux et modèles 3D), et filtrables par armée (Terre, Air, Marine, Dissuasion, Espace) : **Rafale**, **ravitailleurs A330 Phénix** (15 en 2028 ; commander 3 de plus ou renforcer leur soutien), **hélicoptères** (Caïman standard 2 des forces spéciales jusqu'en 2029, Tigre standard 3, retrait des Puma ; commander 12 Caïman de plus, rénover tous les Tigre ou prolonger les Puma), **maintien en condition opérationnelle** (un indice de disponibilité des hélicoptères, à relever par un plan de disponibilité ou à dégrader en réduisant l'entretien), **Mirage 2000** (50 Mirage 2000D rénovés, retirés en deux temps jusqu'au « tout Rafale » fin 2035 ; Mirage 2000-5F retirés vers 2030 ; vous pouvez prolonger la flotte de trois ans, céder davantage de 2000-5F à l'Ukraine ou les retirer plus tôt pour financer le Rafale), **SNLE de 3e génération**, porte-avions **« Charles-de-Gaulle »** et **« France Libre »**, **sous-marins nucléaires d'attaque de la classe Suffren** (4 livrés fin 2026, 6 vers 2030, jusqu'à 10 avec vos commandes), **porte-hélicoptères amphibies** (Mistral, Tonnerre, Dixmude), **frégates** (2 FDA Horizon dont le Chevalier Paul, 8 FREMM), **ravitailleurs de forces BRF** (2 en service, 4 vers 2032) et **bâtiment d'essais et de mesures Monge**, successeur du Rafale après l'abandon du chasseur commun du SCAF, espace ; et pour l'**armée de Terre** (77 000 combattants dans la force opérationnelle terrestre, 60 % de l'engagement opérationnel des armées) : **SCORPION** (Griffon, Jaguar, Serval : 1 437 Griffon et 238 Jaguar visés en 2030), **char Leclerc rénové** (160 fin 2030, 200 fin 2035) et char du futur (MGCS avec l'Allemagne ou char national), **artillerie** (109 Caesar MkII, frappe longue portée), drones et munitions. Pour chacun : faits sourcés, industriels, jalons, et vos décisions (accélérer le standard F5, étaler pour économiser, sécuriser le calendrier des SNLE…). Un étalement économise d'abord, puis coûte plus cher : le rattrapage est différé et renchérit chaque appareil.
     **Commandes supplémentaires**, renouvelables **une fois tous les quatre trimestres** pour chaque matériel : tranches de **30** (Rafale, Mirage 2000 – chaîne à rouvrir, fermée depuis 2007 –, Griffon, Jaguar, Serval, Leclerc rénovés à partir de chars stockés, Caesar MkII), de **10** (Caïman, Tigre, Caracal, Phénix) ou **un bâtiment de plus** (SNLE 3G, SNA – dix au plus –, porte-avions, porte-hélicoptères, frégate de défense aérienne, FREMM, ravitailleur, bâtiment d'essais). Chaque carte affiche le coût par an, le délai avant la première livraison, les commandes passées, les livraisons attendues et la date de la prochaine commande possible. Les unités commandées s'ajoutent à la trajectoire de la loi de programmation ; les porte-avions commandés rejoignent la flotte (et peuvent former un second groupe aéronaval).
   - **Opérations** : missions Aigle (Roumanie) et Lynx (Estonie), formation des soldats ukrainiens, force de réassurance en Ukraine (scénario de jeu) ; coût annuel, influence, relations.
   - **Exportations** : mobiliser « l'équipe France » pour des contrats de Rafale (appel d'offres indien de 114 avions, prospect dans le Golfe) ; chances selon les relations et l'influence.
   - **Dissuasion** : SNLE en vue en coupe (16 missiles M51, chaufferie nucléaire), composante aéroportée, et dimension européenne de la dissuasion, **domaine réservé du président** (en tant que Premier ministre, vous ne pouvez pas trancher).
   - **Sécurité et justice** : les réformes régaliennes (police, prisons, narcotrafic, immigration, renseignement) à proposer directement, avec leur effet sur l'opinion et leur risque constitutionnel.

   L'Allemagne (F-35A, bouclier antimissile Arrow 3, brigade en Lituanie) et les États-Unis (B-21, sous-marins Columbia, Golden Dome) ont leurs propres programmes.
9. **Suivre l'opinion et les élections** (onglet « Opinion et élections ») : baromètre de satisfaction sur dix thèmes, intentions de vote, projection « si l'élection avait lieu aujourd'hui », résultats. Les élections intermédiaires (régionales, Länder, européennes, mi-mandat américain) et nationales découlent de vos décisions. Vous pouvez déclencher un **référendum** (France, article 11), une **dissolution** (France) ou une **question de confiance** (Allemagne).
10. **Préparer les grands rendez-vous** (onglet « Grands rendez-vous ») : COP31, G20 de Miami, G7 2027 et 2029, OTAN à Tirana, JO de Los Angeles 2028, JO d'hiver des Alpes françaises 2030, candidature olympique de Munich (avec référendum local), sommets Choose France. Budget, sécurité et héritage décident du succès.

    **Chantiers et partenaires** : pour les Jeux d'hiver 2030, le sommet du G7 2033 sous présidence française et la **Coupe du monde de football 2038** (candidature : scénario de jeu), chaque lot (sites, sécurité, énergie, hébergement et restauration, numérique, stades) reçoit des offres de grandes entreprises, dont des membres du CAC 40 (Vinci, Bouygues, Eiffage, Capgemini, Orange, Engie, Accor, Veolia…), de Thales, EDF, Sodexo, ou de concurrents étrangers moins chers. Prix, qualité, risque de retard et emplois locaux diffèrent ; la qualité d'ensemble pèse sur la réussite de l'événement, une offre étrangère réduit la souveraineté. Dans la réalité, les marchés sont attribués par les acheteurs publics après mise en concurrence ; l'État fixe le cahier des charges.
11. **Trancher les événements**, avec 2 à 4 choix chacun : escalade dans le golfe Persique, dégradation de la note, mouvement social, blocages agricoles, sécheresse, crise de coalition, recours à Karlsruhe…
12. **Valider le trimestre** (bouton ou **Ctrl + Entrée**) et lire le bilan chiffré.

### Réalisme institutionnel

- **Agences de notation** : Fitch, Moody's et S&P partent de leurs notes réelles (France : A+ avec perspective négative chez Fitch depuis le 30/10/2026, Aa3 avec perspective négative chez Moody's le 23/10/2026, A+ chez S&P, qui doit se prononcer le 27/11/2026). Elles se prononcent à dates fixes, comme le prévoit le règlement européen, et jugent la dette, sa dynamique, le déficit, la stabilité politique et la crédibilité de vos engagements. Une perspective négative annonce une possible dégradation ; une dégradation renchérit un peu les emprunts, beaucoup plus si la note tombe en catégorie BBB ou sous BBB−. Une perspective négative met en général plusieurs trimestres à se traduire en dégradation, et une agence qui vient de changer la note attend une nouvelle évolution des fondamentaux pour bouger à nouveau. À politique inchangée, Moody's (perspective négative depuis octobre 2025) puis Fitch abaissent en général la note d'un cran en 2027-2028, S&P ensuite ; une trajectoire crédible et tenue permet de l'éviter.
- **Contrôle de constitutionnalité** : après leur adoption, les lois fragiles peuvent être censurées en tout ou en partie par le Conseil constitutionnel (France), la Cour constitutionnelle fédérale (Allemagne) ou la Cour suprême (États-Unis). Chaque réforme concernée affiche son risque, son motif et un précédent réel : taxe à 75 % censurée en 2012, 35 articles de la loi immigration censurés en janvier 2024, rétention de 210 jours censurée en août 2025, polices municipales en mai 2021, impôt sur la fortune allemand jugé inconstitutionnel en 1995. Une loi adoptée par référendum échappe au contrôle (jurisprudence de 1962).
- Le conseiller prévient avant une revue de notation risquée et avant de soumettre une réforme fragile.

### Trois modes de jeu

| | Facile | Intermédiaire | Expert |
|---|---|---|---|
| Pour qui | découvrir le jeu | jouer avec le réalisme des données | se confronter à l'incertitude |
| Défaites (censure, crise de la dette, élections) | désactivées (la partie continue avec un avertissement) | actives | actives |
| Effet des décisions budgétaires | rapide | inertie réaliste | inertie renforcée |
| Marchés, événements | indulgents, 2 événements au plus par trimestre | calibrés, 3 au plus | nerveux, plus fréquents, 4 au plus |
| Conseiller | oui | oui | non |
| Prévisions de vote | exactes | exactes | incertaines (± 25 voix) |
| Annuler le dernier trimestre | oui | non | non |
| Score | × 0,8 | × 1 | × 1,15 |

Durée et calendrier :
- **jusqu'en 2050** (par défaut) : voir ci-dessous ;
- **un mandat, calendrier réel** : présidentielle française en avril 2027, élections allemandes début 2029, présidentielle américaine en novembre 2028 ;
- **un mandat complet** : l'élection est jugée en fin de mandat.

### Programmes des personnalités (France)

Dans l'onglet « Réformes », le panneau « Programmes des personnalités » relie aux réformes du jeu les mesures emblématiques de onze personnalités : Jean-Luc Mélenchon, Marine Le Pen, Bruno Retailleau, David Lisnard, Raphaël Glucksmann, Édouard Philippe, Gabriel Attal, Fabien Roussel, Marine Tondelier, Éric Zemmour et François Ruffin (retraite à 60 ans, SMIC, blocage des prix, VIe République ; TVA à 5,5 % sur l'énergie, priorité nationale ; référendum élargi, AME, DPE ; 200 Md€ d'économies ; taxe sur les très hauts patrimoines ; règle d'or et capitalisation ; fin de l'âge légal unique ; nucléaire public ; ISF climatique ; peines planchers…). Pour chaque programme :
- les sources et le statut de chaque mesure (programme publié, proposition publique, à vérifier) ;
- le pronostic de vote à l'Assemblée du programme entier ;
- un chiffrage par simulation sur deux ans (solde public, dette, PIB, chômage, popularité) ;
- un bouton pour proposer tout le programme ce trimestre.

Les programmes 2027 étant en cours d'écriture, le jeu les simplifie et ne reprend aucune citation.

### Effets des réformes : réalistes ou accentués

À l'accueil, choisissez l'intensité des effets :
- **accentués** (par défaut) : effets doublés sur l'emploi, la croissance, les émissions et l'influence, réactions de l'opinion amplifiées de 40 % ; le coût budgétaire reste réaliste ;
- **réalistes** : calibrage prudent, proche des études économiques.

Le tableau de bord affiche l'**impact de vos réformes** : solde public, population active, chômage structurel, croissance potentielle et émissions, réforme par réforme et au total.

### Jouer le président de la République (France)

À l'accueil, choisissez votre rôle : Premier ministre (Matignon) ou président de la République (Élysée). Le président :
- nomme le Premier ministre : de son camp, de droite (LR entre au gouvernement, le PS passe dans l'opposition), de gauche (l'inverse) ou un technicien. Chaque profil change les majorités à l'Assemblée ;
- n'est pas renversé par une censure : le gouvernement tombe et un nouveau Premier ministre est nommé ;
- peut dissoudre l'Assemblée et convoquer un référendum ;
- ne peut pas se représenter en 2027 (deux mandats consécutifs au plus) : c'est le candidat de son camp qui affronte le RN.

### Institutions : Élysée, Matignon, Assemblée, Sénat (France)

L'onglet « Institutions » (rubrique Politique et opinion) modélise l'exécutif à deux têtes de la Constitution de 1958 :
- **cinq lieux du pouvoir**, dessinés et décrits : Élysée (président), Matignon (Premier ministre), Palais Bourbon (Assemblée, présidée par Yaël Braun-Pivet), Palais du Luxembourg (Sénat, présidé par Gérard Larcher, réélu le 1er octobre 2026) et Conseil constitutionnel (présidé par Richard Ferrand) ;
- la **configuration** de l'exécutif : fait majoritaire, majorité relative (la situation de départ) ou cohabitation, avec ce que chacune change ;
- l'**entente entre l'Élysée et Matignon** : elle monte quand les réformes adoptées vont dans le sens de l'autre tête de l'exécutif (les « priorités de l'Élysée » quand vous êtes Premier ministre) ; trop basse, le président refuse dissolution et référendum, et peut exiger la démission du Premier ministre ; un Premier ministre nommé par le président joué peut démissionner, comme Jacques Chirac en 1976 ;
- les **pouvoirs de chacun, article par article**, avec ceux que l'article 19 dispense de contreseing, un schéma « qui fait quoi » et le tableau de répartition des compétences.

Pouvoirs jouables :
- Premier ministre : question de confiance (article 49, alinéa 1 : une fois par session ; refusée, le Gouvernement tombe, comme celui de François Bayrou le 8 septembre 2025), 49.3, demande de dissolution ou de référendum au président (il décide) ;
- président : message au Parlement réuni en Congrès (article 18, une fois par an), dissolution, référendum (sur proposition du Gouvernement : un Premier ministre en désaccord peut refuser), nominations au Conseil constitutionnel (mars 2028, 2031... : un juriste rend le Conseil plus exigeant, un proche plus indulgent mais moins respecté), droit de grâce (événement), article 16 (crise extrême, rare : efficace à court terme, très coûteux pour la crédibilité démocratique).

**Le Sénat** (348 sièges, composition d'octobre 2026 : LR 124, Union centriste 63, socialistes 62, premier groupe RN-UDR de 15 élus…) vote chaque projet de loi. Le Gouvernement engage la procédure accélérée : en cas de désaccord, la commission mixte paritaire échoue et l'Assemblée a le dernier mot (article 45). Le Sénat peut en revanche **bloquer** une révision de la Constitution, qui doit être votée dans les mêmes termes par les deux assemblées puis par le Congrès aux trois cinquièmes (article 89), et une loi organique qui le concerne (réduction du nombre de parlementaires, article 46). La moitié des sièges est renouvelée tous les trois ans (2029, 2032...), selon l'implantation locale des partis.

**Cohabitation** : si une majorité absolue opposée au président sort des urnes (après une dissolution, par exemple), elle impose son Premier ministre.
- Président joué : la partie continue. Le Gouvernement (Jordan Bardella pour le RN, hypothèse de jeu ; ou un Premier ministre de la gauche unie) fixe le budget et fait voter son programme, un texte par trimestre ; vous gardez la défense, la diplomatie et vos pouvoirs propres, et vous répondez à chaque texte : promulguer, saisir le Conseil constitutionnel (article 61), demander une nouvelle délibération (article 10) ou refuser de signer des ordonnances (article 13, comme François Mitterrand en 1986).
- Premier ministre joué : vous quittez Matignon.

### Porte-avions : Charles-de-Gaulle et « France Libre »

Le Charles-de-Gaulle (en service depuis 2001) a son propre programme dans l'onglet Armées : arrêt technique majeur à Toulon en 2027-2028 (rechargement des réacteurs, environ dix-huit mois sans porte-avions disponible), retrait quand son successeur est opérationnel (vers 2038), prolongation possible jusqu'en 2040. Le « France Libre » n'est jamais disponible avant 2032 ; sans décision, il entre en service vers 2038.

**Deux groupes aéronavals** : la France a un seul porte-avions, donc un seul groupe aéronaval, souvent indisponible pendant les arrêts techniques. Deux décisions permettent d'en avoir deux :
- accélérer le « France Libre » (2032) **et** garder le Charles-de-Gaulle jusqu'en 2040 (onglet Armées) : deux groupes de 2032 à 2040 ;
- choisir « deux porte-avions de nouvelle génération » (réforme porte-avions) : le second entre en service en 2042, ou dès 2036 si le programme est accéléré ; les deux groupes sont alors permanents.

Tant que deux porte-avions sont en service, le surcoût d'exploitation est d'environ 0,5 Md€ par an (hypothèse de jeu). Dans l'onglet Géopolitique, chaque groupe a sa fiche, son potentiel et son propre bouton d'envoi : on peut tenir deux théâtres à la fois (Méditerranée et Indo-Pacifique, par exemple), sauf pendant l'arrêt technique d'un porte-avions. La **loi d'accélération du porte-avions « France Libre »** (onglet Réformes) vise une mise en service en 2032 : environ 0,9 Md€ par an de surcoût (hypothèse de jeu), au moins cinq ans de chantier après le vote, un risque de glissement d'un an, puis le retrait du Charles-de-Gaulle six mois plus tard.

### Négocier au G7

Chaque année au deuxième trimestre, le G7 se réunit chez le pays qui le préside (rotation réelle : États-Unis en 2027, Royaume-Uni en 2028, Allemagne en 2029, Japon en 2030, Italie en 2031, Canada en 2032, France en 2033, 2040 et 2047). Dans l'onglet « Diplomatie » :
- l'**agenda** compte quatre dossiers choisis par la présidence : commerce et droits de douane, Ukraine et avoirs russes gelés, énergie et détroit d'Ormuz, taxation des multinationales, minerais critiques, intelligence artificielle, climat, Afrique, Chine. Quand vous présidez, vous le fixez ;
- un tableau montre la **position de chaque membre** (favorable, réservé, opposé) ;
- vous choisissez **deux priorités** et, pour chacune, un **compromis** ou un **accord ambitieux** ;
- vous pouvez mettre des **concessions** sur la table (GNL et armes américains, taxe sur les services numériques, aide à l'Ukraine, fermeté face à la Chine, quotas agricoles) et tenir deux **bilatérales** (1 point de capital diplomatique chacune) ;
- les trimestres précédents, vous pouvez **mobiliser vos sherpas** pour préparer le sommet ;
- une **prévision** donne les chances d'accord ambitieux, de compromis ou d'échec (qualitative en mode Expert).

Le G7 décide par **consensus** : un accord exige un soutien moyen suffisant et aucun membre franchement hostile. Les effets touchent les exportations, le prix de l'énergie, les recettes, la souveraineté, l'influence et les relations. En France, la politique étrangère relève du domaine réservé : seul le **président de la République** négocie ; un Premier ministre voit le sommet se dérouler avec les priorités de l'Élysée. Le chancelier allemand et le président américain négocient eux-mêmes.

### Géopolitique et groupes aéronavals (France)

L'onglet « Géopolitique » (rubrique Monde) montre une **carte du monde** avec les territoires d'outre-mer et sept théâtres d'opérations : Méditerranée orientale, mer Rouge, détroit d'Ormuz, océan Indien, Indo-Pacifique, Baltique et golfe de Guinée. Chacun a un **niveau de tension** qui évolue chaque trimestre.

Vous pouvez **déplacer le groupe aéronaval** (le porte-avions Charles-de-Gaulle, puis le « France Libre » s'il est mis en service), et un second groupe si deux porte-avions sont en service (voir plus haut) :
- chaque trimestre de présence coûte (budget des armées), use le **potentiel** du groupe (équipages, munitions, maintenance), rapporte de l'influence, améliore les relations avec les pays de la zone et fait baisser la tension ;
- en mer Rouge et à Ormuz, il protège les routes du commerce et du pétrole ; une escale dans l'océan Indien améliore les chances d'exporter le Rafale en Inde ;
- quand le potentiel est épuisé, le groupe rentre à Toulon pour son entretien ; l'Indo-Pacifique, très loin, l'use plus vite.

Quand la tension d'un théâtre devient forte, une **crise** peut éclater (attaques de navires en mer Rouge, menace de fermeture d'Ormuz, évacuation de ressortissants, incident en Baltique…). Elle arrive dans l'onglet Événements, et avoir le groupe aéronaval sur place donne de meilleures options.

### Produire en France

L'onglet « Produire en France » (rubrique Économie) propose 13 dossiers où l'État demande à un grand groupe de produire en France : le paracétamol du **Doliprane** et des médicaments essentiels (Sanofi), la Twingo électrique (Renault), des batteries (Stellantis), des puces (STMicroelectronics), des munitions (Thales), des moteurs du Rafale (Safran), de l'hydrogène (Air Liquide), du cloud de confiance (Dassault Systèmes), de la maroquinerie (Hermès), des panneaux solaires (TotalEnergies), des pneus (Michelin), des transformateurs électriques (Schneider Electric).

L'État ne peut pas obliger une entreprise privée : il choisit un **levier**, chacun avec ses chances d'accord et son coût :
- **convaincre** (gratuit, mais souvent insuffisant) ;
- **aide publique** (30 % de l'investissement, dans les limites des règles européennes sur les aides d'État) ;
- **commande publique** sur 5 ans (seulement là où l'État achète : médicaments, munitions, énergie…) ;
- **faire pression** (populaire, mais refroidit les investisseurs et la relation avec le groupe).

Les chances dépendent aussi de la relation avec l'entreprise et du climat des affaires. Si elle accepte, l'usine est construite en quelques trimestres, puis crée des emplois, renforce la souveraineté et **protège des pénuries** : une rupture d'approvisionnement en médicaments ou en puces (plus probable si les relations avec la Chine se dégradent ou si l'Indo-Pacifique se tend) a alors des effets bien plus faibles. Si elle refuse, il faut attendre un an pour revenir à la charge.

Contexte réel du Doliprane : il est fabriqué à Lisieux et à Compiègne par Opella, l'ancienne branche santé grand public de Sanofi, détenue depuis 2025 par le fonds américain CD&R (50 %), Sanofi (48,2 %) et Bpifrance (1,8 %) ; l'État a obtenu des engagements de maintien de la production en France, mais le paracétamol lui-même vient surtout d'Asie, et une production doit démarrer à Roussillon (Isère) chez Seqens.

Ces deux modules s'ajoutent au jeu sans modifier le modèle économique : ils ont leur propre tirage aléatoire, si bien qu'une partie où l'on ne s'en sert pas donne les mêmes indicateurs qu'avant, à l'exception des crises et pénuries qui peuvent désormais survenir.

### Classements internationaux

L'onglet « Classements » montre :
- les 10 premières économies mondiales (PIB en dollars, FMI) ;
- le PIB des pays de la zone euro ;
- la dette et le solde public des 21 pays de l'euro (Eurostat 2025, Bulgarie comprise depuis janvier 2026) ;
- les budgets militaires (SIPRI 2025 : États-Unis, Chine, Russie, Allemagne… France 9e avec 68 Md$) et l'effort de défense en % du PIB, avec la cible de 3,5 % de l'OTAN ;
- la **croissance du PIB, en % par an**, des 10 premières économies mondiales et des pays de la zone euro : une petite courbe par pays, les cinq dernières années et la moyenne depuis le début de la partie. C'est une croissance **nominale** (volume et prix, en dollars pour le monde, en euros pour la zone euro) ; pour la France, le texte rappelle la croissance réelle et l'inflation de l'année.

Votre pays bouge selon vos décisions. Les autres suivent leur trajectoire de croissance et de solde public (hypothèses calées sur le FMI et la Commission), avec les chocs mondiaux de la partie et leurs propres aléas. À politique inchangée, la France reste 2e de la zone euro mais glisse vers la 9e place mondiale en 2050, dépassée par le Brésil et l'Indonésie (taux de change constants).

### Jouer jusqu'en 2050

- **Élections à leur date** (théorique au-delà du mandat en cours) :
  - France : présidentielles 2027, 2032, 2037, 2042 et 2047, suivies des législatives ; régionales, municipales et européennes ;
  - Allemagne : Bundestag tous les 4 ans, recalé après une élection anticipée ; Länder ; européennes ;
  - États-Unis : présidentielle tous les 4 ans avec renouvellement du Congrès, mi-mandat entre deux.
- **Perdre le pouvoir arrête la partie**, mais l'écran de fin propose de continuer en **bac à sable** (score arrêté à la date de la défaite) pour voir où mènent vos choix.
- **France** : un gouvernement renversé par une censure est remplacé par un autre de votre camp (comme après les chutes de Michel Barnier puis de François Bayrou). Cela coûte de la crédibilité et de la stabilité ; un budget censuré est remplacé par une loi spéciale.
- **Usure du pouvoir** : chaque nouvelle présidentielle française repart d'un duel serré (48/52) ; aux États-Unis, un camp qui brigue un troisième mandat consécutif perd 3 points (modèle « time for change » d'Alan Abramowitz).
- **Long terme** :
  - la hausse du nombre de retraités ralentit après le départ des générations du baby-boom ;
  - à 0 %, la dépense de santé suit les besoins liés au vieillissement (+0,8 % par an en volume en France, +0,9 % en Allemagne, +3,2 % pour Medicare et Medicaid) ;
  - aux États-Unis, l'épuisement du fonds de la Social Security (vers 2034) entraîne la baisse automatique des pensions prévue par la loi.
- **Objectifs** : ceux du mandat en cours sont jugés à sa fin, puis viennent les objectifs 2050 (dette, émissions, dépenses de retraite).
- **Ordres de grandeur, France, à politique inchangée** : la dette dépasse 140 % du PIB et l'écart de taux franchit 300 points vers 2036, ce qui déclenche une crise de la dette. Les réformes lentes montrent ici leurs effets : avec la retraite à 68 ans, la dette repasse sous 100 % avant 2050, surtout grâce à des intérêts plus faibles (effet « boule de neige » inversé).

### Pour rendre le jeu agréable

- un écran d'accueil avec **partie rapide** (un bouton) ou **partie personnalisée** (pays, mode, durée, effets, rôle) ;
- un onglet Entreprises avec les **40 valeurs du CAC 40** (composition inchangée depuis le 22 décembre 2025 selon Euronext et la presse : entrée d'Euronext en septembre 2025, d'Eiffage en décembre 2025), des fleurons non cotés (EDF, Naval Group) et Dassault Aviation, avec un filtre « CAC 40 » ;
- un **code de partie** : avec le même code et les mêmes décisions, on vit les mêmes événements, ce qui permet de se lancer des défis ; le résultat final se **partage** en un geste (feuille de partage du téléphone ou copie) ;
- un **menu unique** (☰) : sauvegarder, charger, options, visite guidée, partager le jeu, à propos ;
- des **options** enregistrées dans le navigateur : interface essentielle (par défaut) ou complète, thème clair, sombre ou comme l'appareil, taille du texte, animations réduites, confirmation avant de valider un trimestre s'il reste des événements à trancher ;
- une page **« À propos »** : ce que le jeu est et n'est pas, vie privée, code source, signalement d'erreurs ;
- une navigation simplifiée en rubriques (Tableau de bord, Gouverner, Régalien, Politique et opinion avec les institutions, Économie avec « Produire en France » et les entreprises, Monde avec la géopolitique, les classements internationaux et les grands rendez-vous, Journal et sources ; les ménages types et les sources détaillées en interface complète), avec des sous-onglets ; le jeu retient le dernier sous-onglet ouvert dans chaque rubrique ;
- un **tableau de bord** dont les indicateurs sont rangés en quatre groupes (économie ; finances publiques, avec le fonds souverain s'il existe ; politique et société ; monde, souveraineté et climat), et des graphiques qui s'adaptent à la largeur de l'écran (textes lisibles sur téléphone) ;
- un **conseiller** signale chaque trimestre les urgences (budget qui ne passe pas, censure, shutdown, plafond de la dette, élection proche, risque social, fleuron en difficulté) avec un bouton « Agir » qui mène au bon onglet ;
- une **visite guidée** en neuf étapes au premier tour du mode Facile (bouton « ? » pour la relancer) ;
- des **chiffres animés** qui clignotent en vert ou en rouge selon que la variation est favorable ;
- un **bilan de trimestre** animé, des **notifications** (votes, élections, réformes, entreprises) et des **confettis** quand vous gagnez une élection, réussissez des Jeux ou débloquez un succès ;
- 16 **succès** à débloquer (premier budget, sous les 3 %, la dette recule, le peuple a tranché, des Jeux réussis…) ;
- les animations respectent le réglage système « réduire les animations ».

### Régimes politiques modélisés

| | France (semi-présidentiel) | Allemagne (coalition) | États-Unis (présidentiel) |
|---|---|---|---|
| Vote du budget | Chaque T4 ; vote, puis 49.3, compromis avec le PS, ordonnances (art. 47) ou loi spéciale | Chaque T4 ; vote de la coalition (défections possibles) | Crédits votés avant le 1er octobre (T3) et au premier tour (fin du financement provisoire le 11/12/2026) : Chambre puis 60 voix au Sénat ; budget complet, financement provisoire (CR) ou compromis ; sinon **shutdown** |
| Survie | Motion de censure (majorité absolue de 289) après un 49.3 ou spontanée | Satisfaction du SPD ; rupture de la coalition, puis élections | Le président ne peut pas être renversé ; défaite en cas de **défaut** (plafond de la dette non relevé) |
| Autres règles | 49.3 limité à un texte hors budget par session ; dissolution ; référendum ; présidentielle suivie de législatives | Bundesrat pour les lois fiscales ; deux tiers pour réviser la Constitution ; question de confiance ; accord de coalition suivi point par point | Obstruction au Sénat (60 voix) ; réconciliation budgétaire à 51 voix une fois par exercice, hors Social Security (règle Byrd) ; mi-mandat en novembre 2026 ; présidentielle 2028 sans le président sortant |
| Règles budgétaires | Procédure européenne pour déficit excessif, clause dérogatoire défense | Frein à l'endettement (défense au-delà de 1 % du PIB et fonds spécial exclus) | Plafond légal de la dette brute (41 100 Md$) ; fonds de la Social Security (épuisement projeté en 2034, 2032 pour le seul fonds retraite) |

Les **objectifs** sont générés automatiquement à partir de la situation de départ : 3 à 5 principaux et des secondaires, avec une jauge de progression. Le **score final** pondère soutenabilité, bien-être social, transition écologique, innovation, stabilité politique, influence et objectifs, avec des poids qui dépendent du régime.

## Données : sources, statuts et mise à jour

Les données de chaque pays sont dans `countries/<pays>.json` (dont `etats-unis.json`, périmètre fédéral, en Md$) ; le contexte commun (énergie, BCE, OTAN) est dans `countries/_contexte-mondial.json` et les grands rendez-vous internationaux dans `countries/_grands-evenements.json`. Chaque valeur est stockée avec sa source, son URL, sa date et un **statut** :

| Statut | Signification |
|---|---|
| `officiel` | publication d'un institut statistique, d'une banque centrale, du Parlement |
| `prevision_officielle` | prévision du gouvernement ou d'une institution publique |
| `secondaire` | chiffre officiel relayé par la presse ou un site tiers |
| `derive` | calculé à partir de données sourcées (calcul indiqué) |
| `marche` | donnée de marché approximative |
| `a_verifier` | trouvée mais non recoupée |
| `introuvable` | non trouvée : valeur `null`, jamais inventée |
| `estimation` | estimation de jeu, signalée dans l'interface |

L'onglet **« Données et sources »** du jeu affiche toutes ces valeurs, leur lien et la liste des données manquantes ou estimées. La date de dernière mise à jour est affichée sur l'accueil et le tableau de bord.

### Rafraîchir les données

```bash
npm run update-data                    # tous les pays
npm run update-data -- --pays=france   # un pays
npm run update-data -- --dry-run       # affiche sans écrire
```

Le script interroge trois sources :
- **Eurostat** : déficit, dette, dépenses et recettes, PIB, IPCH, chômage, taux à long terme, R&D, dépenses par fonction (COFOG) ;
- **le FMI** : prévisions de croissance, d'inflation, de dette et de solde ;
- **la Banque mondiale** : R&D.

Il met à jour les valeurs avec la date du jour. Une source qui ne répond pas laisse la valeur existante intacte. Pour l'Allemagne, dès que la ventilation COFOG d'Eurostat est disponible, elle remplace automatiquement les « estimations de jeu ».

Ces API ne couvrent ni la politique (sièges, sondages, gouvernement), ni les budgets nationaux détaillés, ni les données sociales fines (retraites, ménages types). Ces données se mettent à jour à la main dans le fichier JSON du pays, en renseignant `source`, `url`, `date` et `statut`.

## Architecture

```
countries/              données sourcées (un fichier par pays + contexte mondial)
scripts/
  update-data.mjs       mise à jour des données depuis Eurostat, FMI, Banque mondiale
  simuler.mjs           simulation en ligne de commande
src/model/              HYPOTHÈSES DE MODÉLISATION (séparées des données)
  parametres.js         multiplicateurs, élasticités, vitesses d'ajustement, modes
  ministeres.js         postes budgétaires : composition, groupes sensibles, effets de long terme
  impots.js             prélèvements : assiettes, élasticités, multiplicateurs
  pays/<pays>.js        calibrage : données sourcées → état de départ 2026
src/engine/             moteur de simulation en JavaScript pur (sans interface), testé
  index.js              creerPartie, jouerTour, apercuDecisions, chiffrerReforme, previsionPolitique
  macro.js              écart de production, croissance, inflation, chômage, énergie
  fiscalite.js          recettes par prélèvement
  depenses.js           postes budgétaires et inertie
  finances.js           dette, taux moyen, prime de risque, règles budgétaires
  retraites.js          âge légal, effectifs, indexation
  travail.js            temps de travail et heures supplémentaires
  menages.js            ménages types (euros par mois)
  social.js             popularité par groupe et ses composantes, griefs, risque de mouvement social
  communication.js      actions de communication : effets, usure de l'opinion, recharge, petites phrases
  pouvoir.js            solidité du pouvoir : popularité, marge électorale, menace parlementaire
  notation.js           agences de notation : notes réelles de départ, revues à dates fixes, effets sur les taux
  constitution.js       contrôle de constitutionnalité des réformes adoptées (censure totale ou partielle)
  defense.js            programmes d'armement, capacités, commandes supplémentaires renouvelables, opérations, exportations, dissuasion
  chantiers.js          chantiers des grands événements : lots, offres, coûts, aléas, qualité
  geopolitique.js       théâtres, tensions, groupe aéronaval (déploiement, usure, entretien), crises
  institutions.js       Élysée et Matignon (entente, configuration), Sénat (navette, article 89), cohabitation, 49.1, Congrès
  relocalisation.js     « Produire en France » : leviers, chances, usines, résilience, pénuries
  reformes.js           adoption et effets des réformes
  international.js      relations, influence, accords
  politique.js          partis, votes, 49.3, censure, coalition, Congrès, shutdown, plafond de la dette
  opinion.js            baromètre de satisfaction et intentions de vote
  elections.js          élections du calendrier, législatives, municipales, Länder, mi-mandat, Congrès, référendum
  horizon.js            partie jusqu'en 2050 : scrutins récurrents, recalage après une élection anticipée
  classements.js        classements internationaux : PIB mondial, zone euro, dette et déficit des pays de l'euro
  g7.js                 sommets du G7 : agenda, positions, consensus, concessions, bilatérales, effets
  entreprises.js        Bourse (krachs compris), climat des affaires, souveraineté, fleurons, État stratège
  capitalisation.js     retraite par capitalisation : fonds, rendements, double charge, projection sur 30 ans
  objectifs.js          génération et suivi des objectifs
  evenements.js         tirage et résolution des événements (dont grands rendez-vous)
  conseiller.js         conseils du trimestre
  succes.js             succès à débloquer
  score.js              score final
src/data/               catalogues : réformes (dont reformesFrance.js, reformesOrientations.js et reformesEtat.js), risques constitutionnels (constitution.js), défense (defense.js), chantiers (chantiers.js), géopolitique (geopolitique.js), relocalisations (relocalisations.js), institutions (institutions.js, evenementsInstitutions.js), actions diplomatiques,
                        événements, partis, entreprises et programmes, grands rendez-vous
src/express/            mode Express : cartes de décision et moteur (déterministe, testé)
src/ui/                 interface React (écrans, composants, sauvegarde, options, partage, installation)
src/ui/3d/              modèles 3D (three.js, chargés à la demande par famille : modeles.js, avions.js, aeronefs.js, materiels.js, palais.js, marine.js pour les bâtiments de la Marine) et visionneuse
src/ui/express/         interface du mode Express et image de score à partager
public/                 manifeste de l'application, service worker (hors connexion), icônes
tests/                  tests unitaires (Vitest)
```

### Principales équations (pas trimestriel)

- **Dette** : `dette(t+1) = dette(t) + déficit/4 − cessions`. Taux moyen : chaque trimestre, `1/(4 × maturité)` de la dette est refinancée au taux d'émission du moment.
- **Taux à 10 ans** : taux BCE + prime de terme + prime de risque `a·max(0, dette−60)/10 + c·(max(0, dette−100)/10)² + b·max(0, déficit−3) + p·instabilité − crédibilité`, calibrée pour retrouver 4,77 % (OAT) et 3,55 % (Bund) au départ. Au-delà de 300 pb d'écart pendant deux trimestres : crise de la dette.
- **Croissance** : PIB réel = PIB potentiel × (1 + écart de production). L'écart évolue avec l'impulsion budgétaire (variation des dépenses pondérées par leurs multiplicateurs : investissement 1,1, personnel 0,8, fonctionnement 0,7, transferts 0,5 ; amplifiés en bas de cycle ; composante persistante sur environ deux ans), le choc énergétique, la demande mondiale, les taux et la confiance.
- **Effets différés** : stocks de recherche, de capital humain, d'infrastructures et de capital « vert », alimentés par les postes correspondants avec des délais de 1 à 3 ans, qui augmentent le PIB potentiel et réduisent les émissions.
- **Inflation** : courbe de Phillips ancrée sur la cible de 2 %, plus l'énergie (répercussion calée sur la hausse observée) et les hausses de TVA. **Chômage** : loi d'Okun.
- **Recettes** : `rendement = R0 × facteur de taux × (taux/taux de départ)^élasticité × indice d'assiette`.
- **Retraites** : `dépense = retraités × pension moyenne × 12 × coefficient` ; un an d'âge légal en plus retarde environ 400 000 départs en France (estimation), avec des prestations de remplacement pour les seniors sans emploi.

## Étendre le jeu

### Ajouter un pays

1. Créer `countries/<pays>.json` sur le modèle de `france.json` : macroéconomie, finances publiques (dont dépenses par fonction et recettes par prélèvement), retraites, travail, politique (groupes parlementaires et sièges), international, recherche et climat. Chaque valeur doit porter `source`, `url`, `date` et `statut`.
2. Créer `src/model/pays/<pays>.js` sur le modèle de `france.js`. Il construit l'état de départ : montants des 15 postes, rendements des prélèvements, paramètres des retraites, ménages types, groupes sociaux, calendrier (échéances, nombre de tours), règles budgétaires, partenaires.
3. L'enregistrer dans `PROFILS` (`src/engine/etatInitial.js`) et dans `PAYS` (`src/ui/donnees.js`).
4. Ajouter ses partis dans `src/data/partis.js` (positions sur les 9 axes, posture, seuil de censure) et, si le régime est nouveau (présidentiel, minoritaire), ses règles dans `src/engine/politique.js` et ses pondérations dans `src/engine/score.js`.
5. Ajouter ses fleurons et programmes dans `src/data/entreprises.js`, ses familles politiques et thèmes de départ dans `src/engine/opinion.js`, ses grands rendez-vous dans `countries/_grands-evenements.json` et `src/data/grandsEvenements.js`.
6. Ajouter le pays à `scripts/update-data.mjs` (codes Eurostat et ISO), puis lancer `npm test`.

Les États-Unis montrent comment ajouter un régime présidentiel : devise et banque centrale propres (`devise: '$'`, `banqueCentrale: 'fed'`), Congrès bicaméral et règles budgétaires nationales (`plafond_dette`).

### Ajouter un événement

Ajouter une entrée au tableau `EVENEMENTS` de `src/data/evenements.js` :

```js
{
  id: 'greve_raffineries',
  titre: 'Grève dans les raffineries',
  pays: ['france'],                                    // ou 'tous'
  condition: (e) => e.social.groupes.salaries.risque > 40,
  probabilite: () => 0.2,                               // par trimestre
  description: () => 'Les raffineries sont bloquées, les stations-service à sec.',
  choix: [
    { id: 'requisition', texte: 'Réquisitionner les salariés', effets: () => ({ chocs: { salaries: -5 }, instabilite: 0.05, texte: '…' }) },
    { id: 'negocier', texte: 'Négocier', effets: () => ({ depensesExceptionnelles: 0.5, chocs: { salaries: 3 }, texte: '…' }) },
  ],
}
```

Effets disponibles :
- **budget et économie** : `depensesExceptionnelles`, `depensesTemporaires`, `chocPIB`, `chocTaux`, `energie` ;
- **opinion** : `chocs`, `opinion`, `grief`, `reduireGrief`, `retirerReforme` ;
- **politique et international** : `relations`, `influence`, `instabilite`, `credibilite`, `coalition`, `chocAfD`.

### Ajouter une réforme

Ajouter une entrée au tableau `REFORMES` de `src/data/reformes.js`. Une réforme comporte des `options`, un `delai`, et :
- `appliquer(e, option)` pour modifier les règles d'un sous-modèle ;
- `effets(e, option, age)` pour ses effets continus (dépenses, recettes, offre de travail, chômage structurel…) ;
- `reaction(e, option)` pour les chocs de popularité, les opinions durables, les griefs et compensations, la crédibilité ;
- des `axes` politiques (pour les votes) et un texte de `chiffrage`.

Le chiffrage par simulation et la prévision de vote fonctionnent automatiquement.

## Limites connues

- Le modèle macroéconomique est volontairement simple et pédagogique. Ce n'est pas un modèle de prévision. Les multiplicateurs et élasticités sont des hypothèses documentées dans `src/model/parametres.js`.
- Certaines données sont des estimations de jeu, signalées comme telles :
  - Allemagne : ventilation par fonction (en attendant `update-data`) et charge d'intérêts totale ;
  - France : sous-ventilation des affaires économiques, intérêts de 2024, maturité de la dette ;
  - revenus des ménages types autres que le salaire minimum et la pension moyenne.
- En France, la répartition des 50 sièges non ventilés (LIOT, UDR, non-inscrits) est estimée. La composition du Bundesrat n'a pas été collectée.
- États-Unis : seul le budget fédéral est modélisé (pas les États fédérés) ; la ventilation des dépenses hors Social Security, santé et défense est estimée ; l'effectif du Freedom Caucus est estimé.
- Entreprises : capitalisations et emplois des fleurons sont des ordres de grandeur ; plusieurs parts de l'État sont « à vérifier ». Les niveaux du CAC 40 et du S&P 500 n'ayant pas été collectés, ces indices partent de la base 100.
- Baromètre : les niveaux de départ des dix thèmes sont des estimations de jeu ; la clé sièges-voix des législatives françaises et les décalages régionaux des Länder sont des hypothèses.
- Grands rendez-vous : les dates du G7 2027 et de l'OTAN 2027 sont à préciser, le G7 2029 en Allemagne est déduit de la rotation, et le « dialogue ciblé » du CIO avec Munich est un scénario de jeu.
- Partie jusqu'en 2050 :
  - les dates des scrutins au-delà du mandat en cours sont théoriques ;
  - la croissance potentielle est constante ;
  - les dépenses autres que les retraites, la santé et les intérêts sont constantes en volume à politique inchangée, ce qui les fait baisser en part du PIB plus vite que dans les projections officielles (CBO, COR) ;
  - le profil démographique des retraités et les besoins de santé liés au vieillissement sont des hypothèses de jeu calées sur des ordres de grandeur.
- G7 : les positions des membres sur chaque dossier sont des hypothèses de jeu fondées sur leurs positions publiques (sommets de Kananaskis en 2025 et d'Évian en 2026) ; le lieu et la date du sommet américain de 2027 n'étaient pas connus à la collecte.
- Classements : taux de change constants ; plusieurs données de départ (PIB hors top 11, dette et déficit de certains pays de l'euro) sont des estimations signalées comme telles dans `countries/_contexte-mondial.json`.
- Notation : les coefficients du modèle des agences et le calendrier des revues (deux par an et par agence) sont des hypothèses de jeu ; les notes de départ de l'Allemagne et des États-Unis sont à revérifier.
- Contrôle de constitutionnalité : les probabilités de censure sont des estimations de jeu ; les précédents cités sont réels.
- Phénix, hélicoptères et disponibilité : le nombre de Phénix en service fin 2026 (12 ou 13 selon les sources), les dates du Tigre standard 3 et du retrait des Puma, l'indice de disponibilité (45 % au départ) et les coûts des options sont des hypothèses de jeu ; la livrée exacte des Caïman des forces spéciales n'a pas été confirmée par une source ; la photo de référence du Tigre montre un appareil australien ; sur le Caïman Marine, le radôme, les flotteurs et le sonar sont représentés de façon simplifiée (le sonar descend dans le jeu à 6 m, bien moins qu'en réalité).
- Mirage 2000 : la date de retrait du 2000-5F (vers 2030) est indicative, l'étape intermédiaire de 2033 (25 Mirage 2000D retirés) et les coûts des options sont des hypothèses de jeu ; le « tout Rafale » de 2035 suppose de nouvelles commandes de Rafale.
- Armée de Terre : les objectifs (1 437 Griffon et 238 Jaguar en 2030, 160 Leclerc rénovés fin 2030 et 200 fin 2035, 109 Caesar MkII commandés) viennent de la loi de programmation et de la DGA, dans leur version connue en 2023-2024 ; une actualisation de la LPM a pu les modifier.
- Modèles 3D : formes simplifiées. La longueur exacte du Griffon et les formes du Caesar MkII ne sont pas toutes publiées ; le satellite est une silhouette indicative (la forme des satellites CSO n'est pas publique) ; les palais ont des proportions approximatives et des façades simplifiées ; dans les hémicycles, la place des groupes est schématique.
- Défense : les coûts des options et des commandes supplémentaires (prix unitaires arrondis, délais de livraison), et leurs effets, sont des hypothèses de jeu ; les dates de livraison du Rubis, du Casabianca, de l'Émile Bertin et du Gustave Zédé sont indicatives ; la disposition des superstructures des navires en 3D est simplifiée ; le coût de la dissuasion n'est publié qu'en part de la LPM (environ 13 %). Les dessins sont des illustrations stylisées, pas des plans. La force de réassurance en Ukraine et le prospect d'exportation dans le Golfe sont des scénarios de jeu.
- Chantiers : montants, prix, qualités et risques des offres sont des hypothèses de jeu ; la candidature française à la Coupe du monde 2038 est un scénario (aucune candidature déposée à ce jour).
- Entreprises du CAC 40 : capitalisations et effectifs sont des ordres de grandeur 2025 ; la composition de l'indice est révisée chaque trimestre (prochaine revue en décembre 2026).
- Mode Express : les situations et leurs effets sont des scénarios de jeu.
- Géopolitique : niveaux de tension, coûts de présence, usure du groupe aéronaval et effets des crises sont des hypothèses de jeu ; les descriptions des théâtres s'appuient sur des faits publics (opération Aspides, mission Akila…). La carte utilise les frontières simplifiées de Natural Earth (domaine public).
- Produire en France : les contextes sont des faits publics ; investissements, emplois, délais et chances d'accord sont des hypothèses de jeu.
- Institutions : articles de la Constitution, compositions (Sénat d'octobre 2026) et précédents sont sourcés ; l'entente entre l'Élysée et Matignon, les votes du Sénat (calqués sur les groupes proches à l'Assemblée), le renouvellement sénatorial, les effets de la saisine du Conseil constitutionnel et le programme d'un gouvernement de cohabitation sont des hypothèses de jeu. En cohabitation, les événements restent tranchés par le joueur.
- Plafond de dépense publique : la répartition des économies entre postes, leurs effets sur l'offre de travail et sur les ménages types, et le plafond de 45 % de la dépense supprimable sont des hypothèses de jeu ; le jeu applique la trajectoire comme une règle contraignante, alors qu'une loi de programmation des finances publiques ne l'est pas.
- Fonds souverain : les tendances, volatilités et dividendes des marchés (S&P 500 environ 6 % par an hors dividendes, STOXX Europe 600 environ 4 %, émergents environ 5 %), la probabilité de krach mondial (environ 1,2 % par trimestre), les taux de change constants, le rééquilibrage sans frais, les effets sur la demande et la croissance potentielle et la part des économies réinvesties sont des hypothèses de jeu ; les indices partent de la base 100 à la création du fonds (niveaux réels non collectés). Le fonds norvégien (NBIM) et Bpifrance servent de repères.
- Croissance des pays dans les classements : croissance nominale à taux de change constants ; les écarts entre pays reflètent les hypothèses de croissance et d'inflation calées sur le FMI.
- Deux groupes aéronavals : la date du second porte-avions de nouvelle génération (2042, ou 2036 accéléré) et le surcoût d'exploitation sont des hypothèses de jeu ; aucun second porte-avions n'est décidé à ce jour.
- Porte-avions : les dates de l'arrêt technique majeur du Charles-de-Gaulle viennent de la presse spécialisée, non confirmées officiellement ; le coût du « France Libre » n'est pas publié (10 à 15 Md€ selon la presse) ; le calendrier accéléré à 2032 est un scénario de jeu.
- Programmes des candidats : les programmes pour 2027 sont incomplets et les sources se contredisent parfois (âge de départ chez Édouard Philippe et Gabriel Attal, statut de la candidature de Marine Tondelier) ; Éric Zemmour est surtout représenté par son programme de 2022. Chaque mesure indique son statut.
- Pays jouables : France, Allemagne, États-Unis. La Suède, le Danemark, le Royaume-Uni, l'Italie, l'Espagne, les Pays-Bas, le Canada et le Japon sont à ajouter selon la procédure ci-dessus.
