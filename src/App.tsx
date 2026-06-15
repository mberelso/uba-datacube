import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import DashboardPage from './pages/DashboardPage'
import CatalogPage from './pages/CatalogPage'
import DatasetPage from './pages/DatasetPage'
import AnalysePage from './pages/AnalysePage'
import WindPage from './pages/WindPage'
import SolarPage from './pages/SolarPage'
import AboutPage from './pages/AboutPage'
import SocialPreviewPage from './pages/SocialPreviewPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/analysen" element={<AnalysePage />} />
          <Route path="/wind" element={<WindPage />} />
          <Route path="/solar" element={<SolarPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/dataset/:id" element={<DatasetPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/social-preview" element={<SocialPreviewPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
