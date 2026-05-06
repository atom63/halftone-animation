# Instrument Panel Shell — Design Spec

**Date:** 2026-05-05
**Project:** apps/halftone
**Status:** Approved

---

## Problem

The current shell (48px header bar, centered canvas, lucide icon buttons) reads as generic SaaS chrome. The layout pattern is identical to a thousand developer tools. The goal is a visual identity where the UI language *explains* what the app is — a mathematical instrument — rather than wrapping it in template scaffolding.

---

## Design Direction: Instrument Panel

The UI is modelled on scientific hardware readouts — oscilloscopes, darkroom timers, spectrometer panels. Every element has a functional reason to exist. Nothing decorates.

---

## Structure

Remove the 48px top header entirely. Replace with a **single bottom data strip**, 36px tall, spanning full viewport width.

The canvas fills all space above the strip — top edge, left edge, right edge all bleed to the viewport boundary. No margins, no centering void.

```
┌─────────────────────────────────────────────────┐
│                                                 │
│              [canvas, edge-to-edge]             │
│                                                 │
├─────────────────────────────────────────────────┤
│ HALFTONE ANIMATION   DOTS 1,247  FREQ 8.3  AMP 0.61  [SRC]  [◐] │
└─────────────────────────────────────────────────┘
```

The strip has a `1px` top border rule. Surface is dark and slightly translucent — a monitor bezel, not a website footer.

---

## Typography & Readouts

### Panel Label

- Text: `HALFTONE ANIMATION`
- Font: DM Mono 500
- Size: 9px
- Letter-spacing: 0.15em
- Color: `var(--foreground)` at ~40% opacity
- All-caps, left-anchored in the strip
- Role: hardware panel label, not a page title

### Live Readouts

Three values piped from the animation engine, displayed immediately right of the panel label with a gap — left-aligned as a group, not centered:

| Key | Value | Description |
|-----|-------|-------------|
| `DOTS` | integer (e.g. `1,247`) | Active dot count, changes with viewport size |
| `FREQ` | float to 1dp (e.g. `8.3`) | Wave frequency from engine |
| `AMP` | float to 2dp (e.g. `0.61`) | Amplitude peak (0.00–1.00) |

Each readout is a label-value pair:
- Label: 8px DM Mono, dimmed (~35% opacity), all-caps
- Value: 11px DM Mono, brighter (~85% opacity)
- Values update at ~10fps (throttled from rAF) so they're readable, not flickering

The readouts are the key detail that makes the strip feel *connected* to the canvas. On hover ripples, the numbers visibly shift — the UI reacts to the art.

**Data contract:** The engine exposes readout values via a callback or a React ref passed into `<Halftone>`. `App.tsx` holds state, passes a setter into `Halftone`, and passes the current values into the strip.

---

## Controls

Two controls, right-anchored. **No lucide icons. Pure text and Unicode.**

### `[SRC]` — Source link

- Links to `https://github.com/atom63/halftone-animation`
- Renders as an `<a>` tag
- Text: `SRC` in DM Mono
- Style: 1px solid border, 4px border-radius (keycap feel, not pill)
- Padding: `2px 6px`
- Hover: border brightens from ~20% → ~60% foreground opacity (instant snap, no fade)
- Active: `transform: scale(0.93)`

### `[◐]` — Theme toggle

- Text character: `◐` (dark mode) / `○` (light mode)
- Renders as a `<button type="button">`
- Same keycap treatment as `[SRC]`
- `aria-label`: "Switch to light mode" / "Switch to dark mode"

Both controls use the same base CSS class. No background fill on hover — border opacity change only.

---

## Color & Surface

The strip uses existing CSS custom properties from `theme.css`. No new tokens required.

- Strip background: `var(--header-bg)` (already translucent dark/light variants)
- Top border: `var(--header-border)`
- Label & dim text: `var(--muted-foreground)`
- Readout values: `var(--foreground)` at ~85% opacity
- Keycap border idle: `var(--border)`
- Keycap border hover: `color-mix(in oklch, var(--ring) 60%, var(--border))`

The canvas background continues to use `var(--background)` — the existing ink-dark blue-black in dark mode, near-white in light mode.

---

## Component Boundaries

| Component | Responsibility |
|-----------|---------------|
| `App.tsx` | Layout: canvas container + strip. Holds `dark` state and `readouts` state. |
| `InstrumentStrip.tsx` | Renders the bottom strip. Props: `readouts`, `githubUrl`, `dark`, `onToggleDark`. Self-contained CSS (embedded `<style>` block, same pattern as current `Header.tsx`). |
| `halftone/index.tsx` | Accepts an `onReadout` callback prop. Fires throttled readout updates. |
| `halftone/engine.ts` | Exposes dot count and current wave params — no UI coupling. |

---

## What Does Not Change

- The canvas animation engine (`engine.ts`) — zero changes to rendering logic
- `theme.css` — no new tokens
- `index.html` — no changes
- The existing chromatic blue dot field and hover ripple behavior

---

## Out of Scope

- Parameter controls (Dialkit sliders) — separate future feature
- Mobile-specific layout changes
- Any changes to the public GitHub repo README
