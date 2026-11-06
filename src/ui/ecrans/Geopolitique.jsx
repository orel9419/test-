import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Info from '../composants/Info.jsx';
import { resumeGeopolitique } from '../../engine/index.js';
import { GROUPE_AERONAVAL } from '../../data/geopolitique.js';
import { PARTENAIRES } from '../../data/diplomatie.js';
import { md } from '../format.js';

const Visionneuse3D = lazy(() => import('../3d/Visionneuse3D.jsx'));

/** Territoires français d'outre-mer (repères sur la carte). */
const OUTRE_MER = [
  ['Guyane', -53, 4], ['Antilles', -61.3, 15.5], ['Saint-Pierre-et-Miquelon', -56.3, 46.9], ['La Réunion', 55.5, -21.1], ['Mayotte', 45.2, -12.8],
  ['Nouvelle-Calédonie', 165.6, -21.3], ['Polynésie française', -149.5, -17.6], ['Wallis-et-Futuna', -176.2, -13.3], ['Terres australes', 69.5, -49.3],
];
const L = 960, H = 500;

const niveau = (t) => (t >= 65 ? { classe: 'critique', texte: 'forte' } : t >= 40 ? { classe: 'attention', texte: 'moyenne' } : { classe: 'bon', texte: 'faible' });

/** Carte du monde (Natural Earth) chargée à la demande, avec les théâtres et le groupe aéronaval. */
function CarteMonde({ theatres, position, destination, choisi, onChoisir }) {
  const [carte, setCarte] = useState(null);
  // Largeur affichée : sur un petit écran, les repères sont agrandis pour rester lisibles et faciles à toucher
  const [largeur, setLargeur] = useState(L);
  const svg = useRef(null);
  useEffect(() => {
    if (!svg.current || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([x]) => setLargeur(x.contentRect.width || L));
    ro.observe(svg.current);
    return () => ro.disconnect();
  }, [carte]);
  useEffect(() => {
    let annule = false;
    Promise.all([import('world-atlas/countries-110m.json'), import('topojson-client'), import('d3-geo')]).then(([topo, { feature }, d3]) => {
      if (annule) return;
      const donnees = topo.default ?? topo;
      const pays = feature(donnees, donnees.objects.countries).features;
      const proj = d3.geoNaturalEarth1().fitExtent([[6, 6], [L - 6, H - 6]], { type: 'Sphere' });
      const chemin = d3.geoPath(proj);
      setCarte({ pays: pays.map((f) => ({ id: f.id, d: chemin(f) })), sphere: chemin({ type: 'Sphere' }), proj, chemin });
    }).catch(() => setCarte(false));
    return () => { annule = true; };
  }, []);
  if (carte === false) return <p className="petit muet">Carte indisponible.</p>;
  if (!carte) return <div className="carte-monde attente">Chargement de la carte…</div>;
  const p = (lon, lat) => carte.proj([lon, lat]);
  const k = Math.min(3, Math.max(1, L / largeur / 1.4));
  const compacte = k > 1.6;
  const toulon = theatres.find((t) => t.id === 'toulon');
  const cible = theatres.find((t) => t.id === (destination ?? position));
  const route = cible && cible.id !== 'toulon' ? carte.chemin({ type: 'LineString', coordinates: [[toulon.lon, toulon.lat], [cible.lon, cible.lat]] }) : null;
  const [gx, gy] = p(...(() => { const t = theatres.find((x) => x.id === position); return [t.lon, t.lat]; })());
  return (
    <svg ref={svg} className={`carte-monde ${compacte ? 'compacte' : ''}`} viewBox={`0 0 ${L} ${H}`} role="img" aria-label="Carte du monde : théâtres d'opérations et position du groupe aéronaval">
      <path d={carte.sphere} className="carte-ocean" />
      {carte.pays.map((c) => <path key={c.id ?? c.d.slice(0, 20)} d={c.d} className={c.id === '250' ? 'carte-pays france' : 'carte-pays'} />)}
      {OUTRE_MER.map(([nom, lon, lat]) => { const [x, y] = p(lon, lat); return <circle key={nom} cx={x} cy={y} r={3 * k} className="carte-outre-mer"><title>{nom}</title></circle>; })}
      {route && <path d={route} className={`carte-route ${destination ? 'prevue' : ''}`} />}
      {theatres.filter((t) => !t.base).map((t) => {
        const [x, y] = p(t.lon, t.lat);
        const n = niveau(t.tensionActuelle);
        return (
          <g key={t.id} className={`carte-theatre ${n.classe} ${choisi === t.id ? 'choisi' : ''}`} transform={`translate(${x},${y})`} onClick={() => onChoisir(t.id)} role="button" tabIndex={0} aria-label={`${t.nom}, tension ${n.texte}`} onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && onChoisir(t.id)}>
            <circle r={(9 + t.tensionActuelle / 12) * k} className="halo" />
            <circle r={6 * k} className="point" />
            <text y={-14 * k} textAnchor="middle" style={{ fontSize: 13 * k }}>{t.court}</text>
          </g>
        );
      })}
      <g className="carte-gan" transform={`translate(${gx},${gy + (position === 'toulon' ? -2 : 18) * k}) scale(${k})`}>
        <rect x="-15" y="-9" width="30" height="18" rx="9" />
        <text textAnchor="middle" y="5">🚢</text>
      </g>
    </svg>
  );
}

/**
 * Géopolitique (France) : carte des théâtres, tensions, déploiement du groupe
 * aéronaval. Les crises arrivent dans l'onglet Événements.
 */
export default function Geopolitique({ partie, decisions, majDecisions, allerA }) {
  const r = resumeGeopolitique(partie);
  const [choisi, setChoisi] = useState(null);
  const [voir3d, setVoir3d] = useState(null); // 'charlesDeGaulle' | 'porteAvions' | null
  const theatres = r?.theatres ?? [];
  const selection = useMemo(() => theatres.find((t) => t.id === (choisi ?? r?.gan.position)), [theatres, choisi, r]);
  if (!r) return <div className="carte"><h2>Géopolitique</h2><p>Ce module est disponible pour la France.</p></div>;
  const g = r.gan;
  const destination = decisions.gan ?? null;
  const pa = g.porteAvions;
  const nomTheatre = (id) => theatres.find((t) => t.id === id)?.nom ?? id;
  const enMaintenance = g.maintenance > 0;
  const possible = (t) => t.id !== g.position && (t.base || (pa.disponible && !enMaintenance && g.potentiel >= t.usure));
  return (
    <div className="pile">
      <h2>Géopolitique et groupe aéronaval</h2>
      <p className="petit muet">La France est présente sur tous les océans : ses territoires d'outre-mer lui donnent le deuxième espace maritime du monde. Déployer le groupe aéronaval rassure les alliés, apaise les tensions et pèse dans les crises ; mais il s'use, coûte cher et ne peut être partout à la fois.</p>

      <div className="carte pile">
        <CarteMonde theatres={theatres} position={g.position} destination={destination} choisi={selection?.id} onChoisir={setChoisi} />
        <div className="ligne petit legende-carte">
          <span><span className="pastille-legende critique" /> tension forte</span>
          <span><span className="pastille-legende attention" /> moyenne</span>
          <span><span className="pastille-legende bon" /> faible</span>
          <span>🚢 groupe aéronaval</span>
          <span><span className="pastille-legende outre-mer" /> outre-mer français</span>
        </div>
      </div>

      <div className="grille-2">
        <div className="carte pile">
          <h3 style={{ margin: 0 }}>🚢 Groupe aéronaval {pa.nom ? `· porte-avions ${pa.nom}` : ''} <Info texte={GROUPE_AERONAVAL.pedagogie} /></h3>
          {!pa.disponible && <p className={`alerte petit ${pa.enService ? '' : 'critique'}`} style={{ margin: 0 }}>{pa.motif}</p>}
          <div className="ligne espace petit"><span>Position</span><strong>{nomTheatre(g.position)}</strong></div>
          <div className="petit">Potentiel (équipages, munitions, maintenance) : <strong>{Math.round(g.potentiel)} %</strong>
            <div className="jauge-potentiel"><div style={{ width: `${g.potentiel}%` }} className={g.potentiel < 30 ? 'bas' : ''} /></div>
          </div>
          <div className="ligne espace petit"><span>En mer depuis</span><strong>{g.trimestresEnMer} trimestre(s)</strong></div>
          {enMaintenance && <p className="petit alerte" style={{ margin: 0 }}>Entretien à Toulon : encore {g.maintenance} trimestre(s).</p>}
          {destination && <p className="petit alerte bonne" style={{ margin: 0 }}>Ordre donné : {destination === 'toulon' ? 'rentrer à Toulon' : `appareiller pour ${nomTheatre(destination)}`} (à la validation du trimestre). <button type="button" className="lien" onClick={() => majDecisions({ gan: null })}>Annuler</button></p>}
          <ul className="tres-petit muet" style={{ margin: 0, paddingLeft: '1rem' }}>{GROUPE_AERONAVAL.composition.map((c) => <li key={c}>{c}</li>)}</ul>
          <div className="ligne petit">
            {pa.nom !== 'France Libre' && <button type="button" className="lien" onClick={() => setVoir3d((v) => (v === 'charlesDeGaulle' ? null : 'charlesDeGaulle'))}>{voir3d === 'charlesDeGaulle' ? 'Masquer le modèle 3D' : 'Voir le Charles-de-Gaulle en 3D'}</button>}
            <button type="button" className="lien" onClick={() => setVoir3d((v) => (v === 'porteAvions' ? null : 'porteAvions'))}>{voir3d === 'porteAvions' ? 'Masquer le modèle 3D' : pa.nom === 'France Libre' ? 'Voir le porte-avions en 3D' : 'Voir son successeur, le « France Libre »'}</button>
          </div>
          {voir3d && <Suspense fallback={<p className="petit muet">Chargement…</p>}><Visionneuse3D key={voir3d} modele={voir3d} hauteur={280} /></Suspense>}
        </div>

        {selection && (
          <div className="carte pile">
            <h3 style={{ margin: 0 }}>{selection.nom}</h3>
            {!selection.base && (() => { const n = niveau(selection.tensionActuelle); return <div className="petit">Tension : <span className={`etiquette ${n.classe === 'critique' ? 'critique' : n.classe === 'bon' ? 'bonne' : ''}`}>{n.texte} ({Math.round(selection.tensionActuelle)}/100)</span></div>; })()}
            <p className="petit" style={{ margin: 0 }}>{selection.description}</p>
            {!selection.base && (
              <ul className="tres-petit" style={{ margin: 0, paddingLeft: '1rem' }}>
                <li>Coût : environ {md(selection.cout, 2)} par trimestre de présence ; usure : {selection.usure} points de potentiel par trimestre.</li>
                <li>Effets de la présence : influence +{selection.presence?.influence ?? 0} par trimestre{Object.keys(selection.presence?.relations ?? {}).length ? `, meilleures relations avec : ${Object.keys(selection.presence.relations).map((p) => PARTENAIRES[p] ?? p).join(', ')}` : ''} ; tension apaisée.</li>
                {selection.protegeCommerce && <li>Protège une route commerciale majeure : moins de risque sur le fret et l'énergie.</li>}
                {selection.protegeEnergie && <li>Sécurise une route du pétrole : effet sur les prix de l'énergie en cas de crise.</li>}
                {selection.bonusExport && <li>Escale chez un client potentiel du Rafale : meilleures chances à l'exportation.</li>}
              </ul>
            )}
            {selection.id === g.position
              ? <p className="petit muet" style={{ margin: 0 }}>{selection.base ? 'Le groupe aéronaval est à quai.' : 'Le groupe aéronaval est déjà sur place.'}</p>
              : <button type="button" className="bouton principal" disabled={!possible(selection)} onClick={() => majDecisions({ gan: selection.id })}>{selection.base ? 'Rentrer à Toulon' : `Envoyer le groupe aéronaval ici`}</button>}
            {!possible(selection) && selection.id !== g.position && !selection.base && <p className="tres-petit muet" style={{ margin: 0 }}>{!pa.disponible ? pa.motif : enMaintenance ? 'Entretien en cours.' : 'Potentiel insuffisant : rentrez d\'abord à Toulon.'}</p>}
          </div>
        )}
      </div>

      <div className="carte pile">
        <h3 style={{ margin: 0 }}>Tensions dans le monde</h3>
        <div className="grille-tensions">
          {theatres.filter((t) => !t.base).sort((a, b) => b.tensionActuelle - a.tensionActuelle).map((t) => {
            const n = niveau(t.tensionActuelle);
            return (
              <button key={t.id} type="button" className={`tension ${selection?.id === t.id ? 'choisie' : ''}`} onClick={() => setChoisi(t.id)}>
                <span className="petit"><strong>{t.court}</strong>{t.present ? ' 🚢' : ''}</span>
                <span className="barre-tension"><span className={n.classe} style={{ width: `${t.tensionActuelle}%` }} /></span>
                <span className="tres-petit muet">{n.texte}</span>
              </button>
            );
          })}
        </div>
        <p className="tres-petit muet" style={{ margin: 0 }}>Quand la tension dépasse un seuil, une crise peut éclater : elle arrive dans l'onglet <button type="button" className="lien" onClick={() => allerA?.('evenements')}>Événements</button>. Avoir le groupe aéronaval sur place donne de meilleures options. Niveaux de tension, coûts et effets : hypothèses de jeu.</p>
      </div>
    </div>
  );
}
