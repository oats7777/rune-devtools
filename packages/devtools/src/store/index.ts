import { ComponentStore } from './component-store';
import { EventStore } from './event-store';
import { TimelineStore } from './timeline-store';
import { DEFAULTS } from '../constants';
import type { RedrawRecord, ListViewOpRecord, ViewSnapshot } from '../types';
import { RingBuffer } from './ring-buffer';

export class DevtoolsStore {
  readonly components: ComponentStore;
  readonly events: EventStore;
  readonly timeline: TimelineStore;
  readonly redraws: Map<string, RingBuffer<RedrawRecord>>;
  readonly listViewOps: Map<string, RingBuffer<ListViewOpRecord>>;

  // Simple event callbacks for plugins
  private _onViewRenderCallbacks: ((snapshot: ViewSnapshot) => void)[] = [];
  private _onViewUnmountCallbacks: ((viewId: string) => void)[] = [];
  private _onRedrawCallbacks: ((record: RedrawRecord) => void)[] = [];
  private _onListViewMutationCallbacks: ((record: ListViewOpRecord) => void)[] = [];

  constructor(maxEvents: number = DEFAULTS.maxEvents) {
    this.components = new ComponentStore();
    this.events = new EventStore(maxEvents);
    this.timeline = new TimelineStore(maxEvents);
    this.redraws = new Map();
    this.listViewOps = new Map();
  }

  addRedraw(record: RedrawRecord): void {
    if (!this.redraws.has(record.viewId)) {
      this.redraws.set(record.viewId, new RingBuffer(DEFAULTS.maxRedrawsPerView));
    }
    this.redraws.get(record.viewId)!.push(record);
  }

  addListViewOp(record: ListViewOpRecord): void {
    if (!this.listViewOps.has(record.viewId)) {
      this.listViewOps.set(record.viewId, new RingBuffer(DEFAULTS.maxRedrawsPerView));
    }
    this.listViewOps.get(record.viewId)!.push(record);
  }

  getRedraws(viewId: string): RedrawRecord[] {
    return this.redraws.get(viewId)?.toArray() ?? [];
  }

  getListViewOps(viewId: string): ListViewOpRecord[] {
    return this.listViewOps.get(viewId)?.toArray() ?? [];
  }

  onViewRender(callback: (snapshot: ViewSnapshot) => void): void {
    this._onViewRenderCallbacks.push(callback);
  }

  onViewUnmount(callback: (viewId: string) => void): void {
    this._onViewUnmountCallbacks.push(callback);
  }

  onRedraw(callback: (record: RedrawRecord) => void): void {
    this._onRedrawCallbacks.push(callback);
  }

  onListViewMutation(callback: (record: ListViewOpRecord) => void): void {
    this._onListViewMutationCallbacks.push(callback);
  }

  emitViewRender(snapshot: ViewSnapshot): void {
    for (const cb of this._onViewRenderCallbacks) {
      try { cb(snapshot); } catch (e) { console.warn('[rune-devtools] plugin callback error:', e); }
    }
  }

  emitViewUnmount(viewId: string): void {
    for (const cb of this._onViewUnmountCallbacks) {
      try { cb(viewId); } catch (e) { console.warn('[rune-devtools] plugin callback error:', e); }
    }
  }

  emitRedraw(record: RedrawRecord): void {
    for (const cb of this._onRedrawCallbacks) {
      try { cb(record); } catch (e) { console.warn('[rune-devtools] plugin callback error:', e); }
    }
  }

  emitListViewMutation(record: ListViewOpRecord): void {
    for (const cb of this._onListViewMutationCallbacks) {
      try { cb(record); } catch (e) { console.warn('[rune-devtools] plugin callback error:', e); }
    }
  }
}

export { ComponentStore } from './component-store';
export { EventStore } from './event-store';
export { TimelineStore } from './timeline-store';
export { RingBuffer } from './ring-buffer';
