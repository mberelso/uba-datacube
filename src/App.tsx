import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import DashboardPage from './pages/DashboardPage'
import CatalogPage from './pages/CatalogPage'
import DatasetPage from './pages/DatasetPage'
import AnalysePage from './pages/AnalysePage'
import AboutPage from './pages/AboutPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/analysen" element={<AnalysePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/dataset/:id" element={<DatasetPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
