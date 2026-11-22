import { ajouterJours, div, fcfa, joursEntre, num, pct } from './format'
import type { Bande, Charge, Donnees, ID, Mortalite, Vente } from './types'
import { PRODUITS } from './types'

const PRODUITS_EFFECTIF: string[] = PRODUITS.filter((p) => p.compteDansEffectif).map((p) => p.code)

/** Seules les ventes de produits comptés dans l'effectif (les poulets) font baisser l'effectif. */
export function estVentePoulets(v: Vente): boolean {
  return PRODUITS_EFFECTIF.includes(v.produit)
}

export function nbPoussins(b: Bande, poussinsParCartonDefaut = 100): number {
  if (b.nbPoussins !== null && b.nbPoussins !== undefined && num(b.nbPoussins) > 0) return num(b.nbPoussins)
  return num(b.nbCartons) * (num(b.poussinsParCarton) || poussinsParCartonDefaut)
}

export function prixParPoussin(b: Bande, poussinsParCartonDefaut = 100): number | null {
  if (num(b.prixCarton) > 0) return div(num(b.prixCarton), num(b.poussinsParCarton) || poussinsParCartonDefaut)
  return num(b.prixPoussin) > 0 ? num(b.prixPoussin) : null
}

export function coutPoussins(b: Bande, poussinsParCartonDefaut = 100): number {
  if (num(b.prixCarton) > 0) return num(b.nbCartons) * num(b.prixCarton)
  return nbPoussins(b, poussinsParCartonDefaut) * num(b.prixPoussin)
}

function somme<T>(xs: T[], f: (x: T) => unknown): number {
  return xs.reduce((s, x) => s + num(f(x)), 0)
}

/** Groupes utilisés par l'anneau de répartition des charges. */
export const GROUPES_CHARGES = ['Poussins', 'Aliment', 'Médicaments', 'Matériel', 'Déplumage', 'Autres'] as const
export type GroupeCharge = (typeof GROUPES_CHARGES)[number]

export function groupeDe(c: Charge): GroupeCharge {
  switch (c.categorie) {
    case 'Aliment':
      return 'Aliment'
    case 'Médicaments et vaccins':
      return 'Médicaments'
    case 'Matériel':
      return 'Matériel'
    case 'Déplumage':
      return 'Déplumage'
    default:
      return 'Autres'
  }
}

export interface Bilan {
  recus: number
  mortsArrivee: number
  mortalites: number
  morts: number
  vendus: number
  effectif: number
  tauxMortalite: number | null
  coutPoussins: number
  chargesHorsPoussins: number
  totalCharges: number
  parGroupe: Record<GroupeCharge, number>
  parCategorie: Record<string, number>
  ca: number
  caPoulets: number
  benefice: number
  coutRevient: number | null
  prixVenteMoyen: number | null
  marge: number | null
  credits: number
}

function construireBilan(
  bandes: Bande[],
  mortalites: Mortalite[],
  charges: Charge[],
  ventes: Vente[],
  defaut: number,
): Bilan {
  const recus = somme(bandes, (b) => nbPoussins(b, defaut))
  const mortsArrivee = somme(bandes, (b) => b.mortsArrivee)
  const mortsSaisis = somme(mortalites, (m) => m.nombre)
  const ventesPoulets = ventes.filter(estVentePoulets)
  const vendus = somme(ventesPoulets, (v) => v.quantite)
  const effectif = Math.max(0, recus - mortsArrivee - mortsSaisis - vendus)
  const morts = mortsArrivee + mortsSaisis

  const cp = somme(bandes, (b) => coutPoussins(b, defaut))
  const parGroupe = Object.fromEntries(GROUPES_CHARGES.map((g) => [g, 0])) as Record<GroupeCharge, number>
  parGroupe.Poussins = cp
  const parCategorie: Record<string, number> = {}
  for (const c of charges) {
    parGroupe[groupeDe(c)] += num(c.montant)
    parCategorie[c.categorie] = (parCategorie[c.categorie] ?? 0) + num(c.montant)
  }
  const chargesHorsPoussins = somme(charges, (c) => c.montant)
  const totalCharges = cp + chargesHorsPoussins
  const ca = somme(ventes, (v) => v.montant)
  const caPoulets = somme(ventesPoulets, (v) => v.montant)
  const coutRevient = div(totalCharges, effectif + vendus)
  const prixVenteMoyen = div(caPoulets, vendus)
  const taux = div(morts, recus)
  return {
    recus,
    mortsArrivee,
    mortalites: mortsSaisis,
    morts,
    vendus,
    effectif,
    tauxMortalite: taux === null ? null : taux * 100,
    coutPoussins: cp,
    chargesHorsPoussins,
    totalCharges,
    parGroupe,
    parCategorie,
    ca,
    caPoulets,
    benefice: ca - totalCharges,
    coutRevient,
    prixVenteMoyen,
    marge: prixVenteMoyen !== null && coutRevient !== null ? prixVenteMoyen - coutRevient : null,
    credits: somme(
      ventes.filter((v) => v.statut === 'credit'),
      (v) => v.montant,
    ),
  }
}

/** Bilan d'une bande : les charges de toute la ferme n'y figurent pas. */
export function bilanBande(b: Bande, d: Donnees): Bilan {
  return construireBilan(
    [b],
    d.mortalites.filter((m) => m.bandeId === b.id),
    d.charges.filter((c) => c.bandeId === b.id),
    d.ventes.filter((v) => v.bandeId === b.id),
    d.ferme.poussinsParCartonDefaut,
  )
}

/** Bilan global : toutes les ventes moins toutes les charges, y compris celles de la ferme. */
export function bilanFerme(d: Donnees): Bilan {
  return construireBilan(d.bandes, d.mortalites, d.charges, d.ventes, d.ferme.poussinsParCartonDefaut)
}

/** Effectif et mortalité des seules bandes en cours, pour la vue « Toutes les bandes ». */
export function bilanEnCours(d: Donnees): Bilan {
  const ids = new Set(d.bandes.filter((b) => b.statut === 'en_cours').map((b) => b.id))
  return construireBilan(
    d.bandes.filter((b) => ids.has(b.id)),
    d.mortalites.filter((m) => ids.has(m.bandeId)),
    d.charges.filter((c) => c.bandeId !== null && ids.has(c.bandeId)),
    d.ventes.filter((v) => v.bandeId !== null && ids.has(v.bandeId)),
    d.ferme.poussinsParCartonDefaut,
  )
}

export function ageBande(b: Bande, jour: string): number {
  return Math.max(0, joursEntre(b.dateArrivee, jour))
}

export interface PointEffectif {
  date: string
  jour: number
  effectif: number
  morts: number
}

/** Effectif vivant jour par jour, depuis l'arrivée la plus ancienne jusqu'à aujourd'hui. */
export function serieEffectif(bandes: Bande[], d: Donnees, jour: string, maxJours = 90): PointEffectif[] {
  if (bandes.length === 0) return []
  const ids = new Set<ID>(bandes.map((b) => b.id))
  const debutMin = bandes.map((b) => b.dateArrivee).sort()[0]
  const total = joursEntre(debutMin, jour)
  if (total < 0) return []
  const debut = total > maxJours ? ajouterJours(jour, -maxJours) : debutMin
  const n = joursEntre(debut, jour)
  const morts = d.mortalites.filter((m) => ids.has(m.bandeId))
  const ventes = d.ventes.filter((v) => v.bandeId !== null && ids.has(v.bandeId) && estVentePoulets(v))
  const defaut = d.ferme.poussinsParCartonDefaut
  const points: PointEffectif[] = []
  for (let i = 0; i <= n; i++) {
    const date = ajouterJours(debut, i)
    let effectif = 0
    for (const b of bandes) {
      if (b.dateArrivee > date) continue
      const m = somme(
        morts.filter((x) => x.bandeId === b.id && x.date <= date),
        (x) => x.nombre,
      )
      const v = somme(
        ventes.filter((x) => x.bandeId === b.id && x.date <= date),
        (x) => x.quantite,
      )
      effectif += Math.max(0, nbPoussins(b, defaut) - num(b.mortsArrivee) - m - v)
    }
    points.push({
      date,
      jour: joursEntre(debutMin, date),
      effectif,
      morts: somme(
        morts.filter((x) => x.date === date),
        (x) => x.nombre,
      ),
    })
  }
  return points
}

/** Somme d'une série d'opérations entre deux dates incluses. */
export function sommePeriode<T extends { date: string }>(xs: T[], du: string, au: string, f: (x: T) => unknown): number {
  return somme(
    xs.filter((x) => x.date >= du && x.date <= au),
    f,
  )
}

export interface Alerte {
  id: string
  niveau: 'attention' | 'info'
  titre: string
  detail: string
  lien?: string
}

export function alertes(d: Donnees, jour: string): Alerte[] {
  const res: Alerte[] = []
  const debut7 = ajouterJours(jour, -6)
  for (const b of d.bandes.filter((x) => x.statut === 'en_cours')) {
    const recus = nbPoussins(b, d.ferme.poussinsParCartonDefaut)
    const m7 = sommePeriode(
      d.mortalites.filter((m) => m.bandeId === b.id),
      debut7,
      jour,
      (m) => m.nombre,
    )
    const t7 = div(m7, recus)
    if (t7 !== null && t7 * 100 > d.ferme.seuilMortalite) {
      res.push({
        id: 'mort-' + b.id,
        niveau: 'attention',
        titre: `Mortalité élevée · ${b.nom}`,
        detail: `${m7} morts sur 7 jours, soit ${pct(t7 * 100)} des poussins reçus.`,
        lien: '/bandes/' + b.id,
      })
    }
    const age = ageBande(b, jour)
    if (age > 42) {
      res.push({
        id: 'age-' + b.id,
        niveau: 'info',
        titre: `${b.nom} est prête à la vente`,
        detail: `La bande a ${age} jours.`,
        lien: '/bandes/' + b.id,
      })
    }
  }
  const credits = d.ventes.filter((v) => v.statut === 'credit')
  if (credits.length > 0) {
    const total = somme(credits, (v) => v.montant)
    const clients = new Set(credits.map((v) => v.client?.trim() || 'Client sans nom'))
    const s = (n: number) => (n > 1 ? 's' : '')
    res.push({
      id: 'credits',
      niveau: 'attention',
      titre: 'Crédits clients non payés',
      detail: `${credits.length} vente${s(credits.length)} à crédit, ${clients.size} client${s(clients.size)}, pour ${fcfa(total)}.`,
      lien: '/ventes?filtre=credit',
    })
  }
  return res
}

export type TypeOperation = 'mortalite' | 'charge' | 'vente' | 'bande'

export interface Operation {
  id: string
  type: TypeOperation
  date: string
  bandeId: ID | null
  libelle: string
  montant: number | null
  sens: 'entree' | 'sortie' | 'neutre'
  creeLe: number
  ref: ID
}

export function operations(d: Donnees, bandeId?: ID | null): Operation[] {
  const defaut = d.ferme.poussinsParCartonDefaut
  const ops: Operation[] = [
    ...d.bandes.map<Operation>((b) => ({
      id: 'b' + b.id,
      type: 'bande',
      date: b.dateArrivee,
      bandeId: b.id,
      libelle: `Achat de ${nbPoussins(b, defaut)} poussins`,
      montant: coutPoussins(b, defaut),
      sens: 'sortie',
      creeLe: b.creeLe,
      ref: b.id,
    })),
    ...d.mortalites.map<Operation>((m) => ({
      id: 'm' + m.id,
      type: 'mortalite',
      date: m.date,
      bandeId: m.bandeId,
      libelle: `${m.nombre} mort${m.nombre > 1 ? 's' : ''}${m.cause ? ' · ' + m.cause : ''}`,
      montant: null,
      sens: 'neutre',
      creeLe: m.creeLe,
      ref: m.id,
    })),
    ...d.charges.map<Operation>((c) => ({
      id: 'c' + c.id,
      type: 'charge',
      date: c.date,
      bandeId: c.bandeId,
      libelle: c.type ? `${c.categorie} · ${c.type}` : c.categorie,
      montant: num(c.montant),
      sens: 'sortie',
      creeLe: c.creeLe,
      ref: c.id,
    })),
    ...d.ventes.map<Operation>((v) => ({
      id: 'v' + v.id,
      type: 'vente',
      date: v.date,
      bandeId: v.bandeId,
      libelle: `Vente de ${v.quantite} poulet${v.quantite > 1 ? 's' : ''}${v.client ? ' · ' + v.client : ''}`,
      montant: num(v.montant),
      sens: 'entree',
      creeLe: v.creeLe,
      ref: v.id,
    })),
  ]
  return ops
    .filter((o) => (bandeId ? o.bandeId === bandeId : true))
    .sort((a, b) => (a.date === b.date ? b.creeLe - a.creeLe : a.date < b.date ? 1 : -1))
}

export function dernieresOperations(d: Donnees, n = 8, bandeId?: ID | null): Operation[] {
  return operations(d, bandeId).slice(0, n)
}
