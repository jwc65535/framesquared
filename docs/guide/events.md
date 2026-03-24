# Event System

ext-ts provides a rich event system built on the Observable mixin, with support for listener options, event domains, bubbling, and keyboard maps.

## Basic Usage

```typescript
// Listen
component.on('click', (comp, event) => {
  console.log('Clicked:', comp);
});

// Fire
component.fireEvent('click', component, { x: 100 });

// Unlisten
component.un('click', handler);
```

## Listener Options

```typescript
component.on('resize', handler, {
  single: true,       // Remove after first fire
  buffer: 200,        // Debounce: fire at most every 200ms
  delay: 100,         // Delay execution by 100ms
  scope: this,        // Set `this` context
});
```

## Config Listeners

```typescript
const panel = new Panel({
  title: 'My Panel',
  listeners: {
    render: () => console.log('Rendered'),
    resize: (p, w, h) => console.log(`Resized to ${w}x${h}`),
    destroy: () => console.log('Destroyed'),
  },
});
```

## Event Bubbling

Events bubble up the component hierarchy:

```typescript
const child = new Button({ text: 'Click' });
const parent = new Panel({ items: [child] });

parent.on('click', () => console.log('Bubbled to parent'));
child.fireEvent('click'); // Parent handler fires
```

## Relay Events

Forward events from one object to another:

```typescript
parent.relayEvents(child, ['save', 'cancel']);
// When child fires 'save', parent also fires 'save'
```

## Suspend / Resume

```typescript
obj.suspendEvents();
obj.fireEvent('change'); // Silenced
obj.resumeEvents();
obj.fireEvent('change'); // Fires normally
```

## EventBus (Global)

Application-wide event bus for decoupled communication:

```typescript
import { EventBus } from '@ext-ts/core';

EventBus.on('user:login', (user) => updateUI(user));
EventBus.fire('user:login', { name: 'Alice' });
```

## EventDomain

Group related listeners with automatic cleanup:

```typescript
import { EventDomain } from '@ext-ts/core';

const domain = new EventDomain();
domain.listen(button, 'click', handler);
domain.listen(store, 'load', handler2);

// Clean up all at once
domain.destroy();
```

## KeyMap

Declarative keyboard shortcuts:

```typescript
import { KeyMap } from '@ext-ts/core';

const km = new KeyMap({
  target: gridEl,
  bindings: [
    { key: 'Delete', handler: () => deleteSelected() },
    { key: 'Ctrl+C', handler: () => copySelected(), preventDefault: true },
    { key: 'Ctrl+V', handler: () => paste(), preventDefault: true },
    { key: 'F2', handler: () => startEdit() },
    { key: 'Escape', handler: () => cancelEdit() },
  ],
});

km.enable();
km.disable();
km.destroy();
```

## GestureRecognizer

Recognize touch/pointer gestures:

```typescript
import { GestureRecognizer } from '@ext-ts/core';

const gr = new GestureRecognizer({
  target: element,
  gestures: {
    tap: (e) => handleTap(e),
    longpress: (e) => showContextMenu(e),
    swipeleft: (e) => nextPage(),
    swiperight: (e) => prevPage(),
  },
});
```
