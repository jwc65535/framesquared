/**
 * Example 05: Cell Editing
 *
 * Demonstrates inline cell editing with TreeGridCellEditing plugin.
 * Double-click any cell to edit it in-place.
 *
 * Shows: text editors, combobox editors, number editors, date editors,
 * validation, add/delete rows, save/reject changes.
 */

import { TreeGrid, TreeGridColumn, Column, TreeGridCellEditing } from '@framesquared/ui';
import { TreeStore } from '@framesquared/data';
import { smallProjectPlan } from '../../shared/SampleData.js';
import { ControlBar } from '../../shared/ControlBar.js';

const ASSIGNEES = ['Alice Chen', 'Bob Martinez', 'Carol Johnson', 'David Kim', 'Emma Wilson', 'Frank Patel', 'Grace Lee', 'Henry Brown'];
const STATUSES = ['Not Started', 'In Progress', 'Completed', 'Blocked', 'Review'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

const STATUS_CLASSES: Record<string, string> = {
  'Not Started': 'badge-not-started', 'In Progress': 'badge-in-progress',
  'Completed': 'badge-completed', 'Blocked': 'badge-blocked', 'Review': 'badge-review',
};

function statusRenderer(v: unknown): string {
  const s = String(v ?? '');
  return `<span class="badge ${STATUS_CLASSES[s] ?? 'badge-not-started'}">${s}</span>`;
}

function shortDate(v: unknown): string {
  if (!v) return '—';
  return new Date(String(v)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function createExample(container: HTMLElement): { destroy: () => void } {
  const store = new TreeStore({
    root: { id: '__root__', text: 'Project', expanded: true, children: smallProjectPlan as any[] },
  });

  // TreeGridCellEditing plugin — enables double-click-to-edit on cells
  // that have an `editor` config on their column definition.
  const cellEditing = new TreeGridCellEditing({
    clicksToEdit: 2, // double-click to activate editor
  });

  const grid = new TreeGrid({
    title: 'Editable Task Plan',
    store,
    rootVisible: false,
    useArrows: true,
    folderSort: true,
    plugins: [cellEditing] as any,
    columns: [
      // TreeGridColumn with text editor — validates non-empty
      new TreeGridColumn({
        text: 'Task',
        dataIndex: 'text',
        flex: 2,
        editor: {
          xtype: 'textfield',
          allowBlank: false,
        } as any,
      }),
      // ComboBox editor for assignee
      new Column({
        text: 'Assignee',
        dataIndex: 'assignee',
        width: 130,
        editor: {
          xtype: 'combobox',
          store: ASSIGNEES.map(a => ({ value: a, text: a })),
          displayField: 'text',
          valueField: 'value',
        } as any,
      }),
      // ComboBox editor for status with badge display renderer
      new Column({
        text: 'Status',
        dataIndex: 'status',
        width: 120,
        renderer: statusRenderer,
        editor: {
          xtype: 'combobox',
          store: STATUSES.map(s => ({ value: s, text: s })),
          displayField: 'text',
          valueField: 'value',
          editable: false,
        } as any,
      }),
      // ComboBox editor for priority
      new Column({
        text: 'Priority',
        dataIndex: 'priority',
        width: 90,
        editor: {
          xtype: 'combobox',
          store: PRIORITIES.map(p => ({ value: p, text: p })),
          displayField: 'text',
          valueField: 'value',
          editable: false,
        } as any,
      }),
      // Number editor for estimated hours
      new Column({
        text: 'Est. Hrs',
        dataIndex: 'estimatedHours',
        width: 80,
        renderer: (v: unknown) => v != null ? `${v}h` : '—',
        editor: {
          xtype: 'numberfield',
          minValue: 0,
          maxValue: 500,
        } as any,
      }),
      // Number editor for actual hours
      new Column({
        text: 'Actual Hrs',
        dataIndex: 'actualHours',
        width: 85,
        renderer: (v: unknown) => v != null ? `${v}h` : '—',
        editor: {
          xtype: 'numberfield',
          minValue: 0,
        } as any,
      }),
      // Date editor for start date
      new Column({
        text: 'Start',
        dataIndex: 'startDate',
        width: 85,
        renderer: shortDate,
        editor: {
          xtype: 'datefield',
          format: 'Y-m-d',
        } as any,
      }),
    ],
    height: 460,
  });

  // Log editing events
  (grid as any).on?.('beforeedit', (e: any) => {
    window.__logEvent?.('beforeedit', `Cell: "${e?.column?.dataIndex}" on "${e?.record?.text}"`);
  });
  (grid as any).on?.('edit', (e: any) => {
    window.__logEvent?.('edit', `"${e?.column?.dataIndex}" changed to "${e?.value}"`);
  });
  (grid as any).on?.('canceledit', () => {
    window.__logEvent?.('canceledit', 'Edit cancelled');
  });

  grid.render(container);

  // Toolbar for add/delete
  const toolbar = document.createElement('div');
  toolbar.className = 'example-toolbar';
  toolbar.style.cssText = 'display:flex;gap:8px;margin-bottom:8px';
  toolbar.innerHTML = `
    <button class="control-btn" id="btn-add-task">+ Add Task</button>
    <button class="control-btn" id="btn-delete">🗑 Delete Selected</button>
    <button class="control-btn" id="btn-save">💾 Save Changes</button>
    <button class="control-btn" id="btn-reject" style="background:#ef4444">✕ Reject Changes</button>
  `;
  container.insertBefore(toolbar, container.firstChild);

  document.getElementById('btn-add-task')?.addEventListener('click', () => {
    const root = store.getRootNode();
    const newNode = root.createNode?.({
      text: 'New Task', leaf: true, status: 'Not Started', priority: 'Medium',
      estimatedHours: 0, actualHours: 0, percentComplete: 0,
      assignee: ASSIGNEES[0],
    });
    if (newNode) {
      root.appendChild(newNode);
      (grid as any)._view?.refresh();
      window.__logEvent?.('nodeappend', 'New task added to root');
    }
  });

  document.getElementById('btn-delete')?.addEventListener('click', () => {
    const selected = grid.getSelection();
    if (selected.length === 0) { alert('Select a node first'); return; }
    if (confirm(`Delete "${(selected[0] as any).text}"?`)) {
      selected[0].parentNode?.removeChild(selected[0]);
      (grid as any)._view?.refresh();
      window.__logEvent?.('noderemove', `"${(selected[0] as any).text}" deleted`);
    }
  });

  document.getElementById('btn-save')?.addEventListener('click', () => {
    const modified: string[] = [];
    store.getRootNode().cascadeBy((n: any) => {
      if (n.dirty) modified.push(n.text ?? n.id);
    });
    window.__logEvent?.('save', `${modified.length} modified records: ${modified.join(', ') || 'none'}`);
    alert(`Saved ${modified.length} record(s). (Check Events tab for details.)`);
  });

  document.getElementById('btn-reject')?.addEventListener('click', () => {
    store.getRootNode().cascadeBy((n: any) => { if (n.reject) n.reject(); });
    (grid as any)._view?.refresh();
    window.__logEvent?.('rejectchanges', 'All changes rejected');
  });

  // Controls
  const controlContainer = document.getElementById('tab-controls');
  if (controlContainer) {
    new ControlBar(controlContainer, [
      {
        title: 'Edit Options',
        controls: [
          { type: 'select', label: 'Clicks to Edit', field: 'clicksToEdit', value: '2', options: ['1', '2'] },
        ],
      },
    ], (field, value) => {
      if (field === 'clicksToEdit') {
        (cellEditing as any).clicksToEdit = Number(value);
      }
    });
  }

  return { destroy() { grid.destroy?.(); } };
}
