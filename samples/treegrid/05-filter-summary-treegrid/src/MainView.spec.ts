/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * 05-filter-summary-treegrid — MainView.spec.ts
 *
 * Coverage:
 *   1. View structure      — plugins, ViewModel, ViewController present
 *   2. Filter plugin API   — addFilter, clearFilters, getActiveFilters, getFilteredCount
 *   3. Filter row DOM      — showFilterRow=true inserts filter inputs
 *   4. Summary plugin API  — calculateSummary (sum/count), renderSummary adds row
 *   5. ViewModel binding   — totalSize set on init, filteredCount after filter
 *   6. ViewController      — filterByName / clearFilter
 *   7. Data                — FileSystem store shape
 *   8. Application guard
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { TreeGrid, TreeGridFilterPlugin, TreeGridSummary } from '@framesquared/ui';
import { TreeStore } from '@framesquared/data';
import { createMainView, makeFileSystemStore } from './MainView.js';
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
  it('grid is TreeGrid',                   () => expect(refs.grid).toBeInstanceOf(TreeGrid));
  it('filterPlugin is TreeGridFilterPlugin', () => expect(refs.filterPlugin).toBeInstanceOf(TreeGridFilterPlugin));
  it('summaryPlugin is TreeGridSummary',   () => expect(refs.summaryPlugin).toBeInstanceOf(TreeGridSummary));
  it('viewModel is MainViewModel',         () => expect(refs.viewModel).toBeInstanceOf(MainViewModel));
  it('viewController is MainViewController', () => expect(refs.viewController).toBeInstanceOf(MainViewController));
  it('grid renders inside host',           () => expect(host.contains(refs.grid.el)).toBe(true));
});

// ── 2. Filter plugin API ─────────────────────────────────────────────────────
describe('Filter plugin API', () => {
  it('no active filters initially',  () => expect(refs.filterPlugin.getActiveFilters().length).toBe(0));

  it('addFilter stores 1 filter',    () => {
    refs.filterPlugin.addFilter({ dataIndex: 'text', value: 'pdf', operator: 'contains' });
    expect(refs.filterPlugin.getActiveFilters().length).toBe(1);
  });

  it('addFilter on same dataIndex replaces the old filter', () => {
    refs.filterPlugin.addFilter({ dataIndex: 'text', value: 'a', operator: 'contains' });
    refs.filterPlugin.addFilter({ dataIndex: 'text', value: 'b', operator: 'contains' });
    expect(refs.filterPlugin.getActiveFilters().length).toBe(1);
    expect(refs.filterPlugin.getActiveFilters()[0].value).toBe('b');
  });

  it('clearFilters removes all filters', () => {
    refs.filterPlugin.addFilter({ dataIndex: 'text', value: 'pdf', operator: 'contains' });
    refs.filterPlugin.clearFilters();
    expect(refs.filterPlugin.getActiveFilters().length).toBe(0);
  });

  it('removeFilter removes a specific column filter', () => {
    refs.filterPlugin.addFilter({ dataIndex: 'text', value: 'pdf', operator: 'contains' });
    refs.filterPlugin.addFilter({ dataIndex: 'type', value: 'Image', operator: 'eq' });
    refs.filterPlugin.removeFilter('text');
    expect(refs.filterPlugin.getActiveFilters().length).toBe(1);
    expect(refs.filterPlugin.getActiveFilters()[0].dataIndex).toBe('type');
  });

  it('getFilteredCount returns correct count for PDF filter', () => {
    refs.filterPlugin.addFilter({ dataIndex: 'type', value: 'PDF', operator: 'eq' });
    // At least 1 node matches (Resume.pdf)
    expect(refs.filterPlugin.getFilteredCount()).toBeGreaterThan(0);
  });

  it('getFilteredCount with impossible filter returns 0', () => {
    refs.filterPlugin.addFilter({ dataIndex: 'text', value: 'zzz_no_match', operator: 'eq' });
    expect(refs.filterPlugin.getFilteredCount()).toBe(0);
  });
});

// ── 3. Filter row DOM ────────────────────────────────────────────────────────
describe('Filter row DOM', () => {
  it('showFilterRow=true inserts .x-treegrid-filter-row', () => {
    expect(refs.grid.el!.querySelector('.x-treegrid-filter-row')).toBeTruthy();
  });

  it('filter row has an input per visible column', () => {
    const filterRow = refs.grid.el!.querySelector('.x-treegrid-filter-row')!;
    expect(filterRow.querySelectorAll('input.x-treegrid-filter-input').length).toBe(3);
  });

  it('filter hides non-matching rows from the DOM', () => {
    const allRows = () => refs.grid.el!.querySelectorAll('tr.x-grid-row').length;
    const before = allRows();
    refs.filterPlugin.addFilter({ dataIndex: 'type', value: 'PDF', operator: 'eq' });
    expect(allRows()).toBeLessThan(before);
  });

  it('clearFilters restores all rows in the DOM', () => {
    const allRows = () => refs.grid.el!.querySelectorAll('tr.x-grid-row').length;
    const before = allRows();
    refs.filterPlugin.addFilter({ dataIndex: 'type', value: 'PDF', operator: 'eq' });
    refs.filterPlugin.clearFilters();
    expect(allRows()).toBe(before);
  });

  it('clearFilters resets filter row inputs to empty', () => {
    const input = refs.grid.el!.querySelector<HTMLInputElement>('.x-treegrid-filter-input')!;
    input.value = 'pdf';
    input.dispatchEvent(new Event('input'));
    refs.filterPlugin.clearFilters();
    const inputs = refs.grid.el!.querySelectorAll<HTMLInputElement>('.x-treegrid-filter-input');
    inputs.forEach((i) => expect(i.value).toBe(''));
  });
});

// ── 4. Summary plugin API ────────────────────────────────────────────────────
describe('Summary plugin API', () => {
  it('summary row rendered in table', () => {
    expect(refs.grid.el!.querySelector('.x-treegrid-summary-row')).toBeTruthy();
  });

  it('calculateSummary(size, sum) equals total of all file sizes', () => {
    // 128 + 256 + 4608 + 256 + 2150 + 1840 = 9238
    const sum = refs.summaryPlugin.calculateSummary('size', 'sum');
    expect(sum).toBe(9238);
  });

  it('calculateSummary(size, max) equals 4608', () => {
    expect(refs.summaryPlugin.calculateSummary('size', 'max')).toBe(4608);
  });

  it('calculateSummary(size, min) equals 0 (folder nodes have size=0)', () => {
    expect(refs.summaryPlugin.calculateSummary('size', 'min')).toBe(0);
  });

  it('calculateSummary(text, count) > 0', () => {
    expect(refs.summaryPlugin.calculateSummary('text', 'count')).toBeGreaterThan(0);
  });

  it('updateSummary does not throw', () => {
    expect(() => refs.summaryPlugin.updateSummary()).not.toThrow();
  });
});

// ── 5. ViewModel binding ─────────────────────────────────────────────────────
describe('ViewModel binding', () => {
  it('totalSize is set on init (≥ 9238)', () => {
    expect(refs.viewModel.getTotalSize()).toBeGreaterThanOrEqual(9238);
  });

  it('filterByName updates filteredCount in viewModel', () => {
    refs.viewController.filterByName(refs, 'pdf');
    expect(refs.viewModel.getFilteredCount()).toBeGreaterThan(0);
  });

  it('filterText set after filterByName', () => {
    refs.viewController.filterByName(refs, 'Image');
    expect(refs.viewModel.getFilterText()).toBe('Image');
  });

  it('clearFilter resets filterText', () => {
    refs.viewController.filterByName(refs, 'pdf');
    refs.viewController.clearFilter(refs);
    expect(refs.viewModel.getFilterText()).toBe('');
  });
});

// ── 6. ViewController ────────────────────────────────────────────────────────
describe('ViewController', () => {
  it('filterByName with empty string clears filters', () => {
    refs.filterPlugin.addFilter({ dataIndex: 'text', value: 'pdf', operator: 'contains' });
    refs.viewController.filterByName(refs, '');
    expect(refs.filterPlugin.getActiveFilters().length).toBe(0);
  });

  it('clearFilter removes all active filters', () => {
    refs.filterPlugin.addFilter({ dataIndex: 'text', value: 'pdf', operator: 'contains' });
    refs.viewController.clearFilter(refs);
    expect(refs.filterPlugin.getActiveFilters().length).toBe(0);
  });

  it('clearFilterBtn click clears filters', () => {
    refs.filterPlugin.addFilter({ dataIndex: 'text', value: 'pdf', operator: 'contains' });
    refs.clearFilterBtn.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.filterPlugin.getActiveFilters().length).toBe(0);
  });
});

// ── 7. Data ──────────────────────────────────────────────────────────────────
describe('FileSystem store', () => {
  it('makeFileSystemStore returns 2 top-level nodes', () => {
    const s = makeFileSystemStore();
    expect(s.getRootNode().childNodes.length).toBe(2);
  });
  it('Projects has 2 children (Website + Logo)', () => {
    expect(refs.grid.getNodeById('projects')!.childNodes.length).toBe(2);
  });
  it('Logo.ai size is 256',  () => expect(refs.grid.getNodeById('logo')!.get('size')).toBe(256));
});

// ── 8. Application guard ─────────────────────────────────────────────────────
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
