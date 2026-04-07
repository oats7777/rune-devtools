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
    this._searchInput.placeholder = 'Search components…';
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
    // Access children via the element's child container (indirect approach)
    // We walk through the store instead to avoid exposing private internals.
    const childSnapshots = this._store.components.getChildren(node.viewId);
    for (const snap of childSnapshots) {
      const childNode = this._nodeMap.get(snap.viewId);
      if (childNode) {
        // already collected by the node itself; recurse
        this._collectNodes(childNode);
      }
    }
  }

  private _applyFilter(): void {
    const query = this._searchInput.value.trim().toLowerCase();
    if (!query) {
      // Show all
      for (const node of this._nodeMap.values()) {
        node.element.style.display = '';
      }
      return;
    }

    const allSnapshots = this._store.components.getAll();
    const matchingIds = new Set<string>();

    for (const snap of allSnapshots) {
      const nameMatch = snap.constructorName.toLowerCase().includes(query);
      let dataMatch = false;
      try {
        dataMatch = JSON.stringify(snap.data).toLowerCase().includes(query);
      } catch {
        // ignore
      }
      if (nameMatch || dataMatch) {
        matchingIds.add(snap.viewId);
      }
    }

    for (const [viewId, node] of this._nodeMap) {
      node.element.style.display = matchingIds.has(viewId) ? '' : 'none';
    }
  }
}
