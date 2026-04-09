/**
 * @framesquared/ui – TreeGridClipboard
 *
 * Copy/paste plugin for TreeGrid. Supports TSV copy with optional
 * hierarchy indentation and paste as children/siblings.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { TreeModel, applyNodeInterface } from '@framesquared/data';
import type { TreeGrid } from './TreeGrid.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TreeGridClipboardConfig {
  copyHierarchy?: boolean;
  pasteAsChildren?: boolean;
  pasteIndentLevel?: boolean;
  indentCharacter?: string;
  includeHeaders?: boolean;
}

// ---------------------------------------------------------------------------
// TreeGridClipboard
// ---------------------------------------------------------------------------

export class TreeGridClipboard {
  private treeGrid: TreeGrid | null = null;
  private config: Required<TreeGridClipboardConfig>;
  private _onKeyDown: (e: KeyboardEvent) => void;

  constructor(config: TreeGridClipboardConfig = {}) {
    this.config = {
      copyHierarchy: config.copyHierarchy ?? false,
      pasteAsChildren: config.pasteAsChildren ?? true,
      pasteIndentLevel: config.pasteIndentLevel ?? false,
      indentCharacter: config.indentCharacter ?? '\t',
      includeHeaders: config.includeHeaders ?? false,
    };
    this._onKeyDown = this._handleKeyDown.bind(this);
  }

  init(treeGrid: TreeGrid): void {
    this.treeGrid = treeGrid;
    const viewEl = treeGrid.getView()?.el;
    if (viewEl) viewEl.addEventListener('keydown', this._onKeyDown);
  }

  destroy(): void {
    const viewEl = this.treeGrid?.getView()?.el;
    if (viewEl) viewEl.removeEventListener('keydown', this._onKeyDown);
    this.treeGrid = null;
  }

  // -------------------------------------------------------------------------
  // Copy
  // -------------------------------------------------------------------------

  copyToClipboard(): string {
    const tg = this.treeGrid;
    if (!tg) return '';
    const columns = tg.getColumns();
    const selection = tg.getSelection();
    if (selection.length === 0) return '';

    const rows: string[] = [];

    // Header row
    const headers = columns.filter((c) => !c.hidden).map((c) => c.text);
    rows.push(headers.join('\t'));

    // When an ancestor and a descendant are both selected, keep only the
    // ancestor — otherwise the descendant would appear twice (once from
    // the ancestor's subtree walk and once from its own entry).
    const selSet = new Set(selection);
    const roots = selection.filter((node) => {
      let p = (node as any).parentNode as any;
      while (p && !p.isRoot?.()) {
        if (selSet.has(p)) return false;
        p = p.parentNode;
      }
      return true;
    });

    // Expand each root into its full subtree (node + all descendants).
    const allNodes: typeof selection = [];
    for (const root of roots) {
      (root as any).cascadeBy((n: any) => allNodes.push(n));
    }

    // Indent relative to the shallowest copied node so the output always
    // starts at zero tabs regardless of where in the tree the selection sits.
    const minDepth = allNodes.reduce((m, n) => Math.min(m, (n as any).depth ?? 0), Infinity);
    const baseDepth = minDepth === Infinity ? 0 : minDepth;

    for (const node of allNodes) {
      const cells: string[] = [];
      for (const col of columns) {
        if (col.hidden) continue;
        let cellValue = String((node as any).get?.(col.dataIndex) ?? '');
        if (this.config.copyHierarchy && col === tg.getTreeColumn()) {
          const relDepth = ((node as any).depth ?? 0) - baseDepth;
          cellValue = this.config.indentCharacter.repeat(relDepth) + cellValue;
        }
        cells.push(cellValue);
      }
      rows.push(cells.join('\t'));
    }

    return rows.join('\n');
  }

  pasteFromText(text: string): void {
    const tg = this.treeGrid;
    if (!tg) return;

    const lines = text.split('\n').filter(Boolean);
    if (lines.length === 0) return;

    const visibleCols = tg.getColumns().filter((c) => !c.hidden);
    const selection = tg.getSelection();
    const pasteRoot =
      selection.length > 0 && this.config.pasteAsChildren ? selection[0] : tg.getRootNode();

    // parentStack[d] is the node that should receive children at relative depth d.
    // Index 0 is always the paste target; each appended node registers itself
    // at index depth+1 for the benefit of deeper rows that follow.
    const parentStack: any[] = [pasteRoot];

    // Seed for unique IDs — incremented per node so rapid pastes stay unique.
    let idSeed = Date.now();

    // Track every node we create so we can fix leaf flags after the loop.
    const pastedNodes: any[] = [];

    for (const line of lines) {
      const parts = line.split('\t');

      // Count leading empty strings produced by copyHierarchy tab indentation.
      // Stop one before the end so at least one value remains.
      let depth = 0;
      while (depth < parts.length - 1 && parts[depth] === '') depth++;

      // Map remaining parts to visible columns.
      const values = parts.slice(depth);
      const data: Record<string, unknown> = {};
      for (let i = 0; i < Math.min(values.length, visibleCols.length); i++) {
        data[visibleCols[i].dataIndex] = values[i] ?? '';
      }

      // Trim the stack so parentStack[depth] is the correct parent node.
      while (parentStack.length > depth + 1) parentStack.pop();
      const parent = parentStack[depth];

      const newNode = TreeModel.create(data) as any;

      // Pasted nodes carry no id — assign one before appendChild so that
      // store.registerRecursive() can index the node and the view's click
      // handlers (expand arrow, row selection) can look it up via getNodeById.
      if (!newNode.getId?.()) {
        newNode.setId?.('paste_' + idSeed++);
      }

      if (newNode && typeof newNode.isRoot !== 'function') {
        applyNodeInterface(newNode, (parent.depth ?? 0) + 1);
      }
      tg.getStore().appendChild(parent, newNode);
      pastedNodes.push(newNode);

      // This node becomes the parent candidate for the next deeper depth level.
      parentStack[depth + 1] = newNode;
      parentStack.length = depth + 2;
    }

    // TreeModel defaults leaf to false, so every pasted node would show an
    // expand arrow.  After the loop we know the final child counts: any node
    // that received no children is a true leaf and must be flagged explicitly
    // so the tree column renders the leaf spacer instead of an expander.
    for (const node of pastedNodes) {
      if (node.childNodes.length === 0) {
        node.set('leaf', true);
      }
    }

    tg.getView().refresh();
  }

  // -------------------------------------------------------------------------
  // Keyboard
  // -------------------------------------------------------------------------

  private _handleKeyDown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      e.preventDefault();
      const text = this.copyToClipboard();
      navigator.clipboard?.writeText?.(text);
    }
  }
}
