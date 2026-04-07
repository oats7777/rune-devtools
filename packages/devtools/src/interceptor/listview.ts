import { pipe, filter, toArray } from '@fxts/core';
import { patchMethodAround, patchMethod } from './patch';
import type { DevtoolsStore } from '../store';

export function installListViewInterceptors(
  ListView: any,
  store: DevtoolsStore,
): void {
  // set() — needs before/after snapshot
  const snapshotMap = new WeakMap<object, unknown[]>();

  patchMethodAround(
    ListView.prototype,
    'set',
    (view) => {
      snapshotMap.set(view, [...view.data]);
    },
    (view, args) => {
      const before = snapshotMap.get(view) ?? [];
      snapshotMap.delete(view);
      const after = [...view.data];

      const beforeSet = new Set(before);
      const afterSet = new Set(after);

      const added = pipe(after, filter((item) => !beforeSet.has(item)), toArray);
      const removed = pipe(before, filter((item) => !afterSet.has(item)), toArray);
      const kept = pipe(after, filter((item) => beforeSet.has(item)), toArray);

      const record = {
        viewId: view.viewId,
        constructorName: view.constructor.name,
        operation: 'set' as const,
        added,
        removed,
        kept,
        timestamp: performance.now(),
      };
      store.addListViewOp(record);
      store.timeline.add({
        type: 'listview',
        viewId: view.viewId,
        constructorName: view.constructor.name,
        summary: `set() +${added.length} -${removed.length}`,
        detail: record,
        timestamp: record.timestamp,
      });
    },
  );

  // _append — actual signature: (push: 'push'|'unshift', append: 'append'|'prepend', items: IV['data'][])
  patchMethod(ListView.prototype, '_append' as any, (view, args) => {
    const [push, _appendDir, items] = args;
    const record = {
      viewId: view.viewId,
      constructorName: view.constructor.name,
      operation: (push === 'unshift' ? 'prepend' : 'append') as 'append' | 'prepend',
      added: Array.isArray(items) ? items : [items],
      removed: [],
      kept: [],
      toIndex: push === 'unshift' ? 0 : view.data.length,
      timestamp: performance.now(),
    };
    store.addListViewOp(record);
    store.timeline.add({
      type: 'listview',
      viewId: view.viewId,
      constructorName: view.constructor.name,
      summary: `append +${record.added.length}`,
      detail: record,
      timestamp: record.timestamp,
    });
  });

  // _removeAll — actual signature: (items: T[], list: T[])
  patchMethod(ListView.prototype, '_removeAll' as any, (view, args) => {
    const [items, _list] = args;
    const record = {
      viewId: view.viewId,
      constructorName: view.constructor.name,
      operation: 'remove' as const,
      added: [],
      removed: Array.isArray(items) ? items : [items],
      kept: [],
      timestamp: performance.now(),
    };
    store.addListViewOp(record);
    store.timeline.add({
      type: 'listview',
      viewId: view.viewId,
      constructorName: view.constructor.name,
      summary: `remove -${record.removed.length}`,
      detail: record,
      timestamp: record.timestamp,
    });
  });

  // removeByIndex
  patchMethod(ListView.prototype, 'removeByIndex', (view, args) => {
    const [idx] = args;
    const record = {
      viewId: view.viewId,
      constructorName: view.constructor.name,
      operation: 'removeByIndex' as const,
      added: [],
      removed: [view.data[idx]],
      kept: [],
      fromIndex: idx,
      timestamp: performance.now(),
    };
    store.addListViewOp(record);
  });

  // move
  patchMethod(ListView.prototype, 'move', (view, args) => {
    const [at, to] = args;
    const record = {
      viewId: view.viewId,
      constructorName: view.constructor.name,
      operation: 'move' as const,
      added: [],
      removed: [],
      kept: [],
      fromIndex: at,
      toIndex: to,
      timestamp: performance.now(),
    };
    store.addListViewOp(record);
    store.timeline.add({
      type: 'listview',
      viewId: view.viewId,
      constructorName: view.constructor.name,
      summary: `move ${at}→${to}`,
      detail: record,
      timestamp: record.timestamp,
    });
  });

  // reset
  patchMethod(ListView.prototype, 'reset', (view) => {
    const record = {
      viewId: view.viewId,
      constructorName: view.constructor.name,
      operation: 'reset' as const,
      added: [],
      removed: [...view.data],
      kept: [],
      timestamp: performance.now(),
    };
    store.addListViewOp(record);
    store.timeline.add({
      type: 'listview',
      viewId: view.viewId,
      constructorName: view.constructor.name,
      summary: `reset (${record.removed.length} items cleared)`,
      detail: record,
      timestamp: record.timestamp,
    });
  });
}
