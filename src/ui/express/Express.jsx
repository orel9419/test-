import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CARTES, FINS, JAUGES, nouvellePartie, choisir, carte as carteParId, apercu, graineDuJour, numeroDefi, majRecords, serie, mention } from '../../express/moteur.js';
import { lirePreference, ecrirePreference } from '../sauvegarde.js';
import { partagerImage, partager, adresseDuJeu } from '../partage.js';
import { imageDeScore } from './imagePartage.js';

const CLE_RECORDS = 'cdg:express';
const SEUIL = 90; // pixels de glissement pour valider un choix

const lireRecords = () => { try { return JSON.parse(lirePreference(CLE_RECORDS) ?? '{}') ?? {}; } catch { return {}; } };
const aujourdhui = () => new Date().toISOString().slice(0, 10);

/**
 * Mode Express : une carte par semaine, glisser à gauche ou à droite.
 * Tenir le plus longtemps possible sans qu'une jauge tombe à 0 ou monte à 100.
 */
export default function Express({ quotidien = false, onQuitter, onChanger }) {
  const date = aujourdhui();
  const [etat, setEtat] = useState(() => nouvellePartie(quotidien ? { graine: graineDuJour(date), quotidien: true, date } : {}));
  const [records, setRecords] = useState(lireRecords);
  const [dx, setDx] = useState(0);
  const [glisse, setGlisse] = useState(false);
  const [sortie, setSortie] = useState(null);
  const [survol, setSurvol] = useState(null);
  const [variations, setVariations] = useState({});
  const [info, setInfo] = useState(null);
  const [message, setMessage] = useState(null);
  const depart = useRef(null);
  const nouveauRecord = useRef(false);

  const c = etat.fin ? null : carteParId(etat.carte);
  const cote = sortie ?? (Math.abs(dx) > 24 ? (dx < 0 ? 'gauche' : 'droite') : survol);
  const points = c && cote ? apercu(c.id, cote) : {};
  const numero = numeroDefi(date);

  const valider = useCallback((sens) => {
    if (!c || sortie) return;
    setSortie(sens);
    setTimeout(() => {
      const suivant = choisir(etat, sens);
      const d = {};
      for (const k of Object.keys(JAUGES)) d[k] = suivant.jauges[k] - etat.jauges[k];
      setVariations(d);
      setInfo(c.info ?? null);
      if (suivant.fin) {
        const avant = lireRecords();
        nouveauRecord.current = suivant.semaine > (avant.meilleur ?? 0);
        const r = majRecords(avant, suivant);
        ecrirePreference(CLE_RECORDS, JSON.stringify(r));
        setRecords(r);
      }
      setEtat(suivant);
      setSortie(null);
      setDx(0);
      setSurvol(null);
    }, 230);
  }, [c, sortie, etat]);

  // Clavier : flèches gauche et droite
  useEffect(() => {
    const touche = (ev) => {
      if (ev.key === 'ArrowLeft') valider('gauche');
      if (ev.key === 'ArrowRight') valider('droite');
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [valider]);
  useEffect(() => { const t = setTimeout(() => setVariations({}), 900); return () => clearTimeout(t); }, [variations]);

  const surDebut = (ev) => { depart.current = ev.clientX; setGlisse(true); ev.currentTarget.setPointerCapture?.(ev.pointerId); };
  const surMouvement = (ev) => { if (depart.current !== null) setDx(ev.clientX - depart.current); };
  const surFin = () => {
    if (depart.current === null) return;
    depart.current = null;
    setGlisse(false);
    if (dx <= -SEUIL) valider('gauche'); else if (dx >= SEUIL) valider('droite'); else setDx(0);
  };

  const rejouer = (q = quotidien) => { onChanger?.(q); setEtat(nouvellePartie(q ? { graine: graineDuJour(date), quotidien: true, date } : {})); setInfo(null); setMessage(null); };
  const lien = `${adresseDuJeu() ?? ''}${quotidien ? '?defi' : '?express'}`;
  const partagerScore = async () => {
    const image = imageDeScore(etat, { numero: quotidien ? numero : null, adresse: lien });
    const texte = `${quotidien ? `Défi du jour n° ${numero} : ` : ''}j'ai tenu ${etat.semaine} semaine${etat.semaine > 1 ? 's' : ''} à Matignon 🇫🇷 Et toi ?`;
    setMessage(await partagerImage(image, `matignon-${etat.semaine}-semaines.png`, texte, lien));
  };
  const defier = async () => setMessage(await partager({ titre: 'Mode Express', texte: `Défi du jour n° ${numero} : combien de semaines tiendras-tu à Matignon ? 🇫🇷`, url: `${adresseDuJeu() ?? ''}?defi` }));

  const transformation = sortie
    ? `translateX(${sortie === 'gauche' ? -130 : 130}%) rotate(${sortie === 'gauche' ? -18 : 18}deg)`
    : `translateX(${dx}px) rotate(${dx / 18}deg)`;
  const opaciteChoix = Math.min(1, Math.abs(dx) / SEUIL);
  const finsConnues = new Set(records.fins ?? []);
  const serieJours = serie(records, date);

  return (
    <div className="express">
      <header className="express-haut">
        <button type="button" className="express-bouton-rond" onClick={onQuitter} aria-label="Quitter le mode Express">✕</button>
        <div className="express-titre">
          <strong>Semaine {etat.semaine + (etat.fin ? 0 : 1)}</strong>
          <span>{quotidien ? `Défi du jour n° ${numero}` : 'Mode Express'} · record {records.meilleur ?? 0}</span>
        </div>
        <button type="button" className="express-bouton-rond" onClick={defier} aria-label="Défier un ami">📣</button>
      </header>

      <div className="express-jauges" role="group" aria-label="Jauges">
        {Object.entries(JAUGES).map(([k, j]) => {
          const v = etat.jauges[k];
          const d = variations[k] ?? 0;
          const danger = v <= 15 || v >= 85;
          return (
            <div key={k} className={`jauge-express ${danger ? 'danger' : ''}`} role="meter" aria-label={j.nom} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)} title={j.nom}>
              <span className={`apercu-point ${points[k] ?? ''}`} aria-hidden="true" />
              <div className="tube"><div className="niveau" style={{ height: `${v}%` }} /></div>
              <span className="jauge-icone" aria-hidden="true">{j.icone}</span>
              <span className="jauge-nom">{j.nom.split(' ')[0]}</span>
              {Math.abs(d) >= 1 && <span className={`variation-express ${d > 0 ? 'haut' : 'bas'}`} aria-hidden="true">{d > 0 ? '▲' : '▼'}</span>}
            </div>
          );
        })}
      </div>

      {c && (
        <>
          <div className="express-zone">
            <div
              key={c.id}
              className={`carte-express ${glisse ? 'glisse' : ''} ${sortie ? 'sort' : 'entre'}`}
              style={{ transform: transformation }}
              onPointerDown={surDebut} onPointerMove={surMouvement} onPointerUp={surFin} onPointerCancel={surFin}
              role="group" aria-label={`${c.perso.role} : ${c.texte}`}
            >
              <div className="choix-surimpression gauche" style={{ opacity: dx < 0 ? opaciteChoix : 0 }}>{c.gauche.label}</div>
              <div className="choix-surimpression droite" style={{ opacity: dx > 0 ? opaciteChoix : 0 }}>{c.droite.label}</div>
              <div className="carte-express-perso"><span aria-hidden="true">{c.perso.icone}</span></div>
              <div className="carte-express-role">{c.perso.role}</div>
              <p className="carte-express-texte">{c.texte}</p>
              <div className="carte-express-aide" aria-hidden="true">← glissez →</div>
            </div>
          </div>
          <div className="express-choix">
            {['gauche', 'droite'].map((s) => (
              <button key={s} type="button" className={`express-bouton-choix ${s}`} onClick={() => valider(s)}
                onMouseEnter={() => setSurvol(s)} onMouseLeave={() => setSurvol(null)} onFocus={() => setSurvol(s)} onBlur={() => setSurvol(null)}>
                {s === 'gauche' ? '← ' : ''}{c[s].label}{s === 'droite' ? ' →' : ''}
              </button>
            ))}
          </div>
          {info && <div className="express-info" role="status"><strong>💡 Le saviez-vous ?</strong> {info}</div>}
        </>
      )}

      {etat.fin && (
        <div className="express-fin entre">
          <div className="express-fin-icone" aria-hidden="true">{FINS[etat.fin].icone}</div>
          <h2>{FINS[etat.fin].titre}</h2>
          <p>{FINS[etat.fin].texte}</p>
          <div className="express-score"><strong>{etat.semaine}</strong> semaine{etat.semaine > 1 ? 's' : ''} à Matignon</div>
          <div className="express-mention">{mention(etat.semaine)}{nouveauRecord.current ? ' · 🏆 Nouveau record !' : ` · record : ${records.meilleur}`}</div>
          {quotidien && <div className="express-serie">📅 Défi du jour n° {numero}{serieJours > 1 ? ` · ${serieJours} jours d'affilée 🔥` : ''}</div>}
          <div className="express-fins" aria-label="Fins découvertes">
            <span>Fins découvertes : {finsConnues.size}/{Object.keys(FINS).length}</span>
            <div>{Object.entries(FINS).map(([id, f]) => <span key={id} title={finsConnues.has(id) ? f.titre : 'Fin à découvrir'} className={finsConnues.has(id) ? 'connue' : ''}>{finsConnues.has(id) ? f.icone : '🔒'}</span>)}</div>
          </div>
          {info && <div className="express-info"><strong>💡 Le saviez-vous ?</strong> {info}</div>}
          <div className="express-actions">
            <button type="button" className="bouton principal grand" onClick={partagerScore}>📤 Partager mon score</button>
            <button type="button" className="bouton grand" onClick={() => rejouer(false)}>↻ Rejouer</button>
            {!quotidien && <button type="button" className="bouton grand" onClick={() => rejouer(true)}>📅 Défi du jour n° {numero}</button>}
            <button type="button" className="bouton grand" onClick={onQuitter}>🏛️ Jouer la version complète</button>
          </div>
          {message && <p className="petit" role="status">{message}</p>}
        </div>
      )}
      <p className="express-pied">{CARTES.length} situations inspirées de l'actualité. Les entreprises citées n'ont pas fait ces demandes : ce sont des scénarios de jeu. Les « Le saviez-vous ? » sont réels.</p>
    </div>
  );
}
