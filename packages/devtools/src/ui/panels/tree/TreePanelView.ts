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
      'flex: 1; overflow: auto; padding: 4px 0; outline: none;';
    this._treeContainer.tabIndex = 0;
    this._treeContainer.addEventListener('keydown', (e) => this._handleKeyDown(e));
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
    this._treeContainer.focus();
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

  // ── Filter helpers ─────────────────────────────────────────────────

  /**
   * Parse the raw query string into a matcher function.
   * If the query starts with `/`, treat it as a regex (e.g. `/Todo.*View/i`).
   * Otherwise do a case-insensitive substring match.
   */
  private _buildMatcher(raw: string): ((s: string) => boolean) | null {
    if (!raw) return null;

    if (raw.startsWith('/')) {
      const match = raw.match(/^\/(.+?)\/([gimsuy]*)$/);
      if (match) {
        try {
          const re = new RegExp(match[1], match[2]);
          return (s) => re.test(s);
        } catch {
          // Malformed regex — fall through to literal match
        }
      }
    }

    const lower = raw.toLowerCase();
    return (s) => s.toLowerCase().includes(lower);
  }

  /**
   * Recursively walk any value and test all string/number/boolean leaves
   * against `matcher`. This gives deep data search instead of flat JSON.stringify.
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
    const raw = this._searchInput.value.trim();
    const matcher = this._buildMatcher(raw);

    if (!matcher) {
      // No query — show all nodes and clear any match highlights
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

    // Collect directly matching viewIds using fxts pipe + filter
    const matchingIds = new Set<string>();
    pipe(
      allSnapshots,
      filter(
        (snap) =>
          matcher(snap.constructorName) || this._deepDataMatch(snap.data, matcher),
      ),
      each((snap) => matchingIds.add(snap.viewId)),
    );

    // Expand to include all ancestors so tree structure remains visible
    const visibleIds = new Set<string>(matchingIds);
    for (const viewId of matchingIds) {
      let snap = this._store.components.get(viewId);
      while (snap?.parentViewId) {
        if (visibleIds.has(snap.parentViewId)) break;
        visibleIds.add(snap.parentViewId);
        snap = this._store.components.get(snap.parentViewId);
      }
    }

    // Apply visibility and subtle highlight to matching rows
    pipe(
      this._nodeMap,
      each(([viewId, node]) => {
        const visible = visibleIds.has(viewId);
        node.element.style.display = visible ? '' : 'none';
        // Highlight direct matches with a subtle background; clear for ancestors
        node.element.style.background = matchingIds.has(viewId)
          ? 'rgba(255, 200, 50, 0.08)'
          : '';
      }),
    );
  }

  /**
   * Build a flat, ordered list of all currently visible nodes by walking the
   * tree depth-first.  A node's children are included only when the node is
   * expanded AND the node itself is not hidden by the search filter.
   */
  private _getVisibleNodes(): TreeNode[] {
    const visible: TreeNode[] = [];
    const walk = (nodes: readonly TreeNode[]) => {
      for (const node of nodes) {
        if (node.element.style.display === 'none') continue;
        visible.push(node);
        if (node.expanded) {
          walk(node.children);
        }
      }
    };
    walk(this._roots);
    return visible;
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    // Don't interfere while the search input is focused
    if (document.activeElement === this._searchInput) return;

    const nav = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Enter'];
    if (!nav.includes(e.key)) return;

    e.preventDefault();

    const visibleNodes = this._getVisibleNodes();
    if (visibleNodes.length === 0) return;

    const currentIndex = this._selectedViewId
      ? visibleNodes.findIndex((n) => n.viewId === this._selectedViewId)
      : -1;

    const currentNode = currentIndex >= 0 ? visibleNodes[currentIndex] : null;

    switch (e.key) {
      case 'ArrowDown': {
        const nextIndex = currentIndex < visibleNodes.length - 1
          ? currentIndex + 1
          : currentIndex === -1 ? 0 : currentIndex;
        const next = visibleNodes[nextIndex];
        if (next) {
          this._handleSelect(next.viewId);
          next.element.scrollIntoView({ block: 'nearest' });
        }
        break;
      }

      case 'ArrowUp': {
        const prevIndex = currentIndex > 0
          ? currentIndex - 1
          : currentIndex === -1 ? 0 : 0;
        const prev = visibleNodes[prevIndex];
        if (prev) {
          this._handleSelect(prev.viewId);
          prev.element.scrollIntoView({ block: 'nearest' });
        }
        break;
      }

      case 'ArrowRight': {
        if (!currentNode) break;
        if (!currentNode.expanded) {
          // Expand the node
          currentNode.toggleExpanded();
        } else if (currentNode.children.length > 0) {
          // Move to first child
          const firstChild = currentNode.children[0];
          this._handleSelect(firstChild.viewId);
          firstChild.element.scrollIntoView({ block: 'nearest' });
        }
        break;
      }

      case 'ArrowLeft': {
        if (!currentNode) break;
        if (currentNode.expanded && currentNode.children.length > 0) {
          // Collapse the node
          currentNode.toggleExpanded();
        } else if (currentNode.parentViewId) {
          // Move to parent
          const parent = this._nodeMap.get(currentNode.parentViewId);
          if (parent) {
            this._handleSelect(parent.viewId);
            parent.element.scrollIntoView({ block: 'nearest' });
          }
        }
        break;
      }

      case 'Enter': {
        if (currentNode) {
          this._handleSelect(currentNode.viewId);
          currentNode.element.scrollIntoView({ block: 'nearest' });
        }
        break;
      }
    }
  }
}
