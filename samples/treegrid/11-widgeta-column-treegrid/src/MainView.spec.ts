/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * 11-widgeta-column-treegrid — MainView.spec.ts
 *
 * Coverage:
 *   1. View structure    — 5 WidgetColumns, detail panel, ViewModel, ViewController
 *   2. Status column     — CycleButton renders, cycling updates status + detail panel
 *   3. Level column      — SegmentedButton renders, clicking a segment updates level
 *   4. Edit column       — Button renders with "Edit", click updates detail panel
 *   5. Contractor column — Checkbox renders, toggle updates contractor flag
 *   6. Score column      — Slider renders, changecomplete updates score
 *   7. ViewModel         — lastEvent, eventCount
 *   8. ViewController    — all five handlers
 *   9. Data              — OrgChart store shape with status / level / contractor / score fields
 *  10. Application guard
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { TreeGrid, WidgetColumn, Panel, CycleButton, SegmentedButton, Button } from '@framesquared/ui';
import { Checkbox, Slider } from '@framesquared/form';
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
  it('statusCol is WidgetColumn',            () => expect(refs.statusCol).toBeInstanceOf(WidgetColumn));
  it('levelCol is WidgetColumn',             () => expect(refs.levelCol).toBeInstanceOf(WidgetColumn));
  it('editCol is WidgetColumn',              () => expect(refs.editCol).toBeInstanceOf(WidgetColumn));
  it('contractorCol is WidgetColumn',        () => expect(refs.contractorCol).toBeInstanceOf(WidgetColumn));
  it('scoreCol is WidgetColumn',             () => expect(refs.scoreCol).toBeInstanceOf(WidgetColumn));
  it('detailPanel is Panel',                 () => expect(refs.detailPanel).toBeInstanceOf(Panel));
  it('viewModel is MainViewModel',           () => expect(refs.viewModel).toBeInstanceOf(MainViewModel));
  it('viewController is MainViewController', () => expect(refs.viewController).toBeInstanceOf(MainViewController));
  it('grid renders inside host',             () => expect(host.contains(refs.grid.el)).toBe(true));
  it('detailPanel renders inside host',      () => expect(host.contains(refs.detailPanel.el)).toBe(true));
  it('all 5 widget columns are in the grid columns list', () => {
    const cols = refs.grid.getColumns();
    expect(cols).toContain(refs.statusCol);
    expect(cols).toContain(refs.levelCol);
    expect(cols).toContain(refs.editCol);
    expect(cols).toContain(refs.contractorCol);
    expect(cols).toContain(refs.scoreCol);
  });
});

// ── 2. Status column (CycleButton) ───────────────────────────────────────────
describe('Status column — CycleButton', () => {
  it('isWidgetColumn flag is true', () => {
    expect(refs.statusCol.isWidgetColumn).toBe(true);
  });

  it('renders a CycleButton for alice', () => {
    expect(refs.statusCol.getWidget('alice')).toBeInstanceOf(CycleButton);
  });

  it('alice CycleButton starts on "Active"', () => {
    const btn = refs.statusCol.getWidget('alice') as CycleButton;
    expect(btn.getActiveItem().text).toBe('Active');
  });

  it('bob CycleButton starts on "Remote"', () => {
    const btn = refs.statusCol.getWidget('bob') as CycleButton;
    expect(btn.getActiveItem().text).toBe('Remote');
  });

  it('dave CycleButton starts on "On Leave"', () => {
    const btn = refs.statusCol.getWidget('dave') as CycleButton;
    expect(btn.getActiveItem().text).toBe('On Leave');
  });

  it('clicking the alice status button cycles to next status and updates detail panel', () => {
    const btn = refs.statusCol.getWidget('alice') as CycleButton;
    btn.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.detailPanel.el!.textContent).toContain('Alice');
    expect(refs.viewModel.getEventCount()).toBe(1);
  });

  it('cycling updates the node status field', () => {
    const alice = refs.grid.getNodeById('alice')!;
    const btn = refs.statusCol.getWidget('alice') as CycleButton;
    btn.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(alice.get('status')).not.toBe('Active');
  });
});

// ── 3. Level column (SegmentedButton) ────────────────────────────────────────
describe('Level column — SegmentedButton', () => {
  it('renders a SegmentedButton for alice', () => {
    expect(refs.levelCol.getWidget('alice')).toBeInstanceOf(SegmentedButton);
  });

  it('alice SegmentedButton has 3 segments (Jr / Sr / Lead)', () => {
    const seg = refs.levelCol.getWidget('alice') as SegmentedButton;
    expect(seg.getItems().length).toBe(3);
  });

  it('alice initial value is "Lead"', () => {
    const seg = refs.levelCol.getWidget('alice') as SegmentedButton;
    expect(seg.getValue()).toBe('Lead');
  });

  it('carol initial value is "Junior"', () => {
    const seg = refs.levelCol.getWidget('carol') as SegmentedButton;
    expect(seg.getValue()).toBe('Junior');
  });

  it('clicking Sr segment for carol updates detail panel', () => {
    const seg = refs.levelCol.getWidget('carol') as SegmentedButton;
    const srBtn = seg.getItems().find((b) => (b as Button).el?.textContent === 'Sr') as Button;
    srBtn?.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.detailPanel.el!.textContent).toContain('Carol');
    expect(refs.viewModel.getEventCount()).toBe(1);
  });

  it('clicking a segment updates the node level field', () => {
    const carol = refs.grid.getNodeById('carol')!;
    const seg = refs.levelCol.getWidget('carol') as SegmentedButton;
    const srBtn = seg.getItems().find((b) => (b as Button).el?.textContent === 'Sr') as Button;
    srBtn?.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(carol.get('level')).toBe('Senior');
  });
});

// ── 4. Edit column (Button) ──────────────────────────────────────────────────
describe('Edit column — Button', () => {
  it('renders a Button for alice', () => {
    expect(refs.editCol.getWidget('alice')).toBeInstanceOf(Button);
  });

  it('edit button text is "Edit"', () => {
    const btn = refs.editCol.getWidget('alice') as Button;
    expect(btn.el!.textContent).toContain('Edit');
  });

  it('clicking edit for bob updates detail panel', () => {
    const btn = refs.editCol.getWidget('bob') as Button;
    btn.el!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(refs.detailPanel.el!.textContent).toContain('Bob');
    expect(refs.viewModel.getEventCount()).toBe(1);
  });

  it('handleEdit sets lastEvent to "Editing <name>…"', () => {
    refs.viewController.handleEdit(refs, refs.grid.getNodeById('alice')!);
    expect(refs.viewModel.getLastEvent()).toContain('Editing Alice');
  });

  it('renderValue returns empty string', () => {
    expect(refs.editCol.renderValue(refs.grid.getNodeById('alice')!)).toBe('');
  });
});

// ── 5. Contractor column (Checkbox) ─────────────────────────────────────────
describe('Contractor column — Checkbox', () => {
  it('renders a Checkbox for alice', () => {
    expect(refs.contractorCol.getWidget('alice')).toBeInstanceOf(Checkbox);
  });

  it('alice checkbox starts unchecked (not a contractor)', () => {
    const cb = refs.contractorCol.getWidget('alice') as Checkbox;
    expect(cb.isChecked()).toBe(false);
  });

  it('bob checkbox starts checked (is a contractor)', () => {
    const cb = refs.contractorCol.getWidget('bob') as Checkbox;
    expect(cb.isChecked()).toBe(true);
  });

  it('dave checkbox starts checked (is a contractor)', () => {
    const cb = refs.contractorCol.getWidget('dave') as Checkbox;
    expect(cb.isChecked()).toBe(true);
  });

  it('toggling the alice checkbox updates the node contractor field', () => {
    const alice = refs.grid.getNodeById('alice')!;
    const cb = refs.contractorCol.getWidget('alice') as Checkbox;
    cb.setChecked(true);
    expect(alice.get('contractor')).toBe(true);
  });

  it('toggling updates the detail panel', () => {
    const cb = refs.contractorCol.getWidget('alice') as Checkbox;
    cb.setChecked(true);
    expect(refs.detailPanel.el!.textContent).toContain('Alice');
    expect(refs.viewModel.getEventCount()).toBe(1);
  });

  it('handleContractor logs "<name> contractor → true/false"', () => {
    refs.viewController.handleContractor(refs, refs.grid.getNodeById('carol')!, true);
    expect(refs.viewModel.getLastEvent()).toBe('Carol contractor → true');
  });
});

// ── 6. Score column (Slider) ─────────────────────────────────────────────────
describe('Score column — Slider', () => {
  it('renders a Slider for alice', () => {
    expect(refs.scoreCol.getWidget('alice')).toBeInstanceOf(Slider);
  });

  it('alice Slider starts at 90', () => {
    const sl = refs.scoreCol.getWidget('alice') as Slider;
    expect(sl.getValue()).toBe(90);
  });

  it('bob Slider starts at 75', () => {
    const sl = refs.scoreCol.getWidget('bob') as Slider;
    expect(sl.getValue()).toBe(75);
  });

  it('eve Slider starts at 55', () => {
    const sl = refs.scoreCol.getWidget('eve') as Slider;
    expect(sl.getValue()).toBe(55);
  });

  it('setValue updates the Slider value', () => {
    const sl = refs.scoreCol.getWidget('alice') as Slider;
    sl.setValue(65);
    expect(sl.getValue()).toBe(65);
  });

  it('handleScore updates the detail panel', () => {
    refs.viewController.handleScore(refs, refs.grid.getNodeById('alice')!, 85);
    expect(refs.detailPanel.el!.textContent).toContain('Alice');
    expect(refs.viewModel.getEventCount()).toBe(1);
  });

  it('handleScore logs "<name> score → <value>"', () => {
    refs.viewController.handleScore(refs, refs.grid.getNodeById('bob')!, 80);
    expect(refs.viewModel.getLastEvent()).toBe('Bob score → 80');
  });
});

// ── 7. ViewModel ─────────────────────────────────────────────────────────────
describe('ViewModel', () => {
  it('lastEvent starts empty',  () => expect(refs.viewModel.getLastEvent()).toBe(''));
  it('eventCount starts at 0',  () => expect(refs.viewModel.getEventCount()).toBe(0));

  it('eventCount increments on each handler call', () => {
    refs.viewController.handleEdit(refs,       refs.grid.getNodeById('alice')!);
    refs.viewController.handleContractor(refs, refs.grid.getNodeById('bob')!, false);
    expect(refs.viewModel.getEventCount()).toBe(2);
  });

  it('lastEvent reflects the most recent interaction', () => {
    refs.viewController.handleEdit(refs,  refs.grid.getNodeById('alice')!);
    refs.viewController.handleScore(refs, refs.grid.getNodeById('bob')!, 95);
    expect(refs.viewModel.getLastEvent()).toBe('Bob score → 95');
  });
});

// ── 8. ViewController ────────────────────────────────────────────────────────
describe('ViewController', () => {
  it('handleStatusChange logs "<name> status → <status>"', () => {
    refs.viewController.handleStatusChange(refs, refs.grid.getNodeById('alice')!, 'Remote');
    expect(refs.viewModel.getLastEvent()).toBe('Alice status → Remote');
  });

  it('handleLevelChange logs "<name> level → <level>"', () => {
    refs.viewController.handleLevelChange(refs, refs.grid.getNodeById('bob')!, 'Lead');
    expect(refs.viewModel.getLastEvent()).toBe('Bob level → Lead');
  });

  it('handleEdit logs "Editing <name>…"', () => {
    refs.viewController.handleEdit(refs, refs.grid.getNodeById('carol')!);
    expect(refs.viewModel.getLastEvent()).toContain('Editing Carol');
  });

  it('handleContractor logs "<name> contractor → true"', () => {
    refs.viewController.handleContractor(refs, refs.grid.getNodeById('dave')!, true);
    expect(refs.viewModel.getLastEvent()).toBe('Dave contractor → true');
  });

  it('handleContractor logs "<name> contractor → false"', () => {
    refs.viewController.handleContractor(refs, refs.grid.getNodeById('dave')!, false);
    expect(refs.viewModel.getLastEvent()).toBe('Dave contractor → false');
  });

  it('handleScore logs "<name> score → <value>"', () => {
    refs.viewController.handleScore(refs, refs.grid.getNodeById('eve')!, 70);
    expect(refs.viewModel.getLastEvent()).toBe('Eve score → 70');
  });

  it('detail panel reflects the last event message', () => {
    refs.viewController.handleEdit(refs, refs.grid.getNodeById('eve')!);
    expect(refs.detailPanel.el!.textContent).toContain('Eve');
  });
});

// ── 9. Data ──────────────────────────────────────────────────────────────────
describe('OrgChart store', () => {
  it('makeOrgChartStore returns 2 top-level nodes', () => {
    const s = makeOrgChartStore();
    expect(s.getRootNode().childNodes.length).toBe(2);
  });

  it('Engineering has 3 children', () => {
    expect(refs.grid.getNodeById('eng')!.childNodes.length).toBe(3);
  });

  it('alice status is "Active"',      () => expect(refs.grid.getNodeById('alice')!.get('status')).toBe('Active'));
  it('bob status is "Remote"',        () => expect(refs.grid.getNodeById('bob')!.get('status')).toBe('Remote'));
  it('dave status is "On Leave"',     () => expect(refs.grid.getNodeById('dave')!.get('status')).toBe('On Leave'));
  it('alice level is "Lead"',         () => expect(refs.grid.getNodeById('alice')!.get('level')).toBe('Lead'));
  it('carol level is "Junior"',       () => expect(refs.grid.getNodeById('carol')!.get('level')).toBe('Junior'));
  it('alice contractor is false',     () => expect(refs.grid.getNodeById('alice')!.get('contractor')).toBe(false));
  it('bob contractor is true',        () => expect(refs.grid.getNodeById('bob')!.get('contractor')).toBe(true));
  it('dave contractor is true',       () => expect(refs.grid.getNodeById('dave')!.get('contractor')).toBe(true));
  it('alice score is 90',             () => expect(refs.grid.getNodeById('alice')!.get('score')).toBe(90));
  it('eve score is 55',               () => expect(refs.grid.getNodeById('eve')!.get('score')).toBe(55));
  it('dave is a leaf node',           () => expect(refs.grid.getNodeById('dave')!.isLeaf()).toBe(true));
});

// ── 10. Application guard ─────────────────────────────────────────────────────
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
