/**
 * @ext-ts/theme – ThemeManager
 *
 * Singleton that manages registered themes.  setTheme() unapplies
 * the current theme, applies the new one, and fires 'themechange'.
 */

import type { Theme } from './Theme.js';

const themes = new Map<string, Theme>();
let activeTheme: Theme | null = null;
let activeName = '';
const listeners: Record<string, Function[]> = {};

function fire(event: string, ...args: unknown[]): void {
  (listeners[event] ?? []).forEach(fn => fn(...args));
}

export const ThemeManager = {
  register(theme: Theme): void {
    themes.set(theme.getName(), theme);
  },

  setTheme(name: string): void {
    const theme = themes.get(name);
    if (!theme) return;

    // Unapply current
    if (activeTheme) activeTheme.unapply();

    // Apply new
    activeTheme = theme;
    activeName = name;
    theme.apply();

    fire('themechange', theme, name);
  },

  getTheme(name?: string): Theme | null {
    if (name) return themes.get(name) ?? null;
    return activeTheme;
  },

  getActiveThemeName(): string {
    return activeName;
  },

  getToken(path: string): unknown {
    return activeTheme?.getToken(path) ?? undefined;
  },

  on(event: string, fn: Function): void {
    (listeners[event] ??= []).push(fn);
  },

  off(event: string, fn: Function): void {
    const list = listeners[event];
    if (!list) return;
    const idx = list.indexOf(fn);
    if (idx >= 0) list.splice(idx, 1);
  },

  reset(): void {
    if (activeTheme) activeTheme.unapply();
    activeTheme = null;
    activeName = '';
    themes.clear();
    for (const key of Object.keys(listeners)) {
      listeners[key] = [];
    }
  },
};
