/**
 * toolbar-capabilities — ToolbarView
 *
 * Demonstrates every toolbar feature the framework currently supports:
 *   - Standard buttons with handlers
 *   - Toggle buttons (enableToggle)
 *   - Toggle groups (radio behavior via toggleGroup)
 *   - SplitButton with independent main/arrow handlers
 *   - Button with a Menu (menu button pattern)
 *   - CycleButton cycling through a fixed item list
 *   - SegmentedButton for exclusive single-select
 *   - Layout helpers: Fill ('->'), Separator ('-'), Spacer (' '), TextItem (plain string)
 *
 * NOTE — two features required by the spec are absent from the framework core;
 * see README.md § "Framework Integrity Report" for the technical specification.
 */

import '@framesquared/layout';
import {
  Button,
  CycleButton,
  SegmentedButton,
  SplitButton,
  Toolbar,
  Menu,
  MenuItem,
  CheckItem,
  MenuSeparator,
  Panel,
  Viewport,
} from '@framesquared/ui';

// ---------------------------------------------------------------------------
// Public interface — refs returned to callers (and to tests)
// ---------------------------------------------------------------------------

export interface ToolbarViewRefs {
  // ── Primary toolbar ──────────────────────────────────────────────────────
  primaryToolbar: Toolbar;
  newFileBtn:      Button;
  saveBtn:         Button;
  exportBtn:       SplitButton;
  commentBtn:      Button;
  wordWrapBtn:     Button;
  viewCodeBtn:     Button;
  viewSplitBtn:    Button;
  viewPreviewBtn:  Button;
  settingsBtn:     Button;
  settingsMenu:    Menu;
  wordCountItem:   CheckItem;
  spellCheckItem:  CheckItem;
  helpBtn:         Button;

  // ── Format toolbar ────────────────────────────────────────────────────────
  formatToolbar: Toolbar;
  languageBtn:   CycleButton;
  fontSizeBtn:   CycleButton;
  indentBtns:    SegmentedButton;

  // ── Mutable counters (pointer objects so tests can observe mutations) ─────
  newFileCount:     { value: number };
  saveCount:        { value: number };
  helpCount:        { value: number };
  exportCount:      { value: number };
  exportArrowCount: { value: number };
}

// ---------------------------------------------------------------------------
// Factory — renders into an arbitrary host element
// ---------------------------------------------------------------------------

export function createToolbarView(host: Element): ToolbarViewRefs {

  // ── Counters ──────────────────────────────────────────────────────────────
  const newFileCount     = { value: 0 };
  const saveCount        = { value: 0 };
  const helpCount        = { value: 0 };
  const exportCount      = { value: 0 };
  const exportArrowCount = { value: 0 };

  // ── Export submenu (arrow area of the SplitButton) ───────────────────────
  const exportMenu = new Menu({
    items: [
      new MenuItem({ text: 'Export as PDF' }),
      new MenuItem({ text: 'Export as Markdown' }),
      new MenuItem({ text: 'Export as HTML' }),
    ],
  });

  // ── Settings menu (shown by the menu-button pattern on settingsBtn) ───────
  const wordCountItem  = new CheckItem({ text: 'Show Word Count',      checked: true  });
  const spellCheckItem = new CheckItem({ text: 'Enable Spell Check',   checked: true  });
  const miniMapItem    = new CheckItem({ text: 'Show Minimap',         checked: false });

  const settingsMenu = new Menu({
    items: [
      wordCountItem,
      spellCheckItem,
      miniMapItem,
      new MenuSeparator(),
      new MenuItem({ text: 'Reset to Defaults' }),
    ],
  });

  // ── Primary toolbar items ─────────────────────────────────────────────────

  const newFileBtn = new Button({
    text: 'New File',
    handler: () => { newFileCount.value++; },
  });

  const saveBtn = new Button({
    text: 'Save',
    handler: () => { saveCount.value++; },
  });

  // SplitButton: main area runs a direct action; arrow area opens a menu.
  const exportBtn = new SplitButton({
    text: 'Export',
    handler: (btn) => {
      exportCount.value++;
      void btn; // suppress unused-param lint
    },
    arrowHandler: (btn) => {
      exportArrowCount.value++;
      exportMenu.showBy(btn);
    },
  });

  // Independent toggle buttons (each has its own pressed state).
  const commentBtn = new Button({ text: 'Toggle Comment', enableToggle: true });
  const wordWrapBtn = new Button({ text: 'Word Wrap',      enableToggle: true });

  // Toggle group: only one of these three can be pressed at a time.
  const viewCodeBtn    = new Button({ text: 'Code',    toggleGroup: 'viewMode', pressed: true  });
  const viewSplitBtn   = new Button({ text: 'Split',   toggleGroup: 'viewMode' });
  const viewPreviewBtn = new Button({ text: 'Preview', toggleGroup: 'viewMode' });

  // Menu-button pattern: Button.menu config — clicking shows/hides the menu.
  const settingsBtn = new Button({ text: 'Settings', menu: settingsMenu });

  const helpBtn = new Button({
    text: 'Help',
    handler: () => { helpCount.value++; },
  });

  const primaryToolbar = new Toolbar({
    items: [
      newFileBtn,
      saveBtn,
      '-',              // ToolbarSeparator
      exportBtn,
      '-',
      commentBtn,
      wordWrapBtn,
      '-',
      viewCodeBtn,
      viewSplitBtn,
      viewPreviewBtn,
      '->',             // ToolbarFill — pushes remaining items to the right
      settingsBtn,
      helpBtn,
    ],
  });

  // ── Format toolbar items ──────────────────────────────────────────────────

  const languageBtn = new CycleButton({
    items: [
      { text: 'TypeScript', checked: true },
      { text: 'JavaScript' },
      { text: 'JSON'       },
      { text: 'Markdown'   },
    ],
  });

  const fontSizeBtn = new CycleButton({
    items: [
      { text: '12px', checked: true },
      { text: '14px' },
      { text: '16px' },
      { text: '18px' },
    ],
  });

  // SegmentedButton: single-select group (Spaces vs Tabs).
  const indentBtns = new SegmentedButton({
    items: [
      new Button({ text: 'Spaces', value: 'spaces', pressed: true }),
      new Button({ text: 'Tabs',   value: 'tabs' }),
    ],
  });

  // Strings in toolbar items: resolved to ToolbarTextItem / ToolbarSpacer.
  const formatToolbar = new Toolbar({
    items: [
      'Language: ',
      languageBtn,
      ' ',            // ToolbarSpacer (8 px gap)
      'Font Size: ',
      fontSizeBtn,
      '->',
      'Indent: ',
      indentBtns,
    ],
  });

  // ── Render everything into the host ───────────────────────────────────────
  new Panel({
    renderTo: host,
    header: false,
    layout: { type: 'vbox', align: 'stretch' },
    items: [primaryToolbar, formatToolbar],
  });

  return {
    primaryToolbar, newFileBtn, saveBtn, exportBtn,
    commentBtn, wordWrapBtn,
    viewCodeBtn, viewSplitBtn, viewPreviewBtn,
    settingsBtn, settingsMenu, wordCountItem, spellCheckItem,
    helpBtn,
    formatToolbar, languageBtn, fontSizeBtn, indentBtns,
    newFileCount, saveCount, helpCount, exportCount, exportArrowCount,
  };
}

// ---------------------------------------------------------------------------
// Viewport entry point — used by src/App.ts
// ---------------------------------------------------------------------------

export function createViewport(): Viewport {
  const vp = new Viewport({ layout: { type: 'vbox', align: 'stretch' } });
  createToolbarView(vp.getBodyEl());
  return vp;
}
