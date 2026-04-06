/**
 * @framesquared/ui – component styles
 *
 * Covers: Panel, Button, Toolbar, TabPanel, Window, Menu, Tooltip.
 * Uses CSS custom properties from @framesquared/theme so swapping
 * themes is reflected automatically.
 */

const CSS = `
/* ── Panel ──────────────────────────────────────────────────────────────── */
.x-panel {
  display: flex;
  flex-direction: column;
  background: var(--ext-color-background, #fff);
  border: 1px solid rgba(0, 0, 0, 0.12);
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
  color: #fff;
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
  border-top: 1px solid rgba(0,0,0,0.08);
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
  transition: opacity 0.15s, background 0.15s;
  color: #fff;
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
  color: #fff;
  border: 1px solid transparent;
  border-radius: var(--x-r-md, 4px);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.15s, box-shadow 0.15s, opacity 0.15s;
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
  border-color: rgba(0,0,0,0.2);
}
.x-btn-default:hover {
  background: #e8e8e8;
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

/* ── Toolbar ─────────────────────────────────────────────────────────────── */
.x-toolbar {
  display: flex;
  align-items: center;
  gap: var(--x-sp-xs, 4px);
  padding: var(--x-sp-xs, 4px) var(--x-sp-sm, 8px);
  background: var(--ext-color-surface, #f5f5f5);
  border-bottom: 1px solid rgba(0,0,0,0.1);
  flex-shrink: 0;
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
  transition: color 0.15s, background 0.15s;
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
  border-color: rgba(0,0,0,0.12);
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
  transition: opacity 0.15s, background 0.15s;
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
  z-index: 1000;
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
  z-index: 999;
}

/* ── Menu ────────────────────────────────────────────────────────────────── */
.x-menu {
  display: flex;
  flex-direction: column;
  background: var(--ext-color-background, #fff);
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: var(--x-r-md, 4px);
  box-shadow: var(--ext-shadow-md, 0 3px 6px rgba(0,0,0,0.16));
  padding: var(--x-sp-xs, 4px) 0;
  min-width: 160px;
  z-index: 1100;
}

.x-menu-item {
  display: flex;
  align-items: center;
  gap: var(--x-sp-sm, 8px);
  padding: 7px var(--x-sp-md, 16px);
  font-size: 14px;
  color: var(--ext-color-text-primary, #212121);
  cursor: pointer;
  transition: background 0.1s;
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
  background: rgba(0,0,0,0.1);
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
`;

if (typeof document !== 'undefined' && !document.querySelector('[data-x-ui-styles]')) {
  const el = document.createElement('style');
  el.setAttribute('data-x-ui-styles', '');
  el.textContent = CSS;
  document.head.appendChild(el);
}
