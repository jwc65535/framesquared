import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { Panel, Viewport } from '@framesquared/ui';
import { ModernTheme } from '@framesquared/theme';

// ── Helpers ───────────────────────────────────────────────────────────────────

function absolutePanel(
  title: string,
  x: number,
  y: number,
  extra: Record<string, unknown> = {},
): Panel {
  return new Panel({ title, x, y, width: 200, height: 120, ...extra });
}

// ── Application ───────────────────────────────────────────────────────────────

class AbsoluteLayoutDemoApp extends Application {
  constructor() {
    super({ name: 'AbsoluteLayoutDemo', theme: ModernTheme });
  }

  override launch(): void {
    // Panel C — held by reference so setPosition() can be called after render
    const dynamicPanel = absolutePanel('Panel C — Dynamic (moves to 400, 280)', 300, 200);

    new Viewport({
      layout: { type: 'vbox', align: 'stretch' },
      items: [
        new Panel({ title: 'Absolute Layout Demo — framesquared', height: 48 }),

        new Panel({
          flex: 1,
          bodyPadding: 24,
          items: [
            new Panel({
              title: 'Absolute Canvas (700 × 500)',
              layout: 'absolute',
              width: 700,
              height: 500,
              items: [
                // Panel A: anchored at the required (50, 50) coordinate
                absolutePanel('Panel A — x:50, y:50', 50, 50),

                // Panel B: overlaps Panel A; raised above it via z-index
                absolutePanel('Panel B — Overlap (z-index: 10)', 120, 100, {
                  style: { zIndex: '10' },
                }),

                // Panel C: initial position (300, 200); relocated after render
                dynamicPanel,
              ],
            }),
          ],
        }),
      ],
    });

    // Runtime repositioning — demonstrates setPosition() on an already-rendered component
    dynamicPanel.setPosition(400, 280);
  }
}

new AbsoluteLayoutDemoApp().start();
