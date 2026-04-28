import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { ModernTheme } from '@framesquared/theme';
import { createViewport } from './MainView.js';

class ViewportLayoutDemoApp extends Application {
  constructor() {
    super({ name: 'ViewportLayoutDemo', theme: ModernTheme });
  }

  override launch(): void {
    createViewport();
  }
}

new ViewportLayoutDemoApp().start();
