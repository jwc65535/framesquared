/**
 * @framesquared/ui – Toolbar
 *
 * A Container that arranges items horizontally (or vertically) with
 * special shorthand items: '->' (fill), '-' (separator), ' ' (spacer),
 * and plain text strings.  Uses flexbox layout.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Component, Container } from '@framesquared/component';
import type { ContainerConfig } from '@framesquared/component';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface ToolbarConfig extends ContainerConfig {
  vertical?: boolean;
  enableOverflow?: boolean;
  defaultButtonUI?: string;
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

export class Toolbar extends Container {
  static override $className = 'Ext.toolbar.Toolbar';

  constructor(config: ToolbarConfig = {}) {
    // Pre-process items: convert string shortcuts to Component instances
    const processed = { ...config };
    if (config.items) {
      processed.items = (config.items as any[]).map((item) => resolveToolbarItem(item));
    }
    super({ xtype: 'toolbar', ...processed });
  }

  protected override afterRender(): void {
    super.afterRender();
    const cfg = this._config as ToolbarConfig;
    const el = this.el!;
    const body = this.getBodyEl();

    el.classList.add('x-toolbar');
    el.setAttribute('role', 'toolbar');

    // Flex layout
    body.style.display = 'flex';
    body.style.flexDirection = cfg.vertical ? 'column' : 'row';
    body.style.alignItems = 'center';
    body.style.gap = '4px';
  }
}

// ---------------------------------------------------------------------------
// Resolve string shortcuts to Component instances
// ---------------------------------------------------------------------------

function resolveToolbarItem(item: any): Component {
  if (item instanceof Component) return item;

  if (item === '->') return new ToolbarFill();
  if (item === '-') return new ToolbarSeparator();
  if (item === ' ') return new ToolbarSpacer();
  if (typeof item === 'string') return new ToolbarTextItem({ text: item });

  // Config object — return as-is (Container.add will resolve)
  return item;
}

// ---------------------------------------------------------------------------
// Special toolbar items
// ---------------------------------------------------------------------------

export class ToolbarFill extends Component {
  constructor() { super({}); }
  protected override afterRender(): void {
    super.afterRender();
    this.el!.classList.add('x-toolbar-fill');
    this.el!.style.flexGrow = '1';
  }
}

export class ToolbarSeparator extends Component {
  constructor() { super({}); }
  protected override afterRender(): void {
    super.afterRender();
    this.el!.classList.add('x-toolbar-separator');
  }
}

export class ToolbarSpacer extends Component {
  constructor() { super({}); }
  protected override afterRender(): void {
    super.afterRender();
    this.el!.classList.add('x-toolbar-spacer');
    this.el!.style.width = '8px';
  }
}

export class ToolbarTextItem extends Component {
  constructor(config: { text: string }) {
    super({ html: config.text });
  }
  protected override afterRender(): void {
    super.afterRender();
    this.el!.classList.add('x-toolbar-text');
  }
}
