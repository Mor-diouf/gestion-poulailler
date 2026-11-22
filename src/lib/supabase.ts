import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const cle = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const supabaseConfigure = Boolean(url && cle)

/**
 * Client Supabase. Le flux PKCE place le code de confirmation dans « ?code= »,
 * ce qui reste compatible avec le routage par « # » de l'application.
 */
export const supabase = createClient(url ?? 'http://localhost', cle ?? 'absent', {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

/** Adresse de retour après un e-mail de confirmation ou de mot de passe oublié. */
export function adresseRetour() {
  return window.location.origin + window.location.pathname
}

/** Traduit les erreurs courantes de Supabase en français. */
export function messageErreur(e: unknown): string {
  const m = (e as { message?: string })?.message ?? String(e)
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou mot de passe incorrect.'
  if (/Email not confirmed/i.test(m)) return "Votre e-mail n'est pas encore confirmé. Ouvrez le lien reçu par e-mail."
  if (/User already registered/i.test(m)) return 'Un compte existe déjà avec cet e-mail. Connectez-vous.'
  if (/Password should be at least/i.test(m)) return 'Le mot de passe doit contenir au moins 6 caractères.'
  if (/rate limit|too many/i.test(m)) return 'Trop de tentatives. Patientez quelques minutes puis réessayez.'
  if (/invalid.*email|Unable to validate email/i.test(m)) return 'Adresse e-mail invalide.'
  if (/Failed to fetch|NetworkError|network/i.test(m)) return 'Connexion impossible. Vérifiez votre accès à Internet.'
  if (/schema cache|PGRST205|does not exist/i.test(m))
    return "La base de données n'est pas encore installée. Exécutez le fichier supabase/schema.sql dans Supabase."
  return m
}
