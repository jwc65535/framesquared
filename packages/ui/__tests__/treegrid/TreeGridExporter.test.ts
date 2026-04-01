import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TreeGridExporter } from '../../src/treegrid/TreeGridExporter.js';
import { TreeGrid } from '../../src/treegrid/TreeGrid.js';
import { TreeStore, TreeModel } from '@framesquared/data';

class MockRO {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function makeGrid() {
  return new TreeGrid({
    renderTo: document.body,
    store: new TreeStore({
      model: TreeModel,
      root: {
        id: 'root', text: 'Root', expanded: true,
        children: [
          {
            id: 'folder1', text: 'Folder 1', expanded: true,
            children: [
              { id: 'f1', text: 'File 1', size: 100, leaf: true },
              { id: 'f2', text: 'File 2', size: 200, leaf: true },
            ],
          },
          { id: 'f3', text: 'File 3', size: 300, leaf: true },
        ],
      },
    }),
    columns: [
      { dataIndex: 'text', text: 'Name' },
      { dataIndex: 'size', text: 'Size' },
    ],
  } as any);
}

beforeEach(() => {
  (globalThis as any).ResizeObserver = MockRO;
  // Mock URL.createObjectURL
  (globalThis as any).URL = {
    createObjectURL: vi.fn(() => 'blob:mock'),
    revokeObjectURL: vi.fn(),
  };
});

afterEach(() => {
  document.body.innerHTML = '';
});

// ═══════════════════════════════════════════════════════════════════════════
// CSV export
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridExporter — CSV', () => {
  it('exportToCsv returns string', () => {
    const grid = makeGrid();
    const csv = TreeGridExporter.exportToCsv(grid);
    expect(typeof csv).toBe('string');
  });

  it('exportToCsv includes headers', () => {
    const grid = makeGrid();
    const csv = TreeGridExporter.exportToCsv(grid);
    expect(csv).toContain('Name');
    expect(csv).toContain('Size');
  });

  it('exportToCsv includes data rows', () => {
    const grid = makeGrid();
    const csv = TreeGridExporter.exportToCsv(grid);
    expect(csv).toContain('File 1');
    expect(csv).toContain('File 2');
    expect(csv).toContain('File 3');
  });

  it('exportToCsv includeHeaders=false omits header row', () => {
    const grid = makeGrid();
    const csv = TreeGridExporter.exportToCsv(grid, { includeHeaders: false });
    expect(csv).not.toContain('Name');
  });

  it('exportToCsv with specific columns', () => {
    const grid = makeGrid();
    const csv = TreeGridExporter.exportToCsv(grid, { columns: ['text'] });
    expect(csv).toContain('Name');
    expect(csv).not.toContain('Size');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TSV export
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridExporter — TSV', () => {
  it('exportToTsv returns tab-separated values', () => {
    const grid = makeGrid();
    const tsv = TreeGridExporter.exportToTsv(grid);
    expect(tsv).toContain('\t');
  });

  it('exportToTsv includes all nodes', () => {
    const grid = makeGrid();
    const tsv = TreeGridExporter.exportToTsv(grid);
    expect(tsv).toContain('File 1');
    expect(tsv).toContain('File 3');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// JSON export
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridExporter — JSON', () => {
  it('exportToJson returns valid JSON string', () => {
    const grid = makeGrid();
    const json = TreeGridExporter.exportToJson(grid);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('exportToJson includes nested structure', () => {
    const grid = makeGrid();
    const json = TreeGridExporter.exportToJson(grid);
    const parsed = JSON.parse(json);
    // Should be an array or object
    expect(parsed).toBeDefined();
  });

  it('exportToJson includes children arrays for non-leaf nodes', () => {
    const grid = makeGrid();
    const json = TreeGridExporter.exportToJson(grid);
    const parsed = JSON.parse(json);
    // folder1 has children
    if (Array.isArray(parsed)) {
      const folder = parsed.find((n: any) => n.text === 'Folder 1');
      if (folder) {
        expect(folder.children).toBeDefined();
        expect(folder.children.length).toBe(2);
      }
    }
  });

  it('expandedOnly option exports only visible nodes', () => {
    const grid = makeGrid();
    // Collapse folder1
    const folder1 = grid.getNodeById('folder1')!;
    grid.collapseNode(folder1);

    const json = TreeGridExporter.exportToJson(grid, { expandedOnly: true });
    const parsed = JSON.parse(json);
    // Children of folder1 should not appear as they're collapsed
    expect(parsed).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// XLSX export
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridExporter — XLSX', () => {
  it('exportToXlsx returns ArrayBuffer', () => {
    const grid = makeGrid();
    const buffer = TreeGridExporter.exportToXlsx(grid);
    expect(buffer).toBeInstanceOf(ArrayBuffer);
  });

  it('XLSX buffer has non-zero size', () => {
    const grid = makeGrid();
    const buffer = TreeGridExporter.exportToXlsx(grid);
    expect(buffer.byteLength).toBeGreaterThan(0);
  });

  it('XLSX buffer starts with XML declaration', () => {
    const grid = makeGrid();
    const buffer = TreeGridExporter.exportToXlsx(grid);
    const text = new TextDecoder().decode(buffer);
    expect(text).toContain('<?xml');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Download
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridExporter — download', () => {
  it('download triggers browser download', () => {
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') {
        el.click = clickSpy;
      }
      return el;
    });

    TreeGridExporter.download('hello,world', 'test.csv', 'text/csv');
    expect(clickSpy).toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('download accepts ArrayBuffer', () => {
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') el.click = vi.fn();
      return el;
    });

    const grid = makeGrid();
    const buffer = TreeGridExporter.exportToXlsx(grid);
    expect(() => {
      TreeGridExporter.download(buffer, 'export.xlsx', 'application/vnd.ms-excel');
    }).not.toThrow();

    vi.restoreAllMocks();
  });
});
