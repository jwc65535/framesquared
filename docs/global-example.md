# Global Example Conventions

This document catalogues CSS, JavaScript, and structural patterns that appear repeatedly across example pages in the `examples/` directory. Anything listed here belongs in a shared layer — a shared stylesheet, a utility module, or framework-level documentation — rather than being copy-pasted into every example.

---

## 1. HTML Boilerplate

Every standalone example follows this shell:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>framesquared — [Example Title]</title>
  <!-- Google Fonts (see §3) -->
  <!-- <style> block (see §4) -->
</head>
<body>
  <!-- <script type="importmap"> (see §2) -->
  <!-- <script type="module"> -->
</body>
</html>
```

---

## 2. Import Maps

### CDN variant (public / tutorial examples)

```json
{
  "imports": {
    "@framesquared/ui":        "https://esm.sh/@framesquared/ui",
    "@framesquared/theme":     "https://esm.sh/@framesquared/theme",
    "@framesquared/layout":    "https://esm.sh/@framesquared/layout",
    "@framesquared/component": "https://esm.sh/@framesquared/component",
    "@framesquared/core":      "https://esm.sh/@framesquared/core"
  }
}
```

### Local variant (monorepo dev examples)

```json
{
  "imports": {
    "@framesquared/ui":        "../../packages/ui/dist/index.js",
    "@framesquared/component": "../../packages/component/dist/index.js",
    "@framesquared/core":      "../../packages/core/dist/index.js",
    "@framesquared/theme":     "../../packages/theme/dist/index.js",
    "@framesquared/layout":    "../../packages/layout/dist/index.js",
    "@framesquared/data":      "../../packages/data/dist/index.js",
    "@framesquared/grid":      "../../packages/grid/dist/index.js",
    "@framesquared/form":      "../../packages/form/dist/index.js",
    "@framesquared/app":       "../../packages/app/dist/index.js"
  }
}
```

Add only the packages that the specific example actually imports.

---

## 3. Google Fonts

Every styled example loads the same two font families:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
```

Some examples also use **Cascadia Code** or **JetBrains Mono** as alternatives for the code font. `Inter` is always the body font; any monospace font is acceptable for code blocks.

CSS font stacks:

```css
body      { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
code, pre { font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace; }
```

---

## 4. Global CSS Reset & Base Styles

Appears verbatim in every standalone example:

```css
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f0f2f5;
  color: #212121;
  min-height: 100vh;
}
```

Some examples that support a dark theme replace the hard-coded body background with:

```css
body { background: var(--ext-color-background, #f0f2f5); }
```

---

## 5. Framework Bootstrap (JS)

### Theme registration

Must appear before any component is instantiated:

```js
import { ThemeManager, ModernTheme } from '@framesquared/theme';

ThemeManager.register(ModernTheme);
ThemeManager.setTheme('modern');
```

For examples that ship a dark-mode toggle:

```js
import { ThemeManager, ModernTheme, DarkTheme } from '@framesquared/theme';

ThemeManager.register(ModernTheme);
ThemeManager.register(DarkTheme);
ThemeManager.setTheme('modern');
```

### Application launch (Vite / full-app examples)

```js
import { Application } from '@framesquared/app';
import { ThemeManager, ModernTheme } from '@framesquared/theme';
import { LocaleManager } from '@framesquared/core';

Application.launch(() => {
  ThemeManager.register(ModernTheme);
  ThemeManager.setTheme('modern');
  // build ViewModel, Store, root component, render to document.body
});
```

---

## 6. Page Layout

### `.page-header` — gradient banner

```css
.page-header {
  background: linear-gradient(135deg, #1e2433 0%, #2d3450 100%);
  /* colour varies per example — see §6.1 */
  color: #fff;
  padding: 32px 40px 28px;
  border-radius: 12px;
  margin-bottom: 24px;
}
.page-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.9);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 20px;
  margin-bottom: 12px;
}
.page-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 6px;
  letter-spacing: -0.02em;
}
.page-subtitle {
  font-size: 14px;
  color: rgba(255,255,255,0.7);
  line-height: 1.5;
}
```

#### 6.1 Page-header colour catalogue

| Example | Gradient |
|---------|----------|
| basic-treegrid, async-treegrid, drag-drop, selection, sorting-filtering | `#1e2433 → #2d3450` (dark navy, default) |
| cell-editing-treegrid | `#1a2640 → #2a3f6e` (deep blue) |
| checkbox-treegrid | `#1e2433 → #2d3450` (navy) |
| clipboard-treegrid | `#1a2640 → #2a3f6e` (orange accent `#f59e0b`) |
| export-treegrid | `#1e1b4b → #312e81` (indigo) |
| state-persistence-treegrid | `#0f1f1a → #1a3a2e` (dark teal) |
| summary-treegrid | `#0a1f0a → #1a3a1a` (dark green) |
| theme-switching-treegrid | `#1a1040 → #2d1b69` (purple) |
| row-editing-treegrid | `#0d1117 → #1e2433` (near-black) |
| locked-columns-treegrid | `#1e2433 → #2d3450` (navy) |

### `.page-body` — max-width content well

```css
.page-body {
  max-width: 1100px;  /* some examples use 1200px or 1400px */
  margin: 0 auto;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
```

---

## 7. Grid Wrapper

Strips the default Panel chrome and provides a card-like container for every TreeGrid:

```css
.grid-wrapper {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06);
  overflow: hidden;
}
/* remove Panel/Grid default borders when inside the wrapper */
.grid-wrapper .x-panel {
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}
```

---

## 8. Toolbar Row

Appears above or below the grid in almost every example:

```css
.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e8eaed;
}
.toolbar-label {
  font-size: 13px;
  font-weight: 600;
  color: #3c4043;
}
.toolbar-actions {
  display: flex;
  gap: 8px;
}
```

---

## 9. Source Code Block

### Visual structure

Every standalone example has a dark source-code panel below the live demo, styled consistently:

```css
.source-section {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  overflow: hidden;
}
.source-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #1e2433;
  border-bottom: 1px solid #2d3450;
}
/* macOS traffic-light dots */
.source-dot {
  width: 12px; height: 12px;
  border-radius: 50%;
}
.source-dot.red   { background: #ff5f57; }
.source-dot.yel   { background: #febc2e; }
.source-dot.grn   { background: #28c840; }

.source-filename {
  margin-left: 8px;
  font-size: 12px;
  font-family: 'Fira Code', monospace;
  color: rgba(255,255,255,0.6);
}
.source-copy-btn {
  margin-left: auto;
  padding: 4px 12px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 4px;
  color: rgba(255,255,255,0.7);
  font-size: 11px;
  cursor: pointer;
}
.source-copy-btn:hover { background: rgba(255,255,255,0.2); }
.source-pre {
  margin: 0;
  padding: 20px 24px;
  background: #282c3e;
  overflow-x: auto;
  font-size: 12.5px;
  line-height: 1.7;
  font-family: 'Fira Code', monospace;
  color: #abb2bf;
}
```

### One Dark syntax token classes

Used by `buildSourceBlock()` (see §10):

```css
.tok-kw   { color: #c678dd; }  /* keyword */
.tok-str  { color: #98c379; }  /* string */
.tok-num  { color: #d19a66; }  /* number */
.tok-cmt  { color: #5c6370; font-style: italic; } /* comment */
.tok-fn   { color: #61afef; }  /* function / identifier */
.tok-op   { color: #56b6c2; }  /* operator / punctuation */
.tok-cls  { color: #e5c07b; }  /* class name */
.tok-prop { color: #e06c75; }  /* property */
```

---

## 10. `buildSourceBlock()` — JS Syntax Highlighter IIFE

This self-contained IIFE is duplicated verbatim in every standalone example. It should be extracted into a shared utility (e.g. `examples/shared/source-block.js`):

```js
(function buildSourceBlock() {
  const src = document.getElementById('page-source');
  if (!src) return;

  const raw = src.textContent;

  // dedent
  const lines = raw.split('\n');
  if (lines[0].trim() === '') lines.shift();
  if (lines[lines.length - 1].trim() === '') lines.pop();
  const indent = lines.reduce((min, l) => {
    if (!l.trim()) return min;
    const m = l.match(/^(\s+)/);
    return m ? Math.min(min, m[1].length) : 0;
  }, Infinity);
  const dedented = lines.map(l => l.slice(indent === Infinity ? 0 : indent)).join('\n');

  // tokenise (character-by-character)
  const KW = new Set([
    'import','export','from','const','let','var','function','class','extends',
    'return','new','if','else','for','of','in','while','do','switch','case',
    'break','continue','default','try','catch','finally','throw','typeof',
    'instanceof','void','delete','this','super','null','undefined','true','false',
    'async','await','static','get','set'
  ]);

  function tokenize(code) {
    let out = '', i = 0;
    while (i < code.length) {
      // line comment
      if (code[i] === '/' && code[i+1] === '/') {
        let j = i; while (j < code.length && code[j] !== '\n') j++;
        out += `<span class="tok-cmt">${esc(code.slice(i, j))}</span>`; i = j; continue;
      }
      // block comment
      if (code[i] === '/' && code[i+1] === '*') {
        let j = i + 2; while (j < code.length && !(code[j-1] === '*' && code[j] === '/')) j++;
        out += `<span class="tok-cmt">${esc(code.slice(i, j+1))}</span>`; i = j + 1; continue;
      }
      // string / template literal
      if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
        const q = code[i]; let j = i + 1;
        while (j < code.length && code[j] !== q) { if (code[j] === '\\') j++; j++; }
        out += `<span class="tok-str">${esc(code.slice(i, j+1))}</span>`; i = j + 1; continue;
      }
      // identifier / keyword
      if (/[a-zA-Z_$]/.test(code[i])) {
        let j = i; while (j < code.length && /[\w$]/.test(code[j])) j++;
        const word = code.slice(i, j);
        const next = code[j];
        if (KW.has(word)) {
          out += `<span class="tok-kw">${esc(word)}</span>`;
        } else if (next === '(') {
          out += `<span class="tok-fn">${esc(word)}</span>`;
        } else if (/[A-Z]/.test(word[0])) {
          out += `<span class="tok-cls">${esc(word)}</span>`;
        } else {
          out += esc(word);
        }
        i = j; continue;
      }
      // number
      if (/[0-9]/.test(code[i])) {
        let j = i; while (j < code.length && /[\d._xXa-fA-F]/.test(code[j])) j++;
        out += `<span class="tok-num">${esc(code.slice(i, j))}</span>`; i = j; continue;
      }
      // operator
      if (/[+\-*/%=<>!&|^~?:.,;@]/.test(code[i])) {
        out += `<span class="tok-op">${esc(code[i])}</span>`; i++; continue;
      }
      out += esc(code[i++]);
    }
    return out;
  }

  function esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  const pre = document.querySelector('.source-pre');
  if (pre) pre.innerHTML = tokenize(dedented);

  const btn = document.querySelector('.source-copy-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(dedented).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 1500);
      });
    });
  }
})();
```

The `<script id="page-source" type="text/plain">` tag holds the raw source to be highlighted. Its contents are set by the page itself.

---

## 11. Shared JS Utility Functions

These small helpers are redefined in every example and should live in a shared utility module:

### HTML escaper

```js
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
```

### Null / empty-value placeholder

```js
const NULL_CELL = '<span style="color:#bdbdbd">—</span>';
```

Used as a fallback renderer: `renderer: v => v ?? NULL_CELL`

### Date formatter

```js
function fmtDate(iso) {
  if (!iso) return NULL_CELL;
  return new Date(iso).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
}
```

### File-size formatter

```js
function fmtSize(bytes) {
  if (bytes == null) return NULL_CELL;
  if (bytes < 1024)       return bytes + ' B';
  if (bytes < 1048576)    return (bytes / 1024).toFixed(1)  + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}
```

### Duration formatter

```js
function fmtDuration(ms) {
  if (ms == null) return NULL_CELL;
  if (ms < 1000)  return ms + ' ms';
  if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
  const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}
```

---

## 12. Type / File-extension Badges

A `.type-badge` element with a `data-type` or modifier class is used in virtually every file-system example. The full palette:

```css
.type-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
/* document */
.type-badge.pdf   { background: #fce8e8; color: #c62828; }
.type-badge.word  { background: #e3f0fb; color: #1565c0; }
.type-badge.excel { background: #e6f4ea; color: #2e7d32; }
/* data */
.type-badge.json  { background: #fff3e0; color: #e65100; }
.type-badge.csv   { background: #e8f5e9; color: #388e3c; }
.type-badge.tsv   { background: #f3e5f5; color: #7b1fa2; }
.type-badge.xml   { background: #fce4ec; color: #c2185b; }
/* web */
.type-badge.html  { background: #fff8e1; color: #f57f17; }
.type-badge.css   { background: #e8eaf6; color: #3949ab; }
.type-badge.js    { background: #fffde7; color: #f9a825; }
.type-badge.ts    { background: #e3f2fd; color: #1976d2; }
/* image */
.type-badge.jpeg,
.type-badge.jpg   { background: #f3e5f5; color: #7b1fa2; }
.type-badge.png   { background: #e8eaf6; color: #303f9f; }
.type-badge.gif   { background: #fce4ec; color: #d81b60; }
.type-badge.svg   { background: #e0f7fa; color: #00838f; }
/* media */
.type-badge.mp3,
.type-badge.flac  { background: #f3e5f5; color: #6a1b9a; }
.type-badge.m3u   { background: #ede7f6; color: #4527a0; }
/* archive / binary */
.type-badge.zip   { background: #f5f5f5; color: #616161; }
.type-badge.dmg   { background: #fafafa; color: #424242; }
.type-badge.exe,
.type-badge.pkg   { background: #e8f5e9; color: #1b5e20; }
.type-badge.sh    { background: #e0f2f1; color: #004d40; }
/* folder */
.type-badge.folder { background: #fff9c4; color: #f57f17; }
```

---

## 13. Status / Priority Badges

Generic badge pattern for status labels (used in drag-drop, row-editing, summary, checkbox examples):

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}
/* priority */
.badge.high      { background: #fce8e8; color: #c62828; }
.badge.medium    { background: #fff3e0; color: #e65100; }
.badge.low       { background: #e6f4ea; color: #2e7d32; }
/* status */
.badge.active,
.badge.in-progress { background: #e3f0fb; color: #1565c0; }
.badge.complete,
.badge.done      { background: #e6f4ea; color: #2e7d32; }
.badge.pending   { background: #fff9c4; color: #f57f17; }
.badge.blocked,
.badge.cancelled { background: #fce8e8; color: #c62828; }
.badge.review    { background: #f3e5f5; color: #7b1fa2; }
```

---

## 14. Dark Log / Terminal Panel

Used in async-treegrid (network log), cell-editing (edit log), drag-drop (drop log), row-editing (edit log):

```css
.log-panel {
  background: #1a1d2e;
  border-radius: 8px;
  overflow: hidden;
  font-family: 'Fira Code', monospace;
}
.log-header {
  padding: 10px 14px;
  background: #13151f;
  color: #8b9dc3;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-bottom: 1px solid #252a3a;
}
.log-body {
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
/* entry variants */
.log-entry         { font-size: 11.5px; line-height: 1.5; }
.log-entry.success { color: #98c379; }
.log-entry.info    { color: #61afef; }
.log-entry.warning { color: #e5c07b; }
.log-entry.error   { color: #e06c75; }
.log-entry.muted   { color: #5c6370; }
.log-ts            { color: #5c6370; margin-right: 8px; }
```

---

## 15. Toast Notification

Fixed bottom-right error/info notification, used in cell-editing and row-editing:

```css
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #323232;
  color: #fff;
  padding: 10px 18px;
  border-radius: 6px;
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.2s, transform 0.2s;
  pointer-events: none;
  z-index: 9999;
}
.toast.show { opacity: 1; transform: translateY(0); }
.toast.error   { border-left: 3px solid #e06c75; }
.toast.success { border-left: 3px solid #98c379; }
.toast.warning { border-left: 3px solid #e5c07b; }
```

JS helper:

```js
function showToast(msg, type = 'info', duration = 3000) {
  const t = document.querySelector('.toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), duration);
}
```

---

## 16. Hint Strip (keyboard key badges)

Appears in cell-editing and row-editing examples to surface keyboard shortcuts:

```css
.hint-strip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: #f8f9fb;
  border-top: 1px solid #e8eaed;
  font-size: 12px;
  color: #5f6368;
  flex-wrap: wrap;
}
.hint-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 7px;
  background: #fff;
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-size: 11px;
  font-family: 'Fira Code', monospace;
  font-weight: 500;
  color: #3c4043;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  min-width: 24px;
}
```

---

## 17. Settings Strip

Control bar that hosts range sliders, selects, or checkboxes above/below the grid:

```css
.settings-strip {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e8eaed;
  flex-wrap: wrap;
}
.setting-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.setting-label {
  font-size: 12px;
  font-weight: 500;
  color: #5f6368;
  white-space: nowrap;
}
.setting-value {
  font-size: 12px;
  font-weight: 600;
  color: #1a73e8;
  min-width: 36px;
  text-align: right;
}
/* range input */
input[type="range"] {
  -webkit-appearance: none;
  height: 4px;
  background: #e8eaed;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px; height: 14px;
  background: #1a73e8;
  border-radius: 50%;
}
```

---

## 18. Mode Pills / Tab Pills

Used in selection-treegrid and similar examples to switch between named modes:

```css
.mode-pills {
  display: flex;
  gap: 4px;
  background: #f1f3f4;
  padding: 3px;
  border-radius: 8px;
}
.mode-pill {
  padding: 5px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #5f6368;
  cursor: pointer;
  border: none;
  background: transparent;
  transition: all 0.15s;
}
.mode-pill.active {
  background: #fff;
  color: #1a73e8;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
}
```

---

## 19. Chip / Toggle Chip

Compact inline toggle or label; used for column locks, feature toggles, filter chips, export chips:

```css
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}
/* default / neutral */
.chip          { background: #f1f3f4; color: #3c4043; border-color: #e8eaed; }
.chip.active   { background: #e8f0fe; color: #1967d2; border-color: #aecbfa; }
.chip.locked   { background: #fce8e8; color: #c62828; border-color: #f5c6c6; }
.chip.high     { background: #fce8e8; color: #c62828; }
.chip.medium   { background: #fff3e0; color: #e65100; }
.chip.low      { background: #e6f4ea; color: #2e7d32; }
```

---

## 20. Filter Bar

Used in sorting-filtering-treegrid and export-treegrid:

```css
.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #fff;
  border-bottom: 1px solid #e8eaed;
  flex-wrap: wrap;
}
.filter-search-wrap {
  position: relative;
  flex: 1;
  min-width: 180px;
}
.filter-search {
  width: 100%;
  padding: 6px 10px 6px 30px;
  border: 1px solid #dadce0;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
}
.filter-search:focus { border-color: #1a73e8; box-shadow: 0 0 0 2px rgba(26,115,232,0.15); }
.filter-select {
  padding: 6px 10px;
  border: 1px solid #dadce0;
  border-radius: 6px;
  font-size: 12px;
  color: #3c4043;
  background: #fff;
  cursor: pointer;
}
.filter-clear-btn {
  padding: 6px 12px;
  border: 1px solid #e8eaed;
  border-radius: 6px;
  font-size: 12px;
  color: #5f6368;
  background: #f8f9fb;
  cursor: pointer;
}
.filter-clear-btn:hover { background: #f1f3f4; }
```

---

## 21. Showcase App CSS (tree-grid/shared/styles.css)

The `examples/tree-grid/shared/styles.css` file is a comprehensive component stylesheet for the multi-tab showcase app. It is **not** part of the framework bundle itself, but serves as the reference implementation for how to build a full-page framesquared application shell. Key sections:

### CSS Custom Properties

```css
:root {
  --sidebar-width: 260px;
  --header-height: 56px;
  --accent: #5b6af0;
  --accent-light: #eef0ff;
  --text-primary: #1a1d23;
  --text-secondary: #6b7280;
  --border: #e5e7eb;
  --surface: #ffffff;
  --surface-alt: #f9fafb;
}
```

### Layout skeleton

```css
.app-shell   { display: grid; grid-template-rows: var(--header-height) 1fr; height: 100vh; }
.app-header  { background: var(--surface); border-bottom: 1px solid var(--border); }
.app-body    { display: grid; grid-template-columns: var(--sidebar-width) 1fr; overflow: hidden; }
.app-sidebar { background: var(--surface); border-right: 1px solid var(--border); overflow-y: auto; }
.app-content { overflow: auto; padding: 24px; }
```

### Component overrides

The file contains theme-level overrides for: `.x-treegrid`, `.x-panel`, `.x-grid-row`, `.x-grid-cell`, `.x-treegrid-expander`, `.x-treegrid-icon`, `.x-treegrid-checkbox`, `.x-treegrid-elbow`, and the DnD ghost/indicator classes. These should serve as the canonical reference when authoring theme overrides in the framework.

### Dark theme

The showcase uses `[data-theme='dark']` attribute on `<html>` to switch CSS custom properties:

```css
[data-theme='dark'] {
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --border: #2d3748;
  --surface: #1e2433;
  --surface-alt: #252d3d;
}
```

---

## 22. CSS Variable Tokens (framesquared theme layer)

The framework exposes the following CSS custom properties through `ThemeManager`. Examples reference these for components that must adapt to theme switching:

| Variable | Purpose |
|---|---|
| `--ext-color-primary` | Brand/accent colour |
| `--ext-color-text` | Default text |
| `--ext-color-text-secondary` | Muted / label text |
| `--ext-color-text-disabled` | Disabled text |
| `--ext-color-border` | Default border |
| `--ext-color-surface` | Card / panel background |
| `--ext-color-background` | Page background |
| `--ext-color-hover` | Row/item hover fill |
| `--ext-color-selected` | Row/item selected fill |

Use these instead of hard-coded hex values in any component-level style that needs to honour theme changes.

---

## 23. Drag-and-Drop Plugin CSS Overrides

Used whenever `TreeGridDragDrop` plugin is active:

```css
.x-treegrid-drag-ghost {
  background: #fff;
  border: 1px solid #1a73e8;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  opacity: 0.9;
}
.x-treegrid-drop-indicator {
  background: #1a73e8;
  height: 2px;
  border-radius: 1px;
}
.x-treegrid-drop-highlight {
  background: rgba(26, 115, 232, 0.08) !important;
  outline: 1px solid #1a73e8;
}
```

---

## 24. ViewModel Pattern

Standard ViewModel structure with derived formulas used across admin-dashboard, basic-app, and any example with dynamic stats:

```js
import { ViewModel } from '@framesquared/core';

const vm = new ViewModel({
  data: {
    records: [],
    filterText: '',
    selectedId: null,
  },
  formulas: {
    filteredRecords: {
      bind: ['records', 'filterText'],
      get({ records, filterText }) {
        const q = filterText.toLowerCase();
        return q ? records.filter(r => r.name.toLowerCase().includes(q)) : records;
      }
    },
    totalCount: {
      bind: ['records'],
      get({ records }) { return records.length; }
    }
  }
});
```

---

## 25. Model / Store / TreeStore Patterns

### Flat store

```js
import { Model, Store } from '@framesquared/data';

const ContactModel = new Model({
  fields: ['id', 'name', 'email', 'phone', 'status']
});

const store = new Store({ model: ContactModel });
store.loadData([{ id: 1, name: 'Alice', email: 'alice@example.com' }]);
```

### Hierarchical tree store

```js
import { TreeStore, TreeModel } from '@framesquared/data';

const FileModel = new Model({
  fields: ['id', 'name', 'size', 'type', 'modified']
});

const store = new TreeStore({ model: FileModel });

// Manual node construction
const root = TreeModel.create({ name: 'root', type: 'folder' });
TreeModel.applyNodeInterface(root);
root.appendChild(TreeModel.create({ name: 'file.txt', type: 'txt', size: 1024 }));
store.setRoot(root);
```

### Async store with loader

```js
const store = new TreeStore({
  model: FileModel,
  loader: {
    async load(node) {
      const resp = await fetch(`/api/files?parent=${node.id}`);
      return resp.json();
    }
  }
});
```

---

## 26. Plugins Reference

| Plugin class | Package | Purpose |
|---|---|---|
| `TreeGridCellEditing` | `@framesquared/grid` | Inline cell editing (double-click or F2) |
| `TreeGridDragDrop` | `@framesquared/grid` | Drag rows to reorder / reparent |
| `TreeGridClipboard` | `@framesquared/grid` | Copy/paste rows as TSV |
| `TreeGridLockable` | `@framesquared/grid` | Lock columns left/right |
| `TreeGridStateMixin` | `@framesquared/grid` | Persist column widths, sort state to localStorage |
| `TreeGridExporter` | `@framesquared/grid` | Export to CSV / TSV / JSON |

Plugin registration:

```js
const grid = new TreeGrid({
  plugins: [
    new TreeGridCellEditing(),
    new TreeGridDragDrop({ allowParentDrop: true }),
    new TreeGridClipboard(),
  ],
  // ...
});
```

---

## 27. MVC Controller Pattern

From `examples/hello-world-mvc` and `examples/basic-manual-app`:

```js
import { Controller } from '@framesquared/ui';

class MyController extends Controller {
  init() {
    // wire up DOM listeners after render
    document.getElementById('my-btn')
      .addEventListener('click', () => this.handleClick());
  }

  handleClick() { /* ... */ }
}

// after panel.render(document.body):
const ctrl = new MyController();
ctrl.init();
```

---

## 28. Repetitive Patterns to Extract

The following items appear in 5+ examples and should become shared modules or stylesheet entries rather than inline duplication:

| Item | Recommended location |
|---|---|
| CSS reset + body base | `examples/shared/base.css` |
| Page header + badge/title/subtitle | `examples/shared/page-layout.css` |
| Grid wrapper card | `examples/shared/grid-wrapper.css` |
| Type-badge colour palette | `examples/shared/badges.css` |
| Status / priority badges | `examples/shared/badges.css` |
| Dark log panel | `examples/shared/log-panel.css` |
| Toast notification | `examples/shared/toast.css` |
| `buildSourceBlock()` IIFE | `examples/shared/source-block.js` |
| `esc()`, `fmtDate()`, `fmtSize()`, `NULL_CELL` | `examples/shared/utils.js` |
| Hint strip + keyboard key | `examples/shared/hint-strip.css` |
| Settings strip | `examples/shared/settings-strip.css` |
| Mode pills | `examples/shared/mode-pills.css` |
| Filter bar | `examples/shared/filter-bar.css` |
| Chip / toggle chip | `examples/shared/chips.css` |
