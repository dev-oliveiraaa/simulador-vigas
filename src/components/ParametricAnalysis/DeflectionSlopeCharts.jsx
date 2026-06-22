/**
 * DeflectionSlopeCharts — Renders two SVG charts:
 * 1. Deflection y(x) in mm
 * 2. Slope θ(x) in rad
 *
 * Each chart shows one curve per material with legend.
 * Uses Brazilian number formatting (comma decimal separator).
 */

import { formatBR } from '../../utils/unitConversion.js'

const SVG_WIDTH = 800
const SVG_HEIGHT = 380
const PADDING = { top: 30, right: 60, bottom: 50, left: 80 }

/**
 * @param {object} props
 * @param {object[]} props.deflectionSeries - Array of { name, E, color, data: [{param, value}] }
 * @param {object[]} props.slopeSeries - Same structure for slope
 */
function DeflectionSlopeCharts({ deflectionSeries, slopeSeries }) {
  return (
    <div className="deflection-slope-charts">
      <Chart
        series={deflectionSeries}
        title="Deflexão y(x) ao longo da viga"
        yLabel="Deflexão y"
        yUnit="mm"
        chartId="deflection-chart"
      />
      <Chart
        series={slopeSeries}
        title="Inclinação θ(x) ao longo da viga"
        yLabel="Inclinação θ"
        yUnit="rad"
        chartId="slope-chart"
      />
    </div>
  )
}

function Chart({ series, title, yLabel, yUnit, chartId }) {
  if (!series || series.length === 0) return null

  const drawWidth = SVG_WIDTH - PADDING.left - PADDING.right
  const drawHeight = SVG_HEIGHT - PADDING.top - PADDING.bottom

  // Compute ranges
  let xMin = Infinity, xMax = -Infinity
  let yMin = Infinity, yMax = -Infinity

  for (const s of series) {
    for (const point of s.data) {
      if (point.param < xMin) xMin = point.param
      if (point.param > xMax) xMax = point.param
      if (point.value < yMin) yMin = point.value
      if (point.value > yMax) yMax = point.value
    }
  }

  if (xMin >= 0 && xMin < 1e-10) xMin = 0
  if (xMax === xMin) { xMin -= 1; xMax += 1 }
  if (Math.abs(yMax - yMin) < 1e-15) { yMin -= 0.001; yMax += 0.001 }

  const yRange = yMax - yMin
  const paddedYMin = yMin - yRange * 0.1
  const paddedYMax = yMax + yRange * 0.1
  const xRange = xMax - xMin

  const toSvgX = (v) => PADDING.left + ((v - xMin) / xRange) * drawWidth
  const toSvgY = (v) => PADDING.top + (1 - (v - paddedYMin) / (paddedYMax - paddedYMin)) * drawHeight

  // Ticks
  const numXTicks = Math.min(10, Math.max(4, Math.ceil(xMax - xMin)))
  const xTicks = []
  for (let i = 0; i <= numXTicks; i++) {
    xTicks.push(xMin + (i / numXTicks) * xRange)
  }

  const numYTicks = 6
  const yTicks = []
  for (let i = 0; i <= numYTicks; i++) {
    yTicks.push(paddedYMin + (i / numYTicks) * (paddedYMax - paddedYMin))
  }

  // Determine precision for y-axis (rad values are very small)
  const yDecimals = yUnit === 'rad' ? 6 : 3

  return (
    <div className="parametric-chart" id={chartId}>
      <div className="parametric-chart__header">
        <span className="parametric-chart__title">{title}</span>
        <div className="parametric-chart__legend">
          {series.map((s) => (
            <div key={s.name} className="legend-item">
              <span className="legend-swatch" style={{ background: s.color }} />
              {s.name} (E = {s.E} GPa)
            </div>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        aria-label={`Gráfico: ${title}`}
        role="img"
      >
        {/* Grid lines */}
        {yTicks.map((yVal, i) => (
          <line
            key={`gy-${i}`}
            x1={PADDING.left}
            y1={toSvgY(yVal)}
            x2={SVG_WIDTH - PADDING.right}
            y2={toSvgY(yVal)}
            stroke="#f3f4f6"
            strokeWidth="1"
          />
        ))}
        {xTicks.map((xVal, i) => (
          <line
            key={`gx-${i}`}
            x1={toSvgX(xVal)}
            y1={PADDING.top}
            x2={toSvgX(xVal)}
            y2={SVG_HEIGHT - PADDING.bottom}
            stroke="#f3f4f6"
            strokeWidth="1"
          />
        ))}

        {/* Zero line */}
        {paddedYMin <= 0 && paddedYMax >= 0 && (
          <line
            x1={PADDING.left}
            y1={toSvgY(0)}
            x2={SVG_WIDTH - PADDING.right}
            y2={toSvgY(0)}
            stroke="#d1d5db"
            strokeWidth="1"
            strokeDasharray="4,3"
          />
        )}

        {/* Axes */}
        <line
          x1={PADDING.left}
          y1={SVG_HEIGHT - PADDING.bottom}
          x2={SVG_WIDTH - PADDING.right}
          y2={SVG_HEIGHT - PADDING.bottom}
          stroke="#9ca3af"
          strokeWidth="1"
        />
        <line
          x1={PADDING.left}
          y1={PADDING.top}
          x2={PADDING.left}
          y2={SVG_HEIGHT - PADDING.bottom}
          stroke="#9ca3af"
          strokeWidth="1"
        />

        {/* X-axis ticks */}
        {xTicks.map((xVal, i) => {
          const sx = toSvgX(xVal)
          return (
            <g key={`xt-${i}`}>
              <line
                x1={sx}
                y1={SVG_HEIGHT - PADDING.bottom}
                x2={sx}
                y2={SVG_HEIGHT - PADDING.bottom + 4}
                stroke="#9ca3af"
                strokeWidth="1"
              />
              <text
                x={sx}
                y={SVG_HEIGHT - PADDING.bottom + 18}
                textAnchor="middle"
                className="chart-axis-label"
              >
                {formatBR(xVal, 1)}
              </text>
            </g>
          )
        })}

        {/* X-axis label */}
        <text
          x={PADDING.left + drawWidth / 2}
          y={SVG_HEIGHT - 8}
          textAnchor="middle"
          className="chart-axis-label"
          fontWeight="600"
        >
          Posição x (m)
        </text>

        {/* Y-axis ticks */}
        {yTicks.map((yVal, i) => {
          const sy = toSvgY(yVal)
          return (
            <g key={`yt-${i}`}>
              <line
                x1={PADDING.left - 4}
                y1={sy}
                x2={PADDING.left}
                y2={sy}
                stroke="#9ca3af"
                strokeWidth="1"
              />
              <text
                x={PADDING.left - 8}
                y={sy + 3}
                textAnchor="end"
                className="chart-axis-label"
              >
                {formatBR(yVal, yDecimals)}
              </text>
            </g>
          )
        })}

        {/* Y-axis label */}
        <text
          x={16}
          y={PADDING.top + drawHeight / 2}
          textAnchor="middle"
          className="chart-axis-label"
          fontWeight="600"
          transform={`rotate(-90, 16, ${PADDING.top + drawHeight / 2})`}
        >
          {yLabel} ({yUnit})
        </text>

        {/* Data series */}
        {series.map((s) => {
          const points = s.data
            .map((d) => `${toSvgX(d.param)},${toSvgY(d.value)}`)
            .join(' ')

          return (
            <g key={s.name}>
              <polyline
                points={points}
                fill="none"
                stroke={s.color}
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {s.data.map((d, i) => (
                <g key={i}>
                  <circle
                    cx={toSvgX(d.param)}
                    cy={toSvgY(d.value)}
                    r="4"
                    fill="white"
                    stroke={s.color}
                    strokeWidth="2"
                  />
                  {/* Value label — only show if not too many points */}
                  {s.data.length <= 20 && (
                    <text
                      x={toSvgX(d.param)}
                      y={toSvgY(d.value) - 10}
                      textAnchor="middle"
                      className="chart-value-label"
                      fill={s.color}
                    >
                      {formatBR(d.value, yDecimals)}
                    </text>
                  )}
                </g>
              ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default DeflectionSlopeCharts
