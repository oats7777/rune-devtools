export const STYLES = `
  :host {
    all: initial;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    color: #e0e0e0;
    line-height: 1.4;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* ── Root container ──────────────────────────────── */
  .rune-devtools-root {
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    color: #e0e0e0;
    line-height: 1.4;
  }

  .rune-devtools-root--top {
    bottom: auto;
    top: 16px;
    flex-direction: column-reverse;
  }

  /* ── Toolbar ─────────────────────────────────────── */
  .rune-devtools-toolbar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px;
    background: #1e1e2e;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
    user-select: none;
    transition: all 0.2s ease;
  }

  .rune-devtools-toolbar--collapsed .rune-devtools-toolbar__buttons {
    display: none;
  }

  .rune-devtools-toolbar--collapsed .rune-devtools-toolbar__divider {
    display: none;
  }

  .rune-devtools-toolbar__buttons {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .rune-devtools-toolbar__divider {
    width: 1px;
    height: 20px;
    background: rgba(255, 255, 255, 0.1);
    margin: 0 2px;
    flex-shrink: 0;
  }

  /* ── Logo button ─────────────────────────────────── */
  .rune-devtools-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 10px;
    background: transparent;
    cursor: pointer;
    padding: 0;
    color: #1c75ff;
    transition: background 0.15s ease;
    flex-shrink: 0;
  }

  .rune-devtools-logo:hover {
    background: rgba(28, 117, 255, 0.12);
  }

  .rune-devtools-logo svg {
    width: 20px;
    height: 20px;
  }

  /* ── Toolbar button ──────────────────────────────── */
  .rune-devtools-toolbar-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 10px;
    background: #2a2a3e;
    cursor: pointer;
    padding: 0;
    color: #aaa;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .rune-devtools-toolbar-button:hover {
    background: #363650;
    color: #e0e0e0;
  }

  .rune-devtools-toolbar-button.active {
    background: #1c75ff;
    color: #fff;
  }

  .rune-devtools-toolbar-button.active:hover {
    background: #3388ff;
  }

  .rune-devtools-toolbar-button svg {
    width: 16px;
    height: 16px;
  }

  /* ── Panel container ─────────────────────────────── */
  .rune-devtools-panel-container {
    width: 480px;
    max-height: 60vh;
    background: #16161a;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .rune-devtools-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #1e1e2e;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    min-height: 36px;
    flex-shrink: 0;
  }

  .rune-devtools-panel-header__title {
    font-size: 12px;
    font-weight: 600;
    color: #e0e0e0;
    letter-spacing: 0.02em;
  }

  .rune-devtools-panel-header__actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .rune-devtools-panel-body {
    flex: 1;
    overflow: auto;
    padding: 8px;
    min-height: 0;
  }

  .rune-devtools-panel-content {
    display: none;
    flex-direction: column;
    height: 100%;
  }

  .rune-devtools-panel-content.active {
    display: flex;
  }

  /* ── Scrollbar ───────────────────────────────────── */
  .rune-devtools-panel-body::-webkit-scrollbar {
    width: 6px;
  }

  .rune-devtools-panel-body::-webkit-scrollbar-track {
    background: transparent;
  }

  .rune-devtools-panel-body::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  .rune-devtools-panel-body::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  /* ── Utility classes ─────────────────────────────── */
  .rune-dt-text-primary {
    color: #e0e0e0;
  }

  .rune-dt-text-secondary {
    color: #aaa;
  }

  .rune-dt-text-muted {
    color: #666;
  }

  .rune-dt-text-accent {
    color: #1c75ff;
  }

  .rune-dt-mono {
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
    font-size: 12px;
  }

  .rune-dt-badge {
    display: inline-flex;
    align-items: center;
    padding: 1px 6px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    background: rgba(28, 117, 255, 0.15);
    color: #1c75ff;
  }

  .rune-dt-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.1s ease;
  }

  .rune-dt-row:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  .rune-dt-row.selected {
    background: rgba(28, 117, 255, 0.12);
  }

  .rune-dt-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    color: #666;
    font-size: 12px;
    text-align: center;
  }

  .rune-dt-close-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: #aaa;
    cursor: pointer;
    padding: 0;
    transition: all 0.15s ease;
  }

  .rune-dt-close-button:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #e0e0e0;
  }

  .rune-dt-close-button svg {
    width: 14px;
    height: 14px;
  }
`;
