import React from 'react';
import Hemicycle from '../composants/Hemicycle.jsx';
import Info from '../composants/Info.jsx';
import { nombre, pct } from '../format.js';

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

export default function Parlement({ partie, decisions, majDecisions, prevision }) {
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
              <strong>{t4 ? `Vote du budget ${partie.trimestre.annee + 1} ce trimestre` : 'Si le budget était voté maintenant'} :</strong> {voteBudget.pour} pour, {voteBudget.contre} contre, {voteBudget.abstention} abstentions → {voteBudget.adopte ? 'adopté' : 'rejeté'}.
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
          {fr && (
            <label className="petit" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}><input type="checkbox" checked={!!decisions.dissolution} onChange={(ev) => majDecisions({ dissolution: ev.target.checked })} />
              <span>Demander au président de dissoudre l'Assemblée (législatives anticipées, possible un an après la précédente dissolution)</span>
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
