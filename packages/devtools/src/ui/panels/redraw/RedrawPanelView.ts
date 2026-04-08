import { pipe, flatMap, filter, toArray, sort, map, reduce } from '@fxts/core';
import type { DevtoolsStore } from '../../../store';
import type { RedrawRecord } from '../../../types';
import { RedrawRow } from './RedrawRowView';

interface ViewStats {
  constructorName: string;
  count: number;
  total: number;
  avg: number;
  max: number;
}

function durationColor(ms: number): string {
  if (ms < 2) return '#4caf50';
  if (ms <= 10) return '#f9c74f';
  return '#ef4444';
}

function formatMs(ms: number): string {
  if (ms < 1) return `${ms.toFixed(2)}ms`;
  if (ms < 100) return `${ms.toFixed(1)}ms`;
  return `${Math.round(ms)}ms`;
}

export class RedrawPanel {
  readonly element: HTMLElement;
  readonly id = 'redraw';
  readonly label = 'Redraw Tracker';

  private _listEl: HTMLElement;
  private _emptyEl: HTMLElement;
  private _summaryBodyEl: HTMLElement;
  private _summaryToggleEl: HTMLElement;
  private _summaryCollapsed = false;
  private _refreshInterval: number | null = null;
  private _lastCount = 0;

  // Local cleared-at timestamp: ignore records before this
  private _clearedAt = 0;

  constructor(private _store: DevtoolsStore) {
    this.element = document.createElement('div');
    this.element.style.cssText =
      'display: flex; flex-direction: column; height: 100%; min-height: 0;';

    // ── Header with clear button ──────────────────────────────────
    const header = document.createElement('div');
    header.style.cssText =
      'display: flex; align-items: center; justify-content: flex-end; padding: 4px 8px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0;';

    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear';
    clearBtn.style.cssText =
      'padding: 2px 10px; border-radius: 6px; border: none; cursor: pointer; font-size: 12px; font-family: inherit; background: rgba(255,255,255,0.07); color: #aaa; transition: all 0.15s ease;';
    clearBtn.addEventListener('mouseover', () => {
      clearBtn.style.background = 'rgba(255,255,255,0.12)';
      clearBtn.style.color = '#e0e0e0';
    });
    clearBtn.addEventListener('mouseout', () => {
      clearBtn.style.background = 'rgba(255,255,255,0.07)';
      clearBtn.style.color = '#aaa';
    });
    clearBtn.addEventListener('click', () => this.clear());
    header.appendChild(clearBtn);
    this.element.appendChild(header);

    // ── Performance Summary section ────────────────────────────────
    const summarySection = document.createElement('div');
    summarySection.style.cssText =
      'flex-shrink: 0; border-bottom: 1px solid rgba(255,255,255,0.06);';

    const summaryHeader = document.createElement('div');
    summaryHeader.style.cssText =
      'display: flex; align-items: center; gap: 6px; padding: 5px 8px; cursor: pointer; user-select: none;';
    summaryHeader.addEventListener('click', () => this._toggleSummary());

    this._summaryToggleEl = document.createElement('span');
    this._summaryToggleEl.textContent = '▼';
    this._summaryToggleEl.style.cssText =
      'font-size: 10px; color: #666; transition: transform 0.15s ease; display: inline-block;';

    const summaryLabel = document.createElement('span');
    summaryLabel.textContent = 'Performance Summary';
    summaryLabel.style.cssText =
      'font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.05em;';

    summaryHeader.appendChild(this._summaryToggleEl);
    summaryHeader.appendChild(summaryLabel);
    summarySection.appendChild(summaryHeader);

    this._summaryBodyEl = document.createElement('div');
    this._summaryBodyEl.style.cssText = 'padding: 2px 0 4px 0;';
    summarySection.appendChild(this._summaryBodyEl);

    this.element.appendChild(summarySection);

    // ── List container ─────────────────────────────────────────────
    this._listEl = document.createElement('div');
    this._listEl.style.cssText = 'flex: 1; overflow: auto; padding: 4px 0; min-height: 0;';
    this.element.appendChild(this._listEl);

    // ── Empty state ────────────────────────────────────────────────
    this._emptyEl = document.createElement('div');
    this._emptyEl.className = 'rune-dt-empty';
    this._emptyEl.textContent = 'No redraws recorded';
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
    const all = pipe(
      this._store.redraws.values(),
      flatMap((buffer) => buffer.toArray()),
      filter((record) => record.timestamp > this._clearedAt),
      sort((a, b) => b.timestamp - a.timestamp),
      toArray,
    );

    this._refreshSummary(all);

    if (all.length === 0) {
      this._listEl.style.display = 'none';
      this._emptyEl.style.display = '';
      this._lastCount = 0;
      return;
    }

    // Only rebuild DOM if record count changed (preserve expanded state)
    if (all.length === this._lastCount) return;
    this._lastCount = all.length;

    this._emptyEl.style.display = 'none';
    this._listEl.style.display = '';
    this._listEl.innerHTML = '';

    for (const record of all) {
      const row = new RedrawRow(record);
      this._listEl.appendChild(row.element);
    }
  }

  clear(): void {
    this._clearedAt = Date.now();
    this._listEl.innerHTML = '';
    this._listEl.style.display = 'none';
    this._emptyEl.style.display = '';
    this._lastCount = 0;
    this._refreshSummary([]);
  }

  // ── Private helpers ───────────────────────────────────────────────

  private _toggleSummary(): void {
    this._summaryCollapsed = !this._summaryCollapsed;
    this._summaryBodyEl.style.display = this._summaryCollapsed ? 'none' : '';
    this._summaryToggleEl.style.transform = this._summaryCollapsed ? 'rotate(-90deg)' : '';
  }

  private _refreshSummary(records: RedrawRecord[]): void {
    if (this._summaryCollapsed) return;

    this._summaryBodyEl.innerHTML = '';

    if (records.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'No data';
      empty.style.cssText = 'padding: 4px 16px; font-size: 11px; color: #555;';
      this._summaryBodyEl.appendChild(empty);
      return;
    }

    // Aggregate per view using @fxts/core reduce (direct 3-arg form with seed)
    const statsMap = reduce(
      (acc: Map<string, ViewStats>, record: RedrawRecord) => {
        const existing = acc.get(record.viewId);
        if (existing) {
          existing.count += 1;
          existing.total += record.duration;
          existing.max = Math.max(existing.max, record.duration);
          existing.avg = existing.total / existing.count;
        } else {
          acc.set(record.viewId, {
            constructorName: record.constructorName,
            count: 1,
            total: record.duration,
            avg: record.duration,
            max: record.duration,
          });
        }
        return acc;
      },
      new Map<string, ViewStats>(),
      records,
    );

    // Convert to array, sort by total time descending
    const stats = pipe(
      statsMap.values(),
      map((s: ViewStats) => s),
      sort((a: ViewStats, b: ViewStats) => b.total - a.total),
      toArray,
    );

    for (const stat of stats) {
      const row = document.createElement('div');
      row.style.cssText =
        "display: flex; align-items: center; gap: 8px; padding: 3px 16px; font-size: 11px; font-family: 'SF Mono', 'Fira Code', monospace;";

      // View name
      const nameEl = document.createElement('span');
      nameEl.textContent = stat.constructorName;
      nameEl.style.cssText = 'color: #ccc; font-weight: 500; font-family: inherit; flex-shrink: 0; min-width: 120px;';
      row.appendChild(nameEl);

      // Count
      const countEl = document.createElement('span');
      countEl.textContent = `\u00d7${stat.count}`;
      countEl.style.cssText = 'color: #666; flex-shrink: 0; min-width: 36px;';
      row.appendChild(countEl);

      // Spacer
      const spacer = document.createElement('span');
      spacer.style.cssText = 'flex: 1;';
      row.appendChild(spacer);

      // Total
      const totalEl = document.createElement('span');
      totalEl.textContent = `total: ${formatMs(stat.total)}`;
      totalEl.style.cssText = 'color: #777; flex-shrink: 0;';
      row.appendChild(totalEl);

      // Avg
      const avgEl = document.createElement('span');
      avgEl.textContent = `avg: ${formatMs(stat.avg)}`;
      avgEl.style.cssText = `color: ${durationColor(stat.avg)}; font-weight: 600; flex-shrink: 0;`;
      row.appendChild(avgEl);

      // Max
      const maxEl = document.createElement('span');
      maxEl.textContent = `max: ${formatMs(stat.max)}`;
      maxEl.style.cssText = `color: ${durationColor(stat.max)}; flex-shrink: 0;`;
      row.appendChild(maxEl);

      // Warning icon for slow views
      if (stat.avg > 10) {
        const warnEl = document.createElement('span');
        warnEl.textContent = '\u26a0\ufe0f';
        warnEl.title = 'Slow view: average redraw > 10ms';
        warnEl.style.cssText = 'flex-shrink: 0;';
        row.appendChild(warnEl);
      }

      this._summaryBodyEl.appendChild(row);
    }
  }
}
