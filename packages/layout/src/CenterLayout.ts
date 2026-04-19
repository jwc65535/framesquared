/**
 * @framesquared/layout – CenterLayout
 *
 * Positions a single child component mathematically centred within its owner's
 * body element.  The container becomes `position: relative`; the child is
 * placed with `position: absolute` and left/top computed as:
 *
 *   left = (containerWidth  − childWidth)  / 2
 *   top  = (containerHeight − childHeight) / 2
 *
 * Only the first child is centred; additional children are ignored.
 * A ResizeObserver keeps the offsets current when the container is resized.
 *
 * Alias: 'center'
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Component } from '@framesquared/component';
import { Layout } from './Layout.js';
import type { LayoutConfig } from './Layout.js';

export interface CenterLayoutConfig extends LayoutConfig {
  // No additional options — centering is fully automatic.
}

export class CenterLayout extends Layout {
  private _resizeObserver: ResizeObserver | null = null;

  constructor(config: CenterLayoutConfig = {}) {
    super({ ...config, type: 'center' });
  }

  configureContainer(el: HTMLElement): void {
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
  }

  /**
   * Positions the first child centred within `target`.
   *
   * @param items           - layout children (only index 0 is used)
   * @param target          - the owner's body element
   * @param containerWidth  - explicit px override for jsdom tests
   * @param containerHeight - explicit px override for jsdom tests
   */
  applyItemStyles(
    items: Component[],
    target: Element,
    containerWidth?: number,
    containerHeight?: number,
  ): void {
    const child = items[0];
    if (!child?.el) return;

    const cw = containerWidth  ?? (target as HTMLElement).clientWidth;
    const ch = containerHeight ?? (target as HTMLElement).clientHeight;

    const cfg = (child as any)._config ?? {};
    const childW = typeof cfg.width  === 'number' ? cfg.width  : parseInt(String(cfg.width  ?? '0'), 10);
    const childH = typeof cfg.height === 'number' ? cfg.height : parseInt(String(cfg.height ?? '0'), 10);

    const el = child.el as HTMLElement;
    el.style.position = 'absolute';
    el.style.width    = `${childW}px`;
    el.style.height   = `${childH}px`;
    el.style.left     = `${Math.round((cw - childW) / 2)}px`;
    el.style.top      = `${Math.round((ch - childH) / 2)}px`;
  }

  override renderItems(items: Component[], target: Element): void {
    this.configureContainer(target as HTMLElement);
    super.renderItems(items, target);
    const allItems: Component[] = (this.owner as any)?.getItems?.() ?? items;
    this.applyItemStyles(allItems, target);
    this._wireResizeObserver(allItems, target);
  }

  override doLayout(owner: any): void {
    const body = owner?.getBodyEl?.() as HTMLElement | undefined;
    if (!body) return;
    this.applyItemStyles(owner.getItems() as Component[], body);
  }

  private _wireResizeObserver(items: Component[], target: Element): void {
    if (typeof ResizeObserver === 'undefined') return;
    this._resizeObserver?.disconnect();
    this._resizeObserver = new ResizeObserver(() => {
      this.applyItemStyles(items, target);
    });
    this._resizeObserver.observe(target);
  }
}
