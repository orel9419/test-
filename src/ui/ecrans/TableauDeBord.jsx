import React from 'react';
import Tuile from '../composants/Tuile.jsx';
import GraphiqueLignes from '../composants/GraphiqueLignes.jsx';
import { nombre, pct, md, signe, classeVariation } from '../format.js';
import { GROUPES } from '../../model/ministeres.js';
import Conseiller from '../composants/Conseiller.jsx';

/** Explications pédagogiques des indicateurs. */
export const EXPLICATIONS = {
  pib: 'Produit intérieur brut : la richesse produite en un an, en euros courants. C\'est le dénominateur de tous les ratios (dette, déficit).',
  croissance: 'Évolution du PIB en volume (hors inflation) sur un an. Elle dépend de la demande (dont la politique budgétaire), de l\'énergie, des taux d\'intérêt et de la croissance potentielle.',
  inflation: 'Hausse des prix à la consommation sur un an. Le choc énergétique de 2026 l\'a fait monter ; la BCE relève ses taux pour la contenir.',
  chomage: 'Part de la population active sans emploi. Il baisse quand la croissance dépasse son potentiel (loi d\'Okun).',
  dette: 'Dette publique au sens de Maastricht, en % du PIB. Elle augmente chaque année du déficit. Pour la stabiliser, il faut un solde hors intérêts au moins égal à (taux d\'intérêt − croissance) × dette.',
  deficit: 'Dépenses publiques moins recettes, en % du PIB. Les règles européennes visent moins de 3 %.',
  interets: 'Intérêts versés sur la dette. Ils montent progressivement : chaque année, la dette ancienne, émise à bas taux, est refinancée aux taux actuels.',
  taux: 'Taux auquel l\'État emprunte à 10 ans. Il dépend du taux de la BCE et de la prime de risque exigée par les marchés (dette, déficit, instabilité politique, crédibilité).',
  spread: 'Écart avec le taux allemand, en points de base (100 pb = 1 point). Au-delà de 300 pb pendant deux trimestres, c\'est la crise de la dette.',
  popularite: 'Popularité du gouvernement, moyenne des groupes sociaux pondérée par leur poids électoral.',
  soutien: 'Rapport de force au Parlement : qui soutient, qui pourrait vous renverser.',
  cohesion: 'Indice de 0 à 100 : baisse avec le risque de mouvement social, le chômage et les écarts de pouvoir d\'achat entre ménages.',
  emissions: 'Émissions de gaz à effet de serre, en millions de tonnes équivalent CO2 par an.',
  innovation: 'Dépense de recherche et développement, en % du PIB. Ses effets sur la croissance potentielle prennent 2 à 5 ans.',
  influence: 'Influence internationale, de 0 à 100 : défense, diplomatie, aide au développement, crédibilité et initiatives réussies.',
};

export default function TableauDeBord({ partie, apercu, allerA, conseils }) {
  const h = partie.historique;
  const prec = h.length >= 2 ? h[h.length - 2] : h[0];
  const der = h[h.length - 1];
  const m = partie.macro, f = partie.finances, s = partie.social, pol = partie.politique;
  const etiquettes = h.map((x) => x.trimestre);
  const serie = (cle) => h.map((x) => x[cle]);
  const fr = partie.pays === 'france';
  const us = partie.pays === 'etatsUnis';
  const siegesRep = us ? pol.groupes.filter((g) => g.id !== 'DEM').reduce((t, g) => t + g.sieges, 0) : 0;
  const soutienValeur = fr
    ? `${pol.siegesCenseurs ?? '—'} / ${pol.majorite}`
    : us ? `${siegesRep} / 435` : `${nombre(pol.coalition.satisfaction, 0)}/100`;
  const soutienLibelle = fr ? 'Censeurs potentiels' : us ? 'Républicains à la Chambre' : 'Satisfaction du SPD';
  const banque = partie.statique.banqueCentrale === 'fed' ? 'Fed' : 'BCE';

  const alertes = [];
  if (f.spread > 200) alertes.push({ niveau: f.spread > 260 ? 'critique' : '', texte: `Les marchés s'inquiètent : écart de taux de ${Math.round(f.spread)} pb (crise au-delà de 300 pb).` });
  if (s.mobilisation) alertes.push({ niveau: 'critique', texte: `Mouvement social en cours (${GROUPES[s.mobilisation.groupe]?.nom}).` });
  if (fr && (pol.siegesCenseurs ?? 0) >= pol.majorite - 15) alertes.push({ niveau: 'critique', texte: `Censure imminente : ${pol.siegesCenseurs} députés hostiles pour ${pol.majorite} nécessaires.` });
  if (pol.coalition && pol.coalition.satisfaction < 30) alertes.push({ niveau: 'critique', texte: `La coalition vacille : satisfaction du SPD à ${nombre(pol.coalition.satisfaction, 0)}/100.` });
  for (const [id, g] of Object.entries(s.groupes)) if (g.risque > 45) alertes.push({ niveau: '', texte: `Risque de mobilisation élevé chez les ${GROUPES[id].nom.toLowerCase()} (${nombre(g.risque, 0)}/100).` });
  if (partie.evenements.enAttente.length) alertes.push({ niveau: '', texte: `${partie.evenements.enAttente.length} événement(s) à trancher.`, lien: 'evenements' });

  const monde = partie.monde;
  const conflit = { actif: 'conflit en cours', escalade: 'escalade', desescalade: 'désescalade', apaise: 'apaisement' }[monde.conflit];

  return (
    <div className="pile">
      <div className="ligne espace">
        <h2>Tableau de bord</h2>
        <span className="muet petit">Données de départ au {new Date(partie.statique.dateDonnees).toLocaleDateString('fr-FR')}</span>
      </div>
      {conseils?.length > 0 && <Conseiller conseils={conseils} allerA={allerA} />}
      {alertes.length > 0 && (
        <div className="pile">
          {alertes.map((a, i) => (
            <div key={i} className={`alerte ${a.niveau}`} role="status">
              ⚠ {a.texte} {a.lien && <button type="button" className="bouton petit" onClick={() => allerA(a.lien)}>Voir</button>}
            </div>
          ))}
        </div>
      )}

      <div className="grille-tuiles">
        <Tuile libelle="PIB" nombre={m.pibNominal} format={(v) => md(v, 0)} favorableSiHausse info={EXPLICATIONS.pib} serie={serie('pib')} />
        <Tuile libelle="Croissance (1 an)" nombre={m.croissanceAnnuelle} format={(v) => pct(v)} favorableSiHausse variation={`${signe(m.croissanceTrimestrielle, 2)} % ce trimestre`} classe={classeVariation(m.croissanceTrimestrielle)} info={EXPLICATIONS.croissance} serie={serie('croissanceA')} />
        <Tuile libelle="Inflation" nombre={m.inflation} format={(v) => pct(v)} favorableSiHausse={false} variation={`${signe(der.inflation - prec.inflation)} pt`} classe={classeVariation(der.inflation - prec.inflation, false)} info={EXPLICATIONS.inflation} serie={serie('inflation')} />
        <Tuile libelle="Chômage" nombre={m.chomage} format={(v) => pct(v)} favorableSiHausse={false} variation={`${signe(der.chomage - prec.chomage)} pt`} classe={classeVariation(der.chomage - prec.chomage, false)} info={EXPLICATIONS.chomage} serie={serie('chomage')} />
        <Tuile libelle={us ? 'Dette fédérale (détenue par le public)' : 'Dette publique'} nombre={f.detteRatio} format={(v) => `${nombre(v)} %`} favorableSiHausse={false} variation={md(f.dette, 0)} info={EXPLICATIONS.dette} serie={serie('dette')} alerte={f.detteRatio > 130} />
        <Tuile libelle={us ? 'Déficit fédéral' : 'Déficit public'} nombre={f.deficitRatio} format={(v) => `${nombre(v)} %`} favorableSiHausse={false} variation={`${md(f.deficit, 0)} par an`} info={EXPLICATIONS.deficit} serie={serie('deficit')} />
        <Tuile libelle="Charge d'intérêts" nombre={f.interets} format={(v) => md(v, 0)} favorableSiHausse={false} variation={`${nombre(f.interetsRatio)} % du PIB`} info={EXPLICATIONS.interets} serie={serie('interets')} />
        <Tuile libelle="Taux à 10 ans" nombre={f.taux10} format={(v) => pct(v, 2)} favorableSiHausse={false} variation={us ? `prime de risque ${Math.round(f.spread)} pb` : `écart ${Math.round(f.spread)} pb`} info={EXPLICATIONS.taux} serie={serie('taux10')} alerte={f.spread > 250} />
        <Tuile libelle="Popularité" nombre={s.popularite} format={(v) => pct(v, 0)} favorableSiHausse variation={`${signe(der.popularite - prec.popularite)} pt`} classe={classeVariation(der.popularite - prec.popularite)} info={EXPLICATIONS.popularite} serie={serie('popularite')} />
        <Tuile libelle={soutienLibelle} valeur={soutienValeur} info={EXPLICATIONS.soutien} />
        <Tuile libelle="Cohésion sociale" valeur={`${nombre(s.cohesion, 0)}/100`} variation={`risque social ${nombre(s.risqueGlobal, 0)}/100`} info={EXPLICATIONS.cohesion} serie={serie('cohesion')} />
        <Tuile libelle="Émissions" valeur={`${nombre(partie.climat.emissions, 0)} Mt`} variation={partie.climat.objectif2030 ? `objectif 2030 : ${partie.climat.objectif2030} Mt` : 'pas d\'objectif fédéral'} info={EXPLICATIONS.emissions} serie={serie('emissions')} />
        <Tuile libelle="Effort de R&D" valeur={`${nombre(partie.recherche?.effortPctPIB, 2)} %`} info={EXPLICATIONS.innovation} />
        {partie.entreprises && <Tuile libelle={`Bourse (${partie.entreprises.indice.nom})`} nombre={partie.entreprises.indice.valeur} format={(v) => nombre(v, partie.entreprises.indice.base100 ? 1 : 0)} favorableSiHausse variation={`climat des affaires ${nombre(partie.entreprises.climatAffaires, 0)}`} info="Indice boursier (base 100 au départ quand le niveau réel n'a pas été collecté) et climat des affaires (100 = moyenne de long terme). Détails dans l'onglet Entreprises." serie={partie.entreprises.historique.map((x) => x.indice)} />}
        {partie.entreprises && <Tuile libelle="Souveraineté économique" nombre={partie.entreprises.souverainete} format={(v) => `${nombre(v, 0)}/100`} favorableSiHausse info="Contrôle public des actifs stratégiques, actions spécifiques et programmes de l'État stratège (estimation de jeu)." serie={partie.entreprises.historique.map((x) => x.souverainete)} />}
        <Tuile libelle="Influence" nombre={partie.international.influence} format={(v) => `${nombre(v, 0)}/100`} favorableSiHausse info={EXPLICATIONS.influence} serie={serie('influence')} />
      </div>

      <div className="carte petit">
        <strong>Contexte mondial :</strong> énergie à l'indice {nombre(monde.energie, 0)} (100 = avant la guerre en Iran, {conflit}) · {us ? <>taux directeur de la Fed {pct(monde.tauxFed, 3)}</> : <>taux de la BCE {pct(monde.tauxBCE, 2)} · inflation de la zone euro {pct(monde.inflationZE)}</>}.
        {apercu && <span className="muet"> Vos décisions en préparation : déficit à un an {signe(-apercu.unAn.deficitPct, 2)} pt de PIB, chômage {signe(apercu.unAn.chomage, 2)} pt.</span>}
      </div>

      <div className="grille-2">
        <div className="carte"><GraphiqueLignes titre="Dette publique" unite="% du PIB" series={[{ id: 'dette', nom: 'Dette', valeurs: serie('dette') }]} etiquettes={etiquettes} /></div>
        <div className="carte"><GraphiqueLignes titre="Déficit public" unite="% du PIB" series={[{ id: 'deficit', nom: 'Déficit', valeurs: serie('deficit') }]} etiquettes={etiquettes} reference={partie.statique.regles.ue ? { valeur: 3, libelle: 'Seuil européen : 3 %' } : undefined} /></div>
        <div className="carte"><GraphiqueLignes titre="Conjoncture" unite="%" series={[
          { id: 'croissanceA', nom: 'Croissance', valeurs: serie('croissanceA') },
          { id: 'inflation', nom: 'Inflation', valeurs: serie('inflation') },
          { id: 'chomage', nom: 'Chômage', valeurs: serie('chomage') },
        ]} etiquettes={etiquettes} /></div>
        <div className="carte"><GraphiqueLignes titre="Taux d'intérêt" unite="%" decimales={2} series={[
          { id: 'taux10', nom: 'Taux à 10 ans', valeurs: serie('taux10') },
          { id: 'bce', nom: `Taux ${banque}`, valeurs: serie('tauxBCE') },
        ]} etiquettes={etiquettes} /></div>
        <div className="carte"><GraphiqueLignes titre="Popularité par groupe" unite="%" decimales={0} series={Object.keys(GROUPES).map((g) => ({ id: g, nom: GROUPES[g].nom, valeurs: h.map((x) => x.groupes[g]) }))} etiquettes={etiquettes} /></div>
        <div className="carte"><GraphiqueLignes titre="Émissions de gaz à effet de serre" unite="MtCO2e" decimales={0} series={[{ id: 'em', nom: 'Émissions', valeurs: serie('emissions') }]} etiquettes={etiquettes} reference={partie.climat.objectif2030 ? { valeur: partie.climat.objectif2030, libelle: `Objectif 2030 : ${partie.climat.objectif2030} Mt` } : undefined} /></div>
      </div>
    </div>
  );
}
