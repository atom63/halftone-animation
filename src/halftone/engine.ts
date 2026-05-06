import {
  CELL_SIGMA,
  CELL_SPAWN_R,
  CORE_GLOBE_CELL_SCALE,
  CORE_GLOBE_MICRO,
  CORE_GLOBE_STRENGTH,
  ENTRY_RING_CONTRACT_END,
  ENTRY_RING_EXPAND_END,
  ENTRY_RING_HOLD_END,
  ENTRY_RING_MAX_DIST,
  ENTRY_WAVE_BAND,
  ENTRY_WAVE_SIGMA_PRIMARY,
  ENTRY_WAVE_SIGMA_SECONDARY,
  ENTRY_WAVE_STAGE2_SCALE,
  ENTRY_WAVEFRONT_ONLY_END,
  OUT_CELL_SIGMA,
  SHAPES,
} from './constants'
import type {
  Cell,
  CellWorld,
  HaloCell,
  HoverRippleSpawn,
  ShapeKind,
  Square,
  TrailSample,
} from './types'

export function resizeCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  const dpr = window.devicePixelRatio || 1
  canvas.width = canvas.offsetWidth * dpr
  canvas.height = canvas.offsetHeight * dpr
  ctx.scale(dpr, dpr)
}

/** Resolved flat page fill — only `--background` so the field stays true light/dark, not gray. */
export interface HalftoneBgGradientStops {
  fill: string
}

const HALFTONE_BG_FALLBACK: HalftoneBgGradientStops = {
  fill: 'rgb(255, 255, 255)',
}

let halftoneBgProbe: HTMLDivElement | null = null

function resolveSemanticBgColor(cssBackground: string): string {
  if (typeof document === 'undefined') {
    return HALFTONE_BG_FALLBACK.fill
  }
  if (!halftoneBgProbe) {
    halftoneBgProbe = document.createElement('div')
    halftoneBgProbe.style.cssText =
      'position:absolute;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none'
  }
  halftoneBgProbe.style.backgroundColor = cssBackground
  document.documentElement.appendChild(halftoneBgProbe)
  const rgb = getComputedStyle(halftoneBgProbe).backgroundColor
  document.documentElement.removeChild(halftoneBgProbe)
  if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') {
    return HALFTONE_BG_FALLBACK.fill
  }
  return rgb
}

/**
 * Flat backdrop: one resolved semantic fill (default `var(--background)`).
 */
export function resolveHalftoneBgStopsFromSemantics(
  cssBackgroundValue = 'var(--background)'
): HalftoneBgGradientStops {
  if (typeof document === 'undefined') {
    return HALFTONE_BG_FALLBACK
  }
  return { fill: resolveSemanticBgColor(cssBackgroundValue) }
}

/** Render the halftone background gradient once to a reusable offscreen canvas. */
export function buildBackgroundBuffer(
  lW: number,
  lH: number,
  stops: HalftoneBgGradientStops
): HTMLCanvasElement {
  const bg = document.createElement('canvas')
  const dpr = window.devicePixelRatio || 1
  bg.width = Math.max(1, Math.round(lW * dpr))
  bg.height = Math.max(1, Math.round(lH * dpr))
  const c2d = bg.getContext('2d')
  if (!c2d) {
    return bg
  }
  c2d.scale(dpr, dpr)
  c2d.fillStyle = stops.fill
  c2d.fillRect(0, 0, lW, lH)
  return bg
}

export function noiseVal(x: number, y: number, t: number): number {
  const wx = x + 0.32 * Math.sin(y * 3.1 + t * 0.38)
  const wy = y + 0.32 * Math.cos(x * 2.7 - t * 0.3)
  return (
    Math.sin(wx * 6.8 + t * 0.75) * 0.28 +
    Math.sin(wy * 5.0 - t * 0.62) * 0.25 +
    Math.sin((wx + wy) * 3.8 + t * 0.52) * 0.22 +
    Math.sin(Math.sqrt(wx * wx + wy * wy) * 8.5 - t * 1.05) * 0.25
  )
}

// Chromatic ramp: deep prussian → rich cobalt → electric blue by amplitude.
export function dotColor(amp: number, isDark: boolean): string {
  if (isDark) {
    const l = (0.1 + amp * 0.62).toFixed(3)
    const c = (0.04 + amp * 0.26).toFixed(3)
    const h = (265 - amp * 13).toFixed(1)
    const a = Math.min(1, 0.05 + amp * 0.95).toFixed(3)
    return `oklch(${l} ${c} ${h} / ${a})`
  }
  // light mode: burnt-orange → amber ramp — dark dots on ivory ground
  const l = (0.62 - amp * 0.26).toFixed(3)
  const c = (0.05 + amp * 0.19).toFixed(3)
  const h = (62 - amp * 20).toFixed(1)
  const a = Math.min(1, 0.18 + amp * 0.82).toFixed(3)
  return `oklch(${l} ${c} ${h} / ${a})`
}

export function trailDotColor(tAmp: number, isDark: boolean): string {
  if (isDark) {
    // phosphor-bright cool white — contrasts with the blue field on hover
    const l = (0.6 + tAmp * 0.32).toFixed(3)
    const c = (0.04 + tAmp * 0.1).toFixed(3)
    const a = Math.min(1, 0.15 + tAmp * 0.85).toFixed(3)
    return `oklch(${l} ${c} 215 / ${a})`
  }
  // light mode: deep red trail — warm contrast on ivory
  const l = (0.55 - tAmp * 0.18).toFixed(3)
  const c = (0.06 + tAmp * 0.14).toFixed(3)
  const a = Math.min(1, 0.15 + tAmp * 0.85).toFixed(3)
  return `oklch(${l} ${c} 28 / ${a})`
}

export function easeIn3(t: number): number {
  return t * t * t
}

export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

/** Much snappier than cubic — ~80% of the distance in ~32% of the time. */
export function easeOutQuart(t: number): number {
  return 1 - (1 - t) ** 4
}

export function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/**
 * Entry: **clean ring** (expand → hold → contract), then **two-stage** noisy explosion.
 *
 * - **Ring (entry < ENTRY_RING_CONTRACT_END):** perfect circle; expand ease-out cubic, contract ease-in cubic; see `ENTRY_RING_*` in constants.
 * - **Stage A (entry₂ < ENTRY_WAVEFRONT_ONLY_END):** noisy wavefronts only.
 * - **Stage B (entry₂ ≥ ENTRY_WAVEFRONT_ONLY_END):** layers dither in.
 *   `entry₂` remaps [ENTRY_RING_CONTRACT_END, 1] → [0, 1].
 */
export interface EntryModulation {
  /** Halftone reveal progress for the non-structure layers. */
  cellT: number
  /** Halftone reveal progress for each structure sub-layer. */
  coreT: number
  ring1T: number
  ring2T: number
  shapeT: number
  skip: boolean
  trailT: number
  wavefront: number
  wavefrontOnly: boolean
}

const ENTRY_SETTLED: EntryModulation = {
  skip: false,
  wavefrontOnly: false,
  wavefront: 0,
  coreT: 1,
  ring1T: 1,
  ring2T: 1,
  cellT: 1,
  trailT: 1,
  shapeT: 1,
}

const ENTRY_SKIP: EntryModulation = {
  skip: true,
  wavefrontOnly: true,
  wavefront: 0,
  coreT: 0,
  ring1T: 0,
  ring2T: 0,
  cellT: 0,
  trailT: 0,
  shapeT: 0,
}

/**
 * Angular perturbation applied to the wavefront radius + thickness.
 * Three harmonics give the explosion an organic non-circular silhouette that
 * expands outward keeping its shape. `wobble` scales the overall amplitude
 * (1 = default splash, 0 = perfect circle, 3 = exaggerated).
 */
function organicRadialOffset(angle: number, wobble: number): number {
  return (
    wobble *
    (0.038 * Math.sin(angle * 3 + 1.4) +
      0.024 * Math.sin(angle * 7 - 0.8) +
      0.014 * Math.sin(angle * 11 + 2.1))
  )
}

function organicBandScale(angle: number, variance: number): number {
  return 1 + variance * (0.35 * Math.sin(angle * 4 + 1.7) + 0.15 * Math.sin(angle * 9 - 2.3))
}

/** [0, 1) deterministic hash from an integer bucket (sin–fract; no bitwise ops). */
function intHash01(n: number): number {
  const s = Math.sin(n * 12.9898) * 43_758.5453
  return s - Math.floor(s)
}

/**
 * Piecewise-constant angular value noise: the shock radius steps at irregular
 * azimuth boundaries (crystalline / shrapnel silhouette), unlike sine wobble.
 */
function shardRadialOffset(angle: number, shard: number): number {
  if (shard <= 0) {
    return 0
  }
  const tau = Math.PI * 2
  const u = angle / tau
  const a = Math.floor(u * 19)
  const b = Math.floor(u * 47)
  const c = Math.floor(u * 11)
  const h =
    intHash01(a * 503 + b * 301 + 199) * 0.52 +
    intHash01(b * 709 + c * 977 + 51) * 0.33 +
    intHash01(a * 401 + c * 601 + 17) * 0.15
  return shard * (h - 0.5) * 0.15
}

/** Stepped modulation of waveband thickness — thicker/thinner in angular shards. */
function shardBandScale(angle: number, shard: number): number {
  if (shard <= 0) {
    return 1
  }
  const u = angle / (Math.PI * 2)
  const i = Math.floor(u * 17)
  const h = intHash01(i * 911 + 257)
  return 1 + shard * 0.4 * (h - 0.5)
}

/** User-tweakable knobs for the stage-1 explosion. */
export interface ExplosionParams {
  bandVariance: number
  primaryPeak: number
  rippleLag: number
  secondaryPeak: number
  shard: number
  wobble: number
}

/** Contribution of a single ripple's gaussian to a dot at `dist`. */
function rippleBrightness(dist: number, revealR: number, sigma: number, peak: number): number {
  const delta = Math.abs(dist - revealR)
  return Math.exp(-(delta * delta) / (2 * sigma * sigma)) * peak
}

/** Ramp 0→1 over `width` once `t` ≥ 0. Used to fade the secondary ripple in. */
function ramp(t: number, width: number): number {
  if (t <= 0) {
    return 0
  }
  return Math.min(1, t / width)
}

export function computeEntryMod(
  dist: number,
  angle: number,
  entry: number,
  params: ExplosionParams
): EntryModulation {
  if (entry >= 1) {
    return ENTRY_SETTLED
  }

  if (entry < ENTRY_RING_CONTRACT_END) {
    let ringR: number
    if (entry <= ENTRY_RING_EXPAND_END) {
      const t = entry / ENTRY_RING_EXPAND_END
      ringR = easeOutCubic(t) * ENTRY_RING_MAX_DIST
    } else if (entry <= ENTRY_RING_HOLD_END) {
      ringR = ENTRY_RING_MAX_DIST
    } else {
      const u = (entry - ENTRY_RING_HOLD_END) / (ENTRY_RING_CONTRACT_END - ENTRY_RING_HOLD_END)
      ringR = ENTRY_RING_MAX_DIST * (1 - easeIn3(u))
    }
    if (ringR <= 0) {
      return ENTRY_SKIP
    }
    const combined = rippleBrightness(dist, ringR, ENTRY_WAVE_SIGMA_PRIMARY, params.primaryPeak)
    const band = ENTRY_WAVE_BAND
    if (Math.abs(dist - ringR) > band) {
      return ENTRY_SKIP
    }
    return {
      skip: false,
      wavefrontOnly: true,
      wavefront: combined,
      coreT: 0,
      ring1T: 0,
      ring2T: 0,
      cellT: 0,
      trailT: 0,
      shapeT: 0,
    }
  }

  const e = (entry - ENTRY_RING_CONTRACT_END) / (1 - ENTRY_RING_CONTRACT_END)

  // Two ripples share the same angular warp (smooth wobble + stepped shard noise)
  // so they stay causally aligned — the secondary reads as a rebound shock.
  const organic = organicRadialOffset(angle, params.wobble)
  const shardOff = shardRadialOffset(angle, params.shard)
  const radialWarp = organic + shardOff
  const r1 = Math.max(0, e + radialWarp)
  const r2 = Math.max(0, e - params.rippleLag + radialWarp)

  const wave1 = rippleBrightness(dist, r1, ENTRY_WAVE_SIGMA_PRIMARY, params.primaryPeak)
  const secondaryActive = e > params.rippleLag
  const wave2 = secondaryActive
    ? rippleBrightness(dist, r2, ENTRY_WAVE_SIGMA_SECONDARY, params.secondaryPeak) *
      ramp(e - params.rippleLag, 0.05)
    : 0
  const combined = Math.max(wave1, wave2)

  const d1 = Math.abs(dist - r1)
  const d2 = Math.abs(dist - r2)
  const band =
    ENTRY_WAVE_BAND *
    organicBandScale(angle, params.bandVariance) *
    shardBandScale(angle, params.shard)

  if (e < ENTRY_WAVEFRONT_ONLY_END) {
    // Noisy stage A: wavefronts only. Skip dots outside both ripples' bands.
    if (d1 > band && (!secondaryActive || d2 > band)) {
      return ENTRY_SKIP
    }
    return {
      skip: false,
      wavefrontOnly: true,
      wavefront: combined,
      coreT: 0,
      ring1T: 0,
      ring2T: 0,
      cellT: 0,
      trailT: 0,
      shapeT: 0,
    }
  }

  // Noisy stage B: both ripples taper as layers dither in on staggered windows.
  const waveFade = 1 - (e - ENTRY_WAVEFRONT_ONLY_END) / (1 - ENTRY_WAVEFRONT_ONLY_END)
  return {
    skip: false,
    wavefrontOnly: false,
    wavefront: combined * waveFade * ENTRY_WAVE_STAGE2_SCALE,
    coreT: smoothstep(0.55, 0.7, e),
    ring1T: smoothstep(0.68, 0.82, e),
    ring2T: smoothstep(0.78, 0.92, e),
    cellT: smoothstep(0.86, 1.0, e),
    trailT: smoothstep(0.8, 0.95, e),
    shapeT: smoothstep(0.9, 1.0, e),
  }
}

/**
 * Structure contribution gated per sub-layer (core / ring1 / ring2).
 * Zones are mutually exclusive so at most one multiplication does real work.
 */
export function computeGatedStructureAmp(
  nx: number,
  ny: number,
  dxW: number,
  dyW: number,
  dist: number,
  t: number,
  rInner: number,
  coreBreathe: number,
  coreFreq: number,
  coreSpeed: number,
  coreContrast: number,
  coreDriftX: number,
  coreDriftY: number,
  coreDriftLoopSec: number,
  rRing1: number,
  rRing1W: number,
  rRing2: number,
  rRing2W: number,
  coreGate: number,
  ring1Gate: number,
  ring2Gate: number
): number {
  const breathe = 1 + coreBreathe * Math.sin(t * 1.1) * Math.cos(t * 0.7)
  const rInnerB = rInner * breathe
  if (dist < rInnerB) {
    return (
      computeCoreAmp(
        nx,
        ny,
        dist,
        rInnerB,
        coreFreq,
        coreSpeed,
        coreContrast,
        t,
        coreDriftX,
        coreDriftY,
        coreDriftLoopSec
      ) * coreGate
    )
  }
  if (dist > rRing1 - rRing1W && dist < rRing1) {
    return computeRing1Amp(dist, dxW, dyW, rRing1, rRing1W, t) * ring1Gate
  }
  if (dist > rRing2 - rRing2W && dist < rRing2) {
    return computeRing2Amp(dist, dxW, dyW, rRing2, rRing2W, t) * ring2Gate
  }
  return 0
}

export function spawnCell(offset = 0): Cell {
  return {
    angle: Math.random() * Math.PI * 2,
    startR: CELL_SPAWN_R + Math.random() * 0.05,
    sigma: CELL_SIGMA * (0.7 + Math.random() * 0.4),
    progress: offset,
    speed: 0.0018 + Math.random() * 0.0014,
    wobble: (Math.random() - 0.5) * 0.55,
  }
}

export function spawnOutCell(offset = 0): Cell {
  return {
    angle: Math.random() * Math.PI * 2,
    startR: 0.01 + Math.random() * 0.04,
    sigma: OUT_CELL_SIGMA * (0.7 + Math.random() * 0.5),
    progress: offset,
    speed: 0.0016 + Math.random() * 0.0012,
    wobble: (Math.random() - 0.5) * 0.35,
  }
}

export function spawnHaloCell(offset = 0): HaloCell {
  return {
    angle: Math.random() * Math.PI * 2,
    startR: 0.5 + Math.random() * 0.11,
    attractR: 0.045 + Math.random() * 0.055,
    sigmaMul: 0.62 + Math.random() * 0.38,
    progress: offset,
    speed: 0.000_85 + Math.random() * 0.000_75,
    wobble: (Math.random() - 0.5) * 0.22,
  }
}

// ── Shape SDFs ────────────────────────────────────────────────────
// Each returns signed distance: 0 on edge, <0 inside, >0 outside
export function sdSquare(dx: number, dy: number, half: number): number {
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  const qx = ax - half
  const qy = ay - half
  return Math.sqrt(Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2) + Math.min(Math.max(qx, qy), 0)
}

export function sdCircle(dx: number, dy: number, half: number): number {
  return Math.sqrt(dx * dx + dy * dy) - half
}

// Equilateral triangle SDF — IQ formula
export function sdTriangle(px: number, py: number, half: number): number {
  const k = Math.sqrt(3)
  let x = Math.abs(px) - half
  let y = py + half / k
  if (x + k * y > 0.0) {
    const ox = x
    const oy = y
    x = (ox - k * oy) * 0.5
    y = (-k * ox - oy) * 0.5
  }
  x -= Math.max(Math.min(x, 0.0), -2.0 * half)
  return -Math.sqrt(x * x + y * y) * Math.sign(y)
}

export function shapeSDF(shape: ShapeKind, dx: number, dy: number, half: number): number {
  if (shape === 'circle') {
    return sdCircle(dx, dy, half)
  }
  if (shape === 'triangle') {
    return sdTriangle(dx, dy, half)
  }
  return sdSquare(dx, dy, half)
}

/**
 * Golden-angle sunflower placement: for N shapes, each index lands at a
 * balanced angular position with a sqrt-spaced radius so coverage is even
 * across the canvas without the old three-hardcoded-spots clustering.
 */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

export function balancedShapePosition(idx: number, total: number): { x: number; y: number } {
  const n = Math.max(1, total)
  const angle = idx * GOLDEN_ANGLE + 0.7
  // sqrt((idx + 1) / (n + 1)) distributes points with equal area between rings
  const normR = Math.sqrt((idx + 1) / (n + 1))
  const r = 0.08 + 0.27 * normR
  return { x: 0.5 + r * Math.cos(angle), y: 0.5 + r * Math.sin(angle) }
}

export function spawnSquare(offset = 0, idx = 0, total = 1): Square {
  const pos = balancedShapePosition(idx, total)
  const shapeA = SHAPES[Math.floor(Math.random() * 3)]
  const shapeB = SHAPES.filter(s => s !== shapeA)[Math.floor(Math.random() * 2)]
  const t1 = 0.15 + Math.random() * 0.05
  const t2 = t1 + 0.18 + Math.random() * 0.08
  const t3 = t2 + 0.05 + Math.random() * 0.02
  const t4 = t3 + 0.16 + Math.random() * 0.08
  return {
    x: pos.x + (Math.random() - 0.5) * 0.06,
    y: pos.y + (Math.random() - 0.5) * 0.06,
    driftAmp: 0.04 + Math.random() * 0.06,
    driftFreqX: 0.18 + Math.random() * 0.22,
    driftFreqY: 0.14 + Math.random() * 0.2,
    driftPhaseX: Math.random() * Math.PI * 2,
    driftPhaseY: Math.random() * Math.PI * 2,
    noiseOff: Math.random() * 100,
    sizeVar: 0.55 + Math.random() * 0.7,
    shapeA,
    shapeB,
    progress: offset,
    speed: 0.0018 + Math.random() * 0.0014,
    t1,
    t2,
    t3,
    t4,
    idx,
  }
}

/**
 * Per-shape target size in pixels:
 * - If the "natural" size (sqHalf × sizeVar) fits inside [min, max], use it so
 *   dragging sqHalf still feels direct.
 * - If the user has tightened the clamp so the natural size would overflow,
 *   remap the shape's spawn-time variance uniformly into [min, max] — this
 *   keeps per-shape size variance even when the clamp is binding.
 */
export function resolveShapeTarget(
  sizeVar: number,
  sqHalf: number,
  minSize: number,
  maxSize: number
): number {
  const hi = Math.max(minSize, maxSize)
  const lo = Math.min(minSize, hi)
  const raw = sqHalf * sizeVar
  if (raw >= lo && raw <= hi) {
    return raw
  }
  const normalized = Math.max(0, Math.min(1, (sizeVar - 0.55) / 0.7))
  return lo + normalized * (hi - lo)
}

// Stable per-dot pseudo-random in [0,1], deterministic from grid position.
// Uses the classic GLSL sin-fract hash — avoids bitwise ops while staying
// well-distributed enough for dot-size jitter.
export function dotHash(c: number, r: number): number {
  const s = Math.sin(c * 12.9898 + r * 78.233) * 43_758.5453
  return s - Math.floor(s)
}

export interface SquarePhase {
  morphT: number
  scale: number
}

export function squarePhase(
  p: number,
  t1: number,
  t2: number,
  t3: number,
  t4: number
): SquarePhase {
  if (p < t1) {
    const tt = p / t1
    const b1 = 4
    const b2 = 0.28
    const raw = 1 + b2 * Math.sin(tt * Math.PI * b1) * (1 - tt) - (1 - tt) ** 3 * (1 + b2)
    return { scale: Math.max(0, raw), morphT: 0 }
  }
  if (p < t2) {
    return { scale: 1, morphT: 0 }
  }
  if (p < t3) {
    const tt = (p - t2) / (t3 - t2)
    const b1 = 3
    const b2 = 0.25
    const raw = 1 + b2 * Math.sin(tt * Math.PI * b1) * (1 - tt) - (1 - tt) ** 3 * (1 + b2)
    return { scale: 1, morphT: Math.max(0, Math.min(1, raw)) }
  }
  if (p < t4) {
    return { scale: 1, morphT: 1 }
  }
  const tt = (p - t4) / (1 - t4)
  return { scale: 1 - tt * tt, morphT: 1 }
}

/**
 * Jittered 3×3 Voronoi: piecewise-constant [0,1) with crisp cell edges
 * (globe / continental plates at halftone scale).
 */
function coreVoronoiPlateAmp(px: number, py: number): number {
  const ix = Math.floor(px)
  const iy = Math.floor(py)
  let minD = Number.POSITIVE_INFINITY
  let best = 0
  for (let jy = -1; jy <= 1; jy++) {
    for (let jx = -1; jx <= 1; jx++) {
      const cx = ix + jx
      const cy = iy + jy
      const ox = (intHash01(cx * 1271 + cy * 311) - 0.5) * 0.92
      const oy = (intHash01(cx * 523 + cy * 1009) - 0.5) * 0.92
      const fx = cx + 0.5 + ox
      const fy = cy + 0.5 + oy
      const ddx = px - fx
      const ddy = py - fy
      const d = ddx * ddx + ddy * ddy
      if (d < minD) {
        minD = d
        best = intHash01(cx * 719 + cy * 997 + 13)
      }
    }
  }
  return best
}

export function computeCellsMaxAmp(x: number, y: number, cells: CellWorld[]): number {
  let max = 0
  for (const pos of cells) {
    if (pos.envelope < 0.01) {
      continue
    }
    const ddx = x - pos.worldX
    const ddy = y - pos.worldY
    if (Math.abs(ddx) > pos.cutoff || Math.abs(ddy) > pos.cutoff) {
      continue
    }
    const d2 = ddx * ddx + ddy * ddy
    if (d2 > pos.cutoff * pos.cutoff) {
      continue
    }
    const v = Math.exp(-d2 / pos.twoSig2)
    if (v > max) {
      max = v
    }
  }
  return max
}

export function computeCoreAmp(
  nx: number,
  ny: number,
  dist: number,
  rInnerB: number,
  coreFreq: number,
  coreSpeed: number,
  coreContrast: number,
  t: number,
  driftX: number,
  driftY: number,
  driftLoopSec: number
): number {
  const tDrift = driftLoopSec > 0 ? t - Math.floor(t / driftLoopSec) * driftLoopSec : t
  const ox = tDrift * driftX
  const oy = tDrift * driftY
  const sx = nx * coreFreq + ox
  const sy = ny * coreFreq + oy
  const v = noiseVal(sx, sy, t * coreSpeed)
  const legacy01 = v * 0.5 + 0.5
  const plate = coreVoronoiPlateAmp(sx * CORE_GLOBE_CELL_SCALE, sy * CORE_GLOBE_CELL_SCALE)
  const micro01 = legacy01
  const plateTextured = plate * (1 - CORE_GLOBE_MICRO + CORE_GLOBE_MICRO * micro01)
  const raw = plateTextured * CORE_GLOBE_STRENGTH + legacy01 * (1 - CORE_GLOBE_STRENGTH)
  const s = raw * raw * (3 - 2 * raw)
  const contrasted = CORE_GLOBE_STRENGTH > 0.5 ? s : s * s * (3 - 2 * s)
  const edgeBreath = (1 - dist / rInnerB) ** 0.35
  return Math.min(1, Math.max(0.08, contrasted) * edgeBreath * coreContrast)
}

export function computeRing1Amp(
  dist: number,
  dxW: number,
  dyW: number,
  rRing1: number,
  rRing1W: number,
  t: number
): number {
  const p = (dist - (rRing1 - rRing1W)) / rRing1W
  const fade = Math.sin(p * Math.PI)
  const ang = Math.atan2(dyW, dxW)
  const wave =
    Math.sin(ang * 6 + t * 1.4) * 0.3 +
    Math.sin(ang * 10 - t * 0.9) * 0.25 +
    Math.sin(ang * 3 + t * 0.7) * 0.25 +
    0.5
  const runnerAng = t * 1.8
  const runnerDiff = Math.abs(((ang - runnerAng + Math.PI * 3) % (Math.PI * 2)) - Math.PI)
  const runner = Math.exp(-(runnerDiff * runnerDiff) / (2 * 0.12 * 0.12))
  return Math.max(0, (wave + runner * 0.7) * fade) * 0.9
}

export function computeRing2Amp(
  dist: number,
  dxW: number,
  dyW: number,
  rRing2: number,
  rRing2W: number,
  t: number
): number {
  const p = (dist - (rRing2 - rRing2W)) / rRing2W
  const fade = Math.sin(p * Math.PI)
  const ang = Math.atan2(dyW, dxW)
  const wave =
    Math.sin(ang * 8 - t * 1.1) * 0.28 +
    Math.sin(ang * 14 + t * 0.8) * 0.22 +
    Math.sin(ang * 4 - t * 0.5) * 0.25 +
    0.5
  const r2a = t * 1.2
  const r2b = -t * 0.9 + Math.PI
  const d2a = Math.abs(((ang - r2a + Math.PI * 3) % (Math.PI * 2)) - Math.PI)
  const d2b = Math.abs(((ang - r2b + Math.PI * 3) % (Math.PI * 2)) - Math.PI)
  const runner =
    Math.exp(-(d2a * d2a) / (2 * 0.14 * 0.14)) * 0.6 +
    Math.exp(-(d2b * d2b) / (2 * 0.18 * 0.18)) * 0.4
  return Math.max(0, (wave + runner) * fade) * 0.8
}

export function computeTrailAmp(
  x: number,
  y: number,
  samples: TrailSample[],
  twoSig2: number,
  cullR2: number
): number {
  let sum = 0
  for (const ts of samples) {
    const tdx = x - ts.x
    const tdy = y - ts.y
    const d2 = tdx * tdx + tdy * tdy
    if (d2 > cullR2) {
      continue
    }
    sum += Math.exp(-d2 / twoSig2) * ts.weight
    if (sum >= 1) {
      return 1
    }
  }
  const clamped = Math.min(1, sum)
  return clamped * clamped * (3 - 2 * clamped)
}

/** Shared numeric knobs for summing many ripple spawns. */
export interface HoverRippleFieldParams {
  expandNormPerSec: number
  fadePerSec: number
  lagSec: number
  lH: number
  lW: number
  peak: number
  secondaryPeak: number
  sigmaNorm: number
  wallNow: number
}

function hoverRingTerm(dist: number, ringR: number, sigma: number, peak: number): number {
  if (peak <= 0 || sigma < 1e-6) {
    return 0
  }
  const d = Math.abs(dist - ringR)
  return Math.exp(-(d * d) / (2 * sigma * sigma)) * peak
}

/** Per-spawn state baked once per frame (not per grid cell). */
export interface PreparedHoverRipple {
  fade: number
  r1: number
  r2: number
  x: number
  y: number
}

/** Scratch for `prepareHoverRipples` + `sampleHoverRippleAmp` (reuse; `prepared.length` = active count). */
export interface HoverRippleBake {
  maxR: number
  perPeak: number
  prepared: PreparedHoverRipple[]
  secondaryPeak: number
  sigPx: number
}

const HOVER_RIPPLE_CULL_SIGMAS = 6

/**
 * Build per-ripple radii and fades once per frame. Call before drawing the grid.
 */
export function prepareHoverRipples(
  ripples: readonly HoverRippleSpawn[],
  p: HoverRippleFieldParams,
  bake: HoverRippleBake
): void {
  const out = bake.prepared
  if (p.peak <= 0) {
    out.length = 0
    return
  }
  const sigPx = p.sigmaNorm * p.lW
  const speedPx = p.expandNormPerSec * p.lW
  const maxR = 1.25 * Math.hypot(p.lW, p.lH)
  bake.sigPx = sigPx
  bake.maxR = maxR
  bake.perPeak = p.peak * 0.38
  bake.secondaryPeak = p.secondaryPeak
  let n = 0
  for (const rip of ripples) {
    const age = p.wallNow - rip.born
    if (age < 0) {
      continue
    }
    const fade = Math.exp(-age * p.fadePerSec)
    if (fade < 0.002) {
      continue
    }
    const r1 = Math.min(age * speedPx, maxR)
    const r2 = Math.min(Math.max(0, age - p.lagSec) * speedPx, maxR)
    if (n >= out.length) {
      out.push({ x: rip.x, y: rip.y, fade, r1, r2 })
    } else {
      const pr = out[n]
      pr.x = rip.x
      pr.y = rip.y
      pr.fade = fade
      pr.r1 = r1
      pr.r2 = r2
    }
    n += 1
  }
  out.length = n
}

/**
 * Sample baked hover ripples at one grid point — O(active ripples) with dist² cull.
 */
export function sampleHoverRippleAmp(x: number, y: number, bake: HoverRippleBake): number {
  const { prepared, sigPx, maxR, perPeak, secondaryPeak } = bake
  if (perPeak <= 0 || prepared.length === 0) {
    return 0
  }
  const margin = HOVER_RIPPLE_CULL_SIGMAS * sigPx
  const cullDistSq = (maxR + margin) * (maxR + margin)
  const sec = secondaryPeak
  let sum = 0
  for (const pr of prepared) {
    const ddx = x - pr.x
    const ddy = y - pr.y
    const distSq = ddx * ddx + ddy * ddy
    if (distSq > cullDistSq) {
      continue
    }
    const dist = Math.sqrt(distSq)
    sum +=
      (hoverRingTerm(dist, pr.r1, sigPx, perPeak) +
        hoverRingTerm(dist, pr.r2, sigPx * 1.12, perPeak * sec)) *
      pr.fade
  }
  return Math.min(1, sum)
}
