/**
 * @framesquared/core – LocaleManager
 *
 * Singleton that manages registered locales.  setLocale() applies
 * dir and lang attributes to document.documentElement and fires
 * 'localechange'.
 */

import type { Locale } from './Locale.js';

const locales = new Map<string, Locale>();
let activeLocale: Locale | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const listeners: Record<string, ((...args: any[]) => void)[]> = {};

function fire(event: string, ...args: unknown[]): void {
  (listeners[event] ?? []).forEach((fn) => fn(...args));
}

export const LocaleManager = {
  register(locale: Locale): void {
    locales.set(locale.getLanguage(), locale);
  },

  setLocale(language: string): void {
    const locale = locales.get(language);
    if (!locale) return;
    activeLocale = locale;

    // Apply to document
    const root = document.documentElement;
    root.setAttribute('lang', language);
    root.setAttribute('dir', locale.getDirection());

    fire('localechange', locale, language);
  },

  getLocale(): Locale | null {
    return activeLocale;
  },

  t(key: string, params?: Record<string, unknown>): string {
    if (!activeLocale) return key;
    return activeLocale.t(key, params);
  },

  getDirection(): 'ltr' | 'rtl' {
    return activeLocale?.getDirection() ?? 'ltr';
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
    activeLocale = null;
    locales.clear();
    for (const key of Object.keys(listeners)) listeners[key] = [];
    document.documentElement.removeAttribute('dir');
    document.documentElement.removeAttribute('lang');
  },
};
