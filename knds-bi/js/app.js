/* Veille stratégique KNDS : rendu des modules, filtres, fiches, comparateurs, graphiques et cartes.
   Ce fichier ne contient aucune donnée de fond : tout provient de js/sources.js … js/strategie.js. */
(function () {
  'use strict';

  const K = window.KBI;
  const CARTE = window.KBI_CARTE;
  const ARRETE = '2026-11-11';
  const $ = (s, r = document) => r.querySelector(s);
  const vue = $('#vue'), tiroir = $('#tiroir'), voile = $('#voile'), tip = $('#tip'), plateau = $('#plateau');
  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ═══════════ Outils ═══════════ */
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ESC[c]);
  const nf = (v, d = 1) => (v == null || Number.isNaN(v) ? 'n.c.' : Number(v).toLocaleString('fr-FR', { maximumFractionDigits: d }));
  const dateFr = (iso) => { const [a, m, j] = iso.split('-'); return `${j}/${m}/${a}`; };
  const ord = (a, b) => String(a).localeCompare(String(b), 'fr', { numeric: true });
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const court = (n) => String(n).split(' (')[0];
  const NOMS = { US: 'États-Unis', CZ: 'Tchéquie', AE: 'Émirats arabes unis', SA: 'Arabie saoudite', XK: 'Kosovo' };
  const pays = (c) => NOMS[c] || (CARTE && CARTE.noms[c]) || c;
  const lire = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const ecrire = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage indisponible : la valeur reste en mémoire */ } };

  /* ═══════════ Index ═══════════ */
  const P = {};
  K.produits.forEach((p) => { p.knds = true; P[p.id] = p; });
  K.rivaux.forEach((r) => { P[r.id] = r; });
  const IND = {};
  K.industriels.forEach((i) => { IND[i.id] = i; });
  const FAM = K.familles;
  const FAMS = Object.keys(FAM);
  const indNom = (x) => (IND[x] ? IND[x].n : x);
  const auteur = (p) => (p.knds ? K.entites[p.e] : indNom(p.ind));
  const origine = (p) => (p.knds ? (p.e === 'JV' ? ['FR', 'DE'] : [p.e]) : [p.pays]);
  const TYPES_SRC = { OFF: 'Publication officielle d\'industriel', INST: 'État, Parlement ou institution', REF: 'Base ou institut de référence', SPEC: 'Presse spécialisée', ECO: 'Presse économique', GEN: 'Référence générique', ANA: 'Analyse de l\'auteur' };
  const FIAB = { A: 'source primaire', B: 'source secondaire reconnue ou recoupée', C: 'source secondaire unique ou non recoupée', D: 'appréciation analytique' };
  const MAT_COURT = { SER: 'En service', PROD: 'En production', DEV: 'En développement', DEMO: 'Démonstrateur', LEG: 'Fin de vie, soutien', SVC: 'Service actif' };
  const REL_LIB = { D: 'Concurrence directe', I: 'Concurrence indirecte', P: 'Partenaire et concurrent', '': 'Pas de recouvrement' };
  const REGIONS = ['France', 'Europe', 'Amérique du Nord', 'Asie-Pacifique', 'Moyen-Orient', 'Monde'];
  const REGION_PAYS = { FR: 'France', US: 'Amérique du Nord', CA: 'Amérique du Nord', MY: 'Asie-Pacifique', ID: 'Asie-Pacifique', TH: 'Asie-Pacifique', IN: 'Asie-Pacifique', KR: 'Asie-Pacifique', AU: 'Asie-Pacifique', SG: 'Asie-Pacifique', AE: 'Moyen-Orient', SA: 'Moyen-Orient', QA: 'Moyen-Orient', JO: 'Moyen-Orient' };
  const regionDe = (c) => REGION_PAYS[c] || 'Europe';
  const PRIO = { 1: 'Immédiate', 2: 'Dans les douze mois', 3: 'À préparer' };
  const NIV = { 3: 'Élevé', 2: 'Moyen', 1: 'Modéré' };
  const SENS = { '+': ['Favorable', 'p'], '-': ['Défavorable', 'm'], '~': ['Ambivalent', 'a'] };

  const rivauxDe = (id) => {
    const m = new Map();
    K.rivaux.forEach((r) => { if ((r.vs || []).includes(id)) m.set(r.id, r); });
    ((P[id] && P[id].conc) || []).forEach((c) => { if (P[c] && !P[c].knds) m.set(c, P[c]); });
    return [...m.values()];
  };
  const internesDe = (id) => ((P[id] && P[id].conc) || []).filter((c) => P[c] && P[c].knds).map((c) => P[c]);
  const PAIRES = [];
  K.produits.forEach((p) => rivauxDe(p.id).forEach((r) => PAIRES.push([p, r])));

  const OM = {};
  Object.entries(K.swot).forEach(([f, s]) => {
    s.O.forEach(([id, t]) => { OM[id] = ['O', t, f]; });
    s.M.forEach(([id, t]) => { OM[id] = ['M', t, f]; });
  });

  const CIT = {};
  (function compter(o) {
    if (Array.isArray(o)) { o.forEach(compter); return; }
    if (o && typeof o === 'object') {
      Object.keys(o).forEach((k) => {
        if (k === 'src' && Array.isArray(o[k])) o[k].forEach((id) => { CIT[id] = (CIT[id] || 0) + 1; });
        else if (k !== 'sources') compter(o[k]);
      });
    }
  })(K);
  K.indicateurs.forEach((i) => i.rows.forEach((r) => { CIT[r[2]] = (CIT[r[2]] || 0) + 1; }));

  /* ═══════════ Fragments d'interface ═══════════ */
  const st = (c) => (c ? `<span class="st st-${c}">${esc(K.statuts[c])}</span>` : '');
  const mat = (m) => `<span class="mat mat-${m}" title="${esc(K.maturites[m])}">${esc(MAT_COURT[m])}</span>`;
  const ent = (e) => `<span class="puce ${e.toLowerCase()}">${esc(K.entites[e])}</span>`;
  const isoC = (c) => `<span class="iso" title="${esc(pays(c))}">${esc(c)}</span>`;
  const famP = (f) => (FAM[f] ? `<span class="puce">${esc(FAM[f].n)}</span>` : '');
  const liste = (a) => (a && a.length ? `<ul class="liste">${a.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="note">Non renseigné.</p>');
  const vide = (t) => `<p class="vide">${esc(t)}</p>`;
  const kpi = (v, lib, sous) => `<div class="kpi"><b>${esc(String(v))}</b><span>${esc(lib)}</span>${sous ? `<small>${esc(sous)}</small>` : ''}</div>`;
  const entete = (h, note, niveau = 'h2') => `<div class="entete"><${niveau}>${esc(h)}</${niveau}>${note ? `<span class="note">${esc(note)}</span>` : ''}</div>`;
  const tete = (sur, titre, chapo) => `<div class="tete"><span class="sur">${esc(sur)}</span><h1>${esc(titre)}</h1>${chapo ? `<p class="chapo">${esc(chapo)}</p>` : ''}</div>`;
  const srcs = (ids) => {
    const v = [...new Set(ids || [])].filter((id) => K.sources[id]);
    if (!v.length) return '';
    return `<span class="srcs">${v.map((id) => { const s = K.sources[id]; return `<button type="button" class="src" data-src="${id}" title="${esc(s[0] + ' : ' + s[1])}"><b>${esc(court(s[0]))}</b> ${esc(s[2])} · ${esc(s[4])}</button>`; }).join('')}</span>`;
  };
  const fait = (titre, contenu, src) => `<div class="fait"><h4>${esc(titre)}</h4>${contenu}${src ? srcs(src) : ''}</div>`;
  const analyse = (titre, contenu, src) => `<div class="analyse"><h4>${esc(titre)}</h4>${contenu}${src ? srcs(src) : ''}</div>`;
  const select = (id, lib, opts, val) => `<label class="champ" for="${id}"><span>${esc(lib)}</span><select id="${id}">${opts.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(val) ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
  const onglets = (nom, opts, val, lib) => `<div class="onglets" role="group" aria-label="${esc(lib)}">${opts.map(([v, t]) => `<button type="button" data-${nom}="${esc(v)}" aria-pressed="${String(v) === String(val)}">${esc(t)}</button>`).join('')}</div>`;
  const lienFiche = (p, cls = 'lien-txt') => `<button type="button" class="${cls}" data-fiche="${p.id}">${esc(p.n)}</button>`;
  const lienInd = (id) => (IND[id] ? `<button type="button" class="lien-txt" data-ind="${id}">${esc(IND[id].n)}</button>` : esc(id));
  const prio = (n) => `<span class="prio prio-${n}">${esc(PRIO[n])}</span>`;
  const refOM = (id) => (OM[id] ? `<span class="ref" tabindex="0" data-tip-t="${esc(id + ' · ' + (OM[id][0] === 'O' ? 'Opportunité' : 'Menace'))}" data-tip="${esc(OM[id][1])}">${esc(id)}</span>` : '');
  const niveau = (n) => `<span class="niveau"><span class="niv" aria-hidden="true">${[1, 2, 3].map((k) => `<i class="${k <= n ? 'on' : ''}"></i>`).join('')}</span><span class="note">Niveau ${esc(NIV[n].toLowerCase())}</span></span>`;

  /* Barres horizontales : rows = [{ lib, v, k (produit KNDS), tip, cls }] */
  const barres = (rows, unite, d = 1) => {
    const max = Math.max(...rows.map((r) => (typeof r.v === 'number' ? r.v : 0))) || 1;
    return `<div class="barres">${rows.map((r) => `<div class="barre-l"><div class="lib"><span>${r.libHtml || esc(r.lib)}</span><b>${typeof r.v === 'number' ? `${r.prefixe || ''}${nf(r.v, d)}${unite ? ' ' + esc(unite) : ''}` : 'n.c.'}</b></div><div class="piste">${typeof r.v === 'number' ? `<i class="${r.cls || (r.k ? 'k' : '')}" style="width:${Math.max(0.6, (r.v / max) * 100)}%"${r.tip ? ` tabindex="0" data-tip-t="${esc(r.lib)}" data-tip="${esc(r.tip)}"` : ''}></i>` : ''}</div></div>`).join('')}</div>`;
  };

  /* ═══════════ Pictogrammes (vues de profil au trait, à gauche l'avant du véhicule) ═══════════ */
  const chenille = (x1, x2, y1 = 54, y2 = 72) => {
    const r = (y2 - y1) / 2, cy = (y1 + y2) / 2, n = Math.max(3, Math.round((x2 - x1 - 2 * r) / 22) + 1), pas = (x2 - x1 - 2 * r) / (n - 1);
    let s = `<rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" rx="${r}"/>`;
    for (let i = 0; i < n; i++) s += `<circle cx="${(x1 + r + i * pas).toFixed(1)}" cy="${cy}" r="${(r * 0.62).toFixed(1)}"/>`;
    return s;
  };
  const roues = (xs, y = 64, r = 9) => xs.map((x) => `<circle cx="${x}" cy="${y}" r="${r}"/><circle cx="${x}" cy="${y}" r="${(r * 0.38).toFixed(1)}"/>`).join('');
  const CABINE = '<path d="M14 56 V36 L24 28 H54 V56"/>';
  const SIL = {
    mbt: chenille(30, 172) + '<path d="M22 54 L36 42 H168 L180 54"/><path d="M72 42 L80 28 H140 L150 42"/><path d="M80 33 H8 M80 37 H8 M8 31 V39"/><path d="M124 28 V22 H136 V28"/>',
    ifv: chenille(30, 170, 56, 72) + '<path d="M20 56 L32 36 H160 L176 56"/><path d="M92 36 L98 26 H128 L134 36"/><path d="M98 30 H54 M54 28 V32"/>',
    w8t: roues([46, 74, 130, 158]) + '<path d="M16 55 L28 34 H170 L184 46 V55"/><path d="M86 34 L92 24 H128 L132 34"/><path d="M92 28 H48 M48 26 V30"/>',
    w6t: roues([52, 98, 152]) + '<path d="M18 55 L30 38 H166 L182 50 V55"/><path d="M84 38 L90 26 H128 L134 38"/><path d="M90 31 H40 M40 29 V33"/><rect x="112" y="18" width="18" height="7"/>',
    w6: roues([46, 96, 150]) + '<path d="M16 55 L24 30 H150 L176 38 L182 55"/><path d="M138 34 V50"/><rect x="112" y="22" width="12" height="8"/><path d="M114 25 H96"/>',
    w4: roues([54, 144], 64, 10) + '<path d="M24 54 L32 34 L70 28 H166 L176 54"/><path d="M40 34 L70 30 V44 H38 Z"/><rect x="118" y="20" width="12" height="8"/><path d="M120 23 H102"/>',
    sphw: roues([38, 128, 158]) + CABINE + '<path d="M54 52 H184"/><rect x="150" y="38" width="22" height="12"/><path d="M152 40 L8 22 M152 44 L8 26 M8 20 V28"/><path d="M184 52 L192 66"/>',
    sphw8: roues([40, 68, 134, 162]) + '<path d="M12 56 V38 L24 30 H62 V56"/><path d="M62 52 H186"/><path d="M110 52 L116 34 H170 L178 52"/><path d="M116 36 L8 18 M116 40 L8 22 M8 16 V24"/>',
    spht: chenille(28, 174) + '<path d="M20 54 L34 42 H168 L182 54"/><path d="M84 42 L90 24 H164 L170 42"/><path d="M90 31 H4 M90 35 H4 M4 29 V37"/>',
    towed: '<circle cx="104" cy="60" r="12"/><circle cx="104" cy="60" r="4"/><path d="M86 58 L92 34 H112 L116 50"/><path d="M100 42 L14 26 M100 46 L14 30 M14 24 V32"/><path d="M106 58 L188 70 M112 56 L190 64 M188 66 V74"/>',
    mlrs: roues([40, 128, 158]) + CABINE + '<path d="M54 52 H184"/><path d="M76 50 L80 24 H178 L176 50"/><path d="M84 30 H172 M84 37 H172 M84 44 H172"/>',
    turret: '<rect x="44" y="52" width="112" height="10" rx="2"/><path d="M54 52 L64 30 H140 L152 52"/><path d="M64 40 H8 M64 44 H8 M8 38 V46"/><rect x="112" y="22" width="16" height="8"/>',
    gun: '<rect x="146" y="28" width="30" height="24" rx="2"/><path d="M130 32 H146 M130 48 H146 M130 32 V48"/><path d="M130 35 L24 37 M130 45 L24 43"/><rect x="10" y="34" width="14" height="12" rx="1"/>',
    shell: '<path d="M36 28 H118 C146 28 168 34 184 40 C168 46 146 52 118 52 H36 Z"/><rect x="24" y="29" width="12" height="22" rx="1"/><path d="M52 28 V52 M58 28 V52 M150 31 V49"/>',
    aa: chenille(30, 170, 56, 72) + '<path d="M22 56 L34 44 H162 L176 56"/><path d="M74 44 L80 28 H136 L142 44"/><path d="M84 32 L30 8 M84 38 L28 14"/><path d="M118 28 V18 M104 14 Q118 6 132 14"/>',
    aaw: roues([52, 98, 152]) + '<path d="M18 55 L28 36 H168 L182 50 V55"/><path d="M90 36 L96 24 H136 L140 36"/><path d="M98 28 L48 6 M98 32 L46 10"/><rect x="118" y="12" width="14" height="12"/>',
    drone: '<rect x="86" y="30" width="28" height="20" rx="4"/><path d="M86 30 L60 14 M114 30 L140 14 M86 50 L60 66 M114 50 L140 66"/><circle cx="60" cy="14" r="11"/><circle cx="140" cy="14" r="11"/><circle cx="60" cy="66" r="11"/><circle cx="140" cy="66" r="11"/><path d="M114 36 H124 V44 H114"/>',
    ugv: chenille(46, 154, 52, 70) + '<path d="M40 52 L50 40 H150 L160 52"/><rect x="92" y="28" width="18" height="12"/><path d="M92 33 H58 M140 40 V18"/>',
    c2: '<path d="M30 40 L80 18 M30 40 L80 62 M80 18 L130 40 M80 62 L130 40 M130 40 L176 22 M130 40 L176 58 M80 26 V54"/><circle cx="30" cy="40" r="8"/><circle cx="80" cy="18" r="8"/><circle cx="80" cy="62" r="8"/><circle cx="130" cy="40" r="8"/><circle cx="176" cy="22" r="7"/><circle cx="176" cy="58" r="7"/>',
    support: roues([40, 124, 152]) + CABINE + '<path d="M60 52 V30 H120 V52 M54 52 H178"/><path d="M140 52 L150 30 L186 14 V30"/>',
    arv: chenille(30, 172) + '<path d="M22 54 L36 40 H166 L178 54"/><path d="M60 40 V28 H120 V40"/><path d="M120 34 L168 10 V26 M18 50 L14 66"/>',
    bridge: chenille(30, 172) + '<path d="M22 54 L36 42 H166 L178 54"/><rect x="14" y="26" width="174" height="10"/><path d="M72 26 V36 M130 26 V36"/>',
    helo: '<path d="M30 46 Q34 30 70 30 H112 L176 38 L188 32 V44 L120 48 Q90 60 54 56 Q32 54 30 46 Z"/><path d="M30 18 H170 M100 18 V30 M46 56 V62 H30 M56 68 H120 M64 58 V68 M110 54 V68"/>'
  };
  const svgSil = (k) => `<svg viewBox="0 0 200 80" aria-hidden="true" focusable="false"><g class="sil" fill="none">${SIL[k] || SIL.support}</g></svg>`;
  const tuile = (p, bouton = true) => {
    const code = `${(FAM[p.f] || {}).court || ''} · ${p.knds ? (p.e === 'JV' ? 'KNDS' : 'KNDS ' + p.e) : court(indNom(p.ind))}`.toUpperCase();
    const ph = p.ph && K.photos[p.ph] ? '<span class="photo">PHOTO RÉF.</span>' : '';
    return bouton
      ? `<button type="button" class="tuile" data-fiche="${p.id}" aria-label="Ouvrir la fiche ${esc(p.n)}"><span class="code">${esc(code)}</span>${svgSil(p.sil)}${ph}</button>`
      : `<div class="tuile"><span class="code">${esc(code)}</span>${svgSil(p.sil)}${ph}</div>`;
  };
  const photoLien = (p) => {
    const ph = p.ph && K.photos[p.ph];
    if (!ph) return '<p class="note">Aucune photographie libre de droits retenue pour ce produit.</p>';
    return `<p class="note"><a href="${esc(ph.u)}" target="_blank" rel="noopener noreferrer">Voir la photographie authentique sur Wikimedia Commons ↗</a><br>${esc(ph.t)}. Licence et auteur figurent sur la page du fichier ; le cliché peut montrer une autre version ou un autre utilisateur.</p>`;
  };

  /* Données comparables (benchmark) */
  const CHAMPS = {
    ART: [['masse', 'Masse', 't'], ['tube', 'Longueur de tube', ''], ['portee', 'Portée, obus à culot creux', 'km'], ['cadence', 'Cadence maximale', 'coups/min'], ['equipage', 'Équipage', ''], ['emport', 'Obus embarqués', ''], ['config', 'Configuration', ''], ['auto', 'Chargement', '']],
    MBT: [['masse', 'Masse au combat', 't'], ['canon', 'Armement principal', ''], ['chargeur', 'Chargement', ''], ['equipage', 'Équipage', ''], ['puissance', 'Puissance', 'ch'], ['vitesse', 'Vitesse sur route', 'km/h'], ['autonomie', 'Autonomie', 'km'], ['aps', 'Protection active', '']],
    VEH: [['masse', 'Masse', 't'], ['config', 'Configuration', ''], ['equipage', 'Équipage', ''], ['armement', 'Armement', ''], ['puissance', 'Puissance', 'ch'], ['vitesse', 'Vitesse sur route', 'km/h'], ['autonomie', 'Autonomie', 'km']]
  };
  const METRIQUES = { ART: ['portee', 'cadence', 'masse', 'emport'], MBT: ['masse', 'puissance', 'vitesse', 'autonomie'], VEH: ['masse', 'vitesse', 'autonomie', 'puissance'] };
  const typeB = (p) => (p.b && 'canon' in p.b ? 'MBT' : p.b && 'tube' in p.b ? 'ART' : 'VEH');
  const valB = (p, c) => {
    const v = p.b ? p.b[c[0]] : null;
    if (v == null) return '<span class="note">n.c.</span>';
    return typeof v === 'number' ? `${nf(v)}${c[2] ? ' ' + esc(c[2]) : ''}` : esc(v);
  };

  /* Contrats */
  const parUnite = (c) => (c.v == null || !c.q || c.nc ? null : (c.v * K.devises[c.dev][1]) / c.q);
  const valeurTxt = (c) => { if (c.v == null) return 'Non publiée'; const s = K.devises[c.dev][0]; return s.length === 1 ? `${nf(c.v)} M${s}` : `${nf(c.v)} M ${s}`; };
  const contratKnds = (c) => !!(P[c.pid] && P[c.pid].knds);

  /* ═══════════ Carte du monde ═══════════ */
  function carte(classes, tips, o = {}) {
    if (!CARTE) return '';
    const attrs = (c) => {
      const t = tips[c] || [pays(c), ''];
      return ` class="${classes[c]}" tabindex="0" role="${o.clic ? 'button' : 'img'}" aria-label="${esc(t[0] + (t[1] ? ' : ' + t[1].replace(/\n/g, ' ; ') : ''))}" data-tip-t="${esc(t[0])}" data-tip="${esc(t[1])}"${o.clic ? ` data-pays-port="${c}"` : ''}`;
    };
    let s = `<svg viewBox="0 0 ${CARTE.w} ${CARTE.h}" role="group" aria-label="${esc(o.label || 'Carte du monde')}">`;
    Object.keys(CARTE.pays).forEach((c) => { s += classes[c] ? `<path d="${CARTE.pays[c]}"${attrs(c)}/>` : `<path d="${CARTE.pays[c]}"/>`; });
    const pts = Object.assign({}, CARTE.extra);
    Object.entries(pts).forEach(([c, xy]) => { if (classes[c]) s += `<circle cx="${xy[0]}" cy="${xy[1]}" r="4.5"${attrs(c)}/>`; });
    return s + '</svg>';
  }

  /* ═══════════ État ═══════════ */
  const DEF = {
    synth: () => ({ f: '', c: '', p: '', r: '', per: '12', tout: false }),
    port: () => ({ q: '', f: '', e: '', m: '', p: '' })
  };
  const S = {
    vue: '', msg: '',
    synth: DEF.synth(), port: DEF.port(), cmp: [],
    conc: { t: '', f: 'ART', ref: '' },
    mod: { pil: 'prix', fc: 'ART' },
    bench: { id: K.benchmarks[0].id, sel: {}, w: null },
    marches: { op: '', f: '' }, veille: { pos: '' }, geo: '',
    swot: { f: 'ART', dest: '' },
    meth: { q: '', type: '', fiab: '' }
  };
  const poids = lire('kbi-poids', null);
  S.bench.w = Array.isArray(poids) && poids.length === K.criteres.length && poids.every((x) => typeof x === 'number') ? poids : K.criteres.map((c) => c.w);

  /* ═══════════ Infobulle, bulle de source, tiroir ═══════════ */
  let tipCible = null;
  function montrerTip(el, x, y) {
    const t = el.getAttribute('data-tip-t'), b = el.getAttribute('data-tip');
    if (!t && !b) return;
    tip.replaceChildren();
    if (t) { const e = document.createElement('b'); e.textContent = t; tip.append(e); }
    if (b) b.split('\n').forEach((l) => { const d = document.createElement('div'); d.textContent = l; tip.append(d); });
    tip.hidden = false;
    placerTip(x, y);
  }
  function placerTip(x, y) {
    const r = tip.getBoundingClientRect();
    let l = x + 14, h = y + 14;
    if (l + r.width > innerWidth - 8) l = Math.max(8, x - r.width - 14);
    if (h + r.height > innerHeight - 8) h = Math.max(8, y - r.height - 14);
    tip.style.left = l + 'px';
    tip.style.top = h + 'px';
  }
  const cacherTip = () => { tip.hidden = true; tipCible = null; };
  document.addEventListener('pointermove', (e) => {
    const el = e.target.closest && e.target.closest('[data-tip],[data-tip-t]');
    if (!el) { if (tipCible) cacherTip(); return; }
    if (el !== tipCible) { tipCible = el; montrerTip(el, e.clientX, e.clientY); } else placerTip(e.clientX, e.clientY);
  });
  document.addEventListener('focusin', (e) => {
    const el = e.target.closest && e.target.closest('[data-tip],[data-tip-t]');
    if (!el) return;
    const r = el.getBoundingClientRect();
    tipCible = el;
    montrerTip(el, r.left + Math.min(r.width, 40), r.bottom);
  });
  document.addEventListener('focusout', cacherTip);

  const bulle = document.createElement('div');
  bulle.className = 'bulle';
  bulle.hidden = true;
  bulle.setAttribute('role', 'dialog');
  bulle.setAttribute('aria-label', 'Détail de la source');
  document.body.append(bulle);
  let bulleId = '', bulleAncre = null;
  function masquerBulle() { bulle.hidden = true; bulleId = ''; bulleAncre = null; }
  function placerBulle() {
    if (!bulleAncre || !bulleAncre.isConnected) { masquerBulle(); return; }
    const r = bulleAncre.getBoundingClientRect(), b = bulle.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) { masquerBulle(); return; }
    const l = Math.max(12, Math.min(r.left, innerWidth - b.width - 12));
    let h = r.bottom + 6;
    if (h + b.height > innerHeight - 12) h = Math.max(12, r.top - b.height - 6);
    bulle.style.left = l + 'px';
    bulle.style.top = h + 'px';
  }
  function basculerBulle(btn) {
    const id = btn.dataset.src;
    if (!bulle.hidden && bulleId === id) { masquerBulle(); return; }
    const s = K.sources[id];
    bulle.innerHTML = `<b>${esc(s[1])}</b><span class="meta">${esc(s[0])} · ${esc(s[2])}</span><span class="meta">${esc(TYPES_SRC[s[3]])} · fiabilité ${esc(s[4])}, ${esc(FIAB[s[4]])}</span>${s[5] ? `<a href="${esc(s[5])}" target="_blank" rel="noopener noreferrer">Ouvrir la source ↗</a>` : '<span class="meta">Référence générique, sans lien unique : voir le registre des sources.</span>'}<span class="meta">Citée ${CIT[id] || 0} fois dans la plateforme</span>`;
    bulle.hidden = false;
    bulleId = id;
    bulleAncre = btn;
    placerBulle();
  }
  document.addEventListener('scroll', () => { cacherTip(); if (!bulle.hidden) placerBulle(); }, { passive: true, capture: true });
  window.addEventListener('resize', masquerBulle);

  let pile = [], retourFocus = null;
  function ouvrir(rendu, large = false) {
    if (!pile.length) retourFocus = document.activeElement;
    pile.push({ rendu, large });
    peindreTiroir();
  }
  function peindreTiroir() {
    const { rendu, large } = pile[pile.length - 1];
    tiroir.classList.toggle('large', !!large);
    tiroir.innerHTML = `<div class="haut">${pile.length > 1 ? '<button type="button" class="fermer" data-retour>← Retour</button>' : '<span></span>'}<button type="button" class="fermer" data-fermer>Fermer ✕</button></div>${rendu()}`;
    tiroir.hidden = false;
    voile.hidden = false;
    tiroir.scrollTop = 0;
    document.documentElement.style.overflow = 'hidden';
    masquerBulle();
    $('[data-fermer]', tiroir).focus({ preventScroll: true });
  }
  function fermerTiroir(silencieux) {
    if (tiroir.hidden) return;
    pile = [];
    tiroir.hidden = true;
    voile.hidden = true;
    tiroir.innerHTML = '';
    document.documentElement.style.overflow = '';
    masquerBulle();
    if (!silencieux && retourFocus && retourFocus.isConnected) retourFocus.focus({ preventScroll: true });
    retourFocus = null;
  }
  function retour() { pile.pop(); if (!pile.length) fermerTiroir(); else peindreTiroir(); }
  const ouvrirFiche = (id) => { const p = P[id]; if (p) ouvrir(() => (p.knds ? ficheKnds(p) : ficheRival(p))); };
  const ouvrirInd = (id) => { const i = IND[id]; if (i) ouvrir(() => ficheInd(i)); };

  /* ═══════════ Fiches ═══════════ */
  function ficheKnds(p) {
    const rv = rivauxDe(p.id), int = internesDe(p.id), at = K.atoutsKnds[p.id];
    const bm = K.benchmarks.filter((b) => b.ids.includes(p.id));
    return `<div class="fiche-tete">${tuile(p, false)}<div class="tete"><span class="sur">Fiche produit · ${esc(FAM[p.f].n)}</span><h2>${esc(p.n)}</h2><div class="liens">${ent(p.e)}${mat(p.mat)}</div>${p.part ? `<p class="note">Partenaires : ${esc(p.part)}</p>` : ''}${photoLien(p)}</div></div>
      <section><h3>Fonction et usages opérationnels</h3><p>${esc(p.role)}</p>${liste(p.usages)}</section>
      <section><h3>Caractéristiques techniques publiques</h3><dl class="specs">${p.specs.map((s) => `<dt>${esc(s[0])}</dt><dd>${esc(s[1])}</dd>`).join('')}</dl></section>
      <section><h3>Technologies embarquées</h3>${liste(p.tech)}</section>
      <div class="grille deux">${fait('Conception', `<p>${esc(p.dates.c)}</p>`)}${fait('Lancement et mise en service', `<p>${esc(p.dates.l)}</p>`)}</div>
      ${fait('Stade de maturité commerciale', `<p>${mat(p.mat)} · ${esc(K.maturites[p.mat])}</p><p>${esc(p.matTxt)}</p>`)}
      <section><h3>Pays utilisateurs et références clients</h3>${p.users.length ? `<ul class="users">${p.users.map((u) => `<li>${isoC(u[0])}<div>${esc(pays(u[0]))}<small>${esc(u[1])}</small></div>${st(u[2])}</li>`).join('')}</ul>` : '<p class="note">Aucun utilisateur à ce stade.</p>'}</section>
      <section><h3>Marchés cibles</h3>${liste(p.marches)}</section>
      ${analyse('Positionnement commercial', `<p>${esc(p.pos)}</p>${at ? `<p><b>Avantages :</b> ${esc(at[0].join(' ; '))}.</p><p><b>Limites :</b> ${esc(at[1].join(' ; '))}.</p>` : ''}`)}
      <section><h3>Principaux concurrents</h3>${rv.length ? `<div class="liens">${rv.map((r) => `<button type="button" class="lien" data-fiche="${r.id}">${esc(r.n)} · ${esc(court(indNom(r.ind)))}</button>`).join('')}</div>` : '<p class="note">Aucun concurrent direct recensé.</p>'}${int.length ? `<p class="note">Concurrence interne au groupe : ${int.map((x) => lienFiche(x)).join(', ')}</p>` : ''}</section>
      <section><h3>Évolutions et modernisations annoncées</h3>${liste(p.evo)}</section>
      <section><h3>Sources</h3>${srcs(p.src)}</section>
      <div class="liens">${S.cmp.includes(p.id) ? '' : `<button type="button" class="bouton clair" data-cmp-ajout="${p.id}">Ajouter au comparateur</button>`}${rv.length ? `<button type="button" class="bouton clair" data-aller="concurrence:${p.f}:${p.id}">Matrice concurrentielle</button>` : ''}${bm.map((b) => `<button type="button" class="bouton clair" data-aller="benchmark:${b.id}">Benchmark : ${esc(court(b.n))}</button>`).join('')}<button type="button" class="bouton clair" data-aller="swot:${p.f}">SWOT ${esc(FAM[p.f].court.toLowerCase())}</button></div>`;
  }

  function ficheRival(r) {
    const refs = (r.vs || []).map((id) => P[id]).filter(Boolean);
    const fam = FAM[r.f] ? FAM[r.f].n : '';
    return `<div class="fiche-tete">${tuile(r, false)}<div class="tete"><span class="sur">Produit concurrent · ${esc(fam)}${r.seg ? ' · ' + esc(r.seg) : ''}</span><h2>${esc(r.n)}</h2><div class="liens">${IND[r.ind] ? `<button type="button" class="lien" data-ind="${r.ind}">${esc(indNom(r.ind))}</button>` : `<span class="puce">${esc(r.ind)}</span>`}${isoC(r.pays)}<span class="note">${esc(pays(r.pays))}</span></div>${photoLien(r)}</div></div>
      <section><h3>Face aux produits KNDS</h3><div class="liens">${refs.map((p) => lienFiche(p, 'lien')).join('')}</div></section>
      <div class="grille deux">${fait('Marchés adressés', `<p>${esc(r.marches)}</p>`)}${fait('Utilisateurs connus', `<p>${esc(r.users)}</p>`)}</div>
      ${r.b ? `<section><h3>Données comparables publiées</h3><dl class="specs">${CHAMPS[typeB(r)].map((c) => `<dt>${esc(c[1])}</dt><dd>${valB(r, c)}</dd>`).join('')}</dl></section>` : ''}
      ${analyse('Différenciation et positionnement technologique', `<p>${esc(r.diff)}</p><p><b>Positionnement :</b> ${esc(r.techno)}</p>`)}
      <div class="grille deux">${analyse('Avantages concurrentiels', liste(r.atouts))}${analyse('Faiblesses et vulnérabilités', liste(r.faiblesses))}</div>
      <section><h3>Sources</h3>${srcs(r.src)}</section>
      ${refs[0] ? `<div class="liens"><button type="button" class="bouton clair" data-aller="concurrence:${refs[0].f}:${refs[0].id}">Voir la matrice concurrentielle</button></div>` : ''}`;
  }

  function ficheInd(i) {
    const prods = K.rivaux.filter((r) => r.ind === i.id);
    return `<div class="tete"><span class="sur">Profil d'industriel · ${esc(K.typesConc[i.type])}</span><h2>${esc(i.n)}</h2><div class="liens">${isoC(i.pays)}<span class="note">${esc(pays(i.pays))}</span></div></div>
      ${fait('Chiffres clés', `<p>${esc(i.chiffres)}</p>`, i.src)}
      ${fait('Profil', `<p>${esc(i.profil)}</p>`)}
      ${analyse('Stratégie observée', `<p>${esc(i.strat)}</p>`)}
      <div class="grille deux">${analyse('Forces', liste(i.forces))}${analyse('Faiblesses', liste(i.faiblesses))}</div>
      <section><h3>Relation avec KNDS, famille par famille</h3>${tableRelations([i])}</section>
      <section><h3>Produits concurrents recensés</h3>${prods.length ? `<div class="liens">${prods.map((r) => lienFiche(r, 'lien')).join('')}</div>` : '<p class="note">Aucun produit détaillé dans la base.</p>'}</section>`;
  }

  function rendreComparaison() {
    const ps = S.cmp.map((id) => P[id]).filter(Boolean);
    const ligne = (lib, f) => `<tr><th scope="row">${esc(lib)}</th>${ps.map((p) => `<td>${f(p)}</td>`).join('')}</tr>`;
    return `<div class="tete"><span class="sur">Comparateur du portefeuille</span><h2>${ps.map((p) => esc(p.n)).join(' · ')}</h2><p class="note">Caractéristiques reprises telles que publiées, non mesurées dans des conditions identiques. Pour une notation pondérée entre produits d'une même famille, utilisez le module Benchmark.</p></div>
      <div class="scroll"><table class="large"><thead><tr><th></th>${ps.map((p) => `<th scope="col">${lienFiche(p)}</th>`).join('')}</tr></thead><tbody>
      ${ligne('Famille', (p) => esc(FAM[p.f].n))}
      ${ligne('Entité', (p) => ent(p.e))}
      ${ligne('Maturité', (p) => `${mat(p.mat)}<p class="note">${esc(p.matTxt)}</p>`)}
      ${ligne('Fonction', (p) => esc(p.role))}
      ${ligne('Conception', (p) => esc(p.dates.c))}
      ${ligne('Lancement', (p) => esc(p.dates.l))}
      ${ligne('Caractéristiques', (p) => `<ul class="liste">${p.specs.map((s) => `<li><b>${esc(s[0])}</b> : ${esc(s[1])}</li>`).join('')}</ul>`)}
      ${ligne('Technologies', (p) => liste(p.tech))}
      ${ligne('Utilisateurs', (p) => (p.users.length ? `${p.users.length} pays : ${p.users.map((u) => isoC(u[0])).join(' ')}` : 'Aucun'))}
      ${ligne('Marchés cibles', (p) => liste(p.marches))}
      ${ligne('Positionnement', (p) => esc(p.pos))}
      ${ligne('Concurrents', (p) => rivauxDe(p.id).map((r) => lienFiche(r, 'lien')).join(' ') || '—')}
      </tbody></table></div>`;
  }

  function tableRelations(inds, avecTotal) {
    const cel = (i, k) => { const v = i.rel[k] || ''; return `<td class="rel rel-${v || '0'}" data-tip-t="${esc(i.n + ' · ' + FAM[k].n)}" data-tip="${esc(REL_LIB[v])}"><i></i><span class="sr">${esc(REL_LIB[v])}</span></td>`; };
    return `<div class="scroll"><table class="large matrice-rel"><thead><tr><th>Industriel</th><th>Origine</th><th>Type</th>${FAMS.map((k) => `<th class="rel" title="${esc(FAM[k].n)}">${esc(FAM[k].court)}</th>`).join('')}</tr></thead><tbody>${inds.map((i) => `<tr><th scope="row">${lienInd(i.id)}</th><td>${isoC(i.pays)}</td><td><span class="note">${esc(K.typesConc[i.type])}</span></td>${FAMS.map((k) => cel(i, k)).join('')}</tr>`).join('')}</tbody>${avecTotal ? `<tfoot><tr><th scope="row" colspan="3">Concurrents directs par famille</th>${FAMS.map((k) => `<td class="n">${inds.filter((i) => i.rel[k] === 'D').length}</td>`).join('')}</tr></tfoot>` : ''}</table></div>`;
  }
  const clesRelations = () => `<div class="cles">${['D', 'I', 'P', ''].map((v) => `<span><span class="rel rel-${v || '0'}"><i></i></span>${esc(REL_LIB[v])}</span>`).join('')}</div>`;

  /* ═══════════ Module 9 : tableau de bord ═══════════ */
  const moisAvant = (n) => { const d = new Date(ARRETE + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() - Number(n)); return d.toISOString().slice(0, 10); };
  const dateIt = (it) => (it.d.length === 7 ? `${it.d.slice(3)}-${it.d.slice(0, 2)}-15` : it.d);
  function passe(it, f, avecDate) {
    if (f.f && ![].concat(it.f || []).includes(f.f)) return false;
    if (f.c && ![].concat(it.c || []).includes(f.c)) return false;
    if (f.p && ![].concat(it.p || []).includes(f.p)) return false;
    if (f.r && it.region !== f.r) return false;
    if (avecDate && f.per && dateIt(it) < moisAvant(f.per)) return false;
    return true;
  }
  function paysSynthese() {
    const s = new Set();
    [K.actus, K.innovations, K.opportunites, K.risques, K.signaux].forEach((l) => l.forEach((it) => [].concat(it.p || []).forEach((c) => c && s.add(c))));
    K.produits.forEach((p) => p.users.forEach((u) => s.add(u[0])));
    return [...s].sort((a, b) => ord(pays(a), pays(b))).map((c) => [c, pays(c)]);
  }

  function vSynthese(el) {
    const f = S.synth;
    el.innerHTML = tete('Module 9 · Tableau de bord', 'Veille concurrentielle KNDS France', `Situation arrêtée au ${K.arrete}. Synthèse des huit autres modules : portefeuille, concurrence, modèles commerciaux, benchmark, marchés, technologies, environnement stratégique et recommandations. Les filtres s'appliquent à tous les panneaux.`)
      + `<div class="barre filtres" role="group" aria-label="Filtres du tableau de bord">`
      + select('fs-f', 'Famille', [['', 'Toutes'], ...FAMS.map((k) => [k, FAM[k].n])], f.f)
      + select('fs-c', 'Concurrent', [['', 'Tous'], ...K.industriels.slice().sort((a, b) => ord(a.n, b.n)).map((i) => [i.id, i.n])], f.c)
      + select('fs-p', 'Pays', [['', 'Tous'], ...paysSynthese()], f.p)
      + select('fs-r', 'Marché', [['', 'Tous'], ...REGIONS.map((r) => [r, r])], f.r)
      + select('fs-per', 'Période', [['3', '3 derniers mois'], ['6', '6 derniers mois'], ['12', '12 derniers mois'], ['', 'Tout l\'historique']], f.per)
      + '<button type="button" class="bouton clair" data-raz="synth">Réinitialiser</button></div><div id="synth" class="colonne"></div>';
    peindreSynth();
  }

  function peindreSynth() {
    const box = $('#synth');
    if (!box) return;
    const f = S.synth;
    const actus = K.actus.filter((a) => passe(a, f, true)).sort((a, b) => (a.d < b.d ? 1 : -1));
    const innos = K.innovations.filter((a) => passe(a, f, true)).sort((a, b) => (dateIt(a) < dateIt(b) ? 1 : -1));
    const opps = K.opportunites.filter((a) => passe(a, f, false));
    const risq = K.risques.filter((a) => passe(a, f, false)).sort((a, b) => b.niv - a.niv);
    const sig = K.signaux.filter((a) => passe(a, f, false));
    const prods = K.produits.filter((p) => (!f.f || p.f === f.f) && (!f.p || p.users.some((u) => u[0] === f.p)));
    const nE = (e) => prods.filter((p) => p.e === e).length;
    const inds = K.industriels.filter((i) => (!f.c || i.id === f.c) && (!f.f || i.rel[f.f]));
    const nT = (t) => inds.filter((i) => i.type === t).length;
    const paires = PAIRES.filter(([p, r]) => (!f.f || p.f === f.f) && (!f.c || r.ind === f.c) && (!f.p || p.users.some((u) => u[0] === f.p))).length;
    const progs = K.programmes.filter((g) => (!f.f || g.f === f.f) && (!f.p || g.pays === f.p) && (!f.r || regionDe(g.pays) === f.r));
    const perLib = f.per ? `sur ${f.per} mois` : 'depuis janvier 2026';

    box.innerHTML = `<div class="kpis">
        ${kpi(prods.length, 'produits KNDS recensés', `${nE('FR')} KNDS France · ${nE('DE')} KNDS Deutschland · ${nE('JV')} conjoint${nE('JV') > 1 ? 's' : ''}`)}
        ${kpi(f.f ? 1 : FAMS.length, f.f ? 'famille sélectionnée' : 'familles de produits', f.f ? FAM[f.f].n : 'des chars de combat aux services')}
        ${kpi(inds.length, 'concurrents identifiés', `${nT('D')} directs · ${nT('I')} indirects · ${nT('P')} partenaires · ${nT('N')} nouveaux entrants`)}
        ${kpi(paires, 'comparaisons produit à produit', `et ${K.benchmarks.length} études de benchmark multicritère`)}
        ${kpi(new Set(progs.map((g) => g.pays)).size, 'marchés suivis', `${progs.length} programmes d'acquisition`)}
        ${kpi(actus.length, 'actualités concurrentielles', perLib)}
      </div>
      <div class="grille deux">
        <section class="cadre">${entete('Dernières actualités concurrentielles', `${actus.length} élément${actus.length > 1 ? 's' : ''} · ≈ date approximative`)}${filActus(actus)}</section>
        <div class="colonne">
          <section class="cadre">${entete('KNDS Group en 2025', 'Résultats publiés le 26 mai 2026')}${blocChiffres()}</section>
          <section class="cadre">${entete('Innovations récemment annoncées', `${innos.length}`)}${innos.length ? `<ol class="fil">${innos.map((a) => `<li><time>${esc(a.d)}</time><div><strong>${esc(a.t)}</strong><div class="bas"><span class="puce">${esc(a.qui)}</span>${famP(a.f)}${srcs(a.src)}</div></div></li>`).join('')}</ol>` : vide('Aucune innovation pour ces filtres.')}</section>
        </div>
      </div>
      <div class="grille deux">
        <section class="cadre">${entete('Opportunités commerciales détectées', 'Non datées : état au ' + K.arrete)}${opps.length ? `<ul class="items">${opps.map((o) => `<li><strong>${esc(o.t)}</strong><p>${esc(o.txt)}</p><div class="bas">${famP(o.f)}${o.p.map(isoC).join('')}${o.c.length ? `<span class="note">Face à</span>${o.c.map(lienInd).join('')}` : ''}${srcs(o.src)}</div></li>`).join('')}</ul>` : vide('Aucune opportunité pour ces filtres.')}</section>
        <section class="cadre">${entete('Principaux risques stratégiques', 'Niveau coté par l\'auteur')}${risq.length ? `<ul class="items">${risq.map((r) => `<li><div class="entete"><strong>${esc(r.t)}</strong>${niveau(r.niv)}</div><p>${esc(r.txt)}</p><div class="bas">${famP(r.f)}${r.c.map(lienInd).join('')}${srcs(r.src)}</div></li>`).join('')}</ul>` : vide('Aucun risque pour ces filtres.')}</section>
      </div>
      <section class="cadre">${entete('Principaux marchés identifiés', f.f ? `Pays utilisateurs de produits KNDS, famille ${FAM[f.f].n.toLowerCase()}` : 'Pays utilisateurs de produits KNDS')}${blocMarchesSynthese(f)}</section>
      <section class="signaux">${entete('Signaux faibles', 'Évolutions encore marginales qui pourraient modifier le portefeuille de KNDS')}${sig.length ? `<ul>${sig.map((s) => `<li><strong>${esc(s.t)}</strong><p>${esc(s.txt)}</p><div class="bas">${famP(s.f)}${srcs(s.src)}</div></li>`).join('')}</ul>` : '<p class="note">Aucun signal faible pour ces filtres.</p>'}</section>`;
  }

  function filActus(l) {
    if (!l.length) return vide('Aucune actualité ne correspond à ces filtres.');
    const n = S.synth.tout ? l.length : Math.min(8, l.length);
    return `<ol class="fil">${l.slice(0, n).map((a) => `<li><time datetime="${a.d}"${a.ap ? ' title="Date approximative"' : ''}>${a.ap ? '≈ ' : ''}${dateFr(a.d)}</time><div><strong>${esc(a.t)}</strong><p>${esc(a.r)}</p><div class="bas"><span class="puce rouge">${esc(a.type)}</span>${(a.f || []).map(famP).join('')}${(a.c || []).map(lienInd).join('')}${(a.p || []).map(isoC).join('')}${srcs(a.src)}</div></div></li>`).join('')}</ol>${l.length > 8 ? `<div><button type="button" class="bouton clair" data-plus>${S.synth.tout ? 'Réduire la liste' : `Afficher les ${l.length - 8} autres`}</button></div>` : ''}`;
  }

  function blocChiffres() {
    const c = K.kndsChiffres;
    const tot = c.segments.reduce((s, x) => s + x[1], 0);
    return `<div class="kpis petits">${kpi(nf(c.ca[1]) + ' Md€', 'chiffre d\'affaires 2025', `${c.caEvo} sur un an`)}${kpi(nf(c.commandes) + ' Md€', 'prises de commandes', 'record historique')}${kpi(nf(c.carnet[1]) + ' Md€', 'carnet de commandes', `contre ${nf(c.carnet[0])} Md€ fin 2024`)}</div>
      <div class="colonne-s"><h4>Chiffre d'affaires 2025 par segment</h4>
        <div class="seg" role="img" aria-label="${esc(c.segments.map((s) => `${s[0]} ${nf(s[1], 3)} Md€`).join(', '))}">${c.segments.map((s) => `<i class="${s[3]}" style="width:${(s[1] / tot) * 100}%" data-tip-t="${esc(s[0])}" data-tip="${esc(`${nf(s[1], 3)} Md€ · ${s[2]} sur un an`)}">${s[1] / tot > 0.2 ? esc(nf(s[1]) + ' Md€') : ''}</i>`).join('')}</div>
        <div class="legende">${c.segments.map((s) => `<span><i class="${s[3]}"></i>${esc(s[0])}</span>`).join('')}</div>
        <p class="note">${c.segments.map((s) => `${esc(s[0])} : ${nf(s[1], 3)} Md€ (${esc(s[2])})`).join(' · ')}</p></div>
      ${analyse('Lecture', `<p>${esc(c.autres)}</p><p>Le carnet représente environ ${nf(c.carnet[1] / c.ca[1])} années de chiffre d'affaires au rythme de 2025.</p>`, c.src)}`;
  }

  function blocMarchesSynthese(f) {
    const cpt = {};
    K.produits.filter((p) => !f.f || p.f === f.f).forEach((p) => p.users.forEach((u) => { (cpt[u[0]] = cpt[u[0]] || new Set()).add(p.id); }));
    const classes = {}, tips = {};
    Object.entries(cpt).forEach(([c, set]) => {
      const n = set.size;
      classes[c] = n >= 5 ? 'n3' : n >= 2 ? 'n2' : 'n1';
      tips[c] = [pays(c), `${n} produit${n > 1 ? 's' : ''} KNDS : ${[...set].map((id) => P[id].n).join(', ')}`];
    });
    const top = Object.entries(cpt).sort((a, b) => b[1].size - a[1].size || ord(pays(a[0]), pays(b[0]))).slice(0, 12);
    const progsDe = (c) => K.programmes.filter((g) => g.pays === c).map((g) => `<span class="op op-${g.op}" title="${esc(K.opLabels[g.op])}">${esc(g.prog)}</span>`).join('<br>') || '<span class="note">—</span>';
    return `<div class="carte-grille"><figure class="carte colonne-s">${carte(classes, tips, { label: 'Pays utilisateurs de produits KNDS', clic: true })}<figcaption class="legende"><span><i class="n1"></i>1 produit</span><span><i class="n2"></i>2 à 4 produits</span><span><i class="n3"></i>5 produits et plus</span><span><i class="n0"></i>Aucun recensé</span></figcaption><p class="note">Un clic sur un pays ouvre ses produits dans le portefeuille. Les utilisateurs comprennent les commandes annoncées et les cessions à l'Ukraine.</p></figure>
      <div class="scroll"><table><thead><tr><th>Pays</th><th class="n">Produits</th><th>Programmes suivis</th></tr></thead><tbody>${top.map(([c, set]) => `<tr><th scope="row"><button type="button" class="lien-txt" data-pays-port="${c}">${esc(pays(c))}</button></th><td class="n">${set.size}</td><td>${progsDe(c)}</td></tr>`).join('')}</tbody></table></div></div>`;
  }

  /* ═══════════ Module 1 : portefeuille ═══════════ */
  const TXT = {};
  const texteProduit = (p) => TXT[p.id] || (TXT[p.id] = norm([p.n, p.role, FAM[p.f].n, K.entites[p.e], p.part, ...(p.usages || []), ...(p.tech || []), ...(p.specs || []).flat(), ...(p.marches || []), p.pos, ...(p.users || []).map((u) => pays(u[0]) + ' ' + u[1]), ...(p.evo || [])].join(' ')));

  function vPortefeuille(el) {
    const f = S.port;
    const paysU = [...new Set(K.produits.flatMap((p) => p.users.map((u) => u[0])))].sort((a, b) => ord(pays(a), pays(b)));
    el.innerHTML = tete('Module 1 · Cartographie du portefeuille', 'Portefeuille produits KNDS', `${K.produits.length} produits développés, commercialisés ou soutenus par KNDS France, KNDS Deutschland et leurs programmes conjoints, en dix familles. Chaque fiche sépare les faits sourcés de l'analyse de positionnement et renvoie vers une photographie authentique lorsqu'il en existe une sous licence libre.`)
      + `<section class="cadre"><div class="entete"><h2>Répartition par famille et par entité</h2><div class="legende"><span><i class="s1"></i>KNDS France</span><span><i class="s2"></i>KNDS Deutschland</span><span><i class="s3"></i>Conjoint</span></div></div>${composition()}</section>`
      + `<div class="barre filtres" role="group" aria-label="Filtres du portefeuille"><label class="champ" for="fp-q"><span>Recherche</span><input type="search" id="fp-q" placeholder="Nom, technologie, pays, usage…" value="${esc(f.q)}" autocomplete="off"></label>`
      + select('fp-e', 'Entité', [['', 'Toutes'], ['FR', 'KNDS France'], ['DE', 'KNDS Deutschland'], ['JV', 'Conjoint']], f.e)
      + select('fp-m', 'Maturité', [['', 'Toutes'], ...Object.keys(K.maturites).map((m) => [m, MAT_COURT[m]])], f.m)
      + select('fp-p', 'Pays utilisateur', [['', 'Tous'], ...paysU.map((c) => [c, pays(c)])], f.p)
      + '<button type="button" class="bouton clair" data-raz="port">Réinitialiser</button></div><div id="fp-fam"></div><p class="note" id="fp-n" aria-live="polite"></p><div class="cartes" id="fp-cartes"></div>';
    peindrePort();
  }

  function composition() {
    const max = Math.max(...FAMS.map((k) => K.produits.filter((p) => p.f === k).length));
    const cls = { FR: 's1', DE: 's2', JV: 's3' };
    return `<div class="compos">${FAMS.map((k) => {
      const l = K.produits.filter((p) => p.f === k);
      const n = { FR: 0, DE: 0, JV: 0 };
      l.forEach((p) => { n[p.e] += 1; });
      const det = [n.FR && `${n.FR} France`, n.DE && `${n.DE} Deutschland`, n.JV && `${n.JV} conjoint${n.JV > 1 ? 's' : ''}`].filter(Boolean).join(' · ');
      return `<button type="button" class="compo" data-pfam="${k}" aria-label="${esc(`${FAM[k].n} : ${l.length} produits (${det}). Afficher cette famille.`)}"><span class="nom">${esc(FAM[k].n)}<small>${esc(det)}</small></span><span class="piste empile">${['FR', 'DE', 'JV'].filter((e) => n[e]).map((e) => `<i class="${cls[e]}" style="width:${(n[e] / max) * 98}%"></i>`).join('')}</span><span class="tot">${l.length}</span></button>`;
    }).join('')}</div>`;
  }

  function filtrePort(sansFam) {
    const f = S.port, q = norm(f.q).trim();
    return K.produits.filter((p) => (sansFam || !f.f || p.f === f.f) && (!f.e || p.e === f.e) && (!f.m || p.mat === f.m) && (!f.p || p.users.some((u) => u[0] === f.p)) && (!q || q.split(/\s+/).every((m) => texteProduit(p).includes(m))));
  }

  function peindrePort() {
    if (!$('#fp-cartes')) return;
    const base = filtrePort(true), l = filtrePort(false);
    $('#fp-fam').innerHTML = onglets('pfam', [['', `Toutes (${base.length})`], ...FAMS.map((k) => [k, `${FAM[k].court} (${base.filter((p) => p.f === k).length})`])], S.port.f, 'Familles de produits');
    $('#fp-n').textContent = `${l.length} produit${l.length > 1 ? 's' : ''} affiché${l.length > 1 ? 's' : ''} sur ${K.produits.length}${S.port.p ? `, utilisés par : ${pays(S.port.p)}` : ''}. Cochez « Comparer » sur deux à quatre fiches pour les mettre côte à côte.`;
    $('#fp-cartes').innerHTML = l.length ? l.map((p) => `<article class="carte-p">${tuile(p)}<div class="corps"><h3><button type="button" data-fiche="${p.id}">${esc(p.n)}</button></h3><div class="liens">${ent(p.e)}<span class="puce">${esc(FAM[p.f].n)}</span></div><p class="role">${esc(p.role)}</p><div class="pied">${mat(p.mat)}<span>${p.users.length ? `${p.users.length} pays` : 'Aucun utilisateur'}</span><label class="cmp"><input type="checkbox" data-cmp="${p.id}"${S.cmp.includes(p.id) ? ' checked' : ''}> Comparer</label></div></div></article>`).join('') : vide('Aucun produit ne correspond à ces critères.');
  }

  function majPlateau() {
    if (!S.cmp.length || S.vue !== 'portefeuille') { plateau.hidden = true; return; }
    plateau.hidden = false;
    plateau.innerHTML = `<span class="noms" role="status"><b>${S.cmp.length} sur 4</b> · ${S.cmp.map((id) => esc(P[id].n)).join(', ')}${S.msg ? ` · ${esc(S.msg)}` : ''}</span><button type="button" class="bouton clair" data-cmp-vider>Vider</button><button type="button" class="bouton" data-cmp-ouvrir${S.cmp.length < 2 ? ' disabled' : ''}>Comparer</button>`;
    S.msg = '';
  }
  function basculerCmp(id, on, input) {
    const i = S.cmp.indexOf(id);
    if (on && i < 0) {
      if (S.cmp.length >= 4) { if (input) input.checked = false; S.msg = 'quatre produits au maximum'; majPlateau(); return false; }
      S.cmp.push(id);
    }
    if (!on && i >= 0) S.cmp.splice(i, 1);
    majPlateau();
    return true;
  }

  /* ═══════════ Module 2 : concurrence ═══════════ */
  function vConcurrence(el) {
    el.innerHTML = tete('Module 2 · Cartographie concurrentielle', 'Qui concurrence KNDS, et sur quoi', `${K.industriels.length} industriels et ${K.rivaux.length} produits concurrents. Les relations sont établies famille par famille, puis produit par produit : aucun industriel n'est considéré par défaut comme concurrent sur tous les segments.`)
      + `<section><div class="entete filet"><h2>Relations par famille de produits</h2></div><div id="cc-types"></div>${clesRelations()}<div id="cc-mat"></div></section>`
      + '<section><div class="entete filet"><h2>Matrice concurrentielle, produit par produit</h2></div><div id="cc-fam"></div><div id="cc-ref"></div><div id="cc-table" class="colonne"></div></section>'
      + '<section><div class="entete filet"><h2>Profils des industriels</h2></div><div class="grille etroite" id="cc-prof"></div></section>';
    peindreConc();
  }

  function peindreConc() {
    if (!$('#cc-mat')) return;
    const c = S.conc;
    const inds = K.industriels.filter((i) => !c.t || i.type === c.t);
    $('#cc-types').innerHTML = onglets('ctype', [['', 'Tous'], ['D', 'Directs'], ['I', 'Indirects'], ['P', 'Partenaires et concurrents'], ['N', 'Nouveaux entrants']], c.t, 'Type de concurrent');
    $('#cc-mat').innerHTML = inds.length ? tableRelations(inds, true) : vide('Aucun industriel de ce type.');
    const famsAvec = FAMS.filter((k) => K.produits.some((p) => p.f === k && rivauxDe(p.id).length));
    if (!famsAvec.includes(c.f)) c.f = famsAvec[0];
    $('#cc-fam').innerHTML = onglets('cfam', famsAvec.map((k) => [k, FAM[k].n]), c.f, 'Famille de produits');
    const refs = K.produits.filter((p) => p.f === c.f && rivauxDe(p.id).length).sort((a, b) => rivauxDe(b.id).length - rivauxDe(a.id).length || ord(a.n, b.n));
    if (!refs.some((p) => p.id === c.ref)) c.ref = refs[0].id;
    $('#cc-ref').innerHTML = `<div class="barre">${select('cc-refsel', 'Produit KNDS de référence', refs.map((p) => [p.id, `${p.n} (${rivauxDe(p.id).length} concurrent${rivauxDe(p.id).length > 1 ? 's' : ''})`]), c.ref)}</div>`;
    $('#cc-table').innerHTML = matriceProduit(P[c.ref]);
    $('#cc-prof').innerHTML = inds.map((i) => `<article class="cadre"><div class="entete"><h3><button type="button" data-ind="${i.id}">${esc(i.n)}</button></h3>${isoC(i.pays)}</div><div class="liens"><span class="puce${i.type === 'D' ? ' rouge' : ''}">${esc(K.typesConc[i.type])}</span></div><p>${esc(i.profil)}</p><p class="note">${esc(i.chiffres)}</p><div><button type="button" class="lien" data-ind="${i.id}">Profil complet</button></div></article>`).join('');
  }

  function matriceProduit(p) {
    const rv = rivauxDe(p.id), int = internesDe(p.id), at = K.atoutsKnds[p.id];
    const ligneK = `<tr class="knds-col"><th scope="row">${lienFiche(p)}<div class="note">Référence KNDS</div></th><td>${esc(K.entites[p.e])}</td><td>${origine(p).map(isoC).join(' ')}</td><td>${esc((p.marches || []).join(' ; '))}</td><td>${p.users.map((u) => isoC(u[0])).join(' ') || '—'}</td><td>${esc((p.tech || []).slice(0, 3).join(' ; '))}</td><td>${mat(p.mat)}</td><td>${at ? liste(at[0]) : '<span class="note">Voir la fiche</span>'}</td><td>${at ? liste(at[1]) : '<span class="note">Voir la fiche</span>'}</td><td>${srcs(p.src)}</td></tr>`;
    const lignes = rv.map((r) => `<tr><th scope="row">${lienFiche(r)}${r.seg ? `<div class="note">${esc(r.seg)}</div>` : ''}</th><td>${lienInd(r.ind)}</td><td>${isoC(r.pays)}</td><td>${esc(r.marches)}</td><td>${esc(r.users)}</td><td>${esc(r.diff)}</td><td>${esc(r.techno)}</td><td>${liste(r.atouts)}</td><td>${liste(r.faiblesses)}</td><td>${srcs(r.src)}</td></tr>`).join('');
    return `<p class="note">${rv.length} produit${rv.length > 1 ? 's' : ''} concurrent${rv.length > 1 ? 's' : ''} face au produit de référence « ${esc(p.n)} ».${int.length ? ` Concurrence interne au groupe : ${int.map((x) => esc(x.n)).join(', ')}.` : ''} Les colonnes de différenciation, de positionnement, d'avantages et de faiblesses relèvent de l'analyse ; les marchés et utilisateurs relèvent des faits.</p>
      <div class="scroll"><table class="tres-large"><thead><tr><th>Produit</th><th>Industriel</th><th>Origine</th><th>Marchés adressés</th><th>Utilisateurs connus</th><th>Caractéristiques différenciantes</th><th>Positionnement technologique</th><th>Avantages concurrentiels</th><th>Faiblesses et vulnérabilités</th><th>Sources</th></tr></thead><tbody>${ligneK}${lignes}</tbody></table></div>`;
  }

  /* ═══════════ Module 3 : modèles commerciaux ═══════════ */
  const COUCHES = ['Équipement', 'Munitions initiales', 'Formation et simulation', 'Rechanges et outillage', 'Infrastructures', 'Part locale et transfert de technologie', 'Soutien en service sur 10 à 30 ans'];

  function vModeles(el) {
    el.innerHTML = tete('Module 3 · Modèles commerciaux', 'Comment KNDS et ses concurrents valorisent leurs produits', 'Axe prioritaire de l\'étude. Pour chaque industriel, les faits observables sont séparés de leur interprétation. Une règle traverse tout le module : le prix d\'un équipement n\'est jamais la valeur d\'un contrat, qui comprend aussi formation, munitions, rechanges, infrastructures et soutien.')
      + '<section><div class="entete filet"><h2>Les quatre leviers, industriel par industriel</h2></div><div id="md-pil"></div><div class="grille" id="md-cartes"></div></section>'
      + `<section><div class="entete filet"><h2>Prix d'équipement et valeur de contrat</h2></div>
          <div class="grille deux"><div class="alerte"><b>Une valeur de contrat divisée par une quantité n'est pas un prix</b><p>Les contrats publiés agrègent des éléments très différents d'un client à l'autre. Le ratio « valeur par unité » sert à comparer des ordres de grandeur de contrats, jamais des prix d'équipement. Les contrats dont le périmètre rend ce ratio trompeur sont listés sans ratio, avec la raison.</p></div>
          <div class="cadre"><h4>Ce que peut contenir un contrat d'armement terrestre</h4><ol class="couches">${COUCHES.map((c) => `<li>${esc(c)}</li>`).join('')}</ol><p class="note">Schéma qualitatif : la part de chaque élément n'est pas publiée et n'est pas estimée ici.</p></div></div>
          <div id="md-fc"></div><div id="md-contrats" class="colonne"></div></section>`
      + `<section><div class="entete filet"><h2>Bilan : avantages, limites et effet sur la compétitivité</h2></div><div class="scroll"><table class="tres-large"><thead><tr><th>Industriel</th><th>Avantages du modèle</th><th>Limites</th><th>Conséquence sur la compétitivité</th></tr></thead><tbody>${K.modeles.map((m) => `<tr${m.ref ? ' class="knds-col"' : ''}><th scope="row">${esc(m.n)}</th><td>${liste(m.avantages)}</td><td>${liste(m.limites)}</td><td>${esc(m.consequence)}</td></tr>`).join('')}</tbody></table></div></section>`
      + `<section><div class="entete filet"><h2>Archétypes de modèles commerciaux</h2></div><div class="scroll"><table class="tres-large"><thead><tr><th>Modèle</th><th>Exemples</th><th>Avantages</th><th>Limites</th><th>Conséquences pour KNDS</th></tr></thead><tbody>${K.archetypes.map((a) => `<tr><th scope="row">${esc(a.n)}</th><td>${esc(a.ex)}</td><td>${esc(a.av)}</td><td>${esc(a.li)}</td><td>${esc(a.cq)}</td></tr>`).join('')}</tbody></table></div><p class="note">Les colonnes « Avantages », « Limites » et « Conséquences » relèvent de l'analyse.</p></section>`;
    peindreModeles();
  }

  function peindreModeles() {
    if (!$('#md-cartes')) return;
    const pil = S.mod.pil, fc = S.mod.fc;
    $('#md-pil').innerHTML = onglets('mpil', Object.entries(K.piliers), pil, 'Levier');
    $('#md-cartes').innerHTML = K.modeles.map((m) => `<article class="cadre${m.ref ? ' ref-knds' : ''}"><div class="entete"><h3>${esc(m.n)}</h3>${m.ref ? `<span class="puce ${m.id === 'knds-de' ? 'de' : 'fr'}">Groupe KNDS</span>` : ''}</div>${fait('Faits', liste(m[pil].faits), m[pil].src)}${analyse('Analyse', `<p>${esc(m[pil].analyse)}</p>`)}</article>`).join('');
    $('#md-fc').innerHTML = onglets('mfc', [['ART', 'Artillerie'], ['MBT', 'Chars de combat'], ['VEH', 'Véhicules blindés'], ['', 'Tous les contrats']], fc, 'Famille de contrats');
    const l = K.contrats.filter((c) => !fc || c.f === fc || (fc === 'MBT' && c.f === 'MOD'));
    const comp = l.filter((c) => parUnite(c) != null).sort((a, b) => parUnite(b) - parUnite(a));
    const graphe = fc && comp.length ? `<div class="cadre"><div class="entete"><h3>Valeur contractuelle par unité, en millions d'euros</h3><div class="legende"><span><i class="s1"></i>Contrat d'un produit KNDS</span><span><i></i>Concurrent</span></div></div>
      ${barres(comp.map((c) => ({ lib: `${c.p} · ${pays(c.client)} ${c.an}`, v: parUnite(c), k: contratKnds(c), prefixe: '≈ ', tip: `${valeurTxt(c)} pour ${nf(c.q, 0)} unités\nPérimètre : ${c.perim}\nStatut : ${K.statuts[c.st]}` })), 'M€')}
      <p class="note">Conversion à taux indicatifs constants (1 $ = 0,88 €, 1 £ = 1,17 €, 1 CZK = 0,04 €, 1 SEK = 0,09 €), sans correction de l'inflation. Ordre de grandeur, pas un prix.</p>
      ${K.lectureContrats[fc] ? analyse('Lecture', `<p>${esc(K.lectureContrats[fc])}</p>`) : ''}</div>` : '';
    $('#md-contrats').innerHTML = graphe + `<div class="scroll"><table class="tres-large"><thead><tr><th>Contrat</th><th>Industriel</th><th>Client</th><th class="n">Année</th><th class="n">Quantité</th><th class="n">Valeur publiée</th><th class="n">Valeur par unité</th><th>Périmètre déclaré</th><th>Statut</th><th>Sources</th></tr></thead><tbody>${l.map((c) => { const u = parUnite(c); return `<tr${contratKnds(c) ? ' class="knds-col"' : ''}><th scope="row"><button type="button" class="lien-txt" data-fiche="${c.pid}">${esc(c.p)}</button></th><td>${esc(c.ind)}</td><td>${isoC(c.client)} ${esc(pays(c.client))}</td><td class="n">${c.an}</td><td class="n">${c.q == null ? '—' : nf(c.q, 0)}</td><td class="n">${esc(valeurTxt(c))}</td><td class="n">${u != null ? '≈ ' + nf(u) + ' M€' : `<span class="note">${esc(c.nc || 'Non calculable')}</span>`}</td><td>${esc(c.perim)}</td><td>${st(c.st)}</td><td>${srcs(c.src)}</td></tr>`; }).join('')}</tbody></table></div>`;
  }

  /* ═══════════ Module 4 : benchmark ═══════════ */
  function vBenchmark(el) {
    el.innerHTML = tete('Module 4 · Benchmark produits', 'Comparateur multicritère', 'Choisissez une étude, puis les produits à comparer, tous de la même famille. Le comparateur sépare les données mesurables publiées (tableau et graphiques) de l\'appréciation de l\'analyste (notation pondérée), qui reste une opinion argumentée et non une mesure.')
      + '<div id="bm-etudes"></div><div id="bm-corps" class="colonne"></div>';
    peindreBench();
  }
  const etudeCourante = () => K.benchmarks.find((x) => x.id === S.bench.id) || K.benchmarks[0];
  const selection = (b) => S.bench.sel[b.id] || (S.bench.sel[b.id] = b.defaut.slice());
  const psCourants = () => { const b = etudeCourante(); return selection(b).map((id) => P[id]).filter(Boolean); };

  function peindreBench() {
    if (!$('#bm-corps')) return;
    const b = etudeCourante();
    S.bench.id = b.id;
    const sel = selection(b), ps = psCourants();
    $('#bm-etudes').innerHTML = onglets('betude', K.benchmarks.map((x) => [x.id, court(x.n)]), b.id, 'Étude de benchmark');
    $('#bm-corps').innerHTML = `<section class="cadre"><div class="entete"><h2>${esc(b.n)}</h2><span class="note">${ps.length} produit${ps.length > 1 ? 's' : ''} comparé${ps.length > 1 ? 's' : ''}</span></div>
        <div class="choix" role="group" aria-label="Produits comparés">${b.ids.map((id) => { const p = P[id]; return `<label class="choix-p${p.knds ? ' k' : ''}"><input type="checkbox" data-bsel="${id}"${sel.includes(id) ? ' checked' : ''}> ${esc(p.n)} <span class="note">${esc(court(auteur(p)))}</span></label>`; }).join('')}</div>
        <p class="note">${esc(b.note)}</p></section>
      ${ps.length < 2 ? vide('Sélectionnez au moins deux produits.') : mesurable(b, ps) + notation(ps) + lecture(ps)}`;
  }

  function mesurable(b, ps) {
    const ch = CHAMPS[b.type];
    const contrat = (p) => {
      const c = K.contrats.filter((x) => x.pid === p.id && parUnite(x) != null).sort((a, z) => z.an - a.an)[0];
      return c ? `≈ ${nf(parUnite(c))} M€ <span class="note">(${esc(pays(c.client))}, ${c.an}, ${nf(c.q, 0)} unités)</span>` : '<span class="note">Aucun contrat comparable publié</span>';
    };
    const ligne = (lib, f) => `<tr><th scope="row">${lib}</th>${ps.map((p) => `<td${p.knds ? ' class="knds-col"' : ''}>${f(p)}</td>`).join('')}</tr>`;
    const table = `<div class="scroll"><table class="large"><thead><tr><th>Donnée publiée</th>${ps.map((p) => `<th scope="col"${p.knds ? ' class="knds-col"' : ''}>${lienFiche(p)}</th>`).join('')}</tr></thead><tbody>
      ${ligne('Industriel', (p) => esc(auteur(p)))}
      ${ligne('Origine', (p) => origine(p).map(isoC).join(' '))}
      ${ch.map((c) => ligne(esc(c[1]), (p) => valB(p, c))).join('')}
      ${ligne('Maturité', (p) => (p.knds ? mat(p.mat) : `<span class="note">${esc(p.techno)}</span>`))}
      ${ligne('Utilisateurs', (p) => (p.knds ? (p.users.length ? p.users.map((u) => isoC(u[0])).join(' ') : 'Aucun') : esc(p.users)))}
      ${ligne('Valeur contractuelle publique par unité', contrat)}
      </tbody></table></div>`;
    const minis = `<div class="minis">${METRIQUES[b.type].map((m) => {
      const c = ch.find((x) => x[0] === m);
      return `<figure><figcaption>${esc(c[1])}${c[2] ? ` (${esc(c[2])})` : ''}</figcaption>${barres(ps.map((p) => ({ lib: court(p.n), v: p.b ? p.b[m] : null, k: p.knds })), '')}</figure>`;
    }).join('')}</div>`;
    return `<section class="cadre"><div class="entete"><h2>Données mesurables publiées</h2><span class="puce">Faits</span></div><p class="note">Valeurs constructeur ou de presse, non mesurées dans des conditions identiques ; « n.c. » signale une donnée non communiquée. Aucun classement n'est tiré de ce tableau. En bleu : produits KNDS.</p>${table}${minis}</section>`;
  }

  const CRIT_COURT = { maturite: 'Maturité', feu: 'Feu', mobilite: 'Mobilité', protection: 'Protection', cout: 'Coût', offre: 'Offre et délais' };
  const points = (v) => (v == null ? '<span class="note">n.é.</span>' : `<span class="pts" role="img" aria-label="${v} sur 5">${[1, 2, 3, 4, 5].map((k) => `<i class="${k <= v ? 'on' : ''}"></i>`).join('')}</span>`);
  function notation(ps) {
    const w = S.bench.w, somme = w.reduce((s, x) => s + x, 0);
    return `<section class="cadre"><div class="entete"><h2>Appréciation multicritère pondérée</h2><span class="puce rouge">Analyse</span></div>
      <p class="note">Notes de 1 à 5 attribuées par l'analyste à partir des faits de la plateforme (5 = le plus favorable ; pour le coût, 5 = le plus accessible). Le score est la moyenne des notes pondérée par vos réglages. Un produit dont un critère pondéré n'est pas évaluable (n.é.) reçoit un score partiel et n'est pas classé.</p>
      <div class="poids">${K.criteres.map((c, i) => `<label for="bw-${c.id}"><span>${esc(c.n)}</span><output id="bw-o-${c.id}">${Math.round(somme ? (w[i] / somme) * 100 : 0)} %</output><input type="range" id="bw-${c.id}" min="0" max="40" step="5" value="${w[i]}" data-bpoids="${i}"><small>${esc(c.d)}</small></label>`).join('')}</div>
      <div><button type="button" class="bouton clair" data-bpoids-raz>Rétablir les pondérations par défaut</button></div>
      <div id="bm-table">${tableNotes(ps)}</div></section>`;
  }
  function tableNotes(ps) {
    const w = S.bench.w;
    const res = ps.map((p) => {
      const n = K.notes[p.id] || [];
      let num = 0, den = 0;
      const manq = [];
      K.criteres.forEach((c, i) => { if (!w[i]) return; if (n[i] == null) { manq.push(c.n.toLowerCase()); return; } num += w[i] * n[i]; den += w[i]; });
      return { p, n, score: den ? num / den : null, manq };
    });
    const complets = res.filter((r) => r.score != null && !r.manq.length).sort((a, z) => z.score - a.score);
    const rang = new Map(complets.map((r, i) => [r.p.id, i + 1]));
    const ordre = [...complets, ...res.filter((r) => !rang.has(r.p.id))];
    return `<div class="scroll"><table class="large notes"><thead><tr><th class="n">Rang</th><th>Produit</th><th>Score pondéré sur 5</th>${K.criteres.map((c) => `<th title="${esc(c.n + ' : ' + c.d)}">${esc(CRIT_COURT[c.id] || c.n)}</th>`).join('')}</tr></thead><tbody>${ordre.map((r) => `<tr${r.p.knds ? ' class="knds-col"' : ''}><td class="n">${rang.get(r.p.id) || '—'}</td><th scope="row">${esc(r.p.n)}</th><td>${r.score == null ? '<span class="note">Non évaluable</span>' : `<div class="score"><b>${nf(r.score)}</b><div class="piste"><i class="${r.p.knds ? 'k' : ''}" style="width:${(r.score / 5) * 100}%"></i></div></div>${r.manq.length ? `<span class="note">Score partiel, non classé : ${esc(r.manq.join(', '))} non évalué</span>` : ''}`}</td>${K.criteres.map((c, i) => `<td>${points(r.n[i])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function lecture(ps) {
    return `<section class="cadre"><div class="entete"><h2>Avantages concurrentiels et limites identifiées</h2><span class="puce rouge">Analyse</span></div><div class="grille etroite">${ps.map((p) => {
      const a = p.knds ? K.atoutsKnds[p.id] : [p.atouts, p.faiblesses];
      return `<div class="colonne-s"><h3>${lienFiche(p)}</h3>${a ? `<h4>Avantages</h4>${liste(a[0])}<h4>Limites</h4>${liste(a[1])}` : '<p class="note">Voir la fiche produit.</p>'}</div>`;
    }).join('')}</div></section>`;
  }

  /* ═══════════ Module 5 : marchés ═══════════ */
  function vMarches(el) {
    const d = K.depenses;
    el.innerHTML = tete('Module 5 · Marchés et parts de marché', 'Marchés de l\'armement terrestre', 'Dépenses, activité des industriels, positions concurrentielles et programmes d\'acquisition. Faute de parts de marché fiables en source ouverte, le module emploie des indicateurs de substitution et affiche toujours ce que chacun mesure.')
      + `<section><div class="entete filet"><h2>Ce que mesure chaque indicateur</h2></div><div class="scroll"><table class="large"><thead><tr><th>Notion</th><th>Disponibilité en source ouverte</th><th>Traitement dans la plateforme</th></tr></thead><tbody>${K.notionsPdm.map((n) => `<tr><th scope="row">${esc(n[0])}</th><td>${esc(n[1])}</td><td>${esc(n[2])}</td></tr>`).join('')}</tbody></table></div></section>`
      + `<div class="grille deux"><section class="cadre">${entete(d.titre, `en ${d.unite} · monde : ${nf(d.monde, 0)} Md$`)}${barres(d.rows.map((r) => ({ lib: r[1], libHtml: `${esc(r[1])} ${st(r[3])}`, v: r[2], k: r[0] === 'FR' || r[0] === 'DE', tip: `${nf(r[2])} Md$ · ${K.statuts[r[3]]}` })), 'Md$')}<div class="legende"><span><i class="s1"></i>Pays actionnaires de KNDS</span><span><i></i>Autres pays</span></div><p class="note">${esc(d.note)}</p>${srcs(d.src)}</section>
          <section class="cadre">${entete('KNDS Group : activité 2025', 'Communiqué du 26 mai 2026')}${blocChiffres()}</section></div>`
      + `<section><div class="entete filet"><h2>Position concurrentielle : indicateurs de substitution</h2></div><div class="grille deux">${K.indicateurs.map((i) => `<div class="cadre"><div class="entete"><h3>${esc(i.titre)}</h3><span class="nature">${esc(i.nature)}</span></div>${barres(i.rows.map((r) => ({ lib: r[0], v: r[1], k: !!r[3], tip: `Source : ${K.sources[r[2]][0]}, ${K.sources[r[2]][2]}` })), i.unite)}<p class="note">${esc(i.note)}</p><div class="bas">${st(i.st)}${srcs(i.rows.map((r) => r[2]))}</div></div>`).join('')}</div>${fait('Classement SIPRI', `<p>${esc(K.top100.txt)}</p>`, K.top100.src)}</section>`
      + `<section><div class="entete filet"><h2>Base installée et pays clients</h2></div><p class="note">${esc(K.baseInstallee.note)}</p><div class="scroll"><table class="large"><thead><tr><th>Produit</th><th>Industriel</th><th>Pays clients</th><th>Commentaire</th><th>Statut</th></tr></thead><tbody>${K.baseInstallee.rows.map((r) => `<tr${/KNDS/.test(r[1]) ? ' class="knds-col"' : ''}><th scope="row">${esc(r[0])}</th><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td>${st(r[4])}</td></tr>`).join('')}</tbody></table></div>${srcs(K.baseInstallee.src)}</section>`
      + '<section><div class="entete filet"><h2>Programmes d\'acquisition suivis</h2></div><div id="mk-filtres"></div><div id="mk-carte"></div><div id="mk-table"></div></section>'
      + `<section class="cadre">${fait('Exportations d\'armement de la France', liste(K.exportFr.faits), K.exportFr.src)}${analyse('Lecture', `<p>${esc(K.exportFr.analyse)}</p>`)}</section>`;
    peindreMarches();
  }

  function peindreMarches() {
    if (!$('#mk-table')) return;
    const m = S.marches;
    const l = K.programmes.filter((g) => (!m.op || g.op === m.op) && (!m.f || g.f === m.f));
    $('#mk-filtres').innerHTML = `<div class="barre">${onglets('mop', [['', 'Tous'], ['O', 'Opportunités'], ['M', 'Menaces'], ['S', 'À surveiller'], ['F', 'Marchés fermés']], m.op, 'Lecture du programme')}${select('mk-f', 'Famille', [['', 'Toutes'], ...FAMS.map((k) => [k, FAM[k].n])], m.f)}</div>`;
    const RANG = { M: 4, O: 3, S: 2, F: 1 };
    const parPays = {};
    l.forEach((g) => { (parPays[g.pays] = parPays[g.pays] || []).push(g); });
    const classes = {}, tips = {};
    Object.entries(parPays).forEach(([c, gs]) => {
      const t = gs.slice().sort((a, b) => RANG[b.op] - RANG[a.op])[0];
      classes[c] = 'o-' + t.op;
      tips[c] = [pays(c), gs.map((g) => `${K.opLabels[g.op]} : ${g.prog}`).join('\n')];
    });
    $('#mk-carte').innerHTML = `<figure class="carte colonne-s">${carte(classes, tips, { label: 'Programmes d\'acquisition suivis, par pays' })}<figcaption class="legende">${Object.entries(K.opLabels).map(([k, v]) => `<span class="op op-${k}">${esc(v)}</span>`).join('')}</figcaption><p class="note">Couleur d'un pays : la lecture la plus critique parmi ses programmes (menace, puis opportunité, à surveiller, marché fermé).</p></figure>`;
    $('#mk-table').innerHTML = l.length ? `<div class="scroll"><table class="tres-large"><thead><tr><th>Pays</th><th>Programme</th><th>Famille</th><th>Besoin</th><th>Statut au ${esc(K.arrete)}</th><th>Acteurs en présence</th><th>Lecture</th><th>Sources</th></tr></thead><tbody>${l.map((g) => `<tr><th scope="row">${isoC(g.pays)} ${esc(pays(g.pays))}</th><td>${esc(g.prog)}</td><td>${esc(FAM[g.f].court)}</td><td>${esc(g.besoin)}</td><td>${esc(g.statut)}</td><td>${esc(g.acteurs)}</td><td><span class="op op-${g.op}">${esc(K.opLabels[g.op])}</span><p class="note">${esc(g.comm)}</p></td><td>${srcs(g.src)}</td></tr>`).join('')}</tbody></table></div>` : vide('Aucun programme pour ces filtres.');
  }

  /* ═══════════ Module 6 : veille technologique ═══════════ */
  function vVeille(el) {
    el.innerHTML = tete('Module 6 · Veille technologique et innovation', 'Les technologies qui peuvent déplacer les positions', `${K.techno.length} thématiques suivies. Pour chacune : l'état de l'art observé et la position de KNDS (faits), les concurrents les plus avancés, puis le risque de rupture ou de substitution (analyse). Maturité, impact et position sont des cotations de l'auteur.`)
      + `<section class="cadre"><div class="entete"><h2>Matrice maturité et impact</h2><div class="legende">${Object.entries(K.posLabels).map(([k, v]) => `<span class="chip-t pos-${k}">KNDS ${esc(v.toLowerCase())}</span>`).join('')}</div></div>${matrice5()}</section>`
      + '<section><div class="entete filet"><h2>Fiches thématiques</h2></div><div id="vt-f"></div><div class="grille deux" id="vt-cartes"></div></section>';
    peindreVeille();
  }
  function matrice5() {
    let h = '<div class="scroll"><div class="mat5">';
    for (let imp = 5; imp >= 1; imp -= 1) {
      h += `<div class="ax">${imp === 5 ? 'Impact<br>' : ''}${imp}</div>`;
      for (let m = 1; m <= 5; m += 1) {
        const ts = K.techno.filter((t) => t.impact === imp && t.maturite === m);
        h += `<div class="cel${imp >= 4 ? ' chaud' : ''}">${ts.map((t) => `<button type="button" class="chip-t pos-${t.pos}" data-vt="${t.id}" title="${esc('Position de KNDS : ' + K.posLabels[t.pos])}">${esc(t.n)}</button>`).join('')}</div>`;
      }
    }
    h += `<div class="ax"></div>${[1, 2, 3, 4, 5].map((m) => `<div class="ax">${m === 3 ? 'Maturité ' : ''}${m}</div>`).join('')}</div></div><p class="note">Axe vertical : impact potentiel sur le portefeuille KNDS (1 faible, 5 majeur). Axe horizontal : maturité de la technologie (1 émergente, 5 généralisée). Zone teintée : impact fort. Le symbole indique la position de KNDS.</p>`;
    return h;
  }
  function peindreVeille() {
    if (!$('#vt-cartes')) return;
    const pos = S.veille.pos;
    $('#vt-f').innerHTML = onglets('vpos', [['', 'Toutes'], ['A', 'KNDS en avance'], ['N', 'KNDS à niveau'], ['R', 'KNDS en retard']], pos, 'Position de KNDS');
    const l = K.techno.filter((t) => !pos || t.pos === pos).sort((a, b) => b.impact - a.impact || b.maturite - a.maturite);
    $('#vt-cartes').innerHTML = l.map((t) => `<article class="cadre" id="vt-${t.id}" tabindex="-1"><div class="entete"><h3>${esc(t.n)}</h3><span class="chip-t pos-${t.pos}">KNDS ${esc(K.posLabels[t.pos].toLowerCase())}</span></div><div class="cotes"><span>Maturité ${t.maturite}/5</span><span>Impact ${t.impact}/5</span><span>Menace de substitution : ${esc(t.menace.toLowerCase())}</span></div>${fait('État de l\'art', `<p>${esc(t.etat)}</p>`)}${fait('Position de KNDS', `<p>${esc(t.knds)}</p>`)}${fait('Concurrents les plus avancés', `<p>${esc(t.conc)}</p>`)}${analyse('Rupture possible', `<p>${esc(t.rupture)}</p>`)}${srcs(t.src)}</article>`).join('') || vide('Aucune thématique.');
  }

  /* ═══════════ Module 7 : environnement stratégique ═══════════ */
  function vEnvironnement(el) {
    const n = { '+': 0, '-': 0, '~': 0 };
    K.geo.forEach((g) => { n[g.sens] += 1; });
    el.innerHTML = tete('Module 7 · Environnement stratégique et géopolitique', 'Ce qui décide du marché, hors de l\'entreprise', `${K.geo.length} facteurs externes qui pèsent directement sur les décisions commerciales et industrielles de KNDS France, puis l'actionnariat et la gouvernance du groupe.`)
      + `<div class="kpis">${kpi(n['+'], 'facteurs favorables')}${kpi(n['~'], 'facteurs ambivalents')}${kpi(n['-'], 'facteurs défavorables')}</div>`
      + '<div id="ge-f"></div><div class="grille deux" id="ge-cartes"></div>'
      + `<section><div class="entete filet"><h2>Actionnariat et gouvernance de KNDS Group</h2></div>${gouvernance()}</section>`;
    peindreGeo();
  }
  function peindreGeo() {
    if (!$('#ge-cartes')) return;
    $('#ge-f').innerHTML = onglets('gsens', [['', 'Tous les facteurs'], ['+', 'Favorables'], ['~', 'Ambivalents'], ['-', 'Défavorables']], S.geo, 'Effet sur KNDS');
    $('#ge-cartes').innerHTML = K.geo.filter((g) => !S.geo || g.sens === S.geo).map((g) => `<article class="cadre"><div class="entete"><h3>${esc(g.n)}</h3><span class="sens sens-${SENS[g.sens][1]}">${esc(SENS[g.sens][0])}</span></div>${fait('Faits', liste(g.faits), g.src)}${analyse('Analyse', `<p>${esc(g.analyse)}</p><p><b>Effet sur KNDS :</b> ${esc(g.impact)}</p>`)}</article>`).join('');
  }
  function gouvernance() {
    const g = K.gouvernance;
    const cls = { fr: 's1', fam: 's2', de: 's3', flot: 'neutre' };
    return `<div class="grille deux"><div class="cadre"><h3>Répartition du capital</h3>${g.structures.map((s) => `<div class="struct"><div class="entete"><h4>${esc(s.n)}</h4>${st(s.st)}</div><div class="seg" role="img" aria-label="${esc(s.parts.map((p) => `${p[0]} ${p[1]} %`).join(', '))}">${s.parts.map((p) => `<i class="${cls[p[2]]}" style="width:${p[1]}%" data-tip-t="${esc(p[0])}" data-tip="${p[1]} % du capital">${p[1]} %</i>`).join('')}</div></div>`).join('')}<div class="legende"><span><i class="s1"></i>État français (GIAT Industries)</span><span><i class="s2"></i>Famille Bode-Wegmann</span><span><i class="s3"></i>État allemand (KfW)</span><span><i class="neutre"></i>Flottant</span></div></div>
      <div class="cadre"><h3>Chronologie</h3><ol class="chrono">${g.chrono.map((c) => `<li><time>${esc(c[0])}</time><div>${esc(c[1])} ${st(c[2])}</div></li>`).join('')}</ol></div></div>
      ${fait('Faits', liste(g.faits), g.src)}${analyse('Analyse', liste(g.analyse))}`;
  }

  /* ═══════════ Module 8 : SWOT et recommandations ═══════════ */
  function vSwot(el) {
    el.innerHTML = tete('Module 8 · SWOT et recommandations', 'Du diagnostic à la décision', 'Une analyse SWOT par famille de produits. Chaque opportunité et chaque menace porte un identifiant repris par les recommandations, qui restent ainsi reliées aux faits qui les justifient.')
      + '<div id="sw-f"></div><div id="sw-corps" class="colonne"></div>'
      + '<section><div class="entete filet"><h2>Toutes les recommandations</h2></div><div id="sw-dest"></div><div id="sw-toutes"></div></section>';
    peindreSwot();
  }
  const listeOM = (l) => `<ul class="liste">${l.map(([id, t]) => `<li><span class="ref">${esc(id)}</span> ${esc(t)}</li>`).join('')}</ul>`;
  const carteReco = (r) => `<article class="cadre reco"><span class="id">${esc(r.id)}</span><div class="corps"><h3>${esc(r.t)}</h3><div class="liens"><span class="puce">${esc(r.dest)}</span>${prio(r.prio)}<span class="puce">${esc(FAM[r.f].n)}</span></div>${analyse('Action proposée', `<p>${esc(r.action)}</p>`)}${fait('Justification documentée', `<p>${esc(r.just)}</p><p class="note">Répond à : ${r.liens.map(refOM).join(' ')}</p>`, r.src)}</div></article>`;
  function peindreSwot() {
    if (!$('#sw-corps')) return;
    const f = S.swot.f, s = K.swot[f];
    $('#sw-f').innerHTML = onglets('sfam', FAMS.map((k) => [k, FAM[k].n]), f, 'Famille de produits');
    const ids = new Set([...s.O, ...s.M].map((x) => x[0]));
    const recos = K.recos.filter((r) => r.f === f || r.liens.some((l) => ids.has(l))).sort((a, b) => a.prio - b.prio || ord(a.id, b.id));
    $('#sw-corps').innerHTML = `<div class="swot"><div><h3 class="q"><span>F</span>Forces</h3>${liste(s.S)}</div><div><h3 class="q"><span>f</span>Faiblesses</h3>${liste(s.W)}</div><div><h3 class="q"><span>O</span>Opportunités</h3>${listeOM(s.O)}</div><div><h3 class="q q-m"><span>M</span>Menaces</h3>${listeOM(s.M)}</div></div>
      <section class="colonne">${entete(`Recommandations liées : ${FAM[f].n.toLowerCase()}`, `${recos.length}`)}${recos.length ? recos.map(carteReco).join('') : vide('Aucune recommandation spécifique ; voir la liste complète ci-dessous.')}</section>`;
    const d = S.swot.dest;
    const dests = [...new Set(K.recos.map((r) => r.dest))].sort(ord);
    $('#sw-dest').innerHTML = onglets('sdest', [['', 'Tous les destinataires'], ...dests.map((x) => [x, x])], d, 'Destinataire');
    const toutes = K.recos.filter((r) => !d || r.dest === d).sort((a, b) => a.prio - b.prio || ord(a.id, b.id));
    $('#sw-toutes').innerHTML = `<div class="scroll"><table class="large"><thead><tr><th>Réf.</th><th>Recommandation</th><th>Famille</th><th>Destinataire</th><th>Priorité</th><th>Liée à</th></tr></thead><tbody>${toutes.map((r) => `<tr><th scope="row">${esc(r.id)}</th><td>${esc(r.t)}</td><td>${esc(FAM[r.f].court)}</td><td>${esc(r.dest)}</td><td>${prio(r.prio)}</td><td>${r.liens.map(refOM).join(' ')}</td></tr>`).join('')}</tbody></table></div>`;
  }

  /* ═══════════ Méthode et sources ═══════════ */
  const REGLES = [
    'Aucune donnée commerciale non publique n\'est utilisée ni estimée. Les montants viennent de communiqués, de documents budgétaires ou de la presse ; leur statut l\'indique.',
    'Une valeur de contrat n\'est jamais présentée comme un prix d\'équipement. Le ratio de valeur par unité n\'est calculé que lorsque le périmètre le permet ; sinon la raison est affichée.',
    'Les parts de marché ne sont pas inventées : faute de données comparables, la plateforme emploie des indicateurs de substitution dont la nature est affichée (valeur, volume, carnet, livraisons).',
    'Les notes du benchmark multicritère sont des appréciations de l\'auteur ; aucune note n\'est attribuée quand l\'information manque, et aucun classement n\'est établi sur un score partiel.',
    'Les conversions monétaires utilisent des taux indicatifs constants (1 $ = 0,88 €, 1 £ = 1,17 €, 1 CZK = 0,04 €, 1 SEK = 0,09 €), sans correction de l\'inflation.',
    'Une source de fiabilité C signale une information de presse non recoupée : elle est affichée comme telle et n\'appuie jamais seule une recommandation.',
    'Photographies : les fichiers de Wikimedia Commons n\'ont pas pu être intégrés à la page (téléchargement refusé par la politique anti-robots de Wikimedia lors de la préparation, images externes bloquées par l\'hébergement). Chaque fiche renvoie vers une photographie authentique, repérée par son titre et non vérifiée visuellement ; les pictogrammes au trait ne représentent pas le matériel exact.',
    'Étude indépendante en sources ouvertes, sans accès à des informations internes de KNDS ni lien avec l\'entreprise.'
  ];
  const STATUTS_DEF = { C: 'Établi par une source primaire ou par plusieurs sources concordantes.', A: 'Déclaré par un industriel ou un État, pas encore réalisé : commande annoncée, livraison prévue.', E: 'Ordre de grandeur reconstitué, ou chiffre de presse non confirmé officiellement.', H: 'Scénario ou interprétation de l\'auteur, à confirmer.' };

  function vMethode(el) {
    const util = {};
    [...K.produits, ...K.rivaux].forEach((p) => { if (p.ph) (util[p.ph] = util[p.ph] || []).push(p); });
    el.innerHTML = tete('Méthode et sources', 'Fiabilité documentaire', `Chaque information importante porte sa source, sa date, son niveau de fiabilité et son statut. Les faits (■) sont séparés des analyses (◆). Données arrêtées au ${K.arrete}.`)
      + `<div class="grille deux"><section class="cadre"><h2>Statut de l'information</h2><dl class="specs">${Object.entries(K.statuts).map(([k, v]) => `<dt>${st(k)}</dt><dd>${esc(STATUTS_DEF[k])}</dd>`).join('')}</dl><p class="note">Statut porté par une donnée (un client, un montant, une date).</p></section>
          <section class="cadre"><h2>Fiabilité de la source</h2><dl class="specs">${Object.entries(FIAB).map(([k, v]) => `<dt><span class="fiab fiab-${k}">${k}</span></dt><dd>${esc(v.charAt(0).toUpperCase() + v.slice(1))}</dd>`).join('')}</dl><p class="note">Fiabilité portée par la source elle-même, indiquée sur chaque pastille de source.</p></section></div>`
      + `<section class="cadre"><h2>Règles appliquées</h2>${liste(REGLES)}</section>`
      + `<section><div class="entete filet"><h2>Registre des sources</h2><span class="note" id="ms-n"></span></div><div class="barre filtres"><label class="champ" for="ms-q"><span>Recherche</span><input type="search" id="ms-q" value="${esc(S.meth.q)}" placeholder="Émetteur, titre, date…" autocomplete="off"></label>${select('ms-type', 'Type', [['', 'Tous'], ...Object.entries(TYPES_SRC)], S.meth.type)}${select('ms-fiab', 'Fiabilité', [['', 'Toutes'], ...Object.keys(FIAB).map((k) => [k, k + ' · ' + FIAB[k]])], S.meth.fiab)}</div><div id="ms-table"></div></section>`
      + `<section class="cadre"><h2>Photographies de référence</h2><p class="note">${Object.keys(util).length} photographies authentiques sous licence libre, à consulter sur Wikimedia Commons.</p><ul class="items">${Object.entries(K.photos).filter(([k]) => util[k]).map(([k, ph]) => `<li><strong>${util[k].map((p) => esc(p.n)).join(', ')}</strong><a href="${esc(ph.u)}" target="_blank" rel="noopener noreferrer">${esc(ph.t)} ↗</a></li>`).join('')}</ul></section>`;
    peindreMethode();
  }
  function peindreMethode() {
    if (!$('#ms-table')) return;
    const m = S.meth, q = norm(m.q).trim();
    const l = Object.entries(K.sources).filter(([, s]) => (!m.type || s[3] === m.type) && (!m.fiab || s[4] === m.fiab) && (!q || norm(s.join(' ')).includes(q))).sort((a, b) => ord(a[1][0], b[1][0]));
    $('#ms-n').textContent = `${l.length} sur ${Object.keys(K.sources).length}`;
    $('#ms-table').innerHTML = l.length ? `<div class="scroll"><table class="tres-large"><thead><tr><th>Émetteur</th><th>Intitulé</th><th>Date</th><th>Type</th><th>Fiabilité</th><th class="n">Citations</th><th>Lien</th></tr></thead><tbody>${l.map(([id, s]) => `<tr><th scope="row">${esc(s[0])}</th><td>${esc(s[1])}</td><td class="num">${esc(s[2])}</td><td>${esc(TYPES_SRC[s[3]])}</td><td><span class="fiab fiab-${s[4]}">${esc(s[4])}</span></td><td class="n">${CIT[id] || 0}</td><td>${s[5] ? `<a href="${esc(s[5])}" target="_blank" rel="noopener noreferrer">Ouvrir ↗</a>` : '<span class="note">—</span>'}</td></tr>`).join('')}</tbody></table></div>` : vide('Aucune source pour ces critères.');
  }

  /* ═══════════ Navigation ═══════════ */
  const VUES = { synthese: vSynthese, portefeuille: vPortefeuille, concurrence: vConcurrence, modeles: vModeles, benchmark: vBenchmark, marches: vMarches, veille: vVeille, environnement: vEnvironnement, swot: vSwot, methode: vMethode };
  function route() {
    const h = decodeURIComponent(location.hash.slice(1));
    const id = VUES[h] ? h : 'synthese';
    const change = id !== S.vue;
    S.vue = id;
    document.querySelectorAll('#nav a').forEach((a) => {
      if (a.getAttribute('href') === '#' + id) {
        a.setAttribute('aria-current', 'page');
        if (change && a.scrollIntoView) a.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      } else a.removeAttribute('aria-current');
    });
    fermerTiroir(true);
    masquerBulle();
    cacherTip();
    VUES[id](vue);
    majPlateau();
    if (change) window.scrollTo(0, 0);
  }
  function allerVers(spec) {
    const [v, a, b] = spec.split(':');
    if (v === 'benchmark' && a) S.bench.id = a;
    if (v === 'concurrence' && a) { S.conc.f = a; S.conc.t = ''; if (b) S.conc.ref = b; }
    if (v === 'swot' && a) S.swot.f = a;
    if (v === 'portefeuille' && a === 'pays') S.port = Object.assign(DEF.port(), { p: b });
    fermerTiroir(true);
    if (S.vue === v) { VUES[v](vue); majPlateau(); window.scrollTo(0, 0); } else location.hash = v;
  }

  const ONGLETS = {
    pfam: (v) => { S.port.f = v; peindrePort(); },
    ctype: (v) => { S.conc.t = v; peindreConc(); },
    cfam: (v) => { S.conc.f = v; S.conc.ref = ''; peindreConc(); },
    mpil: (v) => { S.mod.pil = v; peindreModeles(); },
    mfc: (v) => { S.mod.fc = v; peindreModeles(); },
    betude: (v) => { S.bench.id = v; peindreBench(); },
    mop: (v) => { S.marches.op = v; peindreMarches(); },
    vpos: (v) => { S.veille.pos = v; peindreVeille(); },
    gsens: (v) => { S.geo = v; peindreGeo(); },
    sfam: (v) => { S.swot.f = v; peindreSwot(); },
    sdest: (v) => { S.swot.dest = v; peindreSwot(); }
  };
  const refocus = (sel) => { const n = document.querySelector(sel); if (n) n.focus({ preventScroll: true }); };

  document.addEventListener('click', (e) => {
    const t = e.target;
    const s = t.closest('[data-src]');
    if (s) { e.preventDefault(); basculerBulle(s); return; }
    if (!bulle.hidden && !t.closest('.bulle')) masquerBulle();
    const b = t.closest('button, [data-pays-port]');
    if (!b) return;
    const d = b.dataset;
    if ('fermer' in d) { fermerTiroir(); return; }
    if ('retour' in d) { retour(); return; }
    if (d.fiche) { ouvrirFiche(d.fiche); return; }
    if (d.ind) { ouvrirInd(d.ind); return; }
    if (d.aller) { allerVers(d.aller); return; }
    if (d.paysPort) { allerVers('portefeuille:pays:' + d.paysPort); return; }
    if (d.cmpAjout) {
      if (basculerCmp(d.cmpAjout, true)) { b.textContent = 'Ajouté au comparateur du portefeuille'; b.disabled = true; } else { b.textContent = 'Comparateur plein (quatre produits)'; }
      return;
    }
    if ('cmpOuvrir' in d) { ouvrir(rendreComparaison, true); return; }
    if ('cmpVider' in d) { S.cmp = []; document.querySelectorAll('[data-cmp]').forEach((x) => { x.checked = false; }); majPlateau(); return; }
    if (d.raz) {
      if (d.raz === 'synth') { S.synth = DEF.synth(); vSynthese(vue); refocus('[data-raz="synth"]'); }
      if (d.raz === 'port') { S.port = DEF.port(); vPortefeuille(vue); refocus('[data-raz="port"]'); }
      return;
    }
    if ('plus' in d) { S.synth.tout = !S.synth.tout; peindreSynth(); refocus('[data-plus]'); return; }
    if (d.vt) {
      if (S.veille.pos) { S.veille.pos = ''; peindreVeille(); }
      const c = document.getElementById('vt-' + d.vt);
      if (c) { c.scrollIntoView({ behavior: reduit ? 'auto' : 'smooth', block: 'start' }); c.focus({ preventScroll: true }); }
      return;
    }
    if ('bpoidsRaz' in d) { S.bench.w = K.criteres.map((c) => c.w); ecrire('kbi-poids', S.bench.w); peindreBench(); refocus('[data-bpoids-raz]'); return; }
    for (const k of Object.keys(d)) {
      if (ONGLETS[k]) {
        const v = d[k], dans = !!b.closest('.onglets');
        ONGLETS[k](v);
        if (dans) refocus(`.onglets [data-${k}="${CSS.escape(v)}"]`);
        return;
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!bulle.hidden) { masquerBulle(); return; }
      if (!tiroir.hidden) fermerTiroir();
      return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('svg [data-pays-port]')) {
      e.preventDefault();
      allerVers('portefeuille:pays:' + e.target.dataset.paysPort);
    }
  });
  voile.addEventListener('click', () => fermerTiroir());

  const CHAMPS_FILTRES = { 'fs-f': ['synth', 'f'], 'fs-c': ['synth', 'c'], 'fs-p': ['synth', 'p'], 'fs-r': ['synth', 'r'], 'fs-per': ['synth', 'per'], 'fp-e': ['port', 'e'], 'fp-m': ['port', 'm'], 'fp-p': ['port', 'p'], 'cc-refsel': ['conc', 'ref'], 'mk-f': ['marches', 'f'], 'ms-type': ['meth', 'type'], 'ms-fiab': ['meth', 'fiab'] };
  const REPEINDRE = { synth: () => { S.synth.tout = false; peindreSynth(); }, port: peindrePort, conc: peindreConc, marches: peindreMarches, meth: peindreMethode };
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-cmp]')) { basculerCmp(t.dataset.cmp, t.checked, t); return; }
    if (t.matches('[data-bsel]')) {
      const b = etudeCourante(), sel = selection(b), id = t.dataset.bsel;
      if (t.checked && !sel.includes(id)) sel.splice(b.ids.indexOf(id), 0, id);
      if (!t.checked) sel.splice(sel.indexOf(id), 1);
      S.bench.sel[b.id] = b.ids.filter((x) => sel.includes(x));
      peindreBench();
      refocus(`[data-bsel="${CSS.escape(id)}"]`);
      return;
    }
    const c = CHAMPS_FILTRES[t.id];
    if (c) { S[c[0]][c[1]] = t.value; REPEINDRE[c[0]](); refocus('#' + t.id); }
  });
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'fp-q') { S.port.q = t.value; peindrePort(); return; }
    if (t.id === 'ms-q') { S.meth.q = t.value; peindreMethode(); return; }
    if (t.matches('[data-bpoids]')) {
      S.bench.w[Number(t.dataset.bpoids)] = Number(t.value);
      ecrire('kbi-poids', S.bench.w);
      const somme = S.bench.w.reduce((a, x) => a + x, 0);
      K.criteres.forEach((c, i) => { const o = document.getElementById('bw-o-' + c.id); if (o) o.textContent = `${Math.round(somme ? (S.bench.w[i] / somme) * 100 : 0)} %`; });
      const tb = $('#bm-table');
      if (tb) tb.innerHTML = tableNotes(psCourants());
    }
  });

  $('#rail-pied').textContent = `Données arrêtées au ${K.arrete} · ${Object.keys(K.sources).length} sources référencées · ${K.produits.length} produits KNDS · ${K.rivaux.length} produits concurrents.`;
  window.addEventListener('hashchange', route);
  route();
})();
