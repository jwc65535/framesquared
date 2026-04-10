/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Theme } from '../src/Theme.js';
import { ThemeManager } from '../src/ThemeManager.js';
import { ClassicTheme } from '../src/themes/ClassicTheme.js';
import { ModernTheme } from '../src/themes/ModernTheme.js';
import { DarkTheme } from '../src/themes/DarkTheme.js';
import { StyleSheet } from '../src/StyleSheet.js';
import { ThemeValidator } from '../src/ThemeValidator.js';

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
// Theme — scoped apply
// ═══════════════════════════════════════════════════════════════════════════

describe('Theme — scoped apply', () => {
  it('apply(element) sets vars on the element, not :root', () => {
    const t = new Theme({ name: 'scoped', tokens: { color: { primary: '#abcdef' } } });
    const el = document.createElement('div');
    t.apply(el);
    expect(el.style.getPropertyValue('--ext-color-primary')).toBe('#abcdef');
    expect(document.documentElement.style.getPropertyValue('--ext-color-primary')).toBe('');
  });

  it('apply(element) does not affect the global _appliedVars / unapply()', () => {
    const t = new Theme({ name: 'test', tokens: { color: { primary: '#111111' } } });
    t.apply(); // global
    const el = document.createElement('div');
    t.apply(el); // scoped — should not wipe the global tracking
    t.unapply(); // should only clear :root
    expect(document.documentElement.style.getPropertyValue('--ext-color-primary')).toBe('');
    // element still has its vars (caller is responsible for cleanup via scope)
    expect(el.style.getPropertyValue('--ext-color-primary')).toBe('#111111');
  });

  it('apply(element) returns the list of applied var names', () => {
    const t = new Theme({ name: 'vars', tokens: { spacing: { sm: 8, md: 16 } } });
    const el = document.createElement('div');
    const names = t.apply(el);
    expect(names).toContain('--ext-spacing-sm');
    expect(names).toContain('--ext-spacing-md');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Theme — getFlatTokens
// ═══════════════════════════════════════════════════════════════════════════

describe('Theme — getFlatTokens', () => {
  it('returns [varName, value] pairs for all tokens', () => {
    const t = new Theme({
      name: 'flat',
      tokens: { color: { primary: 'red' }, spacing: { md: 16 } },
    });
    const flat = t.getFlatTokens();
    expect(flat).toContainEqual(['--ext-color-primary', 'red']);
    expect(flat).toContainEqual(['--ext-spacing-md', 16]);
  });

  it('includes inherited tokens from parent', () => {
    const parent = new Theme({ name: 'p', tokens: { color: { secondary: 'blue' } } });
    const child = new Theme({ name: 'c', parent, tokens: { color: { primary: 'red' } } });
    const flat = child.getFlatTokens();
    expect(flat).toContainEqual(['--ext-color-primary', 'red']);
    expect(flat).toContainEqual(['--ext-color-secondary', 'blue']);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ThemeManager — setAutoTheme
// ═══════════════════════════════════════════════════════════════════════════

describe('ThemeManager — setAutoTheme', () => {
  // Helper to install a matchMedia mock that starts in light mode.
  // Returns a function to simulate an OS-level dark/light switch.
  function mockMatchMedia(startsDark = false) {
    let currentMatches = startsDark;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let registeredHandler: ((e: any) => void) | null = null;

    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('dark') ? currentMatches : false,
      addEventListener: (_event: string, fn: (e: MediaQueryListEvent) => void) => {
        registeredHandler = fn;
      },
      removeEventListener: vi.fn(),
    }));

    return function simulateChange(isDark: boolean) {
      currentMatches = isDark;
      registeredHandler?.({ matches: isDark } as MediaQueryListEvent);
    };
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('applies light theme immediately when OS is in light mode', () => {
    const light = new Theme({ name: 'light', tokens: { color: { primary: '#ffffff' } } });
    const dark  = new Theme({ name: 'dark2', tokens: { color: { primary: '#000000' } } });
    ThemeManager.register(light);
    ThemeManager.register(dark);

    mockMatchMedia(false);
    ThemeManager.setAutoTheme('light', 'dark2');

    expect(document.documentElement.style.getPropertyValue('--ext-color-primary')).toBe('#ffffff');
    expect(ThemeManager.getActiveThemeName()).toBe('light');
  });

  it('applies dark theme immediately when OS is in dark mode', () => {
    const light = new Theme({ name: 'light', tokens: { color: { primary: '#ffffff' } } });
    const dark  = new Theme({ name: 'dark2', tokens: { color: { primary: '#000000' } } });
    ThemeManager.register(light);
    ThemeManager.register(dark);

    mockMatchMedia(true);
    ThemeManager.setAutoTheme('light', 'dark2');

    expect(document.documentElement.style.getPropertyValue('--ext-color-primary')).toBe('#000000');
    expect(ThemeManager.getActiveThemeName()).toBe('dark2');
  });

  it('switches theme when OS preference changes', () => {
    const light = new Theme({ name: 'light', tokens: { color: { primary: '#ffffff' } } });
    const dark  = new Theme({ name: 'dark2', tokens: { color: { primary: '#000000' } } });
    ThemeManager.register(light);
    ThemeManager.register(dark);

    const simulate = mockMatchMedia(false);
    ThemeManager.setAutoTheme('light', 'dark2');

    expect(ThemeManager.getActiveThemeName()).toBe('light');
    simulate(true);
    expect(ThemeManager.getActiveThemeName()).toBe('dark2');
    expect(document.documentElement.style.getPropertyValue('--ext-color-primary')).toBe('#000000');
    simulate(false);
    expect(ThemeManager.getActiveThemeName()).toBe('light');
  });

  it('fires themechange when OS preference changes', () => {
    const spy = vi.fn();
    ThemeManager.on('themechange', spy);

    const light = new Theme({ name: 'light', tokens: {} });
    const dark  = new Theme({ name: 'dark2', tokens: {} });
    ThemeManager.register(light);
    ThemeManager.register(dark);

    const simulate = mockMatchMedia(false);
    ThemeManager.setAutoTheme('light', 'dark2');
    spy.mockClear();

    simulate(true);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('fires autoThemeChange when OS preference changes', () => {
    const spy = vi.fn();
    ThemeManager.on('autoThemeChange', spy);

    const light = new Theme({ name: 'light', tokens: {} });
    const dark  = new Theme({ name: 'dark2', tokens: {} });
    ThemeManager.register(light);
    ThemeManager.register(dark);

    const simulate = mockMatchMedia(false);
    ThemeManager.setAutoTheme('light', 'dark2');

    simulate(true);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('isAutoTheme returns true while active, false after manual override', () => {
    const t1 = new Theme({ name: 'a', tokens: {} });
    const t2 = new Theme({ name: 'b', tokens: {} });
    ThemeManager.register(t1);
    ThemeManager.register(t2);

    mockMatchMedia(false);
    ThemeManager.setAutoTheme('a', 'b');
    expect(ThemeManager.isAutoTheme()).toBe(true);

    ThemeManager.setTheme('a');
    expect(ThemeManager.isAutoTheme()).toBe(false);
  });

  it('manual setTheme cancels auto mode (listener no longer fires)', () => {
    const light = new Theme({ name: 'light', tokens: { color: { primary: '#ffffff' } } });
    const dark  = new Theme({ name: 'dark2', tokens: { color: { primary: '#000000' } } });
    const manual = new Theme({ name: 'manual', tokens: { color: { primary: '#aabbcc' } } });
    ThemeManager.register(light);
    ThemeManager.register(dark);
    ThemeManager.register(manual);

    const simulate = mockMatchMedia(false);
    ThemeManager.setAutoTheme('light', 'dark2');

    ThemeManager.setTheme('manual');
    expect(ThemeManager.getActiveThemeName()).toBe('manual');

    // Simulating an OS change should not override the manual theme
    // because the listener was removed.
    simulate(true);
    expect(ThemeManager.getActiveThemeName()).toBe('manual');
  });

  it('reset() tears down auto mode', () => {
    const t1 = new Theme({ name: 'a', tokens: {} });
    const t2 = new Theme({ name: 'b', tokens: {} });
    ThemeManager.register(t1);
    ThemeManager.register(t2);

    mockMatchMedia(false);
    ThemeManager.setAutoTheme('a', 'b');
    expect(ThemeManager.isAutoTheme()).toBe(true);

    ThemeManager.reset();
    expect(ThemeManager.isAutoTheme()).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ThemeManager — createScope
// ═══════════════════════════════════════════════════════════════════════════

describe('ThemeManager — createScope', () => {
  it('applies theme vars to the element, not :root', () => {
    ThemeManager.register(ModernTheme);
    ThemeManager.setTheme('modern');

    const el = document.createElement('div');
    const scope = ThemeManager.createScope(el, 'modern');

    expect(el.style.getPropertyValue('--ext-color-primary')).not.toBe('');
    scope.destroy();
  });

  it('scoped vars do not appear on :root', () => {
    const scoped = new Theme({ name: 'scoped', tokens: { color: { unique: '#facade' } } });
    ThemeManager.register(scoped);

    const el = document.createElement('div');
    const scope = ThemeManager.createScope(el, 'scoped');

    expect(el.style.getPropertyValue('--ext-color-unique')).toBe('#facade');
    expect(document.documentElement.style.getPropertyValue('--ext-color-unique')).toBe('');
    scope.destroy();
  });

  it('scope.update() swaps the theme on the element', () => {
    const t1 = new Theme({ name: 's1', tokens: { color: { primary: '#111111' } } });
    const t2 = new Theme({ name: 's2', tokens: { color: { primary: '#222222' } } });
    ThemeManager.register(t1);
    ThemeManager.register(t2);

    const el = document.createElement('div');
    const scope = ThemeManager.createScope(el, 's1');
    expect(el.style.getPropertyValue('--ext-color-primary')).toBe('#111111');

    scope.update('s2');
    expect(el.style.getPropertyValue('--ext-color-primary')).toBe('#222222');
    scope.destroy();
  });

  it('scope.update() removes vars unique to the old theme', () => {
    const t1 = new Theme({ name: 's1', tokens: { color: { onlyInT1: '#dead00' } } });
    const t2 = new Theme({ name: 's2', tokens: { color: { onlyInT2: '#c0ffee' } } });
    ThemeManager.register(t1);
    ThemeManager.register(t2);

    const el = document.createElement('div');
    const scope = ThemeManager.createScope(el, 's1');
    expect(el.style.getPropertyValue('--ext-color-onlyInT1')).toBe('#dead00');

    scope.update('s2');
    expect(el.style.getPropertyValue('--ext-color-onlyInT1')).toBe('');
    expect(el.style.getPropertyValue('--ext-color-onlyInT2')).toBe('#c0ffee');
    scope.destroy();
  });

  it('scope.destroy() removes all scoped vars from element', () => {
    const t = new Theme({ name: 'ds', tokens: { color: { primary: '#123456' } } });
    ThemeManager.register(t);

    const el = document.createElement('div');
    const scope = ThemeManager.createScope(el, 'ds');
    expect(el.style.getPropertyValue('--ext-color-primary')).toBe('#123456');

    scope.destroy();
    expect(el.style.getPropertyValue('--ext-color-primary')).toBe('');
  });

  it('destroy() does not affect global :root theme', () => {
    const global = new Theme({ name: 'global', tokens: { color: { primary: '#999999' } } });
    const scoped = new Theme({ name: 'scoped2', tokens: { color: { primary: '#abcabc' } } });
    ThemeManager.register(global);
    ThemeManager.register(scoped);
    ThemeManager.setTheme('global');

    const el = document.createElement('div');
    const scope = ThemeManager.createScope(el, 'scoped2');
    scope.destroy();

    // Global theme must still be applied.
    expect(document.documentElement.style.getPropertyValue('--ext-color-primary')).toBe('#999999');
  });

  it('reset() destroys all active scopes', () => {
    const t = new Theme({ name: 'r', tokens: { color: { primary: '#fedcba' } } });
    ThemeManager.register(t);

    const el = document.createElement('div');
    ThemeManager.createScope(el, 'r');
    expect(el.style.getPropertyValue('--ext-color-primary')).toBe('#fedcba');

    ThemeManager.reset();
    expect(el.style.getPropertyValue('--ext-color-primary')).toBe('');
  });

  it('throws when theme name is not registered', () => {
    const el = document.createElement('div');
    expect(() => ThemeManager.createScope(el, 'not-registered')).toThrow();
  });

  it('multiple scopes on different elements are independent', () => {
    const t1 = new Theme({ name: 'i1', tokens: { color: { primary: '#aaaa00' } } });
    const t2 = new Theme({ name: 'i2', tokens: { color: { primary: '#0000bb' } } });
    ThemeManager.register(t1);
    ThemeManager.register(t2);

    const el1 = document.createElement('div');
    const el2 = document.createElement('div');
    const scope1 = ThemeManager.createScope(el1, 'i1');
    const scope2 = ThemeManager.createScope(el2, 'i2');

    expect(el1.style.getPropertyValue('--ext-color-primary')).toBe('#aaaa00');
    expect(el2.style.getPropertyValue('--ext-color-primary')).toBe('#0000bb');

    scope1.destroy();
    // el2 still intact after scope1 destroyed
    expect(el2.style.getPropertyValue('--ext-color-primary')).toBe('#0000bb');
    scope2.destroy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ThemeValidator
// ═══════════════════════════════════════════════════════════════════════════

describe('ThemeValidator', () => {
  const validator = new ThemeValidator();

  it('passes all built-in themes without errors', () => {
    expect(validator.validate(ClassicTheme).valid).toBe(true);
    expect(validator.validate(ModernTheme).valid).toBe(true);
    expect(validator.validate(DarkTheme).valid).toBe(true);
  });

  it('reports invalid color values', () => {
    const t = new Theme({ name: 'bad', tokens: { color: { primary: 'not-a-color' } } });
    const result = validator.validate(t);
    expect(result.valid).toBe(false);
    expect(result.errors[0].varName).toBe('--ext-color-primary');
  });

  it('accepts #rrggbb, #rrggbbaa, rgb(), rgba(), hsl(), hsla()', () => {
    const t = new Theme({
      name: 'colors',
      tokens: {
        color: {
          a: '#1a2b3c',
          b: '#1a2b3c4d',
          c: 'rgb(10, 20, 30)',
          d: 'rgba(10, 20, 30, 0.5)',
          e: 'hsl(120, 50%, 40%)',
          f: 'hsla(120, 50%, 40%, 0.8)',
          g: 'transparent',
          h: 'currentColor',
        },
      },
    });
    expect(validator.validate(t).valid).toBe(true);
  });

  it('reports non-numeric spacing values', () => {
    const t = new Theme({ name: 'bad', tokens: { spacing: { md: '16px' } } });
    const result = validator.validate(t);
    expect(result.valid).toBe(false);
    expect(result.errors[0].varName).toBe('--ext-spacing-md');
  });

  it('passes numeric spacing values', () => {
    const t = new Theme({ name: 'ok', tokens: { spacing: { md: 16 } } });
    expect(validator.validate(t).valid).toBe(true);
  });

  it('accepts borderRadius as number or CSS string', () => {
    const t = new Theme({
      name: 'br',
      tokens: { borderRadius: { sm: 2, round: '50%', custom: '0.5rem' } },
    });
    expect(validator.validate(t).valid).toBe(true);
  });

  it('rejects invalid borderRadius values', () => {
    const t = new Theme({ name: 'bad', tokens: { borderRadius: { sm: 'big' } } });
    expect(validator.validate(t).valid).toBe(false);
  });

  it('accepts transition time strings', () => {
    const t = new Theme({ name: 'tr', tokens: { transition: { fast: '100ms', slow: '0.3s' } } });
    expect(validator.validate(t).valid).toBe(true);
  });

  it('rejects invalid transition values', () => {
    const t = new Theme({ name: 'bad', tokens: { transition: { fast: 'fast' } } });
    expect(validator.validate(t).valid).toBe(false);
  });

  it('reports errors with varName and value', () => {
    const t = new Theme({ name: 'err', tokens: { color: { primary: 42 } } });
    const result = validator.validate(t);
    expect(result.errors[0]).toMatchObject({
      varName: '--ext-color-primary',
      value: 42,
    });
    expect(typeof result.errors[0].message).toBe('string');
  });

  it('validates inherited tokens from parent', () => {
    const parent = new Theme({ name: 'par', tokens: { color: { base: 'not-valid' } } });
    const child = new Theme({ name: 'chi', parent, tokens: {} });
    const result = validator.validate(child);
    expect(result.valid).toBe(false);
    expect(result.errors[0].varName).toBe('--ext-color-base');
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
