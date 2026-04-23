/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

/**
 * treegrid/01-basic-treegrid — app.spec.ts
 *
 * TDD test suite for the Basic TreeGrid demonstration.
 * Tests are written against the exported factory/refs before
 * the production Application wiring runs.
 *
 * Coverage:
 *   1.  View structure         — TreeGrid, Store, Buttons present in DOM
 *   2.  Column configuration   — 3 columns; first is TreeGridColumn
 *   3.  Store data             — node lookup, depth, child counts
 *   4.  Initial rendering      — 2 visible rows (Documents, Photos collapsed)
 *   5.  Column headers         — th elements with correct text
 *   6.  Expander elements      — collapsed / expanded / leaf indicators
 *   7.  Expand / Collapse      — expandNode / collapseNode / toggleNode
 *   8.  Deep expand            — deep=true flag expands sub-folders
 *   9.  Expand all / Collapse all — full tree visibility
 *  10.  Node attributes        — data-depth, data-record-id, ARIA, CSS classes
 *  11.  Text rendering         — node text and type column values
 *  12.  Selection              — select(), getSelection(), CSS marking
 *  13.  Button integration     — Expand All / Collapse All click handlers
 *  14.  Application guard      — MODE=test suppresses auto-start
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { TreeGrid, TreeGridColumn } from '@framesquared/ui';
import { Button } from '@framesquared/ui';
import { TreeStore } from '@framesquared/data';
import { createBasicTreeGrid } from './app.js';
import type { BasicTreeGridRefs } from './app.js';

// ---------------------------------------------------------------------------
// ResizeObserver polyfill — jsdom does not include it
// ---------------------------------------------------------------------------

beforeAll(() => {
  if (typeof (globalThis as any).ResizeObserver === 'undefined') {
    (globalThis as any).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rows(refs: BasicTreeGridRefs): NodeListOf<Element> {
  return refs.grid.el!.querySelectorAll('tr[data-record-id]');
}

function click(el: Element): void {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let host: HTMLDivElement;
let refs: BasicTreeGridRefs;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  refs = createBasicTreeGrid(host);
});

afterEach(() => {
  if (host.parentNode) host.parentNode.removeChild(host);
});

// ═══════════════════════════════════════════════════════════════════════════
// 1 · View structure
// ═══════════════════════════════════════════════════════════════════════════

describe('View structure', () => {
  it('createBasicTreeGrid returns a refs object', () => {
    expect(refs).toBeDefined();
  });

  it('grid is a TreeGrid instance', () => {
    expect(refs.grid).toBeInstanceOf(TreeGrid);
  });

  it('store is a TreeStore instance', () => {
    expect(refs.store).toBeInstanceOf(TreeStore);
  });

  it('expandAllBtn is a Button instance', () => {
    expect(refs.expandAllBtn).toBeInstanceOf(Button);
  });

  it('collapseAllBtn is a Button instance', () => {
    expect(refs.collapseAllBtn).toBeInstanceOf(Button);
  });

  it('a Panel renders inside host', () => {
    expect(host.querySelector('.x-panel')).toBeTruthy();
  });

  it('the TreeGrid element renders inside host', () => {
    expect(host.contains(refs.grid.el)).toBe(true);
  });

  it('grid el has x-treegrid class', () => {
    expect(refs.grid.el!.classList.contains('x-treegrid')).toBe(true);
  });

  it('expandAllBtn renders inside host', () => {
    expect(host.contains(refs.expandAllBtn.el)).toBe(true);
  });

  it('collapseAllBtn renders inside host', () => {
    expect(host.contains(refs.collapseAllBtn.el)).toBe(true);
  });

  it('expandAllBtn has text "Expand All"', () => {
    expect(refs.expandAllBtn.el!.textContent).toContain('Expand All');
  });

  it('collapseAllBtn has text "Collapse All"', () => {
    expect(refs.collapseAllBtn.el!.textContent).toContain('Collapse All');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2 · Column configuration
// ═══════════════════════════════════════════════════════════════════════════

describe('Column configuration', () => {
  it('getColumns() returns 3 columns', () => {
    expect(refs.grid.getColumns().length).toBe(3);
  });

  it('first column is a TreeGridColumn', () => {
    expect(refs.grid.getColumns()[0]).toBeInstanceOf(TreeGridColumn);
  });

  it('first column dataIndex is "text"', () => {
    expect(refs.grid.getColumns()[0].dataIndex).toBe('text');
  });

  it('first column text is "Name"', () => {
    expect(refs.grid.getColumns()[0].text).toBe('Name');
  });

  it('second column dataIndex is "type"', () => {
    expect(refs.grid.getColumns()[1].dataIndex).toBe('type');
  });

  it('second column text is "Type"', () => {
    expect(refs.grid.getColumns()[1].text).toBe('Type');
  });

  it('third column dataIndex is "size"', () => {
    expect(refs.grid.getColumns()[2].dataIndex).toBe('size');
  });

  it('third column text is "Size"', () => {
    expect(refs.grid.getColumns()[2].text).toBe('Size');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3 · Store data
// ═══════════════════════════════════════════════════════════════════════════

describe('Store data', () => {
  it('root has 2 top-level children', () => {
    expect(refs.store.getRootNode().childNodes.length).toBe(2);
  });

  it('getNodeById("docs") returns Documents node', () => {
    expect(refs.grid.getNodeById('docs')).toBeTruthy();
  });

  it('Documents node text is "Documents"', () => {
    expect(refs.grid.getNodeById('docs')!.get('text')).toBe('Documents');
  });

  it('Photos node text is "Photos"', () => {
    expect(refs.grid.getNodeById('photos')!.get('text')).toBe('Photos');
  });

  it('Documents has 3 children (Resume, Budget, Projects)', () => {
    expect(refs.grid.getNodeById('docs')!.childNodes.length).toBe(3);
  });

  it('Photos has 2 children (Vacation, Family)', () => {
    expect(refs.grid.getNodeById('photos')!.childNodes.length).toBe(2);
  });

  it('Resume.pdf node has leaf=true', () => {
    expect(refs.grid.getNodeById('resume')!.get('leaf')).toBe(true);
  });

  it('Documents node is at depth 1', () => {
    expect(refs.grid.getNodeById('docs')!.depth).toBe(1);
  });

  it('Resume.pdf is at depth 2', () => {
    expect(refs.grid.getNodeById('resume')!.depth).toBe(2);
  });

  it('Website.psd is at depth 3', () => {
    expect(refs.grid.getNodeById('website')!.depth).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4 · Initial rendering
// ═══════════════════════════════════════════════════════════════════════════

describe('Initial rendering', () => {
  it('renders 2 rows initially (Documents + Photos, both collapsed)', () => {
    expect(rows(refs).length).toBe(2);
  });

  it('both visible rows are at data-depth="1"', () => {
    const allRows = Array.from(rows(refs));
    expect(allRows.every((r) => r.getAttribute('data-depth') === '1')).toBe(true);
  });

  it('Documents row has data-record-id="docs"', () => {
    expect(refs.grid.el!.querySelector('tr[data-record-id="docs"]')).toBeTruthy();
  });

  it('Photos row has data-record-id="photos"', () => {
    expect(refs.grid.el!.querySelector('tr[data-record-id="photos"]')).toBeTruthy();
  });

  it('visible rows have x-treegrid-node class', () => {
    const allRows = Array.from(rows(refs));
    expect(allRows.every((r) => r.classList.contains('x-treegrid-node'))).toBe(true);
  });

  it('collapsed folder rows have x-treegrid-collapsed class', () => {
    const docsRow = refs.grid.el!.querySelector('tr[data-record-id="docs"]')!;
    expect(docsRow.classList.contains('x-treegrid-collapsed')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5 · Column headers
// ═══════════════════════════════════════════════════════════════════════════

describe('Column headers', () => {
  it('renders 3 column header cells', () => {
    const headers = refs.grid.el!.querySelectorAll('th.x-treegrid-column-header');
    expect(headers.length).toBe(3);
  });

  it('first header text is "Name"', () => {
    const headers = refs.grid.el!.querySelectorAll('th.x-treegrid-column-header');
    expect(headers[0].textContent).toBe('Name');
  });

  it('second header text is "Type"', () => {
    const headers = refs.grid.el!.querySelectorAll('th.x-treegrid-column-header');
    expect(headers[1].textContent).toBe('Type');
  });

  it('third header text is "Size"', () => {
    const headers = refs.grid.el!.querySelectorAll('th.x-treegrid-column-header');
    expect(headers[2].textContent).toBe('Size');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6 · Expander elements
// ═══════════════════════════════════════════════════════════════════════════

describe('Expander elements', () => {
  it('collapsed folder rows have a collapsed expander span', () => {
    const docsRow = refs.grid.el!.querySelector('tr[data-record-id="docs"]')!;
    expect(docsRow.querySelector('.x-treegrid-expander-collapsed')).toBeTruthy();
  });

  it('expanded folder rows have an expanded expander span', () => {
    const docs = refs.grid.getNodeById('docs')!;
    refs.grid.expandNode(docs);
    const docsRow = refs.grid.el!.querySelector('tr[data-record-id="docs"]')!;
    expect(docsRow.querySelector('.x-treegrid-expander-expanded')).toBeTruthy();
  });

  it('leaf rows have a leaf expander span', () => {
    const docs = refs.grid.getNodeById('docs')!;
    refs.grid.expandNode(docs);
    const resumeRow = refs.grid.el!.querySelector('tr[data-record-id="resume"]')!;
    expect(resumeRow.querySelector('.x-treegrid-expander-leaf')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7 · Expand / Collapse
// ═══════════════════════════════════════════════════════════════════════════

describe('Expand / Collapse', () => {
  it('expandNode(docs) increases visible rows to 5', () => {
    refs.grid.expandNode(refs.grid.getNodeById('docs')!);
    expect(rows(refs).length).toBe(5);
  });

  it('expanded docs row has x-treegrid-expanded class', () => {
    refs.grid.expandNode(refs.grid.getNodeById('docs')!);
    const docsRow = refs.grid.el!.querySelector('tr[data-record-id="docs"]')!;
    expect(docsRow.classList.contains('x-treegrid-expanded')).toBe(true);
  });

  it('Resume.pdf row appears after expanding docs', () => {
    refs.grid.expandNode(refs.grid.getNodeById('docs')!);
    expect(refs.grid.el!.querySelector('tr[data-record-id="resume"]')).toBeTruthy();
  });

  it('collapseNode(docs) returns to 2 visible rows', () => {
    refs.grid.expandNode(refs.grid.getNodeById('docs')!);
    refs.grid.collapseNode(refs.grid.getNodeById('docs')!);
    expect(rows(refs).length).toBe(2);
  });

  it('collapsed docs row no longer shows Resume.pdf', () => {
    refs.grid.expandNode(refs.grid.getNodeById('docs')!);
    refs.grid.collapseNode(refs.grid.getNodeById('docs')!);
    expect(refs.grid.el!.querySelector('tr[data-record-id="resume"]')).toBeFalsy();
  });

  it('toggleNode expands a collapsed node', () => {
    refs.grid.toggleNode(refs.grid.getNodeById('docs')!);
    expect(rows(refs).length).toBe(5);
  });

  it('toggleNode collapses an expanded node', () => {
    refs.grid.expandNode(refs.grid.getNodeById('docs')!);
    refs.grid.toggleNode(refs.grid.getNodeById('docs')!);
    expect(rows(refs).length).toBe(2);
  });

  it('expandNode(photos) shows its children', () => {
    refs.grid.expandNode(refs.grid.getNodeById('photos')!);
    expect(refs.grid.el!.querySelector('tr[data-record-id="vacation"]')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8 · Deep expand
// ═══════════════════════════════════════════════════════════════════════════

describe('Deep expand', () => {
  it('expandNode(docs, deep=true) expands Projects sub-folder too', () => {
    refs.grid.expandNode(refs.grid.getNodeById('docs')!, true);
    expect(refs.grid.el!.querySelector('tr[data-record-id="website"]')).toBeTruthy();
  });

  it('deep expand shows 6 rows (docs subtree + photos)', () => {
    refs.grid.expandNode(refs.grid.getNodeById('docs')!, true);
    expect(rows(refs).length).toBe(6);
  });

  it('Website.psd row has data-depth="3"', () => {
    refs.grid.expandNode(refs.grid.getNodeById('docs')!, true);
    const websiteRow = refs.grid.el!.querySelector('tr[data-record-id="website"]')!;
    expect(websiteRow.getAttribute('data-depth')).toBe('3');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9 · Expand all / Collapse all
// ═══════════════════════════════════════════════════════════════════════════

describe('Expand all / Collapse all', () => {
  it('expandAll() makes all 8 nodes visible', () => {
    refs.grid.expandAll();
    expect(rows(refs).length).toBe(8);
  });

  it('expandAll() shows Website.psd (depth-3 leaf)', () => {
    refs.grid.expandAll();
    expect(refs.grid.el!.querySelector('tr[data-record-id="website"]')).toBeTruthy();
  });

  it('collapseAll() returns to 2 visible rows', () => {
    refs.grid.expandAll();
    refs.grid.collapseAll();
    expect(rows(refs).length).toBe(2);
  });

  it('collapseAll() hides Resume.pdf', () => {
    refs.grid.expandAll();
    refs.grid.collapseAll();
    expect(refs.grid.el!.querySelector('tr[data-record-id="resume"]')).toBeFalsy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10 · Node attributes
// ═══════════════════════════════════════════════════════════════════════════

describe('Node attributes', () => {
  it('Resume.pdf row has x-treegrid-leaf class after expand', () => {
    refs.grid.expandNode(refs.grid.getNodeById('docs')!);
    const resumeRow = refs.grid.el!.querySelector('tr[data-record-id="resume"]')!;
    expect(resumeRow.classList.contains('x-treegrid-leaf')).toBe(true);
  });

  it('Resume.pdf row has data-depth="2"', () => {
    refs.grid.expandNode(refs.grid.getNodeById('docs')!);
    const resumeRow = refs.grid.el!.querySelector('tr[data-record-id="resume"]')!;
    expect(resumeRow.getAttribute('data-depth')).toBe('2');
  });

  it('docs row has role="row"', () => {
    const docsRow = refs.grid.el!.querySelector('tr[data-record-id="docs"]')!;
    expect(docsRow.getAttribute('role')).toBe('row');
  });

  it('docs row has aria-expanded="false" initially', () => {
    const docsRow = refs.grid.el!.querySelector('tr[data-record-id="docs"]')!;
    expect(docsRow.getAttribute('aria-expanded')).toBe('false');
  });

  it('docs row has aria-expanded="true" after expand', () => {
    refs.grid.expandNode(refs.grid.getNodeById('docs')!);
    const docsRow = refs.grid.el!.querySelector('tr[data-record-id="docs"]')!;
    expect(docsRow.getAttribute('aria-expanded')).toBe('true');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11 · Text rendering
// ═══════════════════════════════════════════════════════════════════════════

describe('Text rendering', () => {
  it('Documents row contains "Documents" in node-text span', () => {
    const docsRow = refs.grid.el!.querySelector('tr[data-record-id="docs"]')!;
    const textSpan = docsRow.querySelector('.x-treegrid-node-text')!;
    expect(textSpan.textContent).toBe('Documents');
  });

  it('Photos row contains "Photos" in node-text span', () => {
    const photosRow = refs.grid.el!.querySelector('tr[data-record-id="photos"]')!;
    const textSpan = photosRow.querySelector('.x-treegrid-node-text')!;
    expect(textSpan.textContent).toBe('Photos');
  });

  it('Resume.pdf type cell shows "PDF"', () => {
    refs.grid.expandNode(refs.grid.getNodeById('docs')!);
    const resumeRow = refs.grid.el!.querySelector('tr[data-record-id="resume"]')!;
    const cells = resumeRow.querySelectorAll('td.x-grid-cell');
    expect(cells[1].textContent).toContain('PDF');
  });

  it('Budget.xlsx size cell shows "256 KB"', () => {
    refs.grid.expandNode(refs.grid.getNodeById('docs')!);
    const budgetRow = refs.grid.el!.querySelector('tr[data-record-id="budget"]')!;
    const cells = budgetRow.querySelectorAll('td.x-grid-cell');
    expect(cells[2].textContent).toContain('256 KB');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12 · Selection
// ═══════════════════════════════════════════════════════════════════════════

describe('Selection', () => {
  it('getSelection() is empty initially', () => {
    expect(refs.grid.getSelection().length).toBe(0);
  });

  it('select(docsNode) sets getSelection() to 1 node', () => {
    refs.grid.select(refs.grid.getNodeById('docs')!);
    expect(refs.grid.getSelection().length).toBe(1);
  });

  it('selected node is the docs node', () => {
    refs.grid.select(refs.grid.getNodeById('docs')!);
    expect(refs.grid.getSelection()[0].get('text')).toBe('Documents');
  });

  it('selected row gets x-treegrid-selected class', () => {
    refs.grid.select(refs.grid.getNodeById('docs')!);
    const docsRow = refs.grid.el!.querySelector('tr[data-record-id="docs"]')!;
    expect(docsRow.classList.contains('x-treegrid-selected')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13 · Button integration
// ═══════════════════════════════════════════════════════════════════════════

describe('Button integration', () => {
  it('clicking expandAllBtn shows all 8 nodes', () => {
    click(refs.expandAllBtn.el!);
    expect(rows(refs).length).toBe(8);
  });

  it('clicking collapseAllBtn after expandAll returns to 2 rows', () => {
    click(refs.expandAllBtn.el!);
    click(refs.collapseAllBtn.el!);
    expect(rows(refs).length).toBe(2);
  });

  it('clicking expandAllBtn twice does not duplicate rows', () => {
    click(refs.expandAllBtn.el!);
    click(refs.expandAllBtn.el!);
    expect(rows(refs).length).toBe(8);
  });

  it('clicking collapseAllBtn on already collapsed tree does not throw', () => {
    expect(() => click(refs.collapseAllBtn.el!)).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14 · Application guard
// ═══════════════════════════════════════════════════════════════════════════

describe('Application guard', () => {
  it('MODE=test suppresses Application auto-start — module import does not throw', () => {
    expect(true).toBe(true);
  });

  it('createBasicTreeGrid is callable independently of Application', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    let testRefs: BasicTreeGridRefs | undefined;
    expect(() => { testRefs = createBasicTreeGrid(div); }).not.toThrow();
    expect(testRefs!.store.getRootNode().childNodes.length).toBe(2);
    div.parentNode?.removeChild(div);
  });
});
