export type ShapeKind = 'square' | 'circle' | 'triangle'

export interface Cell {
  angle: number
  progress: number
  sigma: number
  speed: number
  startR: number
  wobble: number
}

/** Outer-rim cells that ease inward toward the core (small, high-contrast specks). */
export interface HaloCell {
  angle: number
  /** Normalized radius at the core “attractor” when progress reaches 1. */
  attractR: number
  progress: number
  /** Scales dial `haloCellSigma` for footprint variation. */
  sigmaMul: number
  speed: number
  /** Normalized radius where the cell appears at progress 0. */
  startR: number
  wobble: number
}

export interface Square {
  driftAmp: number
  driftFreqX: number
  driftFreqY: number
  driftPhaseX: number
  driftPhaseY: number
  idx: number
  noiseOff: number
  progress: number
  shapeA: ShapeKind
  shapeB: ShapeKind
  sizeVar: number
  speed: number
  t1: number
  t2: number
  t3: number
  t4: number
  x: number
  y: number
}

export interface CellWorld {
  cutoff: number
  envelope: number
  twoSig2: number
  worldX: number
  worldY: number
}

export interface TrailPoint {
  born: number
  x: number
  y: number
}

/** One disturbance on the water surface — rings expand from (x,y) since `born`. */
export interface HoverRippleSpawn {
  born: number
  x: number
  y: number
}

export interface CursorPos {
  active: boolean
  x: number
  y: number
}

export interface SquareField {
  cx: number
  cy: number
  half: number
  morphT: number
  noiseOff: number
  scale: number
  shapeA: ShapeKind
  shapeB: ShapeKind
}

export interface TrailSample {
  weight: number
  x: number
  y: number
}
