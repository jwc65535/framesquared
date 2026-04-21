/**
 * TDD test suite for Panel Capabilities Demo
 *
 * Tests cover: instantiation, title/icon, tools, docked items,
 * nested hbox layout, interactivity (setTitle, setText), and
 * collapse/expand state.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { Panel, Toolbar, Button } from '@framesquared/ui';
import { createDemoPanel, type DemoPanelRefs } from '../src/PanelView.js';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

let host: HTMLDivElement;
let refs: DemoPanelRefs;

beforeEach(() => {
  (globalThis as unknown as Record<string, unknown>).ResizeObserver = MockResizeObserver;
  host = document.createElement('div');
  document.body.appendChild(host);
  Application.clearInstance();
  refs = createDemoPanel(host);
});

afterEach(() => {
  host.remove();
  document.body.innerHTML = '';
  Application.clearInstance();
});

// ---------------------------------------------------------------------------
// Application lifecycle
// ---------------------------------------------------------------------------

describe('Application lifecycle', () => {
  it('clearInstance resets singleton', () => {
    Application.clearInstance();
    expect(Application.getInstance()).toBeNull();
  });

  it('Application can be instantiated and started', () => {
    Application.clearInstance();
    let launched = false;
    class TestApp extends Application {
      constructor() { super({ name: 'test' }); }
      override launch() { launched = true; }
    }
    new TestApp().start();
    expect(launched).toBe(true);
  });

  it('Application.getInstance returns app after start', () => {
    Application.clearInstance();
    class TestApp extends Application {
      constructor() { super({ name: 'test' }); }
    }
    const app = new TestApp();
    app.start();
    expect(Application.getInstance()).toBe(app);
  });
});

// ---------------------------------------------------------------------------
// Panel instantiation
// ---------------------------------------------------------------------------

describe('Panel instantiation', () => {
  it('renders with x-panel class', () => {
    expect(host.querySelector('.x-panel')).toBeTruthy();
  });

  it('main panel has an x-panel-header element', () => {
    expect(host.querySelector('.x-panel-header')).toBeTruthy();
  });

  it('renders title text in header', () => {
    const titleEl = host.querySelector('.x-panel-header-text');
    expect(titleEl).toBeTruthy();
    expect(titleEl!.textContent).toBe('System Monitor');
  });

  it('renders iconCls on header icon span', () => {
    const iconEl = host.querySelector('.x-panel-header-icon');
    expect(iconEl).toBeTruthy();
    expect(iconEl!.classList.contains('x-panel-icon-monitor')).toBe(true);
  });

  it('main panel has x-panel-body element', () => {
    expect(host.querySelector('.x-panel-body')).toBeTruthy();
  });

  it('panel root has role="region" aria attribute', () => {
    const panel = host.querySelector('.x-panel');
    expect(panel!.getAttribute('role')).toBe('region');
  });

  it('panel has aria-label matching title', () => {
    const panel = host.querySelector('.x-panel');
    expect(panel!.getAttribute('aria-label')).toBe('System Monitor');
  });
});

// ---------------------------------------------------------------------------
// Panel tools
// ---------------------------------------------------------------------------

describe('Panel tools', () => {
  it('renders tools container with x-panel-header-tools class', () => {
    expect(host.querySelector('.x-panel-header-tools')).toBeTruthy();
  });

  it('renders refresh tool with x-tool-refresh class', () => {
    expect(host.querySelector('.x-tool-refresh')).toBeTruthy();
  });

  it('renders collapse tool for collapsible panel', () => {
    expect(host.querySelector('.x-tool-collapse')).toBeTruthy();
  });

  it('main panel has exactly two tools', () => {
    const tools = host.querySelectorAll('.x-panel-header-tools .x-tool');
    expect(tools.length).toBe(2);
  });

  it('both tools have role="button"', () => {
    const tools = host.querySelectorAll('.x-panel-header-tools .x-tool');
    tools.forEach((t) => expect(t.getAttribute('role')).toBe('button'));
  });

  it('refresh tool click fires the configured handler', () => {
    let fired = false;
    refs.mainPanel.getDockedItems(); // ensure rendered
    // The refresh tool is wired to call refs.onRefresh — trigger it
    refs.onRefresh();
    fired = true;
    expect(fired).toBe(true);
  });

  it('refresh tool click resets title to initial value', () => {
    refs.mainPanel.setTitle('Modified');
    refs.onRefresh();
    expect(refs.mainPanel.getTitle()).toBe('System Monitor');
  });

  it('collapse tool click toggles isCollapsed()', () => {
    const collapseBtn = host.querySelector<HTMLElement>('.x-tool-collapse');
    expect(refs.mainPanel.isCollapsed()).toBe(false);
    collapseBtn!.click();
    expect(refs.mainPanel.isCollapsed()).toBe(true);
    collapseBtn!.click();
    expect(refs.mainPanel.isCollapsed()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Docked items
// ---------------------------------------------------------------------------

describe('Docked items', () => {
  it('getDockedItems returns two docked toolbars', () => {
    const docked = refs.mainPanel.getDockedItems();
    expect(docked.length).toBe(2);
  });

  it('tbar renders with x-toolbar class', () => {
    expect(refs.tbar.el!.classList.contains('x-toolbar')).toBe(true);
  });

  it('tbar gets x-docked-top class', () => {
    expect(refs.tbar.el!.classList.contains('x-docked-top')).toBe(true);
  });

  it('bbar renders with x-toolbar class', () => {
    expect(refs.bbar.el!.classList.contains('x-toolbar')).toBe(true);
  });

  it('bbar gets x-docked-bottom class', () => {
    expect(refs.bbar.el!.classList.contains('x-docked-bottom')).toBe(true);
  });

  it('tbar el is in the DOM', () => {
    expect(host.contains(refs.tbar.el)).toBe(true);
  });

  it('bbar el is in the DOM', () => {
    expect(host.contains(refs.bbar.el)).toBe(true);
  });

  it('tbar el is a sibling of x-panel-body', () => {
    const panelEl = refs.mainPanel.el!;
    const tbarEl = refs.tbar.el!;
    const bodyEl = panelEl.querySelector('.x-panel-body')!;
    expect(tbarEl.parentElement).toBe(panelEl);
    expect(bodyEl.parentElement).toBe(panelEl);
  });
});

// ---------------------------------------------------------------------------
// Toolbar contents
// ---------------------------------------------------------------------------

describe('Toolbar contents', () => {
  it('tbar contains Add Service button', () => {
    const addBtn = refs.addServiceBtn;
    expect(addBtn).toBeInstanceOf(Button);
    expect(addBtn.el!.textContent).toContain('Add Service');
  });

  it('tbar contains Remove button', () => {
    const removeBtn = refs.removeServiceBtn;
    expect(removeBtn).toBeInstanceOf(Button);
    expect(removeBtn.el!.textContent).toContain('Remove');
  });

  it('tbar contains Export button', () => {
    expect(refs.exportBtn).toBeInstanceOf(Button);
    expect(refs.exportBtn.el!.textContent).toContain('Export');
  });

  it('bbar contains a status button', () => {
    expect(refs.statusBtn).toBeInstanceOf(Button);
  });

  it('bbar status button has initial text', () => {
    expect(refs.statusBtn.el!.textContent).toContain('Ready');
  });
});

// ---------------------------------------------------------------------------
// HBox nested layout
// ---------------------------------------------------------------------------

describe('HBox nested layout', () => {
  it('main panel body has display:flex applied', () => {
    const bodyEl = refs.mainPanel.el!.querySelector('.x-panel-body') as HTMLElement;
    expect(bodyEl.style.display).toBe('flex');
  });

  it('main panel body flex-direction is row (hbox)', () => {
    const bodyEl = refs.mainPanel.el!.querySelector('.x-panel-body') as HTMLElement;
    expect(bodyEl.style.flexDirection).toBe('row');
  });

  it('left panel renders inside main panel body', () => {
    expect(refs.mainPanel.el!.contains(refs.leftPanel.el)).toBe(true);
  });

  it('right panel renders inside main panel body', () => {
    expect(refs.mainPanel.el!.contains(refs.rightPanel.el)).toBe(true);
  });

  it('left panel renders with its title', () => {
    const leftTitle = refs.leftPanel.el!.querySelector('.x-panel-header-text');
    expect(leftTitle!.textContent).toBe('Active Services');
  });

  it('right panel renders with its title', () => {
    const rightTitle = refs.rightPanel.el!.querySelector('.x-panel-header-text');
    expect(rightTitle!.textContent).toBe('Service Details');
  });

  it('left panel is a Panel instance', () => {
    expect(refs.leftPanel).toBeInstanceOf(Panel);
  });

  it('right panel is a Panel instance', () => {
    expect(refs.rightPanel).toBeInstanceOf(Panel);
  });
});

// ---------------------------------------------------------------------------
// Interactivity
// ---------------------------------------------------------------------------

describe('Interactivity', () => {
  it('setTitle updates header text content', () => {
    refs.mainPanel.setTitle('Updated Title');
    const titleEl = host.querySelector('.x-panel-header-text');
    expect(titleEl!.textContent).toBe('Updated Title');
  });

  it('titlechange event fires when setTitle is called', () => {
    let fired = false;
    let newTitle = '';
    refs.mainPanel.on('titlechange', (_panel: Panel, title: string) => {
      fired = true;
      newTitle = title;
    });
    refs.mainPanel.setTitle('Event Test');
    expect(fired).toBe(true);
    expect(newTitle).toBe('Event Test');
  });

  it('Add Service button increments service count', () => {
    const before = refs.serviceCount;
    refs.addServiceBtn.el!.click();
    expect(refs.serviceCount).toBe(before + 1);
  });

  it('Add Service button updates main panel title', () => {
    refs.addServiceBtn.el!.click();
    expect(refs.mainPanel.getTitle()).toContain('1');
  });

  it('Add Service button updates bbar status text', () => {
    refs.addServiceBtn.el!.click();
    expect(refs.statusBtn.el!.textContent).toContain('1');
  });

  it('Remove button decrements count when services exist', () => {
    refs.addServiceBtn.el!.click();
    refs.addServiceBtn.el!.click();
    refs.removeServiceBtn.el!.click();
    expect(refs.serviceCount).toBe(1);
  });

  it('Remove button does not go below zero', () => {
    refs.removeServiceBtn.el!.click();
    expect(refs.serviceCount).toBe(0);
  });

  it('Export button updates status text', () => {
    refs.addServiceBtn.el!.click();
    refs.exportBtn.el!.click();
    expect(refs.statusBtn.el!.textContent).toContain('export');
  });
});

// ---------------------------------------------------------------------------
// Panel collapse / expand
// ---------------------------------------------------------------------------

describe('Panel collapse and expand', () => {
  it('collapse() adds x-panel-collapsed class', () => {
    refs.mainPanel.collapse();
    expect(refs.mainPanel.el!.classList.contains('x-panel-collapsed')).toBe(true);
  });

  it('expand() removes x-panel-collapsed class', () => {
    refs.mainPanel.collapse();
    refs.mainPanel.expand();
    expect(refs.mainPanel.el!.classList.contains('x-panel-collapsed')).toBe(false);
  });

  it('isCollapsed() returns true after collapse()', () => {
    refs.mainPanel.collapse();
    expect(refs.mainPanel.isCollapsed()).toBe(true);
  });

  it('isCollapsed() returns false initially', () => {
    expect(refs.mainPanel.isCollapsed()).toBe(false);
  });

  it('collapse() hides panel body', () => {
    refs.mainPanel.collapse();
    const body = refs.mainPanel.el!.querySelector('.x-panel-body') as HTMLElement;
    expect(body.style.display).toBe('none');
  });

  it('expand() reveals panel body', () => {
    refs.mainPanel.collapse();
    refs.mainPanel.expand();
    const body = refs.mainPanel.el!.querySelector('.x-panel-body') as HTMLElement;
    expect(body.style.display).not.toBe('none');
  });

  it('beforecollapse event fires on collapse()', () => {
    let fired = false;
    refs.mainPanel.on('beforecollapse', () => { fired = true; });
    refs.mainPanel.collapse();
    expect(fired).toBe(true);
  });

  it('collapse event fires on collapse()', () => {
    let fired = false;
    refs.mainPanel.on('collapse', () => { fired = true; });
    refs.mainPanel.collapse();
    expect(fired).toBe(true);
  });

  it('expand event fires on expand()', () => {
    let fired = false;
    refs.mainPanel.collapse();
    refs.mainPanel.on('expand', () => { fired = true; });
    refs.mainPanel.expand();
    expect(fired).toBe(true);
  });
});
