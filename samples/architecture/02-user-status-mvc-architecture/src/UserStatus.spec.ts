/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

/**
 * architecture/02-user-status-mvc-architecture — UserStatus.spec.ts
 *
 * TDD test suite for the User Status MVC sample.
 * Tests cover:
 *
 *  1.  UserModel            — fields, get/set, status values
 *  2.  Store                — loaded with seed data, getRange, indexOf
 *  3.  View structure       — Panel, ListView, Button rendered
 *  4.  Controller identity  — extends Controller, has correct id pattern
 *  5.  Controller wiring    — init() registers control() listeners
 *  6.  Item selection       — itemclick sets _selectedRecord, enables button
 *  7.  Toggle status        — Active → Inactive → Active round-trip
 *  8.  Row re-highlighting  — data-rowindex row gets x-selected after toggle
 *  9.  No selection guard   — toggle with nothing selected is a no-op
 * 10.  Destroy cleanup      — controller.destroy() releases view reference
 * 11.  Multiple users       — switching selection updates _selectedRecord
 * 12.  Application guard    — UserStatusApp is Application subclass
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { createUserStatusApp, UserStatusApp } from './app.js';
import type { UserStatusAppRefs } from './app.js';
import { Application } from '@framesquared/app';
import { Controller } from '@framesquared/component';

// ---------------------------------------------------------------------------
// Polyfills for jsdom
// ---------------------------------------------------------------------------

beforeAll(() => {
  if (!('ResizeObserver' in globalThis)) {
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

function simulateItemClick(refs: UserStatusAppRefs, rowIndex: number): void {
  const listView = refs.userList;
  // Trigger via the internal store-based itemclick event the controller listens to
  const record = refs.store.getRange()[rowIndex];
  const tr = listView.el?.querySelector(`[data-rowindex="${rowIndex}"]`) as HTMLTableRowElement | null;
  if (!tr) throw new Error(`No row at index ${rowIndex}`);
  listView.fire('itemclick', listView, record, tr, rowIndex, new MouseEvent('click'));
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('User Status MVC', () => {
  let host: HTMLDivElement;
  let refs: UserStatusAppRefs;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    refs = createUserStatusApp(host);
  });

  afterEach(() => {
    refs.controller.destroy();
    refs.rootPanel.destroy();
    host.remove();
  });

  // -------------------------------------------------------------------------
  // 1. UserModel
  // -------------------------------------------------------------------------

  describe('UserModel', () => {
    it('records have id, name, department, status fields', () => {
      const record = refs.store.getRange()[0];
      expect(record.get('id')).toBe('1');
      expect(record.get('name')).toBe('Alice Chen');
      expect(record.get('department')).toBe('Engineering');
      expect(record.get('status')).toBe('Active');
    });

    it('record.set() updates a field value', () => {
      const record = refs.store.getRange()[0];
      record.set('status', 'Inactive');
      expect(record.get('status')).toBe('Inactive');
    });

    it('status field accepts both Active and Inactive', () => {
      const record = refs.store.getRange()[0];
      record.set('status', 'Active');
      expect(record.get('status')).toBe('Active');
      record.set('status', 'Inactive');
      expect(record.get('status')).toBe('Inactive');
    });
  });

  // -------------------------------------------------------------------------
  // 2. Store
  // -------------------------------------------------------------------------

  describe('Store', () => {
    it('loads 5 seed records', () => {
      expect(refs.store.getCount()).toBe(5);
    });

    it('getRange() returns all records', () => {
      expect(refs.store.getRange().length).toBe(5);
    });

    it('indexOf(record) returns correct 0-based index', () => {
      const records = refs.store.getRange();
      expect(refs.store.indexOf(records[0])).toBe(0);
      expect(refs.store.indexOf(records[4])).toBe(4);
    });

    it('initially has 3 Active and 2 Inactive users', () => {
      const records = refs.store.getRange();
      const active   = records.filter(r => r.get('status') === 'Active').length;
      const inactive = records.filter(r => r.get('status') === 'Inactive').length;
      expect(active).toBe(3);
      expect(inactive).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // 3. View structure
  // -------------------------------------------------------------------------

  describe('View structure', () => {
    it('renders the root panel into host', () => {
      expect(host.querySelector('.x-panel')).not.toBeNull();
    });

    it('ListView is rendered', () => {
      expect(refs.userList.el).not.toBeNull();
    });

    it('Toggle Status button is rendered', () => {
      expect(refs.toggleBtn.el).not.toBeNull();
    });

    it('button starts disabled (no selection)', () => {
      expect(refs.toggleBtn.isDisabled()).toBe(true);
    });

    it('ListView renders one row per record', () => {
      const rows = refs.userList.el?.querySelectorAll('[data-rowindex]');
      expect(rows?.length).toBe(5);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Controller identity
  // -------------------------------------------------------------------------

  describe('Controller identity', () => {
    it('controller extends Controller base class', () => {
      expect(refs.controller).toBeInstanceOf(Controller);
    });

    it('controller has a stable id', () => {
      expect(typeof refs.controller.id).toBe('string');
      expect(refs.controller.id.length).toBeGreaterThan(0);
    });

    it('getView() returns the root panel after init()', () => {
      expect(refs.controller.getView()).toBe(refs.rootPanel);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Controller wiring — lookupReference()
  // -------------------------------------------------------------------------

  describe('Controller wiring', () => {
    it('lookupReference("userList") resolves the ListView', () => {
      const cmp = refs.controller.lookupReference('userList');
      expect(cmp).toBe(refs.userList);
    });

    it('lookupReference("toggleBtn") resolves the Button', () => {
      const cmp = refs.controller.lookupReference('toggleBtn');
      expect(cmp).toBe(refs.toggleBtn);
    });

    it('lookupReference("unknown") returns undefined', () => {
      expect(refs.controller.lookupReference('unknown')).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // 6. Item selection
  // -------------------------------------------------------------------------

  describe('Item selection', () => {
    it('getSelectedRecord() is null before any click', () => {
      expect(refs.controller.getSelectedRecord()).toBeNull();
    });

    it('clicking a row sets selectedRecord', () => {
      simulateItemClick(refs, 0);
      expect(refs.controller.getSelectedRecord()).toBe(refs.store.getRange()[0]);
    });

    it('clicking a row enables the Toggle Status button', () => {
      simulateItemClick(refs, 0);
      expect(refs.toggleBtn.isDisabled()).toBe(false);
    });

    it('clicked row gets x-selected class', () => {
      simulateItemClick(refs, 1);
      const row = refs.userList.el?.querySelector('[data-rowindex="1"]');
      expect(row?.classList.contains('x-selected')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 7. Toggle status
  // -------------------------------------------------------------------------

  describe('Toggle status', () => {
    it('toggles Active → Inactive', () => {
      simulateItemClick(refs, 0); // Alice: Active
      refs.toggleBtn.fire('click', refs.toggleBtn);
      expect(refs.store.getRange()[0].get('status')).toBe('Inactive');
    });

    it('toggles Inactive → Active', () => {
      simulateItemClick(refs, 2); // Carol: Inactive
      refs.toggleBtn.fire('click', refs.toggleBtn);
      expect(refs.store.getRange()[2].get('status')).toBe('Active');
    });

    it('round-trip: Active → Inactive → Active', () => {
      simulateItemClick(refs, 0);
      refs.toggleBtn.fire('click', refs.toggleBtn);
      expect(refs.store.getRange()[0].get('status')).toBe('Inactive');
      refs.toggleBtn.fire('click', refs.toggleBtn);
      expect(refs.store.getRange()[0].get('status')).toBe('Active');
    });

    it('refresh() is called — ListView reflects updated status text', () => {
      simulateItemClick(refs, 0);
      refs.toggleBtn.fire('click', refs.toggleBtn);
      const rows = refs.userList.el?.querySelectorAll('[data-rowindex]');
      // After refresh, first row should contain 'Inactive'
      expect(rows?.[0]?.textContent).toContain('Inactive');
    });
  });

  // -------------------------------------------------------------------------
  // 8. Row re-highlighting after refresh
  // -------------------------------------------------------------------------

  describe('Row re-highlighting', () => {
    it('selected row still has x-selected after toggle', () => {
      simulateItemClick(refs, 0);
      refs.toggleBtn.fire('click', refs.toggleBtn);
      const row = refs.userList.el?.querySelector('[data-rowindex="0"]');
      expect(row?.classList.contains('x-selected')).toBe(true);
    });

    it('previously unselected rows do not gain x-selected', () => {
      simulateItemClick(refs, 0);
      refs.toggleBtn.fire('click', refs.toggleBtn);
      const row1 = refs.userList.el?.querySelector('[data-rowindex="1"]');
      expect(row1?.classList.contains('x-selected')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 9. No-selection guard
  // -------------------------------------------------------------------------

  describe('No-selection guard', () => {
    it('toggle with no selection does not throw', () => {
      expect(() => {
        refs.toggleBtn.fire('click', refs.toggleBtn);
      }).not.toThrow();
    });

    it('toggle with no selection does not mutate any record', () => {
      const statuses = refs.store.getRange().map(r => r.get('status'));
      refs.toggleBtn.fire('click', refs.toggleBtn);
      const statusesAfter = refs.store.getRange().map(r => r.get('status'));
      expect(statusesAfter).toEqual(statuses);
    });
  });

  // -------------------------------------------------------------------------
  // 10. Destroy cleanup
  // -------------------------------------------------------------------------

  describe('Destroy cleanup', () => {
    it('getView() returns null after destroy()', () => {
      refs.controller.destroy();
      expect(refs.controller.getView()).toBeNull();
    });

    it('destroy() can be called multiple times without throwing', () => {
      expect(() => {
        refs.controller.destroy();
        refs.controller.destroy();
      }).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // 11. Multiple users / switching selection
  // -------------------------------------------------------------------------

  describe('Multiple users', () => {
    it('clicking a second row updates _selectedRecord', () => {
      simulateItemClick(refs, 0);
      simulateItemClick(refs, 3);
      expect(refs.controller.getSelectedRecord()).toBe(refs.store.getRange()[3]);
    });

    it('only the most-recently-clicked row has x-selected', () => {
      simulateItemClick(refs, 0);
      simulateItemClick(refs, 2);
      const row0 = refs.userList.el?.querySelector('[data-rowindex="0"]');
      const row2 = refs.userList.el?.querySelector('[data-rowindex="2"]');
      expect(row0?.classList.contains('x-selected')).toBe(false);
      expect(row2?.classList.contains('x-selected')).toBe(true);
    });

    it('toggling different users affects each independently', () => {
      simulateItemClick(refs, 0); // Active
      refs.toggleBtn.fire('click', refs.toggleBtn);
      simulateItemClick(refs, 1); // Active
      refs.toggleBtn.fire('click', refs.toggleBtn);
      expect(refs.store.getRange()[0].get('status')).toBe('Inactive');
      expect(refs.store.getRange()[1].get('status')).toBe('Inactive');
    });
  });

  // -------------------------------------------------------------------------
  // 12. Application guard
  // -------------------------------------------------------------------------

  describe('Application guard', () => {
    it('UserStatusApp is a subclass of Application', () => {
      const app = new UserStatusApp({ name: 'test-user-status' });
      expect(app).toBeInstanceOf(Application);
      Application.clearInstance();
    });

    it('getRefs() returns null before start()', () => {
      const app = new UserStatusApp({ name: 'test-user-status-2' });
      expect(app.getRefs()).toBeNull();
      Application.clearInstance();
    });
  });
});
