/**
 * menu-demo — MenuDemoController
 *
 * Owns all business logic for the menu demo.  Receives fully-rendered refs
 * from MenuDemoView and wires event handlers without touching the DOM directly.
 *
 * Demonstrates:
 *   - MenuItem.setText()    — last-file label updated after New / Open
 *   - enable() / disable()  — Save enabled after New/Open, disabled after Close
 *   - CheckItem toggle      — Auto-Save, Spell Check
 *   - Radio group           — Light / Dark theme (mutual exclusion via group)
 *   - Shared clipboard state — Copy enables Paste in the context menu
 */

import { Controller } from '@framesquared/ui';
import { MenuManager } from '@framesquared/ui';
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

    // File menu items
    r.newItem.on('click',   () => this.onNew());
    r.openItem.on('click',  () => this.onOpen());
    r.saveItem.on('click',  () => this.onSave());
    r.closeItem.on('click', () => this.onClose());

    // Options — CheckItems fire 'checkchange' with (item, checked)
    r.autoSave.on('checkchange',   (_: unknown, checked: boolean) => this.onAutoSaveChange(checked));
    r.spellCheck.on('checkchange', (_: unknown, checked: boolean) => this.onSpellCheckChange(checked));
    r.light.on('checkchange',      (_: unknown, checked: boolean) => { if (checked) this.onThemeChange('Light'); });
    r.dark.on('checkchange',       (_: unknown, checked: boolean) => { if (checked) this.onThemeChange('Dark');  });

    // Context menu
    r.ctxCopyItem.on('click',  () => this.onCopy());
    r.ctxPasteItem.on('click', () => this.onPaste());
    r.ctxSelectAll.on('click', () => this.onSelectAll());
  }

  // -------------------------------------------------------------------------
  // Shared helper
  // -------------------------------------------------------------------------

  /** Updates the status display and, by default, closes all open menus. */
  private setStatus(text: string, closeMenus = true): void {
    this.refs.status.setText(text);
    if (closeMenus) MenuManager.getInstance().closeAll();
  }

  // -------------------------------------------------------------------------
  // File menu handlers
  // -------------------------------------------------------------------------

  /** Creates a new file: enables Save and records the file name. */
  public onNew(): void {
    this.refs.saveItem.enable();
    this.refs.lastFileItem.setText('Last File: Untitled');
    this.setStatus('New file created');
  }

  /** Opens a file: enables Save and records the file name. */
  public onOpen(): void {
    this.refs.saveItem.enable();
    this.refs.lastFileItem.setText('Last File: demo.txt');
    this.setStatus('Opened demo.txt');
  }

  /** Saves the current file. */
  public onSave(): void {
    this.setStatus('File saved');
  }

  /** Closes the current file: disables Save. */
  public onClose(): void {
    this.refs.saveItem.disable();
    this.setStatus('File closed');
  }

  // -------------------------------------------------------------------------
  // Options menu handlers
  // -------------------------------------------------------------------------

  public onAutoSaveChange(checked: boolean): void {
    this.setStatus(`Auto-Save: ${checked ? 'on' : 'off'}`, false);
  }

  public onSpellCheckChange(checked: boolean): void {
    this.setStatus(`Spell Check: ${checked ? 'on' : 'off'}`, false);
  }

  public onThemeChange(theme: string): void {
    this.setStatus(`Theme: ${theme}`, false);
  }

  // -------------------------------------------------------------------------
  // Context menu handlers
  // -------------------------------------------------------------------------

  /** Copies the selection; enables Paste in the context menu. */
  public onCopy(): void {
    this.refs.ctxPasteItem.enable();
    this.setStatus('Copied to clipboard');
  }

  public onPaste(): void {
    this.setStatus('Pasted from clipboard');
  }

  public onSelectAll(): void {
    this.setStatus('All selected');
  }
}
