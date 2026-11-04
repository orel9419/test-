/**
 * Image de score à partager sur les réseaux (format portrait 1080 × 1350,
 * adapté à Instagram, X, WhatsApp, LinkedIn).
 */
import { FINS, JAUGES, mention } from '../../express/moteur.js';

function lignes(ctx, texte, largeur) {
  const mots = texte.split(' ');
  const res = [];
  let ligne = '';
  for (const m of mots) {
    const essai = ligne ? `${ligne} ${m}` : m;
    if (ctx.measureText(essai).width > largeur && ligne) { res.push(ligne); ligne = m; } else ligne = essai;
  }
  if (ligne) res.push(ligne);
  return res;
}

export function imageDeScore(etat, { numero = null, adresse = '' } = {}) {
  const W = 1080, H = 1350;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const police = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  // Fond
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#0b1f3a');
  g.addColorStop(1, '#1d4f9e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Bande tricolore
  ['#1d3f8f', '#ffffff', '#d52b2b'].forEach((col, i) => { ctx.fillStyle = col; ctx.fillRect((W / 3) * i, 0, W / 3, 18); });
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `600 34px ${police}`;
  ctx.fillText('CHEF DE GOUVERNEMENT · MODE EXPRESS', 80, 110);
  if (numero) {
    ctx.fillStyle = '#f2c94c';
    ctx.font = `700 34px ${police}`;
    ctx.fillText(`DÉFI DU JOUR N° ${numero}`, 80, 160);
  }
  // Score
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 250px ${police}`;
  ctx.fillText(String(etat.semaine), 72, 420);
  const largeurNombre = ctx.measureText(String(etat.semaine)).width;
  ctx.font = `700 64px ${police}`;
  ctx.fillText(etat.semaine > 1 ? 'semaines' : 'semaine', 100 + largeurNombre, 330);
  ctx.fillText('à Matignon', 100 + largeurNombre, 410);
  ctx.fillStyle = '#f2c94c';
  ctx.font = `700 48px ${police}`;
  ctx.fillText(mention(etat.semaine), 80, 500);
  // Fin
  const fin = FINS[etat.fin];
  if (fin) {
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.roundRect(60, 550, W - 120, 300, 28);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 54px ${police}`;
    ctx.fillText(`${fin.icone}  ${fin.titre}`, 100, 630);
    ctx.font = `400 36px ${police}`;
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    lignes(ctx, fin.texte, W - 200).slice(0, 4).forEach((l, i) => ctx.fillText(l, 100, 700 + i * 48));
  }
  // Jauges finales
  Object.entries(JAUGES).forEach(([k, j], i) => {
    const y = 920 + i * 78;
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 34px ${police}`;
    ctx.fillText(`${j.icone} ${j.nom}`, 80, y + 30);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.roundRect(560, y + 4, 440, 32, 16); ctx.fill();
    const v = Math.max(0, Math.min(100, etat.jauges[k]));
    ctx.fillStyle = v <= 10 || v >= 90 ? '#ff6b6b' : '#7ee0a1';
    ctx.beginPath(); ctx.roundRect(560, y + 4, Math.max(16, 4.4 * v), 32, 16); ctx.fill();
  });
  // Pied
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 46px ${police}`;
  ctx.fillText('Et toi, tu tiens combien de semaines ?', 80, 1255);
  if (adresse) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = `500 32px ${police}`;
    ctx.fillText(adresse.replace(/^https?:\/\//, ''), 80, 1305);
  }
  return c.toDataURL('image/png');
}
