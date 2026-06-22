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
  PROPPED_CANTILEVER: 'propped_cantilever',
  CONTINUOUS: 'continuous',
}

/** Human-readable labels for beam types (Portuguese) */
export const BEAM_TYPE_LABELS = {
  [BEAM_TYPES.SIMPLY_SUPPORTED]: 'Simplesmente Apoiada',
  [BEAM_TYPES.CANTILEVER]: 'Balanço (Engastada-Livre)',
  [BEAM_TYPES.OVERHANGING]: 'Com Balanço',
  [BEAM_TYPES.PROPPED_CANTILEVER]: 'Apoiada-Engastada',
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

/** Moment of inertia input units */
export const INERTIA_UNITS = {
  CM4: 'cm4',
  MM4: 'mm4',
}

/** Human-readable labels for inertia units */
export const INERTIA_UNIT_LABELS = {
  [INERTIA_UNITS.CM4]: 'cm⁴',
  [INERTIA_UNITS.MM4]: 'mm⁴',
}

/** Common material presets */
export const MATERIAL_PRESETS = {
  ALUMINUM: { name: 'Alumínio', E: 69, color: '#f59e0b' },
  STEEL: { name: 'Aço', E: 200, color: '#3b82f6' },
}

/** Parametric analysis types */
export const ANALYSIS_TYPES = {
  MAX_DEFLECTION: 'max_deflection',
  STRAIN_ENERGY: 'strain_energy',
  CASTIGLIANO_DISPLACEMENT: 'castigliano_displacement',
  DEFLECTION_SLOPE_VS_X: 'deflection_slope_vs_x',
}

/** Human-readable labels for analysis types */
export const ANALYSIS_TYPE_LABELS = {
  [ANALYSIS_TYPES.MAX_DEFLECTION]: 'Deflexão Máxima vs L',
  [ANALYSIS_TYPES.STRAIN_ENERGY]: 'Energia de Deformação vs L',
  [ANALYSIS_TYPES.CASTIGLIANO_DISPLACEMENT]: 'Deslocamento (Castigliano)',
  [ANALYSIS_TYPES.DEFLECTION_SLOPE_VS_X]: 'Deflexão e Inclinação vs x',
}

/** Parametric sweep variable types */
export const SWEEP_VARIABLES = {
  LENGTH: 'length',
  SUPPORT_POSITION: 'support_position',
}
