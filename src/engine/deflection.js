/**
 * Deflection calculation via double numerical integration of M(x)/(EI).
 *
 * The differential equation: EI·y'' = M(x)
 * Integration is done using the trapezoidal rule with boundary conditions.
 */

import { sanitizeNumber } from './validators.js'
import { NUM_POINTS } from '../utils/constants.js'
import { gpaTokNm2, cm4ToM4 } from '../utils/unitConversion.js'

/**
 * Calculate deflection curve δ(x) by double integration of M(x)/EI.
 *
 * @param {number[]} xValues - Array of x positions
 * @param {number[]} mValues - Array of moment values M(x) at each x position
 * @param {number} E - Elastic modulus in GPa
 * @param {number} I - Moment of inertia in cm⁴
 * @param {number[]} supportPositions - Positions where δ = 0 (boundary conditions)
 * @returns {number[]} Array of deflection values in meters
 */
export function calculateDeflection(xValues, mValues, E, I, supportPositions) {
  const n = xValues.length
  if (n < 2) return new Array(n).fill(0)

  const EI = gpaTokNm2(E) * cm4ToM4(I) // kN·m²
  if (EI <= 0) return new Array(n).fill(0)

  // M(x) / EI = y''(x)
  const curvature = mValues.map(m => sanitizeNumber(m / EI))

  // First integration: y'(x) = ∫ M(x)/EI dx + C1
  const slope = new Array(n).fill(0)
  for (let i = 1; i < n; i++) {
    const dx = xValues[i] - xValues[i - 1]
    // Trapezoidal rule
    slope[i] = slope[i - 1] + (curvature[i - 1] + curvature[i]) * dx / 2
  }

  // Second integration: y(x) = ∫ y'(x) dx + C2
  const deflectionRaw = new Array(n).fill(0)
  for (let i = 1; i < n; i++) {
    const dx = xValues[i] - xValues[i - 1]
    deflectionRaw[i] = deflectionRaw[i - 1] + (slope[i - 1] + slope[i]) * dx / 2
  }

  // Apply boundary conditions: δ = 0 at support positions
  // Find the indices closest to each support
  const supportIndices = supportPositions.map(sp => {
    let bestIdx = 0
    let bestDist = Math.abs(xValues[0] - sp)
    for (let i = 1; i < n; i++) {
      const dist = Math.abs(xValues[i] - sp)
      if (dist < bestDist) {
        bestDist = dist
        bestIdx = i
      }
    }
    return bestIdx
  })

  // Sort unique indices
  const uniqueIndices = [...new Set(supportIndices)].sort((a, b) => a - b)

  if (uniqueIndices.length === 0) {
    // No supports — cantilever with fixed end at x=0
    // δ(0) = 0, slope(0) = 0 → raw values are already correct
    return deflectionRaw.map(sanitizeNumber)
  }

  if (uniqueIndices.length === 1) {
    // Single support — subtract the value at that support (δ = 0 there)
    // Also need slope BC. For cantilever: slope at fixed end = 0
    const idx = uniqueIndices[0]
    const offset = deflectionRaw[idx]
    return deflectionRaw.map(v => sanitizeNumber(v - offset))
  }

  // Two or more supports — use the first two to determine C1 and C2
  const i1 = uniqueIndices[0]
  const i2 = uniqueIndices[uniqueIndices.length - 1]

  // We need to adjust so that deflection = 0 at both support positions
  // y(x) = y_raw(x) + C1*x + C2
  // y(x_i1) = 0 → y_raw(x_i1) + C1*x_i1 + C2 = 0
  // y(x_i2) = 0 → y_raw(x_i2) + C1*x_i2 + C2 = 0

  const x1 = xValues[i1]
  const x2 = xValues[i2]
  const y1 = deflectionRaw[i1]
  const y2 = deflectionRaw[i2]

  let C1 = 0
  let C2 = 0

  if (Math.abs(x2 - x1) > 1e-10) {
    C1 = -(y2 - y1) / (x2 - x1)
    C2 = -(y1 + C1 * x1)
  }

  const deflection = xValues.map((x, i) =>
    sanitizeNumber(deflectionRaw[i] + C1 * x + C2)
  )

  return deflection
}

/**
 * Calculate deflection for a cantilever beam (fixed at x=0).
 * Boundary conditions: δ(0) = 0, δ'(0) = 0
 *
 * @param {number[]} xValues - Array of x positions
 * @param {number[]} mValues - Array of moment values M(x)
 * @param {number} E - Elastic modulus in GPa
 * @param {number} I - Moment of inertia in cm⁴
 * @returns {number[]} Array of deflection values in meters
 */
export function calculateCantileverDeflection(xValues, mValues, E, I) {
  const n = xValues.length
  if (n < 2) return new Array(n).fill(0)

  const EI = gpaTokNm2(E) * cm4ToM4(I)
  if (EI <= 0) return new Array(n).fill(0)

  const curvature = mValues.map(m => sanitizeNumber(m / EI))

  // First integration from x=0 with slope(0) = 0
  const slope = new Array(n).fill(0)
  for (let i = 1; i < n; i++) {
    const dx = xValues[i] - xValues[i - 1]
    slope[i] = slope[i - 1] + (curvature[i - 1] + curvature[i]) * dx / 2
  }

  // Second integration from x=0 with deflection(0) = 0
  const deflection = new Array(n).fill(0)
  for (let i = 1; i < n; i++) {
    const dx = xValues[i] - xValues[i - 1]
    deflection[i] = deflection[i - 1] + (slope[i - 1] + slope[i]) * dx / 2
  }

  return deflection.map(sanitizeNumber)
}
