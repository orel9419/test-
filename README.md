# 🏛️ Chef de gouvernement

Jeu de simulation en français : vous dirigez le gouvernement d'un pays réel (France, Allemagne pour l'instant) à partir de sa **situation réelle au 1er novembre 2026**. Vous gérez le budget ministère par ministère, la fiscalité, la dette, les réformes structurelles et leurs compensations, le Parlement, l'Europe et la diplomatie. Les effets sur la population sont visibles en euros par mois pour des ménages types.

Application 100 % front-end (React + Vite), sans serveur. Sauvegarde automatique dans le navigateur, export et import en JSON, thème clair et sombre.

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
```

## Comment jouer

Un tour = un trimestre. La partie dure un mandat : 20 trimestres pour la France, 16 pour l'Allemagne. À chaque tour, vous pouvez :

1. **Consulter le tableau de bord** : PIB, croissance, inflation, chômage, dette, déficit, charge d'intérêts, taux à 10 ans et écart avec l'Allemagne, popularité, rapport de force parlementaire, cohésion sociale, émissions, effort de R&D, influence. Chaque indicateur a une infobulle explicative.
2. **Répartir le budget** entre 15 postes, avec des curseurs en volume (hors inflation). Le panneau d'impact estime en temps réel l'effet sur le solde, la croissance, le chômage, la popularité par groupe et le revenu de chaque ménage type. Une **inertie** réaliste s'applique : on réduit plus vite un investissement qu'une masse salariale.
3. **Fixer les impôts** (TVA, impôt sur le revenu, impôt sur les sociétés, CSG, cotisations, taxes sur l'énergie, successions), la part de dette émise à court terme, et annoncer une **trajectoire de déficit** (la tenir renforce la crédibilité, la manquer coûte cher).
4. **Proposer des réformes**, par exemple :
   - retraites : âge, indexation, compensations sur la pénibilité, le minimum de pension, les carrières longues ;
   - temps de travail : 35, 37 ou 39 h, heures payées, exonérées ou non payées ;
   - fonction publique, assurance chômage, TVA sociale, impôt sur les très hauts patrimoines, bouclier énergétique ;
   - pour l'Allemagne : âge de la retraite, cotisation de 2028, frein à l'endettement, revenu citoyen.

   Chaque réforme peut être **chiffrée sur 3 ans par simulation**. Elle passe ensuite devant le Parlement, et une prévision du vote est affichée.
5. **Agir à l'international** avec un capital diplomatique limité :
   - contrats de gaz, achats groupés ;
   - prêts européens SAFE, clause dérogatoire défense, emprunt commun européen ;
   - budget de l'UE 2028-2034, Mercosur, aide à l'Ukraine, droits de douane américains, projets franco-allemands.
6. **Trancher les événements**, avec 2 à 4 choix chacun : escalade dans le golfe Persique, dégradation de la note, mouvement social, blocages agricoles, sécheresse, crise de coalition, recours à Karlsruhe…
7. **Valider le trimestre** et lire le bilan chiffré.

Modes : **bac à sable** (aucune défaite, pas d'inertie), **réaliste**, **difficile** (marchés nerveux, plus d'événements). Calendrier : **réel** (présidentielle française en avril 2027, élections allemandes début 2029) ou **mandat complet** (l'élection est jugée en fin de mandat).

### Régimes politiques modélisés

| | France (semi-présidentiel) | Allemagne (coalition) |
|---|---|---|
| Vote du budget | Chaque T4 ; vote, puis 49.3, compromis avec le PS, ordonnances (art. 47) ou loi spéciale | Chaque T4 ; vote de la coalition (défections possibles) |
| Survie | Motion de censure (majorité absolue de 289) après un 49.3 ou spontanée | Satisfaction du SPD ; rupture de la coalition, puis élections |
| Autres règles | 49.3 limité à un texte hors budget par session ; dissolution ; présidentielle suivie de législatives | Bundesrat pour les lois fiscales ; deux tiers pour réviser la Constitution ; accord de coalition suivi point par point |
| Règles budgétaires | Procédure européenne pour déficit excessif, clause dérogatoire défense | Frein à l'endettement (défense au-delà de 1 % du PIB et fonds spécial exclus) |

Les **objectifs** sont générés automatiquement à partir de la situation de départ : 3 à 5 principaux et des secondaires, avec une jauge de progression. Le **score final** pondère soutenabilité, bien-être social, transition écologique, innovation, stabilité politique, influence et objectifs, avec des poids qui dépendent du régime.

## Données : sources, statuts et mise à jour

Les données de chaque pays sont dans `countries/<pays>.json` ; le contexte commun (énergie, BCE, OTAN) est dans `countries/_contexte-mondial.json`. Chaque valeur est stockée avec sa source, son URL, sa date et un **statut** :

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
  social.js             popularité par groupe, griefs, risque de mouvement social
  reformes.js           adoption et effets des réformes
  international.js      relations, influence, accords
  politique.js          partis, votes, 49.3, censure, coalition, élections
  objectifs.js          génération et suivi des objectifs
  evenements.js         tirage et résolution des événements
  score.js              score final
src/data/               catalogues : réformes, actions diplomatiques, événements, partis
src/ui/                 interface React (écrans, composants, sauvegarde)
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
5. Ajouter le pays à `scripts/update-data.mjs` (codes Eurostat et ISO), puis lancer `npm test`.

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
- Pour l'instant, seuls la France et l'Allemagne sont jouables. Les États-Unis, la Suède, le Danemark, le Royaume-Uni, l'Italie, l'Espagne, les Pays-Bas, le Canada et le Japon sont à ajouter selon la procédure ci-dessus.
