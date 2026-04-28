import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { ModernTheme } from '@framesquared/theme';
import { Viewport } from '@framesquared/ui';
import { createMainView } from './MainView.js';

class WidgetColumnApp extends Application {
  constructor() { super({ name: 'WidgetColumnTreeGrid', theme: ModernTheme }); }
  override launch(): void {
    const vp = new Viewport({ layout: { type: 'fit' } });
    createMainView(vp.getBodyEl());
  }
}

if (import.meta.env.MODE !== 'test') new WidgetColumnApp().start();
