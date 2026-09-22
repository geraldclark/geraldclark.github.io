import { describe, expect, it } from 'vitest';
import {
  getPortfolio,
  getProjectById,
  getProjects,
  getRecentProjects,
  projectImageIsLogo,
  projectImagePath,
  projectLogoPath,
  projectPath,
  projectSummary,
  projectCardSummary,
  projectYear,
  formatProjectStatus,
} from '../src/lib/portfolio.js';

describe('getPortfolio', () => {
  it('returns portfolio data with projects', () => {
    const data = getPortfolio();
    expect(data.about?.name).toBe('Gerald Clark');
    expect(Array.isArray(data.projects)).toBe(true);
    expect(data.projects.length).toBeGreaterThan(0);
  });
});

describe('projectYear', () => {
  it('prefers end_year when set', () => {
    expect(projectYear({ end_year: 2022, start_year: 2018 })).toBe(2022);
  });

  it('falls back to start_year', () => {
    expect(projectYear({ end_year: null, start_year: 2024 })).toBe(2024);
  });

  it('returns undefined when neither year is set', () => {
    expect(projectYear({})).toBeUndefined();
  });
});

describe('formatProjectStatus', () => {
  it('returns sentence-case labels', () => {
    expect(formatProjectStatus('online')).toBe('Online');
    expect(formatProjectStatus('completed')).toBe('Completed');
    expect(formatProjectStatus('deprecated')).toBe('Deprecated');
    expect(formatProjectStatus('offline')).toBe('Deprecated');
  });
});

describe('projectPath', () => {
  it('builds trailing-slash project paths', () => {
    expect(projectPath({ id: 'plugin-assist' })).toBe('/projects/plugin-assist/');
  });
});

describe('projectCardSummary', () => {
  it('leads with SugarAI when the blurb omits the host product', () => {
    expect(
      projectCardSummary({
        id: 'plugin-focused-views',
        company: 'Upsert, LLC',
        shortDescription: 'Lets admins assign subpanels to record view tabs.',
      })
    ).toBe('SugarAI add-on that lets admins assign subpanels to record view tabs.');
  });

  it('does not duplicate SugarAI when already stated', () => {
    expect(
      projectCardSummary({
        id: 'plugin-engage-zoom',
        company: 'Upsert, LLC',
        shortDescription:
          'SugarAI add-on that embeds Zoom Phone for dial-from-record and SMS.',
      })
    ).toBe('SugarAI add-on that embeds Zoom Phone for dial-from-record and SMS.');
  });

  it('passes through non-plugin projects unchanged', () => {
    expect(
      projectCardSummary({
        id: 'blog-foo',
        company: 'Upsert, LLC',
        shortDescription: 'Guide to custom record views.',
      })
    ).toBe('Guide to custom record views.');
  });
});

describe('projectSummary', () => {
  it('prefers shortDescription', () => {
    expect(
      projectSummary({
        shortDescription: 'Short',
        description: 'Long',
      })
    ).toBe('Short');
  });

  it('falls back to description', () => {
    expect(projectSummary({ description: 'Long' })).toBe('Long');
  });

  it('returns empty string when missing', () => {
    expect(projectSummary({})).toBe('');
  });
});

describe('getProjects', () => {
  it('returns a sorted copy, newest first', () => {
    const projects = getProjects();
    expect(projects.length).toBe(getPortfolio().projects.length);

    for (let i = 1; i < projects.length; i += 1) {
      const prev = projectYear(projects[i - 1]);
      const curr = projectYear(projects[i]);
      if (prev == null && curr == null) {
        expect((projects[i - 1].name || '').localeCompare(projects[i].name || '')).toBeLessThanOrEqual(0);
      } else if (prev != null && curr != null && prev !== curr) {
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    }
  });

  it('does not mutate the source array order via sort in place of the original', () => {
    const firstId = getPortfolio().projects[0].id;
    getProjects();
    expect(getPortfolio().projects[0].id).toBe(firstId);
  });
});

describe('getRecentProjects', () => {
  it('returns the newest projects first', () => {
    const all = getProjects();
    const recent = getRecentProjects(null, 3);
    expect(recent).toHaveLength(3);
    expect(recent.map((p) => p.id)).toEqual(all.slice(0, 3).map((p) => p.id));
  });

  it('prepends the active project when it is outside the recent window', () => {
    const all = getProjects();
    const active = all[all.length - 1];
    const recent = getRecentProjects(active.id, 3);
    expect(recent[0].id).toBe(active.id);
    expect(recent).toHaveLength(4);
  });
});

describe('getProjectById', () => {
  it('finds a known project', () => {
    const project = getProjectById('plugin-assist');
    expect(project).not.toBeNull();
    expect(project.name).toContain('Assist');
  });

  it('returns null for unknown ids', () => {
    expect(getProjectById('does-not-exist')).toBeNull();
  });
});

describe('projectImageIsLogo', () => {
  it('detects logo filenames', () => {
    expect(projectImageIsLogo({ featuredImage: 'img/plugins/assist/logo.png' })).toBe(true);
    expect(projectImageIsLogo({ featuredImage: 'img/plugins/assist/Logo.PNG' })).toBe(true);
  });

  it('returns false for screenshots and missing images', () => {
    expect(
      projectImageIsLogo({
        featuredImage: 'img/plugins/assist/Upsert_Assist_Chat_with_Alfred.png',
      })
    ).toBe(false);
    expect(projectImageIsLogo({})).toBe(false);
  });
});

describe('projectImagePath / projectLogoPath', () => {
  it('returns a public URL when featuredImage exists on disk', () => {
    const project = getProjectById('plugin-assist');
    expect(projectImagePath(project)).toBe(
      '/img/plugins/assist/Upsert_Assist_Chat_with_Alfred.png'
    );
  });

  it('returns null for missing featured image files', () => {
    expect(
      projectImagePath({
        featuredImage: 'img/plugins/does-not-exist/missing.png',
      })
    ).toBeNull();
  });

  it('returns logo path when present on disk', () => {
    const project = getProjectById('plugin-assist');
    expect(projectLogoPath(project)).toBe('/img/plugins/assist/logo.png');
  });

  it('returns null when no logo/image assets exist', () => {
    expect(
      projectLogoPath({
        logo: 'img/missing/logo.png',
        image: 'img/missing/image.png',
        featuredImage: 'img/missing/feature.png',
      })
    ).toBeNull();
  });
});
