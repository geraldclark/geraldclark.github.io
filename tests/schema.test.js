import { describe, expect, it } from 'vitest';
import {
  breadcrumbSchema,
  personSchema,
  projectListSchema,
  projectSchema,
  websiteSchema,
} from '../src/lib/schema.js';

describe('personSchema', () => {
  it('describes Gerald Clark as a Person', () => {
    const schema = personSchema();
    expect(schema['@type']).toBe('Person');
    expect(schema.name).toBe('Gerald Clark');
    expect(schema.url).toBe('https://gerald-clark.com');
    expect(schema.sameAs).toContain('https://github.com/geraldclark');
  });
});

describe('websiteSchema', () => {
  it('describes the portfolio WebSite', () => {
    const schema = websiteSchema();
    expect(schema['@type']).toBe('WebSite');
    expect(schema.url).toBe('https://gerald-clark.com');
    expect(schema.description).toMatch(/Gerald Clark/);
  });
});

describe('projectListSchema', () => {
  it('builds ItemList entries with 1-based positions and trailing-slash URLs', () => {
    const schema = projectListSchema([
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'Beta' },
    ]);
    expect(schema['@type']).toBe('ItemList');
    expect(schema.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        url: 'https://gerald-clark.com/projects/a/',
        name: 'Alpha',
      },
      {
        '@type': 'ListItem',
        position: 2,
        url: 'https://gerald-clark.com/projects/b/',
        name: 'Beta',
      },
    ]);
  });
});

describe('projectSchema', () => {
  it('marks Upsert plugins as SoftwareApplication', () => {
    const schema = projectSchema(
      {
        id: 'plugin-assist',
        name: 'Assist',
        company: 'Upsert, LLC',
        shortDescription: 'AI in CRM',
        featuredImage: '/img/plugins/assist/logo.png',
        start_year: 2026,
      },
      'https://gerald-clark.com/projects/plugin-assist/'
    );

    expect(schema['@type']).toBe('SoftwareApplication');
    expect(schema.applicationCategory).toBe('BusinessApplication');
    expect(schema.operatingSystem).toBe('Web');
    expect(schema.dateCreated).toBe('2026');
    expect(schema.image).toBe('https://gerald-clark.com/img/plugins/assist/logo.png');
    expect(schema.creator).toEqual({
      '@type': 'Organization',
      name: 'Upsert, LLC',
    });
  });

  it('marks non-plugin work as CreativeWork', () => {
    const schema = projectSchema(
      {
        id: 'employer-work',
        name: 'Legacy CRM',
        company: 'Example Co',
        description: 'Consulting',
      },
      'https://gerald-clark.com/projects/employer-work/'
    );

    expect(schema['@type']).toBe('CreativeWork');
    expect(schema.applicationCategory).toBeUndefined();
    expect(schema.description).toBe('Consulting');
  });
});

describe('breadcrumbSchema', () => {
  it('assigns sequential positions', () => {
    const schema = breadcrumbSchema([
      { name: 'Home', url: 'https://gerald-clark.com/' },
      { name: 'Projects', url: 'https://gerald-clark.com/projects/' },
    ]);
    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement.map((item) => item.position)).toEqual([1, 2]);
    expect(schema.itemListElement[1].name).toBe('Projects');
  });
});
