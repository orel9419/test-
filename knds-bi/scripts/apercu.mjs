// Génère apercu.html pour ouvrir la plateforme localement : la page index.html est écrite sans squelette
// (la publication en Artifact ajoute doctype, charset, viewport et réinitialisation) ; ce script ajoute
// le même squelette. Usage : node knds-bi/scripts/apercu.mjs, puis ouvrir knds-bi/apercu.html.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dossier = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const page = fs.readFileSync(path.join(dossier, 'index.html'), 'utf8');
const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
${page}
</body>
</html>
`;
fs.writeFileSync(path.join(dossier, 'apercu.html'), html);
console.log('apercu.html écrit');
