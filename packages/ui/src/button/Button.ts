/**
 * @ext-ts/ui – Button
 *
 * A clickable button component with text, icon, toggle, menu arrow,
 * keyboard support, and accessibility.  Renders as native &lt;button&gt;
 * (or &lt;a&gt; if href is provided).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Component } from '@ext-ts/component';
import type { ComponentConfig } from '@ext-ts/component';

// ---------------------------------------------------------------------------
// Toggle group registry (module-level singleton)
// ---------------------------------------------------------------------------

const toggleGroups = new Map<string, Set<Button>>();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface ButtonConfig extends ComponentConfig {
  text?: string;
  iconCls?: string;
  iconAlign?: 'left' | 'right' | 'top' | 'bottom';
  icon?: string;
  scale?: 'small' | 'medium' | 'large';
  handler?: (button: Button, event: Event) => void;
  scope?: object;
  pressed?: boolean;
  enableToggle?: boolean;
  toggleGroup?: string;
  menu?: any;
  menuAlign?: string;
  arrowVisible?: boolean;
  tooltip?: string;
  href?: string;
  target?: string;
  textAlign?: 'left' | 'center' | 'right';
  ui?: string;
  value?: string;
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

export class Button extends Component {
  static override $className = 'Ext.button.Button';

  declare protected _pressed: boolean;
  declare protected _scale: string;
  declare protected _iconCls: string;
  declare protected _textEl: HTMLElement | null;
  declare protected _iconEl: HTMLElement | null;

  constructor(config: ButtonConfig = {}) {
    super({ xtype: 'button', ...config });
  }

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as ButtonConfig;
    this._pressed = cfg.pressed ?? false;
    this._scale = cfg.scale ?? 'medium';
    this._iconCls = cfg.iconCls ?? '';
    this._textEl = null;
    this._iconEl = null;
  }

  // -----------------------------------------------------------------------
  // Render — override to create <button> or <a> instead of <div>
  // -----------------------------------------------------------------------

  override render(container?: Element | string, position?: number | Element): void {
    if (this.rendered || this.isDestroyed) return;

    this.fire('beforerender', this);
    this.beforeRender();

    const cfg = this._config as ButtonConfig;

    // Create element
    if (cfg.href) {
      this.el = document.createElement('a');
      (this.el as HTMLAnchorElement).href = cfg.href;
      if (cfg.target) (this.el as HTMLAnchorElement).target = cfg.target;
    } else {
      this.el = document.createElement('button');
      (this.el as HTMLButtonElement).type = 'button';
    }

    this.el.id = this.componentId;
    this.el.classList.add('x-btn', 'x-component');

    // Build inner DOM
    this.buildInnerDom(cfg);

    // Apply configs
    this.applyButtonConfigs(cfg);

    // Insert into DOM
    const target = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    if (target) {
      if (typeof position === 'number') {
        const ref = target.children[position];
        ref ? target.insertBefore(this.el, ref) : target.appendChild(this.el);
      } else if (position instanceof Element) {
        target.insertBefore(this.el, position);
      } else {
        target.appendChild(this.el);
      }
    }

    // Attach events
    this.attachEvents(cfg);

    this.rendered = true;
    this.fire('render', this);
    this.afterRender();
    this.fire('afterrender', this);
  }

  // -----------------------------------------------------------------------
  // DOM construction
  // -----------------------------------------------------------------------

  protected buildInnerDom(cfg: ButtonConfig): void {
    const el = this.el!;

    // Icon
    if (cfg.iconCls || cfg.icon) {
      this._iconEl = document.createElement('span');
      this._iconEl.classList.add('x-btn-icon');
      if (cfg.iconCls) this._iconEl.classList.add(cfg.iconCls);
      if (cfg.icon) this._iconEl.style.backgroundImage = `url(${cfg.icon})`;
      el.appendChild(this._iconEl);
    }

    // Text
    if (cfg.text) {
      this._textEl = document.createElement('span');
      this._textEl.classList.add('x-btn-text');
      this._textEl.textContent = cfg.text;
      el.appendChild(this._textEl);
    }

    // Menu arrow
    if (cfg.menu && cfg.arrowVisible !== false) {
      const arrow = document.createElement('span');
      arrow.classList.add('x-btn-arrow');
      el.appendChild(arrow);
    }
  }

  protected applyButtonConfigs(cfg: ButtonConfig): void {
    const el = this.el!;

    // Scale
    if (cfg.scale) el.classList.add(`x-btn-${cfg.scale}`);

    // UI variant
    if (cfg.ui) el.classList.add(`x-btn-${cfg.ui}`);

    // Icon alignment
    if (cfg.iconAlign && cfg.iconAlign !== 'left') {
      el.classList.add(`x-btn-icon-${cfg.iconAlign}`);
    }

    // Text align
    if (cfg.textAlign) el.style.textAlign = cfg.textAlign;

    // Tooltip
    if (cfg.tooltip) el.setAttribute('title', cfg.tooltip);

    // Pressed
    if (this._pressed) el.classList.add('x-btn-pressed');

    // Disabled
    if (cfg.disabled) {
      el.classList.add('x-btn-disabled');
      if (el.tagName === 'BUTTON') (el as HTMLButtonElement).disabled = true;
    }

    // Toggle group registration
    if (cfg.toggleGroup) {
      let group = toggleGroups.get(cfg.toggleGroup);
      if (!group) { group = new Set(); toggleGroups.set(cfg.toggleGroup, group); }
      group.add(this);
    }

    // ARIA
    el.setAttribute('role', 'button');
    if (cfg.text) el.setAttribute('aria-label', cfg.text);
    if (cfg.enableToggle || cfg.toggleGroup) {
      el.setAttribute('aria-pressed', String(!!this._pressed));
    }
    if (cfg.menu) {
      el.setAttribute('aria-haspopup', 'true');
      el.setAttribute('aria-expanded', 'false');
    }
    if (cfg.disabled) {
      el.setAttribute('aria-disabled', 'true');
    }
  }

  // -----------------------------------------------------------------------
  // Event attachment
  // -----------------------------------------------------------------------

  protected attachEvents(_cfg: ButtonConfig): void {
    const el = this.el!;

    el.addEventListener('click', (e: MouseEvent) => {
      this.onButtonClick(e);
    });

    el.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.onButtonClick(e);
      }
    });

    el.addEventListener('mouseover', (e: MouseEvent) => {
      this.fire('mouseover', this, e);
    });

    el.addEventListener('mouseout', (e: MouseEvent) => {
      this.fire('mouseout', this, e);
    });
  }

  protected onButtonClick(e: Event): void {
    if (this.isDisabled()) return;

    const cfg = this._config as ButtonConfig;

    // Toggle
    if (cfg.enableToggle || cfg.toggleGroup) {
      if (cfg.toggleGroup) {
        // Radio behavior: if already pressed, keep pressed
        if (!this._pressed) {
          this.depressGroupMembers(cfg.toggleGroup);
          this.toggle(true);
        }
      } else {
        this.toggle(!this._pressed);
      }
    }

    // Handler
    if (cfg.handler) {
      const scope = cfg.scope ?? this;
      cfg.handler.call(scope, this, e);
    }

    this.fire('click', this, e);
  }

  private depressGroupMembers(groupName: string): void {
    const group = toggleGroups.get(groupName);
    if (!group) return;
    for (const member of group) {
      if (member !== this && member._pressed) {
        member.toggle(false);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  toggle(state?: boolean): void {
    const newState = state ?? !this._pressed;
    if (newState === this._pressed) return;
    this._pressed = newState;
    if (this.el) {
      this.el.classList.toggle('x-btn-pressed', newState);
    }
    this.fire('toggle', this, newState);
  }

  isPressed(): boolean {
    return this._pressed;
  }

  setText(text: string): void {
    if (this._textEl) {
      this._textEl.textContent = text;
    } else if (this.el) {
      this._textEl = document.createElement('span');
      this._textEl.classList.add('x-btn-text');
      this._textEl.textContent = text;
      this.el.appendChild(this._textEl);
    }
  }

  setIconCls(iconCls: string): void {
    if (this._iconEl) {
      if (this._iconCls) this._iconEl.classList.remove(this._iconCls);
      this._iconEl.classList.add(iconCls);
    }
    this._iconCls = iconCls;
  }

  setIcon(icon: string): void {
    if (this._iconEl) {
      this._iconEl.style.backgroundImage = `url(${icon})`;
    }
  }

  setTooltip(tooltip: string): void {
    if (this.el) this.el.setAttribute('title', tooltip);
  }

  setScale(scale: string): void {
    if (this.el) {
      this.el.classList.remove(`x-btn-${this._scale}`);
      this.el.classList.add(`x-btn-${scale}`);
    }
    this._scale = scale;
  }

  getValue(): string {
    return (this._config as ButtonConfig).value ?? '';
  }

  // -----------------------------------------------------------------------
  // Destroy
  // -----------------------------------------------------------------------

  protected override onDestroy(): void {
    const cfg = this._config as ButtonConfig;
    if (cfg.toggleGroup) {
      const group = toggleGroups.get(cfg.toggleGroup);
      group?.delete(this);
    }
    super.onDestroy();
  }
}
