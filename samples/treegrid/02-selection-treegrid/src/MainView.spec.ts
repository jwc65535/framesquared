/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * 02-selection-treegrid — MainView.spec.ts
 *
 * Coverage:
 *   1. View structure      — TreeGrid, Store, Button, ViewModel, ViewController
 *   2. Selection model     — MULTI mode, checkboxSelect, checkable columns
 *   3. Programmatic select — select(node), getSelection(), deselectAll()
 *   4. Checkbox checks     — checkable=true renders checkboxes; check propagation
 *   5. ViewModel binding   — selectionchange updates viewModel.selectedCount
 *   6. ViewController      — clearSelection resets state
 *   7. Application guard
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { TreeGrid } from '@framesquared/ui';
import { Button } from '@framesquared/ui';
import { TreeStore } from '@framesquared/data';
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
  it('grid is a TreeGrid instance', ()        => expect(refs.grid).toBeInstanceOf(TreeGrid));
  it('store is a TreeStore instance', ()      => expect(refs.store).toBeInstanceOf(TreeStore));
  it('clearBtn is a Button instance', ()      => expect(refs.clearBtn).toBeInstanceOf(Button));
  it('viewModel is a MainViewModel', ()       => expect(refs.viewModel).toBeInstanceOf(MainViewModel));
  it('viewController is a MainViewController', () => expect(refs.viewController).toBeInstanceOf(MainViewController));
  it('grid renders inside host', ()           => expect(host.contains(refs.grid.el)).toBe(true));
  it('grid has x-treegrid class', ()          => expect(refs.grid.el!.classList.contains('x-treegrid')).toBe(true));
  it('3 column headers present', ()           => {
    expect(refs.grid.el!.querySelectorAll('th.x-treegrid-column-header').length).toBe(3);
  });
});

// ── 2. Selection model ────────────────────────────────────────────────────────
describe('Selection model', () => {
  it('checkable grid renders checkbox spans', () => {
    const checkboxes = refs.grid.el!.querySelectorAll('.x-treegrid-checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('getSelection() starts empty', () => {
    expect(refs.grid.getSelection().length).toBe(0);
  });

  it('select(alice) returns 1-element selection', () => {
    refs.grid.select(refs.grid.getNodeById('alice')!);
    expect(refs.grid.getSelection().length).toBe(1);
  });

  it('selected node is alice', () => {
    refs.grid.select(refs.grid.getNodeById('alice')!);
    expect(refs.grid.getSelection()[0].get('text')).toBe('Alice');
  });

  it('MULTI mode: selecting two nodes keeps both', () => {
    const alice = refs.grid.getNodeById('alice')!;
    const bob   = refs.grid.getNodeById('bob')!;
    refs.grid.select([alice, bob]);
    expect(refs.grid.getSelection().length).toBe(2);
  });

  it('selected row gets x-treegrid-selected class', () => {
    refs.grid.select(refs.grid.getNodeById('alice')!);
    const row = refs.grid.el!.querySelector('tr[data-record-id="alice"]')!;
    expect(row.classList.contains('x-treegrid-selected')).toBe(true);
  });

  it('deselectAll() clears selection', () => {
    refs.grid.select(refs.grid.getNodeById('alice')!);
    refs.grid.deselectAll();
    expect(refs.grid.getSelection().length).toBe(0);
  });
});

// ── 3. Checkbox propagation ──────────────────────────────────────────────────
describe('Checkbox checks', () => {
  it('setChecked(alice, true) marks alice as checked', () => {
    refs.grid.setChecked(refs.grid.getNodeById('alice')!, true);
    expect(refs.grid.getChecked().some((n) => n.get('text') === 'Alice')).toBe(true);
  });

  it('getCheckedLeaves() returns only leaf nodes', () => {
    refs.grid.setChecked(refs.grid.getNodeById('alice')!, true);
    expect(refs.grid.getCheckedLeaves().every((n) => n.isLeaf())).toBe(true);
  });

  it('uncheckAll() leaves getChecked() empty', () => {
    refs.grid.setChecked(refs.grid.getNodeById('alice')!, true);
    refs.grid.uncheckAll();
    expect(refs.grid.getChecked().length).toBe(0);
  });
});

// ── 4. ViewModel binding ─────────────────────────────────────────────────────
describe('ViewModel binding', () => {
  it('selectedCount starts at 0', () => {
    expect(refs.viewModel.getSelectedCount()).toBe(0);
  });

  it('selecting alice updates selectedCount to 1', () => {
    refs.grid.select(refs.grid.getNodeById('alice')!);
    expect(refs.viewModel.getSelectedCount()).toBe(1);
  });

  it('lastSelected is updated to Alice', () => {
    refs.grid.select(refs.grid.getNodeById('alice')!);
    expect(refs.viewModel.getLastSelected()).toBe('Alice');
  });

  it('selecting two nodes: selectedCount = 2', () => {
    refs.grid.select([refs.grid.getNodeById('alice')!, refs.grid.getNodeById('bob')!]);
    expect(refs.viewModel.getSelectedCount()).toBe(2);
  });

  it('deselectAll: selectedCount drops to 0', () => {
    refs.grid.select(refs.grid.getNodeById('alice')!);
    refs.grid.deselectAll();
    expect(refs.viewModel.getSelectedCount()).toBe(0);
  });
});

// ── 5. ViewController ────────────────────────────────────────────────────────
describe('ViewController', () => {
  it('clearSelection deselects all nodes', () => {
    refs.grid.select(refs.grid.getNodeById('alice')!);
    refs.viewController.clearSelection(refs);
    expect(refs.grid.getSelection().length).toBe(0);
  });

  it('clearSelection unchecks all checked nodes', () => {
    refs.grid.setChecked(refs.grid.getNodeById('alice')!, true);
    refs.grid.setChecked(refs.grid.getNodeById('bob')!, true);
    refs.viewController.clearSelection(refs);
    expect(refs.grid.getChecked().length).toBe(0);
  });

  it('clearSelection resets ViewModel selectedCount', () => {
    refs.grid.select(refs.grid.getNodeById('alice')!);
    refs.viewController.clearSelection(refs);
    expect(refs.viewModel.getSelectedCount()).toBe(0);
  });

  it('clearSelection resets lastSelected', () => {
    refs.grid.select(refs.grid.getNodeById('alice')!);
    refs.viewController.clearSelection(refs);
    expect(refs.viewModel.getLastSelected()).toBe('');
  });

  it('clearBtn click deselects rows', () => {
    refs.grid.select(refs.grid.getNodeById('alice')!);
    refs.clearBtn.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.grid.getSelection().length).toBe(0);
  });

  it('clearBtn click unchecks checkboxes', () => {
    refs.grid.setChecked(refs.grid.getNodeById('alice')!, true);
    refs.clearBtn.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.grid.getChecked().length).toBe(0);
  });
});

// ── 6. Data ──────────────────────────────────────────────────────────────────
describe('OrgChart store', () => {
  it('makeOrgChartStore returns 2 top-level nodes', () => {
    const s = makeOrgChartStore();
    expect(s.getRootNode().childNodes.length).toBe(2);
  });

  it('Engineering has 3 children', () => {
    expect(refs.grid.getNodeById('eng')!.childNodes.length).toBe(3);
  });

  it('Marketing has 2 children', () => {
    expect(refs.grid.getNodeById('mkt')!.childNodes.length).toBe(2);
  });

  it('alice salary is 110000', () => {
    expect(refs.grid.getNodeById('alice')!.get('salary')).toBe(110000);
  });
});

// ── 7. Application guard ─────────────────────────────────────────────────────
describe('Application guard', () => {
  it('module import does not throw', () => expect(true).toBe(true));

  it('createMainView is independently callable', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    let r: MainViewRefs | undefined;
    expect(() => { r = createMainView(div); }).not.toThrow();
    expect(r!.store.getRootNode().childNodes.length).toBe(2);
    div.parentNode?.removeChild(div);
  });
});
