/**
 * Constants — Shared configuration values for the beam simulator.
 */

/** Diagram color identifiers mapped to CSS custom properties */
export const DIAGRAM_COLORS = {
  shear: {
    stroke: 'var(--color-shear)',
    fill: 'var(--color-shear-fill)',
    label: 'Esforço Cortante',
    unit: 'kN',
  },
  moment: {
    stroke: 'var(--color-moment)',
    fill: 'var(--color-moment-fill)',
    label: 'Momento Fletor',
    unit: 'kN·m',
  },
  deflection: {
    stroke: 'var(--color-deflection)',
    fill: 'var(--color-deflection-fill)',
    label: 'Flecha Elástica',
    unit: 'mm',
  },
}

/** Beam support types */
export const BEAM_TYPES = {
  SIMPLY_SUPPORTED: 'simply_supported',
  CANTILEVER: 'cantilever',
  OVERHANGING: 'overhanging',
  CONTINUOUS: 'continuous',
}

/** Human-readable labels for beam types (Portuguese) */
export const BEAM_TYPE_LABELS = {
  [BEAM_TYPES.SIMPLY_SUPPORTED]: 'Simplesmente Apoiada',
  [BEAM_TYPES.CANTILEVER]: 'Balanço (Engastada-Livre)',
  [BEAM_TYPES.OVERHANGING]: 'Com Balanço',
  [BEAM_TYPES.CONTINUOUS]: 'Contínua',
}

/** Load types */
export const LOAD_TYPES = {
  POINT: 'point',
  DISTRIBUTED_UNIFORM: 'distributed_uniform',
  DISTRIBUTED_TRAPEZOIDAL: 'distributed_trapezoidal',
  MOMENT: 'moment',
}

/** Human-readable labels for load types (Portuguese) */
export const LOAD_TYPE_LABELS = {
  [LOAD_TYPES.POINT]: 'Carga Pontual',
  [LOAD_TYPES.DISTRIBUTED_UNIFORM]: 'Distribuída Uniforme',
  [LOAD_TYPES.DISTRIBUTED_TRAPEZOIDAL]: 'Distribuída Trapezoidal',
  [LOAD_TYPES.MOMENT]: 'Momento Concentrado',
}

/** Number of discretization points for diagram generation */
export const NUM_POINTS = 201

/** Default section properties */
export const DEFAULT_SECTION = {
  E: null, // GPa
  I: null, // cm⁴
  W: null, // cm³
}
