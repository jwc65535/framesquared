/**
 * @framesquared/core – FocusManager
 *
 * Manages focus trapping for modal dialogs, focus save/restore,
 * and roving tabindex patterns.
 */

let trapped = false;
let trapContainer: HTMLElement | null = null;
let savedFocus: Element | null = null;
let keyHandler: ((e: KeyboardEvent) => void) | null = null;

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll(FOCUSABLE));
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.key !== 'Tab' || !trapContainer) return;
  const focusable = getFocusableElements(trapContainer);
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

export const FocusManager = {
  /**
   * Trap focus within a container.  Tab/Shift+Tab cycle among
   * focusable elements inside the container.
   */
  trapFocus(container: HTMLElement): void {
    trapped = true;
    trapContainer = container;
    keyHandler = onKeyDown;
    document.addEventListener('keydown', keyHandler);
    // Focus first focusable element
    const focusable = getFocusableElements(container);
    if (focusable.length > 0) focusable[0].focus();
  },

  /** Release the focus trap. */
  releaseFocus(): void {
    trapped = false;
    trapContainer = null;
    if (keyHandler) {
      document.removeEventListener('keydown', keyHandler);
      keyHandler = null;
    }
  },

  isTrapped(): boolean {
    return trapped;
  },

  /** Save the currently focused element for later restoration. */
  saveFocus(): void {
    savedFocus = document.activeElement;
  },

  /** Restore focus to the previously saved element. */
  restoreFocus(): void {
    if (savedFocus && typeof (savedFocus as HTMLElement).focus === 'function') {
      (savedFocus as HTMLElement).focus();
    }
    savedFocus = null;
  },

  /** Reset all state (for tests). */
  reset(): void {
    if (keyHandler) {
      document.removeEventListener('keydown', keyHandler);
      keyHandler = null;
    }
    trapped = false;
    trapContainer = null;
    savedFocus = null;
  },
};
