/**
 * @framesquared/layout – BorderLayout
 *
 * Classic border layout with 5 regions: north, south, east, west, center.
 * Uses CSS Grid under the hood.  Center is required and fills remaining space.
 *
 * Alias: 'border'
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Component } from '@framesquared/component';
import { Layout } from './Layout.js';
import type { LayoutConfig } from './Layout.js';

export interface BorderLayoutConfig extends LayoutConfig {
  split?: boolean;
}

type Region = 'north' | 'south' | 'east' | 'west' | 'center';

export class BorderLayout extends Layout {
  constructor(config: BorderLayoutConfig = {}) {
    super({ ...config, type: 'border' });
  }

  configureContainer(el: HTMLElement): void {
    el.style.display = 'grid';
    el.style.width = '100%';
    el.style.height = '100%';
  }

  applyItemStyles(items: Component[], target: Element): void {
    // Determine which regions exist
    const regions = new Map<Region, Component>();
    for (const item of items) {
      const region = (item as any)._config?.region as Region | undefined;
      if (region) regions.set(region, item);
    }

    // Build grid template
    const rows: string[] = [];
    const areas: string[][] = [];

    const hasNorth = regions.has('north');
    const hasSouth = regions.has('south');
    const hasWest = regions.has('west');
    const hasEast = regions.has('east');

    // Determine column sizes
    const colSizes: string[] = [];
    if (hasWest) {
      const w = (regions.get('west') as any)?._config?.width;
      colSizes.push(w ? `${w}px` : '200px');
    }
    colSizes.push('1fr'); // center
    if (hasEast) {
      const w = (regions.get('east') as any)?._config?.width;
      colSizes.push(w ? `${w}px` : '200px');
    }

    const cols = colSizes.length;

    // North row
    if (hasNorth) {
      const h = (regions.get('north') as any)?._config?.height;
      rows.push(h ? `${h}px` : 'auto');
      areas.push(Array(cols).fill('north'));
    }

    // Middle row (west / center / east)
    rows.push('1fr');
    const middleRow: string[] = [];
    if (hasWest) middleRow.push('west');
    middleRow.push('center');
    if (hasEast) middleRow.push('east');
    areas.push(middleRow);

    // South row
    if (hasSouth) {
      const h = (regions.get('south') as any)?._config?.height;
      rows.push(h ? `${h}px` : 'auto');
      areas.push(Array(cols).fill('south'));
    }

    const el = target as HTMLElement;
    el.style.gridTemplateRows = rows.join(' ');
    el.style.gridTemplateColumns = colSizes.join(' ');
    el.style.gridTemplateAreas = areas.map(r => `"${r.join(' ')}"`).join(' ');

    // Apply grid-area to each child
    for (const item of items) {
      const itemEl = item.el;
      if (!itemEl) continue;
      const region = (item as any)._config?.region as Region | undefined;
      if (region) {
        itemEl.style.gridArea = region;
      }
    }
  }

  override renderItems(items: Component[], target: Element): void {
    this.configureContainer(target as HTMLElement);
    super.renderItems(items, target);
    this.applyItemStyles(items, target);
  }
}
