import { BEAM_TYPES } from '../../utils/constants.js'
import './BeamSchematic.css'

const PADDING_X = 60
const BEAM_Y = 70
const BEAM_HEIGHT = 10
const SVG_HEIGHT = 140

/**
 * BeamSchematic — Draws an SVG schematic of the beam with supports and loads.
 *
 * @param {object} props
 * @param {object} props.config - Beam configuration
 * @param {number} props.config.length - Total beam length
 * @param {string} props.config.type - Beam type
 * @param {number[]} props.config.supports - Support positions
 * @param {object[]} props.config.loads - Applied loads
 */
function BeamSchematic({ config }) {
  const { length: L, type, supports = [], loads = [] } = config

  /**
   * Map a beam-space x coordinate to SVG-space.
   * @param {number} x - Position on beam (m)
   * @param {number} width - Available SVG width
   * @returns {number} SVG x coordinate
   */
  const toSvgX = (x, width) => {
    const drawWidth = width - 2 * PADDING_X
    return PADDING_X + (x / L) * drawWidth
  }

  return (
    <div className="beam-schematic" id="beam-schematic">
      <h3 className="beam-schematic__title">Esquema da Viga</h3>
      <svg
        viewBox={`0 0 800 ${SVG_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        aria-label="Desenho esquemático da viga"
        role="img"
      >
        <defs>
          {/* Hatch pattern for ground line */}
          <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#9ca3af" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Ground line */}
        <rect
          x={toSvgX(0, 800) - 10}
          y={BEAM_Y + BEAM_HEIGHT + 22}
          width={toSvgX(L, 800) - toSvgX(0, 800) + 20}
          height="6"
          fill="url(#hatch)"
        />

        {/* Beam body */}
        <rect
          x={toSvgX(0, 800)}
          y={BEAM_Y}
          width={toSvgX(L, 800) - toSvgX(0, 800)}
          height={BEAM_HEIGHT}
          fill="#d1d5db"
          stroke="#374151"
          strokeWidth="1.5"
          rx="2"
        />

        {/* Dimension line */}
        <line
          x1={toSvgX(0, 800)}
          y1={BEAM_Y + BEAM_HEIGHT + 36}
          x2={toSvgX(L, 800)}
          y2={BEAM_Y + BEAM_HEIGHT + 36}
          stroke="#9ca3af"
          strokeWidth="1"
          markerStart="url(#dimArrowLeft)"
          markerEnd="url(#dimArrowRight)"
        />
        <text
          x={(toSvgX(0, 800) + toSvgX(L, 800)) / 2}
          y={BEAM_Y + BEAM_HEIGHT + 50}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="11"
          fontFamily="Inter, system-ui, sans-serif"
        >
          L = {L} m
        </text>

        {/* Supports */}
        {type === BEAM_TYPES.CANTILEVER ? (
          <FixedSupport x={toSvgX(0, 800)} beamY={BEAM_Y} beamHeight={BEAM_HEIGHT} />
        ) : (
          supports.map((pos, idx) => (
            <SimpleSupport
              key={idx}
              x={toSvgX(pos, 800)}
              beamY={BEAM_Y}
              beamHeight={BEAM_HEIGHT}
              label={idx === 0 ? 'A' : idx === supports.length - 1 ? 'B' : String.fromCharCode(65 + idx)}
            />
          ))
        )}

        {/* Loads */}
        {loads.map((load, idx) => (
          <LoadDrawing key={idx} load={load} toSvgX={(x) => toSvgX(x, 800)} beamY={BEAM_Y} />
        ))}
      </svg>
    </div>
  )
}

/**
 * SimpleSupport — Triangle pointing up with label.
 */
function SimpleSupport({ x, beamY, beamHeight, label }) {
  const tipY = beamY + beamHeight
  const baseY = tipY + 20
  const halfBase = 12

  return (
    <g>
      <polygon
        points={`${x},${tipY} ${x - halfBase},${baseY} ${x + halfBase},${baseY}`}
        fill="none"
        stroke="#6b7280"
        strokeWidth="1.5"
      />
      <line x1={x - halfBase - 4} y1={baseY} x2={x + halfBase + 4} y2={baseY} stroke="#6b7280" strokeWidth="1.5" />
      {label && (
        <text
          x={x}
          y={baseY + 14}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="11"
          fontWeight="600"
          fontFamily="Inter, system-ui, sans-serif"
        >
          {label}
        </text>
      )}
    </g>
  )
}

/**
 * FixedSupport — Rectangle with vertical hatching (engaste).
 */
function FixedSupport({ x, beamY, beamHeight }) {
  const wallWidth = 12
  const wallHeight = beamHeight + 24

  return (
    <g>
      <rect
        x={x - wallWidth}
        y={beamY - 12}
        width={wallWidth}
        height={wallHeight}
        fill="url(#hatch)"
        stroke="#6b7280"
        strokeWidth="1.5"
      />
    </g>
  )
}

/**
 * LoadDrawing — Renders the appropriate load visualization.
 */
function LoadDrawing({ load, toSvgX, beamY }) {
  switch (load.type) {
    case 'point':
      return <PointLoadDraw load={load} toSvgX={toSvgX} beamY={beamY} />
    case 'distributed_uniform':
      return <DistributedLoadDraw load={load} toSvgX={toSvgX} beamY={beamY} />
    case 'distributed_trapezoidal':
      return <TrapezoidalLoadDraw load={load} toSvgX={toSvgX} beamY={beamY} />
    case 'moment':
      return <MomentLoadDraw load={load} toSvgX={toSvgX} beamY={beamY} />
    default:
      return null
  }
}

/**
 * PointLoadDraw — Vertical arrow with value annotation.
 */
function PointLoadDraw({ load, toSvgX, beamY }) {
  const x = toSvgX(Number(load.position))
  const arrowLength = 35
  const topY = beamY - arrowLength
  const tipY = beamY - 2

  return (
    <g>
      <line x1={x} y1={topY} x2={x} y2={tipY} stroke="#dc2626" strokeWidth="2" />
      <polygon
        points={`${x},${tipY} ${x - 4},${tipY - 8} ${x + 4},${tipY - 8}`}
        fill="#dc2626"
      />
      <text
        x={x}
        y={topY - 5}
        textAnchor="middle"
        fill="#dc2626"
        fontSize="10"
        fontWeight="600"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {load.value} kN
      </text>
    </g>
  )
}

/**
 * DistributedLoadDraw — Series of arrows with top line.
 */
function DistributedLoadDraw({ load, toSvgX, beamY }) {
  const x1 = toSvgX(Number(load.start))
  const x2 = toSvgX(Number(load.end))
  const arrowHeight = 30
  const topY = beamY - arrowHeight
  const tipY = beamY - 2
  const numArrows = Math.max(4, Math.round((x2 - x1) / 25))

  const arrows = []
  for (let i = 0; i <= numArrows; i++) {
    const ax = x1 + (i / numArrows) * (x2 - x1)
    arrows.push(
      <g key={i}>
        <line x1={ax} y1={topY} x2={ax} y2={tipY} stroke="#dc2626" strokeWidth="1" />
        <polygon
          points={`${ax},${tipY} ${ax - 3},${tipY - 6} ${ax + 3},${tipY - 6}`}
          fill="#dc2626"
        />
      </g>
    )
  }

  return (
    <g>
      <line x1={x1} y1={topY} x2={x2} y2={topY} stroke="#dc2626" strokeWidth="1.5" />
      {arrows}
      <text
        x={(x1 + x2) / 2}
        y={topY - 6}
        textAnchor="middle"
        fill="#dc2626"
        fontSize="10"
        fontWeight="600"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {load.value} kN/m
      </text>
    </g>
  )
}

/**
 * TrapezoidalLoadDraw — Arrows with varying height.
 */
function TrapezoidalLoadDraw({ load, toSvgX, beamY }) {
  const x1 = toSvgX(Number(load.start))
  const x2 = toSvgX(Number(load.end))
  const q1 = Number(load.q1)
  const q2 = Number(load.q2)
  const maxQ = Math.max(Math.abs(q1), Math.abs(q2), 1)
  const maxArrowH = 35
  const tipY = beamY - 2
  const numArrows = Math.max(4, Math.round((x2 - x1) / 25))

  const arrows = []
  const topPoints = []

  for (let i = 0; i <= numArrows; i++) {
    const t = i / numArrows
    const ax = x1 + t * (x2 - x1)
    const qx = q1 + (q2 - q1) * t
    const h = (Math.abs(qx) / maxQ) * maxArrowH
    const topY = beamY - h

    topPoints.push(`${ax},${topY}`)

    if (h > 3) {
      arrows.push(
        <g key={i}>
          <line x1={ax} y1={topY} x2={ax} y2={tipY} stroke="#dc2626" strokeWidth="1" />
          <polygon
            points={`${ax},${tipY} ${ax - 3},${tipY - 6} ${ax + 3},${tipY - 6}`}
            fill="#dc2626"
          />
        </g>
      )
    }
  }

  return (
    <g>
      <polyline
        points={topPoints.join(' ')}
        fill="none"
        stroke="#dc2626"
        strokeWidth="1.5"
      />
      {arrows}
      <text
        x={x1}
        y={beamY - (Math.abs(q1) / maxQ) * maxArrowH - 6}
        textAnchor="middle"
        fill="#dc2626"
        fontSize="9"
        fontWeight="600"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {q1}
      </text>
      <text
        x={x2}
        y={beamY - (Math.abs(q2) / maxQ) * maxArrowH - 6}
        textAnchor="middle"
        fill="#dc2626"
        fontSize="9"
        fontWeight="600"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {q2} kN/m
      </text>
    </g>
  )
}

/**
 * MomentLoadDraw — Circular arc with arrow.
 */
function MomentLoadDraw({ load, toSvgX, beamY }) {
  const x = toSvgX(Number(load.position))
  const cy = beamY - 5
  const r = 14
  const isPositive = Number(load.value) >= 0

  // Arc path (270 degrees)
  const startAngle = isPositive ? -30 : 210
  const endAngle = isPositive ? 210 : -30
  const startRad = (startAngle * Math.PI) / 180
  const endRad = (endAngle * Math.PI) / 180

  const x1 = x + r * Math.cos(startRad)
  const y1 = cy + r * Math.sin(startRad)
  const x2 = x + r * Math.cos(endRad)
  const y2 = cy + r * Math.sin(endRad)

  return (
    <g>
      <path
        d={`M ${x1} ${y1} A ${r} ${r} 0 1 ${isPositive ? 1 : 0} ${x2} ${y2}`}
        fill="none"
        stroke="#2563eb"
        strokeWidth="1.5"
      />
      {/* Arrowhead at end */}
      <circle cx={x2} cy={y2} r="3" fill="#2563eb" />
      <text
        x={x}
        y={cy - r - 6}
        textAnchor="middle"
        fill="#2563eb"
        fontSize="10"
        fontWeight="600"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {load.value} kN·m
      </text>
    </g>
  )
}

export default BeamSchematic
