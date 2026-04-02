/**
 * @framesquared/form – HtmlEditor
 *
 * Rich text editor using contentEditable.  Provides a toolbar with
 * formatting buttons, source edit mode, and XSS sanitization.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Field } from './Field.js';
import type { FieldConfig } from './Field.js';

export interface HtmlEditorConfig extends FieldConfig {
  enableFont?: boolean;
  enableColors?: boolean;
  enableLists?: boolean;
  enableLinks?: boolean;
  enableSourceEdit?: boolean;
}

// Toolbar button definitions
const TOOLBAR_BUTTONS = [
  { cmd: 'bold', label: 'B', cls: 'bold' },
  { cmd: 'italic', label: 'I', cls: 'italic' },
  { cmd: 'underline', label: 'U', cls: 'underline' },
  { cmd: 'strikeThrough', label: 'S', cls: 'strikethrough' },
  { cmd: 'justifyLeft', label: '⇐', cls: 'align-left' },
  { cmd: 'justifyCenter', label: '⇔', cls: 'align-center' },
  { cmd: 'justifyRight', label: '⇒', cls: 'align-right' },
  { cmd: 'insertOrderedList', label: 'OL', cls: 'ordered-list' },
  { cmd: 'insertUnorderedList', label: 'UL', cls: 'unordered-list' },
  { cmd: 'indent', label: '→', cls: 'indent' },
  { cmd: 'outdent', label: '←', cls: 'outdent' },
  { cmd: 'undo', label: '↩', cls: 'undo' },
  { cmd: 'redo', label: '↪', cls: 'redo' },
];

// Dangerous tags to strip for XSS prevention
const XSS_TAGS =
  /(<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>|on\w+="[^"]*"|on\w+='[^']*')/gi;

export class HtmlEditor extends Field {
  static override $className = 'Ext.form.field.HtmlEditor';

  declare private _toolbarEl: HTMLElement | null;
  declare private _editorEl: HTMLElement | null;
  declare private _sourceEl: HTMLTextAreaElement | null;
  declare private _sourceMode: boolean;

  constructor(config: HtmlEditorConfig = {}) {
    super({ xtype: 'htmleditor', ...config });
  }

  protected override initialize(): void {
    super.initialize();
    this._toolbarEl = null;
    this._editorEl = null;
    this._sourceEl = null;
    this._sourceMode = false;
  }

  protected override afterRender(): void {
    super.afterRender();
    this.el!.classList.add('x-htmleditor');

    const wrap = this._bodyWrapEl ?? this.el!;

    // Toolbar
    this._toolbarEl = document.createElement('div');
    this._toolbarEl.classList.add('x-htmleditor-toolbar');

    for (const btn of TOOLBAR_BUTTONS) {
      const el = document.createElement('button');
      el.type = 'button';
      el.classList.add('x-htmleditor-btn', `x-htmleditor-btn-${btn.cls}`);
      el.textContent = btn.label;
      el.title = btn.cmd;
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.execCommand(btn.cmd);
      });
      this._toolbarEl.appendChild(el);
    }

    // Source edit toggle
    const srcBtn = document.createElement('button');
    srcBtn.type = 'button';
    srcBtn.classList.add('x-htmleditor-btn', 'x-htmleditor-btn-source');
    srcBtn.textContent = 'HTML';
    srcBtn.addEventListener('click', () => this.toggleSourceEdit());
    this._toolbarEl.appendChild(srcBtn);

    wrap.appendChild(this._toolbarEl);

    // Editor area (contenteditable)
    this._editorEl = document.createElement('div');
    this._editorEl.classList.add('x-htmleditor-body');
    this._editorEl.contentEditable = 'true';
    this._editorEl.style.minHeight = '100px';

    if (this._value) {
      this._editorEl.innerHTML = this.sanitize(String(this._value));
    }

    this._editorEl.addEventListener('input', () => {
      this.fire('change', this, this.getValue());
    });

    wrap.appendChild(this._editorEl);

    // Source textarea (hidden by default)
    this._sourceEl = document.createElement('textarea');
    this._sourceEl.classList.add('x-htmleditor-source');
    this._sourceEl.style.display = 'none';
    this._sourceEl.style.width = '100%';
    this._sourceEl.style.minHeight = '100px';
    wrap.appendChild(this._sourceEl);
  }

  // -----------------------------------------------------------------------
  // Value
  // -----------------------------------------------------------------------

  override getValue(): string {
    if (this._sourceMode && this._sourceEl) {
      return this.sanitize(this._sourceEl.value);
    }
    return this._editorEl ? this.sanitize(this._editorEl.innerHTML) : '';
  }

  override setValue(value: unknown): void {
    const html = this.sanitize(String(value ?? ''));
    this._value = html;
    if (this._editorEl) this._editorEl.innerHTML = html;
    if (this._sourceEl) this._sourceEl.value = html;
  }

  // -----------------------------------------------------------------------
  // Commands
  // -----------------------------------------------------------------------

  execCommand(cmd: string, value?: string): void {
    if (this._sourceMode) return;
    try {
      document.execCommand(cmd, false, value ?? '');
    } catch {
      // execCommand may not be supported in test environment
    }
    this._editorEl?.focus();
  }

  // -----------------------------------------------------------------------
  // Source edit
  // -----------------------------------------------------------------------

  toggleSourceEdit(): void {
    this._sourceMode = !this._sourceMode;

    if (this._sourceMode) {
      // Switch to source
      if (this._sourceEl && this._editorEl) {
        this._sourceEl.value = this._editorEl.innerHTML;
        this._editorEl.style.display = 'none';
        this._sourceEl.style.display = '';
      }
    } else {
      // Switch to WYSIWYG
      if (this._sourceEl && this._editorEl) {
        this._editorEl.innerHTML = this.sanitize(this._sourceEl.value);
        this._sourceEl.style.display = 'none';
        this._editorEl.style.display = '';
      }
    }
  }

  isSourceEdit(): boolean {
    return this._sourceMode;
  }

  // -----------------------------------------------------------------------
  // Sanitize
  // -----------------------------------------------------------------------

  private sanitize(html: string): string {
    return html.replace(XSS_TAGS, '');
  }
}
