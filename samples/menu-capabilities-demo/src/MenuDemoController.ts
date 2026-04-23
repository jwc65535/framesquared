/**
 * menu-capabilities-demo — MenuDemoController
 *
 * Owns all business logic for the menu demo.  The Controller receives
 * fully-rendered refs from MenuDemoView and wires event handlers without
 * touching the DOM directly.
 *
 * Demonstrates:
 *   - Dynamic text via MenuItem.setText()   (undoItem after save / undo)
 *   - Dynamic enable/disable               (undoItem, pasteItem, ctxPasteItem)
 *   - Status display updates via Button.setText()
 *   - Shared clipboard state across Edit and Context menus
 *   - Ext.resizer.Resizer applied to a floating Menu (Edit menu, SE corner)
 *   - Ext.panel.Resizer  applied to a Panel (resizable content panel)
 */

import { Controller } from '@framesquared/ui';
import { MenuManager } from '@framesquared/ui';
import { Resizable, Resizer } from '@framesquared/dd';
import type { MenuDemoViewRefs } from './MenuDemoView.js';

export class MenuDemoController extends Controller {
  constructor(private readonly refs: MenuDemoViewRefs) {
    super({});
    this.wireHandlers();
  }

  // -------------------------------------------------------------------------
  // Handler wiring
  // -------------------------------------------------------------------------

  private wireHandlers(): void {
    const r = this.refs;

    this.wireMenuResizer();
    this.wirePanelResizer();

    // Edit menu items
    r.newItem.on('click',  () => this.onNew());
    r.saveItem.on('click', () => this.onSave());
    r.undoItem.on('click', () => this.onUndo());
    r.copyItem.on('click', () => this.onCopy());
    r.pasteItem.on('click', () => this.onPaste());

    // Context menu (shares clipboard state with Edit menu)
    r.ctxCopyItem.on('click',      () => this.onCopy());
    r.ctxCutItem.on('click',       () => this.onCut());
    r.ctxPasteItem.on('click',     () => this.onPaste());
    r.ctxSelectAllItem.on('click', () => this.onSelectAll());
    r.ctxPropertiesItem.on('click',() => this.onProperties());

    // Font size sub-menu
    r.fontSizeSmall.on('click',  () => this.onFontSize('Small'));
    r.fontSizeMedium.on('click', () => this.onFontSize('Medium'));
    r.fontSizeLarge.on('click',  () => this.onFontSize('Large'));
    r.fontSizeXLarge.on('click', () => this.onFontSize('X-Large'));

    // Theme radio group — fire only when a new item becomes checked
    r.lightThemeItem.on('checkchange', (_item: unknown, checked: boolean) => {
      if (checked) this.onThemeChange('Light');
    });
    r.darkThemeItem.on('checkchange', (_item: unknown, checked: boolean) => {
      if (checked) this.onThemeChange('Dark');
    });

    // Panel toggles
    r.showSidebarItem.on('checkchange', (_item: unknown, checked: boolean) => {
      this.onTogglePanel('Sidebar', checked);
    });
    r.showPreviewItem.on('checkchange', (_item: unknown, checked: boolean) => {
      this.onTogglePanel('Preview', checked);
    });
  }

  /**
   * Wires Ext.resizer.Resizer (Resizable) to the Edit menu.  Applied on
   * first show so the el is rendered and has natural dimensions to snapshot.
   * Subsequent shows reuse the same instance — the resize state persists.
   */
  private wireMenuResizer(): void {
    const r = this.refs;
    let resizer: Resizable | null = null;

    r.editMenu.on('show', () => {
      if (resizer) return;
      const el = r.editMenu.el!;
      // Snapshot natural dimensions; fall back if not yet laid out (e.g. jsdom).
      const w = el.getBoundingClientRect().width  || el.offsetWidth  || 160;
      const h = el.getBoundingClientRect().height || el.offsetHeight || 240;
      el.style.width  = `${w}px`;
      el.style.height = `${h}px`;
      resizer = new Resizable({
        el,
        handles:     'se',
        minWidth:    140,
        maxWidth:    500,
        minHeight:   100,
        onResize:    (mw, mh) => this.setStatus(`Menu: ${mw}×${mh}`, false),
        onResizeEnd: ()       => this.setStatus('Menu resized', false),
      });
    });
  }

  /**
   * Wires Ext.panel.Resizer to the resizable content panel.  Callbacks update
   * shared resize-state refs and the status display.
   */
  private wirePanelResizer(): void {
    const r = this.refs;
    new Resizer({
      target:    r.resizablePanel,
      minWidth:  150,
      maxWidth:  600,
      minHeight: 80,
      maxHeight: 400,
      onResizeStart: () => this.setStatus('Resizing…', false),
      onResize: (w, h) => {
        r.resizeCount.value++;
        r.lastResizeW.value = w;
        r.lastResizeH.value = h;
      },
      onResizeEnd: () =>
        this.setStatus(`Resized to ${r.lastResizeW.value}×${r.lastResizeH.value}`, false),
    });
  }

  // -------------------------------------------------------------------------
  // Shared helper
  // -------------------------------------------------------------------------

  /** Updates the status display and, by default, closes all open menus. */
  private setStatus(text: string, closeMenus = true): void {
    this.refs.statusDisplay.setText(text);
    if (closeMenus) MenuManager.getInstance().closeAll();
  }

  // -------------------------------------------------------------------------
  // Business logic
  // -------------------------------------------------------------------------

  /** Creates a new note (demo: updates status). */
  onNew(): void {
    this.setStatus('New note created');
  }

  /** Saves and enables Undo with a label reflecting the saved action. */
  onSave(): void {
    this.refs.undoItem.enable();
    this.refs.undoItem.setText('Undo: Save');
    this.setStatus('Saved');
  }

  /** Reverts the last action and resets the Undo item to its initial state. */
  onUndo(): void {
    this.refs.undoItem.setText('Undo');
    this.refs.undoItem.disable();
    this.setStatus('Undo applied');
  }

  /** Copies the selection; enables Paste in both Edit and Context menus. */
  onCopy(): void {
    this.refs.pasteItem.enable();
    this.refs.ctxPasteItem.enable();
    this.setStatus('Copied to clipboard');
  }

  /** Cuts the selection; enables Paste in both Edit and Context menus. */
  onCut(): void {
    this.refs.pasteItem.enable();
    this.refs.ctxPasteItem.enable();
    this.setStatus('Cut to clipboard');
  }

  onPaste(): void {
    this.setStatus('Pasted');
  }

  onSelectAll(): void {
    this.setStatus('All selected');
  }

  onProperties(): void {
    this.setStatus('Note Properties');
  }

  onFontSize(size: string): void {
    this.setStatus(`Font: ${size}`);
  }

  onThemeChange(theme: string): void {
    this.setStatus(`Theme: ${theme}`);
  }

  /** Toggles a panel's visibility (demo: updates status without closing menus). */
  onTogglePanel(panel: string, visible: boolean): void {
    this.setStatus(`${panel}: ${visible ? 'shown' : 'hidden'}`, false);
  }
}
