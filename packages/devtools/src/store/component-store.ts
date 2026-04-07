import { pipe, filter, toArray } from '@fxts/core';
import type { ViewSnapshot } from '../types';

export class ComponentStore {
  private _views = new Map<string, ViewSnapshot>();
  private _children = new Map<string | null, Set<string>>();

  register(snapshot: ViewSnapshot): void {
    this._views.set(snapshot.viewId, { ...snapshot });
    const parentId = snapshot.parentViewId;
    if (!this._children.has(parentId)) {
      this._children.set(parentId, new Set());
    }
    this._children.get(parentId)!.add(snapshot.viewId);
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
    if (view) view.isMounted = isMounted;
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
  }
}
