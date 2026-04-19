/**
 * @framesquared/layout – ColumnLayout
 *
 * Arranges children in columns.  Items with `columnWidth` (0–1) receive a
 * pixel width equal to that fraction of the space remaining after all
 * fixed-width siblings are accounted for.  Fixed-width items keep their
 * configured pixel width.  Uses CSS Flexbox with wrap.
 *
 * Alias: 'column'
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Component } from '@framesquared/component';
import { Layout } from './Layout.js';
import type { LayoutConfig } from './Layout.js';

export class ColumnLayout extends Layout {
  private _resizeObserver: ResizeObserver | null = null;

  constructor(config: LayoutConfig = {}) {
    super({ ...config, type: 'column' });
  }

  configureContainer(el: HTMLElement): void {
    el.style.display = 'flex';
    el.style.flexWrap = 'wrap';
    el.style.alignItems = 'flex-start';
  }

  /**
   * Compute and apply pixel widths for all column children.
   *
   * @param containerWidth - explicit container width in px.  When omitted the
   *   method reads clientWidth from the target element.  Pass an explicit value
   *   from tests or doLayoutWithWidth() so the method is usable under jsdom,
   *   where clientWidth is always 0.
   */
  applyItemStyles(
    items: Component[],
    target: Element,
    containerWidth?: number,
  ): void {
    const cw =
      containerWidth !== undefined
        ? containerWidth
        : (target as HTMLElement).clientWidth;

    // 1. Sum widths of all fixed items so fluid columns share only what remains.
    let fixedTotal = 0;
    for (const item of items) {
      const cfg = (item as any)._config ?? {};
      if (cfg.columnWidth === undefined && cfg.width !== undefined) {
        fixedTotal +=
          typeof cfg.width === 'number' ? cfg.width : parseInt(String(cfg.width), 10);
      }
    }

    const remaining = Math.max(0, cw - fixedTotal);

    // 2. Apply per-item styles.
    for (const item of items) {
      const el = item.el;
      if (!el) continue;
      const cfg = (item as any)._config ?? {};
      const colW = cfg.columnWidth as number | undefined;

      if (colW !== undefined && colW > 0 && colW <= 1) {
        el.style.width      = `${Math.round(remaining * colW)}px`;
        el.style.boxSizing  = 'border-box';
        el.style.flexShrink = '0';
      } else if (cfg.width !== undefined) {
        const px =
          typeof cfg.width === 'number' ? cfg.width : parseInt(String(cfg.width), 10);
        el.style.width      = `${px}px`;
        el.style.flexShrink = '0';
      }
    }
  }

  override renderItems(items: Component[], target: Element): void {
    this.configureContainer(target as HTMLElement);
    super.renderItems(items, target);
    // Container.add() calls renderItems([singleChild], body) once per child.
    // Using only the passed array means fixedTotal is incomplete and the
    // ResizeObserver closure captures a stale partial list (last child wins).
    // Always resolve the full sibling list from the owner instead.
    const allItems: Component[] = (this.owner as any)?.getItems?.() ?? items;
    this.applyItemStyles(allItems, target);
    this._wireResizeObserver(allItems, target);
  }

  // Called by Container.doLayout() — re-runs the calculation with live width.
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
