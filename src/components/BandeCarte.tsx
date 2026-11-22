import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ageBande, bilanBande } from '@/lib/calculs'
import { aujourdhui, dateFr, fcfaCourt, nombre, pct } from '@/lib/format'
import { useDonnees } from '@/lib/store'
import type { Bande } from '@/lib/types'
import { Badge, BarreProgression, Carte, cx } from './ui'

export function BandeCarte({ bande }: { bande: Bande }) {
  const d = useDonnees()
  const bi = bilanBande(bande, d)
  const age = ageBande(bande, aujourdhui())
  const enCours = bande.statut === 'en_cours'
  return (
    <Link to={'/bandes/' + bande.id} className="group block">
      <Carte className="h-full p-5 transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-haute">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-titre text-base font-semibold text-encre">{bande.nom}</h3>
            <p className="mt-0.5 text-xs text-gris">Arrivée le {dateFr(bande.dateArrivee)}</p>
          </div>
          {enCours ? (
            <Badge teinte={age > 42 ? 'ambre' : 'vert'}>
              <span className="chiffres">J{age}</span>
            </Badge>
          ) : (
            <Badge>Terminée</Badge>
          )}
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="text-gris">{enCours ? 'Vivants' : 'Vendus'}</span>
            <span className="chiffres">
              <span className="font-bold text-encre">{nombre(enCours ? bi.effectif : bi.vendus)}</span>
              <span className="text-gris"> / {nombre(bi.recus)}</span>
            </span>
          </div>
          <BarreProgression valeur={enCours ? bi.effectif : bi.vendus} max={bi.recus} />
          <p className="mt-1.5 text-xs text-gris">
            Mortalité {pct(bi.tauxMortalite)} · {nombre(bi.vendus)} vendus
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-ligne pt-4">
          <div>
            <p className="text-xs text-gris">Coût de revient</p>
            <p className="chiffres mt-0.5 text-[15px] font-bold text-encre">
              {fcfaCourt(bi.coutRevient)}
              <span className="text-xs font-medium text-gris"> /poulet</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gris">{enCours ? 'Bénéfice provisoire' : 'Bénéfice'}</p>
            <p className={cx('chiffres mt-0.5 text-[15px] font-bold', bi.benefice >= 0 ? 'text-foret' : 'text-brique')}>{fcfaCourt(bi.benefice)}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end text-xs font-medium text-foret opacity-0 transition group-hover:opacity-100">
          Voir le détail <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </Carte>
    </Link>
  )
}
