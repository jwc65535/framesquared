# 15 · Theming

## Overview

Theme switching is instant — `ThemeManager.setTheme('dark')` updates all CSS custom properties on the document root, and every component in the page re-renders with the new colors. No JavaScript re-render required; the browser repaints using the updated CSS variables.

## Key Concepts

- **`ThemeManager`** — singleton registry. Call `register(Theme)` to add themes, `setTheme('name')` to activate.
- **CSS custom properties** — all component colors, spacing, and borders are CSS variables (e.g., `--x-panel-header-bg`). Changing the theme updates these variables.
- **`themechange` event** — fires on ThemeManager after a theme switch. Use this to update any non-CSS content (e.g., chart colors, canvas elements).
- **Three built-in themes**:
  - **Modern**: Clean white, flat design, `#1976d2` accent
  - **Classic**: Gray background, traditional borders, `#1565c0` accent
  - **Dark**: Dark `#1a1a2e` background, light text, `#4a90e2` accent

## Try It

1. Click **Modern**, **Classic**, and **Dark** buttons — the entire grid re-themes instantly.
2. Notice status badges adapt their colors for readability in dark mode.
3. Check the theme info panel at the bottom — it shows the current theme name and primary color.
4. The global showcase header also changes via the theme switcher in the top navigation.

## Source Highlights

1. All three themes are registered at module load: `ThemeManager.register(ClassicTheme)` etc.
2. `ThemeManager.on('themechange', updateThemeInfo)` — updates the info panel after theme change.
3. Remember to call `ThemeManager.un('themechange', handler)` in `destroy()` to avoid memory leaks.

## Real-World Use

Themes are important for accessibility (high contrast), user preference (dark mode), and white-labeling (custom brand colors). Build your own theme by overriding CSS custom property values.

## Related Examples

- [21 · Kitchen Sink](#kitchen-sink) — theme switching on a fully-featured grid
