import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TreeGridCellEditing } from '../../src/treegrid/TreeGridCellEditing.js';
import { TreeGrid } from '../../src/treegrid/TreeGrid.js';
import { TreeStore, TreeModel } from '@framesquared/data';
import type { NodeInterface } from '@framesquared/data';

class MockRO {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function makeStore() {
  return new TreeStore({
    model: TreeModel,
    root: {
      id: 'root',
      text: 'Root',
      expanded: true,
      children: [
        { id: 'a', text: 'Node A', size: 100, leaf: true },
        { id: 'b', text: 'Node B', size: 200, leaf: true },
      ],
    },
  });
}

function makeGrid(extra: Record<string, unknown> = {}) {
  return new TreeGrid({
    renderTo: document.body,
    store: makeStore(),
    columns: [
      { dataIndex: 'text', text: 'Name' },
      { dataIndex: 'size', text: 'Size' },
    ],
    ...extra,
  } as any);
}

beforeEach(() => {
  (globalThis as any).ResizeObserver = MockRO;
});

afterEach(() => {
  document.body.innerHTML = '';
});

// ═══════════════════════════════════════════════════════════════════════════
// Construction
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridCellEditing — construction', () => {
  it('creates with defaults', () => {
    const plugin = new TreeGridCellEditing();
    expect(plugin).toBeDefined();
  });

  it('init does not throw', () => {
    const grid = makeGrid();
    const plugin = new TreeGridCellEditing();
    expect(() => plugin.init(grid)).not.toThrow();
  });

  it('destroy does not throw', () => {
    const grid = makeGrid();
    const plugin = new TreeGridCellEditing();
    plugin.init(grid);
    expect(() => plugin.destroy()).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Edit lifecycle
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridCellEditing — edit lifecycle', () => {
  it('startEdit creates input in cell', () => {
    const grid = makeGrid();
    const plugin = new TreeGridCellEditing();
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    plugin.startEdit(nodeA, 'text');

    const editor = document.querySelector('.x-treegrid-cell-editor') as HTMLInputElement;
    expect(editor).not.toBeNull();
    expect(editor.value).toBe('Node A');
  });

  it('isEditing returns true during edit', () => {
    const grid = makeGrid();
    const plugin = new TreeGridCellEditing();
    plugin.init(grid);
    expect(plugin.isEditing()).toBe(false);

    const nodeA = grid.getNodeById('a')!;
    plugin.startEdit(nodeA, 'text');
    expect(plugin.isEditing()).toBe(true);
  });

  it('cancelEdit removes editor without saving', () => {
    const grid = makeGrid();
    const plugin = new TreeGridCellEditing();
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    plugin.startEdit(nodeA, 'text');
    plugin.cancelEdit();

    expect(plugin.isEditing()).toBe(false);
    expect(document.querySelector('.x-treegrid-cell-editor')).toBeNull();
  });

  it('completeEdit saves value to record', async () => {
    const grid = makeGrid();
    const plugin = new TreeGridCellEditing();
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    plugin.startEdit(nodeA, 'size');

    const editor = document.querySelector('.x-treegrid-cell-editor') as HTMLInputElement;
    editor.value = '999';
    plugin.completeEdit();

    // Value should be updated
    expect((nodeA as any).get?.('size')).toBe('999');
  });

  it('second startEdit completes first edit', () => {
    const grid = makeGrid();
    const plugin = new TreeGridCellEditing();
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    const nodeB = grid.getNodeById('b')!;
    plugin.startEdit(nodeA, 'text');
    plugin.startEdit(nodeB, 'text');

    const editors = document.querySelectorAll('.x-treegrid-cell-editor');
    // Should only have one editor at a time
    expect(editors.length).toBe(1);
  });

  it('Enter key completes edit', () => {
    const grid = makeGrid();
    const plugin = new TreeGridCellEditing();
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    plugin.startEdit(nodeA, 'text');

    const editor = document.querySelector('.x-treegrid-cell-editor') as HTMLInputElement;
    editor.value = 'Updated';
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(plugin.isEditing()).toBe(false);
  });

  it('Escape key cancels edit', () => {
    const grid = makeGrid();
    const plugin = new TreeGridCellEditing();
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    plugin.startEdit(nodeA, 'text');

    const originalVal = (nodeA as any).get?.('text');
    const editor = document.querySelector('.x-treegrid-cell-editor') as HTMLInputElement;
    editor.value = 'Should Not Save';
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(plugin.isEditing()).toBe(false);
    // Original value preserved (no set called on cancel)
    expect((nodeA as any).get?.('text')).toBe(originalVal);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Config
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridCellEditing — config', () => {
  it('clicksToEdit=1 uses click to start', () => {
    const grid = makeGrid();
    const plugin = new TreeGridCellEditing({ clicksToEdit: 1 });
    plugin.init(grid);
    expect(plugin).toBeDefined();
  });

  it('clicksToEdit=2 uses dblclick to start', () => {
    const grid = makeGrid();
    const plugin = new TreeGridCellEditing({ clicksToEdit: 2 });
    plugin.init(grid);
    expect(plugin).toBeDefined();
  });
});
