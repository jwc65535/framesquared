import '@framesquared/layout';
import { Panel, TabPanel, Viewport } from '@framesquared/ui';
import { Container } from '@framesquared/component';
import {
  FormPanel,
  TextField,
  NumberField,
  ComboBox,
  DisplayField,
  Checkbox,
} from '@framesquared/form';
import { Button } from '@framesquared/ui';

// ---------------------------------------------------------------------------
// Public interface — returned by createMainView(), consumed by tests and app
// ---------------------------------------------------------------------------

export interface TabDemoRefs {
  /** Top-positioned TabPanel with three content tabs */
  topTabPanel: TabPanel;
  /** Bottom-positioned TabPanel housing the event log and settings */
  bottomTabPanel: TabPanel;
  /** Tab 1 content — Panel with vbox layout */
  overviewPanel: Panel;
  /** Tab 2 content — FormPanel */
  userFormPanel: FormPanel;
  /** Tab 3 content — plain Container (closable) */
  dataContainer: Container;
  /** Event log field updated on every tabchange */
  eventLogField: DisplayField;
  /** Bottom Tab 2 — Settings panel (closable) */
  settingsPanel: Panel;
  /**
   * Mutable record of the most recent tabchange event, updated by the
   * topTabPanel 'tabchange' listener.  Tests read this to verify events fire.
   */
  lastEvent: { name: string; tabTitle: string };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createMainView(container?: Element): TabDemoRefs {
  // Mutable event record — shared between the listener closure and the return value
  const lastEvent = { name: '', tabTitle: '' };

  // ── Event log display (bottom tab 1) ──────────────────────────────────────
  const eventLogField = new DisplayField({
    name: 'eventLog',
    fieldLabel: 'Last Event',
    value: 'No tab change yet.',
  });

  // ── Top tab 1: Overview — Panel with vbox layout ─────────────────────────
  const overviewPanel = new Panel({
    title: 'Overview',
    iconCls: 'x-tab-icon-overview',
    header: false,
    layout: { type: 'vbox', align: 'stretch' },
    bodyPadding: 12,
    items: [
      new Button({ text: 'Dashboard',  ui: 'default' }),
      new Button({ text: 'Reports',    ui: 'default' }),
      new Button({ text: 'Analytics',  ui: 'default' }),
    ],
  });

  // ── Top tab 2: User Profile — FormPanel ──────────────────────────────────
  const userFormPanel = new FormPanel({
    title: 'User Profile',
    iconCls: 'x-tab-icon-profile',
    header: false,
    bodyPadding: 12,
    layout: { type: 'vbox', align: 'stretch' },
    items: [
      new TextField({
        name: 'firstName',
        fieldLabel: 'First Name',
        emptyText: 'Enter first name',
        allowBlank: false,
      }),
      new TextField({
        name: 'lastName',
        fieldLabel: 'Last Name',
        emptyText: 'Enter last name',
        allowBlank: false,
      }),
      new NumberField({
        name: 'age',
        fieldLabel: 'Age',
        minValue: 0,
        maxValue: 120,
      }),
      new ComboBox({
        name: 'role',
        fieldLabel: 'Role',
        store: ['Developer', 'Designer', 'Manager', 'QA Engineer'],
        emptyText: 'Select a role…',
      }),
    ],
  });

  // ── Top tab 3: Raw Data — Container (closable) ────────────────────────────
  // Container accepts arbitrary config keys via ComponentConfig's index signature
  const dataContainer = new Container({
    title: 'Raw Data',
    iconCls: 'x-tab-icon-data',
    closable: true,
    layout: { type: 'vbox', align: 'stretch' },
    items: [
      new Button({ text: 'Load Dataset A', ui: 'default' }),
      new Button({ text: 'Load Dataset B', ui: 'default' }),
      new Button({ text: 'Clear Cache',    ui: 'danger'   }),
    ],
  } as any);

  // ── Top TabPanel ──────────────────────────────────────────────────────────
  const topTabPanel = new TabPanel({
    tabPosition: 'top',
    activeTab: 0,
    flex: 1,
    border: false,
    items: [overviewPanel, userFormPanel, dataContainer],
  });

  // tabchange listener: update event record and event log field
  topTabPanel.on('tabchange', (_tp: unknown, newCard: any) => {
    const title: string = newCard?._config?.title ?? 'Unknown';
    lastEvent.name = 'tabchange';
    lastEvent.tabTitle = title;
    eventLogField.setValue(`tabchange → "${title}"`);
    console.log(`[TabPanel Demo] tabchange → "${title}"`);
  });

  // ── Bottom tab 1: Event Log ───────────────────────────────────────────────
  const eventLogPanel = new Panel({
    title: 'Event Log',
    header: false,
    bodyPadding: 12,
    layout: { type: 'vbox', align: 'stretch' },
    items: [eventLogField],
  });

  // ── Bottom tab 2: Settings — Panel (closable) ─────────────────────────────
  const settingsPanel = new Panel({
    title: 'Settings',
    iconCls: 'x-tab-icon-settings',
    closable: true,
    header: false,
    bodyPadding: 12,
    layout: { type: 'vbox', align: 'stretch' },
    items: [
      new Checkbox({
        name: 'notifications',
        fieldLabel: 'Notifications',
        boxLabel: 'Enable desktop notifications',
        checked: true,
      }),
      new Checkbox({
        name: 'darkMode',
        fieldLabel: 'Dark Mode',
        boxLabel: 'Use dark colour scheme',
      }),
    ],
  });

  // ── Bottom TabPanel ───────────────────────────────────────────────────────
  const bottomTabPanel = new TabPanel({
    tabPosition: 'bottom',
    activeTab: 0,
    height: 180,
    border: false,
    items: [eventLogPanel, settingsPanel],
  });

  // ── Wrapper — renders both TabPanels into the supplied container ──────────
  new Panel({
    border: false,
    layout: { type: 'vbox', align: 'stretch' },
    items: [topTabPanel, bottomTabPanel],
    ...(container ? { renderTo: container } : {}),
  });

  return {
    topTabPanel,
    bottomTabPanel,
    overviewPanel,
    userFormPanel,
    dataContainer,
    eventLogField,
    settingsPanel,
    lastEvent,
  };
}

// ---------------------------------------------------------------------------
// Viewport — used by App.ts for the live dev server
// ---------------------------------------------------------------------------

export function createViewport(): Viewport {
  const refs = createMainView();

  return new Viewport({
    layout: { type: 'vbox', align: 'stretch' },
    items: [
      new Panel({
        height: 52,
        border: false,
        title: 'framesquared — TabPanel Demo',
        bodyPadding: '12px 16px',
      }),
      new Panel({
        flex: 1,
        border: false,
        bodyPadding: 16,
        layout: { type: 'vbox', align: 'stretch' },
        items: [refs.topTabPanel, refs.bottomTabPanel],
      }),
    ],
  });
}
