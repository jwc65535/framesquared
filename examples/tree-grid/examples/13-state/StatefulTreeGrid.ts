/**
 * Example 13: State Persistence
 * Remembers expanded nodes, column sizes, and sort order across page reloads.
 */
import { TreeGrid, TreeGridColumn, Column, TreeGridStateMixin } from '@framesquared/ui';
import { TreeStore } from '@framesquared/data';
import { DataGenerator } from '../../shared/DataGenerator.js';
import { ControlBar } from '../../shared/ControlBar.js';

const STATE_ID = 'treegrid-state-demo';

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

function createGrid(container: HTMLElement): TreeGrid {
  const data = DataGenerator.fileSystem({ depth: 3, breadth: 5 });
  const store = new TreeStore({
    root: { id: '__root__', text: 'My Files', expanded: true, children: data as any[] },
  });

  const stateMixin = new TreeGridStateMixin({ stateId: STATE_ID });

  const grid = new TreeGrid({
    title: 'Stateful TreeGrid',
    store,
    rootVisible: false,
    useArrows: true,
    plugins: [stateMixin] as any,
    columns: [
      new TreeGridColumn({ text: 'Name', dataIndex: 'text', flex: 2 }),
      new Column({ text: 'Size', dataIndex: 'size', width: 100, renderer: (v:unknown) => formatSize(v) }),
      new Column({ text: 'Modified', dataIndex: 'modified', width: 150, renderer: (v:unknown) => formatDate(v) }),
      new Column({ text: 'Type', dataIndex: 'type', width: 90 }),
    ],
    height: 400,
  });

  grid.render(container);
  return grid;
}

export function createExample(container: HTMLElement): { destroy: () => void } {
  let currentGrid: TreeGrid = createGrid(container);

  function updateStateInfo(): void {
    const raw = localStorage.getItem(STATE_ID);
    const sizeEl = document.getElementById('state-size');
    const keysEl = document.getElementById('state-keys');
    if (sizeEl) sizeEl.textContent = raw ? `${raw.length} bytes` : '—';
    if (keysEl && raw) {
      try {
        const parsed = JSON.parse(raw);
        keysEl.textContent = Object.keys(parsed).join(', ');
      } catch { keysEl.textContent = '(parse error)'; }
    } else if (keysEl) {
      keysEl.textContent = '(no state saved)';
    }
  }

  setTimeout(updateStateInfo, 200);

  const hint = document.createElement('div');
  hint.style.cssText = 'margin-top:8px;font-size:12px;color:#666;padding:4px 8px;background:#f8f9fa;border-radius:4px';
  hint.textContent = '💡 Expand nodes, resize columns, then click "Simulate Page Reload" — the state is restored.';
  container.appendChild(hint);

  const controlContainer = document.getElementById('tab-controls');
  if (controlContainer) {
    new ControlBar(controlContainer, [
      {
        title: 'State Actions',
        controls: [
          {
            type: 'button', label: 'Simulate Page Reload',
            handler: () => {
              currentGrid.destroy?.();
              container.innerHTML = '';
              container.appendChild(hint);
              currentGrid = createGrid(container);
              container.appendChild(hint);
              window.__logEvent?.('reload', 'Grid destroyed and re-created — state restored from localStorage');
              setTimeout(updateStateInfo, 200);
            },
          },
          {
            type: 'button', label: 'Clear State',
            handler: () => {
              localStorage.removeItem(STATE_ID);
              updateStateInfo();
              window.__logEvent?.('clearstate', `Removed "${STATE_ID}" from localStorage`);
            },
          },
          {
            type: 'button', label: 'Show State JSON',
            handler: () => {
              const raw = localStorage.getItem(STATE_ID);
              alert(raw ? JSON.stringify(JSON.parse(raw), null, 2) : '(no saved state)');
            },
          },
        ],
      },
      {
        title: 'State Info',
        controls: [
          { type: 'display', label: 'State Size', id: 'state-size', value: '—' },
          { type: 'display', label: 'Keys', id: 'state-keys', value: '—' },
        ],
      },
    ], () => { setTimeout(updateStateInfo, 100); });
  }

  return {
    destroy() {
      currentGrid.destroy?.();
    },
  };
}
