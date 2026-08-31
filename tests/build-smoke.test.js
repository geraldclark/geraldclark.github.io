import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getProjects } from '../src/lib/portfolio.js';

const distDir = path.resolve(process.cwd(), 'dist');

function readDist(...parts) {
  return fs.readFileSync(path.join(distDir, ...parts), 'utf8');
}

function exists(...parts) {
  return fs.existsSync(path.join(distDir, ...parts));
}

describe('build smoke (dist/)', () => {
  it('has a built dist/ directory', () => {
    expect(exists(), 'Run npm run build before test:build').toBe(true);
  });

  it('publishes crawl essentials', () => {
    expect(readDist('CNAME').trim()).toBe('gerald-clark.com');
    expect(readDist('robots.txt')).toMatch(/Sitemap:\s*https:\/\/gerald-clark\.com\/sitemap\.xml/i);
    expect(exists('sitemap.xml')).toBe(true);
    expect(exists('.nojekyll')).toBe(true);
  });

  it('builds home and projects index with crawlable content', () => {
    const home = readDist('index.html');
    expect(home).toContain('Gerald Clark');
    expect(home).toMatch(/canonical/i);

    const projects = readDist('projects', 'index.html');
    expect(projects).toContain('Projects');
    expect(projects).toMatch(/plugin-assist|Assist/);
  });

  it('builds a detail page for every project id', () => {
    for (const project of getProjects()) {
      const htmlPath = path.join(distDir, 'projects', project.id, 'index.html');
      expect(fs.existsSync(htmlPath), project.id).toBe(true);
      const html = fs.readFileSync(htmlPath, 'utf8');
      expect(html, project.id).toContain(project.name);
    }
  });

  it('lists every project URL in sitemap.xml', () => {
    const sitemap = readDist('sitemap.xml');
    expect(sitemap).toContain('https://gerald-clark.com/');
    expect(sitemap).toContain('https://gerald-clark.com/projects/');
    for (const project of getProjects()) {
      expect(sitemap).toContain(
        `https://gerald-clark.com/projects/${project.id}/`
      );
    }
  });
});
