import { describe, it, expect } from 'vitest';
import { TreeReader } from '../src/reader/TreeReader.js';
import { TreeModel } from '../src/model/TreeModel.js';

describe('TreeReader', () => {
  describe('flat array', () => {
    it('parses a flat array of nodes', () => {
      const reader = new TreeReader({ model: TreeModel });
      const data = [
        { id: 1, text: 'A', leaf: true },
        { id: 2, text: 'B', leaf: true },
        { id: 3, text: 'C', leaf: true },
      ];
      const resultSet = reader.read(data);
      expect(resultSet.records).toHaveLength(3);
      expect(resultSet.success).toBe(true);
    });

    it('all records are accessible', () => {
      const reader = new TreeReader({ model: TreeModel });
      const data = [
        { id: 1, text: 'Alpha', leaf: true },
        { id: 2, text: 'Beta', leaf: true },
      ];
      const resultSet = reader.read(data);
      const texts = resultSet.records.map((r) => r.get('text'));
      expect(texts).toContain('Alpha');
      expect(texts).toContain('Beta');
    });
  });

  describe('nested JSON with children', () => {
    it('parses nested nodes into flat result set', () => {
      const reader = new TreeReader({ model: TreeModel });
      const data = [
        {
          id: 1, text: 'Root', children: [
            { id: 2, text: 'Child1', leaf: true },
            { id: 3, text: 'Child2', leaf: true },
          ],
        },
      ];
      const resultSet = reader.read(data);
      // Should include parent + 2 children = 3 total
      expect(resultSet.records).toHaveLength(3);
    });

    it('3-level deep nesting includes all nodes', () => {
      const reader = new TreeReader({ model: TreeModel });
      const data = [
        {
          id: 1, text: 'L1', children: [
            {
              id: 2, text: 'L2', children: [
                { id: 3, text: 'L3', leaf: true },
              ],
            },
          ],
        },
      ];
      const resultSet = reader.read(data);
      expect(resultSet.records).toHaveLength(3);
    });

    it('missing children treated as leaf node', () => {
      const reader = new TreeReader({ model: TreeModel });
      const data = [
        { id: 1, text: 'Leaf' }, // no children property
      ];
      const resultSet = reader.read(data);
      expect(resultSet.records).toHaveLength(1);
    });

    it('empty children array = leaf node (no nested records)', () => {
      const reader = new TreeReader({ model: TreeModel });
      const data = [
        { id: 1, text: 'Empty', children: [] },
      ];
      const resultSet = reader.read(data);
      expect(resultSet.records).toHaveLength(1);
    });
  });

  describe('custom childrenProperty', () => {
    it('uses custom children property name', () => {
      const reader = new TreeReader({ model: TreeModel, childrenProperty: 'nodes' });
      const data = [
        {
          id: 1, text: 'Root', nodes: [
            { id: 2, text: 'Child', leaf: true },
          ],
        },
      ];
      const resultSet = reader.read(data);
      expect(resultSet.records).toHaveLength(2);
    });

    it('childrenProperty defaults to "children"', () => {
      const reader = new TreeReader({ model: TreeModel });
      expect(reader.childrenProperty).toBe('children');
    });
  });

  describe('rootProperty support', () => {
    it('extracts records from rootProperty', () => {
      const reader = new TreeReader({ model: TreeModel, rootProperty: 'data' });
      const response = {
        data: [
          { id: 1, text: 'A', leaf: true },
          { id: 2, text: 'B', leaf: true },
        ],
      };
      const resultSet = reader.read(response);
      expect(resultSet.records).toHaveLength(2);
    });
  });

  describe('readTree', () => {
    it('returns root record and flat records array', () => {
      const reader = new TreeReader({ model: TreeModel });
      const data = {
        id: 1, text: 'Root', children: [
          { id: 2, text: 'A', leaf: true },
          { id: 3, text: 'B', leaf: true },
        ],
      };
      const result = reader.readTree(data);
      expect(result.root).toBeDefined();
      expect(result.root.id).toBe(1);
      expect(result.records).toHaveLength(3); // root + 2 children
    });

    it('readTree with deeply nested data', () => {
      const reader = new TreeReader({ model: TreeModel });
      const data = {
        id: 1, text: 'Root', children: [
          {
            id: 2, text: 'Branch', children: [
              { id: 3, text: 'Leaf', leaf: true },
            ],
          },
        ],
      };
      const result = reader.readTree(data);
      expect(result.records).toHaveLength(3);
    });
  });
});
