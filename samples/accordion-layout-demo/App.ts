/**
 * App.ts — Accordion Layout Demo
 *
 * Demonstrates the Accordion UI component with three real-world panels
 * populated with form fields from @framesquared/form.
 *
 * Single-mode (default): expanding one panel automatically collapses
 * the currently open panel.
 */

import { Application } from '@framesquared/app';
import { Viewport, Accordion, Panel } from '@framesquared/ui';
import { TextField, Checkbox } from '@framesquared/form';
import { ModernTheme } from '@framesquared/theme';
import '@framesquared/layout';

class AccordionDemoApp extends Application {
  constructor() {
    super({ name: 'AccordionDemo', theme: ModernTheme });
  }

  override launch(): void {
    new Viewport({
      // Centre the Accordion panel both horizontally and vertically.
      layout: { type: 'vbox', align: 'center', pack: 'center' },
      items: [
        new Accordion({
          width: 480,
          // Single-mode is the default (multi: false).
          // Only one section is open at a time.
          items: [

            // ── Panel 1 — General Settings ─────────────────────────────────
            // header: false suppresses the Panel's own header so that only
            // the Accordion's auto-generated section header is visible.
            new Panel({
              title: 'General Settings',
              header: false,
              layout: { type: 'vbox', align: 'stretch', gap: 8 },
              bodyPadding: 16,
              items: [
                new TextField({
                  fieldLabel: 'Application Name',
                  value: 'My Application',
                }),
                new TextField({
                  fieldLabel: 'Language',
                  value: 'English (US)',
                }),
                new Checkbox({
                  fieldLabel: 'Preferences',
                  boxLabel: 'Enable desktop notifications',
                  checked: true,
                }),
                new Checkbox({
                  fieldLabel: '',
                  boxLabel: 'Start application on login',
                }),
              ],
            }),

            // ── Panel 2 — User Profile ─────────────────────────────────────
            new Panel({
              title: 'User Profile',
              header: false,
              layout: { type: 'vbox', align: 'stretch', gap: 8 },
              bodyPadding: 16,
              items: [
                new TextField({
                  fieldLabel: 'Display Name',
                  value: 'Jane Doe',
                }),
                new TextField({
                  fieldLabel: 'Email Address',
                  value: 'jane.doe@example.com',
                }),
                new TextField({
                  fieldLabel: 'Job Title',
                  value: 'Senior Engineer',
                }),
                new Checkbox({
                  fieldLabel: 'Visibility',
                  boxLabel: 'Show profile to other users',
                  checked: true,
                }),
              ],
            }),

            // ── Panel 3 — Security ─────────────────────────────────────────
            new Panel({
              title: 'Security',
              header: false,
              layout: { type: 'vbox', align: 'stretch', gap: 8 },
              bodyPadding: 16,
              items: [
                new TextField({
                  fieldLabel: 'Current Password',
                  inputType: 'password',
                }),
                new TextField({
                  fieldLabel: 'New Password',
                  inputType: 'password',
                }),
                new TextField({
                  fieldLabel: 'Confirm Password',
                  inputType: 'password',
                }),
                new Checkbox({
                  fieldLabel: 'Security options',
                  boxLabel: 'Enable two-factor authentication',
                }),
                new Checkbox({
                  fieldLabel: '',
                  boxLabel: 'Sign out all other sessions on save',
                }),
              ],
            }),

          ],
        }),
      ],
    });
  }
}

new AccordionDemoApp().start();
