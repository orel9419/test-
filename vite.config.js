import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Politique de sécurité du contenu (CSP), ajoutée à la page construite
 * seulement : le serveur de développement injecte des scripts en ligne.
 * Le jeu ne charge que ses propres fichiers ; images et partages utilisent
 * des adresses data: et blob: (captures 3D). Pas de cadre, pas de plugin,
 * pas de formulaire envoyé. GitHub Pages ne permet pas d'en-têtes HTTP : la
 * balise meta est la seule option (frame-ancestors n'y est pas pris en compte).
 */
export const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' data: blob:",
  "worker-src 'self'",
  "manifest-src 'self'",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  'upgrade-insecure-requests',
].join('; ');

const politiqueDeSecurite = () => ({
  name: 'politique-de-securite',
  apply: 'build',
  transformIndexHtml: (html) => html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
});

// Application 100 % front-end : `base: './'` permet d'ouvrir le build depuis n'importe quel dossier.
export default defineConfig({
  plugins: [react(), politiqueDeSecurite()],
  build: { sourcemap: false },
  base: './',
  test: { include: ['tests/**/*.test.js'] },
});
