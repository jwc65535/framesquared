/**
 * @framesquared/layout – ResponsivePlugin
 *
 * Monitors viewport size using window.matchMedia() and applies
 * different component configs at different breakpoints.
 *
 * Supports both standard media queries and shorthand expressions:
 *   '(max-width: 599px)'              → standard CSS media query
 *   'width < 600'                      → parsed to (max-width: 599px)
 *   'width >= 600 && width < 1024'    → parsed to (min-width: 600px) and (max-width: 1023px)
 *   'width >= 1024'                   → parsed to (min-width: 1024px)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Component } from '@framesquared/component';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ResponsiveConfig {
  responsiveConfig: Record<string, Record<string, unknown>>;
}

interface MediaEntry {
  query: string;
  mql: MediaQueryList;
  config: Record<string, unknown>;
  handler: (e: { matches: boolean }) => void;
}

// ---------------------------------------------------------------------------
// Expression → media query conversion
// ---------------------------------------------------------------------------

function toMediaQuery(expr: string): string {
  // Already a media query (starts with '(' or '@media')
  if (expr.startsWith('(') || expr.startsWith('@media')) return expr;

  // Parse shorthand: 'width < 600', 'width >= 600 && width < 1024', etc.
  const parts = expr.split('&&').map((s) => s.trim());
  const conditions: string[] = [];

  for (const part of parts) {
    const m = part.match(/^width\s*(>=?|<=?|==)\s*(\d+)$/);
    if (!m) {
      // Pass through as-is wrapped in parens
      conditions.push(`(${part})`);
      continue;
    }
    const op = m[1];
    const val = parseInt(m[2], 10);

    switch (op) {
      case '<':
        conditions.push(`(max-width: ${val - 1}px)`);
        break;
      case '<=':
        conditions.push(`(max-width: ${val}px)`);
        break;
      case '>':
        conditions.push(`(min-width: ${val + 1}px)`);
        break;
      case '>=':
        conditions.push(`(min-width: ${val}px)`);
        break;
      case '==':
        conditions.push(`(width: ${val}px)`);
        break;
    }
  }

  return conditions.join(' and ');
}

// ---------------------------------------------------------------------------
// Applying config to a component
// ---------------------------------------------------------------------------

function applyConfig(owner: Component, config: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(config)) {
    switch (key) {
      case 'cls':
        if (typeof value === 'string') owner.addCls(value);
        break;
      case 'hidden':
        if (value) owner.hide();
        else owner.show();
        break;
      case 'disabled':
        if (value) owner.disable();
        else owner.enable();
        break;
      case 'width':
        if (typeof value === 'number' || typeof value === 'string') owner.setWidth(value);
        break;
      case 'height':
        if (typeof value === 'number' || typeof value === 'string') owner.setHeight(value);
        break;
      default:
        // Store on _config for layouts / queries to read
        (owner as any)._config[key] = value;
        break;
    }
  }
}

// ---------------------------------------------------------------------------
// Remove previously applied cls
// ---------------------------------------------------------------------------

function removeClsConfig(owner: Component, config: Record<string, unknown>): void {
  if (config.cls && typeof config.cls === 'string') {
    owner.removeCls(config.cls);
  }
}

// ---------------------------------------------------------------------------
// ResponsivePlugin
// ---------------------------------------------------------------------------

export class ResponsivePlugin {
  private config: ResponsiveConfig;
  private owner: Component | null = null;
  private entries: MediaEntry[] = [];
  private activeConfigs = new Set<Record<string, unknown>>();

  constructor(config: ResponsiveConfig) {
    this.config = config;
  }

  getOwner(): Component | null {
    return this.owner;
  }

  /**
   * Initialise the plugin with its owner component.
   * Sets up matchMedia listeners and applies initial state.
   */
  init(owner: Component): void {
    this.owner = owner;

    for (const [expr, cfg] of Object.entries(this.config.responsiveConfig)) {
      const query = toMediaQuery(expr);
      const mql = window.matchMedia(query);

      const handler = (e: { matches: boolean }) => {
        if (e.matches) {
          applyConfig(owner, cfg);
          this.activeConfigs.add(cfg);
        } else {
          removeClsConfig(owner, cfg);
          this.activeConfigs.delete(cfg);
        }
      };

      this.entries.push({ query, mql, config: cfg, handler });
      mql.addEventListener('change', handler as any);

      // Apply initial state
      if (mql.matches) {
        applyConfig(owner, cfg);
        this.activeConfigs.add(cfg);
      }
    }
  }

  /**
   * Clean up all media query listeners.
   */
  destroy(): void {
    for (const entry of this.entries) {
      entry.mql.removeEventListener('change', entry.handler as any);
    }
    this.entries.length = 0;
    this.activeConfigs.clear();
    this.owner = null;
  }
}
