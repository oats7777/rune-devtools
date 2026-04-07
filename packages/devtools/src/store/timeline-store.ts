import { pipe, filter, toArray } from '@fxts/core';
import { RingBuffer } from './ring-buffer';
import type { TimelineEntry, TimelineEventType } from '../types';

export class TimelineStore {
  private _entries: RingBuffer<TimelineEntry>;
  private _nextId = 0;

  constructor(maxEntries: number) {
    this._entries = new RingBuffer(maxEntries);
  }

  add(entry: Omit<TimelineEntry, 'id'>): TimelineEntry {
    const full: TimelineEntry = { ...entry, id: this._nextId++ };
    this._entries.push(full);
    return full;
  }

  getAll(): TimelineEntry[] {
    return this._entries.toArray();
  }

  getByType(type: TimelineEventType): TimelineEntry[] {
    return pipe(
      this._entries,
      filter((e) => e.type === type),
      toArray,
    );
  }

  clear(): void {
    this._entries.clear();
  }
}
