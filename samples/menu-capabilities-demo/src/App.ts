import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { ModernTheme } from '@framesquared/theme';
import { Viewport } from '@framesquared/ui';
import { createMenuDemoView } from './MenuDemoView.js';
import { MenuDemoController } from './MenuDemoController.js';

class MenuCapabilitiesDemoApp extends Application {
  constructor() {
    super({ name: 'MenuCapabilitiesDemo', theme: ModernTheme });
  }

  override launch(): void {
    const vp = new Viewport({ layout: { type: 'vbox', align: 'stretch' } });
    const refs = createMenuDemoView(vp.getBodyEl());
    new MenuDemoController(refs);
  }
}

new MenuCapabilitiesDemoApp().start();
