/**
 * Generates arrays of data points for V(x), M(x), and δ(x) diagrams.
 *
 * This is the main orchestrator that calls the solvers and produces
 * rendering-ready data for the SVG diagram components.
 */

import { BEAM_TYPES, NUM_POINTS } from '../utils/constants.js'
import { mToMm, knm2ToMPa, cm3ToM3 } from '../utils/unitConversion.js'
import { solveSimplySupported, solveCantilever, solveProppedCantilever, shearAt, momentAt } from './solver.js'
import { solveContinuousBeam } from './continuousBeamSolver.js'
import { calculateDeflection, calculateCantileverDeflection } from './deflection.js'
import { sanitizeNumber } from './validators.js'

/**
 * Find extremes (max and min) in a data array.
 * @param {{ x: number, value: number }[]} data
 * @returns {{ max: { x: number, value: number }, min: { x: number, value: number } }}
 */
function findExtremes(data) {
  let max = { x: 0, value: -Infinity }
  let min = { x: 0, value: Infinity }

  for (const point of data) {
    if (point.value > max.value) {
      max = { x: point.x, value: point.value }
    }
    if (point.value < min.value) {
      min = { x: point.x, value: point.value }
    }
  }

  return {
    max: { x: max.x, value: sanitizeNumber(max.value) },
    min: { x: min.x, value: sanitizeNumber(min.value) },
  }
}

/**
 * Generate all diagram data for a beam configuration.
 *
 * @param {object} config
 * @param {string} config.type - Beam type (from BEAM_TYPES)
 * @param {number} config.length - Total beam length (m)
 * @param {number[]} [config.supports] - Support positions (m)
 * @param {number|null} [config.E] - Elastic modulus (GPa)
 * @param {number|null} [config.I] - Moment of inertia (cm⁴)
 * @param {number|null} [config.W] - Section modulus (cm³)
 * @param {object[]} config.loads - Array of load definitions
 * @returns {object} Result object with diagram data and summary values
 */
export function generateDiagramData(config) {
  const { type, length: L, loads, E, I, W } = config
  const numPoints = NUM_POINTS

  // Generate x values
  const xValues = []
  for (let i = 0; i < numPoints; i++) {
    xValues.push((i / (numPoints - 1)) * L)
  }

  // Solve for reactions based on beam type
  let reactions = [] // { position, force }[]
  let reactionMoments = [] // { position, moment }[] (for cantilevers)
  let supportPositions = []

  switch (type) {
    case BEAM_TYPES.SIMPLY_SUPPORTED: {
      const { Ra, Rb } = solveSimplySupported(L, loads, 0, L)
      reactions = [
        { position: 0, force: Ra },
        { position: L, force: Rb },
      ]
      supportPositions = [0, L]
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
      const supports = config.supports || [0, L]
      const sortedSupports = [...supports].sort((a, b) => a - b)
      const { Ra, Rb } = solveSimplySupported(L, loads, sortedSupports[0], sortedSupports[1])
      reactions = [
        { position: sortedSupports[0], force: Ra },
        { position: sortedSupports[1], force: Rb },
      ]
      supportPositions = sortedSupports
      break
    }

    case BEAM_TYPES.PROPPED_CANTILEVER: {
      const supports = config.supports || [0, L]
      const sortedSupports = [...supports].sort((a, b) => a - b)
      const supportPos = sortedSupports[0]
      const fixedPos = sortedSupports[sortedSupports.length - 1]
      const { Ra, Rb, Mb } = solveProppedCantilever(L, loads, supportPos, fixedPos)
      reactions = [
        { position: supportPos, force: Ra },
        { position: fixedPos, force: Rb },
      ]
      reactionMoments = [{ position: fixedPos, moment: Mb }]
      supportPositions = sortedSupports
      break
    }

    case BEAM_TYPES.CONTINUOUS: {
      const supports = config.supports || [0, L]
      const sortedSupports = [...supports].sort((a, b) => a - b)
      const result = solveContinuousBeam(sortedSupports, loads)
      reactions = result.reactions
      supportPositions = sortedSupports
      // For continuous beams, we also have support moments that affect the diagram
      reactionMoments = result.supportMoments
        .map((m, idx) => ({ position: sortedSupports[idx], moment: m }))
        .filter(rm => Math.abs(rm.moment) > 1e-10)
      break
    }
  }

  // Generate V(x) data
  const vData = xValues.map(x => ({
    x,
    value: shearAt(x, loads, reactions),
  }))

  // Generate M(x) data
  const mData = xValues.map(x => ({
    x,
    value: momentAt(
      x,
      loads,
      reactions,
      type === BEAM_TYPES.CANTILEVER || type === BEAM_TYPES.PROPPED_CANTILEVER ? reactionMoments : []
    ),
  }))

  // Generate δ(x) data (only if E and I are provided)
  let dData = null
  let hasDeflection = false
  const mValues = mData.map(d => d.value)

  if (E && I && Number(E) > 0 && Number(I) > 0) {
    hasDeflection = true
    let deflectionValues

    if (type === BEAM_TYPES.CANTILEVER) {
      deflectionValues = calculateCantileverDeflection(
        xValues,
        mValues,
        Number(E),
        Number(I)
      )
    } else {
      deflectionValues = calculateDeflection(
        xValues,
        mValues,
        Number(E),
        Number(I),
        supportPositions
      )
    }

    dData = xValues.map((x, i) => ({
      x,
      value: mToMm(deflectionValues[i]), // Convert to mm
    }))
  }

  // Find extremes
  const vExtremes = findExtremes(vData)
  const mExtremes = findExtremes(mData)
  const dExtremes = dData ? findExtremes(dData) : null

  // Stress verification
  let maxStress = null
  if (W && Number(W) > 0) {
    const Mmax = Math.max(Math.abs(mExtremes.max.value), Math.abs(mExtremes.min.value))
    const Wm3 = cm3ToM3(Number(W))
    const sigmaKNm2 = Mmax / Wm3
    maxStress = sanitizeNumber(knm2ToMPa(sigmaKNm2))
  }

  return {
    xValues,
    vData,
    mData,
    dData,
    hasDeflection,
    reactions,
    reactionMoments: type === BEAM_TYPES.CANTILEVER || type === BEAM_TYPES.PROPPED_CANTILEVER ? reactionMoments : [],
    supportPositions,
    extremes: {
      shear: vExtremes,
      moment: mExtremes,
      deflection: dExtremes,
    },
    maxStress,
    summary: {
      reactions: reactions.map(r => ({
        position: r.position,
        force: Number(r.force.toFixed(4)),
      })),
      reactionMoments: type === BEAM_TYPES.CANTILEVER || type === BEAM_TYPES.PROPPED_CANTILEVER
        ? reactionMoments.map(rm => ({
            position: rm.position,
            moment: Number(rm.moment.toFixed(4)),
          }))
        : [],
      maxMoment: {
        value: Number(mExtremes.max.value.toFixed(4)),
        position: Number(mExtremes.max.x.toFixed(4)),
      },
      minMoment: {
        value: Number(mExtremes.min.value.toFixed(4)),
        position: Number(mExtremes.min.x.toFixed(4)),
      },
      maxDeflection: dExtremes
        ? {
            value: Number(dExtremes.max.value.toFixed(4)),
            position: Number(dExtremes.max.x.toFixed(4)),
          }
        : null,
      minDeflection: dExtremes
        ? {
            value: Number(dExtremes.min.value.toFixed(4)),
            position: Number(dExtremes.min.x.toFixed(4)),
          }
        : null,
      maxStress,
    },
  }
}
