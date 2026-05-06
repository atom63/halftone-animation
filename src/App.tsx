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
