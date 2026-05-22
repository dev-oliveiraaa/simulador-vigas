import { useState } from 'react'
import { BEAM_TYPES, BEAM_TYPE_LABELS } from '../../utils/constants.js'
import LoadForm from './LoadForm.jsx'
import LoadList from './LoadList.jsx'
import './InputPanel.css'

/**
 * InputPanel — Sidebar configuration panel for beam setup.
 *
 * @param {object} props
 * @param {Function} props.onCalculate - Callback with { type, length, supports, E, I, W, loads }
 * @param {string[]} props.errors - Validation error messages
 */
function InputPanel({ onCalculate, errors }) {
  const [beamType, setBeamType] = useState(BEAM_TYPES.SIMPLY_SUPPORTED)
  const [length, setLength] = useState('')
  const [supports, setSupports] = useState([''])
  const [E, setE] = useState('')
  const [I, setI] = useState('')
  const [W, setW] = useState('')
  const [loads, setLoads] = useState([])

  const handleAddLoad = (load) => {
    setLoads(prev => [...prev, { ...load, id: Date.now() }])
  }

  const handleRemoveLoad = (id) => {
    setLoads(prev => prev.filter(l => l.id !== id))
  }

  const handleAddSupport = () => {
    setSupports(prev => [...prev, ''])
  }

  const handleRemoveSupport = (index) => {
    setSupports(prev => prev.filter((_, i) => i !== index))
  }

  const handleSupportChange = (index, value) => {
    setSupports(prev => prev.map((s, i) => (i === index ? value : s)))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Build supports array based on beam type
    let supportPositions
    switch (beamType) {
      case BEAM_TYPES.SIMPLY_SUPPORTED:
        supportPositions = [0, Number(length)]
        break
      case BEAM_TYPES.CANTILEVER:
        supportPositions = [0]
        break
      case BEAM_TYPES.OVERHANGING:
      case BEAM_TYPES.CONTINUOUS: {
        supportPositions = supports
          .map(s => Number(s))
          .filter(s => !isNaN(s))
        break
      }
      default:
        supportPositions = [0, Number(length)]
    }

    onCalculate({
      type: beamType,
      length: Number(length),
      supports: supportPositions,
      E: E !== '' ? Number(E) : null,
      I: I !== '' ? Number(I) : null,
      W: W !== '' ? Number(W) : null,
      loads,
    })
  }

  const showSupportsInput =
    beamType === BEAM_TYPES.OVERHANGING || beamType === BEAM_TYPES.CONTINUOUS

  return (
    <form className="input-panel" onSubmit={handleSubmit} id="beam-config-form">
      {/* Beam Type */}
      <div className="input-section">
        <h3 className="input-section__title">Tipo de Viga</h3>
        <div className="field-group">
          <label htmlFor="beam-type">Configuração de apoios</label>
          <select
            id="beam-type"
            value={beamType}
            onChange={(e) => setBeamType(e.target.value)}
          >
            {Object.entries(BEAM_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Geometry */}
      <div className="input-section">
        <h3 className="input-section__title">Geometria</h3>
        <div className="field-group">
          <label htmlFor="beam-length">
            Comprimento L <span className="field-unit">(m)</span>
          </label>
          <input
            id="beam-length"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Ex: 6"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            required
          />
        </div>

        {showSupportsInput && (
          <div className="field-group">
            <label>
              Posição dos apoios <span className="field-unit">(m)</span>
            </label>
            <div className="support-inputs">
              {supports.map((s, idx) => (
                <div className="support-row" key={idx}>
                  <label htmlFor={`support-${idx}`}>Apoio {idx + 1}</label>
                  <input
                    id={`support-${idx}`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Posição"
                    value={s}
                    onChange={(e) => handleSupportChange(idx, e.target.value)}
                  />
                  {supports.length > 1 && (
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
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddSupport}
              >
                + Apoio
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loads */}
      <div className="input-section">
        <h3 className="input-section__title">Carregamentos</h3>
        <LoadForm onAddLoad={handleAddLoad} />
        <LoadList loads={loads} onRemoveLoad={handleRemoveLoad} />
      </div>

      {/* Section Properties */}
      <div className="input-section">
        <h3 className="input-section__title">Propriedades da Seção</h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-sm)' }}>
          Opcional — necessário para cálculo de flecha e tensão.
        </p>
        <div className="field-row">
          <div className="field-group">
            <label htmlFor="section-E">
              E <span className="field-unit">(GPa)</span>
            </label>
            <input
              id="section-E"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Ex: 200"
              value={E}
              onChange={(e) => setE(e.target.value)}
            />
          </div>
          <div className="field-group">
            <label htmlFor="section-I">
              I <span className="field-unit">(cm⁴)</span>
            </label>
            <input
              id="section-I"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Ex: 8500"
              value={I}
              onChange={(e) => setI(e.target.value)}
            />
          </div>
        </div>
        <div className="field-group">
          <label htmlFor="section-W">
            W <span className="field-unit">(cm³)</span>
          </label>
          <input
            id="section-W"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Ex: 350"
            value={W}
            onChange={(e) => setW(e.target.value)}
          />
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

      {/* Calculate Button */}
      <div className="calculate-area">
        <button type="submit" className="btn btn-primary btn-block" id="calculate-btn">
          Calcular
        </button>
      </div>
    </form>
  )
}

export default InputPanel
