import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Locale } from '../src/locale/Locale.js';
import { LocaleManager } from '../src/locale/LocaleManager.js';
import { enUS } from '../src/locale/bundles/en-US.js';
import { esES } from '../src/locale/bundles/es-ES.js';
import { arSA } from '../src/locale/bundles/ar-SA.js';

afterEach(() => {
  LocaleManager.reset();
  document.documentElement.removeAttribute('dir');
  document.documentElement.removeAttribute('lang');
});

// ═══════════════════════════════════════════════════════════════════════════
// Locale — basics
// ═══════════════════════════════════════════════════════════════════════════

describe('Locale — basics', () => {
  it('creates with language tag', () => {
    const loc = new Locale({ language: 'en-US', messages: {} });
    expect(loc.getLanguage()).toBe('en-US');
  });

  it('t() returns translated string', () => {
    const loc = new Locale({
      language: 'en-US',
      messages: { 'btn.ok': 'OK', 'btn.cancel': 'Cancel' },
    });
    expect(loc.t('btn.ok')).toBe('OK');
    expect(loc.t('btn.cancel')).toBe('Cancel');
  });

  it('t() returns key when translation missing', () => {
    const loc = new Locale({ language: 'en-US', messages: {} });
    expect(loc.t('missing.key')).toBe('missing.key');
  });

  it('t() with parameter substitution', () => {
    const loc = new Locale({
      language: 'en-US',
      messages: { greeting: 'Hello, {name}! You have {count} items.' },
    });
    expect(loc.t('greeting', { name: 'Alice', count: 5 })).toBe('Hello, Alice! You have 5 items.');
  });

  it('t() handles multiple occurrences of same param', () => {
    const loc = new Locale({
      language: 'en-US',
      messages: { repeat: '{x} and {x}' },
    });
    expect(loc.t('repeat', { x: 'foo' })).toBe('foo and foo');
  });

  it('getDirection returns ltr by default', () => {
    const loc = new Locale({ language: 'en-US', messages: {} });
    expect(loc.getDirection()).toBe('ltr');
  });

  it('getDirection returns rtl when configured', () => {
    const loc = new Locale({ language: 'ar-SA', messages: {}, rtl: true });
    expect(loc.getDirection()).toBe('rtl');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Locale — number formatting
// ═══════════════════════════════════════════════════════════════════════════

describe('Locale — number formatting', () => {
  it('formats number with locale', () => {
    const loc = new Locale({ language: 'en-US', messages: {} });
    const formatted = loc.formatNumber(1234.56);
    expect(formatted).toContain('1');
    expect(formatted).toContain('234');
  });

  it('formats currency', () => {
    const loc = new Locale({
      language: 'en-US',
      messages: {},
      numberFormat: { currency: 'USD' },
    });
    const formatted = loc.formatCurrency(99.99);
    expect(formatted).toContain('99.99');
  });

  it('different locale uses different separators', () => {
    const loc = new Locale({ language: 'de-DE', messages: {} });
    const formatted = loc.formatNumber(1234.56);
    // German uses dot as thousands separator and comma as decimal
    expect(formatted).toContain('1.234');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Locale — date formatting
// ═══════════════════════════════════════════════════════════════════════════

describe('Locale — date formatting', () => {
  it('formats date with locale', () => {
    const loc = new Locale({ language: 'en-US', messages: {} });
    const d = new Date(2024, 0, 15); // Jan 15, 2024
    const formatted = loc.formatDate(d);
    expect(formatted).toContain('2024');
    expect(formatted).toContain('1'); // month
    expect(formatted).toContain('15');
  });

  it('different locale formats date differently', () => {
    const locUS = new Locale({ language: 'en-US', messages: {} });
    const locDE = new Locale({ language: 'de-DE', messages: {} });
    const d = new Date(2024, 0, 15);
    const usFormatted = locUS.formatDate(d);
    const deFormatted = locDE.formatDate(d);
    // They should be different (US: M/D/Y, DE: D.M.Y)
    expect(usFormatted).not.toBe(deFormatted);
  });

  it('formats time', () => {
    const loc = new Locale({ language: 'en-US', messages: {} });
    const d = new Date(2024, 0, 15, 14, 30);
    const formatted = loc.formatTime(d);
    expect(formatted.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Locale — plural rules
// ═══════════════════════════════════════════════════════════════════════════

describe('Locale — plural rules', () => {
  it('returns correct plural category', () => {
    const loc = new Locale({ language: 'en-US', messages: {} });
    expect(loc.getPlural(0)).toBe('other');
    expect(loc.getPlural(1)).toBe('one');
    expect(loc.getPlural(2)).toBe('other');
    expect(loc.getPlural(10)).toBe('other');
  });

  it('custom plural rules override default', () => {
    const loc = new Locale({
      language: 'custom',
      messages: {},
      pluralRules: (n) => (n === 0 ? 'zero' : n === 1 ? 'one' : 'other'),
    });
    expect(loc.getPlural(0)).toBe('zero');
    expect(loc.getPlural(1)).toBe('one');
    expect(loc.getPlural(5)).toBe('other');
  });

  it('t() with plural support', () => {
    const loc = new Locale({
      language: 'en-US',
      messages: {
        'items.one': '{count} item',
        'items.other': '{count} items',
      },
    });
    expect(loc.tp('items', 1, { count: 1 })).toBe('1 item');
    expect(loc.tp('items', 5, { count: 5 })).toBe('5 items');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Locale — collation / sorting
// ═══════════════════════════════════════════════════════════════════════════

describe('Locale — sorting', () => {
  it('compare uses locale-aware collation', () => {
    const loc = new Locale({ language: 'en-US', messages: {} });
    expect(loc.compare('apple', 'banana')).toBeLessThan(0);
    expect(loc.compare('banana', 'apple')).toBeGreaterThan(0);
    expect(loc.compare('apple', 'apple')).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LocaleManager
// ═══════════════════════════════════════════════════════════════════════════

describe('LocaleManager', () => {
  it('register and set locale', () => {
    const loc = new Locale({ language: 'en-US', messages: { hi: 'Hello' } });
    LocaleManager.register(loc);
    LocaleManager.setLocale('en-US');
    expect(LocaleManager.getLocale()).toBe(loc);
  });

  it('t() delegates to active locale', () => {
    const loc = new Locale({ language: 'en-US', messages: { ok: 'OK' } });
    LocaleManager.register(loc);
    LocaleManager.setLocale('en-US');
    expect(LocaleManager.t('ok')).toBe('OK');
  });

  it('fires localechange event', () => {
    const spy = vi.fn();
    LocaleManager.on('localechange', spy);
    const loc = new Locale({ language: 'fr-FR', messages: {} });
    LocaleManager.register(loc);
    LocaleManager.setLocale('fr-FR');
    expect(spy).toHaveBeenCalled();
    LocaleManager.off('localechange', spy);
  });

  it('switching locale changes translations', () => {
    const en = new Locale({ language: 'en-US', messages: { greet: 'Hello' } });
    const es = new Locale({ language: 'es-ES', messages: { greet: 'Hola' } });
    LocaleManager.register(en);
    LocaleManager.register(es);
    LocaleManager.setLocale('en-US');
    expect(LocaleManager.t('greet')).toBe('Hello');
    LocaleManager.setLocale('es-ES');
    expect(LocaleManager.t('greet')).toBe('Hola');
  });

  it('setLocale applies dir attribute for RTL', () => {
    const ar = new Locale({ language: 'ar-SA', messages: {}, rtl: true });
    LocaleManager.register(ar);
    LocaleManager.setLocale('ar-SA');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
  });

  it('setLocale applies lang attribute', () => {
    const en = new Locale({ language: 'en-US', messages: {} });
    LocaleManager.register(en);
    LocaleManager.setLocale('en-US');
    expect(document.documentElement.getAttribute('lang')).toBe('en-US');
  });

  it('switching from RTL to LTR removes dir=rtl', () => {
    const ar = new Locale({ language: 'ar-SA', messages: {}, rtl: true });
    const en = new Locale({ language: 'en-US', messages: {} });
    LocaleManager.register(ar);
    LocaleManager.register(en);
    LocaleManager.setLocale('ar-SA');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    LocaleManager.setLocale('en-US');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
  });

  it('getDirection returns active locale direction', () => {
    const ar = new Locale({ language: 'ar-SA', messages: {}, rtl: true });
    LocaleManager.register(ar);
    LocaleManager.setLocale('ar-SA');
    expect(LocaleManager.getDirection()).toBe('rtl');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Built-in locale bundles
// ═══════════════════════════════════════════════════════════════════════════

describe('Built-in locales', () => {
  it('en-US has expected messages', () => {
    expect(enUS.getLanguage()).toBe('en-US');
    expect(enUS.t('btn.ok')).toBe('OK');
    expect(enUS.t('btn.cancel')).toBe('Cancel');
    expect(enUS.t('btn.yes')).toBe('Yes');
    expect(enUS.t('btn.no')).toBe('No');
    expect(enUS.t('grid.noData')).toBeDefined();
    expect(enUS.t('grid.loading')).toBeDefined();
  });

  it('en-US has date picker messages', () => {
    expect(enUS.t('datepicker.months.0')).toBe('January');
    expect(enUS.t('datepicker.months.11')).toBe('December');
    expect(enUS.t('datepicker.days.0')).toBe('Sunday');
  });

  it('en-US has validation messages', () => {
    expect(enUS.t('validation.required')).toBeDefined();
    expect(enUS.t('validation.minLength')).toBeDefined();
    expect(enUS.t('validation.email')).toBeDefined();
  });

  it('es-ES has Spanish translations', () => {
    expect(esES.getLanguage()).toBe('es-ES');
    expect(esES.t('btn.ok')).toBe('Aceptar');
    expect(esES.t('btn.cancel')).toBe('Cancelar');
    expect(esES.t('datepicker.months.0')).toBe('Enero');
  });

  it('ar-SA is RTL', () => {
    expect(arSA.getLanguage()).toBe('ar-SA');
    expect(arSA.getDirection()).toBe('rtl');
    expect(arSA.t('btn.ok')).toBeDefined();
    expect(arSA.t('datepicker.months.0')).toBeDefined();
  });

  it('ar-SA renders RTL when applied', () => {
    LocaleManager.register(arSA);
    LocaleManager.setLocale('ar-SA');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    expect(document.documentElement.getAttribute('lang')).toBe('ar-SA');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RTL support
// ═══════════════════════════════════════════════════════════════════════════

describe('RTL support', () => {
  it('Locale.isRtl() returns true for RTL locale', () => {
    const loc = new Locale({ language: 'ar-SA', messages: {}, rtl: true });
    expect(loc.isRtl()).toBe(true);
  });

  it('Locale.isRtl() returns false for LTR locale', () => {
    const loc = new Locale({ language: 'en-US', messages: {} });
    expect(loc.isRtl()).toBe(false);
  });

  it('firstDayOfWeek defaults correctly', () => {
    const en = new Locale({ language: 'en-US', messages: {} });
    expect(en.getFirstDayOfWeek()).toBe(0); // Sunday
  });

  it('firstDayOfWeek can be overridden', () => {
    const loc = new Locale({ language: 'fr-FR', messages: {}, firstDayOfWeek: 1 });
    expect(loc.getFirstDayOfWeek()).toBe(1); // Monday
  });
});
