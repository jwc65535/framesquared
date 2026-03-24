/**
 * @ext-ts/component – CQ (Component Query static API)
 *
 * Static convenience API for querying component trees.
 */

import type { Component } from '../Component.js';
import { CQMatcher } from './CQMatcher.js';

export class CQ {
  /**
   * Finds all components matching the selector under the given root.
   */
  static query(selector: string, root?: Component): Component[] {
    if (!root) return [];
    return CQMatcher.query(root, selector);
  }

  /**
   * Returns true if the component matches the selector.
   */
  static is(component: Component, selector: string): boolean {
    return CQMatcher.matches(component, selector);
  }
}
