/**
 * Example 08: Selection Modes
 *
 * Demonstrates SINGLE, SIMPLE, and MULTI selection in a TreeGrid.
 * Shows: range selection, checkbox selection, deselect-on-collapse behavior.
 */

import { TreeGrid, TreeGridColumn, Column, TreeGridSelectionModel } from '@framesquared/ui';
import { TreeStore } from '@framesquared/data';
import { smallOrganization } from '../../shared/SampleData.js';
import { ControlBar } from '../../shared/ControlBar.js';

function formatSalary(v: unknown): string {
  const n = Number(v ?? 0);
  return n ? `$${n.toLocaleString()}` : '—';
}

function formatDate(iso: unknown): string {
  if (!iso) return '—';
  return new Date(String(iso)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function createExample(container: HTMLElement): { destroy: () => void } {
  const store = new TreeStore({
    root: { id: '__root__', text: 'Acme Corporation', expanded: true, children: smallOrganization as any[] },
  });

  const selModel = new TreeGridSelectionModel({
    // mode: 'SINGLE' — only one row selected at a time
    // mode: 'SIMPLE' — click toggles without needing Ctrl
    // mode: 'MULTI' — Ctrl+click to add, Shift+click for range
    mode: 'SINGLE',
  });

  const grid = new TreeGrid({
    title: 'Team Directory',
    store,
    rootVisible: false,
    useArrows: true,
    selModel: selModel as any,
    columns: [
      new TreeGridColumn({ text: 'Name', dataIndex: 'text', flex: 2 }),
      new Column({ text: 'Title', dataIndex: 'title', width: 180 }),
      new Column({ text: 'Email', dataIndex: 'email', width: 200 }),
      new Column({ text: 'Location', dataIndex: 'location', width: 110 }),
      new Column({ text: 'Hire Date', dataIndex: 'hireDate', width: 110, renderer: (v: unknown) => formatDate(v) }),
      new Column({ text: 'Salary', dataIndex: 'salary', width: 100, renderer: formatSalary }),
    ],
    height: 440,
  });

  function updateSelectedDisplay(): void {
    const selected = grid.getSelection();
    const el = document.getElementById('sel-selected-list');
    if (el) {
      el.textContent = selected.length
        ? selected.map((n: any) => n.text).join(', ')
        : '(none)';
    }
    const countEl = document.getElementById('sel-count');
    if (countEl) countEl.textContent = String(selected.length);
    window.__logEvent?.('selectionchange', `${selected.length} selected: ${selected.map((n: any) => n.text).join(', ') || 'none'}`);
  }

  (grid as any).on?.('selectionchange', () => updateSelectedDisplay());
  (grid as any).on?.('itemclick', (_view: unknown, node: any) => {
    window.__logEvent?.('itemclick', `"${node.text}" (${node.isLeaf() ? 'person' : 'team/dept'})`);
  });

  grid.render(container);

  // Controls
  const controlContainer = document.getElementById('tab-controls');
  if (controlContainer) {
    new ControlBar(controlContainer, [
      {
        title: 'Selection Options',
        controls: [
          { type: 'select', label: 'Selection Mode', field: 'mode', value: 'SINGLE', options: ['SINGLE', 'SIMPLE', 'MULTI'] },
          { type: 'checkbox', label: 'Checkbox Select', field: 'checkboxSelect', value: false },
        ],
      },
      {
        title: 'Actions',
        controls: [
          { type: 'button', label: 'Select All', handler: () => { grid.selectAll(); updateSelectedDisplay(); } },
          { type: 'button', label: 'Deselect All', handler: () => { grid.deselectAll(); updateSelectedDisplay(); } },
          { type: 'button', label: 'Expand All', handler: () => grid.expandAll() },
          { type: 'button', label: 'Collapse All', handler: () => grid.collapseAll() },
        ],
      },
      {
        title: 'Status',
        controls: [
          { type: 'display', label: 'Count', id: 'sel-count', value: '0' },
          { type: 'display', label: 'Selected', id: 'sel-selected-list', value: '(none)' },
        ],
      },
    ], (field, value) => {
      if (field === 'mode') {
        (selModel as any).mode = value;
        (grid as any)._view?.refresh();
      }
      if (field === 'checkboxSelect') {
        (grid as any)._checkable = value;
        (grid as any)._view?.refresh();
      }
    });
  }

  return { destroy() { grid.destroy?.(); } };
}
