/**
 * Example 20: Accessibility Demo
 * ARIA attributes, keyboard navigation, screen reader simulation, and audit.
 */
import { TreeGrid, TreeGridColumn, Column } from '@framesquared/ui';
import { TreeStore } from '@framesquared/data';
import { smallProjectPlan } from '../../shared/SampleData.js';
import { ControlBar } from '../../shared/ControlBar.js';

export function createExample(container: HTMLElement): { destroy: () => void } {
  container.style.cssText = 'display:flex;gap:12px;height:520px';

  const gridArea = document.createElement('div');
  gridArea.style.cssText = 'flex:1;overflow:auto';
  container.appendChild(gridArea);

  const a11yPanel = document.createElement('div');
  a11yPanel.style.cssText = 'width:280px;border:1px solid #e0e0e0;border-radius:4px;padding:12px;overflow-y:auto;font-size:12px;background:#fafafa;flex-shrink:0';
  a11yPanel.innerHTML = `
    <div style="font-weight:700;font-size:13px;margin-bottom:8px">Accessibility Info</div>
    <div style="margin-bottom:12px">
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;color:#888;margin-bottom:4px">Current Focus</div>
      <div id="a11y-focus" style="background:#1a1a2e;color:#a6e3a1;padding:8px;border-radius:4px;font-family:monospace;font-size:11px;min-height:60px">
        (interact with the grid)
      </div>
    </div>
    <div style="margin-bottom:12px">
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;color:#888;margin-bottom:4px">Keyboard Shortcuts</div>
      <div style="background:#f8f9fa;padding:8px;border-radius:4px;font-family:monospace;font-size:11px;line-height:1.8">
        ↑↓ Navigate rows<br>←→ Expand/Collapse<br>Space Toggle select<br>Enter Activate<br>Home/End First/Last<br>F2 Start edit
      </div>
    </div>
    <div>
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;color:#888;margin-bottom:4px">Audit Results</div>
      <div id="a11y-audit" style="font-size:11px;color:#555">Run audit to see results.</div>
    </div>
  `;
  container.appendChild(a11yPanel);

  const STATUS_CLASSES: Record<string,string> = {
    'Not Started':'badge-not-started','In Progress':'badge-in-progress',
    'Completed':'badge-completed','Blocked':'badge-blocked','Review':'badge-review',
  };

  const store = new TreeStore({
    root: { id: '__root__', text: 'Project', expanded: true, children: smallProjectPlan as any[] },
  });

  const grid = new TreeGrid({
    title: 'Accessible Task Plan',
    store,
    rootVisible: false,
    useArrows: true,
    checkable: true,
    columns: [
      new TreeGridColumn({ text: 'Task', dataIndex: 'text', flex: 2 }),
      new Column({ text: 'Assignee', dataIndex: 'assignee', width: 130 }),
      new Column({
        text: 'Status', dataIndex: 'status', width: 120,
        renderer: (v:unknown) => { const s = String(v??''); return `<span class="badge ${STATUS_CLASSES[s]??''}" role="status" aria-label="Status: ${s}">${s}</span>`; },
      }),
      new Column({ text: 'Priority', dataIndex: 'priority', width: 90 }),
    ],
    height: 460,
  });

  grid.render(gridArea);

  // Update focus info when a node is clicked
  function updateFocusInfo(node: any): void {
    const el = document.getElementById('a11y-focus');
    if (!el) return;
    const depth = node.getDepth?.() ?? 0;
    const parent = node.parentNode;
    let position = 0;
    let setSize = 0;
    if (parent) {
      parent.eachChild?.((c: any, i: number) => {
        setSize++;
        if (c === node) position = i + 1;
      });
    }
    el.textContent = [
      `Role: treeitem`,
      `Name: "${node.text}"`,
      `Level: ${depth + 1}`,
      `Position: ${position} of ${setSize}`,
      `Expanded: ${node.isLeaf?.() ? 'N/A (leaf)' : node.isExpanded?.() ? 'Yes' : 'No'}`,
      `Checked: ${(node as any).$checked === true ? 'Yes' : (node as any).$checked === null ? 'Indeterminate' : 'No'}`,
    ].join('\n');
    window.__logEvent?.('focus', `"${node.text}" — level ${depth + 1}, ${position}/${setSize}`);
  }

  (grid as any).on?.('itemclick', (_v:unknown, node: any) => updateFocusInfo(node));
  (grid as any).on?.('itemexpand', (n: any) => { updateFocusInfo(n); window.__logEvent?.('expand', `"${n.text}"`); });
  (grid as any).on?.('checkchange', (n: any, checked: boolean) => {
    window.__logEvent?.('checkchange', `"${n.text}" → ${checked ? 'checked' : 'unchecked'}`);
  });

  // Accessibility audit
  function runAudit(): void {
    const issues: string[] = [];
    const el = document.getElementById('a11y-audit');
    if (!el) return;

    const rows = gridArea.querySelectorAll('tr[data-node-id]');
    let withRole = 0, withAria = 0;
    rows.forEach(row => {
      if (row.getAttribute('role')) withRole++;
      if (row.hasAttribute('aria-expanded') || row.hasAttribute('aria-selected')) withAria++;
    });

    if (withRole === 0) issues.push('⚠️ Rows missing role attribute');
    if (withAria < rows.length * 0.5) issues.push('⚠️ Some rows missing aria-expanded/aria-selected');

    const table = gridArea.querySelector('table');
    if (table && !table.getAttribute('aria-label') && !table.getAttribute('aria-labelledby')) {
      issues.push('⚠️ Table missing aria-label');
    }

    const coverage = rows.length > 0 ? Math.round(((withRole + withAria) / (rows.length * 2)) * 100) : 0;

    el.innerHTML = issues.length === 0
      ? `<span style="color:#10b981">✅ No issues found</span><br><span>ARIA coverage: ~${coverage}%</span>`
      : `${issues.map(i => `<div style="color:#ef4444">${i}</div>`).join('')}<br><span>ARIA coverage: ~${coverage}%</span>`;

    window.__logEvent?.('audit', `${issues.length} issues found, ~${coverage}% ARIA coverage`);
  }

  const controlContainer = document.getElementById('tab-controls');
  if (controlContainer) {
    new ControlBar(controlContainer, [
      {
        title: 'Accessibility',
        controls: [
          { type: 'button', label: 'Run Accessibility Audit', handler: runAudit },
          { type: 'button', label: 'Expand All', handler: () => grid.expandAll() },
          { type: 'button', label: 'Collapse All', handler: () => grid.collapseAll() },
          { type: 'button', label: 'Check All', handler: () => grid.checkAll() },
          { type: 'button', label: 'Uncheck All', handler: () => grid.uncheckAll() },
        ],
      },
    ], () => {});
  }

  return {
    destroy() {
      container.style.cssText = '';
      grid.destroy?.();
    },
  };
}
