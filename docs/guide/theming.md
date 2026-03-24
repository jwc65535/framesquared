# Theming

framesquared uses a token-based theming system with CSS custom properties for runtime theme switching.

## Quick Start

```typescript
import { ThemeManager, ModernTheme } from '@framesquared/theme';

ThemeManager.register(ModernTheme);
ThemeManager.setTheme('modern');
// All components now use Modern theme tokens
```

## Built-in Themes

| Theme | Style | Background |
|-------|-------|------------|
| `ClassicTheme` | Traditional ExtJS look, Tahoma font, compact spacing | Light gray `#f0f0f0` |
| `ModernTheme` | Material-inspired, Inter font, generous spacing | White `#ffffff` |
| `DarkTheme` | Dark mode (inherits Modern), light text on dark surfaces | Dark `#121212` |

## Design Tokens

Themes are defined as nested token objects:

```typescript
import { Theme } from '@framesquared/theme';

const myTheme = new Theme({
  name: 'brand',
  tokens: {
    color: {
      primary: '#0066cc',
      secondary: '#ff6600',
      background: '#fafafa',
      surface: '#ffffff',
      text: { primary: '#1a1a1a', secondary: '#666666' },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    borderRadius: { sm: 2, md: 4, lg: 8 },
    typography: {
      fontFamily: { sans: 'Helvetica, sans-serif' },
      fontSize: { sm: 14, md: 16, lg: 18 },
    },
  },
});
```

### Token Access

```typescript
theme.getToken('color.primary');          // '#0066cc'
theme.getToken('typography.fontSize.md'); // 16
theme.setToken('color.primary', '#0055aa');
```

## Theme Inheritance

Create theme variants by extending a parent:

```typescript
const highContrast = new Theme({
  name: 'high-contrast',
  parent: ModernTheme,
  tokens: {
    color: {
      primary: '#000000',
      background: '#ffffff',
      text: { primary: '#000000' },
    },
  },
});

// Inherits all Modern tokens not explicitly overridden
highContrast.getToken('spacing.md'); // 16 (from Modern)
```

## CSS Custom Properties

When a theme is applied, all tokens become CSS custom properties on `:root`:

```css
:root {
  --ext-color-primary: #0066cc;
  --ext-color-background: #fafafa;
  --ext-spacing-md: 16;
  --ext-typography-fontFamily-sans: Helvetica, sans-serif;
}
```

Use them in your CSS:

```css
.my-component {
  background-color: var(--ext-color-surface);
  padding: calc(var(--ext-spacing-md) * 1px);
  border-radius: calc(var(--ext-borderRadius-md) * 1px);
  font-family: var(--ext-typography-fontFamily-sans);
}
```

## Theme Switching

```typescript
ThemeManager.register(ModernTheme);
ThemeManager.register(DarkTheme);

// Switch at runtime — old CSS vars removed, new ones applied
ThemeManager.setTheme('dark');

// Listen for changes
ThemeManager.on('themechange', (theme, name) => {
  console.log(`Switched to ${name}`);
});
```

## StyleSheet

Programmatic CSS rule management:

```typescript
import { StyleSheet } from '@framesquared/theme';

const ss = new StyleSheet('my-component');
ss.addRule('.x-panel-header', {
  backgroundColor: 'var(--ext-color-primary)',
  color: '#ffffff',
  fontSize: '14px',
});

document.head.appendChild(ss.getStyleElement());
ss.destroy(); // Clean up
```

## Reading Tokens in JS

```typescript
// Via ThemeManager (uses active theme)
const primary = ThemeManager.getToken('color.primary');

// Via theme instance
const spacing = ModernTheme.getToken('spacing.md');
```
