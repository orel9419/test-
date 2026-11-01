/**
 * Succès à débloquer pendant la partie : de petites victoires qui jalonnent le
 * mandat et récompensent les bonnes pratiques (budget adopté sans passage en
 * force, dette stabilisée, réforme menée à bien, grands événements réussis...).
 */

export const SUCCES = [
  { id: 'premier_budget', nom: 'Premier budget', description: 'Faire adopter un budget.', icone: '📜', test: (e) => e.politique.budgetsAdoptes.length > 0 },
  { id: 'sans_493', nom: 'Sans passage en force', description: 'Faire adopter un budget par un vote, sans 49.3 ni shutdown.', icone: '🗳️', test: (e) => e.resultatsTour?.budget?.adopte && e.resultatsTour.budget.procedure !== '49.3' && !e.politique.shutdown },
  { id: 'deficit_3', nom: 'Sous les 3 %', description: 'Ramener le déficit public sous 3 % du PIB.', icone: '📉', test: (e) => e.finances.deficitRatio < 3 },
  { id: 'dette_baisse', nom: 'La dette recule', description: 'Faire baisser le ratio de dette quatre trimestres de suite.', icone: '🏦', test: (e) => { const h = e.historique.slice(-5).map((x) => x.dette); return h.length === 5 && h.every((v, i) => i === 0 || v < h[i - 1]); } },
  { id: 'marches_calmes', nom: 'Confiance des marchés', description: 'Ramener l\'écart de taux sous 50 points de base.', icone: '📈', test: (e) => e.finances.spread < 50 && e.historique[0].spread >= 50 },
  { id: 'chomage', nom: 'Le chômage recule', description: 'Faire baisser le chômage d\'un demi-point depuis le départ.', icone: '👷', test: (e) => e.macro.chomage <= e.historique[0].chomage - 0.5 },
  { id: 'popularite', nom: 'Retour en grâce', description: 'Gagner dix points de popularité depuis le départ.', icone: '❤️', test: (e) => e.social.popularite >= e.historique[0].popularite + 10 },
  { id: 'reforme_retraites', nom: 'Réforme des retraites', description: 'Faire adopter une réforme des retraites.', icone: '👵', test: (e) => e.reformes.actives.some((r) => ['retraites_age', 'retraites_indexation', 'rente_alter', 'social_security'].includes(r.id)) },
  { id: 'referendum', nom: 'Le peuple a tranché', description: 'Gagner un référendum.', icone: '✅', test: (e) => (e.elections?.historique ?? []).some((x) => x.type === 'referendum' && x.victoireCamp) },
  { id: 'election', nom: 'Victoire électorale', description: 'Remporter une élection nationale.', icone: '🏆', test: (e) => (e.elections?.historique ?? []).some((x) => ['legislatives', 'presidentielle'].includes(x.type) && x.victoireCamp) || e.politique.dernierScrutin?.victoire === true || e.politique.presidentielle?.resultat >= 50 },
  { id: 'jeux', nom: 'Des Jeux réussis', description: 'Organiser des Jeux olympiques réussis.', icone: '🥇', test: (e) => e.grandsEvenements?.la28?.reussite === true || e.grandsEvenements?.jo2030?.reussite === true },
  { id: 'souverainete', nom: 'État stratège', description: 'Porter la souveraineté économique à 65/100.', icone: '🛡️', test: (e) => (e.entreprises?.souverainete ?? 0) >= 65 },
  { id: 'climat_affaires', nom: 'Terre d\'investissement', description: 'Porter le climat des affaires à 105.', icone: '🏭', test: (e) => (e.entreprises?.climatAffaires ?? 0) >= 105 },
  { id: 'paix_sociale', nom: 'Paix sociale', description: 'Huit trimestres sans mouvement social.', icone: '🕊️', test: (e) => e.tour >= 7 && !e.journal.some((j) => j.type === 'social' && j.tour > e.tour - 8) },
  { id: 'influence', nom: 'Puissance d\'influence', description: 'Gagner cinq points d\'influence internationale.', icone: '🌍', test: (e) => e.international.influence >= e.international.influenceInitiale + 5 },
  { id: 'emissions', nom: 'Cap climatique', description: 'Réduire les émissions de 5 % depuis le départ.', icone: '🌱', test: (e) => e.climat.emissions <= 0.95 * e.climat.emissions0 },
];

/** Vérifie les succès en fin de tour ; renvoie ceux qui viennent d'être débloqués. */
export function majSucces(e) {
  e.succes ??= [];
  const deja = new Set(e.succes.map((s) => s.id));
  const nouveaux = [];
  for (const s of SUCCES) {
    if (deja.has(s.id)) continue;
    let ok = false;
    try { ok = s.test(e); } catch { ok = false; }
    if (ok) {
      const entree = { id: s.id, nom: s.nom, description: s.description, icone: s.icone, tour: e.tour };
      e.succes.push(entree);
      nouveaux.push(entree);
    }
  }
  return nouveaux;
}
