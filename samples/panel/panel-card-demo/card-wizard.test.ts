/**
 * card-wizard.test.ts
 *
 * TDD suite for the Card Layout Wizard demo.
 *
 * CardLayout contract:
 *   - Container body: position:relative; overflow:hidden.
 *   - Every card: width:100%; height:100%; box-sizing:border-box.
 *   - Only the active card is visible (display:''); all others display:'none'.
 *   - setActiveItem(n|Component), next(), prev() navigate between cards.
 *   - "activate" fires with the newly-visible card; "deactivate" with the old.
 *
 * Animation note: CardLayout performs instant DOM show/hide.  CSS transitions
 * can be applied to .x-panel-body children via the theme system, but the
 * CardLayout engine itself provides no built-in animation — none is tested here.
 *
 * Test suites:
 *   1.  Application lifecycle
 *   2.  Layout resolution       — "card" alias → CardLayout instance
 *   3.  Container configuration — body CSS set by configureContainer
 *   4.  Initial card visibility — only card 0 shown after render
 *   5.  Card fill dimensions    — every card gets 100% × 100%
 *   6.  setActiveItem           — by index and by component reference
 *   7.  next() / prev()         — sequential and wrapping navigation
 *   8.  Event system            — activate / deactivate payloads
 *   9.  Navigation button state — Previous disabled at step 0; Next text cycles
 *   10. Card content types      — FormPanel, Panel, Button, DisplayField
 *   11. Wizard step titles      — each card has the correct heading
 *   12. Framework integrity     — no raw HTML outside framework elements
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Application } from '@framesquared/app';
import { Panel } from '@framesquared/ui';
import { Button } from '@framesquared/ui';
import { CardLayout } from '@framesquared/layout';
import { FormPanel, TextField, DisplayField } from '@framesquared/form';

// Side-effect import registers all layout aliases, including 'card'.
import '@framesquared/layout';

// ── Constants ─────────────────────────────────────────────────────────────────

const STEP_TITLES = [
  'Step 1 of 3 — Personal Details',
  'Step 2 of 3 — Review Your Details',
  'Step 3 of 3 — Registration Complete',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeHost(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.width  = '900px';
  el.style.height = '600px';
  document.body.appendChild(el);
  return el;
}

/**
 * Build the three wizard cards independently of the full Viewport so tests
 * can inspect them without the Application lifecycle.
 *
 * Returns the card host Panel, the layout, and every named sub-component.
 */
function makeWizard(host: HTMLElement): {
  cardHost:     Panel;
  body:         HTMLElement;
  layout:       CardLayout;
  stepPersonal: FormPanel;
  stepReview:   Panel;
  stepConfirm:  Panel;
  nameField:    TextField;
  emailField:   TextField;
  nameDisplay:  DisplayField;
  emailDisplay: DisplayField;
  prevBtn:      Button;
  nextBtn:      Button;
} {
  // ── Card 1 ──────────────────────────────────────────────────────────────────
  const nameField  = new TextField({ fieldLabel: 'Full Name',     name: 'fullName',  allowBlank: false });
  const emailField = new TextField({ fieldLabel: 'Email Address', name: 'email',     vtype: 'email'    });
  const stepPersonal = new FormPanel({
    title: STEP_TITLES[0],
    items: [nameField, emailField],
  });

  // ── Card 2 ──────────────────────────────────────────────────────────────────
  const nameDisplay  = new DisplayField({ fieldLabel: 'Full Name',     name: 'fullNameDisplay'  });
  const emailDisplay = new DisplayField({ fieldLabel: 'Email Address', name: 'emailDisplay'     });
  const stepReview = new Panel({
    title: STEP_TITLES[1],
    items: [nameDisplay, emailDisplay],
  });

  // ── Card 3 ──────────────────────────────────────────────────────────────────
  const stepConfirm = new Panel({
    title: STEP_TITLES[2],
    items: [
      new Panel({ title: 'Your registration has been submitted successfully.' }),
    ],
  });

  // ── Card host (the CardLayout container) ────────────────────────────────
  const cardHost = new Panel({
    layout: 'card',
    items: [stepPersonal, stepReview, stepConfirm],
  });

  cardHost.render(host);

  const layout = cardHost.getLayout() as CardLayout;
  const body   = cardHost.getBodyEl() as HTMLElement;

  // ── Wizard state machine ──────────────────────────────────────────────────
  let currentIndex = 0;
  const LAST = 2;

  // ── Navigation buttons (handler config — fires directly in onButtonClick) ─
  const prevBtn = new Button({
    text: '← Previous',
    disabled: true,
    handler: () => { if (currentIndex > 0) layout.prev(); },
  });
  const nextBtn = new Button({
    text: 'Next →',
    handler: () => {
      if (currentIndex < LAST) layout.next();
      else layout.setActiveItem(0);
    },
  });

  // Sync button state and DisplayFields whenever a card becomes active
  layout.on('activate', (card: unknown) => {
    const idx = cardHost.getItems().indexOf(card as Panel);
    currentIndex = idx;

    if (currentIndex === 0) prevBtn.disable(); else prevBtn.enable();
    nextBtn.setText(currentIndex === LAST ? 'Submit ✓' : 'Next →');

    if (currentIndex === 1) {
      const values = stepPersonal.getValues() as Record<string, string>;
      nameDisplay.setValue(values['fullName'] || '(not provided)');
      emailDisplay.setValue(values['email']   || '(not provided)');
    }
  });

  // Render nav buttons into host (outside card host) so they are testable
  prevBtn.render(host);
  nextBtn.render(host);

  return {
    cardHost, body, layout,
    stepPersonal, stepReview, stepConfirm,
    nameField, emailField,
    nameDisplay, emailDisplay,
    prevBtn, nextBtn,
  };
}

// ── Test host setup ───────────────────────────────────────────────────────────

let host: HTMLDivElement;

beforeEach(() => {
  host = makeHost();
  Application.clearInstance();
});

afterEach(() => {
  host.remove();
  Application.clearInstance();
});

// ════════════════════════════════════════════════════════════════════════════
// 1. Application lifecycle
// ════════════════════════════════════════════════════════════════════════════

describe('Application lifecycle', () => {
  it('can be instantiated with the demo name', () => {
    const app = new Application({ name: 'CardLayoutWizard' });
    expect(app.getName()).toBe('CardLayoutWizard');
  });

  it('registers itself as the singleton on construction', () => {
    const app = new Application({ name: 'CardLayoutWizard' });
    expect(Application.getInstance()).toBe(app);
  });

  it('clearInstance() removes the singleton', () => {
    new Application({ name: 'CardLayoutWizard' });
    Application.clearInstance();
    expect(Application.getInstance()).toBeNull();
  });

  it('calls lifecycle hooks in the correct order', () => {
    const order: string[] = [];
    const app = new Application({
      name: 'CardLayoutWizard',
      launch: () => order.push('launch'),
    });
    app.onInit         = () => order.push('onInit');
    app.onBeforeLaunch = () => order.push('onBeforeLaunch');
    app.onLaunch       = () => order.push('onLaunch');
    app.start();
    expect(order).toEqual(['onInit', 'onBeforeLaunch', 'launch', 'onLaunch']);
  });

  it('launch() is overridable in a subclass', () => {
    let launched = false;
    class WizardApp extends Application {
      constructor() { super({ name: 'CardLayoutWizard' }); }
      override launch(): void { launched = true; }
    }
    new WizardApp().start();
    expect(launched).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. Layout resolution
// ════════════════════════════════════════════════════════════════════════════

describe('Layout resolution', () => {
  it('string alias "card" resolves to a CardLayout instance', () => {
    const panel = new Panel({ layout: 'card' });
    panel.render(host);
    expect(panel.getLayout()).toBeInstanceOf(CardLayout);
  });

  it('object form { type: "card" } also resolves to CardLayout', () => {
    const panel = new Panel({ layout: { type: 'card' } });
    panel.render(host);
    expect(panel.getLayout()).toBeInstanceOf(CardLayout);
  });

  it('layout.type is "card"', () => {
    const { layout } = makeWizard(host);
    expect(layout.type).toBe('card');
  });

  it('cardHost.getLayout() returns the CardLayout', () => {
    const { cardHost, layout } = makeWizard(host);
    expect(cardHost.getLayout()).toBe(layout);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. Container configuration
// ════════════════════════════════════════════════════════════════════════════

describe('Container configuration', () => {
  it('body has position:relative (establishes a containing block)', () => {
    const { body } = makeWizard(host);
    expect(body.style.position).toBe('relative');
  });

  it('body has overflow:hidden (clips cards outside the viewport)', () => {
    const { body } = makeWizard(host);
    expect(body.style.overflow).toBe('hidden');
  });

  it('cardHost has exactly 3 items', () => {
    const { cardHost } = makeWizard(host);
    expect(cardHost.getItems().length).toBe(3);
  });

  it('all 3 cards are rendered with live elements', () => {
    const { stepPersonal, stepReview, stepConfirm } = makeWizard(host);
    for (const card of [stepPersonal, stepReview, stepConfirm]) {
      expect(card.rendered).toBe(true);
      expect(card.el).not.toBeNull();
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. Initial card visibility — only card 0 shown after render
// ════════════════════════════════════════════════════════════════════════════

describe('Initial card visibility', () => {
  it('card 0 (Personal Details) is visible on initial render', () => {
    const { stepPersonal } = makeWizard(host);
    expect(stepPersonal.el!.style.display).not.toBe('none');
  });

  it('card 1 (Review) is hidden on initial render', () => {
    const { stepReview } = makeWizard(host);
    expect(stepReview.el!.style.display).toBe('none');
  });

  it('card 2 (Confirmation) is hidden on initial render', () => {
    const { stepConfirm } = makeWizard(host);
    expect(stepConfirm.el!.style.display).toBe('none');
  });

  it('getActiveItem() returns the first card initially', () => {
    const { layout, stepPersonal } = makeWizard(host);
    expect(layout.getActiveItem()).toBe(stepPersonal);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. Card fill dimensions — every card gets width/height 100%
// ════════════════════════════════════════════════════════════════════════════

describe('Card fill dimensions', () => {
  it('card 0 has width:100%', () => {
    const { stepPersonal } = makeWizard(host);
    expect(stepPersonal.el!.style.width).toBe('100%');
  });

  it('card 0 has height:100%', () => {
    const { stepPersonal } = makeWizard(host);
    expect(stepPersonal.el!.style.height).toBe('100%');
  });

  it('card 0 has box-sizing:border-box', () => {
    const { stepPersonal } = makeWizard(host);
    expect(stepPersonal.el!.style.boxSizing).toBe('border-box');
  });

  it('card 1 has width:100% (applies even to hidden cards)', () => {
    const { stepReview } = makeWizard(host);
    expect(stepReview.el!.style.width).toBe('100%');
  });

  it('card 2 has height:100% (applies even to hidden cards)', () => {
    const { stepConfirm } = makeWizard(host);
    expect(stepConfirm.el!.style.height).toBe('100%');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. setActiveItem — by index and by component reference
// ════════════════════════════════════════════════════════════════════════════

describe('setActiveItem', () => {
  it('setActiveItem(1) shows card 1 and hides card 0', () => {
    const { layout, stepPersonal, stepReview } = makeWizard(host);
    layout.setActiveItem(1);
    expect(stepReview.el!.style.display).not.toBe('none');
    expect(stepPersonal.el!.style.display).toBe('none');
  });

  it('setActiveItem(2) shows card 2', () => {
    const { layout, stepConfirm } = makeWizard(host);
    layout.setActiveItem(2);
    expect(stepConfirm.el!.style.display).not.toBe('none');
  });

  it('setActiveItem by component reference shows that card', () => {
    const { layout, stepReview } = makeWizard(host);
    layout.setActiveItem(stepReview);
    expect(layout.getActiveItem()).toBe(stepReview);
  });

  it('setActiveItem to current index is a no-op (does not fire events)', () => {
    const { layout } = makeWizard(host);
    const spy = vi.fn();
    layout.on('activate', spy);
    layout.setActiveItem(0); // already active — should not fire
    expect(spy).not.toHaveBeenCalled();
  });

  it('getActiveItem() returns the newly active card after setActiveItem', () => {
    const { layout, stepConfirm } = makeWizard(host);
    layout.setActiveItem(2);
    expect(layout.getActiveItem()).toBe(stepConfirm);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. next() / prev() — sequential and wrapping navigation
// ════════════════════════════════════════════════════════════════════════════

describe('next() and prev()', () => {
  it('next() advances from card 0 to card 1', () => {
    const { layout, stepReview } = makeWizard(host);
    layout.next();
    expect(layout.getActiveItem()).toBe(stepReview);
  });

  it('next() advances from card 1 to card 2', () => {
    const { layout, stepConfirm } = makeWizard(host);
    layout.next();
    layout.next();
    expect(layout.getActiveItem()).toBe(stepConfirm);
  });

  it('next() wraps from last card back to card 0', () => {
    const { layout, stepPersonal } = makeWizard(host);
    layout.next(); layout.next(); layout.next(); // wrap
    expect(layout.getActiveItem()).toBe(stepPersonal);
  });

  it('prev() from card 2 returns to card 1', () => {
    const { layout, stepReview } = makeWizard(host);
    layout.setActiveItem(2);
    layout.prev();
    expect(layout.getActiveItem()).toBe(stepReview);
  });

  it('prev() from card 1 returns to card 0', () => {
    const { layout, stepPersonal } = makeWizard(host);
    layout.next();
    layout.prev();
    expect(layout.getActiveItem()).toBe(stepPersonal);
  });

  it('prev() wraps from card 0 to last card', () => {
    const { layout, stepConfirm } = makeWizard(host);
    layout.prev();
    expect(layout.getActiveItem()).toBe(stepConfirm);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. Event system — activate / deactivate payloads
// ════════════════════════════════════════════════════════════════════════════

describe('Event system', () => {
  it('"activate" event fires when active card changes', () => {
    const { layout } = makeWizard(host);
    const spy = vi.fn();
    layout.on('activate', spy);
    layout.next();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('"activate" event passes the newly active card as first argument', () => {
    const { layout, stepReview } = makeWizard(host);
    let activated: unknown;
    layout.on('activate', (card: unknown) => { activated = card; });
    layout.next();
    expect(activated).toBe(stepReview);
  });

  it('"deactivate" event fires when active card changes', () => {
    const { layout } = makeWizard(host);
    const spy = vi.fn();
    layout.on('deactivate', spy);
    layout.next();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('"deactivate" event passes the previously active card', () => {
    const { layout, stepPersonal } = makeWizard(host);
    let deactivated: unknown;
    layout.on('deactivate', (card: unknown) => { deactivated = card; });
    layout.next();
    expect(deactivated).toBe(stepPersonal);
  });

  it('un() removes a listener so it no longer fires', () => {
    const { layout } = makeWizard(host);
    const spy = vi.fn();
    layout.on('activate', spy);
    layout.un('activate', spy);
    layout.next();
    expect(spy).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 9. Navigation button state
// ════════════════════════════════════════════════════════════════════════════

describe('Navigation button state', () => {
  it('Previous button is disabled on the initial card', () => {
    const { prevBtn } = makeWizard(host);
    expect(prevBtn.isDisabled()).toBe(true);
  });

  it('Next button reads "Next →" on the initial card', () => {
    const { nextBtn } = makeWizard(host);
    expect(nextBtn.el!.textContent).toContain('Next');
  });

  it('Previous button is enabled after advancing to card 1', () => {
    const { layout, prevBtn } = makeWizard(host);
    layout.next();
    expect(prevBtn.isDisabled()).toBe(false);
  });

  it('Previous native <button> disabled attribute is cleared after enable()', () => {
    const { layout, prevBtn } = makeWizard(host);
    layout.next();
    expect((prevBtn.el as HTMLButtonElement).disabled).toBe(false);
  });

  it('Next button text changes to "Submit ✓" on the last card', () => {
    const { layout, nextBtn } = makeWizard(host);
    layout.setActiveItem(2);
    expect(nextBtn.el!.textContent).toContain('Submit');
  });

  it('Previous button becomes disabled again when returning to card 0', () => {
    const { layout, prevBtn } = makeWizard(host);
    layout.next();    // → card 1 (Previous enabled)
    layout.prev();    // → card 0 (Previous disabled again)
    expect(prevBtn.isDisabled()).toBe(true);
  });

  it('Next button text reverts to "Next →" when leaving the last card', () => {
    const { layout, nextBtn } = makeWizard(host);
    layout.setActiveItem(2); // Next becomes "Submit ✓"
    layout.prev();           // back to card 1 — Next returns to "Next →"
    expect(nextBtn.el!.textContent).toContain('Next');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 10. Card content types
// ════════════════════════════════════════════════════════════════════════════

describe('Card content types', () => {
  it('card 0 is a FormPanel', () => {
    const { stepPersonal } = makeWizard(host);
    expect(stepPersonal).toBeInstanceOf(FormPanel);
  });

  it('card 1 is a Panel (with DisplayField children)', () => {
    const { stepReview } = makeWizard(host);
    expect(stepReview).toBeInstanceOf(Panel);
  });

  it('card 2 is a Panel (confirmation)', () => {
    const { stepConfirm } = makeWizard(host);
    expect(stepConfirm).toBeInstanceOf(Panel);
  });

  it('card 0 contains a TextField for Full Name', () => {
    const { nameField } = makeWizard(host);
    expect(nameField).toBeInstanceOf(TextField);
    expect(nameField.rendered).toBe(true);
  });

  it('card 0 contains a TextField for Email Address', () => {
    const { emailField } = makeWizard(host);
    expect(emailField).toBeInstanceOf(TextField);
    expect(emailField.rendered).toBe(true);
  });

  it('card 1 contains a DisplayField for Full Name', () => {
    const { nameDisplay } = makeWizard(host);
    expect(nameDisplay).toBeInstanceOf(DisplayField);
    expect(nameDisplay.rendered).toBe(true);
  });

  it('card 1 contains a DisplayField for Email Address', () => {
    const { emailDisplay } = makeWizard(host);
    expect(emailDisplay).toBeInstanceOf(DisplayField);
    expect(emailDisplay.rendered).toBe(true);
  });

  it('navigation area contains a Button', () => {
    const { nextBtn } = makeWizard(host);
    expect(nextBtn).toBeInstanceOf(Button);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 11. Wizard step titles
// ════════════════════════════════════════════════════════════════════════════

describe('Wizard step titles', () => {
  it('card 0 title is "Step 1 of 3 — Personal Details"', () => {
    const { stepPersonal } = makeWizard(host);
    expect(stepPersonal.getTitle()).toBe(STEP_TITLES[0]);
  });

  it('card 1 title is "Step 2 of 3 — Review Your Details"', () => {
    const { stepReview } = makeWizard(host);
    expect(stepReview.getTitle()).toBe(STEP_TITLES[1]);
  });

  it('card 2 title is "Step 3 of 3 — Registration Complete"', () => {
    const { stepConfirm } = makeWizard(host);
    expect(stepConfirm.getTitle()).toBe(STEP_TITLES[2]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 12. Review population — form values propagate to DisplayFields
// ════════════════════════════════════════════════════════════════════════════

describe('Review population', () => {
  it('nameDisplay shows the value entered in nameField after advancing to step 2', () => {
    const { layout, nameField, nameDisplay } = makeWizard(host);
    nameField.setValue('Jane Smith');
    layout.next(); // activate step 2, which calls stepPersonal.getValues()
    expect(nameDisplay.getValue()).toBe('Jane Smith');
  });

  it('emailDisplay shows the value entered in emailField after advancing to step 2', () => {
    const { layout, emailField, emailDisplay } = makeWizard(host);
    emailField.setValue('jane@example.com');
    layout.next();
    expect(emailDisplay.getValue()).toBe('jane@example.com');
  });

  it('blank fields show "(not provided)" on the review step', () => {
    const { layout, nameDisplay, emailDisplay } = makeWizard(host);
    layout.next();
    expect(nameDisplay.getValue()).toBe('(not provided)');
    expect(emailDisplay.getValue()).toBe('(not provided)');
  });

  it('returning to step 1, changing a value, and re-advancing updates the display', () => {
    const { layout, nameField, nameDisplay } = makeWizard(host);
    nameField.setValue('First Name');
    layout.next();
    expect(nameDisplay.getValue()).toBe('First Name');
    layout.prev();
    nameField.setValue('Updated Name');
    layout.next();
    expect(nameDisplay.getValue()).toBe('Updated Name');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 13. Framework integrity — no raw HTML injection
// ════════════════════════════════════════════════════════════════════════════

describe('Framework integrity — no raw HTML injection', () => {
  it('all direct children of the host are framework component elements', () => {
    makeWizard(host);
    for (const child of Array.from(host.children)) {
      expect(child.classList.contains('x-component')).toBe(true);
    }
  });

  it('contains no raw block-level semantic elements (p, h1–h6, ul, ol, li, table)', () => {
    makeWizard(host);
    const blockTags = [
      'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'table', 'tr', 'td', 'th',
    ];
    for (const tag of blockTags) {
      expect(
        host.querySelectorAll(tag).length,
        `unexpected <${tag}> — raw HTML may have been injected`,
      ).toBe(0);
    }
  });

  it('every <span> in the subtree carries an x-* framework class', () => {
    makeWizard(host);
    for (const span of Array.from(host.querySelectorAll('span'))) {
      const hasXClass = Array.from(span.classList).some(c => c.startsWith('x-'));
      expect(hasXClass, `<span class="${span.className}"> has no x-* class`).toBe(true);
    }
  });

  it('cardHost carries the x-panel class', () => {
    const { cardHost } = makeWizard(host);
    expect(cardHost.el!.classList.contains('x-panel')).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 14. Button click-through — DOM click events drive navigation
// ════════════════════════════════════════════════════════════════════════════

describe('Button click-through', () => {
  it('clicking Next advances from card 0 to card 1', () => {
    const { layout, nextBtn, stepReview } = makeWizard(host);
    nextBtn.el!.click();
    expect(layout.getActiveItem()).toBe(stepReview);
  });

  it('clicking Next then Previous returns to card 0', () => {
    const { layout, nextBtn, prevBtn, stepPersonal } = makeWizard(host);
    nextBtn.el!.click();
    prevBtn.el!.click();
    expect(layout.getActiveItem()).toBe(stepPersonal);
  });

  it('Previous button click is a no-op on card 0 (stays on card 0)', () => {
    const { layout, prevBtn, stepPersonal } = makeWizard(host);
    prevBtn.el!.click();
    expect(layout.getActiveItem()).toBe(stepPersonal);
  });

  it('Previous native disabled prevents click on card 0', () => {
    const { layout, prevBtn } = makeWizard(host);
    const spy = vi.fn();
    layout.on('activate', spy);
    prevBtn.el!.click();
    expect(spy).not.toHaveBeenCalled();
  });

  it('clicking Next twice reaches card 2 and button reads "Submit ✓"', () => {
    const { nextBtn } = makeWizard(host);
    nextBtn.el!.click();
    nextBtn.el!.click();
    expect(nextBtn.el!.textContent).toContain('Submit');
  });

  it('clicking Submit on card 2 resets to card 0', () => {
    const { layout, nextBtn, stepPersonal } = makeWizard(host);
    nextBtn.el!.click();
    nextBtn.el!.click();
    nextBtn.el!.click(); // Submit
    expect(layout.getActiveItem()).toBe(stepPersonal);
  });
});
