import { useState } from 'react'
import {
  BEAM_TYPES,
  ANALYSIS_TYPES,
  ANALYSIS_TYPE_LABELS,
  SWEEP_VARIABLES,
  MATERIAL_PRESETS,
  INERTIA_UNITS,
  INERTIA_UNIT_LABELS,
} from '../../utils/constants.js'
import { mm4ToCm4 } from '../../utils/unitConversion.js'
import './ParametricPanel.css'

/**
 * ParametricPanel — Sidebar for configuring parametric sweep analysis.
 *
 * @param {object} props
 * @param {Function} props.onRunAnalysis - Callback with parametric config
 * @param {string[]} props.errors - Validation error messages
 */
function ParametricPanel({ onRunAnalysis, errors }) {
  const [analysisType, setAnalysisType] = useState(ANALYSIS_TYPES.MAX_DEFLECTION)
  const [beamType, setBeamType] = useState(BEAM_TYPES.SIMPLY_SUPPORTED)
  const [P, setP] = useState('')
  const [loadPosMode, setLoadPosMode] = useState('midspan')
  const [loadPosCustom, setLoadPosCustom] = useState('')
  const [sweepStart, setSweepStart] = useState('')
  const [sweepEnd, setSweepEnd] = useState('')
  const [sweepStep, setSweepStep] = useState('1')
  const [totalLength, setTotalLength] = useState('')
  const [IValue, setIValue] = useState('')
  const [inertiaUnit, setInertiaUnit] = useState(INERTIA_UNITS.CM4)
  const [useAluminum, setUseAluminum] = useState(true)
  const [useSteel, setUseSteel] = useState(true)
  const [customE, setCustomE] = useState('')
  const [customName, setCustomName] = useState('')

  const sweepVariable =
    analysisType === ANALYSIS_TYPES.CASTIGLIANO_DISPLACEMENT
      ? SWEEP_VARIABLES.SUPPORT_POSITION
      : SWEEP_VARIABLES.LENGTH

  const handleSubmit = (e) => {
    e.preventDefault()

    // Build materials array
    const materials = []
    if (useAluminum) materials.push(MATERIAL_PRESETS.ALUMINUM)
    if (useSteel) materials.push(MATERIAL_PRESETS.STEEL)
    if (customE && Number(customE) > 0) {
      materials.push({
        name: customName || `E = ${customE} GPa`,
        E: Number(customE),
        color: '#10b981',
      })
    }

    if (materials.length === 0) {
      return
    }

    // Convert I to cm⁴
    const Icm4 = IValue !== ''
      ? (inertiaUnit === INERTIA_UNITS.MM4 ? mm4ToCm4(Number(IValue)) : Number(IValue))
      : null

    // Build load position ratio
    let loadPositionRatio = 0.5 // midspan
    if (loadPosMode === 'custom' && loadPosCustom !== '') {
      // For length sweep, ratio is relative to L; for position sweep, we don't use ratio
      loadPositionRatio = Number(loadPosCustom)
    }

    onRunAnalysis({
      analysisType,
      beamType,
      sweepVariable,
      sweepStart: Number(sweepStart),
      sweepEnd: Number(sweepEnd),
      sweepStep: Number(sweepStep),
      P: Number(P),
      loadPositionRatio: sweepVariable === SWEEP_VARIABLES.LENGTH ? loadPositionRatio : null,
      totalLength: sweepVariable === SWEEP_VARIABLES.SUPPORT_POSITION ? Number(totalLength) : null,
      I: Icm4,
      materials,
    })
  }

  return (
    <form className="parametric-panel" onSubmit={handleSubmit} id="parametric-config-form">
      {/* Analysis Type */}
      <div className="input-section">
        <h3 className="input-section__title">Tipo de Análise</h3>
        <div className="field-group">
          <label htmlFor="analysis-type">Análise</label>
          <select
            id="analysis-type"
            value={analysisType}
            onChange={(e) => setAnalysisType(e.target.value)}
          >
            {Object.entries(ANALYSIS_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {analysisType !== ANALYSIS_TYPES.CASTIGLIANO_DISPLACEMENT && (
          <div className="field-group">
            <label htmlFor="param-beam-type">Tipo de viga</label>
            <select
              id="param-beam-type"
              value={beamType}
              onChange={(e) => setBeamType(e.target.value)}
            >
              <option value={BEAM_TYPES.SIMPLY_SUPPORTED}>Simplesmente Apoiada</option>
              <option value={BEAM_TYPES.CANTILEVER}>Balanço (Engastada-Livre)</option>
            </select>
          </div>
        )}
      </div>

      {/* Load Configuration */}
      <div className="input-section">
        <h3 className="input-section__title">Carregamento</h3>
        <div className="field-group">
          <label htmlFor="param-P">
            P <span className="field-unit">(kN)</span>
          </label>
          <input
            id="param-P"
            type="number"
            step="0.01"
            placeholder="Ex: 100"
            value={P}
            onChange={(e) => setP(e.target.value)}
            required
          />
        </div>

        {sweepVariable === SWEEP_VARIABLES.LENGTH && (
          <div className="field-group">
            <label htmlFor="load-pos-mode">Posição da carga</label>
            <select
              id="load-pos-mode"
              value={loadPosMode}
              onChange={(e) => setLoadPosMode(e.target.value)}
            >
              <option value="midspan">Centro do vão (L/2)</option>
              <option value="custom">Fração personalizada (a/L)</option>
            </select>
          </div>
        )}

        {loadPosMode === 'custom' && sweepVariable === SWEEP_VARIABLES.LENGTH && (
          <div className="field-group">
            <label htmlFor="load-pos-ratio">
              Razão a/L <span className="field-unit">(0 a 1)</span>
            </label>
            <input
              id="load-pos-ratio"
              type="number"
              min="0"
              max="1"
              step="0.01"
              placeholder="Ex: 0.5"
              value={loadPosCustom}
              onChange={(e) => setLoadPosCustom(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Sweep Range */}
      <div className="input-section">
        <h3 className="input-section__title">
          {sweepVariable === SWEEP_VARIABLES.LENGTH ? 'Variação de L' : 'Variação de a'}
        </h3>

        {sweepVariable === SWEEP_VARIABLES.SUPPORT_POSITION && (
          <div className="field-group">
            <label htmlFor="param-total-length">
              Comprimento total (a + b) <span className="field-unit">(m)</span>
            </label>
            <input
              id="param-total-length"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Ex: 8"
              value={totalLength}
              onChange={(e) => setTotalLength(e.target.value)}
              required
            />
          </div>
        )}

        <div className="field-row">
          <div className="field-group">
            <label htmlFor="sweep-start">
              Início <span className="field-unit">(m)</span>
            </label>
            <input
              id="sweep-start"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ex: 0"
              value={sweepStart}
              onChange={(e) => setSweepStart(e.target.value)}
              required
            />
          </div>
          <div className="field-group">
            <label htmlFor="sweep-end">
              Fim <span className="field-unit">(m)</span>
            </label>
            <input
              id="sweep-end"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ex: 8"
              value={sweepEnd}
              onChange={(e) => setSweepEnd(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="field-group">
          <label htmlFor="sweep-step">
            Incremento <span className="field-unit">(m)</span>
          </label>
          <input
            id="sweep-step"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Ex: 1"
            value={sweepStep}
            onChange={(e) => setSweepStep(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Section Properties */}
      <div className="input-section">
        <h3 className="input-section__title">Propriedades da Seção</h3>
        <div className="field-group">
          <label htmlFor="param-I">
            I{' '}
            <select
              className="unit-selector"
              value={inertiaUnit}
              onChange={(e) => setInertiaUnit(e.target.value)}
              aria-label="Unidade do momento de inércia"
            >
              {Object.entries(INERTIA_UNIT_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </label>
          <input
            id="param-I"
            type="number"
            min="0.01"
            step="0.01"
            placeholder={inertiaUnit === INERTIA_UNITS.MM4 ? 'Ex: 314000000' : 'Ex: 8500'}
            value={IValue}
            onChange={(e) => setIValue(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Materials */}
      <div className="input-section">
        <h3 className="input-section__title">Materiais</h3>
        <p className="section-hint">Selecione os materiais para comparação.</p>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={useAluminum}
            onChange={(e) => setUseAluminum(e.target.checked)}
          />
          <span className="material-swatch" style={{ background: MATERIAL_PRESETS.ALUMINUM.color }} />
          Alumínio (E = 69 GPa)
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={useSteel}
            onChange={(e) => setUseSteel(e.target.checked)}
          />
          <span className="material-swatch" style={{ background: MATERIAL_PRESETS.STEEL.color }} />
          Aço (E = 200 GPa)
        </label>

        <div className="custom-material">
          <label className="checkbox-label" style={{ marginBottom: 'var(--space-xs)' }}>
            <span className="material-swatch" style={{ background: '#10b981' }} />
            Material personalizado
          </label>
          <div className="field-row">
            <div className="field-group">
              <input
                type="text"
                placeholder="Nome"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>
            <div className="field-group">
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="E (GPa)"
                value={customE}
                onChange={(e) => setCustomE(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Errors */}
      {errors && errors.length > 0 && (
        <ul className="error-list" role="alert">
          {errors.map((err, idx) => (
            <li key={idx}>{err}</li>
          ))}
        </ul>
      )}

      {/* Run Button */}
      <div className="calculate-area">
        <button type="submit" className="btn btn-primary btn-block" id="run-parametric-btn">
          Executar Análise
        </button>
      </div>
    </form>
  )
}

export default ParametricPanel
