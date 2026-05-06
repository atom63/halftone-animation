# halftone

An animated halftone dot field rendered on a `<canvas>` with live parameter controls via [DialKit](https://github.com/atom63/dialkit).

Part of the [ATOM63](https://atom63.io) portfolio.

## Features

- Real-time canvas renderer at 60fps
- Organic dot-field animation with Gaussian blob cells, concentric rings, and a Voronoi-textured core
- Entry animation — expanding shock-wave reveal on load
- Hover ripples and cursor trail interaction
- Shape SDFs (square / circle / triangle) with smooth morphing transitions
- Live parameter panel (open with the ⚙️ button) — tweak anything in real time
- Light and dark mode, respects `prefers-color-scheme`
- `prefers-reduced-motion` support — freezes at the settled idle frame

## Getting started

```bash
npm install
npm run dev
```

Or with pnpm:

```bash
pnpm install
pnpm dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Scripts

| Command | Description |
| --- | --- |
| `dev` | Start Vite dev server |
| `build` | Type-check and build for production |
| `preview` | Preview production build |
| `lint` | Lint with Biome |
| `typecheck` | Type-check without emitting |

## Stack

- [React 19](https://react.dev)
- [Vite 7](https://vite.dev)
- [DialKit](https://github.com/atom63/dialkit) — live parameter panel
- [Lucide React](https://lucide.dev) — icons
- [Biome](https://biomejs.dev) — linting and formatting
- TypeScript

## License

MIT
