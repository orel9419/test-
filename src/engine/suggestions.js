/**
 * « Pour commencer » : trois réformes suggérées au joueur selon la situation,
 * pour répondre à la question d'un nouveau venu devant 150 réformes : par où
 * commencer ? Les suggestions ne sont pas des recommandations politiques :
 * elles montrent trois pistes contrastées (une mesure populaire qui peut
 * passer, une qui améliore les comptes, une adaptée à l'urgence du moment),
 * chacune avec la raison du choix. Calcul léger (pas de simulation).
 */
import { reformesDisponibles, effetOpinionReforme, trouverReforme } from './reformes.js';
import { voterTexte } from './politique.js';

/** Axes politiques d'une réforme pour une option (axes généraux complétés par ceux de l'option). */
function axes(def, option) {
  return { ...(def?.axes ?? {}), ...(def?.axesParOption?.[option] ?? {}) };
}

/**
 * @param {object} e état de la partie
 * @returns {Array<{ id, option, raison, opinion, votable }>} au plus trois suggestions, d'id distincts
 */
export function suggestionsReformes(e) {
  const candidates = [];
  for (const r of reformesDisponibles(e)) {
    if (!r.disponible || r.active) continue;
    const def = trouverReforme(r.id);
    const option = r.options[0].id;
    let opinion = 0;
    try { opinion = effetOpinionReforme(e, r.id, option); } catch { opinion = 0; }
    let votable = true;
    if (e.pays === 'france' && r.vote) {
      try {
        const v = voterTexte(e, [{ id: r.id, option }]);
        votable = r.majoriteRenforcee ? v.pour >= 0.6 * (v.pour + v.contre) : v.adopte;
      } catch { votable = false; }
    }
    candidates.push({ id: r.id, option, nom: r.nom, categorie: r.categorie, opinion, votable, axes: axes(def, option) });
  }
  const pris = new Set();
  const res = [];
  const retenir = (c, raison) => { if (c && !pris.has(c.id)) { pris.add(c.id); res.push({ id: c.id, option: c.option, raison, opinion: c.opinion, votable: c.votable }); } };
  const meilleur = (liste, cle) => liste.slice().sort((a, b) => cle(b) - cle(a))[0];
  const votables = candidates.filter((c) => c.votable);

  const voteModelise = e.pays === 'france'; // ailleurs, le jeu ne prévoit pas le vote texte par texte
  // 1. Une mesure populaire qui peut passer
  retenir(meilleur(votables.filter((c) => c.opinion >= 1), (c) => c.opinion), voteModelise ? 'Populaire, et une majorité se dégage : un bon premier texte.' : 'La mesure la mieux accueillie par l\'opinion : un bon premier texte.');

  // 2. Une mesure qui améliore les comptes publics, sans être trop impopulaire
  const rigueur = votables.filter((c) => !pris.has(c.id) && (c.axes.rigueur ?? 0) >= 0.3 && c.opinion > -3);
  const dette = e.finances?.detteRatio;
  const deficit = e.finances?.deficitRatio;
  retenir(meilleur(rigueur, (c) => (c.axes.rigueur ?? 0) * 2 + c.opinion / 5), `Réduit le déficit sans soulever le pays${Number.isFinite(dette) ? ` : la dette est à ${Math.round(dette)} % du PIB${Number.isFinite(deficit) ? `, le déficit à ${deficit.toFixed(1).replace('.', ',')} %` : ''}` : ''}.`);

  // 3. Selon l'urgence du moment
  const f = e.finances, soc = e.social;
  if (f.spread > 120 || f.crise) {
    const regles = votables.filter((c) => !pris.has(c.id) && (['regles', 'dette'].includes(c.categorie) || (c.axes.rigueur ?? 0) >= 0.6));
    retenir(meilleur(regles, (c) => (c.axes.rigueur ?? 0) + c.opinion / 10), `Les marchés s'inquiètent (écart de taux ${Math.round(f.spread)} pb) : une règle budgétaire crédible les rassure.`);
  } else if ((soc?.risqueGlobal ?? 0) > 0.45) {
    const apaiser = votables.filter((c) => !pris.has(c.id) && (c.axes.social ?? 0) >= 0.3 && c.opinion > 0);
    retenir(meilleur(apaiser, (c) => c.opinion), `Le climat social se tend (risque ${Math.round(soc.risqueGlobal * 100)} %) : une mesure sociale désamorce la colère.`);
  } else if ((e.macro?.chomage ?? 0) > 7.5) {
    const emploi = votables.filter((c) => !pris.has(c.id) && ((c.axes.travail ?? 0) >= 0.5 || (c.axes.marche ?? 0) >= 0.5) && c.opinion > -4);
    retenir(meilleur(emploi, (c) => (c.axes.travail ?? 0) + (c.axes.marche ?? 0) + c.opinion / 10), `Le chômage est à ${e.macro.chomage.toFixed(1)} % : une réforme du travail ou de la concurrence crée des emplois à terme.`);
  }
  // Compléments si une piste manque : les mesures les plus populaires restantes (votables d'abord)
  for (const c of candidates.slice().sort((a, b) => (b.votable - a.votable) || (b.opinion - a.opinion))) {
    if (res.length >= 3) break;
    retenir(c, c.votable ? 'Bien accueillie par l\'opinion.' : 'Bien accueillie par l\'opinion, mais sans majorité acquise : à négocier ou à soumettre au référendum.');
  }
  return res.slice(0, 3);
}
