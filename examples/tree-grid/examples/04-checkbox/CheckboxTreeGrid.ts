/**
 * Example 04: Checkbox Tree
 *
 * Demonstrates tri-state checkbox tree with cascade propagation:
 *  - checkable: true — adds checkbox to every node
 *  - cascadeChecks: true — checking a parent checks all children
 *  - checkPropagation: 'both' — check/uncheck propagates both up and down
 *  - Indeterminate (◪) state — when some but not all children are checked
 */

import { TreeGrid, TreeGridColumn, Column } from '@framesquared/ui';
import { TreeStore } from '@framesquared/data';
import { ControlBar } from '../../shared/ControlBar.js';

// ─── Permissions Dataset ─────────────────────────────────────────────────────

const PERMISSIONS_DATA = [
  {
    id: 'um', text: 'User Management', leaf: false, expanded: true,
    description: 'Manage application users and their accounts',
    riskLevel: 'Medium',
    $checked: true,
    children: [
      { id: 'um-c', text: 'Create Users', leaf: true, description: 'Add new user accounts', riskLevel: 'Medium', $checked: true },
      { id: 'um-e', text: 'Edit Users', leaf: true, description: 'Modify user profiles and settings', riskLevel: 'Low', $checked: true },
      { id: 'um-d', text: 'Delete Users', leaf: true, description: 'Permanently remove user accounts', riskLevel: 'High', $checked: false },
      { id: 'um-v', text: 'View Users', leaf: true, description: 'Read-only access to user list', riskLevel: 'Low', $checked: true },
    ],
  },
  {
    id: 'billing', text: 'Billing', leaf: false, expanded: false,
    description: 'Financial and subscription management',
    riskLevel: 'High',
    $checked: false,
    children: [
      { id: 'b-vi', text: 'View Invoices', leaf: true, description: 'Read billing history', riskLevel: 'Medium', $checked: false },
      { id: 'b-ci', text: 'Create Invoices', leaf: true, description: 'Generate new invoices', riskLevel: 'High', $checked: false },
      { id: 'b-ms', text: 'Manage Subscriptions', leaf: true, description: 'Change subscription plans', riskLevel: 'High', $checked: false },
    ],
  },
  {
    id: 'reports', text: 'Reports', leaf: false, expanded: false,
    description: 'Analytics and reporting features',
    riskLevel: 'Low',
    $checked: null, // indeterminate
    children: [
      { id: 'r-v', text: 'View Reports', leaf: true, description: 'Read existing reports', riskLevel: 'Low', $checked: true },
      { id: 'r-c', text: 'Create Reports', leaf: true, description: 'Build new report templates', riskLevel: 'Medium', $checked: false },
      { id: 'r-e', text: 'Export Reports', leaf: true, description: 'Download reports as CSV/PDF', riskLevel: 'Low', $checked: true },
    ],
  },
  {
    id: 'settings', text: 'Settings', leaf: false, expanded: false,
    description: 'Application configuration',
    riskLevel: 'High',
    $checked: true,
    children: [
      { id: 's-g', text: 'General Settings', leaf: true, description: 'Basic application preferences', riskLevel: 'Medium', $checked: true },
      { id: 's-s', text: 'Security Settings', leaf: true, description: 'Authentication and access policies', riskLevel: 'High', $checked: true },
    ],
  },
];

function riskRenderer(v: unknown): string {
  const risk = String(v ?? '');
  const cls = risk === 'High' ? 'badge-blocked' : risk === 'Medium' ? 'badge-review' : 'badge-completed';
  return `<span class="badge ${cls}">${risk}</span>`;
}

function updateCheckedCount(grid: TreeGrid, countEl: HTMLElement | null): void {
  if (!countEl) return;
  const checked = grid.getChecked();
  const leaves = grid.getCheckedLeaves();
  countEl.textContent = `${checked.length} nodes (${leaves.length} leaf permissions)`;
}

export function createExample(container: HTMLElement): { destroy: () => void } {
  const store = new TreeStore({
    root: { id: '__root__', text: 'Application Features', expanded: true, children: PERMISSIONS_DATA as any[] },
  });

  const grid = new TreeGrid({
    title: 'Feature Permissions',
    store,
    rootVisible: false,
    // checkable: true adds a checkbox column to every row
    checkable: true,
    // cascadeChecks: true — checking/unchecking a node propagates to children
    cascadeChecks: true,
    // checkPropagation: 'both' — changes propagate both up (to parents) and down (to children)
    checkPropagation: 'both',
    useArrows: true,
    animate: true,
    columns: [
      new TreeGridColumn({ text: 'Feature', dataIndex: 'text', flex: 2 }),
      new Column({ text: 'Description', dataIndex: 'description', flex: 3 }),
      new Column({ text: 'Risk Level', dataIndex: 'riskLevel', width: 100, renderer: riskRenderer }),
    ],
    height: 420,
  });

  // Event logging
  (grid as any).on?.('checkchange', (node: any, checked: boolean) => {
    window.__logEvent?.('checkchange', `"${node.text}" → ${checked ? 'checked' : checked === null ? 'indeterminate' : 'unchecked'}`);
    updateCheckedCount(grid, document.getElementById('checkbox-count'));
  });
  (grid as any).on?.('itemexpand', (node: any) => {
    window.__logEvent?.('itemexpand', `"${node.text}"`);
  });

  grid.render(container);

  // Status footer
  const footer = document.createElement('div');
  footer.style.cssText = 'margin-top:8px;padding:8px;background:#f8f9fa;border-radius:4px;font-size:13px';
  footer.innerHTML = 'Selected: <strong id="checkbox-count-inline">—</strong>';
  container.appendChild(footer);
  setTimeout(() => updateCheckedCount(grid, document.getElementById('checkbox-count-inline')), 100);

  // Controls
  const controlContainer = document.getElementById('tab-controls');
  if (controlContainer) {
    new ControlBar(controlContainer, [
      {
        title: 'Propagation',
        controls: [
          { type: 'select', label: 'Check Propagation', field: 'propagation', value: 'both', options: ['both', 'up', 'down', 'none'] },
          { type: 'checkbox', label: 'Only Leaf Checkable', field: 'onlyLeaf', value: false },
        ],
      },
      {
        title: 'Actions',
        controls: [
          { type: 'button', label: 'Check All', handler: () => { grid.checkAll(); updateCheckedCount(grid, document.getElementById('checkbox-count-inline')); } },
          { type: 'button', label: 'Uncheck All', handler: () => { grid.uncheckAll(); updateCheckedCount(grid, document.getElementById('checkbox-count-inline')); } },
          { type: 'button', label: 'Get Checked', handler: () => {
            const names = grid.getChecked().map((n: any) => n.text).join(', ');
            alert(`Checked (${grid.getChecked().length}): ${names || 'none'}`);
          }},
          { type: 'button', label: 'Get Checked Leaves', handler: () => {
            const names = grid.getCheckedLeaves().map((n: any) => n.text).join(', ');
            alert(`Checked Leaves (${grid.getCheckedLeaves().length}): ${names || 'none'}`);
          }},
        ],
      },
      {
        title: 'Stats',
        controls: [
          { type: 'display', label: 'Checked', id: 'checkbox-count', value: '—' },
        ],
      },
    ], (field, value) => {
      if (field === 'propagation') {
        (grid as any)._checkPropagation = value;
      } else if (field === 'onlyLeaf') {
        (grid as any)._onlyLeafCheckable = value;
        (grid as any)._view?.refresh();
      }
      updateCheckedCount(grid, document.getElementById('checkbox-count'));
    });
  }

  return { destroy() { grid.destroy?.(); } };
}
