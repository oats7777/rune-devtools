import type { ListViewOpRecord } from '../../../types';

/**
 * Returns a badge background color for a given ListView operation type.
 */
function opColor(op: ListViewOpRecord['operation']): string {
  switch (op) {
    case 'set':
      return '#1c75ff';
    case 'append':
    case 'prepend':
      return '#22c55e';
    case 'remove':
    case 'removeByIndex':
      return '#ef4444';
    case 'move':
      return '#eab308';
    case 'reset':
    default:
      return '#888';
  }
}

/**
 * Truncates and serializes an unknown value for display.
 */
function previewValue(val: unknown, maxLen = 40): string {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  try {
    const s = JSON.stringify(val);
    if (s.length > maxLen) return s.slice(0, maxLen) + '…';
    return s;
  } catch {
    return String(val);
  }
}

/**
 * Formats a timestamp as a locale time string (HH:MM:SS.mmm).
 */
function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

export class ListViewOpRow {
  readonly element: HTMLElement;

  constructor(private _record: ListViewOpRecord) {
    this.element = document.createElement('div');
    this.element.style.cssText =
      'display: flex; flex-direction: column; padding: 4px 8px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 12px;';
    this._render();
  }

  private _render(): void {
    // ── Top row: badge + diff summary + timestamp ──────────────────
    const topRow = document.createElement('div');
    topRow.style.cssText = 'display: flex; align-items: center; gap: 6px; flex-wrap: wrap;';

    // Operation badge
    const badge = document.createElement('span');
    badge.textContent = this._record.operation;
    badge.style.cssText = `
      display: inline-block;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      background: ${opColor(this._record.operation)};
      color: #fff;
      flex-shrink: 0;
    `.replace(/\s+/g, ' ').trim();
    topRow.appendChild(badge);

    // Diff counts
    const diffEl = document.createElement('span');
    diffEl.style.cssText =
      "font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; display: flex; gap: 4px; align-items: center;";

    if (this._record.added.length > 0) {
      const addedEl = document.createElement('span');
      addedEl.textContent = `+${this._record.added.length}`;
      addedEl.style.color = '#22c55e';
      diffEl.appendChild(addedEl);
    }

    if (this._record.removed.length > 0) {
      const removedEl = document.createElement('span');
      removedEl.textContent = `-${this._record.removed.length}`;
      removedEl.style.color = '#ef4444';
      diffEl.appendChild(removedEl);
    }

    if (this._record.kept.length > 0) {
      const keptEl = document.createElement('span');
      keptEl.textContent = `=${this._record.kept.length}`;
      keptEl.style.color = '#888';
      diffEl.appendChild(keptEl);
    }

    if (this._record.fromIndex !== undefined && this._record.toIndex !== undefined) {
      const moveEl = document.createElement('span');
      moveEl.textContent = `↕ ${this._record.fromIndex}→${this._record.toIndex}`;
      moveEl.style.color = '#eab308';
      diffEl.appendChild(moveEl);
    }

    topRow.appendChild(diffEl);

    // Spacer
    const spacer = document.createElement('span');
    spacer.style.flex = '1';
    topRow.appendChild(spacer);

    // Timestamp
    const tsEl = document.createElement('span');
    tsEl.textContent = formatTimestamp(this._record.timestamp);
    tsEl.style.cssText =
      "font-family: 'SF Mono', 'Fira Code', monospace; font-size: 10px; color: #555; flex-shrink: 0;";
    topRow.appendChild(tsEl);

    this.element.appendChild(topRow);

    // ── Data preview row ────────────────────────────────────────────
    const hasData =
      this._record.added.length > 0 || this._record.removed.length > 0;

    if (hasData) {
      const dataRow = document.createElement('div');
      dataRow.style.cssText =
        "display: flex; gap: 8px; flex-wrap: wrap; margin-top: 3px; font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px;";

      if (this._record.added.length > 0) {
        const addedPreview = document.createElement('span');
        const items = this._record.added.slice(0, 3).map((v) => previewValue(v, 20)).join(', ');
        const suffix = this._record.added.length > 3 ? ` +${this._record.added.length - 3} more` : '';
        addedPreview.textContent = `+ [${items}${suffix}]`;
        addedPreview.style.color = '#22c55e';
        dataRow.appendChild(addedPreview);
      }

      if (this._record.removed.length > 0) {
        const removedPreview = document.createElement('span');
        const items = this._record.removed.slice(0, 3).map((v) => previewValue(v, 20)).join(', ');
        const suffix = this._record.removed.length > 3 ? ` +${this._record.removed.length - 3} more` : '';
        removedPreview.textContent = `- [${items}${suffix}]`;
        removedPreview.style.color = '#ef4444';
        dataRow.appendChild(removedPreview);
      }

      this.element.appendChild(dataRow);
    }
  }
}
