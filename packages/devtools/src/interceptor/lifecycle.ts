import { patchMethod } from './patch';
import type { DevtoolsStore } from '../store';
import type { SourceLocation } from '../types';

function resolveSourceLocation(view: any): SourceLocation | null {
  // 1. Check static __source (injected by Vite plugin transform)
  const source = view.constructor?.__source;
  if (source?.file && source?.line) {
    return { file: source.file, line: source.line, column: source.column };
  }

  // 2. Fallback: parse stack trace
  try {
    const stack = new Error().stack;
    if (!stack) return null;
    const lines = stack.split('\n');
    // Skip Error, resolveSourceLocation, interceptor, patchMethod wrapper frames
    for (const line of lines) {
      // Match typical stack frame: "at ... (file:line:col)" or "at file:line:col"
      const match = line.match(/(?:at\s+.*?\(|at\s+)(\/[^:]+|https?:\/\/[^:]+):(\d+):(\d+)/);
      if (!match) continue;
      const file = match[1];
      // Skip internal frames
      if (file.includes('rune-devtools') || file.includes('node_modules/rune-ts')) continue;
      return { file, line: parseInt(match[2], 10), column: parseInt(match[3], 10) };
    }
  } catch { /* ignore */ }
  return null;
}

export function installLifecycleInterceptors(
  View: any,
  Base: any,
  store: DevtoolsStore,
  rune: any,
): void {
  // _onRender on View.prototype
  patchMethod(View.prototype, '_onRender', (view) => {
    const page = rune.getPage?.(view);
    let clonedData: unknown;
    try {
      clonedData = structuredClone(view.data);
    } catch {
      try { clonedData = JSON.parse(JSON.stringify(view.data)); } catch { clonedData = { __unserializable__: true }; }
    }
    const snapshot = {
      viewId: view.viewId,
      constructorName: view.constructor.name,
      data: clonedData,
      args: view._args ? [...view._args] : [],
      parentViewId: view.parentView?.viewId ?? null,
      renderCount: view.renderCount,
      isMounted: false,
      isSSR: false,
      sourceLocation: resolveSourceLocation(view),
      timestamp: performance.now(),
    };
    store.components.register(snapshot, view);
    store.emitViewRender(snapshot);

    // Mark DOM element for highlight detection (after render, element should exist)
    try {
      const element = view.element?.();
      if (element instanceof HTMLElement) {
        element.setAttribute('data-rune-view-id', view.viewId);
      }
    } catch { /* element may not be ready */ }

    store.timeline.add({
      type: 'render',
      viewId: view.viewId,
      constructorName: snapshot.constructorName,
      summary: `render ${snapshot.constructorName}`,
      detail: snapshot,
      timestamp: snapshot.timestamp,
    });
  });

  // _onMount on Base.prototype (Enable also extends Base but has no viewId — guard required)
  patchMethod(Base.prototype, '_onMount', (view) => {
    if (!view.viewId) return; // skip Enable instances
    store.components.setMounted(view.viewId, true);

    // Mark DOM element for highlight detection (also mark on mount for SSR/hydration cases)
    const element = view.element?.();
    if (element instanceof HTMLElement) {
      element.setAttribute('data-rune-view-id', view.viewId);
    }

    store.timeline.add({
      type: 'mount',
      viewId: view.viewId,
      constructorName: view.constructor.name,
      summary: `mount ${view.constructor.name}`,
      detail: null,
      timestamp: performance.now(),
    });
  });

  // _onUnmount on View.prototype
  patchMethod(View.prototype, '_onUnmount', (view) => {
    store.components.setMounted(view.viewId, false);
    store.emitViewUnmount(view.viewId);
    store.timeline.add({
      type: 'unmount',
      viewId: view.viewId,
      constructorName: view.constructor.name,
      summary: `unmount ${view.constructor.name}`,
      detail: null,
      timestamp: performance.now(),
    });
  });
}
