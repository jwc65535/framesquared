# Class System

The ext-ts class system is built on native ES2022 classes enhanced with a config system, Observable events, and utility mixins.

## Base Class

Every ext-ts class extends `Base`, which provides config processing, identity, and destruction:

```typescript
import { Base } from '@ext-ts/core';

class MyClass extends Base {
  static $className = 'MyApp.MyClass';

  declare private _greeting: string;

  constructor(config: { greeting?: string } = {}) {
    super(config);
    this._greeting = (config as any).greeting ?? 'Hello';
  }

  greet(name: string): string {
    return `${this._greeting}, ${name}!`;
  }
}

const obj = new MyClass({ greeting: 'Hi' });
obj.greet('Alice'); // "Hi, Alice!"
obj.destroy();      // Cleans up
```

Key features of `Base`:

- `$className` — static identifier for debugging and xtype resolution
- `isDestroyed` — boolean flag set after `destroy()` is called
- `destroy()` — calls `onDestroy()` hook, sets `isDestroyed = true`
- Config properties use the `declare` + underscore convention: `declare private _myProp: T`

## Observable Mixin

`Observable` adds event support to any class. It's automatically mixed into `Base`:

```typescript
import { Base } from '@ext-ts/core';

const obj = new Base();

// Listen
obj.on('save', (data: unknown) => {
  console.log('Saved:', data);
});

// Fire
obj.fireEvent('save', { id: 1 }); // logs: "Saved: { id: 1 }"

// Remove
obj.un('save', handler);
```

### Listener Options

```typescript
obj.on('change', handler, { single: true });  // Auto-removes after first call
obj.on('resize', handler, { buffer: 200 });   // Debounce to 200ms
obj.on('scroll', handler, { delay: 100 });    // Delay execution by 100ms
```

### Relaying Events

```typescript
parent.relayEvents(child, ['click', 'change']);
// When child fires 'click', parent also fires 'click'
```

### Suspending Events

```typescript
obj.suspendEvents();
obj.fireEvent('change'); // Silenced
obj.resumeEvents();
```

## Hookable Mixin

Provides before/after hooks for method interception:

```typescript
import { Hookable } from '@ext-ts/core';

class Processor extends Hookable(Base) {
  process(data: string): string {
    return data.toUpperCase();
  }
}

const p = new Processor();
p.addHook('before', 'process', (data: string) => {
  console.log('Before:', data);
});
```

## Pluggable Mixin

Enables a plugin architecture:

```typescript
import { Plugin } from '@ext-ts/core';

class LoggerPlugin extends Plugin {
  init(host: Base): void {
    host.on('action', () => console.log('Action fired'));
  }
}

const component = new Component({ plugins: [new LoggerPlugin()] });
```

## Type-Safe Events

Use `TypedObservable` for compile-time event safety:

```typescript
import type { EventMap, TypedObservable } from '@ext-ts/core';

interface MyEvents extends EventMap {
  save: [data: Record<string, unknown>];
  cancel: [];
}

class MyForm extends Base implements TypedObservable<MyEvents> {
  // TypeScript enforces correct event names and argument types
}
```

## KeyMap

Declarative keyboard shortcuts:

```typescript
import { KeyMap } from '@ext-ts/core';

const km = new KeyMap({
  target: document.body,
  bindings: [
    { key: 'Ctrl+S', handler: () => save(), preventDefault: true },
    { key: 'Escape', handler: () => cancel() },
  ],
});
```
