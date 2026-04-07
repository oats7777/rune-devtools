export interface ViewSnapshot {
  viewId: string;
  constructorName: string;
  data: unknown;
  args: unknown[];
  parentViewId: string | null;
  renderCount: number;
  isMounted: boolean;
  isSSR: boolean;
  timestamp: number;
}

export interface RedrawRecord {
  viewId: string;
  constructorName: string;
  renderCountBefore: number;
  renderCountAfter: number;
  duration: number;
  attributeChanges: AttributeChange[];
  timestamp: number;
}

export interface AttributeChange {
  name: string;
  oldValue: string | null;
  newValue: string | null;
  type: 'added' | 'removed' | 'modified';
}

export interface EventListenerRecord {
  viewId: string;
  constructorName: string;
  eventType: string;
  selector: string | null;
  handlerName: string;
  timestamp: number;
}

export interface EventDispatchRecord {
  viewId: string;
  constructorName: string;
  eventType: string;
  detail: unknown;
  timestamp: number;
}

export interface ListViewOpRecord {
  viewId: string;
  constructorName: string;
  operation: 'set' | 'append' | 'prepend' | 'remove' | 'removeByIndex' | 'move' | 'reset';
  added: unknown[];
  removed: unknown[];
  kept: unknown[];
  fromIndex?: number;
  toIndex?: number;
  timestamp: number;
}

export interface RegistryRecord {
  viewId: string;
  constructorName: string;
  type: 'register';
  timestamp: number;
}

export type TimelineEventType =
  | 'render'
  | 'mount'
  | 'unmount'
  | 'redraw'
  | 'event'
  | 'dispatch'
  | 'listview'
  | 'registry'
  | 'ssr';

export interface TimelineEntry {
  id: number;
  type: TimelineEventType;
  viewId: string;
  constructorName: string;
  summary: string;
  detail: unknown;
  timestamp: number;
}

export interface DevtoolsOptions {
  rune?: any;
  position?: 'bottom' | 'top';
  shortcut?: string;
  maxEvents?: number;
  defaultPanel?: string;
  plugins?: DevtoolsPlugin[];
}

export interface DevtoolsPlugin {
  name: string;
  setup(api: DevtoolsPluginAPI): void;
}

export interface DevtoolsPluginAPI {
  addPanel(panel: PanelDefinition): void;
  addTimelineEvent(event: Omit<TimelineEntry, 'id'>): void;
  onViewRender(callback: (snapshot: ViewSnapshot) => void): void;
  onViewUnmount(callback: (viewId: string) => void): void;
  onRedraw(callback: (record: RedrawRecord) => void): void;
  onListViewMutation(callback: (record: ListViewOpRecord) => void): void;
}

export interface PanelDefinition {
  id: string;
  label: string;
  icon: string;
  createView(): any;
}
