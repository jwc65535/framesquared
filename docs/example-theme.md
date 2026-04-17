# Example Styles → Framework Theme Migration Plan

This document catalogues all styling in the examples directory, identifies which styles belong in
the framework theme packages, and defines a plan to move them there.

---

## Executive Summary

The examples contain two distinct categories of styling that have been conflated:

1. **Framework component styles** — CSS rules that use `x-` prefixed class names and belong in the
   appropriate `packages/*/src/styles.ts` file, driven by `--ext-*` CSS variables.
2. **Example application styles** — Demo layout, navigation shell, dev-tool UI (event log, source
   viewer, control bar), and illustrative data-display components (badges, avatars, progress bars).

The most significant problem is that the TreeGrid component has **no styles in the framework at
all** — its entire visual definition lives in `examples/tree-grid/shared/styles.css` using
hardcoded hex values. Until those are moved, the component is unstyled when used outside the
example.

---

## Current State

### What the framework already has

| Package | File | Covers |
|---------|------|--------|
| `@framesquared/component` | `src/styles.ts` | `.x-component`, `.x-disabled`, `.x-floating`, `.x-container-body` |
| `@framesquared/form` | `src/styles.ts` | All form fields, checkbox, radio, slider, tag, bound-list, date-picker |
| `@framesquared/grid` | `src/styles.ts` | Grid table, columns, rows, cells, sorting indicators, TreePanel (`.x-tree-*`) |
| `@framesquared/ui` | `src/styles.ts` | Panel, Button, Toolbar, TabPanel, Window, Menu, Tooltip |
| `@framesquared/theme` | `src/themes/*.ts` | Design tokens only — no CSS rules |

### What the examples add (and why it matters)

| File | Lines | Content |
|------|-------|---------|
| `examples/tree-grid/shared/styles.css` | 696–1084 | **Complete TreeGrid component styles** — `x-` classes, hardcoded hex |
| `examples/tree-grid/shared/styles.css` | 1085–1106 | **Panel header override** — replaces theme primary color with neutral gray |
| `examples/tree-grid/shared/styles.css` | 1109–1161 | **Dark theme overrides** — hardcoded Catppuccin palette via `[data-theme='dark']` |
| `examples/basic-app/index.html` | 7–24 | Duplicate definitions of `.x-component`, `.x-panel-*`, `.x-btn`, `.x-field-*` |
| `examples/kitchen-sink/index.html` | 7–57 | Same, plus `.x-btn-pressed`, trigger styles |
| `examples/admin-dashboard/index.html` | 7–24 | Identical copy of basic-app inline styles |
| `examples/hello-world-mvc/index.html` | ~40–90 | Input focus styles using `var(--ext-color-border)` |
| `examples/basic-treegrid/index.html` | 9–218 | Page header gradient, grid wrapper shadow, source block |
| `examples/theme-switching-treegrid/index.html` | 9–154 | Layout, scope container, token inspector |

---

## Problem 1: TreeGrid Has No Framework Styles

**Severity: Critical**

`packages/grid/src/styles.ts` covers `.x-grid-*` and `.x-tree-*` but contains **zero**
`.x-treegrid-*` rules. The entire visual definition of the TreeGrid component is in
`examples/tree-grid/shared/styles.css` lines 696–1084.

These are framework classes that should not be in an example file:

```
.x-treegrid                    outer container
.x-treegrid-view               scrollable body
.x-treegrid-table              table element
.x-treegrid-header             sticky column header bar
.x-treegrid-header-col         individual header cell
.x-grid-row                    data row (shared with regular grid)
.x-grid-row:hover              hover state
.x-treegrid-selected           selected row
.x-treegrid-focused            keyboard-focused row
.x-grid-cell                   data cell (shared with regular grid)
.x-grid-cell-inner             cell content wrapper
.x-treegrid-cell               tree-column cell override
.x-treegrid-cell-inner         tree cell flex layout
.x-treegrid-expander           expand/collapse toggle
.x-treegrid-expander-collapsed CSS triangle — right-pointing
.x-treegrid-expander-expanded  CSS triangle — down-pointing
.x-treegrid-expander-leaf      leaf placeholder (no toggle)
.x-treegrid-icon               node icon
.x-treegrid-node-text          label, truncates with ellipsis
.x-treegrid-checkbox           checkbox column
.x-treegrid-elbow-*            tree connector lines (8 variants)
.x-treegrid-loading-*          loading spinner overlay
```

**Migration plan:**

Move all of these to a new section in `packages/grid/src/styles.ts`. Replace every hardcoded hex
value with the appropriate `--ext-*` CSS variable (see token mapping below). The dark theme
overrides in lines 1109–1161 become unnecessary once variables are used.

Token mapping for the TreeGrid block:

| Hardcoded value | Replace with |
|-----------------|-------------|
| `#fff` / `#ffffff` | `var(--ext-color-background, #fff)` |
| `#f6f8fa` (header bg, row hover) | `var(--ext-color-surface, #f5f5f5)` |
| `#d0d7de` (border) | `var(--ext-color-border, #e0e0e0)` |
| `#f0f0f0` (cell divider) | `rgba(0,0,0,0.06)` or `var(--ext-color-border, #e0e0e0)` at lower opacity |
| `#57606a` (header text, expander) | `var(--ext-color-text-secondary, #757575)` |
| `#24292f` (expander hover) | `var(--ext-color-text-primary, #212121)` |
| `#dbeafe` (selection bg) | `color-mix(in srgb, var(--ext-color-primary, #1976d2) 14%, transparent)` |
| `#3b82f6` (focus ring) | `var(--ext-color-primary, #1976d2)` |
| `13px` font-size | `var(--ext-typography-fontSize-sm, 13px)` |
| `32px` row height | `var(--ext-component-grid-rowHeight, 26px)` |
| `border-radius: 4px` container | `var(--x-r-md, 4px)` |
| `border-radius: 3px` expander | `var(--x-r-sm, 2px)` |

The expander triangles in the example use CSS `border` triangles (e.g. `border-left: 7px solid
currentColor`). The tree panel in `packages/grid/src/styles.ts` uses Unicode `content: '▶'` with
`rotate(90deg)`. The CSS border approach is preferable — it is resolution-independent and does not
depend on the font. **Standardize on CSS border triangles in the framework** and remove the Unicode
approach from `.x-tree-expander::before`.

---

## Problem 2: Panel Header Override in Example

**Severity: Moderate**

`examples/tree-grid/shared/styles.css` lines 1085–1098 override `.x-panel-header`:

```css
.x-panel-header {
  background: #f6f8fa;          /* overrides the primary-color header from ui/styles.ts */
  border-bottom: 1px solid #d0d7de;
  color: #24292f;
  height: 36px;
}
```

The framework's `packages/ui/src/styles.ts` defines `.x-panel-header` with
`background: var(--ext-color-primary)` and `color: var(--ext-color-text-onPrimary)` — a blue
header with white text. The example wants a neutral gray header (GitHub-style).

Both are valid design choices. The framework should support both via a modifier class:

```
.x-panel-header           primary-color header (current behavior)
.x-panel-header-neutral   surface-color header with border (for the tree-grid example)
```

Add `.x-panel-header-neutral` to `packages/ui/src/styles.ts`:

```css
.x-panel-header-neutral {
  background: var(--ext-color-surface, #f5f5f5);
  border-bottom: 1px solid var(--ext-color-border, #e0e0e0);
  color: var(--ext-color-text-primary, #212121);
}
```

Then update `examples/tree-grid/shared/styles.css` to remove the override and instead apply
`.x-panel-header-neutral` in the TreeGrid component's panel markup.

---

## Problem 3: Dark Theme Uses Hardcoded Attribute Overrides

**Severity: Moderate**

`examples/tree-grid/shared/styles.css` lines 1109–1161 implement dark mode via:

```css
[data-theme='dark'] .x-treegrid { background: #1e1e2e; border-color: #45475a; ... }
[data-theme='dark'] .x-grid-cell { border-bottom-color: #313244; }
/* … 20 more rules with hardcoded Catppuccin Mocha palette values */
```

This works around a gap in the framework: `DarkTheme` in `packages/theme/src/themes/DarkTheme.ts`
defines token values, but those tokens are only applied as inline CSS custom properties on a target
element via `ThemeManager.apply()`. There is no CSS rule block that scopes `--ext-*` variables
under `[data-theme='dark']`, so examples cannot write theme-aware rules for dark mode.

**Migration plan:**

Add a static CSS block to `packages/theme/src/ThemeManager.ts` (or a new
`packages/theme/src/dark-mode.ts`) that re-declares all `--ext-*` variables under
`[data-theme='dark']`:

```css
[data-theme='dark'] {
  --ext-color-background: #121212;
  --ext-color-surface: #1e1e2e;
  --ext-color-text-primary: #e0e0e0;
  --ext-color-border: #3d3d3d;
  /* … all DarkTheme token values … */
}
```

Once this is in the framework, the 50+ lines of hardcoded dark overrides in the example can be
deleted entirely — all `.x-treegrid-*` rules already use CSS variables, so they will automatically
render correctly in dark mode.

---

## Problem 4: Duplicate Framework Classes in Example HTML Files

**Severity: Low (but causes confusion)**

Three example HTML files define `<style>` blocks that redefine framework classes:

- `examples/basic-app/index.html` lines 7–24
- `examples/kitchen-sink/index.html` lines 7–57
- `examples/admin-dashboard/index.html` lines 7–24

These define `.x-component`, `.x-panel-header`, `.x-panel-body`, `.x-btn`, `.x-btn:hover`,
`.x-field`, `.x-field-label`, and table styles. The framework's `packages/ui/src/styles.ts`
already provides correct, token-driven versions of all of these.

These inline blocks were likely written before the per-package `styles.ts` files were complete.
They should be deleted. The examples should load the framework styles by importing the package
(which auto-injects the `<style>` tag) rather than hand-rolling approximations.

After deletion, verify that each example still renders correctly using only the framework styles.

---

## Problem 5: `hello-world-mvc` Writes Custom Input Styles

**Severity: Low**

`examples/hello-world-mvc/index.html` includes CSS for plain `<input>` elements:

```css
input {
  font-family: inherit;
  font-size: 14px;
  padding: 6px 10px;
  border: 1px solid var(--ext-color-border);
  border-radius: var(--x-r-md);
}
input:focus {
  outline: none;
  border-color: var(--ext-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ext-color-primary) 20%, transparent);
}
```

This is the same visual treatment already provided by `.x-field-input` in
`packages/form/src/styles.ts`. The MVC example builds its form using raw `<input>` elements
rather than `@framesquared/form` fields. Either:

- Refactor the example to use `TextField` components (preferred — demonstrates the framework), or
- Accept this as intentional example-layer CSS and document why it does not use form components.

---

## What Stays in the Examples

These styles are correctly example-specific and should not move to the framework:

| Style block | Reason to keep in examples |
|-------------|---------------------------|
| Header/sidebar/content page layout | Demo navigation shell, not a component |
| Info panel with tabs (event log, API docs, source viewer) | Dev-tool UI specific to the showcase |
| Event log (`.event-log`, `.event-name`, `.event-time`) | Demo instrumentation |
| Source code viewer (`.source-pre`, token colors, line numbers) | Educational UI |
| Control bar (`.control-group`, `.control-btn`) | Example interaction controls |
| Status badges (`.badge-not-started` etc.) | Example data, not a framework primitive |
| Progress bar fill colors | Example data visualization |
| Avatar circles with department colors | Example data visualization |
| Network log (dark mono terminal) | Example instrumentation |
| Page header gradients in `basic-treegrid` | Illustrative hero section |
| Token inspector UI in `theme-switching-treegrid` | Demo-specific sidebar |
| Responsive sidebar toggle for mobile | Example layout, not a component |

---

## Prioritised Work Items

### P0 — Unblocks external users of TreeGrid

**Move TreeGrid styles into `packages/grid/src/styles.ts`**

The TreeGrid component emits `.x-treegrid-*` class names but the framework ships no CSS for them.
Any application using `@framesquared/grid` must supply its own styles. This is the most critical
gap.

Steps:
1. Copy the block from `examples/tree-grid/shared/styles.css` lines 696–1084 into
   `packages/grid/src/styles.ts`.
2. Replace all hardcoded hex values using the token mapping table in Problem 1 above.
3. Replace the example's CSS border triangle expander approach in the framework and update
   `packages/grid/src/styles.ts` to use CSS border triangles for `.x-treegrid-expander` (and
   align `.x-tree-expander` to the same approach for consistency).
4. Delete lines 696–1084 from `examples/tree-grid/shared/styles.css` — they are now redundant.
5. Run `pnpm -r test` to confirm nothing breaks.

### P1 — Enables clean dark mode without hardcoded overrides

**Add `[data-theme='dark']` CSS variable block to `packages/theme`**

Steps:
1. In `ThemeManager.ts` (or a new `dark-mode.ts` loaded by the theme package), emit a `<style>`
   block at initialisation time that scopes all `DarkTheme` token values under
   `[data-theme='dark']`.
2. Delete lines 1109–1161 from `examples/tree-grid/shared/styles.css`.
3. Verify the tree-grid example still toggles correctly using `document.documentElement.dataset.theme = 'dark'`.

### P2 — Removes duplicate/conflicting styles from examples

**Delete inline `<style>` blocks in basic-app, kitchen-sink, admin-dashboard**

Steps:
1. Remove the `<style>` block from each HTML file.
2. Confirm each example still renders correctly (all styles should come from the injected framework
   style sheets).
3. If any visual regression is found, fix it in the framework styles rather than restoring the
   inline block.

### P3 — Framework supports neutral panel header variant

**Add `.x-panel-header-neutral` to `packages/ui/src/styles.ts`**

Steps:
1. Add the `.x-panel-header-neutral` rule (see Problem 2 above).
2. Update the tree-grid example to apply this class on its panel header elements.
3. Remove the `.x-panel-header` override from `examples/tree-grid/shared/styles.css` lines
   1085–1098.

### P4 — MVC example uses framework form components (optional)

Refactor `hello-world-mvc` to use `TextField` from `@framesquared/form` instead of raw `<input>`
elements, removing the custom input CSS. This is a nice-to-have that better showcases the
framework.

---

## Verification Checklist

After all migrations are complete:

- [ ] `grep -n 'x-treegrid' examples/tree-grid/shared/styles.css` returns zero matches
- [ ] `grep -n 'data-theme' examples/tree-grid/shared/styles.css` returns zero matches
- [ ] `grep -n 'x-panel-header\|x-btn\|x-field\|x-component' examples/basic-app/index.html` returns zero matches
- [ ] Same grep for `kitchen-sink` and `admin-dashboard`
- [ ] All three theme variants (Classic, Modern, Dark) render correctly in the tree-grid showcase
- [ ] `pnpm -r test` passes (294 component tests + all others)
- [ ] A fresh application that imports `@framesquared/grid` and creates a TreeGrid sees correct styles with no additional CSS required
