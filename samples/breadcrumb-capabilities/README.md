# breadcrumb-capabilities

Comprehensive demonstration of `Ext.toolbar.Breadcrumb` and its capabilities.

## Running the demo

```bash
pnpm install   # from repo root, or inside this directory
pnpm dev       # Vite dev server at http://localhost:5173
```

## Running the TDD suite

```bash
pnpm test            # run once (vitest run)
pnpm test:watch      # watch mode
pnpm typecheck       # TypeScript validation
```

All 43 tests live in `test/App.test.ts` and operate against `createBreadcrumbView()`
in `src/BreadcrumbView.ts`.  Each `beforeEach` renders a fresh component tree into
a detached `<div>` for full isolation.

---

## What is demonstrated

| Spec section | Feature | How it appears |
|---|---|---|
| §2a | Static path rendering — 3-segment initial trail | Home > Catalog > Electronics |
| §2a | Dropdown arrows on non-leaf nodes | `▾` beside Home and Catalog |
| §2b | `setSelection()` / `getSelection()` API | Navigation panel buttons |
| §2b | Clicking a segment navigates up the path | Click any breadcrumb item |
| §2c | `selectionchange` event | Updates the `selectionDisplay` label |
| §2d | `iconCls` per node with `showIcons: true` | Home and Catalog carry icons |
| §2f | Toolbar embedding | Breadcrumb inside `Ext.toolbar.Toolbar` |
| §2f | Companion Reset button | "Home" button returns to root |

---

## Framework changes made

Two gaps from the original integrity report were resolved before this sample
was generated:

### 1. `BreadcrumbNode.iconCls` + `showIcons` implementation

**File:** `packages/ui/src/navigation/Breadcrumb.ts`

- Added `iconCls?: string` to the `BreadcrumbNode` interface.
- Implemented `showIcons` rendering in `renderPath()`: when the config flag is
  `true` and a node carries `iconCls`, a `<span class="x-breadcrumb-icon ...">` is
  prepended to the item before the text span.  Multi-class strings (e.g.
  `'x-fa fa-home'`) are split on whitespace and applied individually.  Icon
  sizing is applied inline (`16 × 16 px`, `margin-right: 4px`,
  `vertical-align: middle`) — no external CSS required.

### 2. `role="navigation"` accessibility attribute

**File:** `packages/ui/src/navigation/Breadcrumb.ts`

- `afterRender()` now sets `role="navigation"` and
  `aria-label="Breadcrumb navigation"` on the root element.

---

## Documented gap — Overflow handling

`Ext.toolbar.Breadcrumb` renders all segments in an unbounded flex row.  No
`ResizeObserver`, no hidden-segment counter, and no ellipsis button exist.
Paths longer than the available toolbar width extend past the boundary without
truncation.

See the original integrity report for the full technical specification:
the required `overflowable` config, `syncOverflow()` method, `_moreBtn` /
`_overflowMenu` private fields, and the jsdom `ResizeObserver` mock pattern
to use in tests.
