import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)

// Signal to the prerenderer after React + Helmet have committed to the DOM.
// Two rAF frames: first = React commit, second = Helmet side-effects flush.
requestAnimationFrame(() => requestAnimationFrame(() => {
  document.documentElement.dataset.prerenderReady = 'true'
}))
