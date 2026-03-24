/**
 * @ext-ts/theme – DarkTheme
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
      text: { primary: '#e0e0e0', secondary: '#aaaaaa', disabled: '#666666' },
    },
    component: {
      panel: { borderColor: '#333333' },
    },
  },
});
