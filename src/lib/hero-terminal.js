/** @typedef {{ id: string, name: string }} HeroTerminalProject */

/**
 * @typedef {{
 *   name: string,
 *   roles?: string[],
 *   location?: string,
 *   passion?: string,
 *   skills?: string[],
 * }} HeroTerminalAbout
 */

/**
 * @typedef {{
 *   category: string,
 *   items?: { name: string }[],
 * }} HeroTerminalSkillCategory
 */

/**
 * @typedef {{
 *   name: string,
 *   issuer?: string,
 *   year?: number | string,
 * }} HeroTerminalDistinction
 */

/**
 * @typedef {{
 *   label: string,
 *   value?: string,
 * }} HeroTerminalContact
 */

/**
 * @typedef {{
 *   about: HeroTerminalAbout,
 *   projects: HeroTerminalProject[],
 *   skillCategories: HeroTerminalSkillCategory[],
 *   distinctions: HeroTerminalDistinction[],
 *   contact: HeroTerminalContact[],
 * }} HeroTerminalContext
 */

/** @typedef {{ type: 'scroll', sectionId: string }} ScrollAction */
/** @typedef {{ type: 'navigate', href: string }} NavigateAction */

/**
 * @typedef {{
 *   lines: string[],
 *   action?: ScrollAction | NavigateAction,
 *   clear?: boolean,
 * }} HeroTerminalResult
 */

/** @typedef {{
 *   section: string,
 *   file: string,
 *   blurb: string | ((ctx: HeroTerminalContext) => string),
 * }} RootLsEntry */

/** @type {RootLsEntry[]} */
export const ROOT_LS_ENTRIES = [
  { section: 'about', file: 'about.js', blurb: 'the short version' },
  {
    section: 'projects',
    file: 'projects.log',
    blurb: (ctx) => `${ctx.projects.length} projects · cat projects or /projects/`,
  },
  {
    section: 'skills',
    file: 'skills.yml',
    blurb: (ctx) => {
      const n = ctx.skillCategories.length;
      return n ? `${n} categories · day-to-day stack` : 'day-to-day stack';
    },
  },
  {
    section: 'distinctions',
    file: 'distinctions.crt',
    blurb: (ctx) => {
      const n = ctx.distinctions.length;
      return n ? `${n} certs & milestones` : 'certs & milestones';
    },
  },
  {
    section: 'contact',
    file: 'contact.md',
    blurb: (ctx) => {
      const n = ctx.contact.length;
      return n ? `${n} links · let's connect` : "let's connect";
    },
  },
];

export const VIRTUAL_FILES = ROOT_LS_ENTRIES.map((e) => e.file);

const FILE_TO_SECTION = {
  'about.js': 'about',
  'projects.log': 'projects',
  'skills.yml': 'skills',
  'distinctions.crt': 'distinctions',
  'contact.md': 'contact',
};

const SECTION_ALIASES = {
  home: 'home',
  top: 'home',
  about: 'about',
  projects: 'projects',
  skills: 'skills',
  distinctions: 'distinctions',
  contact: 'contact',
  ...FILE_TO_SECTION,
};

const LS_PROJECT_LIMIT = 14;
const LS_NAME_WIDTH = 18;

/** @param {string} file @param {string} blurb */
function formatLsRow(file, blurb) {
  const name = file.padEnd(LS_NAME_WIDTH, ' ');
  return `${name}${blurb}`;
}

/** @param {HeroTerminalContext} ctx */
function listRootLines(ctx) {
  const rows = ROOT_LS_ENTRIES.map(({ section, blurb }) => {
    const text = typeof blurb === 'function' ? blurb(ctx) : blurb;
    return formatLsRow(section, text);
  });
  return ['total 5', ...rows, '', 'cd <section> to scroll   cat <section> to peek'];
}

/**
 * @param {{
 *   about: HeroTerminalAbout,
 *   projects: HeroTerminalProject[],
 *   skills?: HeroTerminalSkillCategory[],
 *   distinctions?: HeroTerminalDistinction[],
 *   contact?: HeroTerminalContact[],
 * }} data
 */
export function buildHeroTerminalContext(data) {
  return {
    about: data.about,
    projects: data.projects.map((p) => ({ id: p.id, name: p.name })),
    skillCategories: data.skills || [],
    distinctions: data.distinctions || [],
    contact: data.contact || [],
  };
}

/** @param {HeroTerminalContext} ctx */
export function getWhoamiLines(ctx) {
  const { about } = ctx;
  const lines = [about.name];
  const roles = about.roles?.slice(0, 2).join(' / ');
  if (roles) lines.push(roles);
  if (about.location) lines.push(about.location);
  return lines;
}


/**
 * @param {string} raw
 * @returns {string[]}
 */
export function parseCommandLine(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  return trimmed.split(/\s+/);
}

export const HERO_TERMINAL_COMMANDS = [
  'help',
  'whoami',
  'ls',
  'cat',
  'cd',
  'clear',
];

const SECTION_NAMES = ['home', ...ROOT_LS_ENTRIES.map((e) => e.section)];

/**
 * @typedef {{
 *   partial: string,
 *   start: number,
 *   end: number,
 *   command: string | null,
 *   argIndex: number,
 * }} CompletionState
 */

/** @param {string} line */
export function parseCompletionState(line) {
  const endsWithSpace = /\s$/.test(line);
  const trimmed = line.trimStart();
  const leadingSpaces = line.length - trimmed.length;

  if (!trimmed) {
    return {
      partial: '',
      start: leadingSpaces,
      end: line.length,
      command: null,
      argIndex: 0,
    };
  }

  const tokens = trimmed.split(/\s+/);

  if (endsWithSpace) {
    return {
      partial: '',
      start: line.length,
      end: line.length,
      command: tokens[0]?.toLowerCase() ?? null,
      argIndex: tokens.length,
    };
  }

  const lastToken = tokens[tokens.length - 1];
  const beforeLast = tokens.slice(0, -1).join(' ');
  const tokenStart = leadingSpaces + (beforeLast ? beforeLast.length + 1 : 0);

  return {
    partial: lastToken,
    start: tokenStart,
    end: tokenStart + lastToken.length,
    command: tokens[0]?.toLowerCase() ?? null,
    argIndex: tokens.length - 1,
  };
}

/** @param {string[]} strings */
export function longestCommonPrefix(strings) {
  if (strings.length === 0) return '';
  if (strings.length === 1) return strings[0];
  let prefix = strings[0];
  for (let i = 1; i < strings.length; i += 1) {
    while (!strings[i].startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
      if (!prefix) return '';
    }
  }
  return prefix;
}

/**
 * @param {string} line
 * @param {HeroTerminalContext} ctx
 * @returns {string[]}
 */
export function heroTerminalCompletionMatches(line, ctx) {
  const { partial, command, argIndex } = parseCompletionState(line);
  const needle = partial.toLowerCase();

  if (partial === '') {
    return [];
  }

  if (argIndex === 0) {
    return HERO_TERMINAL_COMMANDS.filter((name) => name.startsWith(needle));
  }

  if (!command) return [];

  if (argIndex > 1 && (command === 'ls' || command === 'cat')) {
    return [];
  }

  if (command === 'cd') {
    return SECTION_NAMES.filter((name) => name.startsWith(needle));
  }

  if (command === 'cat') {
    const targets = [
      ...ROOT_LS_ENTRIES.map((e) => e.section),
      ...ROOT_LS_ENTRIES.map((e) => e.file),
    ];
    return [...new Set(targets)].filter((name) => name.toLowerCase().startsWith(needle));
  }

  if (command === 'ls') {
    return SECTION_NAMES.filter((name) => name.toLowerCase().startsWith(needle));
  }

  return [];
}

/**
 * @param {string} line
 * @param {string[]} matches
 * @returns {{ line: string, listMatches: string[] | null }}
 */
export function applyHeroTerminalTabCompletion(line, matches) {
  if (matches.length === 0) {
    return { line, listMatches: null };
  }

  const state = parseCompletionState(line);
  const lcp = longestCommonPrefix(matches);
  const canExtend = lcp.length > state.partial.length;
  const insert = matches.length === 1 ? matches[0] : canExtend ? lcp : state.partial;

  if (matches.length > 1 && !canExtend) {
    return { line, listMatches: matches };
  }

  const before = line.slice(0, state.start);
  const after = line.slice(state.end);
  const addSpace =
    matches.length === 1 &&
    (state.argIndex === 0 || commandAcceptsMoreArgs(state.command, state.argIndex));

  const nextLine = before + insert + (addSpace ? ' ' : '') + after;
  return { line: nextLine, listMatches: null };
}

/**
 * @param {string} line
 * @param {string} completedToken
 * @param {boolean} [addSpace]
 */
export function replaceCompletionToken(line, completedToken, addSpace = false) {
  const state = parseCompletionState(line);
  const before = line.slice(0, state.start);
  const after = line.slice(state.end);
  return before + completedToken + (addSpace ? ' ' : '') + after;
}

/**
 * Gray inline ghost: remainder of the best matching token.
 *
 * @param {string} line
 * @param {HeroTerminalContext} ctx
 * @param {number} [matchIndex]
 * @returns {{ suffix: string | null, completion: string | null }}
 */
export function heroTerminalInlineSuggestion(line, ctx, matchIndex = 0) {
  const matches = heroTerminalCompletionMatches(line, ctx);
  if (matches.length === 0) {
    return { suffix: null, completion: null };
  }

  const state = parseCompletionState(line);
  const index = ((matchIndex % matches.length) + matches.length) % matches.length;
  const active = matches[index];
  const partialLower = state.partial.toLowerCase();
  const activeLower = active.toLowerCase();

  if (!activeLower.startsWith(partialLower) || active.length <= state.partial.length) {
    return { suffix: null, completion: null };
  }

  const suffix = active.slice(state.partial.length);
  return { suffix, completion: active };
}

/** @param {string | null} command @param {number} argIndex */
function commandAcceptsMoreArgs(command, argIndex) {
  if (!command) return false;
  if (command === 'cd' || command === 'cat') return true;
  if (command === 'ls' && argIndex >= 1) return false;
  return false;
}

/**
 * @param {string} query
 * @param {HeroTerminalProject[]} projects
 */
export function resolveProject(query, projects) {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const byId = projects.find((p) => p.id.toLowerCase() === q);
  if (byId) return byId;

  const normalize = (s) =>
    s
      .toLowerCase()
      .replace(/®/g, '')
      .replace(/upsert\s*/gi, '')
      .trim();

  const qNorm = normalize(q);
  const exactName = projects.find((p) => normalize(p.name) === qNorm);
  if (exactName) return exactName;

  const matches = projects.filter(
    (p) =>
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      normalize(p.name).includes(qNorm)
  );
  if (matches.length === 1) return matches[0];
  return null;
}

/** @param {string} token */
function resolveSectionId(token) {
  const key = token.toLowerCase().replace(/^\.\//, '');
  return SECTION_ALIASES[key] || null;
}

/** @param {string} token */
function catTargetToFileKey(token) {
  const key = token.toLowerCase();
  const match = ROOT_LS_ENTRIES.find((e) => e.section === key || e.file === key);
  return match ? match.file.toLowerCase() : key;
}

/** @param {HeroTerminalContext} ctx */
function catFile(filename, ctx) {
  const key = catTargetToFileKey(filename);

  if (key === 'about.js') {
    const { about } = ctx;
    const lines = [];
    if (about.passion) lines.push(`passion: ${about.passion}`);
    if (about.skills?.length) lines.push(`focus: ${about.skills.join(', ')}`);
    if (about.roles?.length) lines.push(`roles: ${about.roles.join(', ')}`);
    return lines.length ? lines : ['// about.js — see the About section below'];
  }

  if (key === 'projects.log') {
    return listProjectLines(ctx, { limit: null });
  }

  if (key === 'skills.yml') {
    if (ctx.skillCategories.length === 0) return ['# skills.yml — empty'];
    return ctx.skillCategories.flatMap((cat) => {
      const items = (cat.items || []).map((i) => i.name);
      if (items.length === 0) return [`${cat.category}:`];
      return [`${cat.category}:`, ...items.map((n) => `  - ${n}`)];
    });
  }

  if (key === 'distinctions.crt') {
    if (ctx.distinctions.length === 0) return ['# no distinctions on file'];
    return ctx.distinctions.map(formatDistinctionLine);
  }

  if (key === 'contact.md') {
    if (ctx.contact.length === 0) return ['# contact.md — scroll to Contact'];
    return ctx.contact.map((c) => `- ${c.label}: ${c.value || c.label}`);
  }

  return null;
}

/** @param {{ name: string, issuer?: string, year?: number | string | null }} d */
function formatDistinctionLine(d) {
  const tail = [d.issuer, d.year].filter((part) => part != null && part !== '').join(' · ');
  return tail ? `${d.name} — ${tail}` : d.name;
}

/**
 * @param {HeroTerminalContext} ctx
 * @param {{ limit?: number | null }} [opts]
 */
function listProjectLines(ctx, opts = {}) {
  const { projects } = ctx;
  const limit = opts.limit === undefined ? LS_PROJECT_LIMIT : opts.limit;
  if (projects.length === 0) return ['projects.log: (empty)'];
  const shown = limit === null ? projects : projects.slice(0, limit);
  const lines = [`projects.log (${projects.length} entries)`, ''];
  shown.forEach((p) => {
    lines.push(formatLsRow(p.id, p.name.replace(/®/g, '')));
  });
  if (limit !== null && projects.length > limit) {
    lines.push(`… +${projects.length - limit} more (cat projects for full list)`);
  }
  lines.push('', 'see /projects/ for all');
  return lines;
}

/** @type {[string, string][]} */
const HELP_ROWS = [
  ['ls', 'list sections on this page'],
  ['cd <section>', 'scroll to a section'],
  ['cat <section>', 'print section content'],
  ['whoami', 'name, roles, location'],
  ['clear', 'clear command output'],
  ['help', 'this message'],
  ['Tab, →', 'accept gray suggestion'],
];

export function getHelpLines() {
  const col = Math.max(...HELP_ROWS.map(([name]) => name.length), 4);
  return [
    'Commands',
    '',
    ...HELP_ROWS.map(([name, desc]) => `${name.padEnd(col)}  ${desc}`),
  ];
}

/**
 * @param {string} line
 * @param {HeroTerminalContext} ctx
 * @returns {HeroTerminalResult}
 */
export function runHeroTerminalCommand(line, ctx) {
  const parts = parseCommandLine(line);
  if (parts.length === 0) return { lines: [] };

  const [cmd, ...args] = parts;
  const command = cmd.toLowerCase();

  if (command === 'help') {
    return { lines: getHelpLines() };
  }

  if (command === 'whoami') {
    return { lines: getWhoamiLines(ctx) };
  }

  if (command === 'ls') {
    const target = args[0]?.toLowerCase();
    if (target) {
      const sectionId = resolveSectionId(target);
      const entry = ROOT_LS_ENTRIES.find((e) => e.section === sectionId);
      if (entry) {
        const blurb = typeof entry.blurb === 'function' ? entry.blurb(ctx) : entry.blurb;
        return { lines: [formatLsRow(entry.section, blurb)] };
      }
      if (sectionId === 'home') {
        return { lines: listRootLines(ctx) };
      }
      return { lines: [`ls: ${args[0]}: Not a directory`] };
    }
    return { lines: listRootLines(ctx) };
  }

  if (command === 'cat') {
    const file = args[0];
    if (!file) return { lines: ['cat: missing file operand'] };
    const content = catFile(file, ctx);
    if (content === null) return { lines: [`cat: ${file}: No such file`] };
    return { lines: content };
  }

  if (command === 'cd') {
    const target = args.join(' ');
    if (!target) return { lines: ['cd: missing destination'] };
    const sectionId = resolveSectionId(target);
    if (!sectionId) {
      return { lines: [`cd: ${target}: No such section`] };
    }
    return {
      lines: [`→ ${sectionId === 'home' ? 'top of page' : sectionId}`],
      action: { type: 'scroll', sectionId },
    };
  }

  if (command === 'clear') {
    return { lines: [], clear: true };
  }

  return { lines: [`command not found: ${cmd}. Try help.`] };
}
