/**
 * @framesquared/ui – Panel
 *
 * The primary container with header, body, tools, and docking.
 * Panel extends Container to provide:
 *  - Header with title, icon, and tool buttons
 *  - Body with custom padding/styling
 *  - Optional footer
 *  - Docked items (top/bottom/left/right)
 *  - Collapsible/expandable behavior
 *  - Closable with events
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Container } from '@framesquared/component';
import type { ContainerConfig , Component} from '@framesquared/component';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ToolConfig {
  type: string;
  handler?: (event: MouseEvent, tool: HTMLElement, panel: Panel) => void;
  hidden?: boolean;
  tooltip?: string;
}

export interface PanelConfig extends ContainerConfig {
  title?: string;
  titleAlign?: 'left' | 'center' | 'right';
  iconCls?: string;
  icon?: string;
  header?: boolean;
  footer?: boolean;
  tools?: ToolConfig[];
  collapsible?: boolean;
  collapsed?: boolean;
  collapseDirection?: 'top' | 'bottom' | 'left' | 'right';
  animCollapse?: boolean;
  closable?: boolean;
  bodyPadding?: number | string;
  bodyStyle?: Record<string, string> | string;
  bodyCls?: string;
  frame?: boolean;
  border?: boolean;
  dockedItems?: Component[];
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

export class Panel extends Container {
  static override $className = 'Ext.panel.Panel';
  static _titleCounter = 0;

  // Internal DOM references
  declare private _headerEl: HTMLElement | null;
  declare private _titleTextEl: HTMLElement | null;
  declare private _titleWrapEl: HTMLElement | null;
  declare private _iconEl: HTMLElement | null;
  declare private _toolsEl: HTMLElement | null;
  declare private _panelBodyEl: HTMLElement | null;
  declare private _footerEl: HTMLElement | null;

  // State
  declare private _collapsed: boolean;
  declare private _title: string;
  declare private _iconCls: string;
  declare private _dockedItems: Component[];

  constructor(config: PanelConfig = {}) {
    super(config);
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as PanelConfig;
    this._headerEl = null;
    this._titleTextEl = null;
    this._titleWrapEl = null;
    this._iconEl = null;
    this._toolsEl = null;
    this._panelBodyEl = null;
    this._footerEl = null;
    this._collapsed = cfg.collapsed ?? false;
    this._title = cfg.title ?? '';
    this._iconCls = cfg.iconCls ?? '';
    this._dockedItems = [];
  }

  protected override afterRender(): void {
    // Skip Container's afterRender — we build our own DOM structure
    // Call Component's afterRender instead
    const cfg = this._config as PanelConfig;

    // Root element classes
    this.el!.classList.add('x-panel');
    if (cfg.frame) this.el!.classList.add('x-panel-framed');
    if (cfg.border === false) this.el!.classList.add('x-panel-noborder');

    // -- Header --
    const showHeader = this.shouldShowHeader(cfg);
    if (showHeader) {
      this.buildHeader(cfg);
    }

    // -- Docked items (top) — before body --
    // Rendered after body is created; see below

    // -- Body --
    this._panelBodyEl = document.createElement('div');
    this._panelBodyEl.classList.add('x-panel-body');
    this.applyBodyStyles(cfg);
    this.el!.appendChild(this._panelBodyEl);

    // Point Container's body to our panel-body
    (this as any)._bodyEl = this._panelBodyEl;

    // -- Footer --
    if (cfg.footer) {
      this._footerEl = document.createElement('div');
      this._footerEl.classList.add('x-panel-footer');
      this.el!.appendChild(this._footerEl);
    }

    // -- Auto tools (collapsible / closable) --
    this.addAutoTools(cfg);

    // -- Collapsed state --
    if (this._collapsed) {
      this._panelBodyEl.style.display = 'none';
      this.el!.classList.add('x-panel-collapsed');
    }

    // -- Render items that were added before render --
    for (const child of (this as any)._items as Component[]) {
      if (!child.rendered) {
        child.render(this._panelBodyEl);
      }
    }

    // -- Add initial items from config --
    const items = cfg.items;
    if (items && (items as any[]).length > 0) {
      this.add(...(items as any[]));
    }

    // -- Docked items from config --
    if (cfg.dockedItems) {
      for (const docked of cfg.dockedItems) {
        this.addDocked(docked);
      }
    }

    // -- ARIA --
    this.el!.setAttribute('role', 'region');
    if (cfg.title) this.el!.setAttribute('aria-label', cfg.title);
    if (cfg.collapsible) {
      this.el!.setAttribute('aria-expanded', String(!this._collapsed));
    }
  }

  protected override onDestroy(): void {
    // Destroy docked items
    for (const item of [...this._dockedItems]) {
      item.destroy();
    }
    this._dockedItems.length = 0;
    super.onDestroy();
  }

  // -----------------------------------------------------------------------
  // Header construction
  // -----------------------------------------------------------------------

  private shouldShowHeader(cfg: PanelConfig): boolean {
    if (cfg.header === false) return false;
    if (cfg.header === true) return true;
    // Show header if there's a title, icon, or tools
    return !!(
      cfg.title ||
      cfg.iconCls ||
      cfg.icon ||
      cfg.tools?.length ||
      cfg.closable ||
      cfg.collapsible
    );
  }

  private buildHeader(cfg: PanelConfig): void {
    this._headerEl = document.createElement('div');
    this._headerEl.classList.add('x-panel-header');

    // Icon
    if (cfg.iconCls || cfg.icon) {
      this._iconEl = document.createElement('span');
      this._iconEl.classList.add('x-panel-header-icon');
      if (cfg.iconCls) this._iconEl.classList.add(cfg.iconCls);
      if (cfg.icon) this._iconEl.style.backgroundImage = `url(${cfg.icon})`;
      this._headerEl.appendChild(this._iconEl);
    }

    // Title
    this._titleWrapEl = document.createElement('div');
    this._titleWrapEl.classList.add('x-panel-header-title');
    if (cfg.titleAlign) {
      this._titleWrapEl.style.textAlign = cfg.titleAlign;
    }

    this._titleTextEl = document.createElement('span');
    this._titleTextEl.classList.add('x-panel-header-text');
    this._titleTextEl.id = `ext-panel-title-${Panel._titleCounter++}`;
    this._titleTextEl.textContent = this._title;
    this._titleWrapEl.appendChild(this._titleTextEl);
    this._headerEl.appendChild(this._titleWrapEl);

    // Tools container
    this._toolsEl = document.createElement('div');
    this._toolsEl.classList.add('x-panel-header-tools');
    this._headerEl.appendChild(this._toolsEl);

    // Render configured tools
    if (cfg.tools) {
      for (const tool of cfg.tools) {
        this.renderTool(tool);
      }
    }

    this.el!.appendChild(this._headerEl);
  }

  private addAutoTools(cfg: PanelConfig): void {
    if (cfg.collapsible && !this.hasToolType('collapse')) {
      this.addTool({
        type: 'collapse',
        handler: () => this.toggleCollapse(),
      });
    }
    if (cfg.closable && !this.hasToolType('close')) {
      this.addTool({
        type: 'close',
        handler: () => this.close(),
      });
    }
  }

  private hasToolType(type: string): boolean {
    if (!this._toolsEl) return false;
    return this._toolsEl.querySelector(`.x-tool-${type}`) !== null;
  }

  // -----------------------------------------------------------------------
  // Body styling
  // -----------------------------------------------------------------------

  private applyBodyStyles(cfg: PanelConfig): void {
    const body = this._panelBodyEl!;

    if (cfg.bodyPadding !== undefined) {
      body.style.padding =
        typeof cfg.bodyPadding === 'number' ? `${cfg.bodyPadding}px` : cfg.bodyPadding;
    }

    if (cfg.bodyStyle) {
      if (typeof cfg.bodyStyle === 'string') {
        body.style.cssText += cfg.bodyStyle;
      } else {
        for (const [prop, val] of Object.entries(cfg.bodyStyle)) {
          (body.style as any)[prop] = val;
        }
      }
    }

    if (cfg.bodyCls) {
      body.classList.add(cfg.bodyCls);
    }
  }

  // -----------------------------------------------------------------------
  // Title
  // -----------------------------------------------------------------------

  setTitle(title: string): void {
    const oldTitle = this._title;
    this._title = title;
    if (this._titleTextEl) {
      this._titleTextEl.textContent = title;
    }
    this.fire('titlechange', this, title, oldTitle);
  }

  getTitle(): string {
    return this._title;
  }

  // -----------------------------------------------------------------------
  // Icon
  // -----------------------------------------------------------------------

  setIconCls(iconCls: string): void {
    const oldCls = this._iconCls;
    if (this._iconEl) {
      if (oldCls) this._iconEl.classList.remove(oldCls);
      this._iconEl.classList.add(iconCls);
    }
    this._iconCls = iconCls;
    this.fire('iconchange', this, iconCls, oldCls);
  }

  getIconCls(): string {
    return this._iconCls;
  }

  // -----------------------------------------------------------------------
  // Tools
  // -----------------------------------------------------------------------

  addTool(tool: ToolConfig): void {
    // Ensure header and tools container exist
    if (!this._headerEl) {
      this.buildHeader(this._config as PanelConfig);
    }
    this.renderTool(tool);
  }

  private renderTool(tool: ToolConfig): void {
    if (!this._toolsEl) return;

    const toolEl = document.createElement('div');
    toolEl.classList.add('x-tool', `x-tool-${tool.type}`);
    toolEl.setAttribute('role', 'button');
    toolEl.setAttribute('tabindex', '0');

    if (tool.tooltip) {
      toolEl.setAttribute('title', tool.tooltip);
    }

    if (tool.hidden) {
      toolEl.style.display = 'none';
    }

    if (tool.handler) {
      const handler = tool.handler;
      toolEl.addEventListener('click', (e: MouseEvent) => {
        handler(e, toolEl, this);
      });
    }

    this._toolsEl.appendChild(toolEl);
  }

  // -----------------------------------------------------------------------
  // Collapse / Expand
  // -----------------------------------------------------------------------

  collapse(): void {
    if (this._collapsed) return;
    this.fire('beforecollapse', this);
    this._collapsed = true;
    if (this._panelBodyEl) {
      this._panelBodyEl.style.display = 'none';
    }
    this.el?.classList.add('x-panel-collapsed');
    this.fire('collapse', this);
  }

  expand(): void {
    if (!this._collapsed) return;
    this.fire('beforeexpand', this);
    this._collapsed = false;
    if (this._panelBodyEl) {
      this._panelBodyEl.style.display = '';
    }
    this.el?.classList.remove('x-panel-collapsed');
    this.fire('expand', this);
  }

  toggleCollapse(): void {
    if (this._collapsed) {
      this.expand();
    } else {
      this.collapse();
    }
  }

  isCollapsed(): boolean {
    return this._collapsed;
  }

  // -----------------------------------------------------------------------
  // Close
  // -----------------------------------------------------------------------

  close(): void {
    this.fire('beforeclose', this);
    this.fire('close', this);
    this.destroy();
  }

  // -----------------------------------------------------------------------
  // Docked items
  // -----------------------------------------------------------------------

  addDocked(item: Component, _pos?: number): void {
    this._dockedItems.push(item);

    if (this.rendered && this.el) {
      const dock = ((item as any)._config?.dock as string) ?? 'top';
      const body = this._panelBodyEl ?? this.el;

      if (dock === 'top' || dock === 'left') {
        // Insert before body
        item.render(this.el);
        this.el.insertBefore(item.el!, body);
      } else {
        // Insert after body
        item.render(this.el);
        if (body.nextSibling) {
          this.el.insertBefore(item.el!, body.nextSibling);
        }
        // If no nextSibling, render already appended it
      }

      item.el?.classList.add('x-docked', `x-docked-${dock}`);
    }

    this.fire('dockedadd', this, item);
  }

  removeDocked(item: Component, destroy = false): void {
    const idx = this._dockedItems.indexOf(item);
    if (idx === -1) return;

    this._dockedItems.splice(idx, 1);

    if (item.el?.parentNode) {
      item.el.parentNode.removeChild(item.el);
    }

    this.fire('dockedremove', this, item);

    if (destroy) {
      item.destroy();
    }
  }

  getDockedItems(_selector?: string): Component[] {
    return [...this._dockedItems];
  }
}
