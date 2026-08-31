import fs from 'node:fs';
import path from 'node:path';
import portfolio from '../data/portfolio.json';

// Prefer cwd so Vite/Astro bundling does not break import.meta.url resolution.
const publicDir = path.resolve(process.cwd(), 'public');

/**
 * @typedef {object} Project
 * @property {string} id
 * @property {string} name
 * @property {string} [status]
 * @property {string} [description]
 * @property {string} [shortDescription]
 * @property {string} [company]
 * @property {string[]} [tech]
 * @property {number|null} [start_year]
 * @property {number|null} [end_year]
 * @property {string} [image]
 * @property {string} [logo]
 * @property {string|null} [featuredImage]
 * @property {{label: string, url: string}[]} [urls]
 * @property {{label: string, value: string}[]} [metrics]
 */

/** @returns {typeof portfolio} */
export function getPortfolio() {
  return portfolio;
}

/** @param {Project} project */
export function projectYear(project) {
  return project.end_year != null ? project.end_year : project.start_year;
}

/** @param {Project} project */
export function projectPath(project) {
  return `/projects/${project.id}/`;
}

/** @param {Project} a @param {Project} b */
function compareProjects(a, b) {
  const aYear = projectYear(a);
  const bYear = projectYear(b);

  if (aYear == null && bYear != null) return 1;
  if (aYear != null && bYear == null) return -1;
  if (aYear == null && bYear == null) {
    return (a.name || '').localeCompare(b.name || '');
  }
  if (bYear !== aYear) return bYear - aYear;
  return (a.name || '').localeCompare(b.name || '');
}

/** @returns {Project[]} */
export function getProjects() {
  return [...(portfolio.projects || [])].sort(compareProjects);
}

/** Number of recent projects shown in project browser sidebars. */
export const RECENT_PROJECTS_LIMIT = 8;

/** Home page: initial rows on desktop (3 columns × 3 rows). */
export const HOME_PROJECTS_DESKTOP_INITIAL = 9;

/** Home page: max projects visible on mobile. */
export const HOME_PROJECTS_MOBILE_LIMIT = 3;

/**
 * Most recent projects (newest first). On a detail page, includes the active
 * project when it falls outside the recent window.
 * @param {string|null} [activeId]
 * @param {number} [limit]
 * @returns {Project[]}
 */
export function getRecentProjects(activeId = null, limit = RECENT_PROJECTS_LIMIT) {
  const sorted = getProjects();
  const recent = sorted.slice(0, limit);
  if (!activeId || recent.some((project) => project.id === activeId)) {
    return recent;
  }
  const active = getProjectById(activeId);
  return active ? [active, ...recent] : recent;
}

/** @param {string} id */
export function getProjectById(id) {
  return (portfolio.projects || []).find((project) => project.id === id) || null;
}

/** @param {Project} project */
export function projectSummary(project) {
  return project.shortDescription || project.description || '';
}

/** @param {string|null|undefined} src */
function toPublicUrl(src) {
  if (!src) return null;
  const relative = src.replace(/^\//, '');
  const diskPath = path.join(publicDir, relative);
  if (!fs.existsSync(diskPath)) return null;
  return `/${relative}`;
}

/**
 * Prefer a real featured screenshot for detail heroes.
 * Do not fall back to the site brand mark — that leaves a tiny logo in a huge frame.
 */
export function projectImagePath(project) {
  return (
    toPublicUrl(project.featuredImage) ||
    null
  );
}

/**
 * True when the hero asset is a product logo rather than a UI screenshot.
 * Used to size logo heroes smaller than full-width screenshots.
 */
export function projectImageIsLogo(project) {
  const featured = project.featuredImage || '';
  if (!featured) return false;
  const base = featured.split('/').pop() || '';
  return /^logo\./i.test(base) || /\/logo\./i.test(featured);
}

/** Logo-sized asset for cards and the project list. */
export function projectLogoPath(project) {
  return (
    toPublicUrl(project.logo) ||
    toPublicUrl(project.image) ||
    // Prefer a compact screenshot thumb over the site brand mark when needed.
    (project.featuredImage && !projectImageIsLogo(project)
      ? toPublicUrl(project.featuredImage)
      : null) ||
    null
  );
}
