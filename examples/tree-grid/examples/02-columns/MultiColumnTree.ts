/**
 * Example 02: Multi-Column Tree
 *
 * Demonstrates all major column types in a TreeGrid:
 *  - TreeGridColumn with custom renderer
 *  - Column with status badge renderer
 *  - Column with priority icon renderer
 *  - Column with progress bar widget renderer
 *  - Numeric columns
 *  - Date columns
 */

import { TreeGrid, TreeGridColumn, Column } from '@framesquared/ui';
import { TreeStore } from '@framesquared/data';
import { smallProjectPlan } from '../../shared/SampleData.js';
import { ControlBar } from '../../shared/ControlBar.js';

// ─── Status Badge Renderer ────────────────────────────────────────────────────

const STATUS_CLASSES: Record<string, string> = {
  'Not Started': 'badge-not-started',
  'In Progress': 'badge-in-progress',
  'Completed': 'badge-completed',
  'Blocked': 'badge-blocked',
  'Review': 'badge-review',
};

function statusRenderer(value: unknown): string {
  const status = String(value ?? '');
  const cls = STATUS_CLASSES[status] ?? 'badge-not-started';
  return `<span class="badge ${cls}">${status}</span>`;
}

// ─── Priority Renderer ────────────────────────────────────────────────────────

const PRIORITY_ICONS: Record<string, string> = {
  Critical: '🚨',
  High: '⬆️',
  Medium: '➡️',
  Low: '⬇️',
};

function priorityRenderer(value: unknown): string {
  const priority = String(value ?? '');
  const icon = PRIORITY_ICONS[priority] ?? '—';
  return `<span title="${priority}">${icon} ${priority}</span>`;
}

// ─── Progress Bar Renderer ────────────────────────────────────────────────────

function progressRenderer(value: unknown): string {
  const pct = Number(value ?? 0);
  let barClass = 'progress-0-33';
  if (pct >= 100) barClass = 'progress-100';
  else if (pct >= 67) barClass = 'progress-67-99';
  else if (pct >= 34) barClass = 'progress-34-66';
  const check = pct >= 100 ? ' ✓' : '';
  return `<div class="progress-bar-wrap" title="${pct}%">
    <div class="progress-bar-fill ${barClass}" style="width:${pct}%"></div>
  </div><span style="font-size:11px;margin-left:4px">${pct}%${check}</span>`;
}

// ─── Date Formatter ───────────────────────────────────────────────────────────

function shortDate(value: unknown): string {
  if (!value) return '—';
  const d = new Date(String(value));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Create Example ──────────────────────────────────────────────────────────

export function createExample(container: HTMLElement): { destroy: () => void } {
  const store = new TreeStore({
    root: {
      id: '__root__',
      text: 'Project',
      expanded: true,
      children: smallProjectPlan as any[],
    },
  });

  const grid = new TreeGrid({
    title: 'Project Plan',
    store,
    rootVisible: false,
    // folderSort: true ensures phases (non-leaf nodes) always appear before
    // individual leaf tasks, regardless of any column sort applied.
    folderSort: true,
    columns: [
      // Column 1: Tree column — renders tree chrome (indent, expander, icon) + task name
      new TreeGridColumn({
        text: 'Task',
        dataIndex: 'text',
        flex: 2,
      }),
      // Column 2: Assignee — plain text
      new Column({ text: 'Assignee', dataIndex: 'assignee', width: 130 }),
      // Column 3: Status — custom badge renderer
      new Column({
        text: 'Status',
        dataIndex: 'status',
        width: 120,
        renderer: statusRenderer,
      }),
      // Column 4: Priority — icon + text
      new Column({
        text: 'Priority',
        dataIndex: 'priority',
        width: 100,
        renderer: priorityRenderer,
      }),
      // Column 5: Estimated hours — numeric with 1 decimal
      new Column({
        text: 'Est. Hrs',
        dataIndex: 'estimatedHours',
        width: 80,
        renderer: (v: unknown) => v != null ? `${Number(v).toFixed(0)}h` : '—',
      }),
      // Column 6: Actual hours
      new Column({
        text: 'Actual Hrs',
        dataIndex: 'actualHours',
        width: 85,
        renderer: (v: unknown) => v != null ? `${Number(v).toFixed(0)}h` : '—',
      }),
      // Column 7: Progress — progress bar widget
      new Column({
        text: 'Progress',
        dataIndex: 'percentComplete',
        width: 160,
        renderer: progressRenderer,
      }),
      // Column 8: Start date
      new Column({
        text: 'Start',
        dataIndex: 'startDate',
        width: 80,
        renderer: shortDate,
      }),
      // Column 9: End date
      new Column({
        text: 'End',
        dataIndex: 'endDate',
        width: 80,
        renderer: shortDate,
      }),
    ],
    height: 480,
  });

  // Event logging
  (grid as any).on?.('itemclick', (_view: unknown, node: any) => {
    window.__logEvent?.('itemclick', `"${node.text}" — Status: ${(node as any).status ?? 'n/a'}`);
  });

  grid.render(container);

  // Controls
  const controlContainer = document.getElementById('tab-controls');
  if (controlContainer) {
    new ControlBar(controlContainer, [
      {
        title: 'Tree Options',
        controls: [
          { type: 'checkbox', label: 'Folder Sort', field: 'folderSort', value: true },
        ],
      },
      {
        title: 'Actions',
        controls: [
          { type: 'button', label: 'Expand All', handler: () => grid.expandAll() },
          { type: 'button', label: 'Collapse All', handler: () => grid.collapseAll() },
        ],
      },
    ], (field) => {
      window.__logEvent?.('controlchange', `${field} changed`);
    });
  }

  return { destroy() { grid.destroy?.(); } };
}
