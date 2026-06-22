import { useState, useCallback } from 'react'
import InputPanel from './components/InputPanel/InputPanel.jsx'
import BeamSchematic from './components/BeamSchematic/BeamSchematic.jsx'
import DiagramPanel from './components/Diagrams/DiagramPanel.jsx'
import ResultsTable from './components/ResultsTable/ResultsTable.jsx'
import Onboarding from './components/Onboarding/Onboarding.jsx'
import ParametricPanel from './components/ParametricAnalysis/ParametricPanel.jsx'
import ParametricChart from './components/ParametricAnalysis/ParametricChart.jsx'
import ParametricResults from './components/ParametricAnalysis/ParametricResults.jsx'
import DeflectionSlopeCharts from './components/ParametricAnalysis/DeflectionSlopeCharts.jsx'
import DeflectionSlopeTable from './components/ParametricAnalysis/DeflectionSlopeTable.jsx'
import { validateConfig, validateLoad } from './engine/validators.js'
import { generateDiagramData } from './engine/diagramData.js'
import { runParametricSweep } from './engine/parametricSweep.js'
import { runDeflectionSlopeAnalysis } from './engine/elasticCurve.js'
import { ANALYSIS_TYPES } from './utils/constants.js'
import './App.css'

/**
 * App — Root component for the beam simulator.
 * Manages global state and orchestrates calculation flow.
 * Supports two modes: single analysis and parametric sweep.
 */
function App() {
  const [mode, setMode] = useState('single') // 'single' | 'parametric'
  const [results, setResults] = useState(null)
  const [errors, setErrors] = useState([])
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Parametric analysis state
  const [parametricResults, setParametricResults] = useState(null)
  const [parametricErrors, setParametricErrors] = useState([])

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

  const handleRunParametric = useCallback((config) => {
    // Check if this is a deflection-slope analysis
    if (config.analysisType === ANALYSIS_TYPES.DEFLECTION_SLOPE_VS_X) {
      // Validate deflection-slope specific config
      const errors = []

      if (!config.totalLength || config.totalLength <= 0) {
        errors.push('O comprimento total da viga deve ser positivo.')
      }
      if (!config.I || config.I <= 0) {
        errors.push('O momento de inércia I deve ser positivo.')
      }
      if (config.sweepStart === undefined || config.sweepStart === null || isNaN(config.sweepStart)) {
        errors.push('O x inicial é obrigatório.')
      }
      if (!config.sweepEnd || config.sweepEnd <= 0) {
        errors.push('O x final deve ser positivo.')
      }
      if (!config.sweepStep || config.sweepStep <= 0) {
        errors.push('O incremento deve ser positivo.')
      }
      if (config.sweepStart >= config.sweepEnd) {
        errors.push('O x inicial deve ser menor que o x final.')
      }
      if (!config.loads || config.loads.length === 0) {
        errors.push('Adicione pelo menos uma carga.')
      }
      if (config.materials.length === 0) {
        errors.push('Selecione pelo menos um material.')
      }

      if (errors.length > 0) {
        setParametricErrors(errors)
        setParametricResults(null)
        return
      }

      setParametricErrors([])

      try {
        const result = runDeflectionSlopeAnalysis(config)
        setParametricResults(result)
      } catch (err) {
        setParametricErrors([`Erro na análise: ${err.message}`])
        setParametricResults(null)
      }
      return
    }

    // Standard parametric sweep validation
    const errors = []

    if (!config.P || config.P <= 0) {
      errors.push('A carga P deve ser positiva.')
    }
    if (!config.I || config.I <= 0) {
      errors.push('O momento de inércia I deve ser positivo.')
    }
    if (!config.sweepEnd || config.sweepEnd <= 0) {
      errors.push('O valor final do intervalo deve ser positivo.')
    }
    if (!config.sweepStep || config.sweepStep <= 0) {
      errors.push('O incremento deve ser positivo.')
    }
    if (config.sweepStart >= config.sweepEnd) {
      errors.push('O valor inicial deve ser menor que o final.')
    }
    if (config.materials.length === 0) {
      errors.push('Selecione pelo menos um material.')
    }

    if (errors.length > 0) {
      setParametricErrors(errors)
      setParametricResults(null)
      return
    }

    setParametricErrors([])

    try {
      const result = runParametricSweep(config)
      setParametricResults(result)
    } catch (err) {
      setParametricErrors([`Erro na análise: ${err.message}`])
      setParametricResults(null)
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
            <path d="M4 4h16v3h-5v10h5v3H4v-3h5V7H4V4z" />
          </svg>
          Simulador de Vigas
        </div>

        {/* Mode tabs */}
        <nav className="mode-tabs" aria-label="Modo de análise">
          <button
            className={`mode-tab ${mode === 'single' ? 'mode-tab--active' : ''}`}
            onClick={() => setMode('single')}
            aria-pressed={mode === 'single'}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">
              <path d="M3 10h14M3 10l3-3M3 10l3 3M17 10l-3-3M17 10l-3 3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
            Análise Simples
          </button>
          <button
            className={`mode-tab ${mode === 'parametric' ? 'mode-tab--active' : ''}`}
            onClick={() => setMode('parametric')}
            aria-pressed={mode === 'parametric'}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">
              <path d="M3 15l4-6 4 3 6-9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Análise Paramétrica
          </button>
        </nav>

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
        {mode === 'single' ? (
          <>
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
          </>
        ) : (
          <>
            <aside className="app-panel" id="parametric-config-panel">
              <ParametricPanel
                onRunAnalysis={handleRunParametric}
                errors={parametricErrors}
              />
            </aside>

            <section className="app-workspace" id="parametric-workspace">
              {!parametricResults ? (
                <div className="parametric-welcome">
                  <svg
                    className="parametric-welcome__icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path d="M3 20l5-8 4 4 8-12" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="8" cy="12" r="1.5" fill="currentColor" />
                    <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                    <circle cx="20" cy="4" r="1.5" fill="currentColor" />
                  </svg>
                  <h2 className="parametric-welcome__title">Análise Paramétrica</h2>
                  <p className="parametric-welcome__text">
                    Configure os parâmetros no painel à esquerda para executar uma
                    análise paramétrica. Varie o comprimento L ou a posição do apoio
                    e compare o comportamento para diferentes materiais (Alumínio, Aço).
                  </p>
                  <p className="parametric-welcome__text">
                    Use a análise <strong>&ldquo;Deflexão e Inclinação vs x&rdquo;</strong> para
                    gerar gráficos de y(x) e θ(x) ao longo da viga, com configuração
                    completa de cargas e apoios.
                  </p>
                </div>
              ) : parametricResults.isDeflectionSlope ? (
                <div className="parametric-workspace">
                  <DeflectionSlopeCharts
                    deflectionSeries={parametricResults.deflectionSeries}
                    slopeSeries={parametricResults.slopeSeries}
                  />
                  <DeflectionSlopeTable
                    tableRows={parametricResults.tableRows}
                    materials={parametricResults.materials}
                    reactions={parametricResults.reactions}
                    reactionMoments={parametricResults.reactionMoments}
                  />
                </div>
              ) : (
                <div className="parametric-workspace">
                  <ParametricChart
                    series={parametricResults.series}
                    title={parametricResults.title}
                    xLabel={parametricResults.xLabel}
                    yLabel={parametricResults.yLabel}
                    xUnit={parametricResults.xUnit}
                    yUnit={parametricResults.yUnit}
                  />
                  <ParametricResults
                    series={parametricResults.series}
                    xLabel={parametricResults.xLabel}
                    xUnit={parametricResults.xUnit}
                    yLabel={parametricResults.yLabel}
                    yUnit={parametricResults.yUnit}
                  />
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Onboarding
        forceShow={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  )
}

export default App
