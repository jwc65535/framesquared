import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DragManager, Draggable, Droppable, Sortable, Resizable } from '@framesquared/dd';

beforeEach(() => {
  if (typeof PointerEvent === 'undefined') {
    (globalThis as any).PointerEvent = class PointerEvent extends MouseEvent {
      readonly pointerId: number;
      constructor(type: string, init?: PointerEventInit) {
        super(type, init);
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
  el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, ...opts } as any));
}

describe('Drag and drop integration', () => {
  it('drag from source to drop target completes full lifecycle', () => {
    const srcEl = document.createElement('div');
    const dropEl = document.createElement('div');
    document.body.appendChild(srcEl);
    document.body.appendChild(dropEl);
    dropEl.getBoundingClientRect = () => ({
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      top: 100,
      left: 100,
      right: 300,
      bottom: 300,
      toJSON() {},
    });

    const enterSpy = vi.fn();
    const dropSpy = vi.fn();
    const endSpy = vi.fn();

    const _drag = new Draggable({ el: srcEl, groups: ['items'], onDragEnd: endSpy });
    const _drop = new Droppable({
      el: dropEl,
      accept: ['items'],
      onDragEnter: enterSpy,
      onDrop: dropSpy,
      overCls: 'over',
    });

    // Drag from (0,0) to drop target at (150,150)
    fire(srcEl, 'pointerdown', { clientX: 0, clientY: 0 });
    fire(document, 'pointermove', { clientX: 150, clientY: 150 });
    expect(enterSpy).toHaveBeenCalled();
    expect(dropEl.classList.contains('over')).toBe(true);

    fire(document, 'pointerup', { clientX: 150, clientY: 150 });
    expect(dropSpy).toHaveBeenCalled();
    expect(endSpy).toHaveBeenCalled();
    expect(dropEl.classList.contains('over')).toBe(false);
  });

  it('drag rejected by non-matching group', () => {
    const srcEl = document.createElement('div');
    const dropEl = document.createElement('div');
    document.body.appendChild(srcEl);
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
    const _drag = new Draggable({ el: srcEl, groups: ['typeA'] });
    const _drop = new Droppable({ el: dropEl, accept: ['typeB'], onDragEnter: enterSpy });

    fire(srcEl, 'pointerdown', { clientX: 0, clientY: 0 });
    fire(document, 'pointermove', { clientX: 150, clientY: 150 });
    expect(enterSpy).not.toHaveBeenCalled();
    fire(document, 'pointerup');
  });

  it('Sortable reorders items', () => {
    const list = document.createElement('div');
    for (let i = 0; i < 4; i++) {
      const item = document.createElement('div');
      item.classList.add('item');
      item.textContent = `Item ${i}`;
      list.appendChild(item);
    }
    document.body.appendChild(list);

    const sortSpy = vi.fn();
    const sortable = new Sortable({
      el: list,
      itemSelector: '.item',
      onSort: sortSpy,
    });

    sortable.moveItem(0, 2);
    expect(sortSpy).toHaveBeenCalledWith(0, 2);
    expect(sortable.getOrder()).toEqual(['Item 1', 'Item 2', 'Item 0', 'Item 3']);
  });

  it('Resizable changes element dimensions', () => {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.width = '100px';
    el.style.height = '80px';
    document.body.appendChild(el);

    const resizeSpy = vi.fn();
    const r = new Resizable({ el, handles: 'se', onResize: resizeSpy });
    const handle = el.querySelector('.x-resizable-handle-se') as HTMLElement;

    fire(handle, 'pointerdown', { clientX: 100, clientY: 80 });
    fire(document, 'pointermove', { clientX: 160, clientY: 120 });
    expect(parseInt(el.style.width)).toBe(160);
    expect(parseInt(el.style.height)).toBe(120);
    expect(resizeSpy).toHaveBeenCalled();
    fire(document, 'pointerup');

    r.destroy();
    expect(el.querySelectorAll('.x-resizable-handle').length).toBe(0);
  });
});
