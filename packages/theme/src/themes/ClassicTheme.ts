/**
 * @framesquared/theme – ClassicTheme
 * ExtJS classic look — blue tones, subtle gradients, traditional feel.
 */

import { Theme } from '../Theme.js';

export const ClassicTheme = new Theme({
  name: 'classic',
  tokens: {
    color: {
      primary: '#157fcc',
      secondary: '#486085',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#cf4c35',
      background: '#f0f0f0',
      surface: '#ffffff',
      text: { primary: '#333333', secondary: '#666666', disabled: '#999999', onPrimary: '#ffffff' },
      border: '#c8d0da',
    },
    spacing: { xs: 2, sm: 4, md: 8, lg: 12, xl: 16 },
    borderRadius: { sm: 1, md: 2, lg: 4, xl: 8, round: '50%' },
    shadow: {
      sm: '0 1px 2px rgba(0,0,0,0.15)',
      md: '0 2px 4px rgba(0,0,0,0.2)',
      lg: '0 4px 8px rgba(0,0,0,0.25)',
      xl: '0 8px 16px rgba(0,0,0,0.3)',
    },
    typography: {
      fontFamily: { sans: 'Tahoma, Arial, Verdana, sans-serif', mono: 'Consolas, monospace' },
      fontSize: { xs: 11, sm: 12, md: 13, lg: 14, xl: 18, xxl: 24 },
      fontWeight: { normal: 400, medium: 500, bold: 700 },
      lineHeight: { tight: 1.2, normal: 1.4, relaxed: 1.6 },
    },
    component: {
      button: { height: 28, padding: '0 12px', borderRadius: 2 },
      panel: { headerHeight: 32, borderWidth: 1, borderColor: '#99bce8' },
      field: { height: 26, labelWidth: 100 },
      grid: { rowHeight: 26, headerHeight: 30 },
    },
    breakpoints: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
    transition: { fast: '100ms', normal: '200ms', slow: '300ms' },
    zIndex: { dropdown: 1000, modal: 1050, tooltip: 1100, notification: 1200 },
  },
});
