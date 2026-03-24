/**
 * @ext-ts/dd – Sortable
 *
 * Makes items within a container sortable by drag.
 * Provides moveItem() for programmatic reordering
 * and fires sort/start/end events.
 */

export interface SortableConfig {
  el: HTMLElement;
  itemSelector: string;
  handle?: string;
  axis?: 'x' | 'y';
  group?: string;
  ghostClass?: string;
  onSort?: (oldIndex: number, newIndex: number) => void;
  onStart?: (index: number) => void;
  onEnd?: (index: number) => void;
}

export class Sortable {
  private el: HTMLElement;
  private itemSelector: string;
  private onSortCb: ((o: number, n: number) => void) | null;
  private onStartCb: ((i: number) => void) | null;
  private onEndCb: ((i: number) => void) | null;

  constructor(config: SortableConfig) {
    this.el = config.el;
    this.itemSelector = config.itemSelector;
    this.onSortCb = config.onSort ?? null;
    this.onStartCb = config.onStart ?? null;
    this.onEndCb = config.onEnd ?? null;
  }

  getItems(): HTMLElement[] {
    return Array.from(this.el.querySelectorAll(this.itemSelector));
  }

  getOrder(): string[] {
    return this.getItems().map(el => el.textContent ?? '');
  }

  moveItem(fromIndex: number, toIndex: number): void {
    const items = this.getItems();
    if (fromIndex < 0 || fromIndex >= items.length) return;
    if (toIndex < 0 || toIndex >= items.length) return;
    if (fromIndex === toIndex) return;

    this.onStartCb?.(fromIndex);

    const item = items[fromIndex];
    // Remove from current position
    item.parentNode!.removeChild(item);

    // Re-query after removal
    const remaining = this.getItems();
    if (toIndex >= remaining.length) {
      this.el.appendChild(item);
    } else {
      this.el.insertBefore(item, remaining[toIndex]);
    }

    this.onSortCb?.(fromIndex, toIndex);
    this.onEndCb?.(toIndex);
  }

  destroy(): void {
    this.onSortCb = null;
    this.onStartCb = null;
    this.onEndCb = null;
  }
}
