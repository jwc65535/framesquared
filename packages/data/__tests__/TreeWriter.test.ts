import { describe, it, expect } from 'vitest';
import { TreeWriter } from '../src/writer/TreeWriter.js';
import { TreeModel } from '../src/model/TreeModel.js';
import { applyNodeInterface } from '../src/mixin/NodeInterface.js';
import type { NodeInterface } from '../src/mixin/NodeInterface.js';
import { Model } from '../src/Model.js';
import { FieldType } from '../src/field/Field.js';

// Simple TreeNode for testing with applyNodeInterface directly
class TreeNode extends Model {
  static override $className = 'TreeWriter.test.Node';
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

describe('TreeWriter', () => {
  describe('leaf nodes', () => {
    it('serializes a leaf node', () => {
      const writer = new TreeWriter();
      const leaf = makeNode(1, 'Leaf', true);

      const result = writer.writeRecords([leaf]);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].text).toBe('Leaf');
      expect(result[0].leaf).toBe(true);
    });

    it('leaf node has no children property', () => {
      const writer = new TreeWriter();
      const leaf = makeNode(1, 'Leaf', true);

      const result = writer.writeRecords([leaf]);
      expect(result[0].children).toBeUndefined();
    });
  });

  describe('nested tree', () => {
    it('serializes tree with children nested under "children" property', () => {
      const writer = new TreeWriter();
      const root = makeNode(1, 'Root');
      const c1 = makeNode(2, 'Child1', true);
      const c2 = makeNode(3, 'Child2', true);
      root.appendChild(c1);
      root.appendChild(c2);

      const result = writer.writeRecords([root]);
      expect(result[0].children).toBeDefined();
      const children = result[0].children as Record<string, unknown>[];
      expect(children).toHaveLength(2);
      expect(children[0].text).toBe('Child1');
      expect(children[1].text).toBe('Child2');
    });

    it('serializes 3-level deep tree', () => {
      const writer = new TreeWriter();
      const root = makeNode(1, 'Root');
      const branch = makeNode(2, 'Branch');
      const leaf = makeNode(3, 'Leaf', true);
      root.appendChild(branch);
      branch.appendChild(leaf);

      const result = writer.writeRecords([root]);
      expect(result[0].children).toBeDefined();
      const branches = result[0].children as Record<string, unknown>[];
      expect(branches[0].text).toBe('Branch');
      expect(branches[0].children).toBeDefined();
      const leaves = branches[0].children as Record<string, unknown>[];
      expect(leaves[0].text).toBe('Leaf');
    });
  });

  describe('custom childrenProperty', () => {
    it('uses custom property name for children', () => {
      const writer = new TreeWriter({ childrenProperty: 'nodes' });
      const root = makeNode(1, 'Root');
      root.appendChild(makeNode(2, 'Child', true));

      const result = writer.writeRecords([root]);
      expect(result[0].nodes).toBeDefined();
      expect(result[0].children).toBeUndefined();
    });

    it('childrenProperty defaults to "children"', () => {
      const writer = new TreeWriter();
      expect(writer.childrenProperty).toBe('children');
    });
  });

  describe('non-persistent fields', () => {
    it('does not include depth, expanded, loaded in output (these are node properties, not fields)', () => {
      const writer = new TreeWriter();
      const node = makeNode(1, 'Node');
      node.depth = 3;
      node.expanded = true;
      node.loaded = true;

      const result = writer.writeRecords([node]);
      // depth, expanded, loaded are node properties not fields, so getData() excludes them
      expect(result[0].depth).toBeUndefined();
      expect(result[0].expanded).toBeUndefined();
      expect(result[0].loaded).toBeUndefined();
    });
  });

  describe('TreeModel integration', () => {
    it('writes TreeModel nodes', () => {
      const writer = new TreeWriter();
      const root = TreeModel.create({ id: 1, text: 'Root' }) as InstanceType<typeof TreeModel> & NodeInterface;
      const child = TreeModel.create({ id: 2, text: 'Child', leaf: true }) as InstanceType<typeof TreeModel> & NodeInterface;
      root.appendChild(child);

      const result = writer.writeRecords([root]);
      expect(result[0].text).toBe('Root');
      const children = result[0].children as Record<string, unknown>[];
      expect(children[0].text).toBe('Child');
    });
  });
});
