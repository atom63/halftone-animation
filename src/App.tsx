import { Github, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Halftone } from './halftone'

const GITHUB_URL = 'https://github.com/atom63/halftone-animation'

export default function App() {
  const [dark, setDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        background: 'var(--background)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          height: 48,
          flexShrink: 0,
          background: 'var(--header-bg)',
          borderBottom: '1px solid var(--header-border)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.06em',
            color: 'var(--foreground)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          halftone
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub"
            title="View source on GitHub"
            style={iconBtn}
          >
            <Github size={15} aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={() => setDark(d => !d)}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={iconBtn}
          >
            {dark ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
          </button>
        </div>
      </header>

      <main style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Halftone />
      </main>
    </div>
  )
}

const iconBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--muted-foreground)',
  cursor: 'pointer',
  textDecoration: 'none',
  transition: 'background 160ms ease, color 160ms ease, border-color 160ms ease',
} as const
