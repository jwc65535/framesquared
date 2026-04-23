/**
 * quicktip-demo — app.ts
 *
 * Demonstrates QuickTipManager (QuickTip singleton) features:
 *
 *   simpleBtn   → qtip config  : basic tooltip via data-qtip
 *   complexBtn  → qtip + qtitle + qwidth : titled, constrained-width tooltip
 *   dismissBtn  → qdismissdelay : tooltip auto-hides after 1.5 seconds
 *   registerBtn → tooltip assigned after render via QuickTipManager.register()
 *   toggleBtn   → calls enable() / disable() and updates statusLabel
 *
 * Architecture:
 *   createQuickTipDemo(host)  — pure factory; testable in isolation
 *   QuickTipDemoApp           — Application subclass; wires factory into Viewport
 *
 * The Application auto-start is guarded so importing this module during Vitest
 * does not trigger the browser launch sequence.
 */

import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { ModernTheme } from '@framesquared/theme';
import { Button, Panel, Viewport, QuickTipManager } from '@framesquared/ui';

// ---------------------------------------------------------------------------
// Public refs interface
// ---------------------------------------------------------------------------

export interface QuickTipDemoRefs {
  simpleBtn:   Button;
  complexBtn:  Button;
  dismissBtn:  Button;
  registerBtn: Button;
  toggleBtn:   Button;
  statusLabel: Button;
}

// ---------------------------------------------------------------------------
// View factory
// ---------------------------------------------------------------------------

export function createQuickTipDemo(host: Element): QuickTipDemoRefs {
  QuickTipManager.init();

  // ── § Tooltip Variants ───────────────────────────────────────────────────

  const simpleBtn = new Button({
    text: 'Simple Tip',
    qtip: 'A simple quick tooltip on hover.',
  });

  const complexBtn = new Button({
    text:    'Complex Tip',
    iconCls: 'x-icon-settings',
    qtip:    'Detailed description with a title and custom width.',
    qtitle:  'Button Details',
    qwidth:  220,
  });

  const dismissBtn = new Button({
    text:          'Auto-Dismiss',
    iconCls:       'x-icon-refresh',
    ui:            'success',
    qtip:          'This tip auto-hides after 1.5 seconds.',
    qdismissdelay: 1500,
  });

  // ── § Dynamic Registration ───────────────────────────────────────────────

  const registerBtn = new Button({
    text:    'Registered Tip',
    iconCls: 'x-icon-add',
    ui:      'default',
  });

  // ── § Global Toggle ──────────────────────────────────────────────────────

  const statusLabel = new Button({
    text: 'QuickTips: enabled',
    cls:  'qtip-status',
  });

  let tipsEnabled = true;

  const toggleBtn = new Button({
    text: 'Disable Tips',
    ui:   'danger',
    handler: () => {
      tipsEnabled = !tipsEnabled;
      if (tipsEnabled) {
        QuickTipManager.enable();
        toggleBtn.setText('Disable Tips');
        toggleBtn.el!.classList.remove('x-btn-success');
        toggleBtn.el!.classList.add('x-btn-danger');
        statusLabel.setText('QuickTips: enabled');
        statusLabel.el!.classList.remove('qtip-status-off');
      } else {
        QuickTipManager.disable();
        toggleBtn.setText('Enable Tips');
        toggleBtn.el!.classList.remove('x-btn-danger');
        toggleBtn.el!.classList.add('x-btn-success');
        statusLabel.setText('QuickTips: disabled');
        statusLabel.el!.classList.add('qtip-status-off');
      }
    },
  });

  // ── Layout ───────────────────────────────────────────────────────────────

  new Panel({
    renderTo: host,
    title:    'QuickTip Demo',
    cls:      'qtip-demo',
    layout:   { type: 'vbox', align: 'stretch' },
    items: [
      // Section 1 — Tooltip Variants
      new Panel({
        title:  'Tooltip Variants',
        cls:    'qtip-section',
        layout: { type: 'vbox', align: 'stretch' },
        items: [
          new Panel({
            title:  'Simple',
            cls:    'qtip-group',
            layout: { type: 'hbox' },
            items:  [simpleBtn],
          }),
          new Panel({
            title:  'With Title & Width',
            cls:    'qtip-group',
            layout: { type: 'hbox' },
            items:  [complexBtn],
          }),
          new Panel({
            title:  'Auto-Dismiss  ·  1.5 s',
            cls:    'qtip-group',
            layout: { type: 'hbox' },
            items:  [dismissBtn],
          }),
        ],
      }),
      // Section 2 — Dynamic Registration
      new Panel({
        title:  'Dynamic Registration',
        cls:    'qtip-section',
        layout: { type: 'vbox', align: 'stretch' },
        items: [
          new Panel({
            title:  'Via register()',
            cls:    'qtip-group',
            layout: { type: 'hbox' },
            items:  [registerBtn],
          }),
        ],
      }),
      // Section 3 — Global Toggle
      new Panel({
        title:  'Global Control',
        cls:    'qtip-section',
        layout: { type: 'vbox', align: 'stretch' },
        items: [
          new Panel({
            title:  'Toggle',
            cls:    'qtip-group',
            layout: { type: 'hbox' },
            items:  [toggleBtn, statusLabel],
          }),
        ],
      }),
    ],
  });

  // Assign tooltip after render so registerBtn.el is available
  QuickTipManager.register({
    target:       registerBtn.el!,
    text:         'Dynamically registered tooltip',
    title:        'Registered Tip',
    dismissDelay: 3000,
  });

  return { simpleBtn, complexBtn, dismissBtn, registerBtn, toggleBtn, statusLabel };
}

// ---------------------------------------------------------------------------
// Application
// ---------------------------------------------------------------------------

class QuickTipDemoApp extends Application {
  constructor() {
    super({ name: 'QuickTipDemo', theme: ModernTheme });
  }

  override launch(): void {
    const vp = new Viewport({ layout: { type: 'vbox', align: 'stretch' } });
    createQuickTipDemo(vp.getBodyEl());
  }
}

// Guard: do not auto-start when this module is imported by the test runner.
if (import.meta.env.MODE !== 'test') {
  new QuickTipDemoApp().start();
}
