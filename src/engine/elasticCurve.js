/**
 * Elastic curve analysis engine.
 *
 * Computes deflection y(x) and slope θ(x) along a beam by double numerical
 * integration of M(x)/(EI). Supports all beam types including propped cantilever.
 *
 * Used by the "Deflexão e Inclinação vs x" analysis mode.
 */

import { BEAM_TYPES } from '../utils/constants.js'
import { gpaTokNm2, cm4ToM4, mToMm } from '../utils/unitConversion.js'
import { solveSimplySupported, solveCantilever, solveProppedCantilever, momentAt } from './solver.js'
import { solveContinuousBeam } from './continuousBeamSolver.js'
import { sanitizeNumber } from './validators.js'

/**
 * Number of internal discretization points for high-accuracy integration.
 * This is independent of the user's requested output points.
 */
const INTERNAL_POINTS = 2001

/**
 * Run the full "Deflexão e Inclinação vs x" analysis.
 *
 * @param {object} config
 * @param {string} config.beamType - Beam type from BEAM_TYPES
 * @param {number} config.totalLength - Total beam length (m)
 * @param {number[]} config.supports - Support positions (m)
 * @param {object[]} config.loads - Array of load definitions (values in kN, kN/m)
 * @param {number} config.I - Moment of inertia in cm⁴
 * @param {number} config.sweepStart - Start of analysis interval (m)
 * @param {number} config.sweepEnd - End of analysis interval (m)
 * @param {number} config.sweepStep - Step increment (m)
 * @param {object[]} config.materials - Array of { name, E (GPa), color }
 * @returns {object} Analysis results
 */
export function runDeflectionSlopeAnalysis(config) {
  const {
    beamType,
    totalLength: L,
    supports,
    loads,
    I,
    sweepStart,
    sweepEnd,
    sweepStep,
    materials,
  } = config

  // Generate user-requested x positions
  const userXValues = []
  for (let x = sweepStart; x <= sweepEnd + 1e-10; x += sweepStep) {
    userXValues.push(sanitizeNumber(x))
  }

  // Solve reactions (independent of material — same for all)
  const { reactions, reactionMoments, supportPositions } = solveReactions(
    beamType, L, loads, supports
  )

  // Generate internal high-resolution x values across FULL beam
  const internalX = []
  for (let i = 0; i < INTERNAL_POINTS; i++) {
    internalX.push((i / (INTERNAL_POINTS - 1)) * L)
  }

  // Compute M(x) along the full beam (same for all materials)
  const mValues = internalX.map(x =>
    momentAt(
      x,
      loads,
      reactions,
      beamType === BEAM_TYPES.CANTILEVER ? reactionMoments : []
    )
  )

  // For each material, compute y(x) and θ(x)
  const deflectionSeries = []
  const slopeSeries = []
  const tableRows = []

  for (const material of materials) {
    const EI = gpaTokNm2(material.E) * cm4ToM4(I) // kN·m²
    if (EI <= 0) continue

    // Curvature: M(x) / EI
    const curvature = mValues.map(m => sanitizeNumber(m / EI))

    // First integration: θ(x) = ∫ M(x)/EI dx + C1
    const slopeRaw = new Array(INTERNAL_POINTS).fill(0)
    for (let i = 1; i < INTERNAL_POINTS; i++) {
      const dx = internalX[i] - internalX[i - 1]
      slopeRaw[i] = slopeRaw[i - 1] + (curvature[i - 1] + curvature[i]) * dx / 2
    }

    // Second integration: y(x) = ∫ θ(x) dx + C2
    const deflRaw = new Array(INTERNAL_POINTS).fill(0)
    for (let i = 1; i < INTERNAL_POINTS; i++) {
      const dx = internalX[i] - internalX[i - 1]
      deflRaw[i] = deflRaw[i - 1] + (slopeRaw[i - 1] + slopeRaw[i]) * dx / 2
    }

    // Apply boundary conditions to determine C1 and C2
    const { slope, deflection } = applyBoundaryConditions(
      beamType, internalX, slopeRaw, deflRaw, supportPositions
    )

    // Interpolate to user-requested x positions
    const deflData = []
    const slopeData = []

    for (const xUser of userXValues) {
      const yMm = sanitizeNumber(mToMm(interpolate(internalX, deflection, xUser)))
      const theta = sanitizeNumber(interpolate(internalX, slope, xUser))
      deflData.push({ param: xUser, value: yMm })
      slopeData.push({ param: xUser, value: theta })
    }

    deflectionSeries.push({
      name: material.name,
      E: material.E,
      color: material.color,
      data: deflData,
    })

    slopeSeries.push({
      name: material.name,
      E: material.E,
      color: material.color,
      data: slopeData,
    })
  }

  // Build table data (rows by x, columns by material)
  for (let i = 0; i < userXValues.length; i++) {
    const row = { x: userXValues[i] }
    for (let m = 0; m < materials.length; m++) {
      const matKey = materials[m].name
      row[`y_${matKey}`] = deflectionSeries[m]?.data[i]?.value ?? 0
      row[`theta_${matKey}`] = slopeSeries[m]?.data[i]?.value ?? 0
    }
    tableRows.push(row)
  }

  return {
    deflectionSeries,
    slopeSeries,
    tableRows,
    materials,
    userXValues,
    reactions,
    reactionMoments: beamType === BEAM_TYPES.CANTILEVER ||
                     beamType === BEAM_TYPES.PROPPED_CANTILEVER
      ? reactionMoments : [],
    isDeflectionSlope: true,
    title: 'Deflexão e Inclinação vs x',
    xLabel: 'Posição x',
    xUnit: 'm',
  }
}

/**
 * Solve reactions based on beam type.
 */
function solveReactions(beamType, L, loads, supports) {
  let reactions = []
  let reactionMoments = []
  let supportPositions = []

  const sortedSupports = [...supports].sort((a, b) => a - b)

  switch (beamType) {
    case BEAM_TYPES.SIMPLY_SUPPORTED: {
      const sA = sortedSupports[0] ?? 0
      const sB = sortedSupports[1] ?? L
      const { Ra, Rb } = solveSimplySupported(L, loads, sA, sB)
      reactions = [
        { position: sA, force: Ra },
        { position: sB, force: Rb },
      ]
      supportPositions = [sA, sB]
      break
    }

    case BEAM_TYPES.CANTILEVER: {
      const { R, M } = solveCantilever(L, loads)
      reactions = [{ position: 0, force: R }]
      reactionMoments = [{ position: 0, moment: M }]
      supportPositions = [0]
      break
    }

    case BEAM_TYPES.OVERHANGING: {
      const sA = sortedSupports[0] ?? 0
      const sB = sortedSupports[1] ?? L
      const { Ra, Rb } = solveSimplySupported(L, loads, sA, sB)
      reactions = [
        { position: sA, force: Ra },
        { position: sB, force: Rb },
      ]
      supportPositions = [sA, sB]
      break
    }

    case BEAM_TYPES.PROPPED_CANTILEVER: {
      // supports[0] = simple support, supports[1] = fixed end (or vice versa)
      // Convention: the last support listed is the fixed end
      const supportPos = sortedSupports[0]
      const fixedPos = sortedSupports[sortedSupports.length - 1]
      const { Ra, Rb, Mb } = solveProppedCantilever(L, loads, supportPos, fixedPos)
      reactions = [
        { position: supportPos, force: Ra },
        { position: fixedPos, force: Rb },
      ]
      reactionMoments = [{ position: fixedPos, moment: Mb }]
      supportPositions = [supportPos, fixedPos]
      break
    }

    case BEAM_TYPES.CONTINUOUS: {
      const result = solveContinuousBeam(sortedSupports, loads)
      reactions = result.reactions
      supportPositions = sortedSupports
      reactionMoments = result.supportMoments
        .map((m, idx) => ({ position: sortedSupports[idx], moment: m }))
        .filter(rm => Math.abs(rm.moment) > 1e-10)
      break
    }

    default: {
      const { Ra, Rb } = solveSimplySupported(L, loads, 0, L)
      reactions = [
        { position: 0, force: Ra },
        { position: L, force: Rb },
      ]
      supportPositions = [0, L]
    }
  }

  return { reactions, reactionMoments, supportPositions }
}

/**
 * Apply boundary conditions to the raw slope and deflection curves.
 *
 * Adjusts for integration constants C1 and C2 based on beam type:
 * - Simply supported / Overhanging: y = 0 at both supports → determines C1, C2
 * - Cantilever: y = 0 and θ = 0 at fixed end → C1 = 0, C2 = 0
 * - Propped cantilever: y = 0 at support AND y = 0 and θ = 0 at fixed end
 *   (overdetermined with 3 BCs for 2 constants, but the redundant reaction
 *    was already solved to make this consistent)
 *
 * @param {string} beamType
 * @param {number[]} xValues
 * @param {number[]} slopeRaw - Raw slope (with C1 = 0)
 * @param {number[]} deflRaw - Raw deflection (with C1 = C2 = 0)
 * @param {number[]} supportPositions
 * @returns {{ slope: number[], deflection: number[] }}
 */
function applyBoundaryConditions(beamType, xValues, slopeRaw, deflRaw, supportPositions) {
  const n = xValues.length
  const slope = [...slopeRaw]
  const deflection = [...deflRaw]

  if (beamType === BEAM_TYPES.CANTILEVER) {
    // Fixed at x=0: θ(0) = 0 and y(0) = 0
    // Raw integration already starts from 0, so C1 = 0, C2 = 0
    // But we need to subtract any offset
    const offset = deflection[0]
    const slopeOffset = slope[0]
    for (let i = 0; i < n; i++) {
      slope[i] = sanitizeNumber(slope[i] - slopeOffset)
      deflection[i] = sanitizeNumber(deflection[i] - offset - slopeOffset * xValues[i])
    }
    return { slope, deflection }
  }

  if (beamType === BEAM_TYPES.PROPPED_CANTILEVER) {
    // y = 0 at both support positions (support + fixed end)
    // θ = 0 at fixed end
    // Since we already solved for the correct reaction, using y=0 at two points is sufficient
    const i1 = findClosest(xValues, supportPositions[0])
    const i2 = findClosest(xValues, supportPositions[supportPositions.length - 1])

    const x1 = xValues[i1]
    const x2 = xValues[i2]
    const y1 = deflRaw[i1]
    const y2 = deflRaw[i2]

    let C1 = 0
    let C2 = 0
    if (Math.abs(x2 - x1) > 1e-10) {
      C1 = -(y2 - y1) / (x2 - x1)
      C2 = -(y1 + C1 * x1)
    }

    for (let i = 0; i < n; i++) {
      slope[i] = sanitizeNumber(slopeRaw[i] + C1)
      deflection[i] = sanitizeNumber(deflRaw[i] + C1 * xValues[i] + C2)
    }

    return { slope, deflection }
  }

  // Simply supported / Overhanging / Continuous:
  // y = 0 at support positions → C1 and C2
  if (supportPositions.length >= 2) {
    const i1 = findClosest(xValues, supportPositions[0])
    const i2 = findClosest(xValues, supportPositions[supportPositions.length - 1])

    const x1 = xValues[i1]
    const x2 = xValues[i2]
    const y1 = deflRaw[i1]
    const y2 = deflRaw[i2]

    let C1 = 0
    let C2 = 0
    if (Math.abs(x2 - x1) > 1e-10) {
      C1 = -(y2 - y1) / (x2 - x1)
      C2 = -(y1 + C1 * x1)
    }

    for (let i = 0; i < n; i++) {
      slope[i] = sanitizeNumber(slopeRaw[i] + C1)
      deflection[i] = sanitizeNumber(deflRaw[i] + C1 * xValues[i] + C2)
    }
  } else if (supportPositions.length === 1) {
    const idx = findClosest(xValues, supportPositions[0])
    const offset = deflRaw[idx]
    for (let i = 0; i < n; i++) {
      deflection[i] = sanitizeNumber(deflRaw[i] - offset)
    }
  }

  return { slope, deflection }
}

/**
 * Find the index of the closest value in an array.
 */
function findClosest(arr, target) {
  let bestIdx = 0
  let bestDist = Math.abs(arr[0] - target)
  for (let i = 1; i < arr.length; i++) {
    const dist = Math.abs(arr[i] - target)
    if (dist < bestDist) {
      bestDist = dist
      bestIdx = i
    }
  }
  return bestIdx
}

/**
 * Linear interpolation between two arrays.
 * @param {number[]} xArr - Sorted x values
 * @param {number[]} yArr - Corresponding y values
 * @param {number} x - Target x value
 * @returns {number} Interpolated y value
 */
function interpolate(xArr, yArr, x) {
  if (x <= xArr[0]) return yArr[0]
  if (x >= xArr[xArr.length - 1]) return yArr[yArr.length - 1]

  // Binary search for the interval
  let lo = 0
  let hi = xArr.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (xArr[mid] <= x) lo = mid
    else hi = mid
  }

  const t = (x - xArr[lo]) / (xArr[hi] - xArr[lo])
  return yArr[lo] + t * (yArr[hi] - yArr[lo])
}
