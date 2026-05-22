import { useState, useCallback } from 'react'
import InputPanel from './components/InputPanel/InputPanel.jsx'
import BeamSchematic from './components/BeamSchematic/BeamSchematic.jsx'
import DiagramPanel from './components/Diagrams/DiagramPanel.jsx'
import ResultsTable from './components/ResultsTable/ResultsTable.jsx'
import Onboarding from './components/Onboarding/Onboarding.jsx'
import { validateConfig, validateLoad } from './engine/validators.js'
import { generateDiagramData } from './engine/diagramData.js'
import './App.css'

/**
 * App — Root component for the beam simulator.
 * Manages global state and orchestrates calculation flow.
 */
function App() {
  const [results, setResults] = useState(null)
  const [errors, setErrors] = useState([])
  const [showOnboarding, setShowOnboarding] = useState(false)

  const handleCalculate = useCallback((config) => {
    // Validate configuration
    const configErrors = validateConfig(config)

    // Validate each load
    if (Number(config.length) > 0) {
      for (const load of config.loads) {
        const loadErrors = validateLoad(load, config.length)
        configErrors.push(...loadErrors)
      }
    }

    if (configErrors.length > 0) {
      setErrors(configErrors)
      setResults(null)
      return
    }

    if (config.loads.length === 0) {
      setErrors(['Adicione pelo menos uma carga para calcular.'])
      setResults(null)
      return
    }

    // Clear errors and calculate
    setErrors([])

    try {
      const data = generateDiagramData(config)
      setResults({ ...data, config })
    } catch (err) {
      setErrors([`Erro no cálculo: ${err.message}`])
      setResults(null)
    }
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__title">
          <svg
            className="app-header__icon"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M7 4h10v2h-4v12h4v2H7v-2h4V6H7V4z" />
          </svg>
          Simulador de Vigas
        </div>
        <div className="app-header__actions">
          <button
            className="help-btn"
            onClick={() => setShowOnboarding(true)}
            aria-label="Abrir tutorial"
            title="Tutorial"
          >
            ?
          </button>
        </div>
      </header>

      <main className="app-main">
        <aside className="app-panel" id="config-panel">
          <InputPanel onCalculate={handleCalculate} errors={errors} />
        </aside>

        <section className="app-workspace" id="workspace">
          {!results ? (
            <div className="welcome">
              <svg
                className="welcome__icon"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M7 4h10v2h-4v12h4v2H7v-2h4V6H7V4z" />
              </svg>
              <h2 className="welcome__title">Simulador de Vigas</h2>
              <p className="welcome__text">
                Configure a viga no painel à esquerda — tipo de apoio, comprimento
                e cargas — e clique em &ldquo;Calcular&rdquo; para visualizar os
                diagramas de esforço cortante, momento fletor e flecha elástica.
              </p>
            </div>
          ) : (
            <div className="results-area">
              <BeamSchematic config={results.config} />
              <DiagramPanel results={results} />
              <ResultsTable results={results} />
            </div>
          )}
        </section>
      </main>

      <Onboarding
        forceShow={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  )
}

export default App
