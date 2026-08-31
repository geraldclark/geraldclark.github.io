/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  initMobileMenu,
  initProjectSearch,
  initTheme,
  projectItemMatches,
  updateClock,
} from '../src/scripts/enhance-core.js';

afterEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-theme');
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('projectItemMatches', () => {
  it('matches empty term against anything', () => {
    expect(projectItemMatches('', 'Assist', 'Upsert')).toBe(true);
    expect(projectItemMatches('   ', 'Assist', 'Upsert')).toBe(true);
  });

  it('matches name or company case-insensitively', () => {
    expect(projectItemMatches('assist', 'Upsert Assist', 'Upsert, LLC')).toBe(true);
    expect(projectItemMatches('upsert', 'Engage', 'Upsert, LLC')).toBe(true);
    expect(projectItemMatches('zoom', 'Engage', 'Upsert, LLC')).toBe(false);
  });
});

describe('updateClock', () => {
  it('writes a time string into #current-time', () => {
    document.body.innerHTML = '<span id="current-time"></span>';
    updateClock();
    expect(document.getElementById('current-time').textContent).toMatch(/\d/);
  });

  it('no-ops when the clock element is missing', () => {
    expect(() => updateClock()).not.toThrow();
  });
});

describe('initTheme', () => {
  beforeEach(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.innerHTML = `
      <button id="theme-toggle" type="button">
        <i id="theme-icon" class="fas fa-moon"></i>
      </button>
    `;
  });

  it('applies a stored theme and syncs the icon', () => {
    localStorage.setItem('theme', 'dark');
    initTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.getElementById('theme-icon').className).toBe('fas fa-sun');
  });

  it('toggles theme on click and persists to localStorage', () => {
    initTheme();
    document.getElementById('theme-toggle').click();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.getElementById('theme-icon').className).toBe('fas fa-sun');

    document.getElementById('theme-toggle').click();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.getElementById('theme-icon').className).toBe('fas fa-moon');
  });
});

describe('initMobileMenu', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="mobile-menu-toggle" type="button">Menu</button>
      <div id="mobile-menu-overlay" hidden>
        <div id="mobile-menu">
          <button id="mobile-menu-close" type="button">Close</button>
          <a href="/projects/">Projects</a>
        </div>
      </div>
    `;
    initMobileMenu();
  });

  it('opens the menu with .active and aria-expanded', () => {
    const overlay = document.getElementById('mobile-menu-overlay');
    const toggle = document.getElementById('mobile-menu-toggle');

    toggle.click();
    expect(overlay.hidden).toBe(false);
    expect(overlay.classList.contains('active')).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('closes via the close button', () => {
    const overlay = document.getElementById('mobile-menu-overlay');
    document.getElementById('mobile-menu-toggle').click();
    document.getElementById('mobile-menu-close').click();

    expect(overlay.hidden).toBe(true);
    expect(overlay.classList.contains('active')).toBe(false);
    expect(document.getElementById('mobile-menu-toggle').getAttribute('aria-expanded')).toBe(
      'false'
    );
  });

  it('closes on Escape and overlay backdrop click', () => {
    const overlay = document.getElementById('mobile-menu-overlay');
    document.getElementById('mobile-menu-toggle').click();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(overlay.classList.contains('active')).toBe(false);

    document.getElementById('mobile-menu-toggle').click();
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay.classList.contains('active')).toBe(false);
  });

  it('closes when a nav link is clicked', () => {
    const overlay = document.getElementById('mobile-menu-overlay');
    document.getElementById('mobile-menu-toggle').click();
    overlay.querySelector('a').click();
    expect(overlay.classList.contains('active')).toBe(false);
  });
});

describe('initProjectSearch', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input data-project-search type="search" />
      <ul data-project-list>
        <li data-project-item data-project-name="Assist" data-project-company="Upsert, LLC">Assist</li>
        <li data-project-item data-project-name="Engage" data-project-company="Upsert, LLC">Engage</li>
        <li data-project-item data-project-name="Legacy Portal" data-project-company="Acme">Portal</li>
      </ul>
    `;
    initProjectSearch();
  });

  it('hides items that do not match the query', () => {
    const input = document.querySelector('[data-project-search]');
    const items = document.querySelectorAll('[data-project-item]');

    input.value = 'assist';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(items[0].hidden).toBe(false);
    expect(items[1].hidden).toBe(true);
    expect(items[2].hidden).toBe(true);
  });

  it('matches company names and restores all when cleared', () => {
    const input = document.querySelector('[data-project-search]');
    const items = document.querySelectorAll('[data-project-item]');

    input.value = 'acme';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(items[0].hidden).toBe(true);
    expect(items[2].hidden).toBe(false);

    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect([...items].every((item) => !item.hidden)).toBe(true);
  });
});

describe('initHomeProjectsGrid', () => {
  it('expands the home grid when View more is clicked', async () => {
    const { initHomeProjectsGrid } = await import('../src/scripts/enhance-core.js');
    document.body.innerHTML = `
      <div class="home-projects-grid" data-home-projects-grid>
        <article class="project-card">One</article>
      </div>
      <button type="button" data-home-projects-expand>View more</button>
    `;
    initHomeProjectsGrid();

    const grid = document.querySelector('[data-home-projects-grid]');
    const button = document.querySelector('[data-home-projects-expand]');
    button.click();

    expect(grid.hasAttribute('data-expanded')).toBe(true);
    expect(button.hidden).toBe(true);
  });
});
