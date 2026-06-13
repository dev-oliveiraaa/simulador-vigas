/**
 * ParametricResults — Table showing computed values for each sweep point.
 *
 * @param {object} props
 * @param {import('../../engine/parametricSweep.js').MaterialSeries[]} props.series
 * @param {string} props.xLabel
 * @param {string} props.xUnit
 * @param {string} props.yLabel
 * @param {string} props.yUnit
 */
function ParametricResults({ series, xLabel, xUnit, yLabel, yUnit }) {
  if (!series || series.length === 0) return null

  // Use the first series to get param values (all series have the same params)
  const paramValues = series[0].data.map((d) => d.param)

  return (
    <div className="parametric-results" id="parametric-results">
      <h3 className="parametric-results__title">Tabela de Resultados</h3>
      <table>
        <thead>
          <tr>
            <th>{xLabel} ({xUnit})</th>
            {series.map((s) => (
              <th key={s.name}>
                {yLabel} — {s.name} ({yUnit})
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paramValues.map((param, rowIdx) => (
            <tr key={rowIdx}>
              <td className="value-cell">{param.toFixed(2)}</td>
              {series.map((s) => (
                <td key={s.name} className="value-cell" style={{ color: s.color }}>
                  {formatResultValue(s.data[rowIdx]?.value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Format a result value with appropriate precision.
 */
function formatResultValue(value) {
  if (value === undefined || value === null) return '—'
  if (Math.abs(value) < 1e-10) return '0.0000'
  if (Math.abs(value) >= 1000) return value.toFixed(2)
  if (Math.abs(value) >= 1) return value.toFixed(4)
  return value.toExponential(4)
}

export default ParametricResults
