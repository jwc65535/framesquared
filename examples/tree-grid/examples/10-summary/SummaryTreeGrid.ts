/**
 * Example 10: Summary Rows
 *
 * Demonstrates footer summary row with column aggregations:
 *  - TreeGridSummary: adds a row at the bottom with totals/averages
 *  - TreeGridGroupingSummary: adds per-parent subtotals after each group
 */

import { TreeGrid, TreeGridColumn, Column, TreeGridSummary, TreeGridGroupingSummary } from '@framesquared/ui';
import { TreeStore } from '@framesquared/data';
import { smallProjectPlan } from '../../shared/SampleData.js';
import { ControlBar } from '../../shared/ControlBar.js';

const STATUS_CLASSES: Record<string, string> = {
  'Not Started': 'badge-not-started', 'In Progress': 'badge-in-progress',
  'Completed': 'badge-completed', 'Blocked': 'badge-blocked', 'Review': 'badge-review',
};

function statusRenderer(v: unknown): string {
  const s = String(v ?? '');
  return `<span class="badge ${STATUS_CLASSES[s] ?? 'badge-not-started'}">${s}</span>`;
}

function progressRenderer(v: unknown): string {
  const pct = Number(v ?? 0);
  let barClass = 'progress-0-33';
  if (pct >= 100) barClass = 'progress-100';
  else if (pct >= 67) barClass = 'progress-67-99';
  else if (pct >= 34) barClass = 'progress-34-66';
  return `<div style="display:flex;align-items:center;gap:4px">
    <div class="progress-bar-wrap" style="flex:1"><div class="progress-bar-fill ${barClass}" style="width:${pct}%"></div></div>
    <span style="font-size:11px;width:30px">${pct}%</span>
  </div>`;
}

export function createExample(container: HTMLElement): { destroy: () => void } {
  const store = new TreeStore({
    root: { id: '__root__', text: 'Project', expanded: true, children: smallProjectPlan as any[] },
  });

  // TreeGridSummary — adds a footer row with column aggregations
  const summary = new TreeGridSummary({
    // position: 'bottom' — summary row appears after all data rows
    position: 'bottom',
    // includeCollapsed: false — summary only counts visible (expanded) nodes
    includeCollapsed: false,
    summaryColumns: [
      { dataIndex: 'text', summaryType: 'count', summaryRenderer: (v: unknown) => `${v} tasks` } as any,
      { dataIndex: 'estimatedHours', summaryType: 'sum', summaryRenderer: (v: unknown) => `${v}h total` } as any,
      { dataIndex: 'actualHours', summaryType: 'sum', summaryRenderer: (v: unknown) => `${v}h actual` } as any,
      { dataIndex: 'percentComplete', summaryType: 'average', summaryRenderer: (v: unknown) => `${Math.round(Number(v ?? 0))}% avg` } as any,
    ],
  });

  // TreeGridGroupingSummary — adds a summary row after each parent node's children
  const groupSummary = new TreeGridGroupingSummary({});

  const grid = new TreeGrid({
    title: 'Project Summary',
    store,
    rootVisible: false,
    folderSort: true,
    useArrows: true,
    plugins: [summary, groupSummary] as any,
    columns: [
      new TreeGridColumn({ text: 'Task', dataIndex: 'text', flex: 2 }),
      new Column({ text: 'Assignee', dataIndex: 'assignee', width: 120 }),
      new Column({ text: 'Status', dataIndex: 'status', width: 120, renderer: statusRenderer }),
      new Column({
        text: 'Est. Hrs', dataIndex: 'estimatedHours', width: 80,
        renderer: (v: unknown) => v != null ? `${v}h` : '—',
      }),
      new Column({
        text: 'Actual Hrs', dataIndex: 'actualHours', width: 85,
        renderer: (v: unknown) => v != null ? `${v}h` : '—',
      }),
      new Column({ text: 'Progress', dataIndex: 'percentComplete', width: 140, renderer: progressRenderer }),
    ],
    height: 460,
  });

  (grid as any).on?.('itemexpand', (node: any) => {
    window.__logEvent?.('itemexpand', `"${node.text}" — summary updates`);
  });
  (grid as any).on?.('itemcollapse', (node: any) => {
    window.__logEvent?.('itemcollapse', `"${node.text}" — summary updates`);
  });

  grid.render(container);

  // Controls
  const controlContainer = document.getElementById('tab-controls');
  if (controlContainer) {
    new ControlBar(controlContainer, [
      {
        title: 'Summary Options',
        controls: [
          { type: 'checkbox', label: 'Include Collapsed Nodes', field: 'includeCollapsed', value: false },
          { type: 'checkbox', label: 'Show Footer Summary', field: 'showSummary', value: true },
          { type: 'checkbox', label: 'Show Grouping Summary', field: 'showGroupSummary', value: true },
          { type: 'select', label: 'Summary Position', field: 'position', value: 'bottom', options: ['top', 'bottom'] },
        ],
      },
      {
        title: 'Actions',
        controls: [
          { type: 'button', label: 'Expand All', handler: () => grid.expandAll() },
          { type: 'button', label: 'Collapse All', handler: () => grid.collapseAll() },
        ],
      },
    ], (field, value) => {
      if (field === 'includeCollapsed') (summary as any).includeCollapsed = value;
      if (field === 'showSummary') {
        (summary as any).disabled = !value;
        (grid as any)._view?.refresh();
      }
      if (field === 'showGroupSummary') {
        (groupSummary as any).disabled = !value;
        (grid as any)._view?.refresh();
      }
      if (field === 'position') {
        (summary as any).position = value;
        (grid as any)._view?.refresh();
      }
    });
  }

  return { destroy() { grid.destroy?.(); } };
}
