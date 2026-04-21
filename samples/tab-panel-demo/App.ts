import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { ModernTheme } from '@framesquared/theme';
import { createViewport } from './MainView.js';

class TabPanelDemoApp extends Application {
  constructor() {
    super({ name: 'TabPanelDemo', theme: ModernTheme });
  }

  override launch(): void {
    createViewport();
  }
}

new TabPanelDemoApp().start();
