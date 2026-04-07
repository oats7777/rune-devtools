import { pipe, filter, toArray } from '@fxts/core';
import type { ViewSnapshot } from '../types';
import { DEFAULTS } from '../constants';

export class ComponentStore {
  private _views = new Map<string, ViewSnapshot>();
  private _children = new Map<string | null, Set<string>>();
  private _cleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private _viewRefs = new Map<string, WeakRef<object>>();

  register(snapshot: ViewSnapshot, viewInstance?: object): void {
    this._views.set(snapshot.viewId, { ...snapshot });
    const parentId = snapshot.parentViewId;
    if (!this._children.has(parentId)) {
      this._children.set(parentId, new Set());
    }
    this._children.get(parentId)!.add(snapshot.viewId);
    if (viewInstance) {
      this._viewRefs.set(snapshot.viewId, new WeakRef(viewInstance));
    }
    // Cancel any pending cleanup for this viewId (view re-registered)
    this._cancelCleanup(snapshot.viewId);
  }

  get(viewId: string): ViewSnapshot | undefined {
    return this._views.get(viewId);
  }

  getAll(): ViewSnapshot[] {
    return [...this._views.values()];
  }

  getRoots(): ViewSnapshot[] {
    const rootIds = this._children.get(null);
    if (!rootIds) return [];
    return pipe(
      rootIds,
      filter((id) => this._views.has(id)),
      toArray,
    ).map((id) => this._views.get(id)!);
  }

  getChildren(viewId: string): ViewSnapshot[] {
    const childIds = this._children.get(viewId);
    if (!childIds) return [];
    return pipe(
      childIds,
      filter((id) => this._views.has(id)),
      toArray,
    ).map((id) => this._views.get(id)!);
  }

  setMounted(viewId: string, isMounted: boolean): void {
    const view = this._views.get(viewId);
    if (!view) return;
    view.isMounted = isMounted;

    if (!isMounted) {
      // Schedule cleanup after 30s
      this._scheduleCleanup(viewId);
    } else {
      // View remounted — cancel cleanup
      this._cancelCleanup(viewId);
    }
  }

  private _scheduleCleanup(viewId: string): void {
    this._cancelCleanup(viewId);
    const timer = setTimeout(() => {
      this._cleanupTimers.delete(viewId);
      // Check if view is still unmounted before cleaning
      const view = this._views.get(viewId);
      if (view && !view.isMounted) {
        this.unregister(viewId);
      }
    }, DEFAULTS.unmountCleanupDelay);
    this._cleanupTimers.set(viewId, timer);
  }

  private _cancelCleanup(viewId: string): void {
    const timer = this._cleanupTimers.get(viewId);
    if (timer) {
      clearTimeout(timer);
      this._cleanupTimers.delete(viewId);
    }
  }

  isViewAlive(viewId: string): boolean {
    const ref = this._viewRefs.get(viewId);
    if (!ref) return true; // no ref tracked, assume alive
    return ref.deref() !== undefined;
  }

  /** Get the live View instance (if still alive). */
  getLiveView(viewId: string): object | undefined {
    return this._viewRefs.get(viewId)?.deref();
  }

  updateData(viewId: string, data: unknown, renderCount: number): void {
    const view = this._views.get(viewId);
    if (view) {
      view.data = data;
      view.renderCount = renderCount;
    }
  }

  unregister(viewId: string): void {
    const view = this._views.get(viewId);
    if (!view) return;
    this._views.delete(viewId);
    const parentChildren = this._children.get(view.parentViewId);
    if (parentChildren) parentChildren.delete(viewId);
    this._children.delete(viewId);
    this._cancelCleanup(viewId);
    this._viewRefs.delete(viewId);
  }
}
