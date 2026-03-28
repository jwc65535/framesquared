/**
 * Example 11: Row Expander
 * Expandable detail panel below each row, independent of tree children.
 */
import { TreeGrid, TreeGridColumn, Column, TreeGridRowExpander } from '@framesquared/ui';
import { TreeStore } from '@framesquared/data';
import { smallProjectPlan } from '../../shared/SampleData.js';
import { ControlBar } from '../../shared/ControlBar.js';

const STATUS_CLASSES: Record<string,string> = {
  'Not Started':'badge-not-started','In Progress':'badge-in-progress',
  'Completed':'badge-completed','Blocked':'badge-blocked','Review':'badge-review',
};

function detailTemplate(node: any): string {
  const pct = node.percentComplete ?? 0;
  const tags = (node.tags ?? []).map((t: string) => `<span style="display:inline-block;padding:2px 8px;background:#dbeafe;color:#1e40af;border-radius:12px;font-size:11px;margin:2px">${t}</span>`).join('');
  const deps = (node.dependencies ?? []).join(', ') || '—';
  const barWidth = `${pct}%`;
  const barColor = pct >= 100 ? '#10b981' : pct >= 67 ? '#3b82f6' : pct >= 34 ? '#f59e0b' : '#ef4444';
  return `<div style="padding:12px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:13px">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 24px">
      <div><strong>Assignee:</strong> ${node.assignee ?? '—'}</div>
      <div><strong>Status:</strong> <span class="badge ${STATUS_CLASSES[node.status] ?? ''}">${node.status ?? '—'}</span></div>
      <div><strong>Start:</strong> ${node.startDate ?? '—'}</div>
      <div><strong>End:</strong> ${node.endDate ?? '—'}</div>
      <div><strong>Est. Hours:</strong> ${node.estimatedHours ?? 0}h</div>
      <div><strong>Actual Hours:</strong> ${node.actualHours ?? 0}h</div>
    </div>
    <div style="margin-top:8px">
      <strong>Progress:</strong>
      <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
        <div style="flex:1;height:10px;background:#e5e7eb;border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${barWidth};background:${barColor};border-radius:4px"></div>
        </div>
        <span>${pct}%</span>
      </div>
    </div>
    ${node.notes ? `<div style="margin-top:8px"><strong>Notes:</strong> ${node.notes}</div>` : ''}
    <div style="margin-top:8px"><strong>Tags:</strong> ${tags || '—'}</div>
    <div style="margin-top:4px"><strong>Dependencies:</strong> ${deps}</div>
  </div>`;
}

export function createExample(container: HTMLElement): { destroy: () => void } {
  const store = new TreeStore({
    root: { id: '__root__', text: 'Project', expanded: true, children: smallProjectPlan as any[] },
  });

  const rowExpander = new TreeGridRowExpander({
    rowBodyTpl: detailTemplate,
    singleExpand: false,
    expandOnDblClick: false,
  });

  const grid = new TreeGrid({
    title: 'Task Details',
    store,
    rootVisible: false,
    useArrows: true,
    folderSort: true,
    plugins: [rowExpander] as any,
    columns: [
      new TreeGridColumn({ text: 'Task', dataIndex: 'text', flex: 2 }),
      new Column({ text: 'Assignee', dataIndex: 'assignee', width: 130 }),
      new Column({
        text: 'Status', dataIndex: 'status', width: 120,
        renderer: (v: unknown) => { const s = String(v??''); return `<span class="badge ${STATUS_CLASSES[s]??''}">${s}</span>`; },
      }),
      new Column({ text: 'Priority', dataIndex: 'priority', width: 90 }),
      new Column({
        text: 'Est. Hrs', dataIndex: 'estimatedHours', width: 80,
        renderer: (v: unknown) => v != null ? `${v}h` : '—',
      }),
    ],
    height: 460,
  });

  (grid as any).on?.('rowexpand', (node: any) => {
    window.__logEvent?.('rowexpand', `Detail opened for "${node.text}"`);
  });
  (grid as any).on?.('rowcollapse', (node: any) => {
    window.__logEvent?.('rowcollapse', `Detail closed for "${node.text}"`);
  });

  grid.render(container);

  const hint = document.createElement('div');
  hint.style.cssText = 'margin-top:8px;font-size:12px;color:#666;padding:4px 8px;background:#f8f9fa;border-radius:4px';
  hint.textContent = '💡 Click the ▶ arrow on the far left of each row to expand its detail panel.';
  container.appendChild(hint);

  const controlContainer = document.getElementById('tab-controls');
  if (controlContainer) {
    new ControlBar(controlContainer, [
      {
        title: 'Row Expander',
        controls: [
          { type: 'checkbox', label: 'Single Expand', field: 'singleExpand', value: false },
          { type: 'checkbox', label: 'Expand on Dbl-Click', field: 'expandOnDblClick', value: false },
          { type: 'button', label: 'Expand All Tree', handler: () => grid.expandAll() },
          { type: 'button', label: 'Collapse All Tree', handler: () => grid.collapseAll() },
        ],
      },
    ], (field, value) => {
      if (field === 'singleExpand') (rowExpander as any).singleExpand = value;
      if (field === 'expandOnDblClick') (rowExpander as any).expandOnDblClick = value;
    });
  }

  return { destroy() { grid.destroy?.(); } };
}
