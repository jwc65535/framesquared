/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * 03-cell-editing-treegrid — MainView.spec.ts
 *
 * Coverage:
 *   1. View structure     — TreeGrid, Store, Plugin, ViewModel, ViewController
 *   2. Plugin lifecycle   — init, isEditing, startEdit, completeEdit, cancelEdit
 *   3. Column editors     — columns carry editor configs
 *   4. ViewModel binding  — editing/editCount updated via ViewController patches
 *   5. Data              — FileSystem store shape
 *   6. Application guard
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { TreeGrid, TreeGridCellEditing } from '@framesquared/ui';
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
  it('grid is TreeGrid',                  () => expect(refs.grid).toBeInstanceOf(TreeGrid));
  it('store is TreeStore',                () => expect(refs.store).toBeInstanceOf(TreeStore));
  it('plugin is TreeGridCellEditing',     () => expect(refs.plugin).toBeInstanceOf(TreeGridCellEditing));
  it('viewModel is MainViewModel',        () => expect(refs.viewModel).toBeInstanceOf(MainViewModel));
  it('viewController is MainViewController', () => expect(refs.viewController).toBeInstanceOf(MainViewController));
  it('grid renders inside host',          () => expect(host.contains(refs.grid.el)).toBe(true));
  it('3 column headers rendered',         () => {
    expect(refs.grid.el!.querySelectorAll('th.x-treegrid-column-header').length).toBe(3);
  });
});

// ── 2. Plugin lifecycle ──────────────────────────────────────────────────────
describe('Plugin lifecycle', () => {
  it('plugin is not editing initially',   () => expect(refs.plugin.isEditing()).toBe(false));

  it('startEdit on a leaf sets isEditing=true', () => {
    const resume = refs.grid.getNodeById('resume')!;
    refs.plugin.startEdit(resume, 'text');
    expect(refs.plugin.isEditing()).toBe(true);
  });

  it('cancelEdit clears isEditing', () => {
    refs.plugin.startEdit(refs.grid.getNodeById('resume')!, 'text');
    refs.plugin.cancelEdit();
    expect(refs.plugin.isEditing()).toBe(false);
  });

  it('completeEdit clears isEditing', () => {
    refs.plugin.startEdit(refs.grid.getNodeById('resume')!, 'text');
    refs.plugin.completeEdit();
    expect(refs.plugin.isEditing()).toBe(false);
  });

  it('startEdit on size column works', () => {
    const resume = refs.grid.getNodeById('resume')!;
    refs.plugin.startEdit(resume, 'size');
    expect(refs.plugin.isEditing()).toBe(true);
    refs.plugin.cancelEdit();
  });

  it('startEdit inserts an editor element into the row', () => {
    const resume = refs.grid.getNodeById('resume')!;
    refs.plugin.startEdit(resume, 'text');
    const editorEl = refs.grid.el!.querySelector('.x-treegrid-cell-editor');
    expect(editorEl).toBeTruthy();
    refs.plugin.cancelEdit();
  });
});

// ── 3. Column editors ────────────────────────────────────────────────────────
describe('Column editors', () => {
  it('first column has an editor config', () => {
    const cols = refs.grid.getColumns();
    expect((cols[0] as any).editor).toBeDefined();
  });

  it('second column editor xtype is combobox', () => {
    const cols = refs.grid.getColumns();
    expect((cols[1] as any).editor?.xtype).toBe('combobox');
  });

  it('third column editor xtype is numberfield', () => {
    const cols = refs.grid.getColumns();
    expect((cols[2] as any).editor?.xtype).toBe('numberfield');
  });
});

// ── 4. ViewModel binding ─────────────────────────────────────────────────────
describe('ViewModel binding', () => {
  it('editing starts as false',          () => expect(refs.viewModel.isEditing()).toBe(false));
  it('editCount starts at 0',            () => expect(refs.viewModel.getEditCount()).toBe(0));

  it('startEdit updates viewModel.editing to true', () => {
    refs.plugin.startEdit(refs.grid.getNodeById('resume')!, 'text');
    expect(refs.viewModel.isEditing()).toBe(true);
    refs.plugin.cancelEdit();
  });

  it('lastEditedField updated on startEdit', () => {
    refs.plugin.startEdit(refs.grid.getNodeById('resume')!, 'size');
    expect(refs.viewModel.getLastField()).toBe('size');
    refs.plugin.cancelEdit();
  });

  it('completeEdit increments editCount', () => {
    refs.plugin.startEdit(refs.grid.getNodeById('resume')!, 'text');
    refs.plugin.completeEdit();
    expect(refs.viewModel.getEditCount()).toBe(1);
  });
});

// ── 5. Data ──────────────────────────────────────────────────────────────────
describe('FileSystem store', () => {
  it('makeFileSystemStore creates root with 2 children', () => {
    const s = makeFileSystemStore();
    expect(s.getRootNode().childNodes.length).toBe(2);
  });
  it('Documents has 3 children', () => {
    expect(refs.grid.getNodeById('docs')!.childNodes.length).toBe(3);
  });
  it('Resume.pdf size is 128', () => {
    expect(refs.grid.getNodeById('resume')!.get('size')).toBe(128);
  });
  it('Website.psd is at depth 3', () => {
    expect(refs.grid.getNodeById('website')!.depth).toBe(3);
  });
});

// ── 6. Application guard ─────────────────────────────────────────────────────
describe('Application guard', () => {
  it('module import does not throw',       () => expect(true).toBe(true));
  it('createMainView is standalone', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    let r: MainViewRefs | undefined;
    expect(() => { r = createMainView(div); }).not.toThrow();
    expect(r!.store.getRootNode().childNodes.length).toBe(2);
    div.parentNode?.removeChild(div);
  });
});
