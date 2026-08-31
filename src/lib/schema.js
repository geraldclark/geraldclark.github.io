const SITE = 'https://gerald-clark.com';

export function personSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Gerald Clark',
    jobTitle: 'CTO / Co-Founder',
    url: SITE,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Pittsburgh',
      addressRegion: 'PA',
      addressCountry: 'US',
    },
    sameAs: [
      'https://github.com/geraldclark',
      'https://linkedin.com/in/geraldclark',
    ],
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Gerald Clark',
    url: SITE,
    description:
      'Portfolio of Gerald Clark, CTO and Co-Founder at Upsert. SugarAI plugins, architecture, and consulting work.',
  };
}

/** @param {import('./portfolio.js').Project[]} projects */
export function projectListSchema(projects) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Projects',
    itemListElement: projects.map((project, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: new URL(`/projects/${project.id}/`, SITE).href,
      name: project.name,
    })),
  };
}

/** @param {import('./portfolio.js').Project} project @param {string} pageUrl */
export function projectSchema(project, pageUrl) {
  const image = project.featuredImage || project.logo || project.image;
  const isSoftware =
    project.company === 'Upsert, LLC' ||
    (project.id || '').startsWith('plugin-');

  const base = {
    '@context': 'https://schema.org',
    '@type': isSoftware ? 'SoftwareApplication' : 'CreativeWork',
    name: project.name,
    description: project.shortDescription || project.description || '',
    url: pageUrl,
    author: {
      '@type': 'Person',
      name: 'Gerald Clark',
    },
  };

  if (project.company) {
    base.creator = {
      '@type': 'Organization',
      name: project.company,
    };
  }

  if (image) {
    base.image = new URL(image.startsWith('/') ? image : `/${image}`, SITE).href;
  }

  if (isSoftware) {
    base.applicationCategory = 'BusinessApplication';
    base.operatingSystem = 'Web';
  }

  if (project.start_year) {
    base.dateCreated = String(project.start_year);
  }

  return base;
}

export function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
