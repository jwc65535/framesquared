/**
 * @framesquared/form – component styles
 *
 * Covers: Field, TextField, TextArea, NumberField, Checkbox, Radio,
 * ComboBox, DateField, Slider, Tag field, FormPanel.
 */

const STYLES = `
/* ── FormPanel ───────────────────────────────────────────────────────────── */
.x-form {
  display: flex;
  flex-direction: column;
  gap: var(--x-sp-sm, 8px);
}

/* ── Field wrapper ───────────────────────────────────────────────────────── */
.x-field {
  display: flex;
  align-items: flex-start;
  gap: var(--x-sp-sm, 8px);
  margin-bottom: var(--x-sp-xs, 4px);
}

.x-label-top {
  flex-direction: column;
  align-items: stretch;
}

.x-label-right {
  flex-direction: row-reverse;
}

/* ── Label ───────────────────────────────────────────────────────────────── */
.x-field-label {
  display: inline-block;
  min-width: 110px;
  padding-top: 7px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ext-color-text-secondary, #757575);
  flex-shrink: 0;
  line-height: 1.4;
}

.x-label-top .x-field-label {
  padding-top: 0;
  margin-bottom: 4px;
}

/* ── Field body wrapper ──────────────────────────────────────────────────── */
.x-field-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

/* ── Text inputs ─────────────────────────────────────────────────────────── */
.x-field-input {
  width: 100%;
  padding: 6px 10px;
  font-family: inherit;
  font-size: 14px;
  color: var(--ext-color-text-primary, #212121);
  background: var(--ext-color-background, #fff);
  border: 1px solid rgba(0,0,0,0.22);
  border-radius: var(--x-r-md, 4px);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  line-height: 1.4;
  -webkit-appearance: none;
  appearance: none;
}

.x-field-input:hover {
  border-color: rgba(0,0,0,0.4);
}

.x-field-input:focus {
  border-color: var(--ext-color-primary, #1976d2);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ext-color-primary, #1976d2) 20%, transparent);
}

textarea.x-field-input {
  resize: vertical;
  min-height: 80px;
}

/* ── Triggers (clear / search / calendar icons) ──────────────────────────── */
.x-field-body {
  position: relative;
}

.x-field-trigger {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--ext-color-text-secondary, #757575);
  transition: color 0.15s;
  border-left: 1px solid rgba(0,0,0,0.1);
}
.x-field-trigger:hover { color: var(--ext-color-primary, #1976d2); }

.x-trigger-clear::before        { content: '✕'; font-size: 11px; }
.x-trigger-search::before       { content: '🔍'; font-size: 12px; }
.x-trigger-date::before         { content: '📅'; font-size: 12px; }
.x-trigger-expand::before       { content: '▾'; font-size: 13px; font-weight: 700; }
.x-trigger-clock::before        { content: '⏱'; font-size: 13px; }
.x-trigger-spinner-up::before   { content: '▲'; font-size: 8px; }
.x-trigger-spinner-down::before { content: '▼'; font-size: 8px; }

/* ── Spinner: stack up/down triggers vertically ──────────────────────────── */
.x-trigger-spinner-up {
  bottom: 50%;
  border-bottom: 1px solid rgba(0,0,0,0.08);
}
.x-trigger-spinner-down {
  top: 50%;
}

/* ── Padding to prevent typed text hiding behind triggers ────────────────── */
.x-numberfield .x-field-input,
.x-combobox    .x-field-input,
.x-datefield   .x-field-input,
.x-timefield   .x-field-input {
  padding-right: 42px;
}

/* ── Invalid state ───────────────────────────────────────────────────────── */
.x-field-invalid .x-field-input {
  border-color: var(--ext-color-error, #f44336);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ext-color-error, #f44336) 15%, transparent);
}

.x-field-invalid .x-field-label {
  color: var(--ext-color-error, #f44336);
}

.x-field-error {
  font-size: 12px;
  color: var(--ext-color-error, #f44336);
  display: flex;
  align-items: center;
  gap: 4px;
}
.x-field-error::before { content: '⚠'; }

/* ── Checkbox & Radio ────────────────────────────────────────────────────── */
.x-checkbox,
.x-radio {
  display: inline-flex;
  align-items: center;
  gap: var(--x-sp-sm, 8px);
  cursor: pointer;
  user-select: none;
}

.x-checkbox-input,
.x-radio input[type="radio"] {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--ext-color-primary, #1976d2);
  cursor: pointer;
  flex-shrink: 0;
}

.x-checkbox-label,
.x-radio-label {
  font-size: 14px;
  color: var(--ext-color-text-primary, #212121);
}

.x-checkbox-group,
.x-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--x-sp-sm, 8px) var(--x-sp-md, 16px);
}

/* ── Slider ──────────────────────────────────────────────────────────────── */

/* Reset .x-field base styles that don't apply inside a slider */
.x-slider {
  margin-bottom: 0;
  gap: 0;
  align-items: center;
  padding: 7px 10px;
  min-width: 80px;
  box-sizing: border-box;
}

/* Field body becomes a flex row so the track can use flex: 1 */
.x-slider .x-field-body {
  flex-direction: row;
  align-items: center;
  gap: 0;
}

/* ── Track ──────────────────────────────────────────────────── */
.x-slider-track {
  flex: 1;
  height: 6px;
  background: rgba(0,0,0,0.18);
  border-radius: 3px;
  position: relative;
  cursor: pointer;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.18);
}

/* ── Fill ───────────────────────────────────────────────────── */
.x-slider-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 3px;
  background: var(--ext-color-primary, #1976d2);
  pointer-events: none;
  transition: width 0.06s ease-out;
}

/* ── Thumb ──────────────────────────────────────────────────── */
.x-slider-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  background: var(--ext-color-primary, #1976d2);
  border-radius: 50%;
  /* White ring gives definition without a CSS border */
  box-shadow:
    0 0 0 2px white,
    0 1px 4px rgba(0,0,0,0.25);
  cursor: grab;
  transition: width 0.12s ease, height 0.12s ease, box-shadow 0.15s ease;
  z-index: 1;
}

.x-slider-thumb:hover {
  width: 20px;
  height: 20px;
  box-shadow:
    0 0 0 2px white,
    0 1px 4px rgba(0,0,0,0.25),
    0 0 0 6px color-mix(in srgb, var(--ext-color-primary, #1976d2) 22%, transparent);
}

.x-slider-thumb.x-slider-dragging {
  cursor: grabbing;
  width: 18px;
  height: 18px;
  box-shadow:
    0 0 0 2px white,
    0 2px 6px rgba(0,0,0,0.30),
    0 0 0 9px color-mix(in srgb, var(--ext-color-primary, #1976d2) 20%, transparent);
}

/* ── Value label (tooltip above thumb) ─────────────────────── */
.x-slider-value-label {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30,30,30,0.85);
  color: white;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
  letter-spacing: 0.02em;
  backdrop-filter: blur(4px);
}

.x-slider-value-label::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: rgba(30,30,30,0.85);
}

.x-slider-thumb:hover .x-slider-value-label,
.x-slider-thumb.x-slider-dragging .x-slider-value-label {
  opacity: 1;
}

/* ── Vertical variant ───────────────────────────────────────── */
.x-slider-vertical {
  flex-direction: column;
  padding: 10px 7px;
}

.x-slider-vertical .x-field-body {
  flex: 1;
  flex-direction: column;
  align-items: center;
}

.x-slider-vertical .x-slider-track {
  flex: 1;
  width: 4px;
  height: unset;
  min-height: 60px;
}

.x-slider-vertical .x-slider-fill {
  top: auto;
  bottom: 0;
  width: 100%;
  height: 0;
  transition: height 0.06s ease-out;
}

/* ── Tag field ───────────────────────────────────────────────────────────── */
.x-tagfield {
  min-height: 36px;
  padding: 3px 6px;
  border: 1px solid rgba(0,0,0,0.22);
  border-radius: var(--x-r-md, 4px);
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  cursor: text;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.x-tagfield:focus-within {
  border-color: var(--ext-color-primary, #1976d2);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ext-color-primary, #1976d2) 20%, transparent);
}

.x-tagfield-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: color-mix(in srgb, var(--ext-color-primary, #1976d2) 15%, transparent);
  color: var(--ext-color-primary, #1976d2);
  border-radius: 12px;
  font-size: 13px;
}

.x-tagfield-tag-close {
  cursor: pointer;
  font-size: 11px;
  opacity: 0.6;
  transition: opacity 0.15s;
}
.x-tagfield-tag-close:hover { opacity: 1; }
.x-tagfield-tag-close::before { content: '✕'; }

/* ── Combo/BoundList dropdown ────────────────────────────────────────────── */
.x-boundlist {
  background: var(--ext-color-background, #fff);
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: var(--x-r-md, 4px);
  box-shadow: var(--ext-shadow-md, 0 3px 6px rgba(0,0,0,0.16));
  overflow-y: auto;
  max-height: 200px;
  z-index: 1100;
}

.x-boundlist-item {
  padding: 7px var(--x-sp-md, 16px);
  font-size: 14px;
  cursor: pointer;
  transition: background 0.1s;
}
.x-boundlist-item:hover,
.x-boundlist-item-selected {
  background: color-mix(in srgb, var(--ext-color-primary, #1976d2) 10%, transparent);
  color: var(--ext-color-primary, #1976d2);
}

/* ── Date picker ─────────────────────────────────────────────────────────── */
.x-datepicker {
  background: var(--ext-color-background, #fff);
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: var(--x-r-md, 4px);
  box-shadow: var(--ext-shadow-md, 0 3px 6px rgba(0,0,0,0.16));
  padding: var(--x-sp-sm, 8px);
  min-width: 260px;
}

.x-datepicker-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--x-sp-sm, 8px);
}

.x-datepicker-prev,
.x-datepicker-next {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--x-r-sm, 2px);
  transition: background 0.1s;
}
.x-datepicker-prev:hover,
.x-datepicker-next:hover { background: rgba(0,0,0,0.08); }
.x-datepicker-prev::before { content: '‹'; font-size: 18px; }
.x-datepicker-next::before { content: '›'; font-size: 18px; }

.x-datepicker-header {
  font-weight: 600;
  font-size: 14px;
  text-align: center;
}

.x-datepicker-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.x-datepicker-dayname {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--ext-color-text-secondary, #757575);
  padding: 4px;
}

.x-datepicker-cell {
  text-align: center;
  padding: 6px 4px;
  border-radius: var(--x-r-sm, 2px);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.1s;
}
.x-datepicker-cell:hover { background: rgba(0,0,0,0.06); }
.x-datepicker-selected {
  background: var(--ext-color-primary, #1976d2) !important;
  color: #fff;
  border-radius: var(--x-r-sm, 2px);
}
.x-datepicker-disabled { color: var(--ext-color-text-disabled, #bdbdbd); pointer-events: none; }
.x-datepicker-blank { visibility: hidden; }

.x-datepicker-today {
  display: block;
  text-align: center;
  padding: var(--x-sp-xs, 4px);
  margin-top: var(--x-sp-xs, 4px);
  font-size: 13px;
  color: var(--ext-color-primary, #1976d2);
  cursor: pointer;
  border-top: 1px solid rgba(0,0,0,0.08);
}
.x-datepicker-today:hover { text-decoration: underline; }

/* ── Display field ───────────────────────────────────────────────────────── */
.x-display-field-value {
  padding: 6px 0;
  font-size: 14px;
  color: var(--ext-color-text-primary, #212121);
}

/* ── File upload ─────────────────────────────────────────────────────────── */
.x-filefield {
  display: flex;
  gap: var(--x-sp-sm, 8px);
  align-items: center;
}
.x-filefield-text {
  flex: 1;
  font-size: 14px;
  color: var(--ext-color-text-secondary, #757575);
  padding: 6px 10px;
  border: 1px solid rgba(0,0,0,0.22);
  border-radius: var(--x-r-md, 4px);
  background: var(--ext-color-surface, #f5f5f5);
}
.x-filefield-btn {
  padding: 6px 14px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--ext-color-primary, #1976d2);
  background: color-mix(in srgb, var(--ext-color-primary, #1976d2) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--ext-color-primary, #1976d2) 40%, transparent);
  border-radius: var(--x-r-md, 4px);
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s;
}
.x-filefield-btn:hover {
  background: color-mix(in srgb, var(--ext-color-primary, #1976d2) 18%, transparent);
  border-color: var(--ext-color-primary, #1976d2);
}
`;

if (typeof document !== 'undefined') {
  const existing = document.querySelector<HTMLStyleElement>('[data-x-form-styles]');
  if (existing) {
    existing.textContent = STYLES;
  } else {
    const el = document.createElement('style');
    el.setAttribute('data-x-form-styles', '');
    el.textContent = STYLES;
    document.head.appendChild(el);
  }
}

export {};
