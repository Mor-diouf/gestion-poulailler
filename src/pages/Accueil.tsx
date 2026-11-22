import {
  AlertTriangle,
  Bird,
  CheckCircle2,
  ChevronRight,
  Clock,
  HandCoins,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
  Activity,
  History,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BandeCarte } from '@/components/BandeCarte'
import { useSaisie } from '@/components/forms/saisie-context'
import { AnneauCharges, GraphiqueEffectif } from '@/components/Graphiques'
import { ListeOperations } from '@/components/Operations'
import { Badge, Bouton, Carte, EnteteCarte, EtatVide, Liste, Pastille, cx, type Teinte } from '@/components/ui'
import {
  ageBande,
  alertes,
  bilanBande,
  bilanEnCours,
  bilanFerme,
  dernieresOperations,
  estVentePoulets,
  serieEffectif,
  sommePeriode,
} from '@/lib/calculs'
import { ajouterJours, aujourdhui, dateLongue, fcfa, fcfaCourt, nombre, pct } from '@/lib/format'
import { useDonnees } from '@/lib/store'

function CarteIndicateur({
  icone,
  teinte,
  libelle,
  valeur,
  couleurValeur,
  detail,
  badge,
}: {
  icone: LucideIcon
  teinte: Teinte
  libelle: string
  valeur: string
  couleurValeur?: string
  detail?: ReactNode
  badge?: ReactNode
}) {
  return (
    <Carte className="flex min-w-0 flex-col p-3.5 transition duration-200 hover:-translate-y-0.5 hover:shadow-haute sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <Pastille icone={icone} teinte={teinte} />
        {badge}
      </div>
      <p className="mt-4 text-[13px] font-medium text-gris">{libelle}</p>
      <p className={cx('chiffres mt-1 truncate text-[22px] font-bold leading-tight sm:text-[28px]', couleurValeur ?? 'text-encre')}>{valeur}</p>
      {detail && <div className="mt-1.5 text-xs text-gris">{detail}</div>}
    </Carte>
  )
}

function Tendance({ valeur, texte, inverse = false }: { valeur: number; texte: string; inverse?: boolean }) {
  if (valeur === 0) return <span>{texte}</span>
  const hausse = valeur > 0
  const bon = inverse ? !hausse : hausse
  const Icone = hausse ? TrendingUp : TrendingDown
  return (
    <span className="inline-flex items-center gap-1">
      <Icone className={cx('h-3.5 w-3.5', bon ? 'text-foret' : 'text-brique')} strokeWidth={2} />
      <span>{texte}</span>
    </span>
  )
}

export default function Accueil() {
  const d = useDonnees()
  const { ouvrir } = useSaisie()
  const [params, setParams] = useSearchParams()
  const jour = aujourdhui()
  const debut7 = ajouterJours(jour, -6)

  const enCours = d.bandes.filter((b) => b.statut === 'en_cours').sort((a, b) => (a.dateArrivee < b.dateArrivee ? 1 : -1))
  const selId = params.get('bande')
  const bande = d.bandes.find((b) => b.id === selId) ?? null
  const choisir = (id: string) => setParams(id ? { bande: id } : {}, { replace: true })

  const ferme = bilanFerme(d)
  const bilanCours = bilanEnCours(d)
  const bi = bande ? bilanBande(bande, d) : null

  const ids = new Set(bande ? [bande.id] : enCours.map((b) => b.id))
  const morts7 = sommePeriode(
    d.mortalites.filter((m) => ids.has(m.bandeId)),
    debut7,
    jour,
    (m) => m.nombre,
  )
  const vendus7 = sommePeriode(
    d.ventes.filter((v) => v.bandeId !== null && ids.has(v.bandeId) && estVentePoulets(v)),
    debut7,
    jour,
    (v) => v.quantite,
  )
  const ca7 = sommePeriode(
    bande ? d.ventes.filter((v) => v.bandeId === bande.id) : d.ventes,
    debut7,
    jour,
    (v) => v.montant,
  )

  const vivants = bi ? bi.effectif : bilanCours.effectif
  const taux = bi ? bi.tauxMortalite : bilanCours.tauxMortalite
  const ca = bi ? bi.ca : ferme.ca
  const benefice = bi ? bi.benefice : ferme.benefice
  const charges = bi ?? ferme
  const auDessus = taux !== null && taux > d.ferme.seuilMortalite

  const serie = serieEffectif(bande ? [bande] : enCours, d, jour)
  const lesAlertes = alertes(d, jour)
  const ops = dernieresOperations(d, 8, bande?.id)
  const salutation = new Date().getHours() >= 18 ? 'Bonsoir' : 'Bonjour'
  const date = dateLongue(new Date()).replace(/^./, (c) => c.toUpperCase())

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gris">{date}</p>
          <h1 className="mt-1 text-[26px] font-bold leading-tight text-encre sm:text-[32px]">
            {salutation}
            {d.ferme.prenom ? `, ${d.ferme.prenom}` : ''}
          </h1>
          <p className="mt-0.5 text-sm text-gris">{d.ferme.nom}</p>
        </div>
        <div className="flex items-center gap-2 sm:w-auto">
          <div className="min-w-0 flex-1 sm:w-64 sm:flex-none">
            <Liste value={bande?.id ?? ''} onChange={(e) => choisir(e.target.value)} aria-label="Filtrer par bande">
              <option value="">Toutes les bandes</option>
              {d.bandes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nom}
                  {b.statut === 'terminee' ? ' (terminée)' : ''}
                </option>
              ))}
            </Liste>
          </div>
          <Bouton icone={Plus} className="hidden h-12 lg:inline-flex" onClick={() => ouvrir({ type: 'menu' })}>
            Saisie
          </Bouton>
        </div>
      </div>

      {/* Indicateurs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <CarteIndicateur
          icone={Bird}
          teinte="vert"
          libelle="Poulets vivants"
          valeur={nombre(vivants)}
          detail={
            bande ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {ageBande(bande, jour)} jours d'âge
              </span>
            ) : (
              `${enCours.length} bande${enCours.length > 1 ? 's' : ''} en cours`
            )
          }
          badge={
            morts7 + vendus7 > 0 ? (
              <span className="chiffres text-xs font-medium text-gris">−{nombre(morts7 + vendus7)} en 7 j</span>
            ) : undefined
          }
        />
        <CarteIndicateur
          icone={Activity}
          teinte={auDessus ? 'ambre' : 'gris'}
          libelle="Taux de mortalité"
          valeur={pct(taux)}
          badge={
            taux === null ? undefined : auDessus ? (
              <Badge teinte="ambre">Au-dessus de {pct(d.ferme.seuilMortalite)}</Badge>
            ) : (
              <Badge teinte="vert">Normal</Badge>
            )
          }
          detail={<Tendance valeur={morts7} inverse texte={morts7 > 0 ? `${nombre(morts7)} mort${morts7 > 1 ? 's' : ''} sur 7 jours` : 'Aucun mort sur 7 jours'} />}
        />
        <CarteIndicateur
          icone={HandCoins}
          teinte="vert"
          libelle="Chiffre d'affaires"
          valeur={fcfaCourt(ca)}
          detail={<Tendance valeur={ca7} texte={ca7 > 0 ? `+${fcfaCourt(ca7)} sur 7 jours` : 'Aucune vente sur 7 jours'} />}
        />
        <CarteIndicateur
          icone={Wallet}
          teinte={benefice >= 0 ? 'vert' : 'rouge'}
          libelle={bande ? (bande.statut === 'en_cours' ? 'Bénéfice provisoire' : 'Bénéfice net') : 'Bénéfice net'}
          valeur={fcfaCourt(benefice)}
          couleurValeur={benefice >= 0 ? 'text-foret' : 'text-brique'}
          detail={bi ? `Revient : ${fcfaCourt(bi.coutRevient)} par poulet` : 'Bilan global de la ferme'}
        />
      </div>

      {/* Graphique + anneau */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Carte className="lg:col-span-2">
          <EnteteCarte
            titre="Effectif vivant"
            sousTitre={bande ? `${bande.nom}, jour par jour depuis l'arrivée` : 'Bandes en cours, jour par jour'}
            action={
              <div className="hidden items-center gap-4 text-xs text-gris sm:flex">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-4 rounded-full bg-foret" /> Vivants
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2 rounded-sm bg-ambre" /> Morts
                </span>
              </div>
            }
          />
          <div className="h-[260px] px-2 pb-3 pt-4 sm:h-[300px] sm:px-4">
            {serie.length > 1 ? (
              <GraphiqueEffectif points={serie} />
            ) : (
              <EtatVide icone={Activity} titre="Pas encore de courbe" texte="La courbe apparaît dès qu'une bande en cours a au moins un jour." />
            )}
          </div>
        </Carte>
        <Carte>
          <EnteteCarte titre="Répartition des charges" sousTitre={bande ? bande.nom : 'Toute la ferme'} />
          <div className="p-5">
            {charges.totalCharges > 0 ? (
              <AnneauCharges parGroupe={charges.parGroupe} total={charges.totalCharges} />
            ) : (
              <EtatVide icone={Wallet} titre="Aucune charge" texte="Les dépenses saisies apparaîtront ici." />
            )}
          </div>
        </Carte>
      </div>

      {/* Bandes en cours + alertes */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[17px] font-semibold text-encre">Bandes en cours</h2>
            <Link to="/bandes" className="inline-flex min-h-[44px] items-center gap-0.5 text-sm font-medium text-foret">
              Toutes les bandes <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {enCours.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {enCours.map((b) => (
                <BandeCarte key={b.id} bande={b} />
              ))}
            </div>
          ) : (
            <Carte>
              <EtatVide
                icone={Bird}
                titre="Aucune bande en cours"
                texte="Créez une bande à l'arrivée de vos poussins pour suivre dépenses, pertes et ventes."
                action={
                  <Bouton icone={Plus} onClick={() => ouvrir({ type: 'bande' })}>
                    Nouvelle bande
                  </Bouton>
                }
              />
            </Carte>
          )}
        </div>
        <div>
          <h2 className="mb-3 flex min-h-[44px] items-center text-[17px] font-semibold text-encre">Alertes</h2>
          <Carte className="overflow-hidden">
            {lesAlertes.length === 0 ? (
              <div className="flex items-center gap-3 p-5">
                <Pastille icone={CheckCircle2} teinte="vert" />
                <div>
                  <p className="font-medium text-encre">Tout va bien</p>
                  <p className="text-sm text-gris">Aucune alerte pour le moment.</p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-ligne">
                {lesAlertes.map((a) => (
                  <li key={a.id}>
                    <Link to={a.lien ?? '/'} className="flex gap-3 p-4 transition hover:bg-creme/60">
                      <Pastille icone={a.niveau === 'attention' ? AlertTriangle : Clock} teinte="ambre" taille="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-medium text-encre">{a.titre}</p>
                        <p className="mt-0.5 text-sm text-gris">{a.detail}</p>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[#C9C3B6]" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Carte>
          {ferme.credits > 0 && (
            <p className="mt-3 px-1 text-xs text-gris">
              Crédits clients en attente : <span className="chiffres font-semibold text-ambre-700">{fcfa(ferme.credits)}</span>
            </p>
          )}
        </div>
      </div>

      {/* Dernières opérations */}
      <Carte className="overflow-hidden">
        <EnteteCarte titre="Dernières opérations" sousTitre={bande ? bande.nom : 'Toutes les bandes et la ferme'} />
        <div className="mt-3">
          {ops.length > 0 ? (
            <ListeOperations ops={ops} masquerBande={Boolean(bande)} />
          ) : (
            <EtatVide icone={History} titre="Aucune opération" texte="Vos saisies apparaîtront ici." />
          )}
        </div>
      </Carte>
    </div>
  )
}
