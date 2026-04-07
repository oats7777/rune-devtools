import type { DevtoolsStore } from '../../../store';
import type { TimelineEntry, TimelineEventType } from '../../../types';
import { TimelineRow } from './TimelineRowView';

const ALL_TYPES: TimelineEventType[] = [
  'render',
  'mount',
  'unmount',
  'redraw',
  'event',
  'dispatch',
  'listview',
  'registry',
  'ssr',
];

/**
 * Returns the filter button color for a given event type.
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

export class TimelinePanel {
  readonly element: HTMLElement;
  readonly id = 'timeline';
  readonly label = 'Timeline';

  private _filters = new Set<TimelineEventType>([
    'render',
    'mount',
    'unmount',
    'redraw',
    'event',
    'dispatch',
    'listview',
    'registry',
    'ssr',
  ]);

  private _refreshInterval: number | null = null;
  private _baseTime = 0;

  private _filterBar: HTMLElement;
  private _listEl: HTMLElement;
  private _emptyEl: HTMLElement;
  private _filterBtns = new Map<TimelineEventType, HTMLButtonElement>();

  constructor(
    private _store: DevtoolsStore,
    private _onNavigate?: (type: TimelineEventType, viewId: string) => void,
  ) {
    this.element = document.createElement('div');
    this.element.style.cssText =
      'display: flex; flex-direction: column; height: 100%; min-height: 0;';

    // ── Filter toggles ─────────────────────────────────────────────
    this._filterBar = document.createElement('div');
    this._filterBar.style.cssText =
      'display: flex; flex-wrap: wrap; gap: 4px; padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0;';

    for (const type of ALL_TYPES) {
      const btn = document.createElement('button');
      btn.textContent = type;
      btn.dataset.type = type;
      btn.style.cssText = this._filterBtnStyle(type, true);
      btn.addEventListener('click', () => this._toggleFilter(type));
      this._filterBar.appendChild(btn);
      this._filterBtns.set(type, btn);
    }

    this.element.appendChild(this._filterBar);

    // ── List container ─────────────────────────────────────────────
    this._listEl = document.createElement('div');
    this._listEl.style.cssText = 'flex: 1; overflow: auto; padding: 4px 0; min-height: 0;';
    this.element.appendChild(this._listEl);

    // ── Empty state ────────────────────────────────────────────────
    this._emptyEl = document.createElement('div');
    this._emptyEl.className = 'rune-dt-empty';
    this._emptyEl.textContent = 'No timeline events recorded';
    this._emptyEl.style.display = 'none';
    this.element.appendChild(this._emptyEl);

    this.refresh();
  }

  // ── Lifecycle ─────────────────────────────────────────────────────

  activate(): void {
    this.refresh();
    if (this._refreshInterval === null) {
      this._refreshInterval = window.setInterval(() => this.refresh(), 500);
    }
  }

  deactivate(): void {
    if (this._refreshInterval !== null) {
      clearInterval(this._refreshInterval);
      this._refreshInterval = null;
    }
  }

  // ── Public API ────────────────────────────────────────────────────

  refresh(): void {
    const all = this._store.timeline.getAll();

    // Set base time from earliest entry
    if (all.length > 0 && this._baseTime === 0) {
      this._baseTime = all[0].timestamp;
    }

    // Apply filters
    const filtered = all.filter((e) => this._filters.has(e.type));

    this._listEl.innerHTML = '';

    if (filtered.length === 0) {
      this._listEl.style.display = 'none';
      this._emptyEl.style.display = '';
      return;
    }

    this._emptyEl.style.display = 'none';
    this._listEl.style.display = '';

    // Entries in chronological order (oldest first, newest at bottom)
    for (const entry of filtered) {
      const row = new TimelineRow(entry, this._baseTime, this._onNavigate);
      this._listEl.appendChild(row.element);
    }

    // Auto-scroll to bottom
    this._listEl.scrollTop = this._listEl.scrollHeight;
  }

  // ── Private helpers ───────────────────────────────────────────────

  private _toggleFilter(type: TimelineEventType): void {
    if (this._filters.has(type)) {
      this._filters.delete(type);
    } else {
      this._filters.add(type);
    }

    const btn = this._filterBtns.get(type);
    if (btn) {
      btn.style.cssText = this._filterBtnStyle(type, this._filters.has(type));
    }

    this.refresh();
  }

  private _filterBtnStyle(type: TimelineEventType, active: boolean): string {
    const color = typeColor(type);
    if (active) {
      return `
        padding: 2px 8px;
        border-radius: 4px;
        border: 1px solid ${color};
        cursor: pointer;
        font-size: 10px;
        font-weight: 600;
        font-family: inherit;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        background: ${color}28;
        color: ${color};
        transition: all 0.15s ease;
      `.replace(/\s+/g, ' ').trim();
    } else {
      return `
        padding: 2px 8px;
        border-radius: 4px;
        border: 1px solid rgba(255,255,255,0.08);
        cursor: pointer;
        font-size: 10px;
        font-weight: 600;
        font-family: inherit;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        background: transparent;
        color: #555;
        transition: all 0.15s ease;
      `.replace(/\s+/g, ' ').trim();
    }
  }
}
