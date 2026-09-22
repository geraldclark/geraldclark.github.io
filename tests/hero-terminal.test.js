import { describe, expect, it } from 'vitest';
import {
  applyHeroTerminalTabCompletion,
  buildHeroTerminalContext,
  getHelpLines,
  getWhoamiLines,
  heroTerminalCompletionMatches,
  heroTerminalInlineSuggestion,
  resolveProject,
  runHeroTerminalCommand,
} from '../src/lib/hero-terminal.js';

const fixture = buildHeroTerminalContext({
  about: {
    name: 'Gerald Clark',
    roles: ['CTO', 'Co-Founder', 'Consultant'],
    location: 'Pittsburgh, PA',
    passion: 'Building scalable solutions',
    skills: ['Design', 'Development'],
  },
  projects: [
    { id: 'plugin-assist', name: 'Upsert® Assist' },
    { id: 'plugin-engage', name: 'Upsert® Engage' },
  ],
  skills: [{ category: 'Languages', items: [{ name: 'PHP' }, { name: 'JavaScript' }] }],
  distinctions: [{ name: 'SugarCRM Certified', issuer: 'SugarCRM', year: 2012 }],
  contact: [{ label: 'GitHub', value: 'github.com/geraldclark' }],
});

describe('getWhoamiLines', () => {
  it('includes name, roles, and location', () => {
    expect(getWhoamiLines(fixture)).toEqual([
      'Gerald Clark',
      'CTO / Co-Founder',
      'Pittsburgh, PA',
    ]);
  });
});

describe('runHeroTerminalCommand', () => {
  it('lists help commands', () => {
    const result = runHeroTerminalCommand('help', fixture);
    expect(result.lines[0]).toBe('Commands');
    expect(result.lines.some((l) => l.startsWith('ls  '))).toBe(true);
    expect(result.lines.some((l) => l.startsWith('cd '))).toBe(true);
    getHelpLines()
      .filter((l) => l.includes('  '))
      .forEach((line) => {
        expect(line).toMatch(/^[^\s].{2,}  \S/);
      });
  });

  it('runs whoami', () => {
    const result = runHeroTerminalCommand('whoami', fixture);
    expect(result.lines[0]).toBe('Gerald Clark');
  });

  it('lists sections with context on ls', () => {
    const result = runHeroTerminalCommand('ls', fixture);
    expect(result.lines[0]).toBe('total 5');
    expect(result.lines.some((l) => l.includes('about') && l.includes('short version'))).toBe(true);
    expect(result.lines.some((l) => l.includes('projects') && l.includes('2 projects'))).toBe(
      true
    );
  });

  it('lists a single section on ls projects', () => {
    const result = runHeroTerminalCommand('ls projects', fixture);
    expect(result.lines.some((l) => l.includes('projects') && l.includes('2 projects'))).toBe(
      true
    );
  });

  it('scrolls on cd projects', () => {
    const result = runHeroTerminalCommand('cd projects', fixture);
    expect(result.action).toEqual({ type: 'scroll', sectionId: 'projects' });
  });

  it('maps filename to section on cd', () => {
    const result = runHeroTerminalCommand('cd skills.yml', fixture);
    expect(result.action).toEqual({ type: 'scroll', sectionId: 'skills' });
  });

  it('reports unknown commands', () => {
    const result = runHeroTerminalCommand('make me a sandwich', fixture);
    expect(result.lines[0]).toMatch(/command not found/);
  });

  it('cats a section by name', () => {
    const result = runHeroTerminalCommand('cat contact', fixture);
    expect(result.lines.some((l) => l.includes('GitHub'))).toBe(true);
  });

  it('cats every distinction from embedded data', () => {
    const distinctions = Array.from({ length: 7 }, (_, i) => ({
      name: `Cert ${i + 1}`,
      issuer: 'SugarCRM',
      year: 2010 + i,
    }));
    const ctx = { ...fixture, distinctions };
    const result = runHeroTerminalCommand('cat distinctions', ctx);
    expect(result.lines).toHaveLength(7);
    expect(result.lines[6]).toContain('Cert 7');
  });

  it('clears without extra output', () => {
    const result = runHeroTerminalCommand('clear', fixture);
    expect(result.clear).toBe(true);
    expect(result.lines).toEqual([]);
  });
});

describe('tab completion', () => {
  it('completes command names', () => {
    expect(heroTerminalCompletionMatches('c', fixture)).toEqual(
      expect.arrayContaining(['cat', 'cd', 'clear'])
    );
    expect(applyHeroTerminalTabCompletion('c', ['cat', 'cd']).listMatches).toEqual([
      'cat',
      'cd',
    ]);
    expect(applyHeroTerminalTabCompletion('ca', ['cat']).line).toBe('cat ');
  });

  it('completes section on cd', () => {
    expect(heroTerminalCompletionMatches('cd pro', fixture)).toEqual(['projects']);
    const { line } = applyHeroTerminalTabCompletion('cd pro', ['projects']);
    expect(line).toBe('cd projects ');
  });

  it('shows inline suffix while typing', () => {
    expect(heroTerminalInlineSuggestion('cd pro', fixture)).toEqual({
      suffix: 'jects',
      completion: 'projects',
    });
    expect(heroTerminalInlineSuggestion('cat ab', fixture)).toEqual({
      suffix: 'out',
      completion: 'about',
    });
    expect(heroTerminalInlineSuggestion('ls a', fixture)).toEqual({
      suffix: 'bout',
      completion: 'about',
    });
  });

  it('does not suggest after a complete ls argument', () => {
    expect(heroTerminalCompletionMatches('ls skills ', fixture)).toEqual([]);
    expect(heroTerminalCompletionMatches('ls skills home', fixture)).toEqual([]);
    expect(heroTerminalInlineSuggestion('ls skills ', fixture).suffix).toBeNull();
  });
});

describe('resolveProject', () => {
  it('matches id and partial name', () => {
    expect(resolveProject('plugin-assist', fixture.projects)?.id).toBe('plugin-assist');
    expect(resolveProject('assist', fixture.projects)?.id).toBe('plugin-assist');
  });
});
