import { BEAM_TYPES } from '../../utils/constants.js'
import './ResultsTable.css'

/**
 * ResultsTable — Displays a summary of numerical results.
 *
 * @param {object} props
 * @param {object} props.results - Calculation results from generateDiagramData
 */
function ResultsTable({ results }) {
  const { summary, hasDeflection, config } = results

  return (
    <div className="results-table" id="results-table">
      <h3 className="results-table__title">Resultados</h3>
      <table>
        <thead>
          <tr>
            <th>Grandeza</th>
            <th>Valor</th>
            <th>Posição</th>
          </tr>
        </thead>
        <tbody>
          {/* Reactions section */}
          <tr>
            <td colSpan="3" className="results-table__section">
              Reações de Apoio
            </td>
          </tr>

          {summary.reactions.map((r, idx) => (
            <tr key={`reaction-${idx}`}>
              <td>
                R<sub>{String.fromCharCode(65 + idx)}</sub>
              </td>
              <td>
                <span className="results-table__value">{r.force.toFixed(4)}</span>
                <span className="results-table__unit">kN</span>
              </td>
              <td>
                x = {r.position.toFixed(2)} m
              </td>
            </tr>
          ))}

          {/* Reaction moments (cantilever) */}
          {config.type === BEAM_TYPES.CANTILEVER &&
            summary.reactionMoments.map((rm, idx) => (
              <tr key={`rm-${idx}`}>
                <td>
                  M<sub>engaste</sub>
                </td>
                <td>
                  <span className="results-table__value">{rm.moment.toFixed(4)}</span>
                  <span className="results-table__unit">kN·m</span>
                </td>
                <td>
                  x = {rm.position.toFixed(2)} m
                </td>
              </tr>
            ))}

          {/* Moment section */}
          <tr>
            <td colSpan="3" className="results-table__section">
              Momento Fletor
            </td>
          </tr>
          <tr>
            <td>M<sub>máx</sub></td>
            <td>
              <span className="results-table__value">{summary.maxMoment.value.toFixed(4)}</span>
              <span className="results-table__unit">kN·m</span>
            </td>
            <td>x = {summary.maxMoment.position.toFixed(2)} m</td>
          </tr>
          {summary.minMoment.value < -0.001 && (
            <tr>
              <td>M<sub>mín</sub></td>
              <td>
                <span className="results-table__value">{summary.minMoment.value.toFixed(4)}</span>
                <span className="results-table__unit">kN·m</span>
              </td>
              <td>x = {summary.minMoment.position.toFixed(2)} m</td>
            </tr>
          )}

          {/* Deflection section */}
          {hasDeflection && (
            <>
              <tr>
                <td colSpan="3" className="results-table__section">
                  Flecha Elástica
                </td>
              </tr>
              {summary.maxDeflection && (
                <tr>
                  <td>δ<sub>máx</sub></td>
                  <td>
                    <span className="results-table__value">
                      {summary.maxDeflection.value.toFixed(4)}
                    </span>
                    <span className="results-table__unit">mm</span>
                  </td>
                  <td>x = {summary.maxDeflection.position.toFixed(2)} m</td>
                </tr>
              )}
              {summary.minDeflection &&
                Math.abs(summary.minDeflection.value) > 0.001 &&
                summary.minDeflection.value !== summary.maxDeflection?.value && (
                  <tr>
                    <td>δ<sub>mín</sub></td>
                    <td>
                      <span className="results-table__value">
                        {summary.minDeflection.value.toFixed(4)}
                      </span>
                      <span className="results-table__unit">mm</span>
                    </td>
                    <td>x = {summary.minDeflection.position.toFixed(2)} m</td>
                  </tr>
                )}
            </>
          )}

          {/* Stress section */}
          {summary.maxStress !== null && (
            <>
              <tr>
                <td colSpan="3" className="results-table__section">
                  Verificação de Tensão
                </td>
              </tr>
              <tr>
                <td>σ<sub>máx</sub></td>
                <td>
                  <span className="results-table__value results-table__stress">
                    {summary.maxStress.toFixed(2)}
                  </span>
                  <span className="results-table__unit">MPa</span>
                </td>
                <td>σ = M<sub>máx</sub> / W</td>
              </tr>
            </>
          )}
        </tbody>
      </table>

      {!hasDeflection && (
        <p className="results-table__note">
          💡 Informe E e I para calcular a flecha elástica.
        </p>
      )}
      {summary.maxStress === null && (
        <p className="results-table__note">
          💡 Informe W (módulo de resistência) para verificação de tensão.
        </p>
      )}
    </div>
  )
}

export default ResultsTable
