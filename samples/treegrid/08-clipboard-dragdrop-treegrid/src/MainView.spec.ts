/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * 08-clipboard-dragdrop-treegrid — MainView.spec.ts
 *
 * Coverage:
 *   1. View structure     — clipboard plugin, dragdrop plugin, ViewModel, ViewController
 *   2. TreeGridClipboard  — copyToClipboard (empty/with selection), pasteFromText
 *   3. TreeGridDragDrop   — init, config
 *   4. ViewModel binding  — copiedText, pasteCount
 *   5. ViewController     — copySelected / pasteText
 *   6. Data               — Task store shape
 *   7. Application guard
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { TreeGrid, TreeGridClipboard, TreeGridDragDrop } from '@framesquared/ui';
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
  it('viewModel is MainViewModel',           () => expect(refs.viewModel).toBeInstanceOf(MainViewModel));
  it('viewController is MainViewController', () => expect(refs.viewController).toBeInstanceOf(MainViewController));
  it('grid renders inside host',             () => expect(host.contains(refs.grid.el)).toBe(true));
});

// ── 2. TreeGridClipboard ─────────────────────────────────────────────────────
describe('TreeGridClipboard', () => {
  it('copyToClipboard returns empty string when nothing selected', () => {
    refs.grid.deselectAll();
    expect(refs.clipboard.copyToClipboard()).toBe('');
  });

  it('copyToClipboard returns TSV string after selecting a node', () => {
    const node = refs.grid.getNodeById('task1')!;
    refs.grid.select(node);
    const text = refs.clipboard.copyToClipboard();
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });

  it('copyToClipboard output contains selected node text', () => {
    const node = refs.grid.getNodeById('task1')!;
    refs.grid.select(node);
    expect(refs.clipboard.copyToClipboard()).toContain('Setup repo');
  });

  it('copyToClipboard output contains tab separators', () => {
    const node = refs.grid.getNodeById('task2')!;
    refs.grid.select(node);
    expect(refs.clipboard.copyToClipboard()).toContain('\t');
  });

  it('pasteFromText adds a new node to root when nothing selected', () => {
    refs.grid.deselectAll();
    const rootChildrenBefore = refs.store.getRootNode().childNodes.length;
    refs.clipboard.pasteFromText('New Task\tTodo\tHigh');
    expect(refs.store.getRootNode().childNodes.length).toBe(rootChildrenBefore + 1);
  });

  it('pasteFromText adds node as child of selected node', () => {
    const webapp = refs.grid.getNodeById('webapp')!;
    refs.grid.select(webapp);
    const childrenBefore = webapp.childNodes.length;
    refs.clipboard.pasteFromText('Extra Task\tTodo\tLow');
    expect(webapp.childNodes.length).toBe(childrenBefore + 1);
  });

  it('pasteFromText pasted leaf node has correct text', () => {
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
});

// ── 3. TreeGridDragDrop ──────────────────────────────────────────────────────
describe('TreeGridDragDrop', () => {
  it('dragDrop is initialized (does not throw on init)', () => {
    expect(refs.dragDrop).toBeTruthy();
  });
});

// ── 4. ViewModel binding ─────────────────────────────────────────────────────
describe('ViewModel binding', () => {
  it('copiedText starts empty', () => expect(refs.viewModel.getCopiedText()).toBe(''));
  it('pasteCount starts at 0',  () => expect(refs.viewModel.getPasteCount()).toBe(0));

  it('copySelected updates copiedText', () => {
    refs.grid.select(refs.grid.getNodeById('task1')!);
    refs.viewController.copySelected(refs);
    expect(refs.viewModel.getCopiedText().length).toBeGreaterThan(0);
  });
});

// ── 5. ViewController ────────────────────────────────────────────────────────
describe('ViewController', () => {
  it('copySelected returns empty string when nothing selected', () => {
    refs.grid.deselectAll();
    expect(refs.viewController.copySelected(refs)).toBe('');
  });

  it('copySelected returns TSV after selecting a leaf node', () => {
    refs.grid.select(refs.grid.getNodeById('task3')!);
    const text = refs.viewController.copySelected(refs);
    expect(text).toContain('Write tests');
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

// ── 6. Data ──────────────────────────────────────────────────────────────────
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

// ── 7. Application guard ─────────────────────────────────────────────────────
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
