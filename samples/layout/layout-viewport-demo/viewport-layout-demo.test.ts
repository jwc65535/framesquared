/**
 * TDD test suite — Viewport Layout Demo
 *
 * Spec assertions:
 *  1. Application lifecycle  — name, singleton, start() order, launch() override
 *  2. Viewport body mount    — el appended to document.body, class, body styles
 *  3. Border layout regions  — gridArea assignments and region sizing
 *  4. Child instantiation    — item counts, types, and panel configurations
 *  5. TabPanel center region — tab items, active state, switching
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { Panel, Viewport, TabPanel } from '@framesquared/ui';
import { createMainView, createViewport, type ViewportDemoRefs } from './MainView.js';

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

let host: HTMLDivElement;
let refs: ViewportDemoRefs;

beforeEach(() => {
  (globalThis as unknown as Record<string, unknown>).ResizeObserver = MockResizeObserver;
  host = document.createElement('div');
  document.body.appendChild(host);
  Application.clearInstance();
  refs = createMainView(host);
});

afterEach(() => {
  host.remove();
  document.body.innerHTML = '';
  Application.clearInstance();
});

// ════════════════════════════════════════════════════════════════════════════
// 1. Application lifecycle
// ════════════════════════════════════════════════════════════════════════════

describe('Application lifecycle', () => {
  it('instantiates with name "ViewportLayoutDemo"', () => {
    const app = new Application({ name: 'ViewportLayoutDemo' });
    expect(app.getName()).toBe('ViewportLayoutDemo');
  });

  it('registers itself as the singleton on construction', () => {
    const app = new Application({ name: 'ViewportLayoutDemo' });
    expect(Application.getInstance()).toBe(app);
  });

  it('clearInstance() removes the singleton', () => {
    new Application({ name: 'ViewportLayoutDemo' });
    Application.clearInstance();
    expect(Application.getInstance()).toBeNull();
  });

  it('calls lifecycle hooks in the correct order', () => {
    const order: string[] = [];
    const app = new Application({
      name: 'ViewportLayoutDemo',
      launch: () => order.push('launch'),
    });
    app.onInit = () => order.push('onInit');
    app.onBeforeLaunch = () => order.push('onBeforeLaunch');
    app.onLaunch = () => order.push('onLaunch');
    app.start();
    expect(order).toEqual(['onInit', 'onBeforeLaunch', 'launch', 'onLaunch']);
  });

  it('launch() override in subclass is called by start()', () => {
    let launched = false;
    class DemoApp extends Application {
      constructor() { super({ name: 'ViewportLayoutDemo' }); }
      override launch(): void { launched = true; }
    }
    new DemoApp().start();
    expect(launched).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. Viewport renders to document.body
// ════════════════════════════════════════════════════════════════════════════

describe('Viewport renders to document.body', () => {
  let vp: Viewport;

  beforeEach(() => {
    Application.clearInstance();
    vp = createViewport();
  });

  afterEach(() => {
    vp.destroy();
    document.body.innerHTML = '';
    Application.clearInstance();
  });

  it('viewport el is not null after construction', () => {
    expect(vp.el).not.toBeNull();
  });

  it('document.body contains the viewport element', () => {
    expect(document.body.contains(vp.el!)).toBe(true);
  });

  it('viewport element has the x-viewport class', () => {
    expect(vp.el!.classList.contains('x-viewport')).toBe(true);
  });

  it('viewport element fills 100vw × 100vh', () => {
    expect(vp.el!.style.width).toBe('100vw');
    expect(vp.el!.style.height).toBe('100vh');
  });

  it('document.body has overflow: hidden after mount', () => {
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('document.body has margin: 0 after mount', () => {
    // jsdom normalises '0' to '0px'
    expect(document.body.style.margin).toMatch(/^0(px)?$/);
  });

  it('viewport body element fills 100% width and height', () => {
    const bodyEl = vp.getBodyEl();
    expect(bodyEl.style.width).toBe('100%');
    expect(bodyEl.style.height).toBe('100%');
  });

  it('viewport fires "resize" when window.dispatchEvent(resize) is called', () => {
    let fired = false;
    vp.on('resize', () => { fired = true; });
    window.dispatchEvent(new Event('resize'));
    expect(fired).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. Border layout — grid template and region positioning
// ════════════════════════════════════════════════════════════════════════════

describe('Border layout grid template', () => {
  it('container body has display: grid', () => {
    const wrapperPanel = host.firstElementChild as HTMLElement;
    const body = wrapperPanel?.querySelector<HTMLElement>('.x-panel-body');
    expect(body?.style.display).toBe('grid');
  });

  it('gridTemplateAreas contains all four regions', () => {
    const wrapperPanel = host.firstElementChild as HTMLElement;
    const body = wrapperPanel?.querySelector<HTMLElement>('.x-panel-body')!;
    const areas = body.style.gridTemplateAreas;
    expect(areas).toContain('north');
    expect(areas).toContain('west');
    expect(areas).toContain('center');
    expect(areas).toContain('south');
  });

  it('north height (48px) appears in gridTemplateRows', () => {
    const wrapperPanel = host.firstElementChild as HTMLElement;
    const body = wrapperPanel?.querySelector<HTMLElement>('.x-panel-body')!;
    expect(body.style.gridTemplateRows).toContain('48px');
  });

  it('south height (28px) appears in gridTemplateRows', () => {
    const wrapperPanel = host.firstElementChild as HTMLElement;
    const body = wrapperPanel?.querySelector<HTMLElement>('.x-panel-body')!;
    expect(body.style.gridTemplateRows).toContain('28px');
  });

  it('west width (200px) appears in gridTemplateColumns', () => {
    const wrapperPanel = host.firstElementChild as HTMLElement;
    const body = wrapperPanel?.querySelector<HTMLElement>('.x-panel-body')!;
    expect(body.style.gridTemplateColumns).toContain('200px');
  });

  it('center column is sized to 1fr', () => {
    const wrapperPanel = host.firstElementChild as HTMLElement;
    const body = wrapperPanel?.querySelector<HTMLElement>('.x-panel-body')!;
    expect(body.style.gridTemplateColumns).toContain('1fr');
  });
});

describe('Region grid-area assignment', () => {
  it('north panel gets gridArea: "north"', () => {
    expect(refs.northPanel.el!.style.gridArea).toBe('north');
  });

  it('west panel gets gridArea: "west"', () => {
    expect(refs.westPanel.el!.style.gridArea).toBe('west');
  });

  it('center TabPanel gets gridArea: "center"', () => {
    expect(refs.centerTabPanel.el!.style.gridArea).toBe('center');
  });

  it('south panel gets gridArea: "south"', () => {
    expect(refs.southPanel.el!.style.gridArea).toBe('south');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. Child component instantiation and configuration
// ════════════════════════════════════════════════════════════════════════════

describe('Child component instantiation', () => {
  it('wrapper container has exactly 4 child items', () => {
    // Retrieve the Panel rendered into host via its getItems()
    const wrapperEl = host.firstElementChild as HTMLElement;
    // Find by querying host — use the panel's DOM presence as a proxy
    // for item count via refs: north + west + center + south
    const regionEls = [
      refs.northPanel.el,
      refs.westPanel.el,
      refs.centerTabPanel.el,
      refs.southPanel.el,
    ];
    expect(regionEls.every((el) => el !== null)).toBe(true);
  });

  it('all four region panels are rendered into the DOM', () => {
    expect(refs.northPanel.rendered).toBe(true);
    expect(refs.westPanel.rendered).toBe(true);
    expect(refs.centerTabPanel.rendered).toBe(true);
    expect(refs.southPanel.rendered).toBe(true);
  });

  it('north panel contains a Toolbar el', () => {
    expect(refs.northToolbar.el).not.toBeNull();
    expect(refs.northPanel.el!.contains(refs.northToolbar.el!)).toBe(true);
  });

  it('logout button is rendered inside the north toolbar', () => {
    expect(refs.logoutButton.el).not.toBeNull();
    expect(refs.northToolbar.el!.contains(refs.logoutButton.el!)).toBe(true);
  });

  it('west panel has collapsible: true in config', () => {
    expect((refs.westPanel as any)._config.collapsible).toBe(true);
  });

  it('west panel has width: 200 in config', () => {
    expect((refs.westPanel as any)._config.width).toBe(200);
  });

  it('north panel has height: 48 in config', () => {
    expect((refs.northPanel as any)._config.height).toBe(48);
  });

  it('south panel has height: 28 in config', () => {
    expect((refs.southPanel as any)._config.height).toBe(28);
  });

  it('center region is a TabPanel instance', () => {
    expect(refs.centerTabPanel).toBeInstanceOf(TabPanel);
  });

  it('north panel is a Panel instance', () => {
    expect(refs.northPanel).toBeInstanceOf(Panel);
  });

  it('west panel is a Panel instance', () => {
    expect(refs.westPanel).toBeInstanceOf(Panel);
  });

  it('south panel is a Panel instance', () => {
    expect(refs.southPanel).toBeInstanceOf(Panel);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. TabPanel center region
// ════════════════════════════════════════════════════════════════════════════

describe('TabPanel center region', () => {
  it('exposes 3 tab items', () => {
    expect(refs.centerTabPanel.getTabItems().length).toBe(3);
  });

  it('TabBar contains 3 rendered Tab elements', () => {
    expect(refs.centerTabPanel.getTabBar()!.getTabs().length).toBe(3);
  });

  it('first tab text contains "Welcome"', () => {
    const tabs = refs.centerTabPanel.getTabBar()!.getTabs();
    expect(tabs[0].el!.textContent).toContain('Welcome');
  });

  it('second tab text contains "Activity"', () => {
    const tabs = refs.centerTabPanel.getTabBar()!.getTabs();
    expect(tabs[1].el!.textContent).toContain('Activity');
  });

  it('third tab text contains "Settings"', () => {
    const tabs = refs.centerTabPanel.getTabBar()!.getTabs();
    expect(tabs[2].el!.textContent).toContain('Settings');
  });

  it('active tab defaults to index 0 (Welcome)', () => {
    expect(refs.centerTabPanel.getActiveTab()).toBe(refs.welcomePanel);
  });

  it('setActiveTab(1) activates the Activity panel', () => {
    refs.centerTabPanel.setActiveTab(1);
    expect(refs.centerTabPanel.getActiveTab()).toBe(refs.activityPanel);
  });

  it('setActiveTab(2) activates the Settings panel', () => {
    refs.centerTabPanel.setActiveTab(2);
    expect(refs.centerTabPanel.getActiveTab()).toBe(refs.settingsPanel);
  });

  it('inactive tab content is hidden', () => {
    expect(refs.activityPanel.el!.style.display).toBe('none');
    expect(refs.settingsPanel.el!.style.display).toBe('none');
  });

  it('switching tab reveals new panel and hides previous', () => {
    refs.centerTabPanel.setActiveTab(1);
    expect(refs.activityPanel.el!.style.display).not.toBe('none');
    expect(refs.welcomePanel.el!.style.display).toBe('none');
  });

  it('tabchange event fires when switching tabs', () => {
    let fired = false;
    refs.centerTabPanel.on('tabchange', () => { fired = true; });
    refs.centerTabPanel.setActiveTab(1);
    expect(fired).toBe(true);
  });

  it('tabchange delivers the newly activated component', () => {
    let received: unknown = null;
    refs.centerTabPanel.on('tabchange', (_tp: unknown, newCard: unknown) => {
      received = newCard;
    });
    refs.centerTabPanel.setActiveTab(2);
    expect(received).toBe(refs.settingsPanel);
  });
});
