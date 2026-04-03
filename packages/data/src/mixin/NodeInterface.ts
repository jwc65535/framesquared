/**
 * @framesquared/data – NodeInterface
 *
 * Mixin applied to Model instances to give them tree-node capabilities:
 * parent/child/sibling navigation, depth, expand/collapse state,
 * cascadeBy, bubble, getPath, findChild, sort, and nested serialization.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Model } from '../Model.js';
import type { Sorter } from '../store/Store.js';

// ---------------------------------------------------------------------------
// NodeInterface
// ---------------------------------------------------------------------------

export interface NodeInterface extends Model {
  parentNode: NodeInterface | null;
  childNodes: NodeInterface[];
  firstChild: NodeInterface | null;
  lastChild: NodeInterface | null;
  previousSibling: NodeInterface | null;
  nextSibling: NodeInterface | null;
  depth: number;

  /** Node state */
  expanded: boolean;
  loaded: boolean;

  isLeaf(): boolean;
  isRoot(): boolean;
  isExpanded(): boolean;
  isLoaded(): boolean;

  appendChild(child: NodeInterface): void;
  removeChild(child: NodeInterface): void;
  insertBefore(newChild: NodeInterface, refChild: NodeInterface): void;

  getPath(separator?: string): string;
  cascadeBy(fn: (node: NodeInterface) => boolean | void): void;
  bubble(fn: (node: NodeInterface) => boolean | void): void;
  contains(child: NodeInterface): boolean;
  findChild(field: string, value: unknown, deep?: boolean): NodeInterface | undefined;
  sort(sorters: Sorter[]): void;
  serialize(): any;

  // Extended methods
  eachChild(fn: (child: NodeInterface, index: number) => boolean | void, scope?: object): void;
  indexOf(child: NodeInterface): number;
  getChildAt(index: number): NodeInterface | undefined;
  childCount(): number;
  hasChildNodes(): boolean;
  getChildren(deep?: boolean): NodeInterface[];
  findChildBy(
    predicate: (node: NodeInterface) => boolean | void,
    deep?: boolean,
  ): NodeInterface | undefined;
  removeAll(): NodeInterface[];
  copy(deep?: boolean): NodeInterface;
  getDepth(): number;
}

// ---------------------------------------------------------------------------
// applyNodeInterface — attaches node methods/properties to a model
// ---------------------------------------------------------------------------

export function applyNodeInterface(model: Model, depth = 0): void {
  const node = model as any as NodeInterface;

  // Properties
  node.parentNode = node.parentNode ?? null;
  node.childNodes = node.childNodes ?? [];
  node.firstChild = node.firstChild ?? null;
  node.lastChild = node.lastChild ?? null;
  node.previousSibling = node.previousSibling ?? null;
  node.nextSibling = node.nextSibling ?? null;
  node.depth = depth;
  node.expanded = node.expanded ?? false;
  node.loaded = node.loaded ?? false;

  // Methods
  node.isLeaf = function (): boolean {
    // Explicitly marked as leaf, OR has no children
    if (this.get('leaf') === true) return true;
    return this.childNodes.length === 0;
  };

  node.isRoot = function (): boolean {
    return this.parentNode === null;
  };

  node.isExpanded = function (): boolean {
    return this.expanded;
  };

  node.isLoaded = function (): boolean {
    return this.loaded;
  };

  node.appendChild = function (child: NodeInterface): void {
    const c = child as any as NodeInterface;

    // Remove from current parent if any
    if (c.parentNode) {
      c.parentNode.removeChild(c);
    }

    c.parentNode = this;
    c.depth = this.depth + 1;

    const children = this.childNodes;
    const prevLast = children.length > 0 ? children[children.length - 1] : null;

    children.push(c);

    // Update sibling links
    if (prevLast) {
      prevLast.nextSibling = c;
      c.previousSibling = prevLast;
    } else {
      c.previousSibling = null;
    }
    c.nextSibling = null;

    // Update first/last
    this.firstChild = children[0];
    this.lastChild = children[children.length - 1];

    // Update depth recursively
    updateDepthRecursive(c, this.depth + 1);
  };

  node.removeChild = function (child: NodeInterface): void {
    const children = this.childNodes;
    const idx = children.indexOf(child);
    if (idx === -1) return;

    children.splice(idx, 1);

    // Update sibling links
    if (child.previousSibling) {
      child.previousSibling.nextSibling = child.nextSibling;
    }
    if (child.nextSibling) {
      child.nextSibling.previousSibling = child.previousSibling;
    }

    child.parentNode = null;
    child.previousSibling = null;
    child.nextSibling = null;

    // Update first/last
    this.firstChild = children.length > 0 ? children[0] : null;
    this.lastChild = children.length > 0 ? children[children.length - 1] : null;
  };

  node.insertBefore = function (newChild: NodeInterface, refChild: NodeInterface): void {
    const children = this.childNodes;
    const refIdx = children.indexOf(refChild);
    if (refIdx === -1) {
      // If ref not found, append
      this.appendChild(newChild);
      return;
    }

    // Remove from current parent if any
    if (newChild.parentNode) {
      newChild.parentNode.removeChild(newChild);
    }

    newChild.parentNode = this;
    newChild.depth = this.depth + 1;

    children.splice(refIdx, 0, newChild);

    // Rebuild sibling links for the affected range
    rebuildSiblings(children);

    this.firstChild = children[0];
    this.lastChild = children[children.length - 1];

    updateDepthRecursive(newChild, this.depth + 1);
  };

  node.getPath = function (separator = '/'): string {
    const parts: string[] = [];
    let current: NodeInterface | null = this;
    while (current) {
      parts.unshift((current.get('text') as string) ?? String(current.getId()));
      current = current.parentNode;
    }
    return separator + parts.join(separator);
  };

  node.cascadeBy = function (fn: (n: NodeInterface) => boolean | void): void {
    cascadeByImpl(this, fn);
  };

  node.bubble = function (fn: (n: NodeInterface) => boolean | void): void {
    let current: NodeInterface | null = this;
    while (current) {
      if (fn(current) === false) return;
      current = current.parentNode;
    }
  };

  node.contains = function (descendant: NodeInterface): boolean {
    let current: NodeInterface | null = descendant.parentNode;
    while (current) {
      if (current === (this as any)) return true;
      current = current.parentNode;
    }
    return false;
  };

  node.findChild = function (
    field: string,
    value: unknown,
    deep = false,
  ): NodeInterface | undefined {
    for (const child of this.childNodes) {
      if (child.get(field) === value) return child;
      if (deep) {
        const found = child.findChild(field, value, true);
        if (found) return found;
      }
    }
    return undefined;
  };

  node.sort = function (sorters: Sorter[]): void {
    this.childNodes.sort((a: NodeInterface, b: NodeInterface) => {
      for (const s of sorters) {
        const va = a.get(s.property) as string | number;
        const vb = b.get(s.property) as string | number;
        const dir = s.direction === 'DESC' ? -1 : 1;
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
      }
      return 0;
    });
    rebuildSiblings(this.childNodes);
    this.firstChild = this.childNodes[0] ?? null;
    this.lastChild = this.childNodes[this.childNodes.length - 1] ?? null;
  };

  node.serialize = function (): any {
    const data = this.getData();
    if (this.childNodes.length > 0) {
      data.children = this.childNodes.map((c: NodeInterface) => c.serialize());
    }
    return data;
  };

  node.eachChild = function (fn: (child: NodeInterface, index: number) => boolean | void): void {
    for (let i = 0; i < this.childNodes.length; i++) {
      if (fn(this.childNodes[i], i) === false) return;
    }
  };

  node.indexOf = function (child: NodeInterface): number {
    return this.childNodes.indexOf(child);
  };

  node.getChildAt = function (index: number): NodeInterface | undefined {
    return this.childNodes[index];
  };

  node.childCount = function (): number {
    return this.childNodes.length;
  };

  node.hasChildNodes = function (): boolean {
    return this.childNodes.length > 0;
  };

  node.getChildren = function (deep = false): NodeInterface[] {
    if (!deep) {
      return [...this.childNodes];
    }
    const result: NodeInterface[] = [];
    const collect = (n: NodeInterface): void => {
      for (const child of n.childNodes) {
        result.push(child);
        collect(child);
      }
    };
    collect(this);
    return result;
  };

  node.findChildBy = function (
    predicate: (n: NodeInterface) => boolean | void,
    deep = false,
  ): NodeInterface | undefined {
    for (const child of this.childNodes) {
      const matched = predicate(child);
      if (matched !== false && matched !== undefined && matched !== null) return child;
      if (deep) {
        const found = child.findChildBy(predicate, true);
        if (found) return found;
      }
    }
    return undefined;
  };

  node.removeAll = function (): NodeInterface[] {
    const removed = [...this.childNodes];
    for (const child of removed) {
      child.parentNode = null;
      child.previousSibling = null;
      child.nextSibling = null;
    }
    this.childNodes = [];
    this.firstChild = null;
    this.lastChild = null;
    return removed;
  };

  node.copy = function (deep = true): NodeInterface {
    const copyCounter = { i: 0 };
    return copyNodeImpl(this, deep, copyCounter);
  };

  node.getDepth = function (): number {
    return this.depth;
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function rebuildSiblings(children: NodeInterface[]): void {
  for (let i = 0; i < children.length; i++) {
    children[i].previousSibling = i > 0 ? children[i - 1] : null;
    children[i].nextSibling = i < children.length - 1 ? children[i + 1] : null;
  }
}

function updateDepthRecursive(node: NodeInterface, depth: number): void {
  node.depth = depth;
  for (const child of node.childNodes) {
    updateDepthRecursive(child, depth + 1);
  }
}

/**
 * Recursively copies a node (and optionally its children) with new IDs.
 */
function copyNodeImpl(node: NodeInterface, deep: boolean, counter: { i: number }): NodeInterface {
  counter.i += 1;
  const newId = 'copy-' + Date.now() + '-' + counter.i;
  const data = (node as any).getData() as Record<string, unknown>;
  const Ctor = (node as any).constructor as { create(data: Record<string, unknown>): any };
  const copyModel = Ctor.create({ ...data, id: newId });
  applyNodeInterface(copyModel, 0);
  const copyNode = copyModel as any as NodeInterface;

  if (deep) {
    for (const child of node.childNodes) {
      const childCopy = copyNodeImpl(child, true, counter);
      copyNode.appendChild(childCopy);
    }
  }

  return copyNode;
}

/**
 * Depth-first cascade that returns false if iteration was stopped.
 */
function cascadeByImpl(node: NodeInterface, fn: (n: NodeInterface) => boolean | void): boolean {
  if (fn(node) === false) return false;
  for (const child of [...node.childNodes]) {
    if (!cascadeByImpl(child, fn)) return false;
  }
  return true;
}
