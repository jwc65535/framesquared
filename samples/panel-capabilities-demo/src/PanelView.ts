import { Panel, Viewport, Toolbar, Button, ToolbarFill } from '@framesquared/ui';

// ---------------------------------------------------------------------------
// Public refs shape — exposed for testing and for the app launch handler
// ---------------------------------------------------------------------------

export interface DemoPanelRefs {
  mainPanel: Panel;
  tbar: Toolbar;
  bbar: Toolbar;
  leftPanel: Panel;
  rightPanel: Panel;
  addServiceBtn: Button;
  removeServiceBtn: Button;
  exportBtn: Button;
  statusBtn: Button;
  /** Live counter — read by tests to verify mutations */
  serviceCount: number;
  /** Programmatic refresh — mirrors the refresh tool handler */
  onRefresh: () => void;
}

// ---------------------------------------------------------------------------
// Factory — creates the demo panel and wires all interactivity.
// Accepts an optional container; when omitted a Viewport is built.
// ---------------------------------------------------------------------------

export function createDemoPanel(container?: Element): DemoPanelRefs {
  let serviceCount = 0;

  // -- Status button (bbar) -------------------------------------------------
  const statusBtn = new Button({
    text: 'Ready',
    ui: 'default',
    disabled: true,
    tooltip: 'Current operation status',
  });

  // -- Counter helper -------------------------------------------------------
  function updateStatus(msg: string): void {
    statusBtn.setText(msg);
  }

  // -- Toolbar buttons (tbar) -----------------------------------------------
  const addServiceBtn = new Button({
    text: 'Add Service',
    tooltip: 'Register a new monitored service',
    handler: () => {
      serviceCount++;
      refs.serviceCount = serviceCount;
      mainPanel.setTitle(`System Monitor (${serviceCount} service${serviceCount !== 1 ? 's' : ''})`);
      updateStatus(`${serviceCount} service${serviceCount !== 1 ? 's' : ''} registered`);
    },
  });

  const removeServiceBtn = new Button({
    text: 'Remove',
    ui: 'default',
    tooltip: 'Deregister the selected service',
    handler: () => {
      if (serviceCount > 0) {
        serviceCount--;
        refs.serviceCount = serviceCount;
        const label = serviceCount === 0
          ? 'No services registered'
          : `${serviceCount} service${serviceCount !== 1 ? 's' : ''} registered`;
        mainPanel.setTitle(
          serviceCount === 0
            ? 'System Monitor'
            : `System Monitor (${serviceCount} service${serviceCount !== 1 ? 's' : ''})`,
        );
        updateStatus(label);
      }
    },
  });

  const exportBtn = new Button({
    text: 'Export',
    ui: 'default',
    tooltip: 'Export service list to CSV',
    handler: () => {
      updateStatus(`export of ${serviceCount} service${serviceCount !== 1 ? 's' : ''} ready`);
    },
  });

  // -- tbar -----------------------------------------------------------------
  const tbar = new Toolbar({
    dock: 'top',
    items: [addServiceBtn, removeServiceBtn, new ToolbarFill(), exportBtn],
  } as any);

  // -- bbar -----------------------------------------------------------------
  const bbar = new Toolbar({
    dock: 'bottom',
    items: [statusBtn, new ToolbarFill(), 'Monitor v1.0'],
  } as any);

  // -- Nested panels (hbox children) ----------------------------------------
  const leftPanel = new Panel({
    title: 'Active Services',
    flex: 1,
    border: true,
    layout: { type: 'vbox', align: 'stretch' },
    items: [
      new Button({ text: 'web-api', ui: 'default', textAlign: 'left' }),
      new Button({ text: 'auth-service', ui: 'default', textAlign: 'left' }),
      new Button({ text: 'cache-layer', ui: 'default', textAlign: 'left' }),
    ],
  });

  const rightPanel = new Panel({
    title: 'Service Details',
    flex: 1,
    border: true,
    layout: { type: 'vbox', align: 'stretch' },
    bodyPadding: 12,
    items: [
      new Button({
        text: 'Select a service from the list to view details.',
        ui: 'default',
        disabled: true,
      }),
    ],
  });

  // -- onRefresh (mirrors refresh tool handler) -----------------------------
  function onRefresh(): void {
    serviceCount = 0;
    refs.serviceCount = 0;
    mainPanel.setTitle('System Monitor');
    updateStatus('Ready');
  }

  // -- Main demo panel ------------------------------------------------------
  const mainPanel = new Panel({
    title: 'System Monitor',
    iconCls: 'x-panel-icon-monitor',
    collapsible: true,
    tools: [
      {
        type: 'refresh',
        tooltip: 'Reset to initial state',
        handler: () => onRefresh(),
      },
    ],
    layout: { type: 'hbox', align: 'stretch' },
    bodyPadding: 8,
    dockedItems: [tbar, bbar],
    items: [leftPanel, rightPanel],
    ...(container ? { renderTo: container } : {}),
  });

  // -- Refs object ----------------------------------------------------------
  const refs: DemoPanelRefs = {
    mainPanel,
    tbar,
    bbar,
    leftPanel,
    rightPanel,
    addServiceBtn,
    removeServiceBtn,
    exportBtn,
    statusBtn,
    serviceCount,
    onRefresh,
  };

  return refs;
}

// ---------------------------------------------------------------------------
// Viewport factory — used by PanelApp.ts for the live demo
// ---------------------------------------------------------------------------

export function createViewport(): Viewport {
  const refs = createDemoPanel();

  return new Viewport({
    layout: { type: 'vbox', align: 'stretch' },
    items: [
      new Panel({
        height: 52,
        border: false,
        bodyPadding: '12px 16px',
        html: '<h2 style="margin:0;font-size:18px;font-weight:600">framesquared — Panel Capabilities Demo</h2>',
      }),
      new Panel({
        flex: 1,
        border: false,
        bodyPadding: 16,
        layout: { type: 'vbox', align: 'stretch' },
        items: [refs.mainPanel],
      }),
    ],
  });
}
