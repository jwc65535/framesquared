/**
 * @framesquared/grid – component styles
 *
 * Covers: Grid, GridView, HeaderContainer, TreePanel.
 */

const STYLES = `
/* ── Grid container ──────────────────────────────────────────────────────── */
.x-grid {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--ext-color-background, #fff);
}

/* ── Table ───────────────────────────────────────────────────────────────── */
.x-grid-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  color: var(--ext-color-text-primary, #212121);
}

/* ── Header ──────────────────────────────────────────────────────────────── */
.x-grid-header-row {
  background: var(--ext-color-surface, #f5f5f5);
}

.x-column-header {
  padding: 9px var(--x-sp-md, 16px);
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ext-color-text-secondary, #757575);
  border-bottom: 2px solid rgba(0,0,0,0.1);
  white-space: nowrap;
  user-select: none;
  cursor: default;
}

.x-column-header[data-sortable="true"],
.x-column-header.sortable {
  cursor: pointer;
}
.x-column-header:hover {
  background: rgba(0,0,0,0.04);
}

.x-column-header-sort-ASC::after  { content: ' ↑'; color: var(--ext-color-primary, #1976d2); }
.x-column-header-sort-DESC::after { content: ' ↓'; color: var(--ext-color-primary, #1976d2); }

/* ── Body rows ───────────────────────────────────────────────────────────── */
.x-grid-row {
  transition: background 0.1s;
}

.x-grid-row-alt {
  background: color-mix(in srgb, var(--ext-color-surface, #f5f5f5) 50%, transparent);
}

.x-grid-row:hover td {
  background: color-mix(in srgb, var(--ext-color-primary, #1976d2) 6%, transparent);
}

.x-grid-row-selected td {
  background: color-mix(in srgb, var(--ext-color-primary, #1976d2) 14%, transparent) !important;
}

/* ── Cells ───────────────────────────────────────────────────────────────── */
.x-grid-cell {
  padding: 9px var(--x-sp-md, 16px);
  border-bottom: 1px solid rgba(0,0,0,0.06);
  vertical-align: middle;
  max-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
.x-grid-empty {
  padding: var(--x-sp-xl, 32px) var(--x-sp-md, 16px);
  text-align: center;
  color: var(--ext-color-text-disabled, #bdbdbd);
  font-style: italic;
  font-size: 14px;
}

/* ── Selection checkboxes ────────────────────────────────────────────────── */
.x-grid-header-checker,
.x-grid-row-checker {
  width: 36px;
  text-align: center;
  padding-left: 12px;
  padding-right: 12px;
}

.x-grid-cell-selected {
  background: color-mix(in srgb, var(--ext-color-primary, #1976d2) 14%, transparent) !important;
}

/* ── TreePanel ───────────────────────────────────────────────────────────── */
.x-treepanel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--ext-color-background, #fff);
}

.x-tree-body {
  flex: 1;
  overflow: auto;
}

.x-tree-node {
  display: flex;
  align-items: center;
  padding: 5px var(--x-sp-sm, 8px);
  font-size: 14px;
  cursor: pointer;
  user-select: none;
  transition: background 0.1s;
  border-radius: var(--x-r-sm, 2px);
}

.x-tree-node:hover {
  background: color-mix(in srgb, var(--ext-color-primary, #1976d2) 8%, transparent);
}

.x-tree-indent {
  display: inline-block;
  flex-shrink: 0;
}

.x-tree-expander {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  font-size: 10px;
  color: var(--ext-color-text-secondary, #757575);
  transition: transform 0.15s;
  border-radius: var(--x-r-sm, 2px);
}
.x-tree-expander:hover { background: rgba(0,0,0,0.08); }
.x-tree-expander::before { content: '▶'; }

/* When arrows are used */
.x-tree-arrows .x-tree-expander::before { content: '▸'; }

/* Rotated when expanded — toggled by JS adding a class or inline style.
   Components should add x-tree-node-expanded to the row element. */
.x-tree-node-expanded > .x-tree-expander,
.x-tree-node[data-expanded="true"] .x-tree-expander {
  transform: rotate(90deg);
}

.x-tree-expander-spacer {
  display: inline-block;
  width: 18px;
  flex-shrink: 0;
}

.x-tree-icon {
  display: inline-flex;
  align-items: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-right: 4px;
  font-size: 14px;
}
.x-tree-icon-folder::before { content: '📁'; }
.x-tree-icon-leaf::before   { content: '📄'; }

.x-tree-node-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.x-tree-checkbox {
  margin-right: 4px;
  accent-color: var(--ext-color-primary, #1976d2);
}

/* Lines variant */
.x-tree-lines .x-tree-node {
  border-left: 1px dashed rgba(0,0,0,0.15);
  margin-left: 9px;
}
`;

if (typeof document !== 'undefined' && !document.querySelector('[data-x-grid-styles]')) {
  const el = document.createElement('style');
  el.setAttribute('data-x-grid-styles', '');
  el.textContent = STYLES;
  document.head.appendChild(el);
}

export {};
