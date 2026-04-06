/**
 * @framesquared/component – base component styles
 *
 * Injected once as a side-effect when the package is first imported.
 * All measurements use CSS custom properties set by @framesquared/theme
 * so any registered theme is automatically reflected here.
 */

const STYLES = `
/* ── Bridge: convert unitless theme tokens to usable CSS values ─────────── */
:root {
  --x-sp-xs:  calc(var(--ext-spacing-xs,  4) * 1px);
  --x-sp-sm:  calc(var(--ext-spacing-sm,  8) * 1px);
  --x-sp-md:  calc(var(--ext-spacing-md, 16) * 1px);
  --x-sp-lg:  calc(var(--ext-spacing-lg, 24) * 1px);
  --x-sp-xl:  calc(var(--ext-spacing-xl, 32) * 1px);
  --x-r-sm:   calc(var(--ext-borderRadius-sm, 2) * 1px);
  --x-r-md:   calc(var(--ext-borderRadius-md, 4) * 1px);
  --x-r-lg:   calc(var(--ext-borderRadius-lg, 8) * 1px);
}

/* ── Box-sizing ─────────────────────────────────────────────────────────── */
.x-component,
.x-component *,
.x-component *::before,
.x-component *::after {
  box-sizing: border-box;
}

/* ── Base component ─────────────────────────────────────────────────────── */
.x-component {
  font-family: var(--ext-typography-fontFamily-sans,
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
  font-size: 14px;
  line-height: 1.5;
  color: var(--ext-color-text-primary, #212121);
}

/* ── Disabled state ─────────────────────────────────────────────────────── */
.x-component.x-disabled {
  opacity: 0.45;
  pointer-events: none;
  cursor: not-allowed;
}

/* ── Floating ───────────────────────────────────────────────────────────── */
.x-floating {
  position: absolute;
  z-index: 1000;
}

/* ── Container body ─────────────────────────────────────────────────────── */
.x-container-body {
  display: flex;
  flex-direction: column;
  gap: var(--x-sp-sm);
}
`;

if (typeof document !== 'undefined' && !document.querySelector('[data-x-component-styles]')) {
  const el = document.createElement('style');
  el.setAttribute('data-x-component-styles', '');
  el.textContent = STYLES;
  document.head.appendChild(el);
}

export {};
