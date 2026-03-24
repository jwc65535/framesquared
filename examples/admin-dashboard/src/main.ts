/**
 * ext-ts Admin Dashboard Example
 *
 * Demonstrates: Viewport, TabPanel, Grid, FormPanel, ViewModel with
 * formulas, theme switching, TreePanel navigation, store operations.
 */

import { Model, Store } from '@ext-ts/data';
import { Grid, TreePanel, TreeStore } from '@ext-ts/grid';
import { FormPanel, TextField, NumberField, ComboBox } from '@ext-ts/form';
import { Panel, Button, TabPanel, Toolbar, Viewport } from '@ext-ts/ui';
import { Application, ViewModel } from '@ext-ts/app';
import { ThemeManager, ModernTheme, DarkTheme } from '@ext-ts/theme';
import { LocaleManager, enUS, esES } from '@ext-ts/core';

// ─── Models ──────────────────────────────────────────────────────────────

class Employee extends Model {
  static fields = [
    { name: 'id', type: 'int' as const },
    { name: 'name', type: 'string' as const },
    { name: 'department', type: 'string' as const },
    { name: 'salary', type: 'int' as const },
    { name: 'hireDate', type: 'date' as const },
  ];
}

class Product extends Model {
  static fields = [
    { name: 'id', type: 'int' as const },
    { name: 'name', type: 'string' as const },
    { name: 'category', type: 'string' as const },
    { name: 'price', type: 'float' as const },
    { name: 'inStock', type: 'boolean' as const },
  ];
}

// ─── Stores ──────────────────────────────────────────────────────────────

const employeeStore = new Store({
  model: Employee,
  data: [
    { id: 1, name: 'Alice Johnson', department: 'Engineering', salary: 95000 },
    { id: 2, name: 'Bob Smith', department: 'Sales', salary: 72000 },
    { id: 3, name: 'Charlie Brown', department: 'Engineering', salary: 88000 },
    { id: 4, name: 'Diana Prince', department: 'HR', salary: 68000 },
    { id: 5, name: 'Eve Wilson', department: 'Marketing', salary: 76000 },
    { id: 6, name: 'Frank Lee', department: 'Engineering', salary: 102000 },
    { id: 7, name: 'Grace Kim', department: 'Sales', salary: 85000 },
    { id: 8, name: 'Hank Davis', department: 'HR', salary: 64000 },
  ],
});

const productStore = new Store({
  model: Product,
  data: [
    { id: 1, name: 'Laptop Pro', category: 'Electronics', price: 1299.99, inStock: true },
    { id: 2, name: 'Wireless Mouse', category: 'Accessories', price: 29.99, inStock: true },
    { id: 3, name: 'Standing Desk', category: 'Furniture', price: 499.99, inStock: false },
    { id: 4, name: 'Monitor 27"', category: 'Electronics', price: 399.99, inStock: true },
    { id: 5, name: 'Keyboard', category: 'Accessories', price: 79.99, inStock: true },
  ],
});

// ─── Navigation Tree ─────────────────────────────────────────────────────

const navStore = new TreeStore({
  root: {
    text: 'Dashboard', expanded: true,
    children: [
      { id: 'overview', text: 'Overview', leaf: true, iconCls: 'icon-chart' },
      { id: 'people', text: 'People', expanded: true, children: [
        { id: 'employees', text: 'Employees', leaf: true },
        { id: 'departments', text: 'Departments', leaf: true },
      ]},
      { id: 'inventory', text: 'Inventory', expanded: true, children: [
        { id: 'products', text: 'Products', leaf: true },
        { id: 'categories', text: 'Categories', leaf: true },
      ]},
      { id: 'settings', text: 'Settings', leaf: true, iconCls: 'icon-gear' },
    ],
  },
});

// ─── ViewModel ───────────────────────────────────────────────────────────

const vm = new ViewModel({
  data: {
    activeSection: 'overview',
    employeeCount: employeeStore.getCount(),
    productCount: productStore.getCount(),
    totalSalary: 0,
    isDarkTheme: false,
  },
  formulas: {
    summaryText: (get) => {
      const emp = get('employeeCount') as number;
      const prod = get('productCount') as number;
      return `${emp} employees, ${prod} products`;
    },
    avgSalary: (get) => {
      const total = get('totalSalary') as number;
      const count = get('employeeCount') as number;
      return count > 0 ? Math.round(total / count) : 0;
    },
  },
});

// Calculate total salary
let totalSal = 0;
employeeStore.each((rec: Model) => { totalSal += rec.get('salary') as number; });
vm.set('totalSalary', totalSal);

// ─── Application ─────────────────────────────────────────────────────────

// Register themes and locales
ThemeManager.register(ModernTheme);
ThemeManager.register(DarkTheme);
ThemeManager.setTheme('modern');

LocaleManager.register(enUS);
LocaleManager.register(esES);
LocaleManager.setLocale('en-US');

const app = new Application({
  name: 'AdminDashboard',
  launch() {
    // Navigation panel (west region)
    const navPanel = new TreePanel({
      title: 'Navigation',
      store: navStore,
    });

    // Toolbar
    const toolbar = new Toolbar({
      items: [
        new Button({ text: 'Add Employee', handler() { /* add logic */ } }),
        new Button({ text: 'Add Product', handler() { /* add logic */ } }),
        new Button({
          text: 'Toggle Theme',
          handler() {
            const isDark = vm.get('isDarkTheme');
            ThemeManager.setTheme(isDark ? 'modern' : 'dark');
            vm.set('isDarkTheme', !isDark);
          },
        }),
        new Button({
          text: 'Español',
          handler() { LocaleManager.setLocale('es-ES'); },
        }),
      ],
    });

    // Main content as TabPanel
    const content = new TabPanel({
      items: [
        new Panel({ title: 'Overview', html: `<h2>${vm.get('summaryText')}</h2><p>Average salary: $${vm.get('avgSalary')}</p>` }),
        new Panel({ title: 'Employees', html: '<p>Employee grid would render here</p>' }),
        new Panel({ title: 'Products', html: '<p>Product grid would render here</p>' }),
      ],
    });

    // Main layout
    new Panel({
      title: 'Admin Dashboard',
      renderTo: document.body,
      dockedItems: [toolbar],
      items: [navPanel, content],
    });
  },
});

app.start();
