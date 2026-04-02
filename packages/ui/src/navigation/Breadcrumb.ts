/**
 * @framesquared/ui – Breadcrumb
 *
 * Displays a tree store as a breadcrumb path.  Each segment is a
 * clickable item.  Non-leaf items have a dropdown arrow that shows
 * their children for navigation.
 */

 

import { Component } from '@framesquared/component';
import type { ComponentConfig } from '@framesquared/component';

// ---------------------------------------------------------------------------
// Minimal tree node interface (duck-typed, no grid import)
// ---------------------------------------------------------------------------

export interface BreadcrumbNode {
  id: string;
  text: string;
  leaf: boolean;
  children: BreadcrumbNode[];
  parent: BreadcrumbNode | null;
}

export interface BreadcrumbStore {
  getRoot(): BreadcrumbNode;
  getNodeById(id: string): BreadcrumbNode | null;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface BreadcrumbConfig extends ComponentConfig {
  store?: BreadcrumbStore;
  selection?: BreadcrumbNode | null;
  showIcons?: boolean;
}

// ---------------------------------------------------------------------------
// Breadcrumb
// ---------------------------------------------------------------------------

export class Breadcrumb extends Component {
  static override $className = 'Ext.navigation.Breadcrumb';

  declare private _store: BreadcrumbStore | null;
  declare private _selection: BreadcrumbNode | null;
  declare private _contentEl: HTMLElement | null;
  declare private _activeDropdown: HTMLElement | null;

  constructor(config: BreadcrumbConfig = {}) {
    super({ xtype: 'breadcrumb', ...config });
  }

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as BreadcrumbConfig;
    this._store = cfg.store ?? null;
    this._selection = cfg.selection ?? this._store?.getRoot() ?? null;
    this._contentEl = null;
    this._activeDropdown = null;
  }

  protected override afterRender(): void {
    super.afterRender();
    this.el!.classList.add('x-breadcrumb');
    this.el!.style.display = 'flex';
    this.el!.style.alignItems = 'center';

    this._contentEl = this.el!;
    this.renderPath();
  }

  // -----------------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------------

  private renderPath(): void {
    if (!this._contentEl) return;
    this._contentEl.innerHTML = '';
    this.closeDropdown();

    if (!this._selection) return;

    // Build path from root to selection
    const path = this.getPathToNode(this._selection);

    for (let i = 0; i < path.length; i++) {
      const node = path[i];

      // Separator
      if (i > 0) {
        const sep = document.createElement('span');
        sep.classList.add('x-breadcrumb-separator');
        sep.textContent = ' › ';
        this._contentEl.appendChild(sep);
      }

      // Item
      const item = document.createElement('span');
      item.classList.add('x-breadcrumb-item');
      item.setAttribute('data-node-id', node.id);
      item.style.cursor = 'pointer';

      item.addEventListener('click', (e) => {
        // Don't navigate if click was on the arrow
        if ((e.target as HTMLElement).closest('.x-breadcrumb-arrow')) return;
        e.stopPropagation();
        this.navigateTo(node);
      });

      // Text
      const text = document.createElement('span');
      text.classList.add('x-breadcrumb-text');
      text.textContent = node.text;
      item.appendChild(text);

      // Dropdown arrow for non-leaf
      if (!node.leaf && node.children.length > 0) {
        const arrow = document.createElement('span');
        arrow.classList.add('x-breadcrumb-arrow');
        arrow.textContent = ' ▾';
        arrow.style.cursor = 'pointer';
        arrow.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showDropdown(node, arrow);
        });
        item.appendChild(arrow);
      }

      this._contentEl.appendChild(item);
    }
  }

  private getPathToNode(node: BreadcrumbNode): BreadcrumbNode[] {
    const path: BreadcrumbNode[] = [];
    let current: BreadcrumbNode | null = node;
    while (current) {
      path.unshift(current);
      current = current.parent;
    }
    return path;
  }

  // -----------------------------------------------------------------------
  // Navigation
  // -----------------------------------------------------------------------

  private navigateTo(node: BreadcrumbNode): void {
    const old = this._selection;
    this._selection = node;
    this.renderPath();
    this.fire('selectionchange', this, node, old);
  }

  setSelection(node: BreadcrumbNode): void {
    this.navigateTo(node);
  }

  getSelection(): BreadcrumbNode | null {
    return this._selection;
  }

  // -----------------------------------------------------------------------
  // Dropdown
  // -----------------------------------------------------------------------

  private showDropdown(node: BreadcrumbNode, anchor: HTMLElement): void {
    this.closeDropdown();

    const dropdown = document.createElement('div');
    dropdown.classList.add('x-breadcrumb-dropdown');
    dropdown.style.position = 'absolute';
    dropdown.style.zIndex = '10000';

    for (const child of node.children) {
      const option = document.createElement('div');
      option.classList.add('x-breadcrumb-dropdown-item');
      option.textContent = child.text;
      option.style.cursor = 'pointer';
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        this.navigateTo(child);
      });
      dropdown.appendChild(option);
    }

    // Position below the arrow
    const rect = anchor.getBoundingClientRect();
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.top = `${rect.bottom}px`;

    document.body.appendChild(dropdown);
    this._activeDropdown = dropdown;

    // Close on outside click
    const onClickOutside = (e: MouseEvent) => {
      if (!dropdown.contains(e.target as Node)) {
        this.closeDropdown();
        document.removeEventListener('click', onClickOutside);
      }
    };
    setTimeout(() => document.addEventListener('click', onClickOutside), 0);
  }

  private closeDropdown(): void {
    if (this._activeDropdown?.parentNode) {
      this._activeDropdown.parentNode.removeChild(this._activeDropdown);
    }
    this._activeDropdown = null;
  }

  protected override onDestroy(): void {
    this.closeDropdown();
    super.onDestroy();
  }
}
