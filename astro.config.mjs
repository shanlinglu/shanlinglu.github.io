import { defineConfig } from 'astro/config';
import workAssets from './scripts/work-assets.mjs';

export default defineConfig({
  site: 'https://shanlinglu.github.io',
  integrations: [workAssets()],
  trailingSlash: 'always',
});
