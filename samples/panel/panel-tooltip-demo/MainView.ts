/**
 * MainView.ts
 *
 * Factory that constructs the five tooltip-demonstration sections and wires
 * every Tooltip after the component tree has been rendered (so .el is
 * available on all targets).
 *
 * The function requires a rendered container element so that the single
 * wrapper Panel and all of its descendants are in the DOM before the
 * Tooltip instances are created.  App.ts passes the Viewport body; tests
 * pass a plain <div> appended to document.body.
 *
 * Framework changes landed in this commit:
 *   • Tooltip.update(html, title?)  — public content-update method
 *   • Tooltip: positionNearTarget() — geometric anchor positioning
 *     (called when anchor + target are both present and trackMouse is false)
 */

import '@framesquared/layout';
import { Panel, Viewport, Button, Toolbar } from '@framesquared/ui';
import { Tooltip } from '@framesquared/ui';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface TooltipDemoRefs {
  // ── Section 1: Basic ─────────────────────────────────────────────────────
  basicBtn: Button;
  basicTip: Tooltip;

  // ── Section 2: HTML content ───────────────────────────────────────────────
  richPanel: Panel;
  richTip: Tooltip;

  // ── Section 3: Mouse tracking ─────────────────────────────────────────────
  dataPanel: Panel;
  trackTip: Tooltip;

  // ── Section 4: Static anchor positioning ──────────────────────────────────
  anchorBtn: Button;
  anchorTip: Tooltip;

  // ── Section 5: Dynamic content updates ───────────────────────────────────
  dynamicBtn: Button;
  dynamicTip: Tooltip;
  /**
   * Interval handle for the dynamic-update timer.
   * Tests and App teardown must call clearInterval(dynamicIntervalId) to
   * prevent timers leaking beyond the test boundary.
   */
  dynamicIntervalId: ReturnType<typeof setInterval>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createMainView(host: Element): TooltipDemoRefs {
  // ── Section 1 — Basic ToolTip ─────────────────────────────────────────────
  const basicBtn = new Button({
    text: 'Hover Me — Basic ToolTip',
    ui: 'default',
  });

  // ── Section 2 — HTML-content tooltip on a Panel ───────────────────────────
  const richPanel = new Panel({
    title: 'Server Status — hover for details',
    bodyPadding: 12,
    items: [new Button({ text: 'View Metrics', ui: 'default' })],
  });

  // ── Section 3 — Mouse-tracking tooltip over a data area ───────────────────
  const dataPanel = new Panel({
    title: 'Data Area — move your cursor here',
    bodyPadding: 24,
    items: [new Button({ text: 'Explore Data', ui: 'default' })],
  });

  // ── Section 4 — Static anchor tooltip beside an "input" ───────────────────
  const anchorBtn = new Button({
    text: 'required@example.com',
    ui: 'default',
  });

  // ── Section 5 — Dynamically-updated tooltip ───────────────────────────────
  const dynamicBtn = new Button({
    text: 'Status Monitor',
    ui: 'primary',
  });

  // ── Wrapper — renders all sections into host synchronously ────────────────
  // Every component's .el is available once this Panel is constructed.
  new Panel({
    renderTo: host,
    title: 'Ext.tip.ToolTip — Demonstration',
    bodyPadding: 20,
    layout: { type: 'vbox', align: 'stretch' },
    items: [
      // Section 1
      new Panel({
        title: '1 · Basic ToolTip',
        bodyPadding: 12,
        items: [basicBtn],
      }),
      // Section 2
      richPanel,
      // Section 3
      dataPanel,
      // Section 4
      new Panel({
        title: '4 · Static Anchor Positioning',
        bodyPadding: 12,
        layout: { type: 'hbox' },
        items: [anchorBtn],
      }),
      // Section 5
      new Panel({
        title: '5 · Dynamic Content Updates',
        bodyPadding: 12,
        items: [
          new Toolbar({
            items: [dynamicBtn, '->'],
          }),
        ],
      }),
    ],
  });

  // ── Tooltips — created after render so target .el is non-null ─────────────

  // 1. Basic: configurable delays, auto-dismiss
  const basicTip = new Tooltip({
    target: basicBtn.el!,
    html: 'A lightweight tooltip with configurable show/hide delays and a 4-second dismiss timer.',
    showDelay: 300,
    hideDelay: 150,
    dismissDelay: 4000,
  });

  // 2. HTML content: title header + structured HTML body + maxWidth
  const richTip = new Tooltip({
    target: richPanel.el!,
    title: 'Live Server Status',
    html: '<b>Region:</b> us-east-1<br><b>Uptime:</b> 99.9 %<br><b>Latency:</b> 12 ms',
    maxWidth: 240,
    showDelay: 200,
  });

  // 3. Mouse tracking: tooltip repositions on every mousemove
  const trackTip = new Tooltip({
    target: dataPanel.el!,
    html: 'This tooltip tracks your cursor across the data area.',
    trackMouse: true,
    showDelay: 0,
    mouseOffset: [12, 12],
    dismissDelay: 0,
  });

  // 4. Static anchor: autoHide:false + dismissDelay:0 keeps it visible;
  //    anchor:'right' uses positionNearTarget() (framework patch in this commit)
  const anchorTip = new Tooltip({
    target: anchorBtn.el!,
    html: 'This field is required and must be a valid e-mail address.',
    anchor: 'right',
    autoHide: false,
    dismissDelay: 0,
    showDelay: 0,
  });

  // 5. Dynamic: update() called on a 2-second interval to change content
  const dynamicTip = new Tooltip({
    target: dynamicBtn.el!,
    html: 'Checking status…',
    dismissDelay: 0,
    showDelay: 0,
    autoHide: false,
  });

  const dynamicIntervalId = setInterval(() => {
    dynamicTip.update(
      `<b>Last check:</b> ${new Date().toLocaleTimeString()}<br><b>Status:</b> ✓ Online`,
    );
  }, 2000);

  return {
    basicBtn,   basicTip,
    richPanel,  richTip,
    dataPanel,  trackTip,
    anchorBtn,  anchorTip,
    dynamicBtn, dynamicTip, dynamicIntervalId,
  };
}

// ---------------------------------------------------------------------------
// Viewport — used by app.ts for the live dev server
// ---------------------------------------------------------------------------

export function createViewport(): Viewport {
  // Viewport renders itself to document.body on construction — getBodyEl() is
  // immediately available to use as the host for the demo panels.
  const vp = new Viewport({ layout: { type: 'vbox', align: 'stretch' } });
  createMainView(vp.getBodyEl());
  return vp;
}
