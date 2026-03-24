/**
 * @ext-ts/dd – Droppable
 *
 * Makes an element a drop target.  Registers with DragManager
 * for hit testing during active drags.
 */

import { DragManager } from './DragManager.js';
import type { DragData } from './DragData.js';
import type { DropTarget } from './DragManager.js';

export interface DroppableConfig {
  el: HTMLElement;
  accept?: string[];
  overCls?: string;
  disabled?: boolean;
  onDragEnter?: (data: DragData) => boolean | void;
  onDragOver?: (data: DragData) => void;
  onDragLeave?: (data: DragData) => void;
  onDrop?: (data: DragData) => boolean | void;
}

export class Droppable {
  readonly el: HTMLElement;
  private target: DropTarget;

  constructor(config: DroppableConfig) {
    this.el = config.el;
    this.target = {
      el: config.el,
      accept: config.accept ?? [],
      disabled: config.disabled ?? false,
      overCls: config.overCls ?? '',
      onDragEnter: config.onDragEnter,
      onDragOver: config.onDragOver,
      onDragLeave: config.onDragLeave,
      onDrop: config.onDrop,
    };
    DragManager.registerDropTarget(this.target);
  }

  setDisabled(disabled: boolean): void {
    this.target.disabled = disabled;
  }

  destroy(): void {
    DragManager.unregisterDropTarget(this.target);
  }
}
