/**
 * @framesquared/grid – TreeStore
 *
 * Manages hierarchical data.  Each node has text, children, id,
 * leaf/expanded state, and optional checked state.  Provides
 * traversal, path resolution, and mutation helpers.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// TreeNode
// ---------------------------------------------------------------------------

export interface TreeNodeConfig {
  id?: string;
  text: string;
  leaf?: boolean;
  expanded?: boolean;
  checked?: boolean;
  children?: TreeNodeConfig[];
  [key: string]: unknown;
}

export interface TreeNode {
  id: string;
  text: string;
  leaf: boolean;
  expanded: boolean;
  checked: boolean;
  children: TreeNode[];
  parent: TreeNode | null;
  depth: number;
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// TreeStore
// ---------------------------------------------------------------------------

export interface TreeStoreConfig {
  root: TreeNodeConfig;
}

let nodeCounter = 0;

function buildNode(cfg: TreeNodeConfig, parent: TreeNode | null, depth: number): TreeNode {
  const node: TreeNode = {
    id: cfg.id ?? `tree-node-${nodeCounter++}`,
    text: cfg.text,
    leaf: cfg.leaf ?? (!cfg.children || cfg.children.length === 0),
    expanded: cfg.expanded ?? false,
    checked: cfg.checked ?? false,
    children: [],
    parent,
    depth,
    data: { ...cfg },
  };
  if (cfg.children) {
    node.children = cfg.children.map((c) => buildNode(c, node, depth + 1));
  }
  return node;
}

export class TreeStore {
  private root: TreeNode;
  private nodeMap = new Map<string, TreeNode>();

  constructor(config: TreeStoreConfig) {
    nodeCounter = 0;
    this.root = buildNode(config.root, null, 0);
    this.buildMap(this.root);
  }

  private buildMap(node: TreeNode): void {
    this.nodeMap.set(node.id, node);
    for (const child of node.children) this.buildMap(child);
  }

  getRoot(): TreeNode {
    return this.root;
  }

  getNodeById(id: string): TreeNode | null {
    return this.nodeMap.get(id) ?? null;
  }

  /**
   * Returns visible nodes in display order (respecting expanded state).
   * If rootVisible is true, the root is included.
   */
  getVisibleNodes(rootVisible = true): TreeNode[] {
    const result: TreeNode[] = [];
    const walk = (node: TreeNode, include: boolean) => {
      if (include) result.push(node);
      if (node.expanded || (node === this.root && !include)) {
        // If this is the invisible root, still walk children
      }
      if (node.expanded) {
        for (const child of node.children) walk(child, true);
      }
    };

    if (rootVisible) {
      walk(this.root, true);
    } else {
      // Root not visible — walk root's children as top level
      for (const child of this.root.children) walk(child, true);
    }

    return result;
  }

  appendChild(parent: TreeNode, childCfg: TreeNodeConfig): TreeNode {
    const child = buildNode(childCfg, parent, parent.depth + 1);
    parent.children.push(child);
    parent.leaf = false;
    this.buildMap(child);
    return child;
  }

  removeNode(id: string): boolean {
    const node = this.nodeMap.get(id);
    if (!node || !node.parent) return false;
    const parent = node.parent;
    const idx = parent.children.indexOf(node);
    if (idx >= 0) parent.children.splice(idx, 1);
    this.removeFromMap(node);
    return true;
  }

  private removeFromMap(node: TreeNode): void {
    this.nodeMap.delete(node.id);
    for (const child of node.children) this.removeFromMap(child);
  }

  getPath(node: TreeNode): string {
    const parts: string[] = [];
    let current: TreeNode | null = node;
    while (current) {
      parts.unshift(current.text);
      current = current.parent;
    }
    return '/' + parts.join('/');
  }

  findByPath(path: string): TreeNode | null {
    const parts = path.split('/').filter(Boolean);
    let current = this.root;
    // First part should match root
    if (parts[0] !== current.text) return null;
    for (let i = 1; i < parts.length; i++) {
      const child = current.children.find((c) => c.text === parts[i]);
      if (!child) return null;
      current = child;
    }
    return current;
  }

  /** Expand all ancestors of a node so it becomes visible. */
  expandToNode(node: TreeNode): void {
    let current = node.parent;
    while (current) {
      current.expanded = true;
      current = current.parent;
    }
  }

  /** Set expanded=true on all non-leaf nodes. */
  expandAll(node?: TreeNode): void {
    const target = node ?? this.root;
    if (!target.leaf) target.expanded = true;
    for (const child of target.children) this.expandAll(child);
  }

  /** Set expanded=false on all nodes. */
  collapseAll(node?: TreeNode): void {
    const target = node ?? this.root;
    target.expanded = false;
    for (const child of target.children) this.collapseAll(child);
  }

  /** Cascade checked state to all descendants. */
  cascadeCheck(node: TreeNode, checked: boolean): void {
    node.checked = checked;
    for (const child of node.children) this.cascadeCheck(child, checked);
  }

  /** Get all checked nodes. */
  getChecked(node?: TreeNode): TreeNode[] {
    const result: TreeNode[] = [];
    const walk = (n: TreeNode) => {
      if (n.checked) result.push(n);
      for (const child of n.children) walk(child);
    };
    walk(node ?? this.root);
    return result;
  }

  // Store-like interface for Grid compatibility
  getRange(): any[] {
    return this.getVisibleNodes(true);
  }
  getCount(): number {
    return this.getRange().length;
  }
  getAt(i: number): any {
    return this.getRange()[i];
  }
  get(field: string): unknown {
    return (this.root as any)[field];
  }
  on(_evt: string, _fn: Function): void {
    /* placeholder */
  }
  sort(): void {
    /* placeholder */
  }
  isLoading(): boolean {
    return false;
  }
  getTotalCount(): number {
    return this.getCount();
  }
}
