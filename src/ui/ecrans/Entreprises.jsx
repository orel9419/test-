import React from 'react';
import GraphiqueLignes from '../composants/GraphiqueLignes.jsx';
import Info from '../composants/Info.jsx';
import Badge from '../composants/Badge.jsx';
import Nombre from '../composants/Nombre.jsx';
import Jauge from '../composants/Jauge.jsx';
import { programmesDisponibles, valeurPortefeuille, fleuron } from '../../engine/index.js';
import { FLEURONS, AGENCES, ACTIONS_ENTREPRISES } from '../../data/entreprises.js';
import { nombre, md, pct, signe, classeVariation } from '../format.js';

const ACTIONS_LOURDES_MAX = 2;

/**
 * Entreprises et État stratège : Bourse, climat des affaires, souveraineté,
 * participations publiques, actions sur les fleurons et programmes
 * d'investissement stratégique.
 */
export default function Entreprises({ partie, decisions, majDecisions, allerA }) {
  const x = partie.entreprises;
  if (!x) return <div className="carte">Module indisponible pour cette partie (sauvegarde antérieure).</div>;
  const agence = AGENCES[partie.pays];
  const defs = FLEURONS[partie.pays] ?? [];
  const actions = decisions.entreprises ?? [];
  const lourdes = actions.filter((a) => a.action !== 'rencontre').length;
  const programmes = programmesDisponibles(partie);
  const commandes = decisions.programmes ?? [];
  const h = x.historique;
  const etiquettes = h.map((_, i) => (i === 0 ? 'Départ' : partie.historique[i]?.trimestre ?? `T+${i}`));
  const h0 = h[0];

  const ajouterAction = (id, action) => majDecisions((d) => ({ entreprises: [...(d.entreprises ?? []).filter((a) => !(a.id === id && a.action === action)), { id, action }] }));
  const retirerAction = (id, action) => majDecisions((d) => ({ entreprises: (d.entreprises ?? []).filter((a) => !(a.id === id && a.action === action)) }));
  const commander = (id, commande) => majDecisions((d) => ({ programmes: [...(d.programmes ?? []).filter((p) => p.id !== id), ...(commande ? [{ id, commande }] : [])] }));

  return (
    <div className="pile">
      <h2>Entreprises et État stratège</h2>
      <p className="petit muet">L'État agit sur les entreprises de trois façons : comme <strong>actionnaire</strong> (participations, nationalisations, cessions), comme <strong>stratège</strong> (programmes d'investissement de long terme) et comme <strong>législateur</strong> (impôts, contributions, conditions des aides, dans l'onglet Réformes).</p>

      <div className="grille-tuiles">
        <div className="tuile">
          <span className="libelle">{x.indice.nom}<Info texte={x.indice.note} /></span>
          <span className="valeur chiffres"><Nombre valeur={x.indice.valeur} format={(v) => nombre(v, x.indice.base100 ? 1 : 0)} favorableSiHausse /></span>
          <span className={`variation ${classeVariation(x.indice.valeur - x.indice.valeur0)}`}>{signe((x.indice.valeur / x.indice.valeur0 - 1) * 100, 1)} % depuis le départ</span>
        </div>
        <div className="tuile">
          <span className="libelle">Climat des affaires<Info texte="100 = moyenne de long terme (comme l'indicateur de l'Insee). Il baisse avec la fiscalité des entreprises, le coût du travail, l'instabilité politique, les contributions exceptionnelles et les nationalisations ; il monte avec la croissance, la crédibilité budgétaire et les programmes industriels. Il pèse sur l'investissement, donc sur la croissance potentielle." /></span>
          <span className="valeur chiffres"><Nombre valeur={x.climatAffaires} format={(v) => nombre(v, 0)} favorableSiHausse /></span>
          <span className={`variation ${classeVariation(x.climatAffaires - h0.climat)}`}>{signe(x.climatAffaires - h0.climat, 1)} depuis le départ</span>
        </div>
        <div className="tuile">
          <span className="libelle">Souveraineté économique<Info texte="De 0 à 100 (estimation de jeu) : contrôle public des actifs stratégiques (énergie, défense, technologies critiques), actions spécifiques, programmes d'investissement. Elle protège contre les rachats hostiles et les ruptures d'approvisionnement." /></span>
          <span className="valeur chiffres"><Nombre valeur={x.souverainete} format={(v) => `${nombre(v, 0)}/100`} favorableSiHausse /></span>
          <span className={`variation ${classeVariation(x.souverainete - x.souverainete0)}`}>{signe(x.souverainete - x.souverainete0, 1)} depuis le départ</span>
        </div>
        <div className="tuile">
          <span className="libelle">Portefeuille public (modélisé)<Info texte="Valeur de marché des participations de l'État dans les fleurons suivis par le jeu. Acheter des actions augmente la dette sans creuser le déficit (opération financière au sens de Maastricht) ; les vendre la réduit." /></span>
          <span className="valeur chiffres">{md(valeurPortefeuille(partie), 0)}</span>
          <span className="variation">dividendes {md(x.dividendes, 1)} par an</span>
        </div>
      </div>

      <div className="carte petit">
        <strong>{agence.nom}.</strong> {agence.note}
      </div>

      <div className="grille-2">
        <div className="carte"><GraphiqueLignes titre={`${x.indice.nom}`} unite={x.indice.base100 ? 'base 100' : 'points'} decimales={x.indice.base100 ? 1 : 0} series={[{ id: 'indice', nom: x.indice.nom, valeurs: h.map((k) => k.indice) }]} etiquettes={etiquettes} /></div>
        <div className="carte"><GraphiqueLignes titre="Climat des affaires" unite="100 = moyenne" decimales={0} series={[{ id: 'climat', nom: 'Climat des affaires', valeurs: h.map((k) => k.climat) }]} etiquettes={etiquettes} reference={{ valeur: 100, libelle: 'Moyenne de long terme' }} /></div>
      </div>

      <div className="carte" style={{ overflowX: 'auto' }}>
        <div className="ligne espace">
          <h3>Fleurons nationaux</h3>
          <span className="petit muet">Opérations sur le capital ce trimestre : {lourdes}/{ACTIONS_LOURDES_MAX} · rencontres illimitées</span>
        </div>
        <table className="petit">
          <thead><tr><th>Entreprise</th><th className="nombre">Part de l'État</th><th className="nombre">Valeur</th><th>Santé</th><th>Relation</th><th>Action</th></tr></thead>
          <tbody>
            {defs.map((d) => {
              const f = fleuron(partie, d.id);
              const prevues = actions.filter((a) => a.id === d.id);
              return (
                <tr key={d.id}>
                  <td>
                    <strong>{d.nom}</strong>{d.strategique >= 0.8 && <span className="etiquette" style={{ marginLeft: 6 }}>stratégique</span>}{f.actionSpecifique && <span className="etiquette" style={{ marginLeft: 6 }} title="Action spécifique ou contrôle renforcé des investissements étrangers">🛡️</span>}
                    <div className="tres-petit muet">{d.secteur}{d.note ? ` · ${d.note}` : ''}</div>
                  </td>
                  <td className="nombre">{pct(f.partEtat, 0)} {d.statutPart && <Badge provenance={{ statut: d.statutPart, texte: 'Participation non confirmée pendant la collecte des données' }} />}</td>
                  <td className="nombre">{md(f.valeurMarche, 0)}<div className={`tres-petit ${classeVariation(f.valeur - 100)}`}>{signe(f.valeur - 100, 0)} %</div></td>
                  <td style={{ minWidth: 80 }}><Jauge valeur={f.sante / 100} couleur={f.sante < 35 ? 'var(--critique)' : 'var(--accent)'} libelle={`Santé financière ${Math.round(f.sante)}/100`} /></td>
                  <td style={{ minWidth: 80 }}><Jauge valeur={f.relation / 100} libelle={`Relation avec l'État ${Math.round(f.relation)}/100`} /></td>
                  <td>
                    {prevues.length > 0 ? prevues.map((a) => (
                      <div key={a.action} className="ligne"><span className="etiquette">{ACTIONS_ENTREPRISES[a.action].nom}</span><button type="button" className="bouton petit danger" onClick={() => retirerAction(d.id, a.action)}>Annuler</button></div>
                    )) : (
                      <select defaultValue="" aria-label={`Action sur ${d.nom}`} onChange={(ev) => { if (ev.target.value) ajouterAction(d.id, ev.target.value); ev.target.value = ''; }}>
                        <option value="">Choisir…</option>
                        {Object.entries(ACTIONS_ENTREPRISES).map(([id, a]) => {
                          const interdit = (id !== 'rencontre' && lourdes >= ACTIONS_LOURDES_MAX)
                            || (id === 'ceder' && f.partEtat <= 0) || ((id === 'participation' || id === 'nationaliser') && f.partEtat >= 100)
                            || (id === 'action_specifique' && (f.actionSpecifique || d.strategique < 0.5));
                          return <option key={id} value={id} disabled={interdit}>{a.nom}</option>;
                        })}
                      </select>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <details style={{ marginTop: '0.5rem' }}><summary>Que permet chaque action ?</summary>
          <ul className="petit" style={{ paddingLeft: '1.1rem' }}>{Object.values(ACTIONS_ENTREPRISES).map((a) => <li key={a.nom}><strong>{a.nom}</strong> : {a.description}</li>)}</ul>
          <p className="tres-petit muet">Capitalisations et emplois : ordres de grandeur (estimation de jeu). Parts de l'État : sources dans countries/*.json, « à vérifier » quand elles n'ont pas pu être confirmées.</p>
        </details>
      </div>

      <section className="pile">
        <h3>Programmes de l'État stratège <Info texte="Repères réels : France 2030 (54 Md€ sur cinq ans, lancé en 2021) ; CHIPS and Science Act américain (52,7 Md$ pour les semi-conducteurs, 2022). Les effets sur la croissance potentielle arrivent après un délai de montée en charge ; arrêter un programme en cours fâche les industriels." /></h3>
        <div className="grille-2">
          {programmes.map((p) => {
            const commande = commandes.find((c) => c.id === p.id)?.commande;
            const actif = p.actif && commande !== 'arreter';
            const prevu = !p.actif && commande === 'lancer';
            return (
              <div key={p.id} className={`carte compacte pile ${actif || prevu ? 'programme-actif' : ''}`}>
                <div className="ligne espace"><strong>{p.nom}</strong>{p.actif && <span className="etiquette">en cours</span>}</div>
                <p className="petit">{p.description}</p>
                <p className="tres-petit muet">Coût : {md(p.cout, 1)} par an · premiers effets après {p.delai} trimestres · croissance potentielle +{nombre(p.effets.potentiel, 3)} pt/an · souveraineté +{p.effets.souverainete}</p>
                <div className="ligne">
                  {!p.actif && !prevu && <button type="button" className="bouton principal petit" onClick={() => commander(p.id, 'lancer')}>Lancer</button>}
                  {prevu && <><span className="etiquette">lancement ce trimestre</span><button type="button" className="bouton petit" onClick={() => commander(p.id, null)}>Annuler</button></>}
                  {p.actif && commande !== 'arreter' && <button type="button" className="bouton petit danger" onClick={() => commander(p.id, 'arreter')}>Arrêter</button>}
                  {p.actif && commande === 'arreter' && <><span className="etiquette">arrêt ce trimestre</span><button type="button" className="bouton petit" onClick={() => commander(p.id, null)}>Annuler</button></>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="carte petit">
        <h3>Faire contribuer les entreprises</h3>
        <p>Contribution exceptionnelle des grandes entreprises, conditionnalité ou réduction des aides publiques, taxe sur les rachats d'actions : ces mesures sont dans l'onglet Réformes (catégorie Fiscalité) et passent devant le Parlement.{partie.pays === 'france' && ' En France, la surtaxe des grandes entreprises (7,3 Md€ en 2026) disparaît en 2027 si vous ne la prolongez pas : les députés ont supprimé sa prolongation le 28/10/2026.'}</p>
        <button type="button" className="bouton petit" onClick={() => allerA('reformes')}>Voir les réformes</button>
      </div>

      {x.engagements.length > 0 && (
        <div className="carte petit">
          <h3>Engagements d'investissement en cours</h3>
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>{x.engagements.map((g, i) => <li key={i}>{defs.find((d) => d.id === g.id)?.nom ?? (g.id === 'choose_france' ? 'Sommet Choose France' : g.id)} : {md(g.montant, 1)} (jusqu'au tour {g.fin})</li>)}</ul>
        </div>
      )}
    </div>
  );
}
