/**
 * @framesquared/ui – Accordion
 *
 * A Container that displays child panels as collapsible sections.
 * By default only one panel is expanded at a time (single mode).
 * Set multi:true to allow multiple expanded panels.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Container } from '@framesquared/component';
import type { ContainerConfig } from '@framesquared/component';

export interface AccordionConfig extends ContainerConfig {
  multi?: boolean;
  activeItem?: number;
}

export class Accordion extends Container {
  static override $className = 'Ext.container.Accordion';

  declare private _multi: boolean;
  declare private _expandedSet: Set<number>;
  declare private _headerEls: HTMLElement[];

  constructor(config: AccordionConfig = {}) {
    super({ xtype: 'accordion', ...config });
  }

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as AccordionConfig;
    this._multi = cfg.multi ?? false;
    this._expandedSet = new Set();
    this._headerEls = [];
  }

  protected override afterRender(): void {
    super.afterRender();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.el!.classList.add('x-accordion');

    const body = this.getBodyEl();
    body.style.display = 'flex';
    body.style.flexDirection = 'column';

    // Wrap each child with an accordion section
    const items = this.getItems();
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const section = document.createElement('div');
      section.classList.add('x-accordion-section');

      // Header
      const header = document.createElement('div');
      header.classList.add('x-accordion-header');
      header.style.cursor = 'pointer';
      const panelCfg = (item as any)._config ?? {};
      header.textContent = panelCfg.title ?? `Section ${i + 1}`;
      header.addEventListener('click', () => this.toggle(i));
      this._headerEls.push(header);
      section.appendChild(header);

      // Body wrapper — hidden by default; expand() will show the active one
      const bodyWrap = document.createElement('div');
      bodyWrap.classList.add('x-accordion-body');
      bodyWrap.style.display = 'none';
      if (item.el) {
        bodyWrap.appendChild(item.el);
      }
      section.appendChild(bodyWrap);

      body.appendChild(section);
    }

    // Expand first by default
    const cfg = this._config as AccordionConfig;
    const active = cfg.activeItem ?? 0;
    if (items.length > 0) {
      this.expand(active);
    }
  }

  // -----------------------------------------------------------------------
  // Expand / Collapse
  // -----------------------------------------------------------------------

  expand(index: number): void {
    if (!this._multi) {
      // Collapse all others
      for (const i of [...this._expandedSet]) {
        if (i !== index) this.doCollapse(i);
      }
    }
    this.doExpand(index);
  }

  collapse(index: number): void {
    this.doCollapse(index);
  }

  toggle(index: number): void {
    if (this._expandedSet.has(index)) {
      this.collapse(index);
    } else {
      this.expand(index);
    }
  }

  isExpanded(index: number): boolean {
    return this._expandedSet.has(index);
  }

  private doExpand(index: number): void {
    if (this._expandedSet.has(index)) return;
    this._expandedSet.add(index);
    const section = this.getSection(index);
    if (section) {
      const bodyWrap = section.querySelector('.x-accordion-body') as HTMLElement;
      if (bodyWrap) bodyWrap.style.display = '';
      section.classList.add('x-accordion-expanded');
    }
    this.fire('expand', this, index);
  }

  private doCollapse(index: number): void {
    this._expandedSet.delete(index);
    const section = this.getSection(index);
    if (section) {
      const bodyWrap = section.querySelector('.x-accordion-body') as HTMLElement;
      if (bodyWrap) bodyWrap.style.display = 'none';
      section.classList.remove('x-accordion-expanded');
    }
    this.fire('collapse', this, index);
  }

  private getSection(index: number): HTMLElement | null {
    const body = this.getBodyEl();
    if (!body) return null;
    const sections = body.querySelectorAll('.x-accordion-section');
    return (sections[index] as HTMLElement) ?? null;
  }
}
