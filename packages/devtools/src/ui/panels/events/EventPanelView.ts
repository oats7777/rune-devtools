import type { DevtoolsStore } from '../../../store';
import { EventRow } from './EventRowView';

export class EventPanel {
  readonly element: HTMLElement;
  readonly id = 'events';
  readonly label = 'Event Monitor';

  private _activeTab: 'registered' | 'live' = 'registered';
  private _refreshInterval: number | null = null;

  private _tabRegisteredBtn: HTMLButtonElement;
  private _tabLiveBtn: HTMLButtonElement;
  private _listEl: HTMLElement;
  private _emptyEl: HTMLElement;

  constructor(private _store: DevtoolsStore) {
    this.element = document.createElement('div');
    this.element.style.cssText =
      'display: flex; flex-direction: column; height: 100%; min-height: 0;';

    // ── Tab bar ───────────────────────────────────────────────────
    const tabBar = document.createElement('div');
    tabBar.style.cssText =
      'display: flex; gap: 4px; padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0;';

    this._tabRegisteredBtn = this._makeTabButton('Registered');
    this._tabLiveBtn = this._makeTabButton('Live Log');

    this._tabRegisteredBtn.addEventListener('click', () => this._setTab('registered'));
    this._tabLiveBtn.addEventListener('click', () => this._setTab('live'));

    tabBar.appendChild(this._tabRegisteredBtn);
    tabBar.appendChild(this._tabLiveBtn);
    this.element.appendChild(tabBar);

    // ── List container ────────────────────────────────────────────
    this._listEl = document.createElement('div');
    this._listEl.style.cssText = 'flex: 1; overflow: auto; padding: 4px 0; min-height: 0;';
    this.element.appendChild(this._listEl);

    // ── Empty state ───────────────────────────────────────────────
    this._emptyEl = document.createElement('div');
    this._emptyEl.className = 'rune-dt-empty';
    this._emptyEl.style.display = 'none';
    this.element.appendChild(this._emptyEl);

    this._updateTabStyles();
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
    if (this._activeTab === 'registered') {
      this._renderRegistered();
    } else {
      this._renderLive();
    }
  }

  // ── Private helpers ───────────────────────────────────────────────

  private _makeTabButton(label: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText =
      'padding: 3px 10px; border-radius: 6px; border: none; cursor: pointer; font-size: 12px; font-family: inherit; transition: all 0.15s ease;';
    return btn;
  }

  private _setTab(tab: 'registered' | 'live'): void {
    this._activeTab = tab;
    this._updateTabStyles();
    this.refresh();
  }

  private _updateTabStyles(): void {
    const activeStyle =
      'padding: 3px 10px; border-radius: 6px; border: none; cursor: pointer; font-size: 12px; font-family: inherit; background: #1c75ff; color: #fff; transition: all 0.15s ease;';
    const inactiveStyle =
      'padding: 3px 10px; border-radius: 6px; border: none; cursor: pointer; font-size: 12px; font-family: inherit; background: rgba(255,255,255,0.06); color: #aaa; transition: all 0.15s ease;';

    this._tabRegisteredBtn.style.cssText =
      this._activeTab === 'registered' ? activeStyle : inactiveStyle;
    this._tabLiveBtn.style.cssText =
      this._activeTab === 'live' ? activeStyle : inactiveStyle;
  }

  private _renderRegistered(): void {
    const listeners = this._store.events.getAllListeners();
    this._listEl.innerHTML = '';

    if (listeners.length === 0) {
      this._listEl.style.display = 'none';
      this._emptyEl.style.display = '';
      this._emptyEl.textContent = 'No event listeners registered';
      return;
    }

    this._emptyEl.style.display = 'none';
    this._listEl.style.display = '';

    for (const record of listeners) {
      const row = new EventRow(record, 'listener');
      this._listEl.appendChild(row.element);
    }
  }

  private _renderLive(): void {
    const dispatches = this._store.events.getDispatchLog();
    this._listEl.innerHTML = '';

    if (dispatches.length === 0) {
      this._listEl.style.display = 'none';
      this._emptyEl.style.display = '';
      this._emptyEl.textContent = 'No events dispatched yet';
      return;
    }

    this._emptyEl.style.display = 'none';
    this._listEl.style.display = '';

    for (const record of dispatches) {
      const row = new EventRow(record, 'dispatch');
      this._listEl.appendChild(row.element);
    }

    // Auto-scroll to bottom for live log
    this._listEl.scrollTop = this._listEl.scrollHeight;
  }
}
