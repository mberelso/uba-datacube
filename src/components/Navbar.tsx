import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CubeMark } from './CubeMark'
import { List, X } from '@phosphor-icons/react'

export default function Navbar() {
  const loc = useLocation()
  const [open, setOpen] = useState(false)

  const links = [
    { to: '/', label: 'Dashboard' },
    { to: '/analysen', label: 'Analysen' },
    { to: '/catalog', label: 'Datenkatalog' },
    { to: '/about', label: 'Über das Projekt' },
  ]

  const isActive = (to: string) =>
    loc.pathname === to || (to !== '/' && loc.pathname.startsWith(to))

  return (
    <nav style={{ background: '#1B2B3A' }} className="relative z-50 shadow-md">
      {/* ── Main bar ───────────────────────────────────────────────────── */}
      <div className="px-5 py-3 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 no-underline shrink-0" onClick={() => setOpen(false)}>
          <CubeMark size={20} color="rgba(255,255,255,0.95)" accent="#4A6741" />
          <span style={{ fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: '-0.3px' }}>
            Umweltpuls
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex gap-1 ml-2">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              style={{
                color: isActive(l.to) ? '#fff' : 'rgba(255,255,255,0.65)',
                background: isActive(l.to) ? 'rgba(255,255,255,0.12)' : 'transparent',
                borderRadius: 6,
                padding: '4px 12px',
                fontSize: 14,
                fontWeight: isActive(l.to) ? 600 : 400,
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto hidden md:block" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          Daten: Umweltbundesamt
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden ml-auto p-1.5 rounded-lg transition-colors cursor-pointer border-0"
          style={{ background: open ? 'rgba(255,255,255,0.1)' : 'transparent', color: '#fff' }}
          onClick={() => setOpen(!open)}
          aria-label="Menü"
        >
          {open ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
        </button>
      </div>

      {/* ── Mobile menu ────────────────────────────────────────────────── */}
      {open && (
        <div
          className="md:hidden border-t flex flex-col pb-3"
          style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#1B2B3A' }}
        >
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="no-underline px-5 py-3 text-[15px] transition-colors"
              style={{
                color: isActive(l.to) ? '#fff' : 'rgba(255,255,255,0.7)',
                fontWeight: isActive(l.to) ? 600 : 400,
                background: isActive(l.to) ? 'rgba(255,255,255,0.07)' : 'transparent',
                borderLeft: isActive(l.to) ? '3px solid #4A6741' : '3px solid transparent',
              }}
            >
              {l.label}
            </Link>
          ))}
          <div className="px-5 pt-3 mt-1 border-t text-[11px]"
            style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}>
            Daten: Umweltbundesamt
          </div>
        </div>
      )}
    </nav>
  )
}
