import type { RedrawRecord, AttributeChange } from '../../../types';

/**
 * Returns a CSS color for the given duration (ms).
 * green < 2ms, yellow 2-10ms, red > 10ms
 */
function durationColor(ms: number): string {
  if (ms < 2) return '#4caf50';
  if (ms <= 10) return '#f9c74f';
  return '#ef4444';
}

/**
 * Formats duration with up to 2 decimal places.
 */
function formatDuration(ms: number): string {
  if (ms < 1) return `${ms.toFixed(2)}ms`;
  if (ms < 100) return `${ms.toFixed(1)}ms`;
  return `${Math.round(ms)}ms`;
}

/**
 * Returns a badge-style label for an AttributeChange type.
 */
function changeTypeStyle(type: AttributeChange['type']): string {
  switch (type) {
    case 'added':
      return 'color: #4caf50;';
    case 'removed':
      return 'color: #ef4444;';
    case 'modified':
    default:
      return 'color: #f9c74f;';
  }
}

export class RedrawRow {
  readonly element: HTMLElement;
  private _expanded = false;
  private _detailEl: HTMLElement | null = null;

  constructor(private _record: RedrawRecord) {
    this.element = document.createElement('div');
    this.element.className = 'rune-devtools-row';
    this.element.style.cssText =
      'display: flex; flex-direction: column; border-radius: 6px; overflow: hidden;';
    this._render();
  }

  // ── Private helpers ───────────────────────────────────────────────

  private _render(): void {
    // Main row
    const row = document.createElement('div');
    row.style.cssText =
      'display: flex; align-items: center; gap: 8px; padding: 4px 8px; font-size: 12px; min-height: 26px; cursor: default;';

    // View name
    const nameEl = document.createElement('span');
    nameEl.textContent = this._record.constructorName;
    nameEl.style.cssText = 'color: #e0e0e0; font-weight: 500; flex-shrink: 0;';
    row.appendChild(nameEl);

    // viewId (muted)
    const idEl = document.createElement('span');
    idEl.textContent = `#${this._record.viewId.slice(0, 8)}`;
    idEl.style.cssText =
      "font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; color: #555; flex-shrink: 0;";
    row.appendChild(idEl);

    // Spacer
    const spacer = document.createElement('span');
    spacer.style.cssText = 'flex: 1;';
    row.appendChild(spacer);

    // renderCount change
    const countEl = document.createElement('span');
    countEl.textContent = `${this._record.renderCountBefore} → ${this._record.renderCountAfter}`;
    countEl.style.cssText =
      "font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; color: #888; flex-shrink: 0;";
    row.appendChild(countEl);

    // Duration
    const durEl = document.createElement('span');
    durEl.textContent = formatDuration(this._record.duration);
    durEl.style.cssText = `font-family: 'SF Mono', 'Fira Code', monospace; font-size: 12px; font-weight: 600; color: ${durationColor(this._record.duration)}; flex-shrink: 0;`;
    row.appendChild(durEl);

    // Expand button (only if attribute changes exist)
    if (this._record.attributeChanges.length > 0) {
      const expandBtn = document.createElement('button');
      expandBtn.textContent = `${this._record.attributeChanges.length} attr`;
      expandBtn.style.cssText =
        'padding: 1px 6px; border-radius: 6px; border: none; cursor: pointer; font-size: 11px; font-family: inherit; background: rgba(255,255,255,0.07); color: #aaa; flex-shrink: 0; transition: background 0.15s ease;';
      expandBtn.title = 'Toggle attribute changes';
      expandBtn.addEventListener('click', () => this._toggleExpand(expandBtn));
      row.appendChild(expandBtn);
    }

    this.element.appendChild(row);

    // Detail container (hidden initially)
    this._detailEl = document.createElement('div');
    this._detailEl.style.display = 'none';
    this._detailEl.style.cssText =
      'display: none; padding: 2px 8px 6px 16px; border-top: 1px solid rgba(255,255,255,0.04);';
    this.element.appendChild(this._detailEl);
  }

  private _toggleExpand(btn: HTMLButtonElement): void {
    if (!this._detailEl) return;
    this._expanded = !this._expanded;

    if (this._expanded) {
      this._detailEl.style.display = 'block';
      this._detailEl.innerHTML = '';
      btn.style.background = 'rgba(28,117,255,0.18)';
      btn.style.color = '#1c75ff';
      this._renderAttributeChanges(this._detailEl);
    } else {
      this._detailEl.style.display = 'none';
      btn.style.background = 'rgba(255,255,255,0.07)';
      btn.style.color = '#aaa';
    }
  }

  private _renderAttributeChanges(container: HTMLElement): void {
    for (const change of this._record.attributeChanges) {
      const line = document.createElement('div');
      line.style.cssText =
        "display: flex; align-items: baseline; gap: 6px; padding: 2px 0; font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px;";

      // Type badge
      const typeEl = document.createElement('span');
      typeEl.textContent = change.type;
      typeEl.style.cssText = `font-size: 10px; font-weight: 600; text-transform: uppercase; flex-shrink: 0; ${changeTypeStyle(change.type)}`;
      line.appendChild(typeEl);

      // Attribute name
      const nameEl = document.createElement('span');
      nameEl.textContent = change.name;
      nameEl.style.cssText = 'color: #aaa; flex-shrink: 0;';
      line.appendChild(nameEl);

      // Value change
      if (change.type === 'modified') {
        const oldEl = document.createElement('span');
        oldEl.textContent = change.oldValue ?? 'null';
        oldEl.style.cssText = 'color: #ef4444; text-decoration: line-through;';
        line.appendChild(oldEl);

        const arrow = document.createElement('span');
        arrow.textContent = '→';
        arrow.style.cssText = 'color: #555;';
        line.appendChild(arrow);

        const newEl = document.createElement('span');
        newEl.textContent = change.newValue ?? 'null';
        newEl.style.cssText = 'color: #4caf50;';
        line.appendChild(newEl);
      } else if (change.type === 'added') {
        const valEl = document.createElement('span');
        valEl.textContent = change.newValue ?? 'null';
        valEl.style.cssText = 'color: #4caf50;';
        line.appendChild(valEl);
      } else if (change.type === 'removed') {
        const valEl = document.createElement('span');
        valEl.textContent = change.oldValue ?? 'null';
        valEl.style.cssText = 'color: #ef4444; text-decoration: line-through;';
        line.appendChild(valEl);
      }

      container.appendChild(line);
    }
  }
}
