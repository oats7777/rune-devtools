import type { EventListenerRecord, EventDispatchRecord } from '../../../types';

/**
 * Truncates JSON stringified detail to a max length for display.
 */
function previewDetail(detail: unknown, maxLen = 60): string {
  if (detail === null || detail === undefined) return 'null';
  try {
    const json = JSON.stringify(detail);
    if (json.length <= maxLen) return json;
    return json.slice(0, maxLen) + '…';
  } catch {
    return String(detail);
  }
}

/**
 * Formats a timestamp as a short HH:MM:SS.mmm string.
 */
function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

export class EventRow {
  readonly element: HTMLElement;

  constructor(
    private _record: EventListenerRecord | EventDispatchRecord,
    private _type: 'listener' | 'dispatch',
  ) {
    this.element = document.createElement('div');
    this.element.className = 'rune-devtools-row';
    this.element.style.cssText =
      'display: flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 6px; font-size: 12px; min-height: 24px; flex-wrap: wrap;';
    this._render();
  }

  // ── Private helpers ───────────────────────────────────────────────

  private _render(): void {
    this.element.innerHTML = '';

    // Badge
    const badge = document.createElement('span');
    if (this._type === 'listener') {
      badge.textContent = '@on';
      badge.style.cssText =
        'display: inline-flex; align-items: center; padding: 1px 6px; border-radius: 6px; font-size: 11px; font-weight: 600; background: rgba(28,117,255,0.18); color: #1c75ff; flex-shrink: 0;';
    } else {
      badge.textContent = 'dispatch';
      badge.style.cssText =
        'display: inline-flex; align-items: center; padding: 1px 6px; border-radius: 6px; font-size: 11px; font-weight: 600; background: rgba(180,100,220,0.18); color: #c07ae0; flex-shrink: 0;';
    }
    this.element.appendChild(badge);

    // Event type
    const eventTypeEl = document.createElement('span');
    eventTypeEl.textContent = this._record.eventType;
    eventTypeEl.style.cssText =
      "font-family: 'SF Mono', 'Fira Code', monospace; color: #e2b340; flex-shrink: 0;";
    this.element.appendChild(eventTypeEl);

    if (this._type === 'listener') {
      const rec = this._record as EventListenerRecord;

      // Selector (if any)
      if (rec.selector) {
        const selectorEl = document.createElement('span');
        selectorEl.textContent = rec.selector;
        selectorEl.style.cssText =
          "font-family: 'SF Mono', 'Fira Code', monospace; color: #6bb5ff; flex-shrink: 0;";
        this.element.appendChild(selectorEl);
      }

      // Separator
      const sep = document.createElement('span');
      sep.textContent = '→';
      sep.style.cssText = 'color: #555; flex-shrink: 0;';
      this.element.appendChild(sep);

      // Handler name
      const handlerEl = document.createElement('span');
      handlerEl.textContent = rec.handlerName;
      handlerEl.style.cssText =
        "font-family: 'SF Mono', 'Fira Code', monospace; color: #88d3a0; flex-shrink: 0;";
      this.element.appendChild(handlerEl);

      // Spacer
      const spacer = document.createElement('span');
      spacer.style.cssText = 'flex: 1;';
      this.element.appendChild(spacer);

      // View name
      const viewEl = document.createElement('span');
      viewEl.textContent = rec.constructorName;
      viewEl.style.cssText = 'color: #888; font-size: 11px; flex-shrink: 0;';
      this.element.appendChild(viewEl);
    } else {
      const rec = this._record as EventDispatchRecord;

      // Detail preview
      const detailEl = document.createElement('span');
      detailEl.textContent = previewDetail(rec.detail);
      detailEl.style.cssText =
        "font-family: 'SF Mono', 'Fira Code', monospace; color: #aaa; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;";
      this.element.appendChild(detailEl);

      // View name
      const viewEl = document.createElement('span');
      viewEl.textContent = rec.constructorName;
      viewEl.style.cssText = 'color: #888; font-size: 11px; flex-shrink: 0;';
      this.element.appendChild(viewEl);

      // Timestamp
      const tsEl = document.createElement('span');
      tsEl.textContent = formatTime(rec.timestamp);
      tsEl.style.cssText =
        "font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; color: #555; flex-shrink: 0;";
      this.element.appendChild(tsEl);
    }
  }
}
