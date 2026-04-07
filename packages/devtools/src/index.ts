import { View, ListView, Page, rune } from 'rune-ts';
import { DevtoolsStore } from './store';
import { installInterceptors, unpatchAll } from './interceptor';
import { createShell } from './ui/shell';
import { DEFAULTS, DEVTOOLS_MARKER } from './constants';
import type { DevtoolsOptions } from './types';

// re-export for manual usage
export type { DevtoolsOptions, DevtoolsPlugin, DevtoolsPluginAPI } from './types';
export { DEVTOOLS_MARKER } from './constants';

// Base is not exported from rune-ts — derive from prototype chain
const Base: any = Object.getPrototypeOf(View.prototype).constructor ?? View;

// eventHelper is not exported — access via patching a known method that receives it,
// or derive from a View instance's internal usage. If rune-ts adds the export later,
// import directly. For now, set to null and skip event interceptors if unavailable.
let eventHelper: any = null;
try {
  // Attempt to find eventHelper through rune-ts internals
  // This may need a PR to rune-ts to export eventHelper
  eventHelper = (rune as any)._eventHelper ?? null;
} catch { /* graceful skip */ }

export function initDevtools(options: DevtoolsOptions): () => void {
  const { rune: runeInstance } = options;
  const maxEvents = options.maxEvents ?? DEFAULTS.maxEvents;
  const position = options.position ?? DEFAULTS.position;
  const shortcut = options.shortcut ?? DEFAULTS.shortcut;
  const defaultPanel = options.defaultPanel ?? DEFAULTS.defaultPanel;

  try {
    const store = new DevtoolsStore(maxEvents);

    installInterceptors(
      { View, ListView, Base, Page, eventHelper, rune: runeInstance },
      store,
    );

    const { toolbar, panelContainer, highlightOverlay, destroy } = createShell({
      store,
      position,
      shortcut,
      defaultPanel,
      marker: DEVTOOLS_MARKER,
    });

    // Initialize plugins
    if (options.plugins) {
      for (const plugin of options.plugins) {
        try {
          plugin.setup({
            addPanel: (panel) => { /* delegate to shell */ },
            addTimelineEvent: (entry) => store.timeline.add(entry),
            onViewRender: () => {},
            onViewUnmount: () => {},
            onRedraw: () => {},
            onListViewMutation: () => {},
          });
        } catch (e) {
          console.warn(`[rune-devtools] plugin "${plugin.name}" failed:`, e);
        }
      }
    }

    return () => {
      unpatchAll();
      destroy();
    };
  } catch (e) {
    console.warn('[rune-devtools] failed to initialize:', e);
    return () => {};
  }
}
