/**
 * Example 22: Rich Editing
 *
 * Demonstrates all editor types available in TreeGridCellEditing:
 * textfield, combobox/select, checkbox, radiogroup, numberfield,
 * datefield, colorfield, and textarea.
 *
 * The tree shows an employee directory organized by department.
 * Each column uses a different editor type to showcase the variety.
 */

import { TreeGrid, TreeGridColumn, Column, TreeGridCellEditing } from '@framesquared/ui';
import { TreeStore, TreeModel, applyNodeInterface } from '@framesquared/data';
import type { NodeInterface } from '@framesquared/data';
import { ControlBar } from '../../shared/ControlBar.js';

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

const DEPARTMENTS = ['Engineering', 'Design', 'Product', 'Marketing', 'Operations', 'Finance', 'HR'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contractor', 'Intern'];
const LOCATIONS = ['New York', 'San Francisco', 'Austin', 'London', 'Berlin', 'Remote'];
const PERFORMANCE_RATINGS = ['Exceptional', 'Exceeds Expectations', 'Meets Expectations', 'Needs Improvement'];
const BADGE_COLORS: Record<string, string> = {
  'Exceptional': '#16a34a', 'Exceeds Expectations': '#2563eb',
  'Meets Expectations': '#6b7280', 'Needs Improvement': '#dc2626',
};

// ---------------------------------------------------------------------------
// Sample data — departments with employees
// ---------------------------------------------------------------------------

const HR_COLOR = '#7c3aed';

const employeeDirectory = [
  {
    id: 'dept-eng', text: 'Engineering', leaf: false, expanded: true,
    department: 'Engineering', type: '', active: true, salary: 0, hireDate: '',
    location: '', performance: '', color: HR_COLOR, notes: '', children: [
      { id: 'e1', text: 'Alice Chen', leaf: true, department: 'Engineering', type: 'Full-time', active: true, salary: 145000, hireDate: '2021-03-15', location: 'San Francisco', performance: 'Exceptional', color: '#2563eb', notes: 'Tech lead for platform team. Strong mentorship skills.' },
      { id: 'e2', text: 'Bob Martinez', leaf: true, department: 'Engineering', type: 'Full-time', active: true, salary: 120000, hireDate: '2022-08-01', location: 'Austin', performance: 'Exceeds Expectations', color: '#16a34a', notes: 'Backend specialist. Owns the payments integration.' },
      { id: 'e3', text: 'Carol Zhang', leaf: true, department: 'Engineering', type: 'Contractor', active: false, salary: 95000, hireDate: '2023-01-10', location: 'Remote', performance: 'Meets Expectations', color: '#7c3aed', notes: 'Contract ends Q2. Focus on docs before handoff.' },
    ],
  },
  {
    id: 'dept-design', text: 'Design', leaf: false, expanded: true,
    department: 'Design', type: '', active: true, salary: 0, hireDate: '',
    location: '', performance: '', color: HR_COLOR, notes: '', children: [
      { id: 'e4', text: 'David Kim', leaf: true, department: 'Design', type: 'Full-time', active: true, salary: 130000, hireDate: '2020-11-20', location: 'New York', performance: 'Exceptional', color: '#db2777', notes: 'Principal designer. Design system owner.' },
      { id: 'e5', text: 'Emma Wilson', leaf: true, department: 'Design', type: 'Part-time', active: true, salary: 60000, hireDate: '2023-06-05', location: 'London', performance: 'Meets Expectations', color: '#ea580c', notes: 'Part-time UX researcher. 3 days per week.' },
    ],
  },
  {
    id: 'dept-product', text: 'Product', leaf: false, expanded: false,
    department: 'Product', type: '', active: true, salary: 0, hireDate: '',
    location: '', performance: '', color: HR_COLOR, notes: '', children: [
      { id: 'e6', text: 'Frank Patel', leaf: true, department: 'Product', type: 'Full-time', active: true, salary: 155000, hireDate: '2019-07-14', location: 'San Francisco', performance: 'Exceeds Expectations', color: '#0891b2', notes: 'Director of Product. Manages roadmap for core platform.' },
      { id: 'e7', text: 'Grace Lee', leaf: true, department: 'Product', type: 'Full-time', active: true, salary: 125000, hireDate: '2021-09-28', location: 'Austin', performance: 'Meets Expectations', color: '#7c3aed', notes: 'PM for mobile products.' },
    ],
  },
  {
    id: 'dept-hr', text: 'HR', leaf: false, expanded: false,
    department: 'HR', type: '', active: true, salary: 0, hireDate: '',
    location: '', performance: '', color: HR_COLOR, notes: '', children: [
      { id: 'e8', text: 'Henry Brown', leaf: true, department: 'HR', type: 'Full-time', active: true, salary: 100000, hireDate: '2022-02-28', location: 'New York', performance: 'Meets Expectations', color: '#d97706', notes: 'HR generalist. Runs onboarding program.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Renderers
// ---------------------------------------------------------------------------

function boolRenderer(v: unknown): string {
  return v ? '<span style="color:#16a34a;font-weight:600;">✓ Yes</span>' : '<span style="color:#6b7280;">✗ No</span>';
}

function salaryRenderer(v: unknown): string {
  if (!v) return '—';
  return `$${Number(v).toLocaleString()}`;
}

function dateRenderer(v: unknown): string {
  if (!v) return '—';
  return new Date(String(v)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function perfRenderer(v: unknown): string {
  const s = String(v ?? '');
  if (!s) return '—';
  const color = BADGE_COLORS[s] ?? '#6b7280';
  return `<span style="display:inline-block;padding:1px 6px;border-radius:3px;font-size:11px;font-weight:600;color:#fff;background:${color};">${s}</span>`;
}

function colorRenderer(v: unknown): string {
  const c = String(v ?? '');
  if (!c) return '—';
  return `<span style="display:inline-flex;align-items:center;gap:4px;"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${c};border:1px solid rgba(0,0,0,.2);"></span>${c}</span>`;
}

// ---------------------------------------------------------------------------
// Example factory
// ---------------------------------------------------------------------------

export function createExample(container: HTMLElement): { destroy: () => void } {
  const store = new TreeStore({
    root: {
      id: '__root__',
      text: 'Company',
      expanded: true,
      children: employeeDirectory as any[],
    },
  });

  const cellEditing = new TreeGridCellEditing({ clicksToEdit: 2 });

  const grid = new TreeGrid({
    title: 'Employee Directory — Rich Editing (double-click any cell)',
    store,
    rootVisible: false,
    useArrows: true,
    plugins: [cellEditing] as any,
    columns: [
      // 1. TreeGridColumn — textfield (default)
      new TreeGridColumn({
        text: 'Name',
        dataIndex: 'text',
        flex: 1,
        editor: { xtype: 'textfield' },
      }),

      // 2. Combobox — select from list
      new Column({
        text: 'Department',
        dataIndex: 'department',
        width: 115,
        editor: {
          xtype: 'combobox',
          options: DEPARTMENTS.map(d => ({ value: d, text: d })),
        },
      }),

      // 3. Combobox — employment type
      new Column({
        text: 'Type',
        dataIndex: 'type',
        width: 105,
        editor: {
          xtype: 'combobox',
          options: EMPLOYMENT_TYPES.map(t => ({ value: t, text: t })),
        },
      }),

      // 4. Checkbox — active / inactive
      new Column({
        text: 'Active',
        dataIndex: 'active',
        width: 70,
        renderer: boolRenderer,
        editor: { xtype: 'checkbox' },
      }),

      // 5. Number field — salary
      new Column({
        text: 'Salary',
        dataIndex: 'salary',
        width: 100,
        renderer: salaryRenderer,
        editor: { xtype: 'numberfield', minValue: 0, maxValue: 500000, step: 1000 },
      }),

      // 6. Date field — hire date
      new Column({
        text: 'Hire Date',
        dataIndex: 'hireDate',
        width: 100,
        renderer: dateRenderer,
        editor: { xtype: 'datefield' },
      }),

      // 7. Combobox — location
      new Column({
        text: 'Location',
        dataIndex: 'location',
        width: 110,
        editor: {
          xtype: 'combobox',
          options: LOCATIONS.map(l => ({ value: l, text: l })),
        },
      }),

      // 8. Radiogroup — performance rating
      new Column({
        text: 'Performance',
        dataIndex: 'performance',
        width: 160,
        renderer: perfRenderer,
        editor: {
          xtype: 'radiogroup',
          options: PERFORMANCE_RATINGS.map(r => ({ value: r, text: r })),
        },
      }),

      // 9. Color field — accent color
      new Column({
        text: 'Color',
        dataIndex: 'color',
        width: 110,
        renderer: colorRenderer,
        editor: { xtype: 'colorfield' },
      }),

      // 10. Textarea — notes
      new Column({
        text: 'Notes',
        dataIndex: 'notes',
        flex: 1,
        editor: { xtype: 'textarea', rows: 3 },
      }),
    ],
    height: 480,
  });

  grid.render(container);

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'example-toolbar';
  toolbar.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;';
  toolbar.innerHTML = `
    <button class="control-btn" id="btn-add-employee">+ Add Employee</button>
    <button class="control-btn" id="btn-add-department">+ Add Department</button>
    <button class="control-btn" id="btn-delete">🗑 Delete Selected</button>
  `;
  container.insertBefore(toolbar, container.firstChild);

  document.getElementById('btn-add-employee')?.addEventListener('click', () => {
    const selected = grid.getSelection();
    let parent = store.getRootNode();
    if (selected.length > 0) {
      const sel = selected[0];
      parent = sel.isLeaf() ? (sel.parentNode ?? parent) : sel;
    } else {
      // Default to first department
      const root = store.getRootNode();
      parent = root.childNodes[0] ?? root;
    }
    const model = TreeModel.create({
      text: 'New Employee', leaf: true,
      department: (parent as any).get?.('department') ?? 'Engineering',
      type: 'Full-time', active: true, salary: 100000,
      hireDate: new Date().toISOString().slice(0, 10),
      location: 'Remote', performance: 'Meets Expectations',
      color: '#6b7280', notes: '',
    });
    applyNodeInterface(model, 0);
    const newNode = model as unknown as NodeInterface;
    store.appendChild(parent, newNode);
    window.__logEvent?.('add', `New employee added under "${(parent as any).get?.('text') ?? 'root'}"`);
  });

  document.getElementById('btn-add-department')?.addEventListener('click', () => {
    const root = store.getRootNode();
    const model = TreeModel.create({
      text: 'New Department', leaf: false, expanded: true,
      department: '', type: '', active: true, salary: 0,
      hireDate: '', location: '', performance: '', color: HR_COLOR, notes: '',
    });
    applyNodeInterface(model, 0);
    const newNode = model as unknown as NodeInterface;
    store.appendChild(root, newNode);
    window.__logEvent?.('add', 'New department added');
  });

  document.getElementById('btn-delete')?.addEventListener('click', () => {
    const selected = grid.getSelection();
    if (selected.length === 0) { alert('Select a row first.'); return; }
    const name = (selected[0] as any).get?.('text') ?? 'selected node';
    if (confirm(`Delete "${name}"?`)) {
      selected[0].parentNode?.removeChild(selected[0]);
      (grid as any)._view?.refresh();
      window.__logEvent?.('delete', `"${name}" removed`);
    }
  });

  // Controls panel
  const controlContainer = document.getElementById('tab-controls');
  if (controlContainer) {
    new ControlBar(controlContainer, [
      {
        title: 'Editor Options',
        controls: [
          {
            type: 'select',
            label: 'Clicks to Edit',
            field: 'clicksToEdit',
            value: '2',
            options: ['1', '2'],
          },
        ],
      },
    ], (field, value) => {
      if (field === 'clicksToEdit') {
        (cellEditing as any).config = { ...(cellEditing as any).config, clicksToEdit: Number(value) };
      }
    });
  }

  return {
    destroy() {
      grid.destroy?.();
    },
  };
}
