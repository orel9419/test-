import React from 'react';
import { MINISTERES, GROUPES } from '../../model/ministeres.js';
import { inertiePoste } from '../../engine/depenses.js';
import Badge from '../composants/Badge.jsx';
import Info from '../composants/Info.jsx';
import Apercu from './Apercu.jsx';
import { md, nombre, pct, signe, devise } from '../format.js';

/**
 * Préréglages inspirés des projets de budget officiels. La défense allemande
 * vient du budget fédéral sourcé ; les autres postes sont des ordres de
 * grandeur (approximation, non sourcée poste par poste).
 */
const PREREGLAGES = {
  france: {
    nom: 'Approximation du PLF 2027 (43 Md€ de mesures)',
    note: 'Le PLF 2027 vise un déficit de 5,0 % avec 43 Md€ de mesures nouvelles (source : PLF 2027). Répartition par poste : approximation du jeu. Défense : +10 % (mission Défense 66,5 → 73,2 Md€).',
    budget: { defense: 10, economieFinances: -4, protectionSociale: -1.5, travailEmploi: -4, logement: -4, culture: -4, transports: -3, agriculture: -2, ecologieEnergie: -3, sante: -0.5, interieurJustice: 1 },
  },
  allemagne: {
    nom: 'Approximation du projet de budget fédéral 2027',
    note: 'Défense et Ukraine : 94,2 → 121,3 Md€ (budget fédéral 2027, sourcé). Fonds spécial pour les infrastructures en hausse ; coupes sur l\'allocation logement et le revenu citoyen évoquées au Bundestag. Autres postes : approximation.',
    budget: { defense: 26, transports: 6, ecologieEnergie: 5, travailEmploi: -3, logement: -4, protectionSociale: 0.5, economieFinances: -1 },
  },
};

export default function Budget({ partie, decisions, majDecisions, apercu }) {
  const prix = partie.macro.niveauPrix / 100;
  const postes = Object.entries(partie.budget).sort((a, b) => b[1].montant - a[1].montant);
  const total = postes.reduce((s, [, l]) => s + l.montant, 0);
  const f = partie.finances;
  const pre = PREREGLAGES[partie.pays];
  const changer = (id, v) => majDecisions((d) => ({ budget: { ...d.budget, [id]: v } }));
  return (
    <div className="pile">
      <div className="ligne espace">
        <h2>Budget des ministères</h2>
        <div className="ligne">
          {pre && <button type="button" className="bouton" title={pre.note} onClick={() => majDecisions((d) => ({ budget: { ...d.budget, ...pre.budget } }))}>Charger : {pre.nom}</button>}
          <button type="button" className="bouton" onClick={() => majDecisions({ budget: Object.fromEntries(Object.keys(partie.budget).map((id) => [id, 0])) })}>Tout remettre à 0 %</button>
        </div>
      </div>
      <p className="muet petit">
        {partie.pays === 'etatsUnis'
          ? <>Vous pilotez le budget <strong>fédéral</strong> (les États fédérés ne sont pas inclus). Social Security, Medicare et Medicaid sont des dépenses « obligatoires » ; les autres postes sont « discrétionnaires » et votés chaque année par le Congrès.</>
          : <>Vous pilotez la dépense de toutes les administrations publiques ({partie.pays === 'france' ? 'État, Sécurité sociale, collectivités' : 'Bund, Länder, communes, assurances sociales'}).</>} Chaque curseur fixe une variation <strong>en volume</strong> (hors inflation) par rapport au niveau de départ : 0 % maintient le pouvoir d'achat du poste. Le montant rejoint la cible progressivement : on réduit plus vite un investissement qu'une masse salariale. Les retraites dépendent de règles (âge, indexation) : modifiez-les dans « Réformes ».
      </p>

      <div className="grille-2">
        <div className="carte petit">
          <div className="ligne espace"><span>Dépenses hors intérêts</span><strong className="chiffres">{md(total, 0)}</strong></div>
          <div className="ligne espace"><span>Charge d'intérêts</span><strong className="chiffres">{md(f.interets, 0)}</strong></div>
          <div className="ligne espace"><span>Recettes</span><strong className="chiffres">{md(f.recettes, 0)}</strong></div>
          <div className="ligne espace"><span>Déficit</span><strong className="chiffres">{md(f.deficit, 0)} ({pct(f.deficitRatio)})</strong></div>
          <div className="ligne espace"><span>Solde hors intérêts</span><strong className="chiffres">{md(f.soldePrimaire, 0)}</strong></div>
        </div>
        <Apercu apercu={apercu} partie={partie} />
      </div>

      <div className="carte" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>Poste</th><th className="nombre">Montant (Md{devise()}/an)</th><th style={{ minWidth: 220 }}>Variation en volume</th><th className="nombre">Cible</th><th>Groupes sensibles</th></tr>
          </thead>
          <tbody>
            {postes.map(([id, l]) => {
              const def = MINISTERES[id];
              const v = decisions.budget[id] ?? l.variationVolume ?? 0;
              const cible = l.montantInitial * prix * (1 + v / 100);
              const vitesse = inertiePoste(id, partie.mode) * 100;
              const groupes = Object.entries(def.groupes ?? {}).filter(([, x]) => x >= 0.4).map(([g]) => GROUPES[g].nom.split(' ')[0]).join(', ');
              return (
                <tr key={id}>
                  <td>
                    <div className="ligne" style={{ gap: '0.35rem' }}><strong className="petit">{def.nom}</strong><Info texte={def.description} /></div>
                    <Badge provenance={partie.statique.ministeres[id]?.provenance} />
                  </td>
                  <td className="nombre">{nombre(l.montant, 1)}<div className="tres-petit muet">{pct(l.montant / total * 100)} du total</div></td>
                  <td>
                    {def.pilotage === 'curseur' ? (
                      <>
                        <input type="range" min={-25} max={30} step={0.5} value={v} onChange={(ev) => changer(id, Number(ev.target.value))} aria-label={`Variation en volume : ${def.nom}`} />
                        <div className="ligne espace tres-petit"><span className="chiffres">{signe(v, 1, ' %')}</span><span className="muet">max. {nombre(vitesse, 1)} % par trimestre</span></div>
                      </>
                    ) : <span className="tres-petit muet">Selon les règles (voir Réformes)</span>}
                  </td>
                  <td className="nombre">{def.pilotage === 'curseur' ? nombre(cible, 1) : '—'}</td>
                  <td className="tres-petit muet">{groupes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
