/**
 * @framesquared/ui – CheckboxModel
 *
 * A selection model that adds checkbox-based check state management to tree nodes.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { TreeStore, NodeInterface } from '@framesquared/data';
import { TreeSelectionModel } from '../selection/TreeSelectionModel.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface CheckboxModelConfig {
  cascadeChecks?: boolean;
  onlyLeafCheckable?: boolean;
}

// ---------------------------------------------------------------------------
// CheckboxModel
// ---------------------------------------------------------------------------

export class CheckboxModel extends TreeSelectionModel {
  private cascadeChecks: boolean;
  private onlyLeafCheckable: boolean;

  constructor(config?: CheckboxModelConfig) {
    super({ mode: 'multi' });
    this.cascadeChecks = config?.cascadeChecks ?? true;
    this.onlyLeafCheckable = config?.onlyLeafCheckable ?? false;
  }

  // -------------------------------------------------------------------------
  // Check API
  // -------------------------------------------------------------------------

  toggleCheck(node: NodeInterface): void {
    const newState = !((node as any).$checked as boolean);
    this.setChecked(node, newState);
  }

  setChecked(node: NodeInterface, checked: boolean): void {
    (node as any).$checked = checked;

    if (this.cascadeChecks) {
      node.eachChild?.((child) => {
        this.setChecked(child, checked);
      });
    }

    // Bubble up to update parents
    let parent = node.parentNode;
    while (parent) {
      this.updateParentCheck(parent);
      parent = parent.parentNode;
    }
  }

  getChecked(store: TreeStore): NodeInterface[] {
    const checked: NodeInterface[] = [];
    const root = store.getRootNode();
    root.cascadeBy?.((node) => {
      if ((node as any).$checked === true) checked.push(node);
    });
    return checked;
  }

  private updateParentCheck(node: NodeInterface): void {
    if (!node || node.isRoot()) return;
    const children = node.childNodes;
    if (children.length === 0) return;

    const allChecked = children.every((c) => (c as any).$checked === true);
    const someChecked = children.some((c) => (c as any).$checked === true);

    if (allChecked) {
      (node as any).$checked = true;
    } else if (someChecked) {
      (node as any).$checked = 'partial';
    } else {
      (node as any).$checked = false;
    }
  }

  isCheckable(node: NodeInterface): boolean {
    if (this.onlyLeafCheckable) return node.isLeaf();
    return true;
  }
}
