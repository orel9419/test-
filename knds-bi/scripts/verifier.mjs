// Contrôle d'intégrité des données de la plateforme : références de sources, identifiants croisés, notes de benchmark.
// Usage : node knds-bi/scripts/verifier.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const racine = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'js');
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['sources', 'photos', 'produits', 'concurrence', 'analyses', 'strategie']) {
  vm.runInContext(fs.readFileSync(path.join(racine, f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
}
const K = ctx.KBI;
const S = new Set(Object.keys(K.sources));
const err = [];
const src = (a, ou) => (a || []).forEach((x) => { if (!S.has(x)) err.push(`source inconnue ${x} (${ou})`); });

K.produits.forEach((p) => src(p.src, 'produit ' + p.id));
K.rivaux.forEach((p) => src(p.src, 'rival ' + p.id));
K.industriels.forEach((p) => src(p.src, 'industriel ' + p.id));
K.modeles.forEach((m) => Object.keys(K.piliers).forEach((k) => src(m[k].src, 'modèle ' + m.id)));
K.contrats.forEach((c) => src(c.src, 'contrat ' + c.p));
K.programmes.forEach((c) => src(c.src, 'programme ' + c.prog));
K.techno.forEach((c) => src(c.src, 'techno ' + c.id));
K.geo.forEach((c) => src(c.src, 'géo ' + c.id));
src(K.gouvernance.src, 'gouvernance');
K.recos.forEach((c) => src(c.src, 'reco ' + c.id));
K.actus.forEach((c) => src(c.src, 'actu ' + c.d));
['innovations', 'opportunites', 'risques', 'signaux'].forEach((k) => K[k].forEach((c) => src(c.src, k)));
K.indicateurs.forEach((i) => i.rows.forEach((r) => src([r[2]], 'indicateur ' + i.id)));
src(K.depenses.src, 'dépenses'); src(K.kndsChiffres.src, 'chiffres KNDS'); src(K.exportFr.src, 'export'); src(K.baseInstallee.src, 'base installée');

const ids = new Set([...K.produits, ...K.rivaux].map((p) => p.id));
if (ids.size !== K.produits.length + K.rivaux.length) err.push('identifiants de produits en double');
K.produits.forEach((p) => {
  if (!K.familles[p.f]) err.push('famille inconnue ' + p.id);
  if (!K.maturites[p.mat]) err.push('maturité inconnue ' + p.id);
  (p.conc || []).forEach((c) => { if (!ids.has(c)) err.push(`concurrent inconnu ${p.id} > ${c}`); });
  (p.users || []).forEach((u) => { if (!K.statuts[u[2]]) err.push('statut inconnu ' + p.id); });
});
K.rivaux.forEach((p) => (p.vs || []).forEach((c) => { if (!ids.has(c)) err.push(`référence inconnue ${p.id} > ${c}`); }));
K.benchmarks.forEach((b) => [...b.ids, ...b.defaut].forEach((c) => {
  if (!ids.has(c)) err.push(`benchmark ${b.id} > ${c}`);
  if (!K.notes[c] || K.notes[c].length !== K.criteres.length) err.push('notes absentes ou incomplètes ' + c);
}));
K.contrats.forEach((c) => { if (!ids.has(c.pid)) err.push('contrat sans produit ' + c.p); if (!K.devises[c.dev]) err.push('devise ' + c.p); });
const om = new Set();
Object.entries(K.swot).forEach(([f, s]) => { if (!K.familles[f]) err.push('SWOT ' + f); [...s.O, ...s.M].forEach((x) => om.add(x[0])); });
K.recos.forEach((r) => r.liens.forEach((l) => { if (!om.has(l)) err.push(`lien ${r.id} > ${l}`); }));
[...K.produits, ...K.rivaux].forEach((p) => { if (p.ph && !K.photos[p.ph]) err.push(`photo ${p.id} > ${p.ph}`); });
const utilises = new Set();
JSON.stringify(K, (k, v) => { if (k === 'src' && Array.isArray(v)) v.forEach((x) => utilises.add(x)); return v; });
K.indicateurs.forEach((i) => i.rows.forEach((r) => utilises.add(r[2])));
const orphelines = [...S].filter((x) => !utilises.has(x));

console.log(`${K.produits.length} produits KNDS, ${K.rivaux.length} produits concurrents, ${K.industriels.length} industriels, ${S.size} sources, ${K.actus.length} actualités, ${K.recos.length} recommandations`);
if (orphelines.length) console.log('Sources non citées : ' + orphelines.join(', '));
if (err.length) { console.error(err.join('\n')); process.exit(1); }
console.log('Intégrité des données : OK');
