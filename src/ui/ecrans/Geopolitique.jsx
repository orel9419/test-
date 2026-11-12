import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Info from '../composants/Info.jsx';
import { resumeGeopolitique, compositionGroupes, resumeDeploiements } from '../../engine/index.js';
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
function CarteMonde({ theatres, groupes, choisi, onChoisir, bases = [] }) {
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
  const routes = groupes.map((g) => {
    const cible = theatres.find((t) => t.id === (g.destination ?? g.position));
    return cible && cible.id !== 'toulon' ? { numero: g.numero, prevue: !!g.destination, d: carte.chemin({ type: 'LineString', coordinates: [[toulon.lon, toulon.lat], [cible.lon, cible.lat]] }) } : null;
  }).filter(Boolean);
  const plusieurs = groupes.length > 1;
  return (
    <svg ref={svg} className={`carte-monde ${compacte ? 'compacte' : ''}`} viewBox={`0 0 ${L} ${H}`} role="img" aria-label="Carte du monde : théâtres d'opérations et position du groupe aéronaval">
      <path d={carte.sphere} className="carte-ocean" />
      {carte.pays.map((c) => <path key={c.id ?? c.d.slice(0, 20)} d={c.d} className={c.id === '250' ? 'carte-pays france' : 'carte-pays'} />)}
      {OUTRE_MER.map(([nom, lon, lat]) => { const [x, y] = p(lon, lat); return <circle key={nom} cx={x} cy={y} r={3 * k} className="carte-outre-mer"><title>{nom}</title></circle>; })}
      {routes.map((rt) => <path key={rt.numero} d={rt.d} className={`carte-route ${rt.prevue ? 'prevue' : ''}`} />)}
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
      {bases.filter((b) => !b.metropole).map((b) => {
        const [x, y] = p(b.lon, b.lat);
        const icones = b.presents.map((id) => b.unites.find((u) => u.id === id)?.icone).join('');
        return (
          <g key={b.id} className={`carte-base ${b.presents.length ? 'occupee' : ''}`} transform={`translate(${x},${y}) scale(${k})`}>
            <rect x="-4.5" y="-4.5" width="9" height="9" transform="rotate(45)" />
            {icones && <text y="17" textAnchor="middle">{icones}</text>}
            <title>{`${b.nom}${icones ? ` : ${b.presents.length} unité(s) déployée(s)` : ''}`}</title>
          </g>
        );
      })}
      {groupes.map((g, i) => {
        const t = theatres.find((x) => x.id === g.position);
        const [gx, gy] = p(t.lon, t.lat);
        // Deux groupes au même endroit : décalés pour rester lisibles
        const memeLieu = plusieurs && groupes.filter((h) => h.position === g.position).length > 1;
        const dx = memeLieu ? (i ? 18 : -18) : 0;
        return (
          <g key={g.numero} className="carte-gan" transform={`translate(${gx + dx * k},${gy + (g.position === 'toulon' ? -2 : 18) * k}) scale(${k})`}>
            <rect x={plusieurs ? -19 : -15} y="-9" width={plusieurs ? 38 : 30} height="18" rx="9" />
            <text textAnchor="middle" y="5">{plusieurs ? `🚢${g.numero}` : '🚢'}</text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Vue 3D du ou des groupes aéronavals, telle que la voit le président, chef des
 * armées : porte-avions en service et escorte disponible dans la partie.
 */
function VueGroupes({ partie, nomTheatre, ouvert, basculer }) {
  const c = compositionGroupes(partie);
  if (!c.groupes.length) return <p className="petit muet" style={{ margin: 0 }}>Aucun porte-avions en service : pas de groupe aéronaval à montrer.</p>;
  const deux = c.groupes.length > 1;
  const NOMS = { fda: 'frégate de défense aérienne', fremm: 'FREMM (dont une anti-sous-marine et son Caïman Marine)', sna: 'SNA', brf: 'ravitailleur', pha: 'porte-hélicoptères' };
  return (
    <div className="pile vue-groupes" style={{ gap: '0.4rem' }}>
      <button type="button" className={`bouton ${ouvert ? '' : 'principal'}`} onClick={basculer}>{ouvert ? 'Masquer la vue 3D' : `🎖️ Voir ${deux ? 'les deux groupes aéronavals' : 'le groupe aéronaval'} en 3D`}</button>
      <ul className="tres-petit" style={{ margin: 0, paddingLeft: '1rem' }}>
        {c.groupes.map((g) => (
          <li key={g.numero}>
            <strong>{deux ? `Groupe ${g.numero} · ` : ''}{g.nom}</strong> ({nomTheatre(g.position)}) : {Object.entries(g.escorte).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${NOMS[k]}${n > 1 && k !== 'fremm' ? 's' : ''}`).join(', ') || 'sans escorte'}
            {g.manques.length > 0 && <span className="negatif"> · il manque : {g.manques.join(', ')}</span>}
          </li>
        ))}
      </ul>
      {c.groupes.some((g) => g.manques.length) && <p className="tres-petit muet" style={{ margin: 0 }}>Environ deux bâtiments sur trois sont disponibles à un moment donné ; les autres sont en entretien ou en entraînement. Pour armer deux groupes complets, commandez des escorteurs (onglet Armées, Marine).</p>}
    </div>
  );
}

/** Visionneuse 3D des groupes, en pleine largeur. */
function Groupes3D({ partie }) {
  const c = compositionGroupes(partie);
  if (!c.groupes.length) return null;
  return (
    <div className="carte pile">
      <h3 style={{ margin: 0 }}>🎖️ {c.groupes.length > 1 ? 'Les deux groupes aéronavals' : 'Le groupe aéronaval'} vu par le chef des armées</h3>
      <p className="tres-petit muet" style={{ margin: 0 }}>Le président de la République décide de leur déploiement (domaine réservé). Composition de votre partie ; distances resserrées pour tout voir d'un coup d'œil. Bouton « Ravitaillement à la mer » : le ravitailleur vient à couple du porte-avions.</p>
      <Suspense fallback={<p className="petit muet">Chargement…</p>}><Visionneuse3D key={JSON.stringify(c.groupes)} modele="groupeAeronaval" hauteur={420} donnees={{ groupes: c.groupes }} /></Suspense>
    </div>
  );
}

/** Fiche d'un groupe aéronaval : porte-avions, position, potentiel, ordre en attente. */
function FicheGroupe({ g, numero, plusieurs, destination, nomTheatre, onAnnuler }) {
  const pa = g.porteAvions ?? {};
  return (
    <div className="pile" style={{ gap: '0.45rem' }}>
      {plusieurs && <strong className="petit">Groupe {numero} · {pa.nom}</strong>}
      {!pa.disponible && pa.motif && <p className={`alerte petit ${pa.enService ? '' : 'critique'}`} style={{ margin: 0 }}>{pa.motif}</p>}
      <div className="ligne espace petit"><span>Position</span><strong>{nomTheatre(g.position)}</strong></div>
      <div className="petit">Potentiel (équipages, munitions, maintenance) : <strong>{Math.round(g.potentiel)} %</strong>
        <div className="jauge-potentiel"><div style={{ width: `${g.potentiel}%` }} className={g.potentiel < 30 ? 'bas' : ''} /></div>
      </div>
      <div className="ligne espace petit"><span>En mer depuis</span><strong>{g.trimestresEnMer} trimestre(s)</strong></div>
      {g.maintenance > 0 && <p className="petit alerte" style={{ margin: 0 }}>Entretien à Toulon : encore {g.maintenance} trimestre(s).</p>}
      {destination && <p className="petit alerte bonne" style={{ margin: 0 }}>Ordre donné : {destination === 'toulon' ? 'rentrer à Toulon' : `appareiller pour ${nomTheatre(destination)}`} (à la validation du trimestre). <button type="button" className="lien" onClick={onAnnuler}>Annuler</button></p>}
    </div>
  );
}

/**
 * Géopolitique (France) : carte des théâtres, tensions, déploiement du groupe
 * aéronaval. Les crises arrivent dans l'onglet Événements.
 */
/**
 * Forces projetables : unités terrestres et aériennes à envoyer sur des bases
 * françaises ou alliées, comme le groupe aéronaval.
 */
function Deploiements({ d, decisions, majDecisions }) {
  const [vue3d, setVue3d] = useState(null); // unité montrée en 3D
  const ordres = decisions.deploiements ?? {};
  const donner = (unite, base) => majDecisions((x) => ({ deploiements: { ...(x.deploiements ?? {}), [unite]: base } }));
  const nomBase = (id) => d.bases.find((b) => b.id === id)?.court ?? id;
  return (
    <div className="carte pile deploiements">
      <h3 style={{ margin: 0 }}>🪖 Forces projetables et bases alliées <Info texte="Comme le groupe aéronaval, chaque unité déployée coûte, s'use et doit revenir en métropole pour récupérer. Sa présence apaise la tension du théâtre voisin et renforce l'influence et les relations avec le pays hôte. Une base alliée n'accueille que si les relations restent suffisantes ; les missions de l'OTAN supposent d'en être membre. Effectifs, coûts et effets : hypothèses de jeu." /></h3>
      <p className="petit muet" style={{ margin: 0 }}>Déployées : {d.unites.filter((u) => u.position !== 'metropole').length} unité(s) sur {d.unites.length} · coût de présence environ {md(d.coutAnnuel, 2)} par an.{d.horsOtan && <strong className="negatif"> La France a quitté l'OTAN : les missions de l'Alliance (Roumanie, Estonie, Lituanie) lui sont fermées.</strong>}</p>
      <div className="grille-deploiements">
        {d.unites.map((u) => {
          const ordre = ordres[u.id];
          const choix = d.bases.filter((b) => b.id !== u.position && b.types.includes(u.type));
          const fatigue = u.potentiel < d.potentielMin + u.usure;
          return (
            <div key={u.id} className={`unite-deployable ${u.position !== 'metropole' ? 'deployee' : ''}`}>
              <div className="ligne espace"><strong className="petit">{u.icone} {u.nom}</strong><span className="etiquette">{u.type === 'air' ? 'Air' : 'Terre'}</span></div>
              <span className="tres-petit muet">{u.description}</span>
              <div className="ligne espace petit"><span>Position</span><strong>{nomBase(u.position)}{u.position !== 'metropole' ? ` · ${u.trimestres} trim.` : ''}</strong></div>
              <div className="tres-petit">Potentiel : <strong>{Math.round(u.potentiel)} %</strong>{u.repos > 0 ? ` · remise en condition : ${u.repos} trimestre(s)` : ''}
                <div className="jauge-potentiel"><div style={{ width: `${u.potentiel}%` }} className={u.potentiel < 40 ? 'bas' : ''} /></div>
              </div>
              <label className="tres-petit">Ordre :
                <select value={ordre ?? ''} onChange={(ev) => donner(u.id, ev.target.value || null)} style={{ marginLeft: 6, maxWidth: '100%' }}>
                  <option value="">— rester sur place —</option>
                  {choix.map((b) => {
                    const a = b.acces[u.type];
                    const bloque = !b.metropole && (!a.ok || u.repos > 0 || fatigue);
                    return <option key={b.id} value={b.id} disabled={bloque}>{b.metropole ? 'Rentrer en métropole' : `${b.court}${bloque ? ` (${!a.ok ? 'accès refusé' : 'unité à remettre en condition'})` : ` · ${md(u.cout * (b.distance ?? 1), 2)}/an`}`}</option>;
                  })}
                </select>
              </label>
              {ordre && <span className="tres-petit alerte bonne">Ordre donné : {ordre === 'metropole' ? 'retour en métropole' : `déploiement vers ${nomBase(ordre)}`} (à la validation). <button type="button" className="lien" onClick={() => donner(u.id, null)}>Annuler</button></span>}
              <button type="button" className={`bouton petit ${vue3d === u.id ? 'principal' : ''}`} onClick={() => setVue3d((v) => (v === u.id ? null : u.id))}>{vue3d === u.id ? 'Masquer la vue 3D' : '🎖️ Voir en 3D'}</button>
            </div>
          );
        })}
      </div>
      {vue3d && (() => {
        const u = d.unites.find((x) => x.id === vue3d);
        const b = d.bases.find((x) => x.id === u.position);
        const deploye = !b.metropole;
        const donnees = { deploye, base: b.court, terrain: b.terrain ?? 'desert', interception: !!b.interception };
        return (
          <div className="pile" style={{ gap: '0.3rem' }}>
            <strong className="petit">{u.icone} {u.nom} · {deploye ? `en mission : ${b.court}` : 'en métropole'}</strong>
            <span className="tres-petit muet">La scène suit votre partie : en métropole, l'unité est à sa base ; déployée, elle est en mission dans le décor de la région. Engins à la même échelle, distances resserrées.</span>
            <Suspense fallback={<p className="petit muet">Chargement…</p>}><Visionneuse3D key={`${u.scene}:${JSON.stringify(donnees)}`} modele={u.scene} hauteur={420} donnees={donnees} /></Suspense>
          </div>
        );
      })()}
      <details>
        <summary>Les bases et leurs conditions d'accès</summary>
        <ul className="tres-petit" style={{ paddingLeft: '1rem' }}>
          {d.bases.filter((b) => !b.metropole).map((b) => {
            const refus = [b.acces.terre, b.acces.air].find((a) => !a.ok && !a.motif.startsWith('Cette base'));
            return (
              <li key={b.id} style={{ marginBottom: '0.3rem' }}>
                <strong>{b.nom}</strong> ({b.types.map((t) => (t === 'air' ? 'aviation' : 'troupes')).join(' et ')}{b.otan ? ', mission de l\'OTAN' : ''}{b.partenaire ? '' : ', territoire français'}) : {b.description}
                {refus && <span className="negatif"> {refus.motif}</span>}
                {b.presents.length > 0 && <span className="positif"> Présents : {b.presents.map((id) => d.unites.find((u) => u.id === id)?.court).join(', ')}.</span>}
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );
}

export default function Geopolitique({ partie, decisions, majDecisions, allerA }) {
  const r = resumeGeopolitique(partie);
  const dep = resumeDeploiements(partie);
  const [choisi, setChoisi] = useState(null);
  const [voir3d, setVoir3d] = useState(null); // 'charlesDeGaulle' | 'porteAvions' | null
  const theatres = r?.theatres ?? [];
  const selection = useMemo(() => theatres.find((t) => t.id === (choisi ?? r?.gan.position)), [theatres, choisi, r]);
  if (!r) return <div className="carte"><h2>Géopolitique</h2><p>Ce module est disponible pour la France.</p></div>;
  const g = r.gan;
  const pa = g.porteAvions;
  const nomTheatre = (id) => theatres.find((t) => t.id === id)?.nom ?? id;
  // Un ou deux groupes aéronavals (deux porte-avions en service)
  const groupes = [{ numero: 1, cle: 'gan', g, destination: decisions.gan ?? null }, ...(r.gan2 ? [{ numero: 2, cle: 'gan2', g: r.gan2, destination: decisions.gan2 ?? null }] : [])];
  const plusieurs = groupes.length > 1;
  const possible = (gr, t) => t.id !== gr.position && (t.base || (gr.porteAvions?.disponible && !(gr.maintenance > 0) && gr.potentiel >= t.usure));
  const raison = (gr) => (!gr.porteAvions?.disponible ? gr.porteAvions?.motif : gr.maintenance > 0 ? 'Entretien en cours.' : 'Potentiel insuffisant : rentrez d\'abord à Toulon.');
  return (
    <div className="pile">
      <h2>Géopolitique et {plusieurs ? 'groupes aéronavals' : 'groupe aéronaval'}</h2>
      <p className="petit muet">La France est présente sur tous les océans : ses territoires d'outre-mer lui donnent le deuxième espace maritime du monde. Déployer le groupe aéronaval rassure les alliés, apaise les tensions et pèse dans les crises ; mais il s'use, coûte cher et ne peut être partout à la fois.</p>

      <div className="carte pile">
        <CarteMonde theatres={theatres} groupes={groupes.map(({ numero, g: gr, destination }) => ({ numero, position: gr.position, destination }))} choisi={selection?.id} onChoisir={setChoisi} bases={(dep?.bases ?? []).map((b) => ({ ...b, unites: dep.unites }))} />
        <div className="ligne petit legende-carte">
          <span><span className="pastille-legende critique" /> tension forte</span>
          <span><span className="pastille-legende attention" /> moyenne</span>
          <span><span className="pastille-legende bon" /> faible</span>
          <span>🚢 {plusieurs ? 'groupes aéronavals (1 et 2)' : 'groupe aéronaval'}</span>
          <span><span className="pastille-legende outre-mer" /> outre-mer français</span>
          <span><span className="pastille-legende base" /> base (troupes, aviation)</span>
        </div>
      </div>

      {dep && <Deploiements d={dep} decisions={decisions} majDecisions={majDecisions} />}

      <div className="grille-2">
        <div className="carte pile">
          <h3 style={{ margin: 0 }}>🚢 {plusieurs ? 'Deux groupes aéronavals' : `Groupe aéronaval ${pa.nom ? `· porte-avions ${pa.nom}` : ''}`} <Info texte={GROUPE_AERONAVAL.pedagogie} /></h3>
          {plusieurs && <p className="petit muet" style={{ margin: 0 }}>Avec deux porte-avions en service, la France peut tenir deux théâtres à la fois, ou se relayer sur le même sans interruption.</p>}
          {groupes.map(({ numero, cle, g: gr, destination }) => (
            <FicheGroupe key={cle} g={gr} numero={numero} plusieurs={plusieurs} destination={destination} nomTheatre={nomTheatre} onAnnuler={() => majDecisions({ [cle]: null })} />
          ))}
          {!plusieurs && <p className="tres-petit muet" style={{ margin: 0 }}>Deux groupes aéronavals : gardez le Charles-de-Gaulle jusqu'en 2040 avec un « France Libre » accéléré à 2032, ou décidez de construire deux porte-avions (onglets Armées et Réformes).</p>}
          <ul className="tres-petit muet" style={{ margin: 0, paddingLeft: '1rem' }}>{GROUPE_AERONAVAL.composition.map((c) => <li key={c}>{c}</li>)}</ul>
          <VueGroupes partie={partie} nomTheatre={nomTheatre} ouvert={voir3d === 'groupeAeronaval'} basculer={() => setVoir3d((v) => (v === 'groupeAeronaval' ? null : 'groupeAeronaval'))} />
          <div className="ligne petit">
            {(r.flotte ?? []).some((x) => x.id === 'cdg') && <button type="button" className="lien" onClick={() => setVoir3d((v) => (v === 'charlesDeGaulle' ? null : 'charlesDeGaulle'))}>{voir3d === 'charlesDeGaulle' ? 'Masquer le modèle 3D' : 'Voir le Charles-de-Gaulle en 3D'}</button>}
            <button type="button" className="lien" onClick={() => setVoir3d((v) => (v === 'porteAvions' ? null : 'porteAvions'))}>{voir3d === 'porteAvions' ? 'Masquer le modèle 3D' : pa.nom === 'France Libre' ? 'Voir le « France Libre » en 3D' : 'Voir son successeur, le « France Libre »'}</button>
          </div>
          {voir3d && voir3d !== 'groupeAeronaval' && <Suspense fallback={<p className="petit muet">Chargement…</p>}><Visionneuse3D key={voir3d} modele={voir3d} hauteur={280} /></Suspense>}
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
            {groupes.map(({ numero, cle, g: gr }) => {
              const nom = plusieurs ? `le groupe ${numero} (${gr.porteAvions?.nom})` : 'le groupe aéronaval';
              if (selection.id === gr.position) return <p key={cle} className="petit muet" style={{ margin: 0 }}>{selection.base ? `${nom.charAt(0).toUpperCase()}${nom.slice(1)} est à quai.` : `${nom.charAt(0).toUpperCase()}${nom.slice(1)} est déjà sur place.`}</p>;
              const ok = possible(gr, selection);
              return (
                <div key={cle} className="pile" style={{ gap: '0.2rem' }}>
                  <button type="button" className={`bouton ${numero === 1 ? 'principal' : ''}`} disabled={!ok} onClick={() => majDecisions({ [cle]: selection.id })}>{selection.base ? `Faire rentrer ${nom} à Toulon` : `Envoyer ${nom} ici`}</button>
                  {!ok && !selection.base && <span className="tres-petit muet">{raison(gr)}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {voir3d === 'groupeAeronaval' && <Groupes3D partie={partie} />}

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
