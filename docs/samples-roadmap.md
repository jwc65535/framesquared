# UI Component Samples Roadmap

Tracks which components have demo samples and what remains to be built.
Samples follow the naming convention `samples/{category}-{component}-demo/`.

---

## Status Key

| Symbol | Meaning |
|--------|---------|
| ✅ | Sample exists |
| 🚧 | Partially covered (grouped or as supporting actor) |
| ❌ | No sample |

---

## Layouts

| Component | Sample | Notes |
|-----------|--------|-------|
| AbsoluteLayout | ✅ `layout-absolute-demo` | |
| AccordionLayout | ✅ `layout-accordion-demo` | |
| AnchorLayout | ✅ `layout-anchor-demo` | |
| AutoLayout | ✅ `layout-auto-demo` | Includes tests |
| BorderLayout | ✅ `layout-border-demo` | |
| CardLayout | 🚧 `layout-gallery-demo` | Shown in multi-layout gallery; needs standalone |
| CenterLayout | ✅ `layout-center-demo` | |
| ColumnLayout | ✅ `layout-column-demo` | |
| FitLayout | ✅ `layout-fit-demo` | |
| HBoxLayout | ✅ `layout-hbox-demo` | |
| ResponsiveColumnLayout | ❌ | No sample; responsive breakpoint behavior needs its own demo |
| TableLayout | ✅ `layout-table-demo` | |
| VBoxLayout | ✅ `layout-vbox-demo` | |
| Viewport | ✅ `layout-viewport-demo` | |

---

## Panels & Containers

| Component | Sample | Notes |
|-----------|--------|-------|
| Panel | ✅ `panel-demo` | Includes tests |
| CardContainer | ✅ `panel-card-demo` | |
| Carousel | ✅ `panel-carousel-demo` | Includes tests |
| TabPanel | ✅ `panel-tab-demo` | |
| Window | ✅ `panel-window-demo` | Includes tests |
| MessageBox | 🚧 `panel-menu-messagebox-demo` | Grouped with Menu; consider standalone |
| Accordion | ❌ | Accordion container (not AccordionLayout) |

---

## Navigation & Toolbars

| Component | Sample | Notes |
|-----------|--------|-------|
| Toolbar | ✅ `toolbar-capabilities` | 52 tests; SplitButton, CycleButton, SegmentedButton, menu, toggle groups |
| Paging | ❌ | Paging toolbar for data-bound panels |
| Breadcrumb | ✅ `breadcrumb-capabilities` | 43 tests; icons, dynamic navigation, selectionchange, context menu |

---

## Buttons

| Component | Sample | Notes |
|-----------|--------|-------|
| Button | ✅ `button-showcase` | |
| CycleButton | ✅ `toolbar-capabilities` | Covered within toolbar demo |
| SegmentedButton | ✅ `toolbar-capabilities` | Covered within toolbar demo |
| SplitButton | ✅ `toolbar-capabilities` | Covered within toolbar demo |

---

## Menus & Popups

| Component | Sample | Notes |
|-----------|--------|-------|
| Menu / MenuItem | ✅ `menu-capabilities-demo` | 60 tests; standard, check, radio, nested, context, dynamic |
| CheckItem | ✅ `menu-capabilities-demo` | Radio groups and independent toggles |
| MenuHeader | ✅ `menu-capabilities-demo` | Section grouping with text transform |
| Separator | ✅ `menu-capabilities-demo` | ARIA role="separator" |
| MessageBox | 🚧 `panel-menu-messagebox-demo` | Consider standalone |
| Tooltip | ✅ `panel-tooltip-demo` | Includes tests |
| QuickTip | ❌ | Auto-tooltip from DOM `data-qtip` attributes |

---

## Data Display

| Component | Sample | Notes |
|-----------|--------|-------|
| DataView | ❌ | Foundational component; high priority |
| ListView | ❌ | Specialized DataView for list rendering |
| TreeView | ❌ | Standalone tree without the grid |
| TreePanel | ❌ | Tree inside a panel with title/toolbar |

**Suggested: `panel-dataview-demo`** — cover DataView and ListView together; foundation for TreeView demo.

---

## TreeGrid

The entire TreeGrid ecosystem has no samples. Recommend building demos incrementally,
starting with the core and adding plugin demos one at a time.

| Component | Sample | Notes |
|-----------|--------|-------|
| TreeGrid | ❌ | Core component — start here |
| TreeGridColumn | ❌ | |
| TreeGridView | ❌ | |
| TreeGridSelectionModel | ❌ | |
| TreeGridCellEditing | ❌ | |
| TreeGridRowEditing | ❌ | |
| TreeGridFilterPlugin | ❌ | |
| TreeGridSummary | ❌ | |
| TreeGridGroupingSummary | ❌ | |
| TreeGridRowExpander | ❌ | |
| TreeGridLockable | ❌ | |
| TreeGridExporter | ❌ | |
| TreeGridClipboard | ❌ | |
| TreeGridDragDrop | ❌ | |
| WidgetColumn | ❌ | |

**Suggested: `panel-treegrid-demo`** — core TreeGrid with columns, selection, and basic sorting before tackling plugins.

---

## Forms

All form fields are currently grouped inside `panel-form-demo`. Coverage is comprehensive
but not granular. Per-field standalone demos could be added as the form system evolves.

| Component | Sample | Notes |
|-----------|--------|-------|
| TextField | 🚧 `panel-form-demo` | |
| TextArea | 🚧 `panel-form-demo` | |
| NumberField | 🚧 `panel-form-demo` | |
| DateField | 🚧 `panel-form-demo` | |
| TimeField | 🚧 `panel-form-demo` | |
| ComboBox | 🚧 `panel-form-demo` | |
| Checkbox / CheckboxGroup | 🚧 `panel-form-demo` | |
| Radio / RadioGroup | 🚧 `panel-form-demo` | |
| Slider | 🚧 `panel-form-demo` | |
| Spinner | 🚧 `panel-form-demo` | |
| Tag | 🚧 `panel-form-demo` | |
| HtmlEditor | 🚧 `panel-form-demo` | |
| FileUpload | 🚧 `panel-form-demo` | |
| DisplayField | 🚧 `panel-form-demo` | |
| DatePicker | ❌ | Standalone picker (not embedded in form) |
| ColorPicker | ❌ | Standalone picker |

---

## Suggested Build Order

1. ~~**`toolbar-capabilities`**~~ ✅ — Toolbar + button variants
2. ~~**`breadcrumb-capabilities`**~~ ✅ — Breadcrumb navigation
3. ~~**`menu-capabilities-demo`**~~ ✅ — Full menu system (standard, check, radio, nested, context, dynamic)
4. **`layout-card-demo`** — Standalone CardLayout demo
5. **`layout-responsive-demo`** — ResponsiveColumnLayout breakpoint behavior
6. **`panel-dataview-demo`** — DataView + ListView
7. **`panel-treeview-demo`** — TreeView + TreePanel
8. **`panel-treegrid-demo`** — Core TreeGrid (no plugins)
9. **TreeGrid plugin series** — one demo per major plugin (editing, filter, summary, etc.)
10. **`panel-pickers-demo`** — DatePicker + ColorPicker standalone
11. **`panel-quicktip-demo`** — QuickTip auto-tooltip system
