export class ToolbarButton {
  readonly element: HTMLButtonElement;
  private _active = false;

  constructor(
    private _id: string,
    private _icon: string,
    private _tooltip: string,
    private _onClick: (id: string) => void,
  ) {
    this.element = document.createElement('button');
    this.element.className = 'rune-devtools-toolbar-button';
    this.element.innerHTML = _icon;
    this.element.title = _tooltip;
    this.element.setAttribute('data-panel', _id);
    this.element.addEventListener('click', (e) => {
      e.stopPropagation();
      this._onClick(this._id);
    });
  }

  get id(): string {
    return this._id;
  }

  get active(): boolean {
    return this._active;
  }

  set active(value: boolean) {
    this._active = value;
    this.element.classList.toggle('active', value);
  }
}
