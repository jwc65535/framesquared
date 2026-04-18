/**
 * @framesquared/theme – ModernTheme
 * Clean, flat design — Material-inspired colors, generous spacing.
 */

import { Theme } from '../Theme.js';

export const ModernTheme = new Theme({
  name: 'modern',
  tokens: {
    color: {
      primary: '#1976d2',
      secondary: '#dc004e',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: { primary: '#212121', secondary: '#757575', disabled: '#bdbdbd', onPrimary: '#ffffff' },
      border: '#e0e0e0',
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    borderRadius: { sm: 2, md: 4, lg: 8, xl: 16, round: '50%' },
    shadow: {
      sm: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      md: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
      lg: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
      xl: '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
    },
    typography: {
      fontFamily: { sans: 'Inter, -apple-system, sans-serif', mono: 'Fira Code, monospace' },
      fontSize: { xs: 12, sm: 14, md: 16, lg: 18, xl: 24, xxl: 32 },
      fontWeight: { normal: 400, medium: 500, bold: 700 },
      lineHeight: { tight: 1.2, normal: 1.5, relaxed: 1.75 },
    },
    component: {
      button: { height: 36, padding: '0 16px', borderRadius: 4 },
      panel: { headerHeight: 40, borderWidth: 1, borderColor: '#e0e0e0' },
      field: { height: 32, labelWidth: 150 },
      grid: { rowHeight: 32, headerHeight: 36 },
      accordion: {
        headerBg: '#f8f9fa',
        headerBgHover: '#e9ecef',
        headerBgActive: '#e8f0fe',
        headerColor: '#212121',
        headerColorActive: '#1976d2',
        headerBorderColor: '#e0e0e0',
        headerFontWeight: '600',
        activeBorderColor: '#1976d2',
        bodyBg: '#ffffff',
        borderRadius: '8px',
        transition: '200ms ease',
      },
    },
    breakpoints: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
    transition: { fast: '150ms', normal: '250ms', slow: '400ms' },
    zIndex: { dropdown: 1000, modal: 1050, tooltip: 1100, notification: 1200 },
  },
});
