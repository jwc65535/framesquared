import '@framesquared/layout';
import {
  Button,
  SplitButton,
  CycleButton,
  SegmentedButton,
  Menu,
  MenuItem,
  MenuSeparator,
  MenuManager,
  Panel,
  Viewport,
} from '@framesquared/ui';
import type { CycleItem } from '@framesquared/ui';

export interface ButtonShowcaseViewRefs {
  primaryBtn:  Button;
  dangerBtn:   Button;
  smallBtn:    Button;
  largeBtn:    Button;
  iconBtn:     Button;
  toggleBtn:   Button;
  radioA:      Button;
  radioB:      Button;
  radioC:      Button;
  disabledBtn: Button;
  clickCount:  { value: number };

  splitBtn:        SplitButton;
  splitClickCount: { value: number };
  splitArrowCount: { value: number };
  actionsMenu:     Menu;

  cycleBtn:         CycleButton;
  cycleChangeCount: { value: number };
  cycleMenu:        Menu;

  singleSeg:      SegmentedButton;
  multiSeg:       SegmentedButton;
  segChangeCount: { value: number };
}

export function createButtonShowcaseView(host: Element): ButtonShowcaseViewRefs {
  const clickCount       = { value: 0 };
  const splitClickCount  = { value: 0 };
  const splitArrowCount  = { value: 0 };
  const cycleChangeCount = { value: 0 };
  const segChangeCount   = { value: 0 };

  // ── § Button ─────────────────────────────────────────────────────────────

  const primaryBtn = new Button({
    text: 'Save',
    ui: 'primary',
    handler: () => { clickCount.value++; },
  });

  const dangerBtn   = new Button({ text: 'Delete', ui: 'danger' });
  const smallBtn    = new Button({ text: 'Small',  scale: 'small' });
  const largeBtn    = new Button({ text: 'Large',  scale: 'large' });
  const iconBtn     = new Button({ text: 'With Icon', iconCls: 'x-icon-star' });
  const toggleBtn   = new Button({ text: 'Toggle Me', enableToggle: true });

  const radioA = new Button({ text: 'Option A', enableToggle: true, toggleGroup: 'demo-radio' });
  const radioB = new Button({ text: 'Option B', enableToggle: true, toggleGroup: 'demo-radio' });
  const radioC = new Button({ text: 'Option C', enableToggle: true, toggleGroup: 'demo-radio' });

  // disabledBtn shares the clickCount handler so the "disabled blocks handler" test is meaningful
  const disabledBtn = new Button({
    text: 'Disabled',
    disabled: true,
    handler: () => { clickCount.value++; },
  });

  const buttonPanel = new Panel({
    title: 'Button',
    layout: { type: 'vbox', align: 'stretch' },
    items: [
      new Panel({
        title: 'UI Variants',
        layout: { type: 'hbox', align: 'middle' },
        items: [primaryBtn, dangerBtn],
      }),
      new Panel({
        title: 'Scale',
        layout: { type: 'hbox', align: 'middle' },
        items: [smallBtn, largeBtn],
      }),
      new Panel({
        title: 'Icon',
        layout: { type: 'hbox', align: 'middle' },
        items: [iconBtn],
      }),
      new Panel({
        title: 'Toggle',
        layout: { type: 'hbox', align: 'middle' },
        items: [toggleBtn],
      }),
      new Panel({
        title: 'Radio Group',
        layout: { type: 'hbox', align: 'middle' },
        items: [radioA, radioB, radioC],
      }),
      new Panel({
        title: 'Disabled',
        layout: { type: 'hbox', align: 'middle' },
        items: [disabledBtn],
      }),
    ],
  });

  // ── § SplitButton ────────────────────────────────────────────────────────

  const actionsMenu = new Menu({
    items: [
      new MenuItem({ text: 'Save Draft',     handler: () => MenuManager.getInstance().closeAll() }),
      new MenuItem({ text: 'Publish',        handler: () => MenuManager.getInstance().closeAll() }),
      new MenuSeparator(),
      new MenuItem({ text: 'Discard Changes', handler: () => MenuManager.getInstance().closeAll() }),
    ],
  });

  const splitBtn = new SplitButton({
    text: 'Actions',
    handler: () => { splitClickCount.value++; },
    arrowHandler: (btn) => {
      splitArrowCount.value++;
      actionsMenu.showBy(btn);
    },
  });

  const splitPanel = new Panel({
    title: 'SplitButton',
    layout: { type: 'hbox', align: 'middle' },
    items: [splitBtn],
  });

  // ── § CycleButton ────────────────────────────────────────────────────────
  // cycleMenu items need a reference to cycleBtn (setActiveItem), but
  // cycleBtn's arrowHandler needs cycleMenu.  Use a forward reference so
  // the menu is a plain const and cycleBtn is assigned immediately after.

  const cycleItems: CycleItem[] = [
    { text: 'Day' },
    { text: 'Week' },
    { text: 'Month', checked: true },
  ];

  // eslint-disable-next-line prefer-const
  let cycleBtn!: CycleButton;

  const cycleMenu = new Menu({
    items: cycleItems.map((item) =>
      new MenuItem({
        text: item.text,
        handler: () => {
          cycleBtn.setActiveItem(item);
          MenuManager.getInstance().closeAll();
        },
      })
    ),
  });

  cycleBtn = new CycleButton({
    items: cycleItems,
    arrowHandler: (btn) => cycleMenu.showBy(btn),
    listeners: {
      change: () => { cycleChangeCount.value++; },
    },
  });

  const cyclePanel = new Panel({
    title: 'CycleButton',
    layout: { type: 'hbox', align: 'middle' },
    items: [cycleBtn],
  });

  // ── § SegmentedButton ────────────────────────────────────────────────────

  const singleSeg = new SegmentedButton({
    items: [
      new Button({ text: 'Left',   value: 'left' }),
      new Button({ text: 'Center', value: 'center' }),
      new Button({ text: 'Right',  value: 'right' }),
    ],
    listeners: {
      change: () => { segChangeCount.value++; },
    },
  });

  const multiSeg = new SegmentedButton({
    allowMultiple: true,
    items: [
      new Button({ text: 'Bold',      value: 'bold' }),
      new Button({ text: 'Italic',    value: 'italic' }),
      new Button({ text: 'Underline', value: 'underline' }),
    ],
  });

  const segPanel = new Panel({
    title: 'SegmentedButton',
    layout: { type: 'vbox', align: 'stretch' },
    items: [
      new Panel({
        title: 'Single Select',
        layout: { type: 'hbox', align: 'middle' },
        items: [singleSeg],
      }),
      new Panel({
        title: 'Multi Select',
        layout: { type: 'hbox', align: 'middle' },
        items: [multiSeg],
      }),
    ],
  });

  // ── Root container ───────────────────────────────────────────────────────

  new Panel({
    renderTo: host,
    header: false,
    layout: { type: 'vbox', align: 'stretch' },
    items: [buttonPanel, splitPanel, cyclePanel, segPanel],
  });

  return {
    primaryBtn, dangerBtn, smallBtn, largeBtn, iconBtn, toggleBtn,
    radioA, radioB, radioC, disabledBtn, clickCount,
    splitBtn, splitClickCount, splitArrowCount, actionsMenu,
    cycleBtn, cycleChangeCount, cycleMenu,
    singleSeg, multiSeg, segChangeCount,
  };
}

export function createViewport(): Viewport {
  const vp = new Viewport({ layout: { type: 'vbox', align: 'stretch' } });
  createButtonShowcaseView(vp.getBodyEl());
  return vp;
}
