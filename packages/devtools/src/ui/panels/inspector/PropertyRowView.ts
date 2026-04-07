/**
 * Returns the CSS color for a given value type.
 */
function valueColor(value: unknown): string {
  if (value === null || value === undefined) return '#666';
  switch (typeof value) {
    case 'string':
      return '#e2b340';
    case 'number':
    case 'bigint':
      return '#6bb5ff';
    case 'boolean':
      return '#b48ead';
    default:
      return '#e0e0e0';
  }
}

/**
 * Formats a primitive value for display.
 */
function formatPrimitive(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  return String(value);
}

/**
 * Returns a collapsed preview for objects/arrays.
 */
function objectPreview(value: unknown): string {
  if (Array.isArray(value)) {
    return `Array(${value.length})`;
  }
  if (typeof value === 'object' && value !== null) {
    const keys = Object.keys(value as object);
    if (keys.length === 0) return '{}';
    const preview = keys.slice(0, 3).join(', ');
    return keys.length > 3 ? `{ ${preview}, … }` : `{ ${preview} }`;
  }
  return String(value);
}

export class PropertyRow {
  readonly element: HTMLElement;
  private _expanded = false;
  private _nestedContainer: HTMLElement | null = null;

  constructor(
    private _key: string,
    private _value: unknown,
    private _onEdit?: (key: string, newValue: unknown) => void,
    private _depth: number = 0,
  ) {
    this.element = document.createElement('div');
    this.element.style.cssText = 'display: flex; flex-direction: column;';

    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      align-items: baseline;
      gap: 6px;
      padding: 2px ${8 + this._depth * 14}px;
      border-radius: 4px;
      min-height: 22px;
      cursor: default;
    `;

    // Key
    const keyEl = document.createElement('span');
    keyEl.textContent = `${this._key}:`;
    keyEl.style.cssText =
      "font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace; font-size: 12px; color: #aaa; flex-shrink: 0; user-select: none;";
    row.appendChild(keyEl);

    const isObject =
      typeof this._value === 'object' && this._value !== null;

    // Value
    const valueEl = document.createElement('span');
    valueEl.style.cssText = `
      font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
      font-size: 12px;
      color: ${valueColor(this._value)};
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: ${isObject ? 'pointer' : this._onEdit ? 'text' : 'default'};
    `;

    if (isObject) {
      valueEl.textContent = objectPreview(this._value);

      // Expand/collapse on click
      valueEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this._toggleExpand();
      });

      // Build nested container (initially hidden)
      this._nestedContainer = document.createElement('div');
      this._nestedContainer.style.display = 'none';
      this.element.appendChild(row);
      this.element.appendChild(this._nestedContainer);
    } else {
      valueEl.textContent = formatPrimitive(this._value);

      // Click-to-edit for primitives
      if (this._onEdit) {
        valueEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this._startEdit(valueEl);
        });
      }
      this.element.appendChild(row);
    }

    row.appendChild(valueEl);
  }

  // ── Private helpers ───────────────────────────────────────────────

  private _toggleExpand(): void {
    if (!this._nestedContainer) return;

    this._expanded = !this._expanded;

    if (this._expanded) {
      this._nestedContainer.innerHTML = '';
      this._renderNested(this._nestedContainer, this._value, this._depth + 1);
      this._nestedContainer.style.display = 'flex';
      this._nestedContainer.style.flexDirection = 'column';
    } else {
      this._nestedContainer.style.display = 'none';
    }
  }

  private _renderNested(container: HTMLElement, value: unknown, depth: number): void {
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        const row = new PropertyRow(String(i), item, this._onEdit, depth);
        container.appendChild(row.element);
      });
    } else if (typeof value === 'object' && value !== null) {
      for (const [k, v] of Object.entries(value)) {
        const row = new PropertyRow(k, v, this._onEdit, depth);
        container.appendChild(row.element);
      }
    }
  }

  private _startEdit(valueEl: HTMLSpanElement): void {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = typeof this._value === 'string'
      ? this._value
      : JSON.stringify(this._value);
    input.style.cssText =
      "background: rgba(255,255,255,0.08); border: 1px solid rgba(28,117,255,0.6); border-radius: 3px; color: #e0e0e0; font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace; font-size: 12px; padding: 0 4px; width: 100%; outline: none;";

    const originalTextContent = valueEl.textContent;
    valueEl.textContent = '';
    valueEl.appendChild(input);
    input.focus();
    input.select();

    const commit = () => {
      const raw = input.value;
      let parsed: unknown = raw;
      // Try to parse as JSON for numbers, booleans, null, objects
      try {
        parsed = JSON.parse(raw);
      } catch {
        // Keep as string
        parsed = raw;
      }
      valueEl.removeChild(input);
      valueEl.textContent = formatPrimitive(parsed);
      this._onEdit?.(this._key, parsed);
    };

    const cancel = () => {
      valueEl.removeChild(input);
      valueEl.textContent = originalTextContent;
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    });

    input.addEventListener('blur', cancel);
  }
}
