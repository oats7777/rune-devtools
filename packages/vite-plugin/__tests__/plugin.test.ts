import { describe, it, expect } from 'vitest';
import runeDevtools from '../src/index';

describe('vite-plugin-rune-devtools', () => {
  it('returns a Vite plugin object', () => {
    const plugin = runeDevtools();
    expect(plugin.name).toBe('vite-plugin-rune-devtools');
    expect(plugin.transformIndexHtml).toBeDefined();
  });

  it('injects script in development mode', () => {
    const plugin = runeDevtools();
    const html = '<html><head></head><body></body></html>';
    const result = (plugin.transformIndexHtml as any).handler(html, { server: {} });
    expect(result).toContain('@rune-ts/devtools');
    expect(result).toContain('initDevtools(');
  });

  it('passes options to initDevtools', () => {
    const plugin = runeDevtools({ position: 'top', maxEvents: 500 });
    const html = '<html><head></head><body></body></html>';
    const result = (plugin.transformIndexHtml as any).handler(html, { server: {} });
    expect(result).toContain('"position":"top"');
    expect(result).toContain('"maxEvents":500');
  });

  it('does not inject in production', () => {
    const plugin = runeDevtools();
    const html = '<html><head></head><body></body></html>';
    const result = (plugin.transformIndexHtml as any).handler(html, {});
    expect(result).toBe(html);
  });
});
