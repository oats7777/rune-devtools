import type { TimelineEntry, TimelineEventType } from '../../../types';

/**
 * Returns the dot color for a given timeline event type.
 */
function typeColor(type: TimelineEventType): string {
  switch (type) {
    case 'render':
    case 'mount':
    case 'unmount':
      return '#4ade80';
    case 'redraw':
      return '#facc15';
    case 'event':
    case 'dispatch':
      return '#a78bfa';
    case 'listview':
      return '#60a5fa';
    case 'registry':
      return '#999';
    case 'ssr':
      return '#22d3ee';
    default:
      return '#888';
  }
}

/**
 * Formats a relative timestamp as "+1.2s" or "+123ms".
 */
function formatRelative(ts: number, base: number): string {
  const diff = ts - base;
  if (diff < 0) return '+0ms';
  if (diff < 1000) return `+${diff.toFixed(0)}ms`;
  return `+${(diff / 1000).toFixed(1)}s`;
}

export class TimelineRow {
  readonly element: HTMLElement;

  constructor(
    private _entry: TimelineEntry,
    private _baseTime: number,
    private _onNavigate?: (type: TimelineEventType, viewId: string) => void,
  ) {
    this.element = document.createElement('div');
    this.element.style.cssText =
      'display: flex; align-items: center; gap: 8px; padding: 3px 8px; font-size: 12px; min-height: 24px; cursor: default; border-radius: 4px; transition: background 0.1s ease;';
    this.element.addEventListener('mouseover', () => {
      this.element.style.background = 'rgba(255,255,255,0.04)';
    });
    this.element.addEventListener('mouseout', () => {
      this.element.style.background = '';
    });

    if (this._onNavigate) {
      this.element.style.cursor = 'pointer';
      this.element.addEventListener('click', () => {
        this._onNavigate!(this._entry.type, this._entry.viewId);
      });
    }

    this._render();
  }

  private _render(): void {
    const color = typeColor(this._entry.type);

    // Colored dot
    const dot = document.createElement('span');
    dot.style.cssText = `
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${color};
      flex-shrink: 0;
    `.replace(/\s+/g, ' ').trim();
    this.element.appendChild(dot);

    // Relative timestamp
    const tsEl = document.createElement('span');
    tsEl.textContent = formatRelative(this._entry.timestamp, this._baseTime);
    tsEl.style.cssText =
      "font-family: 'SF Mono', 'Fira Code', monospace; font-size: 10px; color: #555; flex-shrink: 0; min-width: 48px;";
    this.element.appendChild(tsEl);

    // Event type label
    const typeEl = document.createElement('span');
    typeEl.textContent = this._entry.type;
    typeEl.style.cssText = `
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: ${color};
      flex-shrink: 0;
      min-width: 56px;
    `.replace(/\s+/g, ' ').trim();
    this.element.appendChild(typeEl);

    // Summary / action label
    const summaryEl = document.createElement('span');
    summaryEl.textContent = this._entry.summary;
    summaryEl.style.cssText = 'color: #e0e0e0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
    this.element.appendChild(summaryEl);

    // Target view name
    const viewEl = document.createElement('span');
    viewEl.textContent = this._entry.constructorName;
    viewEl.style.cssText =
      'font-size: 11px; color: #666; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 120px;';
    this.element.appendChild(viewEl);
  }
}
