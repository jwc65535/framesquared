/**
 * @framesquared/ui – MessageBox
 *
 * Static utility class for common dialog patterns:
 *   MessageBox.alert(title, message, callback?)
 *   MessageBox.confirm(title, message, callback?)
 *   MessageBox.prompt(title, message, callback?, multiline?)
 *   MessageBox.wait(message, title?)
 *   MessageBox.show(config)
 *
 * All dialogs are modal Windows that close on button click.
 */

import { Window } from './Window.js';
import type { WindowConfig } from './Window.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MessageBoxConfig {
  title?: string;
  message?: string;
  icon?: 'INFO' | 'WARNING' | 'ERROR' | 'QUESTION';
  buttons?: string[];
  fn?: (buttonId: string, value?: string) => void;
  prompt?: boolean;
  multiline?: boolean;
  progress?: boolean;
  progressText?: string;
}

// ---------------------------------------------------------------------------
// Button labels
// ---------------------------------------------------------------------------

const BUTTON_LABELS: Record<string, string> = {
  ok: 'OK',
  yes: 'Yes',
  no: 'No',
  cancel: 'Cancel',
};

// ---------------------------------------------------------------------------
// MessageBox
// ---------------------------------------------------------------------------

export class MessageBox {
  /**
   * Shows an alert dialog with an OK button.
   */
  static alert(title: string, message: string, callback?: (buttonId: string) => void): Window {
    return MessageBox.show({
      title,
      message,
      buttons: ['ok'],
      fn: callback,
    });
  }

  /**
   * Shows a confirmation dialog with Yes and No buttons.
   */
  static confirm(title: string, message: string, callback?: (buttonId: string) => void): Window {
    return MessageBox.show({
      title,
      message,
      buttons: ['yes', 'no'],
      fn: callback,
    });
  }

  /**
   * Shows a prompt dialog with an input field and OK/Cancel buttons.
   */
  static prompt(
    title: string,
    message: string,
    callback?: (buttonId: string, value?: string) => void,
    multiline?: boolean,
  ): Window {
    return MessageBox.show({
      title,
      message,
      buttons: ['ok', 'cancel'],
      prompt: true,
      multiline,
      fn: callback,
    });
  }

  /**
   * Shows a wait/progress dialog (no buttons — must be closed programmatically).
   */
  static wait(message: string, title?: string): Window {
    return MessageBox.show({
      title: title ?? '',
      message,
      buttons: [],
      progress: true,
    });
  }

  /**
   * General-purpose dialog with full config.
   */
  static show(config: MessageBoxConfig): Window {
    const buttons = config.buttons ?? ['ok'];

    // Build body HTML
    let bodyHtml = '';

    // Icon
    if (config.icon) {
      bodyHtml += `<div class="x-msgbox-icon x-msgbox-icon-${config.icon.toLowerCase()}"></div>`;
    }

    // Message text
    bodyHtml += `<div class="x-msgbox-text">${config.message ?? ''}</div>`;

    // Input (prompt)
    if (config.prompt) {
      if (config.multiline) {
        bodyHtml += '<textarea class="x-msgbox-input" rows="4"></textarea>';
      } else {
        bodyHtml += '<input class="x-msgbox-input" type="text" />';
      }
    }

    // Buttons
    if (buttons.length > 0) {
      bodyHtml += '<div class="x-msgbox-buttons">';
      for (const btn of buttons) {
        const label = BUTTON_LABELS[btn] ?? btn;
        bodyHtml += `<button class="x-msgbox-btn x-msgbox-btn-${btn}" data-btn="${btn}">${label}</button>`;
      }
      bodyHtml += '</div>';
    }

    // Create the Window
    const winConfig: WindowConfig = {
      title: config.title ?? '',
      modal: true,
      closable: true,
      draggable: true,
      autoShow: true,
      closeAction: 'destroy',
      cls: 'x-msgbox',
      html: bodyHtml,
      width: 420,
    };

    const win = new Window(winConfig);

    // Attach button click handlers
    if (win.el) {
      const btnEls = win.el.querySelectorAll('.x-msgbox-btn');
      for (const btnEl of btnEls) {
        btnEl.addEventListener('click', () => {
          const btnId = btnEl.getAttribute('data-btn') ?? 'ok';

          if (config.fn) {
            if (config.prompt) {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              const inputEl = win.el!.querySelector('.x-msgbox-input') as
                | HTMLInputElement
                | HTMLTextAreaElement
                | null;
              config.fn(btnId, inputEl?.value);
            } else {
              config.fn(btnId);
            }
          }

          win.close();
        });
      }
    }

    return win;
  }
}
