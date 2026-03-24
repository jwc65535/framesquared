# Migration from ExtJS to framesquared

This guide maps every major ExtJS API to its framesquared equivalent, helping you migrate existing ExtJS applications to the modern TypeScript implementation.

## Key Differences

| Aspect | ExtJS | framesquared |
|--------|-------|--------|
| Language | JavaScript | TypeScript (ES2022) |
| Modules | AMD (`Ext.define`) | ESM (`import`/`export`) |
| Class System | `Ext.define('MyApp.view.Main', {...})` | `class Main extends Panel {}` |
| Browser Support | IE8+ (classic), IE11+ (modern) | Chrome 90+, Firefox 90+, Safari 15+ |
| Rendering | innerHTML + ExtJS templates | DOM API + Component lifecycle |
| Bundling | Sencha Cmd | tsup / Vite / Rollup |
| Testing | Jasmine / Siesta | Vitest |
| Package Manager | Sencha Cmd packages | npm / pnpm workspaces |

## Class System

### Defining Classes

```javascript
// ExtJS
Ext.define('MyApp.model.User', {
    extend: 'Ext.data.Model',
    fields: ['id', 'name', 'email'],
    config: { displayName: '' },
    getFullInfo: function() {
        return this.get('name') + ' <' + this.get('email') + '>';
    }
});
```

```typescript
// framesquared
import { Model } from '@framesquared/data';

class User extends Model {
  static fields = [
    { name: 'id', type: 'int' },
    { name: 'name', type: 'string' },
    { name: 'email', type: 'string' },
  ];

  getFullInfo(): string {
    return `${this.get('name')} <${this.get('email')}>`;
  }
}
```

### Mixins

```javascript
// ExtJS
Ext.define('MyApp.mixin.Printable', {
    print: function() { /* ... */ }
});
Ext.define('MyApp.view.Report', {
    extend: 'Ext.panel.Panel',
    mixins: ['MyApp.mixin.Printable']
});
```

```typescript
// framesquared — use TypeScript mixins or composition
import { Panel } from '@framesquared/ui';

// Composition approach (preferred)
class Report extends Panel {
  print(): void { /* ... */ }
}
```

## Core API Mapping

| ExtJS | framesquared | Notes |
|-------|--------|-------|
| `Ext.Base` | `Base` from `@framesquared/core` | Native ES class |
| `Ext.define()` | `class X extends Y {}` | Standard ES class syntax |
| `Ext.create()` | `new Component({...})` | Standard constructor |
| `Ext.apply()` | `Object.assign()` | Native JS |
| `Ext.emptyFn` | `() => {}` | Arrow function |
| `Ext.isArray()` | `Array.isArray()` | Native JS |
| `Ext.isObject()` | `typeof x === 'object'` | Native JS |
| `Ext.isString()` | `typeof x === 'string'` | Native JS |
| `Ext.isEmpty()` | `!x` or utility | Native JS |
| `Ext.encode()` | `JSON.stringify()` | Native JS |
| `Ext.decode()` | `JSON.parse()` | Native JS |
| `Ext.defer()` | `setTimeout()` | Native JS |
| `Ext.fly()` | `document.querySelector()` | Native DOM |
| `Ext.get()` | `document.getElementById()` | Native DOM |
| `Ext.query()` | `document.querySelectorAll()` | Native DOM |
| `Ext.getDom()` | Direct DOM access | Native DOM |

## Event System

| ExtJS | framesquared | Notes |
|-------|--------|-------|
| `obj.on('click', fn)` | `obj.on('click', fn)` | Same API via Observable mixin |
| `obj.un('click', fn)` | `obj.un('click', fn)` | Same API |
| `obj.fireEvent('click', args)` | `obj.fireEvent('click', args)` | Same API |
| `obj.addListener()` | `obj.on()` | Alias |
| `obj.removeListener()` | `obj.un()` | Alias |
| `obj.suspendEvents()` | `obj.suspendEvents()` | Same API |
| `obj.resumeEvents()` | `obj.resumeEvents()` | Same API |
| `obj.relayEvents()` | `obj.relayEvents()` | Same API |
| `listeners` config | `listeners` config | Same pattern |
| `{ single: true }` | `{ single: true }` | Same options |
| `{ buffer: 500 }` | `{ buffer: 500 }` | Same options |
| `{ delay: 100 }` | `{ delay: 100 }` | Same options |

## Component

| ExtJS | framesquared | Notes |
|-------|--------|-------|
| `Ext.Component` | `Component` from `@framesquared/component` | |
| `Ext.container.Container` | `Container` from `@framesquared/component` | |
| `renderTo` config | `renderTo` config | Same |
| `xtype` | `xtype` config | Same pattern |
| `items` config | `items` config | Same, but use `new Component()` not xtype strings |
| `component.show()` | `component.show()` | Same |
| `component.hide()` | `component.hide()` | Same |
| `component.destroy()` | `component.destroy()` | Same |
| `component.up()` | `component.up()` | Same |
| `component.down()` | `component.down(selector)` | Same |
| `component.query()` | `component.query(selector)` | Same |
| `component.lookupReference()` | `component.lookupReference(ref)` | Same |
| `initComponent()` | `initialize()` | Renamed |
| `afterRender()` | `afterRender()` | Same |
| `onDestroy()` | `onDestroy()` | Same |
| `beforeRender` event | `beforerender` event | Same |
| `render` event | `render` event | Same |
| `afterrender` event | `afterrender` event | Same |

## Data Layer

### Model

| ExtJS | framesquared | Notes |
|-------|--------|-------|
| `Ext.data.Model` | `Model` from `@framesquared/data` | |
| `fields` config array | `static fields` class property | Static, not config |
| `model.get('name')` | `model.get('name')` | Same |
| `model.set('name', v)` | `model.set('name', v)` | Same |
| `model.getData()` | `model.getData()` | Same |
| `model.getId()` | `model.getId()` | Same |
| `model.isValid()` | `model.isValid()` | Same |
| `model.getValidation()` | `model.validate()` | Returns `ValidationResult` |
| `Ext.data.Model.create()` | `Model.create({...})` | Static factory |
| `idProperty` | `static idProperty` | Same concept |
| `proxy` | Configured separately | Not on Model |

### Store

| ExtJS | framesquared | Notes |
|-------|--------|-------|
| `Ext.data.Store` | `Store` from `@framesquared/data` | |
| `store.load()` | `store.load()` | Same |
| `store.add(record)` | `store.add(record)` | Same |
| `store.remove(record)` | `store.remove(record)` | Same |
| `store.removeAt(idx)` | `store.removeAt(idx)` | Same |
| `store.removeAll()` | `store.removeAll()` | Same |
| `store.getAt(idx)` | `store.getAt(idx)` | Same |
| `store.getById(id)` | `store.getById(id)` | Same |
| `store.getRange()` | `store.getRange()` | Same |
| `store.getCount()` | `store.getCount()` | Same |
| `store.each(fn)` | `store.each(fn)` | Same |
| `store.sort('field')` | `store.sort('field')` | Same |
| `store.filter('f', v)` | `store.filter('f', v)` | Same |
| `store.clearFilter()` | `store.clearFilter()` | Same |
| `store.group('field')` | `store.group('field')` | Same |
| `autoLoad` config | `autoLoad` config | Same |
| `pageSize` config | `pageSize` config | Same |
| `remoteSort` config | `remoteSort` config | Same |
| `remoteFilter` config | `remoteFilter` config | Same |

### Proxy

| ExtJS | framesquared | Notes |
|-------|--------|-------|
| `Ext.data.proxy.Ajax` | `AjaxProxy` from `@framesquared/data` | Uses `fetch()` not XHR |
| `Ext.data.proxy.Rest` | `RestProxy` from `@framesquared/data` | Same REST patterns |
| `Ext.data.proxy.Memory` | `MemoryProxy` from `@framesquared/data` | Same |
| `Ext.data.proxy.LocalStorage` | `LocalStorageProxy` | Same |
| `Ext.data.proxy.SessionStorage` | `SessionStorageProxy` | Same |
| — | `GraphQLProxy` | New: GraphQL support |
| — | `WebSocketProxy` | New: WebSocket real-time |
| — | `BatchProxy` | New: batch operations |
| `reader` config | `JsonReader`, `ArrayReader`, `XmlReader` | Same concepts |
| `writer` config | `JsonWriter`, `XmlWriter` | Same concepts |

## UI Components

### Panel

| ExtJS | framesquared | Notes |
|-------|--------|-------|
| `Ext.panel.Panel` | `Panel` from `@framesquared/ui` | |
| `title` | `title` | Same |
| `header` | Auto-generated from title | Same |
| `tools` | `tools` config | Same |
| `collapsible` | `collapsible` | Same |
| `collapsed` | `collapsed` | Same |
| `closable` | `closable` | Same |
| `dockedItems` | `dockedItems` | Same |
| `html` config | `html` config | Same |
| `bodyPadding` | `bodyPadding` | Same |
| `frame` | `frame` | Same |

### Button

| ExtJS | framesquared | Notes |
|-------|--------|-------|
| `Ext.button.Button` | `Button` from `@framesquared/ui` | |
| `text` | `text` | Same |
| `iconCls` | `iconCls` | Same |
| `handler` | `handler` | Same |
| `enableToggle` | `enableToggle` | Same |
| `toggleGroup` | `toggleGroup` | Same |
| `menu` | `menu` | Same |
| `scale` | `scale` | Same |
| `Ext.button.Split` | `SplitButton` | Same |
| `Ext.button.Cycle` | `CycleButton` | Same |
| `Ext.button.Segmented` | `SegmentedButton` | Same |

### Window

| ExtJS | framesquared | Notes |
|-------|--------|-------|
| `Ext.window.Window` | `Window` from `@framesquared/ui` | |
| `modal` | `modal` | Same |
| `draggable` | `draggable` | Same |
| `resizable` | `resizable` | Same |
| `maximizable` | `maximizable` | Same |
| `minimizable` | `minimizable` | Same |
| `constrain` | `constrain` | Same |
| `Ext.window.MessageBox` | `MessageBox` | Same |

### Grid

| ExtJS | framesquared | Notes |
|-------|--------|-------|
| `Ext.grid.Panel` | `Grid` from `@framesquared/grid` | |
| `store` config | `store` config | Same |
| `columns` config | `columns` config | Same |
| Column `text` | Column `text` | Same |
| Column `dataIndex` | Column `dataIndex` | Same |
| Column `width`/`flex` | Column `width`/`flex` | Same |
| Column `renderer` | Column `renderer` | Same |
| Column `sortable` | Column `sortable` | Same |
| `Ext.grid.column.Number` | `NumberColumn` | Same |
| `Ext.grid.column.Date` | `DateColumn` | Same |
| `Ext.grid.column.Boolean` | `BooleanColumn` | Same |
| `Ext.grid.column.Check` | `CheckColumn` | Same |
| `Ext.grid.column.Action` | `ActionColumn` | Same |
| `Ext.grid.column.RowNumberer` | `RowNumbererColumn` | Same |
| `Ext.selection.RowModel` | `RowSelectionModel` | Same |
| `Ext.selection.CellModel` | `CellSelectionModel` | Same |
| `Ext.selection.SpreadsheetModel` | `SpreadsheetSelectionModel` | Same |
| `Ext.grid.feature.Grouping` | `Grouping` | Same |
| `Ext.grid.feature.Summary` | `Summary` | Same |
| `Ext.grid.plugin.CellEditing` | `CellEditing` | Same |
| `Ext.grid.plugin.RowEditing` | `RowEditing` | Same |
| `Ext.grid.Lockable` | `Lockable` | Same |
| `Ext.grid.state` | `GridState` | Same |

### Tree

| ExtJS | framesquared | Notes |
|-------|--------|-------|
| `Ext.tree.Panel` | `TreePanel` from `@framesquared/grid` | |
| `Ext.data.TreeStore` | `TreeStore` from `@framesquared/grid` | |
| `rootVisible` | `rootVisible` | Same |
| `singleExpand` | `singleExpand` | Same |
| `checkable` | `checkable` | Same |
| `cascadeCheck` | `cascadeCheck` | Same |
| `expandAll()` | `expandAll()` | Same |
| `collapseAll()` | `collapseAll()` | Same |
| `expandPath()` | `expandPath()` | Same |

### TabPanel

| ExtJS | framesquared | Notes |
|-------|--------|-------|
| `Ext.tab.Panel` | `TabPanel` from `@framesquared/ui` | |
| `activeTab` | `activeTab` | Same |
| `tabPosition` | `tabPosition` | Same |
| `deferredRender` | `deferredRender` | Same |
| `plain` | `plain` | Same |
| `setActiveTab()` | `setActiveTab()` | Same |
| `beforetabchange` | `beforetabchange` | Same |
| `tabchange` | `tabchange` | Same |

### Form Fields

| ExtJS | framesquared | Notes |
|-------|--------|-------|
| `Ext.form.Panel` | `FormPanel` from `@framesquared/form` | |
| `Ext.form.field.Text` | `TextField` | Same |
| `Ext.form.field.Number` | `NumberField` | Same |
| `Ext.form.field.Date` | `DateField` | Same |
| `Ext.form.field.ComboBox` | `ComboBox` | Same |
| `Ext.form.field.Checkbox` | `Checkbox` | Same |
| `Ext.form.field.Radio` | `Radio` | Same |
| `Ext.form.field.TextArea` | `TextArea` | Same |
| `Ext.form.field.Hidden` | `HiddenField` | Same |
| `Ext.form.field.Display` | `DisplayField` | Same |
| `Ext.form.field.Tag` | `TagField` | Same |
| `Ext.form.field.Slider` | `Slider` | Same |
| `Ext.form.field.File` | `FileUploadField` | Same |
| `Ext.form.field.HtmlEditor` | `HtmlEditor` | Same |
| `Ext.form.field.Spinner` | `Spinner` | Same |
| `Ext.picker.Date` | `DatePicker` | Same |
| `Ext.picker.Color` | `ColorPicker` | Same |
| `getValues()` | `getValues()` | Same |
| `setValues()` | `setValues()` | Same |
| `isValid()` | `isValid()` | Same |
| `submit()` | `submit()` | Uses `fetch()` |

## Layout

| ExtJS | framesquared | Notes |
|-------|--------|-------|
| `Ext.layout.container.Auto` | `AutoLayout` | Same |
| `Ext.layout.container.HBox` | `HBoxLayout` | Same |
| `Ext.layout.container.VBox` | `VBoxLayout` | Same |
| `Ext.layout.container.Fit` | `FitLayout` | Same |
| `Ext.layout.container.Card` | `CardLayout` | Same |
| `Ext.layout.container.Anchor` | `AnchorLayout` | Same |
| `Ext.layout.container.Border` | `BorderLayout` | Same |
| `Ext.layout.container.Column` | `ColumnLayout` | Same |
| `Ext.layout.container.Table` | `TableLayout` | Same |
| `Ext.layout.container.Absolute` | `AbsoluteLayout` | Same |
| `Ext.layout.container.Accordion` | `AccordionLayout` | Same |
| `layout: 'hbox'` | `layout: 'hbox'` or explicit class | Same string shorthand |

## Application Architecture

| ExtJS | framesquared | Notes |
|-------|--------|-------|
| `Ext.application()` | `new Application({...})` | Constructor, not factory |
| `Ext.app.Application` | `Application` from `@framesquared/app` | Same concept |
| `Ext.app.ViewController` | `ViewController` | Same |
| `Ext.app.ViewModel` | `ViewModel` | Same |
| `Ext.util.History` | `Router` | Hash-based routing |
| `ViewModel.data` | `data` config | Same |
| `ViewModel.formulas` | `formulas` config | Same — uses `get()` callback |
| `ViewModel.stores` | `stores` config | Same |
| `bind: '{value}'` | `Binding.parse('{value}')` | Explicit binding API |
| `two-way bind` | `Binding.twoWay(vm, path, fn)` | Explicit |
| `reference` config | `reference` config | Same |
| `controller.control` | `control` config | Same selector → event mapping |

## Drag & Drop

| ExtJS | framesquared | Notes |
|-------|--------|-------|
| `Ext.dd.DragSource` | `Draggable` from `@framesquared/dd` | PointerEvents instead of mouse |
| `Ext.dd.DropTarget` | `Droppable` | Same |
| `Ext.dd.DragDrop` | `DragManager` (singleton) | Global coordinator |
| `Ext.dd.StatusProxy` | `DragProxy` | Same concept |
| `Ext.util.Sortable` | `Sortable` | DOM-based |
| `Ext.resizer.Resizer` | `Resizable` | Same |

## Animation

| ExtJS | framesquared | Notes |
|-------|--------|-------|
| `Ext.fx.Anim` | `Animation` from `@framesquared/fx` | Uses Web Animations API |
| `Ext.fx.Manager` | `Anim` (factory) | Predefined animations |
| `Ext.Element.animate()` | `Anim.fadeIn(el)` | Factory methods |
| Custom easing | `Easing` constants | CSS cubic-bezier strings |
| `Ext.fx.Queue` | `Anim.queue([...])` | Promise-based |

## Theming

| ExtJS | framesquared | Notes |
|-------|--------|-------|
| SASS variables | CSS custom properties | `--ext-color-primary` |
| `Ext.theme.*` | `Theme` from `@framesquared/theme` | Token-based |
| Theme packages | `ClassicTheme`, `ModernTheme`, `DarkTheme` | Built-in |
| `Ext.util.CSS` | `StyleSheet` | Rule injection |
| Theme switching | `ThemeManager.setTheme()` | Runtime switching |

## Accessibility

| ExtJS | framesquared | Notes |
|-------|--------|-------|
| `Ext.util.Aria` | `AriaManager` from `@framesquared/core` | Same concept |
| `Ext.util.FocusManager` | `FocusManager` | Focus trapping |
| `ariaRole` config | Auto-applied per component | Automatic |
| `ariaLabel` config | Auto-applied from `title`/`text` | Automatic |

## i18n

| ExtJS | framesquared | Notes |
|-------|--------|-------|
| `Ext.util.Format` | `Locale` from `@framesquared/core` | Uses `Intl` API |
| Locale overrides | `LocaleManager.setLocale()` | Runtime switching |
| RTL support | `dir="rtl"` on `<html>` | Automatic via locale |
| `Ext.Date.format()` | `locale.formatDate()` | Uses `Intl.DateTimeFormat` |
| `Ext.util.Format.number()` | `locale.formatNumber()` | Uses `Intl.NumberFormat` |

## What's New in framesquared (Not in ExtJS)

| Feature | Description |
|---------|-------------|
| `GraphQLProxy` | Native GraphQL query/mutation support |
| `WebSocketProxy` | Real-time data via WebSocket with auto-reconnect |
| `BatchProxy` | Combine multiple operations into single HTTP request |
| `Connection` | Centralized fetch with interceptors |
| `Session` | Track changes across multiple stores, batch save |
| `Binding.multiBind` | Bind to multiple paths simultaneously |
| `ViewModel` hierarchy | Parent/child with inheritance and propagation |
| `Scheduler` | Microtask-based change batching |
| CSS custom properties | Runtime theme switching without rebuild |
| `Intl` formatting | Locale-aware number, date, collation |
| Web Animations API | Hardware-accelerated animations |
| PointerEvents | Unified mouse/touch/pen input |
| Full TypeScript | Type-safe APIs throughout |
| Tree shaking | Import only what you use |
| ESM only | No AMD/CommonJS overhead |
