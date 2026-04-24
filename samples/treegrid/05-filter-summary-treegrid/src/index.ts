import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { ModernTheme } from '@framesquared/theme';
import { Viewport } from '@framesquared/ui';
import { createMainView } from './MainView.js';

class FilterSummaryApp extends Application {
  constructor() { super({ name: 'FilterSummaryTreeGrid', theme: ModernTheme }); }
  override launch(): void {
    const vp = new Viewport({ layout: { type: 'fit' } });
    createMainView(vp.getBodyEl());
  }
}

if (import.meta.env.MODE !== 'test') new FilterSummaryApp().start();
