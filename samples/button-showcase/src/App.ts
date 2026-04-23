import '@framesquared/layout';
import './showcase.css';
import { Application } from '@framesquared/app';
import { ModernTheme } from '@framesquared/theme';
import { createViewport } from './ButtonShowcaseView.js';

class ButtonShowcaseApp extends Application {
  constructor() {
    super({ name: 'ButtonShowcaseDemo', theme: ModernTheme });
  }

  override launch(): void {
    createViewport();
  }
}

new ButtonShowcaseApp().start();
