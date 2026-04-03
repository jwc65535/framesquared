import { describe, it, expect, afterEach } from 'vitest';
import { Locale, LocaleManager, enUS, esES, arSA } from '@framesquared/core';

afterEach(() => {
  LocaleManager.reset();
  document.documentElement.removeAttribute('dir');
  document.documentElement.removeAttribute('lang');
});

describe('i18n integration', () => {
  it('switch between English and Spanish', () => {
    LocaleManager.register(enUS);
    LocaleManager.register(esES);

    LocaleManager.setLocale('en-US');
    expect(LocaleManager.t('btn.ok')).toBe('OK');
    expect(LocaleManager.t('btn.cancel')).toBe('Cancel');

    LocaleManager.setLocale('es-ES');
    expect(LocaleManager.t('btn.ok')).toBe('Aceptar');
    expect(LocaleManager.t('btn.cancel')).toBe('Cancelar');
  });

  it('Arabic locale sets RTL', () => {
    LocaleManager.register(arSA);
    LocaleManager.setLocale('ar-SA');

    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    expect(document.documentElement.getAttribute('lang')).toBe('ar-SA');
    expect(LocaleManager.getDirection()).toBe('rtl');
  });

  it('switching from Arabic to English removes RTL', () => {
    LocaleManager.register(arSA);
    LocaleManager.register(enUS);

    LocaleManager.setLocale('ar-SA');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');

    LocaleManager.setLocale('en-US');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
  });

  it('number formatting varies by locale', () => {
    expect(enUS.formatNumber(1234.56)).toContain('1');
    expect(enUS.formatNumber(1234.56)).toContain('234');

    // German uses comma as decimal separator
    const deDE = new Locale({ language: 'de-DE', messages: {} });
    const german = deDE.formatNumber(1234.56);
    expect(german).toContain('1.234');
  });

  it('date formatting varies by locale', () => {
    const date = new Date(2024, 5, 15); // June 15, 2024
    const usDate = enUS.formatDate(date);
    const esDate = esES.formatDate(date);

    expect(usDate).toContain('15');
    expect(esDate).toContain('15');
    // Formats should differ
    expect(usDate).not.toBe(esDate);
  });

  it('plural rules work for English', () => {
    const loc = new Locale({
      language: 'en-US',
      messages: {
        'items.one': '{count} item',
        'items.other': '{count} items',
      },
    });
    expect(loc.tp('items', 1, { count: 1 })).toBe('1 item');
    expect(loc.tp('items', 0, { count: 0 })).toBe('0 items');
    expect(loc.tp('items', 42, { count: 42 })).toBe('42 items');
  });

  it('parameter substitution in translations', () => {
    LocaleManager.register(enUS);
    LocaleManager.setLocale('en-US');

    expect(LocaleManager.t('grid.page', { page: 3, total: 10 })).toBe('Page 3 of 10');
    expect(LocaleManager.t('validation.minLength', { min: 5 })).toBe(
      'Minimum length is 5 characters',
    );
  });

  it('locale-aware sorting', () => {
    const items = ['banana', 'apple', 'cherry'];
    items.sort((a, b) => enUS.compare(a, b));
    expect(items).toEqual(['apple', 'banana', 'cherry']);
  });

  it('all built-in locales have complete translations', () => {
    const requiredKeys = [
      'btn.ok',
      'btn.cancel',
      'btn.yes',
      'btn.no',
      'grid.noData',
      'grid.loading',
      'validation.required',
      'validation.email',
      'datepicker.months.0',
      'datepicker.months.11',
      'datepicker.days.0',
      'datepicker.days.6',
    ];

    for (const locale of [enUS, esES, arSA]) {
      for (const key of requiredKeys) {
        const val = locale.t(key);
        expect(val).not.toBe(key); // should not fall back to key
      }
    }
  });
});
