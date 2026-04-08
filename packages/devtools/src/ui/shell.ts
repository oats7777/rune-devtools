import type { DEVTOOLS_MARKER } from '../constants';
import type { TimelineEventType } from '../types';
import { STYLES } from './styles';
import { Toolbar } from './toolbar/ToolbarView';
import { PanelContainer } from './panels/PanelContainerView';
import { HighlightOverlay } from '../highlight/HighlightOverlay';
import { TreePanel } from './panels/tree/TreePanelView';
import { InspectorPanel } from './panels/inspector/InspectorPanelView';
import { EventPanel } from './panels/events/EventPanelView';
import { RedrawPanel } from './panels/redraw/RedrawPanelView';
import { ListViewPanel } from './panels/listview/ListViewPanelView';
import { HighlightPanel } from './panels/highlight/HighlightPanelView';
import { TimelinePanel } from './panels/timeline/TimelinePanelView';

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

  // 7. Create highlight overlay (outside Shadow DOM, on document.body)
  const highlightOverlay = new HighlightOverlay();

  // ── 8. Create panels ────────────────────────────────────────────
  const store = options.store;

  // Panel references for cross-wiring (declared with let for forward refs)
  let inspectorPanel: InspectorPanel;
  let treePanel: TreePanel;

  treePanel = new TreePanel(
    store,
    (viewId) => {
      inspectorPanel.selectView(viewId);
      // Expose selected view as $r in console
      const liveView = store.components.getLiveView(viewId);
      if (liveView) {
        (window as any).$r = liveView;
        console.log(
          '%c$r%c = %s %o',
          'color: #1c75ff; font-weight: bold',
          'color: inherit',
          (liveView as any).constructor?.name ?? viewId,
          liveView,
        );
      }
      // Auto-show data panel if a different panel is active
      if (panelContainer.activePanel !== 'data') {
        toolbar.setActivePanel('data');
        panelContainer.show('data');
        activatePanel('data');
      }
    },
    (viewId) => {
      if (viewId) {
        const el = document.querySelector(
          `[data-rune-view-id="${viewId}"]`,
        ) as HTMLElement | null;
        if (el) {
          const snapshot = store.components.get(viewId);
          const rect = el.getBoundingClientRect();
          highlightOverlay.highlight(
            el,
            snapshot?.constructorName ?? '',
            `${Math.round(rect.width)}\u00d7${Math.round(rect.height)}`,
          );
        }
      } else {
        highlightOverlay.clear();
      }
    },
  );

  inspectorPanel = new InspectorPanel(
    store,
    (viewId) => {
      treePanel.selectView(viewId);
      toolbar.setActivePanel('tree');
      panelContainer.show('tree');
      activatePanel('tree');
    },
    (viewId, key, value) => {
      // Get the live View instance directly via stored WeakRef
      const view = store.components.getLiveView(viewId) as any;
      if (!view?.data || !view.redraw) return;
      view.data[key] = value;
      view.redraw();
    },
  );

  const eventPanel = new EventPanel(store);
  const redrawPanel = new RedrawPanel(store);
  const listViewPanel = new ListViewPanel(store);

  const highlightPanel = new HighlightPanel(
    store,
    highlightOverlay,
    (viewId) => {
      treePanel.selectView(viewId);
      inspectorPanel.selectView(viewId);
      toolbar.setActivePanel('tree');
      panelContainer.show('tree');
      activatePanel('tree');
    },
  );

  const timelinePanel = new TimelinePanel(store, (type: TimelineEventType, _viewId: string) => {
    const panelMap: Record<string, string> = {
      render: 'tree',
      mount: 'tree',
      unmount: 'tree',
      redraw: 'redraw',
      event: 'events',
      dispatch: 'events',
      listview: 'listview',
      registry: 'tree',
      ssr: 'tree',
    };
    const targetPanel = panelMap[type] ?? 'tree';
    toolbar.setActivePanel(targetPanel);
    panelContainer.show(targetPanel);
    activatePanel(targetPanel);
  });

  // ── 9. Register panels ──────────────────────────────────────────
  // Toolbar uses 'data' as ID but InspectorPanel has id='inspector'.
  // Register using toolbar IDs for consistency.
  const panels: Record<string, { element: HTMLElement; activate: () => void; deactivate: () => void }> = {
    tree: treePanel,
    data: inspectorPanel,
    events: eventPanel,
    redraw: redrawPanel,
    listview: listViewPanel,
    highlight: highlightPanel,
    timeline: timelinePanel,
  };

  for (const [id, panel] of Object.entries(panels)) {
    panelContainer.registerPanel(id, panel.element);
  }

  // ── 10. Panel activation / deactivation ─────────────────────────
  let activePanelId: string | null = null;

  function activatePanel(panelId: string): void {
    if (activePanelId && activePanelId !== panelId) {
      panels[activePanelId]?.deactivate();
    }
    panels[panelId]?.activate();
    activePanelId = panelId;
  }

  function deactivateCurrentPanel(): void {
    if (activePanelId) {
      panels[activePanelId]?.deactivate();
      activePanelId = null;
    }
  }

  // ── 11. Wire toolbar ↔ panel container ──────────────────────────
  toolbar.onPanelChange = (panelId) => {
    if (panelId) {
      panelContainer.show(panelId);
      activatePanel(panelId);
    } else {
      panelContainer.hide();
      deactivateCurrentPanel();
    }
  };

  panelContainer.onClose = () => {
    toolbar.setActivePanel(null);
    deactivateCurrentPanel();
  };

  // ── 12. Wire up keyboard shortcut ───────────────────────────────
  const shortcutHandler = createShortcutHandler(options.shortcut, () => {
    toolbar.toggle();
    if (!toolbar.expanded) {
      panelContainer.hide();
      deactivateCurrentPanel();
    }
  });
  document.addEventListener('keydown', shortcutHandler);

  return {
    toolbar,
    panelContainer,
    highlightOverlay,
    destroy() {
      deactivateCurrentPanel();
      document.removeEventListener('keydown', shortcutHandler);
      host.remove();
      highlightOverlay.destroy();
    },
  };
}
