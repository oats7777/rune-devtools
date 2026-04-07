import { patchMethod } from './patch';
import type { DevtoolsStore } from '../store';

export function installEventInterceptors(
  Base: any,
  eventHelper: any,
  store: DevtoolsStore,
): void {
  // _makeListener on EventHelper prototype
  if (eventHelper) {
    const ehProto = Object.getPrototypeOf(eventHelper);
    if (ehProto && ehProto._makeListener) {
      patchMethod(ehProto, '_makeListener', (eh, args) => {
        const [instance, listener, ViewClass] = args;
        if (!instance?.viewId) return;
        store.events.addListener({
          viewId: instance.viewId,
          constructorName: instance.constructor.name,
          eventType: ViewClass?.name ?? listener?.name ?? 'unknown',
          selector: null,
          handlerName: listener?.name ?? 'anonymous',
          timestamp: performance.now(),
        });
      });
    }
  }

  // dispatchEvent on Base.prototype
  patchMethod(Base.prototype, 'dispatchEvent', (view, args) => {
    const [EventClass, options] = args;
    const record = {
      viewId: view.viewId,
      constructorName: view.constructor.name,
      eventType: EventClass?.name ?? 'unknown',
      detail: options?.detail ?? null,
      timestamp: performance.now(),
    };
    store.events.addDispatch(record);
    store.timeline.add({
      type: 'dispatch',
      viewId: view.viewId,
      constructorName: view.constructor.name,
      summary: `dispatch ${record.eventType} from ${view.constructor.name}`,
      detail: record,
      timestamp: record.timestamp,
    });
  });
}
