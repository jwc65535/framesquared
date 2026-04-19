import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { Panel, Viewport } from '@framesquared/ui';
import { ModernTheme } from '@framesquared/theme';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** A titled column child with a nested content panel. */
function column(
  title: string,
  sizing: { width: number } | { columnWidth: number },
  contentTitle: string,
): Panel {
  return new Panel({
    title,
    ...sizing,
    items: [
      new Panel({ title: contentTitle }),
    ],
  });
}

// ── Application ───────────────────────────────────────────────────────────────

class ColumnLayoutDemoApp extends Application {
  constructor() {
    super({ name: 'ColumnLayoutDemo', theme: ModernTheme });
  }

  override launch(): void {
    new Viewport({
      layout: { type: 'vbox', align: 'stretch' },
      items: [
        new Panel({
          title: 'Column Layout Demo — framesquared',
          height: 48,
        }),

        new Panel({
          flex: 1,
          layout: { type: 'vbox', align: 'stretch' },
          bodyPadding: 16,
          items: [
            // ── Main column container ─────────────────────────────────────
            // Component A: fixed 200 px — never reacts to container resize.
            // Components B and C: each takes half the remaining space after A,
            // computed in JavaScript so the sum always equals the container width.
            new Panel({
              title: 'Column Container — layout: "column"',
              flex: 1,
              layout: 'column',
              items: [
                column(
                  'A — Fixed (width: 200)',
                  { width: 200 },
                  'Fixed column — always 200 px',
                ),
                column(
                  'B — Fluid (columnWidth: 0.5)',
                  { columnWidth: 0.5 },
                  'Fluid column — half the remaining space',
                ),
                column(
                  'C — Fluid (columnWidth: 0.5)',
                  { columnWidth: 0.5 },
                  'Fluid column — half the remaining space',
                ),
              ],
            }),
          ],
        }),
      ],
    });
  }
}

new ColumnLayoutDemoApp().start();
