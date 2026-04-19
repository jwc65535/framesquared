import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { Panel, Viewport } from '@framesquared/ui';
import { ModernTheme } from '@framesquared/theme';
import { Resizable } from '@framesquared/dd';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Wire a Resizable splitter to a west or east region panel.
 * Dragging the handle updates gridTemplateColumns on the container body
 * so the CSS Grid track tracks the new width.
 */
function wireSplitter(
  panel: Panel,
  handle: 'e' | 'w',
  body: HTMLElement,
  columnIndex: number,
  minWidth: number,
  maxWidth: number,
): void {
  if (!panel.el) return;
  new Resizable({
    el: panel.el,
    handles: handle,
    minWidth,
    maxWidth,
    onResize: (w) => {
      const cols = body.style.gridTemplateColumns.split(' ');
      cols[columnIndex] = `${w}px`;
      body.style.gridTemplateColumns = cols.join(' ');
    },
  });
}

// ── Application ───────────────────────────────────────────────────────────────

class BorderDemoApp extends Application {
  constructor() {
    super({ name: 'BorderLayoutDemo', theme: ModernTheme });
  }

  override launch(): void {
    const westPanel = new Panel({
      region: 'west',
      title: 'West',
      width: 220,
      bodyPadding: 8,
    });

    const eastPanel = new Panel({
      region: 'east',
      title: 'East',
      width: 200,
      bodyPadding: 8,
    });

    const vp = new Viewport({
      layout: 'border',
      items: [
        new Panel({
          region: 'north',
          title: 'North',
          height: 48,
        }),
        westPanel,
        new Panel({
          region: 'center',
          title: 'Center',
          bodyPadding: 16,
        }),
        eastPanel,
        new Panel({
          region: 'south',
          title: 'South',
          height: 32,
        }),
      ],
    });

    // Attach splitters now that all panels are rendered.
    // gridTemplateColumns will be: '220px 1fr 200px' (west center east).
    const body = vp.getBodyEl();
    wireSplitter(westPanel, 'e', body, 0, 120, 400);
    wireSplitter(eastPanel, 'w', body, 2, 120, 400);
  }
}

new BorderDemoApp().start();
