import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/plus-jakarta-sans/700.css'
import '@fontsource/plus-jakarta-sans/800.css'
import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { FournisseurSaisie } from './components/forms/saisie-context'
import { GardeErreur } from './components/GardeErreur'
import { Porte } from './components/Porte'
import { AppShell } from './components/layout/AppShell'
import Accueil from './pages/Accueil'
import BandeDetail from './pages/BandeDetail'
import Bandes from './pages/Bandes'
import Charges from './pages/Charges'
import Mortalite from './pages/Mortalite'
import Parametres from './pages/Parametres'
import Rapports from './pages/Rapports'
import Ventes from './pages/Ventes'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <GardeErreur>
        <Porte>
          <FournisseurSaisie>
            <AppShell>
              <Routes>
                <Route path="/" element={<Accueil />} />
                <Route path="/bandes" element={<Bandes />} />
                <Route path="/bandes/:id" element={<BandeDetail />} />
                <Route path="/charges" element={<Charges />} />
                <Route path="/mortalite" element={<Mortalite />} />
                <Route path="/ventes" element={<Ventes />} />
                <Route path="/rapports" element={<Rapports />} />
                <Route path="/parametres" element={<Parametres />} />
                <Route path="*" element={<Accueil />} />
              </Routes>
            </AppShell>
          </FournisseurSaisie>
        </Porte>
      </GardeErreur>
      <Toaster
        position="top-center"
        richColors={false}
        toastOptions={{
          classNames: {
            toast: 'rounded-2xl border border-ligne bg-white font-sans shadow-haute',
            title: 'font-semibold text-encre',
            description: 'text-gris',
          },
        }}
      />
    </HashRouter>
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* hors ligne indisponible : l'application fonctionne quand même */
    })
  })
}
