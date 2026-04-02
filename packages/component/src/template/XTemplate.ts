/**
 * @framesquared/component – XTemplate
 *
 * A powerful template engine inspired by ExtJS's XTemplate.
 *
 * Features:
 *  - `{field}` interpolation with dot paths
 *  - `{field:format}` built-in format functions
 *  - `<tpl if="expr">`, `<tpl elseif="expr">`, `<tpl else>`
 *  - `<tpl for="field">` loops with `{.}`, `{#}`, `{[xindex]}`, `{[xcount]}`, `{parent.x}`
 *  - `{[expression]}` inline JS expressions (`values` = current scope)
 *  - `{[this.method(...)]}` template member functions
 *  - Compiled to a JS function for fast repeat rendering
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Built-in format functions
// ---------------------------------------------------------------------------

const HTML_ENCODE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
const HTML_DECODE_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

function htmlEncode(v: unknown): string {
  return String(v ?? '').replace(/[&<>"']/g, (ch) => HTML_ENCODE_MAP[ch] ?? ch);
}

function htmlDecode(v: unknown): string {
  return String(v ?? '').replace(
    /&amp;|&lt;|&gt;|&quot;|&#39;/g,
    (ent) => HTML_DECODE_MAP[ent] ?? ent,
  );
}

const FORMAT_FNS: Record<string, (value: any, arg?: string) => string> = {
  htmlEncode: (v) => htmlEncode(v),
  htmlDecode: (v) => htmlDecode(v),
  trim: (v) => String(v ?? '').trim(),
  uppercase: (v) => String(v ?? '').toUpperCase(),
  lowercase: (v) => String(v ?? '').toLowerCase(),
  capitalize: (v) => {
    const s = String(v ?? '');
    return s.charAt(0).toUpperCase() + s.slice(1);
  },
  ellipsis: (v, arg) => {
    const s = String(v ?? '');
    const max = parseInt(arg ?? '0', 10);
    if (max <= 0 || s.length <= max) return s;
    return s.slice(0, max - 3) + '...';
  },
  round: (v, arg) => {
    const n = Number(v);
    const decimals = parseInt(arg ?? '0', 10);
    return n.toFixed(decimals);
  },
  number: (v) => String(Number(v)),
  currency: (v) => {
    const n = Number(v);
    return n.toFixed(2);
  },
  usMoney: (v) => {
    const n = Number(v);
    const formatted = n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return n < 0 ? `-$${formatted.slice(1)}` : `$${formatted}`;
  },
  fileSize: (v) => {
    const n = Number(v);
    if (n >= 1073741824) return `${(n / 1073741824).toFixed(1)} GB`;
    if (n >= 1048576) return `${(n / 1048576).toFixed(0)} MB`;
    if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`;
    return `${n} bytes`;
  },
  plural: (v, arg) => {
    const n = Number(v);
    const word = (arg ?? '').replace(/^["']|["']$/g, '');
    return n === 1 ? `${n} ${word}` : `${n} ${word}s`;
  },
  date: (v) => {
    const d = v instanceof Date ? v : new Date(String(v));
    return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('en-US');
  },
};

// ---------------------------------------------------------------------------
// AST node types
// ---------------------------------------------------------------------------

interface TextNode {
  type: 'text';
  value: string;
}
interface InterpNode {
  type: 'interp';
  path: string;
  format?: string;
  formatArg?: string;
}
interface ExprNode {
  type: 'expr';
  code: string;
}
interface IfNode {
  type: 'if';
  condition: string;
  body: AstNode[];
  elseifs: { condition: string; body: AstNode[] }[];
  elseBody: AstNode[];
}
interface ForNode {
  type: 'for';
  field: string;
  body: AstNode[];
}

type AstNode = TextNode | InterpNode | ExprNode | IfNode | ForNode;

// ---------------------------------------------------------------------------
// Parser: template string → AST
// ---------------------------------------------------------------------------

function parseTemplate(src: string): AstNode[] {
  const nodes: AstNode[] = [];
  let pos = 0;

  while (pos < src.length) {
    // Check for <tpl ...>
    const tplMatch = matchTplOpen(src, pos);
    if (tplMatch) {
      const { tag, end } = tplMatch;
      if (tag.startsWith('if=')) {
        const result = parseIf(src, tag, end);
        nodes.push(result.node);
        pos = result.pos;
        continue;
      }
      if (tag.startsWith('for=')) {
        const result = parseFor(src, tag, end);
        nodes.push(result.node);
        pos = result.pos;
        continue;
      }
    }

    // Check for {[expr]}
    if (src[pos] === '{' && pos + 1 < src.length && src[pos + 1] === '[') {
      const closeIdx = src.indexOf(']}', pos + 2);
      if (closeIdx !== -1) {
        nodes.push({ type: 'expr', code: src.slice(pos + 2, closeIdx) });
        pos = closeIdx + 2;
        continue;
      }
    }

    // Check for {field} or {field:format}
    if (src[pos] === '{') {
      const closeIdx = findClosingBrace(src, pos);
      if (closeIdx !== -1) {
        const inner = src.slice(pos + 1, closeIdx);
        nodes.push(parseInterp(inner));
        pos = closeIdx + 1;
        continue;
      }
    }

    // Plain text — consume until next { or <tpl
    let textEnd = pos + 1;
    while (textEnd < src.length) {
      if (src[textEnd] === '{') break;
      if (src[textEnd] === '<' && src.slice(textEnd, textEnd + 4) === '<tpl') break;
      textEnd++;
    }
    nodes.push({ type: 'text', value: src.slice(pos, textEnd) });
    pos = textEnd;
  }

  return nodes;
}

function findClosingBrace(src: string, start: number): number {
  // Simple brace matching (no nesting for {field})
  for (let i = start + 1; i < src.length; i++) {
    if (src[i] === '}') return i;
  }
  return -1;
}

function parseInterp(inner: string): InterpNode {
  // {path:format(arg)} or {path:format} or {path}
  const colonIdx = inner.indexOf(':');
  if (colonIdx === -1) {
    return { type: 'interp', path: inner.trim() };
  }
  const path = inner.slice(0, colonIdx).trim();
  const rest = inner.slice(colonIdx + 1).trim();
  const parenIdx = rest.indexOf('(');
  if (parenIdx !== -1) {
    const format = rest.slice(0, parenIdx);
    const arg = rest.slice(parenIdx + 1, rest.lastIndexOf(')'));
    return { type: 'interp', path, format, formatArg: arg };
  }
  return { type: 'interp', path, format: rest };
}

// ---------------------------------------------------------------------------
// <tpl> tag matching
// ---------------------------------------------------------------------------

interface TplOpenResult {
  tag: string;
  end: number;
}

function matchTplOpen(src: string, pos: number): TplOpenResult | null {
  if (src.slice(pos, pos + 4) !== '<tpl') return null;
  // Find closing > respecting quotes
  let i = pos + 4;
  let inQuote: string | null = null;
  while (i < src.length) {
    const ch = src[i];
    if (inQuote) {
      if (ch === inQuote) inQuote = null;
    } else {
      if (ch === '"' || ch === "'") inQuote = ch;
      else if (ch === '>') {
        const tagContent = src.slice(pos + 5, i).trim();
        return { tag: tagContent, end: i + 1 };
      }
    }
    i++;
  }
  return null;
}

function findClosingTpl(src: string, pos: number): number {
  let depth = 1;
  let i = pos;
  while (i < src.length && depth > 0) {
    // Check for </tpl>
    if (src.slice(i, i + 6) === '</tpl>') {
      depth--;
      if (depth === 0) return i;
      i += 6;
      continue;
    }
    // Check for <tpl
    if (src.slice(i, i + 4) === '<tpl') {
      // Find the close of this tag (quote-aware)
      const tagEnd = findTplTagEnd(src, i + 4);
      if (tagEnd === -1) {
        i++;
        continue;
      }
      const tagContent = src.slice(i + 4, tagEnd).trim();

      // <tpl else> or <tpl elseif="..."> at our depth — don't change depth
      if (depth === 1 && (tagContent === 'else' || tagContent.startsWith('elseif'))) {
        i = tagEnd + 1;
        continue;
      }
      // Otherwise it's a new nested <tpl> — increment depth
      depth++;
      i = tagEnd + 1;
      continue;
    }
    i++;
  }
  return src.length;
}

function findTplTagEnd(src: string, start: number): number {
  let i = start;
  let inQuote: string | null = null;
  while (i < src.length) {
    const ch = src[i];
    if (inQuote) {
      if (ch === inQuote) inQuote = null;
    } else {
      if (ch === '"' || ch === "'") inQuote = ch;
      else if (ch === '>') return i;
    }
    i++;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// If parsing
// ---------------------------------------------------------------------------

function parseIf(src: string, tag: string, bodyStart: number): { node: IfNode; pos: number } {
  const condition = extractQuoted(tag.slice(3)); // after "if="
  const closeTpl = findClosingTpl(src, bodyStart);
  const innerSrc = src.slice(bodyStart, closeTpl);

  // Split on <tpl elseif="..."> and <tpl else>
  const branches = splitBranches(innerSrc);

  const node: IfNode = {
    type: 'if',
    condition,
    body: parseTemplate(branches.ifBody),
    elseifs: branches.elseifs.map((ei) => ({
      condition: ei.condition,
      body: parseTemplate(ei.body),
    })),
    elseBody: branches.elseBody ? parseTemplate(branches.elseBody) : [],
  };

  return { node, pos: closeTpl + 6 }; // skip </tpl>
}

function extractQuoted(s: string): string {
  s = s.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

interface BranchSplit {
  ifBody: string;
  elseifs: { condition: string; body: string }[];
  elseBody: string | null;
}

function splitBranches(inner: string): BranchSplit {
  const result: BranchSplit = { ifBody: '', elseifs: [], elseBody: null };
  const parts: { type: 'if' | 'elseif' | 'else'; condition?: string; start: number }[] = [];
  let i = 0;
  let depth = 0;

  while (i < inner.length) {
    // Check for </tpl>
    if (inner.slice(i, i + 6) === '</tpl>') {
      depth--;
      i += 6;
      continue;
    }
    if (inner.slice(i, i + 4) === '<tpl') {
      const tagEnd = findTplTagEnd(inner, i + 4);
      if (tagEnd === -1) {
        i++;
        continue;
      }
      const tagContent = inner.slice(i + 4, tagEnd).trim();

      if (depth === 0) {
        if (tagContent.startsWith('elseif=')) {
          parts.push({
            type: 'elseif',
            condition: extractQuoted(tagContent.slice(7)),
            start: tagEnd + 1,
          });
          i = tagEnd + 1;
          continue;
        }
        if (tagContent === 'else') {
          parts.push({ type: 'else', start: tagEnd + 1 });
          i = tagEnd + 1;
          continue;
        }
      }
      depth++;
      i = tagEnd + 1;
      continue;
    }
    i++;
  }

  if (parts.length === 0) {
    result.ifBody = inner;
  } else {
    result.ifBody = inner.slice(0, findTplTagBefore(inner, parts[0].start));
    for (let p = 0; p < parts.length; p++) {
      const part = parts[p];
      const bodyEnd =
        p + 1 < parts.length ? findTplTagBefore(inner, parts[p + 1].start) : inner.length;
      const body = inner.slice(part.start, bodyEnd);
      if (part.type === 'elseif') {
        result.elseifs.push({ condition: part.condition!, body });
      } else {
        result.elseBody = body;
      }
    }
  }

  return result;
}

function findTplTagBefore(src: string, contentStart: number): number {
  // Walk back from contentStart to find the opening < of <tpl
  let i = contentStart - 1;
  while (i >= 0 && src[i] !== '<') i--;
  return Math.max(0, i);
}

// ---------------------------------------------------------------------------
// For parsing
// ---------------------------------------------------------------------------

function parseFor(src: string, tag: string, bodyStart: number): { node: ForNode; pos: number } {
  const field = extractQuoted(tag.slice(4)); // after "for="
  const closeTpl = findClosingTpl(src, bodyStart);
  const body = parseTemplate(src.slice(bodyStart, closeTpl));
  return { node: { type: 'for', field, body }, pos: closeTpl + 6 };
}

// ---------------------------------------------------------------------------
// Evaluator: AST + data → string
// ---------------------------------------------------------------------------

function evaluate(
  nodes: AstNode[],
  data: any,
  parentData: any,
  xindex: number,
  xcount: number,
  memberFns: Record<string, Function>,
): string {
  let result = '';
  for (const node of nodes) {
    switch (node.type) {
      case 'text':
        result += node.value;
        break;
      case 'interp':
        result += evalInterp(node, data, parentData, xindex, xcount);
        break;
      case 'expr':
        result += evalExpr(node.code, data, parentData, xindex, xcount, memberFns);
        break;
      case 'if':
        result += evalIf(node, data, parentData, xindex, xcount, memberFns);
        break;
      case 'for':
        result += evalFor(node, data, parentData, xindex, xcount, memberFns);
        break;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Interpolation evaluation
// ---------------------------------------------------------------------------

function evalInterp(
  node: InterpNode,
  data: any,
  _parentData: any,
  xindex: number,
  _xcount: number,
): string {
  let value: unknown;

  if (node.path === '.') {
    // Current value — unwrap PrimitiveScope
    value = data instanceof PrimitiveScope ? data._value : data;
  } else if (node.path === '#') {
    value = xindex;
  } else {
    value = resolve(data, node.path);
  }

  if (value === undefined || value === null) return '';

  let str = String(value);

  if (node.format && FORMAT_FNS[node.format]) {
    str = FORMAT_FNS[node.format](value, node.formatArg);
  }

  return str;
}

function resolve(data: any, path: string): unknown {
  if (!data || !path) return undefined;
  const parts = path.split('.');
  let current: any = data;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object' && typeof current !== 'function') return undefined;
    current = current[part];
  }
  return current;
}

// ---------------------------------------------------------------------------
// Expression evaluation
// ---------------------------------------------------------------------------

function evalExpr(
  code: string,
  data: any,
  _parentData: any,
  xindex: number,
  xcount: number,
  memberFns: Record<string, Function>,
): string {
  try {
    // Create a scope with `values`, `xindex`, `xcount`, and `this` bound to memberFns
    const fn = new Function('values', 'xindex', 'xcount', `"use strict"; return (${code});`);
    const result = fn.call(memberFns, data, xindex, xcount);
    return result === undefined || result === null ? '' : String(result);
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Conditional evaluation
// ---------------------------------------------------------------------------

function evalIf(
  node: IfNode,
  data: any,
  parentData: any,
  xindex: number,
  xcount: number,
  memberFns: Record<string, Function>,
): string {
  if (evalCondition(node.condition, data)) {
    return evaluate(node.body, data, parentData, xindex, xcount, memberFns);
  }
  for (const ei of node.elseifs) {
    if (evalCondition(ei.condition, data)) {
      return evaluate(ei.body, data, parentData, xindex, xcount, memberFns);
    }
  }
  return evaluate(node.elseBody, data, parentData, xindex, xcount, memberFns);
}

function evalCondition(condition: string, data: any): boolean {
  try {
    // Create a function that has all data properties in scope
    const keys = Object.keys(data ?? {});
    const vals = keys.map((k) => data[k]);
    const fn = new Function(...keys, `"use strict"; return !!(${condition});`);
    return fn(...vals);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Loop evaluation
// ---------------------------------------------------------------------------

function evalFor(
  node: ForNode,
  data: any,
  _parentData: any,
  _xindex: number,
  _xcount: number,
  memberFns: Record<string, Function>,
): string {
  let arr: any[];
  if (node.field === '.') {
    arr = Array.isArray(data) ? data : [];
  } else {
    arr = resolve(data, node.field) as any[];
    if (!Array.isArray(arr)) return '';
  }

  let result = '';
  const count = arr.length;

  for (let i = 0; i < count; i++) {
    const item = arr[i];
    let scope: any;
    if (item !== null && typeof item === 'object') {
      scope = { ...item, parent: data };
    } else {
      // For primitive values, create a scope object that supports
      // {.} via the evaluate path and {parent.x} via parent key
      scope = new PrimitiveScope(item, data);
    }
    result += evaluate(node.body, scope, data, i + 1, count, memberFns);
  }

  return result;
}

/** Wrapper for primitive loop values that supports {parent.x} lookups. */
class PrimitiveScope {
  readonly _value: any;
  readonly parent: any;
  constructor(value: any, parentData: any) {
    this._value = value;
    this.parent = parentData;
  }
}

// ---------------------------------------------------------------------------
// XTemplate class
// ---------------------------------------------------------------------------

export class XTemplate {
  private source: string;
  private memberFns: Record<string, Function>;
  private ast: AstNode[] | null = null;

  constructor(source: string, memberFns?: Record<string, Function>) {
    this.source = source;
    this.memberFns = memberFns ?? {};
  }

  /**
   * Pre-compiles the template. Called automatically on first apply().
   */
  compile(): void {
    if (!this.ast) {
      this.ast = parseTemplate(this.source);
    }
  }

  /**
   * Applies data to the template and returns the resulting HTML string.
   */
  apply(data: any): string {
    this.compile();
    return evaluate(this.ast!, data, null, 0, 0, this.memberFns);
  }

  /**
   * Applies data and appends the resulting HTML to an element.
   */
  append(el: Element, data: any): void {
    el.innerHTML += this.apply(data);
  }
}
