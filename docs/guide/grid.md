# Grid

The Grid is framesquared's most powerful data visualization component, supporting sorting, filtering, grouping, editing, selection models, and virtual scrolling.

## Basic Grid

```typescript
import { Grid } from '@framesquared/grid';
import { Model, Store } from '@framesquared/data';

class Employee extends Model {
  static fields = [
    { name: 'id', type: 'int' },
    { name: 'name', type: 'string' },
    { name: 'department', type: 'string' },
    { name: 'salary', type: 'int' },
  ];
}

const grid = new Grid({
  title: 'Employees',
  store: new Store({
    model: Employee,
    data: [
      { id: 1, name: 'Alice', department: 'Engineering', salary: 95000 },
      { id: 2, name: 'Bob', department: 'Sales', salary: 72000 },
    ],
  }),
  columns: [
    { text: 'Name', dataIndex: 'name', flex: 1 },
    { text: 'Department', dataIndex: 'department', width: 150 },
    { text: 'Salary', dataIndex: 'salary', width: 120, renderer: (v) => `$${v.toLocaleString()}` },
  ],
  renderTo: document.body,
});
```

## Column Types

```typescript
columns: [
  { text: 'Name', dataIndex: 'name', flex: 1 },                          // Text
  { text: 'Salary', dataIndex: 'salary', type: 'number', format: '0,0' }, // Number
  { text: 'Hired', dataIndex: 'hireDate', type: 'date', format: 'Y-m-d' }, // Date
  { text: 'Active', dataIndex: 'active', type: 'boolean' },               // Boolean
  { text: '#', type: 'rownumberer', width: 50 },                          // Row numberer
  { text: 'Select', type: 'checkbox' },                                    // Checkbox
  { text: 'Actions', type: 'action', items: [                              // Action buttons
    { iconCls: 'edit-icon', handler: (grid, row) => editRow(row) },
  ]},
]
```

## Column Features

```typescript
{
  text: 'Name',
  dataIndex: 'name',
  sortable: true,        // Click header to sort
  resizable: true,       // Drag edge to resize
  hideable: true,        // Can be hidden via column menu
  locked: true,          // Locked to left side (Lockable grid)
  renderer: (value, record) => `<strong>${value}</strong>`,
}
```

## Selection Models

### Row Selection

```typescript
import { RowSelectionModel } from '@framesquared/grid';

const sm = new RowSelectionModel({ mode: 'MULTI' });
sm.init(grid);

sm.on('selectionchange', (selected) => {
  console.log('Selected:', selected.length, 'rows');
});

sm.getSelection();  // Currently selected records
sm.getCount();      // Number selected
sm.selectAll();
sm.deselectAll();
```

### Cell Selection

```typescript
import { CellSelectionModel } from '@framesquared/grid';

const sm = new CellSelectionModel();
sm.init(grid);
// Arrow keys navigate cells, Enter/F2 to edit
sm.getCurrentPosition(); // { row: 0, column: 1 }
```

## Features

### Grouping

```typescript
import { Grouping } from '@framesquared/grid';

const grid = new Grid({
  features: [new Grouping({ groupField: 'department' })],
  // ...
});
```

### Summary

```typescript
import { Summary } from '@framesquared/grid';

const grid = new Grid({
  features: [new Summary()],
  columns: [
    { text: 'Salary', dataIndex: 'salary', summaryType: 'sum',
      summaryRenderer: (v) => `Total: $${v.toLocaleString()}` },
  ],
});
```

### Editing

```typescript
import { CellEditing, RowEditing } from '@framesquared/grid';

// Inline cell editing
const grid = new Grid({
  plugins: [new CellEditing({ clicksToEdit: 2 })],
  columns: [
    { text: 'Name', dataIndex: 'name', editor: { type: 'text' } },
    { text: 'Salary', dataIndex: 'salary', editor: { type: 'number', minValue: 0 } },
  ],
});

// Or row editing (form-based)
const grid2 = new Grid({
  plugins: [new RowEditing()],
  // ...
});
```

## TreePanel

```typescript
import { TreePanel, TreeStore } from '@framesquared/grid';

const tree = new TreePanel({
  title: 'File Browser',
  store: new TreeStore({
    root: {
      text: 'Root', expanded: true,
      children: [
        { text: 'Documents', expanded: false, children: [
          { text: 'report.pdf', leaf: true },
          { text: 'notes.txt', leaf: true },
        ]},
        { text: 'Images', leaf: true },
      ],
    },
  }),
  checkable: true,
  cascadeCheck: true,
  renderTo: document.body,
});

tree.expandAll();
tree.collapseAll();
tree.getChecked(); // Checked nodes
```

## Lockable Grid

```typescript
import { Lockable } from '@framesquared/grid';

const lockable = new Lockable({
  store,
  columns: [
    { text: 'ID', dataIndex: 'id', locked: true, width: 60 },
    { text: 'Name', dataIndex: 'name', locked: true, width: 200 },
    { text: 'Detail 1', dataIndex: 'd1', width: 150 },
    { text: 'Detail 2', dataIndex: 'd2', width: 150 },
  ],
  renderTo: document.body,
});
// Left pane scrolls independently from right pane
```

## Grid State

```typescript
import { GridState } from '@framesquared/grid';

const state = new GridState({ stateId: 'employees-grid' });
state.save(grid);    // Persists column order, widths, sort to localStorage
state.restore(grid); // Restores saved state
```

## Hide / Show Columns

```typescript
grid.hideColumn(2);  // Hide third column
grid.showColumn(2);  // Show it again
grid.getColumns();   // All column definitions
```
