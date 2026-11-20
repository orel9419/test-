// Thème appliqué avant le premier affichage (évite un éclair blanc en mode sombre).
// Fichier séparé plutôt que script en ligne : la politique de sécurité du contenu n'autorise que les scripts du site.
try {
  var o = JSON.parse(localStorage.getItem('cdg:options') || '{}') || {};
  var t = o.theme === 'sombre' ? 'dark' : o.theme === 'clair' ? 'light' : (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = t;
} catch (e) { /* stockage indisponible : le jeu appliquera le thème au démarrage */ }
