# 🏛️ Chef de gouvernement

Jeu de simulation en français : vous dirigez le gouvernement d'un pays réel (France, Allemagne, États-Unis) à partir de sa **situation réelle au 1er novembre 2026**. Vous gérez le budget ministère par ministère, la fiscalité, la dette, les réformes structurelles et leurs compensations, le Parlement ou le Congrès, les entreprises et les participations de l'État, l'opinion et les élections, l'Europe, la diplomatie et les grands rendez-vous internationaux (sommets, Jeux olympiques). Les effets sur la population sont visibles en euros (ou en dollars) par mois pour des ménages types.

Application 100 % front-end (React + Vite), sans serveur, sans compte et sans mesure d'audience. Sauvegarde automatique dans le navigateur, export et import en JSON.

**Jouer en ligne** : https://orel9419.github.io/test-/ (une fois GitHub Pages activé, voir « Publier le jeu »). Le bouton « Jouer maintenant » lance une partie en France, comme Premier ministre, en mode Facile avec visite guidée ; « Personnaliser la partie » donne accès à tous les réglages.

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
8. **Suivre l'opinion et les élections** (onglet « Opinion et élections ») : baromètre de satisfaction sur dix thèmes, intentions de vote, projection « si l'élection avait lieu aujourd'hui », résultats. Les élections intermédiaires (régionales, Länder, européennes, mi-mandat américain) et nationales découlent de vos décisions. Vous pouvez déclencher un **référendum** (France, article 11), une **dissolution** (France) ou une **question de confiance** (Allemagne).
9. **Préparer les grands rendez-vous** (onglet « Grands rendez-vous ») : COP31, G20 de Miami, G7 2027 et 2029, OTAN à Tirana, JO de Los Angeles 2028, JO d'hiver des Alpes françaises 2030, candidature olympique de Munich (avec référendum local), sommets Choose France. Budget, sécurité et héritage décident du succès.
10. **Trancher les événements**, avec 2 à 4 choix chacun : escalade dans le golfe Persique, dégradation de la note, mouvement social, blocages agricoles, sécheresse, crise de coalition, recours à Karlsruhe…
11. **Valider le trimestre** (bouton ou **Ctrl + Entrée**) et lire le bilan chiffré.

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

Dans l'onglet « Réformes », le panneau « Programmes des personnalités » relie aux réformes du jeu les mesures emblématiques de Jean-Luc Mélenchon, Marine Le Pen, Bruno Retailleau, David Lisnard et Raphaël Glucksmann (retraite à 60 ans, SMIC, blocage des prix, VIe République ; TVA à 5,5 % sur l'énergie, priorité nationale ; référendum élargi, AME, DPE ; 200 Md€ d'économies ; taxe sur les très hauts patrimoines…). Pour chaque programme :
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

### Négocier au G7

Chaque année au deuxième trimestre, le G7 se réunit chez le pays qui le préside (rotation réelle : États-Unis en 2027, Royaume-Uni en 2028, Allemagne en 2029, Japon en 2030, Italie en 2031, Canada en 2032, France en 2033, 2040 et 2047). Dans l'onglet « Diplomatie » :
- l'**agenda** compte quatre dossiers choisis par la présidence : commerce et droits de douane, Ukraine et avoirs russes gelés, énergie et détroit d'Ormuz, taxation des multinationales, minerais critiques, intelligence artificielle, climat, Afrique, Chine. Quand vous présidez, vous le fixez ;
- un tableau montre la **position de chaque membre** (favorable, réservé, opposé) ;
- vous choisissez **deux priorités** et, pour chacune, un **compromis** ou un **accord ambitieux** ;
- vous pouvez mettre des **concessions** sur la table (GNL et armes américains, taxe sur les services numériques, aide à l'Ukraine, fermeté face à la Chine, quotas agricoles) et tenir deux **bilatérales** (1 point de capital diplomatique chacune) ;
- les trimestres précédents, vous pouvez **mobiliser vos sherpas** pour préparer le sommet ;
- une **prévision** donne les chances d'accord ambitieux, de compromis ou d'échec (qualitative en mode Expert).

Le G7 décide par **consensus** : un accord exige un soutien moyen suffisant et aucun membre franchement hostile. Les effets touchent les exportations, le prix de l'énergie, les recettes, la souveraineté, l'influence et les relations. En France, la politique étrangère relève du domaine réservé : seul le **président de la République** négocie ; un Premier ministre voit le sommet se dérouler avec les priorités de l'Élysée. Le chancelier allemand et le président américain négocient eux-mêmes.

### Classements internationaux

L'onglet « Classements » montre :
- les 10 premières économies mondiales (PIB en dollars, FMI) ;
- le PIB des pays de la zone euro ;
- la dette et le solde public des 21 pays de l'euro (Eurostat 2025, Bulgarie comprise depuis janvier 2026) ;
- les budgets militaires (SIPRI 2025 : États-Unis, Chine, Russie, Allemagne… France 9e avec 68 Md$) et l'effort de défense en % du PIB, avec la cible de 3,5 % de l'OTAN.

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
- un **code de partie** : avec le même code et les mêmes décisions, on vit les mêmes événements, ce qui permet de se lancer des défis ; le résultat final se **partage** en un geste (feuille de partage du téléphone ou copie) ;
- un **menu unique** (☰) : sauvegarder, charger, options, visite guidée, partager le jeu, à propos ;
- des **options** enregistrées dans le navigateur : interface essentielle (par défaut) ou complète, thème clair, sombre ou comme l'appareil, taille du texte, animations réduites, confirmation avant de valider un trimestre s'il reste des événements à trancher ;
- une page **« À propos »** : ce que le jeu est et n'est pas, vie privée, code source, signalement d'erreurs ;
- une navigation simplifiée en rubriques (Tableau de bord, Gouverner, Politique et opinion, Monde, Journal et sources, plus Économie en interface complète), avec des sous-onglets ; le jeu retient le dernier sous-onglet ouvert dans chaque rubrique ;
- un **conseiller** signale chaque trimestre les urgences (budget qui ne passe pas, censure, shutdown, plafond de la dette, élection proche, risque social, fleuron en difficulté) avec un bouton « Agir » qui mène au bon onglet ;
- une **visite guidée** en huit étapes au premier tour du mode Facile (bouton « ? » pour la relancer) ;
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
src/data/               catalogues : réformes (dont reformesFrance.js, reformesOrientations.js et reformesEtat.js), risques constitutionnels (constitution.js), actions diplomatiques,
                        événements, partis, entreprises et programmes, grands rendez-vous
src/ui/                 interface React (écrans, composants, sauvegarde, options, partage, installation)
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
- Pays jouables : France, Allemagne, États-Unis. La Suède, le Danemark, le Royaume-Uni, l'Italie, l'Espagne, les Pays-Bas, le Canada et le Japon sont à ajouter selon la procédure ci-dessus.
