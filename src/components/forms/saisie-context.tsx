import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Bande, Charge, ID, Mortalite, Vente } from '@/lib/types'

export type Saisie =
  | { type: 'menu' }
  | { type: 'bande'; element?: Bande }
  | { type: 'mortalite'; element?: Mortalite; bandeId?: ID }
  | { type: 'charge'; element?: Charge; bandeId?: ID | null }
  | { type: 'vente'; element?: Vente; bandeId?: ID }

interface Ctx {
  saisie: Saisie | null
  ouvrir: (s: Saisie) => void
  fermer: () => void
}

const Contexte = createContext<Ctx | null>(null)

export function FournisseurSaisie({ children }: { children: ReactNode }) {
  const [saisie, setSaisie] = useState<Saisie | null>(null)
  const ouvrir = useCallback((s: Saisie) => setSaisie(s), [])
  const fermer = useCallback(() => setSaisie(null), [])
  const v = useMemo(() => ({ saisie, ouvrir, fermer }), [saisie, ouvrir, fermer])
  return <Contexte.Provider value={v}>{children}</Contexte.Provider>
}

export function useSaisie() {
  const c = useContext(Contexte)
  if (!c) throw new Error('useSaisie doit être utilisé dans FournisseurSaisie')
  return c
}
