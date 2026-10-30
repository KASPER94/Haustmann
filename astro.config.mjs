// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { articlePlugin } from './src/lib/markdown.mjs';

export default defineConfig({
  site: 'https://haustmann.com',
  trailingSlash: 'never',
  // journal.html plutôt que journal/index.html : des URL sans barre finale
  build: { format: 'file', inlineStylesheets: 'never' },
  // garde les espaces entre éléments en ligne (Astro 7 les supprime par défaut)
  compressHTML: true,
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  markdown: {
    processor: satteri({
      mdastPlugins: [articlePlugin],
      features: { smartPunctuation: false },
    }),
  },
  vite: {
    // aucun script ni style en ligne : la CSP n'autorise que les fichiers du site
    build: { assetsInlineLimit: 0 },
  },
});
