/**
 * HighlightOverlay renders a positioned overlay on top of a host-app element
 * to visualise the selected Rune view.  It lives OUTSIDE the Shadow DOM --
 * it is appended directly to `document.body` with `position: fixed` and a
 * very high `z-index` so it sits above all page content.
 */
export class HighlightOverlay {
  private _overlay: HTMLElement;
  private _tooltip: HTMLElement;
  private _visible = false;

  constructor() {
    this._overlay = document.createElement('div');
    Object.assign(this._overlay.style, {
      position: 'fixed',
      pointerEvents: 'none',
      zIndex: '2147483646',
      border: '2px solid #1c75ff',
      background: 'rgba(28, 117, 255, 0.08)',
      borderRadius: '4px',
      display: 'none',
      transition: 'all 0.15s ease',
      boxSizing: 'border-box',
    } satisfies Partial<CSSStyleDeclaration>);

    this._tooltip = document.createElement('div');
    Object.assign(this._tooltip.style, {
      position: 'absolute',
      bottom: '100%',
      left: '0',
      marginBottom: '4px',
      padding: '2px 6px',
      background: '#1e1e2e',
      color: '#e0e0e0',
      fontSize: '11px',
      fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
      borderRadius: '4px',
      whiteSpace: 'nowrap',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
      lineHeight: '1.4',
    } satisfies Partial<CSSStyleDeclaration>);
    this._overlay.appendChild(this._tooltip);

    document.body.appendChild(this._overlay);
  }

  get visible(): boolean {
    return this._visible;
  }

  highlight(element: HTMLElement, viewName: string, size?: string): void {
    const rect = element.getBoundingClientRect();

    Object.assign(this._overlay.style, {
      display: 'block',
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });

    const dims = size ?? `${Math.round(rect.width)} x ${Math.round(rect.height)}`;
    this._tooltip.textContent = `${viewName}  ${dims}`;
    this._visible = true;

    // Flip tooltip below if it would go offscreen at the top
    if (rect.top < 30) {
      this._tooltip.style.bottom = 'auto';
      this._tooltip.style.top = '100%';
      this._tooltip.style.marginBottom = '0';
      this._tooltip.style.marginTop = '4px';
    } else {
      this._tooltip.style.bottom = '100%';
      this._tooltip.style.top = 'auto';
      this._tooltip.style.marginBottom = '4px';
      this._tooltip.style.marginTop = '0';
    }
  }

  clear(): void {
    this._overlay.style.display = 'none';
    this._visible = false;
  }

  destroy(): void {
    this._overlay.remove();
  }
}
