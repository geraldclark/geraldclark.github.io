/**
 * Progressive enhancement helpers. Side-effect-free for unit tests.
 * Browser entry: enhance.js imports and calls bootEnhance().
 */

export function updateClock() {
  const el = document.getElementById('current-time');
  if (!el) return;
  el.textContent = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function initTheme() {
  const root = document.documentElement;
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') {
    root.setAttribute('data-theme', stored);
  }

  const toggle = document.getElementById('theme-toggle');
  const icon = document.getElementById('theme-icon');
  if (!toggle) return;

  const syncIcon = () => {
    const theme = root.getAttribute('data-theme') || 'light';
    if (icon) {
      icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
  };

  syncIcon();
  toggle.addEventListener('click', () => {
    const next = (root.getAttribute('data-theme') || 'light') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    syncIcon();
  });
}

export function initMobileMenu() {
  const overlay = document.getElementById('mobile-menu-overlay');
  const openBtn = document.getElementById('mobile-menu-toggle');
  const closeBtn = document.getElementById('mobile-menu-close');
  if (!overlay || !openBtn) return;

  const open = () => {
    overlay.hidden = false;
    // CSS shows the drawer via .active (display/opacity/slide)
    overlay.classList.add('active');
    openBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    overlay.classList.remove('active');
    overlay.hidden = true;
    openBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  openBtn.setAttribute('aria-expanded', 'false');
  openBtn.setAttribute('aria-controls', 'mobile-menu');
  openBtn.addEventListener('click', () => {
    if (overlay.classList.contains('active')) close();
    else open();
  });
  closeBtn?.addEventListener('click', close);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', close);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay.classList.contains('active')) close();
  });
}

/** @param {string} term @param {string} name @param {string} company */
export function projectItemMatches(term, name, company) {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  return name.toLowerCase().includes(q) || company.toLowerCase().includes(q);
}

export function initProjectSearch() {
  const input = document.querySelector('[data-project-search]');
  const list = document.querySelector('[data-project-list]');
  if (!input || !list) return;

  const items = Array.from(list.querySelectorAll('[data-project-item]'));

  input.addEventListener('input', () => {
    const term = input.value;
    items.forEach((item) => {
      const name = item.getAttribute('data-project-name') || '';
      const company = item.getAttribute('data-project-company') || '';
      item.hidden = !projectItemMatches(term, name, company);
    });
  });

  const active = list.querySelector('.logs-project-item.active');
  if (active && typeof active.scrollIntoView === 'function') {
    active.scrollIntoView({ block: 'nearest' });
  }
}

export function initHomeProjectsGrid() {
  const grid = document.querySelector('[data-home-projects-grid]');
  const expandBtn = document.querySelector('[data-home-projects-expand]');
  if (!grid || !expandBtn) return;

  expandBtn.addEventListener('click', () => {
    grid.setAttribute('data-expanded', '');
    expandBtn.hidden = true;
  });
}

export function bootEnhance() {
  updateClock();
  setInterval(updateClock, 1000);
  initTheme();
  initMobileMenu();
  initProjectSearch();
  initHomeProjectsGrid();
}
