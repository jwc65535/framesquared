import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { Panel, Viewport } from '@framesquared/ui';
import { ModernTheme } from '@framesquared/theme';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Builds a titled anchor child with an explicit anchor string.
 * Width and height are always driven by the anchor — never by fixed pixel values.
 */
function anchorChild(title: string, anchor: string, extra: Record<string, unknown> = {}): Panel {
  return new Panel({ title, anchor, ...extra });
}

// ── Application ───────────────────────────────────────────────────────────────

class AnchorLayoutDemoApp extends Application {
  constructor() {
    super({ name: 'AnchorLayoutDemo', theme: ModernTheme });
  }

  override launch(): void {
    // ── Child C: a nested anchor panel ────────────────────────────────────────
    // The inner panel fills Child C completely; as the outer canvas (flex:1)
    // grows or shrinks with the viewport, CSS propagates through both anchor
    // levels automatically — no JavaScript listener required.
    const childC = anchorChild(
      'Child C — Nested Anchor (75% wide, 30% tall)',
      '75% 30%',
      {
        layout: 'anchor',
        items: [
          anchorChild(
            'Inner — fills Child C via anchor "100% 100%"',
            '100% 100%',
          ),
        ],
      },
    );

    // ── Anchor canvas: one container, three anchor children ───────────────────
    // flex:1 makes the canvas fill the available viewport height so that all
    // percentage-based anchor values remain meaningful as the window resizes.
    const anchorCanvas = new Panel({
      title: 'Anchor Canvas — layout: "anchor"',
      layout: 'anchor',
      flex: 1,
      // Allow scrolling when the three stacked children exceed the canvas height
      bodyStyle: { overflowY: 'auto' },
      items: [
        // Child A: always 100% wide; takes 20% of the canvas height
        anchorChild('Child A — anchor: "100% 20%"  (100% wide, 20% tall)', '100% 20%'),

        // Child B: always 100% wide; height = canvas height − 50 px
        // Demonstrates the negative-offset syntax: anchor: '100% -N'
        anchorChild('Child B — anchor: "100% -50"  (100% wide, calc(100% − 50px) tall)', '100% -50'),

        // Child C: 75% wide, 30% tall; has its own nested anchor layout
        childC,
      ],
    });

    // ── Viewport ──────────────────────────────────────────────────────────────
    new Viewport({
      layout: { type: 'vbox', align: 'stretch' },
      items: [
        new Panel({
          title: 'Anchor Layout Demo — framesquared',
          height: 48,
        }),

        new Panel({
          flex: 1,
          layout: { type: 'vbox', align: 'stretch' },
          bodyPadding: 16,
          items: [anchorCanvas],
        }),
      ],
    });
  }
}

new AnchorLayoutDemoApp().start();
