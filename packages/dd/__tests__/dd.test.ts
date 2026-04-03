/* eslint-disable @typescript-eslint/no-empty-function */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DragManager } from '../src/DragManager.js';
import { Draggable } from '../src/Draggable.js';
import { Droppable } from '../src/Droppable.js';
import { DragProxy } from '../src/DragProxy.js';
import { Sortable } from '../src/Sortable.js';
import { Resizable } from '../src/Resizable.js';

// PointerEvent polyfill for jsdom
beforeEach(() => {
  if (typeof PointerEvent === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).PointerEvent = class PointerEvent extends MouseEvent {
      readonly pointerId: number;
      constructor(type: string, init?: PointerEventInit) {
        super(type, init);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.pointerId = (init as any)?.pointerId ?? 0;
      }
    };
  }
  DragManager.reset();
});
afterEach(() => {
  document.body.innerHTML = '';
});

function fire(el: EventTarget, type: string, opts: Record<string, unknown> = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, ...opts } as any));
}

// ═══════════════════════════════════════════════════════════════════════════
// DragManager
// ═══════════════════════════════════════════════════════════════════════════

describe('DragManager', () => {
  it('is a singleton', () => {
    expect(DragManager).toBeDefined();
    expect(DragManager.isDragging()).toBe(false);
  });

  it('tracks active drag', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const _d = new Draggable({ el });
    fire(el, 'pointerdown', { clientX: 0, clientY: 0 });
    fire(document, 'pointermove', { clientX: 10, clientY: 10 });
    expect(DragManager.isDragging()).toBe(true);
    fire(document, 'pointerup');
    expect(DragManager.isDragging()).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Draggable — basics
// ═══════════════════════════════════════════════════════════════════════════

describe('Draggable — basics', () => {
  it('drag starts after threshold', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const spy = vi.fn();
    const _d = new Draggable({ el, threshold: 5, onDragStart: spy });
    fire(el, 'pointerdown', { clientX: 0, clientY: 0 });
    fire(document, 'pointermove', { clientX: 2, clientY: 2 });
    expect(spy).not.toHaveBeenCalled(); // below threshold
    fire(document, 'pointermove', { clientX: 6, clientY: 0 });
    expect(spy).toHaveBeenCalled(); // above threshold
    fire(document, 'pointerup');
  });

  it('default threshold is 3', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const spy = vi.fn();
    const _d = new Draggable({ el, onDragStart: spy });
    fire(el, 'pointerdown', { clientX: 0, clientY: 0 });
    fire(document, 'pointermove', { clientX: 4, clientY: 0 });
    expect(spy).toHaveBeenCalled();
    fire(document, 'pointerup');
  });

  it('fires drag event during move', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const spy = vi.fn();
    const _d = new Draggable({ el, onDrag: spy });
    fire(el, 'pointerdown', { clientX: 0, clientY: 0 });
    fire(document, 'pointermove', { clientX: 10, clientY: 10 });
    fire(document, 'pointermove', { clientX: 20, clientY: 20 });
    expect(spy).toHaveBeenCalled();
    fire(document, 'pointerup');
  });

  it('fires dragend on pointerup', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const spy = vi.fn();
    const _d = new Draggable({ el, onDragEnd: spy });
    fire(el, 'pointerdown', { clientX: 0, clientY: 0 });
    fire(document, 'pointermove', { clientX: 10, clientY: 10 });
    fire(document, 'pointerup');
    expect(spy).toHaveBeenCalled();
  });

  it('handle restricts drag initiation', () => {
    const el = document.createElement('div');
    const handle = document.createElement('span');
    handle.classList.add('handle');
    el.appendChild(handle);
    document.body.appendChild(el);
    const spy = vi.fn();
    const _d = new Draggable({ el, handle: '.handle', onDragStart: spy });
    // Click outside handle — no drag
    fire(el, 'pointerdown', { clientX: 0, clientY: 0 });
    fire(document, 'pointermove', { clientX: 10, clientY: 10 });
    expect(spy).not.toHaveBeenCalled();
    fire(document, 'pointerup');
    // Click on handle — drag
    fire(handle, 'pointerdown', { clientX: 0, clientY: 0 });
    fire(document, 'pointermove', { clientX: 10, clientY: 10 });
    expect(spy).toHaveBeenCalled();
    fire(document, 'pointerup');
  });

  it('disabled:true prevents drag', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const spy = vi.fn();
    const _d = new Draggable({ el, disabled: true, onDragStart: spy });
    fire(el, 'pointerdown', { clientX: 0, clientY: 0 });
    fire(document, 'pointermove', { clientX: 10, clientY: 10 });
    expect(spy).not.toHaveBeenCalled();
    fire(document, 'pointerup');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Draggable — axis lock
// ═══════════════════════════════════════════════════════════════════════════

describe('Draggable — axis lock', () => {
  it('axis:"x" locks vertical movement', () => {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = '0px';
    el.style.top = '0px';
    document.body.appendChild(el);
    const _d = new Draggable({ el, axis: 'x', proxy: false });
    fire(el, 'pointerdown', { clientX: 0, clientY: 0 });
    fire(document, 'pointermove', { clientX: 50, clientY: 30 });
    expect(el.style.left).toBe('50px');
    expect(el.style.top).toBe('0px');
    fire(document, 'pointerup');
  });

  it('axis:"y" locks horizontal movement', () => {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = '0px';
    el.style.top = '0px';
    document.body.appendChild(el);
    const _d = new Draggable({ el, axis: 'y', proxy: false });
    fire(el, 'pointerdown', { clientX: 0, clientY: 0 });
    fire(document, 'pointermove', { clientX: 50, clientY: 30 });
    expect(el.style.left).toBe('0px');
    expect(el.style.top).toBe('30px');
    fire(document, 'pointerup');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Draggable — snap
// ═══════════════════════════════════════════════════════════════════════════

describe('Draggable — snap', () => {
  it('snaps to grid positions', () => {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = '0px';
    el.style.top = '0px';
    document.body.appendChild(el);
    const _d = new Draggable({ el, snap: { x: 20, y: 20 }, proxy: false });
    fire(el, 'pointerdown', { clientX: 0, clientY: 0 });
    fire(document, 'pointermove', { clientX: 13, clientY: 27 });
    expect(el.style.left).toBe('20px');
    expect(el.style.top).toBe('20px');
    fire(document, 'pointerup');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Draggable — constrain
// ═══════════════════════════════════════════════════════════════════════════

describe('Draggable — constrain', () => {
  it('constrainTo:"parent" keeps within parent bounds', () => {
    const parent = document.createElement('div');
    parent.style.width = '200px';
    parent.style.height = '200px';
    parent.style.position = 'relative';
    // Mock getBoundingClientRect
    parent.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      top: 0,
      left: 0,
      right: 200,
      bottom: 200,
      toJSON() {},
    });
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = '0px';
    el.style.top = '0px';
    el.style.width = '50px';
    el.style.height = '50px';
    parent.appendChild(el);
    document.body.appendChild(parent);
    const _d = new Draggable({ el, constrainTo: 'parent', proxy: false });
    fire(el, 'pointerdown', { clientX: 25, clientY: 25 });
    fire(document, 'pointermove', { clientX: 300, clientY: 300 });
    const left = parseInt(el.style.left);
    const top = parseInt(el.style.top);
    expect(left).toBeLessThanOrEqual(150); // 200 - 50
    expect(top).toBeLessThanOrEqual(150);
    fire(document, 'pointerup');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Droppable
// ═══════════════════════════════════════════════════════════════════════════

describe('Droppable', () => {
  it('onDragEnter fires when draggable enters', () => {
    const dragEl = document.createElement('div');
    const dropEl = document.createElement('div');
    document.body.appendChild(dragEl);
    document.body.appendChild(dropEl);
    dropEl.getBoundingClientRect = () => ({
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      top: 100,
      left: 100,
      right: 200,
      bottom: 200,
      toJSON() {},
    });
    const enterSpy = vi.fn();
    const _drag = new Draggable({ el: dragEl, groups: ['test'] });
    const _drop = new Droppable({ el: dropEl, accept: ['test'], onDragEnter: enterSpy });
    fire(dragEl, 'pointerdown', { clientX: 0, clientY: 0 });
    fire(document, 'pointermove', { clientX: 150, clientY: 150 });
    expect(enterSpy).toHaveBeenCalled();
    fire(document, 'pointerup');
  });

  it('overCls applied on enter, removed on leave', () => {
    const dragEl = document.createElement('div');
    const dropEl = document.createElement('div');
    document.body.appendChild(dragEl);
    document.body.appendChild(dropEl);
    dropEl.getBoundingClientRect = () => ({
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      top: 100,
      left: 100,
      right: 200,
      bottom: 200,
      toJSON() {},
    });
    const _drag = new Draggable({ el: dragEl, groups: ['g1'] });
    const _drop = new Droppable({ el: dropEl, accept: ['g1'], overCls: 'drop-hover' });
    fire(dragEl, 'pointerdown', { clientX: 0, clientY: 0 });
    fire(document, 'pointermove', { clientX: 150, clientY: 150 });
    expect(dropEl.classList.contains('drop-hover')).toBe(true);
    fire(document, 'pointermove', { clientX: 50, clientY: 50 });
    expect(dropEl.classList.contains('drop-hover')).toBe(false);
    fire(document, 'pointerup');
  });

  it('onDrop fires on pointerup over target', () => {
    const dragEl = document.createElement('div');
    const dropEl = document.createElement('div');
    document.body.appendChild(dragEl);
    document.body.appendChild(dropEl);
    dropEl.getBoundingClientRect = () => ({
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      top: 100,
      left: 100,
      right: 200,
      bottom: 200,
      toJSON() {},
    });
    const dropSpy = vi.fn();
    const _drag = new Draggable({ el: dragEl, groups: ['g'] });
    const _drop = new Droppable({ el: dropEl, accept: ['g'], onDrop: dropSpy });
    fire(dragEl, 'pointerdown', { clientX: 0, clientY: 0 });
    fire(document, 'pointermove', { clientX: 150, clientY: 150 });
    fire(document, 'pointerup', { clientX: 150, clientY: 150 });
    expect(dropSpy).toHaveBeenCalled();
  });

  it('accept group filtering rejects non-matching', () => {
    const dragEl = document.createElement('div');
    const dropEl = document.createElement('div');
    document.body.appendChild(dragEl);
    document.body.appendChild(dropEl);
    dropEl.getBoundingClientRect = () => ({
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      top: 100,
      left: 100,
      right: 200,
      bottom: 200,
      toJSON() {},
    });
    const enterSpy = vi.fn();
    const _drag = new Draggable({ el: dragEl, groups: ['alpha'] });
    const _drop = new Droppable({ el: dropEl, accept: ['beta'], onDragEnter: enterSpy });
    fire(dragEl, 'pointerdown', { clientX: 0, clientY: 0 });
    fire(document, 'pointermove', { clientX: 150, clientY: 150 });
    expect(enterSpy).not.toHaveBeenCalled();
    fire(document, 'pointerup');
  });

  it('disabled:true prevents drops', () => {
    const dragEl = document.createElement('div');
    const dropEl = document.createElement('div');
    document.body.appendChild(dragEl);
    document.body.appendChild(dropEl);
    dropEl.getBoundingClientRect = () => ({
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      top: 100,
      left: 100,
      right: 200,
      bottom: 200,
      toJSON() {},
    });
    const enterSpy = vi.fn();
    const _drag = new Draggable({ el: dragEl, groups: ['g'] });
    const _drop = new Droppable({
      el: dropEl,
      accept: ['g'],
      disabled: true,
      onDragEnter: enterSpy,
    });
    fire(dragEl, 'pointerdown', { clientX: 0, clientY: 0 });
    fire(document, 'pointermove', { clientX: 150, clientY: 150 });
    expect(enterSpy).not.toHaveBeenCalled();
    fire(document, 'pointerup');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DragProxy
// ═══════════════════════════════════════════════════════════════════════════

describe('DragProxy', () => {
  it('ghost follows cursor position', () => {
    const el = document.createElement('div');
    el.style.width = '40px';
    el.style.height = '40px';
    document.body.appendChild(el);
    const proxy = new DragProxy({ sourceEl: el, ghostCls: 'ghost' });
    proxy.show(10, 20);
    const ghost = document.body.querySelector('.ghost') as HTMLElement;
    expect(ghost).not.toBeNull();
    expect(ghost.style.left).toBe('10px');
    expect(ghost.style.top).toBe('20px');
    proxy.moveTo(50, 60);
    expect(ghost.style.left).toBe('50px');
    expect(ghost.style.top).toBe('60px');
    proxy.hide();
    expect(ghost.parentNode).toBeNull();
  });

  it('status proxy shows valid/invalid state', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const proxy = new DragProxy({ sourceEl: el, ghostCls: 'proxy' });
    proxy.show(0, 0);
    proxy.setStatus(true);
    const ghost = document.body.querySelector('.proxy') as HTMLElement;
    expect(ghost.classList.contains('x-dd-drop-ok')).toBe(true);
    proxy.setStatus(false);
    expect(ghost.classList.contains('x-dd-drop-ok')).toBe(false);
    expect(ghost.classList.contains('x-dd-drop-nodrop')).toBe(true);
    proxy.hide();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Sortable
// ═══════════════════════════════════════════════════════════════════════════

describe('Sortable', () => {
  function makeList(): HTMLElement {
    const list = document.createElement('div');
    list.classList.add('sortable-list');
    for (let i = 0; i < 5; i++) {
      const item = document.createElement('div');
      item.classList.add('sort-item');
      item.textContent = `Item ${i}`;
      item.style.height = '30px';
      item.getBoundingClientRect = () => ({
        x: 0,
        y: i * 30,
        width: 200,
        height: 30,
        top: i * 30,
        left: 0,
        right: 200,
        bottom: (i + 1) * 30,
        toJSON() {},
      });
      list.appendChild(item);
    }
    document.body.appendChild(list);
    return list;
  }

  it('creates sortable from container', () => {
    const list = makeList();
    const s = new Sortable({ el: list, itemSelector: '.sort-item' });
    expect(s).toBeDefined();
  });

  it('moveItem reorders children and fires sort event', () => {
    const list = makeList();
    const spy = vi.fn();
    const s = new Sortable({ el: list, itemSelector: '.sort-item', onSort: spy });
    s.moveItem(0, 3);
    const items = list.querySelectorAll('.sort-item');
    expect(items[0].textContent).toBe('Item 1');
    expect(items[3].textContent).toBe('Item 0');
    expect(spy).toHaveBeenCalledWith(0, 3);
  });

  it('moveItem fires start and end events', () => {
    const list = makeList();
    const startSpy = vi.fn();
    const endSpy = vi.fn();
    const s = new Sortable({
      el: list,
      itemSelector: '.sort-item',
      onStart: startSpy,
      onEnd: endSpy,
    });
    s.moveItem(1, 4);
    expect(startSpy).toHaveBeenCalled();
    expect(endSpy).toHaveBeenCalled();
  });

  it('getOrder returns current item order', () => {
    const list = makeList();
    const s = new Sortable({ el: list, itemSelector: '.sort-item' });
    expect(s.getOrder()).toEqual(['Item 0', 'Item 1', 'Item 2', 'Item 3', 'Item 4']);
    s.moveItem(0, 2);
    expect(s.getOrder()[0]).toBe('Item 1');
    expect(s.getOrder()[2]).toBe('Item 0');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Resizable
// ═══════════════════════════════════════════════════════════════════════════

describe('Resizable', () => {
  function resizableEl(): HTMLElement {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.width = '100px';
    el.style.height = '80px';
    el.style.left = '0px';
    el.style.top = '0px';
    document.body.appendChild(el);
    return el;
  }

  it('adds resize handles', () => {
    const el = resizableEl();
    const _r = new Resizable({ el, handles: 'se e s' });
    const handles = el.querySelectorAll('.x-resizable-handle');
    expect(handles.length).toBe(3);
  });

  it('dragging SE handle changes size', () => {
    const el = resizableEl();
    const _r = new Resizable({ el, handles: 'se' });
    const handle = el.querySelector('.x-resizable-handle-se') as HTMLElement;
    fire(handle, 'pointerdown', { clientX: 100, clientY: 80 });
    fire(document, 'pointermove', { clientX: 150, clientY: 120 });
    expect(parseInt(el.style.width)).toBe(150);
    expect(parseInt(el.style.height)).toBe(120);
    fire(document, 'pointerup');
  });

  it('dragging E handle changes only width', () => {
    const el = resizableEl();
    const _r = new Resizable({ el, handles: 'e' });
    const handle = el.querySelector('.x-resizable-handle-e') as HTMLElement;
    fire(handle, 'pointerdown', { clientX: 100, clientY: 40 });
    fire(document, 'pointermove', { clientX: 180, clientY: 60 });
    expect(parseInt(el.style.width)).toBe(180);
    expect(parseInt(el.style.height)).toBe(80); // unchanged
    fire(document, 'pointerup');
  });

  it('dragging S handle changes only height', () => {
    const el = resizableEl();
    const _r = new Resizable({ el, handles: 's' });
    const handle = el.querySelector('.x-resizable-handle-s') as HTMLElement;
    fire(handle, 'pointerdown', { clientX: 50, clientY: 80 });
    fire(document, 'pointermove', { clientX: 50, clientY: 130 });
    expect(parseInt(el.style.width)).toBe(100); // unchanged
    expect(parseInt(el.style.height)).toBe(130);
    fire(document, 'pointerup');
  });

  it('minWidth/minHeight constraints', () => {
    const el = resizableEl();
    const _r = new Resizable({ el, handles: 'se', minWidth: 50, minHeight: 40 });
    const handle = el.querySelector('.x-resizable-handle-se') as HTMLElement;
    fire(handle, 'pointerdown', { clientX: 100, clientY: 80 });
    fire(document, 'pointermove', { clientX: 20, clientY: 10 });
    expect(parseInt(el.style.width)).toBeGreaterThanOrEqual(50);
    expect(parseInt(el.style.height)).toBeGreaterThanOrEqual(40);
    fire(document, 'pointerup');
  });

  it('maxWidth/maxHeight constraints', () => {
    const el = resizableEl();
    const _r = new Resizable({ el, handles: 'se', maxWidth: 200, maxHeight: 150 });
    const handle = el.querySelector('.x-resizable-handle-se') as HTMLElement;
    fire(handle, 'pointerdown', { clientX: 100, clientY: 80 });
    fire(document, 'pointermove', { clientX: 500, clientY: 500 });
    expect(parseInt(el.style.width)).toBeLessThanOrEqual(200);
    expect(parseInt(el.style.height)).toBeLessThanOrEqual(150);
    fire(document, 'pointerup');
  });

  it('preserveRatio maintains aspect ratio', () => {
    const el = resizableEl();
    // 100x80 → ratio 1.25
    const _r = new Resizable({ el, handles: 'se', preserveRatio: true });
    const handle = el.querySelector('.x-resizable-handle-se') as HTMLElement;
    fire(handle, 'pointerdown', { clientX: 100, clientY: 80 });
    fire(document, 'pointermove', { clientX: 200, clientY: 200 });
    const w = parseInt(el.style.width);
    const h = parseInt(el.style.height);
    const ratio = w / h;
    expect(Math.abs(ratio - 1.25)).toBeLessThan(0.1);
    fire(document, 'pointerup');
  });

  it('fires resize event', () => {
    const el = resizableEl();
    const spy = vi.fn();
    const _r = new Resizable({ el, handles: 'se', onResize: spy });
    const handle = el.querySelector('.x-resizable-handle-se') as HTMLElement;
    fire(handle, 'pointerdown', { clientX: 100, clientY: 80 });
    fire(document, 'pointermove', { clientX: 150, clientY: 120 });
    expect(spy).toHaveBeenCalled();
    fire(document, 'pointerup');
  });

  it('destroy removes handles', () => {
    const el = resizableEl();
    const r = new Resizable({ el, handles: 'se e' });
    expect(el.querySelectorAll('.x-resizable-handle').length).toBe(2);
    r.destroy();
    expect(el.querySelectorAll('.x-resizable-handle').length).toBe(0);
  });
});
