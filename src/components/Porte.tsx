import { AlertTriangle, LogOut, MailCheck, RefreshCw } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { deconnecter, recharger, reprendreApresMotDePasse, useSession } from '@/lib/store'
import { adresseRetour, messageErreur, supabase } from '@/lib/supabase'
import { Logo, LogoComplet } from './Logo'
import { Bouton, Carte, Champ, Choix, Saisie } from './ui'

function Cadre({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-creme lg:flex-row">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-foret-800 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-ambre/10 blur-3xl" />
        <Logo clair />
        <div className="relative flex items-center gap-10 xl:gap-14">
          <LogoComplet className="h-auto w-[230px] shrink-0 drop-shadow-[0_20px_40px_rgba(0,0,0,0.35)] xl:w-[290px]" />
          <div className="max-w-sm">
            <p className="font-titre text-[30px] font-bold leading-tight xl:text-[34px]">Chaque bande, de l'arrivée des poussins à la vente.</p>
            <p className="mt-4 text-white/70">Dépenses, pertes, ventes et bénéfice, calculés pour vous, sur téléphone comme sur ordinateur.</p>
          </div>
        </div>
        <p className="relative text-sm text-white/50">Qualité · Confiance · Satisfaction</p>
      </div>
      <div className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center">
        <div className="w-full max-w-[400px]">
          <div className="mb-6 flex justify-center lg:hidden">
            <LogoComplet className="h-auto w-[150px]" />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

function Erreur({ message }: { message: string }) {
  if (!message) return null
  return <p className="rounded-xl bg-brique-50 px-4 py-3 text-sm text-brique">{message}</p>
}

/* ======================= Connexion et inscription ======================= */

function Connexion() {
  const [mode, setMode] = useState<'connexion' | 'inscription' | 'oubli'>('connexion')
  const [f, setF] = useState({ email: '', motDePasse: '', prenom: '', ferme: '' })
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [courrier, setCourrier] = useState<null | 'confirmation' | 'oubli'>(null)
  const maj = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }))

  const envoyer = async (e: FormEvent) => {
    e.preventDefault()
    setErreur('')
    const email = f.email.trim()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErreur('Indiquez une adresse e-mail valide.')
    if (mode !== 'oubli' && f.motDePasse.length < 6) return setErreur('Le mot de passe doit contenir au moins 6 caractères.')
    setEnvoi(true)
    try {
      if (mode === 'connexion') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: f.motDePasse })
        if (error) throw error
      } else if (mode === 'inscription') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: f.motDePasse,
          options: { emailRedirectTo: adresseRetour(), data: { prenom: f.prenom.trim(), ferme: f.ferme.trim() } },
        })
        if (error) throw error
        if (!data.session) setCourrier('confirmation')
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: adresseRetour() })
        if (error) throw error
        setCourrier('oubli')
      }
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setEnvoi(false)
    }
  }

  if (courrier) {
    return (
      <Cadre>
        <Carte className="p-6 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-foret-50 text-foret">
            <MailCheck className="h-7 w-7" strokeWidth={1.75} />
          </span>
          <h1 className="text-xl font-bold">Vérifiez vos e-mails</h1>
          <p className="mt-2 text-sm text-gris">
            {courrier === 'confirmation'
              ? `Un lien de confirmation a été envoyé à ${f.email.trim()}. Ouvrez-le pour activer votre compte, puis connectez-vous.`
              : `Un lien pour choisir un nouveau mot de passe a été envoyé à ${f.email.trim()}.`}
          </p>
          <Bouton
            variante="secondaire"
            className="mt-6 w-full"
            onClick={() => {
              setCourrier(null)
              setMode('connexion')
            }}
          >
            Retour à la connexion
          </Bouton>
        </Carte>
      </Cadre>
    )
  }

  return (
    <Cadre>
      <h1 className="text-[28px] font-bold leading-tight text-encre">
        {mode === 'connexion' ? 'Bon retour' : mode === 'inscription' ? 'Créer votre compte' : 'Mot de passe oublié'}
      </h1>
      <p className="mb-6 mt-1 text-sm text-gris">
        {mode === 'connexion'
          ? 'Connectez-vous pour retrouver votre ferme.'
          : mode === 'inscription'
            ? 'Quelques secondes suffisent pour commencer.'
            : 'Recevez un lien par e-mail pour en choisir un nouveau.'}
      </p>
      {mode !== 'oubli' && (
        <Choix
          className="mb-5"
          valeur={mode}
          onChange={(m) => {
            setMode(m)
            setErreur('')
          }}
          options={[
            { valeur: 'connexion', libelle: 'Se connecter' },
            { valeur: 'inscription', libelle: 'Créer un compte' },
          ]}
        />
      )}
      <form onSubmit={envoyer} className="space-y-4" noValidate>
        {mode === 'inscription' && (
          <div className="grid grid-cols-2 gap-3">
            <Champ libelle="Prénom">{(id) => <Saisie id={id} value={f.prenom} onChange={maj('prenom')} autoComplete="given-name" />}</Champ>
            <Champ libelle="Nom de la ferme">{(id) => <Saisie id={id} value={f.ferme} onChange={maj('ferme')} placeholder="Ma ferme" />}</Champ>
          </div>
        )}
        <Champ libelle="E-mail">
          {(id) => <Saisie id={id} type="email" inputMode="email" autoComplete="email" value={f.email} onChange={maj('email')} autoFocus />}
        </Champ>
        {mode !== 'oubli' && (
          <Champ
            libelle="Mot de passe"
            aide={
              mode === 'connexion' ? (
                <button type="button" className="font-medium text-foret hover:underline" onClick={() => setMode('oubli')}>
                  Mot de passe oublié ?
                </button>
              ) : (
                'Au moins 6 caractères.'
              )
            }
          >
            {(id) => (
              <Saisie
                id={id}
                type="password"
                autoComplete={mode === 'connexion' ? 'current-password' : 'new-password'}
                value={f.motDePasse}
                onChange={maj('motDePasse')}
              />
            )}
          </Champ>
        )}
        <Erreur message={erreur} />
        <Bouton type="submit" taille="lg" className="w-full" disabled={envoi}>
          {envoi ? 'Patientez…' : mode === 'connexion' ? 'Se connecter' : mode === 'inscription' ? 'Créer mon compte' : 'Envoyer le lien'}
        </Bouton>
        {mode === 'oubli' && (
          <Bouton variante="fantome" className="w-full" onClick={() => setMode('connexion')}>
            Retour à la connexion
          </Bouton>
        )}
      </form>
    </Cadre>
  )
}

/* ======================= Nouveau mot de passe ======================= */

function NouveauMotDePasse() {
  const [mdp, setMdp] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const envoyer = async (e: FormEvent) => {
    e.preventDefault()
    if (mdp.length < 6) return setErreur('Le mot de passe doit contenir au moins 6 caractères.')
    setEnvoi(true)
    const { error } = await supabase.auth.updateUser({ password: mdp })
    setEnvoi(false)
    if (error) return setErreur(messageErreur(error))
    toast.success('Mot de passe modifié')
    reprendreApresMotDePasse()
  }
  return (
    <Cadre>
      <h1 className="text-[28px] font-bold text-encre">Nouveau mot de passe</h1>
      <p className="mb-6 mt-1 text-sm text-gris">Choisissez le mot de passe de votre compte.</p>
      <form onSubmit={envoyer} className="space-y-4" noValidate>
        <Champ libelle="Nouveau mot de passe" aide="Au moins 6 caractères.">
          {(id) => <Saisie id={id} type="password" autoComplete="new-password" value={mdp} onChange={(e) => setMdp(e.target.value)} autoFocus />}
        </Champ>
        <Erreur message={erreur} />
        <Bouton type="submit" taille="lg" className="w-full" disabled={envoi}>
          {envoi ? 'Patientez…' : 'Enregistrer'}
        </Bouton>
      </form>
    </Cadre>
  )
}

/* ======================= Chargement et erreur ======================= */

function Chargement() {
  return (
    <div className="flex min-h-screen bg-creme">
      <div className="hidden w-[248px] bg-foret-800 lg:block" />
      <div className="mx-auto w-full max-w-[1200px] px-4 pt-6 sm:px-6 lg:px-10 lg:pt-8">
        <div className="mb-6 lg:hidden">
          <Logo />
        </div>
        <div className="h-4 w-44 animate-pulse rounded-full bg-[#ECE7DC]" />
        <div className="mt-3 h-8 w-64 animate-pulse rounded-full bg-[#ECE7DC]" />
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[150px] animate-pulse rounded-2xl border border-ligne bg-white" />
          ))}
        </div>
        <div className="mt-4 h-[300px] animate-pulse rounded-2xl border border-ligne bg-white" />
        <p className="sr-only">Chargement de vos données…</p>
      </div>
    </div>
  )
}

function EcranErreur({ message, connecte }: { message: string; connecte: boolean }) {
  const [essai, setEssai] = useState(false)
  return (
    <Cadre>
      <Carte className="p-6">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-ambre-50 text-ambre-700">
          <AlertTriangle className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <h1 className="text-xl font-bold">Impossible d'ouvrir vos données</h1>
        <p className="mt-2 text-sm text-gris">{message}</p>
        {connecte && (
          <div className="mt-6 grid gap-3">
            <Bouton
              icone={RefreshCw}
              disabled={essai}
              onClick={async () => {
                setEssai(true)
                await recharger(false)
                setEssai(false)
              }}
            >
              Réessayer
            </Bouton>
            <Bouton variante="secondaire" icone={LogOut} onClick={() => void deconnecter()}>
              Se déconnecter
            </Bouton>
          </div>
        )}
      </Carte>
    </Cadre>
  )
}

/** Affiche l'application seulement quand l'utilisateur est connecté et ses données chargées. */
export function Porte({ children }: { children: ReactNode }) {
  const s = useSession()
  if (s.statut === 'chargement') return <Chargement />
  if (s.statut === 'deconnecte') return <Connexion />
  if (s.statut === 'nouveau-mot-de-passe') return <NouveauMotDePasse />
  if (s.statut === 'erreur') return <EcranErreur message={s.erreur ?? 'Erreur inconnue.'} connecte={Boolean(s.email)} />
  return <>{children}</>
}
