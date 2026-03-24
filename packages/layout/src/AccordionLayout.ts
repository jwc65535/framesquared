/**
 * @framesquared/layout – AccordionLayout
 *
 * Vertical stack where only one item is expanded at a time
 * (or multiple with multi:true).  Expanded items get flex:1
 * when fill:true.  Collapsed items show only their header.
 *
 * Alias: 'accordion'
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Component } from '@framesquared/component';
import { Layout } from './Layout.js';
import type { LayoutConfig } from './Layout.js';

export interface AccordionLayoutConfig extends LayoutConfig {
  multi?: boolean;
  fill?: boolean;
  animate?: boolean;
}

export class AccordionLayout extends Layout {
  private multi: boolean;
  private fill: boolean;
  private expandedSet = new WeakSet<Component>();

  constructor(config: AccordionLayoutConfig = {}) {
    super({ ...config, type: 'accordion' });
    this.multi = config.multi ?? false;
    this.fill = config.fill ?? true;
  }

  configureContainer(el: HTMLElement): void {
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.overflow = 'hidden';
  }

  applyItemStyles(items: Component[], _target: Element): void {
    // Expand first item by default if none expanded
    if (items.length > 0 && !items.some(i => this.expandedSet.has(i))) {
      this.expandedSet.add(items[0]);
    }

    for (const item of items) {
      this.applyExpansionState(item);
    }
  }

  override renderItems(items: Component[], target: Element): void {
    this.configureContainer(target as HTMLElement);
    super.renderItems(items, target);
    this.applyItemStyles(items, target);
  }

  // -- Public API --

  isExpanded(item: Component): boolean {
    return this.expandedSet.has(item);
  }

  expand(item: Component): void {
    if (!this.multi) {
      // Collapse all others
      for (const other of this.getOwnerItems()) {
        if (other !== item) {
          this.expandedSet.delete(other);
          this.applyExpansionState(other);
        }
      }
    }
    this.expandedSet.add(item);
    this.applyExpansionState(item);
  }

  collapse(item: Component): void {
    this.expandedSet.delete(item);
    this.applyExpansionState(item);
  }

  toggle(item: Component): void {
    if (this.isExpanded(item)) {
      this.collapse(item);
    } else {
      this.expand(item);
    }
  }

  // -- Internal --

  private applyExpansionState(item: Component): void {
    const el = item.el;
    if (!el) return;
    const expanded = this.expandedSet.has(item);

    if (expanded) {
      el.style.flexGrow = this.fill ? '1' : '0';
      el.style.flexShrink = '0';
      el.style.overflow = '';
      el.classList.remove('x-accordion-collapsed');
      el.classList.add('x-accordion-expanded');
    } else {
      el.style.flexGrow = '0';
      el.style.flexShrink = '0';
      el.style.overflow = 'hidden';
      el.classList.remove('x-accordion-expanded');
      el.classList.add('x-accordion-collapsed');
    }
  }

  private getOwnerItems(): Component[] {
    return (this.owner as any)?.getItems?.() ?? [];
  }
}
