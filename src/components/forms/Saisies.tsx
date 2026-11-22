import { Bird, HandCoins, Receipt, Skull, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { bilanBande, coutPoussins, nbPoussins } from '@/lib/calculs'
import { aujourdhui, decimal, fcfa, nombre, nomMois, num, numOuNull } from '@/lib/format'
import { ICONE_CATEGORIE } from '@/lib/icones'
import { actions, nouvelId, useDonnees } from '@/lib/store'
import { CATEGORIES, type Bande, type Categorie, type Charge, type Mortalite, type Vente } from '@/lib/types'
import {
  Bouton,
  Champ,
  Choix,
  Confirmation,
  Liste,
  Panneau,
  Pastille,
  PlusDeDetails,
  Saisie,
  SaisieNombre,
  Zone,
  cx,
} from '../ui'
import { useSaisie } from './saisie-context'

/** Affiche un nombre saisi pour un champ texte : null ou 0 non saisi donnent une chaîne vide. */
const versTexte = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v))

function Erreur({ children }: { children: ReactNode }) {
  if (!children) return null
  return <p className="rounded-xl bg-brique-50 px-4 py-3 text-sm text-brique">{children}</p>
}

function Calcul({ libelle, valeur, detail }: { libelle: string; valeur: string; detail?: string }) {
  return (
    <div className="rounded-xl bg-foret-50 px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-foret">{libelle}</span>
        <span className="chiffres text-lg font-bold text-foret">{valeur}</span>
      </div>
      {detail && <p className="mt-0.5 text-xs text-foret/80">{detail}</p>}
    </div>
  )
}

function Pied({ formId, onSupprimer, libelle = 'Enregistrer' }: { formId: string; onSupprimer?: () => void; libelle?: string }) {
  return (
    <div className="flex gap-3">
      {onSupprimer && (
        <Bouton variante="secondaire" className="text-brique" icone={Trash2} onClick={onSupprimer} aria-label="Supprimer">
          <span className="hidden sm:inline">Supprimer</span>
        </Bouton>
      )}
      <Bouton type="submit" form={formId} taille="lg" className="flex-1">
        {libelle}
      </Bouton>
    </div>
  )
}

/* ======================= Menu de saisie rapide ======================= */

function MenuSaisie() {
  const { ouvrir } = useSaisie()
  const options = [
    { type: 'mortalite' as const, titre: 'Mortalité', texte: 'Noter des morts', icone: Skull, teinte: 'rouge' as const },
    { type: 'charge' as const, titre: 'Charge', texte: 'Aliment, soins, matériel…', icone: Receipt, teinte: 'ambre' as const },
    { type: 'vente' as const, titre: 'Vente', texte: 'Poulets vendus', icone: HandCoins, teinte: 'vert' as const },
    { type: 'bande' as const, titre: 'Nouvelle bande', texte: 'Achat de poussins', icone: Bird, teinte: 'bleu' as const },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 pb-2">
      {options.map((o) => (
        <button
          key={o.type}
          type="button"
          onClick={() => ouvrir({ type: o.type })}
          className="flex min-h-[120px] flex-col items-start justify-between rounded-2xl border border-ligne bg-white p-4 text-left shadow-carte transition hover:-translate-y-0.5 hover:border-foret/30"
        >
          <Pastille icone={o.icone} teinte={o.teinte} />
          <span>
            <span className="block font-titre text-[15px] font-semibold text-encre">{o.titre}</span>
            <span className="block text-xs text-gris">{o.texte}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

/* ======================= Bande ======================= */

function FormBande({ element, onFini }: { element?: Bande; onFini: () => void }) {
  const d = useDonnees()
  const navigate = useNavigate()
  const defaut = d.ferme.poussinsParCartonDefaut
  const numero = Math.max(d.bandes.length, ...d.bandes.map((b) => Number(/^Bande (\d+)/.exec(b.nom)?.[1] ?? 0))) + 1
  const jour = aujourdhui()
  const [f, setF] = useState({
    nom: element?.nom ?? `Bande ${numero} – ${nomMois(jour).replace(/^./, (c) => c.toUpperCase())}`,
    dateArrivee: element?.dateArrivee ?? jour,
    nbCartons: versTexte(element?.nbCartons),
    poussinsParCarton: versTexte(element?.poussinsParCarton ?? defaut),
    prixCarton: versTexte(element?.prixCarton),
    nbPoussins: versTexte(element?.nbPoussins),
    prixPoussin: versTexte(element?.prixPoussin),
    mortsArrivee: versTexte(element?.mortsArrivee),
    souche: element?.souche ?? '',
    fournisseur: element?.fournisseur ?? '',
    notes: element?.notes ?? '',
  })
  const [erreur, setErreur] = useState('')
  const maj = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }))

  const brouillon: Bande = {
    id: element?.id ?? '',
    nom: f.nom,
    type: 'chair',
    dateArrivee: f.dateArrivee,
    nbCartons: numOuNull(f.nbCartons),
    poussinsParCarton: numOuNull(f.poussinsParCarton),
    prixCarton: numOuNull(f.prixCarton),
    nbPoussins: numOuNull(f.nbPoussins),
    prixPoussin: numOuNull(f.prixPoussin),
    mortsArrivee: numOuNull(f.mortsArrivee),
    statut: element?.statut ?? 'en_cours',
    souche: f.souche.trim() || undefined,
    fournisseur: f.fournisseur.trim() || undefined,
    notes: f.notes.trim() || undefined,
    creeLe: element?.creeLe ?? Date.now(),
  }
  const calcules = num(f.nbCartons) * (num(f.poussinsParCarton) || defaut)
  const total = nbPoussins(brouillon, defaut)
  const cout = coutPoussins(brouillon, defaut)

  const envoyer = (e: FormEvent) => {
    e.preventDefault()
    if (!f.nom.trim()) return setErreur('Donnez un nom à la bande.')
    if (!f.dateArrivee) return setErreur("Indiquez la date d'arrivée.")
    if (total <= 0) return setErreur('Indiquez le nombre de cartons ou le nombre de poussins.')
    if (num(f.mortsArrivee) > total) return setErreur("Les morts à l'arrivée dépassent le nombre de poussins.")
    const b = { ...brouillon, id: element?.id ?? nouvelId(), nom: f.nom.trim() }
    actions.enregistrerBande(b)
    toast.success(element ? 'Bande modifiée' : 'Bande créée', { description: `${b.nom} · ${nombre(total)} poussins` })
    onFini()
    if (!element) navigate('/bandes/' + b.id)
  }

  return (
    <form id="form-saisie" onSubmit={envoyer} className="space-y-4" noValidate>
      <Champ libelle="Nom de la bande">{(id) => <Saisie id={id} value={f.nom} onChange={maj('nom')} />}</Champ>
      <Champ libelle="Date d'arrivée">{(id) => <Saisie id={id} type="date" value={f.dateArrivee} onChange={maj('dateArrivee')} max={jour} />}</Champ>
      <div className="grid grid-cols-2 gap-3">
        <Champ libelle="Nombre de cartons">
          {(id) => <SaisieNombre id={id} value={f.nbCartons} onChange={maj('nbCartons')} placeholder="0" autoFocus={!element} />}
        </Champ>
        <Champ libelle="Poussins par carton">
          {(id) => <SaisieNombre id={id} value={f.poussinsParCarton} onChange={maj('poussinsParCarton')} placeholder={String(defaut)} />}
        </Champ>
      </div>
      <Champ libelle="Prix du carton" suffixe="F CFA">
        {(id) => <SaisieNombre id={id} value={f.prixCarton} onChange={maj('prixCarton')} placeholder="0" avecSuffixe />}
      </Champ>
      <Champ
        libelle="Nombre de poussins"
        aide={calcules > 0 ? `Calculé : ${nombre(calcules)}. Modifiez-le si le compte réel est différent.` : 'Calculé à partir des cartons, ou à saisir directement.'}
      >
        {(id) => <SaisieNombre id={id} value={f.nbPoussins} onChange={maj('nbPoussins')} placeholder={calcules > 0 ? String(calcules) : '0'} />}
      </Champ>
      <Calcul
        libelle="Coût des poussins"
        valeur={fcfa(cout)}
        detail={total > 0 && cout > 0 ? `${nombre(total)} poussins, soit ${fcfa(cout / total)} par poussin` : undefined}
      />
      <PlusDeDetails ouvertParDefaut={Boolean(element?.mortsArrivee || element?.souche || element?.fournisseur || element?.notes)}>
        <Champ libelle="Poussins morts à l'arrivée" aide="Déduits de l'effectif de départ.">
          {(id) => <SaisieNombre id={id} value={f.mortsArrivee} onChange={maj('mortsArrivee')} placeholder="0" />}
        </Champ>
        {num(f.prixCarton) <= 0 && (
          <Champ libelle="Prix par poussin" suffixe="F CFA" aide="Seulement si vous n'achetez pas au carton.">
            {(id) => <SaisieNombre id={id} value={f.prixPoussin} onChange={maj('prixPoussin')} placeholder="0" avecSuffixe />}
          </Champ>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Champ libelle="Souche">{(id) => <Saisie id={id} value={f.souche} onChange={maj('souche')} placeholder="Cobb 500" />}</Champ>
          <Champ libelle="Fournisseur">{(id) => <Saisie id={id} value={f.fournisseur} onChange={maj('fournisseur')} placeholder="Couvoir" />}</Champ>
        </div>
        <Champ libelle="Notes">{(id) => <Zone id={id} value={f.notes} onChange={maj('notes')} />}</Champ>
      </PlusDeDetails>
      <Erreur>{erreur}</Erreur>
    </form>
  )
}

/* ======================= Sélecteur de bande ======================= */

function ChoixBande({ valeur, onChange, bandes, id }: { valeur: string; onChange: (v: string) => void; bandes: Bande[]; id: string }) {
  const enCours = bandes.filter((b) => b.statut === 'en_cours')
  const terminees = bandes.filter((b) => b.statut === 'terminee')
  return (
    <Liste id={id} value={valeur} onChange={(e) => onChange(e.target.value)}>
      {!valeur && <option value="">Choisir une bande</option>}
      {enCours.length > 0 && (
        <optgroup label="En cours">
          {enCours.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nom}
            </option>
          ))}
        </optgroup>
      )}
      {terminees.length > 0 && (
        <optgroup label="Terminées">
          {terminees.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nom}
            </option>
          ))}
        </optgroup>
      )}
    </Liste>
  )
}

function bandeParDefaut(bandes: Bande[], demandee?: string | null) {
  if (demandee) return demandee
  const enCours = bandes.filter((b) => b.statut === 'en_cours').sort((a, b) => (a.dateArrivee < b.dateArrivee ? 1 : -1))
  return enCours[0]?.id ?? ''
}

function SansBande({ onFini }: { onFini: () => void }) {
  const { ouvrir } = useSaisie()
  return (
    <div className="space-y-4 py-6 text-center">
      <p className="text-sm text-gris">Créez d'abord une bande pour y rattacher cette saisie.</p>
      <Bouton
        icone={Bird}
        onClick={() => {
          onFini()
          ouvrir({ type: 'bande' })
        }}
      >
        Nouvelle bande
      </Bouton>
    </div>
  )
}

/* ======================= Mortalité ======================= */

const CAUSES = ['Inconnue', 'Maladie', 'Coup de chaleur', 'Étouffement', 'Prédateur', 'Poussins faibles', 'Accident']

function FormMortalite({ element, bandeId, onFini }: { element?: Mortalite; bandeId?: string; onFini: () => void }) {
  const d = useDonnees()
  const [f, setF] = useState({
    bandeId: element?.bandeId ?? bandeParDefaut(d.bandes, bandeId),
    date: element?.date ?? aujourdhui(),
    nombre: versTexte(element?.nombre),
    cause: element?.cause ?? '',
    notes: element?.notes ?? '',
  })
  const [erreur, setErreur] = useState('')
  const maj = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }))
  const bande = d.bandes.find((b) => b.id === f.bandeId)
  const dispo = bande ? bilanBande(bande, d).effectif + (element?.bandeId === bande.id ? num(element.nombre) : 0) : 0

  if (d.bandes.length === 0) return <SansBande onFini={onFini} />

  const envoyer = (e: FormEvent) => {
    e.preventDefault()
    const n = num(f.nombre)
    if (!bande) return setErreur('Choisissez la bande concernée.')
    if (!f.date) return setErreur('Indiquez la date.')
    if (n <= 0 || !Number.isInteger(n)) return setErreur('Indiquez un nombre de morts entier, supérieur à 0.')
    if (n > dispo) return setErreur(`Ce nombre dépasse l'effectif vivant de la bande (${nombre(dispo)}).`)
    actions.enregistrerMortalite({
      id: element?.id ?? nouvelId(),
      bandeId: bande.id,
      date: f.date,
      nombre: n,
      cause: f.cause.trim() || undefined,
      notes: f.notes.trim() || undefined,
      creeLe: element?.creeLe ?? Date.now(),
    })
    toast.success(element ? 'Mortalité modifiée' : 'Mortalité enregistrée', { description: `${n} mort${n > 1 ? 's' : ''} · ${bande.nom}` })
    onFini()
  }

  return (
    <form id="form-saisie" onSubmit={envoyer} className="space-y-4" noValidate>
      <Champ libelle="Bande">{(id) => <ChoixBande id={id} valeur={f.bandeId} onChange={(v) => setF((x) => ({ ...x, bandeId: v }))} bandes={d.bandes} />}</Champ>
      <div className="grid grid-cols-2 gap-3">
        <Champ libelle="Date">{(id) => <Saisie id={id} type="date" value={f.date} onChange={maj('date')} max={aujourdhui()} />}</Champ>
        <Champ libelle="Nombre de morts" aide={bande ? `Vivants : ${nombre(dispo)}` : undefined}>
          {(id) => <SaisieNombre id={id} value={f.nombre} onChange={maj('nombre')} placeholder="0" autoFocus={!element} />}
        </Champ>
      </div>
      <PlusDeDetails ouvertParDefaut={Boolean(element?.cause || element?.notes)}>
        <Champ libelle="Cause">
          {(id) => (
            <>
              <Saisie id={id} value={f.cause} onChange={maj('cause')} list="causes" placeholder="Inconnue" />
              <datalist id="causes">
                {CAUSES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </>
          )}
        </Champ>
        <Champ libelle="Notes">{(id) => <Zone id={id} value={f.notes} onChange={maj('notes')} />}</Champ>
      </PlusDeDetails>
      <Erreur>{erreur}</Erreur>
    </form>
  )
}

/* ======================= Charge ======================= */

interface ConfigCategorie {
  types?: string[]
  quantite?: { libelle: string; prix: string; requis: boolean }
  produit?: string
  poids?: boolean
  parDefautFerme?: boolean
}

const CONFIG: Record<Categorie, ConfigCategorie> = {
  Aliment: { types: ['Démarrage', 'Croissance', 'Finition'], quantite: { libelle: 'Nombre de sacs', prix: 'Prix du sac', requis: true }, poids: true },
  'Médicaments et vaccins': { types: ['Vaccin', 'Traitement'], produit: 'Produit' },
  Matériel: { types: ['Abreuvoir', 'Mangeoire', 'Autre'], quantite: { libelle: 'Nombre', prix: 'Prix unitaire', requis: true } },
  Déplumage: { quantite: { libelle: 'Poulets déplumés', prix: 'Prix par poulet', requis: true } },
  Transport: { produit: 'Objet du transport' },
  Litière: { quantite: { libelle: 'Nombre de sacs', prix: 'Prix du sac', requis: false } },
  'Énergie et eau': { types: ['Électricité', 'Eau', 'Gaz', 'Chauffage'], parDefautFerme: true },
  "Main-d'œuvre": { produit: 'Personne ou tâche' },
  Autre: { produit: 'Libellé' },
}

function FormCharge({ element, bandeId, onFini }: { element?: Charge; bandeId?: string | null; onFini: () => void }) {
  const d = useDonnees()
  const [categorie, setCategorie] = useState<Categorie>(element?.categorie ?? 'Aliment')
  const cfg = CONFIG[categorie]
  const [portee, setPortee] = useState<'bande' | 'ferme'>(
    element ? (element.bandeId ? 'bande' : 'ferme') : bandeId === null || d.bandes.length === 0 ? 'ferme' : 'bande',
  )
  const [f, setF] = useState({
    bandeId: element?.bandeId ?? bandeParDefaut(d.bandes, bandeId),
    date: element?.date ?? aujourdhui(),
    type: element?.type ?? '',
    produit: element?.produit ?? '',
    quantite: versTexte(element?.quantite),
    prixUnitaire: versTexte(element?.prixUnitaire),
    poidsUnitaire: versTexte(element?.poidsUnitaire ?? (element ? null : 50)),
    montant: versTexte(element?.montant),
    fournisseur: element?.fournisseur ?? '',
    notes: element?.notes ?? '',
  })
  /** Le montant suit quantité × prix tant que l'utilisateur ne l'a pas modifié lui-même. */
  const [montantManuel, setMontantManuel] = useState(() => {
    if (!element) return false
    return num(element.montant) !== num(element.quantite) * num(element.prixUnitaire)
  })
  const [erreur, setErreur] = useState('')
  const maj = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }))

  const calcule = cfg.quantite ? num(f.quantite) * num(f.prixUnitaire) : 0
  const montant = cfg.quantite && !montantManuel ? calcule : num(f.montant)

  const changerCategorie = (c: Categorie) => {
    setCategorie(c)
    setF((x) => ({ ...x, type: '' }))
    if (!element && CONFIG[c].parDefautFerme) setPortee('ferme')
  }

  const envoyer = (e: FormEvent) => {
    e.preventDefault()
    if (portee === 'bande' && !d.bandes.some((b) => b.id === f.bandeId)) return setErreur('Choisissez la bande concernée.')
    if (!f.date) return setErreur('Indiquez la date.')
    if (cfg.quantite?.requis && num(f.quantite) <= 0 && !montantManuel)
      return setErreur(`Indiquez ${cfg.quantite.libelle.toLowerCase()} et ${cfg.quantite.prix.toLowerCase()}.`)
    if (montant <= 0) return setErreur('Indiquez un montant supérieur à 0.')
    actions.enregistrerCharge({
      id: element?.id ?? nouvelId(),
      bandeId: portee === 'bande' ? f.bandeId : null,
      date: f.date,
      categorie,
      type: f.type || undefined,
      produit: cfg.produit ? f.produit.trim() || undefined : undefined,
      quantite: cfg.quantite ? numOuNull(f.quantite) : null,
      prixUnitaire: cfg.quantite ? numOuNull(f.prixUnitaire) : null,
      poidsUnitaire: cfg.poids ? numOuNull(f.poidsUnitaire) : null,
      montant,
      fournisseur: f.fournisseur.trim() || undefined,
      notes: f.notes.trim() || undefined,
      creeLe: element?.creeLe ?? Date.now(),
    })
    toast.success(element ? 'Charge modifiée' : 'Charge enregistrée', { description: `${categorie} · ${fcfa(montant)}` })
    onFini()
  }

  return (
    <form id="form-saisie" onSubmit={envoyer} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <span className="block text-sm font-medium text-encre">Catégorie</span>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((c) => {
            const Icone = ICONE_CATEGORIE[c]
            const actif = c === categorie
            return (
              <button
                key={c}
                type="button"
                onClick={() => changerCategorie(c)}
                className={cx(
                  'flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl border px-1.5 py-2 text-center text-[12px] font-medium leading-tight transition',
                  actif ? 'border-foret bg-foret-50 text-foret' : 'border-ligne bg-white text-gris hover:text-encre',
                )}
                aria-pressed={actif}
              >
                <Icone className="h-5 w-5" strokeWidth={1.75} />
                {c}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="block text-sm font-medium text-encre">Pour</span>
        <Choix
          valeur={portee}
          onChange={setPortee}
          options={[
            { valeur: 'bande', libelle: 'Cette bande' },
            { valeur: 'ferme', libelle: 'Toute la ferme' },
          ]}
        />
        {portee === 'ferme' && <p className="text-xs text-gris">Compte dans le bilan global, pas dans celui d'une bande.</p>}
      </div>
      {portee === 'bande' &&
        (d.bandes.length > 0 ? (
          <Champ libelle="Bande">{(id) => <ChoixBande id={id} valeur={f.bandeId} onChange={(v) => setF((x) => ({ ...x, bandeId: v }))} bandes={d.bandes} />}</Champ>
        ) : (
          <p className="text-sm text-gris">Aucune bande pour l'instant : choisissez « Toute la ferme ».</p>
        ))}

      {cfg.types && (
        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-encre">Type</span>
          <Choix
            valeur={f.type}
            onChange={(v) => setF((x) => ({ ...x, type: x.type === v ? '' : v }))}
            options={cfg.types.map((t) => ({ valeur: t, libelle: t }))}
          />
        </div>
      )}

      <Champ libelle="Date">{(id) => <Saisie id={id} type="date" value={f.date} onChange={maj('date')} max={aujourdhui()} />}</Champ>

      {cfg.produit && (
        <Champ libelle={cfg.produit}>{(id) => <Saisie id={id} value={f.produit} onChange={maj('produit')} />}</Champ>
      )}

      {cfg.quantite && (
        <div className="grid grid-cols-2 gap-3">
          <Champ libelle={cfg.quantite.libelle}>{(id) => <SaisieNombre id={id} decimal value={f.quantite} onChange={maj('quantite')} placeholder="0" />}</Champ>
          <Champ libelle={cfg.quantite.prix} suffixe="F">
            {(id) => <SaisieNombre id={id} value={f.prixUnitaire} onChange={maj('prixUnitaire')} placeholder="0" avecSuffixe />}
          </Champ>
        </div>
      )}

      {cfg.quantite ? (
        montantManuel ? (
          <Champ
            libelle="Montant"
            suffixe="F CFA"
            aide={
              <button type="button" className="font-medium text-foret underline-offset-2 hover:underline" onClick={() => setMontantManuel(false)}>
                Revenir au calcul automatique ({fcfa(calcule)})
              </button>
            }
          >
            {(id) => <SaisieNombre id={id} value={f.montant} onChange={maj('montant')} avecSuffixe />}
          </Champ>
        ) : (
          <div className="space-y-1.5">
            <Calcul
              libelle="Montant"
              valeur={fcfa(calcule)}
              detail={num(f.quantite) > 0 && num(f.prixUnitaire) > 0 ? `${decimal(num(f.quantite))} × ${fcfa(num(f.prixUnitaire))}` : undefined}
            />
            <button
              type="button"
              className="text-xs font-medium text-gris underline-offset-2 hover:text-encre hover:underline"
              onClick={() => {
                setF((x) => ({ ...x, montant: calcule > 0 ? String(calcule) : '' }))
                setMontantManuel(true)
              }}
            >
              Modifier le montant
            </button>
          </div>
        )
      ) : (
        <Champ libelle="Montant" suffixe="F CFA">
          {(id) => <SaisieNombre id={id} value={f.montant} onChange={maj('montant')} placeholder="0" avecSuffixe />}
        </Champ>
      )}

      <PlusDeDetails ouvertParDefaut={Boolean(element?.fournisseur || element?.notes)}>
        {cfg.poids && (
          <Champ libelle="Poids du sac" suffixe="kg">
            {(id) => <SaisieNombre id={id} decimal value={f.poidsUnitaire} onChange={maj('poidsUnitaire')} placeholder="50" avecSuffixe />}
          </Champ>
        )}
        <Champ libelle="Fournisseur">{(id) => <Saisie id={id} value={f.fournisseur} onChange={maj('fournisseur')} />}</Champ>
        <Champ libelle="Notes">{(id) => <Zone id={id} value={f.notes} onChange={maj('notes')} />}</Champ>
      </PlusDeDetails>
      <Erreur>{erreur}</Erreur>
    </form>
  )
}

/* ======================= Vente ======================= */

function FormVente({ element, bandeId, onFini }: { element?: Vente; bandeId?: string; onFini: () => void }) {
  const d = useDonnees()
  const [f, setF] = useState({
    bandeId: element?.bandeId ?? bandeParDefaut(d.bandes, bandeId),
    date: element?.date ?? aujourdhui(),
    quantite: versTexte(element?.quantite),
    prixUnitaire: versTexte(element?.prixUnitaire),
    client: element?.client ?? '',
    telephoneClient: element?.telephoneClient ?? '',
    poidsMoyen: versTexte(element?.poidsMoyen),
    notes: element?.notes ?? '',
  })
  const [statut, setStatut] = useState<Vente['statut']>(element?.statut ?? 'paye')
  const [erreur, setErreur] = useState('')
  const maj = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }))
  const bande = d.bandes.find((b) => b.id === f.bandeId)
  const dispo = bande ? bilanBande(bande, d).effectif + (element?.bandeId === bande.id ? num(element.quantite) : 0) : 0
  const montant = num(f.quantite) * num(f.prixUnitaire)
  const clients = useMemo(() => [...new Set(d.ventes.map((v) => v.client?.trim()).filter(Boolean))] as string[], [d.ventes])

  if (d.bandes.length === 0) return <SansBande onFini={onFini} />

  const envoyer = (e: FormEvent) => {
    e.preventDefault()
    const q = num(f.quantite)
    if (!bande) return setErreur('Choisissez la bande vendue.')
    if (!f.date) return setErreur('Indiquez la date.')
    if (q <= 0 || !Number.isInteger(q)) return setErreur('Indiquez un nombre de poulets entier, supérieur à 0.')
    if (q > dispo) return setErreur(`Ce nombre dépasse l'effectif vivant de la bande (${nombre(dispo)}).`)
    if (num(f.prixUnitaire) <= 0) return setErreur('Indiquez le prix par poulet.')
    actions.enregistrerVente({
      id: element?.id ?? nouvelId(),
      bandeId: bande.id,
      date: f.date,
      produit: 'poulets',
      quantite: q,
      prixUnitaire: num(f.prixUnitaire),
      montant,
      statut,
      client: f.client.trim() || undefined,
      telephoneClient: f.telephoneClient.trim() || undefined,
      poidsMoyen: numOuNull(f.poidsMoyen),
      notes: f.notes.trim() || undefined,
      creeLe: element?.creeLe ?? Date.now(),
    })
    toast.success(element ? 'Vente modifiée' : 'Vente enregistrée', {
      description: `${q} poulet${q > 1 ? 's' : ''} · ${fcfa(montant)}${statut === 'credit' ? ' · à crédit' : ''}`,
    })
    onFini()
  }

  return (
    <form id="form-saisie" onSubmit={envoyer} className="space-y-4" noValidate>
      <Champ libelle="Bande">{(id) => <ChoixBande id={id} valeur={f.bandeId} onChange={(v) => setF((x) => ({ ...x, bandeId: v }))} bandes={d.bandes} />}</Champ>
      <Champ libelle="Date">{(id) => <Saisie id={id} type="date" value={f.date} onChange={maj('date')} max={aujourdhui()} />}</Champ>
      <div className="grid grid-cols-2 gap-3">
        <Champ libelle="Nombre de poulets" aide={bande ? `Disponibles : ${nombre(dispo)}` : undefined}>
          {(id) => <SaisieNombre id={id} value={f.quantite} onChange={maj('quantite')} placeholder="0" autoFocus={!element} />}
        </Champ>
        <Champ libelle="Prix par poulet" suffixe="F">
          {(id) => <SaisieNombre id={id} value={f.prixUnitaire} onChange={maj('prixUnitaire')} placeholder="0" avecSuffixe />}
        </Champ>
      </div>
      <Calcul libelle="Montant" valeur={fcfa(montant)} />
      <div className="space-y-1.5">
        <span className="block text-sm font-medium text-encre">Paiement</span>
        <Choix
          valeur={statut}
          onChange={setStatut}
          options={[
            { valeur: 'paye', libelle: 'Payé' },
            { valeur: 'credit', libelle: 'À crédit' },
          ]}
        />
      </div>
      <Champ libelle="Client" aide={statut === 'credit' ? 'Conseillé pour une vente à crédit.' : undefined}>
        {(id) => (
          <>
            <Saisie id={id} value={f.client} onChange={maj('client')} list="clients" placeholder="Facultatif" />
            <datalist id="clients">
              {clients.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </>
        )}
      </Champ>
      <PlusDeDetails ouvertParDefaut={Boolean(element?.telephoneClient || element?.poidsMoyen || element?.notes)}>
        <Champ libelle="Téléphone du client">
          {(id) => <Saisie id={id} type="tel" inputMode="tel" value={f.telephoneClient} onChange={maj('telephoneClient')} />}
        </Champ>
        <Champ libelle="Poids moyen" suffixe="kg">
          {(id) => <SaisieNombre id={id} decimal value={f.poidsMoyen} onChange={maj('poidsMoyen')} placeholder="0" avecSuffixe />}
        </Champ>
        <Champ libelle="Notes">{(id) => <Zone id={id} value={f.notes} onChange={maj('notes')} />}</Champ>
      </PlusDeDetails>
      <Erreur>{erreur}</Erreur>
    </form>
  )
}

/* ======================= Panneau commun ======================= */

const TITRES = {
  menu: ['Nouvelle saisie', 'Que voulez-vous enregistrer ?'],
  bande: ['Nouvelle bande', 'Achat des poussins'],
  mortalite: ['Mortalité', 'Noter les poulets morts'],
  charge: ['Charge', 'Une dépense de la bande ou de la ferme'],
  vente: ['Vente', 'Poulets vendus'],
} as const

export function PanneauSaisie() {
  const { saisie, fermer } = useSaisie()
  const [aSupprimer, setASupprimer] = useState(false)
  const s = saisie
  const edition = s && s.type !== 'menu' && Boolean(s.element)
  const [titre, description] = s ? TITRES[s.type] : ['', '']
  const titreFinal = edition ? (s?.type === 'bande' ? 'Modifier la bande' : `Modifier : ${titre.toLowerCase()}`) : titre

  const supprimer = () => {
    if (!s || s.type === 'menu' || !s.element) return
    if (s.type === 'mortalite') actions.supprimerMortalite(s.element.id)
    if (s.type === 'charge') actions.supprimerCharge(s.element.id)
    if (s.type === 'vente') actions.supprimerVente(s.element.id)
    toast.success('Saisie supprimée')
    fermer()
  }

  return (
    <>
      <Panneau
        ouvert={Boolean(s)}
        onFermer={fermer}
        titre={titreFinal}
        description={edition ? undefined : description}
        pied={
          s && s.type !== 'menu' ? (
            <Pied formId="form-saisie" onSupprimer={edition && s.type !== 'bande' ? () => setASupprimer(true) : undefined} />
          ) : undefined
        }
      >
        {s?.type === 'menu' && <MenuSaisie />}
        {s?.type === 'bande' && <FormBande key={s.element?.id ?? 'nv'} element={s.element} onFini={fermer} />}
        {s?.type === 'mortalite' && <FormMortalite key={s.element?.id ?? 'nv'} element={s.element} bandeId={s.bandeId} onFini={fermer} />}
        {s?.type === 'charge' && <FormCharge key={s.element?.id ?? 'nv'} element={s.element} bandeId={s.bandeId} onFini={fermer} />}
        {s?.type === 'vente' && <FormVente key={s.element?.id ?? 'nv'} element={s.element} bandeId={s.bandeId} onFini={fermer} />}
      </Panneau>
      <Confirmation
        ouvert={aSupprimer}
        onFermer={() => setASupprimer(false)}
        onConfirmer={supprimer}
        titre="Supprimer cette saisie ?"
        message="Elle sera retirée de tous les calculs. Cette action est définitive."
      />
    </>
  )
}
