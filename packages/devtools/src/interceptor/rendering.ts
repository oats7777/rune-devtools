import { pipe, filter, map, toArray } from '@fxts/core';
import { patchMethodAround } from './patch';
import type { DevtoolsStore } from '../store';
import type { AttributeChange } from '../types';

function snapshotAttributes(element: HTMLElement): Map<string, string> {
  const attrs = new Map<string, string>();
  for (const { name, value } of element.attributes) {
    attrs.set(name, value);
  }
  return attrs;
}

function diffAttributes(
  before: Map<string, string>,
  after: Map<string, string>,
): AttributeChange[] {
  const changes: AttributeChange[] = [];

  pipe(
    after,
    filter(([name]) => !before.has(name)),
    map(([name, value]) => changes.push({ name, oldValue: null, newValue: value, type: 'added' })),
    toArray,
  );

  pipe(
    before,
    filter(([name]) => !after.has(name)),
    map(([name, value]) => changes.push({ name, oldValue: value, newValue: null, type: 'removed' })),
    toArray,
  );

  pipe(
    after,
    filter(([name, value]) => before.has(name) && before.get(name) !== value),
    map(([name, value]) => changes.push({ name, oldValue: before.get(name)!, newValue: value, type: 'modified' })),
    toArray,
  );

  return changes;
}

export function installRenderingInterceptors(
  View: any,
  store: DevtoolsStore,
): void {
  const contextMap = new WeakMap<object, { before: Map<string, string>; renderCount: number; startTime: number }>();

  patchMethodAround(
    View.prototype,
    'redraw',
    (view) => {
      const element = view.element?.();
      contextMap.set(view, {
        before: element ? snapshotAttributes(element) : new Map(),
        renderCount: view.renderCount,
        startTime: performance.now(),
      });
    },
    (view) => {
      const ctx = contextMap.get(view);
      if (!ctx) return;
      contextMap.delete(view);

      const element = view.element?.();
      const after = element ? snapshotAttributes(element) : new Map();
      const duration = performance.now() - ctx.startTime;
      const attributeChanges = diffAttributes(ctx.before, after);

      const record = {
        viewId: view.viewId,
        constructorName: view.constructor.name,
        renderCountBefore: ctx.renderCount,
        renderCountAfter: view.renderCount,
        duration,
        attributeChanges,
        timestamp: ctx.startTime,
      };

      // Re-set data-rune-view-id after redraw (rune-ts _redrawAttributes removes non-template attrs)
      if (element instanceof HTMLElement) {
        element.setAttribute('data-rune-view-id', view.viewId);
      }

      store.addRedraw(record);
      store.emitRedraw(record);
      let clonedData: unknown;
      try {
        clonedData = structuredClone(view.data);
      } catch {
        try { clonedData = JSON.parse(JSON.stringify(view.data)); } catch { clonedData = { __unserializable__: true }; }
      }
      store.components.updateData(view.viewId, clonedData, view.renderCount);
      store.timeline.add({
        type: 'redraw',
        viewId: view.viewId,
        constructorName: view.constructor.name,
        summary: `redraw ${view.constructor.name} (${duration.toFixed(1)}ms)`,
        detail: record,
        timestamp: ctx.startTime,
      });
    },
  );
}
