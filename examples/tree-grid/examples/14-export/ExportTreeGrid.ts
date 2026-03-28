/**
 * Example 14: Export
 * Export tree data to CSV, JSON, or TSV. Preview before downloading.
 */
import { TreeGrid, TreeGridColumn, Column, TreeGridExporter } from '@framesquared/ui';
import { TreeStore } from '@framesquared/data';
import { smallProjectPlan } from '../../shared/SampleData.js';
import { ControlBar } from '../../shared/ControlBar.js';

export function createExample(container: HTMLElement): { destroy: () => void } {
  const store = new TreeStore({
    root: { id: '__root__', text: 'Project', expanded: true, children: smallProjectPlan as any[] },
  });

  const exporter = new TreeGridExporter({});

  const grid = new TreeGrid({
    title: 'Export Demo',
    store,
    rootVisible: false,
    useArrows: true,
    folderSort: true,
    plugins: [exporter] as any,
    columns: [
      new TreeGridColumn({ text: 'Task', dataIndex: 'text', flex: 2 }),
      new Column({ text: 'Assignee', dataIndex: 'assignee', width: 130 }),
      new Column({ text: 'Status', dataIndex: 'status', width: 120 }),
      new Column({ text: 'Est. Hrs', dataIndex: 'estimatedHours', width: 80,
        renderer: (v:unknown) => v != null ? String(v) : '0' }),
      new Column({ text: 'Actual Hrs', dataIndex: 'actualHours', width: 85,
        renderer: (v:unknown) => v != null ? String(v) : '0' }),
      new Column({ text: 'Start', dataIndex: 'startDate', width: 100 }),
      new Column({ text: 'End', dataIndex: 'endDate', width: 100 }),
      new Column({ text: 'Priority', dataIndex: 'priority', width: 90 }),
    ],
    height: 360,
  });

  grid.render(container);

  // Preview panel
  const previewSection = document.createElement('div');
  previewSection.style.cssText = 'margin-top:12px';
  previewSection.innerHTML = `
    <div style="font-size:13px;font-weight:600;margin-bottom:6px">Export Preview <span id="export-preview-label" style="font-weight:400;color:#666">(first 20 lines)</span></div>
    <textarea id="export-preview" style="width:100%;height:120px;font-family:monospace;font-size:11px;border:1px solid #ddd;border-radius:4px;padding:8px;resize:vertical" readonly></textarea>
  `;
  container.appendChild(previewSection);

  let expandedOnly = false;
  let includeHeaders = true;
  let includeIndent = true;

  function collectNodes(expandedOnlyFlag: boolean): any[] {
    const result: any[] = [];
    function walk(node: any, depth: number): void {
      if (!node || node.isRoot?.()) return;
      result.push({ node, depth });
      if (!node.isLeaf?.() && (node.isExpanded?.() || !expandedOnlyFlag)) {
        node.eachChild?.((c: any) => walk(c, depth + 1));
      }
    }
    store.getRootNode().eachChild?.((c: any) => walk(c, 0));
    return result;
  }

  function toCsv(): string {
    const cols = grid.getColumns();
    const rows = collectNodes(expandedOnly);
    const lines: string[] = [];
    if (includeHeaders) {
      lines.push(cols.map(c => `"${(c.text ?? '').replace(/"/g,'""')}"`).join(','));
    }
    for (const { node, depth } of rows) {
      const vals = cols.map((col, i) => {
        let v = String(node[(col.dataIndex as string)] ?? '');
        if (i === 0 && includeIndent) v = '  '.repeat(depth) + v;
        return `"${v.replace(/"/g, '""')}"`;
      });
      lines.push(vals.join(','));
    }
    return lines.join('\n');
  }

  function toTsv(): string {
    const cols = grid.getColumns();
    const rows = collectNodes(expandedOnly);
    const lines: string[] = [];
    if (includeHeaders) lines.push(cols.map(c => c.text ?? '').join('\t'));
    for (const { node, depth } of rows) {
      const vals = cols.map((col, i) => {
        let v = String(node[(col.dataIndex as string)] ?? '');
        if (i === 0 && includeIndent) v = '  '.repeat(depth) + v;
        return v.replace(/\t/g, ' ');
      });
      lines.push(vals.join('\t'));
    }
    return lines.join('\n');
  }

  function toJson(): string {
    function nodeToObj(node: any): any {
      const cols = grid.getColumns();
      const obj: Record<string,unknown> = {};
      for (const col of cols) {
        if (col.dataIndex) obj[col.dataIndex as string] = node[col.dataIndex as string];
      }
      if (!node.isLeaf?.() && (node.isExpanded?.() || !expandedOnly)) {
        const children: any[] = [];
        node.eachChild?.((c: any) => children.push(nodeToObj(c)));
        if (children.length) obj.children = children;
      }
      return obj;
    }
    const roots: any[] = [];
    store.getRootNode().eachChild?.((c: any) => roots.push(nodeToObj(c)));
    return JSON.stringify(roots, null, 2);
  }

  function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    window.__logEvent?.('export', `Downloaded "${filename}" (${content.length} chars)`);
  }

  function updatePreview(format: string): void {
    const preview = document.getElementById('export-preview') as HTMLTextAreaElement;
    const label = document.getElementById('export-preview-label');
    let content = '';
    if (format === 'csv') content = toCsv();
    else if (format === 'tsv') content = toTsv();
    else if (format === 'json') content = toJson();
    const lines = content.split('\n').slice(0, 20).join('\n');
    if (preview) preview.value = lines + (content.split('\n').length > 20 ? '\n...' : '');
    if (label) label.textContent = `(${content.split('\n').length} lines)`;
  }

  const controlContainer = document.getElementById('tab-controls');
  if (controlContainer) {
    new ControlBar(controlContainer, [
      {
        title: 'Export Options',
        controls: [
          { type: 'checkbox', label: 'Expanded Only', field: 'expandedOnly', value: false },
          { type: 'checkbox', label: 'Include Headers', field: 'includeHeaders', value: true },
          { type: 'checkbox', label: 'Include Indentation', field: 'includeIndent', value: true },
        ],
      },
      {
        title: 'Download',
        controls: [
          { type: 'button', label: 'Export CSV', handler: () => { updatePreview('csv'); downloadFile(toCsv(), 'project-plan.csv', 'text/csv'); } },
          { type: 'button', label: 'Export TSV', handler: () => { updatePreview('tsv'); downloadFile(toTsv(), 'project-plan.tsv', 'text/tab-separated-values'); } },
          { type: 'button', label: 'Export JSON', handler: () => { updatePreview('json'); downloadFile(toJson(), 'project-plan.json', 'application/json'); } },
        ],
      },
      {
        title: 'Preview',
        controls: [
          { type: 'button', label: 'Preview CSV', handler: () => updatePreview('csv') },
          { type: 'button', label: 'Preview TSV', handler: () => updatePreview('tsv') },
          { type: 'button', label: 'Preview JSON', handler: () => updatePreview('json') },
          { type: 'button', label: 'Expand All', handler: () => { grid.expandAll(); updatePreview('csv'); } },
        ],
      },
    ], (field, value) => {
      if (field === 'expandedOnly') expandedOnly = value as boolean;
      if (field === 'includeHeaders') includeHeaders = value as boolean;
      if (field === 'includeIndent') includeIndent = value as boolean;
    });
  }

  // Initial preview
  setTimeout(() => updatePreview('csv'), 100);

  return { destroy() { grid.destroy?.(); } };
}
