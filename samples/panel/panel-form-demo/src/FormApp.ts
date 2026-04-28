import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { ModernTheme } from '@framesquared/theme';
import { createViewport } from './FormView.js';

class FormApp extends Application {
  constructor() {
    super({ name: 'FormPanelShowcase', theme: ModernTheme });
  }

  override launch(): void {
    createViewport();
  }
}

new FormApp().start();
