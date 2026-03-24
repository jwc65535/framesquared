/**
 * @ext-ts/data – TreeStore
 *
 * Manages hierarchical (tree) data.  Records are enhanced with
 * NodeInterface for parent/child navigation, expand/collapse,
 * and nested serialization.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Base, Observable } from '@ext-ts/core';
import type { Model } from '../Model.js';
import { applyNodeInterface } from '../mixin/NodeInterface.js';
import type { NodeInterface } from '../mixin/NodeInterface.js';

// ---------------------------------------------------------------------------
// Observable bootstrap
// ---------------------------------------------------------------------------

const ObservableMixin: typeof Base = Observable;

function ensureObservable(instance: any): void {
  const proto = ObservableMixin.prototype;
  for (const name of Object.getOwnPropertyNames(proto)) {
    if (name === 'constructor') continue;
    if (name in instance) continue;
    const desc = Object.getOwnPropertyDescriptor(proto, name);
    if (desc && typeof desc.value === 'function') {
      instance[name] = desc.value.bind(instance);
    }
  }
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TreeStoreConfig {
  model: typeof Model;
  root?: Record<string, unknown>;
  proxy?: any;
}

// ---------------------------------------------------------------------------
// TreeStore
// ---------------------------------------------------------------------------

export class TreeStore extends Base {
  static override $className = 'Ext.data.TreeStore';

  private ModelClass: typeof Model;
  private rootNode!: NodeInterface;
  private nodeMap = new Map<string | number, NodeInterface>();

  $destroyHooks: (() => void)[] = [];

  constructor(config: TreeStoreConfig) {
    super();
    ensureObservable(this);

    this.ModelClass = config.model;

    if (config.root) {
      this.setRoot(this.buildNode(config.root, 0));
    } else {
      // Create an empty root
      const empty = this.ModelClass.create({ id: '__root__', text: 'Root' });
      applyNodeInterface(empty, 0);
      this.setRoot(empty as any as NodeInterface);
    }
  }

  // -----------------------------------------------------------------------
  // Root
  // -----------------------------------------------------------------------

  getRoot(): NodeInterface {
    return this.rootNode;
  }

  private setRoot(node: NodeInterface): void {
    this.rootNode = node;
    this.nodeMap.clear();
    this.registerRecursive(node);
    this.fire('rootchange', this, node);
  }

  // -----------------------------------------------------------------------
  // Lookup
  // -----------------------------------------------------------------------

  getNodeById(id: string | number): NodeInterface | undefined {
    return this.nodeMap.get(id);
  }

  // -----------------------------------------------------------------------
  // Tree operations
  // -----------------------------------------------------------------------

  appendChild(parent: NodeInterface, child: NodeInterface): void {
    parent.appendChild(child);
    this.registerRecursive(child);
    this.fire('nodeappend', this, child, parent);
    this.fire('datachanged', this);
  }

  removeChild(parent: NodeInterface, child: NodeInterface): void {
    parent.removeChild(child);
    this.unregisterRecursive(child);
    this.fire('noderemove', this, child, parent);
    this.fire('datachanged', this);
  }

  insertBefore(node: NodeInterface, refNode: NodeInterface): void {
    const parent = refNode.parentNode;
    if (!parent) return;
    parent.insertBefore(node, refNode);
    this.registerRecursive(node);
    this.fire('nodeinsert', this, node, refNode, parent);
    this.fire('datachanged', this);
  }

  // -----------------------------------------------------------------------
  // Expand / Collapse
  // -----------------------------------------------------------------------

  expandNode(node: NodeInterface): void {
    node.expanded = true;
    node.loaded = true;
    this.fire('nodeexpand', this, node);
  }

  collapseNode(node: NodeInterface): void {
    node.expanded = false;
    this.fire('nodecollapse', this, node);
  }

  // -----------------------------------------------------------------------
  // Flatten (for rendering in a flat list / grid)
  // -----------------------------------------------------------------------

  flattenNodes(): Model[] {
    const result: Model[] = [];
    this.flattenWalk(this.rootNode, result);
    return result;
  }

  private flattenWalk(node: NodeInterface, out: Model[]): void {
    out.push(node as any as Model);
    if (node.expanded || node.isRoot()) {
      for (const child of node.childNodes) {
        this.flattenWalk(child, out);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Build tree from nested data
  // -----------------------------------------------------------------------

  private buildNode(data: Record<string, unknown>, depth: number): NodeInterface {
    const children = data.children as Record<string, unknown>[] | undefined;
    const expanded = data.expanded as boolean | undefined;
    const nodeData = { ...data };
    delete nodeData.children;
    delete nodeData.expanded;

    const model = this.ModelClass.create(nodeData);
    applyNodeInterface(model, depth);
    const node = model as any as NodeInterface;

    if (expanded) {
      node.expanded = true;
      node.loaded = true;
    }

    if (children && Array.isArray(children)) {
      for (const childData of children) {
        const childNode = this.buildNode(childData, depth + 1);
        node.appendChild(childNode);
      }
      node.loaded = true;
    }

    return node;
  }

  // -----------------------------------------------------------------------
  // Node registration (for id-based lookup)
  // -----------------------------------------------------------------------

  private registerRecursive(node: NodeInterface): void {
    const id = (node as any as Model).getId();
    if (id !== undefined && id !== null) {
      this.nodeMap.set(id, node);
    }
    for (const child of node.childNodes) {
      this.registerRecursive(child);
    }
  }

  private unregisterRecursive(node: NodeInterface): void {
    const id = (node as any as Model).getId();
    if (id !== undefined && id !== null) {
      this.nodeMap.delete(id);
    }
    for (const child of node.childNodes) {
      this.unregisterRecursive(child);
    }
  }

  // -----------------------------------------------------------------------
  // Event helper
  // -----------------------------------------------------------------------

  private fire(eventName: string, ...args: unknown[]): void {
    if (typeof (this as any).fireEvent === 'function') {
      (this as any).fireEvent(eventName, ...args);
    }
  }
}
