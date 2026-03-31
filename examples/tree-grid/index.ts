/**
 * framesquared TreeGrid Examples — Showcase Bootstrap
 *
 * Hash-based routing loads each example on demand.
 * window.__logEvent() is a global hook for examples to emit events.
 */

import { ThemeManager, ModernTheme, DarkTheme, ClassicTheme } from '@framesquared/theme';

// ─── Theme Setup ─────────────────────────────────────────────────────────────

ThemeManager.register(ClassicTheme);
ThemeManager.register(ModernTheme);
ThemeManager.register(DarkTheme);
ThemeManager.setTheme('modern');

// ─── Type Declarations ───────────────────────────────────────────────────────

declare global {
  interface Window {
    __logEvent: (name: string, detail: string) => void;
    __currentExample?: { destroy?: () => void };
  }
}

// ─── Event Log ───────────────────────────────────────────────────────────────

const eventLog = document.getElementById('event-log')!;
const eventFilter = document.getElementById('event-filter') as HTMLInputElement;
const clearEvents = document.getElementById('clear-events')!;

window.__logEvent = (name: string, detail: string) => {
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractional: 3 } as any);
  const entry = document.createElement('div');
  entry.className = 'event-log-entry';
  entry.dataset.name = name;
  entry.innerHTML = `<span class="event-time">[${timestamp}]</span> <span class="event-name">${name}</span> — <span class="event-detail">${detail}</span>`;

  // Apply current filter
  const filterText = eventFilter.value.toLowerCase();
  if (filterText && !name.toLowerCase().includes(filterText) && !detail.toLowerCase().includes(filterText)) {
    entry.style.display = 'none';
  }

  eventLog.appendChild(entry);

  // Limit to 200 entries
  while (eventLog.children.length > 200) {
    eventLog.removeChild(eventLog.firstChild!);
  }

  // Auto-scroll
  eventLog.scrollTop = eventLog.scrollHeight;
};

eventFilter.addEventListener('input', () => {
  const filterText = eventFilter.value.toLowerCase();
  for (const entry of Array.from(eventLog.children) as HTMLElement[]) {
    const name = entry.dataset.name ?? '';
    const text = entry.textContent ?? '';
    entry.style.display = (!filterText || name.toLowerCase().includes(filterText) || text.toLowerCase().includes(filterText)) ? '' : 'none';
  }
});

clearEvents.addEventListener('click', () => {
  eventLog.innerHTML = '';
});

// ─── Tab Management ──────────────────────────────────────────────────────────

const tabs = document.querySelectorAll('.info-tab');
const tabContents = document.querySelectorAll('.info-tab-content');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = (tab as HTMLElement).dataset.tab!;
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(c => c.classList.add('hidden'));
    tab.classList.add('active');
    document.getElementById(`tab-${target}`)?.classList.remove('hidden');
  });
});

// ─── Theme Switcher ──────────────────────────────────────────────────────────

const themeSwitcher = document.getElementById('theme-switcher') as HTMLSelectElement;
themeSwitcher.addEventListener('change', () => {
  ThemeManager.setTheme(themeSwitcher.value);
});

// ─── Sidebar Toggle ──────────────────────────────────────────────────────────

const sidebarToggle = document.getElementById('sidebar-toggle')!;
const sidebar = document.getElementById('sidebar')!;
sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
});

// ─── Example Registry ────────────────────────────────────────────────────────

type ExampleLoader = () => Promise<{ createExample: (container: HTMLElement) => { destroy?: () => void } }>;

const registry: Record<string, ExampleLoader> = {
  'basic':             () => import('./examples/01-basic/BasicTreeGrid.js') as any,
  'columns':           () => import('./examples/02-columns/MultiColumnTree.js') as any,
  'async-loading':     () => import('./examples/03-async-loading/AsyncTreeGrid.js') as any,
  'checkbox':          () => import('./examples/04-checkbox/CheckboxTreeGrid.js') as any,
  'editing':           () => import('./examples/05-editing/CellEditingTreeGrid.js') as any,
  'drag-drop':         () => import('./examples/06-drag-drop/ReorderTreeGrid.js') as any,
  'sorting-filtering': () => import('./examples/07-sorting-filtering/SortableTreeGrid.js') as any,
  'selection':         () => import('./examples/08-selection/SelectionTreeGrid.js') as any,
  'locked-columns':    () => import('./examples/09-locked-columns/LockedTreeGrid.js') as any,
  'summary':           () => import('./examples/10-summary/SummaryTreeGrid.js') as any,
  'row-expander':      () => import('./examples/11-row-expander/RowExpanderTreeGrid.js') as any,
  'clipboard':         () => import('./examples/12-clipboard/ClipboardTreeGrid.js') as any,
  'state':             () => import('./examples/13-state/StatefulTreeGrid.js') as any,
  'export':            () => import('./examples/14-export/ExportTreeGrid.js') as any,
  'theming':           () => import('./examples/15-theming/ThemedTreeGrid.js') as any,
  'large-dataset':     () => import('./examples/16-large-dataset/LargeTreeGrid.js') as any,
  'file-explorer':     () => import('./examples/17-file-explorer/FileExplorer.js') as any,
  'project-planner':   () => import('./examples/18-project-planner/ProjectPlanner.js') as any,
  'org-chart':         () => import('./examples/19-org-chart/OrgChart.js') as any,
  'accessibility':     () => import('./examples/20-accessibility/AccessibleTreeGrid.js') as any,
  'kitchen-sink':      () => import('./examples/21-kitchen-sink/KitchenSink.js') as any,
  'rich-editing':      () => import('./examples/22-rich-editing/RichEditingTreeGrid.js') as any,
};

const descriptions: Record<string, string> = {
  'basic': `<h2>01 · Basic TreeGrid</h2><p>The simplest possible TreeGrid showing a file system with three columns: Name (tree), Size, and Modified date. Demonstrates core configuration options.</p>`,
  'columns': `<h2>02 · Multi-Column Tree</h2><p>Multiple column types in a TreeGrid: text, number, date, status badges with custom renderers, and progress bar widget columns.</p>`,
  'async-loading': `<h2>03 · Async Loading</h2><p>Lazy-loading children from a REST API on expand. Demonstrates AjaxProxy, loading indicators, error handling, and the MockServer.</p>`,
  'checkbox': `<h2>04 · Checkbox Tree</h2><p>Tri-state checkbox tree with cascade propagation. Demonstrates cascadeChecks, checkPropagation modes, and indeterminate parent states.</p>`,
  'editing': `<h2>05 · Editing</h2><p>Inline cell editing with TreeGridCellEditing plugin. ComboBox editors, DateField editors, validation, and add/delete operations.</p>`,
  'drag-drop': `<h2>06 · Drag &amp; Drop</h2><p>Drag-and-drop reordering within a tree. Demonstrates drop indicators, auto-expand, circular drag prevention, and cross-tree drag.</p>`,
  'sorting-filtering': `<h2>07 · Sorting &amp; Filtering</h2><p>Column sorting with folderSort, multi-column sort, and column filter inputs. Demonstrates bottomup vs topdown filter strategies.</p>`,
  'selection': `<h2>08 · Selection Modes</h2><p>SINGLE, SIMPLE, and MULTI selection. Checkbox selection, range selection across tree depths, and keyboard navigation.</p>`,
  'locked-columns': `<h2>09 · Locked Columns</h2><p>Frozen tree column with scrollable data columns. Synchronized vertical scrolling, resizable splitter, lock/unlock via column header menu.</p>`,
  'summary': `<h2>10 · Summary Rows</h2><p>Footer summary row and per-parent grouping summaries. Aggregates sum, average, and count across tree nodes.</p>`,
  'row-expander': `<h2>11 · Row Expander</h2><p>Expandable detail panel below each row. Independently expandable from tree children. Shows task metadata in a rich template.</p>`,
  'clipboard': `<h2>12 · Clipboard</h2><p>Copy/paste with hierarchy preservation. TSV format for paste into spreadsheets. Copy with indentation that mirrors tree depth.</p>`,
  'state': `<h2>13 · State Persistence</h2><p>Persistent expand/collapse, column widths, and sort order across page reloads via localStorage.</p>`,
  'export': `<h2>14 · Export</h2><p>Export to CSV, JSON, TSV. Respects visible/all toggle, includes hierarchy indentation, and shows a live preview.</p>`,
  'theming': `<h2>15 · Theming</h2><p>Instant theme switching between Classic, Modern, and Dark. CSS custom properties update all TreeGrid elements without re-render.</p>`,
  'large-dataset': `<h2>16 · Large Dataset</h2><p>100,000 nodes with virtual scrolling at 60fps. Performance metrics overlay, Expand All with progress, live filter/sort timing.</p>`,
  'file-explorer': `<h2>17 · File Explorer</h2><p>Full macOS Finder-like application. Async loading, drag-drop, rename, context menu, breadcrumb, search, keyboard shortcuts.</p>`,
  'project-planner': `<h2>18 · Project Planner</h2><p>Project management application with row editing, grouping summaries, undo/redo, progress tracking, and export.</p>`,
  'org-chart': `<h2>19 · Org Chart</h2><p>Organizational hierarchy with avatar initials, profile card, department filtering, drag-to-reorganize.</p>`,
  'accessibility': `<h2>20 · Accessibility</h2><p>Full keyboard navigation, ARIA attributes, screen reader simulation panel, accessibility audit, and high contrast mode.</p>`,
  'kitchen-sink': `<h2>21 · Kitchen Sink</h2><p>Every feature enabled simultaneously: checkboxes, drag-drop, sorting, filtering, locked columns, editing, summary, row expander, export, state.</p>`,
  'rich-editing': `<h2>22 · Rich Editing</h2><p>All editor types in one grid: textfield, combobox/select, checkbox, radiogroup, numberfield, datefield, colorfield, and textarea. Employee directory as the data model.</p>`,
};

// ─── Navigation ──────────────────────────────────────────────────────────────

const welcomeScreen = document.getElementById('welcome-screen')!;
const exampleContainer = document.getElementById('example-container')!;
const infoPanel = document.getElementById('info-panel')!;
const tabDescription = document.getElementById('tab-description')!;

async function loadExample(slug: string): Promise<void> {
  // Destroy current example
  if (window.__currentExample?.destroy) {
    window.__currentExample.destroy();
  }
  window.__currentExample = undefined;

  // Clear event log
  eventLog.innerHTML = '';

  // Update sidebar
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.toggle('active', (item as HTMLElement).dataset.example === slug);
  });

  const loader = registry[slug];
  if (!loader) {
    exampleContainer.hidden = true;
    welcomeScreen.style.display = '';
    infoPanel.hidden = true;
    return;
  }

  // Show container
  welcomeScreen.style.display = 'none';
  exampleContainer.hidden = false;
  exampleContainer.innerHTML = '';
  infoPanel.hidden = false;

  // Set description
  tabDescription.innerHTML = descriptions[slug] ?? `<h2>${slug}</h2>`;

  try {
    const mod = await loader();
    const instance = mod.createExample(exampleContainer);
    window.__currentExample = instance;
  } catch (err) {
    exampleContainer.innerHTML = `<div class="example-error"><strong>Error loading example:</strong><pre>${String(err)}</pre></div>`;
    console.error('Failed to load example', slug, err);
  }
}

function onHashChange(): void {
  const hash = window.location.hash.replace('#', '') || '';
  if (hash) {
    loadExample(hash);
  } else {
    // Restore welcome screen
    if (window.__currentExample?.destroy) window.__currentExample.destroy();
    window.__currentExample = undefined;
    welcomeScreen.style.display = '';
    exampleContainer.hidden = true;
    infoPanel.hidden = true;
    document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  }
}

window.addEventListener('hashchange', onHashChange);

// Initial load
onHashChange();
