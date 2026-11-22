import { ajouterJours, aujourdhui } from '@/lib/format'
import { useDonnees } from '@/lib/store'
import { Liste } from './ui'

export type Periode = 'tout' | '7' | '30' | 'mois'

export function bornesPeriode(p: Periode): [string, string] {
  const j = aujourdhui()
  if (p === '7') return [ajouterJours(j, -6), j]
  if (p === '30') return [ajouterJours(j, -29), j]
  if (p === 'mois') return [j.slice(0, 8) + '01', j]
  return ['0000-01-01', '9999-12-31']
}

/** Filtre de bande : '' = tout, 'ferme' = charges de toute la ferme, sinon l'identifiant d'une bande. */
export function FiltreBande({ valeur, onChange, avecFerme = false }: { valeur: string; onChange: (v: string) => void; avecFerme?: boolean }) {
  const d = useDonnees()
  return (
    <Liste value={valeur} onChange={(e) => onChange(e.target.value)} aria-label="Filtrer par bande">
      <option value="">Toutes les bandes</option>
      {avecFerme && <option value="ferme">Toute la ferme (hors bandes)</option>}
      {d.bandes.map((b) => (
        <option key={b.id} value={b.id}>
          {b.nom}
        </option>
      ))}
    </Liste>
  )
}

export function FiltrePeriode({ valeur, onChange }: { valeur: Periode; onChange: (v: Periode) => void }) {
  return (
    <Liste value={valeur} onChange={(e) => onChange(e.target.value as Periode)} aria-label="Filtrer par période">
      <option value="tout">Toute la période</option>
      <option value="7">7 derniers jours</option>
      <option value="30">30 derniers jours</option>
      <option value="mois">Ce mois-ci</option>
    </Liste>
  )
}
