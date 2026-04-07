import { defineConfig } from 'vite';
import runeDevtools from 'rune-devtools-vite';

export default defineConfig({
  plugins: [runeDevtools()],
});
