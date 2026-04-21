import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { ModernTheme } from '@framesquared/theme';
import { createViewport } from './CarouselView.js';

class CarouselDemoApp extends Application {
  constructor() {
    super({ name: 'CarouselBasicDemo', theme: ModernTheme });
  }

  override launch(): void {
    createViewport();
  }
}

new CarouselDemoApp().start();
