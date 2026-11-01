/**
 * Ménages types : rendre concrètes les conséquences des décisions.
 *
 * Pour chaque ménage, on calcule chaque trimestre son revenu disponible
 * mensuel (en euros courants) et son pouvoir d'achat (en euros du départ),
 * en détaillant les canaux : salaires, pensions, impôts, CSG, cotisations,
 * temps de travail, prestations, coût de la vie (dont énergie et TVA)...
 */
import { effetMenageTempsTravail } from './travail.js';
import { PARAMETRES } from '../model/parametres.js';
import { IMPOTS } from '../model/impots.js';

export function initialiserMenages(e) {
  return e.statique.menages.map((def) => ({
    ...def,
    revenuNet0: def.revenuNet,
    revenuNominal: def.revenuNet,
    revenuReel: def.revenuNet,
    delta: 0,
    deltaTour: 0,
    variationPct: 0,
    details: [],
  }));
}

/** Indice des prix propre au ménage (son budget énergie peut peser plus ou moins que la moyenne). */
function indicePrixMenage(e, m) {
  const w = e.statique.energie.poidsConso;
  const hausseEnergie = e.macro.prixEnergieConso / e.reference.prixEnergieConso - 1;
  return (e.macro.niveauPrix / 100) * (1 + (m.partEnergie - w) * hausseEnergie);
}

/**
 * Met à jour tous les ménages types.
 * @param {object} e état
 * @param {object} effets effets agrégés des réformes (effets.menages[id] = [{ montant, texte }])
 */
export function majMenages(e, effets) {
  const imp = e.impots;
  const tauxRefTva = imp.tva.tauxRef;
  for (const m of e.menages) {
    const d = [];
    const ajouter = (cause, montant) => { if (Math.abs(montant) >= 0.5) d.push({ cause, montant }); };
    const salarie = m.groupe === 'salaries' || m.groupe === 'jeunes';

    // Revenus d'activité ou de remplacement
    if (salarie) {
      // Salaire minimum : revalorisé chaque 1er janvier (indexation sur les prix en France)
      const indice = m.id === 'smic' ? (e.politiqueSalariale?.indiceSmic ?? 1) : e.macro.indiceSalaires;
      ajouter('Évolution des salaires', m.revenuNet0 * (indice - 1));
    }
    if (m.groupe === 'fonctionnaires') {
      ajouter('Point d\'indice et avancement', m.revenuNet0 * ((e.politiqueSalariale?.indicePoint ?? e.macro.indiceSalaires) - 1));
    }
    if (m.groupe === 'retraites') {
      ajouter('Revalorisation des pensions', m.revenuNet0 * (e.retraites.indicePensions - 1));
    }
    if (m.groupe === 'entrepreneurs') {
      const cycle = 2 * (e.macro.ecartProduction - e.reference.ecartProduction) / 100;
      ajouter('Activité de l\'entreprise', m.revenuNet0 * (cycle + (e.macro.niveauPrix / 100 - 1)));
      if (imp.impotSocietes) {
        const dIS = (imp.impotSocietes.taux - imp.impotSocietes.tauxRef) / 100;
        ajouter('Impôt sur les bénéfices', -(m.beneficeEntreprise ?? 0) * dIS * 0.5 / 12);
      }
    }
    if (m.groupe === 'agriculteurs') {
      ajouter('Prix agricoles et activité', m.revenuNet0 * (e.macro.niveauPrix / 100 - 1));
      const varAgri = e.budget.agriculture.montant / (e.budget.agriculture.montantInitial * e.macro.niveauPrix / 100) - 1;
      ajouter('Aides nationales à l\'agriculture', (m.aidesPAC ?? 0) * 0.3 * varAgri);
      const pac = e.international.effetPAC ?? 0;
      ajouter('Politique agricole commune et accords commerciaux', (m.aidesPAC ?? 0) * pac);
    }

    // Prélèvements
    if (imp.impotRevenu && m.impotRevenu) {
      ajouter('Impôt sur le revenu', -m.impotRevenu * (imp.impotRevenu.taux / imp.impotRevenu.tauxRef - 1) - m.impotRevenu * (e.politiqueSociale?.surplusBaremeGele ?? 0));
    }
    if (imp.csg) {
      const dCsg = (imp.csg.taux - imp.csg.tauxRef) / 100;
      if (m.salaireBrut) ajouter('CSG', -dCsg * m.salaireBrut * 0.9825);
      if (m.pensionBrute) ajouter('CSG', -dCsg * (8.3 / 9.2) * m.pensionBrute * e.retraites.indicePensions);
    }
    if (imp.cotisations && (m.salaireBrut || m.groupe === 'entrepreneurs')) {
      const dCot = imp.cotisations.taux / imp.cotisations.tauxRef - 1;
      const base = m.salaireBrut ? m.salaireBrut * 0.22 * 0.5 : m.revenuNet0 * 0.35;
      ajouter('Cotisations sociales', -dCot * base);
    }

    // Temps de travail
    const tt = effetMenageTempsTravail(e, m);
    if (tt) ajouter(`Temps de travail : ${tt.texte}`, tt.montant);

    // Prestations sociales (gel éventuel)
    if (m.prestations) {
      ajouter('Prestations sociales', m.prestations * ((e.politiqueSociale?.indicePrestations ?? e.macro.niveauPrix / 100) - 1));
    }

    // Effets propres aux réformes (chèque énergie, minimum de pension...)
    for (const x of effets?.menages?.[m.id] ?? []) ajouter(x.texte, x.montant);

    const nominal = m.revenuNet0 + d.reduce((s, x) => s + x.montant, 0);
    const indicePrix = indicePrixMenage(e, m);
    const reel = nominal / indicePrix;
    // Décomposition du coût de la vie : énergie, TVA, reste de l'inflation
    const coutVie = nominal - reel;
    const partTva = PARAMETRES.repercussionTVA * (imp.tva.partPilotable ?? IMPOTS.tva.partPilotable) * (imp.tva.taux - tauxRefTva) / (100 + tauxRefTva);
    const tva = partTva * m.partConso * m.revenuNet0;
    const hausseEnergie = e.macro.prixEnergieConso / e.reference.prixEnergieConso - 1;
    const energie = m.partEnergie * hausseEnergie * m.revenuNet0;
    d.push({ cause: 'Hausse des prix (coût de la vie)', montant: -coutVie, sousDetail: { tva: -tva, energie: -energie } });

    const precedent = m.revenuReel;
    m.revenuNominal = nominal;
    m.revenuReel = reel;
    m.delta = reel - m.revenuNet0;
    m.deltaTour = reel - precedent;
    m.variationPct = (reel / m.revenuNet0 - 1) * 100;
    m.details = d.sort((a, b) => Math.abs(b.montant) - Math.abs(a.montant));
  }
}

/** Variation moyenne du pouvoir d'achat (en %) des ménages types d'un groupe. */
export function pouvoirAchatGroupe(e, groupe) {
  const liste = e.menages.filter((m) => m.groupe === groupe);
  if (!liste.length) return 0;
  return liste.reduce((s, m) => s + m.variationPct, 0) / liste.length;
}
