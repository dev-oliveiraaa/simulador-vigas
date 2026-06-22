/**
 * DeflectionSlopeTable — Results table for "Deflexão e Inclinação vs x" analysis.
 *
 * Shows x, y(x) and θ(x) for each material in Brazilian number format.
 * Table is designed to be copy-friendly for academic reports.
 */

import { formatBR } from '../../utils/unitConversion.js'

/**
 * @param {object} props
 * @param {object[]} props.tableRows - Array of row objects { x, y_Material, theta_Material }
 * @param {object[]} props.materials - Array of { name, E, color }
 * @param {object[]} props.reactions - Reaction forces
 * @param {object[]} props.reactionMoments - Reaction moments (for cantilevers)
 */
function DeflectionSlopeTable({ tableRows, materials, reactions, reactionMoments }) {
  if (!tableRows || tableRows.length === 0) return null

  return (
    <div className="parametric-results" id="deflection-slope-results">
      {/* Reactions summary */}
      <div className="reactions-summary">
        <h3 className="parametric-results__title">Reações de Apoio</h3>
        <div className="reactions-grid">
          {reactions.map((r, idx) => (
            <div key={idx} className="reaction-item">
              <span className="reaction-label">R em x = {formatBR(r.position, 1)} m</span>
              <span className="reaction-value">{formatBR(r.force, 3)} kN</span>
            </div>
          ))}
          {reactionMoments && reactionMoments.map((rm, idx) => (
            <div key={`m-${idx}`} className="reaction-item">
              <span className="reaction-label">M em x = {formatBR(rm.position, 1)} m</span>
              <span className="reaction-value">{formatBR(rm.moment, 3)} kN·m</span>
            </div>
          ))}
        </div>
      </div>

      {/* Results table */}
      <h3 className="parametric-results__title" style={{ marginTop: 'var(--space-lg)' }}>
        Tabela de Resultados
      </h3>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>x (m)</th>
              {materials.map((mat) => (
                <th key={`y-${mat.name}`} style={{ color: mat.color }}>
                  y {mat.name} (mm)
                </th>
              ))}
              {materials.map((mat) => (
                <th key={`theta-${mat.name}`} style={{ color: mat.color }}>
                  θ {mat.name} (rad)
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                <td className="value-cell">{formatBR(row.x, 2)}</td>
                {materials.map((mat) => (
                  <td
                    key={`y-${mat.name}`}
                    className="value-cell"
                    style={{ color: mat.color }}
                  >
                    {formatBR(row[`y_${mat.name}`], 4)}
                  </td>
                ))}
                {materials.map((mat) => (
                  <td
                    key={`theta-${mat.name}`}
                    className="value-cell"
                    style={{ color: mat.color }}
                  >
                    {formatBRScientific(row[`theta_${mat.name}`])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Format a very small number for Brazilian display.
 * For slope values that are typically very small (e.g. 0.001234),
 * shows with enough decimal places to be meaningful.
 */
function formatBRScientific(value) {
  if (value === undefined || value === null) return '—'
  if (!isFinite(value)) return '—'
  if (Math.abs(value) < 1e-12) return '0'

  // For very small values, use scientific-like notation
  if (Math.abs(value) < 0.0001) {
    const exp = Math.floor(Math.log10(Math.abs(value)))
    const mantissa = value / Math.pow(10, exp)
    return `${formatBR(mantissa, 4)} × 10^${exp}`
  }

  return formatBR(value, 6)
}

export default DeflectionSlopeTable
