import type { DEVTOOLS_MARKER } from '../constants';
import { STYLES } from './styles';
import { Toolbar } from './toolbar/ToolbarView';
import { PanelContainer } from './panels/PanelContainerView';
import { HighlightOverlay } from '../highlight/HighlightOverlay';

export interface ShellOptions {
  store: any; // DevtoolsStore — typed as any to avoid import coupling
  position: 'bottom' | 'top';
  shortcut: string;
  defaultPanel: string;
  marker: typeof DEVTOOLS_MARKER;
}

/**
 * Parse a shortcut string like "ctrl+shift+d" into a predicate
 * that tests a `KeyboardEvent`.
 */
function createShortcutHandler(
  shortcut: string,
  onTrigger: () => void,
): (e: KeyboardEvent) => void {
  const parts = shortcut.toLowerCase().split('+').map((s) => s.trim());
  const key = parts[parts.length - 1];
  const needsCtrl = parts.includes('ctrl') || parts.includes('control');
  const needsMeta = parts.includes('meta') || parts.includes('cmd');
  const needsShift = parts.includes('shift');
  const needsAlt = parts.includes('alt');

  return (e: KeyboardEvent) => {
    if (e.key.toLowerCase() !== key) return;
    if (needsCtrl && !e.ctrlKey && !e.metaKey) return;
    if (needsMeta && !e.metaKey) return;
    if (needsShift && !e.shiftKey) return;
    if (needsAlt && !e.altKey) return;
    e.preventDefault();
    onTrigger();
  };
}

/**
 * Create the devtools shell: a Shadow-DOM-isolated container with toolbar,
 * panel container, and highlight overlay (outside Shadow DOM).
 *
 * Returns a `destroy` function to tear everything down.
 */
export function createShell(options: ShellOptions): {
  toolbar: Toolbar;
  panelContainer: PanelContainer;
  highlightOverlay: HighlightOverlay;
  destroy: () => void;
} {
  // 1. Create host element
  const host = document.createElement('div');
  host.id = 'rune-devtools-host';
  // Prevent host-page styles from leaking in
  host.style.cssText = 'all: initial; position: fixed; z-index: 2147483647;';
  document.body.appendChild(host);

  // 2. Attach Shadow DOM
  const shadow = host.attachShadow({ mode: 'open' });

  // 3. Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = STYLES;
  shadow.appendChild(styleEl);

  // 4. Create root container inside shadow
  const container = document.createElement('div');
  container.className = 'rune-devtools-root';
  if (options.position === 'top') {
    container.classList.add('rune-devtools-root--top');
  }
  shadow.appendChild(container);

  // 5. Create panel container (sits above toolbar)
  const panelContainer = new PanelContainer();
  container.appendChild(panelContainer.element);

  // 6. Create toolbar
  const toolbar = new Toolbar();
  container.appendChild(toolbar.element);

  // 7. Wire toolbar ↔ panel container
  toolbar.onPanelChange = (panelId) => {
    if (panelId) {
      panelContainer.show(panelId);
    } else {
      panelContainer.hide();
    }
  };

  panelContainer.onClose = () => {
    toolbar.setActivePanel(null);
  };

  // 8. Wire up keyboard shortcut
  const shortcutHandler = createShortcutHandler(options.shortcut, () => {
    toolbar.toggle();
    if (!toolbar.expanded) {
      panelContainer.hide();
    }
  });
  document.addEventListener('keydown', shortcutHandler);

  // 9. Create highlight overlay (outside Shadow DOM, on document.body)
  const highlightOverlay = new HighlightOverlay();

  return {
    toolbar,
    panelContainer,
    highlightOverlay,
    destroy() {
      document.removeEventListener('keydown', shortcutHandler);
      host.remove();
      highlightOverlay.destroy();
    },
  };
}
