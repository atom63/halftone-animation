import type { HalftoneReadout } from './halftone'

interface InstrumentStripProps {
  dark: boolean
  githubUrl: string
  onToggleDark: () => void
  readouts: HalftoneReadout
}

export function InstrumentStrip({ dark, githubUrl, onToggleDark, readouts }: InstrumentStripProps) {
  return (
    <footer className="i-strip">
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
          GIT
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
    </footer>
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
