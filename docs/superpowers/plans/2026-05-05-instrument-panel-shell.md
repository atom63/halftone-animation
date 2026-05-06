# Instrument Panel Shell — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic 48px top-header SaaS chrome with an instrument-panel bottom strip — full-bleed canvas, live monospace readouts, keycap-style text controls.

**Architecture:** Add an `onReadout` callback to `Halftone` that emits throttled live values from `drawFrame`. `App.tsx` holds readout state and passes it to a new `InstrumentStrip` component. The strip renders as a bottom-anchored flex row with embedded CSS (same pattern as the existing `Header.tsx`).

**Tech Stack:** React, TypeScript, DM Mono (via CSS custom property `--font-mono`), existing CSS tokens in `theme.css`

---

## File Map

| Action | File | What changes |
|--------|------|-------------|
| Modify | `src/halftone/index.tsx` | Add `HalftoneReadout` type + `onReadout` prop; emit throttled readouts from `drawFrame` |
| Create | `src/InstrumentStrip.tsx` | Bottom strip component with label, readouts, keycap controls |
| Modify | `src/App.tsx` | New layout (full-bleed canvas + strip), readout state, remove Header |

`Header.tsx`, `engine.ts`, `theme.css`, `index.html` — no changes.

---

## Task 1: Add `HalftoneReadout` type and `onReadout` prop

**Files:**
- Modify: `src/halftone/index.tsx`

- [ ] **Step 1: Add the `HalftoneReadout` interface and extend `HalftoneProps`**

Find the existing `HalftoneProps` interface (~line 813):

```ts
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
```

Replace the existing `HalftoneProps` (which only has `canvasCssVar`) with this two-property version.

- [ ] **Step 2: Destructure `onReadout` in the component signature**

Find:
```ts
export function Halftone({ canvasCssVar = 'var(--background)' }: HalftoneProps = {}) {
```

Replace with:
```ts
export function Halftone({ canvasCssVar = 'var(--background)', onReadout }: HalftoneProps = {}) {
```

- [ ] **Step 3: Add the two refs that throttle readout emission**

Immediately after the `panelIdRef` declaration (~line 861), add:

```ts
const onReadoutRef = useRef(onReadout)
onReadoutRef.current = onReadout
const lastReadoutWallRef = useRef(0)
```

- [ ] **Step 4: Emit readouts inside `drawFrame`**

`drawFrame` is a `useCallback` starting around line 979. Inside it, locate the existing line:

```ts
const wallNow = performance.now() / 1000
```

Immediately after that line, insert:

```ts
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
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /Users/youzhang/Documents/GitHub/atom63-vite/apps/halftone
pnpm exec tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
git add apps/halftone/src/halftone/index.tsx
git commit -m "feat(halftone): add onReadout callback with throttled engine metrics"
```

---

## Task 2: Create `InstrumentStrip.tsx`

**Files:**
- Create: `src/InstrumentStrip.tsx`

- [ ] **Step 1: Create the file**

Create `apps/halftone/src/InstrumentStrip.tsx` with this content:

```tsx
import type { HalftoneReadout } from './halftone'

interface InstrumentStripProps {
  dark: boolean
  githubUrl: string
  onToggleDark: () => void
  readouts: HalftoneReadout
}

export function InstrumentStrip({ dark, githubUrl, onToggleDark, readouts }: InstrumentStripProps) {
  return (
    <div className="i-strip">
      <style>{styles}</style>

      <span className="i-strip-label">HALFTONE ANIMATION</span>

      <div className="i-strip-readouts">
        <span className="i-readout">
          <span className="i-readout-key">DOTS</span>
          <span className="i-readout-val">{readouts.dots.toLocaleString()}</span>
        </span>
        <span className="i-readout">
          <span className="i-readout-key">FRQ</span>
          <span className="i-readout-val">{readouts.freq.toFixed(1)}</span>
        </span>
        <span className="i-readout">
          <span className="i-readout-key">AMP</span>
          <span className="i-readout-val">{readouts.amp.toFixed(2)}</span>
        </span>
      </div>

      <div className="i-strip-controls">
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="i-key"
          aria-label="View source on GitHub"
          title="View source on GitHub"
        >
          SRC
        </a>
        <button
          type="button"
          onClick={onToggleDark}
          className="i-key"
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? '○' : '◐'}
        </button>
      </div>
    </div>
  )
}

const styles = `
  .i-strip {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 0 14px;
    height: 36px;
    flex-shrink: 0;
    background: var(--header-bg);
    border-top: 1px solid var(--header-border);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    user-select: none;
  }

  .i-strip-label {
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.15em;
    color: var(--muted-foreground);
    white-space: nowrap;
  }

  .i-strip-readouts {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
  }

  .i-readout {
    display: inline-flex;
    align-items: baseline;
    gap: 5px;
    font-family: var(--font-mono);
  }

  .i-readout-key {
    font-size: 8px;
    font-weight: 500;
    letter-spacing: 0.1em;
    color: var(--muted-foreground);
  }

  .i-readout-val {
    font-size: 11px;
    font-weight: 400;
    color: var(--foreground);
    opacity: 0.85;
    min-width: 3ch;
  }

  .i-strip-controls {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .i-key {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 7px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: transparent;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.06em;
    color: var(--muted-foreground);
    cursor: pointer;
    text-decoration: none;
    outline: none;
    transition: border-color 80ms ease-out, color 80ms ease-out;
  }
  .i-key:hover {
    border-color: color-mix(in oklch, var(--ring) 60%, var(--border));
    color: var(--foreground);
  }
  .i-key:active {
    transform: scale(0.91);
  }
  .i-key:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
`
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/youzhang/Documents/GitHub/atom63-vite/apps/halftone
pnpm exec tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add apps/halftone/src/InstrumentStrip.tsx
git commit -m "feat(halftone): add InstrumentStrip component with keycap controls and live readouts"
```

---

## Task 3: Rewire `App.tsx` layout

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace `App.tsx` entirely**

The full new content of `apps/halftone/src/App.tsx`:

```tsx
import { useState } from 'react'
import { InstrumentStrip } from './InstrumentStrip'
import { Halftone } from './halftone'
import type { HalftoneReadout } from './halftone'

const GITHUB_URL = 'https://github.com/atom63/halftone-animation'

export default function App() {
  const [dark, setDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  const [readouts, setReadouts] = useState<HalftoneReadout>({ amp: 0, dots: 0, freq: 16 })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <main
        aria-label="Halftone animation canvas"
        style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
      >
        <Halftone onReadout={setReadouts} />
      </main>
      <InstrumentStrip
        dark={dark}
        githubUrl={GITHUB_URL}
        onToggleDark={() => setDark(d => !d)}
        readouts={readouts}
      />
    </div>
  )
}
```

Note: the `useEffect` for toggling `document.documentElement.classList` is removed — the anti-FOUC script in `index.html` already handles the initial class, and the `dark` toggle must still update the class. Add the effect back:

```tsx
import { useEffect, useState } from 'react'
import { InstrumentStrip } from './InstrumentStrip'
import { Halftone } from './halftone'
import type { HalftoneReadout } from './halftone'

const GITHUB_URL = 'https://github.com/atom63/halftone-animation'

export default function App() {
  const [dark, setDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  const [readouts, setReadouts] = useState<HalftoneReadout>({ amp: 0, dots: 0, freq: 16 })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <main
        aria-label="Halftone animation canvas"
        style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
      >
        <Halftone onReadout={setReadouts} />
      </main>
      <InstrumentStrip
        dark={dark}
        githubUrl={GITHUB_URL}
        onToggleDark={() => setDark(d => !d)}
        readouts={readouts}
      />
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/youzhang/Documents/GitHub/atom63-vite/apps/halftone
pnpm exec tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Start the dev server and verify visually**

```bash
cd /Users/youzhang/Documents/GitHub/atom63-vite/apps/halftone
pnpm dev
```

Open `http://localhost:5173` and verify:

1. **No top header bar** — canvas fills all the way to the top of the viewport
2. **Bottom strip visible** — 36px strip at the very bottom
3. **Label reads** `HALFTONE ANIMATION` in small dimmed caps (left side)
4. **Three readouts** visible: `DOTS XXXX`, `FRQ 16.0`, `AMP 0.XX` (center-left)
5. **AMP value oscillates** every second without any interaction
6. **`[SRC]` link** appears on right — clicking opens GitHub
7. **`[◐]` / `[○]` button** toggles dark/light mode — canvas background and strip both switch
8. **Hover over canvas** — `AMP` value moves (the breathe oscillation responds to `frame.t`)
9. **Keycap hover states** — border brightens on hover, scale-down on press
10. **Replay button** (top-right corner of canvas) still works

- [ ] **Step 4: Commit**

```bash
git add apps/halftone/src/App.tsx
git commit -m "feat(halftone): instrument panel shell — full-bleed canvas, bottom strip, live readouts"
```

---

## Task 4: Sync to public GitHub repo

- [ ] **Step 1: Push the subtree to the public repo**

```bash
cd /Users/youzhang/Documents/GitHub/atom63-vite
git subtree push --prefix=apps/halftone halftone-public main
```

If `halftone-public` remote isn't configured:

```bash
git remote add halftone-public https://github.com/atom63/halftone-animation.git
git subtree push --prefix=apps/halftone halftone-public main
```

Expected: push succeeds, commits appear on `https://github.com/atom63/halftone-animation`
