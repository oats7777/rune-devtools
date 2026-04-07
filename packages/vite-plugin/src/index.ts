import type { Plugin } from 'vite';

export interface VitePluginRuneDevtoolsOptions {
  position?: 'bottom' | 'top';
  shortcut?: string;
  maxEvents?: number;
  defaultPanel?: string;
}

export default function runeDevtools(
  options: VitePluginRuneDevtoolsOptions = {},
): Plugin {
  const optionsJson = JSON.stringify(options);

  return {
    name: 'vite-plugin-rune-devtools',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (!ctx.server) return html;

        const script = `
<script type="module">
import { initDevtools } from 'rune-devtools';
initDevtools(${optionsJson});
</script>`;

        return html.replace('<head>', `<head>\n${script}`);
      },
    },
  };
}
