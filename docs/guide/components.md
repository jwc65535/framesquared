# Components

Components are the building blocks of framesquared applications. Every visible element — panels, buttons, grids, form fields — is a Component.

## Lifecycle

Every component follows this lifecycle:

```
constructor → initialize → render → afterRender → [use] → onDestroy
```

### Constructor & Initialize

```typescript
import { Component } from '@framesquared/component';

class StatusBar extends Component {
  declare private _statusText: string;

  override initialize(): void {
    super.initialize();
    this._statusText = (this._config as any).statusText ?? 'Ready';
  }
}
```

### Rendering

Components render to the DOM when `renderTo` is specified or `render(target)` is called:

```typescript
// Render immediately
const panel = new Panel({ title: 'Now', renderTo: document.body });

// Render later
const btn = new Button({ text: 'Click' });
btn.render(someContainer);
```

### afterRender Hook

Build DOM structure after the element is in the document:

```typescript
class Badge extends Component {
  protected override afterRender(): void {
    super.afterRender();
    this.el!.classList.add('x-badge');
    this.el!.textContent = (this._config as any).count ?? '0';
  }
}
```

### Destruction

```typescript
component.destroy(); // Removes from DOM, clears listeners, sets isDestroyed
```

## Container

`Container` extends `Component` to hold child components:

```typescript
import { Container } from '@framesquared/component';
import { Button } from '@framesquared/ui';

const toolbar = new Container({
  renderTo: document.body,
  items: [
    new Button({ text: 'Save' }),
    new Button({ text: 'Cancel' }),
  ],
});

// Dynamic add/remove
toolbar.add(new Button({ text: 'Help' }));
toolbar.remove(toolbar.getItems()[0]);
```

### Querying Children

```typescript
// Find by xtype
const buttons = container.query('button');

// Find by reference
const saveBtn = container.lookupReference('saveBtn');

// Walk up the tree
const parentPanel = child.up('panel');
```

## Show / Hide

```typescript
component.show();
component.hide();
console.log(component.isVisible()); // true/false
```

## Enable / Disable

```typescript
component.disable(); // Sets aria-disabled, adds CSS class
component.enable();
```

## Sizing

```typescript
const panel = new Panel({
  width: 400,
  height: 300,
  minWidth: 200,
  maxHeight: 600,
});

panel.setSize(500, 400);
```

## HTML Content

```typescript
const panel = new Panel({
  html: '<p>Static content</p>',
});

// Update later
panel.setHtml('<p>Updated content</p>');
```

## Component Events

| Event | When |
|-------|------|
| `beforerender` | Before DOM creation |
| `render` | After DOM creation |
| `afterrender` | After full render cycle |
| `show` | After becoming visible |
| `hide` | After becoming hidden |
| `enable` | After being enabled |
| `disable` | After being disabled |
| `destroy` | During destruction |
| `resize` | After size changes |
