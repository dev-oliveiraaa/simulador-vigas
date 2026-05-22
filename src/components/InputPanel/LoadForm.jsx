import { useState } from 'react'
import { LOAD_TYPES, LOAD_TYPE_LABELS } from '../../utils/constants.js'

/**
 * LoadForm — Form for adding a new load to the beam.
 * Dynamically shows different fields based on the selected load type.
 *
 * @param {object} props
 * @param {Function} props.onAddLoad - Callback with load object
 */
function LoadForm({ onAddLoad }) {
  const [loadType, setLoadType] = useState(LOAD_TYPES.POINT)
  const [position, setPosition] = useState('')
  const [value, setValue] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [q1, setQ1] = useState('')
  const [q2, setQ2] = useState('')

  const resetFields = () => {
    setPosition('')
    setValue('')
    setStart('')
    setEnd('')
    setQ1('')
    setQ2('')
  }

  const handleAdd = () => {
    let load = { type: loadType }

    switch (loadType) {
      case LOAD_TYPES.POINT:
        if (position === '' || value === '') return
        load = { ...load, position: Number(position), value: Number(value) }
        break

      case LOAD_TYPES.DISTRIBUTED_UNIFORM:
        if (start === '' || end === '' || value === '') return
        load = { ...load, start: Number(start), end: Number(end), value: Number(value) }
        break

      case LOAD_TYPES.DISTRIBUTED_TRAPEZOIDAL:
        if (start === '' || end === '' || q1 === '' || q2 === '') return
        load = {
          ...load,
          start: Number(start),
          end: Number(end),
          q1: Number(q1),
          q2: Number(q2),
        }
        break

      case LOAD_TYPES.MOMENT:
        if (position === '' || value === '') return
        load = { ...load, position: Number(position), value: Number(value) }
        break
    }

    onAddLoad(load)
    resetFields()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="field-group" onKeyDown={handleKeyDown}>
      <label htmlFor="load-type">Tipo de carga</label>
      <select
        id="load-type"
        value={loadType}
        onChange={(e) => {
          setLoadType(e.target.value)
          resetFields()
        }}
      >
        {Object.entries(LOAD_TYPE_LABELS).map(([val, label]) => (
          <option key={val} value={val}>
            {label}
          </option>
        ))}
      </select>

      {/* Point Load fields */}
      {loadType === LOAD_TYPES.POINT && (
        <div className="field-row">
          <div className="field-group">
            <label htmlFor="load-position">
              Posição <span className="field-unit">(m)</span>
            </label>
            <input
              id="load-position"
              type="number"
              step="0.01"
              placeholder="a"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>
          <div className="field-group">
            <label htmlFor="load-value">
              P <span className="field-unit">(kN)</span>
            </label>
            <input
              id="load-value"
              type="number"
              step="0.01"
              placeholder="Valor"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Uniform Distributed Load fields */}
      {loadType === LOAD_TYPES.DISTRIBUTED_UNIFORM && (
        <>
          <div className="field-row">
            <div className="field-group">
              <label htmlFor="load-start">
                Início <span className="field-unit">(m)</span>
              </label>
              <input
                id="load-start"
                type="number"
                step="0.01"
                placeholder="x₁"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="field-group">
              <label htmlFor="load-end">
                Fim <span className="field-unit">(m)</span>
              </label>
              <input
                id="load-end"
                type="number"
                step="0.01"
                placeholder="x₂"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="field-group">
            <label htmlFor="load-q">
              q <span className="field-unit">(kN/m)</span>
            </label>
            <input
              id="load-q"
              type="number"
              step="0.01"
              placeholder="Valor"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        </>
      )}

      {/* Trapezoidal Distributed Load fields */}
      {loadType === LOAD_TYPES.DISTRIBUTED_TRAPEZOIDAL && (
        <>
          <div className="field-row">
            <div className="field-group">
              <label htmlFor="load-trap-start">
                Início <span className="field-unit">(m)</span>
              </label>
              <input
                id="load-trap-start"
                type="number"
                step="0.01"
                placeholder="x₁"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="field-group">
              <label htmlFor="load-trap-end">
                Fim <span className="field-unit">(m)</span>
              </label>
              <input
                id="load-trap-end"
                type="number"
                step="0.01"
                placeholder="x₂"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="field-row">
            <div className="field-group">
              <label htmlFor="load-q1">
                q₁ <span className="field-unit">(kN/m)</span>
              </label>
              <input
                id="load-q1"
                type="number"
                step="0.01"
                placeholder="Início"
                value={q1}
                onChange={(e) => setQ1(e.target.value)}
              />
            </div>
            <div className="field-group">
              <label htmlFor="load-q2">
                q₂ <span className="field-unit">(kN/m)</span>
              </label>
              <input
                id="load-q2"
                type="number"
                step="0.01"
                placeholder="Fim"
                value={q2}
                onChange={(e) => setQ2(e.target.value)}
              />
            </div>
          </div>
        </>
      )}

      {/* Concentrated Moment fields */}
      {loadType === LOAD_TYPES.MOMENT && (
        <div className="field-row">
          <div className="field-group">
            <label htmlFor="load-moment-position">
              Posição <span className="field-unit">(m)</span>
            </label>
            <input
              id="load-moment-position"
              type="number"
              step="0.01"
              placeholder="a"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>
          <div className="field-group">
            <label htmlFor="load-moment-value">
              M₀ <span className="field-unit">(kN·m)</span>
            </label>
            <input
              id="load-moment-value"
              type="number"
              step="0.01"
              placeholder="Valor"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={handleAdd}
        id="add-load-btn"
      >
        + Adicionar carga
      </button>
    </div>
  )
}

export default LoadForm
