/**
 * @ext-ts/core – String utilities
 */

// ---------------------------------------------------------------------------
// capitalize / uncapitalize
// ---------------------------------------------------------------------------

/**
 * Capitalizes the first character of `str`.
 */
export function capitalize(str: string): string {
  if (str.length === 0) return str;
  return str[0].toUpperCase() + str.slice(1);
}

/**
 * Lowercases the first character of `str`.
 */
export function uncapitalize(str: string): string {
  if (str.length === 0) return str;
  return str[0].toLowerCase() + str.slice(1);
}

// ---------------------------------------------------------------------------
// ellipsis
// ---------------------------------------------------------------------------

/**
 * Truncates `value` to `length` characters (including a trailing `"…"` when
 * truncation occurs).  When `word` is `true` the cut happens before the last
 * whitespace boundary so words are not split mid-way.
 */
export function ellipsis(value: string, length: number, word?: boolean): string {
  if (value.length <= length) return value;
  if (length <= 3) return '...';

  const truncLen = length - 3;

  if (word) {
    const lastSpace = value.lastIndexOf(' ', truncLen);
    if (lastSpace > 0) {
      return value.slice(0, lastSpace) + '...';
    }
  }

  return value.slice(0, truncLen) + '...';
}

// ---------------------------------------------------------------------------
// HTML escaping
// ---------------------------------------------------------------------------

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const HTML_UNESCAPE_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

const HTML_ESCAPE_RE = /[&<>"']/g;
const HTML_UNESCAPE_RE = /&amp;|&lt;|&gt;|&quot;|&#39;/g;

/**
 * Escapes `&`, `<`, `>`, `"`, and `'` to their HTML entity equivalents.
 */
export function escapeHtml(str: string): string {
  return str.replace(HTML_ESCAPE_RE, (ch) => HTML_ESCAPE_MAP[ch]);
}

/**
 * Reverses {@link escapeHtml}, converting HTML entities back to characters.
 */
export function unescapeHtml(str: string): string {
  return str.replace(HTML_UNESCAPE_RE, (entity) => HTML_UNESCAPE_MAP[entity]);
}

/** Alias for {@link escapeHtml}. */
export const htmlEncode: typeof escapeHtml = escapeHtml;

/** Alias for {@link unescapeHtml}. */
export const htmlDecode: typeof unescapeHtml = unescapeHtml;

// ---------------------------------------------------------------------------
// escapeRegex
// ---------------------------------------------------------------------------

const REGEX_SPECIAL_RE = /[.*+?^${}()|[\]\\]/g;

/**
 * Escapes all RegExp-special characters so the result can be used inside
 * `new RegExp(...)` to match the literal string.
 */
export function escapeRegex(str: string): string {
  return str.replace(REGEX_SPECIAL_RE, '\\$&');
}

// ---------------------------------------------------------------------------
// format
// ---------------------------------------------------------------------------

/**
 * Replaces `{0}`, `{1}`, … placeholders in `template` with the
 * corresponding positional values (converted via `String()`).
 */
export function format(template: string, ...values: unknown[]): string {
  return template.replace(/\{(\d+)}/g, (match, index: string) => {
    const i = Number(index);
    return i < values.length ? String(values[i]) : match;
  });
}

// ---------------------------------------------------------------------------
// repeat / trim / leftPad
// ---------------------------------------------------------------------------

/**
 * Repeats `str` exactly `count` times.
 */
export function repeat(str: string, count: number): string {
  return str.repeat(count);
}

/**
 * Trims leading and trailing whitespace.
 */
export function trim(str: string): string {
  return str.trim();
}

/**
 * Left-pads `str` to `size` characters using `char` (default `' '`).
 * Only the first character of `char` is used.
 */
export function leftPad(str: string, size: number, char = ' '): string {
  const padChar = char[0];
  const needed = size - str.length;
  if (needed <= 0) return str;
  return padChar.repeat(needed) + str;
}

// ---------------------------------------------------------------------------
// toggle
// ---------------------------------------------------------------------------

/**
 * Returns `value2` when `str === value1`, otherwise returns `value1`.
 */
export function toggle(str: string, value1: string, value2: string): string {
  return str === value1 ? value2 : value1;
}

// ---------------------------------------------------------------------------
// splitWords / case conversions
// ---------------------------------------------------------------------------

/**
 * Splits a string into its constituent words, recognising camelCase,
 * PascalCase, snake_case, and kebab-case boundaries.
 *
 * Consecutive uppercase letters are treated as a single acronym, e.g.
 * `"parseHTMLString"` → `["parse", "HTML", "String"]`.
 */
export function splitWords(str: string): string[] {
  if (str.length === 0) return [];

  // 1. Insert a boundary marker before each transition:
  //    - lower/digit → Upper        (camelCase boundary)
  //    - Upper → Upper+Lower        (acronym end: "HTML" + "String")
  const withBoundaries = str
    .replace(/([a-z0-9])([A-Z])/g, '$1\0$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1\0$2');

  // 2. Split on the boundary marker, underscores, and hyphens, then remove empties.
  return withBoundaries.split(/[\0_-]+/).filter(Boolean);
}

/**
 * Converts a string to `camelCase`.
 */
export function camelCase(str: string): string {
  const words = splitWords(str);
  if (words.length === 0) return '';
  return words
    .map((w, i) => {
      const lower = w.toLowerCase();
      return i === 0 ? lower : capitalize(lower);
    })
    .join('');
}

/**
 * Converts a string to `kebab-case`.
 */
export function kebabCase(str: string): string {
  const words = splitWords(str);
  return words.map((w) => w.toLowerCase()).join('-');
}

/**
 * Converts a string to `PascalCase`.
 */
export function pascalCase(str: string): string {
  const words = splitWords(str);
  return words.map((w) => capitalize(w.toLowerCase())).join('');
}
