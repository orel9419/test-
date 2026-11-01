/** Mise en forme des nombres en français. */
const nf = (n) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: n, maximumFractionDigits: n });
const cache = {};
export function nombre(x, decimales = 1) {
  if (x === null || x === undefined || Number.isNaN(x)) return '—';
  cache[decimales] ??= nf(decimales);
  return cache[decimales].format(x);
}
export const pct = (x, d = 1) => `${nombre(x, d)} %`;

/** Monnaie de la partie en cours (€ ou $), fixée au chargement d'une partie. */
let deviseCourante = '€';
export function definirDevise(d) { deviseCourante = d ?? '€'; }
export const devise = () => deviseCourante;
export const md = (x, d = 1) => `${nombre(x, d)} Md${deviseCourante}`;
export const euros = (x) => `${nombre(x, 0)} ${deviseCourante}`;
/** Variation signée (+1,2 / −0,4). */
export function signe(x, d = 1, suffixe = '') {
  if (x === null || x === undefined || Number.isNaN(x)) return '—';
  const s = nombre(Math.abs(x), d);
  const zero = Number(s.replace(',', '.').replace(/\s/g, '')) === 0;
  return `${zero ? '' : x > 0 ? '+' : '−'}${s}${suffixe}`;
}
/** Classe CSS selon qu'une variation est favorable ou non. */
export function classeVariation(x, favorableSiPositif = true) {
  if (!x || Math.abs(x) < 1e-9) return '';
  return (x > 0) === favorableSiPositif ? 'positif' : 'negatif';
}
