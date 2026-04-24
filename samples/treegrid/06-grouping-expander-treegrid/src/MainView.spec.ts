/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * 06-grouping-expander-treegrid — MainView.spec.ts
 *
 * Coverage:
 *   1. View structure      — plugins, ViewModel, ViewController present
 *   2. GroupingSummary API — renderGroupSummaries, summary rows in DOM, salary/headcount sums
 *   3. RowExpander API     — expandRow, collapseRow, isRowExpanded, body row DOM
 *   4. ViewModel binding   — expandedDetailRows, lastExpandedId
 *   5. ViewController      — expandDetail / collapseDetail
 *   6. Data                — OrgChart store shape
 *   7. Application guard
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { TreeGrid, TreeGridGroupingSummary, TreeGridRowExpander } from '@framesquared/ui';
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
  it('grid is TreeGrid',                      () => expect(refs.grid).toBeInstanceOf(TreeGrid));
  it('groupSummary is TreeGridGroupingSummary', () => expect(refs.groupSummary).toBeInstanceOf(TreeGridGroupingSummary));
  it('rowExpander is TreeGridRowExpander',    () => expect(refs.rowExpander).toBeInstanceOf(TreeGridRowExpander));
  it('viewModel is MainViewModel',            () => expect(refs.viewModel).toBeInstanceOf(MainViewModel));
  it('viewController is MainViewController', () => expect(refs.viewController).toBeInstanceOf(MainViewController));
  it('grid renders inside host',              () => expect(host.contains(refs.grid.el)).toBe(true));
});

// ── 2. GroupingSummary API ───────────────────────────────────────────────────
describe('GroupingSummary API', () => {
  it('summary row exists for Engineering (data-summary-for="eng")', () => {
    const row = refs.grid.el!.querySelector('[data-summary-for="eng"]');
    expect(row).toBeTruthy();
  });

  it('summary row exists for Marketing (data-summary-for="mkt")', () => {
    const row = refs.grid.el!.querySelector('[data-summary-for="mkt"]');
    expect(row).toBeTruthy();
  });

  it('two group summary rows total', () => {
    const rows = refs.grid.el!.querySelectorAll('[data-summary-for]');
    expect(rows.length).toBe(2);
  });

  it('renderGroupSummaries does not throw', () => {
    expect(() => refs.groupSummary.renderGroupSummaries()).not.toThrow();
  });

  it('Engineering salary summary shows $285,000', () => {
    const row = refs.grid.el!.querySelector('[data-summary-for="eng"]')!;
    expect(row.textContent).toContain('285,000');
  });

  it('Marketing salary summary shows $170,000', () => {
    const row = refs.grid.el!.querySelector('[data-summary-for="mkt"]')!;
    expect(row.textContent).toContain('170,000');
  });

  it('Engineering headcount summary shows 3', () => {
    const row = refs.grid.el!.querySelector('[data-summary-for="eng"]')!;
    expect(row.textContent).toContain('3');
  });

  it('Marketing headcount summary shows 2', () => {
    const row = refs.grid.el!.querySelector('[data-summary-for="mkt"]')!;
    expect(row.textContent).toContain('2');
  });
});

// ── 3. RowExpander API ───────────────────────────────────────────────────────
describe('RowExpander API', () => {
  it('alice is not expanded initially', () => {
    const alice = refs.grid.getNodeById('alice')!;
    expect(refs.rowExpander.isRowExpanded(alice)).toBe(false);
  });

  it('expandRow(alice) makes isRowExpanded true', () => {
    const alice = refs.grid.getNodeById('alice')!;
    refs.rowExpander.expandRow(alice);
    expect(refs.rowExpander.isRowExpanded(alice)).toBe(true);
  });

  it('expandRow inserts .x-treegrid-row-body element in DOM', () => {
    const alice = refs.grid.getNodeById('alice')!;
    refs.rowExpander.expandRow(alice);
    expect(refs.grid.el!.querySelector('.x-treegrid-row-body')).toBeTruthy();
  });

  it('collapseRow(alice) makes isRowExpanded false', () => {
    const alice = refs.grid.getNodeById('alice')!;
    refs.rowExpander.expandRow(alice);
    refs.rowExpander.collapseRow(alice);
    expect(refs.rowExpander.isRowExpanded(alice)).toBe(false);
  });

  it('collapseRow removes body row from DOM', () => {
    const alice = refs.grid.getNodeById('alice')!;
    refs.rowExpander.expandRow(alice);
    refs.rowExpander.collapseRow(alice);
    expect(refs.grid.el!.querySelector('.x-treegrid-row-body')).toBeFalsy();
  });

  it('body row renders bio text from XTemplate', () => {
    const bob = refs.grid.getNodeById('bob')!;
    refs.rowExpander.expandRow(bob);
    expect(refs.grid.el!.querySelector('.x-treegrid-row-body')!.textContent)
      .toContain('Backend specialist');
  });

  it('singleRowExpand=false — multiple rows can be expanded simultaneously', () => {
    const alice = refs.grid.getNodeById('alice')!;
    const bob   = refs.grid.getNodeById('bob')!;
    refs.rowExpander.expandRow(alice);
    refs.rowExpander.expandRow(bob);
    expect(refs.rowExpander.isRowExpanded(alice)).toBe(true);
    expect(refs.rowExpander.isRowExpanded(bob)).toBe(true);
    expect(refs.grid.el!.querySelectorAll('.x-treegrid-row-body').length).toBe(2);
  });

  it('toggleRow expands when collapsed', () => {
    const dave = refs.grid.getNodeById('dave')!;
    refs.rowExpander.toggleRow(dave);
    expect(refs.rowExpander.isRowExpanded(dave)).toBe(true);
  });

  it('toggleRow collapses when expanded', () => {
    const dave = refs.grid.getNodeById('dave')!;
    refs.rowExpander.expandRow(dave);
    refs.rowExpander.toggleRow(dave);
    expect(refs.rowExpander.isRowExpanded(dave)).toBe(false);
  });
});

// ── 4. ViewModel binding ─────────────────────────────────────────────────────
describe('ViewModel binding', () => {
  it('expandedDetailRows starts at 0', () => {
    expect(refs.viewModel.getExpandedDetailRows()).toBe(0);
  });

  it('lastExpandedId starts empty', () => {
    expect(refs.viewModel.getLastExpandedId()).toBe('');
  });
});

// ── 5. ViewController ────────────────────────────────────────────────────────
describe('ViewController', () => {
  it('expandDetail increments expandedDetailRows', () => {
    const alice = refs.grid.getNodeById('alice')!;
    refs.viewController.expandDetail(refs, alice);
    expect(refs.viewModel.getExpandedDetailRows()).toBe(1);
  });

  it('expandDetail sets lastExpandedId', () => {
    const alice = refs.grid.getNodeById('alice')!;
    refs.viewController.expandDetail(refs, alice);
    expect(refs.viewModel.getLastExpandedId()).toBe('alice');
  });

  it('collapseDetail decrements expandedDetailRows', () => {
    const alice = refs.grid.getNodeById('alice')!;
    refs.viewController.expandDetail(refs, alice);
    refs.viewController.collapseDetail(refs, alice);
    expect(refs.viewModel.getExpandedDetailRows()).toBe(0);
  });

  it('expandedDetailRows never goes below 0', () => {
    const alice = refs.grid.getNodeById('alice')!;
    refs.viewController.collapseDetail(refs, alice);
    expect(refs.viewModel.getExpandedDetailRows()).toBe(0);
  });

  it('expanding two rows then collapsing one gives count of 1', () => {
    const alice = refs.grid.getNodeById('alice')!;
    const bob   = refs.grid.getNodeById('bob')!;
    refs.viewController.expandDetail(refs, alice);
    refs.viewController.expandDetail(refs, bob);
    refs.viewController.collapseDetail(refs, alice);
    expect(refs.viewModel.getExpandedDetailRows()).toBe(1);
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

  it('alice has bio text', () => {
    expect(refs.grid.getNodeById('alice')!.get('bio')).toContain('Full-stack');
  });

  it('bob is a leaf node', () => {
    expect(refs.grid.getNodeById('bob')!.isLeaf()).toBe(true);
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
