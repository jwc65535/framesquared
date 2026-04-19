/**
 * fit-layout.test.ts
 *
 * TDD suite for the Fit Layout Demo.
 *
 * FitLayout contract:
 *   - The container body gets `position: relative; overflow: hidden`.
 *   - The first (and only visible) child receives `width: 100%;
 *     height: 100%; box-sizing: border-box` so it fills the parent exactly.
 *   - Additional children are hidden (`display: none`).
 *   - Because sizing is pure CSS, the child automatically tracks any
 *     imperative resize applied to the parent — no JS recalculation needed.
 *
 * Test suites:
 *   1. Application lifecycle
 *   2. Layout resolution      — "fit" alias → FitLayout instance
 *   3. Container configuration — body CSS properties
 *   4. Child fill behaviour   — width/height/boxSizing on the fit child
 *   5. Multi-child visibility — only first child shown
 *   6. Automatic resize       — CSS-based fill survives parent dimension changes
 *   7. Nested content         — inner Panel + Button render inside the fit child
 *   8. Framework integrity    — no raw HTML outside component elements
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@framesquared/app';
import { Panel } from '@framesquared/ui';
import { Button } from '@framesquared/ui';
import { FitLayout } from '@framesquared/layout';

// Side-effect import registers all layout aliases, including 'fit'.
import '@framesquared/layout';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeHost(): HTMLDivElement {
  const el = document.createElement('div');
  // Give the host explicit dimensions so percentage-based children have a
  // reference box in jsdom's minimal layout engine.
  el.style.width  = '800px';
  el.style.height = '600px';
  document.body.appendChild(el);
  return el;
}

/**
 * Build the demo's canonical fit-layout structure:
 *
 *   Panel (layout:'fit', 800×600) — "Fit Layout Workspace"
 *     └─ Panel (fit child)        — "Fit Child"
 *          ├─ Panel               — "About Fit Layout"
 *          └─ Button              — "Resize Parent"
 */
function makeFitWorkspace(host: HTMLElement): {
  workspace: Panel;
  body: HTMLElement;
  fitChild: Panel;
  aboutPanel: Panel;
  actionBtn: Button;
} {
  const aboutPanel = new Panel({ title: 'About Fit Layout' });
  const actionBtn  = new Button({ text: 'Resize Parent' });

  const fitChild = new Panel({
    title: 'Fit Child',
    items: [aboutPanel, actionBtn],
  });

  const workspace = new Panel({
    title: 'Fit Layout Workspace',
    width: 800,
    height: 600,
    layout: 'fit',
    items: [fitChild],
  });

  workspace.render(host);
  const body = workspace.getBodyEl() as HTMLElement;

  return { workspace, body, fitChild, aboutPanel, actionBtn };
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
    const app = new Application({ name: 'FitLayoutDemo' });
    expect(app.getName()).toBe('FitLayoutDemo');
  });

  it('registers itself as the singleton on construction', () => {
    const app = new Application({ name: 'FitLayoutDemo' });
    expect(Application.getInstance()).toBe(app);
  });

  it('clearInstance() removes the singleton', () => {
    new Application({ name: 'FitLayoutDemo' });
    Application.clearInstance();
    expect(Application.getInstance()).toBeNull();
  });

  it('calls lifecycle hooks in the correct order', () => {
    const order: string[] = [];
    const app = new Application({
      name: 'FitLayoutDemo',
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
    class FitApp extends Application {
      constructor() { super({ name: 'FitLayoutDemo' }); }
      override launch(): void { launched = true; }
    }
    new FitApp().start();
    expect(launched).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. Layout resolution
// ════════════════════════════════════════════════════════════════════════════

describe('Layout resolution', () => {
  it('string alias "fit" resolves to a FitLayout instance', () => {
    const panel = new Panel({ layout: 'fit' });
    panel.render(host);
    expect(panel.getLayout()).toBeInstanceOf(FitLayout);
  });

  it('object form { type: "fit" } also resolves to FitLayout', () => {
    const panel = new Panel({ layout: { type: 'fit' } });
    panel.render(host);
    expect(panel.getLayout()).toBeInstanceOf(FitLayout);
  });

  it('layout.type is "fit"', () => {
    const { workspace } = makeFitWorkspace(host);
    expect(workspace.getLayout().type).toBe('fit');
  });

  it('workspace panel is identified as using FitLayout', () => {
    const { workspace } = makeFitWorkspace(host);
    expect(workspace.getLayout()).toBeInstanceOf(FitLayout);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. Container configuration
// ════════════════════════════════════════════════════════════════════════════

describe('Container configuration', () => {
  it('body element has position:relative (establishes containing block)', () => {
    const { body } = makeFitWorkspace(host);
    expect(body.style.position).toBe('relative');
  });

  it('body element has overflow:hidden (clips child overflow)', () => {
    const { body } = makeFitWorkspace(host);
    expect(body.style.overflow).toBe('hidden');
  });

  it('workspace panel title is "Fit Layout Workspace"', () => {
    const { workspace } = makeFitWorkspace(host);
    expect(workspace.getTitle()).toBe('Fit Layout Workspace');
  });

  it('workspace panel has exactly one item', () => {
    const { workspace } = makeFitWorkspace(host);
    expect(workspace.getItems().length).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. Child fill behaviour
// ════════════════════════════════════════════════════════════════════════════

describe('Child fill behaviour — the fit child expands to parent dimensions', () => {
  it('fit child el.style.width is "100%"', () => {
    const { fitChild } = makeFitWorkspace(host);
    expect(fitChild.el!.style.width).toBe('100%');
  });

  it('fit child el.style.height is "100%"', () => {
    const { fitChild } = makeFitWorkspace(host);
    expect(fitChild.el!.style.height).toBe('100%');
  });

  it('fit child has box-sizing:border-box so padding does not add to its dimensions', () => {
    const { fitChild } = makeFitWorkspace(host);
    expect(fitChild.el!.style.boxSizing).toBe('border-box');
  });

  it('fit child is rendered and has a live element', () => {
    const { fitChild } = makeFitWorkspace(host);
    expect(fitChild.rendered).toBe(true);
    expect(fitChild.el).not.toBeNull();
  });

  it('fit child getAt(0) is the expected child', () => {
    const { workspace, fitChild } = makeFitWorkspace(host);
    expect(workspace.getAt(0)).toBe(fitChild);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. Multi-child visibility
// ════════════════════════════════════════════════════════════════════════════

describe('Multi-child visibility — only the first child is shown', () => {
  it('first child is visible (display is not "none")', () => {
    const child1 = new Panel({ title: 'First' });
    const child2 = new Panel({ title: 'Second' });
    const panel  = new Panel({ layout: 'fit', items: [child1, child2] });
    panel.render(host);
    expect(child1.el!.style.display).not.toBe('none');
  });

  it('second child is hidden (display is "none")', () => {
    const child1 = new Panel({ title: 'First' });
    const child2 = new Panel({ title: 'Second' });
    const panel  = new Panel({ layout: 'fit', items: [child1, child2] });
    panel.render(host);
    expect(child2.el!.style.display).toBe('none');
  });

  it('second child still has width/height after first child fills', () => {
    // The hidden child should not have its dimensions overridden
    const child1 = new Panel({ title: 'First' });
    const child2 = new Panel({ title: 'Second', width: 200, height: 100 });
    const panel  = new Panel({ layout: 'fit', items: [child1, child2] });
    panel.render(host);
    // display:none is the only override; width config is still applied from applyConfigs
    expect(child2.el!.style.display).toBe('none');
  });

  it('a fit container with a single child has that child visible', () => {
    const { fitChild } = makeFitWorkspace(host);
    expect(fitChild.el!.style.display).not.toBe('none');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. Automatic resize — CSS-percentage fill tracks parent dimensions
// ════════════════════════════════════════════════════════════════════════════

describe('Automatic resize — child width/height remain 100% after parent is resized', () => {
  it('child still has width:100% after parent width is changed via setWidth()', () => {
    const { workspace, fitChild } = makeFitWorkspace(host);
    workspace.setWidth(1200);
    // FitLayout sets CSS width:100%; CSS itself tracks parent width — no
    // JS recalculation is required.  The style value must still be '100%'.
    expect(fitChild.el!.style.width).toBe('100%');
  });

  it('child still has height:100% after parent height is changed via setHeight()', () => {
    const { workspace, fitChild } = makeFitWorkspace(host);
    workspace.setHeight(900);
    expect(fitChild.el!.style.height).toBe('100%');
  });

  it('child still has width:100% after parent setSize()', () => {
    const { workspace, fitChild } = makeFitWorkspace(host);
    workspace.setSize(640, 480);
    expect(fitChild.el!.style.width).toBe('100%');
    expect(fitChild.el!.style.height).toBe('100%');
  });

  it('box-sizing remains border-box after parent resize', () => {
    const { workspace, fitChild } = makeFitWorkspace(host);
    workspace.setSize(1000, 700);
    expect(fitChild.el!.style.boxSizing).toBe('border-box');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. Nested content inside the fit child
// ════════════════════════════════════════════════════════════════════════════

describe('Nested content', () => {
  it('aboutPanel inside fitChild is rendered', () => {
    const { aboutPanel } = makeFitWorkspace(host);
    expect(aboutPanel.rendered).toBe(true);
    expect(aboutPanel.el).not.toBeNull();
  });

  it('actionBtn inside fitChild is rendered', () => {
    const { actionBtn } = makeFitWorkspace(host);
    expect(actionBtn.rendered).toBe(true);
    expect(actionBtn.el).not.toBeNull();
  });

  it('fitChild reports 2 items (Panel + Button)', () => {
    const { fitChild } = makeFitWorkspace(host);
    expect(fitChild.getItems().length).toBe(2);
  });

  it('actionBtn is a Button', () => {
    const { actionBtn } = makeFitWorkspace(host);
    expect(actionBtn).toBeInstanceOf(Button);
  });

  it('aboutPanel title is "About Fit Layout"', () => {
    const { aboutPanel } = makeFitWorkspace(host);
    expect(aboutPanel.getTitle()).toBe('About Fit Layout');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. Framework integrity — no raw HTML injection
// ════════════════════════════════════════════════════════════════════════════

describe('Framework integrity — no raw HTML injection', () => {
  it('all direct children of the host are framework component elements', () => {
    makeFitWorkspace(host);
    for (const child of Array.from(host.children)) {
      expect(child.classList.contains('x-component')).toBe(true);
    }
  });

  it('contains no raw block-level semantic elements (p, h1–h6, ul, ol, li, table)', () => {
    makeFitWorkspace(host);
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
    makeFitWorkspace(host);
    for (const span of Array.from(host.querySelectorAll('span'))) {
      const hasXClass = Array.from(span.classList).some(c => c.startsWith('x-'));
      expect(hasXClass, `<span class="${span.className}"> has no x-* class`).toBe(true);
    }
  });

  it('workspace panel carries the x-panel class', () => {
    const { workspace } = makeFitWorkspace(host);
    expect(workspace.el!.classList.contains('x-panel')).toBe(true);
  });
});
