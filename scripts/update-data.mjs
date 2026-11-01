#!/usr/bin/env node
/**
 * update-data : rafraîchit les données des pays à partir de sources officielles.
 *
 *   npm run update-data                      # tous les pays, toutes les sources
 *   npm run update-data -- --pays=france     # un seul pays
 *   npm run update-data -- --dry-run         # affiche les changements sans écrire
 *
 * Sources : Eurostat (API de diffusion, JSON-stat), FMI (DataMapper, y compris
 * prévisions), Banque mondiale. Pour chaque valeur mise à jour, le script
 * écrit la valeur, l'unité, la période, la source, l'URL, la date du jour et
 * le statut « officiel ». Une valeur qui ne peut pas être récupérée n'est PAS
 * modifiée : la valeur sourcée à la main est conservée et l'échec est signalé.
 *
 * Les données politiques (sièges, sondages, gouvernement) et les budgets
 * nationaux détaillés ne sont pas couverts par ces API : ils restent à mettre
 * à jour à la main dans countries/<pays>.json (voir README).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { serieTemporelle, derniere, urlEurostat, serieFMI, serieBanqueMondiale } from './lib/jsonstat.mjs';

const PAYS = {
  france: { geo: 'FR', iso3: 'FRA', iso2: 'FR' },
  allemagne: { geo: 'DE', iso3: 'DEU', iso2: 'DE' },
};

const args = process.argv.slice(2);
const option = (nom) => args.find((a) => a.startsWith(`--${nom}=`))?.split('=')[1];
const paysDemandes = (option('pays') ?? Object.keys(PAYS).join(',')).split(',');
const simulation = args.includes('--dry-run');
const aujourdhui = new Date().toISOString().slice(0, 10);

/** Requête JSON avec délai d'expiration. */
async function lireJSON(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/** Écrit une valeur à un chemin « a.b.c » d'un objet. */
function ecrire(obj, chemin, valeur) {
  const morceaux = chemin.split('.');
  let o = obj;
  for (const m of morceaux.slice(0, -1)) o = o[m] ??= {};
  const ancien = o[morceaux.at(-1)];
  o[morceaux.at(-1)] = { ...(typeof ancien === 'object' && ancien ? { note: ancien.note } : {}), ...valeur };
  return ancien;
}

/** Tâches de mise à jour pour un pays. */
function taches(p) {
  const e = (jeu, filtres) => ({ type: 'eurostat', url: urlEurostat(jeu, filtres), jeu });
  return [
    { chemin: 'finances_publiques.deficit_pct_pib', ...e('gov_10dd_edpt1', { geo: p.geo, unit: 'PC_GDP', sector: 'S13', na_item: 'B9' }), transformer: (v) => -v, unite: '% PIB', source: 'Eurostat, notification des déficits et dettes (gov_10dd_edpt1)' },
    { chemin: 'finances_publiques.dette_pct_pib', ...e('gov_10dd_edpt1', { geo: p.geo, unit: 'PC_GDP', sector: 'S13', na_item: 'GD' }), unite: '% PIB', source: 'Eurostat, notification des déficits et dettes (gov_10dd_edpt1)' },
    { chemin: 'finances_publiques.dette_md', ...e('gov_10dd_edpt1', { geo: p.geo, unit: 'MIO_EUR', sector: 'S13', na_item: 'GD' }), transformer: (v) => Math.round(v / 100) / 10, unite: 'Md€', source: 'Eurostat (gov_10dd_edpt1)' },
    { chemin: 'finances_publiques.depenses_pct_pib', ...e('gov_10a_main', { geo: p.geo, unit: 'PC_GDP', sector: 'S13', na_item: 'TE' }), unite: '% PIB', source: 'Eurostat, principaux agrégats des administrations publiques (gov_10a_main)' },
    { chemin: 'finances_publiques.recettes_pct_pib', ...e('gov_10a_main', { geo: p.geo, unit: 'PC_GDP', sector: 'S13', na_item: 'TR' }), unite: '% PIB', source: 'Eurostat (gov_10a_main)' },
    { chemin: 'macro.pib_nominal', ...e('nama_10_gdp', { geo: p.geo, unit: 'CP_MEUR', na_item: 'B1GQ' }), transformer: (v) => Math.round(v / 100) / 10, unite: 'Md€', source: 'Eurostat, comptes nationaux annuels (nama_10_gdp)' },
    { chemin: 'macro.inflation_ipch', ...e('prc_hicp_manr', { geo: p.geo, unit: 'RCH_A', coicop: 'CP00' }), unite: '% a/a', source: 'Eurostat, IPCH (prc_hicp_manr)' },
    { chemin: 'macro.chomage_eurostat', ...e('une_rt_m', { geo: p.geo, unit: 'PC_ACT', s_adj: 'SA', age: 'TOTAL', sex: 'T' }), unite: '% population active', source: 'Eurostat, chômage mensuel au sens du BIT (une_rt_m)' },
    { chemin: 'macro.taux_10_ans_eurostat', ...e('irt_lt_mcby_m', { geo: p.geo, int_rt: 'MCBY' }), unite: '%', source: 'Eurostat, taux à long terme du critère de Maastricht (irt_lt_mcby_m)' },
    { chemin: 'recherche_climat.dird_pct_pib', ...e('rd_e_gerdtot', { geo: p.geo, unit: 'PC_GDP', sectperf: 'TOTAL' }), unite: '% PIB', source: 'Eurostat, dépense intérieure de R&D (rd_e_gerdtot)' },
    // Dépenses par fonction (COFOG) : % du PIB, y compris la charge d'intérêts (GF0107) pour isoler GF01 hors intérêts
    ...['GF01', 'GF0107', 'GF02', 'GF03', 'GF04', 'GF05', 'GF06', 'GF07', 'GF08', 'GF09', 'GF10'].map((f) => ({
      chemin: `finances_publiques.depenses_par_fonction_cofog_eurostat.valeurs_pct_pib.${f}`, ...e('gov_10a_exp', { geo: p.geo, unit: 'PC_GDP', sector: 'S13', na_item: 'TE', cofog99: f }),
      unite: '% PIB', source: 'Eurostat, dépenses des administrations publiques par fonction (gov_10a_exp)', simple: true,
    })),
    // FMI : prévisions (Perspectives de l'économie mondiale)
    ...[['NGDP_RPCH', 'macro.prevision_fmi_croissance', '%'], ['PCPIPCH', 'macro.prevision_fmi_inflation', '%'], ['GGXWDG_NGDP', 'finances_publiques.prevision_fmi_dette', '% PIB'], ['GGXCNL_NGDP', 'finances_publiques.prevision_fmi_solde', '% PIB']].map(([ind, chemin, unite]) => ({
      chemin, type: 'fmi', url: `https://www.imf.org/external/datamapper/api/v1/${ind}/${p.iso3}`, indicateur: ind, unite, source: `FMI, DataMapper (${ind})`, serieComplete: true,
    })),
    { chemin: 'recherche_climat.dird_pct_pib_banque_mondiale', type: 'bm', url: `https://api.worldbank.org/v2/country/${p.iso2}/indicator/GB.XPD.RSDV.GD.ZS?format=json&mrv=5`, unite: '% PIB', source: 'Banque mondiale (GB.XPD.RSDV.GD.ZS)' },
  ];
}

async function executer(t, p) {
  const js = await lireJSON(t.url);
  if (t.type === 'eurostat') return serieTemporelle(js);
  if (t.type === 'fmi') return serieFMI(js, t.indicateur, p.iso3);
  return serieBanqueMondiale(js);
}

async function mettreAJour(nomPays) {
  const p = PAYS[nomPays];
  if (!p) { console.error(`Pays inconnu : ${nomPays}`); return { ok: 0, echecs: 1 }; }
  const fichier = new URL(`../countries/${nomPays}.json`, import.meta.url);
  const donnees = JSON.parse(await readFile(fichier, 'utf8'));
  let ok = 0;
  const echecs = [];
  for (const t of taches(p)) {
    try {
      const serie = await executer(t, p);
      if (!serie.length) throw new Error('série vide');
      if (t.serieComplete) {
        const annee = new Date().getFullYear();
        const valeurs = Object.fromEntries(serie.filter((x) => Number(x.periode) >= annee - 2 && Number(x.periode) <= annee + 4).map((x) => [x.periode, x.valeur]));
        if (!simulation) ecrire(donnees, t.chemin, { valeur: valeurs, unite: t.unite, periode: Object.keys(valeurs).join('-'), source: t.source, url: t.url, date: aujourdhui, statut: 'prevision_officielle' });
        console.log(`  ✓ ${t.chemin} = ${JSON.stringify(valeurs)}`);
      } else {
        const d = derniere(serie);
        const valeur = Math.round((t.transformer ? t.transformer(d.valeur) : d.valeur) * 100) / 100;
        if (t.simple) { if (!simulation) ecrireSimple(donnees, t.chemin, valeur); }
        else if (!simulation) ecrire(donnees, t.chemin, { valeur, unite: t.unite, periode: d.periode, source: t.source, url: t.url, date: aujourdhui, statut: 'officiel' });
        console.log(`  ✓ ${t.chemin} = ${valeur} (${d.periode})`);
      }
      ok++;
    } catch (err) {
      echecs.push({ chemin: t.chemin, erreur: String(err.message ?? err) });
      console.log(`  ✗ ${t.chemin} : ${err.message ?? err} — valeur existante conservée`);
    }
  }
  const cofog = donnees.finances_publiques?.depenses_par_fonction_cofog_eurostat;
  if (cofog && !simulation) Object.assign(cofog, { source: 'Eurostat (gov_10a_exp)', url: urlEurostat('gov_10a_exp', { geo: p.geo }), date: aujourdhui, statut: 'officiel', unite: '% PIB' });
  if (!simulation && ok > 0) {
    donnees.meta.derniere_mise_a_jour = aujourdhui;
    (donnees.meta.historique_mises_a_jour ??= []).push({ date: aujourdhui, script: 'update-data', reussites: ok, echecs: echecs.length });
    await writeFile(fichier, JSON.stringify(donnees, null, 2) + '\n');
  }
  return { ok, echecs };
}

function ecrireSimple(obj, chemin, valeur) {
  const morceaux = chemin.split('.');
  let o = obj;
  for (const m of morceaux.slice(0, -1)) o = o[m] ??= {};
  o[morceaux.at(-1)] = valeur;
}

let total = 0, totalEchecs = 0;
for (const nom of paysDemandes) {
  console.log(`\n${nom}${simulation ? ' (simulation, rien n\'est écrit)' : ''}`);
  const r = await mettreAJour(nom);
  total += r.ok;
  totalEchecs += r.echecs.length ?? r.echecs;
}
console.log(`\n${total} valeur(s) mise(s) à jour, ${totalEchecs} échec(s).`);
if (totalEchecs && !total) {
  console.log('Aucune source n\'a répondu : vérifiez votre connexion (ou, dans un environnement isolé, autorisez ec.europa.eu, www.imf.org et api.worldbank.org).');
  process.exitCode = 1;
}
