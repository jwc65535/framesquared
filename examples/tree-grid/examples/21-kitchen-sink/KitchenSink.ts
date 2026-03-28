/**
 * Example 21: Kitchen Sink — Every Feature Enabled Simultaneously
 * The ultimate stress test and feature showcase.
 */
import {
  TreeGrid, TreeGridColumn, Column,
  TreeGridCellEditing, TreeGridSummary, TreeGridRowExpander,
  TreeGridFilterPlugin, TreeGridStateMixin, TreeGridExporter,
  TreeGridClipboard, TreeGridDragDrop,
} from '@framesquared/ui';
import { TreeStore } from '@framesquared/data';
import { DataGenerator } from '../../shared/DataGenerator.js';
import { ControlBar } from '../../shared/ControlBar.js';

const KS_STATE_ID = 'treegrid-kitchen-sink-state';

const STATUS_CLASSES: Record<string,string> = {
  'Not Started':'badge-not-started','In Progress':'badge-in-progress',
  'Completed':'badge-completed','Blocked':'badge-blocked','Review':'badge-review',
};
function statusRenderer(v: unknown): string {
  const s = String(v ?? '');
  return `<span class="badge ${STATUS_CLASSES[s] ?? 'badge-not-started'}">${s}</span>`;
}
function progressRenderer(v: unknown): string {
  const pct = Number(v ?? 0);
  let color = '#ef4444';
  if (pct >= 100) color = '#10b981';
  else if (pct >= 67) color = '#3b82f6';
  else if (pct >= 34) color = '#f59e0b';
  return `<div style="display:flex;align-items:center;gap:4px">
    <div style="flex:1;height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden">
      <div style="height:100%;width:${pct}%;background:${color}"></div>
    </div>
    <span style="font-size:11px">${pct}%</span>
  </div>`;
}
function priorityRenderer(v: unknown): string {
  const p = String(v ?? '');
  const icons: Record<string,string> = { Critical:'🚨', High:'⬆️', Medium:'➡️', Low:'⬇️' };
  return `${icons[p] ?? '—'} ${p}`;
}

export function createExample(container: HTMLElement): { destroy: () => void } {
  container.style.cssText = 'display:flex;flex-direction:column;height:600px';

  // Mega toolbar
  const toolbar = document.createElement('div');
  toolbar.style.cssText = 'display:flex;align-items:center;gap:4px;padding:6px 10px;background:#f8f9fa;border:1px solid #e0e0e0;border-radius:4px;margin-bottom:8px;flex-wrap:wrap;flex-shrink:0';
  toolbar.innerHTML = `
    <button class="control-btn" id="ks-expand">Expand All</button>
    <button class="control-btn" id="ks-collapse">Collapse All</button>
    <button class="control-btn" id="ks-check-all">Check All</button>
    <button class="control-btn" id="ks-uncheck-all">Uncheck All</button>
    <span style="width:1px;height:18px;background:#ddd;margin:0 2px"></span>
    <button class="control-btn" id="ks-select-all">Select All</button>
    <button class="control-btn" id="ks-deselect">Deselect All</button>
    <span style="width:1px;height:18px;background:#ddd;margin:0 2px"></span>
    <button class="control-btn" id="ks-export-csv">Export CSV</button>
    <button class="control-btn" id="ks-export-json">Export JSON</button>
    <span style="width:1px;height:18px;background:#ddd;margin:0 2px"></span>
    <button class="control-btn" id="ks-save-state">Save State</button>
    <button class="control-btn" id="ks-clear-state" style="background:#ef4444">Clear State</button>
    <div style="flex:1"></div>
    <input id="ks-filter" type="text" placeholder="🔍 Filter tasks..." style="padding:4px 8px;border:1px solid #ddd;border-radius:4px;font-size:12px;width:160px">
  `;
  container.appendChild(toolbar);

  // Stats bar
  const stats = document.createElement('div');
  stats.style.cssText = 'display:flex;gap:16px;padding:4px 10px;background:#fff;border:1px solid #e0e0e0;border-radius:4px;margin-bottom:8px;font-size:12px;flex-shrink:0';
  stats.innerHTML = `
    <span>Total: <strong id="ks-stat-total">—</strong></span>
    <span>Visible: <strong id="ks-stat-visible">—</strong></span>
    <span>Selected: <strong id="ks-stat-selected">0</strong></span>
    <span>Checked: <strong id="ks-stat-checked">0</strong></span>
  `;
  container.appendChild(stats);

  const gridWrapper = document.createElement('div');
  gridWrapper.style.cssText = 'flex:1;overflow:auto';
  container.appendChild(gridWrapper);

  // All the data
  const data = DataGenerator.projectPlan({ phases: 3, tasksPerPhase: 5 });
  const store = new TreeStore({
    root: { id: '__root__', text: 'Project', expanded: true, children: data as any[] },
  });

  // All the plugins
  const cellEditing = new TreeGridCellEditing({ clicksToEdit: 2 });
  const summary = new TreeGridSummary({
    position: 'bottom', includeCollapsed: false,
    summaryColumns: [
      { dataIndex: 'text', summaryType: 'count', summaryRenderer: (v:unknown) => `${v} tasks` } as any,
      { dataIndex: 'estimatedHours', summaryType: 'sum', summaryRenderer: (v:unknown) => `${v}h` } as any,
      { dataIndex: 'actualHours', summaryType: 'sum', summaryRenderer: (v:unknown) => `${v}h` } as any,
      { dataIndex: 'percentComplete', summaryType: 'average', summaryRenderer: (v:unknown) => `${Math.round(Number(v??0))}% avg` } as any,
    ],
  });
  const rowExpander = new TreeGridRowExpander({
    rowBodyTpl: (node: any) => `<div style="padding:8px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px">
      <strong>${node.text}</strong> — ${node.notes ?? 'No notes.'} Tags: ${(node.tags??[]).join(', ')||'none'}
    </div>`,
  });
  const filterPlugin = new TreeGridFilterPlugin({ filterMode: 'bottomup' });
  const stateMixin = new TreeGridStateMixin({ stateId: KS_STATE_ID });
  const exporter = new TreeGridExporter({});
  const clipboard = new TreeGridClipboard({ copyHierarchy: true, includeHeaders: true });
  const dd = new TreeGridDragDrop({ ddGroup: 'ks-dnd', enableDrag: true, enableDrop: true });

  const grid = new TreeGrid({
    title: 'Kitchen Sink — All Features',
    store,
    rootVisible: false,
    useArrows: true,
    animate: true,
    folderSort: true,
    checkable: true,
    cascadeChecks: true,
    enableDrag: true,
    enableDrop: true,
    plugins: [cellEditing, summary, rowExpander, filterPlugin, stateMixin, exporter, clipboard, dd] as any,
    columns: [
      new TreeGridColumn({ text: 'Task', dataIndex: 'text', flex: 2,
        editor: { xtype: 'textfield', allowBlank: false } as any }),
      new Column({ text: 'Assignee', dataIndex: 'assignee', width: 120,
        editor: { xtype: 'textfield' } as any }),
      new Column({ text: 'Status', dataIndex: 'status', width: 120,
        renderer: statusRenderer,
        editor: { xtype: 'combobox', store: ['Not Started','In Progress','Completed','Blocked','Review'].map(s=>({value:s,text:s})), displayField:'text', valueField:'value', editable:false } as any }),
      new Column({ text: 'Priority', dataIndex: 'priority', width: 90,
        renderer: priorityRenderer }),
      new Column({ text: 'Est. Hrs', dataIndex: 'estimatedHours', width: 70,
        renderer: (v:unknown) => v != null ? `${v}h` : '—',
        editor: { xtype: 'numberfield', minValue: 0 } as any }),
      new Column({ text: 'Actual', dataIndex: 'actualHours', width: 65,
        renderer: (v:unknown) => v != null ? `${v}h` : '—',
        editor: { xtype: 'numberfield', minValue: 0 } as any }),
      new Column({ text: 'Progress', dataIndex: 'percentComplete', width: 130, renderer: progressRenderer }),
    ],
    height: 480,
  });

  grid.render(gridWrapper);

  // Stats update
  function updateStats(): void {
    let total = 0;
    store.getRootNode().cascadeBy(() => { total++; });
    total--;
    const sel = grid.getSelection().length;
    const checked = grid.getChecked().length;

    const statTotal = document.getElementById('ks-stat-total');
    const statVisible = document.getElementById('ks-stat-visible');
    const statSelected = document.getElementById('ks-stat-selected');
    const statChecked = document.getElementById('ks-stat-checked');
    if (statTotal) statTotal.textContent = String(total);
    if (statVisible) statVisible.textContent = String(total); // simplified
    if (statSelected) statSelected.textContent = String(sel);
    if (statChecked) statChecked.textContent = String(checked);
  }

  (grid as any).on?.('selectionchange', updateStats);
  (grid as any).on?.('checkchange', updateStats);
  (grid as any).on?.('itemexpand', (n: any) => { updateStats(); window.__logEvent?.('expand', `"${n.text}"`); });
  (grid as any).on?.('itemcollapse', (n: any) => { updateStats(); window.__logEvent?.('collapse', `"${n.text}"`); });
  (grid as any).on?.('itemclick', (_v:unknown, n: any) => window.__logEvent?.('click', `"${n.text}"`));
  (grid as any).on?.('edit', () => window.__logEvent?.('edit', 'Cell value changed'));
  (grid as any).on?.('checkchange', (n: any, v: boolean) => window.__logEvent?.('check', `"${n.text}" → ${v}`));

  setTimeout(updateStats, 100);

  // Toolbar handlers
  document.getElementById('ks-expand')?.addEventListener('click', () => { grid.expandAll(); updateStats(); });
  document.getElementById('ks-collapse')?.addEventListener('click', () => { grid.collapseAll(); updateStats(); });
  document.getElementById('ks-check-all')?.addEventListener('click', () => { grid.checkAll(); updateStats(); });
  document.getElementById('ks-uncheck-all')?.addEventListener('click', () => { grid.uncheckAll(); updateStats(); });
  document.getElementById('ks-select-all')?.addEventListener('click', () => { grid.selectAll(); updateStats(); });
  document.getElementById('ks-deselect')?.addEventListener('click', () => { grid.deselectAll(); updateStats(); });
  document.getElementById('ks-save-state')?.addEventListener('click', () => {
    window.__logEvent?.('savestate', 'State saved to localStorage');
    alert('State saved! Reload the page and come back to this example — it will restore.');
  });
  document.getElementById('ks-clear-state')?.addEventListener('click', () => {
    localStorage.removeItem(KS_STATE_ID);
    window.__logEvent?.('clearstate', 'State cleared');
  });

  // Export
  document.getElementById('ks-export-csv')?.addEventListener('click', () => {
    const cols = grid.getColumns();
    const lines: string[] = [cols.map(c => `"${c.text ?? ''}"`).join(',')];
    store.getRootNode().cascadeBy((n: any) => {
      if (!n.isRoot?.()) {
        lines.push(cols.map(c => `"${String(n[(c.dataIndex as string)] ?? '').replace(/"/g,'""')}"`).join(','));
      }
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'kitchen-sink.csv'; a.click();
    URL.revokeObjectURL(url);
    window.__logEvent?.('export', `CSV exported: ${lines.length} rows`);
  });

  document.getElementById('ks-export-json')?.addEventListener('click', () => {
    function toObj(node: any): any {
      const obj: Record<string,unknown> = { text: node.text, status: node.status, assignee: node.assignee, percentComplete: node.percentComplete };
      if (!node.isLeaf?.()) { const ch: any[] = []; node.eachChild?.((c: any) => ch.push(toObj(c))); if (ch.length) obj.children = ch; }
      return obj;
    }
    const roots: any[] = [];
    store.getRootNode().eachChild?.((c: any) => roots.push(toObj(c)));
    const json = JSON.stringify(roots, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'kitchen-sink.json'; a.click(); URL.revokeObjectURL(url);
    window.__logEvent?.('export', 'JSON exported');
  });

  // Quick filter
  document.getElementById('ks-filter')?.addEventListener('input', (e) => {
    const q = ((e.target as HTMLInputElement).value ?? '').toLowerCase();
    gridWrapper.querySelectorAll('tr[data-node-id]').forEach(row => {
      const text = (row as HTMLElement).textContent?.toLowerCase() ?? '';
      (row as HTMLElement).style.display = (!q || text.includes(q)) ? '' : 'none';
    });
  });

  // Controls tab
  const controlContainer = document.getElementById('tab-controls');
  if (controlContainer) {
    new ControlBar(controlContainer, [
      {
        title: 'Tree',
        controls: [
          { type: 'checkbox', label: 'Use Arrows', field: 'useArrows', value: true },
          { type: 'checkbox', label: 'Animate', field: 'animate', value: true },
          { type: 'checkbox', label: 'Folder Sort', field: 'folderSort', value: true },
          { type: 'checkbox', label: 'Checkable', field: 'checkable', value: true },
          { type: 'checkbox', label: 'Enable Drag', field: 'enableDrag', value: true },
          { type: 'checkbox', label: 'Enable Drop', field: 'enableDrop', value: true },
        ],
      },
      {
        title: 'Features',
        controls: [
          { type: 'checkbox', label: 'Summary Row', field: 'summary', value: true },
          { type: 'checkbox', label: 'Row Expander', field: 'rowExpander', value: true },
        ],
      },
    ], (field, value) => {
      if (field === 'useArrows') (grid as any)._useArrows = value;
      if (field === 'animate') (grid as any)._animate = value;
      if (field === 'folderSort') (grid as any)._folderSort = value;
      if (field === 'checkable') { (grid as any)._checkable = value; (grid as any)._view?.refresh(); }
      if (field === 'enableDrag') (dd as any).enableDrag = value;
      if (field === 'enableDrop') (dd as any).enableDrop = value;
      if (field === 'summary') { (summary as any).disabled = !value; (grid as any)._view?.refresh(); }
      if (field === 'rowExpander') { (rowExpander as any).disabled = !value; (grid as any)._view?.refresh(); }
      window.__logEvent?.('config', `${field} = ${value}`);
    });
  }

  return {
    destroy() {
      container.style.cssText = '';
      grid.destroy?.();
    },
  };
}
