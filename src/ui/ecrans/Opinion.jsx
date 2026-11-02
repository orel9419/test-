import React, { useMemo, useState } from 'react';
import GraphiqueLignes from '../composants/GraphiqueLignes.jsx';
import Info from '../composants/Info.jsx';
import { THEMES, intentionsDeVote, siegesLegislativesFrance, reformesDisponibles } from '../../engine/index.js';
import { projectionPresidentielle, projectionPresidentielleEtatsUnis } from '../../engine/objectifs.js';
import { FAMILLES } from '../../engine/opinion.js';
import { libelleTrimestre } from '../../engine/calendrier.js';
import { nombre, pct, signe, classeVariation } from '../format.js';

const NOMS_DE = { CDUCSU: 'CDU/CSU', AFD: 'AfD', SPD: 'SPD', GRUENE: 'Verts', LINKE: 'Die Linke', autres: 'Autres' };
const nomParti = (pays, k) => (pays === 'allemagne' ? NOMS_DE[k] : FAMILLES[pays]?.[k]?.nom) ?? k;
const TYPES_ELECTION = ['presidentielle', 'legislatives', 'mi_mandat', 'regionales', 'municipales', 'landtag', 'europeennes'];

/** Barre horizontale 0-100 pour un thème du baromètre, avec variation depuis le départ. */
function BarreTheme({ nom, description, valeur, depart }) {
  const d = valeur - depart;
  return (
    <div className="barometre-ligne" title={description}>
      <span className="petit">{nom}</span>
      <div className="barre-fond" style={{ height: 10 }} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(valeur)} aria-label={`${nom} : ${Math.round(valeur)} sur 100`}>
        <div style={{ left: 0, width: `${valeur}%`, background: 'var(--accent)', transition: 'width 0.6s ease' }} />
        <div style={{ left: `${depart}%`, width: 2, background: 'var(--encre-2)' }} title="Niveau de départ" />
      </div>
      <span className="chiffres petit" style={{ textAlign: 'right' }}>{nombre(valeur, 0)} <span className={classeVariation(d)}>({signe(d, 0)})</span></span>
    </div>
  );
}

/** Ce que donnerait le scrutin s'il avait lieu aujourd'hui (projection, hors aléa). */
function Projection({ partie, ech }) {
  const i = intentionsDeVote(partie);
  if (ech.type === 'presidentielle') {
    const p = partie.pays === 'etatsUnis' ? projectionPresidentielleEtatsUnis(partie) : projectionPresidentielle(partie);
    return <span className={p >= 50 ? 'positif' : 'negatif'}>Votre camp : {pct(p, 1)} au second tour (ou en vote bipartite).</span>;
  }
  if (ech.type === 'legislatives' && partie.pays === 'allemagne') {
    return <span>CDU/CSU {pct(i.CDUCSU, 0)}, AfD {pct(i.AFD, 0)}, SPD {pct(i.SPD, 0)}, Verts {pct(i.GRUENE, 0)}.</span>;
  }
  const tri = Object.entries(i).sort((a, b) => b[1] - a[1]);
  return <span>En tête : {nomParti(partie.pays, tri[0][0])} ({pct(tri[0][1], 0)}), puis {nomParti(partie.pays, tri[1][0])} ({pct(tri[1][1], 0)}).</span>;
}

export default function Opinion({ partie, decisions, majDecisions }) {
  const o = partie.opinion;
  const [choixRef, setChoixRef] = useState('');
  const reformes = useMemo(() => reformesDisponibles(partie).filter((r) => r.disponible), [partie]);
  if (!o) return <div className="carte">Baromètre indisponible pour cette partie (sauvegarde antérieure).</div>;
  const pays = partie.pays;
  const pol = partie.politique;
  const intentions = intentionsDeVote(partie);
  const themes = Object.entries(THEMES).map(([id, t]) => ({ id, ...t, valeur: o.themes[id], depart: o.themes0[id] })).sort((a, b) => a.valeur - b.valeur);
  const etiquettes = o.historique.map((_, k) => (k === 0 ? 'Départ' : partie.historique[k]?.trimestre ?? ''));
  const partis = Object.keys(o.historique.at(-1)?.intentions ?? intentions).filter((k) => k !== 'autres').slice(0, 7);
  const toutesProchaines = (partie.statique.calendrier.echeances ?? []).filter((x) => TYPES_ELECTION.includes(x.type) && (x.annee > partie.trimestre.annee || (x.annee === partie.trimestre.annee && x.t >= partie.trimestre.t)));
  const prochaines = toutesProchaines.slice(0, 6);
  const passees = partie.elections?.historique ?? [];
  const derniereRef = pol.dernierReferendum;
  const refPossible = pays === 'france' && (!derniereRef || derniereRef.annee < partie.trimestre.annee);
  const legislatives = pays === 'france' ? siegesLegislativesFrance(partie, intentions) : null;

  const proposerReferendum = () => {
    if (!choixRef) return;
    const [id, option] = choixRef.split('|');
    majDecisions({ referendum: { id, option } });
  };

  return (
    <div className="pile">
      <h2>Opinion et élections</h2>
      <p className="petit muet">Le baromètre mesure, sur dix thèmes, la satisfaction de la population vis-à-vis de votre action. Il nourrit les intentions de vote, qui décident des élections prévues au calendrier et de celles que vous déclenchez (dissolution, référendum, question de confiance). Niveaux de départ : estimations de jeu cohérentes avec l'impopularité sourcée de l'exécutif.</p>

      <div className="grille-2">
        <div className="carte">
          <h3>Baromètre de satisfaction <Info texte="Chaque thème réagit à des indicateurs : pouvoir d'achat des ménages types et inflation, chômage, moyens des services publics (en volume), émissions, déficit et marchés, âge de départ et pensions, climat des affaires et souveraineté, influence internationale. Le trait vertical marque le niveau de départ." /></h3>
          <div className="pile" style={{ gap: '0.35rem' }}>
            {themes.map((t) => <BarreTheme key={t.id} nom={t.nom} description={t.description} valeur={t.valeur} depart={t.depart} />)}
          </div>
          <p className="tres-petit muet" style={{ marginTop: '0.5rem' }}>Popularité de l'exécutif : {pct(partie.social.popularite, 0)}.</p>
        </div>
        <div className="carte">
          <GraphiqueLignes titre="Intentions de vote" unite="%" decimales={0}
            series={partis.map((k) => ({ id: k, nom: nomParti(pays, k), valeurs: o.historique.map((x) => x.intentions[k] ?? null) }))}
            etiquettes={etiquettes} />
          <p className="tres-petit muet">{pays === 'france' ? 'Premier tour de la présidentielle (Ifop-Fiducial, 30/09/2026) pour le RN, le bloc central et la gauche sociale-démocrate ; autres familles estimées.' : pays === 'etatsUnis' ? 'Vote générique bipartite pour le Congrès (PollCheck, 30/10/2026).' : 'Sondages d\'octobre 2026 (INSA, YouGov, DeutschlandTrend) pour la CDU/CSU et l\'AfD ; autres partis estimés.'}</p>
        </div>
      </div>

      <div className="carte">
        <h3>Prochaines élections</h3>
        {prochaines.length === 0 && <p className="petit muet">Aucune élection prévue d'ici la fin de la partie.</p>}
        {toutesProchaines.length > prochaines.length && <p className="tres-petit muet">Les {prochaines.length} prochaines sur {toutesProchaines.length} scrutins prévus d'ici {partie.horizon ?? 'la fin de la partie'} (dates théoriques au-delà du mandat en cours).</p>}
        <table className="petit">
          <tbody>
            {prochaines.map((ech) => (
              <tr key={ech.id}>
                <td style={{ whiteSpace: 'nowrap' }}><strong>{libelleTrimestre(ech)}</strong></td>
                <td>{ech.nom}</td>
                <td><span className="muet">Si l'élection avait lieu aujourd'hui : </span><Projection partie={partie} ech={ech} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {legislatives && (
          <p className="petit" style={{ marginTop: '0.5rem' }}>
            <strong>Législatives anticipées (projection) :</strong> bloc central {legislatives.blocs.centre} sièges, RN et alliés {legislatives.blocs.RN}, gauche {legislatives.blocs.gauche}, LR {legislatives.blocs.LR}, divers {legislatives.blocs.autres} (majorité : 289).
            <Info texte="Projection du jeu : sièges proportionnels à la part des voix puissance 1,6 (prime majoritaire du scrutin à deux tours), gauche unie au second tour et reports favorables au bloc central face au RN, calés sur 2022 et 2024." />
          </p>
        )}
      </div>

      <div className="carte pile">
        <h3>Consulter les électeurs</h3>
        {pays === 'france' && (
          <>
            <p className="petit">Le <strong>référendum</strong> (article 11 de la Constitution) soumet une réforme directement aux Français, sans passer par le Parlement. Il devient vite un plébiscite sur le gouvernement : en 1969, de Gaulle a démissionné après la victoire du non ; en 2005, le traité constitutionnel européen a été rejeté à 54,7 %. Un référendum par an au plus.</p>
            {decisions.referendum ? (
              <div className="alerte bonne ligne espace"><span>Référendum prévu ce trimestre : <strong>{reformes.find((r) => r.id === decisions.referendum.id)?.nom}</strong></span><button type="button" className="bouton petit" onClick={() => majDecisions({ referendum: null })}>Annuler</button></div>
            ) : refPossible ? (
              <div className="ligne">
                <select value={choixRef} onChange={(ev) => setChoixRef(ev.target.value)} aria-label="Réforme à soumettre au référendum" style={{ maxWidth: 420 }}>
                  <option value="">Choisir une réforme et une option…</option>
                  {reformes.map((r) => (
                    <optgroup key={r.id} label={r.nom}>
                      {r.options.map((op) => <option key={op.id} value={`${r.id}|${op.id}`}>{op.nom}</option>)}
                    </optgroup>
                  ))}
                </select>
                <button type="button" className="bouton principal" onClick={proposerReferendum} disabled={!choixRef}>Organiser le référendum</button>
              </div>
            ) : <p className="petit muet">Un référendum a déjà eu lieu cette année.</p>}
            <label className="petit" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}><input type="checkbox" checked={!!decisions.dissolution} onChange={(ev) => majDecisions({ dissolution: ev.target.checked })} />
              <span>Demander la <strong>dissolution</strong> de l'Assemblée : législatives anticipées, dont le résultat suivra le baromètre (projection ci-dessus). Possible un an après la précédente dissolution.</span>
            </label>
          </>
        )}
        {pays === 'allemagne' && (
          <>
            <p className="petit">La Loi fondamentale ne prévoit pas de référendum national (seulement des référendums locaux et régionaux, comme ceux qui jalonnent les candidatures olympiques). Le chancelier peut en revanche poser la <strong>question de confiance</strong> (article 68) : la gagner ressoude la coalition ; la perdre ouvre la voie à des élections anticipées, comme en décembre 2024.</p>
            <label className="petit" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}><input type="checkbox" checked={!!decisions.questionConfiance} onChange={(ev) => majDecisions({ questionConfiance: ev.target.checked })} />
              <span>Poser la question de confiance ce trimestre (satisfaction du SPD : {nombre(pol.coalition?.satisfaction ?? 0, 0)}/100 ; il faut au moins 30 pour la gagner).</span>
            </label>
          </>
        )}
        {pays === 'etatsUnis' && (
          <p className="petit">Il n'existe pas de référendum fédéral aux États-Unis : les consultations directes (« ballot measures ») sont organisées par les États. Le président ne peut pas dissoudre le Congrès ; le verdict des électeurs passe par les élections de mi-mandat et la présidentielle.</p>
        )}
      </div>

      {passees.length > 0 && (
        <div className="carte">
          <h3>Résultats</h3>
          <ul className="petit" style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {passees.slice().reverse().map((r, k) => (
              <li key={k}><strong>{r.trimestre} · {r.nom}</strong> {r.victoireCamp === true ? '✓' : r.victoireCamp === false ? '✗' : ''} — {r.resume}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
