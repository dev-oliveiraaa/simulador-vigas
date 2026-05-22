/**
 * Unit conversion utilities.
 *
 * The simulator accepts user-friendly units but calculates
 * internally in a consistent unit system (kN, m, kN/m²).
 */

/**
 * Convert elastic modulus from GPa to kN/m².
 * 1 GPa = 1e6 kN/m²
 * @param {number} gpa - Elastic modulus in GPa
 * @returns {number} Elastic modulus in kN/m²
 */
export function gpaTokNm2(gpa) {
  return gpa * 1e6
}

/**
 * Convert moment of inertia from cm⁴ to m⁴.
 * 1 cm⁴ = 1e-8 m⁴
 * @param {number} cm4 - Moment of inertia in cm⁴
 * @returns {number} Moment of inertia in m⁴
 */
export function cm4ToM4(cm4) {
  return cm4 * 1e-8
}

/**
 * Convert section modulus from cm³ to m³.
 * 1 cm³ = 1e-6 m³
 * @param {number} cm3 - Section modulus in cm³
 * @returns {number} Section modulus in m³
 */
export function cm3ToM3(cm3) {
  return cm3 * 1e-6
}

/**
 * Convert deflection from m to mm.
 * @param {number} meters - Deflection in meters
 * @returns {number} Deflection in mm
 */
export function mToMm(meters) {
  return meters * 1000
}

/**
 * Convert stress from kN/m² to MPa.
 * 1 kN/m² = 0.001 MPa
 * @param {number} knm2 - Stress in kN/m²
 * @returns {number} Stress in MPa
 */
export function knm2ToMPa(knm2) {
  return knm2 / 1000
}
