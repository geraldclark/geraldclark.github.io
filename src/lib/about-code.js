/** @param {string} value */
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @typedef {object} AboutCodeLine
 * @property {number} num
 * @property {string | null} foldId
 * @property {string} html
 * @property {boolean} isFoldable
 * @property {number} indent
 * @property {string | null} foldTarget
 */

/**
 * @param {{ name: string, roles?: string[], location?: string, skills?: string[], passion?: string }} about
 * @returns {AboutCodeLine[]}
 */
export function buildAboutCodeLines(about) {
  /** @type {AboutCodeLine[]} */
  const lines = [];
  let lineNumber = 1;

  /** @param {AboutCodeLine['foldId']} foldId @param {string} html @param {boolean} isFoldable @param {number} indent @param {AboutCodeLine['foldTarget']} foldTarget */
  const push = (foldId, html, isFoldable, indent, foldTarget) => {
    lines.push({
      num: lineNumber++,
      foldId,
      html,
      isFoldable,
      indent,
      foldTarget,
    });
  };

  push(
    null,
    `<span class="code-comment">// About ${escapeHtml(about.name)}</span>`,
    false,
    0,
    null
  );
  push(
    'object-content',
    `<span class="code-keyword">const</span> <span class="code-var">person</span> = {`,
    true,
    0,
    'object-content'
  );
  push(
    'object-content',
    `<span class="code-property">name</span>: <span class="code-string">"${escapeHtml(about.name)}"</span>,`,
    false,
    1,
    null
  );

  push(
    'object-content',
    `<span class="code-property">roles</span>: [`,
    true,
    1,
    'roles-array'
  );

  const roles = about.roles || [];
  roles.forEach((role, index) => {
    const isLast = index === roles.length - 1;
    push(
      'roles-array object-content',
      `<span class="code-string">"${escapeHtml(role)}"</span>${isLast ? '' : ','}`,
      false,
      2,
      null
    );
  });

  push('object-content', `],`, false, 1, null);
  push(
    'object-content',
    `<span class="code-property">location</span>: <span class="code-string">"${escapeHtml(about.location || '')}"</span>,`,
    false,
    1,
    null
  );

  push(
    'object-content',
    `<span class="code-property">skills</span>: [`,
    true,
    1,
    'skills-array'
  );

  const skills = about.skills || [];
  skills.forEach((skill, index) => {
    const isLast = index === skills.length - 1;
    push(
      'skills-array object-content',
      `<span class="code-string">"${escapeHtml(skill)}"</span>${isLast ? '' : ','}`,
      false,
      2,
      null
    );
  });

  push('object-content', `],`, false, 1, null);
  push(
    'object-content',
    `<span class="code-property">passion</span>: <span class="code-string">"${escapeHtml(about.passion || '')}"</span>`,
    false,
    1,
    null
  );
  push(null, `};`, false, 0, null);

  return lines;
}
