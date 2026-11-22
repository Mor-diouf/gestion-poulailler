import { Area, Bar, CartesianGrid, Cell, ComposedChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { GroupeCharge, PointEffectif } from '@/lib/calculs'
import { GROUPES_CHARGES } from '@/lib/calculs'
import { dateFr, fcfa, fcfaCourt, nombre } from '@/lib/format'

const VERT = '#1F5130'
const AMBRE = '#E3A008'

export const COULEURS_GROUPES: Record<GroupeCharge, string> = {
  Poussins: '#1F5130',
  Aliment: '#4E8A5C',
  Médicaments: '#E3A008',
  Matériel: '#A9C9AE',
  Déplumage: '#F2C75C',
  Autres: '#BDB6A8',
}

function Infobulle({ active, payload }: { active?: boolean; payload?: { payload: PointEffectif }[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-xl border border-ligne bg-white px-3.5 py-2.5 text-sm shadow-haute">
      <p className="mb-1 font-medium text-encre">
        {dateFr(p.date)} · J{p.jour}
      </p>
      <p className="chiffres text-foret">
        Vivants : <span className="font-semibold">{nombre(p.effectif)}</span>
      </p>
      <p className="chiffres text-ambre-700">
        Morts : <span className="font-semibold">{nombre(p.morts)}</span>
      </p>
    </div>
  )
}

export function GraphiqueEffectif({ points }: { points: PointEffectif[] }) {
  const maxMorts = Math.max(1, ...points.map((p) => p.morts))
  const maxEff = Math.max(10, ...points.map((p) => p.effectif))
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={points} margin={{ top: 10, right: 4, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="degradeEffectif" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={VERT} stopOpacity={0.22} />
            <stop offset="100%" stopColor={VERT} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#EFEBE2" strokeDasharray="0" />
        <XAxis
          dataKey="jour"
          tickFormatter={(j) => `J${j}`}
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#6B7280', fontSize: 12 }}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          yAxisId="eff"
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#6B7280', fontSize: 12 }}
          width={44}
          domain={[0, Math.ceil((maxEff * 1.08) / 10) * 10]}
          tickFormatter={(v) => nombre(v)}
        />
        <YAxis yAxisId="morts" orientation="right" hide domain={[0, maxMorts * 4]} />
        <Tooltip content={<Infobulle />} cursor={{ stroke: '#D6D0C2', strokeWidth: 1 }} />
        <Bar yAxisId="morts" dataKey="morts" fill={AMBRE} radius={[3, 3, 0, 0]} maxBarSize={10} isAnimationActive={false} />
        <Area yAxisId="eff" type="monotone" dataKey="effectif" stroke={VERT} strokeWidth={2.25} fill="url(#degradeEffectif)" isAnimationActive={false} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export function AnneauCharges({ parGroupe, total }: { parGroupe: Record<GroupeCharge, number>; total: number }) {
  const donnees = GROUPES_CHARGES.map((g) => ({ nom: g, valeur: parGroupe[g] })).filter((x) => x.valeur > 0)
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col">
      <div className="relative h-[176px] w-[176px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={donnees} dataKey="valeur" nameKey="nom" innerRadius={58} outerRadius={84} paddingAngle={2} stroke="none" isAnimationActive={false} startAngle={90} endAngle={-270}>
              {donnees.map((x) => (
                <Cell key={x.nom} fill={COULEURS_GROUPES[x.nom]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number, n: string) => [fcfa(v), n]}
              contentStyle={{ borderRadius: 12, border: '1px solid #ECE8DF', fontSize: 13 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-gris">Total</span>
          <span className="chiffres text-[15px] font-bold text-encre">{fcfaCourt(total)}</span>
        </div>
      </div>
      <ul className="w-full space-y-2">
        {GROUPES_CHARGES.map((g) => {
          const v = parGroupe[g]
          const p = total > 0 ? Math.round((v / total) * 100) : 0
          return (
            <li key={g} className="flex items-center gap-2.5 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COULEURS_GROUPES[g] }} />
              <span className="min-w-0 flex-1 truncate text-gris">{g}</span>
              <span className="chiffres w-9 text-right text-xs text-gris">{v > 0 ? `${p} %` : ''}</span>
              <span className="chiffres min-w-[84px] text-right font-semibold text-encre">{fcfaCourt(v)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
