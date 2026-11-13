import React, { useState } from 'react';
import Info from '../composants/Info.jsx';
import { Snle } from '../composants/Illustrations.jsx';
import Visionneuse3D from '../3d/Visionneuse3D.jsx';
import { resumeDefense } from '../../engine/index.js';
import { CHANCE_ESSAI_M51, COUT_ESSAI_M51 } from '../../engine/defense.js';
import { DISSUASION_EUROPE, SOURCES_DEFENSE } from '../../data/defense.js';
import { md } from '../format.js';
import { libelleTrimestre } from '../../engine/calendrier.js';
import { majDefense } from './Armees.jsx';

/** Dissuasion nucléaire : composantes, SNLE 3G, et dimension européenne (domaine réservé). */
export default function Dissuasion({ partie, decisions, majDecisions, allerA }) {
  const [coupe, setCoupe] = useState(true);
  const r = resumeDefense(partie);
  if (partie.pays !== 'france') {
    return (
      <div className="pile">
        <h2>Dissuasion nucléaire</h2>
        <Snle coupe={coupe} nom={partie.pays === 'etatsUnis' ? 'Sous-marin de la classe Columbia' : 'Sous-marin lanceur d\'engins'} />
        <p className="petit">{partie.pays === 'allemagne'
          ? 'L\'Allemagne ne possède pas l\'arme nucléaire. Elle participe au partage nucléaire de l\'OTAN : des bombes américaines sont stockées sur son sol et ses avions (bientôt des F-35A, à Büchel) peuvent les emporter, sur décision américaine. Le débat sur une protection européenne, avec la France et le Royaume-Uni, s\'est ouvert en 2025.'
          : 'La triade nucléaire américaine : missiles intercontinentaux (programme Sentinel), sous-marins lanceurs d\'engins (classe Columbia en construction) et bombardiers (B-21). Le président seul peut ordonner l\'emploi de l\'arme nucléaire.'}</p>
        <button type="button" className="bouton" onClick={() => setCoupe((c) => !c)}>{coupe ? 'Masquer la vue en coupe' : 'Afficher la vue en coupe'}</button>
      </div>
    );
  }
  const d = decisions.defense ?? {};
  const choix = d.dissuasion ?? r.dissuasion;
  const snle = r.programmes.find((p) => p.id === 'snle3g');
  const jalon = snle?.jalonsEffectifs[0];
  // Scène de patrouille : le SNLE 3G dès qu'il est en service dans la partie
  const snle3g = (r.capacites?.snle3g ?? 0) >= 1;
  const dernierEssai = r.essaisM51.at(-1);
  const attente = Math.max(0, r.prochainEssaiM51 - partie.tour);
  const sourcesM51 = ['m51Vigilant', 'm51Biscarrosse', 'm51Terrible', 'm51Echec'];
  return (
    <div className="pile">
      <h2>Dissuasion nucléaire</h2>
      <p className="petit muet">Clé de voûte de la défense française depuis les années 1960. Le président de la République est seul à pouvoir ordonner l'emploi de l'arme nucléaire. Le coût de la dissuasion représente environ 13 % de la loi de programmation militaire 2024-2030, soit environ 7,7 Md€ par an en moyenne.</p>

      <div className="carte pile">
        <div className="ligne espace">
          <h3 style={{ margin: 0 }}>La composante océanique : les SNLE</h3>
          <button type="button" className="bouton" onClick={() => setCoupe((c) => !c)} aria-pressed={coupe}>{coupe ? 'Masquer la vue en coupe' : 'Afficher la vue en coupe'}</button>
        </div>
        <Visionneuse3D modele="snle" hauteur={340} />
        {coupe && <Snle coupe nom="SNLE de la classe Le Triomphant" />}
        <ul className="petit" style={{ margin: 0, paddingLeft: '1.1rem' }}>
          <li><strong>4 SNLE</strong> (Le Triomphant, Le Téméraire, Le Vigilant, Le Terrible), mis en service de 1997 à 2010. Basés à l'Île Longue, près de Brest.</li>
          <li><strong>Permanence à la mer</strong> : au moins un SNLE en patrouille, indétectable, depuis 1972. C'est la garantie de pouvoir riposter en toutes circonstances (« frappe en second »).</li>
          <li><strong>16 missiles M51</strong> par sous-marin, d'une portée de plusieurs milliers de kilomètres.</li>
          <li><strong>SNLE de 3e génération</strong> : construction de L'Invincible lancée à Cherbourg le 20 mars 2024 ; {jalon ? `entrée en service prévue ${libelleTrimestre({ annee: jalon.annee, t: jalon.t })}${jalon.decalage > 0 ? ` (retard de ${jalon.decalage} trimestres)` : ''}` : 'vers 2035'}. Le plus grand sous-marin jamais construit en France.</li>
        </ul>
        <button type="button" className="lien petit" onClick={() => allerA?.('armees')}>Décider du rythme du programme SNLE 3G (onglet Armées) →</button>
      </div>

      <div className="carte pile">
        <h3 style={{ margin: 0 }}>🌊 En patrouille : le SNLE, son escorte et le tir d'essai du M51</h3>
        <p className="tres-petit muet" style={{ margin: 0 }}>Scène tirée de votre partie ({snle3g ? 'le SNLE de 3e génération L\'Invincible est en service' : 'SNLE de la classe Le Triomphant'}) : un sous-marin nucléaire d'attaque protège la patrouille, une FREMM anti-sous-marine et son Caïman Marine traquent les sous-marins adverses, le bâtiment d'essais et de mesures Monge suit les tirs. Ouvrez les trappes, puis lancez le tir d'essai ; vue « Tir (vue large) » pour suivre la montée.</p>
        <Visionneuse3D modele="dissuasion" hauteur={420} donnees={{ snle3g, nom: snle3g ? 'L\'Invincible' : (dernierEssai?.lanceur ?? 'Le Téméraire') }} />
      </div>

      <div className="carte pile">
        <h3 style={{ margin: 0 }}>🚀 Tir d'essai d'un missile M51 <Info texte="Les tirs d'essai, sans charge nucléaire, valident les missiles et chaque SNLE après son grand carénage ; ils montrent aussi à tous que la dissuasion reste crédible. Le missile retombe en Atlantique Nord, à plusieurs centaines de kilomètres de toute côte. Chances, coût et effets dans le jeu : hypothèses." /></h3>
        <p className="petit" style={{ margin: 0 }}>Dernier essai réel : le <strong>6 octobre 2026</strong>, Le Vigilant a tiré pour la première fois un M51.3 en plongée, au large du Finistère, en présence du président, suivi par le Monge. Avant lui : Le Terrible le 19 avril 2023, et un M51.3 tiré depuis le centre d'essais de Biscarrosse le 18 novembre 2023. Le seul échec public date du 5 mai 2013 : le missile tiré par Le Vigilant s'était autodétruit en baie d'Audierne.</p>
        {r.domaineReserve && <p className="petit alerte" style={{ margin: 0 }}>Domaine réservé du président de la République : en tant que Premier ministre, vous ne pouvez pas ordonner de tir.</p>}
        <div className="ligne" style={{ gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className={`bouton ${d.essaiM51 ? 'principal' : ''}`} aria-pressed={!!d.essaiM51} disabled={r.domaineReserve || (attente > 0 && !d.essaiM51)} onClick={() => majDefense(majDecisions, (x) => ({ essaiM51: !x.essaiM51 }))}>{d.essaiM51 ? '✔ Tir ordonné (à la validation du trimestre) · annuler' : '🚀 Ordonner un tir d\'essai'}</button>
          {attente > 0 && <span className="tres-petit muet">Un tir par an au plus : prochain possible dans {attente} trimestre(s).</span>}
        </div>
        <span className="tres-petit muet">Coût : environ {md(COUT_ESSAI_M51, 1)} (missile, campagne de mesure) · chances de succès : {Math.round(CHANCE_ESSAI_M51 * 100)} % · réussi, il renforce l'influence de la France ; raté, il impose une enquête et lui en coûte un peu.</span>
        {r.essaisM51.length > 0 && (
          <ul className="tres-petit" style={{ margin: 0, paddingLeft: '1rem' }}>
            {r.essaisM51.slice().reverse().map((x) => <li key={x.tour}>{x.trimestre} · SNLE {x.lanceur} : <span className={x.succes ? 'positif' : 'negatif'}>{x.succes ? 'succès' : 'échec (autodestruction)'}</span></li>)}
          </ul>
        )}
        <p className="tres-petit muet" style={{ margin: 0 }}>Sources : {sourcesM51.map((cle, i) => <span key={cle}>{i > 0 && ' · '}<a href={SOURCES_DEFENSE[cle].url} target="_blank" rel="noreferrer">{SOURCES_DEFENSE[cle].titre}</a></span>)}</p>
      </div>

      <div className="carte pile">
        <h3 style={{ margin: 0 }}>La composante aéroportée</h3>
        <Visionneuse3D modele="rafale" hauteur={320} />
        <p className="petit" style={{ margin: 0 }}>Des Rafale des Forces aériennes stratégiques et de la Marine (depuis le porte-avions) emportent le missile nucléaire ASMPA-R ; son successeur, l'ASN4G (hypersonique), est en développement. Deux composantes plutôt qu'une : des modes de pénétration différents, et la possibilité d'un « avertissement » démonstratif.</p>
      </div>

      <div className="carte pile">
        <h3 style={{ margin: 0 }}>Dimension européenne de la dissuasion <Info texte="Le président a proposé en 2020 puis en 2025 un dialogue stratégique avec les Européens sur le rôle de la dissuasion française. La décision d'emploi reste exclusivement française." /></h3>
        {r.domaineReserve && <p className="petit alerte" style={{ margin: 0 }}>Domaine réservé du président de la République : en tant que Premier ministre, vous ne pouvez pas décider de la doctrine. Jouez le président (accueil, « Personnaliser la partie ») pour trancher.</p>}
        <div className="pile" style={{ gap: '0.35rem' }}>
          {DISSUASION_EUROPE.map((o) => (
            <label key={o.id} className={`option-programme ${choix === o.id ? 'active' : ''}`}>
              <input type="radio" name="dissuasion" checked={choix === o.id} disabled={r.domaineReserve} onChange={() => majDefense(majDecisions, () => ({ dissuasion: o.id }))} />
              <span><strong className="petit">{o.nom}</strong>{r.dissuasion === o.id && <span className="etiquette" style={{ marginLeft: 6 }}>en vigueur</span>}<br /><span className="tres-petit muet">{o.description}</span></span>
            </label>
          ))}
        </div>
      </div>
      <p className="tres-petit muet">Sources : <a href={SOURCES_DEFENSE.snle.url} target="_blank" rel="noreferrer">{SOURCES_DEFENSE.snle.titre}</a> · <a href={SOURCES_DEFENSE.dissuasion.url} target="_blank" rel="noreferrer">{SOURCES_DEFENSE.dissuasion.titre}</a>. Les dessins sont des illustrations stylisées, pas des plans.</p>
    </div>
  );
}
