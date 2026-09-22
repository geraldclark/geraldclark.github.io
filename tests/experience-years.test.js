import { describe, expect, it } from 'vitest';
import {
  experienceYearsFromSince,
  portfolioExperienceYears,
} from '../src/lib/experience-years.js';

describe('experienceYearsFromSince', () => {
  it('computes span through the given calendar year', () => {
    expect(experienceYearsFromSince(2011, new Date('2026-06-01'))).toEqual({
      since: 2011,
      span: 15,
    });
  });

  it('returns null for invalid since year', () => {
    expect(experienceYearsFromSince(NaN)).toBeNull();
  });
});

describe('portfolioExperienceYears', () => {
  it('prefers about.crm_since over project start years', () => {
    const projects = [{ id: 'a', start_year: 2011 }];
    expect(portfolioExperienceYears({ crm_since: 2008 }, projects, new Date('2026-06-01'))).toEqual({
      since: 2008,
      span: 18,
    });
  });

  it('falls back to earliest start_year among projects', () => {
    const projects = [
      { id: 'a', start_year: 2011 },
      { id: 'b', start_year: 2020 },
    ];
    expect(portfolioExperienceYears({}, projects, new Date('2026-06-01'))).toEqual({
      since: 2011,
      span: 15,
    });
  });

  it('returns null when no crm_since and no project years', () => {
    expect(portfolioExperienceYears({}, [{ id: 'a' }, { id: 'b', start_year: null }])).toBeNull();
  });
});
