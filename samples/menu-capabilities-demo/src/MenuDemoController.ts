/**
 * menu-capabilities-demo — MenuDemoController
 *
 * Owns all business logic for the menu demo.  The Controller receives the
 * fully-rendered refs from MenuDemoView and wires event handlers without
 * touching the DOM directly.
 *
 * Demonstrates:
 *   - Dynamic text via MenuItem.setText()   (undoItem after save/undo)
 *   - Dynamic enable/disable               (undoItem, pasteItem, ctxPasteItem)
 *   - Status display updates via Button.setText()
 *   - Shared clipboard state across Edit and Context menus
 */

import { Controller } from '@framesquared/ui';
import { MenuManager } from '@framesquared/ui';
import { Resizable } from '@framesquared/dd';
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

    // Edit menu
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

    // Resizable panel — handle wiring is a business-logic concern because the
    // callbacks update shared state (resizeCount, lastResizeW/H, statusDisplay).
    new Resizable({
      el:        r.resizablePanel.el!,
      handles:   's e se',
      minWidth:  150,
      maxWidth:  600,
      minHeight: 80,
      maxHeight: 400,
      onResizeStart: () => {
        r.statusDisplay.setText('Resizing…');
      },
      onResize: (w, h) => {
        r.resizeCount.value++;
        r.lastResizeW.value = w;
        r.lastResizeH.value = h;
      },
      onResizeEnd: () => {
        r.statusDisplay.setText(`Resized to ${r.lastResizeW.value}×${r.lastResizeH.value}`);
      },
    });
  }

  // -------------------------------------------------------------------------
  // Business logic
  // -------------------------------------------------------------------------

  onNew(): void {
    this.refs.statusDisplay.setText('New note created');
    MenuManager.getInstance().closeAll();
  }

  onSave(): void {
    // Enable undo and update its text to reflect the last action.
    this.refs.undoItem.enable();
    this.refs.undoItem.setText('Undo: Save');
    this.refs.statusDisplay.setText('Saved');
    MenuManager.getInstance().closeAll();
  }

  onUndo(): void {
    // Reset undo item to its default state.
    this.refs.undoItem.setText('Undo');
    this.refs.undoItem.disable();
    this.refs.statusDisplay.setText('Undo applied');
    MenuManager.getInstance().closeAll();
  }

  onCopy(): void {
    // Clipboard now has content — enable both Paste items.
    this.refs.pasteItem.enable();
    this.refs.ctxPasteItem.enable();
    this.refs.statusDisplay.setText('Copied to clipboard');
    MenuManager.getInstance().closeAll();
  }

  onCut(): void {
    this.refs.pasteItem.enable();
    this.refs.ctxPasteItem.enable();
    this.refs.statusDisplay.setText('Cut to clipboard');
    MenuManager.getInstance().closeAll();
  }

  onPaste(): void {
    this.refs.statusDisplay.setText('Pasted');
    MenuManager.getInstance().closeAll();
  }

  onSelectAll(): void {
    this.refs.statusDisplay.setText('All selected');
    MenuManager.getInstance().closeAll();
  }

  onProperties(): void {
    this.refs.statusDisplay.setText('Note Properties');
    MenuManager.getInstance().closeAll();
  }

  onFontSize(size: string): void {
    this.refs.statusDisplay.setText(`Font: ${size}`);
    MenuManager.getInstance().closeAll();
  }

  onThemeChange(theme: string): void {
    this.refs.statusDisplay.setText(`Theme: ${theme}`);
    MenuManager.getInstance().closeAll();
  }

  onTogglePanel(panel: string, visible: boolean): void {
    this.refs.statusDisplay.setText(`${panel}: ${visible ? 'shown' : 'hidden'}`);
  }
}
