import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Animation } from '../src/Animation.js';
import { Anim } from '../src/Anim.js';
import { Easing } from '../src/Easing.js';
import { Transition } from '../src/Transition.js';

// -----------------------------------------------------------------------
// WAAPI Mock — jsdom doesn't support Element.animate()
// -----------------------------------------------------------------------

interface MockWAAnimation {
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
  playState: string;
  currentTime: number | null;
  playbackRate: number;
  finished: Promise<void>;
  _resolve: () => void;
  play(): void;
  pause(): void;
  cancel(): void;
  finish(): void;
  reverse(): void;
}

function installWAAPIMock() {
  const animations: MockWAAnimation[] = [];

  Element.prototype.animate = function (
    keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
    options?: number | KeyframeAnimationOptions,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let _resolve: () => void = () => {};
    const finished = new Promise<void>((resolve) => {
      _resolve = resolve;
    });

    const anim: MockWAAnimation = {
      keyframes: Array.isArray(keyframes) ? keyframes : [],
      options: typeof options === 'number' ? { duration: options } : (options ?? {}),
      playState: 'running',
      currentTime: 0,
      playbackRate: 1,
      finished,
      _resolve,
      play() {
        this.playState = 'running';
      },
      pause() {
        this.playState = 'paused';
      },
      cancel() {
        this.playState = 'idle';
      },
      finish() {
        this.playState = 'finished';
        this._resolve();
      },
      reverse() {
        this.playbackRate *= -1;
      },
    };
    animations.push(anim);
    return anim;
  };

  return {
    getAll: () => animations,
    getLast: () => animations[animations.length - 1],
    clear: () => {
      animations.length = 0;
    },
  };
}

let mock: ReturnType<typeof installWAAPIMock>;
beforeEach(() => {
  mock = installWAAPIMock();
});
afterEach(() => {
  document.body.innerHTML = '';
  mock.clear();
});

// ═══════════════════════════════════════════════════════════════════════════
// Animation
// ═══════════════════════════════════════════════════════════════════════════

describe('Animation', () => {
  it('calls Element.animate with correct keyframes', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const anim = new Animation({
      target: el,
      keyframes: [{ opacity: '0' }, { opacity: '1' }],
      duration: 300,
    });
    anim.play();
    const wa = mock.getLast();
    expect(wa).toBeDefined();
    expect(wa.keyframes).toEqual([{ opacity: '0' }, { opacity: '1' }]);
  });

  it('passes duration option', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const anim = new Animation({ target: el, keyframes: [{ opacity: '1' }], duration: 500 });
    anim.play();
    expect(mock.getLast().options.duration).toBe(500);
  });

  it('passes easing option', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const anim = new Animation({
      target: el,
      keyframes: [{ opacity: '1' }],
      duration: 300,
      easing: 'ease-in-out',
    });
    anim.play();
    expect(mock.getLast().options.easing).toBe('ease-in-out');
  });

  it('passes delay, iterations, direction, fill', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const anim = new Animation({
      target: el,
      keyframes: [{ opacity: '1' }],
      duration: 200,
      delay: 100,
      iterations: 3,
      direction: 'alternate',
      fill: 'both',
    });
    anim.play();
    const opts = mock.getLast().options;
    expect(opts.delay).toBe(100);
    expect(opts.iterations).toBe(3);
    expect(opts.direction).toBe('alternate');
    expect(opts.fill).toBe('both');
  });

  it('pause pauses the animation', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const anim = new Animation({ target: el, keyframes: [{ opacity: '1' }], duration: 300 });
    anim.play();
    anim.pause();
    expect(mock.getLast().playState).toBe('paused');
  });

  it('cancel cancels the animation', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const anim = new Animation({ target: el, keyframes: [{ opacity: '1' }], duration: 300 });
    anim.play();
    anim.cancel();
    expect(mock.getLast().playState).toBe('idle');
  });

  it('finish completes the animation', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const anim = new Animation({ target: el, keyframes: [{ opacity: '1' }], duration: 300 });
    anim.play();
    anim.finish();
    expect(mock.getLast().playState).toBe('finished');
  });

  it('reverse reverses playback', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const anim = new Animation({ target: el, keyframes: [{ opacity: '1' }], duration: 300 });
    anim.play();
    anim.reverse();
    expect(mock.getLast().playbackRate).toBe(-1);
  });

  it('finished returns a promise', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const anim = new Animation({ target: el, keyframes: [{ opacity: '1' }], duration: 300 });
    anim.play();
    anim.finish();
    await expect(anim.finished).resolves.toBeUndefined();
  });

  it('getPlayState returns current state', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const anim = new Animation({ target: el, keyframes: [{ opacity: '1' }], duration: 300 });
    expect(anim.getPlayState()).toBe('idle');
    anim.play();
    expect(anim.getPlayState()).toBe('running');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Anim — predefined animations
// ═══════════════════════════════════════════════════════════════════════════

describe('Anim — predefined', () => {
  it('fadeIn creates opacity 0→1 keyframes', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const anim = Anim.fadeIn(el, { duration: 200 });
    anim.play();
    const wa = mock.getLast();
    expect(wa.keyframes[0]).toHaveProperty('opacity', '0');
    expect(wa.keyframes[1]).toHaveProperty('opacity', '1');
  });

  it('fadeOut creates opacity 1→0 keyframes', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const anim = Anim.fadeOut(el, { duration: 200 });
    anim.play();
    const wa = mock.getLast();
    expect(wa.keyframes[0]).toHaveProperty('opacity', '1');
    expect(wa.keyframes[1]).toHaveProperty('opacity', '0');
  });

  it('slideIn("left") creates translateX keyframes', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const anim = Anim.slideIn(el, 'left', { duration: 300 });
    anim.play();
    const wa = mock.getLast();
    expect(wa.keyframes[0]).toHaveProperty('transform');
    expect(String(wa.keyframes[0].transform)).toContain('translateX');
  });

  it('slideOut("right") creates translateX keyframes', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const anim = Anim.slideOut(el, 'right', { duration: 300 });
    anim.play();
    const wa = mock.getLast();
    expect(wa.keyframes[1]).toHaveProperty('transform');
    expect(String(wa.keyframes[1].transform)).toContain('translateX');
  });

  it('highlight flashes background color', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const anim = Anim.highlight(el, { color: 'yellow', duration: 500 });
    anim.play();
    const wa = mock.getLast();
    expect(wa.keyframes.length).toBeGreaterThan(1);
  });

  it('scale creates transform scale keyframes', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const anim = Anim.scale(el, { from: 0.5, to: 1.5, duration: 300 });
    anim.play();
    const wa = mock.getLast();
    expect(String(wa.keyframes[0].transform)).toContain('scale(0.5)');
    expect(String(wa.keyframes[1].transform)).toContain('scale(1.5)');
  });

  it('shake creates translateX oscillation', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const anim = Anim.shake(el, { duration: 400 });
    anim.play();
    const wa = mock.getLast();
    expect(wa.keyframes.length).toBeGreaterThan(2);
  });

  it('pulse creates scale oscillation', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const anim = Anim.pulse(el, { duration: 500 });
    anim.play();
    const wa = mock.getLast();
    expect(wa.keyframes.length).toBe(3);
  });

  it('rotate creates rotation keyframes', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const anim = Anim.rotate(el, { degrees: 360, duration: 600 });
    anim.play();
    const wa = mock.getLast();
    expect(String(wa.keyframes[1].transform)).toContain('rotate(360deg)');
  });

  it('flip creates rotateY keyframes', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const anim = Anim.flip(el, { duration: 500 });
    anim.play();
    const wa = mock.getLast();
    expect(String(wa.keyframes[1].transform)).toContain('rotateY');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Anim — queue and parallel
// ═══════════════════════════════════════════════════════════════════════════

describe('Anim — queue', () => {
  it('queue runs animations sequentially', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const order: string[] = [];

    const a1 = Anim.fadeIn(el, { duration: 100 });
    const a2 = Anim.fadeOut(el, { duration: 100 });

    const promise = Anim.queue([a1, a2]);

    // First animation should be playing
    expect(mock.getAll().length).toBe(1);
    order.push('a1-started');

    // Finish first animation → second should start
    mock.getLast().finish();
    await new Promise((r) => setTimeout(r, 0)); // microtask flush

    expect(mock.getAll().length).toBe(2);
    order.push('a2-started');

    mock.getLast().finish();
    await promise;
    order.push('done');

    expect(order).toEqual(['a1-started', 'a2-started', 'done']);
  });

  it('parallel runs animations simultaneously', () => {
    const el1 = document.createElement('div');
    const el2 = document.createElement('div');
    document.body.appendChild(el1);
    document.body.appendChild(el2);

    const a1 = Anim.fadeIn(el1, { duration: 200 });
    const a2 = Anim.fadeIn(el2, { duration: 200 });

    Anim.parallel([a1, a2]);

    // Both should be playing
    expect(mock.getAll().length).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Easing
// ═══════════════════════════════════════════════════════════════════════════

describe('Easing', () => {
  it('linear returns "linear"', () => {
    expect(Easing.linear).toBe('linear');
  });

  it('ease returns "ease"', () => {
    expect(Easing.ease).toBe('ease');
  });

  it('easeIn returns "ease-in"', () => {
    expect(Easing.easeIn).toBe('ease-in');
  });

  it('easeOut returns "ease-out"', () => {
    expect(Easing.easeOut).toBe('ease-out');
  });

  it('easeInOut returns "ease-in-out"', () => {
    expect(Easing.easeInOut).toBe('ease-in-out');
  });

  it('easeInQuad is a cubic-bezier string', () => {
    expect(Easing.easeInQuad).toContain('cubic-bezier');
  });

  it('easeOutCubic is a cubic-bezier string', () => {
    expect(Easing.easeOutCubic).toContain('cubic-bezier');
  });

  it('easeInBack is a cubic-bezier string', () => {
    expect(Easing.easeInBack).toContain('cubic-bezier');
  });

  it('easeOutBounce is a valid easing string', () => {
    expect(typeof Easing.easeOutBounce).toBe('string');
    expect(Easing.easeOutBounce.length).toBeGreaterThan(0);
  });

  it('all named easings are defined', () => {
    const names = [
      'linear',
      'ease',
      'easeIn',
      'easeOut',
      'easeInOut',
      'easeInQuad',
      'easeOutQuad',
      'easeInOutQuad',
      'easeInCubic',
      'easeOutCubic',
      'easeInOutCubic',
      'easeInBack',
      'easeOutBack',
      'easeInOutBack',
      'easeInBounce',
      'easeOutBounce',
      'easeInOutBounce',
    ];
    for (const name of names) {
      expect((Easing as Record<string, string>)[name]).toBeDefined();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Transition
// ═══════════════════════════════════════════════════════════════════════════

describe('Transition', () => {
  it('setTransition sets CSS transition property', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    Transition.set(el, 'opacity', 300, 'ease');
    expect(el.style.transition).toContain('opacity');
    expect(el.style.transition).toContain('300ms');
  });

  it('setTransition with multiple properties', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    Transition.set(el, 'opacity, transform', 500, 'ease-in');
    expect(el.style.transition).toContain('opacity');
    expect(el.style.transition).toContain('transform');
  });

  it('clear removes transition', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    Transition.set(el, 'opacity', 300, 'ease');
    Transition.clear(el);
    expect(el.style.transition).toBe('');
  });

  it('onTransitionEnd registers callback', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const spy = vi.fn();
    const cleanup = Transition.onEnd(el, spy);
    el.dispatchEvent(new Event('transitionend'));
    expect(spy).toHaveBeenCalled();
    cleanup();
  });

  it('cleanup removes listener', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const spy = vi.fn();
    const cleanup = Transition.onEnd(el, spy);
    cleanup();
    el.dispatchEvent(new Event('transitionend'));
    expect(spy).not.toHaveBeenCalled();
  });
});
