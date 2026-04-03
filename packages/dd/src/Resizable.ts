/**
 * @framesquared/dd – Resizable
 *
 * Makes an element resizable by adding drag handles on specified
 * edges/corners.  Supports min/max constraints and aspect ratio
 * preservation.
 */

export interface ResizableConfig {
  el: HTMLElement;
  handles: string;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  preserveRatio?: boolean;
  onResize?: (width: number, height: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
}

type HandleDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const HANDLE_CURSORS: Record<string, string> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
};

export class Resizable {
  private el: HTMLElement;
  private handles: HandleDir[];
  private minW: number;
  private maxW: number;
  private minH: number;
  private maxH: number;
  private preserveRatio: boolean;
  private initialRatio: number;
  private onResizeCb: ((w: number, h: number) => void) | null;
  private onResizeStartCb: (() => void) | null;
  private onResizeEndCb: (() => void) | null;
  private handleEls: HTMLElement[] = [];

  constructor(config: ResizableConfig) {
    this.el = config.el;
    this.handles = config.handles.trim().split(/\s+/) as HandleDir[];
    this.minW = config.minWidth ?? 20;
    this.maxW = config.maxWidth ?? Infinity;
    this.minH = config.minHeight ?? 20;
    this.maxH = config.maxHeight ?? Infinity;
    this.preserveRatio = config.preserveRatio ?? false;
    this.onResizeCb = config.onResize ?? null;
    this.onResizeStartCb = config.onResizeStart ?? null;
    this.onResizeEndCb = config.onResizeEnd ?? null;

    const w = parseInt(this.el.style.width || '100', 10);
    const h = parseInt(this.el.style.height || '100', 10);
    this.initialRatio = w / (h || 1);

    this.createHandles();
  }

  // -----------------------------------------------------------------------
  // Handle creation
  // -----------------------------------------------------------------------

  private createHandles(): void {
    // Ensure el is positioned
    const pos = getComputedStyle(this.el).position;
    if (pos === 'static' || pos === '') this.el.style.position = 'relative';

    for (const dir of this.handles) {
      const handle = document.createElement('div');
      handle.classList.add('x-resizable-handle', `x-resizable-handle-${dir}`);
      handle.style.position = 'absolute';
      handle.style.zIndex = '100';
      handle.style.cursor = HANDLE_CURSORS[dir] ?? 'default';
      this.positionHandle(handle, dir);
      handle.addEventListener('pointerdown', (e) => this.onHandleDown(e, dir));
      this.el.appendChild(handle);
      this.handleEls.push(handle);
    }
  }

  private positionHandle(handle: HTMLElement, dir: string): void {
    const size = '8px';
    handle.style.width = size;
    handle.style.height = size;

    switch (dir) {
      case 'se':
        handle.style.right = '0';
        handle.style.bottom = '0';
        break;
      case 'sw':
        handle.style.left = '0';
        handle.style.bottom = '0';
        break;
      case 'ne':
        handle.style.right = '0';
        handle.style.top = '0';
        break;
      case 'nw':
        handle.style.left = '0';
        handle.style.top = '0';
        break;
      case 'e':
        handle.style.right = '0';
        handle.style.top = '50%';
        handle.style.height = '100%';
        handle.style.top = '0';
        break;
      case 'w':
        handle.style.left = '0';
        handle.style.top = '0';
        handle.style.height = '100%';
        break;
      case 's':
        handle.style.bottom = '0';
        handle.style.left = '0';
        handle.style.width = '100%';
        break;
      case 'n':
        handle.style.top = '0';
        handle.style.left = '0';
        handle.style.width = '100%';
        break;
    }
  }

  // -----------------------------------------------------------------------
  // Drag resize
  // -----------------------------------------------------------------------

  private onHandleDown(e: PointerEvent, dir: HandleDir): void {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = parseInt(this.el.style.width || '100', 10);
    const startH = parseInt(this.el.style.height || '100', 10);
    const startLeft = parseInt(this.el.style.left || '0', 10);
    const startTop = parseInt(this.el.style.top || '0', 10);

    this.onResizeStartCb?.();

    const onMove = (me: PointerEvent) => {
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;

      let newW = startW;
      let newH = startH;
      let newLeft = startLeft;
      let newTop = startTop;

      // Compute new dimensions based on handle direction
      if (dir.includes('e')) newW = startW + dx;
      if (dir.includes('w')) {
        newW = startW - dx;
        newLeft = startLeft + dx;
      }
      if (dir.includes('s')) newH = startH + dy;
      if (dir.includes('n')) {
        newH = startH - dy;
        newTop = startTop + dy;
      }

      // Preserve ratio
      if (this.preserveRatio) {
        if (dir.includes('e') || dir.includes('w')) {
          newH = newW / this.initialRatio;
        } else {
          newW = newH * this.initialRatio;
        }
      }

      // Clamp
      newW = Math.max(this.minW, Math.min(newW, this.maxW));
      newH = Math.max(this.minH, Math.min(newH, this.maxH));

      // Apply
      this.el.style.width = `${newW}px`;
      this.el.style.height = `${newH}px`;
      if (dir.includes('w')) this.el.style.left = `${newLeft}px`;
      if (dir.includes('n')) this.el.style.top = `${newTop}px`;

      this.onResizeCb?.(newW, newH);
    };

    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      this.onResizeEndCb?.();
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }

  // -----------------------------------------------------------------------
  // Public
  // -----------------------------------------------------------------------

  destroy(): void {
    for (const handle of this.handleEls) {
      handle.parentNode?.removeChild(handle);
    }
    this.handleEls = [];
  }
}
