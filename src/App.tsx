import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import DashboardPage from './pages/DashboardPage'
import { RouteErrorBoundary } from './components/RouteErrorBoundary'

const CatalogPage       = lazy(() => import('./pages/CatalogPage'))
const DatasetPage       = lazy(() => import('./pages/DatasetPage'))
const AnalysePage       = lazy(() => import('./pages/AnalysePage'))
const WindPage          = lazy(() => import('./pages/WindPage'))
const SolarPage         = lazy(() => import('./pages/SolarPage'))
const HeatPage          = lazy(() => import('./pages/HeatPage'))
const AboutPage         = lazy(() => import('./pages/AboutPage'))
const ComparePage       = lazy(() => import('./pages/ComparePage'))
const RegionalPage      = lazy(() => import('./pages/RegionalPage'))
const SocialPreviewPage = lazy(() => import('./pages/SocialPreviewPage'))

function PageFallback() {
  return (
    <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 14 }}>
      Lade Seite…
    </div>
  )
}

function Layout() {
  const { pathname, hash } = useLocation()

  // React Router springt bei client-seitiger Navigation nicht automatisch zu
  // #anchor-Zielen (z. B. Footer → /about#impressum). Hier nachgezogen.
  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(hash.slice(1))
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }, [pathname, hash])

  // Auf der reinen Render-Seite für OG-Bilder keinen Footer einblenden.
  const hideChrome = pathname === '/social-preview'
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<RouteErrorBoundary><DashboardPage /></RouteErrorBoundary>} />
            <Route path="/analysen" element={<RouteErrorBoundary><AnalysePage /></RouteErrorBoundary>} />
            <Route path="/regionen" element={<RouteErrorBoundary><RegionalPage /></RouteErrorBoundary>} />
            <Route path="/vergleich" element={<RouteErrorBoundary><ComparePage /></RouteErrorBoundary>} />
            <Route path="/wind" element={<RouteErrorBoundary><WindPage /></RouteErrorBoundary>} />
            <Route path="/solar" element={<RouteErrorBoundary><SolarPage /></RouteErrorBoundary>} />
            <Route path="/hitze" element={<RouteErrorBoundary><HeatPage /></RouteErrorBoundary>} />
            <Route path="/catalog" element={<RouteErrorBoundary><CatalogPage /></RouteErrorBoundary>} />
            <Route path="/dataset/:id" element={<RouteErrorBoundary><DatasetPage /></RouteErrorBoundary>} />
            <Route path="/about" element={<RouteErrorBoundary><AboutPage /></RouteErrorBoundary>} />
            <Route path="/social-preview" element={<RouteErrorBoundary><SocialPreviewPage /></RouteErrorBoundary>} />
          </Routes>
        </Suspense>
      </div>
      {!hideChrome && <Footer />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Layout />
    </BrowserRouter>
  )
}
