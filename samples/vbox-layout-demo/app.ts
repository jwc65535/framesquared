import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { Panel, Viewport } from '@framesquared/ui';
import { ModernTheme } from '@framesquared/theme';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** A small labeled box used as a vbox child. */
function cell(title: string, height?: number, width?: number): Panel {
  return new Panel({
    title,
    ...(height !== undefined ? { height } : {}),
    ...(width !== undefined ? { width } : {}),
  });
}

/**
 * A container Panel whose body is a vbox column.
 * bodyPadding: 0 so the full height is available to child panels.
 */
function vboxColumn(
  overrides: Record<string, unknown>,
  items: Panel[],
  height: number,
): Panel {
  return new Panel({
    layout: { type: 'vbox', align: 'stretch', gap: 8, ...overrides },
    height,
    bodyPadding: 0,
    items,
  });
}

// ── Section builders ──────────────────────────────────────────────────────────

function flexSection(): Panel {
  return new Panel({
    title: 'Flex ratios — fixed / 1 : 2 / fixed',
    layout: { type: 'vbox', align: 'stretch', gap: 8 },
    height: 340,
    bodyPadding: 0,
    items: [
      cell('height: 60', 60),
      new Panel({ title: 'flex: 1', flex: 1 }),
      new Panel({ title: 'flex: 2', flex: 2 }),
      cell('height: 40', 40),
    ],
  });
}

function packSection(): Panel {
  return new Panel({
    title: 'Pack (justify-content) — start / center / end',
    layout: { type: 'hbox', align: 'stretch', gap: 8 },
    items: [
      vboxColumn({ pack: 'start' },  [cell('A', 60), cell('B', 60), cell('C', 60)], 200),
      vboxColumn({ pack: 'center' }, [cell('A', 60), cell('B', 60), cell('C', 60)], 200),
      vboxColumn({ pack: 'end' },    [cell('A', 60), cell('B', 60), cell('C', 60)], 200),
    ],
  });
}

function alignSection(): Panel {
  return new Panel({
    title: 'Align (align-items) — start / center / stretch',
    layout: { type: 'hbox', align: 'stretch', gap: 8 },
    items: [
      // align: 'start' — children hug the left edge
      vboxColumn({ align: 'start' },   [cell('start', 60, 120),   cell('start', 60, 120)],   160),
      // align: 'center' — children float to the middle horizontally
      vboxColumn({ align: 'center' },  [cell('center', 60, 120),  cell('center', 60, 120)],  160),
      // align: 'stretch' — children fill the full column width
      vboxColumn({ align: 'stretch' }, [cell('stretch', 60),       cell('stretch', 60)],      160),
    ],
  });
}

// ── Application ───────────────────────────────────────────────────────────────

class VBoxDemoApp extends Application {
  constructor() {
    super({ name: 'VBoxLayoutDemo', theme: ModernTheme });
  }

  override launch(): void {
    new Viewport({
      layout: { type: 'vbox', align: 'stretch' },
      items: [
        new Panel({ title: 'VBox Layout Demo — framesquared', height: 48 }),

        // Scrollable content area
        new Panel({
          flex: 1,
          layout: { type: 'vbox', align: 'stretch', gap: 24, overflow: 'scroll' },
          bodyPadding: 16,
          items: [
            flexSection(),
            packSection(),
            alignSection(),
          ],
        }),
      ],
    });
  }
}

new VBoxDemoApp().start();
