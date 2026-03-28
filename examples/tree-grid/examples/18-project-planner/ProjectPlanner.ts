/**
 * Example 18: Project Planner Application
 * Full project management with row editing, undo/redo, summary, and properties panel.
 */
import { TreeGrid, TreeGridColumn, Column, TreeGridSummary, TreeGridRowEditing } from '@framesquared/ui';
import { TreeStore } from '@framesquared/data';
import { smallProjectPlan } from '../../shared/SampleData.js';
import { ControlBar } from '../../shared/ControlBar.js';

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
    <span style="font-size:11px;min-width:28px">${pct}%</span>
  </div>`;
}

// Simple undo stack
interface UndoEntry { type: string; description: string; undo: () => void; }
const undoStack: UndoEntry[] = [];
const redoStack: UndoEntry[] = [];

export function createExample(container: HTMLElement): { destroy: () => void } {
  container.style.cssText = 'display:flex;flex-direction:column;height:560px;border:1px solid #e0e0e0;border-radius:4px;overflow:hidden;background:#fff';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.style.cssText = 'display:flex;align-items:center;gap:6px;padding:6px 10px;background:#f8f9fa;border-bottom:1px solid #e0e0e0;flex-shrink:0;flex-wrap:wrap';
  toolbar.innerHTML = `
    <button class="control-btn" id="pp-add-phase">+ Phase</button>
    <button class="control-btn" id="pp-add-task">+ Task</button>
    <button class="control-btn" id="pp-delete" style="background:#ef4444">🗑 Delete</button>
    <span style="width:1px;height:20px;background:#ddd;margin:0 4px"></span>
    <button class="control-btn" id="pp-undo" disabled style="opacity:.5">↩ Undo</button>
    <button class="control-btn" id="pp-redo" disabled style="opacity:.5">↪ Redo</button>
    <span style="width:1px;height:20px;background:#ddd;margin:0 4px"></span>
    <button class="control-btn" id="pp-expand-all">Expand All</button>
    <button class="control-btn" id="pp-collapse-all">Collapse All</button>
    <div style="flex:1"></div>
    <select id="pp-filter-status" style="padding:4px 8px;border:1px solid #ddd;border-radius:4px;font-size:12px">
      <option value="">All Statuses</option>
      <option>Not Started</option><option>In Progress</option><option>Completed</option><option>Blocked</option><option>Review</option>
    </select>
  `;
  container.appendChild(toolbar);

  // Main split area
  const mainArea = document.createElement('div');
  mainArea.style.cssText = 'display:flex;flex:1;overflow:hidden';
  container.appendChild(mainArea);

  const gridArea = document.createElement('div');
  gridArea.style.cssText = 'flex:1;overflow:auto';
  mainArea.appendChild(gridArea);

  // Properties panel (east)
  const propsPanel = document.createElement('div');
  propsPanel.style.cssText = 'width:260px;border-left:1px solid #eee;padding:12px;overflow-y:auto;font-size:12px;background:#fafafa;flex-shrink:0';
  propsPanel.innerHTML = '<div style="font-weight:600;margin-bottom:8px;color:#555">Properties</div><div id="pp-props-content" style="color:#888">Select a task to see details</div>';
  mainArea.appendChild(propsPanel);

  // Status bar
  const statusBar = document.createElement('div');
  statusBar.style.cssText = 'padding:4px 12px;background:#f8f9fa;border-top:1px solid #eee;font-size:11px;color:#666;flex-shrink:0';
  statusBar.id = 'pp-status';
  container.appendChild(statusBar);

  // Store
  const store = new TreeStore({
    root: { id: '__root__', text: 'Project', expanded: true, children: smallProjectPlan as any[] },
  });

  const rowEditing = new TreeGridRowEditing({ clicksToEdit: 2 });

  const summary = new TreeGridSummary({
    position: 'bottom',
    includeCollapsed: false,
    summaryColumns: [
      { dataIndex: 'text', summaryType: 'count', summaryRenderer: (v:unknown) => `${v} tasks` } as any,
      { dataIndex: 'estimatedHours', summaryType: 'sum', summaryRenderer: (v:unknown) => `${v}h total` } as any,
      { dataIndex: 'actualHours', summaryType: 'sum', summaryRenderer: (v:unknown) => `${v}h actual` } as any,
      { dataIndex: 'percentComplete', summaryType: 'average', summaryRenderer: (v:unknown) => `${Math.round(Number(v??0))}% avg` } as any,
    ],
  });

  const grid = new TreeGrid({
    title: '',
    store,
    rootVisible: false,
    useArrows: true,
    folderSort: true,
    plugins: [rowEditing, summary] as any,
    columns: [
      new TreeGridColumn({ text: 'Task', dataIndex: 'text', flex: 2,
        editor: { xtype: 'textfield', allowBlank: false } as any }),
      new Column({ text: 'Assignee', dataIndex: 'assignee', width: 120,
        editor: { xtype: 'textfield' } as any }),
      new Column({ text: 'Status', dataIndex: 'status', width: 120,
        renderer: statusRenderer,
        editor: { xtype: 'combobox', store: ['Not Started','In Progress','Completed','Blocked','Review'].map(s=>({value:s,text:s})), displayField:'text', valueField:'value', editable:false } as any }),
      new Column({ text: 'Est. Hrs', dataIndex: 'estimatedHours', width: 75,
        renderer: (v:unknown) => v != null ? `${v}h` : '—',
        editor: { xtype: 'numberfield', minValue: 0 } as any }),
      new Column({ text: 'Actual Hrs', dataIndex: 'actualHours', width: 80,
        renderer: (v:unknown) => v != null ? `${v}h` : '—',
        editor: { xtype: 'numberfield', minValue: 0 } as any }),
      new Column({ text: 'Progress', dataIndex: 'percentComplete', width: 130, renderer: progressRenderer }),
    ],
    height: 460,
  });

  grid.render(gridArea);

  // Properties panel update
  function updatePropsPanel(node: any): void {
    const el = document.getElementById('pp-props-content');
    if (!el || !node) return;
    el.innerHTML = `
      <div style="margin:4px 0"><strong>Name:</strong> ${node.text ?? '—'}</div>
      <div style="margin:4px 0"><strong>Assignee:</strong> ${node.assignee ?? '—'}</div>
      <div style="margin:4px 0"><strong>Status:</strong> <span class="badge ${STATUS_CLASSES[node.status] ?? ''}">${node.status ?? '—'}</span></div>
      <div style="margin:4px 0"><strong>Priority:</strong> ${node.priority ?? '—'}</div>
      <div style="margin:4px 0"><strong>Start:</strong> ${node.startDate ?? '—'}</div>
      <div style="margin:4px 0"><strong>End:</strong> ${node.endDate ?? '—'}</div>
      <div style="margin:4px 0"><strong>Est. Hours:</strong> ${node.estimatedHours ?? 0}h</div>
      <div style="margin:4px 0"><strong>Actual Hours:</strong> ${node.actualHours ?? 0}h</div>
      <div style="margin:4px 0"><strong>Progress:</strong> ${node.percentComplete ?? 0}%</div>
      ${node.notes ? `<div style="margin:4px 0"><strong>Notes:</strong> <span style="color:#555">${node.notes}</span></div>` : ''}
    `;
  }

  // Status update
  function updateStatus(): void {
    let total = 0, completed = 0;
    let estTotal = 0, actTotal = 0;
    store.getRootNode().cascadeBy((n: any) => {
      if (!n.isRoot?.() && n.isLeaf?.()) {
        total++;
        if (n.status === 'Completed') completed++;
        estTotal += (n.estimatedHours ?? 0);
        actTotal += (n.actualHours ?? 0);
      }
    });
    const el = document.getElementById('pp-status');
    if (el) el.textContent = `${total} tasks, ${completed} completed — ${estTotal}h estimated, ${actTotal}h actual`;
  }

  (grid as any).on?.('itemclick', (_v: unknown, node: any) => {
    updatePropsPanel(node);
    window.__logEvent?.('itemclick', `"${node.text}"`);
  });
  (grid as any).on?.('edit', () => { (grid as any)._view?.refresh(); updateStatus(); });
  (grid as any).on?.('itemexpand', (n: any) => window.__logEvent?.('itemexpand', `"${n.text}"`));

  setTimeout(updateStatus, 100);

  // Undo/redo helpers
  function pushUndo(entry: UndoEntry): void {
    undoStack.push(entry);
    redoStack.length = 0;
    const undoBtn = document.getElementById('pp-undo') as HTMLButtonElement | null;
    const redoBtn = document.getElementById('pp-redo') as HTMLButtonElement | null;
    if (undoBtn) { undoBtn.disabled = false; undoBtn.style.opacity = '1'; }
    if (redoBtn) { redoBtn.disabled = true; redoBtn.style.opacity = '.5'; }
  }

  // Toolbar handlers
  document.getElementById('pp-add-phase')?.addEventListener('click', () => {
    const root = store.getRootNode();
    const node = (root as any).createNode?.({ text: 'New Phase', leaf: false, expanded: false, estimatedHours: 0, actualHours: 0, percentComplete: 0 });
    if (node) {
      root.appendChild(node);
      (grid as any)._view?.refresh();
      pushUndo({ type: 'add', description: 'Add Phase', undo: () => { root.removeChild(node); (grid as any)._view?.refresh(); } });
      window.__logEvent?.('nodeappend', 'New phase added');
    }
  });

  document.getElementById('pp-add-task')?.addEventListener('click', () => {
    const sel = grid.getSelection();
    const parent = (sel.length > 0) ? sel[0] : store.getRootNode();
    const node = (parent as any).createNode?.({ text: 'New Task', leaf: true, status: 'Not Started', priority: 'Medium', estimatedHours: 0, actualHours: 0, percentComplete: 0, assignee: '' });
    if (node) {
      (parent as any).appendChild(node);
      (grid as any)._view?.refresh();
      pushUndo({ type: 'add', description: 'Add Task', undo: () => { (parent as any).removeChild(node); (grid as any)._view?.refresh(); } });
      window.__logEvent?.('nodeappend', `Task added to "${(parent as any).text}"`);
    }
  });

  document.getElementById('pp-delete')?.addEventListener('click', () => {
    const sel = grid.getSelection();
    if (!sel.length) { alert('Select a task first'); return; }
    const node = sel[0] as any;
    const p = node.parentNode;
    if (confirm(`Delete "${node.text}" and all subtasks?`)) {
      p?.removeChild(node);
      (grid as any)._view?.refresh();
      updateStatus();
      pushUndo({ type: 'delete', description: `Delete "${node.text}"`, undo: () => { p?.appendChild(node); (grid as any)._view?.refresh(); updateStatus(); } });
      window.__logEvent?.('noderemove', `"${node.text}" deleted`);
    }
  });

  document.getElementById('pp-undo')?.addEventListener('click', () => {
    const entry = undoStack.pop();
    if (!entry) return;
    entry.undo();
    redoStack.push(entry);
    const undoBtn = document.getElementById('pp-undo') as HTMLButtonElement | null;
    const redoBtn = document.getElementById('pp-redo') as HTMLButtonElement | null;
    if (undoBtn) { undoBtn.disabled = undoStack.length === 0; undoBtn.style.opacity = undoStack.length ? '1' : '.5'; }
    if (redoBtn) { redoBtn.disabled = false; redoBtn.style.opacity = '1'; }
    window.__logEvent?.('undo', entry.description);
  });

  document.getElementById('pp-expand-all')?.addEventListener('click', () => grid.expandAll());
  document.getElementById('pp-collapse-all')?.addEventListener('click', () => grid.collapseAll());

  document.getElementById('pp-filter-status')?.addEventListener('change', (e) => {
    const status = (e.target as HTMLSelectElement).value;
    gridArea.querySelectorAll('tr[data-node-id]').forEach(row => {
      const badge = row.querySelector('.badge');
      const rowStatus = badge?.textContent ?? '';
      (row as HTMLElement).style.display = (!status || rowStatus === status) ? '' : 'none';
    });
    window.__logEvent?.('filter', `Status filter: "${status || 'all'}"`);
  });

  return {
    destroy() {
      undoStack.length = 0; redoStack.length = 0;
      container.style.cssText = '';
      grid.destroy?.();
    },
  };
}
