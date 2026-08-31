import { describe, expect, it } from 'vitest';
import { getProjects } from '../src/lib/portfolio.js';
import { buildSitemap } from '../src/lib/sitemap.js';

describe('buildSitemap', () => {
  const lastmod = '2026-08-30';
  const site = 'https://gerald-clark.com';

  it('includes home, projects index, and each project with trailing slashes', () => {
    const projects = [{ id: 'plugin-assist' }, { id: 'plugin-engage' }];
    const xml = buildSitemap({ site, projects, lastmod });

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>https://gerald-clark.com/</loc>');
    expect(xml).toContain('<loc>https://gerald-clark.com/projects/</loc>');
    expect(xml).toContain('<loc>https://gerald-clark.com/projects/plugin-assist/</loc>');
    expect(xml).toContain('<loc>https://gerald-clark.com/projects/plugin-engage/</loc>');
    expect(xml).toContain(`<lastmod>${lastmod}</lastmod>`);
    expect(xml).toContain('<priority>1.0</priority>');
    expect(xml).toContain('<priority>0.9</priority>');
    expect(xml).toContain('<priority>0.8</priority>');
  });

  it('accepts a site URL that already has a trailing slash', () => {
    const xml = buildSitemap({
      site: 'https://gerald-clark.com/',
      projects: [{ id: 'x' }],
      lastmod,
    });
    expect(xml).toContain('<loc>https://gerald-clark.com/projects/x/</loc>');
  });

  it('covers every portfolio project id', () => {
    const projects = getProjects();
    const xml = buildSitemap({ site, projects, lastmod });

    for (const project of projects) {
      expect(xml).toContain(
        `<loc>https://gerald-clark.com/projects/${project.id}/</loc>`
      );
    }
  });

  it('produces well-formed XML with matching urlset tags', () => {
    const xml = buildSitemap({
      site,
      projects: getProjects(),
      lastmod,
    });
    expect(xml.trim().startsWith('<?xml')).toBe(true);
    expect(xml).toMatch(/<urlset[\s\S]*<\/urlset>\s*$/);
    const openUrls = (xml.match(/<url>/g) || []).length;
    const closeUrls = (xml.match(/<\/url>/g) || []).length;
    expect(openUrls).toBe(closeUrls);
    expect(openUrls).toBe(2 + getProjects().length);
  });
});
