import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { Panel, TabPanel, Accordion, CardContainer, Viewport } from '@framesquared/ui';
import { TreePanel, TreeStore } from '@framesquared/grid';

class MockRO {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeEach(() => {
  (globalThis as any).ResizeObserver = MockRO;
});
afterEach(() => {
  document.body.innerHTML = '';
  document.body.style.cssText = '';
});

describe('Complex layout integration', () => {
  it('nested Panel hierarchy renders correctly', () => {
    const outer = new Panel({
      title: 'App',
      renderTo: document.body,
      items: [
        new Panel({ title: 'Sidebar', html: '<p>Nav</p>' }),
        new Panel({ title: 'Content', html: '<p>Main</p>' }),
      ],
    });

    expect(outer.el).not.toBeNull();
    expect(outer.el!.querySelectorAll('.x-panel').length).toBeGreaterThanOrEqual(2);
    expect(outer.el!.textContent).toContain('Sidebar');
    expect(outer.el!.textContent).toContain('Content');
  });

  it('TabPanel with multiple Panel children', () => {
    const tp = new TabPanel({
      renderTo: document.body,
      items: [
        new Panel({ title: 'Dashboard', html: '<p>Charts</p>' }),
        new Panel({ title: 'Reports', html: '<p>Tables</p>' }),
        new Panel({ title: 'Settings', html: '<p>Config</p>' }),
      ],
    });

    // Tab bar renders
    const tabs = tp.el!.querySelectorAll('.x-tab');
    expect(tabs.length).toBe(3);

    // First tab active
    expect(tabs[0].classList.contains('x-tab-active')).toBe(true);
    expect(tp.el!.textContent).toContain('Charts');

    // Switch to second tab
    tp.setActiveTab(1);
    expect(tabs[1].classList.contains('x-tab-active')).toBe(true);
    const items = tp.getTabItems();
    expect(items[1].el?.style.display).not.toBe('none');
  });

  it('TreePanel within a Panel', () => {
    const treeStore = new TreeStore({
      root: {
        text: 'Root',
        expanded: true,
        children: [
          { id: 'a', text: 'Section A', children: [{ id: 'a1', text: 'Item A1', leaf: true }] },
          { id: 'b', text: 'Section B', leaf: true },
        ],
      },
    });

    const container = new Panel({
      title: 'Navigation',
      renderTo: document.body,
      items: [new TreePanel({ title: 'Tree', store: treeStore })],
    });

    expect(container.el!.textContent).toContain('Section A');
    expect(container.el!.textContent).toContain('Section B');
    expect(container.el!.querySelectorAll('.x-tree-node').length).toBe(3); // Root + A + B
  });

  it('Accordion with collapsible sections', () => {
    const acc = new Accordion({
      renderTo: document.body,
      items: [
        new Panel({ title: 'General', html: '<p>General settings</p>' }),
        new Panel({ title: 'Advanced', html: '<p>Advanced settings</p>' }),
        new Panel({ title: 'About', html: '<p>Version info</p>' }),
      ],
    });

    expect(acc.isExpanded(0)).toBe(true);
    expect(acc.isExpanded(1)).toBe(false);

    acc.expand(2);
    expect(acc.isExpanded(0)).toBe(false); // collapsed
    expect(acc.isExpanded(2)).toBe(true);
  });

  it('CardContainer wizard-style navigation', () => {
    const cc = new CardContainer({
      renderTo: document.body,
      items: [
        new Panel({ title: 'Step 1', html: '<p>Enter name</p>' }),
        new Panel({ title: 'Step 2', html: '<p>Enter email</p>' }),
        new Panel({ title: 'Step 3', html: '<p>Confirm</p>' }),
      ],
    });

    expect(cc.getActiveIndex()).toBe(0);

    cc.next();
    expect(cc.getActiveIndex()).toBe(1);

    cc.next();
    expect(cc.getActiveIndex()).toBe(2);

    cc.prev();
    expect(cc.getActiveIndex()).toBe(1);
  });

  it('Viewport renders into body', () => {
    const vp = new Viewport({
      items: [new Panel({ title: 'Main', html: '<p>Content</p>' })],
    });

    expect(vp.el!.parentNode).toBe(document.body);
    expect(vp.el!.classList.contains('x-viewport')).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('TabPanel with closable tabs', () => {
    const tp = new TabPanel({
      renderTo: document.body,
      items: [
        new Panel({ title: 'Home' }),
        new Panel({ title: 'Temp', closable: true }),
        new Panel({ title: 'Other' }),
      ],
    });

    expect(tp.getTabItems().length).toBe(3);

    // Close the closable tab
    const closeBtn = tp
      .el!.querySelectorAll('.x-tab')[1]
      .querySelector('.x-tab-close') as HTMLElement;
    closeBtn.click();

    expect(tp.getTabItems().length).toBe(2);
  });
});
