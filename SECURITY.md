# Sécurité

« Chef de gouvernement » est une application 100 % front-end : pas de serveur,
pas de compte, pas de base de données. La partie et les réglages restent dans
le navigateur du joueur (stockage local).

## Signaler une vulnérabilité

Merci de **ne pas** ouvrir de ticket public pour une faille. Utilisez le
signalement privé de GitHub : onglet **Security** du dépôt, puis
**Report a vulnerability**. Décrivez le problème, la manière de le reproduire
et son impact. Seule la dernière version publiée est corrigée.

## Ce qui protège l'application

- **Politique de sécurité du contenu (CSP)** dans la page publiée : seuls les
  scripts du site s'exécutent (ni script en ligne, ni `eval`), aucune
  ressource n'est chargée depuis un autre site, pas de plugin, pas de
  formulaire envoyé (`vite.config.js`).
- **Sauvegardes importées traitées comme non fiables** (`src/ui/securite.js`) :
  taille (5 Mo) et profondeur bornées, clés de pollution de prototype
  retirées, liens limités à `http` et `https`, structure minimale vérifiée,
  nombres non finis neutralisés. Une partie qui ne peut pas être calculée
  affiche un message au lieu de bloquer le jeu.
- **Liens externes** ouverts avec `rel="noreferrer"` (pas d'accès à la page
  d'origine) ; politique de référent `strict-origin-when-cross-origin`.
- **Service worker** limité à la même origine, ne met en cache que des
  réponses valides du site.
- **Chaîne de publication** (`.github/workflows/publier-application.yml`) :
  actions épinglées sur une empreinte de commit, construction en lecture
  seule, écriture limitée à l'étape de publication, installation depuis le
  fichier de verrouillage et audit des dépendances embarquées.
- **Dépendances** : `npm audit` sans vulnérabilité connue ; mises à jour
  proposées par Dependabot (`.github/dependabot.yml`).

## Limites connues

- GitHub Pages ne permet pas d'envoyer des en-têtes HTTP : la CSP passe par
  une balise `meta`, qui ne couvre pas `frame-ancestors` (intégration de la
  page dans un cadre). Le jeu ne manipulant ni compte ni donnée sensible, le
  risque de « clickjacking » est faible.
- Sur `<utilisateur>.github.io`, tous les sites d'un même compte partagent la
  même origine, donc le même stockage local. N'y publiez pas de code non
  fiable à côté du jeu.
