/**
 * Example 15: Theme Switching
 * Instant theme switching via ThemeManager CSS custom properties.
 */
import { TreeGrid, TreeGridColumn, Column } from '@framesquared/ui';
import { TreeStore } from '@framesquared/data';
import { ThemeManager, ModernTheme, DarkTheme, ClassicTheme } from '@framesquared/theme';
import { smallProjectPlan } from '../../shared/SampleData.js';
import { ControlBar } from '../../shared/ControlBar.js';

ThemeManager.register(ClassicTheme);
ThemeManager.register(ModernTheme);
ThemeManager.register(DarkTheme);

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

export function createExample(container: HTMLElement): { destroy: () => void } {
  const store = new TreeStore({
    root: { id: '__root__', text: 'Project', expanded: true, children: smallProjectPlan as any[] },
  });

  const grid = new TreeGrid({
    title: 'Themed TreeGrid',
    store,
    rootVisible: false,
    useArrows: true,
    folderSort: true,
    columns: [
      new TreeGridColumn({ text: 'Task', dataIndex: 'text', flex: 2 }),
      new Column({ text: 'Assignee', dataIndex: 'assignee', width: 130 }),
      new Column({ text: 'Status', dataIndex: 'status', width: 120, renderer: statusRenderer }),
      new Column({ text: 'Progress', dataIndex: 'percentComplete', width: 150, renderer: progressRenderer }),
      new Column({
        text: 'Est. Hrs', dataIndex: 'estimatedHours', width: 80,
        renderer: (v:unknown) => v != null ? `${v}h` : '—',
      }),
    ],
    height: 440,
  });

  grid.render(container);

  // Theme info panel
  const infoPanel = document.createElement('div');
  infoPanel.style.cssText = 'margin-top:8px;padding:8px 12px;background:var(--x-panel-header-bg,#1976d2);color:var(--x-panel-header-color,#fff);border-radius:4px;font-size:13px';
  infoPanel.id = 'theme-info-panel';
  function updateThemeInfo(): void {
    const name = ThemeManager.getActiveThemeName?.() ?? '—';
    const primary = ThemeManager.getToken?.('color.primary') ?? '#1976d2';
    infoPanel.innerHTML = `Theme: <strong>${name}</strong> | Primary: <strong style="color:${primary}">${primary}</strong>`;
  }
  updateThemeInfo();
  ThemeManager.on?.('themechange', updateThemeInfo);
  container.appendChild(infoPanel);

  (grid as any).on?.('itemexpand', (node: any) => {
    window.__logEvent?.('itemexpand', `"${node.text}" with theme: ${ThemeManager.getActiveThemeName?.() ?? '?'}`);
  });

  const controlContainer = document.getElementById('tab-controls');
  if (controlContainer) {
    new ControlBar(controlContainer, [
      {
        title: 'Theme',
        controls: [
          { type: 'button', label: '☀️  Modern', handler: () => { ThemeManager.setTheme('modern'); window.__logEvent?.('themechange', 'modern'); } },
          { type: 'button', label: '🏛  Classic', handler: () => { ThemeManager.setTheme('classic'); window.__logEvent?.('themechange', 'classic'); } },
          { type: 'button', label: '🌙  Dark', handler: () => { ThemeManager.setTheme('dark'); window.__logEvent?.('themechange', 'dark'); } },
        ],
      },
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
      ThemeManager.un?.('themechange', updateThemeInfo);
      grid.destroy?.();
    },
  };
}
