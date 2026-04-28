import { Panel, Button, ListView, Toolbar } from '@framesquared/ui';
import type { Store } from '@framesquared/data';

export interface UserStatusViewRefs {
  rootPanel: Panel;
  userList: ListView;
  toggleBtn: Button;
}

export function createUserStatusView(host: HTMLElement, store: Store): UserStatusViewRefs {
  const userList = new ListView({
    reference: 'userList',
    store,
    columns: [
      { text: 'Name',       dataIndex: 'name',       width: 200 },
      { text: 'Department', dataIndex: 'department',  width: 160 },
      { text: 'Status',     dataIndex: 'status',      width: 110 },
    ],
    emptyText: 'No users found.',
  });

  const toggleBtn = new Button({
    reference: 'toggleBtn',
    text: 'Toggle Status',
    disabled: true,
  });

  // Bottom action bar as a regular item (not bbar) so lookupReference() can
  // find toggleBtn by recursing through _items → Toolbar._items.
  const actionBar = new Toolbar({
    cls: 'user-action-bar',
    items: ['Click a row to select a user', '->', toggleBtn],
  });

  const rootPanel = new Panel({
    renderTo: host,
    title: 'User Status Manager',
    bodyPadding: 0,
    bodyStyle: { gap: '0' },
    items: [userList, actionBar],
  });

  return { rootPanel, userList, toggleBtn };
}
