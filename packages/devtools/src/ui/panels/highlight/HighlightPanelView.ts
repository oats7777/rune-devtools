import type { DevtoolsStore } from '../../../store';
import { HighlightOverlay } from '../../../highlight/HighlightOverlay';

export class HighlightPanel {
  readonly element: HTMLElement;
  readonly id = 'highlight';
  readonly label = 'DOM Highlight';

  private _active = false;
  private _mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private _clickHandler: ((e: MouseEvent) => void) | null = null;
  private _toggleEl: HTMLElement | null = null;
  private _statusEl: HTMLElement | null = null;

  constructor(
    private _store: DevtoolsStore,
    private _highlightOverlay: HighlightOverlay,
    private _onSelectView?: (viewId: string) => void,
  ) {
    this.element = document.createElement('div');
    this.element.style.cssText =
      'display: flex; flex-direction: column; height: 100%; min-height: 0; padding: 16px;';

    this._render();
  }

  // ── Lifecycle ─────────────────────────────────────────────────────

  activate(): void {
    // Panel becomes visible — no automatic highlight start
  }

  deactivate(): void {
    // Turn off highlight when panel is hidden
    if (this._active) {
      this._setActive(false);
    }
  }

  // ── Private helpers ───────────────────────────────────────────────

  private _render(): void {
    // ── Title row ──────────────────────────────────────────────────
    const titleEl = document.createElement('div');
    titleEl.textContent = 'DOM Highlight';
    titleEl.style.cssText =
      'font-size: 14px; font-weight: 600; color: #e0e0e0; margin-bottom: 8px;';
    this.element.appendChild(titleEl);

    // ── Description ────────────────────────────────────────────────
    const descEl = document.createElement('p');
    descEl.textContent =
      'When enabled, hover over any element in the page to see which Rune view owns it. ' +
      'Click an element to select that view in the Component Tree.';
    descEl.style.cssText =
      'font-size: 12px; color: #888; line-height: 1.5; margin: 0 0 20px 0;';
    this.element.appendChild(descEl);

    // ── Toggle row ─────────────────────────────────────────────────
    const toggleRow = document.createElement('div');
    toggleRow.style.cssText = 'display: flex; align-items: center; gap: 12px;';

    // Toggle switch
    const toggleTrack = document.createElement('div');
    toggleTrack.style.cssText =
      'position: relative; width: 44px; height: 24px; border-radius: 12px; cursor: pointer; transition: background 0.2s ease; flex-shrink: 0;';
    this._applyTrackStyle(toggleTrack, false);

    const toggleThumb = document.createElement('div');
    toggleThumb.style.cssText =
      'position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform 0.2s ease; box-shadow: 0 1px 4px rgba(0,0,0,0.4);';

    toggleTrack.appendChild(toggleThumb);
    this._toggleEl = toggleTrack;

    toggleTrack.addEventListener('click', () => {
      this._setActive(!this._active);
    });

    // Status label
    const statusEl = document.createElement('span');
    statusEl.textContent = 'OFF';
    statusEl.style.cssText =
      'font-size: 13px; font-weight: 600; color: #888; transition: color 0.2s ease;';
    this._statusEl = statusEl;

    toggleRow.appendChild(toggleTrack);
    toggleRow.appendChild(statusEl);
    this.element.appendChild(toggleRow);

    // ── Hint ───────────────────────────────────────────────────────
    const hintEl = document.createElement('p');
    hintEl.textContent =
      'Tip: Press Escape to turn off highlight mode.';
    hintEl.style.cssText =
      'font-size: 11px; color: #555; margin: 16px 0 0 0; line-height: 1.5;';
    this.element.appendChild(hintEl);
  }

  private _applyTrackStyle(el: HTMLElement, on: boolean): void {
    el.style.background = on ? '#1c75ff' : 'rgba(255,255,255,0.12)';
  }

  private _setActive(active: boolean): void {
    this._active = active;

    // Update toggle visual
    if (this._toggleEl) {
      this._applyTrackStyle(this._toggleEl, active);
      const thumb = this._toggleEl.firstElementChild as HTMLElement;
      if (thumb) {
        thumb.style.transform = active ? 'translateX(20px)' : 'translateX(0)';
      }
    }

    if (this._statusEl) {
      this._statusEl.textContent = active ? 'ON' : 'OFF';
      this._statusEl.style.color = active ? '#1c75ff' : '#888';
    }

    if (active) {
      this._installListeners();
    } else {
      this._uninstallListeners();
      this._highlightOverlay.clear();
    }
  }

  private _installListeners(): void {
    this._mouseMoveHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) {
        this._highlightOverlay.clear();
        return;
      }

      // Walk up the DOM tree to find a view element mapping
      const result = this._findViewForElement(target);
      if (result) {
        this._highlightOverlay.highlight(result.element, result.constructorName);
      } else {
        this._highlightOverlay.clear();
      }
    };

    this._clickHandler = (e: MouseEvent) => {
      if (!this._active) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const result = this._findViewForElement(target);
      if (result && this._onSelectView) {
        e.preventDefault();
        e.stopPropagation();
        this._onSelectView(result.viewId);
      }
    };

    document.addEventListener('mousemove', this._mouseMoveHandler, { passive: true });
    document.addEventListener('click', this._clickHandler, { capture: true });

    // Escape key turns off highlight
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this._active) {
        this._setActive(false);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  private _uninstallListeners(): void {
    if (this._mouseMoveHandler) {
      document.removeEventListener('mousemove', this._mouseMoveHandler);
      this._mouseMoveHandler = null;
    }
    if (this._clickHandler) {
      document.removeEventListener('click', this._clickHandler, { capture: true });
      this._clickHandler = null;
    }
  }

  /**
   * Walks up the DOM from `el` to find the nearest element that has a
   * Rune view mapping in the store (via data-rune-view-id attribute set by interceptor).
   */
  private _findViewForElement(
    el: HTMLElement,
  ): { viewId: string; constructorName: string; element: HTMLElement } | null {
    let current: HTMLElement | null = el;
    while (current && current !== document.body) {
      // Check for data-rune-view-id attribute (set by lifecycle interceptor)
      const viewId = current.dataset?.runeViewId ?? null;

      if (viewId) {
        const snapshot = this._store.components.get(viewId);
        if (snapshot) {
          return {
            viewId,
            constructorName: snapshot.constructorName,
            element: current,
          };
        }
      }

      current = current.parentElement;
    }
    return null;
  }
}
