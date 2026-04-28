/* eslint-disable @typescript-eslint/no-explicit-any */

import { Controller } from '@framesquared/component';
import type { Container } from '@framesquared/component';
import type { Store, Model } from '@framesquared/data';
import type { ListView, Button } from '@framesquared/ui';

export class UserStatusController extends Controller {
  private _store: Store;
  private _selectedRecord: Model | null = null;

  constructor(store: Store) {
    super();
    this._store = store;
  }

  override init(view: Container): void {
    super.init(view);
    this.control('userList',  { itemclick: this._onItemClick   });
    this.control('toggleBtn', { click:     this._onToggleStatus });

    // Apply status dot attributes to all rows on initial render
    const userList = this.lookupReference('userList') as ListView | undefined;
    if (userList) this._applyStatusStyles(userList);
  }

  getSelectedRecord(): Model | null {
    return this._selectedRecord;
  }

  // Sets data-status on each row <tr> so CSS can render the status dot.
  // Must be called after every render/refresh because ListView rebuilds the DOM.
  private _applyStatusStyles(userList: ListView): void {
    if (!userList.el) return;
    const records = this._store.getRange();
    for (let i = 0; i < records.length; i++) {
      const row = userList.el.querySelector(`[data-rowindex="${i}"]`);
      if (row) {
        row.setAttribute('data-status', records[i].get('status') as string);
      }
    }
  }

  // Updates the toggle button label to describe the action it will perform.
  private _updateButtonText(): void {
    const toggleBtn = this.lookupReference('toggleBtn') as Button | undefined;
    if (!toggleBtn || !this._selectedRecord) return;
    const status = this._selectedRecord.get('status') as string;
    toggleBtn.setText(status === 'Active' ? 'Set Inactive' : 'Set Active');
  }

  private _onItemClick(
    _listView: ListView,
    record: Model,
    row: HTMLTableRowElement,
  ): void {
    const userList = this.lookupReference('userList') as ListView | undefined;
    if (userList?.el) {
      userList.el
        .querySelectorAll('.x-selected')
        .forEach((el) => el.classList.remove('x-selected'));
    }

    this._selectedRecord = record;
    row.classList.add('x-selected');

    const toggleBtn = this.lookupReference('toggleBtn') as Button | undefined;
    toggleBtn?.enable();

    this._updateButtonText();
  }

  private _onToggleStatus(): void {
    if (!this._selectedRecord) return;

    const current = this._selectedRecord.get('status') as string;
    this._selectedRecord.set('status', current === 'Active' ? 'Inactive' : 'Active');

    const userList = this.lookupReference('userList') as ListView | undefined;
    if (!userList) return;

    const idx = this._store.indexOf(this._selectedRecord);
    userList.refresh();

    this._applyStatusStyles(userList);

    // Re-apply selection highlight after DOM rebuild
    if (idx >= 0 && userList.el) {
      const row = userList.el.querySelector(`[data-rowindex="${idx}"]`);
      row?.classList.add('x-selected');
    }

    this._updateButtonText();
  }
}
