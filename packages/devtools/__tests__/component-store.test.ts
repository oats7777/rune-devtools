import { describe, it, expect } from 'vitest';
import { ComponentStore } from '../src/store/component-store';

describe('ComponentStore', () => {
  it('registers a view snapshot', () => {
    const store = new ComponentStore();
    store.register({
      viewId: 'v1', constructorName: 'TodoPage', data: {}, args: [],
      parentViewId: null, renderCount: 1, isMounted: false, isSSR: false,
      timestamp: Date.now(),
    });
    expect(store.get('v1')?.constructorName).toBe('TodoPage');
  });

  it('builds parent-child tree', () => {
    const store = new ComponentStore();
    const ts = Date.now();
    store.register({ viewId: 'v1', constructorName: 'Page', data: {}, args: [], parentViewId: null, renderCount: 1, isMounted: true, isSSR: false, timestamp: ts });
    store.register({ viewId: 'v2', constructorName: 'List', data: {}, args: [], parentViewId: 'v1', renderCount: 1, isMounted: true, isSSR: false, timestamp: ts });
    expect(store.getChildren('v1')).toHaveLength(1);
    expect(store.getChildren('v1')[0].viewId).toBe('v2');
    expect(store.getRoots()).toHaveLength(1);
  });

  it('marks view as mounted/unmounted', () => {
    const store = new ComponentStore();
    store.register({ viewId: 'v1', constructorName: 'A', data: {}, args: [], parentViewId: null, renderCount: 1, isMounted: false, isSSR: false, timestamp: Date.now() });
    store.setMounted('v1', true);
    expect(store.get('v1')?.isMounted).toBe(true);
    store.setMounted('v1', false);
    expect(store.get('v1')?.isMounted).toBe(false);
  });

  it('updates data snapshot on redraw', () => {
    const store = new ComponentStore();
    store.register({ viewId: 'v1', constructorName: 'A', data: { count: 0 }, args: [], parentViewId: null, renderCount: 1, isMounted: true, isSSR: false, timestamp: Date.now() });
    store.updateData('v1', { count: 5 }, 2);
    expect(store.get('v1')?.data).toEqual({ count: 5 });
    expect(store.get('v1')?.renderCount).toBe(2);
  });

  it('removes view after unregister', () => {
    const store = new ComponentStore();
    store.register({ viewId: 'v1', constructorName: 'A', data: {}, args: [], parentViewId: null, renderCount: 1, isMounted: false, isSSR: false, timestamp: Date.now() });
    store.unregister('v1');
    expect(store.get('v1')).toBeUndefined();
  });
});
