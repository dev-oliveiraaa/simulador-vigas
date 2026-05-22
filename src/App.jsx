import './App.css'

/**
 * App — Root component for the beam simulator.
 * Renders the shell layout: header, input panel, and workspace area.
 */
function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__title">
          <svg
            className="app-header__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="10" width="20" height="4" rx="1" />
            <path d="M6 14l-2 4" />
            <path d="M4 18l4 0" />
            <path d="M18 14l2 4" />
            <path d="M16 18l4 0" />
          </svg>
          Simulador de Vigas
        </div>
        <div className="app-header__actions">
          {/* Help button will be added in onboarding feature */}
        </div>
      </header>

      <main className="app-main">
        <aside className="app-panel" id="config-panel">
          {/* InputPanel will be integrated here */}
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            Painel de configuração
          </p>
        </aside>

        <section className="app-workspace" id="workspace">
          <div className="welcome">
            <svg
              className="welcome__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="10" width="20" height="4" rx="1" />
              <path d="M6 14l-2 4" />
              <path d="M4 18l4 0" />
              <path d="M18 14l2 4" />
              <path d="M16 18l4 0" />
              <path d="M12 6v4" />
              <path d="M10 6h4" />
            </svg>
            <h2 className="welcome__title">Simulador de Vigas</h2>
            <p className="welcome__text">
              Configure a viga no painel à esquerda — tipo de apoio, comprimento
              e cargas — e clique em &ldquo;Calcular&rdquo; para visualizar os
              diagramas de esforço cortante, momento fletor e flecha elástica.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
