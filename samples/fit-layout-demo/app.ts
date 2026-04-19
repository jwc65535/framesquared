import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { Panel, Viewport } from '@framesquared/ui';
import { Button } from '@framesquared/ui';
import { ModernTheme } from '@framesquared/theme';

// ── Fit Layout Demo ───────────────────────────────────────────────────────────
//
// Demonstrates FitLayout ("fit") — the layout that causes a single child to
// fill its parent's body element entirely.
//
// Structure:
//
//   Viewport  (vbox, align:stretch)
//   ├─ Panel  "Fit Layout Demo — framesquared"   (fixed header, height:48)
//   └─ Panel  (flex:1, vbox wrapper with padding)
//        └─ Panel  "Fit Layout Workspace"        ← layout: 'fit'
//             └─ Panel  "Fit Child"              ← fills 100% × 100%
//                  ├─ Panel  "About Fit Layout"  ← describes the mechanic
//                  └─ Button "Resize Workspace"  ← demonstrates imperativ resize
//
// The "Fit Child" panel receives width:100% and height:100% with
// box-sizing:border-box from FitLayout, so it tracks every dimension change
// of the workspace without any JavaScript recalculation.
// ─────────────────────────────────────────────────────────────────────────────

class FitLayoutDemoApp extends Application {
  constructor() {
    super({ name: 'FitLayoutDemo', theme: ModernTheme });
  }

  override launch(): void {
    // Tracks the current simulated width so the button can cycle sizes.
    let sizeIndex = 0;
    const sizes: Array<{ width: number; height: number }> = [
      { width: 600, height: 420 },
      { width: 900, height: 560 },
      { width: 700, height: 500 },
    ];

    // ── About panel — content inside the fit child ──────────────────────────
    const aboutPanel = new Panel({
      title: 'About Fit Layout',
      flex: 1,
    });

    // ── Action button — imperatively resizes the workspace panel ────────────
    const resizeBtn = new Button({
      text: 'Resize Workspace',
      handler: () => {
        sizeIndex = (sizeIndex + 1) % sizes.length;
        const { width, height } = sizes[sizeIndex];
        workspace.setSize(width, height);
        workspace.setTitle(
          `Fit Layout Workspace — ${width} × ${height}`,
        );
      },
    });

    // ── Fit child — the single item managed by FitLayout ───────────────────
    const fitChild = new Panel({
      title: 'Fit Child (width: 100%, height: 100%)',
      layout: { type: 'vbox', align: 'stretch' },
      items: [aboutPanel, resizeBtn],
    });

    // ── Workspace — the panel that owns the FitLayout ──────────────────────
    const workspace = new Panel({
      title: 'Fit Layout Workspace',
      width: 800,
      height: 500,
      layout: 'fit',
      items: [fitChild],
    });

    // ── Page chrome ─────────────────────────────────────────────────────────
    new Viewport({
      layout: { type: 'vbox', align: 'stretch' },
      items: [
        new Panel({ title: 'Fit Layout Demo — framesquared', height: 48 }),
        new Panel({
          flex: 1,
          layout: { type: 'vbox', align: 'stretch' },
          bodyPadding: 24,
          items: [workspace],
        }),
      ],
    });
  }
}

new FitLayoutDemoApp().start();
