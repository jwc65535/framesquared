/**
 * @framesquared/fx – Animation
 *
 * Wraps the Web Animations API (Element.animate()).  Provides a
 * config-driven interface with play/pause/cancel/finish/reverse
 * controls and a finished promise.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface AnimationConfig {
  target: Element;
  keyframes: Keyframe[];
  duration?: number;
  easing?: string;
  delay?: number;
  iterations?: number;
  direction?: PlaybackDirection;
  fill?: FillMode;
}

export class Animation {
  private target: Element;
  private keyframes: Keyframe[];
  private options: KeyframeAnimationOptions;
  private waAnimation: globalThis.Animation | null = null;

  /** Resolves when the animation completes. */
  finished: Promise<void>;
  private _resolveFinished!: () => void;

  constructor(config: AnimationConfig) {
    this.target = config.target;
    this.keyframes = config.keyframes;
    this.options = {
      duration: config.duration ?? 300,
      easing: config.easing ?? 'ease',
      delay: config.delay ?? 0,
      iterations: config.iterations ?? 1,
      direction: config.direction ?? 'normal',
      fill: config.fill ?? 'none',
    };
    this.finished = new Promise<void>((resolve) => {
      this._resolveFinished = resolve;
    });
  }

  play(): this {
    this.waAnimation = this.target.animate(this.keyframes, this.options);
    // Wire the finished promise
    this.waAnimation.finished
      .then(() => this._resolveFinished())
      .catch(() => {
        /* cancelled */
      });
    return this;
  }

  pause(): this {
    this.waAnimation?.pause();
    return this;
  }

  cancel(): this {
    this.waAnimation?.cancel();
    return this;
  }

  finish(): this {
    this.waAnimation?.finish();
    return this;
  }

  reverse(): this {
    this.waAnimation?.reverse();
    return this;
  }

  getPlayState(): string {
    return this.waAnimation?.playState ?? 'idle';
  }

  get currentTime(): number | null {
    return (this.waAnimation?.currentTime as number | null) ?? null;
  }

  get playbackRate(): number {
    return this.waAnimation?.playbackRate ?? 1;
  }

  set playbackRate(rate: number) {
    if (this.waAnimation) this.waAnimation.playbackRate = rate;
  }

  /** Get the underlying WAAPI Animation object. */
  getNative(): globalThis.Animation | null {
    return this.waAnimation;
  }
}
