import { installLifecycleInterceptors } from './lifecycle';
import { installRenderingInterceptors } from './rendering';
import { installEventInterceptors } from './events';
import { installListViewInterceptors } from './listview';
import { installRegistryInterceptors } from './registry';
import { installSSRInterceptors } from './ssr';
import type { DevtoolsStore } from '../store';

export { unpatchAll } from './patch';

export function installInterceptors(
  modules: { View: any; ListView: any; Base: any; Page: any; eventHelper: any; rune: any },
  store: DevtoolsStore,
): void {
  const { View, ListView, Base, Page, eventHelper, rune } = modules;

  installLifecycleInterceptors(View, Base, store, rune);
  installRenderingInterceptors(View, store);
  installEventInterceptors(Base, eventHelper, store);
  installListViewInterceptors(ListView, store);
  installRegistryInterceptors(rune, store);
  installSSRInterceptors(View, store);
}
