import { patchMethod } from './patch';
import type { DevtoolsStore } from '../store';

export function installSSRInterceptors(
  View: any,
  store: DevtoolsStore,
): void {
  patchMethod(View.prototype, 'hydrateFromSSR', (view) => {
    const snapshot = store.components.get(view.viewId);
    if (snapshot) {
      snapshot.isSSR = true;
    }
    store.timeline.add({
      type: 'ssr',
      viewId: view.viewId,
      constructorName: view.constructor.name,
      summary: `hydrate ${view.constructor.name} from SSR`,
      detail: null,
      timestamp: performance.now(),
    });
  });
}
