import React from 'react';
import Info from '../composants/Info.jsx';
import Hemicycle from '../composants/Hemicycle.jsx';
import Palais from '../composants/Palais.jsx';
import { resumeInstitutions, risqueConstitutionnel } from '../../engine/index.js';
import { PALAIS, POUVOIRS_PRESIDENT, POUVOIRS_PREMIER_MINISTRE, COHABITATIONS, PRECEDENTS, SOURCES_INSTITUTIONS } from '../../data/institutions.js';
import { nombre } from '../format.js';

const CLASSE_CONFIG = { fait_majoritaire: 'bonne', majorite_relative: '', cohabitation: 'critique' };

/** Tableau du document « qui fait quoi » (répartition des compétences). */
const REPARTITION = [
  ['Nomination du Premier ministre', 'Oui (article 8)', 'Non'],
  ['Nomination des ministres', 'Sur proposition du Premier ministre', 'Les propose'],
  ['Direction du Gouvernement', 'Influence politique, forte en fait majoritaire', 'Dirige son action (article 21)'],
  ['Politique de la nation', 'Impulsion, sauf en cohabitation', 'Le Gouvernement la détermine et la conduit (article 20)'],
  ['Défense', 'Chef des armées (article 15)', 'Responsable de la défense nationale (article 21)'],
  ['Diplomatie', 'Rôle majeur (articles 14 et 52)', 'Participe à la politique extérieure'],
  ['Dissolution de l\'Assemblée', 'Oui (article 12)', 'Consulté au préalable'],
  ['Référendum', 'Décide (article 11)', 'Le propose'],
  ['Pouvoir réglementaire', 'Décrets délibérés en Conseil des ministres', 'De droit commun (articles 21 et 37)'],
  ['Initiative des lois', 'Non', 'Projets de loi (article 39)'],
  ['Motion de censure', 'Non concerné', 'Le Gouvernement y est exposé (article 49)'],
];

function Jauge({ valeur, bas = 30 }) {
  return <div className="jauge-entente" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(valeur)}><div style={{ width: `${valeur}%` }} className={valeur < bas ? 'bas' : valeur >= 60 ? 'haut' : ''} /></div>;
}

function CartePalais({ id, titulaire, detail, joueur, children }) {
  const p = PALAIS[id];
  return (
    <article className={`carte pile carte-palais ${joueur ? 'joueur' : ''}`}>
      <Palais id={id} titre={p.nom} />
      <div>
        <div className="tres-petit muet">{p.nom}</div>
        <h3 style={{ margin: 0 }}>{p.fonction} {joueur && <span className="etiquette bonne">vous</span>}</h3>
        <div className="petit muet">{p.role}</div>
      </div>
      {titulaire && <div className="petit"><strong>{titulaire}</strong>{detail && <div className="tres-petit muet">{detail}</div>}</div>}
      {children}
      <p className="tres-petit muet" style={{ margin: 0 }}>{p.mandat}</p>
    </article>
  );
}

/** Schéma : qui élit, nomme, renverse, saisit qui. */
function Schema({ role }) {
  const n = (x, y, l1, l2, joueur) => (
    <g className={`schema-noeud ${joueur ? 'joueur' : ''}`}>
      <rect x={x} y={y} width="190" height="50" rx="10" />
      <text x={x + 95} y={y + 21} textAnchor="middle" className="schema-titre">{l1}</text>
      <text x={x + 95} y={y + 38} textAnchor="middle" className="schema-sous">{l2}</text>
    </g>
  );
  const fleche = (d, cls = '') => <path d={d} className={`schema-fleche ${cls}`} markerEnd="url(#pointe)" markerStart={cls === 'double' ? 'url(#pointe)' : undefined} />;
  const lib = (x, y, t, ancre = 'middle', rotation = 0) => <text x={x} y={y} textAnchor={ancre} className="schema-libelle" transform={rotation ? `rotate(${rotation} ${x} ${y})` : undefined}>{t}</text>;
  return (
    <svg viewBox="0 0 700 400" className="schema-institutions" role="img" aria-label="Schéma des institutions : élections, nominations, dissolution, censure, navette, saisine du Conseil constitutionnel">
      <defs>
        <marker id="pointe" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" className="schema-pointe" /></marker>
      </defs>
      {n(255, 8, 'Les citoyens', 'suffrage universel')}
      {n(20, 120, 'Président', 'de la République · Élysée', role === 'president')}
      {n(490, 120, 'Assemblée nationale', '577 députés')}
      {n(20, 262, 'Premier ministre', 'Matignon · Gouvernement', role !== 'president')}
      {n(490, 262, 'Sénat', '348 sénateurs')}
      {n(255, 340, 'Conseil constitutionnel', '9 membres')}
      {fleche('M300 58 L140 118')}{lib(196, 82, 'élisent pour 5 ans', 'end')}
      {fleche('M400 58 L560 118')}{lib(504, 82, 'élisent pour 5 ans', 'start')}
      {fleche('M210 140 L488 140')}{lib(349, 132, 'peut dissoudre (art. 12)')}
      {fleche('M115 170 L115 260')}{lib(122, 220, 'nomme (art. 8)', 'start')}
      {fleche('M520 170 L212 262')}{lib(362, 199, 'peut renverser (art. 49 et 50)', 'middle', -16.6)}
      {fleche('M210 296 L488 296')}{lib(349, 288, 'projets de loi, 49.3 (art. 39, 49)')}
      {fleche('M585 260 L585 172', 'double')}{lib(593, 220, 'navette (art. 45)', 'start')}
      {fleche('M115 312 L253 362', 'pointille')}{fleche('M585 312 L447 362', 'pointille')}
      {lib(170, 352, 'saisine (art. 61)', 'end')}{lib(530, 352, 'saisine (art. 61)', 'start')}
    </svg>
  );
}

/**
 * Institutions (France) : Élysée, Matignon, Assemblée nationale, Sénat,
 * Conseil constitutionnel ; configuration de l'exécutif, entente, pouvoirs
 * de chaque tête de l'exécutif et décisions institutionnelles du trimestre.
 */
export default function Institutions({ partie, decisions, majDecisions, allerA }) {
  const r = resumeInstitutions(partie);
  if (!r) return <div className="carte"><h2>Institutions</h2><p>Ce module est disponible pour la France.</p></div>;
  const president = partie.role === 'president';
  const pol = partie.politique;
  const c = r.cohabitation;
  const t = c?.texte;
  const risque = t ? risqueConstitutionnel('france', t.reforme, t.option) : null;
  const groupesAN = pol.groupes;
  const senatHemicycle = r.senat.groupes.map((g) => ({ id: g.id, sieges: g.sieges, couleur: g.couleur, court: g.court }));
  const reponse = decisions.cohabitation ?? 'promulguer';
  return (
    <div className="pile">
      <h2>Institutions de la Ve République</h2>
      <p className="petit muet">L'exécutif a deux têtes : le président de la République, chef de l'État, et le Premier ministre, chef du Gouvernement. Leur poids réel dépend de la majorité à l'Assemblée nationale. Vous jouez {president ? 'le président de la République' : 'le Premier ministre'}.</p>

      <div className={`alerte ${CLASSE_CONFIG[r.configuration.id]}`}>
        <strong>{r.configuration.nom}</strong> · Gouvernement : {r.configuration.gouvernement} députés{r.configuration.soutien ? ` (+ ${r.configuration.soutien} en soutien)` : ''} pour une majorité absolue de {r.configuration.majorite}.
        <div className="petit" style={{ marginTop: 4 }}>{r.configuration.texte}</div>
      </div>

      <div className="grille-palais">
        <CartePalais id="elysee" titulaire={r.titulaires.president.nom} detail={r.titulaires.president.detail} joueur={r.titulaires.president.joueur} />
        <CartePalais id="matignon" titulaire={r.titulaires.premierMinistre.nom} detail={r.titulaires.premierMinistre.detail} joueur={r.titulaires.premierMinistre.joueur} />
        <CartePalais id="bourbon" titulaire={`Présidente : ${PALAIS.bourbon.president}`} detail={PALAIS.bourbon.depuisPresident}>
          <Hemicycle pays="france" groupes={groupesAN} majorite={pol.majorite} />
        </CartePalais>
        <CartePalais id="luxembourg" titulaire={`Président : ${r.senat.president}`} detail={r.senat.president === PALAIS.luxembourg.president ? PALAIS.luxembourg.depuisPresident : null}>
          <Hemicycle pays="senat" groupes={senatHemicycle} majorite={175} />
          <div className="tres-petit">Droite et centre (LR, Union centriste) : <strong>{r.senat.majoriteDroiteCentre}</strong> sièges · prochain renouvellement : septembre {r.senat.prochainRenouvellement}.</div>
          <div className="tres-petit">Relation avec le Gouvernement : {Math.round(r.senat.relation)}/100 <Info texte="Elle progresse quand le Sénat et l'Assemblée s'accordent, recule quand l'Assemblée a le dernier mot. Une bonne relation aide à faire passer une révision de la Constitution ou une loi organique relative au Sénat, qui exigent son accord." /></div>
        </CartePalais>
      </div>

      <div className="grille-2">
        <div className="carte pile">
          <h3 style={{ margin: 0 }}>Entente entre l'Élysée et Matignon <Info texte="Hypothèse de jeu. Elle monte quand les réformes adoptées vont dans le sens de l'autre tête de l'exécutif (priorités de l'Élysée, ou sensibilité du Premier ministre nommé), et revient lentement vers 60 (30 en cohabitation). Trop basse : le président refuse dissolutions et référendums demandés par Matignon, et peut exiger la démission du Premier ministre ; un Premier ministre nommé par le joueur peut démissionner." /></h3>
          <div className="ligne espace petit"><span>{Math.round(r.entente)}/100</span><span className="muet">{r.entente < 30 ? 'rupture proche' : r.entente < 45 ? 'tendue' : r.entente < 65 ? 'correcte' : 'solide'}</span></div>
          <Jauge valeur={r.entente} />
          {c && <p className="petit" style={{ margin: 0 }}>En cohabitation, l'entente reste basse : le président ne peut pas renvoyer le Premier ministre, qui s'appuie sur sa majorité.</p>}
          {!c && !president && r.priorites.length > 0 && (
            <div className="petit">
              Priorités de l'Élysée : {r.priorites.map((p, i) => <span key={p.id}>{i > 0 && ', '}<strong>{p.nom}</strong></span>)}. <button type="button" className="lien" onClick={() => allerA?.('reformes')}>Voir les réformes</button>
            </div>
          )}
          {!c && president && <p className="petit" style={{ margin: 0 }}>Votre Premier ministre réagit à vos réformes selon sa sensibilité ; vous pouvez en changer dans l'onglet <button type="button" className="lien" onClick={() => allerA?.('parlement')}>Parlement</button>.</p>}
        </div>

        <div className="carte pile">
          <h3 style={{ margin: 0 }}>Vos décisions institutionnelles ce trimestre</h3>
          {!president && !c && (
            <label className="petit case-institution">
              <input type="checkbox" checked={!!decisions.questionConfiance} disabled={!r.disponibles.confiance} onChange={(ev) => majDecisions({ questionConfiance: ev.target.checked })} />
              <span><strong>Engager la responsabilité du Gouvernement sur votre programme (article 49, alinéa 1)</strong>
                {r.previsionConfiance && <> — pronostic : {r.previsionConfiance.pour} pour, {r.previsionConfiance.contre} contre → <strong className={r.previsionConfiance.accordee ? 'positif' : 'negatif'}>{r.previsionConfiance.accordee ? 'confiance accordée' : 'confiance refusée : le Gouvernement tomberait'}</strong></>}
                {!r.disponibles.confiance && <span className="muet"> (déjà utilisée lors de cette session)</span>}
                <span className="tres-petit muet" style={{ display: 'block' }}>{PRECEDENTS.confiance}</span>
              </span>
            </label>
          )}
          {president && (
            <label className="petit case-institution">
              <input type="checkbox" checked={!!decisions.congres} disabled={!r.disponibles.congres} onChange={(ev) => majDecisions({ congres: ev.target.checked })} />
              <span><strong>S'exprimer devant le Parlement réuni en Congrès (article 18)</strong> — fixe un cap, rapproche l'Élysée et Matignon. {!r.disponibles.congres && <span className="muet">(déjà fait cette année)</span>}
                <span className="tres-petit muet" style={{ display: 'block' }}>{PRECEDENTS.congres}</span>
              </span>
            </label>
          )}
          <ul className="petit" style={{ margin: 0, paddingLeft: '1.1rem' }}>
            <li>{president ? 'Dissoudre l\'Assemblée (article 12)' : 'Demander une dissolution au président (article 12)'} : {r.disponibles.dissolution ? 'possible' : `pas avant ${r.disponibles.moisAvantDissolution} mois (un an après les dernières législatives)`} — <button type="button" className="lien" onClick={() => allerA?.('parlement')}>onglet Parlement</button>.</li>
            <li>Référendum (article 11) : {president ? (c ? 'impossible en cohabitation, faute de proposition du Gouvernement' : 'sur proposition du Gouvernement') : 'vous le proposez, le président décide'} — <button type="button" className="lien" onClick={() => allerA?.('reformes')}>onglet Réformes</button>.</li>
            {president && !c && <li>Nommer le Premier ministre (article 8) — <button type="button" className="lien" onClick={() => allerA?.('parlement')}>onglet Parlement</button>.</li>}
            <li>Défense et dissuasion (articles 15 et 21) — <button type="button" className="lien" onClick={() => allerA?.('armees')}>onglet Armées</button>.</li>
          </ul>
        </div>
      </div>

      {c && president && (
        <div className="carte pile cohabitation">
          <h3 style={{ margin: 0 }}>Cohabitation : le Gouvernement de {c.premierMinistre} <span className="etiquette critique">{c.etiquette}</span></h3>
          <p className="petit" style={{ margin: 0 }}>Le budget, les impôts et les réformes relèvent du Gouvernement (article 20) : vos choix dans ces onglets ne s'appliquent pas. Vous gardez la défense, la diplomatie, la dissolution et vos pouvoirs propres. {c.adoptes.length > 0 && `Textes déjà adoptés : ${c.adoptes.map((x) => x.nom).join(', ')}.`}</p>
          {t ? (
            <>
              <div className="alerte petit"><strong>Projet du Gouvernement ce trimestre :</strong> {t.nom} — {t.option_nom}{t.ordonnances ? ' (par ordonnances, article 38)' : ''}{t.reporte ? ' · texte reporté au trimestre précédent' : ''}.
                {risque && <div className="tres-petit">Risque d'inconstitutionnalité : {Math.round(risque.risque * 100)} % (hypothèse de jeu). {risque.motif}</div>}
              </div>
              <div className="leviers" role="radiogroup" aria-label="Votre réponse au texte du Gouvernement">
                {[
                  ['promulguer', 'Promulguer (article 10)', 'Vous laissez la majorité gouverner : le texte s\'applique.', true],
                  ['saisir', 'Saisir le Conseil constitutionnel (article 61)', 'Le Conseil examine le texte de plus près ; une disposition fragile a plus de chances d\'être censurée.', true],
                  ['nouvelle_deliberation', 'Demander une nouvelle délibération (article 10)', 'Le Parlement doit revoter : un trimestre de report, une seule fois par texte.', !t.ordonnances && !t.deliberation],
                  ['refuser_signature', 'Refuser de signer les ordonnances (article 13)', 'Comme Mitterrand en 1986 : le Gouvernement doit passer par une loi, un trimestre plus tard.', t.ordonnances && !t.reporte],
                ].filter(([, , , ok]) => ok).map(([id, nom, aide]) => (
                  <button key={id} type="button" role="radio" aria-checked={reponse === id} className={`offre ${reponse === id ? 'active' : ''}`} onClick={() => majDecisions({ cohabitation: id })}>
                    <strong className="petit">{nom}</strong>
                    <span className="tres-petit muet">{aide}</span>
                  </button>
                ))}
              </div>
              <p className="tres-petit muet" style={{ margin: 0 }}>{PRECEDENTS.ordonnances}</p>
            </>
          ) : <p className="petit muet" style={{ margin: 0 }}>Le Gouvernement n'a pas de nouveau texte majeur ce trimestre.</p>}
        </div>
      )}

      <div className="grille-2">
        <CartePalais id="montpensier" titulaire={`Président : ${PALAIS.montpensier.president}`} detail={PALAIS.montpensier.depuisPresident}>
          <p className="petit" style={{ margin: 0 }}>Prochain renouvellement : mars {r.conseil.prochainRenouvellement}{president ? ' (vous nommerez un membre)' : ''}. {r.conseil.severite > 0.01 ? 'Le Conseil s\'est montré plus exigeant après des nominations de juristes.' : r.conseil.severite < -0.01 ? 'Des nominations politiques l\'ont rendu un peu moins sévère, au prix de son autorité.' : ''}</p>
          <p className="tres-petit muet" style={{ margin: 0 }}>{PRECEDENTS.saisine}</p>
        </CartePalais>
        <div className="carte pile">
          <h3 style={{ margin: 0 }}>Derniers passages au Sénat</h3>
          {r.senat.navettes.length ? (
            <ul className="petit" style={{ margin: 0, paddingLeft: '1.1rem' }}>
              {r.senat.navettes.slice().reverse().map((nv, i) => <li key={i}>Tour {nv.tour} · {nv.textes.join(', ')} : {nv.pour} pour, {nv.contre} contre — {nv.issue === 'accord' ? 'accord' : nv.issue === 'bloque' ? 'bloqué (article 46)' : 'dernier mot à l\'Assemblée'}</li>)}
            </ul>
          ) : <p className="petit muet" style={{ margin: 0 }}>Aucun texte encore. Chaque projet de loi adopté par l'Assemblée passe au Sénat (procédure accélérée) ; en cas de désaccord, l'Assemblée a le dernier mot, sauf pour une révision de la Constitution ou une loi organique relative au Sénat.</p>}
          <p className="tres-petit muet" style={{ margin: 0 }}>{PRECEDENTS.senat}</p>
        </div>
      </div>

      <div className="carte pile">
        <h3 style={{ margin: 0 }}>Qui fait quoi ?</h3>
        <Schema role={partie.role} />
        <ul className="petit schema-texte">
          <li>Les citoyens élisent le président et les députés pour cinq ans ; les élus locaux élisent les sénateurs.</li>
          <li>Le président nomme le Premier ministre (article 8) et peut dissoudre l'Assemblée (article 12).</li>
          <li>L'Assemblée peut renverser le Gouvernement (articles 49 et 50) ; le Sénat ne le peut pas.</li>
          <li>Les textes font la navette entre les deux assemblées ; l'Assemblée a le dernier mot (article 45).</li>
          <li>Le Conseil constitutionnel est saisi par le président, le Premier ministre, les présidents des assemblées, 60 députés ou 60 sénateurs (article 61).</li>
        </ul>
        <div style={{ overflowX: 'auto' }}>
          <table className="petit">
            <thead><tr><th>Domaine</th><th>Président de la République</th><th>Premier ministre</th></tr></thead>
            <tbody>{REPARTITION.map(([d, p, m]) => <tr key={d}><td>{d}</td><td>{p}</td><td>{m}</td></tr>)}</tbody>
          </table>
        </div>
      </div>

      <div className="grille-2">
        <div className="carte pile">
          <h3 style={{ margin: 0 }}>Pouvoirs du président <span className="tres-petit muet">(titre II)</span></h3>
          {POUVOIRS_PRESIDENT.map((p) => (
            <details key={p.id} className="pouvoir">
              <summary className="petit"><span className="etiquette">art. {p.article}</span> {p.nom} {p.propre && <span className="etiquette bonne" title="Article 19 : acte dispensé du contreseing du Premier ministre">pouvoir propre</span>}</summary>
              <p className="petit" style={{ margin: '0.3rem 0' }}>{p.texte}</p>
              <p className="tres-petit muet" style={{ margin: 0 }}>Dans le jeu : {p.jeu}</p>
            </details>
          ))}
        </div>
        <div className="carte pile">
          <h3 style={{ margin: 0 }}>Pouvoirs du Premier ministre <span className="tres-petit muet">(titres III et V)</span></h3>
          {POUVOIRS_PREMIER_MINISTRE.map((p) => (
            <details key={p.id} className="pouvoir">
              <summary className="petit"><span className="etiquette">art. {p.article}</span> {p.nom}</summary>
              <p className="petit" style={{ margin: '0.3rem 0' }}>{p.texte}</p>
              <p className="tres-petit muet" style={{ margin: 0 }}>Dans le jeu : {p.jeu}</p>
            </details>
          ))}
          <p className="tres-petit muet" style={{ margin: 0 }}>Les actes du président autres que ses pouvoirs propres sont contresignés par le Premier ministre (article 19).</p>
        </div>
      </div>

      <div className="carte pile">
        <h3 style={{ margin: 0 }}>Fait majoritaire et cohabitation</h3>
        <p className="petit" style={{ margin: 0 }}>Quand le président dispose d'une majorité, il devient le centre de l'exécutif. En cohabitation, le Premier ministre conduit la politique intérieure ; le président garde ses compétences constitutionnelles et une influence sur la défense et la diplomatie. La France en a connu trois :</p>
        <table className="petit">
          <thead><tr><th>Période</th><th>Président</th><th>Premier ministre</th></tr></thead>
          <tbody>{COHABITATIONS.map((x) => <tr key={x.periode}><td>{x.periode}</td><td>{x.president}</td><td>{x.premierMinistre}</td></tr>)}</tbody>
        </table>
        <p className="tres-petit muet" style={{ margin: 0 }}>{PRECEDENTS.demission} {PRECEDENTS.article16} {PRECEDENTS.censure}</p>
        {r.historique.length > 0 && <p className="petit" style={{ margin: 0 }}>Dans votre partie : {r.historique.map((h) => `cohabitation avec ${h.bloc === 'RN' ? 'le RN' : 'la gauche'} (tours ${h.debut} à ${h.fin}, ${h.adoptes} texte(s) adopté(s))`).join(' ; ')}.</p>}
        {r.article16 && <p className="petit negatif" style={{ margin: 0 }}>L'article 16 a été appliqué dans votre partie (tour {r.article16.tour}).</p>}
      </div>

      <p className="tres-petit muet">Sources : {Object.values(SOURCES_INSTITUTIONS).map((s, i) => <span key={s.url}>{i > 0 && ' · '}<a href={s.url} target="_blank" rel="noreferrer">{s.titre}</a></span>)}. Compositions : octobre 2026 (Sénat), janvier 2026 pour les groupes de l'Assemblée. Entente, votes du Sénat et effets : hypothèses de jeu. {nombre(POUVOIRS_PRESIDENT.length + POUVOIRS_PREMIER_MINISTRE.length, 0)} pouvoirs décrits.</p>
    </div>
  );
}
