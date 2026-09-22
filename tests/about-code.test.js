import { describe, expect, it } from 'vitest';
import { buildAboutCodeLines, escapeHtml } from '../src/lib/about-code.js';

describe('about-code', () => {
  it('escapes HTML in about strings', () => {
    expect(escapeHtml('<script>"')).toBe('&lt;script&gt;&quot;');
  });

  it('builds syntax-highlighted lines with fold targets', () => {
    const lines = buildAboutCodeLines({
      name: 'Gerald Clark',
      roles: ['CTO'],
      location: 'Pittsburgh, PA',
      skills: ['Design'],
      passion: 'Building scalable solutions',
    });

    expect(lines[0].html).toContain('code-comment');
    expect(lines[1].html).toContain('code-keyword');
    expect(lines[1].isFoldable).toBe(true);
    expect(lines[1].foldTarget).toBe('object-content');
    expect(lines.some((line) => line.html.includes('code-string') && line.html.includes('CTO'))).toBe(
      true
    );
    expect(lines[lines.length - 1].html).toBe('};');
  });
});
