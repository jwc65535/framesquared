/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TreeGridRowEditing } from '../../src/treegrid/TreeGridRowEditing.js';
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
        id: 'root',
        text: 'Root',
        expanded: true,
        children: [
          { id: 'a', text: 'Node A', status: 'active', hours: 10, leaf: true },
          { id: 'b', text: 'Node B', status: 'done', hours: 20, leaf: true },
        ],
      },
    }),
    columns: [
      { dataIndex: 'text', text: 'Name' },
      { dataIndex: 'status', text: 'Status' },
      { dataIndex: 'hours', text: 'Hours' },
    ],
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

describe('TreeGridRowEditing — construction', () => {
  it('creates with defaults', () => {
    const plugin = new TreeGridRowEditing();
    expect(plugin).toBeDefined();
  });

  it('init does not throw', () => {
    const grid = makeGrid();
    const plugin = new TreeGridRowEditing();
    expect(() => plugin.init(grid)).not.toThrow();
  });

  it('destroy does not throw', () => {
    const grid = makeGrid();
    const plugin = new TreeGridRowEditing();
    plugin.init(grid);
    expect(() => plugin.destroy()).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Edit lifecycle
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridRowEditing — edit lifecycle', () => {
  it('startEdit inserts a row editor', () => {
    const grid = makeGrid();
    const plugin = new TreeGridRowEditing();
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    plugin.startEdit(nodeA);

    const editorRow = document.querySelector('.x-treegrid-row-editor');
    expect(editorRow).not.toBeNull();
  });

  it('editor contains fields for each column', () => {
    const grid = makeGrid();
    const plugin = new TreeGridRowEditing();
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    plugin.startEdit(nodeA);

    const inputs = document.querySelectorAll('.x-row-editor-field');
    expect(inputs.length).toBe(3); // text, status, hours
  });

  it('editor fields have correct initial values', () => {
    const grid = makeGrid();
    const plugin = new TreeGridRowEditing();
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    plugin.startEdit(nodeA);

    const textInput = document.querySelector('.x-row-editor-field-text') as HTMLInputElement;
    expect(textInput?.value).toBe('Node A');
  });

  it('isEditing returns true during edit', () => {
    const grid = makeGrid();
    const plugin = new TreeGridRowEditing();
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    expect(plugin.isEditing()).toBe(false);
    plugin.startEdit(nodeA);
    expect(plugin.isEditing()).toBe(true);
  });

  it('completeEdit saves all field values', () => {
    const grid = makeGrid();
    const plugin = new TreeGridRowEditing();
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    plugin.startEdit(nodeA);

    const hoursInput = document.querySelector('.x-row-editor-field-hours') as HTMLInputElement;
    hoursInput.value = '99';
    plugin.completeEdit();

    expect((nodeA as any).get?.('hours')).toBe('99');
    expect(plugin.isEditing()).toBe(false);
  });

  it('cancelEdit does not save values', () => {
    const grid = makeGrid();
    const plugin = new TreeGridRowEditing();
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    plugin.startEdit(nodeA);

    const hoursInput = document.querySelector('.x-row-editor-field-hours') as HTMLInputElement;
    hoursInput.value = '99';
    plugin.cancelEdit();

    expect((nodeA as any).get?.('hours')).not.toBe('99');
    expect(plugin.isEditing()).toBe(false);
  });

  it('editor has save and cancel buttons', () => {
    const grid = makeGrid();
    const plugin = new TreeGridRowEditing();
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    plugin.startEdit(nodeA);

    const saveBtn = document.querySelector('.x-row-editor-save');
    const cancelBtn = document.querySelector('.x-row-editor-cancel');
    expect(saveBtn).not.toBeNull();
    expect(cancelBtn).not.toBeNull();
  });

  it('clicking save button completes edit', () => {
    const grid = makeGrid();
    const plugin = new TreeGridRowEditing();
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    plugin.startEdit(nodeA);

    const saveBtn = document.querySelector('.x-row-editor-save') as HTMLButtonElement;
    saveBtn.click();
    expect(plugin.isEditing()).toBe(false);
  });

  it('clicking cancel button cancels edit', () => {
    const grid = makeGrid();
    const plugin = new TreeGridRowEditing();
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    plugin.startEdit(nodeA);

    const cancelBtn = document.querySelector('.x-row-editor-cancel') as HTMLButtonElement;
    cancelBtn.click();
    expect(plugin.isEditing()).toBe(false);
    expect(document.querySelector('.x-treegrid-row-editor')).toBeNull();
  });

  it('starting second edit cancels first', () => {
    const grid = makeGrid();
    const plugin = new TreeGridRowEditing();
    plugin.init(grid);

    const nodeA = grid.getNodeById('a')!;
    const nodeB = grid.getNodeById('b')!;
    plugin.startEdit(nodeA);
    plugin.startEdit(nodeB);

    const editors = document.querySelectorAll('.x-treegrid-row-editor');
    expect(editors.length).toBe(1);
  });
});
