/**
 * @framesquared/core – Sanitizer
 *
 * HTML sanitization utility for safe innerHTML usage.
 * Uses a whitelist approach — only known-safe tags and attributes pass through.
 * No dependencies on DOMPurify; uses the browser's own DOMParser.
 *
 * @example
 * ```typescript
 * import { Sanitizer } from '@framesquared/core';
 *
 * const clean = Sanitizer.sanitize('<p onclick="alert(1)">Hello <b>world</b></p>');
 * // Returns: '<p>Hello <b>world</b></p>'
 * ```
 *
 * @since 0.1.0
 */

const SAFE_TAGS = new Set([
  'a',
  'abbr',
  'b',
  'blockquote',
  'br',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'dd',
  'del',
  'details',
  'div',
  'dl',
  'dt',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'ins',
  'kbd',
  'label',
  'li',
  'mark',
  'ol',
  'p',
  'pre',
  'q',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'time',
  'tr',
  'u',
  'ul',
  'var',
  'wbr',
]);

const SAFE_ATTRS = new Set([
  'align',
  'alt',
  'class',
  'colspan',
  'dir',
  'height',
  'href',
  'id',
  'lang',
  'name',
  'role',
  'rowspan',
  'scope',
  'src',
  'style',
  'tabindex',
  'target',
  'title',
  'type',
  'valign',
  'width',
  // ARIA
  'aria-controls',
  'aria-describedby',
  'aria-disabled',
  'aria-expanded',
  'aria-haspopup',
  'aria-hidden',
  'aria-label',
  'aria-labelledby',
  'aria-live',
  'aria-modal',
  'aria-pressed',
  'aria-selected',
  'aria-sort',
]);

const SAFE_URL_PATTERN = /^(?:https?|mailto|tel|#):/i;
const DATA_URL_PATTERN = /^data:image\/(?:png|gif|jpeg|webp|svg\+xml);base64,/i;

function isUrlSafe(attr: string, value: string): boolean {
  if (attr !== 'href' && attr !== 'src') return true;
  const trimmed = value.trim();
  if (trimmed.startsWith('#') || trimmed.startsWith('/')) return true;
  return SAFE_URL_PATTERN.test(trimmed) || DATA_URL_PATTERN.test(trimmed);
}

const DANGEROUS_TAGS = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'applet',
  'base',
  'link',
  'meta',
  'noscript',
  'template',
]);

function sanitizeNode(node: Node, doc: Document): Node | null {
  if (node.nodeType === 3) {
    // Text node — always safe
    return doc.createTextNode(node.textContent ?? '');
  }

  if (node.nodeType !== 1) return null; // Skip comments, processing instructions, etc.

  const el = node as Element;
  const tagName = el.tagName.toLowerCase();

  // Dangerous tags — strip entirely including content
  if (DANGEROUS_TAGS.has(tagName)) return null;

  if (!SAFE_TAGS.has(tagName)) {
    // Unsafe tag — keep children but remove the tag itself
    const frag = doc.createDocumentFragment();
    for (const child of Array.from(el.childNodes)) {
      const cleaned = sanitizeNode(child, doc);
      if (cleaned) frag.appendChild(cleaned);
    }
    return frag;
  }

  // Safe tag — recreate with only safe attributes
  const cleanEl = doc.createElement(tagName);

  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();
    if (!SAFE_ATTRS.has(name)) continue;
    if (name.startsWith('on')) continue; // Block all event handlers
    if (!isUrlSafe(name, attr.value)) continue;
    cleanEl.setAttribute(name, attr.value);
  }

  // Recurse into children
  for (const child of Array.from(el.childNodes)) {
    const cleaned = sanitizeNode(child, doc);
    if (cleaned) cleanEl.appendChild(cleaned);
  }

  return cleanEl;
}

export const Sanitizer = {
  /**
   * Sanitize an HTML string by removing dangerous tags and attributes.
   * Uses a whitelist approach — only known-safe elements pass through.
   *
   * @param html - Raw HTML string
   * @returns Sanitized HTML string safe for innerHTML
   */
  sanitize(html: string): string {
    if (!html) return '';
    // Fast path: no HTML tags at all
    if (!/</.test(html)) return html;

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html');
    const body = doc.body;

    const frag = doc.createDocumentFragment();
    for (const child of Array.from(body.childNodes)) {
      const cleaned = sanitizeNode(child, doc);
      if (cleaned) frag.appendChild(cleaned);
    }

    const wrapper = doc.createElement('div');
    wrapper.appendChild(frag);
    return wrapper.innerHTML;
  },

  /**
   * Escape HTML special characters for safe text insertion.
   *
   * @param text - Raw text
   * @returns Escaped string safe for HTML context
   */
  escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /**
   * Check if an HTML string contains potentially dangerous content.
   *
   * @param html - HTML string to check
   * @returns true if the HTML appears safe
   */
  isSafe(html: string): boolean {
    // Check for script tags, event handlers, javascript: URLs
    const dangerous = /<script|javascript:|on\w+\s*=/i;
    return !dangerous.test(html);
  },
};
