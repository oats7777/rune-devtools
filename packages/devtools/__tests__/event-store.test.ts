import { describe, it, expect } from 'vitest';
import { EventStore } from '../src/store/event-store';

describe('EventStore', () => {
  it('records a listener registration', () => {
    const store = new EventStore();
    store.addListener({ viewId: 'v1', constructorName: 'A', eventType: 'click', selector: null, handlerName: 'onClick', timestamp: Date.now() });
    expect(store.getListeners('v1')).toHaveLength(1);
  });

  it('records a dispatch event in log', () => {
    const store = new EventStore(5);
    store.addDispatch({ viewId: 'v1', constructorName: 'A', eventType: 'Toggled', detail: { on: true }, timestamp: Date.now() });
    expect(store.getDispatchLog()).toHaveLength(1);
  });

  it('dispatch log respects max size', () => {
    const store = new EventStore(3);
    for (let i = 0; i < 5; i++) {
      store.addDispatch({ viewId: `v${i}`, constructorName: 'A', eventType: 'e', detail: null, timestamp: i });
    }
    expect(store.getDispatchLog()).toHaveLength(3);
  });
});
