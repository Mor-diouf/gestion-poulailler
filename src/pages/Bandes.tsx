import { Bird, Plus } from 'lucide-react'
import { useState } from 'react'
import { BandeCarte } from '@/components/BandeCarte'
import { useSaisie } from '@/components/forms/saisie-context'
import { Bouton, Carte, Choix, EtatVide, TitrePage } from '@/components/ui'
import { useDonnees } from '@/lib/store'

type Filtre = 'en_cours' | 'terminee' | 'toutes'

export default function Bandes() {
  const d = useDonnees()
  const { ouvrir } = useSaisie()
  const [filtre, setFiltre] = useState<Filtre>('en_cours')
  const nb = (s: Filtre) => (s === 'toutes' ? d.bandes.length : d.bandes.filter((b) => b.statut === s).length)
  const liste = d.bandes
    .filter((b) => filtre === 'toutes' || b.statut === filtre)
    .sort((a, b) => (a.dateArrivee < b.dateArrivee ? 1 : -1))

  return (
    <div>
      <TitrePage
        titre="Bandes"
        sousTitre="Chaque bande regroupe les poussins arrivés ensemble, jusqu'à la vente."
        actions={
          <Bouton icone={Plus} onClick={() => ouvrir({ type: 'bande' })}>
            Nouvelle bande
          </Bouton>
        }
      />
      <Choix
        className="mb-5 max-w-md"
        valeur={filtre}
        onChange={setFiltre}
        options={[
          { valeur: 'en_cours', libelle: `En cours (${nb('en_cours')})` },
          { valeur: 'terminee', libelle: `Terminées (${nb('terminee')})` },
          { valeur: 'toutes', libelle: 'Toutes' },
        ]}
      />
      {liste.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {liste.map((b) => (
            <BandeCarte key={b.id} bande={b} />
          ))}
        </div>
      ) : (
        <Carte>
          <EtatVide
            icone={Bird}
            titre={filtre === 'terminee' ? 'Aucune bande terminée' : 'Aucune bande'}
            texte={filtre === 'terminee' ? 'Les bandes vendues et clôturées apparaîtront ici.' : "Créez une bande à l'arrivée de vos poussins."}
            action={
              filtre !== 'terminee' && (
                <Bouton icone={Plus} onClick={() => ouvrir({ type: 'bande' })}>
                  Nouvelle bande
                </Bouton>
              )
            }
          />
        </Carte>
      )}
    </div>
  )
}
