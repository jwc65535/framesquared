/**
 * @ext-ts/fx – Transition
 *
 * CSS transition management: set/clear transitions on elements,
 * and register transitionend callbacks with cleanup.
 */

export const Transition = {
  /**
   * Set a CSS transition on an element.
   * @param el Target element
   * @param property CSS property name(s), comma-separated
   * @param duration Duration in ms
   * @param easing CSS easing string
   */
  set(el: HTMLElement, property: string, duration: number, easing = 'ease'): void {
    const props = property.split(',').map(p => p.trim());
    el.style.transition = props
      .map(p => `${p} ${duration}ms ${easing}`)
      .join(', ');
  },

  /** Remove all transitions from an element. */
  clear(el: HTMLElement): void {
    el.style.transition = '';
  },

  /**
   * Register a callback for transitionend.  Returns a cleanup
   * function that removes the listener.
   */
  onEnd(el: HTMLElement, callback: (e: Event) => void): () => void {
    el.addEventListener('transitionend', callback);
    return () => el.removeEventListener('transitionend', callback);
  },
};
