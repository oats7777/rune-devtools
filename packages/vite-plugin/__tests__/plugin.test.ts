import { describe, it, expect } from 'vitest';
import runeDevtools from '../src/index';

describe('vite-plugin-rune-devtools', () => {
  it('returns a Vite plugin object', () => {
    const plugin = runeDevtools();
    expect(plugin.name).toBe('vite-plugin-rune-devtools');
    expect(plugin.transformIndexHtml).toBeDefined();
    expect(plugin.resolveId).toBeDefined();
    expect(plugin.load).toBeDefined();
  });

  it('resolves virtual module', () => {
    const plugin = runeDevtools();
    const resolved = (plugin.resolveId as Function)('virtual:rune-devtools-init');
    expect(resolved).toBe('\0virtual:rune-devtools-init');
  });

  it('loads virtual module with initDevtools call', () => {
    const plugin = runeDevtools({ position: 'top' });
    const code = (plugin.load as Function)('\0virtual:rune-devtools-init');
    expect(code).toContain("import { initDevtools } from '@rune-ts/devtools'");
    expect(code).toContain('initDevtools(');
    expect(code).toContain('"position":"top"');
  });

  it('injects script tag in development mode', () => {
    const plugin = runeDevtools();
    const result = (plugin.transformIndexHtml as any).handler('<html><body></body></html>', { server: {} });
    expect(result).toHaveLength(1);
    expect(result[0].tag).toBe('script');
    expect(result[0].attrs.src).toBe('virtual:rune-devtools-init');
  });

  it('does not inject in production', () => {
    const plugin = runeDevtools();
    const result = (plugin.transformIndexHtml as any).handler('<html><body></body></html>', {});
    expect(result).toBe('<html><body></body></html>');
  });
});
