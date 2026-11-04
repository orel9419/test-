import React from 'react';
import Info from '../composants/Info.jsx';
import { resumeRelocalisation } from '../../engine/index.js';
import { SOURCES_RELOCALISATION } from '../../data/relocalisations.js';
import { md, pct } from '../format.js';

const STATUTS = { chantier: '🏗️ Usine en construction', en_service: '✅ En service', refuse: '✋ Refusé' };
const RESILIENCES = { medicaments: 'médicaments', puces: 'puces électroniques', batteries: 'batteries', munitions: 'munitions', cloud: 'données sensibles' };

/**
 * Produire en France : demander aux grands groupes (CAC 40 et autres) de
 * produire en France, avec un levier choisi.
 */
export default function ProduireEnFrance({ partie, decisions, majDecisions }) {
  const liste = resumeRelocalisation(partie);
  if (!liste) return <div className="carte"><h2>Produire en France</h2><p>Ce module est disponible pour la France.</p></div>;
  const demandes = decisions.relocalisations ?? [];
  const demander = (id, levier) => majDecisions((d) => ({ relocalisations: [...(d.relocalisations ?? []).filter((x) => x.id !== id), { id, levier }] }));
  const retirer = (id) => majDecisions((d) => ({ relocalisations: (d.relocalisations ?? []).filter((x) => x.id !== id) }));
  const enService = liste.filter((d) => d.etat?.statut === 'en_service');
  const chantiers = liste.filter((d) => d.etat?.statut === 'chantier');
  const resilience = Object.keys(partie.relocalisation?.resilience ?? {});
  return (
    <div className="pile">
      <h2>Produire en France</h2>
      <p className="petit muet">Une entreprise privée choisit où elle produit : l'État ne peut pas l'y obliger. Il peut convaincre, aider (dans les limites des règles européennes sur les aides d'État), s'engager à acheter, ou faire pression. Produire en France coûte souvent plus cher qu'en Asie, mais protège des pénuries et des chantages.</p>

      <div className="grille-tuiles">
        <div className="tuile"><span className="libelle">Usines relocalisées</span><span className="valeur chiffres">{enService.length}</span><span className="variation muet">{chantiers.length} en construction</span></div>
        <div className="tuile"><span className="libelle">Emplois créés (estimation)</span><span className="valeur chiffres">{Math.round(enService.reduce((s, d) => s + d.emplois, 0) * 1000).toLocaleString('fr-FR')}</span><span className="variation muet">+ {Math.round(chantiers.reduce((s, d) => s + d.emplois, 0) * 1000).toLocaleString('fr-FR')} à venir</span></div>
        <div className="tuile"><span className="libelle">Secteurs à l'abri des pénuries <Info texte="Une production en France réduit fortement l'effet des crises d'approvisionnement (restrictions d'exportation, conflits, fermeture de routes maritimes)." /></span><span className="valeur" style={{ fontSize: '1rem' }}>{resilience.length ? resilience.map((r) => RESILIENCES[r] ?? r).join(', ') : 'aucun secteur'}</span></div>
      </div>

      <div className="grille-programmes">
        {liste.map((d) => {
          const prevu = demandes.find((x) => x.id === d.id);
          const statut = d.etat?.statut;
          return (
            <article key={d.id} className="carte pile dossier-reloc">
              <div className="ligne espace" style={{ flexWrap: 'nowrap' }}>
                <h3 style={{ margin: 0 }}><span aria-hidden="true">{d.icone}</span> {d.titre}</h3>
              </div>
              <div className="ligne petit">
                <strong>{d.nomEntreprise}</strong>{d.cac40 && <span className="etiquette cac40">CAC 40</span>}
                {statut && <span className={`etiquette ${statut === 'en_service' ? 'bonne' : statut === 'refuse' ? 'critique' : ''}`}>{STATUTS[statut]}{statut === 'chantier' ? ` (mise en service au tour ${d.etat.fin})` : ''}</span>}
              </div>
              <p className="tres-petit muet" style={{ margin: 0 }}>{d.contexte}</p>
              <p className="petit" style={{ margin: 0 }}><strong>Demande :</strong> {d.demande}</p>
              <p className="tres-petit" style={{ margin: 0 }}>Investissement de l'entreprise : {md(d.investissement, 2)} · environ {Math.round(d.emplois * 1000).toLocaleString('fr-FR')} emplois · {d.delai} trimestres de chantier{d.resilience ? ` · protège contre les pénuries de ${RESILIENCES[d.resilience]}` : ''}.</p>
              {d.peutDemander ? (
                <div className="leviers">
                  {d.leviers.map((l) => {
                    const actif = prevu?.levier === l.id;
                    return (
                      <button key={l.id} type="button" className={`offre ${actif ? 'active' : ''}`} aria-pressed={actif} onClick={() => (actif ? retirer(d.id) : demander(d.id, l.id))} title={l.aide}>
                        <strong className="petit">{l.nom}</strong>
                        <span className="tres-petit">Chances : {pct(l.chances * 100, 0)}{l.cout.total ? ` · coût public ${md(l.cout.total, 2)}` : ' · sans coût public'}</span>
                        <span className="tres-petit muet">{l.aide}</span>
                      </button>
                    );
                  })}
                </div>
              ) : statut === 'refuse' ? <p className="tres-petit muet" style={{ margin: 0 }}>Nouvelle demande possible un an après le refus.</p> : null}
              {prevu && <p className="tres-petit" style={{ margin: 0 }}>✓ Demande prête : réponse de l'entreprise à la validation du trimestre.</p>}
              {d.sources?.length > 0 && <p className="tres-petit" style={{ margin: 0 }}>Sources : {d.sources.map((s, i) => <span key={s}>{i > 0 && ' · '}<a href={SOURCES_RELOCALISATION[s].url} target="_blank" rel="noreferrer">{SOURCES_RELOCALISATION[s].titre}</a></span>)}</p>}
            </article>
          );
        })}
      </div>
      <p className="tres-petit muet">Contexte des dossiers : faits publics. Investissements, emplois, délais et chances d'accord : hypothèses de jeu.</p>
    </div>
  );
}
