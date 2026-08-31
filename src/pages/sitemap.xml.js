import { getProjects } from '../lib/portfolio.js';

export async function GET({ site }) {
  const base = site?.href || 'https://gerald-clark.com';
  const now = new Date().toISOString().slice(0, 10);
  const projects = getProjects();

  const urls = [
    { loc: new URL('/', base).href, priority: '1.0' },
    { loc: new URL('/projects/', base).href, priority: '0.9' },
    ...projects.map((project) => ({
      loc: new URL(`/projects/${project.id}/`, base).href,
      priority: '0.8',
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (entry) => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
