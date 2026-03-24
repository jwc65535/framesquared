/**
 * @framesquared/component – CQMatcher
 *
 * Evaluates parsed CQ AST nodes against Component instances.
 * Handles simple selectors, compound selectors, all four combinators,
 * pseudo-classes, method matchers, and comma-separated OR lists.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Component } from '../Component.js';
import { CQParser } from './CQParser.js';
import type {
  SelectorNode, CompoundSelectorNode, CombinatorNode,
  SelectorListNode, SimpleSelectorNode,
} from './CQParser.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export class CQMatcher {
  /**
   * Returns true if `component` matches the selector string.
   */
  static matches(component: Component, selector: string): boolean {
    const ast = CQParser.parse(selector);
    return matchesNode(component, ast);
  }

  /**
   * Returns all descendants of `root` matching the selector string.
   */
  static query(root: Component, selector: string): Component[] {
    const ast = CQParser.parse(selector);
    const all = collectDescendants(root);
    return all.filter((c) => matchesInContext(c, ast, root));
  }
}

// ---------------------------------------------------------------------------
// Descendant collection (depth-first)
// ---------------------------------------------------------------------------

function collectDescendants(container: any): Component[] {
  const results: Component[] = [];
  const items = container.getItems?.() ?? [];
  for (const child of items) {
    results.push(child);
    if (typeof child.getItems === 'function') {
      results.push(...collectDescendants(child));
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Context-aware matching (handles combinators)
// ---------------------------------------------------------------------------

function matchesInContext(
  component: Component,
  ast: SelectorNode,
  _root: Component,
): boolean {
  if (ast.type === 'list') {
    return (ast as SelectorListNode).items.some(
      (item) => matchesInContext(component, item, _root),
    );
  }

  if (ast.type === 'compound') {
    return matchesCompound(component, ast as CompoundSelectorNode);
  }

  if (ast.type === 'combinator') {
    return matchesCombinator(component, ast as CombinatorNode);
  }

  return false;
}

// ---------------------------------------------------------------------------
// Combinator matching
// ---------------------------------------------------------------------------

function matchesCombinator(component: Component, node: CombinatorNode): boolean {
  const { combinator, left, right } = node;

  // Right side must match the component itself
  if (!matchesNode(component, right)) return false;

  switch (combinator) {
    case ' ': // descendant
      return hasAncestorMatching(component, left);

    case '>': // direct child
      return hasParentMatching(component, left);

    case '~': // general sibling
      return hasPrecedingSiblingMatching(component, left);

    case '+': // adjacent sibling
      return hasAdjacentSiblingMatching(component, left);

    default:
      return false;
  }
}

function hasAncestorMatching(component: Component, ast: SelectorNode): boolean {
  let current = (component as any).ownerCt as Component | null;
  while (current) {
    if (matchesNode(current, ast)) return true;
    current = (current as any).ownerCt;
  }
  return false;
}

function hasParentMatching(component: Component, ast: SelectorNode): boolean {
  const parent = (component as any).ownerCt as Component | null;
  if (!parent) return false;
  return matchesNode(parent, ast);
}

function hasPrecedingSiblingMatching(component: Component, ast: SelectorNode): boolean {
  const siblings = getSiblings(component);
  if (!siblings) return false;
  const myIndex = siblings.indexOf(component);
  for (let i = 0; i < myIndex; i++) {
    if (matchesNode(siblings[i], ast)) return true;
  }
  return false;
}

function hasAdjacentSiblingMatching(component: Component, ast: SelectorNode): boolean {
  const siblings = getSiblings(component);
  if (!siblings) return false;
  const myIndex = siblings.indexOf(component);
  if (myIndex <= 0) return false;
  return matchesNode(siblings[myIndex - 1], ast);
}

function getSiblings(component: Component): Component[] | null {
  const parent = (component as any).ownerCt;
  if (!parent || typeof parent.getItems !== 'function') return null;
  return parent.getItems();
}

// ---------------------------------------------------------------------------
// Node matching (dispatches to compound, combinator, list)
// ---------------------------------------------------------------------------

function matchesNode(component: Component, ast: SelectorNode): boolean {
  if (ast.type === 'compound') {
    return matchesCompound(component, ast as CompoundSelectorNode);
  }
  if (ast.type === 'combinator') {
    return matchesCombinator(component, ast as CombinatorNode);
  }
  if (ast.type === 'list') {
    return (ast as SelectorListNode).items.some(
      (item) => matchesNode(component, item),
    );
  }
  return false;
}

// ---------------------------------------------------------------------------
// Compound selector matching (all simple selectors must match)
// ---------------------------------------------------------------------------

function matchesCompound(component: Component, node: CompoundSelectorNode): boolean {
  return node.selectors.every((sel: SimpleSelectorNode) => matchesSimple(component, sel));
}

// ---------------------------------------------------------------------------
// Simple selector matching
// ---------------------------------------------------------------------------

function matchesSimple(component: Component, sel: SimpleSelectorNode): boolean {
  switch (sel.type) {
    case 'type':
      return (component as any)._config?.xtype === sel.value;

    case 'id':
      return component.componentId === sel.value;

    case 'class':
      return component.el?.classList?.contains(sel.value) ?? false;

    case 'attribute':
      return matchesAttribute(component, sel);

    case 'pseudo':
      return matchesPseudo(component, sel);

    case 'method':
      return matchesMethod(component, sel);

    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Attribute matching
// ---------------------------------------------------------------------------

function matchesAttribute(component: Component, sel: any): boolean {
  const config = (component as any)._config ?? {};
  const actual = config[sel.name];

  // Existence check (no operator)
  if (!sel.operator) {
    return actual !== undefined && actual !== null && actual !== false && actual !== '';
  }

  const expected = sel.value;

  switch (sel.operator) {
    case '=': {
      // String comparison (strip quotes from expected if present)
      const exp = expected;
      if (exp === 'true') return actual === true;
      if (exp === 'false') return actual === false;
      return String(actual) === exp;
    }
    case '!=': {
      const exp = expected;
      if (exp === 'true') return actual !== true;
      if (exp === 'false') return actual !== false;
      return String(actual) !== exp;
    }
    case '>':
      return Number(actual) > Number(expected);
    case '>=':
      return Number(actual) >= Number(expected);
    case '<':
      return Number(actual) < Number(expected);
    case '<=':
      return Number(actual) <= Number(expected);
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Pseudo-class matching
// ---------------------------------------------------------------------------

function matchesPseudo(component: Component, sel: any): boolean {
  switch (sel.name) {
    case 'not': {
      if (!sel.argument) return true;
      return !matchesNode(component, sel.argument as SelectorNode);
    }

    case 'visible':
      return typeof component.isVisible === 'function' && component.isVisible();

    case 'disabled':
      return typeof component.isDisabled === 'function' && component.isDisabled();

    case 'focusable':
      return typeof component.isFocusable === 'function' && component.isFocusable();

    case 'first-child':
      return isNthChild(component, 0);

    case 'last-child':
      return isLastChild(component);

    // Positional aliases (ExtJS compat)
    case 'first':
      return isNthChild(component, 0);

    case 'last':
      return isLastChild(component);

    case 'nth-child': {
      const n = parseInt(sel.argument as string, 10);
      if (Number.isNaN(n)) return false;
      return isNthChild(component, n - 1); // 1-based to 0-based
    }

    default:
      return false;
  }
}

function isNthChild(component: Component, index: number): boolean {
  const siblings = getSiblings(component);
  if (!siblings) return false;
  return siblings[index] === component;
}

function isLastChild(component: Component): boolean {
  const siblings = getSiblings(component);
  if (!siblings || siblings.length === 0) return false;
  return siblings[siblings.length - 1] === component;
}

// ---------------------------------------------------------------------------
// Method matching: {methodName}
// ---------------------------------------------------------------------------

function matchesMethod(component: Component, sel: any): boolean {
  const methodName = sel.value;
  const fn = (component as any)[methodName];
  if (typeof fn !== 'function') return false;
  return !!fn.call(component);
}
