/**
 * Continuous beam solver using the Three Moment Equation (Clapeyron's theorem).
 *
 * Handles beams with 2+ spans and intermediate supports.
 * Solves the tridiagonal system for support moments, then derives reactions.
 */

import { sanitizeNumber } from './validators.js'
import { shearAt, momentAt } from './solver.js'

/**
 * Calculate fixed-end moments (FEM) for a span due to loads.
 * These are the moments at the left and right ends of a fixed-fixed beam.
 *
 * @param {number} spanStart - Left support position
 * @param {number} spanEnd - Right support position
 * @param {object[]} loads - All loads (will filter to those within span)
 * @returns {{ femLeft: number, femRight: number }}
 */
function fixedEndMoments(spanStart, spanEnd, loads) {
  const L = spanEnd - spanStart
  let femLeft = 0
  let femRight = 0

  for (const load of loads) {
    switch (load.type) {
      case 'point': {
        const P = Number(load.value)
        const pos = Number(load.position)
        if (pos > spanStart && pos < spanEnd) {
          const a = pos - spanStart
          const b = spanEnd - pos
          femLeft += P * a * b * b / (L * L)
          femRight += P * a * a * b / (L * L)
        }
        break
      }

      case 'distributed_uniform': {
        const q = Number(load.value)
        const ls = Math.max(Number(load.start), spanStart)
        const le = Math.min(Number(load.end), spanEnd)
        if (le > ls) {
          // Full span uniform load shortcut
          if (Math.abs(ls - spanStart) < 1e-10 && Math.abs(le - spanEnd) < 1e-10) {
            femLeft += q * L * L / 12
            femRight += q * L * L / 12
          } else {
            // Partial: integrate numerically with 100 sub-divisions
            const n = 100
            const dx = (le - ls) / n
            for (let i = 0; i < n; i++) {
              const xMid = ls + (i + 0.5) * dx - spanStart
              const dP = q * dx
              const a = xMid
              const b = L - xMid
              femLeft += dP * a * b * b / (L * L)
              femRight += dP * a * a * b / (L * L)
            }
          }
        }
        break
      }

      case 'distributed_trapezoidal': {
        const q1 = Number(load.q1)
        const q2 = Number(load.q2)
        const ls = Math.max(Number(load.start), spanStart)
        const le = Math.min(Number(load.end), spanEnd)
        if (le > ls) {
          const loadLen = Number(load.end) - Number(load.start)
          const n = 100
          const dx = (le - ls) / n
          for (let i = 0; i < n; i++) {
            const xAbs = ls + (i + 0.5) * dx
            const t = (xAbs - Number(load.start)) / loadLen
            const qx = q1 + (q2 - q1) * t
            const dP = qx * dx
            const a = xAbs - spanStart
            const b = L - a
            femLeft += dP * a * b * b / (L * L)
            femRight += dP * a * a * b / (L * L)
          }
        }
        break
      }

      case 'moment': {
        const Mc = Number(load.value)
        const pos = Number(load.position)
        if (pos > spanStart && pos < spanEnd) {
          const a = pos - spanStart
          const b = spanEnd - pos
          femLeft += Mc * b * (2 * a - b) / (L * L)
          femRight += Mc * a * (2 * b - a) / (L * L)
        }
        break
      }
    }
  }

  return { femLeft: sanitizeNumber(femLeft), femRight: sanitizeNumber(femRight) }
}

/**
 * Solve tridiagonal system using Thomas algorithm.
 * @param {number[]} a - Sub-diagonal
 * @param {number[]} b - Main diagonal
 * @param {number[]} c - Super-diagonal
 * @param {number[]} d - Right-hand side
 * @returns {number[]} Solution vector
 */
function solveTridiagonal(a, b, c, d) {
  const n = b.length
  const cp = new Array(n)
  const dp = new Array(n)
  const x = new Array(n)

  // Forward sweep
  cp[0] = c[0] / b[0]
  dp[0] = d[0] / b[0]

  for (let i = 1; i < n; i++) {
    const m = b[i] - a[i] * cp[i - 1]
    if (Math.abs(m) < 1e-15) {
      // Singular system
      return new Array(n).fill(0)
    }
    cp[i] = i < n - 1 ? c[i] / m : 0
    dp[i] = (d[i] - a[i] * dp[i - 1]) / m
  }

  // Back substitution
  x[n - 1] = dp[n - 1]
  for (let i = n - 2; i >= 0; i--) {
    x[i] = dp[i] - cp[i] * x[i + 1]
  }

  return x.map(sanitizeNumber)
}

/**
 * Solve a continuous beam.
 *
 * @param {number[]} supports - Sorted array of support positions [x0, x1, x2, ...]
 * @param {object[]} loads - Array of load definitions
 * @returns {{
 *   reactions: { position: number, force: number }[],
 *   supportMoments: number[],
 * }}
 */
export function solveContinuousBeam(supports, loads) {
  const n = supports.length // number of supports
  const numSpans = n - 1

  if (numSpans < 1) {
    return { reactions: [], supportMoments: [] }
  }

  // If only 2 supports, it's simply supported — delegate
  if (numSpans === 1) {
    const L = supports[1] - supports[0]
    // Sum moments about support 0
    let totalMoment = 0
    let totalForce = 0
    for (const load of loads) {
      const res = loadResultantAbout(load, supports[0])
      totalMoment += res.momentAboutRef
      totalForce += res.force
    }
    const Rb = sanitizeNumber(totalMoment / L)
    const Ra = sanitizeNumber(totalForce - Rb)
    return {
      reactions: [
        { position: supports[0], force: Ra },
        { position: supports[1], force: Rb },
      ],
      supportMoments: [0, 0],
    }
  }

  // Span lengths
  const spanLengths = []
  for (let i = 0; i < numSpans; i++) {
    spanLengths.push(supports[i + 1] - supports[i])
  }

  // Fixed-end moments for each span
  const fems = []
  for (let i = 0; i < numSpans; i++) {
    fems.push(fixedEndMoments(supports[i], supports[i + 1], loads))
  }

  // Build tridiagonal system for interior support moments (M1..Mn-2)
  // Three Moment Equation: L_i * M_{i-1} + 2*(L_i + L_{i+1}) * M_i + L_{i+1} * M_{i+1} = -6 * (...)
  const numInterior = n - 2 // interior supports (not first and last)

  if (numInterior === 0) {
    // Should not reach here since numSpans >= 2 means n >= 3
    return {
      reactions: supports.map(s => ({ position: s, force: 0 })),
      supportMoments: supports.map(() => 0),
    }
  }

  const aCoeff = new Array(numInterior).fill(0) // sub-diagonal
  const bCoeff = new Array(numInterior).fill(0) // main diagonal
  const cCoeff = new Array(numInterior).fill(0) // super-diagonal
  const dCoeff = new Array(numInterior).fill(0) // RHS

  for (let i = 0; i < numInterior; i++) {
    const spanIdx = i // span to the left of interior support i+1
    const Li = spanLengths[spanIdx]
    const Li1 = spanLengths[spanIdx + 1]

    aCoeff[i] = Li
    bCoeff[i] = 2 * (Li + Li1)
    cCoeff[i] = Li1

    // RHS: 6 * (FEM_right_i/L_i + FEM_left_{i+1}/L_{i+1})
    // Using the three moment equation: 6*(A_i*a_i/L_i + A_{i+1}*b_{i+1}/L_{i+1})
    dCoeff[i] = 6 * (fems[spanIdx].femRight / Li + fems[spanIdx + 1].femLeft / Li1)
  }

  // M_0 = 0, M_{n-1} = 0 (simple supports at ends)
  const interiorMoments = solveTridiagonal(aCoeff, bCoeff, cCoeff, dCoeff)

  // Full support moments array
  const supportMoments = [0, ...interiorMoments, 0]

  // Calculate reactions from equilibrium of each span
  const reactions = new Array(n).fill(0)

  for (let i = 0; i < numSpans; i++) {
    const Li = spanLengths[i]
    const Mi = supportMoments[i]
    const Mi1 = supportMoments[i + 1]

    // Simple beam reaction for loads on this span
    let spanForce = 0
    let spanMomentAboutLeft = 0

    for (const load of loads) {
      const contrib = spanLoadContribution(load, supports[i], supports[i + 1])
      spanForce += contrib.force
      spanMomentAboutLeft += contrib.momentAboutLeft
    }

    // Reaction at right support of span i
    const Ri1 = sanitizeNumber((spanMomentAboutLeft + Mi - Mi1) / Li)
    // Reaction at left support of span i
    const Ri = sanitizeNumber(spanForce - Ri1)

    reactions[i] += Ri
    reactions[i + 1] += Ri1
  }

  return {
    reactions: supports.map((pos, idx) => ({
      position: pos,
      force: sanitizeNumber(reactions[idx]),
    })),
    supportMoments,
  }
}

/**
 * Calculate load resultant about a reference point.
 * @param {object} load
 * @param {number} refPoint
 * @returns {{ force: number, momentAboutRef: number }}
 */
function loadResultantAbout(load, refPoint) {
  switch (load.type) {
    case 'point': {
      const P = Number(load.value)
      const a = Number(load.position)
      return { force: P, momentAboutRef: P * (a - refPoint) }
    }
    case 'distributed_uniform': {
      const q = Number(load.value)
      const a = Number(load.start)
      const b = Number(load.end)
      const totalForce = q * (b - a)
      const centroid = (a + b) / 2
      return { force: totalForce, momentAboutRef: totalForce * (centroid - refPoint) }
    }
    case 'distributed_trapezoidal': {
      const q1 = Number(load.q1)
      const q2 = Number(load.q2)
      const a = Number(load.start)
      const b = Number(load.end)
      const len = b - a
      const fUnif = q1 * len
      const fTri = (q2 - q1) * len / 2
      const cUnif = (a + b) / 2
      const cTri = a + (2 / 3) * len
      return {
        force: fUnif + fTri,
        momentAboutRef: fUnif * (cUnif - refPoint) + fTri * (cTri - refPoint),
      }
    }
    case 'moment': {
      const M = Number(load.value)
      return { force: 0, momentAboutRef: -M }
    }
    default:
      return { force: 0, momentAboutRef: 0 }
  }
}

/**
 * Calculate the contribution of a load within a specific span.
 * Only considers the portion of the load that falls within [spanStart, spanEnd].
 *
 * @param {object} load
 * @param {number} spanStart
 * @param {number} spanEnd
 * @returns {{ force: number, momentAboutLeft: number }}
 */
function spanLoadContribution(load, spanStart, spanEnd) {
  switch (load.type) {
    case 'point': {
      const P = Number(load.value)
      const pos = Number(load.position)
      if (pos >= spanStart && pos <= spanEnd) {
        return { force: P, momentAboutLeft: P * (pos - spanStart) }
      }
      return { force: 0, momentAboutLeft: 0 }
    }

    case 'distributed_uniform': {
      const q = Number(load.value)
      const ls = Math.max(Number(load.start), spanStart)
      const le = Math.min(Number(load.end), spanEnd)
      if (le > ls) {
        const force = q * (le - ls)
        const centroid = (ls + le) / 2
        return { force, momentAboutLeft: force * (centroid - spanStart) }
      }
      return { force: 0, momentAboutLeft: 0 }
    }

    case 'distributed_trapezoidal': {
      const q1 = Number(load.q1)
      const q2 = Number(load.q2)
      const loadStart = Number(load.start)
      const loadEnd = Number(load.end)
      const loadLen = loadEnd - loadStart
      const ls = Math.max(loadStart, spanStart)
      const le = Math.min(loadEnd, spanEnd)
      if (le > ls) {
        // Numerical integration
        const n = 100
        const dx = (le - ls) / n
        let force = 0
        let moment = 0
        for (let i = 0; i < n; i++) {
          const xMid = ls + (i + 0.5) * dx
          const t = (xMid - loadStart) / loadLen
          const qx = q1 + (q2 - q1) * t
          const dP = qx * dx
          force += dP
          moment += dP * (xMid - spanStart)
        }
        return { force: sanitizeNumber(force), momentAboutLeft: sanitizeNumber(moment) }
      }
      return { force: 0, momentAboutLeft: 0 }
    }

    case 'moment': {
      const M = Number(load.value)
      const pos = Number(load.position)
      if (pos >= spanStart && pos <= spanEnd) {
        return { force: 0, momentAboutLeft: -M }
      }
      return { force: 0, momentAboutLeft: 0 }
    }

    default:
      return { force: 0, momentAboutLeft: 0 }
  }
}

export { shearAt, momentAt }
