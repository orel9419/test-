// Génère js/carte.js : tracés SVG des pays (Natural Earth 1:110m, domaine public) en projection Natural Earth,
// noms français et centres. Dépendances (à installer à part) : d3-geo@3.1.0, topojson-client@3.1.0,
// world-atlas@2.0.2, i18n-iso-countries@7.14.0.
// Usage : node carte.mjs <chemin de sortie>
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import { createRequire } from 'module';
import fs from 'fs';

const require = createRequire(import.meta.url);
const world = require('world-atlas/countries-110m.json');
const iso = require('i18n-iso-countries');
iso.registerLocale(require('i18n-iso-countries/langs/fr.json'));

const W = 960, H = 480;
const fc = feature(world, world.objects.countries);
fc.features = fc.features.filter((f) => f.properties.name !== 'Antarctica');
const proj = geoNaturalEarth1().fitExtent([[4, 4], [W - 4, H - 4]], fc);
const path = geoPath(proj).digits(1);

const pays = {}, noms = {}, centres = {};
let n = 0;
for (const f of fc.features) {
  let a2 = f.id ? iso.numericToAlpha2(String(f.id).padStart(3, '0')) : null;
  if (!a2) a2 = f.properties.name === 'Kosovo' ? 'XK' : 'X' + n++;
  const d = path(f);
  if (!d) continue;
  pays[a2] = d;
  noms[a2] = iso.getName(a2, 'fr') || f.properties.name;
  const c = path.centroid(f);
  centres[a2] = [Math.round(c[0]), Math.round(c[1])];
}
noms.XK = 'Kosovo';

// Petits États absents de l'échelle 1:110m : un point à leurs coordonnées.
const extra = {};
for (const [code, lon, lat] of [['SG', 103.82, 1.35], ['BH', 50.56, 26.07], ['MT', 14.4, 35.9]]) {
  if (pays[code]) continue;
  const p = proj([lon, lat]);
  extra[code] = [Math.round(p[0]), Math.round(p[1])];
  noms[code] = iso.getName(code, 'fr');
}

const sortie = `/* Fond de carte : Natural Earth 1:110m (domaine public), projection Natural Earth, généré par scripts/carte.mjs */\nwindow.KBI_CARTE=${JSON.stringify({ w: W, h: H, pays, noms, centres, extra })};\n`;
fs.writeFileSync(process.argv[2], sortie);
console.log(Object.keys(pays).length, 'pays,', Object.keys(extra).length, 'points,', (sortie.length / 1024).toFixed(0), 'Ko');
console.log(['FR', 'DE', 'US', 'GB', 'KR', 'CZ', 'AE', 'SG', 'BH'].map((k) => `${k}=${noms[k]}`).join(' · '));
