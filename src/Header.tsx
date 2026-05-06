import { Github, Moon, Sun } from 'lucide-react'

interface HeaderProps {
  title: string
  githubUrl: string
  dark: boolean
  onToggleDark: () => void
}

export function Header({ title, githubUrl, dark, onToggleDark }: HeaderProps) {
  return (
    <header className="app-header">
      <style>{styles}</style>

      <span className="app-header-title">{title}</span>

      <div className="app-header-actions">
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="app-header-btn"
          aria-label="View source on GitHub"
          title="View source on GitHub"
        >
          <Github size={14} aria-hidden="true" />
        </a>
        <button
          type="button"
          onClick={onToggleDark}
          className="app-header-btn"
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark
            ? <Sun size={14} aria-hidden="true" />
            : <Moon size={14} aria-hidden="true" />}
        </button>
      </div>
    </header>
  )
}

const styles = `
  .app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 48px;
    flex-shrink: 0;
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--header-bg);
    border-bottom: 1px solid var(--header-border);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  .app-header-title {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.1em;
    color: var(--foreground);
    text-transform: lowercase;
    user-select: none;
  }

  .app-header-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .app-header-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--muted-foreground);
    cursor: pointer;
    text-decoration: none;
    transition:
      background 140ms ease-out,
      color 140ms ease-out,
      border-color 140ms ease-out,
      transform 80ms ease-out;
    outline: none;
  }
  .app-header-btn:hover {
    background: color-mix(in oklch, var(--foreground) 6%, transparent);
    color: var(--foreground);
    border-color: color-mix(in oklch, var(--ring) 60%, var(--border));
  }
  .app-header-btn:active {
    transform: scale(0.91);
  }
  .app-header-btn:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
`
