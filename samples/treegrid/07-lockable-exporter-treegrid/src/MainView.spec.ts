/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * 07-lockable-exporter-treegrid — MainView.spec.ts
 *
 * Coverage:
 *   1. View structure       — lockable plugin, ViewModel, ViewController
 *   2. TreeGridLockable     — locked panel in DOM, getLockedView
 *   3. TreeGridExporter API — exportToCsv, exportToTsv, exportToJson, exportToXlsx
 *   4. ViewModel binding    — lastExportFormat, exportCount
 *   5. ViewController       — exportCsv / exportTsv / exportJson
 *   6. Data                 — Product catalog store shape
 *   7. Application guard
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { TreeGrid, TreeGridLockable, TreeGridExporter } from '@framesquared/ui';
import { createMainView, makeProductStore } from './MainView.js';
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
  it('lockable is TreeGridLockable',         () => expect(refs.lockable).toBeInstanceOf(TreeGridLockable));
  it('viewModel is MainViewModel',           () => expect(refs.viewModel).toBeInstanceOf(MainViewModel));
  it('viewController is MainViewController', () => expect(refs.viewController).toBeInstanceOf(MainViewController));
  it('grid renders inside host',             () => expect(host.contains(refs.grid.el)).toBe(true));
});

// ── 2. TreeGridLockable ──────────────────────────────────────────────────────
describe('TreeGridLockable', () => {
  it('locked panel rendered in DOM (.x-treegrid-locked-panel)', () => {
    expect(refs.grid.el!.querySelector('.x-treegrid-locked-panel')).toBeTruthy();
  });

  it('getLockedView() returns a non-null view', () => {
    expect(refs.lockable.getLockedView()).toBeTruthy();
  });
});

// ── 3. TreeGridExporter static API ──────────────────────────────────────────
describe('TreeGridExporter static API', () => {
  it('exportToCsv returns a non-empty string', () => {
    const csv = TreeGridExporter.exportToCsv(refs.grid);
    expect(typeof csv).toBe('string');
    expect(csv.length).toBeGreaterThan(0);
  });

  it('exportToCsv output contains header "Name"', () => {
    expect(TreeGridExporter.exportToCsv(refs.grid)).toContain('Name');
  });

  it('exportToCsv output contains "Laptop Pro"', () => {
    expect(TreeGridExporter.exportToCsv(refs.grid)).toContain('Laptop Pro');
  });

  it('exportToTsv returns a non-empty string', () => {
    expect(TreeGridExporter.exportToTsv(refs.grid).length).toBeGreaterThan(0);
  });

  it('exportToTsv output contains tab separators', () => {
    expect(TreeGridExporter.exportToTsv(refs.grid)).toContain('\t');
  });

  it('exportToTsv output contains "Carry Case"', () => {
    expect(TreeGridExporter.exportToTsv(refs.grid)).toContain('Carry Case');
  });

  it('exportToJson returns valid JSON', () => {
    expect(() => JSON.parse(TreeGridExporter.exportToJson(refs.grid))).not.toThrow();
  });

  it('exportToJson output contains product data', () => {
    const obj = JSON.parse(TreeGridExporter.exportToJson(refs.grid));
    expect(JSON.stringify(obj)).toContain('Laptop Pro');
  });

  it('exportToXlsx returns an ArrayBuffer', () => {
    expect(TreeGridExporter.exportToXlsx(refs.grid)).toBeInstanceOf(ArrayBuffer);
  });

  it('exportToCsv with includeHeaders:false omits header row', () => {
    const csv = TreeGridExporter.exportToCsv(refs.grid, { includeHeaders: false });
    expect(csv.split('\n')[0]).not.toContain('Name');
  });
});

// ── 4. ViewModel binding ─────────────────────────────────────────────────────
describe('ViewModel binding', () => {
  it('lastExportFormat starts empty', () => expect(refs.viewModel.getLastExportFormat()).toBe(''));
  it('exportCount starts at 0',       () => expect(refs.viewModel.getExportCount()).toBe(0));

  it('exportCsv sets lastExportFormat to "csv"', () => {
    refs.viewController.exportCsv(refs);
    expect(refs.viewModel.getLastExportFormat()).toBe('csv');
  });

  it('exportTsv sets lastExportFormat to "tsv"', () => {
    refs.viewController.exportTsv(refs);
    expect(refs.viewModel.getLastExportFormat()).toBe('tsv');
  });

  it('exportJson sets lastExportFormat to "json"', () => {
    refs.viewController.exportJson(refs);
    expect(refs.viewModel.getLastExportFormat()).toBe('json');
  });
});

// ── 5. ViewController ────────────────────────────────────────────────────────
describe('ViewController', () => {
  it('exportCsv increments exportCount to 1', () => {
    refs.viewController.exportCsv(refs);
    expect(refs.viewModel.getExportCount()).toBe(1);
  });

  it('three exports increment exportCount to 3', () => {
    refs.viewController.exportCsv(refs);
    refs.viewController.exportTsv(refs);
    refs.viewController.exportJson(refs);
    expect(refs.viewModel.getExportCount()).toBe(3);
  });

  it('exportCsv returns non-empty string', () => {
    expect(refs.viewController.exportCsv(refs).length).toBeGreaterThan(0);
  });

  it('exportJson returns parseable JSON', () => {
    expect(() => JSON.parse(refs.viewController.exportJson(refs))).not.toThrow();
  });

  it('csvBtn click increments exportCount', () => {
    refs.csvBtn.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.viewModel.getExportCount()).toBe(1);
  });
});

// ── 6. Data ──────────────────────────────────────────────────────────────────
describe('Product store', () => {
  it('makeProductStore returns 2 top-level nodes', () => {
    const s = makeProductStore();
    expect(s.getRootNode().childNodes.length).toBe(2);
  });

  it('Electronics has 3 children', () => {
    expect(refs.grid.getNodeById('electronics')!.childNodes.length).toBe(3);
  });

  it('Accessories has 2 children', () => {
    expect(refs.grid.getNodeById('accessories')!.childNodes.length).toBe(2);
  });

  it('laptop price is 1299', () => {
    expect(refs.grid.getNodeById('laptop')!.get('price')).toBe(1299);
  });

  it('charger is a leaf node', () => {
    expect(refs.grid.getNodeById('charger')!.isLeaf()).toBe(true);
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
