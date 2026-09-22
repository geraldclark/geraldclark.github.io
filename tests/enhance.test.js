/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  activeNavSectionForScroll,
  initCloseTab,
  initMobileMenu,
  initProjectSearch,
  initTheme,
  orderedDashboardSections,
  projectItemMatches,
  reorderContentSections,
  sectionsForNavTab,
  setActiveNavSection,
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

describe('nav scroll spy', () => {
  it('picks the last region whose top is above the scroll probe', () => {
    const regions = [
      { sectionId: 'home', top: 0 },
      { sectionId: 'about', top: 800 },
      { sectionId: 'projects', top: 1600 },
    ];
    expect(activeNavSectionForScroll(regions, 0, 96)).toBe('home');
    expect(activeNavSectionForScroll(regions, 900, 96)).toBe('about');
    expect(activeNavSectionForScroll(regions, 2000, 96)).toBe('projects');
  });

  it('sets active class on matching nav links', () => {
    document.body.innerHTML = `
      <nav class="status-nav-tabs">
        <a class="nav-link" data-section="home"></a>
        <a class="nav-link active" data-section="about"></a>
      </nav>
    `;
    setActiveNavSection('home');
    expect(document.querySelector('[data-section="home"]').classList.contains('active')).toBe(true);
    expect(document.querySelector('[data-section="about"]').classList.contains('active')).toBe(false);
  });
});

describe('nav section ordering', () => {
  it('bundles hero and stats under home', () => {
    document.body.innerHTML = `
      <main class="dashboard">
        <section class="hero-section"></section>
        <section class="stats-grid"></section>
        <section id="about"></section>
        <section id="skills"></section>
      </main>
    `;
    const dashboard = document.querySelector('.dashboard');
    const homeBlocks = sectionsForNavTab('home', dashboard);
    expect(homeBlocks.map((el) => el.className || el.id)).toEqual(['hero-section', 'stats-grid']);
  });

  it('reorders dashboard sections to match tab order', () => {
    document.body.innerHTML = `
      <nav class="status-nav-tabs">
        <a class="nav-link" data-section="home"></a>
        <a class="nav-link" data-section="skills"></a>
        <a class="nav-link" data-section="about"></a>
      </nav>
      <main class="dashboard">
        <section class="hero-section"></section>
        <section class="stats-grid"></section>
        <section id="about"></section>
        <section id="skills"></section>
      </main>
    `;
    reorderContentSections();
    const ids = [...document.querySelector('.dashboard').children].map(
      (el) => el.id || el.className
    );
    expect(ids).toEqual(['hero-section', 'stats-grid', 'skills', 'about']);
  });

  it('orderedDashboardSections keeps stats immediately after hero', () => {
    document.body.innerHTML = `
      <main class="dashboard">
        <section class="hero-section"></section>
        <section class="stats-grid"></section>
        <section id="about"></section>
      </main>
    `;
    const ordered = orderedDashboardSections(['about', 'home'], document.querySelector('.dashboard'));
    expect(ordered.map((el) => el.id || el.className)).toEqual([
      'about',
      'hero-section',
      'stats-grid',
    ]);
  });
});

describe('initCloseTab', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <nav class="status-nav-tabs">
        <a class="nav-link active" data-section="about" href="/#about">
          <span class="nav-path">About.js</span>
          <button type="button" class="nav-close-btn" data-section="about">×</button>
        </a>
      </nav>
      <section id="about"></section>
      <div class="modal-overlay" id="close-tab-modal">
        <p id="close-tab-message"></p>
        <button id="close-tab-cancel-btn" type="button">Cancel</button>
        <button id="close-tab-confirm-btn" type="button">Close</button>
      </div>
    `;
    initCloseTab();
  });

  it('opens the modal when close is clicked without navigating', () => {
    const link = document.querySelector('.nav-link');
    const closeBtn = document.querySelector('.nav-close-btn');
    const modal = document.getElementById('close-tab-modal');
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    closeBtn.dispatchEvent(clickEvent);
    expect(modal.classList.contains('active')).toBe(true);
    expect(link.getAttribute('href')).toBe('/#about');
  });

  it('hides the section after confirm', () => {
    document.querySelector('.nav-close-btn').click();
    document.getElementById('close-tab-confirm-btn').click();
    expect(document.getElementById('about').style.display).toBe('none');
    expect(document.querySelector('.nav-link').style.display).toBe('none');
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
