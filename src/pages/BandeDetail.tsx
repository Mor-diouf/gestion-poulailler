import { ArrowLeft, Bird, CheckCircle2, HandCoins, Pencil, Plus, Receipt, RotateCcw, Skull, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useSaisie } from '@/components/forms/saisie-context'
import { GraphiqueEffectif } from '@/components/Graphiques'
import { ListeOperations } from '@/components/Operations'
import { Badge, BarreProgression, Bouton, Carte, Choix, Confirmation, EnteteCarte, EtatVide, Ligne } from '@/components/ui'
import { ageBande, bilanBande, operations, prixParPoussin, serieEffectif, type TypeOperation } from '@/lib/calculs'
import { aujourdhui, dateFr, decimal, fcfa, nombre, pct } from '@/lib/format'
import { actions, useDonnees } from '@/lib/store'
import { CATEGORIES } from '@/lib/types'

type Onglet = 'apercu' | 'charge' | 'mortalite' | 'vente'

function Chiffre({ libelle, valeur, detail }: { libelle: string; valeur: string; detail?: string }) {
  return (
    <Carte className="p-4">
      <p className="text-xs font-medium text-gris">{libelle}</p>
      <p className="chiffres mt-1 text-xl font-bold text-encre sm:text-2xl">{valeur}</p>
      {detail && <p className="mt-0.5 text-xs text-gris">{detail}</p>}
    </Carte>
  )
}

export default function BandeDetail() {
  const { id } = useParams()
  const d = useDonnees()
  const navigate = useNavigate()
  const { ouvrir } = useSaisie()
  const [onglet, setOnglet] = useState<Onglet>('apercu')
  const [aSupprimer, setASupprimer] = useState(false)
  const bande = d.bandes.find((b) => b.id === id)

  if (!bande) {
    return (
      <Carte>
        <EtatVide
          icone={Bird}
          titre="Bande introuvable"
          texte="Elle a peut-être été supprimée."
          action={
            <Link to="/bandes">
              <Bouton variante="secondaire">Retour aux bandes</Bouton>
            </Link>
          }
        />
      </Carte>
    )
  }

  const bi = bilanBande(bande, d)
  const jour = aujourdhui()
  const age = ageBande(bande, jour)
  const enCours = bande.statut === 'en_cours'
  const pp = prixParPoussin(bande, d.ferme.poussinsParCartonDefaut)
  const ops = (t: TypeOperation) => operations(d, bande.id).filter((o) => o.type === t)
  const serie = serieEffectif([bande], d, jour, 120)

  const listeOnglet = (t: 'charge' | 'mortalite' | 'vente') => {
    const l = ops(t)
    const cfg = {
      charge: { entete: 'Charges', titre: 'Aucune charge', texte: 'Aliment, médicaments, matériel…', icone: Receipt, bouton: 'Ajouter une charge' },
      mortalite: { entete: 'Mortalité', titre: 'Aucune mortalité', texte: 'Bonne nouvelle : aucun mort enregistré.', icone: Skull, bouton: 'Saisir une mortalité' },
      vente: { entete: 'Ventes', titre: 'Aucune vente', texte: 'Les ventes de cette bande apparaîtront ici.', icone: HandCoins, bouton: 'Ajouter une vente' },
    }[t]
    const total =
      t === 'mortalite'
        ? `${nombre(bi.mortalites)} morts saisis${bi.mortsArrivee ? `, plus ${nombre(bi.mortsArrivee)} à l'arrivée` : ''}`
        : t === 'charge'
          ? `${fcfa(bi.chargesHorsPoussins)} hors poussins`
          : `${nombre(bi.vendus)} poulets, ${fcfa(bi.ca)}`
    return (
      <Carte className="overflow-hidden">
        <EnteteCarte
          titre={cfg.entete}
          sousTitre={total}
          action={
            <Bouton taille="sm" icone={Plus} onClick={() => ouvrir({ type: t, bandeId: bande.id })}>
              Ajouter
            </Bouton>
          }
        />
        <div className="mt-3">
          {l.length > 0 ? (
            <ListeOperations ops={l} masquerBande />
          ) : (
            <EtatVide
              icone={cfg.icone}
              titre={cfg.titre}
              texte={cfg.texte}
              action={
                <Bouton variante="secondaire" icone={Plus} onClick={() => ouvrir({ type: t, bandeId: bande.id })}>
                  {cfg.bouton}
                </Bouton>
              }
            />
          )}
        </div>
      </Carte>
    )
  }

  return (
    <div className="space-y-5">
      <Link to="/bandes" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-gris hover:text-encre no-print">
        <ArrowLeft className="h-4 w-4" /> Bandes
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-encre sm:text-[28px]">{bande.nom}</h1>
            {enCours ? <Badge teinte={age > 42 ? 'ambre' : 'vert'}>En cours · J{age}</Badge> : <Badge>Terminée</Badge>}
          </div>
          <p className="mt-1 text-sm text-gris">
            Arrivée le {dateFr(bande.dateArrivee)}
            {bande.souche && <> · {bande.souche}</>}
            {bande.fournisseur && <> · {bande.fournisseur}</>}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex no-print">
          <Bouton variante="secondaire" icone={Pencil} onClick={() => ouvrir({ type: 'bande', element: bande })}>
            Modifier
          </Bouton>
          {enCours ? (
            <Bouton
              variante="secondaire"
              icone={CheckCircle2}
              onClick={() => {
                actions.changerStatutBande(bande.id, 'terminee')
                toast.success('Bande terminée', { description: bande.nom })
              }}
            >
              Terminer
            </Bouton>
          ) : (
            <Bouton
              variante="secondaire"
              icone={RotateCcw}
              onClick={() => {
                actions.changerStatutBande(bande.id, 'en_cours')
                toast.success('Bande rouverte', { description: bande.nom })
              }}
            >
              Rouvrir
            </Bouton>
          )}
          <Bouton variante="secondaire" className="text-brique" icone={Trash2} onClick={() => setASupprimer(true)}>
            Supprimer
          </Bouton>
        </div>
      </div>

      <div className="no-print">
        <Choix
          className="max-w-xl"
          valeur={onglet}
          onChange={setOnglet}
          options={[
            { valeur: 'apercu', libelle: "Vue d'ensemble" },
            { valeur: 'charge', libelle: 'Charges' },
            { valeur: 'mortalite', libelle: 'Mortalité' },
            { valeur: 'vente', libelle: 'Ventes' },
          ]}
        />
      </div>

      {onglet === 'apercu' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Chiffre libelle="Vivants" valeur={nombre(bi.effectif)} detail={`sur ${nombre(bi.recus)} reçus`} />
            <Chiffre libelle="Mortalité" valeur={pct(bi.tauxMortalite)} detail={`${nombre(bi.morts)} morts au total`} />
            <Chiffre libelle="Vendus" valeur={nombre(bi.vendus)} detail={bi.prixVenteMoyen !== null ? `${fcfa(bi.prixVenteMoyen)} en moyenne` : undefined} />
            <Chiffre libelle="Coût de revient" valeur={fcfa(bi.coutRevient)} detail="par poulet" />
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <Carte className="lg:col-span-3">
              <EnteteCarte titre="Effectif vivant" sousTitre="Jour par jour depuis l'arrivée" />
              <div className="px-5 pt-4">
                <BarreProgression valeur={bi.effectif} max={bi.recus} />
              </div>
              <div className="h-[240px] px-2 pb-3 pt-3 sm:px-4 lg:h-[400px]">
                {serie.length > 1 ? <GraphiqueEffectif points={serie} /> : <EtatVide icone={Bird} titre="Courbe disponible dès demain" />}
              </div>
            </Carte>
            <Carte className="lg:col-span-2">
              <EnteteCarte titre="Bilan de la bande" sousTitre={enCours ? 'Provisoire, tant que la bande est en cours' : undefined} />
              <div className="divide-y divide-ligne px-5 pb-3 pt-2">
                <Ligne
                  libelle={
                    <>
                      Poussins
                      {pp !== null && <span className="text-xs"> · {nombre(bi.recus)} × {fcfa(pp)}</span>}
                    </>
                  }
                  valeur={fcfa(bi.coutPoussins)}
                />
                {CATEGORIES.filter((c) => bi.parCategorie[c]).map((c) => (
                  <Ligne key={c} libelle={c} valeur={fcfa(bi.parCategorie[c])} />
                ))}
                <Ligne libelle="Total des charges" valeur={fcfa(bi.totalCharges)} fort />
                <Ligne libelle="Chiffre d'affaires" valeur={fcfa(bi.ca)} fort />
                <Ligne libelle={enCours ? 'Bénéfice provisoire' : 'Bénéfice'} valeur={fcfa(bi.benefice)} fort teinte={bi.benefice >= 0 ? 'vert' : 'rouge'} />
              </div>
            </Carte>
          </div>

          <Carte>
            <EnteteCarte titre="Indicateurs" />
            <div className="grid gap-x-8 px-5 pb-3 pt-2 sm:grid-cols-2">
              <div className="divide-y divide-ligne">
                <Ligne libelle="Âge de la bande" valeur={`${age} jours`} />
                <Ligne libelle="Poussins reçus" valeur={nombre(bi.recus)} />
                <Ligne libelle="Morts à l'arrivée" valeur={nombre(bi.mortsArrivee)} />
                <Ligne libelle="Mortalités saisies" valeur={nombre(bi.mortalites)} />
              </div>
              <div className="divide-y divide-ligne">
                <Ligne libelle="Prix de vente moyen" valeur={fcfa(bi.prixVenteMoyen)} />
                <Ligne libelle="Marge par poulet" valeur={fcfa(bi.marge)} teinte={bi.marge === null ? undefined : bi.marge >= 0 ? 'vert' : 'rouge'} />
                <Ligne libelle="Crédits clients" valeur={fcfa(bi.credits)} />
                <Ligne
                  libelle="Poids moyen vendu"
                  valeur={(() => {
                    const v = d.ventes.filter((x) => x.bandeId === bande.id && x.poidsMoyen)
                    const q = v.reduce((s, x) => s + x.quantite, 0)
                    return q > 0 ? `${decimal(v.reduce((s, x) => s + x.quantite * (x.poidsMoyen ?? 0), 0) / q, 2)} kg` : '–'
                  })()}
                />
              </div>
            </div>
          </Carte>
          {bande.notes && (
            <Carte className="p-5">
              <p className="text-sm font-medium text-encre">Notes</p>
              <p className="mt-1 whitespace-pre-line text-sm text-gris">{bande.notes}</p>
            </Carte>
          )}
        </div>
      )}
      {onglet === 'charge' && listeOnglet('charge')}
      {onglet === 'mortalite' && listeOnglet('mortalite')}
      {onglet === 'vente' && listeOnglet('vente')}

      <Confirmation
        ouvert={aSupprimer}
        onFermer={() => setASupprimer(false)}
        onConfirmer={() => {
          actions.supprimerBande(bande.id)
          toast.success('Bande supprimée', { description: bande.nom })
          navigate('/bandes')
        }}
        titre="Supprimer cette bande ?"
        message={`« ${bande.nom} » sera supprimée avec toutes ses charges, mortalités et ventes. Cette action est définitive.`}
      />
    </div>
  )
}
