import { Component, type ReactNode } from 'react'

interface State {
  error: Error | null
}

/**
 * Fängt Render- und Chunk-Load-Fehler pro Route ab und bietet ein automatisches
 * sowie manuelles Reload-Recovery an.
 */
export class RouteErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[RouteErrorBoundary]', error)
  }

  handleReload = () => {
    const key = 'uba_reloaded_after_error'
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1')
      window.location.reload()
      return
    }
    sessionStorage.removeItem(key)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '50vh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <h2 style={{ fontSize: 20, marginBottom: 8, fontWeight: 600 }}>Diese Seite konnte nicht geladen werden</h2>
            <p style={{ color: '#64748b', marginBottom: 16 }}>
              Möglicherweise wurde gerade ein neues Update ausgerollt.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: '#0f172a',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Seite neu laden
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
