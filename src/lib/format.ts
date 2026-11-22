/** Convertit n'importe quelle saisie en nombre. Vide, invalide ou absent vaut 0. */
export function num(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const n = Number(String(v).replace(/[\s\u00a0\u202f]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

/** Champ facultatif : renvoie null si vide, sinon le nombre. */
export function numOuNull(v: unknown): number | null {
  if (v === null || v === undefined || String(v).trim() === '') return null
  const n = num(v)
  return n
}

/** Division sûre : renvoie null si le diviseur vaut 0. */
export function div(a: number, b: number): number | null {
  if (!b || !Number.isFinite(a) || !Number.isFinite(b)) return null
  return a / b
}

const NBSP = '\u00a0'
const fmtEntier = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const fmt1 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** Les espaces de milliers sont insécables pour éviter les coupures de ligne. */
function insecable(s: string) {
  return s.replace(/[\s\u202f]/g, NBSP)
}

export const TIRET = '–'

export function fcfa(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return TIRET
  return insecable(fmtEntier.format(Math.round(v))) + NBSP + 'F' + NBSP + 'CFA'
}

/** Version courte pour les cartes : « 1 250 000 F ». */
export function fcfaCourt(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return TIRET
  return insecable(fmtEntier.format(Math.round(v))) + NBSP + 'F'
}

export function nombre(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return TIRET
  return insecable(fmtEntier.format(v))
}

export function pct(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return TIRET
  return insecable(fmt1.format(v)) + NBSP + '%'
}

export function decimal(v: number | null | undefined, chiffres = 1): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return TIRET
  return insecable(new Intl.NumberFormat('fr-FR', { maximumFractionDigits: chiffres }).format(v))
}

/** ISO aaaa-mm-jj vers jj/mm/aaaa. */
export function dateFr(iso: string | null | undefined): string {
  if (!iso) return TIRET
  const [a, m, j] = iso.slice(0, 10).split('-')
  if (!a || !m || !j) return TIRET
  return `${j}/${m}/${a}`
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MOIS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

export function dateCourte(iso: string): string {
  const d = parseIso(iso)
  return `${d.getDate()} ${MOIS[d.getMonth()]}`
}

export function dateLongue(d: Date): string {
  return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS_LONG[d.getMonth()]} ${d.getFullYear()}`
}

export function nomMois(iso: string): string {
  const d = parseIso(iso)
  return `${MOIS[d.getMonth()]} ${d.getFullYear()}`
}

export function parseIso(iso: string): Date {
  const [a, m, j] = iso.slice(0, 10).split('-').map(Number)
  return new Date(a, (m || 1) - 1, j || 1)
}

export function isoDe(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const j = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${j}`
}

export function aujourdhui(): string {
  return isoDe(new Date())
}

export function ajouterJours(iso: string, n: number): string {
  const d = parseIso(iso)
  d.setDate(d.getDate() + n)
  return isoDe(d)
}

/** Nombre de jours entiers entre deux dates ISO. */
export function joursEntre(debut: string, fin: string): number {
  const ms = parseIso(fin).getTime() - parseIso(debut).getTime()
  return Math.round(ms / 86_400_000)
}
