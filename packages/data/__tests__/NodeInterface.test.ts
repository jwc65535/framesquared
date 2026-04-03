import { describe, it, expect } from 'vitest';
import { Model } from '../src/Model.js';
import { FieldType } from '../src/field/Field.js';
import { applyNodeInterface } from '../src/mixin/NodeInterface.js';
import type { NodeInterface } from '../src/mixin/NodeInterface.js';

// ---------------------------------------------------------------------------
// Test model
// ---------------------------------------------------------------------------

class TreeNode extends Model {
  static override $className = 'NodeInterface.test.Node';
  static override fields = [
    { name: 'id', type: FieldType.INT },
    { name: 'text', type: FieldType.STRING },
    { name: 'leaf', type: FieldType.BOOLEAN, defaultValue: false },
  ];
  static override idProperty = 'id';
}

function makeNode(id: number, text: string, leaf = false): Model & NodeInterface {
  const n = TreeNode.create({ id, text, leaf }) as Model & NodeInterface;
  applyNodeInterface(n);
  return n;
}

// ---------------------------------------------------------------------------
// eachChild
// ---------------------------------------------------------------------------

describe('NodeInterface.eachChild', () => {
  it('iterates direct children in order', () => {
    const p = makeNode(1, 'P');
    const c1 = makeNode(2, 'C1');
    const c2 = makeNode(3, 'C2');
    p.appendChild(c1);
    p.appendChild(c2);

    const visited: string[] = [];
    p.eachChild((n) => {
      visited.push(n.get('text') as string);
    });
    expect(visited).toEqual(['C1', 'C2']);
  });

  it('stops iteration when fn returns false', () => {
    const p = makeNode(1, 'P');
    const c1 = makeNode(2, 'C1');
    const c2 = makeNode(3, 'C2');
    const c3 = makeNode(4, 'C3');
    p.appendChild(c1);
    p.appendChild(c2);
    p.appendChild(c3);

    const visited: string[] = [];
    p.eachChild((n) => {
      visited.push(n.get('text') as string);
      if (n.get('text') === 'C2') return false;
    });
    expect(visited).toEqual(['C1', 'C2']);
  });

  it('passes index to fn', () => {
    const p = makeNode(1, 'P');
    const c1 = makeNode(2, 'A');
    const c2 = makeNode(3, 'B');
    p.appendChild(c1);
    p.appendChild(c2);

    const indices: number[] = [];
    p.eachChild((_n, i) => {
      indices.push(i);
    });
    expect(indices).toEqual([0, 1]);
  });

  it('does nothing on leaf node', () => {
    const leaf = makeNode(1, 'L', true);
    const visited: string[] = [];
    leaf.eachChild(() => {
      visited.push('x');
    });
    expect(visited).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// indexOf
// ---------------------------------------------------------------------------

describe('NodeInterface.indexOf', () => {
  it('returns correct index for a child', () => {
    const p = makeNode(1, 'P');
    const c1 = makeNode(2, 'C1');
    const c2 = makeNode(3, 'C2');
    p.appendChild(c1);
    p.appendChild(c2);
    expect(p.indexOf(c1)).toBe(0);
    expect(p.indexOf(c2)).toBe(1);
  });

  it('returns -1 for non-child', () => {
    const p = makeNode(1, 'P');
    const other = makeNode(99, 'X');
    applyNodeInterface(other);
    expect(p.indexOf(other)).toBe(-1);
  });
});

// ---------------------------------------------------------------------------
// getChildAt
// ---------------------------------------------------------------------------

describe('NodeInterface.getChildAt', () => {
  it('returns child at given index', () => {
    const p = makeNode(1, 'P');
    const c1 = makeNode(2, 'C1');
    const c2 = makeNode(3, 'C2');
    p.appendChild(c1);
    p.appendChild(c2);
    expect(p.getChildAt(0)).toBe(c1);
    expect(p.getChildAt(1)).toBe(c2);
  });

  it('returns undefined for out-of-range index', () => {
    const p = makeNode(1, 'P');
    expect(p.getChildAt(0)).toBeUndefined();
    expect(p.getChildAt(-1)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// childCount
// ---------------------------------------------------------------------------

describe('NodeInterface.childCount', () => {
  it('returns 0 for leaf', () => {
    const leaf = makeNode(1, 'L');
    expect(leaf.childCount()).toBe(0);
  });

  it('returns number of direct children', () => {
    const p = makeNode(1, 'P');
    p.appendChild(makeNode(2, 'C1'));
    p.appendChild(makeNode(3, 'C2'));
    expect(p.childCount()).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// hasChildNodes
// ---------------------------------------------------------------------------

describe('NodeInterface.hasChildNodes', () => {
  it('returns false for node with no children', () => {
    const n = makeNode(1, 'N');
    expect(n.hasChildNodes()).toBe(false);
  });

  it('returns true once a child is added', () => {
    const p = makeNode(1, 'P');
    p.appendChild(makeNode(2, 'C'));
    expect(p.hasChildNodes()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getChildren
// ---------------------------------------------------------------------------

describe('NodeInterface.getChildren', () => {
  it('returns a copy of childNodes (shallow by default)', () => {
    const p = makeNode(1, 'P');
    const c1 = makeNode(2, 'C1');
    const c2 = makeNode(3, 'C2');
    p.appendChild(c1);
    p.appendChild(c2);

    const children = p.getChildren();
    expect(children).toHaveLength(2);
    expect(children[0]).toBe(c1);
    expect(children[1]).toBe(c2);

    // Ensure it's a copy — mutating should not affect childNodes
    children.splice(0, 1);
    expect(p.childNodes).toHaveLength(2);
  });

  it('returns all descendants when deep=true', () => {
    const root = makeNode(1, 'R');
    const c1 = makeNode(2, 'C1');
    const c2 = makeNode(3, 'C2');
    const gc = makeNode(4, 'GC');
    root.appendChild(c1);
    root.appendChild(c2);
    c1.appendChild(gc);

    const all = root.getChildren(true);
    expect(all).toHaveLength(3); // c1, gc, c2
    const texts = all.map((n) => n.get('text'));
    expect(texts).toEqual(['C1', 'GC', 'C2']); // depth-first
  });

  it('returns empty array for leaf node', () => {
    const leaf = makeNode(1, 'L');
    expect(leaf.getChildren()).toEqual([]);
    expect(leaf.getChildren(true)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// findChildBy
// ---------------------------------------------------------------------------

describe('NodeInterface.findChildBy', () => {
  it('finds direct child matching predicate', () => {
    const p = makeNode(1, 'P');
    const c1 = makeNode(2, 'Alpha');
    const c2 = makeNode(3, 'Beta');
    p.appendChild(c1);
    p.appendChild(c2);

    const found = p.findChildBy((n) => n.get('text') === 'Beta');
    expect(found).toBe(c2);
  });

  it('returns undefined when no match', () => {
    const p = makeNode(1, 'P');
    p.appendChild(makeNode(2, 'X'));

    expect(p.findChildBy((n) => n.get('text') === 'Z')).toBeUndefined();
  });

  it('does not search deep by default', () => {
    const p = makeNode(1, 'P');
    const c = makeNode(2, 'C');
    const gc = makeNode(3, 'Target');
    p.appendChild(c);
    c.appendChild(gc);

    expect(p.findChildBy((n) => n.get('text') === 'Target')).toBeUndefined();
  });

  it('searches deep when deep=true', () => {
    const p = makeNode(1, 'P');
    const c = makeNode(2, 'C');
    const gc = makeNode(3, 'Target');
    p.appendChild(c);
    c.appendChild(gc);

    const found = p.findChildBy((n) => n.get('text') === 'Target', true);
    expect(found).toBe(gc);
  });
});

// ---------------------------------------------------------------------------
// removeAll
// ---------------------------------------------------------------------------

describe('NodeInterface.removeAll', () => {
  it('removes all children and returns them', () => {
    const p = makeNode(1, 'P');
    const c1 = makeNode(2, 'C1');
    const c2 = makeNode(3, 'C2');
    p.appendChild(c1);
    p.appendChild(c2);

    const removed = p.removeAll();
    expect(removed).toHaveLength(2);
    expect(removed).toContain(c1);
    expect(removed).toContain(c2);
    expect(p.childNodes).toHaveLength(0);
    expect(p.firstChild).toBeNull();
    expect(p.lastChild).toBeNull();
  });

  it('detaches children from parent', () => {
    const p = makeNode(1, 'P');
    const c = makeNode(2, 'C');
    p.appendChild(c);

    p.removeAll();
    expect(c.parentNode).toBeNull();
  });

  it('returns empty array when no children', () => {
    const n = makeNode(1, 'N');
    expect(n.removeAll()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// copy
// ---------------------------------------------------------------------------

describe('NodeInterface.copy', () => {
  it('creates a detached copy with no parentNode', () => {
    const root = makeNode(1, 'R');
    const c = makeNode(2, 'C');
    root.appendChild(c);

    const copy = c.copy(false);
    expect(copy.parentNode).toBeNull();
  });

  it('shallow copy has no children', () => {
    const p = makeNode(1, 'P');
    p.appendChild(makeNode(2, 'C'));

    const copy = p.copy(false);
    expect(copy.childNodes).toHaveLength(0);
  });

  it('deep copy includes all descendants', () => {
    const p = makeNode(1, 'P');
    const c = makeNode(2, 'C');
    const gc = makeNode(3, 'GC');
    p.appendChild(c);
    c.appendChild(gc);

    const copy = p.copy(true);
    expect(copy.childNodes).toHaveLength(1);
    expect(copy.childNodes[0].childNodes).toHaveLength(1);
    expect(copy.childNodes[0].get('text')).toBe('C');
    expect(copy.childNodes[0].childNodes[0].get('text')).toBe('GC');
  });

  it('deep copy nodes have new IDs', () => {
    const p = makeNode(10, 'P');
    const c = makeNode(20, 'C');
    p.appendChild(c);

    const copy = p.copy(true);
    // Copy IDs should differ from originals
    expect(copy.getId()).not.toBe(p.getId());
    expect(copy.childNodes[0].getId()).not.toBe(c.getId());
  });

  it('copy preserves field values', () => {
    const n = makeNode(5, 'Hello');
    const copy = n.copy(false);
    expect(copy.get('text')).toBe('Hello');
  });

  it('deep copy by default', () => {
    const p = makeNode(1, 'P');
    p.appendChild(makeNode(2, 'C'));

    const copy = p.copy(); // defaults to deep
    expect(copy.childNodes).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// getDepth
// ---------------------------------------------------------------------------

describe('NodeInterface.getDepth', () => {
  it('returns 0 for root', () => {
    const root = makeNode(1, 'R');
    expect(root.getDepth()).toBe(0);
  });

  it('returns correct depth for child', () => {
    const root = makeNode(1, 'R');
    const child = makeNode(2, 'C');
    const gc = makeNode(3, 'GC');
    root.appendChild(child);
    child.appendChild(gc);

    expect(child.getDepth()).toBe(1);
    expect(gc.getDepth()).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Existing behaviors (regression)
// ---------------------------------------------------------------------------

describe('NodeInterface – existing behaviors', () => {
  it('depth is a direct property (not getter)', () => {
    const n = makeNode(1, 'N');
    // depth should be directly assignable
    n.depth = 5;
    expect(n.depth).toBe(5);
  });

  it('expanded is a direct property', () => {
    const n = makeNode(1, 'N');
    n.expanded = true;
    expect(n.expanded).toBe(true);
  });

  it('loaded is a direct property', () => {
    const n = makeNode(1, 'N');
    n.loaded = true;
    expect(n.loaded).toBe(true);
  });

  it('cascadeBy returning false stops the ENTIRE traversal', () => {
    const root = makeNode(1, 'R');
    const c1 = makeNode(2, 'C1');
    const c2 = makeNode(3, 'C2');
    root.appendChild(c1);
    root.appendChild(c2);

    const visited: string[] = [];
    root.cascadeBy((n) => {
      visited.push(n.get('text') as string);
      if (n === c1) return false;
    });
    // c2 must NOT be visited because false stops everything
    expect(visited).toEqual(['R', 'C1']);
    expect(visited).not.toContain('C2');
  });

  it('getPath uses text field by default', () => {
    const root = makeNode(1, 'Root');
    const child = makeNode(2, 'Child');
    root.appendChild(child);
    // Uses 'text', not 'id'
    expect(child.getPath()).toBe('/Root/Child');
    expect(child.getPath()).not.toContain('1');
  });

  it('findChild returns undefined (not null) when not found', () => {
    const p = makeNode(1, 'P');
    const result = p.findChild('text', 'nonexistent');
    expect(result).toBeUndefined();
  });
});
