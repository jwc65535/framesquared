/**
 * @framesquared/fx – Anim
 *
 * Convenience factory for predefined animations.  Each method
 * returns an Animation instance.  Also provides queue() for
 * sequential and parallel() for simultaneous execution.
 */

import { Animation } from './Animation.js';

export interface AnimOptions {
  duration?: number;
  easing?: string;
  delay?: number;
  fill?: FillMode;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SlideOptions extends AnimOptions {}
interface HighlightOptions extends AnimOptions {
  color?: string;
}
interface ScaleOptions extends AnimOptions {
  from?: number;
  to?: number;
}
interface RotateOptions extends AnimOptions {
  degrees?: number;
}

export const Anim = {
  // -----------------------------------------------------------------------
  // Fade
  // -----------------------------------------------------------------------

  fadeIn(el: Element, opts: AnimOptions = {}): Animation {
    return new Animation({
      target: el,
      keyframes: [{ opacity: '0' }, { opacity: '1' }],
      duration: opts.duration ?? 300,
      easing: opts.easing ?? 'ease',
      delay: opts.delay ?? 0,
      fill: opts.fill ?? 'both',
    });
  },

  fadeOut(el: Element, opts: AnimOptions = {}): Animation {
    return new Animation({
      target: el,
      keyframes: [{ opacity: '1' }, { opacity: '0' }],
      duration: opts.duration ?? 300,
      easing: opts.easing ?? 'ease',
      delay: opts.delay ?? 0,
      fill: opts.fill ?? 'both',
    });
  },

  // -----------------------------------------------------------------------
  // Slide
  // -----------------------------------------------------------------------

  slideIn(
    el: Element,
    direction: 'left' | 'right' | 'top' | 'bottom' = 'left',
    opts: SlideOptions = {},
  ): Animation {
    const transforms: Record<string, string> = {
      left: 'translateX(-100%)',
      right: 'translateX(100%)',
      top: 'translateY(-100%)',
      bottom: 'translateY(100%)',
    };
    return new Animation({
      target: el,
      keyframes: [
        { transform: transforms[direction], opacity: '0' },
        { transform: 'translateX(0) translateY(0)', opacity: '1' },
      ],
      duration: opts.duration ?? 400,
      easing: opts.easing ?? 'ease-out',
      fill: opts.fill ?? 'both',
    });
  },

  slideOut(
    el: Element,
    direction: 'left' | 'right' | 'top' | 'bottom' = 'right',
    opts: SlideOptions = {},
  ): Animation {
    const transforms: Record<string, string> = {
      left: 'translateX(-100%)',
      right: 'translateX(100%)',
      top: 'translateY(-100%)',
      bottom: 'translateY(100%)',
    };
    return new Animation({
      target: el,
      keyframes: [
        { transform: 'translateX(0) translateY(0)', opacity: '1' },
        { transform: transforms[direction], opacity: '0' },
      ],
      duration: opts.duration ?? 400,
      easing: opts.easing ?? 'ease-in',
      fill: opts.fill ?? 'both',
    });
  },

  // -----------------------------------------------------------------------
  // Highlight
  // -----------------------------------------------------------------------

  highlight(el: Element, opts: HighlightOptions = {}): Animation {
    const color = opts.color ?? 'yellow';
    return new Animation({
      target: el,
      keyframes: [{ backgroundColor: color }, { backgroundColor: 'transparent' }],
      duration: opts.duration ?? 1000,
      easing: opts.easing ?? 'ease-in-out',
      fill: opts.fill ?? 'both',
    });
  },

  // -----------------------------------------------------------------------
  // Scale
  // -----------------------------------------------------------------------

  scale(el: Element, opts: ScaleOptions = {}): Animation {
    const from = opts.from ?? 1;
    const to = opts.to ?? 1.5;
    return new Animation({
      target: el,
      keyframes: [{ transform: `scale(${from})` }, { transform: `scale(${to})` }],
      duration: opts.duration ?? 300,
      easing: opts.easing ?? 'ease',
      fill: opts.fill ?? 'both',
    });
  },

  // -----------------------------------------------------------------------
  // Rotate
  // -----------------------------------------------------------------------

  rotate(el: Element, opts: RotateOptions = {}): Animation {
    const degrees = opts.degrees ?? 360;
    return new Animation({
      target: el,
      keyframes: [{ transform: 'rotate(0deg)' }, { transform: `rotate(${degrees}deg)` }],
      duration: opts.duration ?? 500,
      easing: opts.easing ?? 'ease',
      fill: opts.fill ?? 'both',
    });
  },

  // -----------------------------------------------------------------------
  // Shake
  // -----------------------------------------------------------------------

  shake(el: Element, opts: AnimOptions = {}): Animation {
    return new Animation({
      target: el,
      keyframes: [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(-2px)' },
        { transform: 'translateX(0)' },
      ],
      duration: opts.duration ?? 500,
      easing: opts.easing ?? 'ease-in-out',
    });
  },

  // -----------------------------------------------------------------------
  // Pulse
  // -----------------------------------------------------------------------

  pulse(el: Element, opts: AnimOptions = {}): Animation {
    return new Animation({
      target: el,
      keyframes: [
        { transform: 'scale(1)' },
        { transform: 'scale(1.1)' },
        { transform: 'scale(1)' },
      ],
      duration: opts.duration ?? 600,
      easing: opts.easing ?? 'ease-in-out',
    });
  },

  // -----------------------------------------------------------------------
  // Flip
  // -----------------------------------------------------------------------

  flip(el: Element, opts: AnimOptions = {}): Animation {
    return new Animation({
      target: el,
      keyframes: [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(180deg)' }],
      duration: opts.duration ?? 600,
      easing: opts.easing ?? 'ease-in-out',
      fill: opts.fill ?? 'both',
    });
  },

  // -----------------------------------------------------------------------
  // Queue — run animations sequentially
  // -----------------------------------------------------------------------

  async queue(animations: Animation[]): Promise<void> {
    for (const anim of animations) {
      anim.play();
      await anim.finished;
    }
  },

  // -----------------------------------------------------------------------
  // Parallel — run animations simultaneously
  // -----------------------------------------------------------------------

  async parallel(animations: Animation[]): Promise<void> {
    for (const anim of animations) {
      anim.play();
    }
    await Promise.all(animations.map((a) => a.finished));
  },
};
