import type { User } from '@supabase/supabase-js'
import { useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { donneesExemple } from './exemple'
import { aujourdhui } from './format'
import {
  bandeDepuis,
  chargeDepuis,
  fermeDepuis,
  ligneBande,
  ligneCharge,
  ligneFerme,
  ligneMortalite,
  ligneVente,
  mortaliteDepuis,
  venteDepuis,
} from './lignes'
import { messageErreur, supabase, supabaseConfigure } from './supabase'
import type { Bande, Charge, Donnees, Ferme, ID, Mortalite, Vente } from './types'

/**
 * Données de la ferme, enregistrées dans Supabase.
 * Les écrans lisent une copie en mémoire ; chaque modification est appliquée
 * tout de suite à l'écran, puis envoyée à Supabase. En cas d'échec,
 * un message s'affiche et les données sont rechargées depuis Supabase.
 */

const FERME_VIDE: Ferme = { nom: 'Ma ferme', prenom: '', seuilMortalite: 5, poussinsParCartonDefaut: 100 }

export function donneesVides(ferme: Ferme = FERME_VIDE): Donnees {
  return { version: 1, ferme, bandes: [], mortalites: [], charges: [], ventes: [] }
}

export type StatutSession = 'chargement' | 'deconnecte' | 'pret' | 'erreur' | 'nouveau-mot-de-passe'
export interface Session {
  statut: StatutSession
  email?: string
  erreur?: string
}

/**
 * Mode démonstration, seulement en développement (adresse avec « ?demo ») :
 * données d'exemple sans connexion, pour les captures d'écran. Absent de la version en ligne.
 */
const DEMO = import.meta.env.DEV && new URLSearchParams(window.location.search).has('demo')

let etat: Donnees = DEMO ? donneesExemple(aujourdhui()) : donneesVides()
let session: Session = DEMO
  ? { statut: 'pret', email: 'demo@exemple.sn' }
  : supabaseConfigure
  ? { statut: 'chargement' }
  : {
      statut: 'erreur',
      erreur:
        'Supabase n’est pas configuré. Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY dans le fichier .env, ou dans les variables d’environnement de Vercel, puis reconstruisez l’application.',
    }
let utilisateur: User | null = null
let fermeId: ID | null = null
const abonnes = new Set<() => void>()
const prevenir = () => abonnes.forEach((f) => f())

function majEtat(d: Donnees) {
  etat = d
  prevenir()
}
function majSession(s: Session) {
  session = s
  prevenir()
}
const abonner = (f: () => void) => {
  abonnes.add(f)
  return () => {
    abonnes.delete(f)
  }
}

export function useDonnees(): Donnees {
  return useSyncExternalStore(abonner, () => etat)
}
export function useSession(): Session {
  return useSyncExternalStore(abonner, () => session)
}
export function lireDonnees(): Donnees {
  return etat
}

export function nouvelId(): ID {
  try {
    return crypto.randomUUID()
  } catch {
    // Repli pour les navigateurs anciens : UUID v4 aléatoire.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
  }
}

/* ======================= Chargement ======================= */

async function verifier<T>(p: PromiseLike<{ data: T; error: unknown }>): Promise<T> {
  const { data, error } = await p
  if (error) throw error
  return data
}

async function chargerFerme(u: User) {
  const fermes = await verifier(supabase.from('fermes').select('*').order('cree_le').limit(1))
  if (fermes && fermes.length > 0) return fermes[0]
  const meta = (u.user_metadata ?? {}) as { prenom?: string; ferme?: string }
  return verifier(
    supabase
      .from('fermes')
      .insert({ nom: meta.ferme?.trim() || 'Ma ferme', prenom: meta.prenom?.trim() || '', proprietaire_id: u.id })
      .select('*')
      .single(),
  )
}

async function charger(u: User, silencieux = false) {
  if (!silencieux) majSession({ statut: 'chargement', email: u.email })
  try {
    const f = await chargerFerme(u)
    fermeId = String(f.id)
    const [b, m, c, v] = await Promise.all([
      verifier(supabase.from('bandes').select('*').eq('ferme_id', fermeId)),
      verifier(supabase.from('mortalites').select('*').eq('ferme_id', fermeId)),
      verifier(supabase.from('charges').select('*').eq('ferme_id', fermeId)),
      verifier(supabase.from('ventes').select('*').eq('ferme_id', fermeId)),
    ])
    majEtat({
      version: 1,
      ferme: fermeDepuis(f),
      bandes: (b ?? []).map(bandeDepuis),
      mortalites: (m ?? []).map(mortaliteDepuis),
      charges: (c ?? []).map(chargeDepuis),
      ventes: (v ?? []).map(venteDepuis),
    })
    majSession({ statut: 'pret', email: u.email })
  } catch (e) {
    if (silencieux) {
      toast.error('Actualisation impossible', { description: messageErreur(e) })
    } else {
      majSession({ statut: 'erreur', email: u.email, erreur: messageErreur(e) })
    }
  }
}

export function recharger(silencieux = true) {
  if (utilisateur) return charger(utilisateur, silencieux && session.statut === 'pret')
  return Promise.resolve()
}

if (supabaseConfigure && !DEMO) {
  supabase.auth.onAuthStateChange((evenement, s) => {
    // Les appels à Supabase se font hors du rappel, comme le recommande la bibliothèque.
    setTimeout(() => {
      if (evenement === 'PASSWORD_RECOVERY') {
        utilisateur = s?.user ?? null
        majSession({ statut: 'nouveau-mot-de-passe', email: s?.user.email })
        return
      }
      if (!s?.user) {
        utilisateur = null
        fermeId = null
        majEtat(donneesVides())
        majSession({ statut: 'deconnecte' })
        return
      }
      const change = utilisateur?.id !== s.user.id
      utilisateur = s.user
      if (change && session.statut !== 'nouveau-mot-de-passe') void charger(s.user)
    }, 0)
  })

  // Données à jour quand on revient sur l'application, par exemple après une saisie sur un autre appareil.
  let derniere = 0
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || session.statut !== 'pret') return
    if (Date.now() - derniere < 30_000) return
    derniere = Date.now()
    void recharger(true)
  })
}

export async function deconnecter() {
  await supabase.auth.signOut()
}

/** Appelé après le choix d'un nouveau mot de passe. */
export function reprendreApresMotDePasse() {
  if (utilisateur) void charger(utilisateur)
}

/* ======================= Écritures ======================= */

function envoyer(op: () => PromiseLike<{ error: unknown }>) {
  if (!fermeId) return
  Promise.resolve(op()).then(
    ({ error }) => error && echec(error),
    (e) => echec(e),
  )
}

function echec(e: unknown) {
  toast.error("La modification n'a pas été enregistrée", { description: messageErreur(e) })
  void recharger(true)
}

function remplacerLocal<T extends { id: ID }>(liste: T[], item: T): T[] {
  return liste.some((x) => x.id === item.id) ? liste.map((x) => (x.id === item.id ? item : x)) : [...liste, item]
}

/** Remplace toutes les saisies de la ferme par celles de `d` (exemple ou sauvegarde). */
async function remplacerTout(d: Donnees | null) {
  if (!fermeId) throw new Error('Aucune ferme chargée.')
  const fid = fermeId
  await verifier(supabase.from('ventes').delete().eq('ferme_id', fid))
  await verifier(supabase.from('charges').delete().eq('ferme_id', fid))
  await verifier(supabase.from('bandes').delete().eq('ferme_id', fid))
  if (d) {
    // Nouveaux identifiants : les données d'exemple et les anciennes sauvegardes n'ont pas d'UUID.
    const ids = new Map<string, string>()
    const bandes: Bande[] = d.bandes.map((b) => {
      const id = nouvelId()
      ids.set(b.id, id)
      return { ...b, id }
    })
    const lien = (id: string | null) => (id === null ? null : (ids.get(id) ?? undefined))
    const mortalites: Mortalite[] = d.mortalites.flatMap((m) => (lien(m.bandeId) ? [{ ...m, id: nouvelId(), bandeId: lien(m.bandeId)! }] : []))
    const charges: Charge[] = d.charges.flatMap((c) => (lien(c.bandeId) !== undefined ? [{ ...c, id: nouvelId(), bandeId: lien(c.bandeId)! }] : []))
    const ventes: Vente[] = d.ventes.flatMap((v) => (lien(v.bandeId) !== undefined ? [{ ...v, id: nouvelId(), bandeId: lien(v.bandeId)! }] : []))
    if (bandes.length) await verifier(supabase.from('bandes').insert(bandes.map((x) => ligneBande(x, fid))))
    if (mortalites.length) await verifier(supabase.from('mortalites').insert(mortalites.map((x) => ligneMortalite(x, fid))))
    if (charges.length) await verifier(supabase.from('charges').insert(charges.map((x) => ligneCharge(x, fid))))
    if (ventes.length) await verifier(supabase.from('ventes').insert(ventes.map((x) => ligneVente(x, fid))))
  }
  await recharger(true)
}

export const actions = {
  enregistrerBande: (b: Bande) => {
    majEtat({ ...etat, bandes: remplacerLocal(etat.bandes, b) })
    envoyer(() => supabase.from('bandes').upsert(ligneBande(b, fermeId!)))
  },
  enregistrerMortalite: (m: Mortalite) => {
    majEtat({ ...etat, mortalites: remplacerLocal(etat.mortalites, m) })
    envoyer(() => supabase.from('mortalites').upsert(ligneMortalite(m, fermeId!)))
  },
  enregistrerCharge: (c: Charge) => {
    majEtat({ ...etat, charges: remplacerLocal(etat.charges, c) })
    envoyer(() => supabase.from('charges').upsert(ligneCharge(c, fermeId!)))
  },
  enregistrerVente: (v: Vente) => {
    majEtat({ ...etat, ventes: remplacerLocal(etat.ventes, v) })
    envoyer(() => supabase.from('ventes').upsert(ligneVente(v, fermeId!)))
  },
  supprimerMortalite: (id: ID) => {
    majEtat({ ...etat, mortalites: etat.mortalites.filter((x) => x.id !== id) })
    envoyer(() => supabase.from('mortalites').delete().eq('id', id))
  },
  supprimerCharge: (id: ID) => {
    majEtat({ ...etat, charges: etat.charges.filter((x) => x.id !== id) })
    envoyer(() => supabase.from('charges').delete().eq('id', id))
  },
  supprimerVente: (id: ID) => {
    majEtat({ ...etat, ventes: etat.ventes.filter((x) => x.id !== id) })
    envoyer(() => supabase.from('ventes').delete().eq('id', id))
  },
  /** Supprime la bande ; la base supprime aussi ses charges, mortalités et ventes. */
  supprimerBande: (id: ID) => {
    majEtat({
      ...etat,
      bandes: etat.bandes.filter((b) => b.id !== id),
      mortalites: etat.mortalites.filter((m) => m.bandeId !== id),
      charges: etat.charges.filter((c) => c.bandeId !== id),
      ventes: etat.ventes.filter((v) => v.bandeId !== id),
    })
    envoyer(() => supabase.from('bandes').delete().eq('id', id))
  },
  changerStatutBande: (id: ID, statut: Bande['statut']) => {
    majEtat({ ...etat, bandes: etat.bandes.map((b) => (b.id === id ? { ...b, statut } : b)) })
    envoyer(() => supabase.from('bandes').update({ statut }).eq('id', id))
  },
  marquerPaye: (id: ID) => {
    majEtat({ ...etat, ventes: etat.ventes.map((v) => (v.id === id ? { ...v, statut: 'paye' } : v)) })
    envoyer(() => supabase.from('ventes').update({ statut: 'paye' }).eq('id', id))
  },
  modifierFerme: (f: Partial<Ferme>) => {
    majEtat({ ...etat, ferme: { ...etat.ferme, ...f } })
    envoyer(() => supabase.from('fermes').update(ligneFerme(f)).eq('id', fermeId!))
  },
  chargerExemple: () => remplacerTout(donneesExemple(aujourdhui())),
  toutEffacer: () => remplacerTout(null),
  importer: async (d: Donnees) => {
    if (!d || d.version !== 1 || !Array.isArray(d.bandes)) throw new Error('Fichier de sauvegarde invalide.')
    await remplacerTout({ ...donneesVides(), ...d })
    if (d.ferme) actions.modifierFerme({ ...d.ferme })
  },
}
