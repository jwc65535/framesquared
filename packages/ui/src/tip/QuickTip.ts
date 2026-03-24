/**
 * @framesquared/ui – QuickTip
 *
 * Singleton that auto-creates tooltips from DOM data attributes.
 * Uses event delegation on document.body to monitor mouseenter on
 * elements with `data-qtip`, `data-qtitle`, `data-qwidth`.
 *
 * Usage:
 *   QuickTip.init();  // Start monitoring
 *   // Any element with data-qtip="text" now gets a tooltip
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// QuickTip singleton state
// ---------------------------------------------------------------------------

let enabled = false;
let initialized = false;
let currentTipEl: HTMLElement | null = null;
let tipElement: HTMLElement | null = null;
let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

const SHOW_DELAY = 500;
const HIDE_DELAY = 200;

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

function onMouseOver(e: MouseEvent): void {
  if (!enabled) return;

  const target = (e.target as Element)?.closest?.('[data-qtip]') as HTMLElement | null;
  if (!target) return;
  if (target === currentTipEl) return;

  // Clear any pending hide
  clearHide();
  clearShow();

  currentTipEl = target;

  showTimer = setTimeout(() => {
    showTimer = null;
    showQuickTip(target, e);
  }, SHOW_DELAY);
}

function onMouseOut(e: MouseEvent): void {
  if (!enabled) return;

  const target = (e.target as Element)?.closest?.('[data-qtip]') as HTMLElement | null;
  if (!target || target !== currentTipEl) return;

  clearShow();

  hideTimer = setTimeout(() => {
    hideTimer = null;
    hideQuickTip();
  }, HIDE_DELAY);
}

function showQuickTip(target: HTMLElement, _e: MouseEvent): void {
  const text = target.getAttribute('data-qtip') ?? '';
  const title = target.getAttribute('data-qtitle') ?? '';
  const width = target.getAttribute('data-qwidth') ?? '';

  // If tipElement was removed from DOM (e.g. between tests), recreate
  if (tipElement && !document.body.contains(tipElement)) {
    tipElement = null;
  }

  if (!tipElement) {
    tipElement = document.createElement('div');
    tipElement.classList.add('x-tooltip');
    tipElement.style.position = 'fixed';
    tipElement.style.zIndex = '99999';
    document.body.appendChild(tipElement);
  }

  tipElement.innerHTML = '';

  if (title) {
    const hdr = document.createElement('div');
    hdr.classList.add('x-tip-header');
    hdr.textContent = title;
    tipElement.appendChild(hdr);
  }

  const body = document.createElement('div');
  body.classList.add('x-tip-body');
  body.textContent = text;
  tipElement.appendChild(body);

  if (width) {
    tipElement.style.maxWidth = `${width}px`;
  } else {
    tipElement.style.maxWidth = '';
  }

  // Position near the target
  const rect = target.getBoundingClientRect();
  tipElement.style.left = `${rect.left}px`;
  tipElement.style.top = `${rect.bottom + 5}px`;
  tipElement.style.display = '';
  tipElement.classList.remove('x-tip-hidden');
}

function hideQuickTip(): void {
  if (tipElement) {
    tipElement.classList.add('x-tip-hidden');
    tipElement.style.display = 'none';
  }
  currentTipEl = null;
}

function clearShow(): void {
  if (showTimer !== null) { clearTimeout(showTimer); showTimer = null; }
}

function clearHide(): void {
  if (hideTimer !== null) { clearTimeout(hideTimer); hideTimer = null; }
}

// ---------------------------------------------------------------------------
// QuickTip public API
// ---------------------------------------------------------------------------

export class QuickTip {
  static init(): void {
    if (!initialized) {
      document.addEventListener('mouseover', onMouseOver as any, true);
      document.addEventListener('mouseout', onMouseOut as any, true);
      initialized = true;
    }
    enabled = true;
  }

  static enable(): void {
    enabled = true;
  }

  static disable(): void {
    enabled = false;
    clearShow();
    clearHide();
    hideQuickTip();
  }

  static isEnabled(): boolean {
    return enabled;
  }
}
