import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Application 100 % front-end : `base: './'` permet d'ouvrir le build depuis n'importe quel dossier.
export default defineConfig({
  plugins: [react()],
  base: './',
  test: { include: ['tests/**/*.test.js'] },
});
