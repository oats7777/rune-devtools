export const DEVTOOLS_MARKER = Symbol('__runeDevtools__');

export const DEFAULTS = {
  position: 'bottom' as const,
  shortcut: 'ctrl+shift+d',
  maxEvents: 1000,
  maxRedrawsPerView: 100,
  unmountCleanupDelay: 30_000,
  defaultPanel: 'tree',
} as const;
