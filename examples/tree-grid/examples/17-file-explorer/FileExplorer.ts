/**
 * Example 17: File Explorer Application
 * Full macOS Finder-style application using TreeGrid as the centerpiece.
 */
import { TreeGrid, TreeGridColumn, Column } from '@framesquared/ui';
import { TreeStore } from '@framesquared/data';
import { smallFileSystem } from '../../shared/SampleData.js';
import { ControlBar } from '../../shared/ControlBar.js';

function formatSize(bytes: unknown): string {
  const n = Number(bytes ?? 0);
  if (!n) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n/1024).toFixed(1)} KB`;
  return `${(n/1048576).toFixed(1)} MB`;
}
function formatDate(v: unknown): string {
  if (!v) return '—';
  return new Date(String(v)).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}
function getFileIcon(node: any): string {
  if (!node.leaf) return '📁';
  const ext = (node.ext ?? '').toLowerCase();
  const icons: Record<string,string> = { pdf:'📄', docx:'📝', xlsx:'📊', pptx:'📑', md:'📋', jpg:'🖼', png:'🖼', heic:'🖼', mp3:'🎵', m4a:'🎵', flac:'🎵', ts:'💻', tsx:'💻', js:'💻', json:'⚙️', zip:'📦', dmg:'💿' };
  return icons[ext] ?? '📄';
}

export function createExample(container: HTMLElement): { destroy: () => void } {
  // ── Layout shell ──
  container.style.cssText = 'display:flex;flex-direction:column;height:540px;border:1px solid #e0e0e0;border-radius:4px;overflow:hidden;background:#fff';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.style.cssText = 'display:flex;align-items:center;gap:6px;padding:6px 10px;background:#f8f9fa;border-bottom:1px solid #e0e0e0;flex-shrink:0';
  toolbar.innerHTML = `
    <button class="control-btn" id="fe-new-folder" title="New Folder">📁 New Folder</button>
    <button class="control-btn" id="fe-delete" title="Delete">🗑 Delete</button>
    <button class="control-btn" id="fe-rename" title="Rename (select a file)">✏️ Rename</button>
    <div style="flex:1"></div>
    <input id="fe-search" type="text" placeholder="🔍 Search files..." style="padding:4px 8px;border:1px solid #ddd;border-radius:4px;font-size:12px;width:180px">
  `;
  container.appendChild(toolbar);

  // Breadcrumb
  const breadcrumb = document.createElement('div');
  breadcrumb.style.cssText = 'padding:4px 12px;background:#fff;border-bottom:1px solid #eee;font-size:12px;color:#555;flex-shrink:0';
  breadcrumb.id = 'fe-breadcrumb';
  breadcrumb.innerHTML = '<span style="color:#1976d2">My Files</span>';
  container.appendChild(breadcrumb);

  // Body (sidebar + main)
  const body = document.createElement('div');
  body.style.cssText = 'display:flex;flex:1;overflow:hidden';
  container.appendChild(body);

  // Sidebar
  const sidebar = document.createElement('div');
  sidebar.style.cssText = 'width:160px;border-right:1px solid #eee;padding:8px 0;background:#fafafa;overflow-y:auto;flex-shrink:0;font-size:12px';
  sidebar.innerHTML = `
    <div style="padding:4px 12px;font-size:10px;font-weight:600;text-transform:uppercase;color:#888;letter-spacing:.06em">Favorites</div>
    ${['My Files','Documents','Pictures','Music','Projects','Downloads'].map(name =>
      `<div class="fe-sidebar-item" data-nav="${name}" style="padding:5px 12px;cursor:pointer;border-radius:3px;margin:1px 4px" onmouseover="this.style.background='#e8f0fe'" onmouseout="this.style.background=''">${
        name === 'My Files' ? '🏠' : name === 'Documents' ? '📁' : name === 'Pictures' ? '🖼' : name === 'Music' ? '🎵' : name === 'Projects' ? '💻' : '⬇️'
      } ${name}</div>`
    ).join('')}
  `;
  body.appendChild(sidebar);

  // Main grid area
  const mainArea = document.createElement('div');
  mainArea.style.cssText = 'flex:1;overflow:auto';
  body.appendChild(mainArea);

  // Status bar
  const statusBar = document.createElement('div');
  statusBar.style.cssText = 'padding:4px 12px;background:#f8f9fa;border-top:1px solid #eee;font-size:11px;color:#666;flex-shrink:0';
  statusBar.id = 'fe-status';
  statusBar.textContent = 'Ready';
  container.appendChild(statusBar);

  // ── Store & Grid ──
  const store = new TreeStore({
    root: { id: '__root__', text: 'My Files', expanded: true, children: smallFileSystem as any[] },
  });

  const grid = new TreeGrid({
    title: '',
    store,
    rootVisible: false,
    useArrows: true,
    animate: true,
    columns: [
      new TreeGridColumn({
        text: 'Name', dataIndex: 'text', flex: 2,
        renderer: (v: unknown, node: any) => `${getFileIcon(node)} ${v}`,
      } as any),
      new Column({ text: 'Size', dataIndex: 'size', width: 80, renderer: (v:unknown) => formatSize(v) }),
      new Column({ text: 'Modified', dataIndex: 'modified', width: 130, renderer: (v:unknown) => formatDate(v) }),
      new Column({ text: 'Type', dataIndex: 'type', width: 70 }),
    ],
    height: 400,
  });

  grid.render(mainArea);

  // ── Breadcrumb update ──
  function updateBreadcrumb(node: any): void {
    if (!node) return;
    const path: string[] = [];
    let cur = node;
    while (cur && !cur.isRoot?.()) { path.unshift(cur.text); cur = cur.parentNode; }
    const el = document.getElementById('fe-breadcrumb');
    if (el) {
      el.innerHTML = ['My Files', ...path].map((seg, i, arr) =>
        i === arr.length - 1
          ? `<span style="color:#1976d2">${seg}</span>`
          : `<span style="cursor:pointer;text-decoration:underline;color:#555">${seg}</span> <span style="color:#ccc">›</span> `
      ).join('');
    }
  }

  // ── Status bar update ──
  function updateStatus(): void {
    const sel = grid.getSelection();
    let total = 0;
    let totalSize = 0;
    store.getRootNode().cascadeBy((n: any) => { if (!n.isRoot?.()) { total++; if (n.isLeaf?.()) totalSize += (n.size ?? 0); } });
    const el = document.getElementById('fe-status');
    if (el) {
      el.textContent = sel.length > 0
        ? `${total} items, ${sel.length} selected — ${formatSize(sel.reduce((s, n: any) => s + (n.size ?? 0), 0))} selected`
        : `${total} items — ${formatSize(totalSize)} total`;
    }
  }

  (grid as any).on?.('itemclick', (_view: unknown, node: any) => {
    updateBreadcrumb(node);
    updateStatus();
    window.__logEvent?.('itemclick', `"${node.text}" (${node.isLeaf?.() ? 'file' : 'folder'})`);
  });
  (grid as any).on?.('itemexpand', (node: any) => {
    updateBreadcrumb(node);
    window.__logEvent?.('itemexpand', `"${node.text}"`);
  });
  (grid as any).on?.('selectionchange', () => updateStatus());

  setTimeout(updateStatus, 100);

  // ── Toolbar actions ──
  document.getElementById('fe-new-folder')?.addEventListener('click', () => {
    const sel = grid.getSelection();
    const parent = (sel.length > 0 && !(sel[0] as any).isLeaf?.()) ? sel[0] : store.getRootNode();
    const newNode = (parent as any).createNode?.({ text: 'New Folder', leaf: false, type: 'folder', size: 0, expanded: false });
    if (newNode) {
      (parent as any).appendChild(newNode);
      (grid as any)._view?.refresh();
      window.__logEvent?.('nodeappend', `New folder in "${(parent as any).text}"`);
    }
  });

  document.getElementById('fe-delete')?.addEventListener('click', () => {
    const sel = grid.getSelection();
    if (!sel.length) { alert('Select a file or folder first'); return; }
    if (confirm(`Delete "${(sel[0] as any).text}"?`)) {
      (sel[0] as any).parentNode?.removeChild(sel[0]);
      (grid as any)._view?.refresh();
      updateStatus();
      window.__logEvent?.('noderemove', `"${(sel[0] as any).text}" deleted`);
    }
  });

  document.getElementById('fe-rename')?.addEventListener('click', () => {
    const sel = grid.getSelection();
    if (!sel.length) { alert('Select a file or folder first'); return; }
    const node = sel[0] as any;
    const newName = prompt('New name:', node.text);
    if (newName && newName.trim()) {
      node.text = newName.trim();
      node.set?.('text', newName.trim());
      (grid as any)._view?.refresh();
      window.__logEvent?.('rename', `Renamed to "${newName.trim()}"`);
    }
  });

  // Search filter
  document.getElementById('fe-search')?.addEventListener('input', (e) => {
    const q = ((e.target as HTMLInputElement).value ?? '').toLowerCase();
    mainArea.querySelectorAll('tr[data-node-id]').forEach(row => {
      const text = row.querySelector('td')?.textContent?.toLowerCase() ?? '';
      (row as HTMLElement).style.display = (!q || text.includes(q)) ? '' : 'none';
    });
  });

  // Sidebar navigation
  sidebar.querySelectorAll('.fe-sidebar-item').forEach(item => {
    item.addEventListener('click', () => {
      const navTarget = (item as HTMLElement).dataset.nav ?? '';
      if (navTarget === 'My Files') {
        grid.collapseAll();
        (grid as any)._view?.refresh();
        return;
      }
      const root = store.getRootNode();
      const target = root.findChild?.('text', navTarget, false);
      if (target) {
        grid.expandNode(target as any);
        grid.scrollToNode(target as any, { select: true });
      }
      window.__logEvent?.('navigate', `Sidebar: "${navTarget}"`);
    });
  });

  // Context menu
  mainArea.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const sel = grid.getSelection();
    if (!sel.length) return;
    const node = sel[0] as any;
    const menu = document.createElement('div');
    menu.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;background:#fff;border:1px solid #ddd;border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:1000;min-width:160px;font-size:13px`;
    menu.innerHTML = `
      <div class="ctx-item" style="padding:6px 14px;cursor:pointer" onmouseover="this.style.background='#f0f7ff'" onmouseout="this.style.background=''">📂 Open</div>
      <div class="ctx-item" style="padding:6px 14px;cursor:pointer" onmouseover="this.style.background='#f0f7ff'" onmouseout="this.style.background=''">✏️ Rename</div>
      <div class="ctx-item" style="padding:6px 14px;cursor:pointer;color:#ef4444" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background=''">🗑 Delete</div>
      <hr style="margin:2px 0;border:none;border-top:1px solid #eee">
      <div class="ctx-item" style="padding:6px 14px;cursor:pointer" onmouseover="this.style.background='#f0f7ff'" onmouseout="this.style.background=''">ℹ️ Properties</div>
    `;
    document.body.appendChild(menu);
    const items = menu.querySelectorAll('.ctx-item');
    items[0].addEventListener('click', () => { window.__logEvent?.('contextmenu', `Open "${node.text}"`); menu.remove(); });
    items[1].addEventListener('click', () => {
      const n = prompt('Rename to:', node.text);
      if (n) { node.text = n; node.set?.('text', n); (grid as any)._view?.refresh(); }
      menu.remove();
    });
    items[2].addEventListener('click', () => {
      if (confirm(`Delete "${node.text}"?`)) { node.parentNode?.removeChild(node); (grid as any)._view?.refresh(); updateStatus(); }
      menu.remove();
    });
    items[3].addEventListener('click', () => {
      alert(`Name: ${node.text}\nType: ${node.type ?? '—'}\nSize: ${formatSize(node.size)}\nModified: ${formatDate(node.modified)}`);
      menu.remove();
    });
    const removeMenu = () => { menu.remove(); document.removeEventListener('click', removeMenu); };
    setTimeout(() => document.addEventListener('click', removeMenu), 50);
  });

  return {
    destroy() {
      grid.destroy?.();
      container.style.cssText = '';
    },
  };
}
