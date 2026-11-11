# Veille stratégique KNDS France

Plateforme interactive de business intelligence et d'intelligence économique consacrée à KNDS France, à KNDS Group et à leur environnement concurrentiel. Étude indépendante en sources ouvertes, données arrêtées au 11 novembre 2026, sans lien avec KNDS.

## Modules

| Module | Contenu |
|---|---|
| 9. Tableau de bord | Indicateurs dynamiques, filtres (famille, concurrent, pays, marché, période), actualités, innovations, opportunités, risques, carte des marchés, signaux faibles |
| 1. Portefeuille | 55 fiches produits (KNDS France, KNDS Deutschland, programmes conjoints) en dix familles, recherche, filtres, comparateur de deux à quatre produits |
| 2. Concurrence | Relations famille par famille pour 25 industriels, matrice produit par produit pour 61 produits concurrents, profils d'industriels |
| 3. Modèles commerciaux | Conception, lancement, prix et distribution par industriel (faits, puis analyse) ; valeurs de contrats ramenées à l'unité quand le périmètre le permet ; archétypes |
| 4. Benchmark | Sept études, données mesurables publiées, petits multiples, notation multicritère à pondération paramétrable |
| 5. Marchés | Dépenses militaires, activité de KNDS, indicateurs de substitution aux parts de marché, base installée, 22 programmes d'acquisition cartographiés |
| 6. Veille technologique | Dix thématiques, matrice maturité et impact |
| 7. Environnement stratégique | Onze facteurs externes, actionnariat et gouvernance de KNDS Group |
| 8. SWOT et recommandations | SWOT par famille ; 18 recommandations reliées aux opportunités et menaces qu'elles traitent |
| Méthode et sources | Statuts, niveaux de fiabilité, règles appliquées, registre de 97 sources |

## Fichiers

- `index.html` : structure et styles. La page est écrite sans squelette HTML, conformément au format de publication en Artifact.
- `js/sources.js` : registre des sources (émetteur, intitulé, date, type, fiabilité, lien).
- `js/produits.js`, `js/concurrence.js`, `js/analyses.js`, `js/strategie.js` : données.
- `js/photos.js` : liens vers les photographies de référence sur Wikimedia Commons.
- `js/carte.js` : fond de carte généré (Natural Earth 1:110m, domaine public).
- `js/app.js` : rendu et interactions ; aucune donnée de fond.
- `scripts/verifier.mjs` : contrôle d'intégrité (sources citées et existantes, identifiants croisés, notes du benchmark, liens des recommandations).
- `scripts/apercu.mjs` : génère `apercu.html` (page enveloppée dans le squelette) pour une ouverture locale.
- `scripts/carte.mjs` : régénère le fond de carte (dépendances indiquées en tête de fichier).

## Utilisation

```bash
node knds-bi/scripts/verifier.mjs   # contrôle d'intégrité des données
node knds-bi/scripts/apercu.mjs     # puis ouvrir knds-bi/apercu.html dans un navigateur
```

## Mettre à jour une donnée

1. Ajouter la source dans `js/sources.js` avec sa date et son niveau de fiabilité (A source primaire, B secondaire reconnue ou recoupée, C secondaire unique, D analyse).
2. Citer son identifiant dans le champ `src` de la donnée concernée et indiquer le statut de l'information (C confirmé, A annoncé, E estimé, H hypothétique).
3. Lancer le vérificateur.

## Règles et limites

- Aucune donnée commerciale non publique n'est utilisée ni estimée. Une valeur de contrat n'est jamais présentée comme un prix d'équipement.
- Aucune part de marché n'est inventée : la plateforme emploie des indicateurs de substitution dont la nature est affichée (valeur, volume, carnet, livraisons).
- Les notes du benchmark sont des appréciations de l'auteur ; un produit dont un critère pondéré n'est pas évaluable n'est pas classé.
- Les photographies n'ont pas pu être intégrées : Wikimedia a refusé le téléchargement automatisé lors de la préparation et l'hébergement de la page bloque les images externes. Chaque fiche renvoie vers une photographie authentique sous licence libre ; les pictogrammes ne représentent pas le matériel exact.
