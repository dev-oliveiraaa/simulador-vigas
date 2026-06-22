/**
 * Beam solver for isostatic configurations:
 * - Simply supported (bi-apoiada)
 * - Cantilever (engastada-livre)
 * - Overhanging (com balanço)
 *
 * Supports: point loads, uniform/trapezoidal distributed loads, concentrated moments.
 */

import { sanitizeNumber } from './validators.js'

/**
 * Calculate the resultant force and moment contribution of a load about a point.
 * @param {object} load - Load definition
 * @param {number} refPoint - Reference point for moment calculation
 * @returns {{ force: number, momentAboutRef: number }}
 */
function loadResultant(load, refPoint) {
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

      // Decompose into uniform (q1) + triangular (q2 - q1)
      const forceUniform = q1 * len
      const forceTriangle = (q2 - q1) * len / 2
      const totalForce = forceUniform + forceTriangle

      const centroidUniform = (a + b) / 2
      const centroidTriangle = a + (2 / 3) * len // triangle load increases towards b
      const momentUniform = forceUniform * (centroidUniform - refPoint)
      const momentTriangle = forceTriangle * (centroidTriangle - refPoint)

      return { force: totalForce, momentAboutRef: momentUniform + momentTriangle }
    }

    case 'moment': {
      // A moment does not contribute a force, only a moment
      const M = Number(load.value)
      return { force: 0, momentAboutRef: -M }
    }

    default:
      return { force: 0, momentAboutRef: 0 }
  }
}

/**
 * Solve a simply supported beam (supports at positions a and b).
 * @param {number} L - Total beam length
 * @param {object[]} loads - Array of load definitions
 * @param {number} supportA - Position of support A (default 0)
 * @param {number} supportB - Position of support B (default L)
 * @returns {{ Ra: number, Rb: number }}
 */
export function solveSimplySupported(L, loads, supportA = 0, supportB = L) {
  const span = supportB - supportA
  if (span <= 0) {
    return { Ra: 0, Rb: 0 }
  }

  // Sum moments about A to find Rb
  let totalMomentAboutA = 0
  let totalForce = 0

  for (const load of loads) {
    const { force, momentAboutRef } = loadResultant(load, supportA)
    totalMomentAboutA += momentAboutRef
    totalForce += force
  }

  const Rb = sanitizeNumber(totalMomentAboutA / span)
  const Ra = sanitizeNumber(totalForce - Rb)

  return { Ra, Rb }
}

/**
 * Solve a cantilever beam (fixed at x=0, free at x=L).
 * @param {number} L - Total beam length
 * @param {object[]} loads - Array of load definitions
 * @returns {{ R: number, M: number }} Reaction force and moment at the fixed end
 */
export function solveCantilever(L, loads) {
  let totalForce = 0
  let totalMoment = 0

  for (const load of loads) {
    const { force, momentAboutRef } = loadResultant(load, 0)
    totalForce += force
    totalMoment += momentAboutRef
  }

  // At fixed end: R balances all vertical forces, M balances all moments
  return {
    R: sanitizeNumber(totalForce),
    M: sanitizeNumber(totalMoment),
  }
}

/**
 * Calculate shear force V at position x.
 * @param {number} x - Position along the beam
 * @param {object[]} loads - Array of load definitions
 * @param {object[]} reactions - Array of { position, force } for reaction forces
 * @returns {number} Shear force at x
 */
export function shearAt(x, loads, reactions) {
  let V = 0

  // Add reactions (upward positive)
  for (const r of reactions) {
    if (r.position <= x) {
      V += r.force
    }
  }

  // Subtract applied loads (downward positive in loads)
  for (const load of loads) {
    switch (load.type) {
      case 'point': {
        const a = Number(load.position)
        const P = Number(load.value)
        if (a <= x) {
          V -= P
        }
        break
      }

      case 'distributed_uniform': {
        const a = Number(load.start)
        const b = Number(load.end)
        const q = Number(load.value)
        if (x >= b) {
          V -= q * (b - a)
        } else if (x > a) {
          V -= q * (x - a)
        }
        break
      }

      case 'distributed_trapezoidal': {
        const a = Number(load.start)
        const b = Number(load.end)
        const q1 = Number(load.q1)
        const q2 = Number(load.q2)
        const len = b - a
        if (x >= b) {
          V -= (q1 + q2) * len / 2
        } else if (x > a) {
          const dx = x - a
          const qx = q1 + (q2 - q1) * dx / len
          V -= (q1 + qx) * dx / 2
        }
        break
      }

      case 'moment':
        // Moments don't affect shear
        break
    }
  }

  return sanitizeNumber(V)
}

/**
 * Calculate bending moment M at position x.
 * @param {number} x - Position along the beam
 * @param {object[]} loads - Array of load definitions
 * @param {object[]} reactions - Array of { position, force } for reaction forces
 * @param {object[]} [reactionMoments=[]] - Array of { position, moment } for reaction moments
 * @returns {number} Bending moment at x
 */
export function momentAt(x, loads, reactions, reactionMoments = []) {
  let M = 0

  // Add reaction forces contributions
  for (const r of reactions) {
    if (r.position <= x) {
      M += r.force * (x - r.position)
    }
  }

  // Add reaction moments (for cantilevers)
  for (const rm of reactionMoments) {
    if (rm.position <= x) {
      M -= rm.moment
    }
  }

  // Subtract applied loads contributions
  for (const load of loads) {
    switch (load.type) {
      case 'point': {
        const a = Number(load.position)
        const P = Number(load.value)
        if (a <= x) {
          M -= P * (x - a)
        }
        break
      }

      case 'distributed_uniform': {
        const a = Number(load.start)
        const b = Number(load.end)
        const q = Number(load.value)
        if (x >= b) {
          const resultant = q * (b - a)
          const centroid = (a + b) / 2
          M -= resultant * (x - centroid)
        } else if (x > a) {
          const dx = x - a
          const resultant = q * dx
          M -= resultant * (dx / 2)
        }
        break
      }

      case 'distributed_trapezoidal': {
        const a = Number(load.start)
        const b = Number(load.end)
        const q1 = Number(load.q1)
        const q2 = Number(load.q2)
        const len = b - a
        if (x >= b) {
          // Uniform part
          const fUnif = q1 * len
          const cUnif = (a + b) / 2
          // Triangular part
          const fTri = (q2 - q1) * len / 2
          const cTri = a + (2 / 3) * len
          M -= fUnif * (x - cUnif) + fTri * (x - cTri)
        } else if (x > a) {
          const dx = x - a
          const qx = q1 + (q2 - q1) * dx / len
          // Uniform part up to x
          const fUnif = q1 * dx
          const cUnif = a + dx / 2
          // Triangular part up to x
          const fTri = (qx - q1) * dx / 2
          const cTri = a + (2 / 3) * dx
          M -= fUnif * (x - cUnif) + fTri * (x - cTri)
        }
        break
      }

      case 'moment': {
        const a = Number(load.position)
        const Mc = Number(load.value)
        if (a <= x) {
          M += Mc
        }
        break
      }
    }
  }

  return sanitizeNumber(M)
}

/**
 * Solve a propped cantilever beam (simple support at one end, fixed at other).
 *
 * Statically indeterminate to the 1st degree.
 * Uses compatibility: treat as cantilever from the fixed end,
 * then find the reaction at the simple support that makes deflection = 0 there.
 *
 * @param {number} L - Total beam length
 * @param {object[]} loads - Array of load definitions
 * @param {number} supportPos - Position of the simple support
 * @param {number} fixedPos - Position of the fixed end (engaste)
 * @returns {{ Ra: number, Rb: number, Mb: number }}
 *   Ra = reaction at simple support, Rb = reaction at fixed end, Mb = moment at fixed end
 */
export function solveProppedCantilever(L, loads, supportPos, fixedPos) {
  // We treat the beam as a cantilever fixed at fixedPos.
  // The redundant is the reaction Ra at supportPos.
  // We need: delta_loads(supportPos) + Ra * delta_unit(supportPos) = 0
  //   where delta_loads = deflection at supportPos due to loads only (cantilever)
  //   and delta_unit = deflection at supportPos due to unit load at supportPos (cantilever)

  const numPoints = 1001
  const xValues = []
  for (let i = 0; i < numPoints; i++) {
    xValues.push((i / (numPoints - 1)) * L)
  }

  // Determine if fixed end is at left (x=0) or right (x=L)
  const fixedAtLeft = fixedPos < supportPos

  // --- Deflection due to applied loads (cantilever from fixed end) ---
  // Solve cantilever reactions at fixed end
  const cantReactions = []
  const cantReactionMoments = []

  if (fixedAtLeft) {
    const { R, M } = solveCantilever(L, loads)
    cantReactions.push({ position: fixedPos, force: R })
    cantReactionMoments.push({ position: fixedPos, moment: M })
  } else {
    // Fixed at right: need to treat loads with reversed reference
    // Sum forces and moments about fixedPos
    let totalForce = 0
    let totalMoment = 0
    for (const load of loads) {
      const res = loadResultant(load, fixedPos)
      totalForce += res.force
      totalMoment += res.momentAboutRef
    }
    cantReactions.push({ position: fixedPos, force: totalForce })
    cantReactionMoments.push({ position: fixedPos, moment: totalMoment })
  }

  // Compute M(x) due to loads only
  const mLoads = xValues.map(x =>
    momentAt(x, loads, cantReactions, cantReactionMoments)
  )

  // Integrate M(x)/EI to get slope and deflection (use EI=1 since it cancels)
  const slopeLoads = integrateFromFixed(xValues, mLoads, fixedAtLeft)
  const deflLoads = integrateFromFixed(xValues, slopeLoads, fixedAtLeft)

  // --- Deflection due to unit upward load at supportPos ---
  const unitLoads = [{ type: 'point', position: supportPos, value: -1 }]
  // Negative because upward reaction counteracts downward convention

  const unitCantReactions = []
  const unitCantReactionMoments = []

  if (fixedAtLeft) {
    const { R, M } = solveCantilever(L, unitLoads)
    unitCantReactions.push({ position: fixedPos, force: R })
    unitCantReactionMoments.push({ position: fixedPos, moment: M })
  } else {
    let totalForce = 0
    let totalMoment = 0
    for (const load of unitLoads) {
      const res = loadResultant(load, fixedPos)
      totalForce += res.force
      totalMoment += res.momentAboutRef
    }
    unitCantReactions.push({ position: fixedPos, force: totalForce })
    unitCantReactionMoments.push({ position: fixedPos, moment: totalMoment })
  }

  const mUnit = xValues.map(x =>
    momentAt(x, unitLoads, unitCantReactions, unitCantReactionMoments)
  )

  const slopeUnit = integrateFromFixed(xValues, mUnit, fixedAtLeft)
  const deflUnit = integrateFromFixed(xValues, slopeUnit, fixedAtLeft)

  // Find deflection at supportPos
  const supportIdx = findClosestIndex(xValues, supportPos)
  const deltaLoads = deflLoads[supportIdx]
  const deltaUnit = deflUnit[supportIdx]

  // Ra * deltaUnit + deltaLoads = 0  =>  Ra = -deltaLoads / deltaUnit
  let Ra = 0
  if (Math.abs(deltaUnit) > 1e-15) {
    Ra = -deltaLoads / deltaUnit
  }

  // Total vertical equilibrium: Ra + Rb = total downward load
  let totalDownward = 0
  for (const load of loads) {
    const res = loadResultant(load, 0)
    totalDownward += res.force
  }
  const Rb = sanitizeNumber(totalDownward - Ra)
  Ra = sanitizeNumber(Ra)

  // Moment at fixed end: sum moments about fixedPos
  let Mb = 0
  for (const load of loads) {
    const res = loadResultant(load, fixedPos)
    Mb += res.momentAboutRef
  }
  // Subtract Ra contribution
  Mb -= Ra * (supportPos - fixedPos)
  Mb = sanitizeNumber(Mb)

  return { Ra, Rb, Mb }
}

/**
 * Integrate an array from the fixed end using trapezoidal rule.
 * @param {number[]} xValues
 * @param {number[]} values
 * @param {boolean} fromLeft - If true, integrate from left (x=0); otherwise from right (x=L)
 * @returns {number[]}
 */
function integrateFromFixed(xValues, values, fromLeft) {
  const n = xValues.length
  const result = new Array(n).fill(0)

  if (fromLeft) {
    for (let i = 1; i < n; i++) {
      const dx = xValues[i] - xValues[i - 1]
      result[i] = result[i - 1] + (values[i - 1] + values[i]) * dx / 2
    }
  } else {
    // Integrate from right to left
    for (let i = n - 2; i >= 0; i--) {
      const dx = xValues[i + 1] - xValues[i]
      result[i] = result[i + 1] - (values[i] + values[i + 1]) * dx / 2
    }
  }

  return result
}

/**
 * Find the index of the closest value in an array.
 * @param {number[]} arr
 * @param {number} target
 * @returns {number}
 */
function findClosestIndex(arr, target) {
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
