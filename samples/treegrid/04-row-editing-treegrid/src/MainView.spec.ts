/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * 04-row-editing-treegrid — MainView.spec.ts
 *
 * Coverage:
 *   1. View structure    — TreeGrid, Store, Plugin, ViewModel, ViewController
 *   2. Plugin lifecycle  — isEditing, startEdit inserts editor row, cancel/complete
 *   3. Editor row DOM    — Save + Cancel buttons rendered, input fields present
 *   4. ViewModel binding — editing/saveCount/cancelCount updated via ViewController
 *   5. Data              — OrgChart store shape
 *   6. Application guard
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { TreeGrid, TreeGridRowEditing } from '@framesquared/ui';
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
  it('grid is TreeGrid',               () => expect(refs.grid).toBeInstanceOf(TreeGrid));
  it('store is TreeStore',             () => expect(refs.store).toBeInstanceOf(TreeStore));
  it('plugin is TreeGridRowEditing',   () => expect(refs.plugin).toBeInstanceOf(TreeGridRowEditing));
  it('viewModel is MainViewModel',     () => expect(refs.viewModel).toBeInstanceOf(MainViewModel));
  it('viewController is MainViewController', () => expect(refs.viewController).toBeInstanceOf(MainViewController));
  it('grid renders inside host',       () => expect(host.contains(refs.grid.el)).toBe(true));
  it('3 column headers rendered',      () => {
    expect(refs.grid.el!.querySelectorAll('th.x-treegrid-column-header').length).toBe(3);
  });
});

// ── 2. Plugin lifecycle ──────────────────────────────────────────────────────
describe('Plugin lifecycle', () => {
  it('not editing initially',         () => expect(refs.plugin.isEditing()).toBe(false));

  it('startEdit on alice sets isEditing', () => {
    refs.plugin.startEdit(refs.grid.getNodeById('alice')!);
    expect(refs.plugin.isEditing()).toBe(true);
  });

  it('cancelEdit clears isEditing',   () => {
    refs.plugin.startEdit(refs.grid.getNodeById('alice')!);
    refs.plugin.cancelEdit();
    expect(refs.plugin.isEditing()).toBe(false);
  });

  it('completeEdit clears isEditing', () => {
    refs.plugin.startEdit(refs.grid.getNodeById('alice')!);
    refs.plugin.completeEdit();
    expect(refs.plugin.isEditing()).toBe(false);
  });
});

// ── 3. Editor row DOM ────────────────────────────────────────────────────────
describe('Editor row DOM', () => {
  it('startEdit inserts a row-editor row', () => {
    refs.plugin.startEdit(refs.grid.getNodeById('alice')!);
    expect(refs.grid.el!.querySelector('.x-treegrid-row-editor')).toBeTruthy();
  });

  it('editor row contains input fields', () => {
    refs.plugin.startEdit(refs.grid.getNodeById('alice')!);
    const editorRow = refs.grid.el!.querySelector('.x-treegrid-row-editor')!;
    expect(editorRow.querySelectorAll('input').length).toBeGreaterThan(0);
  });

  it('editor row has a Save button', () => {
    refs.plugin.startEdit(refs.grid.getNodeById('alice')!);
    const editorRow = refs.grid.el!.querySelector('.x-treegrid-row-editor')!;
    const btns = Array.from(editorRow.querySelectorAll('button'));
    expect(btns.some((b) => b.textContent?.includes('Save'))).toBe(true);
  });

  it('editor row has a Cancel button', () => {
    refs.plugin.startEdit(refs.grid.getNodeById('alice')!);
    const editorRow = refs.grid.el!.querySelector('.x-treegrid-row-editor')!;
    const btns = Array.from(editorRow.querySelectorAll('button'));
    expect(btns.some((b) => b.textContent?.includes('Cancel'))).toBe(true);
  });

  it('cancelEdit removes the editor row', () => {
    refs.plugin.startEdit(refs.grid.getNodeById('alice')!);
    refs.plugin.cancelEdit();
    expect(refs.grid.el!.querySelector('.x-treegrid-row-editor')).toBeFalsy();
  });
});

// ── 4. ViewModel binding ─────────────────────────────────────────────────────
describe('ViewModel binding', () => {
  it('editing starts false',           () => expect(refs.viewModel.isEditing()).toBe(false));
  it('saveCount starts at 0',          () => expect(refs.viewModel.getSaveCount()).toBe(0));
  it('cancelCount starts at 0',        () => expect(refs.viewModel.getCancelCount()).toBe(0));

  it('startEdit sets viewModel editing=true', () => {
    refs.plugin.startEdit(refs.grid.getNodeById('alice')!);
    expect(refs.viewModel.isEditing()).toBe(true);
    refs.plugin.cancelEdit();
  });

  it('completeEdit increments saveCount', () => {
    refs.plugin.startEdit(refs.grid.getNodeById('alice')!);
    refs.plugin.completeEdit();
    expect(refs.viewModel.getSaveCount()).toBe(1);
  });

  it('cancelEdit increments cancelCount', () => {
    refs.plugin.startEdit(refs.grid.getNodeById('alice')!);
    refs.plugin.cancelEdit();
    expect(refs.viewModel.getCancelCount()).toBe(1);
  });
});

// ── 5. Data ──────────────────────────────────────────────────────────────────
describe('OrgChart store', () => {
  it('makeOrgChartStore has 2 top-level nodes',  () => {
    const s = makeOrgChartStore();
    expect(s.getRootNode().childNodes.length).toBe(2);
  });
  it('Engineering has 2 children',  () => expect(refs.grid.getNodeById('eng')!.childNodes.length).toBe(2));
  it('alice salary is 110000',       () => expect(refs.grid.getNodeById('alice')!.get('salary')).toBe(110000));
});

// ── 6. Application guard ─────────────────────────────────────────────────────
describe('Application guard', () => {
  it('module import does not throw',  () => expect(true).toBe(true));
  it('createMainView is standalone',  () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    let r: MainViewRefs | undefined;
    expect(() => { r = createMainView(div); }).not.toThrow();
    expect(r!.store.getRootNode().childNodes.length).toBe(2);
    div.parentNode?.removeChild(div);
  });
});
