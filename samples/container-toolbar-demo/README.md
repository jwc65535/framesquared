# toolbar-capabilities

Comprehensive demonstration of `Ext.toolbar.Toolbar` and its item types.

## Running the demo

```bash
pnpm install          # from repo root, or inside this directory
pnpm dev              # starts Vite dev server at http://localhost:5173
```

## Running the TDD suite

```bash
pnpm test             # run all tests once (vitest run)
pnpm test:watch       # watch mode
pnpm typecheck        # TypeScript validation without emitting
```

All tests live in `test/App.test.ts` and operate against the `createToolbarView()`
factory in `src/ToolbarView.ts`.  Each `beforeEach` renders a fresh component tree
into a detached `<div>`, so tests are fully isolated.

---

## What is demonstrated

| Feature | How it appears |
|---------|----------------|
| Standard `Button` with `handler` | New File, Save, Help |
| `SplitButton` with separate `arrowHandler` | Export (main = direct action, arrow = submenu) |
| `Button` with `menu` config (menu-button pattern) | Settings |
| `enableToggle` independent toggles | Toggle Comment, Word Wrap |
| `toggleGroup` radio behavior | Code / Split / Preview view modes |
| `CycleButton` | Language selector, Font Size selector |
| `SegmentedButton` single-select | Spaces / Tabs indentation |
| `Menu`, `MenuItem`, `CheckItem`, `MenuSeparator` | Export submenu, Settings menu |
| `ToolbarSeparator` (`'-'`) | Between logical groups |
| `ToolbarFill` (`'->'`) | Pushes trailing items to the right edge |
| `ToolbarSpacer` (`' '`) | 8 px gap between Language and Font Size labels |
| `ToolbarTextItem` (plain string) | "Language: ", "Font Size: ", "Indent: " labels |

---

## Framework Integrity Report

Before generating this sample a full audit of the framework core was performed.
Two features listed in the original spec could not be implemented because the
required infrastructure does not yet exist.

### Missing Feature 1 — Form fields as toolbar items

**Requested:** `Ext.form.field.Text` and `Ext.form.field.ComboBox` embedded
directly inside `Ext.toolbar.Toolbar`.

**Why it fails today:** Both `TextField` and `ComboBox` extend the abstract
`Field` base class, which wraps a label/input pair in its own container element.
`Field` does not extend `Component` via a path that is compatible with the
`Toolbar` item resolution loop — that loop accepts any `instanceof Component`
and delegates config-objects to `Container.resolveItem()`, neither of which
handles a `Field` instance correctly.

**Technical specification for the fix:**

Option A — Lightweight toolbar-specific wrappers (preferred):

```typescript
// packages/ui/src/toolbar/ToolbarTextField.ts
import { Component } from '@framesquared/component';

export interface ToolbarTextFieldConfig {
  placeholder?: string;
  width?:       number;
  value?:       string;
  triggers?:    Array<{ iconCls: string; handler: () => void }>;
}

export class ToolbarTextField extends Component {
  declare private _inputEl: HTMLInputElement | null;

  constructor(config: ToolbarTextFieldConfig = {}) {
    super({ width: config.width ?? 150, ...config });
  }

  protected override afterRender(): void {
    super.afterRender();
    this.el!.classList.add('x-toolbar-field', 'x-toolbar-textfield');

    this._inputEl = document.createElement('input');
    this._inputEl.type = 'text';
    this._inputEl.placeholder = (this._config as ToolbarTextFieldConfig).placeholder ?? '';
    this.el!.appendChild(this._inputEl);
  }

  getValue(): string  { return this._inputEl?.value ?? ''; }
  setValue(v: string) { if (this._inputEl) this._inputEl.value = v; }

  on(event: 'change', fn: (field: this, value: string) => void): void {
    this._inputEl?.addEventListener('input', () => fn(this, this.getValue()));
  }
}
```

```typescript
// packages/ui/src/toolbar/ToolbarComboBox.ts
import { Component } from '@framesquared/component';

export interface ToolbarComboItem { text: string; value: string; }

export interface ToolbarComboBoxConfig {
  store?:        ToolbarComboItem[];
  displayField?: string;
  valueField?:   string;
  value?:        string;
  width?:        number;
}

export class ToolbarComboBox extends Component {
  declare private _selectEl: HTMLSelectElement | null;

  constructor(config: ToolbarComboBoxConfig = {}) {
    super({ width: config.width ?? 120, ...config });
  }

  protected override afterRender(): void {
    super.afterRender();
    const cfg = this._config as ToolbarComboBoxConfig;
    this.el!.classList.add('x-toolbar-field', 'x-toolbar-combo');

    this._selectEl = document.createElement('select');
    for (const item of cfg.store ?? []) {
      const opt = document.createElement('option');
      opt.value = item[cfg.valueField as keyof typeof item] as string ?? item.value;
      opt.textContent = item[cfg.displayField as keyof typeof item] as string ?? item.text;
      this._selectEl.appendChild(opt);
    }
    if (cfg.value) this._selectEl.value = cfg.value;
    this.el!.appendChild(this._selectEl);
  }

  getValue(): string  { return this._selectEl?.value ?? ''; }
  setValue(v: string) { if (this._selectEl) this._selectEl.value = v; }
}
```

Both classes extend `Component` directly, making them first-class toolbar items
immediately.  They are intentionally lightweight — they do not replicate the full
`Field` validation/binding stack, which is not needed inside a toolbar.

Export from `packages/ui/src/index.ts`:
```typescript
export { ToolbarTextField } from './toolbar/ToolbarTextField.js';
export { ToolbarComboBox  } from './toolbar/ToolbarComboBox.js';
```

---

### Missing Feature 2 — Toolbar overflow handler

**Requested:** Responsive overflow: when the toolbar is too narrow to display
all items, excess items collapse into a "More" drop-down button.

**Why it fails today:** `ToolbarConfig` declares `enableOverflow?: boolean` but
the property is read by nothing.  No overflow menu, no "More" button, and no
resize listener exist anywhere in `Toolbar.ts`.

**Technical specification for the fix:**

Required additions to `Toolbar` (conceptual — exact types may differ):

```typescript
// In Toolbar.ts — afterRender additions when enableOverflow is true:

protected override afterRender(): void {
  super.afterRender();
  // … existing flex setup …

  if ((this._config as ToolbarConfig).enableOverflow) {
    this._moreBtn = new Button({
      text: '»',
      ariaLabel: 'More items',
      menu: this._overflowMenu,
    });
    this._moreBtn.renderTo(this.getBodyEl());
    this._resizeObserver = new ResizeObserver(() => this.syncOverflow());
    this._resizeObserver.observe(this.el!);
  }
}

private syncOverflow(): void {
  const bodyWidth = this.getBodyEl().clientWidth;
  const moreBtnWidth = this._moreBtn?.el?.offsetWidth ?? 0;
  const overflowed: Component[] = [];

  let usedWidth = moreBtnWidth;
  for (const item of this.getItems()) {
    if (item === this._moreBtn) continue;
    usedWidth += item.el?.offsetWidth ?? 0;
    if (usedWidth > bodyWidth) {
      item.el!.style.display = 'none';
      overflowed.push(item);
    } else {
      item.el!.style.display = '';
    }
  }

  // Rebuild the overflow menu from hidden items
  this._overflowMenu.removeAll();
  for (const item of overflowed) {
    if (item instanceof Button) {
      this._overflowMenu.add(new MenuItem({
        text: item._config.text ?? '',
        handler: item._config.handler,
      }));
    }
  }
  this._moreBtn!.setVisible(overflowed.length > 0);
}
```

New private fields required on `Toolbar`:
- `_moreBtn: Button | null`
- `_overflowMenu: Menu`
- `_resizeObserver: ResizeObserver | null`

New method required on `Container` (or `Toolbar`):
- `removeAll(): void` — removes and destroys all items

`ResizeObserver` must be mocked in tests (jsdom does not implement it).
See `samples/panel-carousel-demo/tests/Carousel.test.ts` for the mock pattern.
