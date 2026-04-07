import { ComponentStore } from './component-store';
import { EventStore } from './event-store';
import { TimelineStore } from './timeline-store';
import { DEFAULTS } from '../constants';
import type { RedrawRecord, ListViewOpRecord } from '../types';
import { RingBuffer } from './ring-buffer';

export class DevtoolsStore {
  readonly components: ComponentStore;
  readonly events: EventStore;
  readonly timeline: TimelineStore;
  readonly redraws: Map<string, RingBuffer<RedrawRecord>>;
  readonly listViewOps: Map<string, RingBuffer<ListViewOpRecord>>;

  constructor(maxEvents = DEFAULTS.maxEvents) {
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
}

export { ComponentStore } from './component-store';
export { EventStore } from './event-store';
export { TimelineStore } from './timeline-store';
export { RingBuffer } from './ring-buffer';
