/**
 * DOM wiring for the interactive hero terminal.
 */

import {
  buildHeroTerminalContext,
  heroTerminalCompletionMatches,
  heroTerminalInlineSuggestion,
  replaceCompletionToken,
  runHeroTerminalCommand,
} from '../lib/hero-terminal.js';

/**
 * @typedef {{
 *   scrollToSection?: (sectionId: string) => void,
 *   navigate?: (href: string) => void,
 * }} HeroTerminalDeps
 */

/**
 * @param {Document} doc
 * @param {Window} win
 * @param {HeroTerminalDeps} deps
 */
export function initHeroTerminal(doc = document, win = window, deps = {}) {
  const root = doc.querySelector('[data-hero-terminal]');
  if (!(root instanceof HTMLElement)) return;

  const dataEl = doc.getElementById('hero-terminal-data');
  if (!dataEl?.textContent) return;

  /** @type {import('../lib/hero-terminal.js').HeroTerminalContext} */
  let ctx;
  try {
    ctx = buildHeroTerminalContext(JSON.parse(dataEl.textContent));
  } catch {
    return;
  }

  const transcript = root.querySelector('.terminal-transcript');
  const input = root.querySelector('[data-hero-terminal-input]');
  const mirrorTyped = root.querySelector('[data-hero-terminal-mirror-typed]');
  const suffixEl = root.querySelector('[data-hero-terminal-suffix]');
  const mirror = root.querySelector('.terminal-input-mirror');

  if (!(transcript instanceof HTMLElement) || !(input instanceof HTMLInputElement)) return;

  const inputRow = root.querySelector('[data-hero-terminal-input-row]');
  if (inputRow instanceof HTMLElement) {
    inputRow.hidden = false;
  }

  /** @type {string[]} */
  const history = [];
  let historyBrowseIndex = -1;
  let draftLine = '';
  let ghostMatchIndex = 0;
  /** @type {string | null} */
  let ghostMatchLine = null;

  const caretAtEnd = () =>
    input.selectionStart === input.value.length && input.selectionEnd === input.value.length;

  const syncMirrorLayout = () => {
    if (!(mirror instanceof HTMLElement)) return;
    const width = Math.ceil(mirror.scrollWidth);
    input.style.width = `${Math.max(width, 32)}px`;
  };

  const clearGhost = () => {
    ghostMatchIndex = 0;
    ghostMatchLine = null;
    if (mirrorTyped instanceof HTMLElement) {
      mirrorTyped.textContent = input.value;
    }
    if (suffixEl instanceof HTMLElement) {
      suffixEl.textContent = '';
    }
    syncMirrorLayout();
  };

  const refreshGhost = () => {
    if (!(suffixEl instanceof HTMLElement) || !(mirrorTyped instanceof HTMLElement)) return;

    const line = input.value;
    if (ghostMatchLine !== line) {
      ghostMatchIndex = 0;
      ghostMatchLine = line;
    }

    mirrorTyped.textContent = line;

    let suffix = null;
    if (caretAtEnd()) {
      ({ suffix } = heroTerminalInlineSuggestion(line, ctx, ghostMatchIndex));
    }

    suffixEl.textContent = suffix || '';
    syncMirrorLayout();
  };

  const acceptGhost = () => {
    const line = input.value;
    const { completion } = heroTerminalInlineSuggestion(line, ctx, ghostMatchIndex);
    if (!completion) return false;

    input.value = replaceCompletionToken(line, completion, true);
    ghostMatchIndex = 0;
    ghostMatchLine = input.value;
    refreshGhost();
    return true;
  };

  /**
   * @param {string} text
   * @param {string} [className]
   */
  function appendLine(text, className = 'terminal-out-line') {
    const line = doc.createElement('div');
    line.className = className;
    line.textContent = text;
    transcript.appendChild(line);
    transcript.scrollTop = transcript.scrollHeight;
  }

  function appendCommandEcho(commandLine) {
    const row = doc.createElement('div');
    row.className = 'terminal-line terminal-cmd-echo';
    const prompt = doc.createElement('span');
    prompt.className = 'prompt';
    prompt.textContent = '$';
    const command = doc.createElement('span');
    command.className = 'command';
    command.textContent = commandLine;
    row.append(prompt, command);
    transcript.appendChild(row);
    transcript.scrollTop = transcript.scrollHeight;
  }

  refreshGhost();

  input.addEventListener('input', () => {
    ghostMatchLine = null;
    refreshGhost();
  });

  input.addEventListener('keyup', refreshGhost);
  input.addEventListener('click', refreshGhost);
  doc.addEventListener('selectionchange', () => {
    if (doc.activeElement === input) refreshGhost();
  });

  root.addEventListener('click', (e) => {
    if (e.target instanceof HTMLInputElement) return;
    input.focus();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      if (historyBrowseIndex === -1) {
        draftLine = input.value;
        historyBrowseIndex = history.length - 1;
      } else if (historyBrowseIndex > 0) {
        historyBrowseIndex -= 1;
      }
      input.value = history[historyBrowseIndex] ?? '';
      ghostMatchLine = null;
      refreshGhost();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyBrowseIndex === -1) return;
      if (historyBrowseIndex < history.length - 1) {
        historyBrowseIndex += 1;
        input.value = history[historyBrowseIndex] ?? '';
      } else {
        historyBrowseIndex = -1;
        input.value = draftLine;
      }
      ghostMatchLine = null;
      refreshGhost();
      return;
    }

    if (e.key === 'ArrowRight' && input.selectionStart === input.value.length) {
      if (acceptGhost()) {
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const line = input.value;
      const matches = heroTerminalCompletionMatches(line, ctx);

      if (acceptGhost()) {
        return;
      }

      if (matches.length > 1) {
        ghostMatchIndex = (ghostMatchIndex + 1) % matches.length;
        refreshGhost();
      }
      return;
    }

    if (e.key === 'Escape') {
      clearGhost();
      return;
    }

    if (e.key !== 'Enter') return;

    e.preventDefault();
    const commandLine = input.value;
    input.value = '';
    clearGhost();
    historyBrowseIndex = -1;
    draftLine = '';

    if (!commandLine.trim()) return;

    history.push(commandLine);
    appendCommandEcho(commandLine);

    const result = runHeroTerminalCommand(commandLine, ctx);

    if (result.clear) {
      transcript.replaceChildren();
    }

    const isHelpOutput = commandLine.trim().toLowerCase() === 'help';
    result.lines.forEach((line) => {
      const isError = line.startsWith('command not found') || line.includes(': No such');
      let className = 'terminal-out-line';
      if (isError) className += ' terminal-out-error';
      else if (isHelpOutput) {
        className += ' terminal-out-help';
        if (line === 'Commands') className += ' terminal-out-help-title';
      }
      appendLine(line, className);
    });

    if (result.action?.type === 'scroll' && deps.scrollToSection) {
      deps.scrollToSection(result.action.sectionId);
    }
    if (result.action?.type === 'navigate') {
      if (deps.navigate) deps.navigate(result.action.href);
      else win.location.assign(result.action.href);
    }
  });
}
