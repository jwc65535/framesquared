import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { Panel, Viewport } from '@framesquared/ui';
import { Button } from '@framesquared/ui';
import { FormPanel, TextField, DisplayField } from '@framesquared/form';
import { CardLayout } from '@framesquared/layout';
import { ModernTheme } from '@framesquared/theme';
import { Component } from '@framesquared/component';

// ── Card Layout Wizard ────────────────────────────────────────────────────────
//
// A three-step wizard built entirely with framesquared components.
//
// Step 1 — Personal Details  (FormPanel with TextField inputs)
// Step 2 — Review            (Panel with DisplayFields showing entered values)
// Step 3 — Confirmation      (Panel with a success message)
//
// Navigation is driven by CardLayout.next() / setActiveItem().
// The layout's "activate" event synchronises button state so:
//   - "← Previous" is disabled on step 1
//   - "Next →" becomes "Submit ✓" on step 3
//
// Animation note: CardLayout switches cards via DOM show/hide (instant).
// The framework theme can layer CSS transitions on .x-panel-body children
// to achieve a slide or fade effect, but no JS animation engine is provided.
// ─────────────────────────────────────────────────────────────────────────────

class CardLayoutWizardApp extends Application {
  constructor() {
    super({ name: 'CardLayoutWizard', theme: ModernTheme });
  }

  override launch(): void {
    // ── Form fields (Card 1) ─────────────────────────────────────────────────
    const nameField  = new TextField({ fieldLabel: 'Full Name',     name: 'fullName', allowBlank: false });
    const emailField = new TextField({ fieldLabel: 'Email Address', name: 'email',    vtype: 'email'    });

    // ── Review display fields (Card 2) ───────────────────────────────────────
    const nameDisplay  = new DisplayField({ fieldLabel: 'Full Name'     });
    const emailDisplay = new DisplayField({ fieldLabel: 'Email Address' });

    // ── Card 1: Personal Details ─────────────────────────────────────────────
    const stepPersonal = new FormPanel({
      title: 'Step 1 of 3 — Personal Details',
      layout: { type: 'vbox', align: 'stretch' },
      bodyPadding: 24,
      items: [nameField, emailField],
    });

    // ── Card 2: Review ───────────────────────────────────────────────────────
    const stepReview = new Panel({
      title: 'Step 2 of 3 — Review Your Details',
      layout: { type: 'vbox', align: 'stretch' },
      bodyPadding: 24,
      items: [
        new Component({ html: 'Please confirm the information below before submitting.' }),
        nameDisplay,
        emailDisplay,
      ],
    });

    // ── Card 3: Confirmation ─────────────────────────────────────────────────
    const stepConfirm = new Panel({
      title: 'Step 3 of 3 — Registration Complete',
      layout: { type: 'vbox', align: 'stretch' },
      bodyPadding: 24,
      items: [
        new Component({ html: 'Your registration has been submitted successfully.' }),
        new Component({ html: 'A confirmation email will be sent to the address provided.' }),
      ],
    });

    // ── Card host — the CardLayout container ─────────────────────────────────
    const cardHost = new Panel({
      flex: 1,
      layout: 'card',
      items: [stepPersonal, stepReview, stepConfirm],
    });

    // ── Wizard state machine ─────────────────────────────────────────────────
    const layout  = cardHost.getLayout() as CardLayout;
    const LAST    = 2;
    let   current = 0;

    // ── Navigation buttons ───────────────────────────────────────────────────
    // Use handler config — called directly by onButtonClick, bypassing the
    // Observable mixin chain so the navigation fires reliably in all runtimes.
    const prevBtn = new Button({
      text: '← Previous',
      disabled: true,
      handler: () => { if (current > 0) layout.prev(); },
    });
    const nextBtn = new Button({
      text: 'Next →',
      handler: () => {
        if (current < LAST) {
          layout.next();
        } else {
          nameField.setValue('');
          emailField.setValue('');
          layout.setActiveItem(0);
        }
      },
    });

    // Sync button state whenever a card becomes active
    layout.on('activate', (card: unknown) => {
      current = cardHost.getItems().indexOf(card as Panel);

      if (current === 0) prevBtn.disable(); else prevBtn.enable();
      nextBtn.setText(current === LAST ? 'Submit ✓' : 'Next →');

      // Populate review step with values from the form
      if (current === 1) {
        const values = stepPersonal.getValues() as Record<string, string>;
        nameDisplay .setValue(values['fullName'] || '(not provided)');
        emailDisplay.setValue(values['email']    || '(not provided)');
      }
    });

    // ── Navigation bar ───────────────────────────────────────────────────────
    const navBar = new Panel({
      height: 56,
      layout: { type: 'hbox', align: 'middle', pack: 'end' },
      bodyPadding: '8px 16px',
      items: [prevBtn, nextBtn],
    });

    // ── Step indicator ───────────────────────────────────────────────────────
    const stepIndicator = new Panel({
      height: 40,
      bodyPadding: '0 16px',
      layout: { type: 'hbox', align: 'middle', pack: 'center' },
      items: [
        new Component({ html: '1. Details' }),
        new Component({ html: '&nbsp;→&nbsp;' }),
        new Component({ html: '2. Review'  }),
        new Component({ html: '&nbsp;→&nbsp;' }),
        new Component({ html: '3. Done'    }),
      ],
    });

    // ── Page chrome ──────────────────────────────────────────────────────────
    new Viewport({
      layout: { type: 'vbox', align: 'stretch' },
      items: [
        new Panel({ title: 'Card Layout Wizard — framesquared', height: 48 }),
        stepIndicator,
        new Panel({
          flex: 1,
          layout: { type: 'vbox', align: 'stretch' },
          bodyPadding: 24,
          items: [cardHost, navBar],
        }),
      ],
    });
  }
}

new CardLayoutWizardApp().start();
