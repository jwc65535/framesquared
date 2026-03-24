/**
 * @framesquared/core – GestureRecognizer
 *
 * Detects touch/pointer gestures and dispatches synthetic CustomEvents
 * on the target element.  Uses PointerEvent exclusively (no IE).
 *
 * Recognized gestures: tap, doubletap, longpress, swipe, pinch, rotate.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TAP_MAX_DURATION = 400;       // ms — max time for a tap
const TAP_MAX_DISTANCE = 15;        // px — max movement for a tap
const DOUBLETAP_INTERVAL = 300;     // ms — max gap between two taps
const LONGPRESS_DURATION = 500;     // ms — hold time for longpress
const SWIPE_MIN_DISTANCE = 50;      // px — minimum swipe distance

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function angle(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
}

function dispatchGesture(
  el: Element,
  name: string,
  detail?: Record<string, unknown>,
): void {
  el.dispatchEvent(new CustomEvent(name, {
    bubbles: true,
    cancelable: true,
    detail: detail ?? {},
  }));
}

// ---------------------------------------------------------------------------
// Pointer tracking
// ---------------------------------------------------------------------------

interface PointerState {
  id: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
}

// ---------------------------------------------------------------------------
// GestureRecognizer
// ---------------------------------------------------------------------------

export class GestureRecognizer {
  private el: Element;
  private pointers = new Map<number, PointerState>();
  private longpressTimer: ReturnType<typeof setTimeout> | undefined;
  private lastTapTime = 0;
  private destroyed = false;

  // Multi-touch initial state
  private initialPinchDistance = 0;
  private initialPinchAngle = 0;

  // Bound handlers for removal
  private handleDown: (e: Event) => void;
  private handleMove: (e: Event) => void;
  private handleUp: (e: Event) => void;
  private handleCancel: (e: Event) => void;

  constructor(element: Element) {
    this.el = element;

    this.handleDown = (e) => this.onPointerDown(e as PointerEvent);
    this.handleMove = (e) => this.onPointerMove(e as PointerEvent);
    this.handleUp = (e) => this.onPointerUp(e as PointerEvent);
    this.handleCancel = (e) => this.onPointerCancel(e as PointerEvent);

    element.addEventListener('pointerdown', this.handleDown);
    element.addEventListener('pointermove', this.handleMove);
    element.addEventListener('pointerup', this.handleUp);
    element.addEventListener('pointercancel', this.handleCancel);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.el.removeEventListener('pointerdown', this.handleDown);
    this.el.removeEventListener('pointermove', this.handleMove);
    this.el.removeEventListener('pointerup', this.handleUp);
    this.el.removeEventListener('pointercancel', this.handleCancel);
    this.clearLongpress();
    this.pointers.clear();
  }

  // ----- pointer down -----

  private onPointerDown(e: PointerEvent): void {
    if (this.destroyed) return;

    const state: PointerState = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      startTime: Date.now(),
    };
    this.pointers.set(e.pointerId, state);

    if (this.pointers.size === 1) {
      // Single pointer — start longpress timer
      this.startLongpress(state);
    } else if (this.pointers.size === 2) {
      // Two pointers — record initial pinch/rotate state
      this.clearLongpress();
      this.recordTwoPointerBaseline();
    }
  }

  // ----- pointer move -----

  private onPointerMove(e: PointerEvent): void {
    if (this.destroyed) return;

    const state = this.pointers.get(e.pointerId);
    if (!state) return;

    state.currentX = e.clientX;
    state.currentY = e.clientY;

    // If moved too far, cancel longpress
    const dist = distance(state.startX, state.startY, state.currentX, state.currentY);
    if (dist > TAP_MAX_DISTANCE) {
      this.clearLongpress();
    }

    // Two-pointer gestures
    if (this.pointers.size === 2) {
      this.handleTwoPointerMove();
    }
  }

  // ----- pointer up -----

  private onPointerUp(e: PointerEvent): void {
    if (this.destroyed) return;

    const state = this.pointers.get(e.pointerId);
    if (!state) return;

    state.currentX = e.clientX;
    state.currentY = e.clientY;

    this.clearLongpress();

    const dt = Date.now() - state.startTime;
    const dist = distance(state.startX, state.startY, state.currentX, state.currentY);

    this.pointers.delete(e.pointerId);

    // Only process single-pointer gestures
    if (this.pointers.size > 0) return;

    // Swipe detection
    if (dist >= SWIPE_MIN_DISTANCE && dt < 1000) {
      this.fireSwipe(state);
      return;
    }

    // Tap detection
    if (dt < TAP_MAX_DURATION && dist < TAP_MAX_DISTANCE) {
      const now = Date.now();
      if (now - this.lastTapTime < DOUBLETAP_INTERVAL) {
        // Double tap
        dispatchGesture(this.el, 'doubletap');
        this.lastTapTime = 0; // reset so triple tap doesn't re-fire
      } else {
        // Single tap
        dispatchGesture(this.el, 'tap');
        this.lastTapTime = now;
      }
    }
  }

  // ----- pointer cancel -----

  private onPointerCancel(e: PointerEvent): void {
    if (this.destroyed) return;
    this.pointers.delete(e.pointerId);
    this.clearLongpress();
  }

  // ----- longpress -----

  private startLongpress(state: PointerState): void {
    this.clearLongpress();
    this.longpressTimer = setTimeout(() => {
      this.longpressTimer = undefined;
      // Check the pointer is still down and hasn't moved
      const current = this.pointers.get(state.id);
      if (!current) return;
      const dist = distance(current.startX, current.startY, current.currentX, current.currentY);
      if (dist < TAP_MAX_DISTANCE) {
        dispatchGesture(this.el, 'longpress');
      }
    }, LONGPRESS_DURATION);
  }

  private clearLongpress(): void {
    if (this.longpressTimer !== undefined) {
      clearTimeout(this.longpressTimer);
      this.longpressTimer = undefined;
    }
  }

  // ----- swipe -----

  private fireSwipe(state: PointerState): void {
    const dx = state.currentX - state.startX;
    const dy = state.currentY - state.startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    let direction: string;
    if (absDx > absDy) {
      direction = dx > 0 ? 'right' : 'left';
    } else {
      direction = dy > 0 ? 'down' : 'up';
    }

    dispatchGesture(this.el, 'swipe', {
      direction,
      distance: Math.max(absDx, absDy),
      deltaX: dx,
      deltaY: dy,
    });
  }

  // ----- two-pointer: pinch + rotate -----

  private recordTwoPointerBaseline(): void {
    const pts = [...this.pointers.values()];
    if (pts.length < 2) return;
    this.initialPinchDistance = distance(
      pts[0].currentX, pts[0].currentY,
      pts[1].currentX, pts[1].currentY,
    );
    this.initialPinchAngle = angle(
      pts[0].currentX, pts[0].currentY,
      pts[1].currentX, pts[1].currentY,
    );
  }

  private handleTwoPointerMove(): void {
    const pts = [...this.pointers.values()];
    if (pts.length < 2) return;

    const currentDist = distance(
      pts[0].currentX, pts[0].currentY,
      pts[1].currentX, pts[1].currentY,
    );
    const currentAngle = angle(
      pts[0].currentX, pts[0].currentY,
      pts[1].currentX, pts[1].currentY,
    );

    // Pinch
    if (this.initialPinchDistance > 0) {
      const scale = currentDist / this.initialPinchDistance;
      dispatchGesture(this.el, 'pinch', {
        scale,
        distance: currentDist,
      });
    }

    // Rotate
    const angleDelta = currentAngle - this.initialPinchAngle;
    dispatchGesture(this.el, 'rotate', {
      angle: angleDelta,
      rotation: angleDelta,
    });
  }
}
