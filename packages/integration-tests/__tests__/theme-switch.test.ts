import { describe, it, expect, vi, afterEach } from 'vitest';
import { Theme, ThemeManager, ClassicTheme, ModernTheme, DarkTheme, StyleSheet } from '@framesquared/theme';

afterEach(() => {
  ThemeManager.reset();
  document.querySelectorAll('style[data-ext-stylesheet]').forEach(el => el.remove());
});

describe('Theme switching integration', () => {
  it('register and apply multiple themes', () => {
    ThemeManager.register(ClassicTheme);
    ThemeManager.register(ModernTheme);
    ThemeManager.register(DarkTheme);

    ThemeManager.setTheme('classic');
    const classicPrimary = document.documentElement.style.getPropertyValue('--ext-color-primary');
    expect(classicPrimary).toBe('#157fcc');

    ThemeManager.setTheme('modern');
    const modernPrimary = document.documentElement.style.getPropertyValue('--ext-color-primary');
    expect(modernPrimary).toBe('#1976d2');

    ThemeManager.setTheme('dark');
    const darkPrimary = document.documentElement.style.getPropertyValue('--ext-color-primary');
    expect(darkPrimary).toBe('#90caf9');
  });

  it('switching theme removes old vars', () => {
    const theme1 = new Theme({
      name: 'a',
      tokens: { custom: { uniqueA: 'red' } },
    });
    const theme2 = new Theme({
      name: 'b',
      tokens: { custom: { uniqueB: 'blue' } },
    });

    ThemeManager.register(theme1);
    ThemeManager.register(theme2);

    ThemeManager.setTheme('a');
    expect(document.documentElement.style.getPropertyValue('--ext-custom-uniqueA')).toBe('red');

    ThemeManager.setTheme('b');
    expect(document.documentElement.style.getPropertyValue('--ext-custom-uniqueA')).toBe('');
    expect(document.documentElement.style.getPropertyValue('--ext-custom-uniqueB')).toBe('blue');
  });

  it('themechange event fires on switch', () => {
    const spy = vi.fn();
    ThemeManager.on('themechange', spy);
    ThemeManager.register(ModernTheme);
    ThemeManager.register(DarkTheme);

    ThemeManager.setTheme('modern');
    expect(spy).toHaveBeenCalledTimes(1);

    ThemeManager.setTheme('dark');
    expect(spy).toHaveBeenCalledTimes(2);

    ThemeManager.off('themechange', spy);
  });

  it('getToken reads from active theme', () => {
    ThemeManager.register(ModernTheme);
    ThemeManager.setTheme('modern');
    expect(ThemeManager.getToken('spacing.md')).toBe(16);
    expect(ThemeManager.getToken('color.primary')).toBe('#1976d2');
  });

  it('DarkTheme inherits Modern spacing and typography', () => {
    expect(DarkTheme.getToken('spacing.md')).toBe(16);
    expect(DarkTheme.getToken('typography.fontFamily.sans')).toContain('Inter');
  });

  it('StyleSheet works alongside themes', () => {
    ThemeManager.register(ModernTheme);
    ThemeManager.setTheme('modern');

    const ss = new StyleSheet('components');
    ss.addRule('.x-btn', {
      backgroundColor: 'var(--ext-color-primary)',
      borderRadius: 'var(--ext-borderRadius-md)',
    });

    const text = ss.getStyleElement().textContent!;
    expect(text).toContain('var(--ext-color-primary)');
    expect(text).toContain('border-radius');

    ss.destroy();
  });

  it('custom theme with parent overrides specific tokens', () => {
    const custom = new Theme({
      name: 'custom',
      parent: ModernTheme,
      tokens: {
        color: { primary: '#ff6600' },
        component: { button: { height: 44 } },
      },
    });

    expect(custom.getToken('color.primary')).toBe('#ff6600');
    expect(custom.getToken('color.secondary')).toBe('#dc004e'); // from Modern
    expect(custom.getToken('component.button.height')).toBe(44);
    expect(custom.getToken('spacing.md')).toBe(16); // from Modern
  });
});
