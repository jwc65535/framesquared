/**
 * LayoutContainer.ts
 *
 * One exported Panel subclass per layout type. Each class is self-contained:
 * it declares its own items and layout config, then merges caller-supplied
 * overrides (region, width, height, flex, etc.) at the end of the config
 * spread so the caller only needs to provide positioning context.
 */

import { Panel, Button, Accordion } from '@framesquared/ui';
import type { PanelConfig } from '@framesquared/ui';
import { CardLayout } from '@framesquared/layout';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Merges caller overrides into a base PanelConfig without TypeScript fighting
 *  the index-signature spread. */
function merge(base: PanelConfig, overrides: Record<string, unknown>): PanelConfig {
  return { ...base, ...overrides } as PanelConfig;
}

// ============================================================================
// HBox Demo
// ============================================================================

export class HBoxDemoPanel extends Panel {
  constructor(overrides: Record<string, unknown> = {}) {
    super(merge({
      title: 'HBox Layout',
      layout: { type: 'vbox', align: 'stretch', gap: 6 },
      bodyPadding: 8,
      items: [
        // Row 1 — flex proportional distribution
        new Panel({
          title: 'flex distribution  ·  gap: 8',
          height: 60,
          layout: { type: 'hbox', align: 'stretch', gap: 8 },
          items: [
            new Button({ text: 'flex = 1', flex: 1 }),
            new Button({ text: 'flex = 2  (double width)', flex: 2 }),
            new Button({ text: 'flex = 1', flex: 1 }),
          ],
        }),
        // Row 2 — pack: center, fixed-size buttons
        new Panel({
          title: 'pack: center  ·  align: center',
          height: 60,
          layout: { type: 'hbox', pack: 'center', align: 'center', gap: 8 },
          items: [
            new Button({ text: 'Alpha' }),
            new Button({ text: 'Beta' }),
            new Button({ text: 'Gamma' }),
          ],
        }),
        // Row 3 — pack: space-between
        new Panel({
          title: 'pack: space-between  ·  align: center',
          height: 60,
          layout: { type: 'hbox', pack: 'space-between', align: 'center' },
          items: [
            new Button({ text: 'Start' }),
            new Button({ text: 'Middle' }),
            new Button({ text: 'End' }),
          ],
        }),
      ],
    }, overrides));
  }
}

// ============================================================================
// VBox Demo
// ============================================================================

export class VBoxDemoPanel extends Panel {
  constructor(overrides: Record<string, unknown> = {}) {
    super(merge({
      title: 'VBox Layout',
      layout: { type: 'hbox', align: 'stretch', gap: 6 },
      bodyPadding: 8,
      items: [
        new Panel({
          title: 'align: start',
          flex: 1,
          layout: { type: 'vbox', align: 'start', gap: 4 },
          bodyPadding: 4,
          items: [
            new Button({ text: 'Alpha' }),
            new Button({ text: 'Beta' }),
            new Button({ text: 'Gamma' }),
          ],
        }),
        new Panel({
          title: 'align: center',
          flex: 1,
          layout: { type: 'vbox', align: 'center', gap: 4 },
          bodyPadding: 4,
          items: [
            new Button({ text: 'Alpha' }),
            new Button({ text: 'Beta' }),
            new Button({ text: 'Gamma' }),
          ],
        }),
        new Panel({
          title: 'align: stretch  pack: center',
          flex: 1,
          layout: { type: 'vbox', align: 'stretch', pack: 'center', gap: 4 },
          bodyPadding: 4,
          items: [
            new Button({ text: 'Alpha' }),
            new Button({ text: 'Beta' }),
            new Button({ text: 'Gamma' }),
          ],
        }),
        new Panel({
          title: 'align: end  pack: end',
          flex: 1,
          layout: { type: 'vbox', align: 'end', pack: 'end', gap: 4 },
          bodyPadding: 4,
          items: [
            new Button({ text: 'Alpha' }),
            new Button({ text: 'Beta' }),
            new Button({ text: 'Gamma' }),
          ],
        }),
      ],
    }, overrides));
  }
}

// ============================================================================
// Fit Demo
// ============================================================================

export class FitDemoPanel extends Panel {
  constructor(overrides: Record<string, unknown> = {}) {
    super(merge({
      title: 'Fit Layout  ·  single child fills 100% of its container',
      layout: 'fit',
      items: [
        new Panel({
          title: 'I fill my parent completely (100% width × height)',
          layout: { type: 'hbox', pack: 'center', align: 'center' },
          items: [
            new Button({ text: 'Centered via HBox inside a Fit child' }),
          ],
        }),
      ],
    }, overrides));
  }
}

// ============================================================================
// Card (Wizard) Demo
// ============================================================================

export class CardDemoPanel extends Panel {
  constructor(overrides: Record<string, unknown> = {}) {
    // Build the card container first so the navigation buttons can close over it.
    const cardCt = new Panel({
      layout: { type: 'card', activeItem: 0 },
      flex: 1,
      items: [
        new Panel({
          title: 'Step 1 of 3 — Introduction',
          layout: { type: 'hbox', pack: 'center', align: 'center' },
          items: [new Button({ text: 'Welcome to Card Layout' })],
        }),
        new Panel({
          title: 'Step 2 of 3 — Configuration',
          layout: { type: 'hbox', pack: 'center', align: 'center' },
          items: [new Button({ text: 'Adjust your settings' })],
        }),
        new Panel({
          title: 'Step 3 of 3 — Complete',
          layout: { type: 'hbox', pack: 'center', align: 'center' },
          items: [new Button({ text: 'All done — setup complete!' })],
        }),
      ],
    });

    // Deferred accessor: getLayout() is safe to call after render.
    const card = (): CardLayout => cardCt.getLayout() as unknown as CardLayout;

    super(merge({
      title: 'Card Layout  ·  wizard / step-by-step pattern',
      layout: { type: 'vbox', align: 'stretch' },
      items: [
        cardCt,
        // Navigation bar docked at the bottom of this panel
        new Panel({
          layout: { type: 'hbox', pack: 'space-between', align: 'center' },
          height: 44,
          border: false,
          items: [
            new Button({ text: '← Previous', handler: () => card().prev() }),
            new Button({ text: 'Next →',     handler: () => card().next() }),
          ],
        }),
      ],
    }, overrides));
  }
}

// ============================================================================
// Accordion Demo
// ============================================================================

export class AccordionDemoPanel extends Panel {
  constructor(overrides: Record<string, unknown> = {}) {
    super(merge({
      title: 'Accordion Layout',
      // Fit fills the Accordion component into the entire panel body.
      layout: 'fit',
      items: [
        // Accordion (from @framesquared/ui) manages its own section DOM,
        // wires header-click handlers, and shows/hides section bodies.
        // Each item's `title` config supplies the section header text.
        // `header: false` on each Panel suppresses its own Panel header
        // so only the Accordion's generated header is visible.
        new Accordion({
          items: [
            new Panel({
              title: 'Navigation',
              header: false,
              layout: { type: 'vbox', align: 'stretch', gap: 4 },
              bodyPadding: 8,
              items: [
                new Button({ text: 'Dashboard' }),
                new Button({ text: 'Projects' }),
                new Button({ text: 'Reports' }),
                new Button({ text: 'Analytics' }),
              ],
            }),
            new Panel({
              title: 'Properties',
              header: false,
              layout: { type: 'vbox', align: 'stretch', gap: 4 },
              bodyPadding: 8,
              items: [
                new Button({ text: 'Dimensions' }),
                new Button({ text: 'Typography' }),
                new Button({ text: 'Colors' }),
              ],
            }),
            new Panel({
              title: 'Actions',
              header: false,
              layout: { type: 'vbox', align: 'stretch', gap: 4 },
              bodyPadding: 8,
              items: [
                new Button({ text: 'Save' }),
                new Button({ text: 'Export' }),
                new Button({ text: 'Share' }),
                new Button({ text: 'Archive' }),
              ],
            }),
          ],
        }),
      ],
    }, overrides));
  }
}

// ============================================================================
// Table Demo
// ============================================================================

export class TableDemoPanel extends Panel {
  constructor(overrides: Record<string, unknown> = {}) {
    super(merge({
      title: 'Table Layout  ·  3 columns with colspan and rowspan',
      layout: { type: 'table', columns: 3 },
      bodyPadding: 8,
      items: [
        new Panel({ title: 'A  (colspan: 2)', colspan: 2 }),
        new Panel({ title: 'B' }),
        new Panel({ title: 'C' }),
        new Panel({ title: 'D' }),
        new Panel({ title: 'E  (colspan: 3)', colspan: 3 }),
        new Panel({ title: 'F' }),
        new Panel({ title: 'G  (rowspan: 2)', rowspan: 2 }),
        new Panel({ title: 'H' }),
        new Panel({ title: 'I' }),
      ],
    }, overrides));
  }
}

// ============================================================================
// Column Demo
// ============================================================================

export class ColumnDemoPanel extends Panel {
  constructor(overrides: Record<string, unknown> = {}) {
    super(merge({
      title: 'Column Layout  ·  columnWidth fractions',
      layout: 'column',
      bodyPadding: 4,
      items: [
        new Panel({ title: 'Full width  (1.0)',  columnWidth: 1    }),
        new Panel({ title: 'Half  (0.5)',        columnWidth: 0.5  }),
        new Panel({ title: 'Half  (0.5)',        columnWidth: 0.5  }),
        new Panel({ title: '1/3  (0.33)',        columnWidth: 0.33 }),
        new Panel({ title: '1/3  (0.33)',        columnWidth: 0.33 }),
        new Panel({ title: '1/3  (0.34)',        columnWidth: 0.34 }),
      ],
    }, overrides));
  }
}
