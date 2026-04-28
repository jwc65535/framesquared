/**
 * @framesquared/form – Slider
 *
 * A slider field with draggable thumb(s) on a track.  Supports
 * min/max, increment snapping, multi-thumb, vertical mode,
 * and full ARIA attributes.
 */

import { Field } from './Field.js';
import type { FieldConfig } from './Field.js';

export interface SliderConfig extends FieldConfig {
  minValue?: number;
  maxValue?: number;
  increment?: number;
  vertical?: boolean;
  useTips?: boolean;
  values?: number[];
  clickToChange?: boolean;
  animate?: boolean;
}

export class Slider extends Field {
  static override $className = 'Ext.slider.Slider';

  declare private _min: number;
  declare private _max: number;
  declare private _increment: number;
  declare private _vertical: boolean;
  declare private _values: number[];
  declare private _trackEl: HTMLElement | null;
  declare private _fillEl: HTMLElement | null;
  declare private _thumbEls: HTMLElement[];
  declare private _valueLabelEls: HTMLElement[];
  declare private _dragIndex: number;
  declare private _dragCleanup: (() => void) | null;

  constructor(config: SliderConfig = {}) {
    super({ xtype: 'sliderfield', ...config });
  }

  protected override initialize(): void {
    super.initialize();
    const cfg = this._config as SliderConfig;
    this._min = cfg.minValue ?? 0;
    this._max = cfg.maxValue ?? 100;
    this._increment = cfg.increment ?? 0;
    this._vertical = cfg.vertical ?? false;
    this._values = cfg.values
      ? cfg.values.map((v) => this.snap(this.clamp(v)))
      : [this.snap(this.clamp(Number(cfg.value ?? this._min)))];
    this._trackEl = null;
    this._fillEl = null;
    this._thumbEls = [];
    this._valueLabelEls = [];
    this._dragIndex = -1;
    this._dragCleanup = null;
  }

  protected override afterRender(): void {
    super.afterRender();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const el = this.el!;
    el.classList.add('x-slider');
    if (this._vertical) el.classList.add('x-slider-vertical');

    // Track
    this._trackEl = document.createElement('div');
    this._trackEl.classList.add('x-slider-track');
    (this._bodyWrapEl ?? el).appendChild(this._trackEl);

    // Fill (progress bar behind the thumb)
    this._fillEl = document.createElement('div');
    this._fillEl.classList.add('x-slider-fill');
    this._trackEl.appendChild(this._fillEl);

    // Thumbs
    for (let i = 0; i < this._values.length; i++) {
      const thumb = document.createElement('div');
      thumb.classList.add('x-slider-thumb');
      thumb.setAttribute('tabindex', '0');
      thumb.setAttribute('role', 'slider');
      thumb.setAttribute('aria-valuemin', String(this._min));
      thumb.setAttribute('aria-valuemax', String(this._max));
      thumb.setAttribute('aria-valuenow', String(this._values[i]));

      const label = document.createElement('span');
      label.classList.add('x-slider-value-label');
      label.textContent = String(this._values[i]);
      thumb.appendChild(label);

      this._trackEl.appendChild(thumb);
      this._thumbEls.push(thumb);
      this._valueLabelEls.push(label);
      this.setupThumbDrag(thumb, i);
    }

    this.positionThumbs();
  }

  // -----------------------------------------------------------------------
  // Value
  // -----------------------------------------------------------------------

  override getValue(): number {
    return this._values[0];
  }

  override setValue(value: unknown): void {
    const num = this.snap(this.clamp(Number(value)));
    const old = this._values[0];
    this._values[0] = num;
    this.positionThumbs();
    this.updateAria(0);
    if (num !== old) {
      this.fire('change', this, num, old);
    }
  }

  getValues(): number[] {
    return [...this._values];
  }

  // -----------------------------------------------------------------------
  // Constraints
  // -----------------------------------------------------------------------

  setMinValue(min: number): void {
    this._min = min;
    this._values = this._values.map((v) => this.snap(this.clamp(v)));
    this.positionThumbs();
    this.updateAllAria();
  }

  setMaxValue(max: number): void {
    this._max = max;
    this._values = this._values.map((v) => this.snap(this.clamp(v)));
    this.positionThumbs();
    this.updateAllAria();
  }

  setIncrement(inc: number): void {
    this._increment = inc;
  }

  private clamp(v: number): number {
    return Math.max(this._min, Math.min(this._max, v));
  }

  private snap(v: number): number {
    if (this._increment <= 0) return v;
    return Math.round(v / this._increment) * this._increment;
  }

  // -----------------------------------------------------------------------
  // Positioning
  // -----------------------------------------------------------------------

  private positionThumbs(): void {
    for (let i = 0; i < this._thumbEls.length; i++) {
      const pct = ((this._values[i] - this._min) / (this._max - this._min)) * 100;
      if (this._vertical) {
        this._thumbEls[i].style.bottom = `${pct}%`;
        if (this._fillEl) this._fillEl.style.height = `${pct}%`;
      } else {
        this._thumbEls[i].style.left = `${pct}%`;
        if (this._fillEl) this._fillEl.style.width = `${pct}%`;
      }
      if (this._valueLabelEls[i]) {
        this._valueLabelEls[i].textContent = String(this._values[i]);
      }
    }
  }

  private updateAria(index: number): void {
    const thumb = this._thumbEls[index];
    if (!thumb) return;
    thumb.setAttribute('aria-valuenow', String(this._values[index]));
    thumb.setAttribute('aria-valuemin', String(this._min));
    thumb.setAttribute('aria-valuemax', String(this._max));
  }

  private updateAllAria(): void {
    for (let i = 0; i < this._thumbEls.length; i++) this.updateAria(i);
  }

  // -----------------------------------------------------------------------
  // Drag
  // -----------------------------------------------------------------------

  private setupThumbDrag(thumb: HTMLElement, index: number): void {
    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      this._dragIndex = index;
      thumb.classList.add('x-slider-dragging');
      this.fire('dragstart', this, index);

      const onMove = (me: PointerEvent) => {
        if (this._dragIndex < 0 || !this._trackEl) return;
        const rect = this._trackEl.getBoundingClientRect();
        let ratio: number;
        if (this._vertical) {
          ratio = 1 - (me.clientY - rect.top) / rect.height;
        } else {
          ratio = (me.clientX - rect.left) / rect.width;
        }
        ratio = Math.max(0, Math.min(1, ratio));
        const raw = this._min + ratio * (this._max - this._min);
        const val = this.snap(this.clamp(raw));
        const old = this._values[this._dragIndex];
        this._values[this._dragIndex] = val;
        this.positionThumbs();
        this.updateAria(this._dragIndex);
        if (val !== old) this.fire('drag', this, val);
      };

      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        thumb.classList.remove('x-slider-dragging');
        this.fire('dragend', this, this._values[this._dragIndex]);
        this.fire('changecomplete', this, this._values[this._dragIndex]);
        this._dragIndex = -1;
      };

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    };

    thumb.addEventListener('pointerdown', onDown);
  }
}
