import { useEffect, useState } from 'react'
import { Header } from './Header'
import { Halftone } from './halftone'

const GITHUB_URL = 'https://github.com/atom63/halftone-animation'
const TITLE = 'halftone animation'

export default function App() {
  const [dark, setDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--background)' }}>
      <Header
        title={TITLE}
        githubUrl={GITHUB_URL}
        dark={dark}
        onToggleDark={() => setDark(d => !d)}
      />
      <main
        aria-label="Halftone animation canvas"
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 'min(100%, calc(100dvh - 48px))',
            aspectRatio: '1',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Halftone />
        </div>
      </main>
    </div>
  )
}
