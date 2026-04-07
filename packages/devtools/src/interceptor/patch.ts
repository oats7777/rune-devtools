import { DEVTOOLS_MARKER } from '../constants';

interface PatchRecord {
  target: any;
  method: string;
  original: Function;
}

const patches: PatchRecord[] = [];

export function patchMethod(
  proto: any,
  method: string,
  interceptor: (instance: any, args: any[]) => void,
): void {
  const original = proto[method];
  if (!original || typeof original !== 'function') return;

  patches.push({ target: proto, method, original });

  proto[method] = function (this: any, ...args: any[]) {
    if (this[DEVTOOLS_MARKER]) return original.apply(this, args);
    try {
      interceptor(this, args);
    } catch (e) {
      console.warn('[rune-devtools]', e);
    }
    return original.apply(this, args);
  };
}

export function patchMethodAround(
  proto: any,
  method: string,
  before: (instance: any, args: any[]) => void,
  after: (instance: any, args: any[], result: any) => void,
): void {
  const original = proto[method];
  if (!original || typeof original !== 'function') return;

  patches.push({ target: proto, method, original });

  proto[method] = function (this: any, ...args: any[]) {
    if (this[DEVTOOLS_MARKER]) return original.apply(this, args);
    try {
      before(this, args);
    } catch (e) {
      console.warn('[rune-devtools]', e);
    }
    const result = original.apply(this, args);
    try {
      after(this, args, result);
    } catch (e) {
      console.warn('[rune-devtools]', e);
    }
    return result;
  };
}

export function patchInstanceMethod(
  instance: any,
  method: string,
  interceptor: (instance: any, args: any[]) => void,
): void {
  const original = instance[method];
  if (!original || typeof original !== 'function') return;

  patches.push({ target: instance, method, original });

  instance[method] = function (this: any, ...args: any[]) {
    try {
      interceptor(instance, args);
    } catch (e) {
      console.warn('[rune-devtools]', e);
    }
    return original.apply(this, args);
  };
}

export function unpatchAll(): void {
  while (patches.length > 0) {
    const { target, method, original } = patches.pop()!;
    target[method] = original;
  }
}
