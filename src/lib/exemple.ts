import { ajouterJours } from './format'
import type { Charge, Donnees, Mortalite, Vente } from './types'

/**
 * Données d'exemple réalistes, datées par rapport au jour donné.
 * La Bande 3 reprend l'exemple du cahier des charges :
 * 5 cartons de 100 poussins à 60 000 F, 28 jours, 9 morts, 250 poulets vendus à 3 000 F.
 */
export function donneesExemple(jour: string): Donnees {
  const j = (n: number) => ajouterJours(jour, n)
  let seq = 0
  const t = () => Date.now() - 10_000_000 + ++seq * 1000
  const id = (p: string) => `${p}-${++seq}`

  const b2 = 'exemple-bande-2'
  const b3 = 'exemple-bande-3'
  const a3 = j(-28)
  const a2 = j(-96)

  const mortalites: Mortalite[] = [
    // Bande 2, terminée
    ...[
      [1, 4, 'Stress du transport'],
      [3, 3, ''],
      [8, 2, ''],
      [16, 3, 'Coccidiose suspectée'],
      [29, 2, ''],
    ].map(([d, n, cause]) => ({
      id: id('m'),
      bandeId: b2,
      date: ajouterJours(a2, d as number),
      nombre: n as number,
      cause: (cause as string) || undefined,
      creeLe: t(),
    })),
    // Bande 3 : 9 morts au total
    ...[
      [2, 3, 'Poussins faibles'],
      [5, 2, ''],
      [11, 1, ''],
      [17, 2, 'Coup de chaleur'],
      [24, 1, ''],
    ].map(([d, n, cause]) => ({
      id: id('m'),
      bandeId: b3,
      date: ajouterJours(a3, d as number),
      nombre: n as number,
      cause: (cause as string) || undefined,
      creeLe: t(),
    })),
  ]

  const ch = (c: Omit<Charge, 'id' | 'creeLe'>): Charge => ({ ...c, id: id('c'), creeLe: t() })
  const charges: Charge[] = [
    // Bande 2
    ch({ bandeId: b2, date: a2, categorie: 'Aliment', type: 'Démarrage', quantite: 6, poidsUnitaire: 50, prixUnitaire: 19000, montant: 114000 }),
    ch({ bandeId: b2, date: ajouterJours(a2, 12), categorie: 'Aliment', type: 'Croissance', quantite: 12, poidsUnitaire: 50, prixUnitaire: 18000, montant: 216000 }),
    ch({ bandeId: b2, date: ajouterJours(a2, 28), categorie: 'Aliment', type: 'Finition', quantite: 8, poidsUnitaire: 50, prixUnitaire: 17500, montant: 140000 }),
    ch({ bandeId: b2, date: ajouterJours(a2, 1), categorie: 'Médicaments et vaccins', type: 'Vaccin', notes: 'Newcastle et Gumboro', montant: 14000 }),
    ch({ bandeId: b2, date: ajouterJours(a2, 16), categorie: 'Médicaments et vaccins', type: 'Traitement', notes: 'Anticoccidien', montant: 9000 }),
    ch({ bandeId: b2, date: a2, categorie: 'Litière', quantite: 4, prixUnitaire: 1500, montant: 6000 }),
    ch({ bandeId: b2, date: a2, categorie: 'Transport', notes: 'Livraison des poussins', montant: 10000 }),
    ch({ bandeId: b2, date: ajouterJours(a2, 42), categorie: 'Déplumage', quantite: 150, prixUnitaire: 150, montant: 22500 }),
    // Bande 3
    ch({ bandeId: b3, date: a3, categorie: 'Aliment', type: 'Démarrage', quantite: 7, poidsUnitaire: 50, prixUnitaire: 19500, montant: 136500, fournisseur: 'Provenderie du centre' }),
    ch({ bandeId: b3, date: ajouterJours(a3, 13), categorie: 'Aliment', type: 'Croissance', quantite: 10, poidsUnitaire: 50, prixUnitaire: 18500, montant: 185000, fournisseur: 'Provenderie du centre' }),
    ch({ bandeId: b3, date: ajouterJours(a3, 1), categorie: 'Médicaments et vaccins', type: 'Vaccin', notes: 'Newcastle et Gumboro', montant: 15000 }),
    ch({ bandeId: b3, date: ajouterJours(a3, 3), categorie: 'Médicaments et vaccins', type: 'Traitement', notes: 'Vitamines anti-stress', montant: 8500 }),
    ch({ bandeId: b3, date: a3, categorie: 'Matériel', type: 'Abreuvoir', quantite: 6, prixUnitaire: 3500, montant: 21000 }),
    ch({ bandeId: b3, date: a3, categorie: 'Matériel', type: 'Mangeoire', quantite: 6, prixUnitaire: 4000, montant: 24000 }),
    ch({ bandeId: b3, date: a3, categorie: 'Litière', quantite: 5, prixUnitaire: 1500, montant: 7500 }),
    ch({ bandeId: b3, date: a3, categorie: 'Transport', notes: 'Livraison des poussins', montant: 10000 }),
    ch({ bandeId: b3, date: j(-2), categorie: 'Déplumage', quantite: 100, prixUnitaire: 150, montant: 15000 }),
    // Toute la ferme
    ch({ bandeId: null, date: j(-22), categorie: 'Énergie et eau', type: 'Électricité', montant: 18000 }),
    ch({ bandeId: null, date: j(-8), categorie: 'Énergie et eau', type: 'Eau', montant: 7500 }),
  ]

  const ve = (v: Omit<Vente, 'id' | 'creeLe' | 'produit' | 'montant'>): Vente => ({
    ...v,
    produit: 'poulets',
    montant: v.quantite * v.prixUnitaire,
    id: id('v'),
    creeLe: t(),
  })
  const ventes: Vente[] = [
    ve({ bandeId: b2, date: ajouterJours(a2, 40), quantite: 150, prixUnitaire: 3200, statut: 'paye', client: 'Restaurant Teranga', poidsMoyen: 1.9 }),
    ve({ bandeId: b2, date: ajouterJours(a2, 43), quantite: 136, prixUnitaire: 3100, statut: 'paye', client: 'Marché central' }),
    ve({ bandeId: b2, date: ajouterJours(a2, 45), quantite: 100, prixUnitaire: 3000, statut: 'paye', client: 'Particuliers' }),
    ve({ bandeId: b3, date: j(-3), quantite: 100, prixUnitaire: 3000, statut: 'paye', client: 'Restaurant Teranga', poidsMoyen: 1.6 }),
    ve({ bandeId: b3, date: j(-2), quantite: 80, prixUnitaire: 3000, statut: 'credit', client: 'Moussa D.', telephoneClient: '77 000 00 00' }),
    ve({ bandeId: b3, date: j(-1), quantite: 70, prixUnitaire: 3000, statut: 'paye', client: 'Particuliers' }),
  ]

  return {
    version: 1,
    ferme: {
      nom: 'Ferme avicole',
      prenom: 'Baye Mor',
      localite: '',
      telephone: '',
      seuilMortalite: 5,
      poussinsParCartonDefaut: 100,
    },
    bandes: [
      {
        id: b2,
        nom: 'Bande 2 – Août 2026',
        type: 'chair',
        dateArrivee: a2,
        nbCartons: 4,
        poussinsParCarton: 100,
        prixCarton: 58000,
        mortsArrivee: 0,
        statut: 'terminee',
        souche: 'Cobb 500',
        creeLe: t(),
      },
      {
        id: b3,
        nom: 'Bande 3 – Oct. 2026',
        type: 'chair',
        dateArrivee: a3,
        nbCartons: 5,
        poussinsParCarton: 100,
        prixCarton: 60000,
        statut: 'en_cours',
        souche: 'Cobb 500',
        fournisseur: 'Couvoir régional',
        creeLe: t(),
      },
    ],
    mortalites,
    charges,
    ventes,
  }
}
