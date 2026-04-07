import { patchInstanceMethod } from './patch';
import { DEVTOOLS_MARKER } from '../constants';
import type { DevtoolsStore } from '../store';

export function installRegistryInterceptors(
  rune: any,
  store: DevtoolsStore,
): void {
  patchInstanceMethod(rune, 'set', (_, args) => {
    const [_element, instance] = args;
    if (!instance?.viewId || instance[DEVTOOLS_MARKER]) return;
    store.timeline.add({
      type: 'registry',
      viewId: instance.viewId,
      constructorName: instance.constructor.name,
      summary: `register ${instance.constructor.name}`,
      detail: null,
      timestamp: performance.now(),
    });
  });
}
