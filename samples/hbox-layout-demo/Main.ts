import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { Panel, Viewport } from '@framesquared/ui';
import { ModernTheme } from '@framesquared/theme';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** A small labeled box used as an hbox child. */
function box(title: string, flex?: number, width?: number): Panel {
  return new Panel({
    title,
    ...(flex !== undefined ? { flex } : {}),
    ...(width !== undefined ? { width } : {}),
  });
}

/**
 * A container Panel whose body is an hbox row.
 * bodyPadding: 0 so the full height is available to child panels.
 */
function hboxRow(
  overrides: Record<string, unknown>,
  items: Panel[],
  height: number,
): Panel {
  return new Panel({
    layout: { type: 'hbox', align: 'stretch', gap: 8, ...overrides },
    height,
    bodyPadding: 0,
    items,
  });
}

// ── Section builders ──────────────────────────────────────────────────────────

function packSection(): Panel {
  return new Panel({
    title: 'Pack (justify-content) — start / center / end',
    layout: { type: 'vbox', align: 'stretch', gap: 8 },
    items: [
      hboxRow({ pack: 'start' },  [box('A', undefined, 100), box('B', undefined, 100), box('C', undefined, 100)], 90),
      hboxRow({ pack: 'center' }, [box('A', undefined, 100), box('B', undefined, 100), box('C', undefined, 100)], 90),
      hboxRow({ pack: 'end' },    [box('A', undefined, 100), box('B', undefined, 100), box('C', undefined, 100)], 90),
    ],
  });
}

function alignSection(): Panel {
  return new Panel({
    title: 'Align (align-items) — start / center / stretch',
    layout: { type: 'vbox', align: 'stretch', gap: 8 },
    items: [
      // align: 'start' — children sit at top of the row
      hboxRow({ align: 'start' },   [box('start',   undefined, 120), box('start',   undefined, 120), box('start',   undefined, 120)], 110),
      // align: 'center' — children float to the middle
      hboxRow({ align: 'center' },  [box('center',  undefined, 120), box('center',  undefined, 120), box('center',  undefined, 120)], 110),
      // align: 'stretch' — children fill the full row height
      hboxRow({ align: 'stretch' }, [box('stretch', undefined, 120), box('stretch', undefined, 120), box('stretch', undefined, 120)], 110),
    ],
  });
}

function flexSection(): Panel {
  // This panel has a title header (~36px). bodyPadding: 0 so the remaining
  // height is fully available to the three flex children.
  return new Panel({
    title: 'Flex ratios — 1 : 2 : 3',
    layout: { type: 'hbox', align: 'stretch', gap: 8 },
    height: 130,
    bodyPadding: 0,
    items: [
      box('flex: 1', 1),
      box('flex: 2', 2),
      box('flex: 3', 3),
    ],
  });
}

// ── Application ───────────────────────────────────────────────────────────────

class HBoxDemoApp extends Application {
  constructor() {
    super({ name: 'HBoxLayoutDemo', theme: ModernTheme });
  }

  override launch(): void {
    new Viewport({
      layout: { type: 'vbox', align: 'stretch' },
      items: [
        new Panel({ title: 'HBox Layout Demo — framesquared', height: 48 }),

        // Scrollable content area
        new Panel({
          flex: 1,
          layout: { type: 'vbox', align: 'stretch', gap: 24, overflow: 'scroll' },
          bodyPadding: 16,
          items: [
            packSection(),
            alignSection(),
            flexSection(),
          ],
        }),
      ],
    });
  }
}

new HBoxDemoApp().start();
