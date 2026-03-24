/**
 * @framesquared/dd – DragProxy
 * Visual feedback during drag — a ghost element that follows the cursor.
 */

export interface DragProxyConfig {
  sourceEl: HTMLElement;
  ghostCls?: string;
}

export class DragProxy {
  private ghostEl: HTMLElement | null = null;
  private ghostCls: string;
  private sourceEl: HTMLElement;

  constructor(config: DragProxyConfig) {
    this.sourceEl = config.sourceEl;
    this.ghostCls = config.ghostCls ?? 'x-dd-ghost';
  }

  show(x: number, y: number): void {
    if (this.ghostEl) this.hide();
    this.ghostEl = document.createElement('div');
    this.ghostEl.classList.add(this.ghostCls);
    this.ghostEl.style.position = 'fixed';
    this.ghostEl.style.pointerEvents = 'none';
    this.ghostEl.style.zIndex = '99999';
    this.ghostEl.style.opacity = '0.7';
    this.ghostEl.style.left = `${x}px`;
    this.ghostEl.style.top = `${y}px`;

    const rect = this.sourceEl.getBoundingClientRect();
    this.ghostEl.style.width = `${rect.width || 40}px`;
    this.ghostEl.style.height = `${rect.height || 40}px`;

    document.body.appendChild(this.ghostEl);
  }

  moveTo(x: number, y: number): void {
    if (!this.ghostEl) return;
    this.ghostEl.style.left = `${x}px`;
    this.ghostEl.style.top = `${y}px`;
  }

  setStatus(valid: boolean): void {
    if (!this.ghostEl) return;
    this.ghostEl.classList.toggle('x-dd-drop-ok', valid);
    this.ghostEl.classList.toggle('x-dd-drop-nodrop', !valid);
  }

  hide(): void {
    if (this.ghostEl?.parentNode) {
      this.ghostEl.parentNode.removeChild(this.ghostEl);
    }
    this.ghostEl = null;
  }

  getEl(): HTMLElement | null {
    return this.ghostEl;
  }
}
