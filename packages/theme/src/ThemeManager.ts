/**
 * @framesquared/theme – ThemeManager
 *
 * Singleton that manages registered themes.  setTheme() unapplies
 * the current theme, applies the new one, and fires 'themechange'.
 *
 * Additional APIs:
 *   setAutoTheme(light, dark) — auto-switch via prefers-color-scheme
 *   createScope(element, name) — apply a theme to a subtree element
 */

import type { Theme } from './Theme.js';

// ---------------------------------------------------------------------------
// Public interface for scoped themes
// ---------------------------------------------------------------------------

export interface ThemeScope {
  /** Swap the theme applied to this scope's element. */
  update(themeName: string): void;
  /** Remove all scoped CSS vars from the element and unregister the scope. */
  destroy(): void;
}

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

const themes = new Map<string, Theme>();
let activeTheme: Theme | null = null;
let activeName = '';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const listeners: Record<string, ((...args: any[]) => void)[]> = {};

// Auto-theme (prefers-color-scheme) state
let _autoMode = false;
let _autoMql: MediaQueryList | null = null;
let _autoHandler: ((e: MediaQueryListEvent) => void) | null = null;

// Active scopes — tracked so reset() can destroy them all
const _scopes = new Set<ThemeScope>();

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function fire(event: string, ...args: unknown[]): void {
  (listeners[event] ?? []).forEach((fn) => fn(...args));
}

function clearAutoTheme(): void {
  if (_autoMql && _autoHandler) {
    _autoMql.removeEventListener('change', _autoHandler);
  }
  _autoMql = null;
  _autoHandler = null;
  _autoMode = false;
}

// ---------------------------------------------------------------------------
// ThemeManager
// ---------------------------------------------------------------------------

export const ThemeManager = {
  register(theme: Theme): void {
    themes.set(theme.getName(), theme);
  },

  /**
   * Activate a theme by name.  Cancels any active auto-theme mode so that
   * a manual call always takes precedence over prefers-color-scheme.
   */
  setTheme(name: string): void {
    // Manual call cancels auto mode.
    if (_autoMode) clearAutoTheme();

    const theme = themes.get(name);
    if (!theme) return;

    if (activeTheme) activeTheme.unapply();

    activeTheme = theme;
    activeName = name;
    theme.apply();

    fire('themechange', theme, name);
  },

  /**
   * Automatically switch between two themes based on the OS
   * `prefers-color-scheme` media query.
   *
   * Switches immediately to match the current OS preference, then listens
   * for changes.  Calling `setTheme()` manually afterwards cancels auto mode.
   *
   * Does nothing in environments that lack `window.matchMedia` (e.g. SSR).
   */
  setAutoTheme(lightThemeName: string, darkThemeName: string): void {
    // Tear down any previous auto setup.
    clearAutoTheme();

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      // SSR / headless — fall back to light theme silently.
      ThemeManager.setTheme(lightThemeName);
      return;
    }

    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = (e: MediaQueryListEvent) => {
      // Guard: if auto mode was cancelled (e.g. by a manual setTheme call)
      // between the removeEventListener call and the event firing, bail out.
      if (!_autoMode) return;
      const name = e.matches ? darkThemeName : lightThemeName;
      const theme = themes.get(name);
      if (!theme) return;
      if (activeTheme) activeTheme.unapply();
      activeTheme = theme;
      activeName = name;
      theme.apply();
      fire('themechange', theme, name);
      fire('autoThemeChange', theme, name);
    };

    mql.addEventListener('change', handler);
    _autoMql = mql;
    _autoHandler = handler;
    _autoMode = true;

    // Apply immediately without going through setTheme() so we don't
    // accidentally cancel auto mode via the manual-call guard.
    const initialName = mql.matches ? darkThemeName : lightThemeName;
    const initialTheme = themes.get(initialName);
    if (initialTheme) {
      if (activeTheme) activeTheme.unapply();
      activeTheme = initialTheme;
      activeName = initialName;
      initialTheme.apply();
      fire('themechange', initialTheme, initialName);
    }
  },

  /**
   * Apply a named theme to a specific DOM element (scoped theme).
   *
   * The returned `ThemeScope` object lets you swap or remove the scoped
   * theme without affecting the global `:root` theme.
   *
   * @throws if `themeName` has not been registered.
   */
  createScope(element: HTMLElement, themeName: string): ThemeScope {
    const theme = themes.get(themeName);
    if (!theme) throw new Error(`Theme "${themeName}" is not registered.`);

    let appliedVarNames = theme.apply(element);

    const scope: ThemeScope = {
      update(newThemeName: string) {
        const newTheme = themes.get(newThemeName);
        if (!newTheme) throw new Error(`Theme "${newThemeName}" is not registered.`);
        // Remove old vars from element.
        for (const v of appliedVarNames) element.style.removeProperty(v);
        // Apply new theme to element.
        appliedVarNames = newTheme.apply(element);
      },
      destroy() {
        for (const v of appliedVarNames) element.style.removeProperty(v);
        appliedVarNames = [];
        _scopes.delete(scope);
      },
    };

    _scopes.add(scope);
    return scope;
  },

  getTheme(name?: string): Theme | null {
    if (name) return themes.get(name) ?? null;
    return activeTheme;
  },

  getActiveThemeName(): string {
    return activeName;
  },

  /** Returns true when auto-theme mode is active. */
  isAutoTheme(): boolean {
    return _autoMode;
  },

  getToken(path: string): unknown {
    return activeTheme?.getToken(path) ?? undefined;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, fn: (...args: any[]) => void): void {
    (listeners[event] ??= []).push(fn);
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(event: string, fn: (...args: any[]) => void): void {
    const list = listeners[event];
    if (!list) return;
    const idx = list.indexOf(fn);
    if (idx >= 0) list.splice(idx, 1);
  },

  reset(): void {
    clearAutoTheme();
    // Destroy all active scopes.
    for (const scope of _scopes) scope.destroy();
    _scopes.clear();
    if (activeTheme) activeTheme.unapply();
    activeTheme = null;
    activeName = '';
    themes.clear();
    for (const key of Object.keys(listeners)) {
      listeners[key] = [];
    }
  },
};
