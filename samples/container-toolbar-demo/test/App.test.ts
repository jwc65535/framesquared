/**
 * TDD suite for toolbar-capabilities
 *
 * Tests are grouped by feature category so failures pinpoint the broken
 * capability immediately.  All tests operate on the refs returned by
 * createToolbarView() rather than global application state, keeping each
 * test fully isolated.
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { Button } from '@framesquared/ui';
import { Application } from '@framesquared/app';
import { createToolbarView, type ToolbarViewRefs } from '../src/ToolbarView.js';

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let host: HTMLDivElement;
let refs: ToolbarViewRefs;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  Application.clearInstance();
  refs = createToolbarView(host);
});

afterEach(() => {
  host.remove();
  document.body.innerHTML = '';
  Application.clearInstance();
});

// ---------------------------------------------------------------------------
// Application lifecycle
// ---------------------------------------------------------------------------

describe('Application lifecycle', () => {
  it('singleton resets cleanly', () => {
    Application.clearInstance();
    expect(Application.getInstance()).toBeNull();
  });

  it('Application can be started', () => {
    Application.clearInstance();
    let launched = false;
    class TestApp extends Application {
      constructor() { super({ name: 'test' }); }
      override launch() { launched = true; }
    }
    new TestApp().start();
    expect(launched).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Toolbar renders
// ---------------------------------------------------------------------------

describe('Toolbar renders', () => {
  it('renders two toolbars inside the host', () => {
    expect(host.querySelectorAll('.x-toolbar').length).toBe(2);
  });

  it('both toolbars carry role="toolbar"', () => {
    expect(host.querySelectorAll('[role="toolbar"]').length).toBe(2);
  });

  it('all primary toolbar buttons have an element', () => {
    const btns = [
      refs.newFileBtn, refs.saveBtn, refs.exportBtn,
      refs.commentBtn, refs.wordWrapBtn,
      refs.viewCodeBtn, refs.viewSplitBtn, refs.viewPreviewBtn,
      refs.settingsBtn, refs.helpBtn,
    ];
    for (const btn of btns) {
      expect(btn.el, `${btn.constructor.name} should have el`).toBeTruthy();
    }
  });

  it('format toolbar buttons have an element', () => {
    expect(refs.languageBtn.el).toBeTruthy();
    expect(refs.fontSizeBtn.el).toBeTruthy();
    expect(refs.indentBtns.el).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Layout helpers: Fill, Separator, Spacer, TextItem
// ---------------------------------------------------------------------------

describe('Toolbar layout helpers', () => {
  it('renders separators in the primary toolbar', () => {
    const seps = refs.primaryToolbar.el!.querySelectorAll('.x-toolbar-separator');
    expect(seps.length).toBeGreaterThanOrEqual(3);
  });

  it('Fill element stretches to fill available space (flex-grow: 1)', () => {
    const fill = refs.primaryToolbar.el!.querySelector<HTMLElement>('.x-toolbar-fill')!;
    expect(fill).toBeTruthy();
    expect(fill.style.flexGrow).toBe('1');
  });

  it('renders a Spacer in the format toolbar', () => {
    expect(refs.formatToolbar.el!.querySelector('.x-toolbar-spacer')).toBeTruthy();
  });

  it('renders text labels in the format toolbar', () => {
    const labels = refs.formatToolbar.el!.querySelectorAll('.x-toolbar-text');
    expect(labels.length).toBeGreaterThanOrEqual(3); // Language, Font Size, Indent
  });

  it('format toolbar also has a Fill element', () => {
    const fill = refs.formatToolbar.el!.querySelector('.x-toolbar-fill');
    expect(fill).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Standard buttons: handler execution
// ---------------------------------------------------------------------------

describe('Standard buttons', () => {
  it('New File handler fires on click', () => {
    refs.newFileBtn.el!.click();
    expect(refs.newFileCount.value).toBe(1);
  });

  it('New File handler accumulates across repeated clicks', () => {
    refs.newFileBtn.el!.click();
    refs.newFileBtn.el!.click();
    refs.newFileBtn.el!.click();
    expect(refs.newFileCount.value).toBe(3);
  });

  it('Save handler fires on click', () => {
    refs.saveBtn.el!.click();
    expect(refs.saveCount.value).toBe(1);
  });

  it('Help handler fires on click', () => {
    refs.helpBtn.el!.click();
    expect(refs.helpCount.value).toBe(1);
  });

  it('handlers are independent — Save does not trigger New File', () => {
    refs.saveBtn.el!.click();
    expect(refs.newFileCount.value).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Toggle buttons (enableToggle — independent state per button)
// ---------------------------------------------------------------------------

describe('Toggle buttons (enableToggle)', () => {
  it('Word Wrap starts as not pressed', () => {
    expect(refs.wordWrapBtn.isPressed()).toBe(false);
  });

  it('Word Wrap becomes pressed after first click', () => {
    refs.wordWrapBtn.el!.click();
    expect(refs.wordWrapBtn.isPressed()).toBe(true);
  });

  it('Word Wrap returns to unpressed after second click', () => {
    refs.wordWrapBtn.el!.click();
    refs.wordWrapBtn.el!.click();
    expect(refs.wordWrapBtn.isPressed()).toBe(false);
  });

  it('pressed state is reflected by the x-btn-pressed CSS class', () => {
    refs.commentBtn.el!.click();
    expect(refs.commentBtn.el!.classList.contains('x-btn-pressed')).toBe(true);
  });

  it('two toggle buttons are mutually independent', () => {
    refs.wordWrapBtn.el!.click();
    expect(refs.wordWrapBtn.isPressed()).toBe(true);
    expect(refs.commentBtn.isPressed()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Toggle group (radio behavior via toggleGroup)
// ---------------------------------------------------------------------------

describe('Toggle group — view mode (radio behavior)', () => {
  it('Code view starts pressed', () => {
    expect(refs.viewCodeBtn.isPressed()).toBe(true);
  });

  it('Split and Preview start unpressed', () => {
    expect(refs.viewSplitBtn.isPressed()).toBe(false);
    expect(refs.viewPreviewBtn.isPressed()).toBe(false);
  });

  it('clicking Split presses Split and depresses Code', () => {
    refs.viewSplitBtn.el!.click();
    expect(refs.viewSplitBtn.isPressed()).toBe(true);
    expect(refs.viewCodeBtn.isPressed()).toBe(false);
  });

  it('clicking Preview then depresses Split', () => {
    refs.viewSplitBtn.el!.click();
    refs.viewPreviewBtn.el!.click();
    expect(refs.viewPreviewBtn.isPressed()).toBe(true);
    expect(refs.viewSplitBtn.isPressed()).toBe(false);
    expect(refs.viewCodeBtn.isPressed()).toBe(false);
  });

  it('exactly one view mode button is pressed at all times', () => {
    refs.viewSplitBtn.el!.click();
    const pressedCount = [refs.viewCodeBtn, refs.viewSplitBtn, refs.viewPreviewBtn]
      .filter((b) => b.isPressed()).length;
    expect(pressedCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// SplitButton: independent main-area and arrow-area handlers
// ---------------------------------------------------------------------------

describe('SplitButton (Export)', () => {
  it('renders the split-arrow span', () => {
    expect(refs.exportBtn.el!.querySelector('.x-btn-split-arrow')).toBeTruthy();
  });

  it('has the x-btn-split class', () => {
    expect(refs.exportBtn.el!.classList.contains('x-btn-split')).toBe(true);
  });

  it('clicking the button body fires the main handler', () => {
    refs.exportBtn.el!.click();
    expect(refs.exportCount.value).toBe(1);
  });

  it('clicking the button body does not fire the arrow handler', () => {
    refs.exportBtn.el!.click();
    expect(refs.exportArrowCount.value).toBe(0);
  });

  it('clicking the arrow fires the arrow handler', () => {
    const arrow = refs.exportBtn.el!.querySelector<HTMLElement>('.x-btn-split-arrow')!;
    arrow.click();
    expect(refs.exportArrowCount.value).toBe(1);
  });

  it('clicking the arrow does not fire the main handler (stopPropagation)', () => {
    const arrow = refs.exportBtn.el!.querySelector<HTMLElement>('.x-btn-split-arrow')!;
    arrow.click();
    expect(refs.exportCount.value).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Menu button (Button.menu — clicking the button shows/hides the menu)
// ---------------------------------------------------------------------------

describe('Menu button (Settings)', () => {
  it('settings menu is not visible before interaction', () => {
    expect(refs.settingsMenu.isVisible()).toBe(false);
  });

  it('clicking the Settings button makes the menu visible', () => {
    refs.settingsBtn.el!.click();
    expect(refs.settingsMenu.isVisible()).toBe(true);
  });

  it('word count CheckItem starts checked', () => {
    expect(refs.wordCountItem.isChecked()).toBe(true);
  });

  it('spell check CheckItem starts checked', () => {
    expect(refs.spellCheckItem.isChecked()).toBe(true);
  });

  it('clicking a CheckItem toggles its checked state', () => {
    // Show the menu so the CheckItem renders its element
    refs.settingsBtn.el!.click();
    refs.wordCountItem.el!.click();
    expect(refs.wordCountItem.isChecked()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CycleButton: advances through items on each click
// ---------------------------------------------------------------------------

describe('CycleButton — Language selector', () => {
  it('starts on TypeScript', () => {
    expect(refs.languageBtn.getActiveItem().text).toBe('TypeScript');
  });

  it('advances to JavaScript after one click', () => {
    refs.languageBtn.el!.click();
    expect(refs.languageBtn.getActiveItem().text).toBe('JavaScript');
  });

  it('advances to JSON after two clicks', () => {
    refs.languageBtn.el!.click();
    refs.languageBtn.el!.click();
    expect(refs.languageBtn.getActiveItem().text).toBe('JSON');
  });

  it('advances to Markdown after three clicks', () => {
    refs.languageBtn.el!.click();
    refs.languageBtn.el!.click();
    refs.languageBtn.el!.click();
    expect(refs.languageBtn.getActiveItem().text).toBe('Markdown');
  });

  it('wraps back to TypeScript after four clicks', () => {
    for (let i = 0; i < 4; i++) refs.languageBtn.el!.click();
    expect(refs.languageBtn.getActiveItem().text).toBe('TypeScript');
  });

  it('button text content updates to the active item name', () => {
    refs.languageBtn.el!.click();
    expect(refs.languageBtn.el!.textContent).toContain('JavaScript');
  });
});

describe('CycleButton — Font size', () => {
  it('starts on 12px', () => {
    expect(refs.fontSizeBtn.getActiveItem().text).toBe('12px');
  });

  it('advances to 14px after one click', () => {
    refs.fontSizeBtn.el!.click();
    expect(refs.fontSizeBtn.getActiveItem().text).toBe('14px');
  });

  it('advances to 16px after two clicks', () => {
    refs.fontSizeBtn.el!.click();
    refs.fontSizeBtn.el!.click();
    expect(refs.fontSizeBtn.getActiveItem().text).toBe('16px');
  });
});

// ---------------------------------------------------------------------------
// SegmentedButton: single-select group
// ---------------------------------------------------------------------------

describe('SegmentedButton — Indentation', () => {
  it('Spaces is selected initially', () => {
    expect(refs.indentBtns.getValue()).toBe('spaces');
  });

  it('clicking Tabs changes the selection to tabs', () => {
    const tabsBtn = refs.indentBtns.getItems()[1] as Button;
    tabsBtn.el!.click();
    expect(refs.indentBtns.getValue()).toBe('tabs');
  });

  it('selecting Tabs depresses Spaces', () => {
    const [spacesBtn, tabsBtn] = refs.indentBtns.getItems() as [Button, Button];
    tabsBtn.el!.click();
    expect(spacesBtn.isPressed()).toBe(false);
    expect(tabsBtn.isPressed()).toBe(true);
  });

  it('setValue("tabs") programmatically switches selection', () => {
    refs.indentBtns.setValue('tabs');
    expect(refs.indentBtns.getValue()).toBe('tabs');
  });

  it('setValue("spaces") restores original selection', () => {
    refs.indentBtns.setValue('tabs');
    refs.indentBtns.setValue('spaces');
    expect(refs.indentBtns.getValue()).toBe('spaces');
  });

  it('only one option is selected at a time', () => {
    refs.indentBtns.setValue('tabs');
    const pressedCount = (refs.indentBtns.getItems() as Button[])
      .filter((b) => b.isPressed()).length;
    expect(pressedCount).toBe(1);
  });
});
