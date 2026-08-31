import { getProjects } from '../lib/portfolio.js';
import { buildSitemap } from '../lib/sitemap.js';

export async function GET({ site }) {
  const base = site?.href || 'https://gerald-clark.com';
  const lastmod = new Date().toISOString().slice(0, 10);
  const body = buildSitemap({
    site: base,
    projects: getProjects(),
    lastmod,
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
