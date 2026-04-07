import type { DevtoolsStore } from '../../../store';
import type { ViewSnapshot } from '../../../types';
import { PropertyRow } from './PropertyRowView';

/**
 * Creates a collapsible section element.
 */
function makeSection(title: string): { section: HTMLElement; body: HTMLElement } {
  const section = document.createElement('div');
  section.style.cssText =
    'border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 2px;';

  let expanded = true;

  const header = document.createElement('div');
  header.style.cssText =
    'display: flex; align-items: center; gap: 6px; padding: 5px 8px; cursor: pointer; user-select: none;';

  const arrow = document.createElement('span');
  arrow.textContent = '▼';
  arrow.style.cssText = 'font-size: 9px; color: #666; flex-shrink: 0;';

  const label = document.createElement('span');
  label.textContent = title;
  label.style.cssText =
    'font-size: 11px; font-weight: 600; color: #aaa; text-transform: uppercase; letter-spacing: 0.06em;';

  header.appendChild(arrow);
  header.appendChild(label);

  const body = document.createElement('div');
  body.style.cssText = 'padding-bottom: 4px;';

  header.addEventListener('click', () => {
    expanded = !expanded;
    arrow.textContent = expanded ? '▼' : '▶';
    body.style.display = expanded ? '' : 'none';
  });

  section.appendChild(header);
  section.appendChild(body);

  return { section, body };
}

export class InspectorPanel {
  readonly element: HTMLElement;
  readonly id = 'inspector';
  readonly label = 'Data Inspector';

  private _contentEl: HTMLElement;
  private _selectedViewId: string | null = null;
  private _emptyEl: HTMLElement;

  constructor(
    private _store: DevtoolsStore,
    private _onNavigate: (viewId: string) => void,
    private _onEditData?: (viewId: string, key: string, value: unknown) => void,
  ) {
    this.element = document.createElement('div');
    this.element.style.cssText =
      'display: flex; flex-direction: column; height: 100%; min-height: 0; overflow: auto;';

    // Empty state
    this._emptyEl = document.createElement('div');
    this._emptyEl.className = 'rune-dt-empty';
    this._emptyEl.textContent = 'Select a component to inspect';
    this.element.appendChild(this._emptyEl);

    // Content container (hidden until a view is selected)
    this._contentEl = document.createElement('div');
    this._contentEl.style.display = 'none';
    this.element.appendChild(this._contentEl);
  }

  // ── Lifecycle ────────────────────────────────────────────────────

  activate(): void {
    this.refresh();
  }

  deactivate(): void {
    // No refresh interval needed — inspector is event-driven via selectView()
  }

  // ── Public API ────────────────────────────────────────────────────

  selectView(viewId: string): void {
    this._selectedViewId = viewId;
    this.refresh();
  }

  refresh(): void {
    if (!this._selectedViewId) {
      this._showEmpty();
      return;
    }

    const snapshot = this._store.components.get(this._selectedViewId);
    if (!snapshot) {
      this._showEmpty();
      return;
    }

    this._render(snapshot);
  }

  // ── Private helpers ───────────────────────────────────────────────

  private _showEmpty(): void {
    this._emptyEl.style.display = '';
    this._contentEl.style.display = 'none';
    this._contentEl.innerHTML = '';
  }

  private _render(snapshot: ViewSnapshot): void {
    this._emptyEl.style.display = 'none';
    this._contentEl.style.display = 'block';
    this._contentEl.innerHTML = '';

    // ── Data section ─────────────────────────────────────────────
    const { section: dataSection, body: dataBody } = makeSection('Data');

    if (snapshot.data !== null && snapshot.data !== undefined && typeof snapshot.data === 'object') {
      for (const [key, val] of Object.entries(snapshot.data as object)) {
        const row = new PropertyRow(
          key,
          val,
          this._onEditData
            ? (k, v) => this._onEditData!(this._selectedViewId!, k, v)
            : undefined,
          0,
        );
        dataBody.appendChild(row.element);
      }
    } else if (snapshot.data !== undefined) {
      const row = new PropertyRow('(value)', snapshot.data, undefined, 0);
      dataBody.appendChild(row.element);
    } else {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding: 4px 8px; color: #666; font-size: 12px;';
      empty.textContent = 'No data';
      dataBody.appendChild(empty);
    }

    this._contentEl.appendChild(dataSection);

    // ── Args section ─────────────────────────────────────────────
    const { section: argsSection, body: argsBody } = makeSection('Constructor Args');

    if (snapshot.args.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding: 4px 8px; color: #666; font-size: 12px;';
      empty.textContent = 'No arguments';
      argsBody.appendChild(empty);
    } else {
      snapshot.args.forEach((arg, i) => {
        const row = new PropertyRow(String(i), arg, undefined, 0);
        argsBody.appendChild(row.element);
      });
    }

    this._contentEl.appendChild(argsSection);

    // ── Relationships section ─────────────────────────────────────
    const { section: relSection, body: relBody } = makeSection('Relationships');

    // Parent
    const parentRow = document.createElement('div');
    parentRow.style.cssText =
      'display: flex; align-items: baseline; gap: 6px; padding: 2px 8px; min-height: 22px;';

    const parentKeyEl = document.createElement('span');
    parentKeyEl.textContent = 'parent:';
    parentKeyEl.style.cssText =
      "font-family: 'SF Mono', 'Fira Code', monospace; font-size: 12px; color: #aaa; flex-shrink: 0;";
    parentRow.appendChild(parentKeyEl);

    const parentValEl = document.createElement('span');
    parentValEl.style.cssText =
      "font-family: 'SF Mono', 'Fira Code', monospace; font-size: 12px; flex: 1;";

    if (snapshot.parentViewId) {
      const parentSnap = this._store.components.get(snapshot.parentViewId);
      const parentName = parentSnap?.constructorName ?? snapshot.parentViewId;
      parentValEl.textContent = parentName;
      parentValEl.style.color = '#1c75ff';
      parentValEl.style.cursor = 'pointer';
      parentValEl.title = `Navigate to ${parentName}`;
      parentValEl.addEventListener('click', () => {
        this._onNavigate(snapshot.parentViewId!);
      });
    } else {
      parentValEl.textContent = 'none';
      parentValEl.style.color = '#666';
    }

    parentRow.appendChild(parentValEl);
    relBody.appendChild(parentRow);

    // Children
    const children = this._store.components.getChildren(snapshot.viewId);
    const childrenRow = document.createElement('div');
    childrenRow.style.cssText =
      'display: flex; align-items: baseline; gap: 6px; padding: 2px 8px; min-height: 22px; flex-wrap: wrap;';

    const childKeyEl = document.createElement('span');
    childKeyEl.textContent = 'children:';
    childKeyEl.style.cssText =
      "font-family: 'SF Mono', 'Fira Code', monospace; font-size: 12px; color: #aaa; flex-shrink: 0;";
    childrenRow.appendChild(childKeyEl);

    if (children.length === 0) {
      const noneEl = document.createElement('span');
      noneEl.textContent = 'none';
      noneEl.style.cssText =
        "font-family: 'SF Mono', 'Fira Code', monospace; font-size: 12px; color: #666;";
      childrenRow.appendChild(noneEl);
    } else {
      for (const child of children) {
        const link = document.createElement('span');
        link.textContent = child.constructorName;
        link.style.cssText =
          "font-family: 'SF Mono', 'Fira Code', monospace; font-size: 12px; color: #1c75ff; cursor: pointer; margin-right: 6px;";
        link.title = `Navigate to ${child.constructorName}`;
        link.addEventListener('click', () => this._onNavigate(child.viewId));
        childrenRow.appendChild(link);
      }
    }

    relBody.appendChild(childrenRow);
    this._contentEl.appendChild(relSection);

    // ── Meta section ─────────────────────────────────────────────
    const { section: metaSection, body: metaBody } = makeSection('Meta');

    const metaFields: Array<[string, unknown]> = [
      ['viewId', snapshot.viewId],
      ['renderCount', snapshot.renderCount],
      ['mounted', snapshot.isMounted],
      ['ssr', snapshot.isSSR],
      ['timestamp', new Date(snapshot.timestamp).toISOString()],
    ];

    for (const [key, val] of metaFields) {
      const row = new PropertyRow(key, val, undefined, 0);
      metaBody.appendChild(row.element);
    }

    this._contentEl.appendChild(metaSection);
  }
}
