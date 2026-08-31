import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://gerald-clark.com',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
});
