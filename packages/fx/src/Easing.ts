/**
 * @ext-ts/fx – Easing
 *
 * Named CSS easing strings.  Standard names map to CSS keywords;
 * extended names map to cubic-bezier() values.  Bounce easings
 * use linear() approximation since cubic-bezier can't represent them.
 */

export const Easing = {
  // CSS keywords
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',

  // Quadratic
  easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',

  // Cubic
  easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',

  // Back (overshoot)
  easeInBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  easeOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  easeInOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',

  // Bounce (approximated — true bounce can't be expressed as cubic-bezier)
  easeInBounce: 'cubic-bezier(0.6, 0.04, 0.98, 0.335)',
  easeOutBounce: 'cubic-bezier(0.015, 0.66, 0.39, 0.995)',
  easeInOutBounce: 'cubic-bezier(0.83, 0.04, 0.17, 1)',
} as const;

export type EasingName = keyof typeof Easing;
