/**
 * Générateur pseudo-aléatoire reproductible (mulberry32).
 *
 * L'état du générateur est un entier stocké dans la partie : une même partie
 * rejouée avec les mêmes décisions donne exactement les mêmes événements, ce
 * qui permet les tests, la sauvegarde et l'aperçu des décisions.
 */
export function creerAleatoire(graine) {
  let a = graine >>> 0;
  const suivant = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    /** Nombre uniforme dans [0, 1). */
    uniforme: suivant,
    /** Vrai avec la probabilité p. */
    tirage: (p) => suivant() < p,
    /** Loi normale (Box-Muller). */
    normale: (moyenne = 0, ecartType = 1) => {
      const u = Math.max(suivant(), 1e-12);
      const v = suivant();
      return moyenne + ecartType * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    /** Choix pondéré dans une liste [{ poids, ... }]. */
    choixPondere: (liste) => {
      const total = liste.reduce((s, x) => s + (x.poids ?? 1), 0);
      let r = suivant() * total;
      for (const x of liste) {
        r -= x.poids ?? 1;
        if (r <= 0) return x;
      }
      return liste[liste.length - 1];
    },
    /** État courant du générateur, à sauvegarder dans la partie. */
    etat: () => a,
  };
}
