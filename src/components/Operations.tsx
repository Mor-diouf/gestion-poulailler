import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Operation } from '@/lib/calculs'
import { dateFr, fcfaCourt } from '@/lib/format'
import { ICONE_OPERATION } from '@/lib/icones'
import { useDonnees } from '@/lib/store'
import { useSaisie } from './forms/saisie-context'
import { Pastille, cx } from './ui'

/** Liste d'opérations cliquables : un clic ouvre la saisie pour la modifier. */
export function ListeOperations({ ops, masquerBande = false }: { ops: Operation[]; masquerBande?: boolean }) {
  const d = useDonnees()
  const { ouvrir } = useSaisie()
  const navigate = useNavigate()
  const nomBande = (id: string | null) => (id ? (d.bandes.find((b) => b.id === id)?.nom ?? 'Bande supprimée') : 'Toute la ferme')

  const ouvrirOp = (o: Operation) => {
    if (o.type === 'bande') return navigate('/bandes/' + o.ref)
    if (o.type === 'mortalite') {
      const element = d.mortalites.find((x) => x.id === o.ref)
      if (element) ouvrir({ type: 'mortalite', element })
    }
    if (o.type === 'charge') {
      const element = d.charges.find((x) => x.id === o.ref)
      if (element) ouvrir({ type: 'charge', element })
    }
    if (o.type === 'vente') {
      const element = d.ventes.find((x) => x.id === o.ref)
      if (element) ouvrir({ type: 'vente', element })
    }
  }

  return (
    <ul className="divide-y divide-ligne">
      {ops.map((o) => {
        const { icone, teinte } = ICONE_OPERATION[o.type]
        const credit = o.type === 'vente' && d.ventes.find((v) => v.id === o.ref)?.statut === 'credit'
        return (
          <li key={o.id}>
            <button type="button" onClick={() => ouvrirOp(o)} className="group flex w-full items-center gap-3 px-4 py-3.5 text-left sm:px-5 transition hover:bg-creme/60">
              <Pastille icone={icone} teinte={teinte} taille="sm" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[15px] font-medium leading-snug text-encre sm:truncate">{o.libelle}</p>
                <p className="truncate text-xs text-gris">
                  {dateFr(o.date)}
                  {!masquerBande && <> · {nomBande(o.bandeId)}</>}
                  {credit && <span className="ml-1.5 font-medium text-ambre-700">· À crédit</span>}
                </p>
              </div>
              {o.montant !== null && (
                <span className={cx('chiffres shrink-0 text-[15px] font-semibold', o.sens === 'entree' ? 'text-foret' : 'text-encre')}>
                  {o.sens === 'entree' ? '+' : '−'}
                  {fcfaCourt(o.montant)}
                </span>
              )}
              <ChevronRight className="h-4 w-4 shrink-0 text-[#C9C3B6] transition group-hover:translate-x-0.5" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
