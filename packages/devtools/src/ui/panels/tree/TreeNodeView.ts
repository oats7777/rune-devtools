import type { ViewSnapshot } from '../../../types';
import type { ComponentStore } from '../../../store/component-store';
import { openInEditor, hasSourceLocation } from '../../open-editor';

/**
 * Generates a deterministic hue for a constructor name using a simple hash.
 */
function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 70%)`;
}

/**
 * Produces a compact inline JSON preview, truncated to maxLen chars.
 */
function dataPreview(data: unknown, maxLen = 40): string {
  if (data === null) return 'null';
  if (data === undefined) return 'undefined';
  try {
    const s = JSON.stringify(data);
    if (s.length <= maxLen) return s;
    return s.slice(0, maxLen - 1) + '…';
  } catch {
    return String(data);
  }
}

export class TreeNode {
  readonly element: HTMLElement;
  readonly viewId: string;

  private _expanded = true;
  private _selected = false;
  private _childContainer: HTMLElement;
  private _children: TreeNode[] = [];

  get children(): readonly TreeNode[] { return this._children; }

  // Row sub-elements that need updating
  private _dotEl: HTMLElement;
  private _nameEl: HTMLElement;
  private _previewEl: HTMLElement;
  private _badgeEl: HTMLElement;
  private _toggleEl: HTMLElement;
  private _rowEl: HTMLElement;

  constructor(
    private _snapshot: ViewSnapshot,
    private _store: ComponentStore,
    private _onSelect: (viewId: string) => void,
    private _onHover: (viewId: string | null) => void,
    private _depth: number = 0,
  ) {
    this.viewId = _snapshot.viewId;

    this.element = document.createElement('div');
    this.element.style.cssText = 'display: flex; flex-direction: column;';

    // ── Row ────────────────────────────────────────────────────────
    this._rowEl = document.createElement('div');
    this._rowEl.className = 'rune-dt-row';
    this._rowEl.style.cssText = `padding-left: ${8 + this._depth * 16}px;`;

    // Toggle triangle
    this._toggleEl = document.createElement('span');
    this._toggleEl.style.cssText =
      'display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; font-size: 9px; color: #666; flex-shrink: 0; cursor: pointer; user-select: none;';
    this._rowEl.appendChild(this._toggleEl);

    // Mounted dot
    this._dotEl = document.createElement('span');
    this._dotEl.style.cssText =
      'width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;';
    this._rowEl.appendChild(this._dotEl);

    // Constructor name
    this._nameEl = document.createElement('span');
    this._nameEl.style.cssText =
      "font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace; font-size: 12px; font-weight: 600; flex-shrink: 0;";
    this._rowEl.appendChild(this._nameEl);

    // Data preview
    this._previewEl = document.createElement('span');
    this._previewEl.style.cssText =
      "font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace; font-size: 11px; color: #666; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;";
    this._rowEl.appendChild(this._previewEl);

    // Render count badge
    this._badgeEl = document.createElement('span');
    this._badgeEl.className = 'rune-dt-badge';
    this._badgeEl.style.cssText =
      'display: inline-flex; align-items: center; padding: 1px 6px; border-radius: 6px; font-size: 11px; font-weight: 500; background: rgba(28,117,255,0.15); color: #1c75ff; flex-shrink: 0;';
    this._rowEl.appendChild(this._badgeEl);

    this.element.appendChild(this._rowEl);

    // ── Child container ────────────────────────────────────────────
    this._childContainer = document.createElement('div');
    this._childContainer.style.cssText = 'display: flex; flex-direction: column;';
    this.element.appendChild(this._childContainer);

    // ── Wire interactions ──────────────────────────────────────────
    this._toggleEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleExpanded();
    });

    this._rowEl.addEventListener('click', () => {
      this._onSelect(this.viewId);
    });

    this._rowEl.addEventListener('mouseenter', () => {
      this._onHover(this.viewId);
    });

    this._rowEl.addEventListener('mouseleave', () => {
      this._onHover(null);
    });

    // Initial render
    this._applySnapshot(_snapshot);
    this.refresh();
  }

  // ── Public API ──────────────────────────────────────────────────

  update(snapshot: ViewSnapshot): void {
    this._snapshot = snapshot;
    this._applySnapshot(snapshot);
  }

  select(): void {
    this._selected = true;
    this._rowEl.classList.add('selected');
  }

  deselect(): void {
    this._selected = false;
    this._rowEl.classList.remove('selected');
  }

  /** Re-read children from store and reconcile DOM child nodes. */
  refresh(): void {
    const childSnapshots = this._store.getChildren(this.viewId);

    // Update toggle visibility
    if (childSnapshots.length === 0) {
      this._toggleEl.textContent = '';
      this._toggleEl.style.cursor = 'default';
    } else {
      this._toggleEl.textContent = this._expanded ? '▼' : '▶';
      this._toggleEl.style.cursor = 'pointer';
    }

    // Build a map of existing children
    const existingMap = new Map<string, TreeNode>();
    for (const child of this._children) {
      existingMap.set(child.viewId, child);
    }

    const newChildren: TreeNode[] = [];

    for (const snap of childSnapshots) {
      const existing = existingMap.get(snap.viewId);
      if (existing) {
        existing.update(snap);
        existing.refresh();
        newChildren.push(existing);
      } else {
        const node = new TreeNode(
          snap,
          this._store,
          this._onSelect,
          this._onHover,
          this._depth + 1,
        );
        newChildren.push(node);
      }
    }

    // Rebuild child container DOM
    this._childContainer.innerHTML = '';
    for (const child of newChildren) {
      this._childContainer.appendChild(child.element);
    }
    this._children = newChildren;

    // Sync visibility
    this._childContainer.style.display = this._expanded ? 'flex' : 'none';
  }

  // ── Private helpers ─────────────────────────────────────────────

  private _applySnapshot(snapshot: ViewSnapshot): void {
    // Dot color
    this._dotEl.style.background = snapshot.isMounted ? '#4caf50' : '#555';
    this._dotEl.title = snapshot.isMounted ? 'Mounted' : 'Unmounted';

    // Name color + source link
    this._nameEl.textContent = snapshot.constructorName;
    this._nameEl.style.color = colorForName(snapshot.constructorName);
    if (hasSourceLocation(snapshot)) {
      this._nameEl.style.cursor = 'pointer';
      this._nameEl.style.textDecoration = 'underline';
      this._nameEl.style.textDecorationColor = 'rgba(255,255,255,0.2)';
      this._nameEl.title = `${snapshot.sourceLocation!.file}:${snapshot.sourceLocation!.line} (click to open)`;
      this._nameEl.onclick = (e) => {
        e.stopPropagation();
        openInEditor(snapshot.sourceLocation!);
      };
    } else {
      this._nameEl.style.cursor = '';
      this._nameEl.style.textDecoration = '';
      this._nameEl.title = '';
      this._nameEl.onclick = null;
    }

    // Preview
    this._previewEl.textContent = dataPreview(snapshot.data);

    // Badge
    this._badgeEl.textContent = `×${snapshot.renderCount}`;
  }

  private _toggleExpanded(): void {
    this._expanded = !this._expanded;
    this._childContainer.style.display = this._expanded ? 'flex' : 'none';
    const childSnapshots = this._store.getChildren(this.viewId);
    if (childSnapshots.length > 0) {
      this._toggleEl.textContent = this._expanded ? '▼' : '▶';
    }
  }
}
