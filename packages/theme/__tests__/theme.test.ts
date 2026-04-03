/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Theme } from '../src/Theme.js';
import { ThemeManager } from '../src/ThemeManager.js';
import { ClassicTheme } from '../src/themes/ClassicTheme.js';
import { ModernTheme } from '../src/themes/ModernTheme.js';
import { DarkTheme } from '../src/themes/DarkTheme.js';
import { StyleSheet } from '../src/StyleSheet.js';

beforeEach(() => {
  ThemeManager.reset();
});
afterEach(() => {
  ThemeManager.reset();
  // Clean up style elements
  document.querySelectorAll('style[data-ext-theme]').forEach((el) => el.remove());
  document.querySelectorAll('style[data-ext-stylesheet]').forEach((el) => el.remove());
});

// ═══════════════════════════════════════════════════════════════════════════
// Theme — token access
// ═══════════════════════════════════════════════════════════════════════════

describe('Theme — tokens', () => {
  it('creates with name', () => {
    const t = new Theme({ name: 'test', tokens: {} });
    expect(t.getName()).toBe('test');
  });

  it('getToken with flat path', () => {
    const t = new Theme({
      name: 'test',
      tokens: { color: { primary: '#1976d2' } },
    });
    expect(t.getToken('color.primary')).toBe('#1976d2');
  });

  it('getToken with deep path', () => {
    const t = new Theme({
      name: 'test',
      tokens: { color: { text: { primary: '#212121', secondary: '#757575' } } },
    });
    expect(t.getToken('color.text.primary')).toBe('#212121');
    expect(t.getToken('color.text.secondary')).toBe('#757575');
  });

  it('getToken returns undefined for missing path', () => {
    const t = new Theme({ name: 'test', tokens: {} });
    expect(t.getToken('nonexistent.path')).toBeUndefined();
  });

  it('setToken updates a token value', () => {
    const t = new Theme({
      name: 'test',
      tokens: { color: { primary: 'red' } },
    });
    t.setToken('color.primary', 'blue');
    expect(t.getToken('color.primary')).toBe('blue');
  });

  it('setToken creates nested paths', () => {
    const t = new Theme({ name: 'test', tokens: {} });
    t.setToken('spacing.md', 16);
    expect(t.getToken('spacing.md')).toBe(16);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Theme — inheritance
// ═══════════════════════════════════════════════════════════════════════════

describe('Theme — inheritance', () => {
  it('child inherits parent tokens', () => {
    const parent = new Theme({
      name: 'parent',
      tokens: { color: { primary: 'red', secondary: 'blue' } },
    });
    const child = new Theme({
      name: 'child',
      parent,
      tokens: {},
    });
    expect(child.getToken('color.primary')).toBe('red');
    expect(child.getToken('color.secondary')).toBe('blue');
  });

  it('child overrides parent tokens', () => {
    const parent = new Theme({
      name: 'parent',
      tokens: { color: { primary: 'red' } },
    });
    const child = new Theme({
      name: 'child',
      parent,
      tokens: { color: { primary: 'green' } },
    });
    expect(child.getToken('color.primary')).toBe('green');
  });

  it('child keeps non-overridden parent tokens', () => {
    const parent = new Theme({
      name: 'parent',
      tokens: { color: { primary: 'red', secondary: 'blue' } },
    });
    const child = new Theme({
      name: 'child',
      parent,
      tokens: { color: { primary: 'green' } },
    });
    expect(child.getToken('color.primary')).toBe('green');
    expect(child.getToken('color.secondary')).toBe('blue');
  });

  it('multi-level inheritance', () => {
    const base = new Theme({ name: 'base', tokens: { a: { x: 1, y: 2, z: 3 } } });
    const mid = new Theme({ name: 'mid', parent: base, tokens: { a: { y: 20 } } });
    const leaf = new Theme({ name: 'leaf', parent: mid, tokens: { a: { z: 300 } } });
    expect(leaf.getToken('a.x')).toBe(1);
    expect(leaf.getToken('a.y')).toBe(20);
    expect(leaf.getToken('a.z')).toBe(300);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Theme — CSS custom properties
// ═══════════════════════════════════════════════════════════════════════════

describe('Theme — CSS custom properties', () => {
  it('apply sets CSS vars on :root', () => {
    const t = new Theme({
      name: 'test',
      tokens: { color: { primary: '#1976d2' }, spacing: { md: 16 } },
    });
    t.apply();
    expect(document.documentElement.style.getPropertyValue('--ext-color-primary')).toBe('#1976d2');
    expect(document.documentElement.style.getPropertyValue('--ext-spacing-md')).toBe('16');
    t.unapply();
  });

  it('unapply removes CSS vars', () => {
    const t = new Theme({
      name: 'test',
      tokens: { color: { primary: '#ff0000' } },
    });
    t.apply();
    expect(document.documentElement.style.getPropertyValue('--ext-color-primary')).toBe('#ff0000');
    t.unapply();
    expect(document.documentElement.style.getPropertyValue('--ext-color-primary')).toBe('');
  });

  it('getVariableNames returns all CSS var names', () => {
    const t = new Theme({
      name: 'test',
      tokens: { color: { primary: '#000', secondary: '#fff' } },
    });
    const names = t.getVariableNames();
    expect(names).toContain('--ext-color-primary');
    expect(names).toContain('--ext-color-secondary');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ThemeManager
// ═══════════════════════════════════════════════════════════════════════════

describe('ThemeManager', () => {
  it('register and retrieve theme', () => {
    const t = new Theme({ name: 'myTheme', tokens: {} });
    ThemeManager.register(t);
    expect(ThemeManager.getTheme('myTheme')).toBe(t);
  });

  it('setTheme applies the theme', () => {
    const t = new Theme({
      name: 'active',
      tokens: { color: { primary: '#123456' } },
    });
    ThemeManager.register(t);
    ThemeManager.setTheme('active');
    expect(document.documentElement.style.getPropertyValue('--ext-color-primary')).toBe('#123456');
  });

  it('switching themes removes old vars and applies new', () => {
    const t1 = new Theme({
      name: 'theme1',
      tokens: { color: { primary: '#aaa', unique1: '#111' } },
    });
    const t2 = new Theme({
      name: 'theme2',
      tokens: { color: { primary: '#bbb', unique2: '#222' } },
    });
    ThemeManager.register(t1);
    ThemeManager.register(t2);
    ThemeManager.setTheme('theme1');
    expect(document.documentElement.style.getPropertyValue('--ext-color-primary')).toBe('#aaa');

    ThemeManager.setTheme('theme2');
    expect(document.documentElement.style.getPropertyValue('--ext-color-primary')).toBe('#bbb');
    expect(document.documentElement.style.getPropertyValue('--ext-color-unique1')).toBe('');
    expect(document.documentElement.style.getPropertyValue('--ext-color-unique2')).toBe('#222');
  });

  it('getToken reads from active theme', () => {
    const t = new Theme({
      name: 'tok',
      tokens: { spacing: { sm: 8 } },
    });
    ThemeManager.register(t);
    ThemeManager.setTheme('tok');
    expect(ThemeManager.getToken('spacing.sm')).toBe(8);
  });

  it('fires themechange event', () => {
    const spy = vi.fn();
    ThemeManager.on('themechange', spy);
    const t = new Theme({ name: 'evt', tokens: {} });
    ThemeManager.register(t);
    ThemeManager.setTheme('evt');
    expect(spy).toHaveBeenCalled();
    ThemeManager.off('themechange', spy);
  });

  it('getActiveThemeName returns current name', () => {
    const t = new Theme({ name: 'current', tokens: {} });
    ThemeManager.register(t);
    ThemeManager.setTheme('current');
    expect(ThemeManager.getActiveThemeName()).toBe('current');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Built-in themes
// ═══════════════════════════════════════════════════════════════════════════

describe('Built-in themes', () => {
  it('ClassicTheme has expected tokens', () => {
    const t = ClassicTheme;
    expect(t.getName()).toBe('classic');
    expect(t.getToken('color.primary')).toBeDefined();
    expect(t.getToken('spacing.md')).toBeDefined();
    expect(t.getToken('typography.fontFamily.sans')).toBeDefined();
  });

  it('ModernTheme has expected tokens', () => {
    const t = ModernTheme;
    expect(t.getName()).toBe('modern');
    expect(t.getToken('color.primary')).toBeDefined();
    expect(t.getToken('borderRadius.md')).toBeDefined();
  });

  it('DarkTheme inverts background and text colors', () => {
    const t = DarkTheme;
    expect(t.getName()).toBe('dark');
    const bg = t.getToken('color.background') as string;
    const text = t.getToken('color.text.primary') as string;
    // Dark theme: dark background, light text
    expect(bg).toMatch(/^#[0-3]/); // starts with low hex → dark
    expect(text).toMatch(/^#[c-f]/i); // starts with high hex → light
  });

  it('DarkTheme inherits from ModernTheme', () => {
    // DarkTheme should have spacing from Modern
    expect(DarkTheme.getToken('spacing.md')).toBeDefined();
  });

  it('all built-in themes can be applied', () => {
    ClassicTheme.apply();
    expect(document.documentElement.style.getPropertyValue('--ext-color-primary')).not.toBe('');
    ClassicTheme.unapply();

    ModernTheme.apply();
    expect(document.documentElement.style.getPropertyValue('--ext-color-primary')).not.toBe('');
    ModernTheme.unapply();

    DarkTheme.apply();
    expect(document.documentElement.style.getPropertyValue('--ext-color-primary')).not.toBe('');
    DarkTheme.unapply();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// StyleSheet
// ═══════════════════════════════════════════════════════════════════════════

describe('StyleSheet', () => {
  it('creates a style element', () => {
    const ss = new StyleSheet('test-sheet');
    expect(ss.getStyleElement()).not.toBeNull();
    ss.destroy();
  });

  it('addRule injects CSS rule', () => {
    const ss = new StyleSheet('test-sheet');
    ss.addRule('.my-btn', { backgroundColor: 'red', padding: '8px' });
    const styleEl = ss.getStyleElement();
    expect(styleEl.textContent).toContain('.my-btn');
    expect(styleEl.textContent).toContain('background-color');
    ss.destroy();
  });

  it('addRule uses CSS variable references', () => {
    const ss = new StyleSheet('test-sheet');
    ss.addRule('.x-panel', { backgroundColor: 'var(--ext-color-surface)' });
    expect(ss.getStyleElement().textContent).toContain('var(--ext-color-surface)');
    ss.destroy();
  });

  it('removeRule removes a previously added rule', () => {
    const ss = new StyleSheet('test-sheet');
    const id = ss.addRule('.temp', { color: 'blue' });
    expect(ss.getStyleElement().textContent).toContain('.temp');
    ss.removeRule(id);
    expect(ss.getStyleElement().textContent).not.toContain('.temp');
    ss.destroy();
  });

  it('destroy removes the style element from DOM', () => {
    const ss = new StyleSheet('destroy-test');
    const el = ss.getStyleElement();
    document.head.appendChild(el);
    ss.destroy();
    expect(el.parentNode).toBeNull();
  });

  it('multiple rules accumulate', () => {
    const ss = new StyleSheet('multi');
    ss.addRule('.a', { color: 'red' });
    ss.addRule('.b', { color: 'blue' });
    ss.addRule('.c', { color: 'green' });
    const text = ss.getStyleElement().textContent!;
    expect(text).toContain('.a');
    expect(text).toContain('.b');
    expect(text).toContain('.c');
    ss.destroy();
  });

  it('camelCase properties converted to kebab-case', () => {
    const ss = new StyleSheet('kebab');
    ss.addRule('.x', { fontSize: '14px', borderRadius: '4px' });
    const text = ss.getStyleElement().textContent!;
    expect(text).toContain('font-size');
    expect(text).toContain('border-radius');
    ss.destroy();
  });
});
