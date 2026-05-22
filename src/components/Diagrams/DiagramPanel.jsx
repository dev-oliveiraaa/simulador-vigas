import DiagramSVG from './DiagramSVG.jsx'
import { DIAGRAM_COLORS } from '../../utils/constants.js'
import './Diagrams.css'

/**
 * DiagramPanel — Container that renders V(x), M(x), and δ(x) diagrams.
 *
 * @param {object} props
 * @param {object} props.results - Calculation results from generateDiagramData
 */
function DiagramPanel({ results }) {
  const { vData, mData, dData, hasDeflection, extremes, config } = results
  const beamLength = config.length

  return (
    <div className="diagrams" id="diagram-panel">
      {/* Shear Force V(x) */}
      <DiagramSVG
        data={vData}
        strokeColor={DIAGRAM_COLORS.shear.stroke}
        fillColor={DIAGRAM_COLORS.shear.fill}
        label={DIAGRAM_COLORS.shear.label + ' — V(x)'}
        unit={DIAGRAM_COLORS.shear.unit}
        beamLength={beamLength}
        extremes={extremes.shear}
      />

      {/* Bending Moment M(x) */}
      <DiagramSVG
        data={mData}
        strokeColor={DIAGRAM_COLORS.moment.stroke}
        fillColor={DIAGRAM_COLORS.moment.fill}
        label={DIAGRAM_COLORS.moment.label + ' — M(x)'}
        unit={DIAGRAM_COLORS.moment.unit}
        beamLength={beamLength}
        extremes={extremes.moment}
      />

      {/* Deflection δ(x) */}
      {hasDeflection ? (
        <DiagramSVG
          data={dData}
          strokeColor={DIAGRAM_COLORS.deflection.stroke}
          fillColor={DIAGRAM_COLORS.deflection.fill}
          label={DIAGRAM_COLORS.deflection.label + ' — δ(x)'}
          unit={DIAGRAM_COLORS.deflection.unit}
          beamLength={beamLength}
          extremes={extremes.deflection}
        />
      ) : (
        <div className="diagram-info" id="deflection-info">
          Para visualizar o diagrama de flecha elástica δ(x), informe o módulo de
          elasticidade E e o momento de inércia I no painel de configuração.
        </div>
      )}
    </div>
  )
}

export default DiagramPanel
