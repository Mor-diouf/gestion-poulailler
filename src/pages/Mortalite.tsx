import { Plus, Skull } from 'lucide-react'
import { useState } from 'react'
import { bornesPeriode, FiltreBande, FiltrePeriode, type Periode } from '@/components/Filtres'
import { useSaisie } from '@/components/forms/saisie-context'
import { ListeOperations } from '@/components/Operations'
import { Bouton, Carte, EtatVide, TitrePage } from '@/components/ui'
import { operations } from '@/lib/calculs'
import { nombre } from '@/lib/format'
import { useDonnees } from '@/lib/store'

export default function Mortalite() {
  const d = useDonnees()
  const { ouvrir } = useSaisie()
  const [bande, setBande] = useState('')
  const [periode, setPeriode] = useState<Periode>('tout')
  const [du, au] = bornesPeriode(periode)
  const liste = d.mortalites.filter((m) => (bande === '' || m.bandeId === bande) && m.date >= du && m.date <= au)
  const total = liste.reduce((s, m) => s + m.nombre, 0)
  const ids = new Set(liste.map((m) => 'm' + m.id))
  const ops = operations(d).filter((o) => ids.has(o.id))

  return (
    <div>
      <TitrePage
        titre="Mortalité"
        sousTitre="Historique des pertes, bande par bande."
        actions={
          <Bouton icone={Plus} onClick={() => ouvrir({ type: 'mortalite', bandeId: bande || undefined })}>
            Saisir une mortalité
          </Bouton>
        }
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <FiltreBande valeur={bande} onChange={setBande} />
        <FiltrePeriode valeur={periode} onChange={setPeriode} />
        <Carte className="flex h-12 items-center justify-between px-4">
          <span className="text-sm text-gris">Total</span>
          <span className="chiffres font-bold text-brique">
            {nombre(total)} mort{total > 1 ? 's' : ''}
          </span>
        </Carte>
      </div>
      <Carte className="overflow-hidden">
        {ops.length > 0 ? (
          <div className="pt-2">
            <ListeOperations ops={ops} />
          </div>
        ) : (
          <EtatVide
            icone={Skull}
            titre="Aucune mortalité"
            texte="Aucun mort enregistré pour ces filtres."
            action={
              <Bouton icone={Plus} onClick={() => ouvrir({ type: 'mortalite' })}>
                Saisir une mortalité
              </Bouton>
            }
          />
        )}
      </Carte>
    </div>
  )
}
