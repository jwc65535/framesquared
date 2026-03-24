import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Component } from '../src/Component.js';
import { Template } from '../src/Template.js';

// ---------------------------------------------------------------------------
// ResizeObserver mock (jsdom doesn't have it)
// ---------------------------------------------------------------------------

class MockResizeObserver {
  callback: ResizeObserverCallback;
  observed: Element[] = [];
  static instances: MockResizeObserver[] = [];

  constructor(cb: ResizeObserverCallback) {
    this.callback = cb;
    MockResizeObserver.instances.push(this);
  }
  observe(el: Element) { this.observed.push(el); }
  unobserve(el: Element) {
    const i = this.observed.indexOf(el);
    if (i !== -1) this.observed.splice(i, 1);
  }
  disconnect() { this.observed.length = 0; }

  // Test helper: simulate a resize
  trigger(entries: Partial<ResizeObserverEntry>[]) {
    this.callback(entries as ResizeObserverEntry[], this as unknown as ResizeObserver);
  }
}

beforeEach(() => {
  MockResizeObserver.instances = [];
  (globalThis as any).ResizeObserver = MockResizeObserver;
});

afterEach(() => {
  document.body.innerHTML = '';
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createComponent(config: Record<string, unknown> = {}): Component {
  return new Component(config);
}

function renderTo(config: Record<string, unknown> = {}): Component {
  const c = createComponent({ ...config, renderTo: document.body });
  return c;
}

// ═══════════════════════════════════════════════════════════════════════════
// Lifecycle
// ═══════════════════════════════════════════════════════════════════════════

describe('Component Lifecycle', () => {
  it('constructs without rendering', () => {
    const c = createComponent();
    expect(c.rendered).toBe(false);
    expect(c.el).toBeNull();
  });

  it('lifecycle phases execute in order', () => {
    const order: string[] = [];
    class TestComp extends Component {
      override beforeInitialize() { order.push('beforeInit'); }
      override initialize() { order.push('init'); }
      override afterInitialize() { order.push('afterInit'); }
      override beforeRender() { order.push('beforeRender'); }
      override afterRender() { order.push('afterRender'); }
    }
    const c = new TestComp({ renderTo: document.body });
    expect(order).toEqual(['beforeInit', 'init', 'afterInit', 'beforeRender', 'afterRender']);
    expect(c.rendered).toBe(true);
  });

  it('destroy lifecycle', () => {
    const order: string[] = [];
    class TestComp extends Component {
      override beforeDestroy() { order.push('beforeDestroy'); }
      override onDestroy() { order.push('onDestroy'); }
      override afterDestroy() { order.push('afterDestroy'); }
    }
    const c = new TestComp({ renderTo: document.body });
    c.destroy();
    expect(order).toEqual(['beforeDestroy', 'onDestroy', 'afterDestroy']);
    expect(c.isDestroyed).toBe(true);
  });

  it('renderTo auto-renders to the given element', () => {
    const c = renderTo();
    expect(c.rendered).toBe(true);
    expect(c.el).not.toBeNull();
    expect(document.body.contains(c.el!)).toBe(true);
  });

  it('render() renders to a specific container', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const c = createComponent();
    c.render(container);
    expect(c.rendered).toBe(true);
    expect(container.contains(c.el!)).toBe(true);
  });

  it('render() with string selector', () => {
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    const c = createComponent();
    c.render('#test-container');
    expect(container.contains(c.el!)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Config application
// ═══════════════════════════════════════════════════════════════════════════

describe('Config application', () => {
  it('applies cls as CSS classes', () => {
    const c = renderTo({ cls: 'my-cls another-cls' });
    expect(c.el!.classList.contains('my-cls')).toBe(true);
    expect(c.el!.classList.contains('another-cls')).toBe(true);
  });

  it('applies cls as array', () => {
    const c = renderTo({ cls: ['cls-a', 'cls-b'] });
    expect(c.el!.classList.contains('cls-a')).toBe(true);
    expect(c.el!.classList.contains('cls-b')).toBe(true);
  });

  it('applies style as object', () => {
    const c = renderTo({ style: { backgroundColor: 'red', fontSize: '14px' } });
    expect(c.el!.style.backgroundColor).toBe('red');
    expect(c.el!.style.fontSize).toBe('14px');
  });

  it('applies style as string', () => {
    const c = renderTo({ style: 'color: blue; font-weight: bold' });
    expect(c.el!.style.color).toBe('blue');
  });

  it('applies width and height', () => {
    const c = renderTo({ width: 200, height: 100 });
    expect(c.el!.style.width).toBe('200px');
    expect(c.el!.style.height).toBe('100px');
  });

  it('applies width/height as string with units', () => {
    const c = renderTo({ width: '50%', height: '10em' });
    expect(c.el!.style.width).toBe('50%');
    expect(c.el!.style.height).toBe('10em');
  });

  it('applies html content', () => {
    const c = renderTo({ html: '<span>Hello</span>' });
    expect(c.el!.innerHTML).toBe('<span>Hello</span>');
  });

  it('applies hidden config', () => {
    const c = renderTo({ hidden: true });
    expect(c.el!.style.display).toBe('none');
    expect(c.isVisible()).toBe(false);
  });

  it('applies disabled config', () => {
    const c = renderTo({ disabled: true });
    expect(c.isDisabled()).toBe(true);
    expect(c.el!.classList.contains('x-disabled')).toBe(true);
  });

  it('applies margin', () => {
    const c = renderTo({ margin: '10px 20px' });
    expect(c.el!.style.margin).toBe('10px 20px');
  });

  it('applies padding', () => {
    const c = renderTo({ padding: 8 });
    expect(c.el!.style.padding).toBe('8px');
  });

  it('applies minWidth/maxWidth/minHeight/maxHeight', () => {
    const c = renderTo({ minWidth: 50, maxWidth: 500, minHeight: 30, maxHeight: 300 });
    expect(c.el!.style.minWidth).toBe('50px');
    expect(c.el!.style.maxWidth).toBe('500px');
    expect(c.el!.style.minHeight).toBe('30px');
    expect(c.el!.style.maxHeight).toBe('300px');
  });

  it('applies listeners from config', () => {
    const spy = vi.fn();
    const c = renderTo({ listeners: { show: spy } });
    c.show();
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CSS operations
// ═══════════════════════════════════════════════════════════════════════════

describe('CSS operations', () => {
  it('addCls adds classes', () => {
    const c = renderTo();
    c.addCls('foo', 'bar');
    expect(c.el!.classList.contains('foo')).toBe(true);
    expect(c.el!.classList.contains('bar')).toBe(true);
  });

  it('removeCls removes classes', () => {
    const c = renderTo({ cls: 'foo bar' });
    c.removeCls('foo');
    expect(c.el!.classList.contains('foo')).toBe(false);
    expect(c.el!.classList.contains('bar')).toBe(true);
  });

  it('toggleCls toggles a class', () => {
    const c = renderTo();
    c.toggleCls('active');
    expect(c.hasCls('active')).toBe(true);
    c.toggleCls('active');
    expect(c.hasCls('active')).toBe(false);
  });

  it('toggleCls with explicit state', () => {
    const c = renderTo();
    c.toggleCls('active', true);
    expect(c.hasCls('active')).toBe(true);
    c.toggleCls('active', true);
    expect(c.hasCls('active')).toBe(true);
    c.toggleCls('active', false);
    expect(c.hasCls('active')).toBe(false);
  });

  it('setStyle with string prop and value', () => {
    const c = renderTo();
    c.setStyle('color', 'red');
    expect(c.el!.style.color).toBe('red');
  });

  it('setStyle with object', () => {
    const c = renderTo();
    c.setStyle({ color: 'blue', fontSize: '20px' });
    expect(c.el!.style.color).toBe('blue');
    expect(c.el!.style.fontSize).toBe('20px');
  });

  it('getStyle returns current style', () => {
    const c = renderTo({ style: { color: 'green' } });
    expect(c.getStyle('color')).toBe('green');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Show / Hide
// ═══════════════════════════════════════════════════════════════════════════

describe('Show / Hide', () => {
  it('show makes component visible', () => {
    const c = renderTo({ hidden: true });
    c.show();
    expect(c.isVisible()).toBe(true);
    expect(c.el!.style.display).not.toBe('none');
  });

  it('hide makes component invisible', () => {
    const c = renderTo();
    c.hide();
    expect(c.isVisible()).toBe(false);
    expect(c.el!.style.display).toBe('none');
  });

  it('setVisible toggles visibility', () => {
    const c = renderTo();
    c.setVisible(false);
    expect(c.isVisible()).toBe(false);
    c.setVisible(true);
    expect(c.isVisible()).toBe(true);
  });

  it('fires show/hide events', () => {
    const showSpy = vi.fn();
    const hideSpy = vi.fn();
    const c = renderTo({ listeners: { show: showSpy, hide: hideSpy } });
    c.hide();
    expect(hideSpy).toHaveBeenCalledOnce();
    c.show();
    expect(showSpy).toHaveBeenCalledOnce();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Enable / Disable
// ═══════════════════════════════════════════════════════════════════════════

describe('Enable / Disable', () => {
  it('disable sets disabled state', () => {
    const c = renderTo();
    c.disable();
    expect(c.isDisabled()).toBe(true);
    expect(c.el!.classList.contains('x-disabled')).toBe(true);
  });

  it('enable clears disabled state', () => {
    const c = renderTo({ disabled: true });
    c.enable();
    expect(c.isDisabled()).toBe(false);
    expect(c.el!.classList.contains('x-disabled')).toBe(false);
  });

  it('fires enable/disable events', () => {
    const enableSpy = vi.fn();
    const disableSpy = vi.fn();
    const c = renderTo({ listeners: { enable: enableSpy, disable: disableSpy } });
    c.disable();
    expect(disableSpy).toHaveBeenCalledOnce();
    c.enable();
    expect(enableSpy).toHaveBeenCalledOnce();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Size & Position
// ═══════════════════════════════════════════════════════════════════════════

describe('Size & Position', () => {
  it('setWidth / setHeight', () => {
    const c = renderTo();
    c.setWidth(300);
    c.setHeight(150);
    expect(c.el!.style.width).toBe('300px');
    expect(c.el!.style.height).toBe('150px');
  });

  it('setSize sets both', () => {
    const c = renderTo();
    c.setSize(200, 100);
    expect(c.el!.style.width).toBe('200px');
    expect(c.el!.style.height).toBe('100px');
  });

  it('setSize with string units', () => {
    const c = renderTo();
    c.setSize('50%', '10em');
    expect(c.el!.style.width).toBe('50%');
    expect(c.el!.style.height).toBe('10em');
  });

  it('setPosition sets left/top', () => {
    const c = renderTo();
    c.setPosition(100, 200);
    expect(c.el!.style.left).toBe('100px');
    expect(c.el!.style.top).toBe('200px');
  });

  it('setX / setY', () => {
    const c = renderTo();
    c.setX(50);
    c.setY(75);
    expect(c.el!.style.left).toBe('50px');
    expect(c.el!.style.top).toBe('75px');
  });

  it('ResizeObserver triggers resize event', () => {
    const spy = vi.fn();
    const c = renderTo({ listeners: { resize: spy } });
    // Simulate resize
    const observer = MockResizeObserver.instances[MockResizeObserver.instances.length - 1];
    observer.trigger([{
      target: c.el!,
      contentRect: { width: 500, height: 300, x: 0, y: 0, top: 0, left: 0, bottom: 300, right: 500 },
    }]);
    expect(spy).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Template rendering
// ═══════════════════════════════════════════════════════════════════════════

describe('Template rendering', () => {
  it('renders tpl with data', () => {
    const tpl = new Template('<div class="user">{name} - {age}</div>');
    const c = renderTo({ tpl, data: { name: 'Alice', age: 30 } });
    expect(c.el!.innerHTML).toContain('Alice');
    expect(c.el!.innerHTML).toContain('30');
  });

  it('update with string replaces html', () => {
    const c = renderTo({ html: 'initial' });
    c.update('updated');
    expect(c.el!.innerHTML).toBe('updated');
  });

  it('update with object re-renders tpl', () => {
    const tpl = new Template('Hello {name}');
    const c = renderTo({ tpl, data: { name: 'Alice' } });
    c.update({ name: 'Bob' });
    expect(c.el!.innerHTML).toContain('Bob');
  });

  it('setHtml replaces innerHTML', () => {
    const c = renderTo();
    c.setHtml('<b>Bold</b>');
    expect(c.el!.innerHTML).toBe('<b>Bold</b>');
  });

  it('setData re-renders tpl with new data', () => {
    const tpl = new Template('Count: {count}');
    const c = renderTo({ tpl, data: { count: 1 } });
    c.setData({ count: 42 });
    expect(c.el!.innerHTML).toContain('42');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Events
// ═══════════════════════════════════════════════════════════════════════════

describe('Events', () => {
  it('fires beforerender and render events', () => {
    const beforeSpy = vi.fn();
    const renderSpy = vi.fn();
    const afterSpy = vi.fn();
    const c = createComponent({
      listeners: { beforerender: beforeSpy, render: renderSpy, afterrender: afterSpy },
    });
    c.render(document.body);
    expect(beforeSpy).toHaveBeenCalledOnce();
    expect(renderSpy).toHaveBeenCalledOnce();
    expect(afterSpy).toHaveBeenCalledOnce();
  });

  it('fires beforedestroy and destroy events', () => {
    const beforeSpy = vi.fn();
    const destroySpy = vi.fn();
    const c = renderTo({
      listeners: { beforedestroy: beforeSpy, destroy: destroySpy },
    });
    c.destroy();
    expect(beforeSpy).toHaveBeenCalledOnce();
    expect(destroySpy).toHaveBeenCalledOnce();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Focus management
// ═══════════════════════════════════════════════════════════════════════════

describe('Focus management', () => {
  it('focus() calls focus on the element', () => {
    const c = renderTo();
    // Make it focusable
    c.el!.tabIndex = 0;
    const spy = vi.spyOn(c.el!, 'focus');
    c.focus();
    expect(spy).toHaveBeenCalled();
  });

  it('blur() calls blur on the element', () => {
    const c = renderTo();
    c.el!.tabIndex = 0;
    const spy = vi.spyOn(c.el!, 'blur');
    c.blur();
    expect(spy).toHaveBeenCalled();
  });

  it('isFocusable returns true when element has tabIndex', () => {
    const c = renderTo();
    c.el!.tabIndex = 0;
    expect(c.isFocusable()).toBe(true);
  });

  it('isFocusable returns false when disabled', () => {
    const c = renderTo({ disabled: true });
    c.el!.tabIndex = 0;
    expect(c.isFocusable()).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Destroy cleanup
// ═══════════════════════════════════════════════════════════════════════════

describe('Destroy cleanup', () => {
  it('removes DOM element on destroy', () => {
    const c = renderTo();
    const el = c.el!;
    expect(document.body.contains(el)).toBe(true);
    c.destroy();
    expect(document.body.contains(el)).toBe(false);
  });

  it('disconnects ResizeObserver on destroy', () => {
    const c = renderTo();
    const observer = MockResizeObserver.instances[MockResizeObserver.instances.length - 1];
    const disconnectSpy = vi.spyOn(observer, 'disconnect');
    c.destroy();
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('clears event listeners on destroy', () => {
    const spy = vi.fn();
    const c = renderTo({ listeners: { show: spy } });
    c.destroy();
    // Calling show after destroy should not fire the event
    // (show itself should be a no-op after destroy)
    expect(spy).not.toHaveBeenCalled();
  });

  it('double destroy is safe', () => {
    const c = renderTo();
    c.destroy();
    expect(() => c.destroy()).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Template (standalone)
// ═══════════════════════════════════════════════════════════════════════════

describe('Template', () => {
  it('render() is alias for apply()', () => {
    const tpl = new Template('Hello {name}');
    expect(tpl.render({ name: 'World' })).toBe('Hello World');
  });

  it('supports nested dot paths', () => {
    const tpl = new Template('{user.name} ({user.address.city})');
    const result = tpl.apply({
      user: { name: 'Alice', address: { city: 'NYC' } },
    });
    expect(result).toBe('Alice (NYC)');
  });

  it('missing tokens resolve to empty string', () => {
    const tpl = new Template('Hello {missing}');
    expect(tpl.apply({})).toBe('Hello ');
  });

  it('null values resolve to empty string', () => {
    const tpl = new Template('Value: {x}');
    expect(tpl.apply({ x: null })).toBe('Value: ');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Additional coverage: getEl, onAdded, onRemoved, getters, edge cases
// ═══════════════════════════════════════════════════════════════════════════

describe('Additional API coverage', () => {
  it('getEl and getElement return el', () => {
    const c = renderTo();
    expect(c.getEl()).toBe(c.el);
    expect(c.getElement()).toBe(c.el);
  });

  it('getEl returns null before render', () => {
    const c = createComponent();
    expect(c.getEl()).toBeNull();
  });

  it('onAdded fires "added" event', () => {
    const spy = vi.fn();
    const c = renderTo({ listeners: { added: spy } });
    const owner = renderTo();
    c.onAdded(owner, 0);
    expect(spy).toHaveBeenCalledWith(c, owner, 0);
  });

  it('onRemoved fires "removed" event', () => {
    const spy = vi.fn();
    const c = renderTo({ listeners: { removed: spy } });
    c.onRemoved(false);
    expect(spy).toHaveBeenCalledWith(c, false);
  });

  it('getWidth / getHeight / getSize return 0 in jsdom', () => {
    const c = renderTo({ width: 200, height: 100 });
    // jsdom doesn't do layout, so offsetWidth/Height are 0
    expect(c.getSize()).toEqual({ width: 0, height: 0 });
  });

  it('getX / getY / getBox', () => {
    const c = renderTo();
    c.setPosition(10, 20);
    expect(c.getBox()).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });

  it('render with position as number inserts at index', () => {
    const container = document.createElement('div');
    const existing = document.createElement('span');
    container.appendChild(existing);
    document.body.appendChild(container);

    const c = createComponent();
    c.render(container, 0);
    expect(container.children[0]).toBe(c.el);
    expect(container.children[1]).toBe(existing);
  });

  it('render with position as Element inserts before it', () => {
    const container = document.createElement('div');
    const existing = document.createElement('span');
    container.appendChild(existing);
    document.body.appendChild(container);

    const c = createComponent();
    c.render(container, existing);
    expect(container.children[0]).toBe(c.el);
  });

  it('render is a no-op if already rendered', () => {
    const c = renderTo();
    const el = c.el;
    c.render(document.body);
    expect(c.el).toBe(el); // same element
  });

  it('setStyle on unrendered component is a no-op', () => {
    const c = createComponent();
    expect(() => c.setStyle('color', 'red')).not.toThrow();
  });

  it('addCls on unrendered component is a no-op', () => {
    const c = createComponent();
    expect(() => c.addCls('foo')).not.toThrow();
  });

  it('getStyle returns empty string when not rendered', () => {
    const c = createComponent();
    expect(c.getStyle('color')).toBe('');
  });

  it('hasCls returns false when not rendered', () => {
    const c = createComponent();
    expect(c.hasCls('foo')).toBe(false);
  });

  it('floating config applies absolute position', () => {
    const c = renderTo({ floating: true });
    expect(c.el!.style.position).toBe('absolute');
    expect(c.el!.classList.contains('x-floating')).toBe(true);
  });

  it('isFocusable returns false when not rendered', () => {
    const c = createComponent();
    expect(c.isFocusable()).toBe(false);
  });

  it('show/hide are no-ops after destroy', () => {
    const c = renderTo();
    c.destroy();
    expect(() => {
      c.show();
      c.hide();
    }).not.toThrow();
  });

  it('enable/disable are no-ops after destroy', () => {
    const c = renderTo();
    c.destroy();
    expect(() => {
      c.enable();
      c.disable();
    }).not.toThrow();
  });
});
