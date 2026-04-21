import '@framesquared/layout';
import { Panel, Viewport, Toolbar, Button, TabPanel } from '@framesquared/ui';

// ---------------------------------------------------------------------------
// Public interface — returned by createMainView(), consumed by tests and app
// ---------------------------------------------------------------------------

export interface ViewportDemoRefs {
  /** Toolbar rendered inside the north header panel */
  northToolbar: Toolbar;
  /** Button in the north toolbar — fires 'logout' action */
  logoutButton: Button;
  /** North region panel (height 48) containing the app toolbar */
  northPanel: Panel;
  /** West region navigation panel (width 200, collapsible) */
  westPanel: Panel;
  /** Center region — TabPanel holding the three content panels */
  centerTabPanel: TabPanel;
  /** Tab 1 — Welcome placeholder */
  welcomePanel: Panel;
  /** Tab 2 — Activity placeholder */
  activityPanel: Panel;
  /** Tab 3 — Settings placeholder */
  settingsPanel: Panel;
  /** South region status bar (height 28) */
  southPanel: Panel;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createMainView(container?: Element): ViewportDemoRefs {
  // ── North — header toolbar ─────────────────────────────────────────────────
  const logoutButton = new Button({ text: 'Logout', ui: 'danger' });

  const northToolbar = new Toolbar({
    items: [
      new Button({ text: 'framesquared App', disabled: true }),
      '->',
      logoutButton,
    ],
  });

  const northPanel = new Panel({
    region: 'north',
    height: 48,
    header: false,
    bodyPadding: 0,
    items: [northToolbar],
  });

  // ── West — collapsible navigation panel ───────────────────────────────────
  const westPanel = new Panel({
    region: 'west',
    title: 'Navigation',
    width: 200,
    collapsible: true,
    bodyPadding: 8,
    items: [
      new Button({ text: 'Dashboard', ui: 'default' }),
      new Button({ text: 'Reports',   ui: 'default' }),
      new Button({ text: 'Users',     ui: 'default' }),
    ],
  });

  // ── Center — TabPanel with three placeholder content panels ───────────────
  const welcomePanel = new Panel({
    title: 'Welcome',
    header: false,
    bodyPadding: 16,
  });

  const activityPanel = new Panel({
    title: 'Activity',
    header: false,
    bodyPadding: 16,
  });

  const settingsPanel = new Panel({
    title: 'Settings',
    header: false,
    bodyPadding: 16,
  });

  const centerTabPanel = new TabPanel({
    region: 'center',
    tabPosition: 'top',
    activeTab: 0,
    border: false,
    items: [welcomePanel, activityPanel, settingsPanel],
  });

  // ── South — status bar ─────────────────────────────────────────────────────
  const southPanel = new Panel({
    region: 'south',
    height: 28,
    header: false,
    bodyPadding: '4px 8px',
  });

  // ── Wrapper — renders into the supplied container (used by tests) ──────────
  if (container) {
    new Panel({
      renderTo: container,
      layout: 'border',
      items: [northPanel, westPanel, centerTabPanel, southPanel],
    });
  }

  return {
    northToolbar,
    logoutButton,
    northPanel,
    westPanel,
    centerTabPanel,
    welcomePanel,
    activityPanel,
    settingsPanel,
    southPanel,
  };
}

// ---------------------------------------------------------------------------
// Viewport — used by App.ts for the live dev server
// ---------------------------------------------------------------------------

export function createViewport(): Viewport {
  const refs = createMainView();
  return new Viewport({
    layout: 'border',
    items: [refs.northPanel, refs.westPanel, refs.centerTabPanel, refs.southPanel],
  });
}
