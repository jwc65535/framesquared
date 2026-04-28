import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { ModernTheme } from '@framesquared/theme';
import { createViewport } from './MenuDemo.js';

class MenuDemoApp extends Application {
  constructor() {
    super({ name: 'MenuDemo', theme: ModernTheme });
  }

  override launch(): void {
    createViewport();
  }
}

new MenuDemoApp().start();
