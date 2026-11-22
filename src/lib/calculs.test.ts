import { describe, expect, it } from 'vitest'
import { alertes, bilanBande, bilanFerme, coutPoussins, nbPoussins, prixParPoussin, serieEffectif } from './calculs'
import { dateFr, fcfa, num, pct } from './format'
import { donneesExemple } from './exemple'
import type { Bande, Donnees } from './types'

const ferme = { nom: 'Ferme test', prenom: 'Test', seuilMortalite: 5, poussinsParCartonDefaut: 100 }
const base = (): Donnees => ({ version: 1, ferme, bandes: [], mortalites: [], charges: [], ventes: [] })
const bande = (x: Partial<Bande> = {}): Bande => ({
  id: 'b1',
  nom: 'Bande 1',
  type: 'chair',
  dateArrivee: '2026-10-25',
  statut: 'en_cours',
  creeLe: 1,
  ...x,
})

describe('règle d’or : champs vides', () => {
  it('num() vaut 0 pour toute saisie vide ou invalide', () => {
    for (const v of [undefined, null, '', '  ', 'abc', NaN, Infinity]) expect(num(v)).toBe(0)
    expect(num('1 250')).toBe(1250)
    expect(num('2,5')).toBe(2.5)
  })

  it('une bande créée avec seulement cartons et prix du carton est correcte', () => {
    const b = bande({ nbCartons: 5, prixCarton: 60000 })
    expect(nbPoussins(b)).toBe(500)
    expect(coutPoussins(b)).toBe(300000)
    expect(prixParPoussin(b)).toBe(600)
  })

  it('une bande totalement vide ne produit ni erreur ni NaN', () => {
    const d = base()
    const b = bande()
    d.bandes.push(b)
    const bi = bilanBande(b, d)
    for (const v of Object.values(bi)) {
      if (typeof v === 'number') expect(Number.isNaN(v)).toBe(false)
    }
    expect(bi.tauxMortalite).toBeNull()
    expect(bi.coutRevient).toBeNull()
    expect(pct(bi.tauxMortalite)).toBe('–')
    expect(fcfa(bi.coutRevient)).toBe('–')
  })

  it('le prix par poussin sert si aucun prix de carton n’est saisi', () => {
    const b = bande({ nbPoussins: 300, prixPoussin: 650 })
    expect(coutPoussins(b)).toBe(195000)
  })
})

describe('critères d’acceptation', () => {
  const d = base()
  const b = bande({ nbCartons: 5, poussinsParCarton: 100, prixCarton: 60000 })
  d.bandes.push(b)
  d.mortalites.push({ id: 'm1', bandeId: 'b1', date: '2026-11-01', nombre: 9, creeLe: 2 })
  d.ventes.push({
    id: 'v1',
    bandeId: 'b1',
    date: '2026-11-20',
    produit: 'poulets',
    quantite: 250,
    prixUnitaire: 3000,
    montant: 750000,
    statut: 'credit',
    client: 'Awa',
    creeLe: 3,
  })
  d.charges.push({ id: 'c1', bandeId: 'b1', date: '2026-10-25', categorie: 'Aliment', montant: 200000, creeLe: 4 })
  d.charges.push({
    id: 'c2',
    bandeId: null,
    date: '2026-10-25',
    categorie: 'Matériel',
    type: 'Abreuvoir',
    montant: 30000,
    creeLe: 5,
  })

  it('500 poussins, 9 morts, 250 vendus donnent 241 vivants et 1,8 %', () => {
    const bi = bilanBande(b, d)
    expect(bi.effectif).toBe(241)
    expect(pct(bi.tauxMortalite)).toBe('1,8 %')
  })

  it('une charge de toute la ferme compte dans le bilan global mais pas dans la bande', () => {
    expect(bilanBande(b, d).totalCharges).toBe(500000)
    expect(bilanFerme(d).totalCharges).toBe(530000)
    expect(bilanBande(b, d).benefice).toBe(250000)
    expect(bilanFerme(d).benefice).toBe(220000)
  })

  it('le coût de revient se calcule sur les poulets vivants et vendus', () => {
    expect(bilanBande(b, d).coutRevient).toBeCloseTo(500000 / 491)
  })

  it('une vente à crédit reste dans les crédits jusqu’au paiement', () => {
    expect(bilanFerme(d).credits).toBe(750000)
    expect(alertes(d, '2026-11-22').some((a) => a.id === 'credits')).toBe(true)
    const payee = { ...d, ventes: d.ventes.map((v) => ({ ...v, statut: 'paye' as const })) }
    expect(bilanFerme(payee).credits).toBe(0)
    expect(alertes(payee, '2026-11-22').some((a) => a.id === 'credits')).toBe(false)
  })

  it('l’effectif jour par jour suit mortalités et ventes', () => {
    const s = serieEffectif([b], d, '2026-11-22')
    expect(s[0].effectif).toBe(500)
    expect(s.find((p) => p.date === '2026-11-01')?.effectif).toBe(491)
    expect(s[s.length - 1].effectif).toBe(241)
  })

  it('formats français', () => {
    expect(fcfa(1250000)).toBe('1 250 000 F CFA')
    expect(dateFr('2026-11-22')).toBe('22/11/2026')
  })
})

describe('données d’exemple du cahier des charges', () => {
  it('la Bande 3 affiche 241 vivants, 1,8 % et 28 jours', () => {
    const d = donneesExemple('2026-11-22')
    const b3 = d.bandes.find((b) => b.nom.startsWith('Bande 3'))!
    const bi = bilanBande(b3, d)
    expect(bi.recus).toBe(500)
    expect(bi.effectif).toBe(241)
    expect(pct(bi.tauxMortalite)).toBe('1,8 %')
    expect(bi.vendus).toBe(250)
    expect(bi.caPoulets).toBe(750000)
  })
})
