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
  static $className = 'Ext.resizer.Resizer';

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
    // Ensure el is positioned and not overflow:hidden — panels use
    // overflow:hidden + border-radius which clips absolute children at the
    // corners, making edge/corner handles invisible.
    const pos = getComputedStyle(this.el).position;
    if (pos === 'static' || pos === '') this.el.style.position = 'relative';
    this.el.style.overflow = 'visible';

    for (const dir of this.handles) {
      const handle = document.createElement('div');
      handle.classList.add('x-resizable-handle', `x-resizable-handle-${dir}`);
      handle.style.position = 'absolute';
      handle.style.zIndex = '100';
      handle.style.cursor = HANDLE_CURSORS[dir] ?? 'default';
      this.positionHandle(handle, dir);

      // Hover feedback: SE corner darkens, edge strips intensify.
      const baseBg = handle.style.background;
      handle.addEventListener('mouseenter', () => {
        if (dir === 'se') {
          handle.style.background = '#1565c0';
        } else {
          handle.style.background = 'rgba(25, 118, 210, 0.38)';
        }
      });
      handle.addEventListener('mouseleave', () => {
        handle.style.background = baseBg;
      });

      handle.addEventListener('pointerdown', (e) => this.onHandleDown(e, dir));
      this.el.appendChild(handle);
      this.handleEls.push(handle);
    }
  }

  private positionHandle(handle: HTMLElement, dir: string): void {
    if (dir === 'se') {
      // Bold, primary-coloured corner grip — unmistakably interactive.
      handle.style.width = '28px';
      handle.style.height = '28px';
      handle.style.background = '#1976d2';
      handle.style.borderRadius = '4px 0 0 0';
      handle.style.display = 'flex';
      handle.style.alignItems = 'center';
      handle.style.justifyContent = 'center';
      handle.style.fontSize = '16px';
      handle.style.color = '#fff';
      handle.style.userSelect = 'none';
      handle.textContent = '↘';
      handle.style.right = '0';
      handle.style.bottom = '0';
    } else if (dir === 'sw') {
      handle.style.width = '14px';
      handle.style.height = '14px';
      handle.style.background = 'rgba(0, 0, 0, 0.30)';
      handle.style.left = '0';
      handle.style.bottom = '0';
    } else if (dir === 'ne') {
      handle.style.width = '14px';
      handle.style.height = '14px';
      handle.style.background = 'rgba(0, 0, 0, 0.30)';
      handle.style.right = '0';
      handle.style.top = '0';
    } else if (dir === 'nw') {
      handle.style.width = '14px';
      handle.style.height = '14px';
      handle.style.background = 'rgba(0, 0, 0, 0.30)';
      handle.style.left = '0';
      handle.style.top = '0';
    } else if (dir === 'e') {
      // Blue edge strip with a visible left-border accent.
      handle.style.width = '6px';
      handle.style.height = '100%';
      handle.style.background = 'rgba(25, 118, 210, 0.18)';
      handle.style.borderLeft = '3px solid rgba(25, 118, 210, 0.55)';
      handle.style.right = '0';
      handle.style.top = '0';
    } else if (dir === 'w') {
      handle.style.width = '6px';
      handle.style.height = '100%';
      handle.style.background = 'rgba(25, 118, 210, 0.18)';
      handle.style.borderRight = '3px solid rgba(25, 118, 210, 0.55)';
      handle.style.left = '0';
      handle.style.top = '0';
    } else if (dir === 's') {
      // Blue bottom strip with a visible top-border accent.
      handle.style.width = '100%';
      handle.style.height = '6px';
      handle.style.background = 'rgba(25, 118, 210, 0.18)';
      handle.style.borderTop = '3px solid rgba(25, 118, 210, 0.55)';
      handle.style.bottom = '0';
      handle.style.left = '0';
    } else if (dir === 'n') {
      handle.style.width = '100%';
      handle.style.height = '6px';
      handle.style.background = 'rgba(25, 118, 210, 0.18)';
      handle.style.borderBottom = '3px solid rgba(25, 118, 210, 0.55)';
      handle.style.top = '0';
      handle.style.left = '0';
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
