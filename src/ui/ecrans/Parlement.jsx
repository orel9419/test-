import React from 'react';
import Hemicycle from '../composants/Hemicycle.jsx';
import Info from '../composants/Info.jsx';
import { nombre, pct } from '../format.js';
import { exerciceBudgetaire, PROFILS_PREMIER_MINISTRE } from '../../engine/politique.js';

const POSTURES = { gouvernement: 'Gouvernement', soutien: 'Soutien', pivot: 'Pivot', opposition: 'Opposition' };

/** Barre de satisfaction divergente (−3 à +3), neutre au centre. */
function Satisfaction({ valeur }) {
  const v = Math.max(-3, Math.min(3, valeur));
  const largeur = (Math.abs(v) / 3) * 50;
  return (
    <div className="barre-fond" style={{ width: 140 }} aria-label={`Satisfaction ${nombre(valeur, 1)}`}>
      <div style={{ left: v >= 0 ? '50%' : `${50 - largeur}%`, width: `${largeur}%`, background: v >= 0 ? 'var(--divergent-pos)' : 'var(--divergent-neg)' }} />
      <div style={{ left: '50%', width: 1, background: 'var(--encre-attenuee)' }} />
    </div>
  );
}

/** Sénat américain : 100 sièges, seuils de 51 (majorité, réconciliation) et 60 (fin de l'obstruction). */
function Senat({ senat, pourPrevu }) {
  const d = senat.DEM, r = senat.REP;
  return (
    <div>
      <div className="senat" role="img" aria-label={`Sénat : ${d} démocrates, ${r} républicains`}>
        <div style={{ width: `${d}%`, background: '#1565c0' }} />
        <div style={{ width: `${r}%`, background: '#c62828' }} />
        <span className="seuil" style={{ left: '51%' }} title="Majorité simple (réconciliation) : 51, ou 50 + le vice-président" />
        <span className="seuil fort" style={{ left: '60%' }} title="Fin de l'obstruction : 60 voix" />
      </div>
      <div className="legende"><span>Démocrates {d}</span><span>Républicains {r}</span><span>│ 51 : majorité · ┃ 60 : fin de l'obstruction</span></div>
      {pourPrevu !== null && pourPrevu !== undefined && <p className="petit">Sénateurs favorables au budget (prévision) : <strong>{pourPrevu}</strong> / 60 nécessaires.</p>}
    </div>
  );
}

function ParlementEtatsUnis({ partie, decisions, majDecisions, prevision }) {
  const pol = partie.politique;
  const f = partie.finances;
  const tr = partie.trimestre;
  const trimestreBudget = tr.t === 3 || partie.tour === 1;
  const vb = prevision?.budget;
  const incertitude = prevision?.incertitude ?? 0;
  const fy = exerciceBudgetaire(partie);
  const groupes = prevision?.satisfactions ?? pol.groupes;
  return (
    <div className="pile">
      <h2>Congrès des États-Unis</h2>
      <div className="grille-2">
        <div className="carte">
          <h3>Chambre des représentants</h3>
          <Hemicycle pays="etatsUnis" groupes={pol.groupes} majorite={pol.majorite} />
          <h3 style={{ marginTop: '0.6rem' }}>Sénat</h3>
          <Senat senat={pol.senat} pourPrevu={trimestreBudget ? vb?.senat : null} />
        </div>
        <div className="carte pile">
          <h3>Rapport de force <Info texte="Pour devenir loi, un texte doit passer la Chambre (majorité simple) puis le Sénat, où 60 voix sont nécessaires pour clore les débats (obstruction ou « filibuster »). Exception : la réconciliation budgétaire, à la majorité simple, une fois par exercice, pour des mesures de recettes et de dépenses (règle Byrd), jamais pour la Social Security." /></h3>
          <p className="petit">{pol.gouvernementDivise ? <strong className="negatif">Gouvernement divisé : les démocrates contrôlent au moins une chambre.</strong> : 'Votre camp contrôle la Chambre et le Sénat.'}</p>
          <p className="petit">Réconciliation pour l'exercice {fy} : {pol.reconciliations.includes(fy) ? <strong>déjà utilisée</strong> : <strong className="positif">disponible</strong>}.</p>
          {pol.shutdown && <div className="alerte critique"><strong>Shutdown en cours</strong> depuis {pol.shutdown.trimestres} trimestre(s) : environ 750 000 agents fédéraux au chômage technique.</div>}
          <div className={`alerte ${f.margePlafond < 0 ? 'critique' : f.margePlafond < 900 ? '' : 'bonne'}`}>
            <strong>Plafond de la dette :</strong> {nombre(partie.statique.regles.nationale.plafond, 0)} Md$ ; dette brute {nombre(f.detteBrute ?? 0, 0)} Md$ ; marge {nombre(f.margePlafond ?? 0, 0)} Md$.
            {f.margePlafond < 900 && (
              <label className="petit" style={{ display: 'block', marginTop: 6 }}>Stratégie :
                <select value={decisions.plafondDette ?? 'negocier'} onChange={(ev) => majDecisions({ plafondDette: ev.target.value })} style={{ display: 'block', width: '100%', marginTop: 4 }}>
                  <option value="negocier">Négocier un relèvement bipartisan (concessions sur les dépenses)</option>
                  <option value="reconciliation">Le relever par réconciliation, avec les seuls républicains</option>
                  <option value="bras_de_fer">Bras de fer : refuser toute concession</option>
                </select>
              </label>
            )}
          </div>
          {trimestreBudget && vb && (
            <div className={`alerte ${vb.adopte && (vb.senat ?? 0) >= 60 ? 'bonne' : 'critique'}`}>
              <strong>Crédits de l'exercice {tr.t === 3 ? fy + 1 : fy} ce trimestre</strong>{incertitude ? ' (pointage incertain, ± 25 voix)' : ''} : Chambre {incertitude ? '≈ ' : ''}{vb.pour} pour, {vb.contre} contre ; Sénat {incertitude ? '≈ ' : ''}{vb.senat} voix. {vb.adopte && (vb.senat ?? 0) >= 60 ? 'Le budget complet passerait.' : 'Le budget complet ne passerait pas : une loi de financement provisoire (CR) est plus facile à faire voter.'}
            </div>
          )}
          {trimestreBudget && (
            <label className="petit">Procédure budgétaire :
              <select value={decisions.procedureBudget} onChange={(ev) => majDecisions({ procedureBudget: ev.target.value })} style={{ display: 'block', width: '100%', marginTop: 4 }}>
                <option value="auto">Budget complet s'il passe, sinon financement provisoire</option>
                <option value="complet">Budget complet uniquement (risque de shutdown)</option>
                <option value="cr">Financement provisoire : reconduire les crédits de l'an passé</option>
                <option value="compromis">Compromis avec les démocrates (santé, solidarités, éducation)</option>
              </select>
            </label>
          )}
        </div>
      </div>
      <div className="carte" style={{ overflowX: 'auto' }}>
        <h3>Groupes à la Chambre</h3>
        <table className="petit">
          <thead><tr><th>Groupe</th><th className="nombre">Sièges</th><th>Position</th><th>Satisfaction</th></tr></thead>
          <tbody>{groupes.map((g) => (
            <tr key={g.id}>
              <td><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: g.couleur, marginRight: 6 }} />{g.nom}</td>
              <td className="nombre">{g.sieges}</td><td>{POSTURES[g.posture]}</td>
              <td><div className="ligne"><Satisfaction valeur={g.satisfaction} /><span className="chiffres">{nombre(g.satisfaction, 1)}</span></div></td>
            </tr>
          ))}</tbody>
        </table>
        <p className="tres-petit muet">Le Freedom Caucus ne publie pas la liste de ses membres : environ 30 élus (estimation). Sièges de départ : House Press Gallery (mars 2026).</p>
      </div>
      {pol.votes.length > 0 && (
        <div className="carte">
          <h3>Derniers votes</h3>
          <ul className="petit" style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {pol.votes.slice(-6).reverse().map((v, i) => <li key={i}>Tour {v.tour} · {v.texte} : {v.pour} pour, {v.contre} contre — {v.adopte ? 'adopté' : 'rejeté'}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Parlement(props) {
  if (props.partie.pays === 'etatsUnis') return <ParlementEtatsUnis {...props} />;
  const { partie, decisions, majDecisions, prevision } = props;
  const pol = partie.politique;
  const fr = partie.pays === 'france';
  const groupes = prevision?.satisfactions ?? pol.groupes;
  const voteBudget = prevision?.budget;
  const t4 = partie.trimestre.t === 4;
  return (
    <div className="pile">
      <h2>{fr ? 'Assemblée nationale' : 'Bundestag et coalition'}</h2>
      <div className="grille-2">
        <div className="carte">
          <Hemicycle pays={partie.pays} groupes={pol.groupes} majorite={pol.majorite} />
        </div>
        <div className="carte pile">
          <h3>Rapport de force <Info texte={fr
            ? 'La satisfaction de chaque groupe dépend de la proximité entre votre politique et ses positions (dépenses sociales, impôts, retraites, temps de travail, écologie, Europe, entreprises, sécurité, rigueur), de votre popularité et des concessions obtenues. Un groupe vote la censure si sa satisfaction passe sous son seuil.'
            : 'La CDU/CSU et le SPD votent ensemble, mais des députés du SPD peuvent faire défection si leur parti est mécontent. Le SPD peut bloquer un texte au comité de coalition.'} /></h3>
          {fr ? (
            <>
              <p className="petit">Députés susceptibles de voter une censure : <strong>{pol.siegesCenseurs}</strong> sur <strong>{pol.majorite}</strong> nécessaires.</p>
              {prevision?.censure && <p className="petit muet">Avec vos décisions en cours : {prevision.censure.voix} voix de censure en cas de 49.3.</p>}
              <p className="petit muet">Le PS (69 sièges) est le pivot : en janvier 2026, la censure contre le budget 2026 n'a recueilli que 269 voix parce que les socialistes ne l'ont pas votée.</p>
            </>
          ) : (
            <>
              <p className="petit">Satisfaction du SPD : <strong>{nombre(pol.coalition.satisfaction, 0)}/100</strong>{pol.coalition.rompue && <strong className="negatif"> — coalition rompue</strong>}</p>
              <p className="petit">Majorité : {pol.groupes.filter((g) => g.posture === 'gouvernement').reduce((s, g) => s + g.sieges, 0)} sièges pour {pol.majorite} nécessaires · deux tiers : {Math.ceil(pol.sieges * 2 / 3)}.</p>
              <p className="petit">Bundesrat : soutien estimé {pol.bundesrat.soutien} voix sur {pol.bundesrat.voix} (majorité {pol.bundesrat.majorite}). <span className="muet">{pol.bundesrat.note}</span></p>
            </>
          )}
          {voteBudget && (
            <div className={`alerte ${voteBudget.adopte ? 'bonne' : ''}`}>
              <strong>{t4 ? `Vote du budget ${partie.trimestre.annee + 1} ce trimestre` : 'Si le budget était voté maintenant'}{prevision?.incertitude ? ' (pointage incertain, ± 25 voix)' : ''} :</strong> {prevision?.incertitude ? '≈ ' : ''}{voteBudget.pour} pour, {voteBudget.contre} contre, {voteBudget.abstention} abstentions → {voteBudget.adopte ? 'adopté' : 'rejeté'}.
            </div>
          )}
          {t4 && (
            <label className="petit">Procédure pour le budget :
              <select value={decisions.procedureBudget} onChange={(ev) => majDecisions({ procedureBudget: ev.target.value })} style={{ display: 'block', width: '100%', marginTop: 4 }}>
                <option value="auto">{fr ? 'Vote, puis 49.3 si nécessaire' : 'Vote au Bundestag'}</option>
                <option value="compromis">{fr ? 'Compromis avec le PS (concessions sociales et fiscales), puis 49.3' : 'Compromis avec le SPD (concessions sociales)'}</option>
                {fr && <option value="vote">Vote sans 49.3 (loi spéciale si rejet)</option>}
                {fr && <option value="ordonnances">Ordonnances (article 47)</option>}
              </select>
            </label>
          )}
          {fr && partie.role === 'president' && (
            <div className="carte pile" style={{ background: 'var(--surface-2)' }}>
              <strong className="petit">Matignon : nommer le Premier ministre <Info texte="Prérogative du président (article 8 de la Constitution). Le profil du Premier ministre change la position des groupes : un Premier ministre de droite fait entrer LR au gouvernement, un socialiste y fait entrer le PS. Chaque changement ajoute de l'instabilité ; le nouveau gouvernement a un trimestre de répit avant une censure." /></strong>
              <span className="tres-petit muet">Actuellement : {PROFILS_PREMIER_MINISTRE[partie.politique.premierMinistre?.profil ?? 'camp']?.nom}{partie.politique.nominations ? ` · ${partie.politique.nominations} nomination(s) depuis le début` : ''}{partie.politique.gouvernementsRenverses ? ` · ${partie.politique.gouvernementsRenverses} gouvernement(s) renversé(s)` : ''}</span>
              <select value={decisions.nominationPM ?? ''} onChange={(ev) => majDecisions({ nominationPM: ev.target.value || null })} aria-label="Profil du prochain Premier ministre">
                <option value="">Garder le Premier ministre actuel</option>
                {Object.entries(PROFILS_PREMIER_MINISTRE).filter(([id]) => id !== (partie.politique.premierMinistre?.profil ?? 'camp')).map(([id, p]) => <option key={id} value={id}>Nommer un Premier ministre {p.nom.charAt(0).toLowerCase() + p.nom.slice(1)}</option>)}
              </select>
              {decisions.nominationPM && <span className="tres-petit">{PROFILS_PREMIER_MINISTRE[decisions.nominationPM].description}</span>}
            </div>
          )}
          {fr && (
            <label className="petit" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}><input type="checkbox" checked={!!decisions.dissolution} onChange={(ev) => majDecisions({ dissolution: ev.target.checked })} />
              <span>{partie.role === 'president' ? 'Dissoudre l\'Assemblée (article 12)' : 'Demander au président de dissoudre l\'Assemblée'} (législatives anticipées, possible un an après la précédente dissolution)</span>
            </label>
          )}
        </div>
      </div>

      <div className="carte" style={{ overflowX: 'auto' }}>
        <h3>Groupes</h3>
        <table className="petit">
          <thead><tr><th>Groupe</th><th className="nombre">Sièges</th><th>Position</th><th>Satisfaction</th></tr></thead>
          <tbody>
            {groupes.map((g) => (
              <tr key={g.id}>
                <td><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: g.couleur, marginRight: 6 }} />{g.nom}</td>
                <td className="nombre">{g.sieges}</td>
                <td>{POSTURES[g.posture]}</td>
                <td><div className="ligne"><Satisfaction valeur={g.satisfaction} /><span className="chiffres">{nombre(g.satisfaction, 1)}</span></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!fr && (
        <div className="carte">
          <h3>Accord de coalition</h3>
          <ul className="petit" style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {pol.coalition.engagements.map((x) => <li key={x.id} className={x.respecte ? '' : 'negatif'}>{x.respecte ? '✓' : '✗'} {x.nom} <span className="muet">({x.porteur === 'SPD' ? 'priorité du SPD' : 'priorité de la CDU/CSU'})</span></li>)}
          </ul>
          <p className="tres-petit muet">Formulations simplifiées de l'accord « Verantwortung für Deutschland » (2025).</p>
          <h3 style={{ marginTop: '0.8rem' }}>Intentions de vote</h3>
          <p className="petit">{Object.entries(pol.intentions).map(([p, v]) => `${p === 'CDUCSU' ? 'CDU/CSU' : p === 'AFD' ? 'AfD' : p === 'GRUENE' ? 'Verts' : p === 'LINKE' ? 'Die Linke' : p} ${pct(v, 0)}`).join(' · ')}</p>
        </div>
      )}

      {pol.votes.length > 0 && (
        <div className="carte">
          <h3>Derniers votes</h3>
          <ul className="petit" style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {pol.votes.slice(-6).reverse().map((v, i) => <li key={i}>Tour {v.tour} · {v.texte} : {v.pour} pour, {v.contre} contre, {v.abstention} abstentions — {v.adopte ? 'adopté' : 'rejeté'}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
