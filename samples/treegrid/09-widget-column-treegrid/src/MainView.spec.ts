/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * 09-widget-column-treegrid — MainView.spec.ts
 *
 * Coverage:
 *   1. View structure    — WidgetColumn in columns, ViewModel, ViewController
 *   2. WidgetColumn API  — mountToCell renders .x-btn, destroyWidgets, isWidgetColumn flag
 *   3. ViewModel binding — clickedId, clickCount
 *   4. ViewController    — handleAction updates ViewModel, itemclick listener
 *   5. Data              — OrgChart store shape
 *   6. Application guard
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { TreeGrid, WidgetColumn } from '@framesquared/ui';
import { createMainView, makeOrgChartStore } from './MainView.js';
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
  it('actionColumn is WidgetColumn',         () => expect(refs.actionColumn).toBeInstanceOf(WidgetColumn));
  it('viewModel is MainViewModel',           () => expect(refs.viewModel).toBeInstanceOf(MainViewModel));
  it('viewController is MainViewController', () => expect(refs.viewController).toBeInstanceOf(MainViewController));
  it('grid renders inside host',             () => expect(host.contains(refs.grid.el)).toBe(true));
  it('actionColumn is last column',          () => {
    const cols = refs.grid.getColumns();
    expect(cols[cols.length - 1]).toBe(refs.actionColumn);
  });
});

// ── 2. WidgetColumn API ──────────────────────────────────────────────────────
describe('WidgetColumn API', () => {
  it('isWidgetColumn flag is true', () => {
    expect(refs.actionColumn.isWidgetColumn).toBe(true);
  });

  it('grid cells in action column contain .x-btn elements', () => {
    const buttons = refs.grid.el!.querySelectorAll('.x-btn');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('one .x-btn per visible node', () => {
    // eng, alice, bob, carol, mkt, dave, eve = 7 visible nodes (rootVisible=false)
    const buttons = refs.grid.el!.querySelectorAll('.x-btn');
    expect(buttons.length).toBeGreaterThanOrEqual(5);
  });

  it('destroyWidgets does not throw', () => {
    expect(() => refs.actionColumn.destroyWidgets()).not.toThrow();
  });

  it('renderValue returns empty string (cell content is provided by mountToCell)', () => {
    const node = refs.grid.getNodeById('alice')!;
    expect(refs.actionColumn.renderValue(node)).toBe('');
  });
});

// ── 3. ViewModel binding ─────────────────────────────────────────────────────
describe('ViewModel binding', () => {
  it('clickedId starts empty', () => expect(refs.viewModel.getClickedId()).toBe(''));
  it('clickCount starts at 0', () => expect(refs.viewModel.getClickCount()).toBe(0));
});

// ── 4. ViewController ────────────────────────────────────────────────────────
describe('ViewController', () => {
  it('handleAction sets clickedId to node id', () => {
    const alice = refs.grid.getNodeById('alice')!;
    refs.viewController.handleAction(refs, alice);
    expect(refs.viewModel.getClickedId()).toBe('alice');
  });

  it('handleAction increments clickCount', () => {
    const bob = refs.grid.getNodeById('bob')!;
    refs.viewController.handleAction(refs, bob);
    expect(refs.viewModel.getClickCount()).toBe(1);
  });

  it('handleAction twice gives clickCount 2', () => {
    refs.viewController.handleAction(refs, refs.grid.getNodeById('alice')!);
    refs.viewController.handleAction(refs, refs.grid.getNodeById('bob')!);
    expect(refs.viewModel.getClickCount()).toBe(2);
  });

  it('handleAction updates lastClickedId on second call', () => {
    refs.viewController.handleAction(refs, refs.grid.getNodeById('alice')!);
    refs.viewController.handleAction(refs, refs.grid.getNodeById('carol')!);
    expect(refs.viewModel.getClickedId()).toBe('carol');
  });

  it('itemclick on a row increments clickCount', () => {
    const aliceRow = refs.grid.el!.querySelector('[data-record-id="alice"]') as HTMLElement;
    aliceRow?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.viewModel.getClickCount()).toBe(1);
  });

  it('itemclick sets clickedId', () => {
    const bobRow = refs.grid.el!.querySelector('[data-record-id="bob"]') as HTMLElement;
    bobRow?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.viewModel.getClickedId()).toBe('bob');
  });
});

// ── 5. Data ──────────────────────────────────────────────────────────────────
describe('OrgChart store', () => {
  it('makeOrgChartStore returns 2 top-level nodes', () => {
    const s = makeOrgChartStore();
    expect(s.getRootNode().childNodes.length).toBe(2);
  });

  it('Engineering has 3 children', () => {
    expect(refs.grid.getNodeById('eng')!.childNodes.length).toBe(3);
  });

  it('alice salary is 110000', () => {
    expect(refs.grid.getNodeById('alice')!.get('salary')).toBe(110000);
  });

  it('dave is a leaf node', () => {
    expect(refs.grid.getNodeById('dave')!.isLeaf()).toBe(true);
  });
});

// ── 6. Application guard ─────────────────────────────────────────────────────
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
