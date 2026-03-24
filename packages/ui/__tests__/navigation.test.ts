import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Viewport } from '../src/container/Viewport.js';
import { Accordion } from '../src/container/Accordion.js';
import { CardContainer } from '../src/container/CardContainer.js';
import { Breadcrumb } from '../src/navigation/Breadcrumb.js';
import { Panel } from '../src/panel/Panel.js';
import { Component } from '@framesquared/component';

class MockRO { constructor() {} observe() {} unobserve() {} disconnect() {} }
beforeEach(() => { (globalThis as any).ResizeObserver = MockRO; });
afterEach(() => { document.body.innerHTML = ''; document.body.style.cssText = ''; });

// Minimal tree node for Breadcrumb tests
function makeTree() {
  const root: any = {
    id: 'root', text: 'Home', leaf: false, children: [],
    parent: null, get(f: string) { return (this as any)[f]; },
  };
  const docs: any = {
    id: 'docs', text: 'Docs', leaf: false, children: [],
    parent: root, get(f: string) { return (this as any)[f]; },
  };
  const api: any = {
    id: 'api', text: 'API', leaf: true, children: [],
    parent: docs, get(f: string) { return (this as any)[f]; },
  };
  const guide: any = {
    id: 'guide', text: 'Guide', leaf: true, children: [],
    parent: docs, get(f: string) { return (this as any)[f]; },
  };
  docs.children = [api, guide];
  const about: any = {
    id: 'about', text: 'About', leaf: true, children: [],
    parent: root, get(f: string) { return (this as any)[f]; },
  };
  root.children = [docs, about];

  const allNodes = [root, docs, api, guide, about];
  return {
    getRoot: () => root,
    getNodeById: (id: string) => allNodes.find(n => n.id === id) ?? null,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Viewport
// ═══════════════════════════════════════════════════════════════════════════

describe('Viewport', () => {
  it('renders with x-viewport class', () => {
    const vp = new Viewport({ items: [] });
    expect(vp.el!.classList.contains('x-viewport')).toBe(true);
  });

  it('renders into document.body', () => {
    const vp = new Viewport({ items: [] });
    expect(vp.el!.parentNode).toBe(document.body);
  });

  it('fills the viewport (100vw x 100vh)', () => {
    const vp = new Viewport({ items: [] });
    expect(vp.el!.style.width).toBe('100vw');
    expect(vp.el!.style.height).toBe('100vh');
  });

  it('sets body overflow hidden', () => {
    const _vp = new Viewport({ items: [] });
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('contains child items', () => {
    const vp = new Viewport({
      items: [
        new Panel({ title: 'North' }),
        new Panel({ title: 'Center' }),
      ],
    });
    expect(vp.getItems().length).toBe(2);
  });

  it('responds to window resize', () => {
    const spy = vi.fn();
    const vp = new Viewport({ items: [], listeners: { resize: spy } });
    window.dispatchEvent(new Event('resize'));
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Accordion
// ═══════════════════════════════════════════════════════════════════════════

describe('Accordion', () => {
  function accordion(cfg: Record<string, unknown> = {}): Accordion {
    return new Accordion({
      renderTo: document.body,
      items: cfg.items ?? [
        new Panel({ title: 'Section 1', html: '<p>Content 1</p>' }),
        new Panel({ title: 'Section 2', html: '<p>Content 2</p>' }),
        new Panel({ title: 'Section 3', html: '<p>Content 3</p>' }),
      ],
      ...cfg,
    });
  }

  it('renders with x-accordion class', () => {
    const a = accordion();
    expect(a.el!.classList.contains('x-accordion')).toBe(true);
  });

  it('contains all child panels', () => {
    const a = accordion();
    expect(a.getItems().length).toBe(3);
  });

  it('first panel is expanded by default', () => {
    const a = accordion();
    expect(a.isExpanded(0)).toBe(true);
  });

  it('other panels are collapsed by default', () => {
    const a = accordion();
    expect(a.isExpanded(1)).toBe(false);
    expect(a.isExpanded(2)).toBe(false);
  });

  it('expand collapses others (single mode)', () => {
    const a = accordion();
    a.expand(1);
    expect(a.isExpanded(0)).toBe(false);
    expect(a.isExpanded(1)).toBe(true);
  });

  it('multi:true allows multiple expanded', () => {
    const a = accordion({ multi: true });
    a.expand(0);
    a.expand(1);
    expect(a.isExpanded(0)).toBe(true);
    expect(a.isExpanded(1)).toBe(true);
  });

  it('collapse hides panel body', () => {
    const a = accordion();
    a.collapse(0);
    expect(a.isExpanded(0)).toBe(false);
  });

  it('clicking panel header toggles expansion', () => {
    const a = accordion();
    // Click second panel header to expand it
    const headers = a.el!.querySelectorAll('.x-accordion-header');
    (headers[1] as HTMLElement).click();
    expect(a.isExpanded(1)).toBe(true);
    expect(a.isExpanded(0)).toBe(false);
  });

  it('fires expand event', () => {
    const spy = vi.fn();
    const a = accordion({ listeners: { expand: spy } });
    a.expand(1);
    expect(spy).toHaveBeenCalled();
  });

  it('fires collapse event', () => {
    const spy = vi.fn();
    const a = accordion({ listeners: { collapse: spy } });
    a.collapse(0);
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CardContainer
// ═══════════════════════════════════════════════════════════════════════════

describe('CardContainer', () => {
  function cardContainer(cfg: Record<string, unknown> = {}): CardContainer {
    return new CardContainer({
      renderTo: document.body,
      items: cfg.items ?? [
        new Panel({ title: 'Step 1', html: '<p>First</p>' }),
        new Panel({ title: 'Step 2', html: '<p>Second</p>' }),
        new Panel({ title: 'Step 3', html: '<p>Third</p>' }),
      ],
      ...cfg,
    });
  }

  it('renders with x-card-container class', () => {
    const cc = cardContainer();
    expect(cc.el!.classList.contains('x-card-container')).toBe(true);
  });

  it('only active item is visible', () => {
    const cc = cardContainer();
    const items = cc.getItems();
    expect(items[0].el?.style.display).not.toBe('none');
    expect(items[1].el?.style.display).toBe('none');
    expect(items[2].el?.style.display).toBe('none');
  });

  it('setActiveItem changes visible card', () => {
    const cc = cardContainer();
    cc.setActiveItem(1);
    const items = cc.getItems();
    expect(items[0].el?.style.display).toBe('none');
    expect(items[1].el?.style.display).not.toBe('none');
  });

  it('next advances to next card', () => {
    const cc = cardContainer();
    cc.next();
    expect(cc.getActiveIndex()).toBe(1);
  });

  it('prev goes to previous card', () => {
    const cc = cardContainer();
    cc.setActiveItem(2);
    cc.prev();
    expect(cc.getActiveIndex()).toBe(1);
  });

  it('next at last card stays', () => {
    const cc = cardContainer();
    cc.setActiveItem(2);
    cc.next();
    expect(cc.getActiveIndex()).toBe(2);
  });

  it('prev at first card stays', () => {
    const cc = cardContainer();
    cc.prev();
    expect(cc.getActiveIndex()).toBe(0);
  });

  it('getActiveItem returns the visible component', () => {
    const cc = cardContainer();
    cc.setActiveItem(1);
    const active = cc.getActiveItem();
    expect(active).toBe(cc.getItems()[1]);
  });

  it('fires cardchange event', () => {
    const spy = vi.fn();
    const cc = cardContainer({ listeners: { cardchange: spy } });
    cc.next();
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Breadcrumb
// ═══════════════════════════════════════════════════════════════════════════

describe('Breadcrumb', () => {
  function breadcrumb(cfg: Record<string, unknown> = {}): Breadcrumb {
    return new Breadcrumb({
      renderTo: document.body,
      store: makeTree(),
      ...cfg,
    });
  }

  it('renders with x-breadcrumb class', () => {
    const b = breadcrumb();
    expect(b.el!.classList.contains('x-breadcrumb')).toBe(true);
  });

  it('renders root node by default', () => {
    const b = breadcrumb();
    expect(b.el!.textContent).toContain('Home');
  });

  it('selecting a deep node shows path segments', () => {
    const store = makeTree();
    const b = breadcrumb({ store, selection: store.getNodeById('api') });
    const items = b.el!.querySelectorAll('.x-breadcrumb-item');
    expect(items.length).toBe(3); // Home > Docs > API
    expect(items[0].textContent).toContain('Home');
    expect(items[1].textContent).toContain('Docs');
    expect(items[2].textContent).toContain('API');
  });

  it('clicking a breadcrumb item navigates to that node', () => {
    const store = makeTree();
    const b = breadcrumb({ store, selection: store.getNodeById('api') });
    const items = b.el!.querySelectorAll('.x-breadcrumb-item');
    // Click "Docs" to navigate back
    (items[1] as HTMLElement).click();
    // Now selection should be Docs, path: Home > Docs
    const newItems = b.el!.querySelectorAll('.x-breadcrumb-item');
    expect(newItems.length).toBe(2);
  });

  it('fires selectionchange event on navigation', () => {
    const spy = vi.fn();
    const store = makeTree();
    const b = breadcrumb({ store, selection: store.getNodeById('api'), listeners: { selectionchange: spy } });
    const items = b.el!.querySelectorAll('.x-breadcrumb-item');
    (items[0] as HTMLElement).click();
    expect(spy).toHaveBeenCalled();
  });

  it('non-leaf items have dropdown arrow', () => {
    const store = makeTree();
    const b = breadcrumb({ store, selection: store.getNodeById('api') });
    const items = b.el!.querySelectorAll('.x-breadcrumb-item');
    // Home and Docs are non-leaf, API is leaf
    expect(items[0].querySelector('.x-breadcrumb-arrow')).not.toBeNull();
    expect(items[1].querySelector('.x-breadcrumb-arrow')).not.toBeNull();
    expect(items[2].querySelector('.x-breadcrumb-arrow')).toBeNull();
  });

  it('clicking arrow shows dropdown of children', () => {
    const store = makeTree();
    const b = breadcrumb({ store, selection: store.getNodeById('api') });
    const arrow = b.el!.querySelector('.x-breadcrumb-arrow') as HTMLElement;
    arrow.click();
    const dropdown = document.body.querySelector('.x-breadcrumb-dropdown');
    expect(dropdown).not.toBeNull();
  });

  it('setSelection changes the path', () => {
    const store = makeTree();
    const b = breadcrumb({ store });
    b.setSelection(store.getNodeById('guide')!);
    const items = b.el!.querySelectorAll('.x-breadcrumb-item');
    expect(items.length).toBe(3); // Home > Docs > Guide
    expect(items[2].textContent).toContain('Guide');
  });

  it('getSelection returns current node', () => {
    const store = makeTree();
    const node = store.getNodeById('docs');
    const b = breadcrumb({ store, selection: node });
    expect(b.getSelection()).toBe(node);
  });
});
