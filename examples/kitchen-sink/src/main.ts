/**
 * ext-ts Kitchen Sink — Showcase of All Components
 *
 * Each tab demonstrates a different component category.
 * Demonstrates: Every major component, layout, theme, accessibility.
 */

import { Model, Store } from '@ext-ts/data';
import { Grid, RowSelectionModel, TreePanel, TreeStore, Grouping } from '@ext-ts/grid';
import {
  FormPanel, TextField, TextArea, NumberField, DateField,
  ComboBox, TagField, Checkbox, Radio, CheckboxGroup, RadioGroup,
  Slider, FileUploadField, HtmlEditor, Spinner,
  DatePicker, ColorPicker,
} from '@ext-ts/form';
import {
  Panel, Button, SplitButton, CycleButton, SegmentedButton,
  Toolbar, Menu, MenuItem, CheckItem, MenuSeparator,
  Window as ExtWindow, MessageBox,
  TabPanel, Tooltip,
  Viewport, Accordion, CardContainer, Breadcrumb,
} from '@ext-ts/ui';
import { Draggable, Droppable, Sortable, Resizable } from '@ext-ts/dd';
import { Anim, Animation, Easing, Transition } from '@ext-ts/fx';
import { Application, ViewModel, ViewController, Router } from '@ext-ts/app';
import {
  ThemeManager, ModernTheme, DarkTheme, ClassicTheme, StyleSheet,
} from '@ext-ts/theme';
import {
  AriaManager, FocusManager,
  LocaleManager, enUS, esES, arSA,
  Locale,
} from '@ext-ts/core';

// ─── Setup ───────────────────────────────────────────────────────────────

ThemeManager.register(ClassicTheme);
ThemeManager.register(ModernTheme);
ThemeManager.register(DarkTheme);
ThemeManager.setTheme('modern');

LocaleManager.register(enUS);
LocaleManager.register(esES);
LocaleManager.register(arSA);
LocaleManager.setLocale('en-US');

// ─── Demo Data ───────────────────────────────────────────────────────────

class Person extends Model {
  static fields = [
    { name: 'id', type: 'int' as const },
    { name: 'name', type: 'string' as const },
    { name: 'email', type: 'string' as const },
    { name: 'role', type: 'string' as const },
    { name: 'salary', type: 'int' as const },
  ];
}

const demoStore = new Store({
  model: Person,
  data: [
    { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', role: 'Engineer', salary: 95000 },
    { id: 2, name: 'Grace Hopper', email: 'grace@example.com', role: 'Architect', salary: 110000 },
    { id: 3, name: 'Alan Turing', email: 'alan@example.com', role: 'Researcher', salary: 105000 },
    { id: 4, name: 'Margaret Hamilton', email: 'margaret@example.com', role: 'Director', salary: 130000 },
    { id: 5, name: 'Linus Torvalds', email: 'linus@example.com', role: 'Engineer', salary: 125000 },
  ],
});

// ─── Tab: Buttons ────────────────────────────────────────────────────────

const buttonsTab = new Panel({
  title: 'Buttons',
  items: [
    new Button({ text: 'Default Button' }),
    new Button({ text: 'Primary', ui: 'primary' }),
    new Button({ text: 'Success', ui: 'success' }),
    new Button({ text: 'Danger', ui: 'danger' }),
    new Button({ text: 'Toggle', enableToggle: true }),
    new Button({ text: 'Disabled', disabled: true }),
    new Button({
      text: 'With Menu',
      menu: new Menu({
        items: [
          new MenuItem({ text: 'Option A' }),
          new MenuItem({ text: 'Option B' }),
          new MenuSeparator(),
          new CheckItem({ text: 'Check me' }),
        ],
      }),
    }),
    new SegmentedButton({
      items: [
        new Button({ text: 'Day' }),
        new Button({ text: 'Week' }),
        new Button({ text: 'Month' }),
      ],
    }),
  ],
});

// ─── Tab: Panels ─────────────────────────────────────────────────────────

const panelsTab = new Panel({
  title: 'Panels & Windows',
  items: [
    new Panel({ title: 'Simple Panel', html: '<p>Panel with title and body.</p>', collapsible: true }),
    new Panel({ title: 'Framed Panel', frame: true, html: '<p>With frame styling.</p>' }),
    new Button({
      text: 'Open Window',
      handler: () => new ExtWindow({
        title: 'Sample Window',
        modal: true,
        renderTo: document.body,
        html: '<p>This is a modal window.</p>',
      }),
    }),
    new Button({
      text: 'Show MessageBox',
      handler: () => MessageBox.alert('Alert', 'This is an alert message.'),
    }),
  ],
});

// ─── Tab: Forms ──────────────────────────────────────────────────────────

const formsTab = new Panel({
  title: 'Forms',
  items: [
    new FormPanel({
      title: 'All Field Types',
      items: [
        new TextField({ name: 'text', fieldLabel: 'Text Field', allowBlank: false }),
        new TextArea({ name: 'textarea', fieldLabel: 'Text Area', rows: 3 }),
        new NumberField({ name: 'number', fieldLabel: 'Number', minValue: 0, maxValue: 100 }),
        new ComboBox({
          name: 'combo', fieldLabel: 'ComboBox',
          store: [
            { value: 'js', text: 'JavaScript' },
            { value: 'ts', text: 'TypeScript' },
            { value: 'rs', text: 'Rust' },
          ],
          displayField: 'text', valueField: 'value',
        }),
        new Checkbox({ name: 'agree', fieldLabel: 'Checkbox', boxLabel: 'I agree' }),
        new Slider({ name: 'slider', fieldLabel: 'Slider', minValue: 0, maxValue: 100 }),
      ],
    }),
  ],
});

// ─── Tab: Grid ───────────────────────────────────────────────────────────

const gridTab = new Panel({
  title: 'Grid',
  items: [
    new Grid({
      title: 'People',
      store: {
        getRange: () => demoStore.getRange(),
        getCount: () => demoStore.getCount(),
        getAt: (i: number) => demoStore.getAt(i),
        sort: (f: string) => demoStore.sort(f),
        on: (e: string, fn: Function) => demoStore.on(e as any, fn as any),
        fireEvent: () => {},
        each: (fn: Function) => demoStore.each(fn as any),
        getTotalCount: () => demoStore.getTotalCount(),
        isLoading: () => false,
        data: { items: demoStore.getRange() },
      },
      columns: [
        { text: 'Name', dataIndex: 'name', flex: 1, sortable: true },
        { text: 'Email', dataIndex: 'email', flex: 1 },
        { text: 'Role', dataIndex: 'role', width: 120 },
        { text: 'Salary', dataIndex: 'salary', width: 100, renderer: (v: number) => `$${v.toLocaleString()}` },
      ],
    }),
  ],
});

// ─── Tab: Themes ─────────────────────────────────────────────────────────

const themesTab = new Panel({
  title: 'Themes & i18n',
  items: [
    new Toolbar({
      items: [
        new Button({ text: 'Classic', handler: () => ThemeManager.setTheme('classic') }),
        new Button({ text: 'Modern', handler: () => ThemeManager.setTheme('modern') }),
        new Button({ text: 'Dark', handler: () => ThemeManager.setTheme('dark') }),
      ],
    }),
    new Toolbar({
      items: [
        new Button({ text: 'English', handler: () => LocaleManager.setLocale('en-US') }),
        new Button({ text: 'Español', handler: () => LocaleManager.setLocale('es-ES') }),
        new Button({ text: 'العربية', handler: () => LocaleManager.setLocale('ar-SA') }),
      ],
    }),
    new Panel({
      title: 'Theme Info',
      html: `<p>Current: ${ThemeManager.getActiveThemeName()}</p>
             <p>Primary: ${ThemeManager.getToken('color.primary')}</p>`,
    }),
  ],
});

// ─── Main Application ────────────────────────────────────────────────────

const app = new Application({
  name: 'KitchenSink',
  launch() {
    new TabPanel({
      renderTo: document.body,
      items: [buttonsTab, panelsTab, formsTab, gridTab, themesTab],
    });
  },
});

app.start();
