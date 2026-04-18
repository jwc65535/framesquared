import { Application } from '@framesquared/app';
import { Viewport, Panel, Button } from '@framesquared/ui';
import { ModernTheme } from '@framesquared/theme';
import '@framesquared/layout';

class HelloWorldApp extends Application {
  constructor() {
    super({ name: 'HelloWorldApp', theme: ModernTheme });
  }

  override launch(): void {
    new Viewport({
      layout: { type: 'vbox', align: 'center', pack: 'center' },
      items: [
        new Panel({
          title: 'Hello, framesquared!',
          width: 320,
          layout: 'fit',
          items: [
            new Button({ text: 'Hello World' }),
          ],
        }),
      ],
    });
  }
}

new HelloWorldApp().start();
