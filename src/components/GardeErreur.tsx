import { Component, type ReactNode } from 'react'

/** Affiche un message clair au lieu d'une page blanche si un écran plante. */
export class GardeErreur extends Component<{ children: ReactNode }, { erreur: Error | null }> {
  state = { erreur: null as Error | null }

  static getDerivedStateFromError(erreur: Error) {
    return { erreur }
  }

  render() {
    if (!this.state.erreur) return this.props.children
    return (
      <div className="flex min-h-screen items-center justify-center bg-creme p-6">
        <div className="max-w-sm rounded-2xl border border-ligne bg-white p-6 text-center shadow-carte">
          <p className="font-titre text-lg font-semibold text-encre">Un problème est survenu</p>
          <p className="mt-2 text-sm text-gris">Vos données sont conservées sur cet appareil. Rechargez la page pour continuer.</p>
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#/'
              window.location.reload()
            }}
            className="mt-5 h-11 w-full rounded-xl bg-foret font-medium text-white"
          >
            Recharger
          </button>
          <p className="mt-4 break-words text-xs text-[#A3A3A3]">{this.state.erreur.message}</p>
        </div>
      </div>
    )
  }
}
