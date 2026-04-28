/**
 * architecture/02-user-status-mvc-architecture — app.ts
 *
 * Demonstrates pure MVC using the framesquared Controller base class.
 * The controller wires component events via control() + lookupReference(),
 * exactly mirroring the classic Ext.app.Controller pattern.
 *
 * Architecture:
 *   UserModel                — data.Model subclass for user records
 *   createUserStatusView()   — pure factory; builds Panel + ListView + Button
 *   UserStatusController     — extends Controller; init() wires all events
 *   createUserStatusApp()    — composes store + view + controller; testable
 *   UserStatusApp            — Application subclass; wires factory into #app
 *
 * MVC notes:
 *   • Controller.control(ref, events) looks up a component by reference, then
 *     calls .on() for each event — no MVVM, no ViewModels, no data binding.
 *   • Model.set() does NOT fire a Store datachanged event; the controller
 *     calls listView.refresh() manually after mutating the record.
 *   • Row re-highlighting after refresh uses data-rowindex attributes.
 */

import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { ModernTheme } from '@framesquared/theme';
import { Store } from '@framesquared/data';
import { UserModel } from './UserModel.js';
import { createUserStatusView } from './UserStatusView.js';
import { UserStatusController } from './UserStatusController.js';
import type { UserStatusViewRefs } from './UserStatusView.js';

// ---------------------------------------------------------------------------
// App refs
// ---------------------------------------------------------------------------

export interface UserStatusAppRefs extends UserStatusViewRefs {
  store: Store;
  controller: UserStatusController;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createUserStatusApp(host: HTMLElement): UserStatusAppRefs {
  const store = new Store({
    model: UserModel,
    data: [
      { id: '1', name: 'Alice Chen',    department: 'Engineering', status: 'Active'   },
      { id: '2', name: 'Bob Rivera',    department: 'Design',      status: 'Active'   },
      { id: '3', name: 'Carol Smith',   department: 'Marketing',   status: 'Inactive' },
      { id: '4', name: 'David Park',    department: 'Engineering', status: 'Active'   },
      { id: '5', name: 'Eva Johansson', department: 'HR',          status: 'Inactive' },
    ],
  });

  const viewRefs = createUserStatusView(host, store);

  const controller = new UserStatusController(store);
  controller.init(viewRefs.rootPanel);

  return { ...viewRefs, store, controller };
}

// ---------------------------------------------------------------------------
// Application
// ---------------------------------------------------------------------------

export class UserStatusApp extends Application {
  private _refs: UserStatusAppRefs | null = null;

  override launch(): void {
    const host = document.getElementById('app');
    if (!host) return;
    this._refs = createUserStatusApp(host);
  }

  getRefs(): UserStatusAppRefs | null {
    return this._refs;
  }
}

// ---------------------------------------------------------------------------
// Auto-start (suppressed in test mode)
// ---------------------------------------------------------------------------

if (import.meta.env.MODE !== 'test') {
  new UserStatusApp({
    name: 'UserStatusMVC',
    theme: ModernTheme,
  }).start();
}
