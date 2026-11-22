import { BarChart3, FileSpreadsheet, Printer } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Bouton, Carte, EnteteCarte, EtatVide, Ligne, TitrePage, cx } from '@/components/ui'
import { ageBande, bilanBande, bilanFerme, type Bilan } from '@/lib/calculs'
import { aujourdhui, dateFr, fcfa, fcfaCourt, nombre, pct } from '@/lib/format'
import { useDonnees } from '@/lib/store'
import { CATEGORIES, type Bande } from '@/lib/types'

/** Export CSV lisible par Excel en français : séparateur « ; » et encodage UTF-8 avec BOM. */
function exporterCsv(lignes: (string | number)[][], nom: string) {
  const cellule = (v: string | number) => {
    const s = typeof v === 'number' ? String(Math.round(v * 100) / 100).replace('.', ',') : v
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const contenu = '﻿' + lignes.map((l) => l.map(cellule).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([contenu], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nom
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function Rapports() {
  const d = useDonnees()
  const jour = aujourdhui()
  const ferme = bilanFerme(d)
  const chargesFerme = d.charges.filter((c) => c.bandeId === null).reduce((s, c) => s + c.montant, 0)
  const lignes: { b: Bande; bi: Bilan }[] = d.bandes
    .slice()
    .sort((a, b) => (a.dateArrivee < b.dateArrivee ? 1 : -1))
    .map((b) => ({ b, bi: bilanBande(b, d) }))

  const exporter = () => {
    const entete = [
      'Bande',
      'Statut',
      'Arrivée',
      'Âge (jours)',
      'Poussins reçus',
      'Morts',
      'Mortalité (%)',
      'Vendus',
      'Vivants',
      'Coût poussins (F CFA)',
      ...CATEGORIES.map((c) => `${c} (F CFA)`),
      'Total charges (F CFA)',
      "Chiffre d'affaires (F CFA)",
      'Bénéfice (F CFA)',
      'Coût de revient par poulet (F CFA)',
      'Prix de vente moyen (F CFA)',
    ]
    const corps = lignes.map(({ b, bi }) => [
      b.nom,
      b.statut === 'en_cours' ? 'En cours' : 'Terminée',
      dateFr(b.dateArrivee),
      ageBande(b, jour),
      bi.recus,
      bi.morts,
      bi.tauxMortalite ?? '',
      bi.vendus,
      bi.effectif,
      bi.coutPoussins,
      ...CATEGORIES.map((c) => bi.parCategorie[c] ?? 0),
      bi.totalCharges,
      bi.ca,
      bi.benefice,
      bi.coutRevient ?? '',
      bi.prixVenteMoyen ?? '',
    ])
    exporterCsv([entete, ...corps, [], ['Charges de toute la ferme', chargesFerme], ['Bilan global de la ferme', ferme.benefice]], `bilan-bandes-${jour}.csv`)
  }

  return (
    <div className="space-y-5">
      <TitrePage
        titre="Rapports"
        sousTitre={`Bilan au ${dateFr(jour)}`}
        actions={
          <>
            <Bouton variante="secondaire" icone={FileSpreadsheet} onClick={exporter} disabled={lignes.length === 0}>
              Excel
            </Bouton>
            <Bouton variante="secondaire" icone={Printer} onClick={() => window.print()}>
              PDF
            </Bouton>
          </>
        }
      />

      <Carte>
        <EnteteCarte titre="Bilan global de la ferme" sousTitre="Toutes les ventes moins toutes les charges, y compris celles de la ferme" />
        <div className="grid gap-x-8 px-5 pb-3 pt-2 sm:grid-cols-2">
          <div className="divide-y divide-ligne">
            <Ligne libelle="Chiffre d'affaires" valeur={fcfa(ferme.ca)} />
            <Ligne libelle="Charges des bandes, poussins compris" valeur={fcfa(ferme.totalCharges - chargesFerme)} />
            <Ligne libelle="Charges de toute la ferme" valeur={fcfa(chargesFerme)} />
          </div>
          <div className="divide-y divide-ligne">
            <Ligne libelle="Total des charges" valeur={fcfa(ferme.totalCharges)} />
            <Ligne libelle="Crédits clients en attente" valeur={fcfa(ferme.credits)} />
            <Ligne libelle="Bénéfice net" valeur={fcfa(ferme.benefice)} fort teinte={ferme.benefice >= 0 ? 'vert' : 'rouge'} />
          </div>
        </div>
      </Carte>

      <Carte className="overflow-hidden">
        <EnteteCarte titre="Comparaison des bandes" sousTitre="Hors charges de toute la ferme" />
        {lignes.length === 0 ? (
          <EtatVide icone={BarChart3} titre="Aucune bande" texte="Les bilans apparaîtront dès la première bande." />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-y border-ligne bg-creme/60 text-left text-xs text-gris">
                  <th className="px-5 py-3 font-medium">Bande</th>
                  <th className="px-3 py-3 text-right font-medium">Reçus</th>
                  <th className="px-3 py-3 text-right font-medium">Mortalité</th>
                  <th className="px-3 py-3 text-right font-medium">Vendus</th>
                  <th className="px-3 py-3 text-right font-medium">Charges</th>
                  <th className="px-3 py-3 text-right font-medium">CA</th>
                  <th className="px-3 py-3 text-right font-medium">Bénéfice</th>
                  <th className="px-3 py-3 text-right font-medium">Revient /poulet</th>
                  <th className="px-5 py-3 text-right font-medium">Marge /poulet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ligne">
                {lignes.map(({ b, bi }) => (
                  <tr key={b.id} className="hover:bg-creme/40">
                    <td className="px-5 py-3.5">
                      <Link to={'/bandes/' + b.id} className="font-medium text-encre hover:text-foret">
                        {b.nom}
                      </Link>
                      <p className="text-xs text-gris">{b.statut === 'en_cours' ? `En cours · J${ageBande(b, jour)}` : 'Terminée'}</p>
                    </td>
                    <td className="chiffres px-3 py-3.5 text-right">{nombre(bi.recus)}</td>
                    <td className={cx('chiffres px-3 py-3.5 text-right', (bi.tauxMortalite ?? 0) > d.ferme.seuilMortalite && 'font-semibold text-ambre-700')}>
                      {pct(bi.tauxMortalite)}
                    </td>
                    <td className="chiffres px-3 py-3.5 text-right">{nombre(bi.vendus)}</td>
                    <td className="chiffres px-3 py-3.5 text-right">{fcfaCourt(bi.totalCharges)}</td>
                    <td className="chiffres px-3 py-3.5 text-right">{fcfaCourt(bi.ca)}</td>
                    <td className={cx('chiffres px-3 py-3.5 text-right font-semibold', bi.benefice >= 0 ? 'text-foret' : 'text-brique')}>{fcfaCourt(bi.benefice)}</td>
                    <td className="chiffres px-3 py-3.5 text-right">{fcfaCourt(bi.coutRevient)}</td>
                    <td className={cx('chiffres px-5 py-3.5 text-right', bi.marge !== null && (bi.marge >= 0 ? 'text-foret' : 'text-brique'))}>{fcfaCourt(bi.marge)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Carte>

      {lignes.map(({ b, bi }) => (
        <Carte key={b.id} className="break-inside-avoid">
          <EnteteCarte titre={`Bilan détaillé · ${b.nom}`} sousTitre={`Arrivée le ${dateFr(b.dateArrivee)}`} />
          <div className="grid gap-x-8 px-5 pb-3 pt-2 sm:grid-cols-2">
            <div className="divide-y divide-ligne">
              <Ligne libelle="Poussins" valeur={fcfa(bi.coutPoussins)} />
              {CATEGORIES.filter((c) => bi.parCategorie[c]).map((c) => (
                <Ligne key={c} libelle={c} valeur={fcfa(bi.parCategorie[c])} />
              ))}
              <Ligne libelle="Total des charges" valeur={fcfa(bi.totalCharges)} fort />
            </div>
            <div className="divide-y divide-ligne">
              <Ligne libelle="Chiffre d'affaires" valeur={fcfa(bi.ca)} />
              <Ligne libelle="Bénéfice" valeur={fcfa(bi.benefice)} fort teinte={bi.benefice >= 0 ? 'vert' : 'rouge'} />
              <Ligne libelle="Coût de revient par poulet" valeur={fcfa(bi.coutRevient)} />
              <Ligne libelle="Prix de vente moyen" valeur={fcfa(bi.prixVenteMoyen)} />
              <Ligne libelle="Marge par poulet" valeur={fcfa(bi.marge)} />
            </div>
          </div>
        </Carte>
      ))}
    </div>
  )
}
