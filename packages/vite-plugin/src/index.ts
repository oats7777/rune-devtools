import type { Plugin } from 'vite';

export interface VitePluginRuneDevtoolsOptions {
  position?: 'bottom' | 'top';
  shortcut?: string;
  maxEvents?: number;
  defaultPanel?: string;
}

const VIRTUAL_ID = 'virtual:rune-devtools-init';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

export default function runeDevtools(
  options: VitePluginRuneDevtoolsOptions = {},
): Plugin {
  const optionsJson = JSON.stringify(options);

  return {
    name: 'vite-plugin-rune-devtools',

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },

    load(id) {
      if (id === RESOLVED_ID) {
        return [
          `import { initDevtools } from '@rune-ts/devtools';`,
          `initDevtools(${optionsJson});`,
        ].join('\n');
      }
    },

    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (!ctx.server) return html;
        return [
          {
            tag: 'script',
            attrs: { type: 'module', src: VIRTUAL_ID },
            injectTo: 'body' as const,
          },
        ];
      },
    },
  };
}
