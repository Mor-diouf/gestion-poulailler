import { CircleUser, Download, LogOut, RotateCcw, Trash2, Upload } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Bouton, Carte, Champ, Confirmation, EnteteCarte, Saisie, SaisieNombre, TitrePage } from '@/components/ui'
import { aujourdhui, num } from '@/lib/format'
import { actions, deconnecter, lireDonnees, useDonnees, useSession } from '@/lib/store'
import { messageErreur } from '@/lib/supabase'

export default function Parametres() {
  const d = useDonnees()
  const session = useSession()
  const [occupe, setOccupe] = useState(false)
  const [f, setF] = useState({
    nom: d.ferme.nom,
    prenom: d.ferme.prenom,
    localite: d.ferme.localite ?? '',
    telephone: d.ferme.telephone ?? '',
    seuil: String(d.ferme.seuilMortalite),
    poussins: String(d.ferme.poussinsParCartonDefaut),
  })
  const [confirmer, setConfirmer] = useState<null | 'effacer' | 'exemple'>(null)
  const fichier = useRef<HTMLInputElement>(null)
  const maj = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }))

  const enregistrer = (e: FormEvent) => {
    e.preventDefault()
    actions.modifierFerme({
      nom: f.nom.trim() || 'Ma ferme',
      prenom: f.prenom.trim(),
      localite: f.localite.trim(),
      telephone: f.telephone.trim(),
      seuilMortalite: num(f.seuil) > 0 ? num(f.seuil) : 5,
      poussinsParCartonDefaut: num(f.poussins) > 0 ? Math.round(num(f.poussins)) : 100,
    })
    toast.success('Paramètres enregistrés')
  }

  const sauvegarder = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(lireDonnees(), null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `mon-poulailler-sauvegarde-${aujourdhui()}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast.success('Sauvegarde téléchargée')
  }

  /** Opération longue sur toutes les données : boutons bloqués et message à la fin. */
  const operer = async (op: () => Promise<unknown>, reussite: string) => {
    setOccupe(true)
    const t = toast.loading('Enregistrement en cours…')
    try {
      await op()
      toast.success(reussite, { id: t })
    } catch (e) {
      toast.error("L'opération n'a pas abouti", { id: t, description: messageErreur(e) })
    } finally {
      setOccupe(false)
    }
  }

  const restaurer = async (file: File) => {
    let donnees: Parameters<typeof actions.importer>[0]
    try {
      donnees = JSON.parse(await file.text())
    } catch {
      toast.error("Ce fichier n'est pas une sauvegarde valide de Mon Poulailler.")
      return
    }
    await operer(() => actions.importer(donnees), 'Données restaurées')
  }

  return (
    <div className="space-y-5">
      <TitrePage titre="Paramètres" sousTitre="Votre ferme et vos données." />

      <Carte>
        <EnteteCarte titre="Ferme" />
        <form onSubmit={enregistrer} className="grid gap-4 p-5 sm:grid-cols-2">
          <Champ libelle="Nom de la ferme">{(id) => <Saisie id={id} value={f.nom} onChange={maj('nom')} />}</Champ>
          <Champ libelle="Votre prénom" aide="Utilisé pour la salutation de l'accueil.">
            {(id) => <Saisie id={id} value={f.prenom} onChange={maj('prenom')} />}
          </Champ>
          <Champ libelle="Localité">{(id) => <Saisie id={id} value={f.localite} onChange={maj('localite')} placeholder="Facultatif" />}</Champ>
          <Champ libelle="Téléphone">
            {(id) => <Saisie id={id} type="tel" inputMode="tel" value={f.telephone} onChange={maj('telephone')} placeholder="Facultatif" />}
          </Champ>
          <Champ libelle="Seuil d'alerte de mortalité" suffixe="%" aide="Au-delà, le taux s'affiche en orange.">
            {(id) => <SaisieNombre id={id} decimal value={f.seuil} onChange={maj('seuil')} avecSuffixe />}
          </Champ>
          <Champ libelle="Poussins par carton, par défaut">{(id) => <SaisieNombre id={id} value={f.poussins} onChange={maj('poussins')} />}</Champ>
          <div className="sm:col-span-2">
            <Bouton type="submit" className="w-full sm:w-auto">
              Enregistrer
            </Bouton>
          </div>
        </form>
      </Carte>

      <Carte>
        <EnteteCarte
          titre="Données"
          sousTitre="Vos données sont enregistrées en ligne et suivent votre compte sur tous vos appareils."
        />
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <Bouton variante="secondaire" icone={Download} onClick={sauvegarder} disabled={occupe}>
            Télécharger une sauvegarde
          </Bouton>
          <Bouton variante="secondaire" icone={Upload} onClick={() => fichier.current?.click()} disabled={occupe}>
            Restaurer une sauvegarde
          </Bouton>
          <input
            ref={fichier}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) restaurer(file)
              e.target.value = ''
            }}
          />
          <Bouton variante="secondaire" icone={RotateCcw} onClick={() => setConfirmer('exemple')} disabled={occupe}>
            Charger les données d'exemple
          </Bouton>
          <Bouton variante="secondaire" className="text-brique" icone={Trash2} onClick={() => setConfirmer('effacer')} disabled={occupe}>
            Effacer toutes les données
          </Bouton>
        </div>
      </Carte>

      <Carte className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          <CircleUser className="h-10 w-10 shrink-0 text-gris" strokeWidth={1.25} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-encre">Compte</p>
            <p className="truncate text-sm text-gris">{session.email ?? '–'}</p>
          </div>
          <Bouton variante="secondaire" icone={LogOut} onClick={() => void deconnecter()} className="w-full sm:w-auto">
            Se déconnecter
          </Bouton>
        </div>
      </Carte>

      <Confirmation
        ouvert={confirmer === 'effacer'}
        onFermer={() => setConfirmer(null)}
        onConfirmer={() => void operer(actions.toutEffacer, 'Toutes les données ont été effacées')}
        titre="Effacer toutes les données ?"
        message="Bandes, charges, mortalités et ventes seront supprimées de votre compte, sur tous vos appareils. Les paramètres de la ferme sont conservés. Pensez à télécharger une sauvegarde avant."
        libelle="Tout effacer"
      />
      <Confirmation
        ouvert={confirmer === 'exemple'}
        onFermer={() => setConfirmer(null)}
        onConfirmer={() => void operer(actions.chargerExemple, "Données d'exemple chargées")}
        titre="Recharger les données d'exemple ?"
        message="Vos saisies actuelles seront remplacées par les données d'exemple."
        libelle="Remplacer"
      />
    </div>
  )
}
