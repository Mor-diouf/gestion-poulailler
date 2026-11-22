/**
 * Conversion entre les objets de l'application (camelCase)
 * et les lignes des tables Supabase (snake_case).
 */
import type { Bande, Categorie, Charge, Ferme, ID, Mortalite, Produit, Vente } from './types'

type Ligne = Record<string, unknown>

const texte = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v : undefined)
const nb = (v: unknown) => (v === null || v === undefined || v === '' ? null : Number(v))
const ms = (v: unknown) => (typeof v === 'string' ? new Date(v).getTime() : Date.now())
const iso = (t: number) => new Date(t || Date.now()).toISOString()
const vide = (v: string | undefined) => (v && v.trim() !== '' ? v.trim() : null)

/* ---------- Ferme ---------- */

export function fermeDepuis(l: Ligne): Ferme {
  return {
    nom: String(l.nom ?? 'Ma ferme'),
    prenom: String(l.prenom ?? ''),
    localite: texte(l.localite),
    telephone: texte(l.telephone),
    seuilMortalite: Number(l.seuil_mortalite ?? 5),
    poussinsParCartonDefaut: Number(l.poussins_par_carton_defaut ?? 100),
  }
}

export function ligneFerme(f: Partial<Ferme>): Ligne {
  const l: Ligne = {}
  if (f.nom !== undefined) l.nom = f.nom
  if (f.prenom !== undefined) l.prenom = f.prenom
  if (f.localite !== undefined) l.localite = vide(f.localite)
  if (f.telephone !== undefined) l.telephone = vide(f.telephone)
  if (f.seuilMortalite !== undefined) l.seuil_mortalite = f.seuilMortalite
  if (f.poussinsParCartonDefaut !== undefined) l.poussins_par_carton_defaut = f.poussinsParCartonDefaut
  return l
}

/* ---------- Bande ---------- */

export function bandeDepuis(l: Ligne): Bande {
  return {
    id: String(l.id),
    nom: String(l.nom),
    type: 'chair',
    dateArrivee: String(l.date_arrivee),
    nbCartons: nb(l.nb_cartons),
    poussinsParCarton: nb(l.poussins_par_carton),
    prixCarton: nb(l.prix_carton),
    nbPoussins: nb(l.nb_poussins),
    prixPoussin: nb(l.prix_poussin),
    mortsArrivee: nb(l.morts_arrivee),
    statut: l.statut === 'terminee' ? 'terminee' : 'en_cours',
    souche: texte(l.souche),
    fournisseur: texte(l.fournisseur),
    notes: texte(l.notes),
    creeLe: ms(l.cree_le),
  }
}

export function ligneBande(b: Bande, fermeId: ID): Ligne {
  return {
    id: b.id,
    ferme_id: fermeId,
    nom: b.nom,
    type: b.type,
    date_arrivee: b.dateArrivee,
    nb_cartons: b.nbCartons ?? null,
    poussins_par_carton: b.poussinsParCarton ?? null,
    prix_carton: b.prixCarton ?? null,
    nb_poussins: b.nbPoussins ?? null,
    prix_poussin: b.prixPoussin ?? null,
    morts_arrivee: b.mortsArrivee ?? null,
    statut: b.statut,
    souche: vide(b.souche),
    fournisseur: vide(b.fournisseur),
    notes: vide(b.notes),
    cree_le: iso(b.creeLe),
  }
}

/* ---------- Mortalité ---------- */

export function mortaliteDepuis(l: Ligne): Mortalite {
  return {
    id: String(l.id),
    bandeId: String(l.bande_id),
    date: String(l.date),
    nombre: Number(l.nombre),
    cause: texte(l.cause),
    notes: texte(l.notes),
    creeLe: ms(l.cree_le),
  }
}

export function ligneMortalite(m: Mortalite, fermeId: ID): Ligne {
  return {
    id: m.id,
    ferme_id: fermeId,
    bande_id: m.bandeId,
    date: m.date,
    nombre: m.nombre,
    cause: vide(m.cause),
    notes: vide(m.notes),
    cree_le: iso(m.creeLe),
  }
}

/* ---------- Charge ---------- */

export function chargeDepuis(l: Ligne): Charge {
  return {
    id: String(l.id),
    bandeId: l.bande_id ? String(l.bande_id) : null,
    date: String(l.date),
    categorie: String(l.categorie) as Categorie,
    type: texte(l.type),
    produit: texte(l.produit),
    quantite: nb(l.quantite),
    prixUnitaire: nb(l.prix_unitaire),
    poidsUnitaire: nb(l.poids_unitaire),
    montant: Number(l.montant ?? 0),
    fournisseur: texte(l.fournisseur),
    notes: texte(l.notes),
    creeLe: ms(l.cree_le),
  }
}

export function ligneCharge(c: Charge, fermeId: ID): Ligne {
  return {
    id: c.id,
    ferme_id: fermeId,
    bande_id: c.bandeId,
    date: c.date,
    categorie: c.categorie,
    type: vide(c.type),
    produit: vide(c.produit),
    quantite: c.quantite ?? null,
    prix_unitaire: c.prixUnitaire ?? null,
    poids_unitaire: c.poidsUnitaire ?? null,
    montant: c.montant,
    fournisseur: vide(c.fournisseur),
    notes: vide(c.notes),
    cree_le: iso(c.creeLe),
  }
}

/* ---------- Vente ---------- */

export function venteDepuis(l: Ligne): Vente {
  return {
    id: String(l.id),
    bandeId: l.bande_id ? String(l.bande_id) : null,
    date: String(l.date),
    produit: String(l.produit ?? 'poulets') as Produit,
    quantite: Number(l.quantite),
    prixUnitaire: Number(l.prix_unitaire),
    montant: Number(l.montant ?? Number(l.quantite) * Number(l.prix_unitaire)),
    statut: l.statut === 'credit' ? 'credit' : 'paye',
    client: texte(l.client),
    telephoneClient: texte(l.telephone_client),
    poidsMoyen: nb(l.poids_moyen),
    notes: texte(l.notes),
    creeLe: ms(l.cree_le),
  }
}

/** Le montant d'une vente est calculé par la base : il n'est jamais envoyé. */
export function ligneVente(v: Vente, fermeId: ID): Ligne {
  return {
    id: v.id,
    ferme_id: fermeId,
    bande_id: v.bandeId,
    date: v.date,
    produit: v.produit,
    quantite: v.quantite,
    prix_unitaire: v.prixUnitaire,
    statut: v.statut,
    client: vide(v.client),
    telephone_client: vide(v.telephoneClient),
    poids_moyen: v.poidsMoyen ?? null,
    notes: vide(v.notes),
    cree_le: iso(v.creeLe),
  }
}
