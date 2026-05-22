/**
 * Input validation for beam configurations.
 * Returns an array of error messages in Portuguese.
 */

/**
 * Validate beam configuration.
 * @param {object} config - Beam configuration
 * @param {string} config.type - Beam type
 * @param {number} config.length - Total beam length (m)
 * @param {number[]} [config.supports] - Support positions (m)
 * @param {number|null} [config.E] - Elastic modulus (GPa)
 * @param {number|null} [config.I] - Moment of inertia (cm⁴)
 * @param {number|null} [config.W] - Section modulus (cm³)
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validateConfig(config) {
  const errors = []

  if (config.length === undefined || config.length === null || config.length === '') {
    errors.push('O comprimento L é obrigatório.')
    return errors
  }

  const L = Number(config.length)

  if (isNaN(L) || L <= 0) {
    errors.push('O comprimento deve ser maior que zero.')
  }

  if (config.E !== null && config.E !== undefined && config.E !== '') {
    const E = Number(config.E)
    if (isNaN(E) || E <= 0) {
      errors.push('O módulo de elasticidade E deve ser positivo.')
    }
  }

  if (config.I !== null && config.I !== undefined && config.I !== '') {
    const I = Number(config.I)
    if (isNaN(I) || I <= 0) {
      errors.push('O momento de inércia I deve ser positivo.')
    }
  }

  if (config.W !== null && config.W !== undefined && config.W !== '') {
    const W = Number(config.W)
    if (isNaN(W) || W <= 0) {
      errors.push('O módulo de resistência W deve ser positivo.')
    }
  }

  if (config.supports) {
    for (let i = 0; i < config.supports.length; i++) {
      const s = Number(config.supports[i])
      if (isNaN(s) || s < 0 || s > L) {
        errors.push(
          `A posição do apoio ${i + 1} (${config.supports[i]} m) está fora do intervalo [0, ${L}].`
        )
      }
    }
  }

  return errors
}

/**
 * Validate a single load.
 * @param {object} load - Load definition
 * @param {number} beamLength - Total beam length (m)
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validateLoad(load, beamLength) {
  const errors = []
  const L = Number(beamLength)

  switch (load.type) {
    case 'point': {
      const pos = Number(load.position)
      const value = Number(load.value)
      if (isNaN(pos)) {
        errors.push('A posição da carga pontual é obrigatória.')
      } else if (pos < 0 || pos > L) {
        errors.push(
          `A posição da carga pontual (${pos} m) está fora do intervalo [0, ${L}].`
        )
      }
      if (isNaN(value) || value === 0) {
        errors.push('O valor da carga pontual deve ser diferente de zero.')
      }
      break
    }

    case 'distributed_uniform': {
      const start = Number(load.start)
      const end = Number(load.end)
      const value = Number(load.value)
      if (isNaN(start) || isNaN(end)) {
        errors.push('As posições inicial e final da carga distribuída são obrigatórias.')
      } else {
        if (start < 0 || start > L) {
          errors.push(`A posição inicial (${start} m) está fora do intervalo [0, ${L}].`)
        }
        if (end < 0 || end > L) {
          errors.push(`A posição final (${end} m) está fora do intervalo [0, ${L}].`)
        }
        if (start >= end) {
          errors.push('A posição final deve ser maior que a posição inicial.')
        }
      }
      if (isNaN(value) || value === 0) {
        errors.push('O valor da carga distribuída deve ser diferente de zero.')
      }
      break
    }

    case 'distributed_trapezoidal': {
      const start = Number(load.start)
      const end = Number(load.end)
      const q1 = Number(load.q1)
      const q2 = Number(load.q2)
      if (isNaN(start) || isNaN(end)) {
        errors.push('As posições inicial e final da carga trapezoidal são obrigatórias.')
      } else {
        if (start < 0 || start > L) {
          errors.push(`A posição inicial (${start} m) está fora do intervalo [0, ${L}].`)
        }
        if (end < 0 || end > L) {
          errors.push(`A posição final (${end} m) está fora do intervalo [0, ${L}].`)
        }
        if (start >= end) {
          errors.push('A posição final deve ser maior que a posição inicial.')
        }
      }
      if (isNaN(q1) && isNaN(q2)) {
        errors.push('Os valores q₁ e q₂ são obrigatórios.')
      }
      break
    }

    case 'moment': {
      const pos = Number(load.position)
      const value = Number(load.value)
      if (isNaN(pos)) {
        errors.push('A posição do momento concentrado é obrigatória.')
      } else if (pos < 0 || pos > L) {
        errors.push(
          `A posição do momento (${pos} m) está fora do intervalo [0, ${L}].`
        )
      }
      if (isNaN(value) || value === 0) {
        errors.push('O valor do momento deve ser diferente de zero.')
      }
      break
    }

    default:
      errors.push(`Tipo de carga desconhecido: "${load.type}".`)
  }

  return errors
}

/**
 * Sanitize a numeric value, replacing NaN/Infinity with 0.
 * @param {number} value
 * @returns {number}
 */
export function sanitizeNumber(value) {
  if (!isFinite(value) || isNaN(value)) return 0
  return value
}
