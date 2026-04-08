import { pipe, flatMap, filter, toArray, sort } from '@fxts/core';
import type { DevtoolsStore } from '../../../store';
import type { RedrawRecord } from '../../../types';
import { RedrawRow } from './RedrawRowView';

export class RedrawPanel {
  readonly element: HTMLElement;
  readonly id = 'redraw';
  readonly label = 'Redraw Tracker';

  private _listEl: HTMLElement;
  private _emptyEl: HTMLElement;
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
  }
}
