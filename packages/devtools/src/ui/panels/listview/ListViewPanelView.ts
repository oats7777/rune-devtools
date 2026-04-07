import type { DevtoolsStore } from '../../../store';
import type { ListViewOpRecord } from '../../../types';
import { ListViewOpRow } from './ListViewOpView';

/**
 * Creates a collapsible section for a single ListView's operation log.
 */
function makeCollapsibleSection(
  title: string,
  subtitle: string,
): { section: HTMLElement; body: HTMLElement; setCount: (n: number) => void } {
  const section = document.createElement('div');
  section.style.cssText =
    'border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 2px;';

  let expanded = true;

  const header = document.createElement('div');
  header.style.cssText =
    'display: flex; align-items: center; gap: 6px; padding: 5px 8px; cursor: pointer; user-select: none;';

  const arrow = document.createElement('span');
  arrow.textContent = '▼';
  arrow.style.cssText = 'font-size: 9px; color: #666; flex-shrink: 0;';

  const titleEl = document.createElement('span');
  titleEl.textContent = title;
  titleEl.style.cssText =
    'font-size: 12px; font-weight: 600; color: #e0e0e0;';

  const subtitleEl = document.createElement('span');
  subtitleEl.textContent = subtitle;
  subtitleEl.style.cssText = 'font-size: 11px; color: #555; margin-left: 4px;';

  const spacer = document.createElement('span');
  spacer.style.flex = '1';

  const countBadge = document.createElement('span');
  countBadge.style.cssText =
    'font-size: 11px; color: #888; font-family: monospace;';

  header.appendChild(arrow);
  header.appendChild(titleEl);
  header.appendChild(subtitleEl);
  header.appendChild(spacer);
  header.appendChild(countBadge);

  const body = document.createElement('div');
  body.style.paddingBottom = '4px';

  header.addEventListener('click', () => {
    expanded = !expanded;
    arrow.textContent = expanded ? '▼' : '▶';
    body.style.display = expanded ? '' : 'none';
  });

  section.appendChild(header);
  section.appendChild(body);

  return {
    section,
    body,
    setCount: (n: number) => {
      countBadge.textContent = `${n} ops`;
    },
  };
}

export class ListViewPanel {
  readonly element: HTMLElement;
  readonly id = 'listview';
  readonly label = 'ListView Monitor';

  private _listEl: HTMLElement;
  private _emptyEl: HTMLElement;
  private _refreshInterval: number | null = null;

  constructor(private _store: DevtoolsStore) {
    this.element = document.createElement('div');
    this.element.style.cssText =
      'display: flex; flex-direction: column; height: 100%; min-height: 0;';

    // ── List container ─────────────────────────────────────────────
    this._listEl = document.createElement('div');
    this._listEl.style.cssText = 'flex: 1; overflow: auto; padding: 4px 0; min-height: 0;';
    this.element.appendChild(this._listEl);

    // ── Empty state ────────────────────────────────────────────────
    this._emptyEl = document.createElement('div');
    this._emptyEl.className = 'rune-dt-empty';
    this._emptyEl.textContent = 'No ListView operations recorded';
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
    this._listEl.innerHTML = '';

    if (this._store.listViewOps.size === 0) {
      this._listEl.style.display = 'none';
      this._emptyEl.style.display = '';
      return;
    }

    this._emptyEl.style.display = 'none';
    this._listEl.style.display = '';

    for (const [viewId, buffer] of this._store.listViewOps) {
      const ops = buffer.toArray();
      if (ops.length === 0) continue;

      // Get constructor name from the most recent record
      const constructorName = ops[ops.length - 1].constructorName;
      const shortId = `#${viewId.slice(0, 8)}`;

      const { section, body, setCount } = makeCollapsibleSection(
        constructorName,
        shortId,
      );
      setCount(ops.length);

      // Render ops newest-first
      const sorted = [...ops].sort((a, b) => b.timestamp - a.timestamp);

      for (const record of sorted) {
        const opRow = new ListViewOpRow(record);
        // Check for redraw-triggered set: if previous op is 'set' within 1ms
        this._maybeAddRedrawBadge(opRow.element, record, ops);
        body.appendChild(opRow.element);
      }

      this._listEl.appendChild(section);
    }
  }

  // ── Private helpers ───────────────────────────────────────────────

  /**
   * If a 'set' operation has a timeline entry with type 'redraw' within 1ms,
   * append a "triggered by redraw" indicator to the row element.
   */
  private _maybeAddRedrawBadge(
    el: HTMLElement,
    record: ListViewOpRecord,
    allOps: ListViewOpRecord[],
  ): void {
    if (record.operation !== 'set') return;

    // Look for a 'redraw' type in the timeline within 1ms of this operation
    const timelineEntries = this._store.timeline.getAll();
    const triggered = timelineEntries.some(
      (entry) =>
        entry.type === 'redraw' &&
        entry.viewId === record.viewId &&
        Math.abs(entry.timestamp - record.timestamp) <= 1,
    );

    if (triggered) {
      const badge = document.createElement('span');
      badge.textContent = '↻ triggered by redraw';
      badge.style.cssText =
        'font-size: 10px; color: #facc15; margin-left: 6px; font-style: italic;';
      // Append to first child (top row) if it exists
      const topRow = el.firstElementChild as HTMLElement | null;
      if (topRow) {
        topRow.appendChild(badge);
      }
    }
  }
}
