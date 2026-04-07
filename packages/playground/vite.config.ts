import { defineConfig } from 'vite';
import runeDevtools from 'vite-plugin-rune-devtools';

export default defineConfig({
  plugins: [runeDevtools()],
});
