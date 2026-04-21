import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { ModernTheme } from '@framesquared/theme';
import { createViewport } from './MainView.js';

class TooltipDemoApp extends Application {
  constructor() {
    super({ name: 'TooltipDemo', theme: ModernTheme });
  }

  override launch(): void {
    createViewport();
  }
}

new TooltipDemoApp().start();
