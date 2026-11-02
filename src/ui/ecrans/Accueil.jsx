import React, { useEffect, useState } from 'react';
import { etatInstallation, suivreInstallation, installer } from '../installation.js';
import { PAYS, PAYS_A_VENIR } from '../donnees.js';
import { MODES } from '../../model/parametres.js';
import { pct } from '../format.js';

/** Écran d'accueil : choix du pays, du mode et du calendrier. */
export default function Accueil({ onDemarrer, sauvegarde, onReprendre, onImporter, onColler, theme, onTheme, message }) {
  const [pays, setPays] = useState('france');
  const [mode, setMode] = useState('intermediaire');
  const [calendrier, setCalendrier] = useState('horizon2050');
  const [role, setRole] = useState('chef_gouvernement');
  const [intensite, setIntensite] = useState('accentuee');
  const d = PAYS[pays].donnees;
  return (
    <div className="accueil pile">
      <div className="ligne espace">
        <div>
          <h1>🏛️ Chef de gouvernement</h1>
          <p className="muet">Gouvernez un pays réel à partir de sa situation au {new Date(d.meta.derniere_mise_a_jour).toLocaleDateString('fr-FR')} : budget, dette, réformes, Parlement, Europe et diplomatie.</p>
        </div>
        <button type="button" className="bouton" onClick={onTheme} aria-label="Changer de thème">{theme === 'dark' ? '☀︎ Thème clair' : '☾ Thème sombre'}</button>
      </div>

      <Installation />
      {message && <div className="alerte" role="status">{message}</div>}
      {sauvegarde && (
        <div className="carte ligne espace">
          <span>Partie en cours : {PAYS[sauvegarde.partie.pays]?.donnees.meta.nom}, tour {sauvegarde.partie.tour} (sauvegardée le {new Date(sauvegarde.date).toLocaleString('fr-FR')}).</span>
          <button type="button" className="bouton principal" onClick={onReprendre}>Reprendre</button>
        </div>
      )}

      <h2>1. Choisissez un pays</h2>
      <div className="choix-pays">
        {Object.entries(PAYS).map(([id, p]) => {
          const m = p.donnees.macro, fp = p.donnees.finances_publiques;
          return (
            <button type="button" key={id} className={`carte carte-pays ${pays === id ? 'choisie' : ''}`} onClick={() => setPays(id)} aria-pressed={pays === id}>
              <div className="ligne"><span className="drapeau">{p.donnees.meta.drapeau}</span><strong style={{ fontSize: '1.15rem' }}>{p.donnees.meta.nom}</strong></div>
              <p className="petit muet">{p.regimeLibelle} · {p.role} · mandat de {p.mandat}</p>
              {id === 'etatsUnis'
                ? <p className="petit">Dette fédérale détenue par le public {pct(fp.dette_detenue_public.valeur / m.pib_nominal.valeur * 100, 0)} du PIB · déficit fédéral {pct(fp.deficit_md.valeur / m.pib_nominal.valeur * 100)} · chômage {pct(m.chomage.valeur)}</p>
                : <p className="petit">Dette {pct(fp.dette_pct_pib.valeur)} du PIB · déficit {pct(fp.deficit_pct_pib.valeur)} (2025) · chômage {pct(m.chomage_bit?.valeur ?? m.chomage_national_ba?.valeur)}{m.chomage_bit?.valeur ? '' : ' (définition nationale)'}</p>}
              <p className="petit muet">{p.donnees.politique.dossiers_chauds.slice(0, 2).join(' · ')}</p>
            </button>
          );
        })}
      </div>
      <p className="petit muet">Bientôt : {PAYS_A_VENIR.map((p) => `${p.drapeau} ${p.nom}`).join(' · ')}</p>

      <h2>2. Mode de jeu</h2>
      <div className="choix-pays">
        {Object.entries(MODES).map(([id, m]) => (
          <button type="button" key={id} className={`carte carte-pays mode-${id} ${mode === id ? 'choisie' : ''}`} onClick={() => setMode(id)} aria-pressed={mode === id}>
            <div className="ligne"><span className="drapeau" aria-hidden="true">{{ facile: '🌱', intermediaire: '⚖️', expert: '🔥' }[id]}</span><strong style={{ fontSize: '1.1rem' }}>{m.nom}</strong></div>
            <p className="petit muet">{m.description}</p>
            <ul className="tres-petit" style={{ margin: 0, paddingLeft: '1rem' }}>
              <li>Conseiller : {m.conseiller ? 'oui' : 'non'}</li>
              <li>Défaites : {m.defaitesActives ? 'actives' : 'désactivées'}</li>
              <li>Prévisions de vote : {m.previsionsExactes ? 'exactes' : 'incertaines'}</li>
              <li>Événements simultanés : {m.maxEvenements} au plus</li>
            </ul>
          </button>
        ))}
      </div>

      <h2>3. Durée et calendrier</h2>
      <div className="choix-pays">
        <button type="button" className={`carte carte-pays ${calendrier === 'horizon2050' ? 'choisie' : ''}`} onClick={() => setCalendrier('horizon2050')} aria-pressed={calendrier === 'horizon2050'}>
          <strong>Jusqu'en 2050</strong>
          <p className="petit muet">97 trimestres. Toutes les élections ont lieu à leur date ({pays === 'france' ? 'présidentielles 2027, 2032, 2037, 2042 et 2047' : pays === 'etatsUnis' ? 'présidentielles tous les 4 ans, mi-mandat entre deux' : 'Bundestag tous les 4 ans à partir de 2029'}) : perdre le pouvoir arrête la partie, mais vous pourrez continuer en bac à sable.{pays === 'france' ? ' Un gouvernement renversé est remplacé par un autre de votre camp.' : ''} Objectifs de long terme : dette, climat, retraites. C'est là que les réformes lentes (âge de départ, capitalisation, transition) montrent leurs effets.</p>
        </button>
        <button type="button" className={`carte carte-pays ${calendrier === 'reel' ? 'choisie' : ''}`} onClick={() => setCalendrier('reel')} aria-pressed={calendrier === 'reel'}>
          <strong>Un mandat, calendrier réel</strong>
          <p className="petit muet">{pays === 'france' ? 'La présidentielle a lieu en avril 2027 (3ᵉ tour). Si votre camp la perd, la partie s\'arrête.' : pays === 'etatsUnis' ? 'Mi-mandat le 3 novembre 2026, présidentielle le 7 novembre 2028 : le président sortant ne peut pas se représenter, le scrutin juge votre bilan.' : 'Les élections fédérales ont lieu au début de 2029.'}</p>
        </button>
        <button type="button" className={`carte carte-pays ${calendrier === 'mandat_complet' ? 'choisie' : ''}`} onClick={() => setCalendrier('mandat_complet')} aria-pressed={calendrier === 'mandat_complet'}>
          <strong>Un mandat complet</strong>
          <p className="petit muet">On suppose que votre camp conserve le pouvoir : l'élection est jugée en fin de mandat sur votre bilan.</p>
        </button>
      </div>

      <h2>4. Effets des réformes</h2>
      <div className="choix-pays">
        <button type="button" className={`carte carte-pays ${intensite === 'accentuee' ? 'choisie' : ''}`} onClick={() => setIntensite('accentuee')} aria-pressed={intensite === 'accentuee'}>
          <strong>Accentués</strong>
          <p className="petit muet">Effets des réformes doublés sur l'emploi, la croissance, les émissions et l'influence ; réactions de l'opinion amplifiées de 40 %. Le coût budgétaire reste réaliste. Idéal pour voir où mènent vos choix.</p>
        </button>
        <button type="button" className={`carte carte-pays ${intensite === 'realiste' ? 'choisie' : ''}`} onClick={() => setIntensite('realiste')} aria-pressed={intensite === 'realiste'}>
          <strong>Réalistes</strong>
          <p className="petit muet">Calibrage prudent, proche des études économiques : les réformes structurelles produisent des effets modestes et lents.</p>
        </button>
      </div>

      {pays === 'france' && (
        <>
          <h2>5. Votre rôle</h2>
          <div className="choix-pays">
            <button type="button" className={`carte carte-pays ${role === 'chef_gouvernement' ? 'choisie' : ''}`} onClick={() => setRole('chef_gouvernement')} aria-pressed={role === 'chef_gouvernement'}>
              <strong>Premier ministre (Matignon)</strong>
              <p className="petit muet">Vous dirigez le gouvernement et faites voter vos textes. Une motion de censure peut vous renverser{calendrier === 'horizon2050' ? ' (vous êtes alors remplacé par un autre Premier ministre de votre camp)' : ' et mettre fin à la partie'}.</p>
            </button>
            <button type="button" className={`carte carte-pays ${role === 'president' ? 'choisie' : ''}`} onClick={() => setRole('president')} aria-pressed={role === 'president'}>
              <strong>Président de la République (Élysée)</strong>
              <p className="petit muet">Vous nommez le Premier ministre (de votre camp, de droite, de gauche ou un technicien), ce qui change les majorités à l'Assemblée. Une censure renverse le gouvernement, pas vous. Vous pouvez dissoudre l'Assemblée et convoquer un référendum. En 2027, vous ne pouvez pas vous représenter (deux mandats consécutifs au plus) : votre camp présente un candidat.</p>
            </button>
          </div>
        </>
      )}

      <div className="ligne">
        <button type="button" className="bouton principal" style={{ padding: '0.8rem 1.6rem', fontSize: '1.05rem' }} onClick={() => onDemarrer({ pays, mode, calendrier, intensite, role: pays === 'france' ? role : 'chef_gouvernement' })}>Prendre ses fonctions</button>
        <label className="bouton">Importer une partie (JSON)<input type="file" accept="application/json" onChange={onImporter} hidden /></label>
        {onColler && <button type="button" className="bouton" onClick={onColler}>Coller une sauvegarde</button>}
      </div>

      <div className="carte petit muet">
        <strong>Comment jouer.</strong> Un tour = un trimestre. À chaque tour, répartissez le budget entre les ministères, fixez les impôts, proposez des réformes (avec leurs compensations), pilotez les participations de l'État et les fleurons, agissez à l'international, préparez les grands rendez-vous et tranchez les événements, puis validez (Ctrl + Entrée). Les données de départ sont sourcées (onglet « Données et sources ») ; les paramètres du modèle sont des hypothèses documentées.
      </div>
    </div>
  );
}

/** Proposition d'installer le jeu comme une application (écran d'accueil, plein écran, hors connexion). */
function Installation() {
  const [etat, setEtat] = useState(etatInstallation);
  const [ferme, setFerme] = useState(false);
  useEffect(() => suivreInstallation(() => setEtat(etatInstallation())), []);
  if (ferme || etat.installee || etat.integree || (!etat.possible && !etat.ios)) return null;
  return (
    <div className="carte installation ligne espace">
      <div className="ligne" style={{ flexWrap: 'nowrap' }}>
        <img src="./icones/icone-192.png" alt="" width="44" height="44" style={{ borderRadius: 10 }} />
        <div>
          <strong>Installer l'application</strong>
          <div className="petit muet">{etat.ios ? 'Sur iPhone ou iPad : touchez le bouton Partager, puis « Sur l\'écran d\'accueil ».' : 'Icône sur l\'écran d\'accueil, plein écran et jeu hors connexion.'}</div>
        </div>
      </div>
      <div className="ligne">
        {etat.possible && <button type="button" className="bouton principal" onClick={() => installer()}>Installer</button>}
        <button type="button" className="bouton" onClick={() => setFerme(true)}>Plus tard</button>
      </div>
    </div>
  );
}
