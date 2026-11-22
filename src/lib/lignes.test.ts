import { describe, expect, it } from 'vitest'
import { bandeDepuis, chargeDepuis, ligneBande, ligneCharge, ligneVente, mortaliteDepuis, ligneMortalite, venteDepuis } from './lignes'
import type { Bande, Charge, Mortalite, Vente } from './types'

const F = 'ferme-1'

describe('conversion vers et depuis Supabase', () => {
  it('une bande fait l’aller-retour sans perte', () => {
    const b: Bande = {
      id: 'b1',
      nom: 'Bande 3 – Oct. 2026',
      type: 'chair',
      dateArrivee: '2026-10-25',
      nbCartons: 5,
      poussinsParCarton: 100,
      prixCarton: 60000,
      nbPoussins: null,
      prixPoussin: null,
      mortsArrivee: null,
      statut: 'en_cours',
      souche: 'Cobb 500',
      fournisseur: undefined,
      notes: undefined,
      creeLe: Date.UTC(2026, 9, 25),
    }
    const l = ligneBande(b, F)
    expect(l.ferme_id).toBe(F)
    expect(l.fournisseur).toBeNull()
    expect(bandeDepuis(l)).toEqual(b)
  })

  it('une charge de toute la ferme garde une bande vide', () => {
    const c: Charge = { id: 'c1', bandeId: null, date: '2026-11-01', categorie: "Main-d'œuvre", montant: 15000, creeLe: Date.UTC(2026, 10, 1) }
    const l = ligneCharge(c, F)
    expect(l.bande_id).toBeNull()
    const r = chargeDepuis(l)
    expect(r.bandeId).toBeNull()
    expect(r.categorie).toBe("Main-d'œuvre")
    expect(r.montant).toBe(15000)
    expect(r.quantite).toBeNull()
  })

  it('le montant d’une vente n’est jamais envoyé : la base le calcule', () => {
    const v: Vente = {
      id: 'v1', bandeId: 'b1', date: '2026-11-20', produit: 'poulets', quantite: 80, prixUnitaire: 3000,
      montant: 240000, statut: 'credit', client: 'Moussa D.', creeLe: 1,
    }
    const l = ligneVente(v, F)
    expect('montant' in l).toBe(false)
    expect(venteDepuis({ ...l, montant: 240000 }).montant).toBe(240000)
    expect(venteDepuis({ ...l, montant: 240000 }).statut).toBe('credit')
  })

  it('les nombres renvoyés sous forme de texte sont convertis', () => {
    const m: Mortalite = { id: 'm1', bandeId: 'b1', date: '2026-11-02', nombre: 3, creeLe: 1 }
    const l = { ...ligneMortalite(m, F), nombre: '3' }
    expect(mortaliteDepuis(l).nombre).toBe(3)
    expect(bandeDepuis({ ...ligneBande({ id: 'b', nom: 'B', type: 'chair', dateArrivee: '2026-01-01', statut: 'en_cours', creeLe: 1, nbCartons: 2 } as Bande, F), nb_cartons: '2' }).nbCartons).toBe(2)
  })
})
