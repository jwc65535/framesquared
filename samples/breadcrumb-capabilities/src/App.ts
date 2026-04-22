import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { ModernTheme } from '@framesquared/theme';
import { createViewport } from './BreadcrumbView.js';

class BreadcrumbDemoApp extends Application {
  constructor() {
    super({ name: 'BreadcrumbCapabilitiesDemo', theme: ModernTheme });
  }

  override launch(): void {
    createViewport();
  }
}

new BreadcrumbDemoApp().start();
