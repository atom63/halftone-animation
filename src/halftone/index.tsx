import { DialRoot, DialStore, useDialKit } from 'dialkit'
import type { DialConfig } from 'dialkit/store'
import { RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import 'dialkit/styles.css'

import {
  CELL_COUNT,
  CELL_SIGMA,
  CORE_BREATHE,
  CORE_CONTRAST,
  CORE_DRIFT_LOOP_SEC,
  CORE_DRIFT_X,
  CORE_DRIFT_Y,
  CORE_FREQ,
  CORE_SPEED,
  DOT_MAX,
  DOT_MIN,
  ENTRY_DURATION_SEC,
  ENTRY_RIPPLE_LAG,
  ENTRY_SHARD,
  ENTRY_WAVE_PEAK_PRIMARY,
  ENTRY_WAVE_PEAK_SECONDARY,
  ENTRY_WOBBLE,
  HALO_CELL_COUNT,
  HALO_CELL_SIGMA,
  HOVER_RIPPLE_BLEND,
  HOVER_RIPPLE_FADE,
  HOVER_RIPPLE_GAIN,
  HOVER_RIPPLE_LAG,
  HOVER_RIPPLE_MAX,
  HOVER_RIPPLE_MAX_AGE_SEC,
  HOVER_RIPPLE_SECONDARY,
  HOVER_RIPPLE_SIGMA,
  HOVER_RIPPLE_SPAWN_MIN_PX,
  HOVER_RIPPLE_SPAWN_MIN_SEC,
  HOVER_RIPPLE_SPEED,
  OUT_CELL_COUNT,
  OUT_CELL_SIGMA,
  R_INNER,
  R_RING1,
  R_RING1_W,
  R_RING2,
  R_RING2_W,
  SHAPE_DOT_MAX,
  SHAPE_DOT_MIN,
  SPACING,
  SQ_COUNT,
  SQ_EDGE,
  SQ_HALF,
  TRAIL_LIFE,
  TRAIL_MAX,
  TRAIL_SIGMA,
} from './constants'
import type { EntryModulation, HoverRippleBake, HoverRippleFieldParams } from './engine'
import {
  buildBackgroundBuffer,
  computeCellsMaxAmp,
  computeCoreAmp,
  computeEntryMod,
  computeGatedStructureAmp,
  computeRing1Amp,
  computeRing2Amp,
  computeTrailAmp,
  dotColor,
  dotHash,
  easeIn3,
  easeOutQuart,
  noiseVal,
  prepareHoverRipples,
  resizeCanvas,
  resolveHalftoneBgStopsFromSemantics,
  resolveShapeTarget,
  sampleHoverRippleAmp,
  shapeSDF,
  spawnCell,
  spawnHaloCell,
  spawnOutCell,
  spawnSquare,
  squarePhase,
  trailDotColor,
} from './engine'
import type {
  Cell,
  CellWorld,
  CursorPos,
  HaloCell,
  HoverRippleSpawn,
  Square,
  SquareField,
  TrailPoint,
  TrailSample,
} from './types'

function mkDialConfig(): DialConfig {
  return {
    grid: {
      spacing: [SPACING, 3, 20, 0.5] as [number, number, number, number],
      dotMin: [DOT_MIN, 0.1, 1, 0.05] as [number, number, number, number],
      dotMax: [DOT_MAX, 0.5, 5, 0.1] as [number, number, number, number],
    },
    structure: {
      coreBreathe: [CORE_BREATHE, 0, 0.15, 0.005] as [number, number, number, number],
      coreContrast: [CORE_CONTRAST, 0.5, 3, 0.1] as [number, number, number, number],
      coreDriftLoopSec: [CORE_DRIFT_LOOP_SEC, 0, 24, 0.25] as [number, number, number, number],
      coreDriftX: [CORE_DRIFT_X, -1.2, 1.2, 0.02] as [number, number, number, number],
      coreDriftY: [CORE_DRIFT_Y, -1.2, 1.2, 0.02] as [number, number, number, number],
      coreFreq: [CORE_FREQ, 1, 20, 0.5] as [number, number, number, number],
      coreSpeed: [CORE_SPEED, 0.01, 3, 0.01] as [number, number, number, number],
      rInner: [R_INNER, 0.05, 0.25, 0.001] as [number, number, number, number],
      rRing1: [R_RING1, 0.1, 0.45, 0.001] as [number, number, number, number],
      rRing1W: [R_RING1_W, 0.005, 0.06, 0.001] as [number, number, number, number],
      rRing2: [R_RING2, 0.25, 0.72, 0.001] as [number, number, number, number],
      rRing2W: [R_RING2_W, 0.005, 0.06, 0.001] as [number, number, number, number],
    },
    cells: {
      cellCount: [CELL_COUNT, 1, 20, 1] as [number, number, number, number],
      cellSigma: [CELL_SIGMA, 0.005, 0.1, 0.001] as [number, number, number, number],
      haloCellCount: [HALO_CELL_COUNT, 0, 36, 1] as [number, number, number, number],
      haloCellSigma: [HALO_CELL_SIGMA, 0.003, 0.018, 0.0005] as [number, number, number, number],
      outCellCount: [OUT_CELL_COUNT, 1, 20, 1] as [number, number, number, number],
      outCellSigma: [OUT_CELL_SIGMA, 0.005, 0.1, 0.001] as [number, number, number, number],
    },
    shapes: {
      sqCount: [SQ_COUNT, 1, 8, 1] as [number, number, number, number],
      sqHalf: [SQ_HALF, 8, 80, 1] as [number, number, number, number],
      sqEdge: [SQ_EDGE, 1, 12, 0.5] as [number, number, number, number],
      minSize: [6, 2, 60, 1] as [number, number, number, number],
      maxSize: [90, 20, 140, 1] as [number, number, number, number],
      shapeDotMin: [SHAPE_DOT_MIN, 0.05, 2, 0.05] as [number, number, number, number],
      shapeDotMax: [SHAPE_DOT_MAX, 0.2, 6, 0.1] as [number, number, number, number],
    },
    trail: {
      hoverRippleBlend: [HOVER_RIPPLE_BLEND, 0, 1, 0.02] as [number, number, number, number],
      hoverRippleFade: [HOVER_RIPPLE_FADE, 0.25, 4, 0.05] as [number, number, number, number],
      hoverRippleGain: [HOVER_RIPPLE_GAIN, 0, 1.6, 0.05] as [number, number, number, number],
      hoverRippleLag: [HOVER_RIPPLE_LAG, 0, 0.28, 0.005] as [number, number, number, number],
      hoverRippleSecondary: [HOVER_RIPPLE_SECONDARY, 0, 1.2, 0.05] as [
        number,
        number,
        number,
        number,
      ],
      hoverRippleSigma: [HOVER_RIPPLE_SIGMA, 0.008, 0.07, 0.001] as [
        number,
        number,
        number,
        number,
      ],
      hoverRippleSpeed: [HOVER_RIPPLE_SPEED, 0.08, 1.4, 0.02] as [number, number, number, number],
      trailLife: [TRAIL_LIFE, 0.3, 3, 0.1] as [number, number, number, number],
      trailSigma: [TRAIL_SIGMA, 0.005, 0.08, 0.001] as [number, number, number, number],
    },
    explosion: {
      bandVariance: [1, 0, 2, 0.05] as [number, number, number, number],
      primaryPeak: [ENTRY_WAVE_PEAK_PRIMARY, 0.3, 2, 0.05] as [number, number, number, number],
      rippleLag: [ENTRY_RIPPLE_LAG, 0.05, 0.3, 0.01] as [number, number, number, number],
      secondaryPeak: [ENTRY_WAVE_PEAK_SECONDARY, 0, 1.5, 0.05] as [number, number, number, number],
      shard: [ENTRY_SHARD, 0, 2.5, 0.05] as [number, number, number, number],
      wobble: [ENTRY_WOBBLE, 0, 3, 0.05] as [number, number, number, number],
    },
    replay: { type: 'action', label: 'Replay entry' },
    reset: { type: 'action', label: 'Reset' },
  }
}

interface GridControls {
  dotMax: number
  dotMin: number
  spacing: number
}
interface StructureControls {
  coreBreathe: number
  coreContrast: number
  coreDriftLoopSec: number
  coreDriftX: number
  coreDriftY: number
  coreFreq: number
  coreSpeed: number
  rInner: number
  rRing1: number
  rRing1W: number
  rRing2: number
  rRing2W: number
}
interface CellsControls {
  cellCount: number
  cellSigma: number
  haloCellCount: number
  haloCellSigma: number
  outCellCount: number
  outCellSigma: number
}
interface ShapesControls {
  maxSize: number
  minSize: number
  shapeDotMax: number
  shapeDotMin: number
  sqCount: number
  sqEdge: number
  sqHalf: number
}
interface TrailControls {
  hoverRippleBlend: number
  hoverRippleFade: number
  hoverRippleGain: number
  hoverRippleLag: number
  hoverRippleSecondary: number
  hoverRippleSigma: number
  hoverRippleSpeed: number
  trailLife: number
  trailSigma: number
}
interface ExplosionControls {
  bandVariance: number
  primaryPeak: number
  rippleLag: number
  secondaryPeak: number
  shard: number
  wobble: number
}
interface HalftoneControls {
  cells: CellsControls
  explosion: ExplosionControls
  grid: GridControls
  shapes: ShapesControls
  structure: StructureControls
  trail: TrailControls
}

function resetDialLeafValue(panelId: string, path: string, value: unknown): boolean {
  if (Array.isArray(value)) {
    if (typeof value[0] === 'number') {
      DialStore.updateValue(panelId, path, value[0])
    }
    return true
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
    DialStore.updateValue(panelId, path, value)
    return true
  }
  return false
}

function resetDialTypedValue(panelId: string, path: string, value: object): void {
  if (!('type' in value)) {
    return
  }
  const typed = value as { type: string; default?: string }
  if (typed.type === 'action') {
    return
  }
  if (
    (typed.type === 'select' || typed.type === 'color' || typed.type === 'text') &&
    typeof typed.default === 'string'
  ) {
    DialStore.updateValue(panelId, path, typed.default)
  }
}

/**
 * Walk a DialConfig tree and push each leaf's default value through
 * `DialStore.updateValue`. Unlike `updatePanel`, this actually overrides
 * whatever the user has set — used by the Reset action.
 */
function resetDialValues(panelId: string, config: DialConfig, prefix = ''): void {
  for (const [key, value] of Object.entries(config)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (resetDialLeafValue(panelId, path, value)) {
      continue
    }
    if (typeof value !== 'object' || value === null) {
      continue
    }
    if ('type' in value) {
      resetDialTypedValue(panelId, path, value)
      continue
    }
    resetDialValues(panelId, value as DialConfig, path)
  }
}

interface FrameParams {
  c: HalftoneControls
  cx: number
  cy: number
  dtFrames: number
  /** Eased entry-stage progress (0 during radial reveal, 1 when settled into idle). */
  entry: number
  lH: number
  lW: number
  t: number
}

function ensureLength<T>(arr: T[], target: number, spawn: () => T): void {
  while (arr.length < target) {
    arr.push(spawn())
  }
  if (arr.length > target) {
    arr.length = target
  }
}

function ensurePool<T>(arr: T[], target: number, make: () => T): void {
  while (arr.length < target) {
    arr.push(make())
  }
  arr.length = target
}

function emptyCellWorld(): CellWorld {
  return { worldX: 0, worldY: 0, twoSig2: 0, cutoff: 0, envelope: 0 }
}

function projectCellsInto(
  cells: Cell[],
  pool: CellWorld[],
  frame: FrameParams,
  rRing2: number
): void {
  ensurePool(pool, cells.length, emptyCellWorld)
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]
    const pos = pool[i]
    const p = cell.progress
    const easedP = easeIn3(p)
    const wobbleDamp = (1 - p) ** 2
    const angle = cell.angle + cell.wobble * Math.sin(p * Math.PI * 2.5) * wobbleDamp
    const envelope = Math.sin(p * Math.PI) ** 1.4
    const r = cell.startR * (1 - easedP) + rRing2 * easedP
    const sigPx = cell.sigma * frame.lW * envelope
    pos.worldX = frame.cx + Math.cos(angle) * r * frame.lW
    pos.worldY = frame.cy + Math.sin(angle) * r * frame.lW
    pos.twoSig2 = 2 * sigPx * sigPx
    pos.cutoff = sigPx * 3
    pos.envelope = envelope
  }
}

function projectOutCellsInto(
  cells: Cell[],
  pool: CellWorld[],
  frame: FrameParams,
  rRing2: number
): void {
  ensurePool(pool, cells.length, emptyCellWorld)
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]
    const pos = pool[i]
    const p = cell.progress
    const easedP = 1 - (1 - p) ** 2.5
    const wobbleDamp = (1 - p) ** 2
    const angle = cell.angle + cell.wobble * Math.sin(p * Math.PI * 2) * wobbleDamp
    const envelope = Math.sin(p * Math.PI) ** 1.6
    const r = cell.startR * (1 - easedP) + rRing2 * easedP
    const sigPx = cell.sigma * frame.lW * envelope
    pos.worldX = frame.cx + Math.cos(angle) * r * frame.lW
    pos.worldY = frame.cy + Math.sin(angle) * r * frame.lW
    pos.twoSig2 = 2 * sigPx * sigPx
    pos.cutoff = sigPx * 3
    pos.envelope = envelope
  }
}

/** Outer halo cells: radial infall toward core (ease-in simulates inward pull). */
function projectHaloCellsInto(
  cells: HaloCell[],
  pool: CellWorld[],
  frame: FrameParams,
  haloSigma: number
): void {
  ensurePool(pool, cells.length, emptyCellWorld)
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]
    const pos = pool[i]
    const p = cell.progress
    const easedP = easeIn3(p)
    const wobbleDamp = (1 - p) ** 1.6
    const angle = cell.angle + cell.wobble * Math.sin(p * Math.PI * 3.2) * wobbleDamp
    const envelope = Math.sin(p * Math.PI) ** 1.15
    const r = cell.startR * (1 - easedP) + cell.attractR * easedP
    const sigPx = haloSigma * cell.sigmaMul * frame.lW * envelope
    pos.worldX = frame.cx + Math.cos(angle) * r * frame.lW
    pos.worldY = frame.cy + Math.sin(angle) * r * frame.lW
    pos.twoSig2 = 2 * sigPx * sigPx
    pos.cutoff = sigPx * 3
    pos.envelope = envelope
  }
}

function expireAndWeightTrail(
  ptsRef: { current: TrailPoint[] },
  trailLife: number,
  wallNow: number
): TrailSample[] {
  const alive: TrailPoint[] = []
  for (const p of ptsRef.current) {
    if (wallNow - p.born < trailLife) {
      alive.push(p)
    }
  }
  ptsRef.current = alive
  const out: TrailSample[] = []
  const ptsLen = alive.length
  for (let i = 0; i < ptsLen; i++) {
    const p = alive[i]
    const age = wallNow - p.born
    const lifeT = age / trailLife
    const indexT = i / Math.max(1, ptsLen - 1)
    const ageFade = (1 - lifeT) ** 2.0
    const weight = ageFade * (0.08 + indexT * 0.92)
    if (weight < 0.005) {
      continue
    }
    out.push({ x: p.x, y: p.y, weight })
  }
  return out
}

function compactHoverRipples(
  ripples: HoverRippleSpawn[],
  wallNow: number,
  maxAgeSec: number,
  fadePerSec: number
): void {
  let w = 0
  for (const r of ripples) {
    const age = wallNow - r.born
    if (age > maxAgeSec) {
      continue
    }
    if (Math.exp(-age * fadePerSec) < 0.0025) {
      continue
    }
    ripples[w] = r
    w += 1
  }
  ripples.length = w
}

function addStructureAmp(
  amp: number,
  nx: number,
  ny: number,
  dxW: number,
  dyW: number,
  dist: number,
  structure: StructureControls,
  t: number
): number {
  const breathe = 1 + structure.coreBreathe * Math.sin(t * 1.1) * Math.cos(t * 0.7)
  const rInnerB = structure.rInner * breathe

  if (dist < rInnerB) {
    const coreAmp = computeCoreAmp(
      nx,
      ny,
      dist,
      rInnerB,
      structure.coreFreq,
      structure.coreSpeed,
      structure.coreContrast,
      t,
      structure.coreDriftX,
      structure.coreDriftY,
      structure.coreDriftLoopSec
    )
    return Math.min(1, amp + coreAmp)
  }
  if (dist > structure.rRing1 - structure.rRing1W && dist < structure.rRing1) {
    return Math.min(
      1,
      amp + computeRing1Amp(dist, dxW, dyW, structure.rRing1, structure.rRing1W, t)
    )
  }
  if (dist > structure.rRing2 - structure.rRing2W && dist < structure.rRing2) {
    return Math.min(
      1,
      amp + computeRing2Amp(dist, dxW, dyW, structure.rRing2, structure.rRing2W, t)
    )
  }
  return amp
}

function buildSquareFields(
  squares: Square[],
  frame: FrameParams,
  sqHalf: number,
  minSize: number,
  maxSize: number
): SquareField[] {
  const out: SquareField[] = []
  for (const sq of squares) {
    const phase = squarePhase(sq.progress, sq.t1, sq.t2, sq.t3, sq.t4)
    if (phase.scale < 0.01) {
      continue
    }
    const target = resolveShapeTarget(sq.sizeVar, sqHalf, minSize, maxSize)
    const half = target * phase.scale
    out.push({
      cx: (sq.x + Math.sin(frame.t * sq.driftFreqX + sq.driftPhaseX) * sq.driftAmp) * frame.lW,
      cy: (sq.y + Math.sin(frame.t * sq.driftFreqY + sq.driftPhaseY) * sq.driftAmp) * frame.lH,
      half,
      morphT: phase.morphT,
      shapeA: sq.shapeA,
      shapeB: sq.shapeB,
      scale: phase.scale,
      noiseOff: sq.noiseOff,
    })
  }
  return out
}

function sampleSquareFieldAmp(x: number, y: number, fields: SquareField[], sqEdge: number): number {
  let max = 0
  for (const sq of fields) {
    const dx = x - sq.cx
    const dy = y - sq.cy
    const adx = Math.abs(dx)
    const ady = Math.abs(dy)
    if (adx > sq.half + sqEdge * 2 || ady > sq.half + sqEdge * 2) {
      continue
    }
    const sdA = shapeSDF(sq.shapeA, dx, dy, sq.half)
    const sdB = shapeSDF(sq.shapeB, dx, dy, sq.half)
    const edgeDist = Math.abs(sdA + (sdB - sdA) * sq.morphT)
    const sigma = sqEdge * 0.55
    const g = Math.exp(-(edgeDist * edgeDist) / (2 * sigma * sigma))
    if (g < 0.015) {
      continue
    }
    const v = Math.min(1, g * sq.scale * 4.0)
    if (v > max) {
      max = v
    }
  }
  return max
}

interface GridDeps {
  cellPos: CellWorld[]
  cullR2: number
  haloCellPos: CellWorld[]
  hoverRippleBake: HoverRippleBake
  outCellPos: CellWorld[]
  shapeDotMax: number
  shapeDotMin: number
  sqEdge: number
  sqFields: SquareField[]
  trailTwoSig2: number
  tSamples: TrailSample[]
}

function drawBaseDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  amp: number,
  dotMin: number,
  dotMax: number,
  jitter: number
): void {
  const radius = (dotMin + amp * (dotMax - dotMin)) * jitter
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = dotColor(amp)
  ctx.fill()
}

function drawTrailDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tAmp: number,
  nx: number,
  ny: number,
  t: number,
  dotMin: number,
  dotMax: number,
  jitter: number
): void {
  const nRaw = noiseVal(nx * 4.5, ny * 4.5, t * 0.35) * 0.5 + 0.5
  const nMod = 0.3 + nRaw * 1.5
  const radius = (dotMin + tAmp * (dotMax - dotMin)) * jitter * nMod
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = trailDotColor(tAmp)
  ctx.fill()
}

function computeCellsAmp(x: number, y: number, deps: GridDeps): number {
  const a = computeCellsMaxAmp(x, y, deps.cellPos)
  const b = computeCellsMaxAmp(x, y, deps.outCellPos)
  const h = computeCellsMaxAmp(x, y, deps.haloCellPos)
  return Math.max(a, b, h)
}

interface GridCellCoords {
  angle: number
  dist: number
  dxW: number
  dyW: number
  nx: number
  ny: number
  x: number
  y: number
}

function computeGridCellCoords(col: number, row: number, frame: FrameParams): GridCellCoords {
  const spacing = frame.c.grid.spacing
  const offX = row % 2 === 0 ? 0 : spacing * 0.5
  const x = col * spacing + offX - spacing
  const y = row * spacing - spacing
  const nx = x / frame.lW
  const ny = y / frame.lH
  const dxW = (x - frame.cx) / frame.lW
  const dyW = (y - frame.cy) / frame.lH
  return {
    x,
    y,
    nx,
    ny,
    dxW,
    dyW,
    dist: Math.sqrt(dxW * dxW + dyW * dyW),
    angle: Math.atan2(dyW, dxW),
  }
}

function drawSettledDot(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  coords: GridCellCoords,
  frame: FrameParams,
  deps: GridDeps,
  hasShapes: boolean
): void {
  const { c, t } = frame
  const { dotMin, dotMax } = c.grid
  const { shapeDotMin, shapeDotMax } = deps
  const { x, y, nx, ny, dxW, dyW, dist } = coords

  const cellAmpRaw = computeCellsAmp(x, y, deps)
  const structured = addStructureAmp(
    Math.min(0.75, cellAmpRaw),
    nx,
    ny,
    dxW,
    dyW,
    dist,
    c.structure,
    t
  )
  const amp = Math.min(1, structured)
  const tAmp = computeTrailAmp(x, y, deps.tSamples, deps.trailTwoSig2, deps.cullR2)
  const hAmp = sampleHoverRippleAmp(x, y, deps.hoverRippleBake)
  const interactAmp = Math.min(1, tAmp + hAmp * c.trail.hoverRippleBlend)
  const sqAmp = hasShapes ? sampleSquareFieldAmp(x, y, deps.sqFields, deps.sqEdge) : 0

  if (amp < 0.012 && interactAmp < 0.01 && sqAmp < 0.012) {
    return
  }

  const jitter = 0.65 + dotHash(col, row) * 0.35
  if (amp >= 0.012) {
    drawBaseDot(ctx, x, y, amp, dotMin, dotMax, jitter)
  }
  if (interactAmp > 0.01) {
    drawTrailDot(ctx, x, y, interactAmp, nx, ny, t, dotMin, dotMax, jitter)
  }
  if (sqAmp >= 0.012) {
    drawBaseDot(ctx, x, y, Math.min(1, sqAmp ** 0.4), shapeDotMin, shapeDotMax, jitter)
  }
}

function drawEntryStageDot(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  coords: GridCellCoords,
  frame: FrameParams,
  deps: GridDeps,
  mod: EntryModulation,
  hasShapes: boolean
): void {
  const { c, t } = frame
  const { dotMin, dotMax } = c.grid
  const { shapeDotMin, shapeDotMax } = deps
  const s = c.structure
  const { x, y, nx, ny, dxW, dyW, dist } = coords

  // Halftone dither — a dot participates in a layer iff its stable per-dot
  // hash is below that layer's reveal progress. Growing dot density per
  // layer gives the native halftone-reveal aesthetic.
  const hash = dotHash(col, row)
  const coreGate = hash < mod.coreT ? 1 : 0
  const ring1Gate = hash < mod.ring1T ? 1 : 0
  const ring2Gate = hash < mod.ring2T ? 1 : 0
  const cellGate = hash < mod.cellT ? 1 : 0
  const trailGate = hash < mod.trailT ? 1 : 0
  const shapeGate = hash < mod.shapeT ? 1 : 0

  const cellAmpRaw = computeCellsAmp(x, y, deps)
  const structureSum = computeGatedStructureAmp(
    nx,
    ny,
    dxW,
    dyW,
    dist,
    t,
    s.rInner,
    s.coreBreathe,
    s.coreFreq,
    s.coreSpeed,
    s.coreContrast,
    s.coreDriftX,
    s.coreDriftY,
    s.coreDriftLoopSec,
    s.rRing1,
    s.rRing1W,
    s.rRing2,
    s.rRing2W,
    coreGate,
    ring1Gate,
    ring2Gate
  )
  const cellContrib = Math.min(0.75, cellAmpRaw) * cellGate
  const amp = Math.min(1, cellContrib + structureSum + mod.wavefront)

  const tAmp = computeTrailAmp(x, y, deps.tSamples, deps.trailTwoSig2, deps.cullR2) * trailGate
  const hAmp = sampleHoverRippleAmp(x, y, deps.hoverRippleBake) * trailGate
  const interactAmp = Math.min(1, tAmp + hAmp * c.trail.hoverRippleBlend)
  const sqAmp = hasShapes ? sampleSquareFieldAmp(x, y, deps.sqFields, deps.sqEdge) * shapeGate : 0

  if (amp < 0.012 && interactAmp < 0.01 && sqAmp < 0.012) {
    return
  }

  const jitter = 0.65 + hash * 0.35
  if (amp >= 0.012) {
    drawBaseDot(ctx, x, y, amp, dotMin, dotMax, jitter)
  }
  if (interactAmp > 0.01) {
    drawTrailDot(ctx, x, y, interactAmp, nx, ny, t, dotMin, dotMax, jitter)
  }
  if (sqAmp >= 0.012) {
    drawBaseDot(ctx, x, y, Math.min(1, sqAmp ** 0.4), shapeDotMin, shapeDotMax, jitter)
  }
}

function drawWavefrontDot(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  coords: GridCellCoords,
  frame: FrameParams,
  mod: EntryModulation
): void {
  if (mod.wavefront < 0.05) {
    return
  }
  const { dotMin, dotMax } = frame.c.grid
  const jitter = 0.65 + dotHash(col, row) * 0.35
  drawBaseDot(ctx, coords.x, coords.y, Math.min(1, mod.wavefront), dotMin, dotMax, jitter)
}

function drawGridCell(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  frame: FrameParams,
  deps: GridDeps,
  hasShapes: boolean
): void {
  const coords = computeGridCellCoords(col, row, frame)
  const mod = computeEntryMod(coords.dist, coords.angle, frame.entry, frame.c.explosion)
  if (mod.skip) {
    return
  }
  if (mod.wavefrontOnly) {
    drawWavefrontDot(ctx, col, row, coords, frame, mod)
    return
  }
  if (frame.entry >= 1) {
    drawSettledDot(ctx, col, row, coords, frame, deps, hasShapes)
    return
  }
  drawEntryStageDot(ctx, col, row, coords, frame, deps, mod, hasShapes)
}

function drawFusedGrid(ctx: CanvasRenderingContext2D, frame: FrameParams, deps: GridDeps): void {
  const { lW, lH } = frame
  const spacing = frame.c.grid.spacing
  const cols = Math.ceil(lW / spacing) + 2
  const rows = Math.ceil(lH / spacing) + 2
  const hasShapes = deps.sqFields.length > 0

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      drawGridCell(ctx, col, row, frame, deps, hasShapes)
    }
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export interface HalftoneReadout {
  amp: number
  dots: number
  freq: number
}

export interface HalftoneProps {
  /** Backdrop fill for the offscreen bitmap. Default `var(--background)`. */
  canvasCssVar?: string
  /** Called at ~10 fps with live engine metrics. */
  onReadout?: (r: HalftoneReadout) => void
}

export function Halftone({ canvasCssVar = 'var(--background)', onReadout }: HalftoneProps = {}) {
  const semanticCanvasVarRef = useRef(canvasCssVar)
  semanticCanvasVarRef.current = canvasCssVar

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const timeRef = useRef(0)
  const entryRawRef = useRef(0)
  const lastFrameMsRef = useRef(0)
  const visibleRef = useRef(true)
  const reducedMotionRef = useRef(false)

  const cellsRef = useRef<Cell[]>(
    Array.from({ length: CELL_COUNT }, (_, i) => spawnCell(i / CELL_COUNT))
  )
  const outCellsRef = useRef<Cell[]>(
    Array.from({ length: OUT_CELL_COUNT }, (_, i) => spawnOutCell(i / OUT_CELL_COUNT))
  )
  const haloCellsRef = useRef<HaloCell[]>(
    Array.from({ length: HALO_CELL_COUNT }, (_, i) => spawnHaloCell(i / HALO_CELL_COUNT))
  )
  const squaresRef = useRef<Square[]>(
    Array.from({ length: SQ_COUNT }, (_, i) => spawnSquare(i / SQ_COUNT, i, SQ_COUNT))
  )
  const cellPosPool = useRef<CellWorld[]>([])
  const outCellPosPool = useRef<CellWorld[]>([])
  const haloCellPosPool = useRef<CellWorld[]>([])
  const trailPtsRef = useRef<TrailPoint[]>([])
  const cursorPosRef = useRef<CursorPos>({ x: -1, y: -1, active: false })
  const hoverRipplePtsRef = useRef<HoverRippleSpawn[]>([])
  const hoverRippleBakeRef = useRef<HoverRippleBake>({
    maxR: 0,
    perPeak: 0,
    prepared: [],
    secondaryPeak: 0,
    sigPx: 0,
  })
  const lastRippleXRef = useRef(0)
  const lastRippleYRef = useRef(0)
  const lastRippleWallRef = useRef(0)
  const bgBufferRef = useRef<HTMLCanvasElement | null>(null)
  const bgSizeRef = useRef({ w: 0, h: 0 })
  const panelIdRef = useRef('')
  const onReadoutRef = useRef(onReadout)
  onReadoutRef.current = onReadout
  const lastReadoutWallRef = useRef(0)

  // biome-ignore lint/suspicious/noEmptyBlockStatements: initialized before first action fires
  const replayRef = useRef<() => void>(() => {})
  // biome-ignore lint/suspicious/noEmptyBlockStatements: initialized before first action fires
  const resetRef = useRef<() => void>(() => {})

  const controls = useDialKit('halftone', mkDialConfig(), {
    onAction: action => {
      if (action === 'replay') {
        replayRef.current()
      } else if (action === 'reset') {
        resetRef.current()
      }
    },
  }) as unknown as HalftoneControls

  const controlsRef = useRef<HalftoneControls>(controls)
  controlsRef.current = controls

  useEffect(() => {
    const panel = DialStore.getPanels().find(p => p.name === 'halftone')
    if (panel) {
      panelIdRef.current = panel.id
    }
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: prop must invalidate the cached bitmap
  useEffect(() => {
    bgBufferRef.current = null
  }, [canvasCssVar])

  // Replay just re-triggers the entry animation from scratch — cells, squares,
  // trail, clocks all zero'd — while preserving any user-tweaked dial values.
  replayRef.current = () => {
    cellsRef.current = Array.from({ length: CELL_COUNT }, (_, i) => spawnCell(i / CELL_COUNT))
    outCellsRef.current = Array.from({ length: OUT_CELL_COUNT }, (_, i) =>
      spawnOutCell(i / OUT_CELL_COUNT)
    )
    haloCellsRef.current = Array.from({ length: HALO_CELL_COUNT }, (_, i) =>
      spawnHaloCell(i / HALO_CELL_COUNT)
    )
    squaresRef.current = Array.from({ length: SQ_COUNT }, (_, i) =>
      spawnSquare(i / SQ_COUNT, i, SQ_COUNT)
    )
    trailPtsRef.current = []
    hoverRipplePtsRef.current = []
    lastRippleXRef.current = 0
    lastRippleYRef.current = 0
    lastRippleWallRef.current = 0
    timeRef.current = 0
    entryRawRef.current = 0
  }

  // Reset = replay + snap every dial control back to its default.
  resetRef.current = () => {
    replayRef.current()
    if (panelIdRef.current) {
      resetDialValues(panelIdRef.current, mkDialConfig())
    }
  }

  const advanceArrays = useCallback((dtFrames: number) => {
    const c = controlsRef.current
    const cellTarget = Math.round(c.cells.cellCount)
    const outTarget = Math.round(c.cells.outCellCount)
    const haloTarget = Math.round(c.cells.haloCellCount)
    const sqTarget = Math.round(c.shapes.sqCount)

    ensureLength(cellsRef.current, cellTarget, () => spawnCell(Math.random()))
    const cells = cellsRef.current
    for (let i = 0; i < cells.length; i++) {
      cells[i].progress += cells[i].speed * dtFrames
      if (cells[i].progress >= 1) {
        cells[i] = spawnCell(0)
      }
    }

    ensureLength(outCellsRef.current, outTarget, () => spawnOutCell(Math.random()))
    const out = outCellsRef.current
    for (let i = 0; i < out.length; i++) {
      out[i].progress += out[i].speed * dtFrames
      if (out[i].progress >= 1) {
        out[i] = spawnOutCell(0)
      }
    }

    ensureLength(haloCellsRef.current, haloTarget, () => spawnHaloCell(Math.random()))
    const halos = haloCellsRef.current
    for (let i = 0; i < halos.length; i++) {
      halos[i].progress += halos[i].speed * dtFrames
      if (halos[i].progress >= 1) {
        halos[i] = spawnHaloCell(0)
      }
    }

    ensureLength(squaresRef.current, sqTarget, () =>
      spawnSquare(Math.random(), squaresRef.current.length, sqTarget)
    )
    const sq = squaresRef.current
    for (let i = 0; i < sq.length; i++) {
      sq[i].progress += sq[i].speed * dtFrames
      if (sq[i].progress >= 1) {
        sq[i] = spawnSquare(0, sq[i].idx, sqTarget)
      }
    }
  }, [])

  const ensureBgBuffer = useCallback((lW: number, lH: number) => {
    const cur = bgSizeRef.current
    if (bgBufferRef.current && cur.w === lW && cur.h === lH) {
      return
    }
    const stops = resolveHalftoneBgStopsFromSemantics(semanticCanvasVarRef.current)
    bgBufferRef.current = buildBackgroundBuffer(lW, lH, stops)
    bgSizeRef.current = { w: lW, h: lH }
  }, [])

  const drawFrame = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dtFrames: number) => {
      const c = controlsRef.current
      const lW = canvas.offsetWidth
      const lH = canvas.offsetHeight
      ensureBgBuffer(lW, lH)

      const dtSec = 0.016 * dtFrames
      timeRef.current += dtSec
      entryRawRef.current = Math.min(1, entryRawRef.current + dtSec / ENTRY_DURATION_SEC)
      const frame: FrameParams = {
        c,
        lW,
        lH,
        cx: lW * 0.5,
        cy: lH * 0.5,
        t: timeRef.current,
        dtFrames,
        entry: easeOutQuart(entryRawRef.current),
      }

      advanceArrays(dtFrames)
      projectCellsInto(cellsRef.current, cellPosPool.current, frame, c.structure.rRing2)
      projectOutCellsInto(outCellsRef.current, outCellPosPool.current, frame, c.structure.rRing2)
      projectHaloCellsInto(
        haloCellsRef.current,
        haloCellPosPool.current,
        frame,
        c.cells.haloCellSigma
      )

      ctx.clearRect(0, 0, lW, lH)
      if (bgBufferRef.current) {
        ctx.drawImage(bgBufferRef.current, 0, 0, lW, lH)
      }

      const wallNow = performance.now() / 1000
      if (onReadoutRef.current && wallNow - lastReadoutWallRef.current >= 0.1) {
        lastReadoutWallRef.current = wallNow
        const cols = Math.ceil(frame.lW / frame.c.grid.spacing) + 2
        const rows = Math.ceil(frame.lH / frame.c.grid.spacing) + 2
        onReadoutRef.current({
          dots: cols * rows,
          freq: frame.c.structure.coreFreq,
          amp: Math.abs(Math.sin(frame.t * 1.1) * Math.cos(frame.t * 0.7)),
        })
      }
      const cp = cursorPosRef.current
      const tr = c.trail
      compactHoverRipples(
        hoverRipplePtsRef.current,
        wallNow,
        HOVER_RIPPLE_MAX_AGE_SEC,
        tr.hoverRippleFade
      )

      const tSamples = expireAndWeightTrail(trailPtsRef, tr.trailLife, wallNow)
      if (cp.active && cp.x > 0) {
        tSamples.push({ x: cp.x, y: cp.y, weight: 1.0 })
      }

      const sigPx = tr.trailSigma * lW
      const trailTwoSig2 = 2 * sigPx * sigPx
      const cullR2 = (sigPx * 2.8) ** 2

      const hoverRippleField: HoverRippleFieldParams = {
        wallNow,
        lW,
        lH,
        sigmaNorm: tr.hoverRippleSigma,
        expandNormPerSec: tr.hoverRippleSpeed,
        peak: tr.hoverRippleGain,
        fadePerSec: tr.hoverRippleFade,
        lagSec: tr.hoverRippleLag,
        secondaryPeak: tr.hoverRippleSecondary,
      }
      if (tr.hoverRippleBlend > 0) {
        prepareHoverRipples(hoverRipplePtsRef.current, hoverRippleField, hoverRippleBakeRef.current)
      } else {
        hoverRippleBakeRef.current.prepared.length = 0
      }

      const sqFields = buildSquareFields(
        squaresRef.current,
        frame,
        c.shapes.sqHalf,
        c.shapes.minSize,
        c.shapes.maxSize
      )

      drawFusedGrid(ctx, frame, {
        cellPos: cellPosPool.current,
        haloCellPos: haloCellPosPool.current,
        hoverRippleBake: hoverRippleBakeRef.current,
        outCellPos: outCellPosPool.current,
        tSamples,
        trailTwoSig2,
        cullR2,
        sqFields,
        sqEdge: c.shapes.sqEdge,
        shapeDotMin: Math.min(c.shapes.shapeDotMin, c.shapes.shapeDotMax),
        shapeDotMax: Math.max(c.shapes.shapeDotMin, c.shapes.shapeDotMax),
      })
    },
    [advanceArrays, ensureBgBuffer]
  )

  const renderStaticFrame = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      timeRef.current = 0
      // Skip the entry animation under reduced-motion — freeze at the settled idle frame.
      entryRawRef.current = 1
      drawFrame(ctx, canvas, 0)
    },
    [drawFrame]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    reducedMotionRef.current = prefersReducedMotion()

    const resize = () => {
      resizeCanvas(canvas, ctx)
      bgBufferRef.current = null
      if (reducedMotionRef.current) {
        renderStaticFrame(ctx, canvas)
      }
    }
    resize()
    window.addEventListener('resize', resize)

    // Site config color tab → `personalization-store` updates `<html style>` (`--primary`, `--surface-*`,
    // etc.). That does not always change `class` / `data-ui-theme`, so we watch `style` too.
    // Coalesce to one rAF: `updateCSSVariables` sets many properties per tick.
    let themeResyncRaf = 0
    const scheduleThemeDrivenCanvasRefresh = () => {
      if (themeResyncRaf !== 0) {
        return
      }
      themeResyncRaf = requestAnimationFrame(() => {
        themeResyncRaf = 0
        bgBufferRef.current = null
        // Bitmap is not CSS-reactive: rAF loop redraws in normal motion; reduced-motion must repaint.
        if (reducedMotionRef.current) {
          renderStaticFrame(ctx, canvas)
        }
      })
    }
    const themeObserver = new MutationObserver(scheduleThemeDrivenCanvasRefresh)
    themeObserver.observe(document.documentElement, {
      attributeFilter: ['class', 'data-ui-theme', 'style'],
      attributes: true,
    })

    const motionMedia =
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null
    const onMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches
      if (e.matches) {
        cancelAnimationFrame(rafRef.current)
        renderStaticFrame(ctx, canvas)
      } else {
        lastFrameMsRef.current = 0
        rafRef.current = requestAnimationFrame(loop)
      }
    }
    motionMedia?.addEventListener('change', onMotionChange)

    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop)
      if (!visibleRef.current || document.hidden || reducedMotionRef.current) {
        lastFrameMsRef.current = now
        return
      }
      const last = lastFrameMsRef.current || now
      lastFrameMsRef.current = now
      const dtSec = (now - last) / 1000
      const dtFrames = Math.min(2, Math.max(0, dtSec * 60))

      try {
        drawFrame(ctx, canvas, dtFrames)
      } catch (err) {
        console.error('halftone draw error:', err)
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const sx = canvas.offsetWidth / rect.width
      const sy = canvas.offsetHeight / rect.height
      const mx = (e.clientX - rect.left) * sx
      const my = (e.clientY - rect.top) * sy
      const wallNow = performance.now() / 1000
      const wasActive = cursorPosRef.current.active
      cursorPosRef.current = { x: mx, y: my, active: true }

      const tr = controlsRef.current.trail
      if (tr.hoverRippleGain > 0 && tr.hoverRippleBlend > 0) {
        const dx = mx - lastRippleXRef.current
        const dy = my - lastRippleYRef.current
        const moved = Math.hypot(dx, dy)
        const since = wallNow - lastRippleWallRef.current
        const shouldSpawn =
          !wasActive || moved >= HOVER_RIPPLE_SPAWN_MIN_PX || since >= HOVER_RIPPLE_SPAWN_MIN_SEC
        if (shouldSpawn) {
          const ripples = hoverRipplePtsRef.current
          ripples.push({ x: mx, y: my, born: wallNow })
          if (ripples.length > HOVER_RIPPLE_MAX) {
            ripples.splice(0, ripples.length - HOVER_RIPPLE_MAX)
          }
          lastRippleXRef.current = mx
          lastRippleYRef.current = my
          lastRippleWallRef.current = wallNow
        }
      }

      trailPtsRef.current.push({ born: wallNow, x: mx, y: my })
      if (trailPtsRef.current.length > TRAIL_MAX) {
        trailPtsRef.current.shift()
      }
    }
    const onPointerLeave = () => {
      cursorPosRef.current.active = false
    }
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerleave', onPointerLeave)
    canvas.addEventListener('pointercancel', onPointerLeave)

    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting
      },
      { threshold: 0 }
    )
    io.observe(canvas)

    const onVisibilityChange = () => {
      if (!document.hidden) {
        lastFrameMsRef.current = 0
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    if (reducedMotionRef.current) {
      renderStaticFrame(ctx, canvas)
    } else {
      rafRef.current = requestAnimationFrame(loop)
    }

    return () => {
      if (themeResyncRaf !== 0) {
        cancelAnimationFrame(themeResyncRaf)
      }
      cancelAnimationFrame(rafRef.current)
      themeObserver.disconnect()
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      canvas.removeEventListener('pointercancel', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      motionMedia?.removeEventListener('change', onMotionChange)
      io.disconnect()
    }
  }, [drawFrame, renderStaticFrame])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--background)',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: 'default',
          touchAction: 'none',
        }}
      />
      <button
        aria-label="Replay entry animation"
        className="halftone-replay-btn"
        onClick={() => replayRef.current()}
        title="Replay entry animation"
        type="button"
      >
        <RotateCcw aria-hidden="true" size={14} />
      </button>
      <style>{`
        .halftone-replay-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: color-mix(in srgb, var(--foreground) 6%, transparent);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--muted-foreground);
          cursor: pointer;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transition: background 160ms ease, color 160ms ease, border-color 160ms ease;
        }
        .halftone-replay-btn:hover {
          background: color-mix(in srgb, var(--foreground) 10%, transparent);
          border-color: var(--ring);
          color: var(--foreground);
        }
        .halftone-replay-btn:focus-visible {
          outline: 2px solid var(--ring);
          outline-offset: 2px;
        }
        .halftone-replay-btn:active {
          transform: scale(0.94);
        }
        .dialkit-panel-inner { padding-bottom: 10px; }
        .dialkit-select-dropdown { max-height: 280px; overflow-y: auto; }
        .dialkit-panel[data-position="bottom-right"] { top: 50%; bottom: auto; transform: translateY(-50%); }
        @media (max-width: 480px) {
          .dialkit-panel[data-position="bottom-right"] { top: auto; bottom: 16px; transform: none; }
        }
      `}</style>
      <DialRoot defaultOpen={false} mode="popover" position="bottom-right" productionEnabled />
    </div>
  )
}

export default Halftone
