import { describe, it, expect, vi, afterEach } from 'vitest';
import { patchMethod, patchInstanceMethod, unpatchAll } from '../src/interceptor/patch';
import { DEVTOOLS_MARKER } from '../src/constants';

describe('patchMethod', () => {
  afterEach(() => unpatchAll());

  it('calls interceptor before original method', () => {
    const calls: string[] = [];
    class Foo {
      bar() { calls.push('original'); return 42; }
    }
    patchMethod(Foo.prototype, 'bar', () => calls.push('interceptor'));
    const result = new Foo().bar();
    expect(calls).toEqual(['interceptor', 'original']);
    expect(result).toBe(42);
  });

  it('skips interceptor for DEVTOOLS_MARKER instances', () => {
    const interceptor = vi.fn();
    class Foo {
      bar() { return 1; }
    }
    patchMethod(Foo.prototype, 'bar', interceptor);
    const instance = new Foo();
    (instance as any)[DEVTOOLS_MARKER] = true;
    instance.bar();
    expect(interceptor).not.toHaveBeenCalled();
  });

  it('does not propagate interceptor errors to host', () => {
    class Foo {
      bar() { return 'ok'; }
    }
    patchMethod(Foo.prototype, 'bar', () => { throw new Error('boom'); });
    expect(new Foo().bar()).toBe('ok');
  });

  it('gracefully skips non-existent methods', () => {
    class Foo {}
    expect(() => patchMethod(Foo.prototype, 'nonexistent', vi.fn())).not.toThrow();
  });

  it('unpatchAll restores original methods', () => {
    class Foo {
      bar() { return 'original'; }
    }
    patchMethod(Foo.prototype, 'bar', vi.fn());
    unpatchAll();
    expect(new Foo().bar()).toBe('original');
  });
});

describe('patchInstanceMethod', () => {
  afterEach(() => unpatchAll());

  it('patches a method on a specific instance', () => {
    const interceptor = vi.fn();
    const obj = { foo() { return 1; } };
    patchInstanceMethod(obj, 'foo', interceptor);
    obj.foo();
    expect(interceptor).toHaveBeenCalled();
  });
});
