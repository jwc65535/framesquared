import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { ModernTheme } from '@framesquared/theme';
import { createWindowDemo } from './WindowDemo.js';

class WindowCapabilitiesDemoApp extends Application {
  constructor() {
    super({ name: 'WindowCapabilitiesDemo', theme: ModernTheme });
  }

  override launch(): void {
    const { win } = createWindowDemo();
    win.show();
    win.center();
  }
}

new WindowCapabilitiesDemoApp().start();
