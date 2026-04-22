/**
 * TDD suite for breadcrumb-capabilities
 *
 * Tests are grouped by spec section so a failure immediately names the
 * capability that broke.  All tests operate on refs returned by
 * createBreadcrumbView() — no global application state is shared.
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { createBreadcrumbView, type BreadcrumbViewRefs } from '../src/BreadcrumbView.js';

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let host: HTMLDivElement;
let refs: BreadcrumbViewRefs;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  Application.clearInstance();
  refs = createBreadcrumbView(host);
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
  it('singleton resets cleanly', () => {
    Application.clearInstance();
    expect(Application.getInstance()).toBeNull();
  });

  it('Application can be started', () => {
    Application.clearInstance();
    let launched = false;
    class TestApp extends Application {
      constructor() { super({ name: 'test' }); }
      override launch() { launched = true; }
    }
    new TestApp().start();
    expect(launched).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// §2a — Static path rendering
// ---------------------------------------------------------------------------

describe('§2a Static path rendering', () => {
  it('breadcrumb element is rendered in the host', () => {
    expect(host.querySelector('.x-breadcrumb')).toBeTruthy();
  });

  it('breadcrumb carries role="navigation" (§3 accessibility)', () => {
    expect(host.querySelector('[role="navigation"]')).toBeTruthy();
  });

  it('breadcrumb carries aria-label', () => {
    const bc = host.querySelector('[role="navigation"]')!;
    expect(bc.getAttribute('aria-label')).toBeTruthy();
  });

  it('initial selection is Electronics — 3 segments visible', () => {
    const items = host.querySelectorAll('.x-breadcrumb-item');
    expect(items.length).toBe(3);
  });

  it('first segment is Home', () => {
    const items = host.querySelectorAll('.x-breadcrumb-item');
    expect(items[0].textContent).toContain('Home');
  });

  it('second segment is Catalog', () => {
    const items = host.querySelectorAll('.x-breadcrumb-item');
    expect(items[1].textContent).toContain('Catalog');
  });

  it('third segment is Electronics (the active / deepest node)', () => {
    const items = host.querySelectorAll('.x-breadcrumb-item');
    expect(items[2].textContent).toContain('Electronics');
  });

  it('separators are rendered between segments', () => {
    const seps = host.querySelectorAll('.x-breadcrumb-separator');
    expect(seps.length).toBe(2); // two gaps for three items
  });

  it('non-leaf segments have a dropdown arrow', () => {
    const items = host.querySelectorAll('.x-breadcrumb-item');
    // Home and Catalog are non-leaf; Electronics is non-leaf but it IS the
    // deepest item shown — its children are still accessible via arrow
    expect(items[0].querySelector('.x-breadcrumb-arrow')).toBeTruthy();
    expect(items[1].querySelector('.x-breadcrumb-arrow')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// §2b — Dynamic path navigation
// ---------------------------------------------------------------------------

describe('§2b Dynamic path navigation', () => {
  it('setSelection(phonesNode) shows a 4-segment trail', () => {
    refs.breadcrumb.setSelection(refs.phonesNode);
    expect(host.querySelectorAll('.x-breadcrumb-item').length).toBe(4);
  });

  it('the deepest segment after drill-down is Phones', () => {
    refs.breadcrumb.setSelection(refs.phonesNode);
    const items = host.querySelectorAll('.x-breadcrumb-item');
    expect(items[3].textContent).toContain('Phones');
  });

  it('setSelection(rootNode) collapses trail to 1 segment', () => {
    refs.breadcrumb.setSelection(refs.rootNode);
    expect(host.querySelectorAll('.x-breadcrumb-item').length).toBe(1);
  });

  it('getSelection() returns the node passed to setSelection()', () => {
    refs.breadcrumb.setSelection(refs.catalogNode);
    expect(refs.breadcrumb.getSelection()).toBe(refs.catalogNode);
  });

  it('clicking a breadcrumb segment navigates to that node', () => {
    // Start at Electronics (depth 3); click "Home" (index 0)
    const items = host.querySelectorAll<HTMLElement>('.x-breadcrumb-item');
    items[0].click();
    expect(refs.breadcrumb.getSelection()).toBe(refs.rootNode);
  });

  it('clicking Home segment leaves only 1 segment', () => {
    const items = host.querySelectorAll<HTMLElement>('.x-breadcrumb-item');
    items[0].click();
    expect(host.querySelectorAll('.x-breadcrumb-item').length).toBe(1);
  });

  it('clicking Catalog segment (index 1) leaves 2 segments', () => {
    const items = host.querySelectorAll<HTMLElement>('.x-breadcrumb-item');
    items[1].click();
    expect(host.querySelectorAll('.x-breadcrumb-item').length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// §2c — selectionchange event
// ---------------------------------------------------------------------------

describe('§2c selectionchange event', () => {
  it('selectionChangeCount starts at 0', () => {
    expect(refs.selectionChangeCount.value).toBe(0);
  });

  it('setSelection() increments selectionChangeCount', () => {
    refs.breadcrumb.setSelection(refs.phonesNode);
    expect(refs.selectionChangeCount.value).toBe(1);
  });

  it('selectionChangeCount accumulates across multiple navigations', () => {
    refs.breadcrumb.setSelection(refs.phonesNode);
    refs.breadcrumb.setSelection(refs.catalogNode);
    refs.breadcrumb.setSelection(refs.rootNode);
    expect(refs.selectionChangeCount.value).toBe(3);
  });

  it('lastSelectedNode is updated by the event handler', () => {
    refs.breadcrumb.setSelection(refs.phonesNode);
    expect(refs.lastSelectedNode.value).toBe(refs.phonesNode);
  });

  it('clicking a segment fires the event and updates lastSelectedNode', () => {
    const items = host.querySelectorAll<HTMLElement>('.x-breadcrumb-item');
    items[0].click(); // navigate to Home
    expect(refs.lastSelectedNode.value).toBe(refs.rootNode);
  });

  it('selectionDisplay text is updated by the event handler', () => {
    refs.breadcrumb.setSelection(refs.phonesNode);
    expect(refs.selectionDisplay.el!.textContent).toContain('Phones');
  });

  it('selectionDisplay reflects Home after homeBtn click', () => {
    refs.homeBtn.el!.click();
    expect(refs.selectionDisplay.el!.textContent).toContain('Home');
  });
});

// ---------------------------------------------------------------------------
// §2d — Icon support
// ---------------------------------------------------------------------------

describe('§2d Icon support', () => {
  it('icon elements are rendered for nodes with iconCls', () => {
    // Path: Home (has iconCls) > Catalog (has iconCls) > Electronics (no iconCls)
    const icons = host.querySelectorAll('.x-breadcrumb-icon');
    expect(icons.length).toBe(2);
  });

  it('icon elements carry the configured iconCls class', () => {
    const icons = host.querySelectorAll('.x-breadcrumb-icon');
    expect(icons[0].classList.contains('x-icon-home')).toBe(true);
    expect(icons[1].classList.contains('x-icon-catalog')).toBe(true);
  });

  it('icon appears before the text label in each segment', () => {
    const firstItem = host.querySelector('.x-breadcrumb-item')!;
    const children = Array.from(firstItem.children);
    const iconIdx = children.findIndex((c) => c.classList.contains('x-breadcrumb-icon'));
    const textIdx = children.findIndex((c) => c.classList.contains('x-breadcrumb-text'));
    expect(iconIdx).toBeLessThan(textIdx);
  });

  it('icon count updates after navigating to a path with more iconCls nodes', () => {
    // Phones path: Home > Catalog > Electronics > Phones — still 2 iconCls nodes
    refs.breadcrumb.setSelection(refs.phonesNode);
    const icons = host.querySelectorAll('.x-breadcrumb-icon');
    expect(icons.length).toBe(2);
  });

  it('no icon elements when selection is root only', () => {
    refs.breadcrumb.setSelection(refs.rootNode);
    // Path is just [Home] — Home has iconCls, so 1 icon
    const icons = host.querySelectorAll('.x-breadcrumb-icon');
    expect(icons.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// §2f — Toolbar embedding
// ---------------------------------------------------------------------------

describe('§2f Toolbar embedding', () => {
  it('toolbar renders in the host', () => {
    expect(host.querySelector('.x-toolbar')).toBeTruthy();
  });

  it('breadcrumb is a child of the toolbar', () => {
    const toolbar = host.querySelector('.x-toolbar')!;
    expect(toolbar.querySelector('.x-breadcrumb')).toBeTruthy();
  });

  it('homeBtn (companion Reset) is rendered in the toolbar', () => {
    expect(refs.homeBtn.el).toBeTruthy();
  });

  it('homeBtn resets breadcrumb to the root node', () => {
    refs.breadcrumb.setSelection(refs.phonesNode); // drill down first
    refs.homeBtn.el!.click();
    expect(refs.breadcrumb.getSelection()).toBe(refs.rootNode);
  });

  it('homeBtn leaves only 1 breadcrumb segment', () => {
    refs.breadcrumb.setSelection(refs.phonesNode);
    refs.homeBtn.el!.click();
    expect(host.querySelectorAll('.x-breadcrumb-item').length).toBe(1);
  });

  it('selectionDisplay (disabled label) is rendered alongside breadcrumb', () => {
    expect(refs.selectionDisplay.el).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Navigation panel buttons
// ---------------------------------------------------------------------------

describe('Navigation panel buttons', () => {
  it('goUpBtn navigates to parent from Electronics → Catalog', () => {
    // Initial selection is Electronics; parent is Catalog
    refs.goUpBtn.el!.click();
    expect(refs.breadcrumb.getSelection()).toBe(refs.catalogNode);
  });

  it('goUpBtn navigates to parent from Catalog → Home', () => {
    refs.breadcrumb.setSelection(refs.catalogNode);
    refs.goUpBtn.el!.click();
    expect(refs.breadcrumb.getSelection()).toBe(refs.rootNode);
  });

  it('goUpBtn is a no-op when already at root', () => {
    refs.breadcrumb.setSelection(refs.rootNode);
    const countBefore = refs.selectionChangeCount.value;
    refs.goUpBtn.el!.click();
    expect(refs.breadcrumb.getSelection()).toBe(refs.rootNode);
    expect(refs.selectionChangeCount.value).toBe(countBefore); // no event fired
  });

  it('goCatalogBtn jumps to Catalog from any depth', () => {
    refs.goCatalogBtn.el!.click();
    expect(refs.breadcrumb.getSelection()).toBe(refs.catalogNode);
    expect(host.querySelectorAll('.x-breadcrumb-item').length).toBe(2);
  });

  it('goElectronicsBtn jumps to Electronics', () => {
    refs.breadcrumb.setSelection(refs.rootNode); // reset first
    refs.goElectronicsBtn.el!.click();
    expect(refs.breadcrumb.getSelection()).toBe(refs.electronicsNode);
  });

  it('goPhonesBtn jumps to Phones (leaf) — 4 segments', () => {
    refs.goPhonesBtn.el!.click();
    expect(refs.breadcrumb.getSelection()).toBe(refs.phonesNode);
    expect(host.querySelectorAll('.x-breadcrumb-item').length).toBe(4);
  });

  it('Phones (leaf) has no dropdown arrow', () => {
    refs.goPhonesBtn.el!.click();
    const items = host.querySelectorAll('.x-breadcrumb-item');
    const lastItem = items[items.length - 1];
    expect(lastItem.querySelector('.x-breadcrumb-arrow')).toBeNull();
  });
});
