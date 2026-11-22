export type ID = string

export type StatutBande = 'en_cours' | 'terminee'

export interface Ferme {
  nom: string
  prenom: string
  localite?: string
  telephone?: string
  seuilMortalite: number
  poussinsParCartonDefaut: number
}

export interface Bande {
  id: ID
  nom: string
  type: 'chair'
  dateArrivee: string
  nbCartons?: number | null
  poussinsParCarton?: number | null
  prixCarton?: number | null
  /** Saisi à la main : remplace cartons × poussins par carton. */
  nbPoussins?: number | null
  /** Utilisé seulement si aucun prix de carton n'est saisi. */
  prixPoussin?: number | null
  mortsArrivee?: number | null
  statut: StatutBande
  souche?: string
  fournisseur?: string
  notes?: string
  creeLe: number
}

export interface Mortalite {
  id: ID
  bandeId: ID
  date: string
  nombre: number
  cause?: string
  notes?: string
  creeLe: number
}

export const CATEGORIES = [
  'Aliment',
  'Médicaments et vaccins',
  'Matériel',
  'Déplumage',
  'Transport',
  'Litière',
  'Énergie et eau',
  "Main-d'œuvre",
  'Autre',
] as const
export type Categorie = (typeof CATEGORIES)[number]

export interface Charge {
  id: ID
  /** null = charge de toute la ferme */
  bandeId: ID | null
  date: string
  categorie: Categorie
  type?: string
  /** Nom du produit : médicament, vaccin, libellé libre. */
  produit?: string
  quantite?: number | null
  prixUnitaire?: number | null
  /** Poids du sac en kg, pour l'aliment. */
  poidsUnitaire?: number | null
  montant: number
  fournisseur?: string
  notes?: string
  creeLe: number
}

/** Pour l'instant, seuls les poulets sont vendus. Ajouter un produit ici suffit pour l'activer. */
export const PRODUITS = [{ code: 'poulets', libelle: 'Poulets', unite: 'poulet', compteDansEffectif: true }] as const
export type Produit = (typeof PRODUITS)[number]['code']

export interface Vente {
  id: ID
  bandeId: ID | null
  date: string
  produit: Produit
  quantite: number
  prixUnitaire: number
  montant: number
  statut: 'paye' | 'credit'
  client?: string
  telephoneClient?: string
  poidsMoyen?: number | null
  notes?: string
  creeLe: number
}

export interface Donnees {
  version: 1
  ferme: Ferme
  bandes: Bande[]
  mortalites: Mortalite[]
  charges: Charge[]
  ventes: Vente[]
}
