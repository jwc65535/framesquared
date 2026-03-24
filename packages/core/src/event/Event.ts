/**
 * @ext-ts/core – ExtEvent
 *
 * Represents a fired event.  Provides `preventDefault()`,
 * `stopPropagation()`, and `stopEvent()` controls.
 */

export class ExtEvent {
  readonly eventName: string;
  readonly source: unknown;
  readonly timestamp: number;

  defaultPrevented = false;
  propagationStopped = false;

  constructor(eventName: string, source: unknown) {
    this.eventName = eventName;
    this.source = source;
    this.timestamp = performance.now();
  }

  preventDefault(): void {
    this.defaultPrevented = true;
  }

  stopPropagation(): void {
    this.propagationStopped = true;
  }

  /** Convenience: prevents default AND stops propagation. */
  stopEvent(): void {
    this.defaultPrevented = true;
    this.propagationStopped = true;
  }
}
