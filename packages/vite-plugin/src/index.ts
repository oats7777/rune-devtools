import type { Plugin } from 'vite';

export interface VitePluginRuneDevtoolsOptions {
  position?: 'bottom' | 'top';
  shortcut?: string;
  maxEvents?: number;
  defaultPanel?: string;
}

const VIEW_EXTENDS_RE = /class\s+(\w+)\s+extends\s+(?:View|ListView|Page)\b/g;

export default function runeDevtools(
  options: VitePluginRuneDevtoolsOptions = {},
): Plugin {
  const optionsJson = JSON.stringify(options);

  return {
    name: 'rune-devtools-vite',

    transform(code, id) {
      if (!/\.(ts|tsx|js|jsx)$/.test(id)) return;
      if (id.includes('node_modules')) return;
      if (!VIEW_EXTENDS_RE.test(code)) return;

      // Reset regex lastIndex after test
      VIEW_EXTENDS_RE.lastIndex = 0;

      let result = code;
      let offset = 0;

      for (const match of code.matchAll(VIEW_EXTENDS_RE)) {
        const classIdx = match.index! + offset;
        // Find the opening brace after the class declaration
        const braceIdx = result.indexOf('{', classIdx + match[0].length);
        if (braceIdx === -1) continue;

        // Calculate line number from original code
        const line = code.substring(0, match.index!).split('\n').length;
        const filePath = id;

        const injection = `\n  static __source = { file: ${JSON.stringify(filePath)}, line: ${line} };`;
        result = result.slice(0, braceIdx + 1) + injection + result.slice(braceIdx + 1);
        offset += injection.length;
      }

      if (offset === 0) return;
      return { code: result, map: null };
    },

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
