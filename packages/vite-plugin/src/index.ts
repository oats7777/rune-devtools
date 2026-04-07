// Plugin type import — vite may not be installed in this worktree, using any fallback
let Plugin: any;
try {
  Plugin = require('vite');
} catch {
  // vite not available, that's ok — type only
}

export interface VitePluginRuneDevtoolsOptions {
  position?: 'bottom' | 'top';
  shortcut?: string;
  maxEvents?: number;
  defaultPanel?: string;
}

export default function runeDevtools(
  options: VitePluginRuneDevtoolsOptions = {},
): any {
  const optionsJson = JSON.stringify(options);

  return {
    name: 'vite-plugin-rune-devtools',
    transformIndexHtml: {
      order: 'post',
      handler(html: string, ctx: any) {
        // Only inject in dev server
        if (!ctx.server) return html;

        const script = `
<script type="module">
  import { initDevtools } from '@rune-ts/devtools';
  if (window.__rune__) {
    initDevtools({ rune: window.__rune__, ...${optionsJson} });
  } else {
    const observer = new MutationObserver(() => {
      if (window.__rune__) {
        observer.disconnect();
        initDevtools({ rune: window.__rune__, ...${optionsJson} });
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  }
</script>`;

        return html.replace('</body>', `${script}\n</body>`);
      },
    },
  };
}
