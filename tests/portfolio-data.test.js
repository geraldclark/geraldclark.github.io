import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import portfolio from '../src/data/portfolio.json';

const publicDir = path.resolve(process.cwd(), 'public');

function assetExists(src) {
  if (!src) return true;
  const relative = src.replace(/^\//, '');
  return fs.existsSync(path.join(publicDir, relative));
}

describe('portfolio.json data contracts', () => {
  const projects = portfolio.projects || [];

  it('has about metadata', () => {
    expect(portfolio.about?.name).toBe('Gerald Clark');
    expect(portfolio.about?.location).toMatch(/Pittsburgh/);
  });

  it('requires unique project ids', () => {
    const ids = projects.map((project) => project.id);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('requires name and description on every project', () => {
    for (const project of projects) {
      expect(project.name?.trim().length, project.id).toBeGreaterThan(0);
      expect(
        (project.description || project.shortDescription || '').trim().length,
        project.id
      ).toBeGreaterThan(0);
    }
  });

  it('keeps Sugar/Upsert plugin entries on plugin-* ids', () => {
    const plugins = projects.filter((project) => (project.id || '').startsWith('plugin-'));
    expect(plugins.length).toBeGreaterThan(0);

    for (const plugin of plugins) {
      expect(plugin.name?.trim().length, plugin.id).toBeGreaterThan(0);
      expect(
        plugin.company === 'Upsert, LLC' || /sugar/i.test(plugin.id),
        plugin.id
      ).toBe(true);
    }
  });

  it('ensures referenced image assets exist under public/', () => {
    for (const project of projects) {
      for (const field of ['logo', 'image', 'featuredImage']) {
        const src = project[field];
        if (!src) continue;
        expect(assetExists(src), `${project.id} ${field}=${src}`).toBe(true);
      }
    }
  });

  it('uses SugarAI (not SugarCRM) in Upsert tech tags', () => {
    for (const project of projects) {
      if (project.company !== 'Upsert, LLC') continue;
      const tech = project.tech || [];
      expect(tech.includes('SugarCRM'), project.id).toBe(false);
    }
  });
});
