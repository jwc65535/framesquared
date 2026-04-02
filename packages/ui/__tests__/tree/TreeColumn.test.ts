import { describe, it, expect, afterEach } from 'vitest';
import { TreeColumn } from '../../src/tree/TreeColumn.js';
import { TreeStore, TreeModel} from '@framesquared/data';
import type { NodeInterface } from '@framesquared/data';

afterEach(() => {
  document.body.innerHTML = '';
});

function makeNode(data: Record<string, unknown>, depth = 0): NodeInterface {
  const model = TreeModel.create(data);
  (model as any).depth = depth;
  return model as any as NodeInterface;
}

// ═══════════════════════════════════════════════════════════════════════════
// TreeColumn defaults
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeColumn defaults', () => {
  it('default dataIndex is "text"', () => {
    const col = new TreeColumn();
    expect(col.dataIndex).toBe('text');
  });

  it('default indentSize is 20', () => {
    const col = new TreeColumn();
    expect(col.indentSize).toBe(20);
  });

  it('default header is empty string', () => {
    const col = new TreeColumn();
    expect(col.header).toBe('');
  });

  it('default width is 200', () => {
    const col = new TreeColumn();
    expect(col.width).toBe(200);
  });

  it('accepts custom config', () => {
    const col = new TreeColumn({ dataIndex: 'name', indentSize: 16, header: 'Name', width: 300 });
    expect(col.dataIndex).toBe('name');
    expect(col.indentSize).toBe(16);
    expect(col.header).toBe('Name');
    expect(col.width).toBe(300);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// renderCell
// ═══════════════════════════════════════════════════════════════════════════

describe('renderCell', () => {
  it('renders node text content', () => {
    const col = new TreeColumn();
    const node = makeNode({ id: '1', text: 'Hello World' });
    const html = col.renderCell(node);
    expect(html).toContain('Hello World');
  });

  it('uses depth * indentSize for padding', () => {
    const col = new TreeColumn({ indentSize: 20 });
    const node = makeNode({ id: '1', text: 'A', leaf: true }, 2);
    const html = col.renderCell(node);
    expect(html).toContain('padding-left: 40px');
  });

  it('uses depth 0 for root-level nodes', () => {
    const col = new TreeColumn({ indentSize: 20 });
    const node = makeNode({ id: '1', text: 'A', leaf: true }, 0);
    const html = col.renderCell(node);
    expect(html).toContain('padding-left: 0px');
  });

  it('leaf node has expander-placeholder, not expander', () => {
    const col = new TreeColumn();
    const node = makeNode({ id: '1', text: 'Leaf', leaf: true });
    const html = col.renderCell(node);
    expect(html).toContain('x-tree-expander-placeholder');
    expect(html).not.toContain('x-tree-expander"');
  });

  it('non-leaf node has expander span', () => {
    const store = new TreeStore({
      model: TreeModel,
      root: {
        id: 'root',
        text: 'Root',
        expanded: true,
        children: [{ id: 'a', text: 'A', children: [{ id: 'a1', text: 'A1', leaf: true }] }],
      },
    });
    const nodeA = store.getNodeById('a') as NodeInterface;
    const col = new TreeColumn();
    const html = col.renderCell(nodeA);
    expect(html).toContain('x-tree-expander');
    expect(html).not.toContain('x-tree-expander-placeholder');
  });

  it('expanded non-leaf shows collapse class', () => {
    const store = new TreeStore({
      model: TreeModel,
      root: {
        id: 'root',
        text: 'Root',
        expanded: true,
        children: [
          { id: 'a', text: 'A', expanded: true, children: [{ id: 'a1', text: 'A1', leaf: true }] },
        ],
      },
    });
    const nodeA = store.getNodeById('a') as NodeInterface;
    const col = new TreeColumn();
    const html = col.renderCell(nodeA);
    expect(html).toContain('x-tree-expander-collapse');
  });

  it('collapsed non-leaf shows expand class', () => {
    const store = new TreeStore({
      model: TreeModel,
      root: {
        id: 'root',
        text: 'Root',
        expanded: true,
        children: [{ id: 'a', text: 'A', children: [{ id: 'a1', text: 'A1', leaf: true }] }],
      },
    });
    const nodeA = store.getNodeById('a') as NodeInterface;
    const col = new TreeColumn();
    const html = col.renderCell(nodeA);
    expect(html).toContain('x-tree-expander-expand');
  });

  it('custom iconCls is applied to icon', () => {
    const col = new TreeColumn();
    const node = makeNode({ id: '1', text: 'A', iconCls: 'fa-folder', leaf: true });
    const html = col.renderCell(node);
    expect(html).toContain('fa-folder');
  });

  it('custom icon URL uses img tag', () => {
    const col = new TreeColumn();
    const node = makeNode({ id: '1', text: 'A', icon: 'path/to/icon.png', leaf: true });
    const html = col.renderCell(node);
    expect(html).toContain('<img');
    expect(html).toContain('path/to/icon.png');
  });

  it('checkable mode adds checkbox element', () => {
    const col = new TreeColumn();
    const node = makeNode({ id: '1', text: 'A', leaf: true });
    const html = col.renderCell(node, true);
    expect(html).toContain('x-tree-checkbox');
  });

  it('non-checkable mode does not add checkbox', () => {
    const col = new TreeColumn();
    const node = makeNode({ id: '1', text: 'A', leaf: true });
    const html = col.renderCell(node, false);
    expect(html).not.toContain('x-tree-checkbox');
  });

  it('leaf node uses x-tree-icon-leaf class by default', () => {
    const col = new TreeColumn();
    const node = makeNode({ id: '1', text: 'A', leaf: true });
    const html = col.renderCell(node);
    expect(html).toContain('x-tree-icon-leaf');
  });

  it('expanded folder uses x-tree-icon-open class', () => {
    const store = new TreeStore({
      model: TreeModel,
      root: {
        id: 'root',
        text: 'Root',
        expanded: true,
        children: [
          { id: 'a', text: 'A', expanded: true, children: [{ id: 'a1', text: 'A1', leaf: true }] },
        ],
      },
    });
    const nodeA = store.getNodeById('a') as NodeInterface;
    const col = new TreeColumn();
    const html = col.renderCell(nodeA);
    expect(html).toContain('x-tree-icon-open');
  });
});
