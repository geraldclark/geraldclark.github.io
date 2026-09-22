/**
 * Progressive enhancement helpers. Side-effect-free for unit tests.
 * Browser entry: enhance.js imports and calls bootEnhance().
 */

import { experienceYearsFromSince } from '../lib/experience-years.js';
import { initHeroTerminal } from './hero-terminal-ui.js';

const NAV_ORDER_KEY = 'nav-order';
/** Matches `.dashboard { padding-top: 110px }` when status bar is not measured. */
export const DEFAULT_NAV_SCROLL_OFFSET = 110;
const DESKTOP_MIN_WIDTH = 768;

export const navScrollState = {
  skipActiveUpdate: false,
  pauseTimer: 0,
  /** @type {string | null} */
  pinnedSectionId: null,
};

/** @param {Document} doc */
export function getNavScrollOffset(doc = document) {
  const bar = doc.querySelector('.status-bar');
  if (bar instanceof HTMLElement) {
    const height = bar.getBoundingClientRect().height;
    if (height > 0) return Math.ceil(height) + 8;
  }
  return DEFAULT_NAV_SCROLL_OFFSET;
}

/** @param {Document} doc @param {Window} win */
export function getNavScrollRegions(doc = document, win = window) {
  const navLinks = Array.from(doc.querySelectorAll('.status-nav-tabs .nav-link')).filter(
    (link) => link.style.display !== 'none'
  );

  /** @type {{ sectionId: string, top: number }[]} */
  const regions = [];
  const docTop = (/** @type {Element} */ el) => el.getBoundingClientRect().top + win.pageYOffset;

  navLinks.forEach((link) => {
    const sectionId = link.getAttribute('data-section');
    if (!sectionId) return;

    if (sectionId === 'home') {
      const hero = doc.querySelector('.hero-section');
      const stats = doc.querySelector('.stats-grid');
      const blocks = [hero, stats].filter(
        (el) => el instanceof HTMLElement && el.style.display !== 'none'
      );
      if (blocks.length > 0) regions.push({ sectionId, top: docTop(blocks[0]) });
      return;
    }

    const section = doc.getElementById(sectionId);
    if (section instanceof HTMLElement && section.style.display !== 'none') {
      regions.push({ sectionId, top: docTop(section) });
    }
  });

  return regions;
}

/**
 * @param {{ sectionId: string, top: number }[]} regions
 * @param {number} scrollY
 * @param {number} [offset]
 */
export function activeNavSectionForScroll(
  regions,
  scrollY,
  offset = DEFAULT_NAV_SCROLL_OFFSET
) {
  if (regions.length === 0) return null;
  const sorted = [...regions].sort((a, b) => a.top - b.top);
  const probe = scrollY + offset;
  let active = sorted[0].sectionId;
  sorted.forEach((region) => {
    if (probe >= region.top - 2) active = region.sectionId;
  });
  return active;
}

/** @param {string} sectionId @param {Document} doc @returns {HTMLElement[]} */
export function getSectionBlocks(sectionId, doc = document) {
  if (sectionId === 'home') {
    return [doc.querySelector('.hero-section'), doc.querySelector('.stats-grid')].filter(
      (el) => el instanceof HTMLElement && el.style.display !== 'none'
    );
  }
  const section = doc.getElementById(sectionId);
  return section instanceof HTMLElement && section.style.display !== 'none' ? [section] : [];
}

/** @param {string} sectionId @param {Document} doc */
export function getSectionViewportTop(sectionId, doc = document) {
  const blocks = getSectionBlocks(sectionId, doc);
  if (blocks.length === 0) return null;
  return Math.min(...blocks.map((el) => el.getBoundingClientRect().top));
}

/**
 * Which nav section is active based on what has crossed the fixed header line.
 *
 * @param {Document} doc
 * @param {Window} win
 * @param {number} [offset]
 */
export function activeNavSectionFromViewport(
  doc = document,
  win = window,
  offset = DEFAULT_NAV_SCROLL_OFFSET
) {
  const navLinks = Array.from(doc.querySelectorAll('.status-nav-tabs .nav-link')).filter(
    (link) => link.style.display !== 'none'
  );
  /** Slack so smooth-scroll landing (section top slightly below the bar) still selects the right tab. */
  const probe = offset + 40;

  /** @type {{ sectionId: string, docTop: number, viewportTop: number }[]} */
  const candidates = [];

  navLinks.forEach((link) => {
    const sectionId = link.getAttribute('data-section');
    if (!sectionId) return;
    const blocks = getSectionBlocks(sectionId, doc);
    if (blocks.length === 0) return;
    const viewportTop = Math.min(...blocks.map((el) => el.getBoundingClientRect().top));
    const docTop = Math.min(
      ...blocks.map((el) => el.getBoundingClientRect().top + win.pageYOffset)
    );
    candidates.push({ sectionId, docTop, viewportTop });
  });

  if (candidates.length === 0) return null;

  const reached = candidates.filter((c) => c.viewportTop <= probe);
  if (reached.length > 0) {
    reached.sort((a, b) => b.docTop - a.docTop);
    return reached[0].sectionId;
  }

  if (win.pageYOffset < offset * 0.5) {
    return candidates.find((c) => c.sectionId === 'home')?.sectionId ?? candidates[0].sectionId;
  }

  candidates.sort((a, b) => a.docTop - b.docTop);
  for (let i = candidates.length - 1; i >= 0; i -= 1) {
    if (candidates[i].docTop <= win.pageYOffset + probe) {
      return candidates[i].sectionId;
    }
  }
  return candidates[0].sectionId;
}

/** @param {string} sectionId @param {Document} doc */
export function setActiveNavSection(sectionId, doc = document) {
  doc.querySelectorAll('.status-nav-tabs .nav-link').forEach((link) => {
    link.classList.toggle('active', link.getAttribute('data-section') === sectionId);
  });
  doc.querySelectorAll('.mobile-menu-item').forEach((item) => {
    item.classList.toggle('active', item.getAttribute('data-section') === sectionId);
  });
}

/**
 * Keep the requested tab active until its section reaches the header probe (or timeout).
 *
 * @param {string | null} sectionId
 * @param {Document} doc
 * @param {Window} win
 * @param {number} [maxMs]
 */
export function pinNavSection(
  sectionId,
  doc = document,
  win = window,
  maxMs = 4000
) {
  if (!sectionId) return;

  navScrollState.pinnedSectionId = sectionId;
  navScrollState.skipActiveUpdate = false;
  setActiveNavSection(sectionId, doc);

  if (navScrollState.pauseTimer) {
    win.clearTimeout(navScrollState.pauseTimer);
  }
  navScrollState.pauseTimer = win.setTimeout(() => {
    navScrollState.pinnedSectionId = null;
    navScrollState.pauseTimer = 0;
    updateActiveNav(doc, win);
  }, maxMs);
}

/** @deprecated Use pinNavSection */
export function pauseNavScrollUpdates(ms = 4000, pinnedSectionId = null, doc = document) {
  pinNavSection(pinnedSectionId, doc, window, ms);
}

/** @param {Document} doc @param {Window} win */
export function updateActiveNav(doc = document, win = window) {
  const offset = getNavScrollOffset(doc);

  if (navScrollState.pinnedSectionId) {
    const pinned = navScrollState.pinnedSectionId;
    const detected = activeNavSectionFromViewport(doc, win, offset);
    if (detected === pinned) {
      navScrollState.pinnedSectionId = null;
      if (navScrollState.pauseTimer) {
        win.clearTimeout(navScrollState.pauseTimer);
        navScrollState.pauseTimer = 0;
      }
    } else {
      setActiveNavSection(pinned, doc);
      return;
    }
  }

  if (navScrollState.skipActiveUpdate) return;

  const sectionId = activeNavSectionFromViewport(doc, win, offset);
  if (sectionId) setActiveNavSection(sectionId, doc);
}

/** @param {Document} doc @param {Window} win */
export function initNavScrollSpy(doc = document, win = window) {
  if (!doc.querySelector('.dashboard')) return;

  const onScroll = () => {
    if (navScrollState.skipActiveUpdate) return;
    updateActiveNav(doc, win);
  };

  win.addEventListener('scroll', onScroll, { passive: true });
  win.addEventListener('resize', onScroll, { passive: true });
  updateActiveNav(doc, win);
}

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

/** @param {Document} doc */
export function syncMobileMenuNav(doc = document) {
  const menuNav = doc.getElementById('mobile-menu-nav');
  const navTabs = doc.querySelector('.status-nav-tabs');
  if (!menuNav || !navTabs) return;

  menuNav.innerHTML = '';
  navTabs.querySelectorAll('.nav-link').forEach((link) => {
    if (link.style.display === 'none') return;

    const sectionId = link.getAttribute('data-section') || '';
    const iconEl = link.querySelector('.nav-file-icon');
    const labelEl = link.querySelector('.nav-path');
    const icon = iconEl?.className || 'fas fa-circle';
    const label = labelEl?.textContent || sectionId;

    const item = doc.createElement('a');
    item.className = 'mobile-menu-item';
    item.setAttribute('data-section', sectionId);
    item.href = link.getAttribute('href') || `#${sectionId}`;
    item.innerHTML = `<i class="${icon}" aria-hidden="true"></i><span>${label}</span>`;
    menuNav.appendChild(item);
  });
}

export function initMobileMenu() {
  const overlay = document.getElementById('mobile-menu-overlay');
  const openBtn = document.getElementById('mobile-menu-toggle');
  const closeBtn = document.getElementById('mobile-menu-close');
  if (!overlay || !openBtn) return;

  const open = () => {
    syncMobileMenuNav();
    overlay.hidden = false;
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
  overlay.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link || !overlay.contains(link)) return;

    if (link.classList.contains('mobile-menu-item')) {
      const href = link.getAttribute('href') || '';
      const hashMatch = href.match(/^\/#(.+)$/);
      const sectionId = link.getAttribute('data-section') || hashMatch?.[1] || '';

      if (hashMatch && document.getElementById(hashMatch[1])) {
        event.preventDefault();
        setActiveNavSection(hashMatch[1], document);
        scrollToNavSection(hashMatch[1], document);
        pinNavSection(hashMatch[1], document);
      } else if (href === '/' || href === '') {
        event.preventDefault();
        setActiveNavSection('home', document);
        scrollToNavSection('home', document);
        pinNavSection('home', document);
      } else if (sectionId) {
        setActiveNavSection(sectionId, document);
        pinNavSection(sectionId, document);
      }
    }

    close();
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

/** @param {Document} doc */
/** @param {Document} doc @param {Date} [now] */
export function initCrmExperienceStat(doc = document, now = new Date()) {
  const valueEl = doc.getElementById('crm-experience-value');
  if (!valueEl) return;

  const since = Number(valueEl.getAttribute('data-crm-experience-since'));
  const computed = experienceYearsFromSince(since, now);
  if (!computed) return;

  valueEl.textContent = `${computed.span}+`;
}

export function initProjectImageLightbox(doc = document) {
  const triggers = doc.querySelectorAll('[data-project-image-lightbox]');
  const overlay = doc.getElementById('project-image-lightbox');
  const img = doc.getElementById('project-image-lightbox-img');
  const closeBtn = doc.getElementById('project-image-lightbox-close');
  if (!overlay || !img || triggers.length === 0) return;

  const open = (src, alt) => {
    img.src = src;
    img.alt = alt;
    overlay.hidden = false;
    overlay.classList.add('active');
    doc.body.style.overflow = 'hidden';
  };

  const close = () => {
    overlay.classList.remove('active');
    overlay.hidden = true;
    doc.body.style.overflow = '';
    img.removeAttribute('src');
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const src =
        trigger.getAttribute('data-full-src') ||
        trigger.querySelector('img')?.getAttribute('src') ||
        '';
      const alt = trigger.querySelector('img')?.getAttribute('alt') || 'Project preview';
      if (src) open(src, alt);
    });
  });

  closeBtn?.addEventListener('click', close);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });
  doc.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay.classList.contains('active')) close();
  });
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

/** @param {string} foldTarget @param {Document} doc */
export function toggleCodeFold(foldTarget, doc = document) {
  const indicator = doc.querySelector(`.fold-indicator[data-fold-target="${foldTarget}"]`);
  if (!indicator) return;
  indicator.classList.toggle('collapsed');
  updateCodeFoldVisibility(doc);
}

/** @param {Document} doc */
export function updateCodeFoldVisibility(doc = document) {
  doc.querySelectorAll('.code-foldable').forEach((line) => {
    const foldIds = (line.getAttribute('data-fold-id') || '')
      .split(' ')
      .filter((id) => id.trim());
    const lineFoldIndicator = line.querySelector('.fold-indicator[data-fold-target]');
    const lineFoldTarget = lineFoldIndicator?.getAttribute('data-fold-target');

    let shouldShow = true;
    foldIds.forEach((id) => {
      const indicator = doc.querySelector(`.fold-indicator[data-fold-target="${id}"]`);
      if (indicator?.classList.contains('collapsed') && lineFoldTarget !== id) {
        shouldShow = false;
      }
    });

    line.classList.toggle('folded', !shouldShow);
  });
}

/** @param {Document} doc */
export function initCodeFolds(doc = document) {
  doc.querySelectorAll('.fold-indicator.foldable').forEach((indicator) => {
    if (indicator.dataset.listenerAdded === 'true') return;
    indicator.dataset.listenerAdded = 'true';
    indicator.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const foldTarget = indicator.getAttribute('data-fold-target');
      if (foldTarget) toggleCodeFold(foldTarget, doc);
    });
  });
}

/**
 * @param {HTMLElement} container
 * @param {number} x
 */
export function getDragAfterElement(container, x) {
  const draggableElements = [...container.querySelectorAll('.nav-link:not(.dragging)')];
  if (draggableElements.length === 0) return null;

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const middle = box.left + box.width / 2;
      const offset = x - middle;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  ).element;
}

/**
 * @param {string} sectionId
 * @param {ParentNode} dashboard
 * @returns {HTMLElement[]}
 */
export function sectionsForNavTab(sectionId, dashboard) {
  if (sectionId === 'home') {
    const hero = dashboard.querySelector('.hero-section');
    const stats = dashboard.querySelector('.stats-grid');
    /** @type {HTMLElement[]} */
    const blocks = [];
    if (hero instanceof HTMLElement) blocks.push(hero);
    if (stats instanceof HTMLElement) blocks.push(stats);
    return blocks;
  }
  const section = dashboard.querySelector(`#${sectionId}`);
  return section instanceof HTMLElement ? [section] : [];
}

/**
 * @param {string[]} sectionIds in nav tab order
 * @param {ParentNode} dashboard
 * @returns {HTMLElement[]}
 */
export function orderedDashboardSections(sectionIds, dashboard) {
  /** @type {HTMLElement[]} */
  const ordered = [];
  sectionIds.forEach((id) => {
    sectionsForNavTab(id, dashboard).forEach((el) => {
      if (!ordered.includes(el)) ordered.push(el);
    });
  });
  return ordered;
}

/** @param {Document} doc */
export function reorderContentSections(doc = document) {
  const navTabs = doc.querySelector('.status-nav-tabs');
  const dashboard = doc.querySelector('.dashboard');
  if (!navTabs || !dashboard) return false;

  const navLinks = Array.from(navTabs.querySelectorAll('.nav-link'));
  const sectionIds = navLinks.map((link) => link.getAttribute('data-section')).filter(Boolean);
  const orderedSections = orderedDashboardSections(sectionIds, dashboard);
  if (orderedSections.length === 0) return false;

  const allChildren = Array.from(dashboard.children);
  let orderChanged = false;
  for (let i = 0; i < orderedSections.length; i++) {
    if (allChildren[i] !== orderedSections[i]) {
      orderChanged = true;
      break;
    }
  }
  if (!orderChanged) return false;

  orderedSections.forEach((section) => {
    if (section.parentNode === dashboard) {
      dashboard.removeChild(section);
    }
  });
  orderedSections.forEach((section) => {
    dashboard.appendChild(section);
  });
  return true;
}

/**
 * @param {string} sectionId
 * @param {Document} doc
 * @param {Window} win
 */
export function scrollToNavSection(sectionId, doc = document, win = window) {
  const offset = getNavScrollOffset(doc);
  const blocks = getSectionBlocks(sectionId, doc);
  const target = blocks[0];

  if (!target) {
    if (sectionId === 'home') {
      win.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return;
  }

  const targetPosition = target.getBoundingClientRect().top + win.pageYOffset - offset;
  win.scrollTo({ top: Math.max(0, targetPosition), behavior: 'smooth' });
}

/** @param {Document} doc */
function initNavLinkClicks(doc) {
  const dashboard = doc.querySelector('.dashboard');
  if (!dashboard) return;

  doc.querySelectorAll('.status-nav-tabs .nav-link').forEach((link) => {
    link.addEventListener('click', function onNavClick(e) {
      if (this.wasDragging || this.classList.contains('dragging')) {
        this.wasDragging = false;
        return;
      }
      if (e.target.closest('.nav-close-btn')) return;

      const href = this.getAttribute('href') || '';
      const sectionId = this.getAttribute('data-section') || '';
      const isHomeHash = href === '/' || href === '';
      const hashMatch = href.match(/^\/#(.+)$/);
      const inPageHash = hashMatch && doc.getElementById(hashMatch[1]);

      if (!isHomeHash && !inPageHash) return;

      e.preventDefault();
      if (isHomeHash || sectionId === 'home') {
        setActiveNavSection('home', doc);
        scrollToNavSection('home', doc);
        pinNavSection('home', doc);
        return;
      }
      if (inPageHash) {
        const targetId = sectionId || hashMatch[1];
        setActiveNavSection(targetId, doc);
        scrollToNavSection(targetId, doc);
        pinNavSection(targetId, doc);
      }
    });
  });
}

/** @param {Document} doc */
function initNavDragAndDrop(doc) {
  const navTabs = doc.querySelector('.status-nav-tabs');
  if (!navTabs) return;

  const navLinks = Array.from(navTabs.querySelectorAll('.nav-link'));
  if (navLinks.length === 0) return;

  let draggedElement = null;
  const dropIndicator = doc.createElement('div');
  dropIndicator.className = 'nav-drop-indicator';
  dropIndicator.style.cssText =
    'position: absolute; height: 30px; width: 3px; background: var(--accent-orange); pointer-events: none; z-index: 1001; display: none;';
  doc.body.appendChild(dropIndicator);

  navTabs.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const dragging = doc.querySelector('.nav-link.dragging');
    if (!dragging) return;

    navTabs.querySelectorAll('.nav-link').forEach((navLink) => {
      navLink.classList.remove('drag-over', 'drag-before', 'drag-after');
    });

    const afterElement = getDragAfterElement(navTabs, e.clientX);

    if (afterElement == null) {
      const lastLink = navTabs.querySelector('.nav-link:last-of-type:not(.dragging)');
      if (lastLink) {
        const rect = lastLink.getBoundingClientRect();
        dropIndicator.style.left = `${rect.right}px`;
        dropIndicator.style.top = `${rect.top}px`;
        dropIndicator.style.display = 'block';
        lastLink.classList.add('drag-after');
      }
    } else {
      const rect = afterElement.getBoundingClientRect();
      dropIndicator.style.left = `${rect.left}px`;
      dropIndicator.style.top = `${rect.top}px`;
      dropIndicator.style.display = 'block';
      afterElement.classList.add('drag-before');
    }

    if (afterElement == null) {
      navTabs.appendChild(dragging);
    } else {
      navTabs.insertBefore(dragging, afterElement);
    }
  });

  navTabs.addEventListener('dragleave', (e) => {
    if (!navTabs.contains(e.relatedTarget)) {
      dropIndicator.style.display = 'none';
      navTabs.querySelectorAll('.nav-link').forEach((navLink) => {
        navLink.classList.remove('drag-over', 'drag-before', 'drag-after');
      });
    }
  });

  navLinks.forEach((link) => {
    link.setAttribute('draggable', 'true');
    link.style.cursor = 'grab';
    link.style.userSelect = 'none';

    link.addEventListener('mousedown', (e) => {
      if (e.target.closest('.nav-close-btn')) return;
    });

    link.addEventListener('dragstart', (e) => {
      if (e.target.closest('.nav-close-btn')) {
        e.preventDefault();
        return;
      }
      draggedElement = link;
      link.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', link.getAttribute('data-section') || '');
    });

    link.addEventListener('dragend', () => {
      link.classList.remove('dragging');
      doc.querySelectorAll('.nav-link').forEach((el) => {
        el.classList.remove('drag-over', 'drag-before', 'drag-after');
      });
      dropIndicator.style.display = 'none';

      reorderContentSections(doc);
      syncMobileMenuNav(doc);

      if (draggedElement) {
        doc.querySelectorAll('.nav-link').forEach((navLink) => {
          navLink.classList.remove('active');
        });
        draggedElement.classList.add('active');

        const sectionId = draggedElement.getAttribute('data-section');
        if (sectionId) {
          scrollToNavSection(sectionId, doc);
          pinNavSection(sectionId, doc);
        }

        draggedElement.wasDragging = true;
        setTimeout(() => {
          if (draggedElement) draggedElement.wasDragging = false;
        }, 100);
      }
    });

    link.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      doc.querySelectorAll('.nav-link').forEach((el) => {
        el.classList.remove('drag-over', 'drag-before', 'drag-after');
      });
      dropIndicator.style.display = 'none';
    });
  });
}

/** @param {Document} doc */
export function initCloseTab(doc = document) {
  const closeTabModal = doc.getElementById('close-tab-modal');
  if (!closeTabModal) return;

  const closeTabCloseBtn = doc.getElementById('close-tab-modal-close-btn');
  const closeTabCancelBtn = doc.getElementById('close-tab-cancel-btn');
  const closeTabConfirmBtn = doc.getElementById('close-tab-confirm-btn');
  const closeTabMessage = doc.getElementById('close-tab-message');

  /** @type {string | null} */
  let tabToClose = null;

  const closeModal = () => {
    closeTabModal.classList.remove('active');
    doc.body.style.overflow = '';
    tabToClose = null;
  };

  const openModal = (sectionId, tabName) => {
    tabToClose = sectionId;
    if (closeTabMessage) {
      closeTabMessage.textContent = `Are you sure that you want to close "${tabName}"? You cannot undo this action.`;
    }
    closeTabModal.classList.add('active');
    doc.body.style.overflow = 'hidden';
  };

  const hideSection = (sectionId) => {
    const navLink = doc.querySelector(`.nav-link[data-section="${sectionId}"]`);
    const footerNavLink = doc.querySelector(`.footer-nav-link[data-section="${sectionId}"]`);

    if (navLink instanceof HTMLElement) navLink.style.display = 'none';
    if (footerNavLink instanceof HTMLElement) footerNavLink.style.display = 'none';

    if (sectionId === 'home') {
      const hero = doc.querySelector('.hero-section');
      const stats = doc.querySelector('.stats-grid');
      if (hero instanceof HTMLElement) hero.style.display = 'none';
      if (stats instanceof HTMLElement) stats.style.display = 'none';
      return;
    }

    const section = doc.getElementById(sectionId);
    if (section instanceof HTMLElement) section.style.display = 'none';
  };

  const confirmClose = () => {
    if (!tabToClose) return;

    const sectionId = tabToClose;
    const navLink = doc.querySelector(`.nav-link[data-section="${sectionId}"]`);
    const wasActive = navLink?.classList.contains('active');

    hideSection(sectionId);
    syncMobileMenuNav(doc);
    closeModal();

    if (wasActive) {
      const visibleTabs = Array.from(doc.querySelectorAll('.nav-link')).filter(
        (link) => link.style.display !== 'none'
      );
      if (visibleTabs.length > 0) {
        const firstTab = visibleTabs[0];
        const targetSection = firstTab.getAttribute('data-section');
        if (targetSection) scrollToNavSection(targetSection, doc);
      }
    }
  };

  closeTabCloseBtn?.addEventListener('click', closeModal);
  closeTabCancelBtn?.addEventListener('click', closeModal);
  closeTabConfirmBtn?.addEventListener('click', confirmClose);
  closeTabModal.addEventListener('click', (e) => {
    if (e.target === closeTabModal) closeModal();
  });

  doc.querySelectorAll('.nav-close-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const sectionId = btn.getAttribute('data-section') || '';
      const navLink = btn.closest('.nav-link');
      const tabName = navLink?.querySelector('.nav-path')?.textContent || sectionId;
      openModal(sectionId, tabName);
    });
  });
}

/** @param {Document} doc */
export function initNavTabs(doc = document) {
  if (!doc.querySelector('.dashboard')) return;

  localStorage.removeItem(NAV_ORDER_KEY);
  syncMobileMenuNav(doc);
  initNavLinkClicks(doc);
  initCloseTab(doc);

  if (window.innerWidth > DESKTOP_MIN_WIDTH) {
    initNavDragAndDrop(doc);
  }

  initNavScrollSpy(doc);
}

export function bootEnhance() {
  updateClock();
  setInterval(updateClock, 1000);
  initTheme();
  initMobileMenu();
  initProjectSearch();
  initProjectImageLightbox();
  initCrmExperienceStat();
  initHomeProjectsGrid();
  initCodeFolds();
  initNavTabs();
  initHeroTerminal(document, window, {
    scrollToSection: (sectionId) => {
      setActiveNavSection(sectionId, document);
      scrollToNavSection(sectionId, document);
      pinNavSection(sectionId, document);
    },
  });
}
