/**
 * panel-messagebox-demo — app.ts
 *
 * Demonstrates MessageBox.confirm and MessageBox.alert via a central Panel
 * that contains Submit and Cancel buttons.
 *
 *   Submit → MessageBox.confirm('Confirm Submission', …)
 *              Yes  → logs "confirm → yes"
 *              No   → logs "confirm → no"
 *
 *   Cancel → MessageBox.alert('Action Cancelled', …)
 *              OK   → logs "alert → ok"
 *
 * Architecture:
 *   createMessageBoxDemo(host)  — pure factory; testable in isolation
 *   MessageBoxDemoApp           — Application subclass; wires factory into Viewport
 *
 * The Application auto-start is guarded so importing this module during Vitest
 * does not trigger the browser launch sequence.
 */

import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { ModernTheme } from '@framesquared/theme';
import { Button, MessageBox, Panel, Viewport } from '@framesquared/ui';

// ---------------------------------------------------------------------------
// Public refs interface
// ---------------------------------------------------------------------------

export interface MessageBoxDemoRefs {
  submitBtn:     Button;
  cancelBtn:     Button;
  /**
   * Mutable box updated by each dialog callback with the button id that was
   * clicked ('yes', 'no', or 'ok').  Readable by tests without DOM queries.
   */
  lastButtonId:   { value: string };
  /**
   * Mutable box set when a dialog is triggered: 'confirm' or 'alert'.
   */
  lastDialogType: { value: string };
}

// ---------------------------------------------------------------------------
// View factory
// ---------------------------------------------------------------------------

export function createMessageBoxDemo(host: Element): MessageBoxDemoRefs {
  const lastButtonId:   { value: string } = { value: '' };
  const lastDialogType: { value: string } = { value: '' };

  // ── Submit → confirm dialog ──────────────────────────────────────────────
  const submitBtn = new Button({
    text:    'Submit',
    handler: () => {
      lastDialogType.value = 'confirm';
      MessageBox.confirm(
        'Confirm Submission',
        'Are you sure you want to submit this form?',
        (btnId) => {
          lastButtonId.value = btnId;
          console.log(`[MessageBoxDemo] confirm → ${btnId}`);
        },
      );
    },
  });

  // ── Cancel → alert dialog ────────────────────────────────────────────────
  const cancelBtn = new Button({
    text:    'Cancel',
    handler: () => {
      lastDialogType.value = 'alert';
      MessageBox.alert(
        'Action Cancelled',
        'The operation has been cancelled. No changes were made.',
        (btnId) => {
          lastButtonId.value = btnId;
          console.log(`[MessageBoxDemo] alert → ${btnId}`);
        },
      );
    },
  });

  // ── Central Panel ────────────────────────────────────────────────────────
  new Panel({
    renderTo:    host,
    title:       'MessageBox Demo',
    layout:      { type: 'hbox' },
    bodyPadding: 24,
    items:       [submitBtn, cancelBtn],
  });

  return { submitBtn, cancelBtn, lastButtonId, lastDialogType };
}

// ---------------------------------------------------------------------------
// Application
// ---------------------------------------------------------------------------

class MessageBoxDemoApp extends Application {
  constructor() {
    super({ name: 'MessageBoxDemo', theme: ModernTheme });
  }

  override launch(): void {
    const vp = new Viewport({ layout: { type: 'vbox', align: 'stretch' } });
    createMessageBoxDemo(vp.getBodyEl());
  }
}

// Guard: do not auto-start when this module is imported by the test runner.
if (import.meta.env.MODE !== 'test') {
  new MessageBoxDemoApp().start();
}
