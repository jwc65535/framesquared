/**
 * @framesquared/theme
 * Theming and CSS-in-JS token system
 */

export { Theme } from './Theme.js';
export type { ThemeConfig } from './Theme.js';
export { ThemeManager } from './ThemeManager.js';
export type { ThemeScope } from './ThemeManager.js';
export { StyleSheet } from './StyleSheet.js';
export { ThemeValidator } from './ThemeValidator.js';
export type { ValidationResult, ValidationError } from './ThemeValidator.js';

// Built-in themes
export { ClassicTheme } from './themes/ClassicTheme.js';
export { ModernTheme } from './themes/ModernTheme.js';
export { DarkTheme } from './themes/DarkTheme.js';
