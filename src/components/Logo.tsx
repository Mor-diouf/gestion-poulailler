import { cx } from './ui'

const BASE = import.meta.env.BASE_URL

/** Médaillon rond du logo TTB, pour les petites tailles. */
export function Medaillon({ className }: { className?: string }) {
  return (
    <img
      src={`${BASE}logo-ttb-rond.webp`}
      alt=""
      width={40}
      height={40}
      className={cx('shrink-0 rounded-full shadow-[0_0_0_2px_rgba(227,160,8,0.55)]', className)}
    />
  )
}

/** Logo complet de Touba Tawfekh Business. */
export function LogoComplet({ className }: { className?: string }) {
  return <img src={`${BASE}logo-ttb.webp`} alt="TTB, Touba Tawfekh Business, vente de poulets" className={className} />
}

export function Logo({ replie = false, clair = false }: { replie?: boolean; clair?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Medaillon className="h-10 w-10" />
      {!replie && (
        <span className="min-w-0 leading-tight">
          <span className={cx('block truncate font-titre text-[16px] font-bold tracking-tight', clair ? 'text-white' : 'text-encre')}>
            Mon Poulailler
          </span>
          <span className={cx('block truncate text-[11px] font-medium', clair ? 'text-ambre' : 'text-ambre-700')}>Touba Tawfekh Business</span>
        </span>
      )}
    </div>
  )
}
