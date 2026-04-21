import { describe, it, expect, afterEach } from 'vitest';
import { MessageBox } from '../src/index.js';

afterEach(() => {
  document.querySelectorAll('.x-msgbox, .x-mask, .x-window').forEach(el => el.parentNode?.removeChild(el));
});

describe('Window render', () => {
  it('window element is a child of document.body', () => {
    const win = MessageBox.alert('Test', 'Hello');
    expect(document.body.contains(win.el!)).toBe(true);
    win.destroy();
  });

  it('window has position:fixed set', () => {
    const win = MessageBox.alert('Test', 'Hello');
    expect(win.el!.style.position).toBe('fixed');
    win.destroy();
  });

  it('window has explicit left set by center()', () => {
    const win = MessageBox.alert('Test', 'Hello');
    expect(win.el!.style.left).toBeTruthy();
    win.destroy();
  });

  it('window has explicit top set by center()', () => {
    const win = MessageBox.alert('Test', 'Hello');
    expect(win.el!.style.top).toBeTruthy();
    win.destroy();
  });

  it('window z-index is higher than mask z-index', () => {
    const win = MessageBox.alert('Test', 'Hello');
    const winZ = parseInt(win.el!.style.zIndex, 10);
    const mask = document.querySelector<HTMLElement>('.x-mask')!;
    const maskZ = parseInt(mask.style.zIndex, 10);
    expect(winZ).toBeGreaterThan(maskZ);
    win.destroy();
  });

  it('panel body contains msgbox content', () => {
    const win = MessageBox.alert('Test', 'Hello');
    const body = win.el!.querySelector('.x-panel-body');
    expect(body?.querySelector('.x-msgbox-text')).toBeTruthy();
    expect(body?.querySelector('.x-msgbox-btn-ok')).toBeTruthy();
    win.destroy();
  });

  it('header contains the title', () => {
    const win = MessageBox.alert('My Title', 'Hello');
    const header = win.el!.querySelector('.x-panel-header-text');
    expect(header?.textContent).toBe('My Title');
    win.destroy();
  });

  it('mask is NOT a child inside the window', () => {
    const win = MessageBox.alert('Test', 'Hello');
    const mask = document.querySelector('.x-mask');
    expect(win.el!.contains(mask)).toBe(false);
    win.destroy();
  });
});
