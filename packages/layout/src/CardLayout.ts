/**
 * @framesquared/layout – CardLayout
 *
 * Like FitLayout but supports multiple children — only one is visible
 * at a time.  Provides next/prev navigation and fires activate/deactivate.
 *
 * Alias: 'card'
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Component } from '@framesquared/component';
import { Layout } from './Layout.js';
import type { LayoutConfig } from './Layout.js';

export interface CardLayoutConfig extends LayoutConfig {
  activeItem?: number;
}

export class CardLayout extends Layout {
  private activeIndex = 0;

  private listeners = new Map<string, Set<(...args: any[]) => void>>();

  constructor(config: CardLayoutConfig = {}) {
    super({ ...config, type: 'card' });
    this.activeIndex = config.activeItem ?? 0;
  }

  /** Subscribe to events. */

  on(event: string, fn: (...args: any[]) => void): void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(fn);
  }

  /** Unsubscribe. */

  un(event: string, fn: (...args: any[]) => void): void {
    this.listeners.get(event)?.delete(fn);
  }

  private fire(name: string, ...args: unknown[]): void {
    const fns = this.listeners.get(name);
    if (fns) for (const fn of fns) fn(...args);
  }

  configureContainer(el: HTMLElement): void {
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
  }

  applyItemStyles(items: Component[], _target: Element): void {
    for (let i = 0; i < items.length; i++) {
      const el = items[i].el;
      if (!el) continue;
      el.style.width = '100%';
      el.style.height = '100%';
      el.style.boxSizing = 'border-box';
      el.style.display = i === this.activeIndex ? '' : 'none';
    }
  }

  override renderItems(items: Component[], target: Element): void {
    this.configureContainer(target as HTMLElement);
    super.renderItems(items, target);
    // Container.add() calls renderItems([singleChild]) once per child, so the
    // passed array is always length 1.  applyItemStyles needs the full list to
    // identify index 0 (visible) vs. index 1+ (hidden).  Resolve from owner —
    // the same fix applied to FitLayout and ColumnLayout.
    const allItems: Component[] = (this.owner as any)?.getItems?.() ?? items;
    this.applyItemStyles(allItems, target);
  }

  // -- Navigation --

  getActiveItem(): Component | undefined {
    return this.getOwnerItems()[this.activeIndex];
  }

  setActiveItem(item: number | Component): void {
    const items = this.getOwnerItems();
    const newIndex = typeof item === 'number' ? item : items.indexOf(item);
    if (newIndex < 0 || newIndex >= items.length || newIndex === this.activeIndex) return;

    const oldItem = items[this.activeIndex];
    const newItem = items[newIndex];

    this.fire('deactivate', oldItem, this);
    if (oldItem.el) oldItem.el.style.display = 'none';

    this.activeIndex = newIndex;
    if (newItem.el) newItem.el.style.display = '';
    this.fire('activate', newItem, this);
  }

  next(): Component {
    const items = this.getOwnerItems();
    const next = (this.activeIndex + 1) % items.length;
    this.setActiveItem(next);
    return items[next];
  }

  prev(): Component {
    const items = this.getOwnerItems();
    const prev = (this.activeIndex - 1 + items.length) % items.length;
    this.setActiveItem(prev);
    return items[prev];
  }

  private getOwnerItems(): Component[] {
    return (this.owner as any)?.getItems?.() ?? [];
  }
}
