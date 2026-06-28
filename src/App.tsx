import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import DashboardPage from './pages/DashboardPage'
import CatalogPage from './pages/CatalogPage'
import DatasetPage from './pages/DatasetPage'
import AnalysePage from './pages/AnalysePage'
import WindPage from './pages/WindPage'
import SolarPage from './pages/SolarPage'
import HeatPage from './pages/HeatPage'
import AboutPage from './pages/AboutPage'
import SocialPreviewPage from './pages/SocialPreviewPage'

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
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/analysen" element={<AnalysePage />} />
          <Route path="/wind" element={<WindPage />} />
          <Route path="/solar" element={<SolarPage />} />
          <Route path="/hitze" element={<HeatPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/dataset/:id" element={<DatasetPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/social-preview" element={<SocialPreviewPage />} />
        </Routes>
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
