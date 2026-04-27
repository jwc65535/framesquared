/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * 08-clipboard-dragdrop-treegrid — MainView.spec.ts
 *
 * Coverage:
 *   1. View structure      — clipboard plugin, dragdrop plugin, ViewModel, ViewController
 *   2. TreeGridClipboard   — copyToClipboard, pasteFromText, pasteLastCopied, getLastCopied
 *   3. Keyboard shortcuts  — Ctrl+C copies, Ctrl+V pastes last copied
 *   4. Toolbar buttons     — Copy button, Paste button
 *   5. Copy → Paste round-trip
 *   6. TreeGridDragDrop    — init, sibling reorder
 *   7. ViewModel binding   — copiedText, pasteCount
 *   8. ViewController      — copySelected / pasteText
 *   9. Data                — Task store shape
 *  10. Application guard
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { TreeGrid, TreeGridClipboard, TreeGridDragDrop, Button } from '@framesquared/ui';
import { createMainView, makeTaskStore } from './MainView.js';
import { MainViewModel } from './MainViewModel.js';
import { MainViewController } from './MainViewController.js';
import type { MainViewRefs } from './MainView.js';

beforeAll(() => {
  if (!(globalThis as any).ResizeObserver) {
    (globalThis as any).ResizeObserver = class { observe(){}; unobserve(){}; disconnect(){} };
  }
});

let host: HTMLDivElement;
let refs: MainViewRefs;
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  refs = createMainView(host);
});
afterEach(() => { host.parentNode?.removeChild(host); });

// ── 1. View structure ────────────────────────────────────────────────────────
describe('View structure', () => {
  it('grid is TreeGrid',                     () => expect(refs.grid).toBeInstanceOf(TreeGrid));
  it('clipboard is TreeGridClipboard',       () => expect(refs.clipboard).toBeInstanceOf(TreeGridClipboard));
  it('dragDrop is TreeGridDragDrop',         () => expect(refs.dragDrop).toBeInstanceOf(TreeGridDragDrop));
  it('copyBtn is Button',                    () => expect(refs.copyBtn).toBeInstanceOf(Button));
  it('pasteBtn is Button',                   () => expect(refs.pasteBtn).toBeInstanceOf(Button));
  it('viewModel is MainViewModel',           () => expect(refs.viewModel).toBeInstanceOf(MainViewModel));
  it('viewController is MainViewController', () => expect(refs.viewController).toBeInstanceOf(MainViewController));
  it('grid renders inside host',             () => expect(host.contains(refs.grid.el)).toBe(true));
  it('Copy button rendered inside host',     () => expect(host.contains(refs.copyBtn.el)).toBe(true));
  it('Paste button rendered inside host',    () => expect(host.contains(refs.pasteBtn.el)).toBe(true));
});

// ── 2. TreeGridClipboard API ─────────────────────────────────────────────────
describe('TreeGridClipboard', () => {
  it('copyToClipboard returns empty string when nothing selected', () => {
    refs.grid.deselectAll();
    expect(refs.clipboard.copyToClipboard()).toBe('');
  });

  it('copyToClipboard returns TSV string after selecting a node', () => {
    refs.grid.select(refs.grid.getNodeById('task1')!);
    const text = refs.clipboard.copyToClipboard();
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });

  it('copyToClipboard output contains selected node text', () => {
    refs.grid.select(refs.grid.getNodeById('task1')!);
    expect(refs.clipboard.copyToClipboard()).toContain('Setup repo');
  });

  it('copyToClipboard output contains tab separators', () => {
    refs.grid.select(refs.grid.getNodeById('task2')!);
    expect(refs.clipboard.copyToClipboard()).toContain('\t');
  });

  it('copyToClipboard stores result in internal buffer (getLastCopied)', () => {
    refs.grid.select(refs.grid.getNodeById('task1')!);
    refs.clipboard.copyToClipboard();
    expect(refs.clipboard.getLastCopied()).toContain('Setup repo');
  });

  it('getLastCopied is empty before any copy', () => {
    expect(refs.clipboard.getLastCopied()).toBe('');
  });

  it('copyToClipboard of branch node includes the branch itself', () => {
    refs.grid.select(refs.grid.getNodeById('webapp')!);
    const text = refs.clipboard.copyToClipboard();
    const lines = text.split('\n').filter(Boolean);
    // First line must be the branch ("Web App"), not its first child ("Setup repo")
    expect(lines[0]).toContain('Web App');
  });

  it('copyToClipboard of branch node includes all children', () => {
    refs.grid.select(refs.grid.getNodeById('webapp')!);
    const text = refs.clipboard.copyToClipboard();
    expect(text).toContain('Web App');
    expect(text).toContain('Setup repo');
    expect(text).toContain('Design UI');
    expect(text).toContain('Write tests');
  });

  it('pasteFromText adds a new node to root when nothing selected', () => {
    refs.grid.deselectAll();
    const before = refs.store.getRootNode().childNodes.length;
    refs.clipboard.pasteFromText('New Task\tTodo\tHigh');
    expect(refs.store.getRootNode().childNodes.length).toBe(before + 1);
  });

  it('pasteFromText adds node as first child of selected branch node', () => {
    const webapp = refs.grid.getNodeById('webapp')!;
    refs.grid.select(webapp);
    const before = webapp.childNodes.length;
    refs.clipboard.pasteFromText('Extra Task\tTodo\tLow');
    expect(webapp.childNodes.length).toBe(before + 1);
    // Pasted node appears directly under the selected branch (index 0)
    expect(webapp.childNodes[0].get('text')).toBe('Extra Task');
  });

  it('pasteFromText into a leaf node pastes as sibling (under the leaf\'s parent)', () => {
    const mobile = refs.grid.getNodeById('mobile')!;
    const task4  = refs.grid.getNodeById('task4')!;
    refs.grid.select(task4);
    const before = mobile.childNodes.length;
    refs.clipboard.pasteFromText('New Sibling\tTodo\tLow');
    // New node goes under mobile (task4's parent), not under task4 itself
    expect(mobile.childNodes.length).toBe(before + 1);
    expect(task4.childNodes.length).toBe(0);
  });

  it('pasteFromText into a leaf inserts immediately after the selected leaf', () => {
    const mobile = refs.grid.getNodeById('mobile')!;
    const task4  = refs.grid.getNodeById('task4')!; // first child of mobile
    refs.grid.select(task4);
    refs.clipboard.pasteFromText('New Sibling\tTodo\tLow');
    // New node should be at index 1 (right after task4), pushing task5 to index 2
    expect(mobile.childNodes[0]).toBe(task4);
    expect(mobile.childNodes[1].get('text')).toBe('New Sibling');
    expect(mobile.childNodes[2].get('text')).toBe('Review');
  });

  it('pasteFromText pasted node has correct text value', () => {
    refs.grid.deselectAll();
    refs.clipboard.pasteFromText('My New Task\tTodo\tHigh');
    const root = refs.store.getRootNode();
    const last = root.childNodes[root.childNodes.length - 1];
    expect(last.get('text')).toBe('My New Task');
  });

  it('pasteFromText multiple lines creates multiple nodes', () => {
    refs.grid.deselectAll();
    const before = refs.store.getRootNode().childNodes.length;
    refs.clipboard.pasteFromText('Task A\tTodo\tHigh\nTask B\tTodo\tLow');
    expect(refs.store.getRootNode().childNodes.length).toBe(before + 2);
  });

  it('pasteLastCopied does nothing when buffer is empty', () => {
    const before = refs.store.getRootNode().childNodes.length;
    refs.clipboard.pasteLastCopied();
    expect(refs.store.getRootNode().childNodes.length).toBe(before);
  });

  it('pasteLastCopied pastes the last-copied text', () => {
    refs.grid.select(refs.grid.getNodeById('task4')!);
    refs.clipboard.copyToClipboard();
    refs.grid.deselectAll();
    const before = refs.store.getRootNode().childNodes.length;
    refs.clipboard.pasteLastCopied();
    expect(refs.store.getRootNode().childNodes.length).toBe(before + 1);
  });

  it('copy leaf A then select leaf B and paste: new node appears immediately after B', () => {
    const mobile = refs.grid.getNodeById('mobile')!;
    const task4  = refs.grid.getNodeById('task4')!;   // source leaf (index 0)
    const task5  = refs.grid.getNodeById('task5')!;   // destination leaf (index 1, last)
    refs.grid.select(task4);
    refs.clipboard.copyToClipboard();                 // copies "Prototype\tDone\tHigh"
    refs.grid.select(task4);                          // select task4 as destination
    const before = mobile.childNodes.length;
    refs.clipboard.pasteLastCopied();
    // new node goes right after task4, before task5
    expect(mobile.childNodes.length).toBe(before + 1);
    expect(mobile.childNodes[0]).toBe(task4);
    expect(mobile.childNodes[1].get('text')).toBe('Prototype');
    expect(mobile.childNodes[2]).toBe(task5);
    expect(task4.childNodes.length).toBe(0);
  });
});

// ── 3. Keyboard shortcuts ────────────────────────────────────────────────────
describe('Keyboard shortcuts', () => {
  const fire = (key: string, ctrlKey = true) =>
    refs.grid.getView().el!.dispatchEvent(
      new KeyboardEvent('keydown', { key, ctrlKey, bubbles: true }),
    );

  it('Ctrl+C copies selected node into internal buffer', () => {
    refs.grid.select(refs.grid.getNodeById('task3')!);
    fire('c');
    expect(refs.clipboard.getLastCopied()).toContain('Write tests');
  });

  it('Ctrl+C with nothing selected leaves buffer empty', () => {
    refs.grid.deselectAll();
    fire('c');
    expect(refs.clipboard.getLastCopied()).toBe('');
  });

  it('Ctrl+V pastes the last-copied buffer', () => {
    refs.grid.select(refs.grid.getNodeById('task1')!);
    fire('c');
    refs.grid.deselectAll();
    const before = refs.store.getRootNode().childNodes.length;
    fire('v');
    expect(refs.store.getRootNode().childNodes.length).toBe(before + 1);
  });

  it('Ctrl+V with empty buffer does not change store', () => {
    const before = refs.store.getRootNode().childNodes.length;
    fire('v');
    expect(refs.store.getRootNode().childNodes.length).toBe(before);
  });
});

// ── 4. Toolbar buttons ───────────────────────────────────────────────────────
describe('Toolbar buttons', () => {
  it('Copy button click copies selected node into viewModel.copiedText', () => {
    refs.grid.select(refs.grid.getNodeById('task2')!);
    refs.copyBtn.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.viewModel.getCopiedText()).toContain('Design UI');
  });

  it('Copy button click with nothing selected leaves copiedText empty', () => {
    refs.grid.deselectAll();
    refs.copyBtn.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.viewModel.getCopiedText()).toBe('');
  });

  it('Paste button click pastes viewModel.copiedText into store', () => {
    refs.grid.select(refs.grid.getNodeById('task1')!);
    refs.copyBtn.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    refs.grid.deselectAll();
    const before = refs.store.getRootNode().childNodes.length;
    refs.pasteBtn.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.store.getRootNode().childNodes.length).toBe(before + 1);
  });

  it('Paste button click increments pasteCount', () => {
    refs.grid.select(refs.grid.getNodeById('task1')!);
    refs.copyBtn.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    refs.pasteBtn.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.viewModel.getPasteCount()).toBe(1);
  });

  it('Paste button does nothing when copiedText is empty', () => {
    const before = refs.store.getRootNode().childNodes.length;
    refs.pasteBtn.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.store.getRootNode().childNodes.length).toBe(before);
  });

  it('copy leaf via button, select different leaf, Paste via button: creates sibling', () => {
    const mobile = refs.grid.getNodeById('mobile')!;
    refs.grid.select(refs.grid.getNodeById('task4')!);
    refs.copyBtn.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    refs.grid.select(refs.grid.getNodeById('task5')!);
    const before = mobile.childNodes.length;
    refs.pasteBtn.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(mobile.childNodes.length).toBe(before + 1);
    expect(refs.grid.getNodeById('task5')!.childNodes.length).toBe(0);
  });
});

// ── 5. Copy → Paste round-trip ───────────────────────────────────────────────
describe('Copy → Paste round-trip', () => {
  it('copy task1 and paste under webapp adds a sibling with same text', () => {
    const webapp = refs.grid.getNodeById('webapp')!;
    refs.grid.select(refs.grid.getNodeById('task1')!);
    refs.viewController.copySelected(refs);

    refs.grid.select(webapp);
    refs.viewController.pasteText(refs, refs.viewModel.getCopiedText());

    const texts = webapp.childNodes.map((n) => n.get('text'));
    expect(texts).toContain('Setup repo');
  });

  it('copy branch (webapp) and paste at root adds exactly one new root node with children', () => {
    refs.grid.deselectAll();
    refs.grid.select(refs.grid.getNodeById('webapp')!);
    refs.viewController.copySelected(refs);

    refs.grid.deselectAll();
    const before = refs.store.getRootNode().childNodes.length;
    refs.viewController.pasteText(refs, refs.viewModel.getCopiedText());
    const root = refs.store.getRootNode();
    // Only 1 new top-level node (the branch itself), not a flat list of 4
    expect(root.childNodes.length).toBe(before + 1);
    const copy = root.childNodes[root.childNodes.length - 1];
    expect(copy.get('text')).toBe('Web App');
    expect(copy.childNodes.length).toBe(3);
  });

  it('pasteCount reflects total paste operations', () => {
    refs.grid.select(refs.grid.getNodeById('task1')!);
    refs.viewController.copySelected(refs);
    refs.viewController.pasteText(refs, refs.viewModel.getCopiedText());
    refs.viewController.pasteText(refs, refs.viewModel.getCopiedText());
    expect(refs.viewModel.getPasteCount()).toBe(2);
  });
});

// ── 6. TreeGridDragDrop ──────────────────────────────────────────────────────
describe('TreeGridDragDrop', () => {
  it('dragDrop is initialized', () => expect(refs.dragDrop).toBeTruthy());

  it('sibling reorder: task5 can be repositioned before task4', () => {
    const mobile = refs.grid.getNodeById('mobile')!;
    const task4  = refs.grid.getNodeById('task4')!;
    const task5  = refs.grid.getNodeById('task5')!;

    // Manually simulate what drag-drop does: remove task5 and insert before task4
    mobile.removeChild(task5);
    mobile.insertBefore(task5, task4);

    expect(mobile.childNodes[0].get('text')).toBe('Review');
    expect(mobile.childNodes[1].get('text')).toBe('Prototype');
  });
});

// ── 7. ViewModel binding ─────────────────────────────────────────────────────
describe('ViewModel binding', () => {
  it('copiedText starts empty', () => expect(refs.viewModel.getCopiedText()).toBe(''));
  it('pasteCount starts at 0',  () => expect(refs.viewModel.getPasteCount()).toBe(0));

  it('copySelected updates copiedText', () => {
    refs.grid.select(refs.grid.getNodeById('task1')!);
    refs.viewController.copySelected(refs);
    expect(refs.viewModel.getCopiedText().length).toBeGreaterThan(0);
  });

  it('copySelected with no selection leaves copiedText empty', () => {
    refs.grid.deselectAll();
    refs.viewController.copySelected(refs);
    expect(refs.viewModel.getCopiedText()).toBe('');
  });
});

// ── 8. ViewController ────────────────────────────────────────────────────────
describe('ViewController', () => {
  it('copySelected returns empty string when nothing selected', () => {
    refs.grid.deselectAll();
    expect(refs.viewController.copySelected(refs)).toBe('');
  });

  it('copySelected returns TSV after selecting a leaf node', () => {
    refs.grid.select(refs.grid.getNodeById('task3')!);
    expect(refs.viewController.copySelected(refs)).toContain('Write tests');
  });

  it('pasteText adds a node and increments pasteCount', () => {
    const before = refs.store.getRootNode().childNodes.length;
    refs.viewController.pasteText(refs, 'Injected Task\tTodo\tHigh');
    expect(refs.store.getRootNode().childNodes.length).toBe(before + 1);
    expect(refs.viewModel.getPasteCount()).toBe(1);
  });

  it('pasteText twice gives pasteCount of 2', () => {
    refs.viewController.pasteText(refs, 'Task A\tTodo\tHigh');
    refs.viewController.pasteText(refs, 'Task B\tTodo\tLow');
    expect(refs.viewModel.getPasteCount()).toBe(2);
  });
});

// ── 9. Data ──────────────────────────────────────────────────────────────────
describe('Task store', () => {
  it('makeTaskStore returns 2 top-level nodes', () => {
    const s = makeTaskStore();
    expect(s.getRootNode().childNodes.length).toBe(2);
  });

  it('Web App has 3 children', () => {
    expect(refs.grid.getNodeById('webapp')!.childNodes.length).toBe(3);
  });

  it('Mobile App has 2 children', () => {
    expect(refs.grid.getNodeById('mobile')!.childNodes.length).toBe(2);
  });

  it('task1 status is "Done"', () => {
    expect(refs.grid.getNodeById('task1')!.get('status')).toBe('Done');
  });

  it('task5 is a leaf node', () => {
    expect(refs.grid.getNodeById('task5')!.isLeaf()).toBe(true);
  });
});

// ── 10. Application guard ─────────────────────────────────────────────────────
describe('Application guard', () => {
  it('module import does not throw', () => expect(true).toBe(true));
  it('createMainView is standalone', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    let r: MainViewRefs | undefined;
    expect(() => { r = createMainView(div); }).not.toThrow();
    expect(r!.store.getRootNode().childNodes.length).toBe(2);
    div.parentNode?.removeChild(div);
  });
});
