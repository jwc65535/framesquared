import { describe, it, expect } from 'vitest';
import { TreeModel } from '../src/model/TreeModel.js';
import type { NodeInterface } from '../src/mixin/NodeInterface.js';

describe('TreeModel', () => {
  describe('construction', () => {
    it('creates an instance with NodeInterface methods', () => {
      const node = TreeModel.create({ id: 1, text: 'Root' }) as InstanceType<typeof TreeModel> & NodeInterface;
      expect(typeof node.isRoot).toBe('function');
      expect(typeof node.isLeaf).toBe('function');
      expect(typeof node.appendChild).toBe('function');
      expect(typeof node.removeChild).toBe('function');
      expect(typeof node.getPath).toBe('function');
      expect(typeof node.cascadeBy).toBe('function');
      expect(typeof node.bubble).toBe('function');
    });

    it('isRoot() returns true for node with no parent', () => {
      const node = TreeModel.create({ id: 1, text: 'Root' }) as InstanceType<typeof TreeModel> & NodeInterface;
      expect(node.isRoot()).toBe(true);
    });

    it('has childNodes initialized to empty array', () => {
      const node = TreeModel.create({ id: 1 }) as InstanceType<typeof TreeModel> & NodeInterface;
      expect(node.childNodes).toEqual([]);
    });

    it('has parentNode initialized to null', () => {
      const node = TreeModel.create({ id: 1 }) as InstanceType<typeof TreeModel> & NodeInterface;
      expect(node.parentNode).toBeNull();
    });

    it('depth defaults to 0', () => {
      const node = TreeModel.create({ id: 1 }) as InstanceType<typeof TreeModel> & NodeInterface;
      expect(node.depth).toBe(0);
    });

    it('expanded defaults to false', () => {
      const node = TreeModel.create({ id: 1 }) as InstanceType<typeof TreeModel> & NodeInterface;
      expect(node.expanded).toBe(false);
    });

    it('loaded defaults to false', () => {
      const node = TreeModel.create({ id: 1 }) as InstanceType<typeof TreeModel> & NodeInterface;
      expect(node.loaded).toBe(false);
    });
  });

  describe('default fields', () => {
    it('has text field', () => {
      const node = TreeModel.create({ id: 1, text: 'Hello' }) as InstanceType<typeof TreeModel> & NodeInterface;
      expect(node.get('text')).toBe('Hello');
    });

    it('text defaults to empty string', () => {
      const node = TreeModel.create({ id: 1 }) as InstanceType<typeof TreeModel> & NodeInterface;
      expect(node.get('text')).toBe('');
    });

    it('has leaf field', () => {
      const node = TreeModel.create({ id: 1, leaf: true }) as InstanceType<typeof TreeModel> & NodeInterface;
      expect(node.get('leaf')).toBe(true);
    });

    it('leaf defaults to false', () => {
      const node = TreeModel.create({ id: 1 }) as InstanceType<typeof TreeModel> & NodeInterface;
      expect(node.get('leaf')).toBe(false);
    });

    it('has allowDrop field defaulting to true', () => {
      const node = TreeModel.create({ id: 1 }) as InstanceType<typeof TreeModel> & NodeInterface;
      expect(node.get('allowDrop')).toBe(true);
    });

    it('has allowDrag field defaulting to true', () => {
      const node = TreeModel.create({ id: 1 }) as InstanceType<typeof TreeModel> & NodeInterface;
      expect(node.get('allowDrag')).toBe(true);
    });
  });

  describe('tree operations', () => {
    it('appendChild attaches child and sets parentNode', () => {
      const parent = TreeModel.create({ id: 1, text: 'Parent' }) as InstanceType<typeof TreeModel> & NodeInterface;
      const child = TreeModel.create({ id: 2, text: 'Child' }) as InstanceType<typeof TreeModel> & NodeInterface;
      parent.appendChild(child);

      expect(parent.childNodes).toHaveLength(1);
      expect(child.parentNode).toBe(parent);
      expect(child.depth).toBe(1);
    });

    it('isLeaf returns false after appendChild', () => {
      const parent = TreeModel.create({ id: 1 }) as InstanceType<typeof TreeModel> & NodeInterface;
      const child = TreeModel.create({ id: 2 }) as InstanceType<typeof TreeModel> & NodeInterface;
      parent.appendChild(child);
      expect(parent.isLeaf()).toBe(false);
    });

    it('isLeaf returns true when leaf=true', () => {
      const node = TreeModel.create({ id: 1, leaf: true }) as InstanceType<typeof TreeModel> & NodeInterface;
      expect(node.isLeaf()).toBe(true);
    });

    it('getPath returns path using text field', () => {
      const root = TreeModel.create({ id: 1, text: 'Root' }) as InstanceType<typeof TreeModel> & NodeInterface;
      const child = TreeModel.create({ id: 2, text: 'Child' }) as InstanceType<typeof TreeModel> & NodeInterface;
      root.appendChild(child);
      expect(child.getPath()).toBe('/Root/Child');
    });
  });

  describe('static properties', () => {
    it('has defaultRootId static property', () => {
      expect(TreeModel.defaultRootId).toBe('root');
    });

    it('has defaultRootText static property', () => {
      expect(TreeModel.defaultRootText).toBe('Root');
    });
  });

  describe('custom subclass', () => {
    class FolderNode extends TreeModel {
      static override $className = 'test.FolderNode';
      static override fields = [
        ...TreeModel.fields,
        { name: 'path', type: 'string' as const, defaultValue: '' },
      ];
    }

    it('subclass inherits NodeInterface methods', () => {
      const node = FolderNode.create({ id: 1, text: 'Docs', path: '/docs' }) as InstanceType<typeof FolderNode> & NodeInterface;
      expect(typeof node.appendChild).toBe('function');
      expect(node.isRoot()).toBe(true);
    });

    it('subclass has custom fields', () => {
      const node = FolderNode.create({ id: 1, path: '/docs' }) as InstanceType<typeof FolderNode> & NodeInterface;
      expect(node.get('path')).toBe('/docs');
    });

    it('subclass can append children', () => {
      const parent = FolderNode.create({ id: 1, text: 'Parent' }) as InstanceType<typeof FolderNode> & NodeInterface;
      const child = FolderNode.create({ id: 2, text: 'Child' }) as InstanceType<typeof FolderNode> & NodeInterface;
      parent.appendChild(child);
      expect(parent.childNodes[0]).toBe(child);
    });
  });
});
