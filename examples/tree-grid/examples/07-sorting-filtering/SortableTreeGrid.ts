/**
 * Example 07: Sorting and Filtering
 *
 * Demonstrates column sorting within tree hierarchy, folderSort,
 * multi-column sort, and column filter inputs via TreeGridFilterPlugin.
 */

import { TreeGrid, TreeGridColumn, Column, TreeGridFilterPlugin } from '@framesquared/ui';
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

export function createExample(container: HTMLElement): { destroy: () => void } {
  const store = new TreeStore({
    root: { id: '__root__', text: 'Project', expanded: true, children: smallProjectPlan as any[] },
  });

  // TreeGridFilterPlugin adds filter inputs to column headers
  const filterPlugin = new TreeGridFilterPlugin({
    // filterer: 'bottomup' — matching nodes AND all their ancestors shown
    // filterer: 'topdown' — only matching nodes, ancestors only if matched
    filterer: 'bottomup',
  });

  const grid = new TreeGrid({
    title: 'Sortable & Filterable Task Plan',
    store,
    rootVisible: false,
    // folderSort: true ensures phase/group nodes always appear before leaf tasks,
    // regardless of which column is sorted. Sort applies within each group.
    folderSort: true,
    useArrows: true,
    plugins: [filterPlugin] as any,
    columns: [
      new TreeGridColumn({ text: 'Task', dataIndex: 'text', flex: 2, sortable: true } as any),
      new Column({ text: 'Assignee', dataIndex: 'assignee', width: 130, sortable: true } as any),
      new Column({ text: 'Status', dataIndex: 'status', width: 120, renderer: statusRenderer, sortable: true } as any),
      new Column({ text: 'Priority', dataIndex: 'priority', width: 90, sortable: true } as any),
      new Column({
        text: 'Est. Hrs', dataIndex: 'estimatedHours', width: 80,
        renderer: (v: unknown) => v != null ? `${v}h` : '—',
        sortable: true,
      } as any),
      new Column({
        text: 'Start', dataIndex: 'startDate', width: 85,
        renderer: (v: unknown) => v ? new Date(String(v)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
        sortable: true,
      } as any),
    ],
    height: 440,
  });

  (grid as any).on?.('sortchange', (sorter: any) => {
    window.__logEvent?.('sortchange', `Sort by "${sorter?.property}" ${sorter?.direction}`);
  });
  (grid as any).on?.('filterchange', (filters: any[]) => {
    window.__logEvent?.('filterchange', `Active filters: ${filters?.length ?? 0}`);
    updateCounts();
  });

  grid.render(container);

  function updateCounts(): void {
    const el = document.getElementById('filter-counts');
    if (!el) return;
    let visible = 0;
    store.getRootNode().cascadeBy(() => { visible++; });
    el.textContent = `${visible - 1} visible`; // subtract root
  }

  // Filter toolbar
  const filterBar = document.createElement('div');
  filterBar.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center';
  filterBar.innerHTML = `
    <input type="text" id="quick-filter" placeholder="🔍 Quick filter..." style="flex:1;padding:6px 10px;border:1px solid #ddd;border-radius:4px;font-size:13px">
    <button class="control-btn" id="clear-filters">Clear Filters</button>
    <span id="filter-counts" style="font-size:12px;color:#666">—</span>
  `;
  container.insertBefore(filterBar, container.firstChild);
  setTimeout(updateCounts, 50);

  document.getElementById('quick-filter')?.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value;
    if (val) {
      (filterPlugin as any).filter?.('text', val);
    } else {
      (filterPlugin as any).clearFilter?.('text');
    }
    updateCounts();
  });

  document.getElementById('clear-filters')?.addEventListener('click', () => {
    (filterPlugin as any).clearAllFilters?.();
    const input = document.getElementById('quick-filter') as HTMLInputElement;
    if (input) input.value = '';
    updateCounts();
  });

  // Controls
  const controlContainer = document.getElementById('tab-controls');
  if (controlContainer) {
    new ControlBar(controlContainer, [
      {
        title: 'Sort Options',
        controls: [
          { type: 'checkbox', label: 'Folder Sort', field: 'folderSort', value: true },
        ],
      },
      {
        title: 'Filter Options',
        controls: [
          { type: 'select', label: 'Filter Mode', field: 'filterMode', value: 'bottomup', options: ['bottomup', 'topdown'] },
          { type: 'button', label: 'Clear All Filters', handler: () => {
            (filterPlugin as any).clearAllFilters?.();
            const input = document.getElementById('quick-filter') as HTMLInputElement;
            if (input) input.value = '';
            updateCounts();
          }},
        ],
      },
    ], (field, value) => {
      if (field === 'folderSort') (grid as any)._folderSort = value;
      if (field === 'filterMode') (filterPlugin as any).filterMode = value;
    });
  }

  return { destroy() { grid.destroy?.(); } };
}
