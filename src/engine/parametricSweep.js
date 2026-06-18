/**
 * Parametric sweep analysis.
 *
 * Runs the beam analysis pipeline across a range of values for a
 * given parameter (beam length, support position, etc.) and collects
 * the results for comparison charting.
 *
 * Supports multi-material comparison (e.g. Aluminum vs Steel).
 */

import { NUM_POINTS } from '../utils/constants.js'
import { solveSimplySupported, solveCantilever, shearAt, momentAt } from './solver.js'
import { calculateDeflection, calculateCantileverDeflection } from './deflection.js'
import { calculateStrainEnergy, calculateCastiglianoAnalytical } from './strainEnergy.js'
import { sanitizeNumber } from './validators.js'
import { mToMm } from '../utils/unitConversion.js'

/**
 * @typedef {Object} SweepPoint
 * @property {number} param - The sweep parameter value (L or a)
 * @property {number} value - The computed output value
 */

/**
 * @typedef {Object} MaterialSeries
 * @property {string} name - Material name (e.g. "Alumínio (69 GPa)")
 * @property {number} E - Elastic modulus in GPa
 * @property {string} color - CSS color for the series
 * @property {SweepPoint[]} data - Array of computed data points
 */

/**
 * @typedef {Object} ParametricConfig
 * @property {'max_deflection' | 'strain_energy' | 'castigliano_displacement'} analysisType
 * @property {'simply_supported' | 'cantilever'} beamType
 * @property {'length' | 'support_position'} sweepVariable
 * @property {number} sweepStart - Start of sweep range
 * @property {number} sweepEnd - End of sweep range
 * @property {number} sweepStep - Step increment
 * @property {number} P - Load magnitude in kN
 * @property {number} loadPositionRatio - Load position as fraction of L (0.5 = midspan)
 * @property {number} [totalLength] - For support_position sweep: total beam length (a + b)
 * @property {number} I - Moment of inertia in cm⁴ (already converted from mm⁴ if needed)
 * @property {MaterialConfig[]} materials - Materials to compare
 */

/**
 * @typedef {Object} MaterialConfig
 * @property {string} name - Display name
 * @property {number} E - Elastic modulus in GPa
 * @property {string} color - CSS color
 */

/**
 * Run a parametric sweep analysis.
 *
 * @param {ParametricConfig} config - Parametric analysis configuration
 * @returns {{
 *   series: MaterialSeries[],
 *   xLabel: string,
 *   yLabel: string,
 *   xUnit: string,
 *   yUnit: string,
 *   title: string,
 * }}
 */
export function runParametricSweep(config) {
  const {
    analysisType,
    beamType,
    sweepVariable,
    sweepStart,
    sweepEnd,
    sweepStep,
    P,
    loadPositionRatio,
    totalLength,
    I,
    materials,
  } = config

  // Generate sweep parameter values
  const paramValues = []
  for (let v = sweepStart; v <= sweepEnd + 1e-10; v += sweepStep) {
    // Skip L=0 only for length sweeps (a beam with L=0 is degenerate).
    // For other sweep variables (e.g. support position), v=0 is valid.
    if (v === 0 && sweepVariable === 'length') continue
    if (v >= 0) {
      paramValues.push(sanitizeNumber(v))
    }
  }

  // Compute analysis label metadata
  const meta = getAnalysisMeta(analysisType, sweepVariable)

  // Run analysis for each material
  const series = materials.map((material) => {
    const data = paramValues.map((param) => {
      const value = computeSinglePoint(
        analysisType,
        beamType,
        sweepVariable,
        param,
        P,
        loadPositionRatio,
        totalLength,
        material.E,
        I
      )
      return { param, value }
    })

    return {
      name: material.name,
      E: material.E,
      color: material.color,
      data,
    }
  })

  return {
    series,
    ...meta,
  }
}

/**
 * Compute a single analysis point for a given parameter value.
 */
function computeSinglePoint(
  analysisType,
  beamType,
  sweepVariable,
  param,
  P,
  loadPositionRatio,
  totalLength,
  E,
  I
) {
  let L, loadPosition, supportA, supportB

  if (sweepVariable === 'length') {
    L = param
    loadPosition = loadPositionRatio * L
    supportA = 0
    supportB = L
  } else if (sweepVariable === 'support_position') {
    // param = a (distance from left support to load)
    L = totalLength
    const a = param
    loadPosition = a
    supportA = 0
    supportB = L
  }

  // Build load
  const loads = [
    { type: 'point', position: loadPosition, value: P },
  ]

  // Generate x values
  const numPoints = NUM_POINTS
  const xValues = []
  for (let i = 0; i < numPoints; i++) {
    xValues.push((i / (numPoints - 1)) * L)
  }

  // Solve for reactions and compute moments
  let reactions, reactionMoments, supportPositions

  if (beamType === 'cantilever') {
    const { R, M } = solveCantilever(L, loads)
    reactions = [{ position: 0, force: R }]
    reactionMoments = [{ position: 0, moment: M }]
    supportPositions = [0]
  } else {
    const { Ra, Rb } = solveSimplySupported(L, loads, supportA, supportB)
    reactions = [
      { position: supportA, force: Ra },
      { position: supportB, force: Rb },
    ]
    reactionMoments = []
    supportPositions = [supportA, supportB]
  }

  // Compute M(x) values
  const mValues = xValues.map((x) =>
    momentAt(
      x,
      loads,
      reactions,
      beamType === 'cantilever' ? reactionMoments : []
    )
  )

  // Compute the requested output
  switch (analysisType) {
    case 'max_deflection': {
      let deflectionValues
      if (beamType === 'cantilever') {
        deflectionValues = calculateCantileverDeflection(xValues, mValues, E, I)
      } else {
        deflectionValues = calculateDeflection(xValues, mValues, E, I, supportPositions)
      }
      // Find max absolute deflection
      let maxDef = 0
      for (const d of deflectionValues) {
        if (Math.abs(d) > Math.abs(maxDef)) {
          maxDef = d
        }
      }
      return sanitizeNumber(mToMm(maxDef)) // Return in mm
    }

    case 'strain_energy': {
      return calculateStrainEnergy(xValues, mValues, E, I)
    }

    case 'castigliano_displacement': {
      // For Castigliano: compute M(x) with unit load P=1
      const unitLoads = [
        { type: 'point', position: loadPosition, value: 1 },
      ]

      let unitReactions, unitReactionMoments

      if (beamType === 'cantilever') {
        const { R, M } = solveCantilever(L, unitLoads)
        unitReactions = [{ position: 0, force: R }]
        unitReactionMoments = [{ position: 0, moment: M }]
      } else {
        const { Ra, Rb } = solveSimplySupported(L, unitLoads, supportA, supportB)
        unitReactions = [
          { position: supportA, force: Ra },
          { position: supportB, force: Rb },
        ]
        unitReactionMoments = []
      }

      const mUnitValues = xValues.map((x) =>
        momentAt(
          x,
          unitLoads,
          unitReactions,
          beamType === 'cantilever' ? unitReactionMoments : []
        )
      )

      const delta = calculateCastiglianoAnalytical(xValues, mValues, mUnitValues, E, I)
      return sanitizeNumber(mToMm(delta)) // Return in mm
    }

    default:
      return 0
  }
}

/**
 * Get display metadata for an analysis type.
 */
function getAnalysisMeta(analysisType, sweepVariable) {
  const xLabel = sweepVariable === 'length' ? 'Comprimento L' : 'Distância a'
  const xUnit = 'm'

  switch (analysisType) {
    case 'max_deflection':
      return {
        title: `Deflexão Máxima vs ${xLabel}`,
        xLabel,
        yLabel: 'Deflexão máxima (δ)',
        xUnit,
        yUnit: 'mm',
      }
    case 'strain_energy':
      return {
        title: `Energia de Deformação vs ${xLabel}`,
        xLabel,
        yLabel: 'Energia de deformação (U)',
        xUnit,
        yUnit: 'kN·m',
      }
    case 'castigliano_displacement':
      return {
        title: `Deslocamento (Castigliano) vs ${xLabel}`,
        xLabel,
        yLabel: 'Deslocamento (δ)',
        xUnit,
        yUnit: 'mm',
      }
    default:
      return {
        title: 'Análise Paramétrica',
        xLabel,
        yLabel: 'Valor',
        xUnit,
        yUnit: '',
      }
  }
}
