import { describe, it, expect, beforeEach } from 'vitest';
import { TreeGridColumn, Column } from '../../src/treegrid/TreeGridColumn.js';
import { TreeStore, TreeModel } from '@framesquared/data';
import type { NodeInterface } from '@framesquared/data';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeStore() {
  return new TreeStore({
    model: TreeModel,
    root: {
      id: 'root',
      text: 'Root',
      expanded: true,
      children: [
        {
          id: 'folder1',
          text: 'Folder 1',
          expanded: true,
          children: [
            { id: 'leaf1', text: 'Leaf 1', leaf: true },
            { id: 'leaf2', text: 'Leaf 2', leaf: true },
          ],
        },
        { id: 'folder2', text: 'Folder 2', children: [] },
      ],
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Column (plain)
// ═══════════════════════════════════════════════════════════════════════════

describe('Column', () => {
  it('creates with defaults', () => {
    const col = new Column({ dataIndex: 'name' });
    expect(col.dataIndex).toBe('name');
    expect(col.text).toBe('name');
    expect(col.width).toBe(100);
    expect(col.hidden).toBe(false);
  });

  it('uses provided text', () => {
    const col = new Column({ dataIndex: 'name', text: 'Full Name' });
    expect(col.text).toBe('Full Name');
  });

  it('isColumn is true', () => {
    const col = new Column({ dataIndex: 'x' });
    expect(col.isColumn).toBe(true);
  });

  it('renderValue returns field value as string', () => {
    const store = makeStore();
    const node = store.getNodeById('leaf1') as NodeInterface;
    const col = new Column({ dataIndex: 'text' });
    expect(col.renderValue(node)).toBe('Leaf 1');
  });

  it('renderValue uses custom renderer', () => {
    const store = makeStore();
    const node = store.getNodeById('leaf1') as NodeInterface;
    const col = new Column({
      dataIndex: 'text',
      renderer: (v) => `<b>${v}</b>`,
    });
    expect(col.renderValue(node)).toBe('<b>Leaf 1</b>');
  });

  it('renderValue returns empty string for missing field', () => {
    const store = makeStore();
    const node = store.getNodeById('leaf1') as NodeInterface;
    const col = new Column({ dataIndex: 'nonexistent' });
    expect(col.renderValue(node)).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TreeGridColumn — Construction
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridColumn construction', () => {
  it('isTreeGridColumn is true', () => {
    const col = new TreeGridColumn();
    expect(col.isTreeGridColumn).toBe(true);
  });

  it('defaults to text displayProperty', () => {
    const col = new TreeGridColumn();
    expect(col.displayProperty).toBe('text');
    expect(col.dataIndex).toBe('text');
  });

  it('uses provided dataIndex', () => {
    const col = new TreeGridColumn({ dataIndex: 'name' });
    expect(col.dataIndex).toBe('name');
  });

  it('default indentSize is 20', () => {
    const col = new TreeGridColumn();
    expect(col.indentSize).toBe(20);
  });

  it('custom indentSize', () => {
    const col = new TreeGridColumn({ indentSize: 30 });
    expect(col.indentSize).toBe(30);
  });

  it('showIcons defaults true', () => {
    const col = new TreeGridColumn();
    expect(col.showIcons).toBe(true);
  });

  it('showExpanders defaults true', () => {
    const col = new TreeGridColumn();
    expect(col.showExpanders).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TreeGridColumn — renderCell
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridColumn renderCell', () => {
  let store: TreeStore;
  let col: TreeGridColumn;

  beforeEach(() => {
    store = makeStore();
    col = new TreeGridColumn({ dataIndex: 'text' });
  });

  it('renders folder node with expander and folder icon', () => {
    const node = store.getNodeById('folder1') as NodeInterface;
    const html = col.renderCell(node, false, false);
    expect(html).toContain('x-treegrid-expander');
    expect(html).toContain('x-treegrid-icon-folder');
    expect(html).toContain('Folder 1');
  });

  it('renders leaf node with leaf expander placeholder and leaf icon', () => {
    const node = store.getNodeById('leaf1') as NodeInterface;
    const html = col.renderCell(node, false, false);
    expect(html).toContain('x-treegrid-expander-leaf');
    expect(html).toContain('x-treegrid-icon-leaf');
    expect(html).toContain('Leaf 1');
  });

  it('depth 1 node has 20px padding', () => {
    const node = store.getNodeById('folder1') as NodeInterface;
    expect(node.depth).toBe(1);
    const html = col.renderCell(node, false, false);
    expect(html).toContain('padding-left: 20px');
  });

  it('depth 2 node has 40px padding', () => {
    const node = store.getNodeById('leaf1') as NodeInterface;
    expect(node.depth).toBe(2);
    const html = col.renderCell(node, false, false);
    expect(html).toContain('padding-left: 40px');
  });

  it('expanded folder uses folder-open icon', () => {
    const node = store.getNodeById('folder1') as NodeInterface;
    store.expandNode(node);
    const html = col.renderCell(node, false, false);
    expect(html).toContain('x-treegrid-icon-folder-open');
  });

  it('expanded folder expander has expanded class', () => {
    const node = store.getNodeById('folder1') as NodeInterface;
    store.expandNode(node);
    const html = col.renderCell(node, false, false);
    expect(html).toContain('x-treegrid-expander-expanded');
  });

  it('collapsed folder expander has collapsed class', () => {
    const node = store.getNodeById('folder2') as NodeInterface;
    const html = col.renderCell(node, false, false);
    expect(html).toContain('x-treegrid-expander-collapsed');
  });

  it('renders checkbox when checkable=true', () => {
    const node = store.getNodeById('leaf1') as NodeInterface;
    const html = col.renderCell(node, true, false);
    expect(html).toContain('x-treegrid-checkbox');
    expect(html).toContain('role="checkbox"');
  });

  it('no checkbox when checkable=false', () => {
    const node = store.getNodeById('leaf1') as NodeInterface;
    const html = col.renderCell(node, false, false);
    expect(html).not.toContain('x-treegrid-checkbox');
  });

  it('checked node has checked class and aria-checked=true', () => {
    const node = store.getNodeById('leaf1') as NodeInterface;
    (node as any).$checked = true;
    const html = col.renderCell(node, true, false);
    expect(html).toContain('x-treegrid-checkbox-checked');
    expect(html).toContain('aria-checked="true"');
  });

  it('indeterminate node has indeterminate class and aria-checked=mixed', () => {
    const node = store.getNodeById('folder1') as NodeInterface;
    (node as any).$checked = 'indeterminate';
    const html = col.renderCell(node, true, false);
    expect(html).toContain('x-treegrid-checkbox-indeterminate');
    expect(html).toContain('aria-checked="mixed"');
  });

  it('custom iconCls used instead of default', () => {
    const store2 = new TreeStore({
      model: TreeModel,
      root: {
        id: 'r',
        text: 'R',
        expanded: true,
        children: [{ id: 'n1', text: 'N1', leaf: true, iconCls: 'my-custom-icon' }],
      },
    });
    const node = store2.getNodeById('n1') as NodeInterface;
    const html = col.renderCell(node, false, false);
    expect(html).toContain('my-custom-icon');
    expect(html).not.toContain('x-treegrid-icon-leaf');
  });

  it('custom icon URL renders img element', () => {
    const store2 = new TreeStore({
      model: TreeModel,
      root: {
        id: 'r',
        text: 'R',
        expanded: true,
        children: [{ id: 'n1', text: 'N1', leaf: true, icon: '/img/file.png' }],
      },
    });
    const node = store2.getNodeById('n1') as NodeInterface;
    const html = col.renderCell(node, false, false);
    expect(html).toContain('<img');
    expect(html).toContain('/img/file.png');
  });

  it('showIcons=false omits icon', () => {
    const col2 = new TreeGridColumn({ dataIndex: 'text', showIcons: false });
    const node = store.getNodeById('leaf1') as NodeInterface;
    const html = col2.renderCell(node, false, false);
    expect(html).not.toContain('x-treegrid-icon');
  });

  it('showExpanders=false omits expander', () => {
    const col2 = new TreeGridColumn({ dataIndex: 'text', showExpanders: false });
    const node = store.getNodeById('folder1') as NodeInterface;
    const html = col2.renderCell(node, false, false);
    expect(html).not.toContain('x-treegrid-expander');
  });

  it('custom innerRenderer used for text', () => {
    const col2 = new TreeGridColumn({
      dataIndex: 'text',
      innerRenderer: (v) => `<em>${v}</em>`,
    });
    const node = store.getNodeById('leaf1') as NodeInterface;
    const html = col2.renderCell(node, false, false);
    expect(html).toContain('<em>Leaf 1</em>');
  });

  it('always wraps text in x-treegrid-node-text span', () => {
    const node = store.getNodeById('leaf1') as NodeInterface;
    const html = col.renderCell(node, false, false);
    expect(html).toContain('x-treegrid-node-text');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TreeGridColumn — Elbow computation
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridColumn computeElbows', () => {
  it('single child of root → end (last and only child)', () => {
    const store2 = new TreeStore({
      model: TreeModel,
      root: {
        id: 'r',
        text: 'R',
        expanded: true,
        children: [{ id: 'n1', text: 'N1', leaf: true }],
      },
    });
    const col = new TreeGridColumn();
    const node = store2.getNodeById('n1') as NodeInterface;
    const elbows = col.computeElbows(node);
    expect(elbows).toHaveLength(1);
    expect(elbows[0]).toBe('end'); // last sibling, leaf
  });

  it('first of two children → tee (not last)', () => {
    const store2 = makeStore();
    const col = new TreeGridColumn();
    const node = store2.getNodeById('folder1') as NodeInterface;
    const elbows = col.computeElbows(node);
    expect(elbows[0]).toBe('tee-plus'); // not last, has children
  });

  it('last of two children → end-plus (last, has children)', () => {
    const store2 = makeStore();
    const col = new TreeGridColumn();
    const node = store2.getNodeById('folder2') as NodeInterface;
    const elbows = col.computeElbows(node);
    expect(elbows[0]).toBe('end-plus'); // last, has children (even empty)
  });

  it('deep node ancestor was last → empty line at ancestor depth', () => {
    const store2 = makeStore();
    const col = new TreeGridColumn();
    // leaf1 is child of folder1 (which is NOT last among root's children)
    const node = store2.getNodeById('leaf1') as NodeInterface;
    const elbows = col.computeElbows(node);
    // depth 2: [folder1-level elbow, leaf1-level elbow]
    expect(elbows).toHaveLength(2);
    // folder1 is not last → 'line' at ancestor depth
    expect(elbows[0]).toBe('line');
    // leaf1 is not the last child of folder1 → 'tee' (leaf, not last)
    expect(elbows[1]).toBe('tee');
  });

  it('lines=true renders elbow spans', () => {
    const store2 = makeStore();
    const col = new TreeGridColumn({ dataIndex: 'text' });
    const node = store2.getNodeById('leaf1') as NodeInterface;
    const html = col.renderCell(node, false, true);
    expect(html).toContain('x-treegrid-elbow');
    expect(html).not.toContain('padding-left:');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TreeGridColumn — Custom icons
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeGridColumn custom icons', () => {
  it('custom defaultFolderIcon used', () => {
    const col = new TreeGridColumn({
      dataIndex: 'text',
      defaultFolderIcon: 'my-folder',
    });
    const store = makeStore();
    const node = store.getNodeById('folder2') as NodeInterface;
    const html = col.renderCell(node, false, false);
    expect(html).toContain('my-folder');
  });

  it('custom defaultLeafIcon used', () => {
    const col = new TreeGridColumn({
      dataIndex: 'text',
      defaultLeafIcon: 'my-leaf',
    });
    const store = makeStore();
    const node = store.getNodeById('leaf1') as NodeInterface;
    const html = col.renderCell(node, false, false);
    expect(html).toContain('my-leaf');
  });
});
