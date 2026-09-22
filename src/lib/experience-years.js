/**
 * Pure CRM experience helpers (safe for browser + Node).
 */

/**
 * @param {number} since
 * @param {Date} [now]
 * @returns {{ since: number, span: number } | null}
 */
export function experienceYearsFromSince(since, now = new Date()) {
  if (typeof since !== 'number' || !Number.isFinite(since)) return null;
  const through = now.getFullYear();
  return { since, span: Math.max(1, through - since) };
}

/**
 * @param {{ crm_since?: number | null } | null | undefined} about
 * @param {{ start_year?: number | null }[]} projects
 * @returns {number | null}
 */
export function crmExperienceSinceYear(about, projects) {
  if (typeof about?.crm_since === 'number') return about.crm_since;
  const starts = projects.map((p) => p.start_year).filter((y) => typeof y === 'number');
  if (starts.length === 0) return null;
  return Math.min(...starts);
}

/**
 * @param {{ crm_since?: number | null } | null | undefined} about
 * @param {{ start_year?: number | null }[]} projects
 * @param {Date} [now]
 * @returns {{ since: number, span: number } | null}
 */
export function portfolioExperienceYears(about, projects, now = new Date()) {
  const since = crmExperienceSinceYear(about, projects);
  if (since == null) return null;
  return experienceYearsFromSince(since, now);
}
