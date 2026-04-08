import { pipe, flatMap, toArray } from '@fxts/core';
import { RingBuffer } from './ring-buffer';
import type { EventListenerRecord, EventDispatchRecord } from '../types';

export class EventStore {
  private _listeners = new Map<string, EventListenerRecord[]>();
  private _dispatchLog: RingBuffer<EventDispatchRecord>;

  constructor(maxDispatchLog = 1000) {
    this._dispatchLog = new RingBuffer(maxDispatchLog);
  }

  addListener(record: EventListenerRecord): void {
    const list = this._listeners.get(record.viewId) ?? [];
    list.push(record);
    this._listeners.set(record.viewId, list);
  }

  getListeners(viewId: string): EventListenerRecord[] {
    return this._listeners.get(viewId) ?? [];
  }

  getAllListeners(): EventListenerRecord[] {
    return pipe(this._listeners.values(), flatMap((v) => v), toArray);
  }

  addDispatch(record: EventDispatchRecord): void {
    this._dispatchLog.push(record);
  }

  getDispatchLog(): EventDispatchRecord[] {
    return this._dispatchLog.toArray();
  }

  removeListeners(viewId: string): void {
    this._listeners.delete(viewId);
  }
}
