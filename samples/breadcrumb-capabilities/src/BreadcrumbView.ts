/**
 * breadcrumb-capabilities — BreadcrumbView
 *
 * Demonstrates every Breadcrumb capability the framework supports:
 *   - Static path rendering with iconCls on nodes
 *   - Active (deepest) node visually distinguished
 *   - Dropdown arrows on non-leaf nodes
 *   - setSelection() / getSelection() programmatic API
 *   - selectionchange event wired to a sibling display component
 *   - Toolbar embedding alongside a companion Reset button
 *   - Navigation buttons for drill-down and up-traversal
 *
 * NOTE — overflow handling is absent from the framework core; see
 * README.md § "Framework Integrity Report" for the technical specification.
 */

import '@framesquared/layout';
import {
  Button,
  Breadcrumb,
  Toolbar,
  Panel,
  Viewport,
} from '@framesquared/ui';
import type { BreadcrumbNode, BreadcrumbStore } from '@framesquared/ui';

// ---------------------------------------------------------------------------
// Tree store factory
// ---------------------------------------------------------------------------

function buildStore(): { store: BreadcrumbStore; nodes: NodeMap } {
  const root: BreadcrumbNode = {
    id: 'home', text: 'Home', iconCls: 'x-icon-home',
    leaf: false, children: [], parent: null,
  };
  const catalog: BreadcrumbNode = {
    id: 'catalog', text: 'Catalog', iconCls: 'x-icon-catalog',
    leaf: false, children: [], parent: root,
  };
  const electronics: BreadcrumbNode = {
    id: 'electronics', text: 'Electronics',
    leaf: false, children: [], parent: catalog,
  };
  const phones: BreadcrumbNode = {
    id: 'phones', text: 'Phones',
    leaf: true, children: [], parent: electronics,
  };
  const laptops: BreadcrumbNode = {
    id: 'laptops', text: 'Laptops',
    leaf: true, children: [], parent: electronics,
  };
  const clothing: BreadcrumbNode = {
    id: 'clothing', text: 'Clothing',
    leaf: true, children: [], parent: catalog,
  };
  const deals: BreadcrumbNode = {
    id: 'deals', text: 'Deals',
    leaf: true, children: [], parent: root,
  };

  electronics.children = [phones, laptops];
  catalog.children    = [electronics, clothing];
  root.children       = [catalog, deals];

  const all = [root, catalog, electronics, phones, laptops, clothing, deals];
  const map = new Map(all.map((n) => [n.id, n]));

  const store: BreadcrumbStore = {
    getRoot:       () => root,
    getNodeById:   (id) => map.get(id) ?? null,
  };

  return { store, nodes: { root, catalog, electronics, phones, laptops } };
}

interface NodeMap {
  root:        BreadcrumbNode;
  catalog:     BreadcrumbNode;
  electronics: BreadcrumbNode;
  phones:      BreadcrumbNode;
  laptops:     BreadcrumbNode;
}

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface BreadcrumbViewRefs {
  // Core component
  breadcrumb: Breadcrumb;

  // Toolbar companions
  homeBtn:          Button;    // resets selection to root
  selectionDisplay: Button;    // disabled — shows the current node name

  // Navigation panel buttons
  goUpBtn:          Button;    // navigate to parent of current selection
  goCatalogBtn:     Button;    // jump to Catalog node
  goElectronicsBtn: Button;    // jump to Electronics node
  goPhonesBtn:      Button;    // jump to Phones node (leaf)

  // Node refs for programmatic test assertions
  rootNode:        BreadcrumbNode;
  catalogNode:     BreadcrumbNode;
  electronicsNode: BreadcrumbNode;
  phonesNode:      BreadcrumbNode;
  laptopsNode:     BreadcrumbNode;

  // Mutable counters
  selectionChangeCount:  { value: number };
  lastSelectedNode:      { value: BreadcrumbNode | null };
}

// ---------------------------------------------------------------------------
// Factory — renders into an arbitrary host element
// ---------------------------------------------------------------------------

export function createBreadcrumbView(host: Element): BreadcrumbViewRefs {
  const { store, nodes } = buildStore();
  const { root, catalog, electronics, phones, laptops } = nodes;

  const selectionChangeCount: { value: number }              = { value: 0 };
  const lastSelectedNode:     { value: BreadcrumbNode | null } = { value: null };

  // ── Selection display ─────────────────────────────────────────────────────
  // Disabled Button used as a read-only label — updated via setText() in the
  // selectionchange handler.  No raw DOM writes; no custom CSS.
  const selectionDisplay = new Button({
    text:     `Selected: ${electronics.text}`,
    disabled: true,
    ui:       'default',
  });

  // ── Breadcrumb ────────────────────────────────────────────────────────────
  // Initial selection: Electronics (path depth 3: Home > Catalog > Electronics)
  const breadcrumb = new Breadcrumb({
    store,
    selection:  electronics,
    showIcons:  true,
    listeners: {
      selectionchange: (_bc: unknown, node: BreadcrumbNode) => {
        selectionChangeCount.value++;
        lastSelectedNode.value = node;
        selectionDisplay.setText(`Selected: ${node.text}`);
      },
    },
  });

  // ── Toolbar companion buttons ─────────────────────────────────────────────
  const homeBtn = new Button({
    text:    'Home',
    handler: () => breadcrumb.setSelection(root),
  });

  // ── Navigation panel buttons ──────────────────────────────────────────────
  const goUpBtn = new Button({
    text:    '↑ Up',
    handler: () => {
      const sel = breadcrumb.getSelection();
      if (sel?.parent) breadcrumb.setSelection(sel.parent);
    },
  });

  const goCatalogBtn = new Button({
    text:    '→ Catalog',
    handler: () => breadcrumb.setSelection(catalog),
  });

  const goElectronicsBtn = new Button({
    text:    '→ Electronics',
    handler: () => breadcrumb.setSelection(electronics),
  });

  const goPhonesBtn = new Button({
    text:    '→ Phones',
    handler: () => breadcrumb.setSelection(phones),
  });

  // ── Primary toolbar: Reset | breadcrumb                 selectionDisplay ──
  const primaryToolbar = new Toolbar({
    items: [
      homeBtn,
      '-',
      breadcrumb,
      '->',
      selectionDisplay,
    ],
  });

  // ── Navigation panel ──────────────────────────────────────────────────────
  const navPanel = new Panel({
    title:  'Navigate',
    layout: { type: 'hbox', align: 'middle' },
    items:  [goUpBtn, goCatalogBtn, goElectronicsBtn, goPhonesBtn],
  });

  // ── Outer panel ───────────────────────────────────────────────────────────
  new Panel({
    renderTo: host,
    header:   false,
    layout:   { type: 'vbox', align: 'stretch' },
    items:    [primaryToolbar, navPanel],
  });

  return {
    breadcrumb,
    homeBtn,
    selectionDisplay,
    goUpBtn,
    goCatalogBtn,
    goElectronicsBtn,
    goPhonesBtn,
    rootNode:        root,
    catalogNode:     catalog,
    electronicsNode: electronics,
    phonesNode:      phones,
    laptopsNode:     laptops,
    selectionChangeCount,
    lastSelectedNode,
  };
}

// ---------------------------------------------------------------------------
// Viewport entry point — used by src/App.ts
// ---------------------------------------------------------------------------

export function createViewport(): Viewport {
  const vp = new Viewport({ layout: { type: 'vbox', align: 'stretch' } });
  createBreadcrumbView(vp.getBodyEl());
  return vp;
}
