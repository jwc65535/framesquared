/**
 * @framesquared/ui – TreeViewDragDrop
 *
 * Plugin that wires TreeDragZone and TreeDropZone onto a TreePanel.
 */

import { TreeDragZone } from './TreeDragZone.js';
import { TreeDropZone } from './TreeDropZone.js';
import type { TreePanelLike } from './TreeDragZone.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface TreeViewDragDropConfig {
  enableDrag?: boolean;
  enableDrop?: boolean;
  ddGroup?: string;
  appendOnly?: boolean;
  sortOnDrop?: boolean;
  expandDelay?: number;
  allowParentInserts?: boolean;
}

// ---------------------------------------------------------------------------
// TreeViewDragDrop
// ---------------------------------------------------------------------------

type FullTreePanel = TreePanelLike & {
  getStore(): { insertBefore: Function; appendChild: Function };
};

export class TreeViewDragDrop {
  private config: TreeViewDragDropConfig;
  private dragZone: TreeDragZone | null = null;
  private dropZone: TreeDropZone | null = null;

  constructor(config?: TreeViewDragDropConfig) {
    this.config = config ?? {};
  }

  init(tree: FullTreePanel): void {
    if (this.config.enableDrag !== false) {
      this.dragZone = new TreeDragZone(tree, { ddGroup: this.config.ddGroup });
    }
    if (this.config.enableDrop !== false) {
      this.dropZone = new TreeDropZone(tree, {
        ddGroup: this.config.ddGroup,
        appendOnly: this.config.appendOnly,
        sortOnDrop: this.config.sortOnDrop,
        expandDelay: this.config.expandDelay,
      });
    }
  }

  getDragZone(): TreeDragZone | null {
    return this.dragZone;
  }

  getDropZone(): TreeDropZone | null {
    return this.dropZone;
  }

  destroy(): void {
    this.dragZone?.destroy();
    this.dropZone?.destroy();
    this.dragZone = null;
    this.dropZone = null;
  }
}
