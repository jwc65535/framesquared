/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * 10-cascade-select-treegrid — MainView.spec.ts
 *
 * Coverage:
 *   1. View structure        — grid, ViewModel, ViewController
 *   2. Cascade down          — checking a branch checks all descendants
 *   3. Cascade up            — checking all children of a branch checks the branch
 *   4. Indeterminate state   — partial child check → branch becomes indeterminate
 *   5. Uncheck cascade       — unchecking a branch unchecks all descendants
 *   6. getChecked / getCheckedLeaves
 *   7. ViewModel binding     — checkedLeafCount, hasIndeterminate
 *   8. ViewController        — checkBranch, uncheckBranch, clearAll
 *   9. Clear All button
 *  10. Data                  — OrgChart store shape
 *  11. Application guard
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { TreeGrid } from '@framesquared/ui';
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
  it('viewModel is MainViewModel',           () => expect(refs.viewModel).toBeInstanceOf(MainViewModel));
  it('viewController is MainViewController', () => expect(refs.viewController).toBeInstanceOf(MainViewController));
  it('grid renders inside host',             () => expect(host.contains(refs.grid.el)).toBe(true));
  it('nothing checked initially',            () => expect(refs.grid.getChecked().length).toBe(0));
});

// ── 2. Cascade down ──────────────────────────────────────────────────────────
describe('Cascade down — checking a branch checks all descendants', () => {
  it('checking Engineering checks alice', () => {
    refs.grid.setChecked(refs.grid.getNodeById('eng')!, true);
    expect((refs.grid.getNodeById('alice') as any).$checked).toBe(true);
  });

  it('checking Engineering checks bob', () => {
    refs.grid.setChecked(refs.grid.getNodeById('eng')!, true);
    expect((refs.grid.getNodeById('bob') as any).$checked).toBe(true);
  });

  it('checking Engineering checks carol', () => {
    refs.grid.setChecked(refs.grid.getNodeById('eng')!, true);
    expect((refs.grid.getNodeById('carol') as any).$checked).toBe(true);
  });

  it('checking Engineering: getCheckedLeaves returns 3 nodes', () => {
    refs.grid.setChecked(refs.grid.getNodeById('eng')!, true);
    expect(refs.grid.getCheckedLeaves().length).toBe(3);
  });

  it('checking Marketing checks dave and eve', () => {
    refs.grid.setChecked(refs.grid.getNodeById('mkt')!, true);
    expect((refs.grid.getNodeById('dave') as any).$checked).toBe(true);
    expect((refs.grid.getNodeById('eve') as any).$checked).toBe(true);
  });

  it('checking both branches: getCheckedLeaves returns 5 nodes', () => {
    refs.grid.setChecked(refs.grid.getNodeById('eng')!, true);
    refs.grid.setChecked(refs.grid.getNodeById('mkt')!, true);
    expect(refs.grid.getCheckedLeaves().length).toBe(5);
  });
});

  it('checking Engineering: DOM shows .x-treegrid-checkbox-checked on alice row', () => {
    refs.grid.setChecked(refs.grid.getNodeById('eng')!, true);
    const aliceRow = refs.grid.el!.querySelector('[data-record-id="alice"]')!;
    expect(aliceRow.querySelector('.x-treegrid-checkbox-checked')).toBeTruthy();
  });

  it('unchecking Engineering: DOM shows unchecked checkbox on bob row', () => {
    refs.grid.setChecked(refs.grid.getNodeById('eng')!, true);
    refs.grid.setChecked(refs.grid.getNodeById('eng')!, false);
    const bobRow = refs.grid.el!.querySelector('[data-record-id="bob"]')!;
    expect(bobRow.querySelector('.x-treegrid-checkbox-checked')).toBeFalsy();
    expect(bobRow.querySelector('.x-treegrid-checkbox-indeterminate')).toBeFalsy();
  });

  it('checkbox click on Engineering row checks all child rows in DOM', () => {
    const engRow = refs.grid.el!.querySelector('[data-record-id="eng"]')!;
    engRow.querySelector('.x-treegrid-checkbox')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const aliceRow = refs.grid.el!.querySelector('[data-record-id="alice"]')!;
    const carolRow = refs.grid.el!.querySelector('[data-record-id="carol"]')!;
    expect(aliceRow.querySelector('.x-treegrid-checkbox-checked')).toBeTruthy();
    expect(carolRow.querySelector('.x-treegrid-checkbox-checked')).toBeTruthy();
  });

  it('checkbox click on Engineering row twice unchecks all child rows in DOM', () => {
    // Re-query after each click — refreshNode replaces the row innerHTML.
    refs.grid.el!.querySelector('[data-record-id="eng"] .x-treegrid-checkbox')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    refs.grid.el!.querySelector('[data-record-id="eng"] .x-treegrid-checkbox')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const bobRow = refs.grid.el!.querySelector('[data-record-id="bob"]')!;
    expect(bobRow.querySelector('.x-treegrid-checkbox-checked')).toBeFalsy();
  });

// ── 3. Cascade up ────────────────────────────────────────────────────────────
describe('Cascade up — checking all children checks the branch', () => {
  it('checking alice+bob+carol makes Engineering checked', () => {
    refs.grid.setChecked(refs.grid.getNodeById('alice')!, true);
    refs.grid.setChecked(refs.grid.getNodeById('bob')!, true);
    refs.grid.setChecked(refs.grid.getNodeById('carol')!, true);
    expect((refs.grid.getNodeById('eng') as any).$checked).toBe(true);
  });

  it('checking dave+eve makes Marketing checked', () => {
    refs.grid.setChecked(refs.grid.getNodeById('dave')!, true);
    refs.grid.setChecked(refs.grid.getNodeById('eve')!, true);
    expect((refs.grid.getNodeById('mkt') as any).$checked).toBe(true);
  });
});

// ── 4. Indeterminate state ───────────────────────────────────────────────────
describe('Indeterminate state — partial check makes branch indeterminate', () => {
  it('checking only alice makes Engineering indeterminate', () => {
    refs.grid.setChecked(refs.grid.getNodeById('alice')!, true);
    expect((refs.grid.getNodeById('eng') as any).$checked).toBe(null);
  });

  it('checking Engineering then unchecking bob makes Engineering indeterminate', () => {
    refs.grid.setChecked(refs.grid.getNodeById('eng')!, true);
    refs.grid.setChecked(refs.grid.getNodeById('bob')!, false);
    expect((refs.grid.getNodeById('eng') as any).$checked).toBe(null);
  });

  it('indeterminate Engineering: DOM has .x-treegrid-checkbox-indeterminate', () => {
    refs.grid.setChecked(refs.grid.getNodeById('alice')!, true);
    const engRow = refs.grid.el!.querySelector('[data-record-id="eng"]')!;
    expect(engRow.querySelector('.x-treegrid-checkbox-indeterminate')).toBeTruthy();
  });

  it('fully checked Engineering: DOM has .x-treegrid-checkbox-checked (not indeterminate)', () => {
    refs.grid.setChecked(refs.grid.getNodeById('eng')!, true);
    const engRow = refs.grid.el!.querySelector('[data-record-id="eng"]')!;
    expect(engRow.querySelector('.x-treegrid-checkbox-checked')).toBeTruthy();
    expect(engRow.querySelector('.x-treegrid-checkbox-indeterminate')).toBeFalsy();
  });
});

// ── 5. Uncheck cascade ───────────────────────────────────────────────────────
describe('Uncheck cascade — unchecking a branch unchecks all descendants', () => {
  it('unchecking Engineering after full check: alice is unchecked', () => {
    refs.grid.setChecked(refs.grid.getNodeById('eng')!, true);
    refs.grid.setChecked(refs.grid.getNodeById('eng')!, false);
    expect((refs.grid.getNodeById('alice') as any).$checked).toBe(false);
  });

  it('unchecking Engineering: getCheckedLeaves returns 0', () => {
    refs.grid.setChecked(refs.grid.getNodeById('eng')!, true);
    refs.grid.setChecked(refs.grid.getNodeById('eng')!, false);
    expect(refs.grid.getCheckedLeaves().length).toBe(0);
  });

  it('uncheckAll clears all states', () => {
    refs.grid.setChecked(refs.grid.getNodeById('eng')!, true);
    refs.grid.setChecked(refs.grid.getNodeById('mkt')!, true);
    refs.grid.uncheckAll();
    expect(refs.grid.getChecked().length).toBe(0);
  });
});

// ── 6. getChecked / getCheckedLeaves ─────────────────────────────────────────
describe('getChecked / getCheckedLeaves', () => {
  it('getChecked returns [] initially', () => {
    expect(refs.grid.getChecked()).toEqual([]);
  });

  it('getCheckedLeaves returns only leaf nodes', () => {
    refs.grid.setChecked(refs.grid.getNodeById('eng')!, true);
    const leaves = refs.grid.getCheckedLeaves();
    expect(leaves.every((n) => n.isLeaf())).toBe(true);
  });

  it('getChecked after checking eng includes eng and its 3 children', () => {
    refs.grid.setChecked(refs.grid.getNodeById('eng')!, true);
    expect(refs.grid.getChecked().length).toBe(4); // eng + alice + bob + carol
  });
});

// ── 7. ViewModel binding ─────────────────────────────────────────────────────
describe('ViewModel binding', () => {
  it('checkedLeafCount starts at 0', () => {
    expect(refs.viewModel.getCheckedLeafCount()).toBe(0);
  });

  it('hasIndeterminate starts false', () => {
    expect(refs.viewModel.getHasIndeterminate()).toBe(false);
  });

  it('checkBranch(eng) → checkedLeafCount becomes 3', () => {
    refs.viewController.checkBranch(refs, refs.grid.getNodeById('eng')!);
    expect(refs.viewModel.getCheckedLeafCount()).toBe(3);
  });

  it('partial check → hasIndeterminate becomes true', () => {
    refs.grid.setChecked(refs.grid.getNodeById('alice')!, true);
    // trigger sync via checkchange (already fired by setChecked through grid event)
    expect(refs.viewModel.getHasIndeterminate()).toBe(true);
  });

  it('full branch check → hasIndeterminate is false', () => {
    refs.viewController.checkBranch(refs, refs.grid.getNodeById('eng')!);
    expect(refs.viewModel.getHasIndeterminate()).toBe(false);
  });

  it('clearAll resets checkedLeafCount to 0', () => {
    refs.viewController.checkBranch(refs, refs.grid.getNodeById('eng')!);
    refs.viewController.clearAll(refs);
    expect(refs.viewModel.getCheckedLeafCount()).toBe(0);
  });

  it('clearAll resets hasIndeterminate to false', () => {
    refs.grid.setChecked(refs.grid.getNodeById('alice')!, true);
    refs.viewController.clearAll(refs);
    expect(refs.viewModel.getHasIndeterminate()).toBe(false);
  });
});

// ── 8. ViewController ────────────────────────────────────────────────────────
describe('ViewController', () => {
  it('checkBranch(eng) checks all Engineering employees', () => {
    refs.viewController.checkBranch(refs, refs.grid.getNodeById('eng')!);
    expect((refs.grid.getNodeById('alice') as any).$checked).toBe(true);
    expect((refs.grid.getNodeById('bob') as any).$checked).toBe(true);
    expect((refs.grid.getNodeById('carol') as any).$checked).toBe(true);
  });

  it('uncheckBranch(eng) after full check unchecks all Engineering employees', () => {
    refs.viewController.checkBranch(refs, refs.grid.getNodeById('eng')!);
    refs.viewController.uncheckBranch(refs, refs.grid.getNodeById('eng')!);
    expect(refs.grid.getCheckedLeaves().length).toBe(0);
  });

  it('clearAll unchecks everything', () => {
    refs.viewController.checkBranch(refs, refs.grid.getNodeById('eng')!);
    refs.viewController.checkBranch(refs, refs.grid.getNodeById('mkt')!);
    refs.viewController.clearAll(refs);
    expect(refs.grid.getChecked().length).toBe(0);
  });
});

// ── 9. Clear All button ──────────────────────────────────────────────────────
describe('Clear All button', () => {
  it('click clears all checked nodes', () => {
    refs.viewController.checkBranch(refs, refs.grid.getNodeById('eng')!);
    refs.clearBtn.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.grid.getChecked().length).toBe(0);
  });

  it('click resets checkedLeafCount to 0', () => {
    refs.viewController.checkBranch(refs, refs.grid.getNodeById('mkt')!);
    refs.clearBtn.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.viewModel.getCheckedLeafCount()).toBe(0);
  });
});

// ── 10. Data ─────────────────────────────────────────────────────────────────
describe('OrgChart store', () => {
  it('makeOrgChartStore returns 2 top-level nodes', () => {
    const s = makeOrgChartStore();
    expect(s.getRootNode().childNodes.length).toBe(2);
  });

  it('Engineering has 3 leaf children', () => {
    const eng = refs.grid.getNodeById('eng')!;
    expect(eng.childNodes.length).toBe(3);
    expect(eng.childNodes.every((n) => n.isLeaf())).toBe(true);
  });

  it('Marketing has 2 leaf children', () => {
    const mkt = refs.grid.getNodeById('mkt')!;
    expect(mkt.childNodes.length).toBe(2);
    expect(mkt.childNodes.every((n) => n.isLeaf())).toBe(true);
  });
});

// ── 11. Application guard ────────────────────────────────────────────────────
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
