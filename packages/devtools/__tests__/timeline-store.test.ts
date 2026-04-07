import { describe, it, expect } from 'vitest';
import { TimelineStore } from '../src/store/timeline-store';

describe('TimelineStore', () => {
  it('adds entries with auto-incrementing id', () => {
    const store = new TimelineStore(100);
    store.add({ type: 'render', viewId: 'v1', constructorName: 'A', summary: 'render A', detail: null, timestamp: 0 });
    store.add({ type: 'mount', viewId: 'v1', constructorName: 'A', summary: 'mount A', detail: null, timestamp: 10 });
    const entries = store.getAll();
    expect(entries).toHaveLength(2);
    expect(entries[0].id).toBe(0);
    expect(entries[1].id).toBe(1);
  });

  it('filters by type', () => {
    const store = new TimelineStore(100);
    store.add({ type: 'render', viewId: 'v1', constructorName: 'A', summary: '', detail: null, timestamp: 0 });
    store.add({ type: 'redraw', viewId: 'v1', constructorName: 'A', summary: '', detail: null, timestamp: 10 });
    store.add({ type: 'render', viewId: 'v2', constructorName: 'B', summary: '', detail: null, timestamp: 20 });
    expect(store.getByType('render')).toHaveLength(2);
    expect(store.getByType('redraw')).toHaveLength(1);
  });

  it('respects max capacity', () => {
    const store = new TimelineStore(3);
    for (let i = 0; i < 5; i++) {
      store.add({ type: 'render', viewId: `v${i}`, constructorName: 'A', summary: '', detail: null, timestamp: i });
    }
    expect(store.getAll()).toHaveLength(3);
  });
});
