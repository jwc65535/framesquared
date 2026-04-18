/**
 * @framesquared/theme – DarkTheme
 * Dark mode — inherits from ModernTheme, inverts backgrounds
 * and text colors for dark environments.
 */

import { Theme } from '../Theme.js';
import { ModernTheme } from './ModernTheme.js';

export const DarkTheme = new Theme({
  name: 'dark',
  parent: ModernTheme,
  tokens: {
    color: {
      primary: '#90caf9',
      secondary: '#f48fb1',
      success: '#81c784',
      warning: '#ffb74d',
      error: '#e57373',
      background: '#121212',
      surface: '#1e1e1e',
      text: { primary: '#e0e0e0', secondary: '#aaaaaa', disabled: '#666666', onPrimary: '#000000' },
      border: '#3d3d3d',
    },
    component: {
      panel: { borderColor: '#333333' },
      accordion: {
        headerBg: '#2a2a2a',
        headerBgHover: '#333333',
        headerBgActive: '#1a2a3a',
        headerColor: '#e0e0e0',
        headerColorActive: '#90caf9',
        headerBorderColor: '#3d3d3d',
        activeBorderColor: '#90caf9',
        bodyBg: '#1e1e1e',
      },
    },
  },
});
