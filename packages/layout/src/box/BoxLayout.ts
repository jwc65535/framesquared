/**
 * @ext-ts/layout – BoxLayout (abstract base)
 *
 * Abstract base for HBox and VBox layouts.  Uses CSS Flexbox under
 * the hood: sets display:flex on the container and translates
 * align/pack/gap/reverse/overflow to flex properties.  Child items
 * with `flex` config get flex-grow; fixed-size items get flex-shrink:0.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Component } from '@ext-ts/component';
import { Layout } from '../Layout.js';
import type { SizePolicy, LayoutConfig } from '../Layout.js';
import type { LayoutContext } from '../LayoutContext.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export type BoxAlign = 'start' | 'center' | 'end' | 'stretch' | 'stretchmax';
export type BoxPack = 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
export type BoxOverflow = 'visible' | 'hidden' | 'scroll' | 'wrap';

export interface BoxLayoutConfig extends LayoutConfig {
  align?: BoxAlign;
  pack?: BoxPack;
  gap?: number;
  overflow?: BoxOverflow;
  reverse?: boolean;
}

// ---------------------------------------------------------------------------
// CSS Flexbox mapping
// ---------------------------------------------------------------------------

const ALIGN_MAP: Record<BoxAlign, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  stretchmax: 'stretch',
};

const PACK_MAP: Record<BoxPack, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  'space-between': 'space-between',
  'space-around': 'space-around',
  'space-evenly': 'space-evenly',
};

// ---------------------------------------------------------------------------
// BoxLayout
// ---------------------------------------------------------------------------

export abstract class BoxLayout extends Layout {
  protected align: BoxAlign;
  protected pack: BoxPack;
  protected gap: number;
  protected overflow: BoxOverflow;
  protected reverse: boolean;

  constructor(config: BoxLayoutConfig = {}) {
    super(config);
    this.align = config.align ?? 'stretch';
    this.pack = config.pack ?? 'start';
    this.gap = config.gap ?? 0;
    this.overflow = config.overflow ?? 'visible';
    this.reverse = config.reverse ?? false;
  }

  /**
   * The CSS flex-direction value.  'row' for HBox, 'column' for VBox.
   * Subclasses must implement this.
   */
  protected abstract getDirection(): string;

  /**
   * Returns the primary axis config name for checking fixed size.
   * 'width' for HBox, 'height' for VBox.
   */
  protected abstract getPrimaryAxisProp(): string;

  // -----------------------------------------------------------------------
  // Container configuration
  // -----------------------------------------------------------------------

  /**
   * Applies CSS Flexbox properties to the container element.
   */
  configureContainer(el: HTMLElement): void {
    el.style.display = 'flex';

    const dir = this.getDirection();
    el.style.flexDirection = this.reverse
      ? `${dir}-reverse` as any
      : dir;

    el.style.alignItems = ALIGN_MAP[this.align];
    el.style.justifyContent = PACK_MAP[this.pack];

    if (this.gap > 0) {
      el.style.gap = `${this.gap}px`;
    }

    // Overflow
    switch (this.overflow) {
      case 'wrap':
        el.style.flexWrap = 'wrap';
        break;
      case 'hidden':
        el.style.overflow = 'hidden';
        break;
      case 'scroll':
        el.style.overflow = 'auto';
        break;
      // 'visible' — no special handling
    }
  }

  // -----------------------------------------------------------------------
  // Item styles
  // -----------------------------------------------------------------------

  /**
   * Applies flex CSS properties to each child item based on its config.
   */
  applyItemStyles(items: Component[], _target: Element): void {
    const primaryProp = this.getPrimaryAxisProp();

    for (const item of items) {
      const el = item.el;
      if (!el) continue;
      const cfg = (item as any)._config ?? {};
      const flex = cfg.flex;

      if (flex !== undefined && flex > 0) {
        // Flex item: flex-grow proportional, basis 0 for equal distribution
        el.style.flexGrow = String(flex);
        el.style.flexShrink = '1';
        el.style.flexBasis = '0px';
      } else if (cfg[primaryProp] !== undefined) {
        // Fixed-size item: don't shrink
        el.style.flexShrink = '0';
      }

      // Constraints
      if (cfg.minWidth !== undefined) el.style.minWidth = `${cfg.minWidth}px`;
      if (cfg.maxWidth !== undefined) el.style.maxWidth = `${cfg.maxWidth}px`;
      if (cfg.minHeight !== undefined) el.style.minHeight = `${cfg.minHeight}px`;
      if (cfg.maxHeight !== undefined) el.style.maxHeight = `${cfg.maxHeight}px`;
    }
  }

  // -----------------------------------------------------------------------
  // Layout lifecycle overrides
  // -----------------------------------------------------------------------

  override renderItems(items: Component[], target: Element): void {
    // Ensure container is configured before rendering items
    this.configureContainer(target as HTMLElement);
    super.renderItems(items, target);
    this.applyItemStyles(items, target);
  }

  override calculate(_context: LayoutContext): void {
    // CSS Flexbox handles the actual sizing.
    // This method could be used for reading computed sizes back
    // into the LayoutContext if needed by other layouts.
  }

  // -----------------------------------------------------------------------
  // Size policy
  // -----------------------------------------------------------------------

  override getItemSizePolicy(item: Component): SizePolicy {
    const cfg = (item as any)._config ?? {};
    const primaryProp = this.getPrimaryAxisProp();

    const primaryPolicy = cfg.flex !== undefined
      ? 'shrinkWrap'
      : (cfg[primaryProp] !== undefined ? 'configured' : 'natural');

    const crossProp = primaryProp === 'width' ? 'height' : 'width';
    const crossPolicy = cfg[crossProp] !== undefined ? 'configured' : 'natural';

    if (primaryProp === 'width') {
      return { width: primaryPolicy, height: crossPolicy };
    }
    return { width: crossPolicy, height: primaryPolicy };
  }
}
