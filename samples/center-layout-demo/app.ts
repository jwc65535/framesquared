import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { Panel, Viewport } from '@framesquared/ui';
import { Button } from '@framesquared/ui';
import { ModernTheme } from '@framesquared/theme';

class CenterLayoutDemoApp extends Application {
  constructor() {
    super({ name: 'CenterLayoutDemo', theme: ModernTheme });
  }

  override launch(): void {
    new Viewport({
      layout: { type: 'vbox', align: 'stretch' },
      items: [
        new Panel({ title: 'Center Layout Demo — framesquared', height: 48 }),
        new Panel({
          flex: 1,
          layout: 'center',
          items: [
            new Panel({
              title: 'Centered Content',
              width: 400,
              height: 300,
              items: [
                new Button({ text: 'Click me' }),
              ],
            }),
          ],
        }),
      ],
    });
  }
}

new CenterLayoutDemoApp().start();
