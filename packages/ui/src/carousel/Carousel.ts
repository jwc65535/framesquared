/**
 * @framesquared/ui – Carousel
 *
 * A Container that slides one child into view at a time.
 * Provides next/prev navigation, indicator pips, and pointer drag-to-switch.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Container } from '@framesquared/component';
import type { ContainerConfig, Component } from '@framesquared/component';
import { ClassManager } from '@framesquared/core';

export interface CarouselConfig extends ContainerConfig {
  /** 0-based index of the initially visible card. Default: 0 */
  activeItem?: number;
  /** Show indicator pips below the track. Default: true */
  indicators?: boolean;
  /** Wrap around at boundaries. Default: false */
  loop?: boolean;
  /** Slide animation duration in ms. 0 disables animation. Default: 350 */
  animDuration?: number;
  /** Auto-advance interval in ms. 0 or omitted disables auto-play. */
  autoPlay?: number;
}

export class Carousel extends Container {
  static override $className = 'Ext.carousel.Carousel';

  // Declared as types only — initialized in initialize() to avoid
  // ES2022 field declarations overwriting values set during super().
  declare private _track: HTMLElement | null;
  declare private _indicatorBar: HTMLElement | null;
  declare private _activeIndex: number;
  declare private _animating: boolean;
  declare private _dragStartX: number | null;
  declare private _loop: boolean;
  declare private _autoPlayTimer: ReturnType<typeof setInterval> | null;
  declare private _onPointerDown: ((e: PointerEvent) => void) | null;
  declare private _onPointerMove: ((e: PointerEvent) => void) | null;
  declare private _onPointerUp: ((e: PointerEvent) => void) | null;

  constructor(config: CarouselConfig = {}) {
    super({ xtype: 'carousel', ...config });
  }

  protected override initialize(): void {
    super.initialize();
    this._track = null;
    this._indicatorBar = null;
    this._activeIndex = (this._config as CarouselConfig).activeItem ?? 0;
    this._loop = (this._config as CarouselConfig).loop ?? false;
    this._autoPlayTimer = null;
    this._animating = false;
    this._dragStartX = null;
    this._onPointerDown = null;
    this._onPointerMove = null;
    this._onPointerUp = null;
  }

  protected override afterRender(): void {
    super.afterRender();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.el!.classList.add('x-carousel');

    const body = this.getBodyEl();

    // Create the sliding track and migrate all children rendered by
    // super.afterRender() into it. After this point body contains only _track
    // (and optionally _indicatorBar).
    this._track = document.createElement('div');
    this._track.classList.add('x-carousel-track');

    const childEls = Array.from(body.children);
    for (const child of childEls) {
      this._track.appendChild(child);
    }
    body.appendChild(this._track);

    this._syncTrack();

    const cfg = this._config as CarouselConfig;
    if (cfg.indicators !== false) {
      this._buildIndicators();
    }

    this._attachDrag();
    this._startAutoPlay();
  }

  override add(...items: (Component | Record<string, unknown>)[]): Component[] {
    const added = super.add(...items);
    // Post-render: super.add() renders new children directly into _bodyEl.
    // Move them into _track and refresh sizing.
    if (this.rendered && this._track) {
      const body = this.getBodyEl();
      for (const item of added) {
        if (item.el && item.el.parentElement === body) {
          this._track.appendChild(item.el);
        }
      }
      this._syncTrack();
      if (this._indicatorBar) {
        this._rebuildPips();
      }
    }
    return added;
  }

  // ── Track management ──────────────────────────────────────────────────────

  private _syncTrack(): void {
    if (!this._track) return;
    const n = this.getCount();
    this._track.style.width = n > 0 ? `${n * 100}%` : '100%';

    const items = this.getItems();
    for (const item of items) {
      if (item.el) {
        item.el.style.width = n > 0 ? `${100 / n}%` : '100%';
        item.el.style.flexShrink = '0';
        item.el.style.height = '100%';
        item.el.style.boxSizing = 'border-box';
      }
    }

    this._applyTranslate(false);
  }

  private _applyTranslate(animate: boolean): void {
    if (!this._track) return;
    const n = this.getCount();
    const pct = n > 0 ? -(this._activeIndex * 100) / n : 0;
    const cfg = this._config as CarouselConfig;
    const dur = cfg.animDuration ?? 350;

    if (animate && dur > 0) {
      this._animating = true;
      this._track.style.transition = `transform ${dur}ms ease-in-out`;
      const cleanup = () => {
        if (this._track) this._track.style.transition = '';
        this._track?.removeEventListener('transitionend', cleanup);
        this._animating = false;
      };
      this._track.addEventListener('transitionend', cleanup);
    }

    this._track.style.transform = `translateX(${pct}%)`;
  }

  // ── Indicators ────────────────────────────────────────────────────────────

  private _buildIndicators(): void {
    this._indicatorBar = document.createElement('div');
    this._indicatorBar.classList.add('x-carousel-indicators');
    this._rebuildPips();
    this.getBodyEl().appendChild(this._indicatorBar);
  }

  private _rebuildPips(): void {
    if (!this._indicatorBar) return;
    this._indicatorBar.innerHTML = '';
    const n = this.getCount();
    for (let i = 0; i < n; i++) {
      const pip = document.createElement('span');
      pip.classList.add('x-carousel-pip');
      if (i === this._activeIndex) {
        pip.classList.add('x-carousel-pip-active');
      }
      const idx = i;
      pip.addEventListener('click', () => this.goTo(idx));
      this._indicatorBar!.appendChild(pip);
    }
  }

  private _updateIndicators(oldIndex: number, newIndex: number): void {
    if (!this._indicatorBar) return;
    const pips = this._indicatorBar.querySelectorAll('.x-carousel-pip');
    pips[oldIndex]?.classList.remove('x-carousel-pip-active');
    pips[newIndex]?.classList.add('x-carousel-pip-active');
  }

  // ── Drag ─────────────────────────────────────────────────────────────────

  private _attachDrag(): void {
    if (!this._track) return;

    this._onPointerDown = (e: PointerEvent) => {
      if (this._animating) return;
      this._dragStartX = e.clientX;
      this._track!.setPointerCapture(e.pointerId);
      this._stopAutoPlay();
    };

    this._onPointerMove = (e: PointerEvent) => {
      if (this._dragStartX === null || !this._track) return;
      const delta = e.clientX - this._dragStartX;
      const n = this.getCount();
      const basePct = n > 0 ? -(this._activeIndex * 100) / n : 0;
      const containerWidth = this.el?.offsetWidth ?? 0;
      const trackWidth = n * containerWidth;
      const deltaPct = trackWidth > 0 ? (delta / trackWidth) * 100 : 0;
      this._track.style.transition = '';
      this._track.style.transform = `translateX(${basePct + deltaPct}%)`;
    };

    const onEnd = (e: PointerEvent) => {
      if (this._dragStartX === null) return;
      const delta = e.clientX - this._dragStartX;
      this._dragStartX = null;
      if (delta < -40) {
        this.next();
      } else if (delta > 40) {
        this.prev();
      } else {
        this._applyTranslate(true);
      }
      this._startAutoPlay();
    };
    this._onPointerUp = onEnd;

    this._track.addEventListener('pointerdown', this._onPointerDown);
    this._track.addEventListener('pointermove', this._onPointerMove);
    this._track.addEventListener('pointerup', this._onPointerUp);
    this._track.addEventListener('pointercancel', this._onPointerUp);
  }

  // ── Auto-play ─────────────────────────────────────────────────────────────

  private _startAutoPlay(): void {
    this._stopAutoPlay();
    const interval = (this._config as CarouselConfig).autoPlay ?? 0;
    if (interval > 0) {
      this._autoPlayTimer = setInterval(() => {
        if (this._activeIndex < this.getCount() - 1) {
          this.next();
        } else if (this._loop) {
          this.next();
        } else {
          this._stopAutoPlay();
        }
      }, interval);
    }
  }

  private _stopAutoPlay(): void {
    if (this._autoPlayTimer !== null) {
      clearInterval(this._autoPlayTimer);
      this._autoPlayTimer = null;
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  setActiveItem(index: number, animate = true): void {
    const items = this.getItems();
    if (index < 0 || index >= items.length) return;
    if (index === this._activeIndex) return;

    const oldIndex = this._activeIndex;
    const oldItem = items[oldIndex];
    const newItem = items[index];
    this._activeIndex = index;

    this._applyTranslate(animate);
    this._updateIndicators(oldIndex, index);

    this.fire('activeitemchange', this, newItem, oldItem, index, oldIndex);
  }

  next(): void {
    const n = this.getCount();
    if (n === 0) return;
    if (this._activeIndex < n - 1) {
      this.setActiveItem(this._activeIndex + 1);
    } else if (this._loop) {
      this.setActiveItem(0);
    }
  }

  prev(): void {
    const n = this.getCount();
    if (n === 0) return;
    if (this._activeIndex > 0) {
      this.setActiveItem(this._activeIndex - 1);
    } else if (this._loop) {
      this.setActiveItem(n - 1);
    }
  }

  goTo(index: number): void {
    this.setActiveItem(index);
  }

  getActiveItem(): Component | null {
    return this.getItems()[this._activeIndex] ?? null;
  }

  getActiveIndex(): number {
    return this._activeIndex;
  }

  setLoop(value: boolean): void {
    this._loop = value;
  }

  setAutoPlay(interval: number): void {
    (this._config as CarouselConfig).autoPlay = interval;
    this._startAutoPlay();
  }

  // ── Destroy ───────────────────────────────────────────────────────────────

  protected override onDestroy(): void {
    this._stopAutoPlay();
    if (this._track) {
      if (this._onPointerDown) {
        this._track.removeEventListener('pointerdown', this._onPointerDown);
      }
      if (this._onPointerMove) {
        this._track.removeEventListener('pointermove', this._onPointerMove);
      }
      if (this._onPointerUp) {
        this._track.removeEventListener('pointerup', this._onPointerUp);
        this._track.removeEventListener('pointercancel', this._onPointerUp);
      }
      this._track = null;
    }
    this._indicatorBar = null;
    this._onPointerDown = null;
    this._onPointerMove = null;
    this._onPointerUp = null;
    super.onDestroy();
  }
}

ClassManager.registerAlias('widget.carousel', Carousel as any);
