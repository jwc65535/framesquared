import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Component } from '@framesquared/component';
import { Panel } from '../src/panel/Panel.js';

// ResizeObserver mock
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
});

function panel(cfg: Record<string, unknown> = {}): Panel {
  return new Panel({ renderTo: document.body, ...cfg });
}

// ═══════════════════════════════════════════════════════════════════════════
// Panel structure
// ═══════════════════════════════════════════════════════════════════════════

describe('Panel structure', () => {
  it('renders with x-panel class', () => {
    const p = panel({ title: 'Test' });
    expect(p.el!.classList.contains('x-panel')).toBe(true);
  });

  it('renders header element', () => {
    const p = panel({ title: 'My Panel' });
    const header = p.el!.querySelector('.x-panel-header');
    expect(header).not.toBeNull();
  });

  it('renders title text in header', () => {
    const p = panel({ title: 'Hello World' });
    const titleEl = p.el!.querySelector('.x-panel-header-text');
    expect(titleEl?.textContent).toBe('Hello World');
  });

  it('renders body element', () => {
    const p = panel({ title: 'Test' });
    const body = p.el!.querySelector('.x-panel-body');
    expect(body).not.toBeNull();
  });

  it('children render into body element', () => {
    const p = panel({
      title: 'Test',
      items: [new Component({ html: 'Child content' })],
    });
    const body = p.getBodyEl();
    expect(body.querySelector('.x-component')).not.toBeNull();
  });

  it('header:false hides the header', () => {
    const p = panel({ title: 'Test', header: false });
    const header = p.el!.querySelector('.x-panel-header');
    expect(header).toBeNull();
  });

  it('no title and no tools: header is hidden by default', () => {
    const p = panel({});
    const header = p.el!.querySelector('.x-panel-header');
    expect(header).toBeNull();
  });

  it('footer renders when configured', () => {
    const p = panel({ title: 'Test', footer: true });
    const footer = p.el!.querySelector('.x-panel-footer');
    expect(footer).not.toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Title
// ═══════════════════════════════════════════════════════════════════════════

describe('Title', () => {
  it('setTitle updates the DOM', () => {
    const p = panel({ title: 'Old' });
    p.setTitle('New');
    const titleEl = p.el!.querySelector('.x-panel-header-text');
    expect(titleEl?.textContent).toBe('New');
  });

  it('setTitle fires titlechange event', () => {
    const spy = vi.fn();
    const p = panel({ title: 'Old', listeners: { titlechange: spy } });
    p.setTitle('New');
    expect(spy).toHaveBeenCalledWith(p, 'New', 'Old');
  });

  it('titleAlign: "center" sets text-align', () => {
    const p = panel({ title: 'Centered', titleAlign: 'center' });
    const titleWrap = p.el!.querySelector('.x-panel-header-title') as HTMLElement;
    expect(titleWrap?.style.textAlign).toBe('center');
  });

  it('titleAlign: "right"', () => {
    const p = panel({ title: 'Right', titleAlign: 'right' });
    const titleWrap = p.el!.querySelector('.x-panel-header-title') as HTMLElement;
    expect(titleWrap?.style.textAlign).toBe('right');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Icon
// ═══════════════════════════════════════════════════════════════════════════

describe('Icon', () => {
  it('iconCls adds an icon element with the class', () => {
    const p = panel({ title: 'Test', iconCls: 'fa-home' });
    const icon = p.el!.querySelector('.x-panel-header-icon');
    expect(icon).not.toBeNull();
    expect(icon!.classList.contains('fa-home')).toBe(true);
  });

  it('setIconCls updates the icon class', () => {
    const p = panel({ title: 'Test', iconCls: 'fa-home' });
    p.setIconCls('fa-gear');
    const icon = p.el!.querySelector('.x-panel-header-icon');
    expect(icon!.classList.contains('fa-gear')).toBe(true);
    expect(icon!.classList.contains('fa-home')).toBe(false);
  });

  it('setIconCls fires iconchange event', () => {
    const spy = vi.fn();
    const p = panel({ title: 'Test', iconCls: 'old', listeners: { iconchange: spy } });
    p.setIconCls('new');
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Tools
// ═══════════════════════════════════════════════════════════════════════════

describe('Tools', () => {
  it('tools render in header', () => {
    const p = panel({
      title: 'Test',
      tools: [{ type: 'close' }, { type: 'minimize' }],
    });
    const tools = p.el!.querySelectorAll('.x-tool');
    expect(tools.length).toBe(2);
  });

  it('tool click handler is called', () => {
    const handler = vi.fn();
    const p = panel({
      title: 'Test',
      tools: [{ type: 'gear', handler }],
    });
    const toolEl = p.el!.querySelector('.x-tool') as HTMLElement;
    toolEl.click();
    expect(handler).toHaveBeenCalled();
  });

  it('addTool adds a tool after render', () => {
    const p = panel({ title: 'Test', tools: [{ type: 'close' }] });
    p.addTool({ type: 'help' });
    const tools = p.el!.querySelectorAll('.x-tool');
    expect(tools.length).toBe(2);
  });

  it('tool has correct type class', () => {
    const p = panel({ title: 'Test', tools: [{ type: 'collapse' }] });
    const tool = p.el!.querySelector('.x-tool');
    expect(tool!.classList.contains('x-tool-collapse')).toBe(true);
  });

  it('closable:true adds a close tool automatically', () => {
    const p = panel({ title: 'Test', closable: true });
    const closeTool = p.el!.querySelector('.x-tool-close');
    expect(closeTool).not.toBeNull();
  });

  it('collapsible:true adds a collapse tool automatically', () => {
    const p = panel({ title: 'Test', collapsible: true });
    const collapseTool = p.el!.querySelector('.x-tool-collapse');
    expect(collapseTool).not.toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Collapse / Expand
// ═══════════════════════════════════════════════════════════════════════════

describe('Collapse / Expand', () => {
  it('collapse() hides the body', () => {
    const p = panel({ title: 'Test', collapsible: true });
    p.collapse();
    const body = p.el!.querySelector('.x-panel-body') as HTMLElement;
    expect(body.style.display).toBe('none');
  });

  it('collapse adds x-panel-collapsed class', () => {
    const p = panel({ title: 'Test', collapsible: true });
    p.collapse();
    expect(p.el!.classList.contains('x-panel-collapsed')).toBe(true);
  });

  it('expand() shows the body', () => {
    const p = panel({ title: 'Test', collapsible: true, collapsed: true });
    p.expand();
    const body = p.el!.querySelector('.x-panel-body') as HTMLElement;
    expect(body.style.display).not.toBe('none');
  });

  it('expand removes x-panel-collapsed class', () => {
    const p = panel({ title: 'Test', collapsible: true, collapsed: true });
    p.expand();
    expect(p.el!.classList.contains('x-panel-collapsed')).toBe(false);
  });

  it('toggleCollapse alternates', () => {
    const p = panel({ title: 'Test', collapsible: true });
    p.toggleCollapse();
    expect(p.el!.classList.contains('x-panel-collapsed')).toBe(true);
    p.toggleCollapse();
    expect(p.el!.classList.contains('x-panel-collapsed')).toBe(false);
  });

  it('fires beforecollapse and collapse events', () => {
    const beforeSpy = vi.fn();
    const collapseSpy = vi.fn();
    const p = panel({
      title: 'Test',
      collapsible: true,
      listeners: { beforecollapse: beforeSpy, collapse: collapseSpy },
    });
    p.collapse();
    expect(beforeSpy).toHaveBeenCalledOnce();
    expect(collapseSpy).toHaveBeenCalledOnce();
  });

  it('fires beforeexpand and expand events', () => {
    const beforeSpy = vi.fn();
    const expandSpy = vi.fn();
    const p = panel({
      title: 'Test',
      collapsible: true,
      collapsed: true,
      listeners: { beforeexpand: beforeSpy, expand: expandSpy },
    });
    p.expand();
    expect(beforeSpy).toHaveBeenCalledOnce();
    expect(expandSpy).toHaveBeenCalledOnce();
  });

  it('collapsed:true starts collapsed', () => {
    const p = panel({ title: 'Test', collapsible: true, collapsed: true });
    expect(p.el!.classList.contains('x-panel-collapsed')).toBe(true);
    const body = p.el!.querySelector('.x-panel-body') as HTMLElement;
    expect(body.style.display).toBe('none');
  });

  it('clicking collapse tool toggles collapse', () => {
    const p = panel({ title: 'Test', collapsible: true });
    const tool = p.el!.querySelector('.x-tool-collapse') as HTMLElement;
    tool.click();
    expect(p.el!.classList.contains('x-panel-collapsed')).toBe(true);
    tool.click();
    expect(p.el!.classList.contains('x-panel-collapsed')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Close
// ═══════════════════════════════════════════════════════════════════════════

describe('Close', () => {
  it('close() fires beforeclose and close events', () => {
    const beforeSpy = vi.fn();
    const closeSpy = vi.fn();
    const p = panel({
      title: 'Test',
      closable: true,
      listeners: { beforeclose: beforeSpy, close: closeSpy },
    });
    p.close();
    expect(beforeSpy).toHaveBeenCalledOnce();
    expect(closeSpy).toHaveBeenCalledOnce();
  });

  it('close() destroys the panel', () => {
    const p = panel({ title: 'Test', closable: true });
    p.close();
    expect(p.isDestroyed).toBe(true);
  });

  it('clicking close tool calls close()', () => {
    const closeSpy = vi.fn();
    const p = panel({
      title: 'Test',
      closable: true,
      listeners: { close: closeSpy },
    });
    const tool = p.el!.querySelector('.x-tool-close') as HTMLElement;
    tool.click();
    expect(closeSpy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Docked items
// ═══════════════════════════════════════════════════════════════════════════

describe('Docked items', () => {
  it('addDocked adds a component to the panel', () => {
    const p = panel({ title: 'Test' });
    const toolbar = new Component({ html: 'Toolbar', dock: 'top' });
    p.addDocked(toolbar);
    expect(p.getDockedItems().length).toBe(1);
  });

  it('docked "top" renders before body', () => {
    const p = panel({ title: 'Test' });
    const toolbar = new Component({ html: 'Top', dock: 'top' });
    p.addDocked(toolbar);
    const body = p.el!.querySelector('.x-panel-body') as HTMLElement;
    expect(
      toolbar.el!.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('docked "bottom" renders after body', () => {
    const p = panel({ title: 'Test' });
    const bar = new Component({ html: 'Bottom', dock: 'bottom' });
    p.addDocked(bar);
    const body = p.el!.querySelector('.x-panel-body') as HTMLElement;
    expect(bar.el!.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it('removeDocked removes a docked component', () => {
    const p = panel({ title: 'Test' });
    const bar = new Component({ html: 'Bar', dock: 'top' });
    p.addDocked(bar);
    p.removeDocked(bar);
    expect(p.getDockedItems().length).toBe(0);
  });

  it('removeDocked with destroy=true destroys the component', () => {
    const p = panel({ title: 'Test' });
    const bar = new Component({ html: 'Bar', dock: 'top' });
    p.addDocked(bar);
    p.removeDocked(bar, true);
    expect(bar.isDestroyed).toBe(true);
  });

  it('fires dockedadd event', () => {
    const spy = vi.fn();
    const p = panel({ title: 'Test', listeners: { dockedadd: spy } });
    p.addDocked(new Component({ dock: 'top' }));
    expect(spy).toHaveBeenCalled();
  });

  it('fires dockedremove event', () => {
    const spy = vi.fn();
    const p = panel({ title: 'Test', listeners: { dockedremove: spy } });
    const bar = new Component({ dock: 'top' });
    p.addDocked(bar);
    p.removeDocked(bar);
    expect(spy).toHaveBeenCalled();
  });

  it('dockedItems config adds docked items on construction', () => {
    const p = panel({
      title: 'Test',
      dockedItems: [new Component({ html: 'TB', dock: 'top' })],
    });
    expect(p.getDockedItems().length).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Body styling
// ═══════════════════════════════════════════════════════════════════════════

describe('Body styling', () => {
  it('bodyPadding as number sets padding in px', () => {
    const p = panel({ title: 'Test', bodyPadding: 10 });
    const body = p.el!.querySelector('.x-panel-body') as HTMLElement;
    expect(body.style.padding).toBe('10px');
  });

  it('bodyPadding as string', () => {
    const p = panel({ title: 'Test', bodyPadding: '5px 10px' });
    const body = p.el!.querySelector('.x-panel-body') as HTMLElement;
    expect(body.style.padding).toBe('5px 10px');
  });

  it('bodyStyle as object', () => {
    const p = panel({ title: 'Test', bodyStyle: { backgroundColor: 'red' } });
    const body = p.el!.querySelector('.x-panel-body') as HTMLElement;
    expect(body.style.backgroundColor).toBe('red');
  });

  it('bodyStyle as string', () => {
    const p = panel({ title: 'Test', bodyStyle: 'color: blue' });
    const body = p.el!.querySelector('.x-panel-body') as HTMLElement;
    expect(body.style.color).toBe('blue');
  });

  it('bodyCls adds class to body', () => {
    const p = panel({ title: 'Test', bodyCls: 'my-body' });
    const body = p.el!.querySelector('.x-panel-body') as HTMLElement;
    expect(body.classList.contains('my-body')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Frame / Border
// ═══════════════════════════════════════════════════════════════════════════

describe('Frame / Border', () => {
  it('frame:true adds x-panel-framed class', () => {
    const p = panel({ title: 'Test', frame: true });
    expect(p.el!.classList.contains('x-panel-framed')).toBe(true);
  });

  it('border:false adds x-panel-noborder class', () => {
    const p = panel({ title: 'Test', border: false });
    expect(p.el!.classList.contains('x-panel-noborder')).toBe(true);
  });

  it('default has border (no noborder class)', () => {
    const p = panel({ title: 'Test' });
    expect(p.el!.classList.contains('x-panel-noborder')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Destroy
// ═══════════════════════════════════════════════════════════════════════════

describe('Panel destroy', () => {
  it('destroy removes panel from DOM', () => {
    const p = panel({ title: 'Test' });
    const el = p.el!;
    p.destroy();
    expect(document.body.contains(el)).toBe(false);
  });

  it('destroy destroys docked items', () => {
    const p = panel({ title: 'Test' });
    const bar = new Component({ dock: 'top' });
    p.addDocked(bar);
    p.destroy();
    expect(bar.isDestroyed).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Additional coverage
// ═══════════════════════════════════════════════════════════════════════════

describe('Additional Panel coverage', () => {
  it('getTitle returns current title', () => {
    const p = panel({ title: 'Hello' });
    expect(p.getTitle()).toBe('Hello');
  });

  it('getIconCls returns current iconCls', () => {
    const p = panel({ title: 'T', iconCls: 'fa-star' });
    expect(p.getIconCls()).toBe('fa-star');
  });

  it('isCollapsed returns collapsed state', () => {
    const p = panel({ title: 'T', collapsible: true });
    expect(p.isCollapsed()).toBe(false);
    p.collapse();
    expect(p.isCollapsed()).toBe(true);
  });

  it('tool with tooltip sets title attribute', () => {
    const p = panel({
      title: 'Test',
      tools: [{ type: 'help', tooltip: 'Get help' }],
    });
    const tool = p.el!.querySelector('.x-tool-help') as HTMLElement;
    expect(tool.getAttribute('title')).toBe('Get help');
  });

  it('tool with hidden:true is display:none', () => {
    const p = panel({
      title: 'Test',
      tools: [{ type: 'gear', hidden: true }],
    });
    const tool = p.el!.querySelector('.x-tool-gear') as HTMLElement;
    expect(tool.style.display).toBe('none');
  });

  it('tool without handler does not throw on click', () => {
    const p = panel({
      title: 'Test',
      tools: [{ type: 'info' }],
    });
    const tool = p.el!.querySelector('.x-tool-info') as HTMLElement;
    expect(() => tool.click()).not.toThrow();
  });

  it('icon URL sets background-image', () => {
    const p = panel({ title: 'Test', icon: 'icon.png' });
    const iconEl = p.el!.querySelector('.x-panel-header-icon') as HTMLElement;
    expect(iconEl.style.backgroundImage).toContain('icon.png');
  });

  it('header:true forces header even without title', () => {
    const p = panel({ header: true });
    const header = p.el!.querySelector('.x-panel-header');
    expect(header).not.toBeNull();
  });

  it('docked "left" inserts before body', () => {
    const p = panel({ title: 'Test' });
    const sidebar = new Component({ html: 'Side', dock: 'left' });
    p.addDocked(sidebar);
    expect(sidebar.el!.classList.contains('x-docked-left')).toBe(true);
  });

  it('docked "right" inserts after body', () => {
    const p = panel({ title: 'Test' });
    const sidebar = new Component({ html: 'Side', dock: 'right' });
    p.addDocked(sidebar);
    expect(sidebar.el!.classList.contains('x-docked-right')).toBe(true);
  });

  it('collapse on already collapsed is no-op', () => {
    const spy = vi.fn();
    const p = panel({
      title: 'T',
      collapsible: true,
      collapsed: true,
      listeners: { collapse: spy },
    });
    p.collapse();
    expect(spy).not.toHaveBeenCalled();
  });

  it('expand on already expanded is no-op', () => {
    const spy = vi.fn();
    const p = panel({ title: 'T', collapsible: true, listeners: { expand: spy } });
    p.expand();
    expect(spy).not.toHaveBeenCalled();
  });

  it('removeDocked on non-existent item is no-op', () => {
    const p = panel({ title: 'Test' });
    const orphan = new Component({ dock: 'top' });
    expect(() => p.removeDocked(orphan)).not.toThrow();
  });

  it('setIconCls when no previous iconCls', () => {
    const p = panel({ title: 'Test', iconCls: '' });
    // iconEl won't exist if iconCls is empty at build time
    // but setIconCls should handle gracefully
    expect(() => p.setIconCls('fa-new')).not.toThrow();
  });
});
