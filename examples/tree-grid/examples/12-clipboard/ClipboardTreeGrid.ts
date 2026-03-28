/**
 * Example 12: Clipboard Integration
 * Copy tree data to clipboard as TSV with optional hierarchy indentation.
 */
import { TreeGrid, TreeGridColumn, Column, TreeGridClipboard } from '@framesquared/ui';
import { TreeStore } from '@framesquared/data';
import { smallProjectPlan } from '../../shared/SampleData.js';
import { ControlBar } from '../../shared/ControlBar.js';

export function createExample(container: HTMLElement): { destroy: () => void } {
  const store = new TreeStore({
    root: { id: '__root__', text: 'Project', expanded: true, children: smallProjectPlan as any[] },
  });

  const clipboard = new TreeGridClipboard({
    copyHierarchy: true,
    includeHeaders: true,
  });

  const grid = new TreeGrid({
    title: 'Clipboard Integration',
    store,
    rootVisible: false,
    useArrows: true,
    folderSort: true,
    plugins: [clipboard] as any,
    columns: [
      new TreeGridColumn({ text: 'Task', dataIndex: 'text', flex: 2 }),
      new Column({ text: 'Assignee', dataIndex: 'assignee', width: 130 }),
      new Column({ text: 'Status', dataIndex: 'status', width: 120 }),
      new Column({ text: 'Est. Hrs', dataIndex: 'estimatedHours', width: 80,
        renderer: (v: unknown) => v != null ? `${v}` : '0' }),
      new Column({ text: 'Actual Hrs', dataIndex: 'actualHours', width: 85,
        renderer: (v: unknown) => v != null ? `${v}` : '0' }),
    ],
    height: 380,
  });

  grid.render(container);

  // Clipboard preview area
  const previewSection = document.createElement('div');
  previewSection.style.cssText = 'margin-top:12px';
  previewSection.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
      <strong style="font-size:13px">Clipboard Preview</strong>
      <button class="control-btn" id="copy-all-btn" style="font-size:12px">Copy All Visible</button>
    </div>
    <textarea id="clipboard-preview" style="width:100%;height:140px;font-family:monospace;font-size:12px;border:1px solid #ddd;border-radius:4px;padding:8px;resize:vertical" placeholder="Copy data will appear here — paste TSV into a spreadsheet to verify format"></textarea>
    <div style="margin-top:4px;font-size:12px;color:#666" id="copy-stats">Last copy: —</div>
  `;
  container.appendChild(previewSection);

  function serializeVisible(copyHierarchy: boolean, includeHeaders: boolean): string {
    const cols = grid.getColumns();
    const lines: string[] = [];

    if (includeHeaders) {
      lines.push(cols.map(c => c.text ?? c.dataIndex ?? '').join('\t'));
    }

    function serializeNode(node: any, depth: number): void {
      if (!node || node.isRoot?.()) return;
      const values = cols.map(col => {
        let val = node[(col.dataIndex as string)] ?? '';
        if (col === cols[0] && copyHierarchy) {
          val = '  '.repeat(depth) + String(val);
        }
        return String(val).replace(/\t/g, ' ');
      });
      lines.push(values.join('\t'));
      if (!node.isLeaf?.() && node.isExpanded?.()) {
        node.eachChild?.((child: any) => serializeNode(child, depth + 1));
      }
    }

    const root = store.getRootNode();
    root.eachChild?.((child: any) => serializeNode(child, 0));
    return lines.join('\n');
  }

  let copyHierarchy = true;
  let includeHeaders = true;

  document.getElementById('copy-all-btn')?.addEventListener('click', () => {
    const tsv = serializeVisible(copyHierarchy, includeHeaders);
    const preview = document.getElementById('clipboard-preview') as HTMLTextAreaElement;
    if (preview) preview.value = tsv;

    const lines = tsv.split('\n');
    const cols = tsv.split('\n')[0]?.split('\t').length ?? 0;
    const stats = document.getElementById('copy-stats');
    if (stats) stats.textContent = `Last copy: ${lines.length} rows × ${cols} columns`;

    navigator.clipboard.writeText(tsv).then(() => {
      window.__logEvent?.('copy', `Copied ${lines.length} rows to clipboard`);
    }).catch(() => {
      window.__logEvent?.('copy', `${lines.length} rows serialized (clipboard write requires HTTPS)`);
    });
  });

  (grid as any).on?.('selectionchange', () => {
    const sel = grid.getSelection();
    if (sel.length > 0) {
      window.__logEvent?.('selectionchange', `${sel.length} rows selected`);
    }
  });

  const controlContainer = document.getElementById('tab-controls');
  if (controlContainer) {
    new ControlBar(controlContainer, [
      {
        title: 'Copy Options',
        controls: [
          { type: 'checkbox', label: 'Copy Hierarchy (indent)', field: 'copyHierarchy', value: true },
          { type: 'checkbox', label: 'Include Headers', field: 'includeHeaders', value: true },
          { type: 'button', label: 'Expand All', handler: () => grid.expandAll() },
          { type: 'button', label: 'Collapse All', handler: () => grid.collapseAll() },
        ],
      },
    ], (field, value) => {
      if (field === 'copyHierarchy') { copyHierarchy = value as boolean; (clipboard as any).copyHierarchy = value; }
      if (field === 'includeHeaders') { includeHeaders = value as boolean; (clipboard as any).includeHeaders = value; }
    });
  }

  return { destroy() { grid.destroy?.(); } };
}
