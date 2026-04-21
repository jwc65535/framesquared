import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { Panel, Viewport } from '@framesquared/ui';
import { TextField } from '@framesquared/form';
import { Button } from '@framesquared/ui';
import { ModernTheme } from '@framesquared/theme';

class TableLayoutDemoApp extends Application {
  constructor() {
    super({ name: 'TableLayoutDemo', theme: ModernTheme });
  }

  override launch(): void {
    new Viewport({
      layout: { type: 'vbox', align: 'stretch' },
      items: [
        new Panel({ title: 'Table Layout Demo — framesquared', height: 48 }),
        new Panel({
          flex: 1,
          layout: { type: 'vbox', align: 'stretch' },
          bodyPadding: 16,
          items: [
            new Panel({
              title: 'Table Container — layout: "table", 3 columns',
              flex: 1,
              layout: {
                type: 'table',
                columns: 3,
                cellPadding: 8,
                cellAlign: 'left',
                cellVAlign: 'top',
              },
              items: [
                // Row 1: full-width header
                new Panel({ title: 'Page Header — colspan: 3', colspan: 3 }),

                // Row 2: label | text field | button
                new Panel({ title: 'Label Cell' }),
                new TextField({ fieldLabel: 'Name', name: 'name' }),
                new Button({ text: 'Submit' }),

                // Row 3: sidebar spans 2 rows | two content cells
                new Panel({ title: 'Sidebar — rowspan: 2', rowspan: 2 }),
                new Panel({ title: 'Main Content' }),
                new Panel({ title: 'Extra Info' }),

                // Row 4: sidebar still occupied, two more cells
                new Panel({ title: 'Detail A' }),
                new Panel({ title: 'Detail B' }),
              ],
            }),
          ],
        }),
      ],
    });
  }
}

new TableLayoutDemoApp().start();
