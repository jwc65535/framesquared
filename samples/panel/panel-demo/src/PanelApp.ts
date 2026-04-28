import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { ModernTheme } from '@framesquared/theme';
import { createViewport } from './PanelView.js';

class PanelCapabilitiesApp extends Application {
  constructor() {
    super({ name: 'PanelCapabilitiesDemo', theme: ModernTheme });
  }

  override launch(): void {
    createViewport();
  }
}

new PanelCapabilitiesApp().start();
