import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const loc = useLocation()

  const links = [
    { to: '/', label: 'Dashboard' },
    { to: '/catalog', label: 'Datenkatalog' },
  ]

  return (
    <nav style={{ background: '#1e3a5f', color: '#fff' }} className="px-6 py-3 flex items-center gap-6 shadow-md">
      <Link to="/" className="flex items-center gap-2 no-underline">
        <span style={{ fontSize: 22 }}>🌍</span>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: '-0.3px' }}>
          UBA Datacube
        </span>
      </Link>
      <div className="flex gap-1 ml-2">
        {links.map((l) => {
          const active = loc.pathname === l.to || (l.to !== '/' && loc.pathname.startsWith(l.to))
          return (
            <Link
              key={l.to}
              to={l.to}
              style={{
                color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                borderRadius: 6,
                padding: '4px 12px',
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              {l.label}
            </Link>
          )
        })}
      </div>
      <div className="ml-auto" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
        Daten: Umweltbundesamt
      </div>
    </nav>
  )
}
