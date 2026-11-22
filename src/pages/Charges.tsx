import { Plus, Receipt } from 'lucide-react'
import { useState } from 'react'
import { bornesPeriode, FiltreBande, FiltrePeriode, type Periode } from '@/components/Filtres'
import { useSaisie } from '@/components/forms/saisie-context'
import { ListeOperations } from '@/components/Operations'
import { Bouton, Carte, EtatVide, Pastille, TitrePage } from '@/components/ui'
import { operations } from '@/lib/calculs'
import { fcfa } from '@/lib/format'
import { ICONE_CATEGORIE } from '@/lib/icones'
import { useDonnees } from '@/lib/store'
import { CATEGORIES } from '@/lib/types'

export default function Charges() {
  const d = useDonnees()
  const { ouvrir } = useSaisie()
  const [bande, setBande] = useState('')
  const [periode, setPeriode] = useState<Periode>('tout')
  const [du, au] = bornesPeriode(periode)

  const charges = d.charges.filter(
    (c) => (bande === '' || (bande === 'ferme' ? c.bandeId === null : c.bandeId === bande)) && c.date >= du && c.date <= au,
  )
  const total = charges.reduce((s, c) => s + c.montant, 0)
  const ids = new Set(charges.map((c) => 'c' + c.id))
  const ops = operations(d).filter((o) => ids.has(o.id))
  const parCategorie = CATEGORIES.map((cat) => ({
    cat,
    ops: ops.filter((o) => charges.find((c) => 'c' + c.id === o.id)?.categorie === cat),
    total: charges.filter((c) => c.categorie === cat).reduce((s, c) => s + c.montant, 0),
  })).filter((g) => g.ops.length > 0)

  return (
    <div>
      <TitrePage
        titre="Charges"
        sousTitre="Toutes les dépenses, par catégorie. L'achat des poussins figure dans chaque bande."
        actions={
          <Bouton icone={Plus} onClick={() => ouvrir({ type: 'charge', bandeId: bande && bande !== 'ferme' ? bande : bande === 'ferme' ? null : undefined })}>
            Nouvelle charge
          </Bouton>
        }
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <FiltreBande valeur={bande} onChange={setBande} avecFerme />
        <FiltrePeriode valeur={periode} onChange={setPeriode} />
        <Carte className="flex h-12 items-center justify-between px-4">
          <span className="text-sm text-gris">Total</span>
          <span className="chiffres font-bold text-encre">{fcfa(total)}</span>
        </Carte>
      </div>
      {parCategorie.length === 0 ? (
        <Carte>
          <EtatVide
            icone={Receipt}
            titre="Aucune charge"
            texte="Aucune dépense pour ces filtres."
            action={
              <Bouton icone={Plus} onClick={() => ouvrir({ type: 'charge' })}>
                Nouvelle charge
              </Bouton>
            }
          />
        </Carte>
      ) : (
        <div className="space-y-4">
          {parCategorie.map((g) => (
            <Carte key={g.cat} className="overflow-hidden">
              <div className="flex items-center gap-3 px-5 pt-4">
                <Pastille icone={ICONE_CATEGORIE[g.cat]} teinte="ambre" taille="sm" />
                <h2 className="flex-1 text-[15px] font-semibold text-encre">{g.cat}</h2>
                <span className="chiffres font-bold text-encre">{fcfa(g.total)}</span>
              </div>
              <div className="mt-2">
                <ListeOperations ops={g.ops} />
              </div>
            </Carte>
          ))}
        </div>
      )}
    </div>
  )
}
