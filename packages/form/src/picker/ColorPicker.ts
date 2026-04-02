/**
 * @framesquared/form – ColorPicker
 *
 * A grid of color swatches.  Fires 'select' with the hex color string.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Component } from '@framesquared/component';
import type { ComponentConfig } from '@framesquared/component';

const DEFAULT_COLORS = [
  '000000',
  '993300',
  '333300',
  '003300',
  '003366',
  '000080',
  '333399',
  '333333',
  '800000',
  'FF6600',
  '808000',
  '008000',
  '008080',
  '0000FF',
  '666699',
  '808080',
  'FF0000',
  'FF9900',
  '99CC00',
  '339966',
  '33CCCC',
  '3366FF',
  '800080',
  '969696',
  'FF00FF',
  'FFCC00',
  'FFFF00',
  '00FF00',
  '00FFFF',
  '00CCFF',
  '993366',
  'C0C0C0',
  'FF99CC',
  'FFCC99',
  'FFFF99',
  'CCFFCC',
  'CCFFFF',
  '99CCFF',
  'CC99FF',
  'FFFFFF',
];

export interface ColorPickerConfig extends ComponentConfig {
  colors?: string[];
}

export class ColorPicker extends Component {
  static override $className = 'Ext.picker.Color';

  declare private _colors: string[];
  declare private _selectedColor: string | null;

  constructor(config: ColorPickerConfig = {}) {
    super({ xtype: 'colorpicker', ...config });
  }

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as ColorPickerConfig;
    this._colors = cfg.colors ?? DEFAULT_COLORS;
    this._selectedColor = null;
  }

  protected override afterRender(): void {
    super.afterRender();
    this.el!.classList.add('x-colorpicker');
    this.buildSwatches();
  }

  private buildSwatches(): void {
    const el = this.el!;
    for (const color of this._colors) {
      const swatch = document.createElement('div');
      swatch.classList.add('x-colorpicker-swatch');
      swatch.style.backgroundColor = `#${color}`;
      swatch.setAttribute('data-color', color);

      swatch.addEventListener('click', () => {
        this._selectedColor = color;
        this.fire('select', this, color);
      });

      el.appendChild(swatch);
    }
  }

  getSelectedColor(): string | null {
    return this._selectedColor;
  }
}
