import { pipe, filter, each } from '@fxts/core';
import type { DevtoolsStore } from '../../../store';
import { TreeNode } from './TreeNodeView';

export class TreePanel {
  readonly element: HTMLElement;
  readonly id = 'tree';
  readonly label = 'Component Tree';

  private _roots: TreeNode[] = [];
  private _searchInput: HTMLInputElement;
  private _treeContainer: HTMLElement;
  private _selectedViewId: string | null = null;
  private _refreshInterval: number | null = null;

  // Map of all known tree nodes for fast lookups
  private _nodeMap = new Map<string, TreeNode>();

  constructor(
    private _store: DevtoolsStore,
    private _onSelect: (viewId: string) => void,
    private _onHover: (viewId: string | null) => void,
  ) {
    this.element = document.createElement('div');
    this.element.style.cssText =
      'display: flex; flex-direction: column; height: 100%; min-height: 0;';

    // ── Search bar ─────────────────────────────────────────────────
    const searchWrapper = document.createElement('div');
    searchWrapper.style.cssText =
      'padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0;';

    this._searchInput = document.createElement('input');
    this._searchInput.type = 'text';
    this._searchInput.placeholder = 'Search (supports /regex/)';
    this._searchInput.style.cssText =
      'width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 4px 8px; color: #e0e0e0; font-size: 12px; outline: none; font-family: system-ui, sans-serif;';

    this._searchInput.addEventListener('input', () => this._applyFilter());
    searchWrapper.appendChild(this._searchInput);
    this.element.appendChild(searchWrapper);

    // ── Tree container ─────────────────────────────────────────────
    this._treeContainer = document.createElement('div');
    this._treeContainer.style.cssText =
      'flex: 1; overflow: auto; padding: 4px 0;';
    this.element.appendChild(this._treeContainer);

    // Initial build
    this.refresh();
  }

  // ── Lifecycle ────────────────────────────────────────────────────

  activate(): void {
    this.refresh();
    if (this._refreshInterval === null) {
      this._refreshInterval = window.setInterval(() => this.refresh(), 500);
    }
  }

  deactivate(): void {
    if (this._refreshInterval !== null) {
      clearInterval(this._refreshInterval);
      this._refreshInterval = null;
    }
  }

  // ── Public API ────────────────────────────────────────────────────

  refresh(): void {
    const rootSnapshots = this._store.components.getRoots();

    const existingMap = new Map<string, TreeNode>();
    for (const node of this._roots) {
      existingMap.set(node.viewId, node);
    }

    const newRoots: TreeNode[] = [];

    for (const snap of rootSnapshots) {
      const existing = existingMap.get(snap.viewId);
      if (existing) {
        existing.update(snap);
        existing.refresh();
        newRoots.push(existing);
      } else {
        const node = new TreeNode(
          snap,
          this._store.components,
          (viewId) => this._handleSelect(viewId),
          (viewId) => this._onHover(viewId),
        );
        newRoots.push(node);
      }
    }

    // Rebuild the DOM
    this._treeContainer.innerHTML = '';
    this._nodeMap.clear();

    for (const node of newRoots) {
      this._treeContainer.appendChild(node.element);
      this._collectNodes(node);
    }

    this._roots = newRoots;

    // Restore selection highlight
    if (this._selectedViewId) {
      const selected = this._nodeMap.get(this._selectedViewId);
      if (selected) selected.select();
    }

    this._applyFilter();
  }

  /** Externally set the selected view (e.g. when navigating from inspector). */
  selectView(viewId: string): void {
    this._handleSelect(viewId);
  }

  // ── Private helpers ───────────────────────────────────────────────

  private _handleSelect(viewId: string): void {
    // Deselect previous
    if (this._selectedViewId) {
      const prev = this._nodeMap.get(this._selectedViewId);
      prev?.deselect();
    }
    this._selectedViewId = viewId;
    const node = this._nodeMap.get(viewId);
    node?.select();
    this._onSelect(viewId);
  }

  private _collectNodes(node: TreeNode): void {
    this._nodeMap.set(node.viewId, node);
    for (const child of node.children) {
      this._collectNodes(child);
    }
  }

  /**
   * Build a matcher function from the query string.
   * If the query starts with `/`, it is parsed as a regex (e.g. `/Todo.*View/i`).
   * Otherwise a plain case-insensitive substring match is returned.
   * Returns null when the query is empty.
   */
  private _buildMatcher(raw: string): ((s: string) => boolean) | null {
    const query = raw.trim();
    if (!query) return null;

    if (query.startsWith('/')) {
      // Attempt to parse as /pattern/flags
      const lastSlash = query.lastIndexOf('/');
      const pattern = lastSlash > 0 ? query.slice(1, lastSlash) : query.slice(1);
      const flags = lastSlash > 0 ? query.slice(lastSlash + 1) : '';
      try {
        const re = new RegExp(pattern, flags);
        return (s) => re.test(s);
      } catch {
        // Malformed regex — fall back to literal substring search on the raw input
        const lower = query.toLowerCase();
        return (s) => s.toLowerCase().includes(lower);
      }
    }

    const lower = query.toLowerCase();
    return (s) => s.toLowerCase().includes(lower);
  }

  /**
   * Recursively walk a nested value and return true if any primitive leaf
   * satisfies the matcher.
   */
  private _deepDataMatch(value: unknown, matcher: (s: string) => boolean): boolean {
    if (value === null || value === undefined) return false;

    if (typeof value === 'string') return matcher(value);
    if (typeof value === 'number' || typeof value === 'boolean') {
      return matcher(String(value));
    }

    if (Array.isArray(value)) {
      return value.some((item) => this._deepDataMatch(item, matcher));
    }

    if (typeof value === 'object') {
      return Object.values(value as Record<string, unknown>).some((v) =>
        this._deepDataMatch(v, matcher),
      );
    }

    return false;
  }

  private _applyFilter(): void {
    const matcher = this._buildMatcher(this._searchInput.value);

    if (!matcher) {
      // Show all nodes, clear any highlight remnants
      pipe(
        this._nodeMap.values(),
        each((node) => {
          node.element.style.display = '';
          node.element.style.background = '';
        }),
      );
      return;
    }

    const allSnapshots = this._store.components.getAll();

    // Step 1 — find directly matching view IDs
    const directMatchIds = new Set<string>();
    for (const snap of allSnapshots) {
      const nameMatch = matcher(snap.constructorName);
      const dataMatch = this._deepDataMatch(snap.data, matcher);
      if (nameMatch || dataMatch) {
        directMatchIds.add(snap.viewId);
      }
    }

    // Step 2 — collect ancestor IDs so the tree path stays visible
    const ancestorIds = new Set<string>();
    for (const viewId of directMatchIds) {
      let snap = this._store.components.get(viewId);
      while (snap?.parentViewId) {
        if (ancestorIds.has(snap.parentViewId)) break; // already walked this chain
        ancestorIds.add(snap.parentViewId);
        snap = this._store.components.get(snap.parentViewId);
      }
    }

    // Step 3 — apply visibility and highlight
    pipe(
      this._nodeMap.entries() as IterableIterator<[string, TreeNode]>,
      filter(([_id, _node]) => true), // keep as iterable for pipe
      each(([viewId, node]) => {
        const isDirect = directMatchIds.has(viewId);
        const isAncestor = ancestorIds.has(viewId);

        if (isDirect || isAncestor) {
          node.element.style.display = '';
          node.element.style.background = isDirect
            ? 'rgba(255, 200, 50, 0.08)'
            : '';
        } else {
          node.element.style.display = 'none';
          node.element.style.background = '';
        }
      }),
    );
  }
}
