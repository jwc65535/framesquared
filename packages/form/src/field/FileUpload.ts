/**
 * @framesquared/form – FileField
 *
 * A file upload field with a hidden <input type="file">,
 * a browse button, and a text display showing selected filename(s).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Field } from './Field.js';
import type { FieldConfig } from './Field.js';

export interface FileFieldConfig extends FieldConfig {
  buttonText?: string;
  buttonOnly?: boolean;
  accept?: string;
  multiple?: boolean;
}

export class FileField extends Field {
  static override $className = 'Ext.form.field.File';

  declare private _fileInput: HTMLInputElement;
  declare private _textDisplay: HTMLElement;
  declare private _files: FileList | null;

  constructor(config: FileFieldConfig = {}) {
    super({ xtype: 'filefield', ...config });
  }

  protected override initialize(): void {
    super.initialize();
    this._files = null;
  }

  protected override afterRender(): void {
    super.afterRender();
    const cfg = this._config as FileFieldConfig;
    this.el!.classList.add('x-filefield');

    const wrap = this._bodyWrapEl ?? this.el!;

    // Text display
    this._textDisplay = document.createElement('span');
    this._textDisplay.classList.add('x-filefield-text');
    if (cfg.buttonOnly) this._textDisplay.style.display = 'none';
    wrap.appendChild(this._textDisplay);

    // Browse button
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.classList.add('x-filefield-btn');
    btn.textContent = cfg.buttonText ?? 'Browse...';
    btn.addEventListener('click', () => this._fileInput.click());
    wrap.appendChild(btn);

    // Hidden file input
    this._fileInput = document.createElement('input');
    this._fileInput.type = 'file';
    this._fileInput.style.display = 'none';
    if (cfg.accept) this._fileInput.accept = cfg.accept;
    if (cfg.multiple) this._fileInput.multiple = true;
    if (this._name) this._fileInput.name = this._name;

    this._fileInput.addEventListener('change', () => {
      this._files = this._fileInput.files;
      const names = this._files
        ? Array.from(this._files)
            .map((f) => f.name)
            .join(', ')
        : '';
      this._textDisplay.textContent = names;
      this.fire('change', this, this._files);
    });

    wrap.appendChild(this._fileInput);
  }

  override getValue(): FileList | null {
    return this._files;
  }

  getFileInput(): HTMLInputElement {
    return this._fileInput;
  }
}
