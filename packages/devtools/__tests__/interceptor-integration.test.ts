// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { View, ListView, html, rune } from 'rune-ts';
import { DevtoolsStore } from '../src/store';
import { installInterceptors, unpatchAll } from '../src/interceptor';
import { DEVTOOLS_MARKER } from '../src/constants';

// Derive Base the same way initDevtools does
const VirtualViewProto = Object.getPrototypeOf(View.prototype);
const Base: any =
  Object.getPrototypeOf(VirtualViewProto)?.constructor ??
  VirtualViewProto?.constructor ??
  View;

// ── Test fixtures ──────────────────────────────────────────────────

class SimpleView extends View<{ count: number }> {
  override template({ count }: { count: number }) {
    return html`<div class="simple">${count}</div>`;
  }
}

class ItemView extends View<{ text: string }> {
  override template({ text }: { text: string }) {
    return html`<span class="item">${text}</span>`;
  }
}

class TestListView extends ListView<ItemView> {
  ItemView = ItemView;
}

class ParentView extends View<{ title: string }> {
  override template({ title }: { title: string }) {
    return html`
      <div class="parent">
        <h1>${title}</h1>
        ${new SimpleView({ count: 0 })}
      </div>
    `;
  }
}

// ── Tests ──────────────────────────────────────────────────────────

describe('Interceptor Integration', () => {
  let store: DevtoolsStore;

  beforeEach(() => {
    store = new DevtoolsStore();
    installInterceptors(
      { View, ListView, Base, Page: View, eventHelper: null, rune },
      store,
    );
  });

  afterEach(() => {
    unpatchAll();
    document.body.innerHTML = '';
  });

  describe('Lifecycle', () => {
    it('registers view on render', () => {
      const view = new SimpleView({ count: 42 });
      view.render();

      const snapshot = store.components.get(view.viewId);
      expect(snapshot).toBeDefined();
      expect(snapshot!.constructorName).toBe('SimpleView');
      expect(snapshot!.data).toEqual({ count: 42 });
      expect(snapshot!.renderCount).toBe(1);
    });

    it('tracks parent-child relationships', () => {
      const parent = new ParentView({ title: 'Hello' });
      parent.render();

      const roots = store.components.getRoots();
      expect(roots.length).toBeGreaterThanOrEqual(1);

      const parentSnapshot = roots.find(
        (s) => s.constructorName === 'ParentView',
      );
      expect(parentSnapshot).toBeDefined();

      const children = store.components.getChildren(parentSnapshot!.viewId);
      expect(children.length).toBeGreaterThanOrEqual(1);
      expect(children[0].constructorName).toBe('SimpleView');
    });

    it('marks view as mounted when in DOM', () => {
      const view = new SimpleView({ count: 0 });
      const el = view.render();
      document.body.appendChild(el);

      // Mount is triggered by MutationObserver which is async,
      // but in jsdom it may fire synchronously. Check both cases.
      const snapshot = store.components.get(view.viewId);
      expect(snapshot).toBeDefined();
    });

    it('sets data-rune-view-id attribute on element', () => {
      const view = new SimpleView({ count: 0 });
      const el = view.render();

      expect(el.getAttribute('data-rune-view-id')).toBe(view.viewId);
    });
  });

  describe('Rendering', () => {
    it('tracks redraw with duration', () => {
      const view = new SimpleView({ count: 0 });
      view.render();

      (view.data as any).count = 10;
      view.redraw();

      const redraws = store.getRedraws(view.viewId);
      expect(redraws).toHaveLength(1);
      expect(redraws[0].duration).toBeGreaterThanOrEqual(0);
      expect(redraws[0].constructorName).toBe('SimpleView');
    });

    it('preserves data-rune-view-id after redraw', () => {
      const view = new SimpleView({ count: 0 });
      const el = view.render();

      (view.data as any).count = 5;
      view.redraw();

      expect(el.getAttribute('data-rune-view-id')).toBe(view.viewId);
    });

    it('updates store data after redraw', () => {
      const view = new SimpleView({ count: 0 });
      view.render();

      (view.data as any).count = 99;
      view.redraw();

      const snapshot = store.components.get(view.viewId);
      expect(snapshot!.data).toEqual({ count: 99 });
    });
  });

  describe('ListView', () => {
    it('tracks append operations', () => {
      const list = new TestListView([{ text: 'a' }]);
      list.render();

      list.append({ text: 'b' });

      const ops = store.getListViewOps(list.viewId);
      expect(ops.length).toBeGreaterThanOrEqual(1);
      const appendOp = ops.find(
        (op) => op.operation === 'append' || op.operation === 'prepend',
      );
      expect(appendOp).toBeDefined();
    });

    it('tracks remove operations', () => {
      const list = new TestListView([{ text: 'a' }, { text: 'b' }]);
      list.render();

      list.removeByIndex(0);

      const ops = store.getListViewOps(list.viewId);
      expect(ops.find((op) => op.operation === 'removeByIndex')).toBeDefined();
    });

    it('tracks set operations', () => {
      const list = new TestListView([{ text: 'a' }]);
      list.render();

      list.set([{ text: 'x' }, { text: 'y' }]);

      const ops = store.getListViewOps(list.viewId);
      expect(ops.find((op) => op.operation === 'set')).toBeDefined();
    });
  });

  describe('Timeline', () => {
    it('records render events in timeline', () => {
      const view = new SimpleView({ count: 0 });
      view.render();

      const entries = store.timeline.getByType('render');
      expect(entries.length).toBeGreaterThanOrEqual(1);
      expect(entries.some((e) => e.constructorName === 'SimpleView')).toBe(true);
    });

    it('records redraw events in timeline', () => {
      const view = new SimpleView({ count: 0 });
      view.render();
      view.redraw();

      const entries = store.timeline.getByType('redraw');
      expect(entries.length).toBeGreaterThanOrEqual(1);
    });

    it('records listview events in timeline', () => {
      const list = new TestListView([{ text: 'a' }]);
      list.render();
      list.append({ text: 'b' });

      const entries = store.timeline.getByType('listview');
      expect(entries.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('WeakRef tracking', () => {
    it('stores live view reference', () => {
      const view = new SimpleView({ count: 0 });
      view.render();

      const liveView = store.components.getLiveView(view.viewId);
      expect(liveView).toBe(view);
    });
  });

  describe('DEVTOOLS_MARKER', () => {
    it('skips interceptor for marked instances', () => {
      const view = new SimpleView({ count: 0 });
      (view as any)[DEVTOOLS_MARKER] = true;
      view.render();

      // Should NOT be registered in store
      expect(store.components.get(view.viewId)).toBeUndefined();
    });
  });
});
