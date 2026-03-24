/**
 * @framesquared/component – ComponentQuery
 *
 * Backward-compatible wrapper that delegates to the new AST-based CQ engine.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Component } from './Component.js';
import { CQMatcher } from './query/CQMatcher.js';

/**
 * Tests if a component matches a simple selector. Used by Container.child()
 * and Component.up().
 */
export function matchesCQ(cmp: Component, selector: string): boolean {
  try {
    return CQMatcher.matches(cmp, selector);
  } catch {
    return false;
  }
}

/**
 * Legacy ComponentQuery class — delegates to CQMatcher.
 */
export class ComponentQuery {
  static query(root: any, selector: string): Component[] {
    try {
      selector = selector.trim();
      // Special case: "> selector" means direct children only
      if (selector.startsWith('>')) {
        const innerSel = selector.slice(1).trim();
        const items = root.getItems?.() ?? [];
        return items.filter((child: Component) => {
          try {
            return CQMatcher.matches(child, innerSel);
          } catch {
            return false;
          }
        });
      }
      return CQMatcher.query(root, selector);
    } catch {
      return [];
    }
  }
}
