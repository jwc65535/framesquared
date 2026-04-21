/**
 * @framesquared/ui – component styles
 *
 * Covers: Panel, Button, Toolbar, TabPanel, Window, Menu, Tooltip.
 * Uses CSS custom properties from @framesquared/theme so swapping
 * themes is reflected automatically.
 */

const STYLES = `
/* ── Panel ──────────────────────────────────────────────────────────────── */
.x-panel {
  display: flex;
  flex-direction: column;
  background: var(--ext-color-background, #fff);
  border: 1px solid var(--ext-color-border, rgba(0,0,0,0.12));
  border-radius: var(--x-r-md, 4px);
  box-shadow: var(--ext-shadow-sm, 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08));
  overflow: hidden;
}

.x-panel-noborder {
  border: none;
  box-shadow: none;
}

.x-panel-framed {
  border: 2px solid var(--ext-color-primary, #1976d2);
}

.x-panel-header {
  display: flex;
  align-items: center;
  gap: var(--x-sp-sm, 8px);
  padding: var(--x-sp-sm, 8px) var(--x-sp-md, 16px);
  background: var(--ext-color-primary, #1976d2);
  color: var(--ext-color-text-onPrimary, #ffffff);
  user-select: none;
  flex-shrink: 0;
}

.x-panel-header-title {
  flex: 1;
  min-width: 0;
}

.x-panel-header-text {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.x-panel-header-tools {
  display: flex;
  align-items: center;
  gap: 2px;
}

.x-panel-header-icon {
  width: 16px;
  height: 16px;
  opacity: 0.9;
}

.x-panel-body {
  flex: 1;
  padding: var(--x-sp-md, 16px);
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: var(--x-sp-sm, 8px);
}

.x-panel-footer {
  padding: var(--x-sp-sm, 8px) var(--x-sp-md, 16px);
  background: var(--ext-color-surface, #f5f5f5);
  border-top: 1px solid color-mix(in srgb, var(--ext-color-border, rgba(0,0,0,0.1)) 60%, transparent);
  display: flex;
  align-items: center;
  gap: var(--x-sp-sm, 8px);
}

.x-panel-collapsed .x-panel-body,
.x-panel-collapsed .x-panel-footer {
  display: none;
}

/* ── Panel tools (close / collapse / expand icons) ───────────────────────── */
.x-tool {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--x-r-sm, 2px);
  cursor: pointer;
  opacity: 0.75;
  transition: opacity var(--ext-transition-fast, 0.15s), background var(--ext-transition-fast, 0.15s);
  color: var(--ext-color-text-onPrimary, #ffffff);
  font-size: 12px;
}

.x-tool:hover {
  opacity: 1;
  background: rgba(255,255,255,0.2);
}

.x-tool-close::before  { content: '✕'; }
.x-tool-collapse::before { content: '▲'; font-size: 10px; }
.x-tool-expand::before  { content: '▼'; font-size: 10px; }
.x-tool-maximize::before { content: '⊞'; }
.x-tool-restore::before  { content: '⊟'; }
.x-tool-refresh::before  { content: '↺'; }

/* ── Docked items ────────────────────────────────────────────────────────── */
.x-docked-top    { order: -1; }
.x-docked-bottom { order: 99; }
.x-docked-left   { flex-direction: column; }
.x-docked-right  { flex-direction: column; }

/* ── Button ──────────────────────────────────────────────────────────────── */
.x-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--x-sp-xs, 4px);
  padding: 6px 16px;
  background: var(--ext-color-primary, #1976d2);
  color: var(--ext-color-text-onPrimary, #ffffff);
  border: 1px solid transparent;
  border-radius: var(--x-r-md, 4px);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  transition: background var(--ext-transition-fast, 0.15s), box-shadow var(--ext-transition-fast, 0.15s), opacity var(--ext-transition-fast, 0.15s);
  outline: none;
  -webkit-appearance: none;
}

.x-btn:hover {
  background: color-mix(in srgb, var(--ext-color-primary, #1976d2) 85%, black);
  box-shadow: var(--ext-shadow-sm, 0 1px 3px rgba(0,0,0,0.2));
}

.x-btn:active {
  background: color-mix(in srgb, var(--ext-color-primary, #1976d2) 70%, black);
  box-shadow: none;
}

.x-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ext-color-primary, #1976d2) 40%, transparent);
}

.x-btn.x-btn-disabled,
.x-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}

.x-btn.x-btn-pressed {
  background: color-mix(in srgb, var(--ext-color-primary, #1976d2) 70%, black);
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
}

/* Size variants */
.x-btn-small  { padding: 3px 10px; font-size: 12px; }
.x-btn-large  { padding: 10px 24px; font-size: 16px; }

/* UI variants */
.x-btn-default {
  background: var(--ext-color-surface, #f5f5f5);
  color: var(--ext-color-text-primary, #212121);
  border-color: var(--ext-color-border, rgba(0,0,0,0.2));
}
.x-btn-default:hover {
  background: color-mix(in srgb, var(--ext-color-surface, #f5f5f5) 90%, black);
}

.x-btn-danger {
  background: var(--ext-color-error, #f44336);
}
.x-btn-danger:hover {
  background: color-mix(in srgb, var(--ext-color-error, #f44336) 85%, black);
}

.x-btn-success {
  background: var(--ext-color-success, #4caf50);
}

/* Icon positions */
.x-btn-icon-right  { flex-direction: row-reverse; }
.x-btn-icon-top    { flex-direction: column; }
.x-btn-icon-bottom { flex-direction: column-reverse; }

.x-btn-text { pointer-events: none; }
.x-btn-icon { pointer-events: none; font-size: 16px; }
.x-btn-arrow { font-size: 10px; opacity: 0.7; margin-left: 2px; }
.x-btn-arrow::before { content: '▾'; }
.x-btn-split { border-left: 1px solid rgba(255,255,255,0.3); padding-left: 6px; }

/* ── SegmentedButton ─────────────────────────────────────────────────────── */
.x-segmented-btn {
  display: inline-flex;
  align-items: center;
  border-radius: var(--x-r-md, 4px);
  border: 1px solid color-mix(in srgb, var(--ext-color-primary, #1976d2) 60%, transparent);
  overflow: hidden;
  gap: 0;
}

.x-segmented-btn .x-btn {
  border-radius: 0;
  border: none;
  border-right: 1px solid color-mix(in srgb, var(--ext-color-primary, #1976d2) 60%, transparent);
  flex: 1 0 auto;
}

.x-segmented-btn .x-btn:last-child {
  border-right: none;
}

/* ── Toolbar ─────────────────────────────────────────────────────────────── */
.x-toolbar {
  display: flex;
  align-items: center;
  gap: var(--x-sp-xs, 4px);
  padding: var(--x-sp-xs, 4px) var(--x-sp-sm, 8px);
  background: var(--ext-color-surface, #f5f5f5);
  border-bottom: 1px solid var(--ext-color-border, rgba(0,0,0,0.1));
  flex-shrink: 0;
}

/* Bottom-docked toolbar flips its border to the top */
.x-docked-bottom.x-toolbar {
  border-bottom: none;
  border-top: 1px solid var(--ext-color-border, rgba(0,0,0,0.1));
}

.x-toolbar-fill {
  flex: 1;
}

.x-toolbar-separator {
  width: 1px;
  height: 20px;
  background: rgba(0,0,0,0.15);
  margin: 0 var(--x-sp-xs, 4px);
  flex-shrink: 0;
}

.x-toolbar-spacer {
  width: var(--x-sp-sm, 8px);
  flex-shrink: 0;
}

.x-toolbar-text {
  font-size: 14px;
  color: var(--ext-color-text-secondary, #757575);
  padding: 0 var(--x-sp-xs, 4px);
}

/* ── TabPanel ────────────────────────────────────────────────────────────── */
.x-tabpanel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.x-tabbar {
  display: flex;
  align-items: flex-end;
  background: var(--ext-color-surface, #f5f5f5);
  border-bottom: 2px solid var(--ext-color-primary, #1976d2);
  padding: 0 var(--x-sp-sm, 8px);
  flex-shrink: 0;
}

.x-tabbar-strip {
  display: flex;
  align-items: flex-end;
  gap: 2px;
}

.x-tab {
  display: inline-flex;
  align-items: center;
  gap: var(--x-sp-xs, 4px);
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--ext-color-text-secondary, #757575);
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: var(--x-r-md, 4px) var(--x-r-md, 4px) 0 0;
  cursor: pointer;
  transition: color var(--ext-transition-fast, 0.15s), background var(--ext-transition-fast, 0.15s);
  user-select: none;
  white-space: nowrap;
}

.x-tab:hover {
  color: var(--ext-color-text-primary, #212121);
  background: rgba(0,0,0,0.05);
}

.x-tab.x-tab-active {
  color: var(--ext-color-primary, #1976d2);
  background: var(--ext-color-background, #fff);
  border-color: var(--ext-color-border, rgba(0,0,0,0.12));
  margin-bottom: -2px;
  padding-bottom: 10px;
}

.x-tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 10px;
  opacity: 0.5;
  transition: opacity var(--ext-transition-fast, 0.15s), background var(--ext-transition-fast, 0.15s);
}
.x-tab-close:hover { opacity: 1; background: rgba(0,0,0,0.1); }
.x-tab-close::before { content: '✕'; }

.x-tabpanel-body {
  flex: 1;
  overflow: auto;
}

/* ── Window ──────────────────────────────────────────────────────────────── */
.x-window {
  position: fixed;
  display: flex;
  flex-direction: column;
  background: var(--ext-color-background, #fff);
  border-radius: var(--x-r-lg, 8px);
  box-shadow: var(--ext-shadow-xl, 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22));
  overflow: hidden;
  z-index: var(--ext-zIndex-modal, 1000);
  min-width: 200px;
  min-height: 100px;
}

.x-window-maximized {
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  border-radius: 0;
}

.x-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: calc(var(--ext-zIndex-modal, 1000) - 1);
}

/* ── Menu ────────────────────────────────────────────────────────────────── */
.x-menu {
  display: flex;
  flex-direction: column;
  background: var(--ext-color-background, #fff);
  border: 1px solid var(--ext-color-border, rgba(0,0,0,0.12));
  border-radius: var(--x-r-md, 4px);
  box-shadow: var(--ext-shadow-md, 0 3px 6px rgba(0,0,0,0.16));
  padding: var(--x-sp-xs, 4px) 0;
  min-width: 160px;
  z-index: var(--ext-zIndex-tooltip, 1100);
}

.x-menu-item {
  display: flex;
  align-items: center;
  gap: var(--x-sp-sm, 8px);
  padding: 7px var(--x-sp-md, 16px);
  font-size: 14px;
  color: var(--ext-color-text-primary, #212121);
  cursor: pointer;
  transition: background var(--ext-transition-fast, 0.1s);
  user-select: none;
}

.x-menu-item:hover {
  background: color-mix(in srgb, var(--ext-color-primary, #1976d2) 10%, transparent);
  color: var(--ext-color-primary, #1976d2);
}

.x-menu-item-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  opacity: 0.7;
}

.x-menu-item-text { flex: 1; }

.x-menu-item-arrow {
  font-size: 10px;
  opacity: 0.5;
}
.x-menu-item-arrow::before { content: '›'; font-size: 16px; }

.x-menu-item-separator {
  height: 1px;
  background: var(--ext-color-border, rgba(0,0,0,0.1));
  margin: var(--x-sp-xs, 4px) 0;
}

.x-menu-check-item .x-menu-item-check {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.x-menu-item-checked .x-menu-item-check::before { content: '✓'; font-weight: bold; }

/* ── TreeGrid ────────────────────────────────────────────────────────────── */
.x-treegrid {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--ext-color-background, #fff);
}

.x-treegrid-view {
  flex: 1;
  overflow: auto;
}

.x-treegrid-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  color: var(--ext-color-text-primary, #212121);
  table-layout: fixed;
}

/* ── Column headers ──────────────────────────────────────────────────────── */
.x-treegrid-header-row {
  background: var(--ext-color-surface, #f5f5f5);
  position: sticky;
  top: 0;
  z-index: 1;
}

.x-treegrid-column-header {
  padding: 9px var(--x-sp-md, 16px);
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ext-color-text-secondary, #757575);
  border-bottom: 2px solid var(--ext-color-border, rgba(0,0,0,0.1));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Rows ────────────────────────────────────────────────────────────────── */
.x-treegrid-node {
  transition: background var(--ext-transition-fast, 0.1s);
}

.x-treegrid-node:hover td {
  background: color-mix(in srgb, var(--ext-color-primary, #1976d2) 6%, transparent);
}

.x-treegrid-selected td {
  background: color-mix(in srgb, var(--ext-color-primary, #1976d2) 14%, transparent) !important;
}

.x-treegrid-focused {
  outline: 2px solid var(--ext-color-primary, #1976d2);
  outline-offset: -2px;
}

/* ── Cells ───────────────────────────────────────────────────────────────── */
.x-treegrid-node td.x-grid-cell {
  padding: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--ext-color-border, rgba(0,0,0,0.1)) 50%, transparent);
  vertical-align: middle;
  overflow: hidden;
}

.x-treegrid-node .x-grid-cell-inner {
  padding: 7px var(--x-sp-md, 16px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Tree cell gets no padding — indentation is handled inline by the column */
.x-treegrid-node td.x-treegrid-cell .x-grid-cell-inner {
  padding: 0;
}

/* ── Tree cell inner (indent + expander + icon + text) ───────────────────── */
.x-treegrid-cell-inner {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 7px 8px 7px 0;
  min-width: 0;
}

/* ── Expander ────────────────────────────────────────────────────────────── */
.x-treegrid-expander {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: var(--x-r-sm, 2px);
  cursor: pointer;
  color: var(--ext-color-text-secondary, #757575);
  font-size: 10px;
  transition: color var(--ext-transition-fast, 0.15s), background var(--ext-transition-fast, 0.15s);
  user-select: none;
}

.x-treegrid-expander:hover {
  background: rgba(0,0,0,0.08);
  color: var(--ext-color-primary, #1976d2);
}

.x-treegrid-expander-collapsed::before { content: '▶'; }
.x-treegrid-expander-expanded::before  { content: '▼'; }
.x-treegrid-expander-leaf              { cursor: default; visibility: hidden; }

/* ── Icons ───────────────────────────────────────────────────────────────── */
.x-treegrid-icon {
  display: inline-flex;
  align-items: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  font-size: 14px;
}
.x-treegrid-icon-folder::before      { content: '📁'; }
.x-treegrid-icon-folder-open::before { content: '📂'; }
.x-treegrid-icon-leaf::before        { content: '📄'; }

/* ── Node text ───────────────────────────────────────────────────────────── */
.x-treegrid-node-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Checkbox ────────────────────────────────────────────────────────────── */
.x-treegrid-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 1.5px solid var(--ext-color-text-secondary, rgba(0,0,0,0.3));
  border-radius: var(--x-r-sm, 2px);
  flex-shrink: 0;
  cursor: pointer;
  transition: border-color var(--ext-transition-fast, 0.15s), background var(--ext-transition-fast, 0.15s);
}
.x-treegrid-checkbox:hover {
  border-color: var(--ext-color-primary, #1976d2);
}
.x-treegrid-checkbox-checked {
  background: var(--ext-color-primary, #1976d2);
  border-color: var(--ext-color-primary, #1976d2);
}
.x-treegrid-checkbox-checked::before {
  content: '✓';
  color: var(--ext-color-text-onPrimary, #ffffff);
  font-size: 11px;
  font-weight: bold;
}
.x-treegrid-checkbox-indeterminate {
  background: var(--ext-color-primary, #1976d2);
  border-color: var(--ext-color-primary, #1976d2);
}
.x-treegrid-checkbox-indeterminate::before {
  content: '–';
  color: var(--ext-color-text-onPrimary, #ffffff);
  font-size: 12px;
  font-weight: bold;
}

/* ── Accordion ───────────────────────────────────────────────────────────── */
.x-accordion {
  border-radius: var(--ext-component-accordion-borderRadius, 8px);
  box-shadow: var(--ext-shadow-sm, 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08));
  overflow: hidden;
  font-family: var(--ext-typography-fontFamily-sans, system-ui, sans-serif);
  font-size: var(--ext-typography-fontSize-sm, 14px);
}

.x-accordion-section {
  border-bottom: 1px solid var(--ext-component-accordion-headerBorderColor, #e0e0e0);
}

.x-accordion-section:last-child {
  border-bottom: none;
}

.x-accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--x-sp-sm, 12px) var(--x-sp-md, 16px);
  background: var(--ext-component-accordion-headerBg, #f8f9fa);
  color: var(--ext-component-accordion-headerColor, #212121);
  font-weight: var(--ext-component-accordion-headerFontWeight, 600);
  cursor: pointer;
  user-select: none;
  border-left: 3px solid transparent;
  transition:
    background var(--ext-component-accordion-transition, 200ms ease),
    color      var(--ext-component-accordion-transition, 200ms ease),
    border-color var(--ext-component-accordion-transition, 200ms ease);
}

.x-accordion-header::after {
  content: '';
  display: inline-block;
  width: 7px;
  height: 7px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg) translateY(-2px);
  transition: transform var(--ext-component-accordion-transition, 200ms ease);
  opacity: 0.55;
  flex-shrink: 0;
  margin-left: var(--x-sp-sm, 8px);
}

.x-accordion-header:hover {
  background: var(--ext-component-accordion-headerBgHover, #e9ecef);
}

.x-accordion-section.x-accordion-expanded > .x-accordion-header {
  background: var(--ext-component-accordion-headerBgActive, #e8f0fe);
  color: var(--ext-component-accordion-headerColorActive, #1976d2);
  border-left-color: var(--ext-component-accordion-activeBorderColor, #1976d2);
}

.x-accordion-section.x-accordion-expanded > .x-accordion-header::after {
  transform: rotate(-135deg) translateY(-2px);
  opacity: 1;
}

.x-accordion-body {
  background: var(--ext-component-accordion-bodyBg, #ffffff);
  padding: var(--x-sp-md, 16px);
}
`;

if (typeof document !== 'undefined' && !document.querySelector('[data-x-ui-styles]')) {
  const el = document.createElement('style');
  el.setAttribute('data-x-ui-styles', '');
  el.textContent = STYLES;
  document.head.appendChild(el);
}

export {};
