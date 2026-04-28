import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import DashboardPage from './pages/DashboardPage'
import CatalogPage from './pages/CatalogPage'
import DatasetPage from './pages/DatasetPage'

const base = import.meta.env.BASE_URL

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Navbar />
        <Routes>
          <Route path={base} element={<DashboardPage />} />
          <Route path={`${base}catalog`} element={<CatalogPage />} />
          <Route path={`${base}dataset/:id`} element={<DatasetPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
