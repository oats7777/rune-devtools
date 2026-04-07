import { PANEL_ICONS } from '../icons';

const PANEL_LABELS: Record<string, string> = {
  tree: 'Component Tree',
  data: 'Data Inspector',
  events: 'Event Monitor',
  redraw: 'Redraw Tracker',
  listview: 'ListView Monitor',
  highlight: 'DOM Highlight',
  timeline: 'Timeline',
};

export class PanelContainer {
  readonly element: HTMLElement;
  private _panels = new Map<string, HTMLElement>();
  private _activePanel: string | null = null;
  private _header: HTMLElement;
  private _headerTitle: HTMLElement;
  private _body: HTMLElement;
  private _onClose: (() => void) | null = null;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'rune-devtools-panel-container';
    this.element.style.display = 'none';

    this._header = document.createElement('div');
    this._header.className = 'rune-devtools-panel-header';

    this._headerTitle = document.createElement('span');
    this._headerTitle.className = 'rune-devtools-panel-header__title';
    this._header.appendChild(this._headerTitle);

    const actions = document.createElement('div');
    actions.className = 'rune-devtools-panel-header__actions';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'rune-dt-close-button';
    closeBtn.innerHTML = PANEL_ICONS.close;
    closeBtn.title = 'Close panel';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
      this._onClose?.();
    });
    actions.appendChild(closeBtn);
    this._header.appendChild(actions);

    this._body = document.createElement('div');
    this._body.className = 'rune-devtools-panel-body';

    this.element.appendChild(this._header);
    this.element.appendChild(this._body);
  }

  get activePanel(): string | null {
    return this._activePanel;
  }

  set onClose(callback: () => void) {
    this._onClose = callback;
  }

  show(panelId: string): void {
    this.element.style.display = 'flex';
    this._headerTitle.textContent = PANEL_LABELS[panelId] ?? panelId;

    // Hide all panels, show requested one
    for (const [id, el] of this._panels) {
      el.classList.toggle('active', id === panelId);
    }

    // Lazy-create the panel content div if it doesn't exist
    if (!this._panels.has(panelId)) {
      const content = document.createElement('div');
      content.className = 'rune-devtools-panel-content active';
      content.dataset.panelId = panelId;
      this._body.appendChild(content);
      this._panels.set(panelId, content);
    }

    this._activePanel = panelId;
  }

  hide(): void {
    this.element.style.display = 'none';
    this._activePanel = null;
    for (const el of this._panels.values()) {
      el.classList.remove('active');
    }
  }

  registerPanel(id: string, element: HTMLElement): void {
    let content = this._panels.get(id);
    if (!content) {
      content = document.createElement('div');
      content.className = 'rune-devtools-panel-content';
      content.dataset.panelId = id;
      this._body.appendChild(content);
      this._panels.set(id, content);
    }
    content.appendChild(element);
  }

  getPanelContent(id: string): HTMLElement | undefined {
    return this._panels.get(id);
  }
}
