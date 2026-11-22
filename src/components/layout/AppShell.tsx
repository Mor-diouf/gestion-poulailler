import {
  BarChart3,
  Bird,
  ChevronsLeft,
  ChevronsRight,
  HandCoins,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  Receipt,
  Settings,
  Skull,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useDonnees } from '@/lib/store'
import { PanneauSaisie } from '../forms/Saisies'
import { useSaisie } from '../forms/saisie-context'
import { Logo } from '../Logo'
import { Panneau, Pastille, cx } from '../ui'

interface Lien {
  vers: string
  libelle: string
  icone: LucideIcon
}

const PRINCIPAUX: Lien[] = [
  { vers: '/', libelle: 'Accueil', icone: LayoutDashboard },
  { vers: '/bandes', libelle: 'Bandes', icone: Bird },
  { vers: '/charges', libelle: 'Charges', icone: Receipt },
  { vers: '/mortalite', libelle: 'Mortalité', icone: Skull },
  { vers: '/ventes', libelle: 'Ventes', icone: HandCoins },
  { vers: '/rapports', libelle: 'Rapports', icone: BarChart3 },
]
const PARAMETRES: Lien = { vers: '/parametres', libelle: 'Paramètres', icone: Settings }
const DANS_PLUS: Lien[] = [PRINCIPAUX[2], PRINCIPAUX[3], PRINCIPAUX[5], PARAMETRES]

function lireReplie() {
  try {
    return localStorage.getItem('mp:barre-repliee') === '1'
  } catch {
    return false
  }
}

function BarreLaterale() {
  const [replie, setReplie] = useState(lireReplie)
  const { ouvrir } = useSaisie()
  const d = useDonnees()
  useEffect(() => {
    try {
      localStorage.setItem('mp:barre-repliee', replie ? '1' : '0')
    } catch {
      /* préférence non enregistrée */
    }
  }, [replie])

  const item = (l: Lien) => (
    <NavLink
      key={l.vers}
      to={l.vers}
      end={l.vers === '/'}
      title={replie ? l.libelle : undefined}
      className={({ isActive }) =>
        cx(
          'flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors',
          isActive ? 'bg-white/[0.12] text-white' : 'text-white/70 hover:bg-white/[0.06] hover:text-white',
          replie && 'justify-center px-0',
        )
      }
    >
      <l.icone className="h-[19px] w-[19px] shrink-0" strokeWidth={1.75} />
      {!replie && l.libelle}
    </NavLink>
  )

  return (
    <aside
      className={cx(
        'sticky top-0 hidden h-screen shrink-0 flex-col bg-foret-800 px-3 py-5 text-white transition-[width] duration-200 lg:flex no-print',
        replie ? 'w-[76px]' : 'w-[248px]',
      )}
    >
      <Link to="/" className={cx('mb-6 px-1', replie && 'flex justify-center px-0')}>
        <Logo replie={replie} clair />
      </Link>
      <button
        type="button"
        onClick={() => ouvrir({ type: 'menu' })}
        className={cx(
          'mb-6 flex h-11 items-center justify-center gap-2 rounded-xl bg-ambre font-semibold text-encre shadow-sm transition hover:brightness-105',
          replie ? 'w-11 self-center' : 'w-full',
        )}
        title="Nouvelle saisie"
      >
        <Plus className="h-5 w-5" strokeWidth={2.25} />
        {!replie && 'Nouvelle saisie'}
      </button>
      <nav className="flex flex-1 flex-col gap-1">{PRINCIPAUX.map(item)}</nav>
      <div className="flex flex-col gap-1 border-t border-white/10 pt-3">
        {item(PARAMETRES)}
        {!replie && <p className="truncate px-3 pt-2 text-xs text-white/50">{d.ferme.nom}</p>}
        <button
          type="button"
          onClick={() => setReplie((r) => !r)}
          className={cx('mt-1 flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-white/60 hover:bg-white/[0.06] hover:text-white', replie && 'justify-center px-0')}
          aria-label={replie ? 'Déplier la barre' : 'Replier la barre'}
        >
          {replie ? <ChevronsRight className="h-[18px] w-[18px]" /> : <ChevronsLeft className="h-[18px] w-[18px]" />}
          {!replie && 'Replier'}
        </button>
      </div>
    </aside>
  )
}

function BarreOnglets() {
  const { ouvrir } = useSaisie()
  const [plus, setPlus] = useState(false)
  const lieu = useLocation()
  const dansPlus = DANS_PLUS.some((l) => lieu.pathname.startsWith(l.vers))
  useEffect(() => {
    setPlus(false)
  }, [lieu.pathname])

  const onglet = (l: Lien) => (
    <NavLink
      to={l.vers}
      end={l.vers === '/'}
      className={({ isActive }) =>
        cx('flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium', isActive ? 'text-foret' : 'text-gris')
      }
    >
      {({ isActive }) => (
        <>
          <span className={cx('flex h-7 w-12 items-center justify-center rounded-full transition', isActive && 'bg-foret-50')}>
            <l.icone className="h-[21px] w-[21px]" strokeWidth={isActive ? 2 : 1.75} />
          </span>
          {l.libelle}
        </>
      )}
    </NavLink>
  )

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ligne bg-white/95 pb-safe backdrop-blur lg:hidden no-print">
        <div className="mx-auto flex max-w-lg items-stretch px-1">
          {onglet(PRINCIPAUX[0])}
          {onglet(PRINCIPAUX[1])}
          <div className="flex flex-1 items-start justify-center">
            <button
              type="button"
              onClick={() => ouvrir({ type: 'menu' })}
              className="-mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-foret text-white shadow-haute ring-4 ring-creme transition active:scale-95"
              aria-label="Nouvelle saisie"
            >
              <Plus className="h-7 w-7" strokeWidth={2.25} />
            </button>
          </div>
          {onglet(PRINCIPAUX[4])}
          <button
            type="button"
            onClick={() => setPlus(true)}
            className={cx('flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium', dansPlus ? 'text-foret' : 'text-gris')}
          >
            <span className={cx('flex h-7 w-12 items-center justify-center rounded-full', dansPlus && 'bg-foret-50')}>
              <MoreHorizontal className="h-[21px] w-[21px]" strokeWidth={1.75} />
            </span>
            Plus
          </button>
        </div>
      </nav>
      <Panneau ouvert={plus} onFermer={() => setPlus(false)} titre="Plus">
        <div className="grid gap-2 pb-4">
          {DANS_PLUS.map((l) => (
            <Link key={l.vers} to={l.vers} className="flex min-h-[56px] items-center gap-3 rounded-2xl border border-ligne bg-white px-4 font-medium shadow-carte">
              <Pastille icone={l.icone} taille="sm" teinte={l.vers === '/mortalite' ? 'rouge' : l.vers === '/charges' ? 'ambre' : 'vert'} />
              {l.libelle}
            </Link>
          ))}
        </div>
      </Panneau>
    </>
  )
}

function EnteteMobile() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-ligne/70 bg-creme/90 px-4 backdrop-blur lg:hidden no-print">
      <Link to="/">
        <Logo />
      </Link>
      <Link to="/parametres" className="flex h-11 w-11 items-center justify-center rounded-full text-gris hover:bg-black/5" aria-label="Paramètres">
        <Settings className="h-5 w-5" strokeWidth={1.75} />
      </Link>
    </header>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const lieu = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [lieu.pathname])
  return (
    <div className="flex min-h-screen">
      <BarreLaterale />
      <div className="min-w-0 flex-1">
        <EnteteMobile />
        <main className="mx-auto w-full max-w-[1200px] px-4 pb-32 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">{children}</main>
      </div>
      <BarreOnglets />
      <PanneauSaisie />
    </div>
  )
}
