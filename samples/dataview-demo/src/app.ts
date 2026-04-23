/**
 * dataview-demo — app.ts
 *
 * Demonstrates DataView bound to a typed Store.
 * Ports the classic ExtJS Ghostbusters example to framesquared's
 * type-safe, class-based architecture.
 *
 *   store        — four Ghostbuster records (name + age)
 *   view         — DataView with string itemTpl, singleSelect, trackOver
 *   addBtn       — appends Janine Melnitz to the store (reactive re-render)
 *   removeBtn    — removes the last record from the store
 *
 * Architecture:
 *   GhostbusterModel          — typed Model subclass; defines 'name' + 'age' fields
 *   createDataViewDemo(host)  — pure factory; testable in isolation
 *   DataViewDemoApp           — Application subclass; wires factory into Viewport
 *
 * The Application auto-start is guarded so importing this module during Vitest
 * does not trigger the browser launch sequence.
 */

import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { ModernTheme } from '@framesquared/theme';
import { Button, DataView, Panel, Viewport } from '@framesquared/ui';
import { Model, Store } from '@framesquared/data';

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

export class GhostbusterModel extends Model {
  static override fields = ['name', 'age'];
}

// ---------------------------------------------------------------------------
// Public refs interface
// ---------------------------------------------------------------------------

export interface DataViewDemoRefs {
  view:        DataView;
  store:       Store;
  addBtn:      Button;
  removeBtn:   Button;
  lastClicked: { value: string };
}

// ---------------------------------------------------------------------------
// View factory
// ---------------------------------------------------------------------------

export function createDataViewDemo(host: Element): DataViewDemoRefs {
  // ── Store ────────────────────────────────────────────────────────────────
  const store = new Store({
    model: GhostbusterModel,
    data: [
      { name: 'Peter',   age: 26 },
      { name: 'Ray',     age: 21 },
      { name: 'Egon',    age: 24 },
      { name: 'Winston', age: 24 },
    ],
  });

  // ── DataView ─────────────────────────────────────────────────────────────
  const lastClicked: { value: string } = { value: '' };

  const view = new DataView({
    store,
    itemTpl:      '<div class="x-dataview-item">{name} is {age} years old</div>',
    singleSelect: true,
    trackOver:    true,
    overItemCls:  'x-item-over',
    emptyText:    'No team members.',
    listeners: {
      itemclick: (_v: unknown, record: { get(f: string): unknown }) => {
        lastClicked.value = record.get('name') as string;
      },
    },
  });

  // ── Toolbar buttons ──────────────────────────────────────────────────────
  const addBtn = new Button({
    text:    'Add Member',
    iconCls: 'x-icon-add',
    handler: () => {
      store.add(GhostbusterModel.create({ name: 'Janine', age: 32 }));
    },
  });

  const removeBtn = new Button({
    text:    'Remove Last',
    iconCls: 'x-icon-delete',
    ui:      'danger',
    handler: () => {
      const count = store.getCount();
      if (count > 0) {
        store.remove(store.getAt(count - 1)!);
      }
    },
  });

  // ── Layout ───────────────────────────────────────────────────────────────
  new Panel({
    renderTo: host,
    title:    'Ghostbusters Team',
    width:    480,
    tbar:     [addBtn, removeBtn],
    items:    [view],
  });

  return { view, store, addBtn, removeBtn, lastClicked };
}

// ---------------------------------------------------------------------------
// Application
// ---------------------------------------------------------------------------

class DataViewDemoApp extends Application {
  constructor() {
    super({ name: 'DataViewDemo', theme: ModernTheme });
  }

  override launch(): void {
    const vp = new Viewport({ layout: { type: 'vbox', align: 'center', pack: 'center' } });
    createDataViewDemo(vp.getBodyEl());
  }
}

// Guard: do not auto-start when this module is imported by the test runner.
if (import.meta.env.MODE !== 'test') {
  new DataViewDemoApp().start();
}
