import * as Dialog from '@radix-ui/react-dialog'
import clsx from 'clsx'
import { ChevronDown, X, type LucideIcon } from 'lucide-react'
import {
  forwardRef,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'

export const cx = clsx

/* ---------- Boutons ---------- */

type Variante = 'primaire' | 'secondaire' | 'fantome' | 'danger' | 'ambre'

const VARIANTES: Record<Variante, string> = {
  primaire: 'bg-foret text-white hover:bg-foret-700 shadow-sm',
  secondaire: 'bg-white text-encre border border-ligne hover:bg-creme',
  fantome: 'text-encre hover:bg-black/[0.04]',
  danger: 'bg-brique text-white hover:bg-brique/90',
  ambre: 'bg-ambre-50 text-ambre-700 border border-ambre-100 hover:bg-ambre-100',
}

export const Bouton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; taille?: 'sm' | 'md' | 'lg'; icone?: LucideIcon }
>(function Bouton({ variante = 'primaire', taille = 'md', icone: Icone, className, children, ...p }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      {...p}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foret/40 disabled:opacity-50 disabled:pointer-events-none select-none',
        taille === 'sm' && 'h-9 px-3 text-sm',
        taille === 'md' && 'h-11 px-4 text-[15px]',
        taille === 'lg' && 'h-12 px-5 text-base',
        VARIANTES[variante],
        className,
      )}
    >
      {Icone && <Icone className={taille === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]'} strokeWidth={2} />}
      {children}
    </button>
  )
})

/* ---------- Cartes ---------- */

export function Carte({ className, children, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...p} className={cx('rounded-2xl border border-ligne bg-white shadow-carte print-plain', className)}>
      {children}
    </div>
  )
}

export function EnteteCarte({ titre, sousTitre, action }: { titre: ReactNode; sousTitre?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-encre">{titre}</h2>
        {sousTitre && <p className="mt-0.5 text-sm text-gris">{sousTitre}</p>}
      </div>
      {action}
    </div>
  )
}

/* ---------- Pastille d'icône ---------- */

const TEINTES = {
  vert: 'bg-foret-50 text-foret',
  ambre: 'bg-ambre-50 text-ambre-700',
  rouge: 'bg-brique-50 text-brique',
  gris: 'bg-[#F2F0EA] text-[#4B5563]',
  bleu: 'bg-[#EAF1F6] text-[#2B5876]',
} as const
export type Teinte = keyof typeof TEINTES

export function Pastille({ icone: Icone, teinte = 'vert', taille = 'md' }: { icone: LucideIcon; teinte?: Teinte; taille?: 'sm' | 'md' | 'lg' }) {
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-xl',
        TEINTES[teinte],
        taille === 'sm' && 'h-8 w-8',
        taille === 'md' && 'h-9 w-9 sm:h-10 sm:w-10',
        taille === 'lg' && 'h-12 w-12 rounded-2xl',
      )}
    >
      <Icone className={taille === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} strokeWidth={1.75} />
    </span>
  )
}

/* ---------- Badges ---------- */

export function Badge({ teinte = 'gris', children, className }: { teinte?: Teinte; children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium sm:px-2.5 sm:text-xs', TEINTES[teinte], className)}>
      {children}
    </span>
  )
}

/* ---------- Champs de formulaire ---------- */

const CHAMP =
  'block w-full h-12 rounded-xl border border-ligne bg-white px-3.5 text-[16px] text-encre placeholder:text-[#A3A3A3] transition focus:border-foret focus:outline-none focus:ring-2 focus:ring-foret/15'

export function Champ({
  libelle,
  aide,
  suffixe,
  children,
  id,
}: {
  libelle: string
  aide?: ReactNode
  suffixe?: string
  children: (id: string) => ReactNode
  id?: string
}) {
  const auto = useId()
  const cle = id ?? auto
  return (
    <div className="space-y-1.5">
      <label htmlFor={cle} className="block text-sm font-medium text-encre">
        {libelle}
      </label>
      <div className="relative">
        {children(cle)}
        {suffixe && (
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-gris">{suffixe}</span>
        )}
      </div>
      {aide && <p className="text-xs text-gris">{aide}</p>}
    </div>
  )
}

export const Saisie = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { avecSuffixe?: boolean }>(
  function Saisie({ className, avecSuffixe, ...p }, ref) {
    return <input ref={ref} {...p} className={cx(CHAMP, avecSuffixe && 'pr-16', className)} />
  },
)

/** Champ numérique : ouvre le clavier numérique sur mobile. */
export const SaisieNombre = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { decimal?: boolean; avecSuffixe?: boolean }
>(function SaisieNombre({ decimal, ...p }, ref) {
  return <Saisie ref={ref} type="text" inputMode={decimal ? 'decimal' : 'numeric'} autoComplete="off" {...p} />
})

export function Liste({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...p} className={cx(CHAMP, 'appearance-none pr-10', className)}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gris" />
    </div>
  )
}

export function Zone(p: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...p} className={cx(CHAMP, 'h-auto py-3', p.className)} />
}

/** Choix en boutons, pour deux à quatre options. */
export function Choix<T extends string>({
  valeur,
  options,
  onChange,
  className,
}: {
  valeur: T
  options: { valeur: T; libelle: ReactNode }[]
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cx('grid gap-1 rounded-xl bg-[#F2F0EA] p-1', className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.valeur}
          type="button"
          onClick={() => onChange(o.valeur)}
          className={cx(
            'h-10 rounded-lg px-2 text-sm font-medium transition',
            valeur === o.valeur ? 'bg-white text-encre shadow-sm' : 'text-gris hover:text-encre',
          )}
        >
          {o.libelle}
        </button>
      ))}
    </div>
  )
}

/** Section repliable « Plus de détails » pour les champs facultatifs. */
export function PlusDeDetails({ children, ouvertParDefaut = false }: { children: ReactNode; ouvertParDefaut?: boolean }) {
  const [ouvert, setOuvert] = useState(ouvertParDefaut)
  return (
    <div className="rounded-xl border border-dashed border-ligne">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        className="flex h-12 w-full items-center justify-between px-4 text-sm font-medium text-gris hover:text-encre"
        aria-expanded={ouvert}
      >
        Plus de détails
        <ChevronDown className={cx('h-4 w-4 transition-transform', ouvert && 'rotate-180')} />
      </button>
      {ouvert && <div className="space-y-4 px-4 pb-4 animate-fondu">{children}</div>}
    </div>
  )
}

/* ---------- Panneau (sheet) ---------- */

export function Panneau({
  ouvert,
  onFermer,
  titre,
  description,
  children,
  pied,
}: {
  ouvert: boolean
  onFermer: () => void
  titre: string
  description?: string
  children: ReactNode
  pied?: ReactNode
}) {
  return (
    <Dialog.Root open={ouvert} onOpenChange={(o) => !o && onFermer()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-encre/40 backdrop-blur-[2px] animate-fondu" />
        <Dialog.Content
          aria-describedby={description ? undefined : undefined}
          className={cx(
            'fixed z-50 flex flex-col bg-creme shadow-haute focus:outline-none',
            'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[28px] animate-monte',
            'sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[480px] sm:rounded-none sm:rounded-l-[28px] sm:animate-glisse',
          )}
        >
          <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-black/10 sm:hidden" />
          <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-4 sm:px-6 sm:pt-6">
            <div>
              <Dialog.Title className="font-titre text-xl font-semibold text-encre">{titre}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-gris">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{titre}</Dialog.Description>
              )}
            </div>
            <Dialog.Close className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-gris hover:bg-black/5" aria-label="Fermer">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-4 sm:px-6">{children}</div>
          {pied && <div className="border-t border-ligne bg-white/70 px-5 py-4 pb-safe sm:px-6">{pied}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/* ---------- Confirmation ---------- */

export function Confirmation({
  ouvert,
  onFermer,
  onConfirmer,
  titre,
  message,
  libelle = 'Supprimer',
}: {
  ouvert: boolean
  onFermer: () => void
  onConfirmer: () => void
  titre: string
  message: ReactNode
  libelle?: string
}) {
  return (
    <Dialog.Root open={ouvert} onOpenChange={(o) => !o && onFermer()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-encre/40 animate-fondu" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[70] w-[calc(100%-32px)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-haute animate-fondu focus:outline-none">
          <Dialog.Title className="font-titre text-lg font-semibold">{titre}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gris">{message}</Dialog.Description>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Bouton variante="secondaire" onClick={onFermer}>
              Annuler
            </Bouton>
            <Bouton
              variante="danger"
              onClick={() => {
                onConfirmer()
                onFermer()
              }}
            >
              {libelle}
            </Bouton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/* ---------- État vide ---------- */

export function EtatVide({
  icone: Icone,
  titre,
  texte,
  action,
}: {
  icone: LucideIcon
  titre: string
  texte?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="relative mb-4">
        <div className="absolute inset-0 -m-3 rounded-full bg-foret-50" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-ligne bg-white text-foret shadow-sm">
          <Icone className="h-6 w-6" strokeWidth={1.5} />
        </div>
      </div>
      <p className="font-titre text-base font-semibold text-encre">{titre}</p>
      {texte && <p className="mt-1 max-w-xs text-sm text-gris">{texte}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ---------- Divers ---------- */

export function TitrePage({ titre, sousTitre, actions }: { titre: string; sousTitre?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-encre sm:text-[28px]">{titre}</h1>
        {sousTitre && <p className="mt-1 text-sm text-gris">{sousTitre}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 no-print">{actions}</div>}
    </div>
  )
}

export function Ligne({ libelle, valeur, fort, teinte }: { libelle: ReactNode; valeur: ReactNode; fort?: boolean; teinte?: 'vert' | 'rouge' }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className={cx('text-sm', fort ? 'font-semibold text-encre' : 'text-gris')}>{libelle}</span>
      <span
        className={cx(
          'chiffres text-right text-[15px]',
          fort ? 'font-bold' : 'font-semibold',
          teinte === 'vert' && 'text-foret',
          teinte === 'rouge' && 'text-brique',
        )}
      >
        {valeur}
      </span>
    </div>
  )
}

export function BarreProgression({ valeur, max, teinte = 'vert' }: { valeur: number; max: number; teinte?: 'vert' | 'ambre' }) {
  const p = max > 0 ? Math.min(100, Math.max(0, (valeur / max) * 100)) : 0
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#EFEBE2]">
      <div className={cx('h-full rounded-full transition-all', teinte === 'vert' ? 'bg-foret' : 'bg-ambre')} style={{ width: `${p}%` }} />
    </div>
  )
}
