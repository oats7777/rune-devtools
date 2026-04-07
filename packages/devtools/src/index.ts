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
// Chain: Base → VirtualView → View, so we need 2 levels up
const VirtualViewProto = Object.getPrototypeOf(View.prototype);
const Base: any = Object.getPrototypeOf(VirtualViewProto)?.constructor ?? VirtualViewProto?.constructor ?? View;

// eventHelper is not exported from rune-ts — event listener tracking unavailable.
// dispatchEvent interception still works via Base.prototype.dispatchEvent.
// TODO: PR to rune-ts to export eventHelper for full event tracking.
const eventHelper: any = null;

export function initDevtools(options: DevtoolsOptions = {}): () => void {
  const runeInstance = options.rune ?? rune;
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
            addPanel: (panel) => {
              panelContainer.registerPanel(panel.id, panel.createView());
            },
            addTimelineEvent: (entry) => store.timeline.add(entry),
            onViewRender: (cb) => store.onViewRender(cb),
            onViewUnmount: (cb) => store.onViewUnmount(cb),
            onRedraw: (cb) => store.onRedraw(cb),
            onListViewMutation: (cb) => store.onListViewMutation(cb),
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
