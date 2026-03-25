/**
 * framesquared Basic CRUD Application
 *
 * Demonstrates: Model, Store, Grid, FormPanel, ViewController,
 * ViewModel, Panel layout, Button handlers.
 *
 * Run: npx vite (with appropriate vite config)
 */

import { Model, Store } from '@framesquared/data';
import { Grid, RowSelectionModel } from '@framesquared/grid';
import { FormPanel, TextField, NumberField } from '@framesquared/form';
import { Panel, Button } from '@framesquared/ui';
import { Application, ViewModel } from '@framesquared/app';
import { ThemeManager, ModernTheme } from '@framesquared/theme';

// ─── Model ───────────────────────────────────────────────────────────────

class Contact extends Model {
  static fields = [
    { name: 'id', type: 'int' as const },
    { name: 'firstName', type: 'string' as const },
    { name: 'lastName', type: 'string' as const },
    { name: 'email', type: 'string' as const },
    { name: 'age', type: 'int' as const },
  ];
}

// ─── Store ───────────────────────────────────────────────────────────────

const store = new Store({
  model: Contact,
  data: [
    { id: 1, firstName: 'Alice', lastName: 'Johnson', email: 'alice@example.com', age: 28 },
    { id: 2, firstName: 'Bob', lastName: 'Smith', email: 'bob@example.com', age: 34 },
    { id: 3, firstName: 'Charlie', lastName: 'Brown', email: 'charlie@example.com', age: 22 },
    { id: 4, firstName: 'Diana', lastName: 'Prince', email: 'diana@example.com', age: 31 },
    { id: 5, firstName: 'Eve', lastName: 'Wilson', email: 'eve@example.com', age: 27 },
  ],
});

// ─── ViewModel ───────────────────────────────────────────────────────────

const vm = new ViewModel({
  data: {
    selectedContact: null as Model | null,
    contactCount: store.getCount(),
    isEditing: false,
  },
  formulas: {
    statusText: (get) => {
      const count = get('contactCount') as number;
      const editing = get('isEditing');
      if (editing) return 'Editing contact...';
      return `${count} contact(s)`;
    },
  },
});

// ─── Grid ────────────────────────────────────────────────────────────────

const selModel = new RowSelectionModel({ mode: 'SINGLE' });

const grid = new Grid({
  title: 'Contacts',
  store: {
    getRange: () => store.getRange(),
    getCount: () => store.getCount(),
    getAt: (i: number) => store.getAt(i),
    sort: (f: string) => store.sort(f),
    on: (e: string, fn: Function) => store.on(e as any, fn as any),
    fireEvent: (e: string, ...a: unknown[]) => (store as any).fireEvent(e, ...a),
    each: (fn: Function) => store.each(fn as any),
    getTotalCount: () => store.getTotalCount(),
    isLoading: () => false,
    data: { items: store.getRange() },
  },
  columns: [
    { text: 'First Name', dataIndex: 'firstName', flex: 1, sortable: true },
    { text: 'Last Name', dataIndex: 'lastName', flex: 1, sortable: true },
    { text: 'Email', dataIndex: 'email', flex: 2 },
    { text: 'Age', dataIndex: 'age', width: 80, sortable: true },
  ],
});

selModel.on('selectionchange', (_sm: unknown, selected: Model[]) => {
  const record = selected[0] ?? null;
  vm.set('selectedContact', record);
  vm.set('isEditing', record !== null);
  if (record) {
    form.setValues(record.getData() as Record<string, unknown>);
  } else {
    form.reset();
  }
});

// ─── Form ────────────────────────────────────────────────────────────────

const firstNameField = new TextField({ name: 'firstName', fieldLabel: 'First Name', allowBlank: false });
const lastNameField = new TextField({ name: 'lastName', fieldLabel: 'Last Name', allowBlank: false });
const emailField = new TextField({ name: 'email', fieldLabel: 'Email' });
const ageField = new NumberField({ name: 'age', fieldLabel: 'Age', minValue: 0, maxValue: 150 });

const form = new FormPanel({
  title: 'Edit Contact',
  items: [firstNameField, lastNameField, emailField, ageField],
});

// ─── Buttons ─────────────────────────────────────────────────────────────

const saveBtn = new Button({
  text: 'Save',
  handler() {
    if (!form.isValid()) return;
    const selected = vm.get('selectedContact') as Model | null;
    if (!selected) return;
    const values = form.getValues() as Record<string, unknown>;
    for (const [key, val] of Object.entries(values)) {
      selected.set(key, val);
    }
    store.fireEvent('datachanged', store);
    vm.set('isEditing', false);
  },
});

const deleteBtn = new Button({
  text: 'Delete',
  handler() {
    const selected = vm.get('selectedContact') as Model | null;
    if (selected) {
      store.remove(selected);
      vm.set('contactCount', store.getCount());
      vm.set('selectedContact', null);
    }
  },
});

const addBtn = new Button({
  text: 'Add Contact',
  handler() {
    const id = store.getCount() + 100;
    const rec = Contact.create({ id, firstName: 'New', lastName: 'Contact', email: '', age: 0 });
    store.add(rec);
    vm.set('contactCount', store.getCount());
  },
});

// ─── Application ─────────────────────────────────────────────────────────

ThemeManager.register(ModernTheme);
ThemeManager.setTheme('modern');

const app = new Application({
  name: 'ContactsApp',
  launch() {
    // Layout: grid on left, form on right
    const mainPanel = new Panel({
      title: 'Contacts CRUD Application',
      renderTo: document.body,
      items: [grid, form, addBtn, saveBtn, deleteBtn],
    });
    // Grid must be rendered before init so getView() returns the live table
    selModel.init(grid);
  },
});

app.start();
