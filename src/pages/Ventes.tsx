import { Check, HandCoins, Phone, Plus } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { FiltreBande } from '@/components/Filtres'
import { useSaisie } from '@/components/forms/saisie-context'
import { Badge, Bouton, Carte, Choix, EtatVide, Pastille, TitrePage, cx } from '@/components/ui'
import { dateFr, fcfa, fcfaCourt, nombre } from '@/lib/format'
import { actions, useDonnees } from '@/lib/store'

export default function Ventes() {
  const d = useDonnees()
  const { ouvrir } = useSaisie()
  const [params, setParams] = useSearchParams()
  const filtre = params.get('filtre') === 'credit' ? 'credit' : 'toutes'
  const bande = params.get('bande') ?? ''
  const maj = (k: string, v: string) => {
    const p = new URLSearchParams(params)
    if (v) p.set(k, v)
    else p.delete(k)
    setParams(p, { replace: true })
  }

  const dansBande = d.ventes.filter((v) => bande === '' || v.bandeId === bande)
  const liste = dansBande
    .filter((v) => filtre === 'toutes' || v.statut === 'credit')
    .sort((a, b) => (a.date === b.date ? b.creeLe - a.creeLe : a.date < b.date ? 1 : -1))
  const ca = dansBande.reduce((s, v) => s + v.montant, 0)
  const credit = dansBande.filter((v) => v.statut === 'credit').reduce((s, v) => s + v.montant, 0)
  const poulets = dansBande.reduce((s, v) => s + v.quantite, 0)
  const nomBande = (id: string | null) => d.bandes.find((b) => b.id === id)?.nom ?? 'Toute la ferme'

  return (
    <div>
      <TitrePage
        titre="Ventes"
        sousTitre="Ventes de poulets, encaissées ou à crédit."
        actions={
          <Bouton icone={Plus} onClick={() => ouvrir({ type: 'vente', bandeId: bande || undefined })}>
            Nouvelle vente
          </Bouton>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Carte className="p-4">
          <p className="text-xs font-medium text-gris">Chiffre d'affaires</p>
          <p className="chiffres mt-1 text-xl font-bold text-foret">{fcfaCourt(ca)}</p>
        </Carte>
        <Carte className="p-4">
          <p className="text-xs font-medium text-gris">Encaissé</p>
          <p className="chiffres mt-1 text-xl font-bold text-encre">{fcfaCourt(ca - credit)}</p>
        </Carte>
        <Carte className="p-4">
          <p className="text-xs font-medium text-gris">À crédit</p>
          <p className={cx('chiffres mt-1 text-xl font-bold', credit > 0 ? 'text-ambre-700' : 'text-encre')}>{fcfaCourt(credit)}</p>
        </Carte>
        <Carte className="p-4">
          <p className="text-xs font-medium text-gris">Poulets vendus</p>
          <p className="chiffres mt-1 text-xl font-bold text-encre">{nombre(poulets)}</p>
        </Carte>
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <Choix
          valeur={filtre}
          onChange={(v) => maj('filtre', v === 'credit' ? 'credit' : '')}
          options={[
            { valeur: 'toutes', libelle: 'Toutes' },
            { valeur: 'credit', libelle: 'À crédit' },
          ]}
        />
        <FiltreBande valeur={bande} onChange={(v) => maj('bande', v)} />
      </div>

      <Carte className="overflow-hidden">
        {liste.length === 0 ? (
          <EtatVide
            icone={HandCoins}
            titre={filtre === 'credit' ? 'Aucun crédit en attente' : 'Aucune vente'}
            texte={filtre === 'credit' ? 'Tous vos clients ont payé.' : 'Les ventes enregistrées apparaîtront ici.'}
            action={
              filtre !== 'credit' && (
                <Bouton icone={Plus} onClick={() => ouvrir({ type: 'vente' })}>
                  Nouvelle vente
                </Bouton>
              )
            }
          />
        ) : (
          <ul className="divide-y divide-ligne">
            {liste.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-3 px-5 py-4 sm:flex-nowrap">
                <button type="button" onClick={() => ouvrir({ type: 'vente', element: v })} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <Pastille icone={HandCoins} teinte={v.statut === 'credit' ? 'ambre' : 'vert'} taille="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-encre">
                      {v.quantite} poulet{v.quantite > 1 ? 's' : ''} × {fcfa(v.prixUnitaire)}
                    </p>
                    <p className="truncate text-xs text-gris">
                      {dateFr(v.date)} · {nomBande(v.bandeId)}
                      {v.client && <> · {v.client}</>}
                    </p>
                  </div>
                </button>
                <div className="ml-11 flex items-center gap-3 sm:ml-0">
                  <div className="text-right">
                    <p className="chiffres text-[15px] font-bold text-encre">{fcfaCourt(v.montant)}</p>
                    {v.statut === 'credit' ? <Badge teinte="ambre">À crédit</Badge> : <Badge teinte="vert">Payé</Badge>}
                  </div>
                  {v.statut === 'credit' && (
                    <div className="flex gap-2">
                      {v.telephoneClient && (
                        <a
                          href={`tel:${v.telephoneClient.replace(/\s/g, '')}`}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-ligne bg-white text-gris hover:text-encre"
                          aria-label={`Appeler ${v.client ?? 'le client'}`}
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                      <Bouton
                        variante="ambre"
                        taille="md"
                        icone={Check}
                        onClick={() => {
                          actions.marquerPaye(v.id)
                          toast.success('Vente marquée payée', { description: `${v.client ?? 'Client'} · ${fcfa(v.montant)}` })
                        }}
                      >
                        Marquer payé
                      </Bouton>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Carte>
    </div>
  )
}
