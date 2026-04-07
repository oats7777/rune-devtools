# rune-devtools-vite

Vite plugin for [rune-devtools](https://www.npmjs.com/package/rune-devtools) — automatically injects the devtools overlay in development mode.

## Install

```bash
pnpm add -D rune-devtools rune-devtools-vite
```

## Usage

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import runeDevtools from 'rune-devtools-vite';

export default defineConfig({
  plugins: [runeDevtools()],
});
```

## Options

```typescript
runeDevtools({
  position: 'bottom',       // 'bottom' | 'top'
  shortcut: 'ctrl+shift+d', // toggle shortcut
  maxEvents: 1000,           // max timeline entries
  defaultPanel: 'tree',      // default panel
})
```

Production builds are not affected — the devtools script is only injected when the Vite dev server is running.
