/**
 * @framesquared/dd – DragData
 * Payload carried during a drag operation.
 */

import type { Draggable } from './Draggable.js';

export interface DragData {
  source: Draggable;
  sourceEl: HTMLElement;
  groups: string[];
  data: Record<string, unknown>;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}
