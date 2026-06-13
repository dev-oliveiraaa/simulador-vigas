/**
 * Strain energy and Castigliano's theorem calculations.
 *
 * Strain energy:  U = ∫ M²(x) / (2·E·I) dx
 * Castigliano:    δ = ∂U/∂P ≈ ΔU/ΔP  (numerical differentiation)
 *
 * References:
 * - Beer & Johnston, Mechanics of Materials, Ch. 11
 * - Hibbeler, Structural Analysis, Ch. 9
 */

import { sanitizeNumber } from './validators.js'
import { gpaTokNm2, cm4ToM4 } from '../utils/unitConversion.js'

/**
 * Calculate the strain energy U = ∫ M²(x) / (2·E·I) dx
 * using the trapezoidal rule.
 *
 * @param {number[]} xValues - Array of x positions along the beam (m)
 * @param {number[]} mValues - Array of bending moment values M(x) (kN·m)
 * @param {number} E - Elastic modulus in GPa
 * @param {number} I - Moment of inertia in cm⁴
 * @returns {number} Strain energy U in kN·m (= kJ)
 */
export function calculateStrainEnergy(xValues, mValues, E, I) {
  const n = xValues.length
  if (n < 2) return 0

  const EI = gpaTokNm2(E) * cm4ToM4(I) // kN·m²
  if (EI <= 0) return 0

  // U = ∫ M²/(2EI) dx — trapezoidal integration
  let U = 0
  for (let i = 1; i < n; i++) {
    const dx = xValues[i] - xValues[i - 1]
    const f0 = (mValues[i - 1] ** 2) / (2 * EI)
    const f1 = (mValues[i] ** 2) / (2 * EI)
    U += (f0 + f1) * dx / 2
  }

  return sanitizeNumber(U)
}

/**
 * Calculate displacement at the point of load application using
 * Castigliano's Second Theorem: δ = ∂U/∂P.
 *
 * Uses central finite differences:
 *   δ ≈ (U(P+ΔP) - U(P-ΔP)) / (2·ΔP)
 *
 * @param {Function} computeMoments - A function(P) that returns { xValues, mValues }
 *   for a given load magnitude P. This allows the caller to define the beam
 *   configuration and load placement while this function handles the differentiation.
 * @param {number} P - Current load magnitude (kN)
 * @param {number} E - Elastic modulus in GPa
 * @param {number} I - Moment of inertia in cm⁴
 * @param {number} [deltaP] - Perturbation for numerical differentiation (kN).
 *   Defaults to P/1000 or 0.001 if P is too small.
 * @returns {number} Displacement δ in meters
 */
export function calculateCastiglianoDisplacement(computeMoments, P, E, I, deltaP) {
  if (!deltaP) {
    deltaP = Math.abs(P) > 1 ? Math.abs(P) / 1000 : 0.001
  }

  // U(P + ΔP)
  const { xValues: xPlus, mValues: mPlus } = computeMoments(P + deltaP)
  const uPlus = calculateStrainEnergy(xPlus, mPlus, E, I)

  // U(P - ΔP)
  const { xValues: xMinus, mValues: mMinus } = computeMoments(P - deltaP)
  const uMinus = calculateStrainEnergy(xMinus, mMinus, E, I)

  // δ = ∂U/∂P ≈ (U+ - U-) / (2·ΔP)
  const displacement = (uPlus - uMinus) / (2 * deltaP)

  return sanitizeNumber(displacement)
}

/**
 * Calculate Castigliano displacement analytically using the integral form:
 *   δ = ∫ M(x) · (∂M/∂P)(x) / (E·I) dx
 *
 * For a single point load P, ∂M/∂P is the moment diagram with P=1.
 * This is more accurate than numerical differentiation.
 *
 * @param {number[]} xValues - Array of x positions (m)
 * @param {number[]} mValues - Moment values M(x) with actual load P
 * @param {number[]} mUnitValues - Moment values m(x) with unit load P=1
 * @param {number} E - Elastic modulus in GPa
 * @param {number} I - Moment of inertia in cm⁴
 * @returns {number} Displacement δ in meters
 */
export function calculateCastiglianoAnalytical(xValues, mValues, mUnitValues, E, I) {
  const n = xValues.length
  if (n < 2) return 0

  const EI = gpaTokNm2(E) * cm4ToM4(I) // kN·m²
  if (EI <= 0) return 0

  // δ = ∫ M(x)·m(x) / (EI) dx — trapezoidal integration
  let delta = 0
  for (let i = 1; i < n; i++) {
    const dx = xValues[i] - xValues[i - 1]
    const f0 = (mValues[i - 1] * mUnitValues[i - 1]) / EI
    const f1 = (mValues[i] * mUnitValues[i]) / EI
    delta += (f0 + f1) * dx / 2
  }

  return sanitizeNumber(delta)
}
