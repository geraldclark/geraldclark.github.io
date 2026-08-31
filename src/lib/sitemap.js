/**
 * Build a sitemap URL set for the portfolio site.
 * @param {{ site: string, projects: { id: string }[], lastmod: string }} options
 * @returns {string}
 */
export function buildSitemap({ site, projects, lastmod }) {
  const base = site.endsWith('/') ? site : `${site}/`;

  const urls = [
    { loc: new URL('/', base).href, priority: '1.0' },
    { loc: new URL('/projects/', base).href, priority: '0.9' },
    ...projects.map((project) => ({
      loc: new URL(`/projects/${project.id}/`, base).href,
      priority: '0.8',
    })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (entry) => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;
}
