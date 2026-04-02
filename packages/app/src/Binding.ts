/**
 * @framesquared/app – Binding
 *
 * Parses and evaluates binding expressions that connect ViewModel
 * data to component configs.  Supports simple paths, negation,
 * expression templates, and two-way binding.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ViewModel } from './ViewModel.js';

// ---------------------------------------------------------------------------
// Parsed binding
// ---------------------------------------------------------------------------

export interface ParsedBinding {
  paths: string[];
  negated: boolean;
  expression: boolean;
  template: string;
}

// ---------------------------------------------------------------------------
// Binding
// ---------------------------------------------------------------------------

const PATH_RE = /\{(!?)([^}]+)\}/g;

export const Binding = {
  /**
   * Parse a binding expression string.
   *
   * - `'{name}'`            → simple path
   * - `'{!isAdmin}'`        → negated path
   * - `'{firstName} {last}'` → expression with multiple paths
   * - `'{user.email}'`      → nested path
   */
  parse(expr: string): ParsedBinding {
    const paths: string[] = [];
    let negated = false;
    let match: RegExpExecArray | null;
    const re = new RegExp(PATH_RE.source, PATH_RE.flags);

    while ((match = re.exec(expr)) !== null) {
      if (match[1] === '!') negated = true;
      paths.push(match[2]);
    }

    const expression = paths.length > 1 || expr.replace(PATH_RE, '').trim().length > 0;

    return { paths, negated, expression, template: expr };
  },

  /**
   * Evaluate a parsed binding against a ViewModel.
   */
  evaluate(binding: ParsedBinding, vm: ViewModel): unknown {
    if (binding.expression) {
      // Template expression: replace each {path} with its value
      return binding.template.replace(PATH_RE, (_match, _neg, path) => {
        const val = vm.get(path);
        return val === null || val === undefined ? '' : String(val);
      });
    }

    // Single path
    const value = vm.get(binding.paths[0]);
    if (binding.negated) return !value;
    return value;
  },

  /**
   * Create a two-way binding.  Calls `onChange` whenever the path
   * changes in the ViewModel.  Returns a cleanup function.
   */
  twoWay(vm: ViewModel, path: string, onChange: (value: unknown) => void): () => void {
    const handler = () => {
      onChange(vm.get(path));
    };
    vm.on('datachange', handler);
    return () => vm.un('datachange', handler);
  },

  /**
   * Multi-bind: bind to multiple paths, callback receives all values
   * as an array whenever any path changes.
   */
  multiBind(vm: ViewModel, paths: string[], onChange: (values: unknown[]) => void): () => void {
    const handler = () => {
      onChange(paths.map((p) => vm.get(p)));
    };
    vm.on('datachange', handler);
    return () => vm.un('datachange', handler);
  },

  /**
   * Deep bind: notifies when any nested property under the given
   * path changes.  Uses the datachange event (fires on every set).
   */
  deepBind(vm: ViewModel, path: string, onChange: (value: unknown) => void): () => void {
    const handler = () => {
      onChange(vm.get(path));
    };
    vm.on('datachange', handler);
    return () => vm.un('datachange', handler);
  },
};
