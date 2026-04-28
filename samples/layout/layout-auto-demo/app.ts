import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { Panel, Viewport } from '@framesquared/ui';
import { Button } from '@framesquared/ui';
import { ModernTheme } from '@framesquared/theme';

// ── Auto Layout Demo ──────────────────────────────────────────────────────────
//
// Demonstrates five AutoLayout behaviours in a single scrollable container:
//
//   1. Fixed dimensions     — explicit width + height are applied as-is
//   2. Fluid width (100%)   — child fills parent horizontally; CSS auto-resizes
//                             the element when the browser window changes width
//   3. Internal padding     — padding config is applied to the component element
//   4. External margin      — margin config is applied to the component element
//   5. Min/max constraints  — minWidth / maxWidth / minHeight / maxHeight
//
// AutoLayout ("auto") adds no container CSS.  Children flow in normal CSS
// block order — each new child starts below the previous one.
//
// The framework's ResizeObserver fires a "resize" event on every component
// when its element dimensions change, enabling reactive behaviour without
// any layout engine calculation step.
// ─────────────────────────────────────────────────────────────────────────────

class AutoLayoutDemoApp extends Application {
  constructor() {
    super({ name: 'AutoLayoutDemo', theme: ModernTheme });
  }

  override launch(): void {
    new Viewport({
      layout: { type: 'vbox', align: 'stretch' },
      items: [
        // ── Page header ─────────────────────────────────────────────────────
        new Panel({ title: 'Auto Layout Demo — framesquared', height: 48 }),

        // ── Scrollable content area ─────────────────────────────────────────
        new Panel({
          flex: 1,
          layout: { type: 'vbox', align: 'stretch' },
          bodyPadding: 16,
          items: [

            // Section header
            new Panel({ title: 'layout: "auto" — natural CSS block flow', height: 40 }),

            // ── Demo container (the auto-layout parent) ──────────────────────
            new Panel({
              title: 'Auto Layout Container',
              flex: 1,
              layout: 'auto',
              items: [

                // 1. Fixed dimensions
                new Panel({
                  title: 'Fixed Dimensions — width: 400, height: 120',
                  width: 400,
                  height: 120,
                  items: [
                    new Button({ text: 'I am 400 × 120' }),
                  ],
                }),

                // 2. Fluid width — fills container; auto-resizes with browser window
                new Panel({
                  title: 'Fluid Width — width: "100%" (resizes with container)',
                  width: '100%',
                  height: 80,
                  items: [
                    new Button({ text: 'I always fill the full width' }),
                  ],
                }),

                // 3. Internal padding
                new Panel({
                  title: 'Internal Padding — padding: "12px 24px"',
                  width: 360,
                  height: 100,
                  padding: '12px 24px',
                  items: [
                    new Button({ text: 'Padded inset content' }),
                  ],
                }),

                // 4. External margin
                new Panel({
                  title: 'External Margin — margin: 20',
                  width: 340,
                  height: 100,
                  margin: 20,
                  items: [
                    new Button({ text: '20px breathing room around me' }),
                  ],
                }),

                // 5. Min/max constraints
                new Panel({
                  title: 'Min/Max Constraints — minWidth: 200, maxWidth: 640',
                  minWidth: 200,
                  maxWidth: 640,
                  minHeight: 60,
                  maxHeight: 160,
                  items: [
                    new Button({ text: 'My width is clamped between 200px and 640px' }),
                  ],
                }),

              ],
            }),

          ],
        }),
      ],
    });
  }
}

new AutoLayoutDemoApp().start();
