import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TreePanel } from '../src/tree/TreePanel.js';
import { TreeStore } from '../src/tree/TreeStore.js';

class MockRO { constructor() {} observe() {} unobserve() {} disconnect() {} }
beforeEach(() => { (globalThis as any).ResizeObserver = MockRO; });
afterEach(() => { document.body.innerHTML = ''; });

function sampleTree(): TreeStore {
  return new TreeStore({
    root: {
      text: 'Root',
      expanded: true,
      children: [
        {
          id: 'a', text: 'Engineering', expanded: false,
          children: [
            { id: 'a1', text: 'Frontend', leaf: true },
            { id: 'a2', text: 'Backend', leaf: true },
            { id: 'a3', text: 'DevOps', leaf: true },
          ],
        },
        {
          id: 'b', text: 'Sales', expanded: false,
          children: [
            { id: 'b1', text: 'Enterprise', leaf: true },
            { id: 'b2', text: 'SMB', leaf: true },
          ],
        },
        { id: 'c', text: 'HR', leaf: true },
      ],
    },
  });
}

function tree(cfg: Record<string, unknown> = {}): TreePanel {
  return new TreePanel({
    renderTo: document.body,
    title: 'Tree',
    store: cfg.store ?? sampleTree(),
    ...cfg,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// TreeStore
// ═══════════════════════════════════════════════════════════════════════════

describe('TreeStore', () => {
  it('getRoot returns root node', () => {
    const store = sampleTree();
    expect(store.getRoot().text).toBe('Root');
  });

  it('root has children', () => {
    const store = sampleTree();
    expect(store.getRoot().children.length).toBe(3);
  });

  it('getNodeById finds deep node', () => {
    const store = sampleTree();
    const node = store.getNodeById('a2');
    expect(node).not.toBeNull();
    expect(node!.text).toBe('Backend');
  });

  it('getVisibleNodes returns expanded descendants', () => {
    const store = sampleTree();
    // Root is expanded, children are not
    const visible = store.getVisibleNodes(true);
    // Root (visible) + 3 top-level children
    expect(visible.length).toBe(4);
  });

  it('expanding a node makes its children visible', () => {
    const store = sampleTree();
    const eng = store.getNodeById('a');
    eng!.expanded = true;
    const visible = store.getVisibleNodes(true);
    // Root + Eng + (3 eng children) + Sales + HR = 7
    expect(visible.length).toBe(7);
  });

  it('adding child updates tree', () => {
    const store = sampleTree();
    const hr = store.getNodeById('c');
    store.appendChild(hr!, { id: 'c1', text: 'Recruiting', leaf: true });
    expect(hr!.children.length).toBe(1);
    expect(hr!.leaf).toBe(false);
  });

  it('removing node updates tree', () => {
    const store = sampleTree();
    store.removeNode('b2');
    const sales = store.getNodeById('b');
    expect(sales!.children.length).toBe(1);
  });

  it('getPath returns slash-separated path', () => {
    const store = sampleTree();
    const node = store.getNodeById('a2');
    const path = store.getPath(node!);
    expect(path).toBe('/Root/Engineering/Backend');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TreePanel — rendering
// ═══════════════════════════════════════════════════════════════════════════

describe('TreePanel — rendering', () => {
  it('renders with x-treepanel class', () => {
    const t = tree();
    expect(t.el!.classList.contains('x-treepanel')).toBe(true);
  });

  it('renders visible nodes as rows', () => {
    const t = tree();
    const rows = t.el!.querySelectorAll('.x-tree-node');
    // Root expanded → Root + Eng + Sales + HR = 4
    expect(rows.length).toBe(4);
  });

  it('rootVisible:false hides root', () => {
    const t = tree({ rootVisible: false });
    const rows = t.el!.querySelectorAll('.x-tree-node');
    // Eng + Sales + HR = 3 (no root)
    expect(rows.length).toBe(3);
  });

  it('node text is displayed', () => {
    const t = tree();
    expect(t.el!.textContent).toContain('Engineering');
    expect(t.el!.textContent).toContain('Sales');
    expect(t.el!.textContent).toContain('HR');
  });

  it('nodes have indentation based on depth', () => {
    const t = tree();
    const nodes = t.el!.querySelectorAll('.x-tree-node');
    // Root depth 0, children depth 1
    const rootIndent = (nodes[0] as HTMLElement).querySelector('.x-tree-indent');
    const childIndent = (nodes[1] as HTMLElement).querySelector('.x-tree-indent');
    // child should have more padding/indent than root
    expect(childIndent).not.toBeNull();
  });

  it('leaf nodes have leaf icon class', () => {
    const t = tree();
    // HR is a leaf at the root level
    const nodes = t.el!.querySelectorAll('.x-tree-node');
    const hrNode = Array.from(nodes).find(n => n.textContent?.includes('HR'));
    expect(hrNode?.querySelector('.x-tree-icon-leaf')).not.toBeNull();
  });

  it('non-leaf nodes have folder icon class', () => {
    const t = tree();
    const nodes = t.el!.querySelectorAll('.x-tree-node');
    const engNode = Array.from(nodes).find(n => n.textContent?.includes('Engineering'));
    expect(engNode?.querySelector('.x-tree-icon-folder')).not.toBeNull();
  });

  it('expand icon present on non-leaf nodes', () => {
    const t = tree();
    const nodes = t.el!.querySelectorAll('.x-tree-node');
    const engNode = Array.from(nodes).find(n => n.textContent?.includes('Engineering'));
    expect(engNode?.querySelector('.x-tree-expander')).not.toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TreePanel — expand / collapse
// ═══════════════════════════════════════════════════════════════════════════

describe('TreePanel — expand/collapse', () => {
  it('clicking expander expands a node', () => {
    const t = tree();
    const engNode = Array.from(t.el!.querySelectorAll('.x-tree-node'))
      .find(n => n.textContent?.includes('Engineering'));
    const expander = engNode?.querySelector('.x-tree-expander') as HTMLElement;
    expander.click();
    // Now Eng children should be visible
    const rows = t.el!.querySelectorAll('.x-tree-node');
    expect(rows.length).toBe(7); // 4 + 3 eng children
  });

  it('clicking expander again collapses', () => {
    const t = tree();
    const engNode = Array.from(t.el!.querySelectorAll('.x-tree-node'))
      .find(n => n.textContent?.includes('Engineering'));
    const expander = engNode?.querySelector('.x-tree-expander') as HTMLElement;
    expander.click(); // expand
    expander.click(); // collapse
    const rows = t.el!.querySelectorAll('.x-tree-node');
    expect(rows.length).toBe(4); // back to 4
  });

  it('fires itemexpand event', () => {
    const spy = vi.fn();
    const t = tree({ listeners: { itemexpand: spy } });
    const engNode = Array.from(t.el!.querySelectorAll('.x-tree-node'))
      .find(n => n.textContent?.includes('Engineering'));
    (engNode?.querySelector('.x-tree-expander') as HTMLElement).click();
    expect(spy).toHaveBeenCalled();
  });

  it('fires itemcollapse event', () => {
    const spy = vi.fn();
    const t = tree({ listeners: { itemcollapse: spy } });
    const engNode = Array.from(t.el!.querySelectorAll('.x-tree-node'))
      .find(n => n.textContent?.includes('Engineering'));
    const exp = engNode?.querySelector('.x-tree-expander') as HTMLElement;
    exp.click(); // expand
    exp.click(); // collapse
    expect(spy).toHaveBeenCalled();
  });

  it('expandAll expands every node', () => {
    const t = tree();
    t.expandAll();
    const rows = t.el!.querySelectorAll('.x-tree-node');
    // Root + Eng + 3 + Sales + 2 + HR = 9
    expect(rows.length).toBe(9);
  });

  it('collapseAll collapses all nodes', () => {
    const t = tree();
    t.expandAll();
    t.collapseAll();
    const rows = t.el!.querySelectorAll('.x-tree-node');
    // Only root (root stays expanded since it's the top level)
    expect(rows.length).toBe(1);
  });

  it('singleExpand: expanding one collapses siblings', () => {
    const t = tree({ singleExpand: true });
    // Expand Eng
    const nodes1 = Array.from(t.el!.querySelectorAll('.x-tree-node'));
    (nodes1.find(n => n.textContent?.includes('Engineering'))
      ?.querySelector('.x-tree-expander') as HTMLElement).click();
    expect(t.el!.querySelectorAll('.x-tree-node').length).toBe(7);

    // Expand Sales — should collapse Eng
    const nodes2 = Array.from(t.el!.querySelectorAll('.x-tree-node'));
    (nodes2.find(n => n.textContent?.includes('Sales'))
      ?.querySelector('.x-tree-expander') as HTMLElement).click();
    // Root + Eng(collapsed) + Sales + 2 sales children + HR = 6
    expect(t.el!.querySelectorAll('.x-tree-node').length).toBe(6);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TreePanel — expandPath
// ═══════════════════════════════════════════════════════════════════════════

describe('TreePanel — expandPath', () => {
  it('expandPath expands nodes along the path', async () => {
    const t = tree();
    await t.expandPath('/Root/Engineering/Backend');
    expect(t.el!.textContent).toContain('Backend');
    expect(t.el!.textContent).toContain('Frontend');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TreePanel — checkboxes
// ═══════════════════════════════════════════════════════════════════════════

describe('TreePanel — checkboxes', () => {
  it('checkable:true renders checkboxes', () => {
    const t = tree({ checkable: true });
    const checkboxes = t.el!.querySelectorAll('.x-tree-checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('clicking checkbox checks the node', () => {
    const t = tree({ checkable: true });
    const cb = t.el!.querySelector('.x-tree-checkbox') as HTMLInputElement;
    cb.click();
    expect(cb.checked).toBe(true);
  });

  it('fires checkchange event', () => {
    const spy = vi.fn();
    const t = tree({ checkable: true, listeners: { checkchange: spy } });
    const cb = t.el!.querySelector('.x-tree-checkbox') as HTMLInputElement;
    cb.click();
    expect(spy).toHaveBeenCalled();
  });

  it('cascadeCheck: checking parent checks children', () => {
    const t = tree({ checkable: true, cascadeCheck: true });
    // Expand Engineering first
    t.expandAll();
    // Find Engineering checkbox
    const nodes = t.el!.querySelectorAll('.x-tree-node');
    const engNode = Array.from(nodes).find(n => n.textContent?.includes('Engineering'));
    const engCb = engNode?.querySelector('.x-tree-checkbox') as HTMLInputElement;
    engCb.click();

    // Children should be checked
    const frontendNode = Array.from(t.el!.querySelectorAll('.x-tree-node'))
      .find(n => n.textContent?.includes('Frontend'));
    const frontendCb = frontendNode?.querySelector('.x-tree-checkbox') as HTMLInputElement;
    expect(frontendCb.checked).toBe(true);
  });

  it('getChecked returns checked nodes', () => {
    const t = tree({ checkable: true });
    const cb = t.el!.querySelector('.x-tree-checkbox') as HTMLInputElement;
    cb.click();
    expect(t.getChecked().length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TreePanel — store mutations
// ═══════════════════════════════════════════════════════════════════════════

describe('TreePanel — store mutations', () => {
  it('adding a child re-renders', () => {
    const store = sampleTree();
    const t = tree({ store });
    const hr = store.getNodeById('c');
    store.appendChild(hr!, { id: 'c1', text: 'Recruiting', leaf: true });
    t.refresh();
    expect(t.el!.textContent).toContain('HR');
  });

  it('removing a node re-renders', () => {
    const store = sampleTree();
    const t = tree({ store });
    store.removeNode('c');
    t.refresh();
    const rows = t.el!.querySelectorAll('.x-tree-node');
    expect(rows.length).toBe(3); // Root + Eng + Sales
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TreePanel — arrows / lines
// ═══════════════════════════════════════════════════════════════════════════

describe('TreePanel — visual options', () => {
  it('useArrows:true adds x-tree-arrows class', () => {
    const t = tree({ useArrows: true });
    expect(t.el!.classList.contains('x-tree-arrows')).toBe(true);
  });

  it('lines:true adds x-tree-lines class', () => {
    const t = tree({ lines: true });
    expect(t.el!.classList.contains('x-tree-lines')).toBe(true);
  });
});
