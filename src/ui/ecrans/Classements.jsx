import React, { useMemo } from 'react';
import Info from '../composants/Info.jsx';
import { classementsTries } from '../../engine/index.js';
import { nombre } from '../format.js';

const rangTexte = (r) => (r === 1 ? '1er' : `${r}e`);

/** Variation de rang depuis le départ (↑ = gagne des places). */
function Mouvement({ depart, actuel }) {
  if (!depart || !actuel || depart === actuel) return <span className="muet tres-petit">=</span>;
  const gain = depart - actuel;
  return <span className={`tres-petit ${gain > 0 ? 'positif' : 'negatif'}`} title={`${rangTexte(depart)} au départ`}>{gain > 0 ? '▲' : '▼'} {Math.abs(gain)}</span>;
}

/**
 * Classement en barres horizontales. Le pays joué est mis en avant (couleur
 * d'accent), les autres restent neutres. `valeur` renvoie le nombre affiché,
 * `etendue` [min, max] fixe l'échelle (0 inclus).
 */
function Barres({ liste, joue, valeur, format, rangsDepart, etendue, reference, limite }) {
  const [min, max] = etendue;
  const largeur = max - min || 1;
  const x = (v) => ((v - min) / largeur) * 100;
  const zero = x(0);
  const visibles = limite ? liste.slice(0, limite) : liste;
  const indexJoue = liste.findIndex((p) => p.id === joue);
  const lignes = visibles.map((p, i) => ({ p, rang: i + 1 }));
  if (limite && indexJoue >= limite) lignes.push({ p: liste[indexJoue], rang: indexJoue + 1, separe: true });
  return (
    <table className="petit classement" role="table">
      <tbody>
        {lignes.map(({ p, rang, separe }) => {
          const v = valeur(p);
          const xv = Math.min(100, Math.max(0, x(v))); // valeurs hors échelle (pays en guerre) : barre pleine
          const g = Math.min(xv, zero), l = Math.abs(xv - zero);
          const estJoue = p.id === joue;
          return (
            <tr key={p.id} className={`${estJoue ? 'pays-joue' : ''} ${separe ? 'separe' : ''}`}>
              <td className="nombre" style={{ width: '2.5rem' }}>{rangTexte(rang)}</td>
              <td style={{ whiteSpace: 'nowrap' }}><span aria-hidden="true">{p.drapeau}</span> {estJoue ? <strong>{p.nom}</strong> : p.nom}</td>
              <td style={{ width: '45%' }}>
                <div className="barre-classement" aria-hidden="true">
                  <div style={{ left: `${g}%`, width: `${Math.max(0.6, l)}%`, background: estJoue ? 'var(--accent)' : 'var(--axe)' }} />
                  {min < 0 && <div className="axe-zero" style={{ left: `${zero}%` }} />}
                  {reference !== undefined && <div className="reference" style={{ left: `${x(reference)}%` }} />}
                </div>
              </td>
              <td className="nombre chiffres" style={{ whiteSpace: 'nowrap' }}>{format(v)}</td>
              <td className="nombre" style={{ width: '2.5rem' }}><Mouvement depart={rangsDepart?.[p.id]} actuel={rang} /></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Mini-courbe de la croissance annuelle d'un pays (échelle commune au tableau, zéro en pointillés). */
function Courbe({ valeurs, min, max, joue }) {
  const W = 96, H = 26, pad = 3;
  const pts = valeurs.map((v, i) => [valeurs.length > 1 ? pad + (i * (W - 2 * pad)) / (valeurs.length - 1) : W / 2, v]).filter(([, v]) => v !== null && v !== undefined);
  const y = (v) => H - pad - ((Math.min(max, Math.max(min, v)) - min) / (max - min || 1)) * (H - 2 * pad);
  const dernier = pts.at(-1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="courbe-croissance" aria-hidden="true">
      {min < 0 && max > 0 && <line x1="0" x2={W} y1={y(0)} y2={y(0)} className="courbe-zero" />}
      {pts.length > 1 && <polyline points={pts.map(([x, v]) => `${x},${y(v)}`).join(' ')} className={`courbe-ligne ${joue ? 'joue' : ''}`} />}
      {dernier && <circle cx={dernier[0]} cy={y(dernier[1])} r="2.6" className={`courbe-point ${joue ? 'joue' : ''}`} />}
    </svg>
  );
}

/**
 * Croissance annuelle des pays d'une liste : courbe depuis le début de la
 * partie, cinq dernières années, moyenne. Nominale (réelle + inflation).
 */
function Croissances({ liste, series, annees, joue }) {
  const recentes = annees.slice(-5);
  const valeursDe = (id) => series[id] ?? [];
  // Échelle propre à chaque pays (amplitude d'au moins 3 points) : la forme de la courbe reste lisible ;
  // les chiffres du tableau permettent la comparaison entre pays
  const echelle = (vals) => {
    if (!vals.length) return { min: 0, max: 1 };
    const lo = Math.min(...vals), hi = Math.max(...vals), mid = (lo + hi) / 2, demi = Math.max(1.5, (hi - lo) / 2);
    return { min: mid - demi, max: mid + demi };
  };
  const f = (v) => (v === null || v === undefined ? '—' : `${v > 0 ? '+' : ''}${nombre(v, 1)}`);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="petit tableau-croissance">
        <thead>
          <tr><th>Pays</th><th>Évolution</th>{recentes.map((a) => <th key={a} className="nombre">{a}</th>)}<th className="nombre">Moyenne</th></tr>
        </thead>
        <tbody>
          {liste.map((p) => {
            const v = valeursDe(p.id);
            const def = v.filter((x) => x !== null && x !== undefined);
            const moyenne = def.length ? def.reduce((a, b) => a + b, 0) / def.length : null;
            const estJoue = p.id === joue;
            return (
              <tr key={p.id} className={estJoue ? 'pays-joue' : ''}>
                <td style={{ whiteSpace: 'nowrap' }}><span aria-hidden="true">{p.drapeau}</span> {estJoue ? <strong>{p.nom}</strong> : p.nom}</td>
                <td><Courbe valeurs={v} {...echelle(def)} joue={estJoue} /></td>
                {recentes.map((a) => <td key={a} className="nombre chiffres">{f(v[annees.indexOf(a)])}</td>)}
                <td className="nombre chiffres"><strong>{f(moyenne)}</strong></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Classements internationaux : PIB mondial (top 10), PIB de la zone euro,
 * dette et déficit des 21 pays de l'euro. Le pays joué bouge selon vos
 * décisions ; les autres suivent leur trajectoire et les chocs mondiaux.
 */
export default function Classements({ partie }) {
  const c = partie.classements;
  const t = useMemo(() => (c ? classementsTries(partie) : null), [partie, c]);
  const departs = c?.rangsDepartParPays ?? {};
  if (!c || !t) return <div className="carte">Classements indisponibles pour cette partie (sauvegarde antérieure).</div>;
  const joue = c.joue;
  const r = c.dernier ?? c.depart;
  const d = c.depart;
  const dansEuro = c.euro.some((p) => p.id === joue);
  const nom = c.monde.find((p) => p.id === joue)?.nom ?? '';
  const maxDette = Math.max(...t.dette.map((p) => p.dette));
  const soldes = t.deficit.map((p) => p.solde);

  return (
    <div className="pile">
      <h2>Classements internationaux</h2>
      <p className="petit muet">
        {nom} bouge selon vos décisions (croissance, inflation, déficit, dette). Les autres pays suivent leur trajectoire de croissance et de solde public (hypothèses de jeu calées sur le FMI et la Commission européenne), avec les chocs mondiaux de la partie et leurs propres aléas. Données de départ : FMI (PIB 2025) et Eurostat (dette et déficit 2025), certaines estimées.
        <Info texte="Les PIB sont en dollars courants à taux de change constants (moyenne 2025) : en réalité, les variations de change (roupie, yen, livre, euro) déplacent fortement ces classements. Les pays de la zone euro partent des chiffres 2025, avancés d'un an pour représenter 2026." />
      </p>

      <div className="grille-tuiles">
        <div className="tuile"><span className="libelle">PIB mondial</span><span className="valeur chiffres">{r.monde ? rangTexte(r.monde) : '—'}</span><span className="variation">au départ : {d.monde ? rangTexte(d.monde) : '—'}</span></div>
        {dansEuro && <div className="tuile"><span className="libelle">PIB de la zone euro</span><span className="valeur chiffres">{rangTexte(r.pibEuro)}</span><span className="variation">au départ : {rangTexte(d.pibEuro)}</span></div>}
        {dansEuro && <div className="tuile"><span className="libelle">Dette (1er = la plus forte)</span><span className="valeur chiffres">{rangTexte(r.dette)} sur 21</span><span className="variation">au départ : {rangTexte(d.dette)}</span></div>}
        {dansEuro && <div className="tuile"><span className="libelle">Déficit (1er = le plus lourd)</span><span className="valeur chiffres">{rangTexte(r.deficit)} sur 21</span><span className="variation">au départ : {rangTexte(d.deficit)}</span></div>}
        {r.defense && <div className="tuile"><span className="libelle">Budget militaire</span><span className="valeur chiffres">{rangTexte(r.defense)}</span><span className="variation">au départ : {rangTexte(d.defense)}</span></div>}
      </div>

      <div className="grille-2">
        <div className="carte">
          <h3>PIB : les 10 premières économies mondiales</h3>
          <p className="tres-petit muet">En milliards de dollars courants (taux de change constants).</p>
          <Barres liste={t.monde} joue={joue} valeur={(p) => p.pib} format={(v) => `${nombre(v, 0)} Md$`} rangsDepart={departs.monde} etendue={[0, t.monde[0].pib]} limite={10} />
        </div>
        <div className="carte">
          <h3>PIB : zone euro</h3>
          <p className="tres-petit muet">En milliards d'euros courants.</p>
          <Barres liste={t.pibEuro} joue={joue} valeur={(p) => p.pib} format={(v) => `${nombre(v, 0)} Md€`} rangsDepart={departs.pibEuro} etendue={[0, t.pibEuro[0].pib]} limite={10} />
        </div>
      </div>

      {c.croissances && (() => {
        const cr = c.croissances;
        const top = t.monde.slice(0, 10);
        if (!top.some((p) => p.id === joue)) { const p = t.monde.find((x) => x.id === joue); if (p) top.push(p); }
        return (
          <div className="carte pile">
            <h3 style={{ margin: 0 }}>Croissance du PIB, en % par an <Info texte="Croissance nominale, c'est-à-dire réelle (volume) plus inflation, la seule que le jeu suit pour les autres pays. Les pays non joués suivent une trajectoire calée sur le FMI et la Commission européenne, frappée par les chocs mondiaux de la partie et par leurs propres aléas. Première année : hypothèse de départ ; ensuite, croissance constatée d'une fin d'année à l'autre." /></h3>
            <p className="petit muet" style={{ margin: 0 }}>Comment évolue l'environnement économique des autres pays, année après année. {nom} : croissance réelle de {nombre(partie.macro.croissanceAnnuelle, 1)} % sur un an, inflation de {nombre(partie.macro.inflation, 1)} %.</p>
            <div className="grille-2">
              <div>
                <h4 style={{ margin: '0 0 0.3rem' }}>Les 10 premières économies mondiales <span className="tres-petit muet">(en dollars)</span></h4>
                <Croissances liste={top} series={cr.monde} annees={cr.annees} joue={joue} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.3rem' }}>Zone euro <span className="tres-petit muet">(en euros, classés par PIB)</span></h4>
                <Croissances liste={t.pibEuro} series={cr.euro} annees={cr.annees} joue={joue} />
              </div>
            </div>
          </div>
        );
      })()}

      <div className="grille-2">
        <div className="carte">
          <h3>Dette publique des 21 pays de l'euro <Info texte="Dette au sens de Maastricht, en % du PIB. Le trait vertical marque la limite de 60 % du traité. Rang 1 = le pays le plus endetté." /></h3>
          <Barres liste={t.dette} joue={joue} valeur={(p) => p.dette} format={(v) => `${nombre(v, 1)} %`} rangsDepart={departs.dette} etendue={[0, Math.max(150, maxDette)]} reference={60} />
        </div>
        <div className="carte">
          <h3>Solde public des 21 pays de l'euro <Info texte="Solde public en % du PIB : négatif = déficit, positif = excédent. Le trait vertical marque la limite de −3 % du traité. Rang 1 = le déficit le plus lourd." /></h3>
          <Barres liste={t.deficit} joue={joue} valeur={(p) => p.solde} format={(v) => `${v > 0 ? '+' : ''}${nombre(v, 1)} %`} rangsDepart={departs.deficit} etendue={[Math.min(-6, ...soldes), Math.max(4, ...soldes)]} reference={-3} />
        </div>
      </div>

      {t.defense?.length > 0 && (
        <div className="grille-2">
          <div className="carte">
            <h3>Budgets militaires : les 10 premiers <Info texte="Dépenses militaires au sens du SIPRI (2025), en dollars courants : la définition est plus large que le budget du ministère des Armées. Votre pays suit votre budget de la défense ; les autres suivent une trajectoire inspirée de leurs annonces (OTAN : 3,5 % du PIB en 2035)." /></h3>
            <p className="tres-petit muet">En milliards de dollars courants.</p>
            <Barres liste={t.defense} joue={joue} valeur={(p) => p.montant} format={(v) => `${nombre(v, 0)} Md$`} rangsDepart={departs.defense} etendue={[0, t.defense[0].montant]} limite={10} />
          </div>
          <div className="carte">
            <h3>Effort de défense, en % du PIB <Info texte="Le trait vertical marque 3,5 % du PIB, l'objectif fixé par l'OTAN au sommet de La Haye (juin 2025) pour 2035. Ukraine, Israël et Russie, en guerre, dépassent largement l'échelle." /></h3>
            <p className="tres-petit muet">Mêmes pays, classés par effort.</p>
            <Barres liste={[...t.defense].sort((a, b) => b.part - a.part)} joue={joue} valeur={(p) => p.part} format={(v) => `${nombre(v, 1)} %`} etendue={[0, 8]} reference={3.5} />
          </div>
        </div>
      )}
    </div>
  );
}
