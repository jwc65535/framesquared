import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { ModernTheme } from '@framesquared/theme';
import { createViewport } from './ToolbarView.js';

class ToolbarDemoApp extends Application {
  constructor() {
    super({ name: 'ToolbarCapabilitiesDemo', theme: ModernTheme });
  }

  override launch(): void {
    createViewport();
  }
}

new ToolbarDemoApp().start();
