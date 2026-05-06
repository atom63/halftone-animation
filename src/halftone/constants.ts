import type { ShapeKind } from './types'

export const SPACING = 7
export const DOT_MIN = 0.2
export const DOT_MAX = 2

/** Default radius range for dots inside shape SDFs (independent of grid dots). */
export const SHAPE_DOT_MIN = DOT_MIN
export const SHAPE_DOT_MAX = DOT_MAX

export const R_INNER = 0.25
export const CORE_FREQ = 16.0
export const CORE_SPEED = 0.55
export const CORE_CONTRAST = 1.4
export const CORE_BREATHE = 0.045

/**
 * Core “continental” plates: jittered Voronoi cells give flat regions with hard
 * boundaries (globe-like) vs purely smooth sine noise.
 */
export const CORE_GLOBE_CELL_SCALE = 0.78
/** 0 = legacy smooth core only; 1 = full blend toward cellular plates. */
export const CORE_GLOBE_STRENGTH = 0.72
/**
 * How much high-frequency `noiseVal` modulates brightness inside each plate.
 * Boundaries stay set by the Voronoi field; this only adds halftone grain.
 */
export const CORE_GLOBE_MICRO = 0.34

/** Linear scroll of core noise in normalized space (per second). */
export const CORE_DRIFT_X = 0.48
export const CORE_DRIFT_Y = -0.32

/**
 * Seconds over which core drift wraps (`t % loop` for offset only). 0 = scroll forever with no wrap.
 */
export const CORE_DRIFT_LOOP_SEC = 0
export const R_RING1 = 0.32
export const R_RING1_W = 0.02
export const R_RING2 = 0.48
export const R_RING2_W = 0.018

export const CELL_COUNT = 9
export const CELL_SPAWN_R = 0.5
export const CELL_SIGMA = 0.026

export const OUT_CELL_COUNT = 7
export const OUT_CELL_SIGMA = 0.02

/** Infalling halo cells: outer spawn → core; keep footprint small vs main cells. */
export const HALO_CELL_COUNT = 14
export const HALO_CELL_SIGMA = 0.0075

export const SQ_COUNT = 3
export const SQ_HALF = 28
export const SQ_EDGE = 3.5

export const SHAPES: readonly ShapeKind[] = ['square', 'circle', 'triangle'] as const

export const TRAIL_MAX = 48
export const TRAIL_LIFE = 1.2
export const TRAIL_SIGMA = 0.025

/** Expanding hover ripples (Gaussian rings), separate from the smeared trail. */
export const HOVER_RIPPLE_SIGMA = 0.024
/** Normalized radius growth per second (× canvas width → px/s). */
export const HOVER_RIPPLE_SPEED = 0.28
export const HOVER_RIPPLE_GAIN = 0.62
/** Multiplies ripple amp before adding to trail — keeps halftone readable underneath. */
export const HOVER_RIPPLE_BLEND = 0.38
/** Slower decay reads more like water (rings linger while spreading). */
export const HOVER_RIPPLE_FADE = 0.95
export const HOVER_RIPPLE_LAG = 0.072
/** Relative brightness of the lagged second ring (0 = off). */
export const HOVER_RIPPLE_SECONDARY = 0.36

/** Max simultaneous ripple origins (finger-drag samples). */
export const HOVER_RIPPLE_MAX = 36
/** New ripple when the finger moves this many px, or after `HOVER_RIPPLE_SPAWN_MIN_SEC`. */
export const HOVER_RIPPLE_SPAWN_MIN_PX = 9
export const HOVER_RIPPLE_SPAWN_MIN_SEC = 0.048
export const HOVER_RIPPLE_MAX_AGE_SEC = 6

export const CURSOR_SIGMA = 0.055

/** Seconds the entry-stage radial reveal takes before transitioning to idle. */
export const ENTRY_DURATION_SEC = 3.3

/**
 * Clean ring intro (no wobble/shard), then noisy explosion.
 * - [0, ENTRY_RING_EXPAND_END]: radius 0 → `ENTRY_RING_MAX_DIST` (ease-out cubic in time)
 * - (ENTRY_RING_EXPAND_END, ENTRY_RING_HOLD_END]: hold at max
 * - (ENTRY_RING_HOLD_END, ENTRY_RING_CONTRACT_END]: radius max → 0 (ease-in cubic)
 * - After ENTRY_RING_CONTRACT_END: existing explosion math (time remapped to [0, 1]).
 */
export const ENTRY_RING_EXPAND_END = 0.3
export const ENTRY_RING_HOLD_END = 0.4
export const ENTRY_RING_CONTRACT_END = 0.5

/** Outer limit of the clean ring in normalized `dist` (< 1 keeps the band inside the square edge). */
export const ENTRY_RING_MAX_DIST = 0.8

/**
 * Half-width in normalized `dist` for the shock band: dots draw only where
 * |dist − revealRadius| ≤ this. The clean ring uses it as-is; the noisy phase scales it by
 * organic + shard band factors.
 */
export const ENTRY_WAVE_BAND = 0.09

/**
 * Below this remapped explosion progress `e` (after the clean ring), only wavefront ripples
 * draw — no gated structure layers yet.
 */
export const ENTRY_WAVEFRONT_ONLY_END = 0.55

/** Scales combined wavefront strength while layered reveals dither in (noisy stage B). */
export const ENTRY_WAVE_STAGE2_SCALE = 0.85

/** Sigma (normalized) of the primary/secondary gaussians riding each ripple. */
export const ENTRY_WAVE_SIGMA_PRIMARY = 0.032
export const ENTRY_WAVE_SIGMA_SECONDARY = 0.055

/** How far (in eased entry space) the secondary ripple trails the primary. */
export const ENTRY_RIPPLE_LAG = 0.15

/** Smooth sine warp on the shockwave (lower ≈ rounder; pairs with `ENTRY_SHARD`). */
export const ENTRY_WOBBLE = 0.35

/**
 * Stepped angular noise on the shockwave — piecewise-constant in azimuth so the
 * leading edge has hard breaks instead of curvy lobes.
 */
export const ENTRY_SHARD = 1

/** Peak amplitudes of the two ripples (1.0 = max dot brightness before clamp). */
export const ENTRY_WAVE_PEAK_PRIMARY = 1.3
export const ENTRY_WAVE_PEAK_SECONDARY = 0.7
