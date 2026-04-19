/**
 * App.ts — Layout Gallery entry point.
 *
 * Demonstrates every layout type available in @framesquared/layout:
 *
 *   Border    — the Viewport itself; north/south/east/west/center regions
 *   HBox      — flex distribution, pack, align variants        (center panel)
 *   VBox      — cross-axis alignment and pack variants          (center panel)
 *   Fit       — single child fills 100%                         (center panel)
 *   Card      — wizard / step-by-step navigation                (center panel)
 *   Accordion — collapsible sections, one open at a time        (west region)
 *   Table     — CSS Grid with colspan / rowspan                  (center panel)
 *   Column    — proportional columnWidth fractions               (east region)
 */

import { Application } from '@framesquared/app';
import { Viewport, Panel } from '@framesquared/ui';
import { ModernTheme } from '@framesquared/theme';

// Importing from @framesquared/layout registers all layout aliases ('border',
// 'hbox', 'vbox', 'fit', 'card', 'table', 'column', 'accordion', …) as a
// module-level side effect. LayoutContainer also imports it for CardLayout,
// but this explicit import documents the dependency clearly.
import '@framesquared/layout';

import {
  HBoxDemoPanel,
  VBoxDemoPanel,
  FitDemoPanel,
  CardDemoPanel,
  AccordionDemoPanel,
  TableDemoPanel,
  ColumnDemoPanel,
} from './LayoutContainer';

class LayoutGalleryApp extends Application {
  constructor() {
    super({ name: 'LayoutGallery', theme: ModernTheme });
  }

  override launch(): void {
    new Viewport({
      // ── Border Layout ────────────────────────────────────────────────────
      // The Viewport itself IS the Border layout demo. All five regions
      // (north, south, east, west, center) are populated below.
      layout: 'border',

      items: [
        // ── North ───────────────────────────────────────────────────────────
        new Panel({
          region: 'north',
          title: 'framesquared Layout Gallery',
          height: 52,
        }),

        // ── South ───────────────────────────────────────────────────────────
        new Panel({
          region: 'south',
          title: 'Layout types: Border · HBox · VBox · Fit · Card · Accordion · Table · Column',
          height: 32,
        }),

        // ── West — Accordion Layout demo ────────────────────────────────────
        // AccordionDemoPanel wraps the Accordion UI component.  Clicking any
        // section header expands it and collapses the others (single mode).
        new AccordionDemoPanel({
          region: 'west',
          width: 240,
        }),

        // ── East — Column Layout demo ────────────────────────────────────────
        // ColumnDemoPanel uses ColumnLayout with various columnWidth fractions
        // (1.0, 0.5, 0.33 …) to produce a proportional multi-column grid.
        new ColumnDemoPanel({
          region: 'east',
          width: 240,
        }),

        // ── Center — Box, Fit, Card, Table demos stacked in a scrollable VBox
        new Panel({
          region: 'center',
          title: 'Box · Fit · Card · Table Layouts',
          // overflow: 'scroll' sets overflow:auto on the panel body so the
          // fixed-height demo sections scroll when they exceed the viewport.
          layout: { type: 'vbox', align: 'stretch', overflow: 'scroll' },
          items: [
            new HBoxDemoPanel({ height: 260 }),
            new VBoxDemoPanel({ height: 240 }),
            new FitDemoPanel({ height: 160 }),
            new CardDemoPanel({ height: 280 }),
            new TableDemoPanel({ height: 240 }),
          ],
        }),
      ],
    });
  }
}

new LayoutGalleryApp().start();
