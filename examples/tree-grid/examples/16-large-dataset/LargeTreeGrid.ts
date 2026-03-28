/**
 * Example 16: Large Dataset — 100,000 Nodes
 * Demonstrates virtual scrolling and performance at scale.
 */
import { TreeGrid, TreeGridColumn, Column } from '@framesquared/ui';
import { TreeStore } from '@framesquared/data';
import { DataGenerator } from '../../shared/DataGenerator.js';
import { ControlBar } from '../../shared/ControlBar.js';

function formatDate(v: unknown): string {
  if (!v) return '—';
  return new Date(String(v)).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

export function createExample(container: HTMLElement): { destroy: () => void } {
  let currentGrid: TreeGrid | null = null;
  let currentStore: TreeStore | null = null;
  let scrollFpsInterval: ReturnType<typeof setInterval> | null = null;
  let lastScrollTime = Date.now();
  let frameCount = 0;

  function buildGrid(totalNodes: number): void {
    if (currentGrid) {
      currentGrid.destroy?.();
      gridWrapper.innerHTML = '';
    }

    const t0 = performance.now();
    const data = DataGenerator.largeDataset(totalNodes, 6, 15);
    const genTime = Math.round(performance.now() - t0);

    currentStore = new TreeStore({
      root: { id: '__root__', text: 'Root', expanded: true, children: data as any[] },
    });

    const t1 = performance.now();
    currentGrid = new TreeGrid({
      title: `${totalNodes.toLocaleString()} Nodes — Performance Demo`,
      store: currentStore,
      rootVisible: false,
      useArrows: true,
      columns: [
        new TreeGridColumn({ text: 'Name', dataIndex: 'text', flex: 1 }),
        new Column({ text: 'Value', dataIndex: 'value', width: 80,
          renderer: (v:unknown) => String(v ?? '—') }),
        new Column({ text: 'Score', dataIndex: 'score', width: 70,
          renderer: (v:unknown) => String(v ?? '—') }),
        new Column({ text: 'Active', dataIndex: 'active', width: 65,
          renderer: (v:unknown) => v ? '✅' : '❌' }),
        new Column({ text: 'Created', dataIndex: 'created', width: 110,
          renderer: formatDate }),
      ],
      height: 500,
    });

    const renderTime = Math.round(performance.now() - t1);

    currentGrid.render(gridWrapper);

    // Update displays
    updateDisplay('perf-gen-time', `${genTime}ms`);
    updateDisplay('perf-render-time', `${renderTime}ms`);
    updateDisplay('perf-total', totalNodes.toLocaleString());
    updateDisplay('perf-visible', countVisible().toLocaleString());

    // DOM row count
    function updateDomCount(): void {
      const rows = gridWrapper.querySelectorAll('tr[data-node-id]').length;
      updateDisplay('perf-dom-rows', String(rows));
    }
    setTimeout(updateDomCount, 200);

    // Memory
    if ((performance as any).memory) {
      const mb = Math.round((performance as any).memory.usedJSHeapSize / 1048576);
      updateDisplay('perf-memory', `${mb} MB`);
    }

    // FPS tracking
    if (scrollFpsInterval) clearInterval(scrollFpsInterval);
    const gridEl = gridWrapper.querySelector('.x-treegrid-view') as HTMLElement | null;
    if (gridEl) {
      gridEl.addEventListener('scroll', () => {
        frameCount++;
        const now = Date.now();
        if (now - lastScrollTime >= 1000) {
          const fps = Math.min(60, Math.round(frameCount * 1000 / (now - lastScrollTime)));
          updateDisplay('perf-fps', `${fps} fps`);
          frameCount = 0;
          lastScrollTime = now;
        }
      }, { passive: true });
    }

    window.__logEvent?.('gridbuilt', `${totalNodes.toLocaleString()} nodes generated in ${genTime}ms, rendered in ${renderTime}ms`);
  }

  function countVisible(): number {
    if (!currentStore) return 0;
    let count = 0;
    currentStore.getRootNode().cascadeBy(() => { count++; });
    return count - 1; // subtract root
  }

  function updateDisplay(id: string, value: string): void {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  const gridWrapper = document.createElement('div');
  container.appendChild(gridWrapper);

  // Build initial 10K dataset (not 100K for snappy first load)
  buildGrid(10000);

  const controlContainer = document.getElementById('tab-controls');
  if (controlContainer) {
    new ControlBar(controlContainer, [
      {
        title: 'Dataset',
        controls: [
          { type: 'select', label: 'Size', field: 'size', value: '10000',
            options: ['1000', '5000', '10000', '50000', '100000'] },
          { type: 'button', label: 'Expand All (slow for large sets)',
            handler: () => {
              const t0 = performance.now();
              currentGrid?.expandAll();
              const t = Math.round(performance.now() - t0);
              updateDisplay('perf-render-time', `${t}ms`);
              updateDisplay('perf-visible', countVisible().toLocaleString());
              const rows = gridWrapper.querySelectorAll('tr[data-node-id]').length;
              updateDisplay('perf-dom-rows', String(rows));
              window.__logEvent?.('expandall', `Expanded all in ${t}ms`);
            },
          },
          { type: 'button', label: 'Collapse All',
            handler: () => {
              const t0 = performance.now();
              currentGrid?.collapseAll();
              const t = Math.round(performance.now() - t0);
              updateDisplay('perf-render-time', `${t}ms`);
              updateDisplay('perf-visible', countVisible().toLocaleString());
              window.__logEvent?.('collapseall', `Collapsed all in ${t}ms`);
            },
          },
          { type: 'button', label: 'Scroll to Random Node',
            handler: () => {
              if (!currentStore || !currentGrid) return;
              const flat: any[] = [];
              currentStore.getRootNode().cascadeBy((n: any) => { if (!n.isRoot?.()) flat.push(n); });
              if (flat.length === 0) return;
              const pick = flat[Math.floor(Math.random() * flat.length)];
              currentGrid.scrollToNode(pick, { select: true });
              window.__logEvent?.('scroll', `Scrolled to "${pick.text}"`);
            },
          },
        ],
      },
      {
        title: 'Filter',
        controls: [
          { type: 'text', label: 'Filter nodes', field: 'filter', value: '' },
        ],
      },
      {
        title: 'Performance Metrics',
        controls: [
          { type: 'display', label: 'Total Nodes', id: 'perf-total', value: '—' },
          { type: 'display', label: 'Visible Nodes', id: 'perf-visible', value: '—' },
          { type: 'display', label: 'DOM Rows', id: 'perf-dom-rows', value: '—' },
          { type: 'display', label: 'Gen Time', id: 'perf-gen-time', value: '—' },
          { type: 'display', label: 'Render Time', id: 'perf-render-time', value: '—' },
          { type: 'display', label: 'Scroll FPS', id: 'perf-fps', value: '—' },
          { type: 'display', label: 'Memory', id: 'perf-memory', value: '—' },
        ],
      },
    ], (field, value) => {
      if (field === 'size') {
        buildGrid(Number(value));
      }
      if (field === 'filter') {
        // Simple client-side filter — hides rows not matching
        const q = String(value).toLowerCase();
        gridWrapper.querySelectorAll('tr[data-node-id]').forEach(row => {
          const text = row.querySelector('td')?.textContent?.toLowerCase() ?? '';
          (row as HTMLElement).style.display = (!q || text.includes(q)) ? '' : 'none';
        });
      }
    });
  }

  return {
    destroy() {
      if (scrollFpsInterval) clearInterval(scrollFpsInterval);
      currentGrid?.destroy?.();
    },
  };
}
