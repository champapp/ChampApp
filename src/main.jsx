import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './features/auth/AuthContext.jsx'

// skipWaiting + clientsClaim (vite.config.js) hacen que el SW nuevo tome el
// control apenas se instala, pero la pestaña ya abierta sigue corriendo el
// JS viejo en memoria hasta que se recarga. Forzamos ese reload una sola vez
// para que "instalar y listo" también actualice a los que ya tienen la app
// abierta (clave en el celular, donde nadie cierra la PWA manualmente).
registerSW({ immediate: true })
let reloadedForSwUpdate = false
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (reloadedForSwUpdate) return
  reloadedForSwUpdate = true
  window.location.reload()
})

// staleTime/gcTime altos: al volver de background (celular), la app muestra
// de entrada los datos que ya tenía en caché mientras actualiza atrás, en
// vez de bloquear cada pantalla con "Cargando…" hasta pedir todo de nuevo.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 30 * 60_000,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
