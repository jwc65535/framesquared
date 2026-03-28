/**
 * Example 19: Organizational Chart
 * Company hierarchy with avatar initials, profile card, and department filtering.
 */
import { TreeGrid, TreeGridColumn, Column } from '@framesquared/ui';
import { TreeStore } from '@framesquared/data';
import { DataGenerator } from '../../shared/DataGenerator.js';
import { ControlBar } from '../../shared/ControlBar.js';

const DEPT_COLORS: Record<string,string> = {
  Engineering: '#3b82f6', Product: '#8b5cf6', Design: '#ec4899',
  Marketing: '#10b981', Sales: '#f59e0b', Operations: '#6b7280',
};

function getInitials(name: string): string {
  return name.split(' ').map(p => p[0] ?? '').join('').slice(0, 2).toUpperCase();
}
function avatarHtml(node: any): string {
  if (!node.isLeaf?.() && !node.name) return '';
  const name = node.name ?? node.text;
  const dept = node.department ?? 'Operations';
  const color = DEPT_COLORS[dept] ?? '#6b7280';
  return `<span class="avatar" style="background:${color};width:24px;height:24px;font-size:10px;margin-right:6px">${getInitials(name)}</span>`;
}

function skillsHtml(skills: string[]): string {
  if (!skills?.length) return '—';
  return skills.slice(0, 3).map(s =>
    `<span style="display:inline-block;padding:1px 6px;background:#eff6ff;color:#1e40af;border-radius:10px;font-size:10px;margin:1px">${s}</span>`
  ).join('') + (skills.length > 3 ? `<span style="font-size:10px;color:#888"> +${skills.length - 3}</span>` : '');
}

export function createExample(container: HTMLElement): { destroy: () => void } {
  container.style.cssText = 'display:flex;flex-direction:column;height:540px;border:1px solid #e0e0e0;border-radius:4px;overflow:hidden;background:#fff';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 10px;background:#f8f9fa;border-bottom:1px solid #e0e0e0;flex-shrink:0';
  toolbar.innerHTML = `
    <strong style="font-size:13px">Org Chart</strong>
    <div style="flex:1"></div>
    <input id="oc-search" type="text" placeholder="Search by name or title..." style="padding:4px 8px;border:1px solid #ddd;border-radius:4px;font-size:12px;width:200px">
    <select id="oc-dept-filter" style="padding:4px 8px;border:1px solid #ddd;border-radius:4px;font-size:12px">
      <option value="">All Departments</option>
      <option>Engineering</option><option>Product</option><option>Design</option>
      <option>Marketing</option><option>Sales</option><option>Operations</option>
    </select>
    <select id="oc-loc-filter" style="padding:4px 8px;border:1px solid #ddd;border-radius:4px;font-size:12px">
      <option value="">All Locations</option>
      <option>San Francisco</option><option>London</option><option>Tokyo</option><option>Remote</option>
    </select>
  `;
  container.appendChild(toolbar);

  // Body
  const body = document.createElement('div');
  body.style.cssText = 'display:flex;flex:1;overflow:hidden';
  container.appendChild(body);

  const gridArea = document.createElement('div');
  gridArea.style.cssText = 'flex:1;overflow:auto';
  body.appendChild(gridArea);

  // Profile card panel
  const profilePanel = document.createElement('div');
  profilePanel.style.cssText = 'width:220px;border-left:1px solid #eee;padding:16px;overflow-y:auto;background:#fafafa;flex-shrink:0';
  profilePanel.innerHTML = '<div id="oc-profile">Select a person to view their profile.</div>';
  body.appendChild(profilePanel);

  // Store & Grid
  const orgData = DataGenerator.organization({ departments: 4, teamsPerDept: 2, membersPerTeam: 5 });
  const store = new TreeStore({
    root: { id: '__root__', text: 'Acme Corporation', expanded: true, children: orgData as any[] },
  });

  const grid = new TreeGrid({
    title: '',
    store,
    rootVisible: true,
    useArrows: true,
    animate: true,
    columns: [
      new TreeGridColumn({
        text: 'Name', dataIndex: 'text', flex: 2,
        renderer: (v: unknown, node: any) => avatarHtml(node) + String(v ?? ''),
      } as any),
      new Column({ text: 'Title', dataIndex: 'title', width: 160 }),
      new Column({ text: 'Location', dataIndex: 'location', width: 100,
        renderer: (v:unknown) => {
          const loc = String(v ?? '');
          const flags: Record<string,string> = { 'San Francisco':'🇺🇸', London:'🇬🇧', Tokyo:'🇯🇵', Remote:'🌍' };
          return `${flags[loc] ?? '🌍'} ${loc}`;
        },
      }),
      new Column({ text: 'Skills', dataIndex: 'skills', width: 200,
        renderer: (v: unknown) => skillsHtml((v as string[]) ?? []),
      }),
      new Column({ text: 'Team Size', dataIndex: 'isManager', width: 80,
        renderer: (v: unknown, node: any) => {
          if (!v) return '—';
          const count = node.childNodes?.length ?? node.parentNode?.childNodes?.length ?? '?';
          return String(count);
        },
      } as any),
    ],
    height: 440,
  });

  grid.render(gridArea);

  // Profile card update
  function updateProfile(node: any): void {
    const el = document.getElementById('oc-profile');
    if (!el || !node.name) return;
    const dept = node.department ?? '—';
    const color = DEPT_COLORS[dept] ?? '#6b7280';
    const stars = '★'.repeat(node.performanceRating ?? 0) + '☆'.repeat(5 - (node.performanceRating ?? 0));
    el.innerHTML = `
      <div style="text-align:center;margin-bottom:12px">
        <div class="avatar" style="background:${color};width:56px;height:56px;font-size:20px;margin:0 auto 8px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700">${getInitials(node.name)}</div>
        <div style="font-weight:700;font-size:14px">${node.name}</div>
        <div style="color:#666;font-size:12px">${node.title ?? '—'}</div>
        <div style="color:${color};font-size:11px;margin-top:2px">${dept}</div>
      </div>
      <div style="font-size:12px">
        <div style="margin:4px 0">📧 <a href="mailto:${node.email}" style="color:#1976d2">${node.email ?? '—'}</a></div>
        <div style="margin:4px 0">📍 ${node.location ?? '—'}</div>
        <div style="margin:4px 0">📅 Hired: ${node.hireDate ?? '—'}</div>
        <div style="margin:4px 0">💰 $${(node.salary ?? 0).toLocaleString()}</div>
        <div style="margin:4px 0">⭐ ${stars}</div>
        <div style="margin:8px 0 4px;font-weight:600">Skills</div>
        <div>${skillsHtml(node.skills ?? [])}</div>
      </div>
    `;
  }

  (grid as any).on?.('itemclick', (_v: unknown, node: any) => {
    if (node.name) updateProfile(node);
    window.__logEvent?.('itemclick', `"${node.text}" (${node.title ?? node.department ?? 'team'})`);
  });
  (grid as any).on?.('itemexpand', (n: any) => window.__logEvent?.('itemexpand', `"${n.text}"`));

  // Search filter
  function applyFilters(): void {
    const q = ((document.getElementById('oc-search') as HTMLInputElement)?.value ?? '').toLowerCase();
    const dept = (document.getElementById('oc-dept-filter') as HTMLSelectElement)?.value ?? '';
    const loc = (document.getElementById('oc-loc-filter') as HTMLSelectElement)?.value ?? '';
    gridArea.querySelectorAll('tr[data-node-id]').forEach(row => {
      const text = row.querySelector('td')?.textContent?.toLowerCase() ?? '';
      const rowEl = row as HTMLElement;
      const pass = (!q || text.includes(q)) &&
        (!dept || text.includes(dept.toLowerCase())) &&
        (!loc || text.includes(loc.toLowerCase()));
      rowEl.style.display = pass ? '' : 'none';
    });
  }
  document.getElementById('oc-search')?.addEventListener('input', applyFilters);
  document.getElementById('oc-dept-filter')?.addEventListener('change', applyFilters);
  document.getElementById('oc-loc-filter')?.addEventListener('change', applyFilters);

  const controlContainer = document.getElementById('tab-controls');
  if (controlContainer) {
    new ControlBar(controlContainer, [
      {
        title: 'Actions',
        controls: [
          { type: 'button', label: 'Expand All', handler: () => grid.expandAll() },
          { type: 'button', label: 'Collapse All', handler: () => grid.collapseAll() },
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
