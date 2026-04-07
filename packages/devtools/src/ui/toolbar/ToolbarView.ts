import { ToolbarButton } from './ToolbarButtonView';
import { PANEL_ICONS } from '../icons';

export interface PanelDef {
  id: string;
  label: string;
  icon: string;
}

const DEFAULT_PANELS: PanelDef[] = [
  { id: 'tree', label: 'Component Tree', icon: PANEL_ICONS.tree },
  { id: 'data', label: 'Data Inspector', icon: PANEL_ICONS.data },
  { id: 'events', label: 'Event Monitor', icon: PANEL_ICONS.events },
  { id: 'redraw', label: 'Redraw Tracker', icon: PANEL_ICONS.redraw },
  { id: 'listview', label: 'ListView Monitor', icon: PANEL_ICONS.listview },
  { id: 'highlight', label: 'DOM Highlight', icon: PANEL_ICONS.highlight },
  { id: 'timeline', label: 'Timeline', icon: PANEL_ICONS.timeline },
];

const LOGO_SVG = `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 2L3 6v8l7 4 7-4V6l-7-4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M10 10l7-4M10 10v8M10 10L3 6" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
  <circle cx="10" cy="10" r="2" fill="currentColor"/>
</svg>`;

export class Toolbar {
  readonly element: HTMLElement;
  private _expanded = false;
  private _buttons: ToolbarButton[] = [];
  private _activePanel: string | null = null;
  private _logoButton: HTMLButtonElement;
  private _buttonsContainer: HTMLElement;
  private _divider: HTMLElement;
  private _onPanelChange: ((panelId: string | null) => void) | null = null;

  constructor(panels: PanelDef[] = DEFAULT_PANELS) {
    this.element = document.createElement('div');
    this.element.className = 'rune-devtools-toolbar rune-devtools-toolbar--collapsed';

    this._logoButton = document.createElement('button');
    this._logoButton.className = 'rune-devtools-logo';
    this._logoButton.innerHTML = LOGO_SVG;
    this._logoButton.title = 'Rune DevTools';
    this._logoButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });
    this.element.appendChild(this._logoButton);

    this._divider = document.createElement('div');
    this._divider.className = 'rune-devtools-toolbar__divider';
    this.element.appendChild(this._divider);

    this._buttonsContainer = document.createElement('div');
    this._buttonsContainer.className = 'rune-devtools-toolbar__buttons';
    this.element.appendChild(this._buttonsContainer);

    for (const panel of panels) {
      const button = new ToolbarButton(
        panel.id,
        panel.icon,
        panel.label,
        (id) => this._handlePanelClick(id),
      );
      this._buttons.push(button);
      this._buttonsContainer.appendChild(button.element);
    }
  }

  get expanded(): boolean {
    return this._expanded;
  }

  get activePanel(): string | null {
    return this._activePanel;
  }

  set onPanelChange(callback: (panelId: string | null) => void) {
    this._onPanelChange = callback;
  }

  toggle(): void {
    if (this._expanded) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  expand(): void {
    this._expanded = true;
    this.element.classList.remove('rune-devtools-toolbar--collapsed');
  }

  collapse(): void {
    this._expanded = false;
    this._activePanel = null;
    this.element.classList.add('rune-devtools-toolbar--collapsed');
    for (const button of this._buttons) {
      button.active = false;
    }
    this._onPanelChange?.(null);
  }

  setActivePanel(panelId: string | null): void {
    this._activePanel = panelId;
    for (const button of this._buttons) {
      button.active = button.id === panelId;
    }
  }

  private _handlePanelClick(panelId: string): void {
    if (this._activePanel === panelId) {
      this._activePanel = null;
      for (const button of this._buttons) {
        button.active = false;
      }
      this._onPanelChange?.(null);
    } else {
      this.setActivePanel(panelId);
      this._onPanelChange?.(panelId);
    }
  }
}
