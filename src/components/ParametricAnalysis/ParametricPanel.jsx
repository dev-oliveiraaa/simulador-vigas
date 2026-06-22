import { useState } from 'react'
import {
  BEAM_TYPES,
  BEAM_TYPE_LABELS,
  ANALYSIS_TYPES,
  ANALYSIS_TYPE_LABELS,
  SWEEP_VARIABLES,
  MATERIAL_PRESETS,
  INERTIA_UNITS,
  INERTIA_UNIT_LABELS,
  LOAD_TYPES,
  LOAD_TYPE_LABELS,
} from '../../utils/constants.js'
import { mm4ToCm4 } from '../../utils/unitConversion.js'
import './ParametricPanel.css'

/**
 * ParametricPanel — Sidebar for configuring parametric sweep analysis.
 *
 * Supports two modes:
 * 1. Standard parametric sweep (max deflection, strain energy, Castigliano)
 * 2. Deflection & Slope vs x — new analysis with full beam configuration
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

  // --- New state for "Deflexão e Inclinação vs x" ---
  const [dsBeamType, setDsBeamType] = useState(BEAM_TYPES.SIMPLY_SUPPORTED)
  const [dsLength, setDsLength] = useState('')
  const [dsSupports, setDsSupports] = useState(['0', ''])
  const [dsLoads, setDsLoads] = useState([])
  const [dsIValue, setDsIValue] = useState('')
  const [dsInertiaUnit, setDsInertiaUnit] = useState(INERTIA_UNITS.CM4)
  const [dsXStart, setDsXStart] = useState('')
  const [dsXEnd, setDsXEnd] = useState('')
  const [dsXStep, setDsXStep] = useState('1')

  // Load form state for deflection-slope mode
  const [newLoadType, setNewLoadType] = useState(LOAD_TYPES.POINT)
  const [newLoadValue, setNewLoadValue] = useState('')
  const [newLoadPosition, setNewLoadPosition] = useState('')
  const [newLoadStart, setNewLoadStart] = useState('')
  const [newLoadEnd, setNewLoadEnd] = useState('')
  const [newLoadQ1, setNewLoadQ1] = useState('')
  const [newLoadQ2, setNewLoadQ2] = useState('')

  const isDeflectionSlope = analysisType === ANALYSIS_TYPES.DEFLECTION_SLOPE_VS_X

  const sweepVariable =
    analysisType === ANALYSIS_TYPES.CASTIGLIANO_DISPLACEMENT
      ? SWEEP_VARIABLES.SUPPORT_POSITION
      : SWEEP_VARIABLES.LENGTH

  const showDsSupportsInput =
    dsBeamType === BEAM_TYPES.OVERHANGING ||
    dsBeamType === BEAM_TYPES.CONTINUOUS ||
    dsBeamType === BEAM_TYPES.PROPPED_CANTILEVER

  // --- Load management for deflection-slope ---
  const handleAddLoad = () => {
    const load = { id: Date.now(), type: newLoadType }

    switch (newLoadType) {
      case LOAD_TYPES.POINT:
        load.value = Number(newLoadValue)
        load.position = Number(newLoadPosition)
        break
      case LOAD_TYPES.DISTRIBUTED_UNIFORM:
        load.value = Number(newLoadValue)
        load.start = Number(newLoadStart)
        load.end = Number(newLoadEnd)
        break
      case LOAD_TYPES.DISTRIBUTED_TRAPEZOIDAL:
        load.q1 = Number(newLoadQ1)
        load.q2 = Number(newLoadQ2)
        load.start = Number(newLoadStart)
        load.end = Number(newLoadEnd)
        break
      case LOAD_TYPES.MOMENT:
        load.value = Number(newLoadValue)
        load.position = Number(newLoadPosition)
        break
    }

    setDsLoads(prev => [...prev, load])
    // Reset form
    setNewLoadValue('')
    setNewLoadPosition('')
    setNewLoadStart('')
    setNewLoadEnd('')
    setNewLoadQ1('')
    setNewLoadQ2('')
  }

  const handleRemoveLoad = (id) => {
    setDsLoads(prev => prev.filter(l => l.id !== id))
  }

  const handleAddSupport = () => {
    setDsSupports(prev => [...prev, ''])
  }

  const handleRemoveSupport = (index) => {
    setDsSupports(prev => prev.filter((_, i) => i !== index))
  }

  const handleSupportChange = (index, value) => {
    setDsSupports(prev => prev.map((s, i) => (i === index ? value : s)))
  }

  // --- Submit ---
  const handleSubmit = (e) => {
    e.preventDefault()

    // Build materials
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

    if (materials.length === 0) return

    if (isDeflectionSlope) {
      // Build supports
      let supportPositions
      switch (dsBeamType) {
        case BEAM_TYPES.SIMPLY_SUPPORTED:
          supportPositions = [0, Number(dsLength)]
          break
        case BEAM_TYPES.CANTILEVER:
          supportPositions = [0]
          break
        case BEAM_TYPES.OVERHANGING:
        case BEAM_TYPES.PROPPED_CANTILEVER:
        case BEAM_TYPES.CONTINUOUS:
          supportPositions = dsSupports
            .map(s => Number(s))
            .filter(s => !isNaN(s))
          break
        default:
          supportPositions = [0, Number(dsLength)]
      }

      const Icm4 = dsIValue !== ''
        ? (dsInertiaUnit === INERTIA_UNITS.MM4 ? mm4ToCm4(Number(dsIValue)) : Number(dsIValue))
        : null

      onRunAnalysis({
        analysisType,
        beamType: dsBeamType,
        totalLength: Number(dsLength),
        supports: supportPositions,
        loads: dsLoads,
        I: Icm4,
        sweepStart: Number(dsXStart),
        sweepEnd: Number(dsXEnd),
        sweepStep: Number(dsXStep),
        materials,
      })
    } else {
      // Standard parametric sweep
      const Icm4 = IValue !== ''
        ? (inertiaUnit === INERTIA_UNITS.MM4 ? mm4ToCm4(Number(IValue)) : Number(IValue))
        : null

      let loadPositionRatio = 0.5
      if (loadPosMode === 'custom' && loadPosCustom !== '') {
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

        {!isDeflectionSlope && analysisType !== ANALYSIS_TYPES.CASTIGLIANO_DISPLACEMENT && (
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

      {/* ===============================================
          Deflexão e Inclinação vs x — Full beam config
          =============================================== */}
      {isDeflectionSlope ? (
        <>
          {/* Beam Type */}
          <div className="input-section">
            <h3 className="input-section__title">Configuração da Viga</h3>
            <div className="field-group">
              <label htmlFor="ds-beam-type">Tipo de viga</label>
              <select
                id="ds-beam-type"
                value={dsBeamType}
                onChange={(e) => setDsBeamType(e.target.value)}
              >
                {Object.entries(BEAM_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label htmlFor="ds-length">
                Comprimento total <span className="field-unit">(m)</span>
              </label>
              <input
                id="ds-length"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Ex: 12"
                value={dsLength}
                onChange={(e) => setDsLength(e.target.value)}
                required
              />
            </div>

            {/* Support positions */}
            {showDsSupportsInput && (
              <div className="field-group">
                <label>
                  Posição dos apoios <span className="field-unit">(m)</span>
                </label>
                <div className="support-inputs">
                  {dsSupports.map((s, idx) => (
                    <div className="support-row" key={idx}>
                      <label htmlFor={`ds-support-${idx}`}>
                        {dsBeamType === BEAM_TYPES.PROPPED_CANTILEVER
                          ? (idx === 0 ? 'Apoio simples' : 'Engaste')
                          : `Apoio ${idx + 1}`
                        }
                      </label>
                      <input
                        id={`ds-support-${idx}`}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Posição"
                        value={s}
                        onChange={(e) => handleSupportChange(idx, e.target.value)}
                      />
                      {dsSupports.length > 2 && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveSupport(idx)}
                          aria-label={`Remover apoio ${idx + 1}`}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {dsBeamType === BEAM_TYPES.CONTINUOUS && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleAddSupport}
                    >
                      + Apoio
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Loads */}
          <div className="input-section">
            <h3 className="input-section__title">Carregamentos</h3>

            {/* Load form */}
            <div className="ds-load-form">
              <div className="field-group">
                <label htmlFor="ds-load-type">Tipo de carga</label>
                <select
                  id="ds-load-type"
                  value={newLoadType}
                  onChange={(e) => setNewLoadType(e.target.value)}
                >
                  {Object.entries(LOAD_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Point load fields */}
              {(newLoadType === LOAD_TYPES.POINT || newLoadType === LOAD_TYPES.MOMENT) && (
                <>
                  <div className="field-row">
                    <div className="field-group">
                      <label htmlFor="ds-load-position">
                        Posição <span className="field-unit">(m)</span>
                      </label>
                      <input
                        id="ds-load-position"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ex: 4"
                        value={newLoadPosition}
                        onChange={(e) => setNewLoadPosition(e.target.value)}
                      />
                    </div>
                    <div className="field-group">
                      <label htmlFor="ds-load-value">
                        {newLoadType === LOAD_TYPES.MOMENT ? 'M' : 'P'}{' '}
                        <span className="field-unit">
                          ({newLoadType === LOAD_TYPES.MOMENT ? 'kN·m' : 'kN'})
                        </span>
                      </label>
                      <input
                        id="ds-load-value"
                        type="number"
                        step="0.01"
                        placeholder="Ex: 45"
                        value={newLoadValue}
                        onChange={(e) => setNewLoadValue(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Uniform distributed load */}
              {newLoadType === LOAD_TYPES.DISTRIBUTED_UNIFORM && (
                <>
                  <div className="field-row">
                    <div className="field-group">
                      <label htmlFor="ds-load-start">
                        x inicial <span className="field-unit">(m)</span>
                      </label>
                      <input
                        id="ds-load-start"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ex: 0"
                        value={newLoadStart}
                        onChange={(e) => setNewLoadStart(e.target.value)}
                      />
                    </div>
                    <div className="field-group">
                      <label htmlFor="ds-load-end">
                        x final <span className="field-unit">(m)</span>
                      </label>
                      <input
                        id="ds-load-end"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ex: 12"
                        value={newLoadEnd}
                        onChange={(e) => setNewLoadEnd(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="field-group">
                    <label htmlFor="ds-load-q">
                      q <span className="field-unit">(kN/m)</span>
                    </label>
                    <input
                      id="ds-load-q"
                      type="number"
                      step="0.01"
                      placeholder="Ex: 35"
                      value={newLoadValue}
                      onChange={(e) => setNewLoadValue(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Trapezoidal distributed load */}
              {newLoadType === LOAD_TYPES.DISTRIBUTED_TRAPEZOIDAL && (
                <>
                  <div className="field-row">
                    <div className="field-group">
                      <label htmlFor="ds-load-start-trap">
                        x inicial <span className="field-unit">(m)</span>
                      </label>
                      <input
                        id="ds-load-start-trap"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ex: 0"
                        value={newLoadStart}
                        onChange={(e) => setNewLoadStart(e.target.value)}
                      />
                    </div>
                    <div className="field-group">
                      <label htmlFor="ds-load-end-trap">
                        x final <span className="field-unit">(m)</span>
                      </label>
                      <input
                        id="ds-load-end-trap"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ex: 6"
                        value={newLoadEnd}
                        onChange={(e) => setNewLoadEnd(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="field-row">
                    <div className="field-group">
                      <label htmlFor="ds-load-q1">
                        q₁ <span className="field-unit">(kN/m)</span>
                      </label>
                      <input
                        id="ds-load-q1"
                        type="number"
                        step="0.01"
                        placeholder="Ex: 0"
                        value={newLoadQ1}
                        onChange={(e) => setNewLoadQ1(e.target.value)}
                      />
                    </div>
                    <div className="field-group">
                      <label htmlFor="ds-load-q2">
                        q₂ <span className="field-unit">(kN/m)</span>
                      </label>
                      <input
                        id="ds-load-q2"
                        type="number"
                        step="0.01"
                        placeholder="Ex: 25"
                        value={newLoadQ2}
                        onChange={(e) => setNewLoadQ2(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="button"
                className="btn btn-secondary btn-block btn-sm"
                onClick={handleAddLoad}
              >
                + Adicionar Carga
              </button>
            </div>

            {/* Load list */}
            {dsLoads.length > 0 && (
              <div className="ds-load-list">
                {dsLoads.map((load) => (
                  <div key={load.id} className="ds-load-item">
                    <span className="ds-load-item__desc">
                      {describeLoad(load)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveLoad(load.id)}
                      aria-label="Remover carga"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section Properties */}
          <div className="input-section">
            <h3 className="input-section__title">Propriedades da Seção</h3>
            <div className="field-group">
              <label htmlFor="ds-I">
                I{' '}
                <select
                  className="unit-selector"
                  value={dsInertiaUnit}
                  onChange={(e) => setDsInertiaUnit(e.target.value)}
                  aria-label="Unidade do momento de inércia"
                >
                  {Object.entries(INERTIA_UNIT_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </label>
              <input
                id="ds-I"
                type="number"
                min="0.01"
                step="0.01"
                placeholder={dsInertiaUnit === INERTIA_UNITS.MM4 ? 'Ex: 314000000' : 'Ex: 31400'}
                value={dsIValue}
                onChange={(e) => setDsIValue(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Analysis Interval */}
          <div className="input-section">
            <h3 className="input-section__title">Intervalo de x para Análise</h3>
            <p className="section-hint">
              Defina o trecho da viga a ser analisado. Pode ser menor que o comprimento total.
            </p>
            <div className="field-row">
              <div className="field-group">
                <label htmlFor="ds-x-start">
                  x inicial <span className="field-unit">(m)</span>
                </label>
                <input
                  id="ds-x-start"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 0"
                  value={dsXStart}
                  onChange={(e) => setDsXStart(e.target.value)}
                  required
                />
              </div>
              <div className="field-group">
                <label htmlFor="ds-x-end">
                  x final <span className="field-unit">(m)</span>
                </label>
                <input
                  id="ds-x-end"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 8"
                  value={dsXEnd}
                  onChange={(e) => setDsXEnd(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="field-group">
              <label htmlFor="ds-x-step">
                Incremento <span className="field-unit">(m)</span>
              </label>
              <input
                id="ds-x-step"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Ex: 1"
                value={dsXStep}
                onChange={(e) => setDsXStep(e.target.value)}
                required
              />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Standard parametric sweep fields */}
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
        </>
      )}

      {/* Materials — shared */}
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

/**
 * Describe a load for the load list display.
 */
function describeLoad(load) {
  switch (load.type) {
    case LOAD_TYPES.POINT:
      return `Pontual: P = ${load.value} kN em x = ${load.position} m`
    case LOAD_TYPES.DISTRIBUTED_UNIFORM:
      return `Distribuída: q = ${load.value} kN/m de x = ${load.start} a ${load.end} m`
    case LOAD_TYPES.DISTRIBUTED_TRAPEZOIDAL:
      return `Trapezoidal: q₁ = ${load.q1}, q₂ = ${load.q2} kN/m de x = ${load.start} a ${load.end} m`
    case LOAD_TYPES.MOMENT:
      return `Momento: M = ${load.value} kN·m em x = ${load.position} m`
    default:
      return 'Carga'
  }
}

export default ParametricPanel
