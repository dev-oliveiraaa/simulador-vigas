import { LOAD_TYPE_LABELS } from '../../utils/constants.js'

/**
 * LoadList — Displays the list of added loads with remove buttons.
 *
 * @param {object} props
 * @param {object[]} props.loads - Array of load objects
 * @param {Function} props.onRemoveLoad - Callback with load id
 */
function LoadList({ loads, onRemoveLoad }) {
  if (loads.length === 0) {
    return (
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
        Nenhuma carga adicionada.
      </p>
    )
  }

  /**
   * Format a load for display.
   * @param {object} load
   * @returns {string}
   */
  const formatLoad = (load) => {
    switch (load.type) {
      case 'point':
        return `P = ${load.value} kN em x = ${load.position} m`
      case 'distributed_uniform':
        return `q = ${load.value} kN/m de ${load.start} a ${load.end} m`
      case 'distributed_trapezoidal':
        return `q₁ = ${load.q1}, q₂ = ${load.q2} kN/m de ${load.start} a ${load.end} m`
      case 'moment':
        return `M₀ = ${load.value} kN·m em x = ${load.position} m`
      default:
        return ''
    }
  }

  return (
    <ul className="load-list" id="load-list">
      {loads.map((load) => (
        <li key={load.id} className="load-list__item">
          <div className="load-list__info">
            <span className="load-list__type">{LOAD_TYPE_LABELS[load.type]}</span>
            <span className="load-list__detail">{formatLoad(load)}</span>
          </div>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => onRemoveLoad(load.id)}
            aria-label={`Remover ${LOAD_TYPE_LABELS[load.type]}`}
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  )
}

export default LoadList
