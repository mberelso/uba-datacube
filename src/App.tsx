import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import DashboardPage from './pages/DashboardPage'
import CatalogPage from './pages/CatalogPage'
import DatasetPage from './pages/DatasetPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/dataset/:id" element={<DatasetPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
