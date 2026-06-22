/**
 * DiagramSVG — Generic SVG diagram renderer for V(x), M(x), or δ(x).
 *
 * Receives an array of data points and renders a polyline with filled area,
 * axis labels, grid lines, and annotated extremes.
 */
import { formatBR } from '../../utils/unitConversion.js'

const SVG_WIDTH = 800
const SVG_HEIGHT = 150
const PADDING = { top: 20, right: 40, bottom: 30, left: 50 }

/**
 * @param {object} props
 * @param {{ x: number, value: number }[]} props.data - Data points
 * @param {string} props.strokeColor - CSS color for the line
 * @param {string} props.fillColor - CSS color for the area fill
 * @param {string} props.label - Diagram title
 * @param {string} props.unit - Unit label for Y axis
 * @param {number} props.beamLength - Total beam length in meters
 * @param {{ max: { x: number, value: number }, min: { x: number, value: number } }} props.extremes
 */
function DiagramSVG({ data, strokeColor, fillColor, label, unit, beamLength, extremes }) {
  if (!data || data.length === 0) return null

  const drawWidth = SVG_WIDTH - PADDING.left - PADDING.right
  const drawHeight = SVG_HEIGHT - PADDING.top - PADDING.bottom

  // Find value range
  const values = data.map(d => d.value)
  let maxVal = Math.max(...values)
  let minVal = Math.min(...values)

  // Ensure we have some range (avoid division by zero)
  if (Math.abs(maxVal - minVal) < 1e-10) {
    maxVal = maxVal + 1
    minVal = minVal - 1
  }

  // Add 10% padding to value range
  const range = maxVal - minVal
  const paddedMax = maxVal + range * 0.1
  const paddedMin = minVal - range * 0.1

  /**
   * Map data coordinates to SVG coordinates.
   */
  const toSvgX = (x) => PADDING.left + (x / beamLength) * drawWidth
  const toSvgY = (v) => PADDING.top + (1 - (v - paddedMin) / (paddedMax - paddedMin)) * drawHeight

  // Zero line Y position
  const zeroY = toSvgY(0)

  // Build polyline points
  const linePoints = data.map(d => `${toSvgX(d.x)},${toSvgY(d.value)}`).join(' ')

  // Build fill polygon (close to zero line)
  const fillPoints = [
    `${toSvgX(data[0].x)},${zeroY}`,
    ...data.map(d => `${toSvgX(d.x)},${toSvgY(d.value)}`),
    `${toSvgX(data[data.length - 1].x)},${zeroY}`,
  ].join(' ')

  // X-axis tick marks
  const numTicks = Math.min(10, Math.max(4, Math.ceil(beamLength)))
  const xTicks = []
  for (let i = 0; i <= numTicks; i++) {
    const xVal = (i / numTicks) * beamLength
    xTicks.push(xVal)
  }

  // Y-axis tick marks (5 ticks)
  const yTicks = []
  for (let i = 0; i <= 4; i++) {
    const yVal = paddedMin + (i / 4) * (paddedMax - paddedMin)
    yTicks.push(yVal)
  }

  // Determine which extreme to annotate (the one with larger absolute value)
  const absMax = Math.abs(extremes.max.value)
  const absMin = Math.abs(extremes.min.value)
  const primaryExtreme = absMax >= absMin ? extremes.max : extremes.min
  const secondaryExtreme = absMax >= absMin ? extremes.min : extremes.max
  const showSecondary = absMin > 1e-4 && absMax > 1e-4 && absMax !== absMin

  return (
    <div className="diagram-panel">
      <div className="diagram-panel__header">
        <span className="diagram-panel__title">{label}</span>
        <span className="diagram-panel__unit">{unit}</span>
      </div>
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        aria-label={`Diagrama de ${label}`}
        role="img"
      >
        {/* Grid lines */}
        {yTicks.map((yVal, i) => (
          <line
            key={`grid-y-${i}`}
            x1={PADDING.left}
            y1={toSvgY(yVal)}
            x2={SVG_WIDTH - PADDING.right}
            y2={toSvgY(yVal)}
            stroke="#f3f4f6"
            strokeWidth="1"
          />
        ))}

        {/* Zero line */}
        <line
          x1={PADDING.left}
          y1={zeroY}
          x2={SVG_WIDTH - PADDING.right}
          y2={zeroY}
          stroke="#d1d5db"
          strokeWidth="1"
          strokeDasharray="4,3"
        />

        {/* Filled area */}
        <polygon
          points={fillPoints}
          fill={fillColor}
        />

        {/* Data line */}
        <polyline
          points={linePoints}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* X-axis ticks and labels */}
        {xTicks.map((xVal, i) => {
          const sx = toSvgX(xVal)
          return (
            <g key={`xtick-${i}`}>
              <line x1={sx} y1={SVG_HEIGHT - PADDING.bottom} x2={sx} y2={SVG_HEIGHT - PADDING.bottom + 4} stroke="#9ca3af" strokeWidth="1" />
              <text
                x={sx}
                y={SVG_HEIGHT - PADDING.bottom + 16}
                textAnchor="middle"
                className="diagram-axis-label"
              >
                {formatBR(xVal, 1)}
              </text>
            </g>
          )
        })}

        {/* X-axis unit label */}
        <text
          x={SVG_WIDTH - PADDING.right + 10}
          y={SVG_HEIGHT - PADDING.bottom + 16}
          textAnchor="start"
          className="diagram-axis-label"
        >
          m
        </text>

        {/* Y-axis ticks and labels */}
        {yTicks.map((yVal, i) => {
          const sy = toSvgY(yVal)
          return (
            <g key={`ytick-${i}`}>
              <line x1={PADDING.left - 4} y1={sy} x2={PADDING.left} y2={sy} stroke="#9ca3af" strokeWidth="1" />
              <text
                x={PADDING.left - 8}
                y={sy + 3}
                textAnchor="end"
                className="diagram-axis-label"
              >
                {formatAxisValue(yVal)}
              </text>
            </g>
          )
        })}

        {/* Primary extreme annotation */}
        {Math.abs(primaryExtreme.value) > 1e-4 && (
          <ExtremeAnnotation
            x={toSvgX(primaryExtreme.x)}
            y={toSvgY(primaryExtreme.value)}
            value={primaryExtreme.value}
            position={primaryExtreme.x}
            color={strokeColor}
            unit={unit}
            above={primaryExtreme.value >= 0}
          />
        )}

        {/* Secondary extreme annotation */}
        {showSecondary && Math.abs(secondaryExtreme.value) > 1e-4 && (
          <ExtremeAnnotation
            x={toSvgX(secondaryExtreme.x)}
            y={toSvgY(secondaryExtreme.value)}
            value={secondaryExtreme.value}
            position={secondaryExtreme.x}
            color={strokeColor}
            unit={unit}
            above={secondaryExtreme.value >= 0}
          />
        )}
      </svg>
    </div>
  )
}

/**
 * ExtremeAnnotation — Dot and label for a max/min point.
 */
function ExtremeAnnotation({ x, y, value, position, color, unit, above }) {
  const offsetY = above ? -12 : 16

  return (
    <g>
      <circle cx={x} cy={y} r="3.5" fill={color} />
      <text
        x={x}
        y={y + offsetY}
        textAnchor="middle"
        className="diagram-annotation"
        fill={color}
      >
        {formatBR(value, 2)} {unit}
      </text>
      <text
        x={x}
        y={y + offsetY + (above ? -11 : 11)}
        textAnchor="middle"
        className="diagram-axis-label"
      >
        x = {formatBR(position, 2)} m
      </text>
    </g>
  )
}

/**
 * Format axis values to avoid long decimals.
 */
function formatAxisValue(value) {
  if (Math.abs(value) < 0.01) return '0'
  return formatBR(value, 2)
}

export default DiagramSVG
