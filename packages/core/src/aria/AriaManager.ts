/**
 * @framesquared/core – AriaManager
 *
 * Manages ARIA attributes across the framework.  Provides helpers
 * for setting roles, labels, descriptions, live regions, and
 * screen reader announcements.
 */

let descCounter = 0;
let liveRegion: HTMLElement | null = null;
let assertiveRegion: HTMLElement | null = null;

function ensureLiveRegion(priority: 'polite' | 'assertive'): HTMLElement {
  if (priority === 'assertive') {
    if (!assertiveRegion) {
      assertiveRegion = document.createElement('div');
      assertiveRegion.setAttribute('aria-live', 'assertive');
      assertiveRegion.setAttribute('aria-atomic', 'true');
      assertiveRegion.setAttribute('role', 'status');
      assertiveRegion.style.cssText =
        'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;';
      document.body.appendChild(assertiveRegion);
    }
    return assertiveRegion;
  }
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.setAttribute('role', 'status');
    liveRegion.style.cssText =
      'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;';
    document.body.appendChild(liveRegion);
  }
  return liveRegion;
}

export const AriaManager = {
  setRole(element: Element, role: string): void {
    element.setAttribute('role', role);
  },

  setLabel(element: Element, label: string): void {
    element.setAttribute('aria-label', label);
  },

  setLabelledBy(element: Element, id: string): void {
    element.setAttribute('aria-labelledby', id);
  },

  setDescription(element: Element, description: string): void {
    const id = `ext-aria-desc-${descCounter++}`;
    const descEl = document.createElement('span');
    descEl.id = id;
    descEl.textContent = description;
    descEl.style.cssText =
      'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);';
    if (element.parentNode) {
      element.parentNode.appendChild(descEl);
    } else {
      document.body.appendChild(descEl);
    }
    element.setAttribute('aria-describedby', id);
  },

  setLive(element: Element, mode: 'polite' | 'assertive' | 'off'): void {
    element.setAttribute('aria-live', mode);
  },

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const region = ensureLiveRegion(priority);
    region.textContent = message;
  },

  /** Generate a unique ID for ARIA linking. */
  generateId(prefix = 'ext-aria'): string {
    return `${prefix}-${descCounter++}`;
  },
};
