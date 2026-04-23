/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { Button, MenuManager } from '@framesquared/ui';
import {
  createButtonShowcaseView,
  type ButtonShowcaseViewRefs,
} from '../src/ButtonShowcaseView.js';

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let host: HTMLDivElement;
let refs: ButtonShowcaseViewRefs;

beforeEach(() => {
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  host = document.createElement('div');
  document.body.appendChild(host);
  Application.clearInstance();
  refs = createButtonShowcaseView(host);
});

afterEach(() => {
  MenuManager.getInstance().closeAll();
  host.remove();
  document.body.innerHTML = '';
  Application.clearInstance();
});

// ---------------------------------------------------------------------------
// § Button — rendering
// ---------------------------------------------------------------------------

describe('§ Button — rendering', () => {
  it('primaryBtn has x-btn-primary class', () => {
    expect(refs.primaryBtn.el!.classList.contains('x-btn-primary')).toBe(true);
  });

  it('dangerBtn has x-btn-danger class', () => {
    expect(refs.dangerBtn.el!.classList.contains('x-btn-danger')).toBe(true);
  });

  it('smallBtn has x-btn-small class', () => {
    expect(refs.smallBtn.el!.classList.contains('x-btn-small')).toBe(true);
  });

  it('largeBtn has x-btn-large class', () => {
    expect(refs.largeBtn.el!.classList.contains('x-btn-large')).toBe(true);
  });

  it('iconBtn has an .x-btn-icon child element', () => {
    expect(refs.iconBtn.el!.querySelector('.x-btn-icon')).not.toBeNull();
  });

  it('disabledBtn has x-btn-disabled class', () => {
    expect(refs.disabledBtn.el!.classList.contains('x-btn-disabled')).toBe(true);
  });

  it('disabledBtn native disabled attribute is true', () => {
    expect((refs.disabledBtn.el as HTMLButtonElement).disabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// § Button — click and handler
// ---------------------------------------------------------------------------

describe('§ Button — click and handler', () => {
  it('clickCount starts at 0', () => {
    expect(refs.clickCount.value).toBe(0);
  });

  it('clicking primaryBtn increments clickCount to 1', () => {
    refs.primaryBtn.el!.click();
    expect(refs.clickCount.value).toBe(1);
  });

  it('clicking primaryBtn three times sets clickCount to 3', () => {
    refs.primaryBtn.el!.click();
    refs.primaryBtn.el!.click();
    refs.primaryBtn.el!.click();
    expect(refs.clickCount.value).toBe(3);
  });

  it('clicking disabledBtn does not increment clickCount', () => {
    refs.disabledBtn.el!.click();
    expect(refs.clickCount.value).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// § Button — toggle
// ---------------------------------------------------------------------------

describe('§ Button — toggle', () => {
  it('toggleBtn is not pressed initially', () => {
    expect(refs.toggleBtn.el!.classList.contains('x-btn-pressed')).toBe(false);
  });

  it('clicking toggleBtn once adds x-btn-pressed', () => {
    refs.toggleBtn.el!.click();
    expect(refs.toggleBtn.el!.classList.contains('x-btn-pressed')).toBe(true);
  });

  it('clicking toggleBtn twice removes x-btn-pressed', () => {
    refs.toggleBtn.el!.click();
    refs.toggleBtn.el!.click();
    expect(refs.toggleBtn.el!.classList.contains('x-btn-pressed')).toBe(false);
  });

  it('isPressed() returns true after one click', () => {
    refs.toggleBtn.el!.click();
    expect(refs.toggleBtn.isPressed()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// § Button — toggleGroup (radio)
// ---------------------------------------------------------------------------

describe('§ Button — toggleGroup (radio)', () => {
  it('no radio button is pressed initially', () => {
    expect(refs.radioA.isPressed()).toBe(false);
    expect(refs.radioB.isPressed()).toBe(false);
    expect(refs.radioC.isPressed()).toBe(false);
  });

  it('clicking radioA presses A; B and C remain unpressed', () => {
    refs.radioA.el!.click();
    expect(refs.radioA.isPressed()).toBe(true);
    expect(refs.radioB.isPressed()).toBe(false);
    expect(refs.radioC.isPressed()).toBe(false);
  });

  it('clicking radioB after A: B pressed, A depressed, C not pressed', () => {
    refs.radioA.el!.click();
    refs.radioB.el!.click();
    expect(refs.radioA.isPressed()).toBe(false);
    expect(refs.radioB.isPressed()).toBe(true);
    expect(refs.radioC.isPressed()).toBe(false);
  });

  it('clicking radioA when already pressed keeps it pressed', () => {
    refs.radioA.el!.click();
    refs.radioA.el!.click();
    expect(refs.radioA.isPressed()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// § SplitButton
// ---------------------------------------------------------------------------

describe('§ SplitButton', () => {
  it('splitBtn.el contains .x-btn-split-arrow', () => {
    expect(refs.splitBtn.el!.querySelector('.x-btn-split-arrow')).not.toBeNull();
  });

  it('.x-btn-split-arrow has visible arrow text content', () => {
    const arrow = refs.splitBtn.el!.querySelector('.x-btn-split-arrow')!;
    expect(arrow.textContent?.trim()).toBeTruthy();
  });

  it('cycleBtn .x-btn-split-arrow also has arrow text content', () => {
    const arrow = refs.cycleBtn.el!.querySelector('.x-btn-split-arrow')!;
    expect(arrow.textContent?.trim()).toBeTruthy();
  });

  it('clicking the cycle arrow shows the cycle menu', () => {
    const arrow = refs.cycleBtn.el!.querySelector('.x-btn-split-arrow') as HTMLElement;
    arrow.click();
    expect(refs.cycleMenu.isVisible()).toBe(true);
  });

  it('clicking a cycle menu item selects that item directly', () => {
    const arrow = refs.cycleBtn.el!.querySelector('.x-btn-split-arrow') as HTMLElement;
    arrow.click();
    // "Week" is the second menu item — click it to jump straight to Week
    const menuItems = refs.cycleMenu.el!.querySelectorAll('.x-menu-item');
    (menuItems[1] as HTMLElement).click();
    expect(refs.cycleBtn.getActiveItem().text).toBe('Week');
  });

  it('splitClickCount starts at 0', () => {
    expect(refs.splitClickCount.value).toBe(0);
  });

  it('clicking the main text area increments splitClickCount', () => {
    const mainEl = refs.splitBtn.el!.querySelector('.x-btn-text') as HTMLElement;
    mainEl.click();
    expect(refs.splitClickCount.value).toBe(1);
  });

  it('splitArrowCount starts at 0', () => {
    expect(refs.splitArrowCount.value).toBe(0);
  });

  it('clicking .x-btn-split-arrow increments splitArrowCount', () => {
    const arrow = refs.splitBtn.el!.querySelector('.x-btn-split-arrow') as HTMLElement;
    arrow.click();
    expect(refs.splitArrowCount.value).toBe(1);
  });

  it('clicking .x-btn-split-arrow does not increment splitClickCount', () => {
    const arrow = refs.splitBtn.el!.querySelector('.x-btn-split-arrow') as HTMLElement;
    arrow.click();
    expect(refs.splitClickCount.value).toBe(0);
  });

  it('clicking the split arrow shows the actions menu', () => {
    const arrow = refs.splitBtn.el!.querySelector('.x-btn-split-arrow') as HTMLElement;
    arrow.click();
    expect(refs.actionsMenu.isVisible()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// § CycleButton
// ---------------------------------------------------------------------------

describe('§ CycleButton', () => {
  it('initial getActiveItem().text is Month', () => {
    expect(refs.cycleBtn.getActiveItem().text).toBe('Month');
  });

  it('cycleChangeCount starts at 0', () => {
    expect(refs.cycleChangeCount.value).toBe(0);
  });

  it('clicking cycleBtn advances to Day and increments cycleChangeCount', () => {
    refs.cycleBtn.el!.click();
    expect(refs.cycleBtn.getActiveItem().text).toBe('Day');
    expect(refs.cycleChangeCount.value).toBe(1);
  });

  it('clicking twice advances to Week', () => {
    refs.cycleBtn.el!.click();
    refs.cycleBtn.el!.click();
    expect(refs.cycleBtn.getActiveItem().text).toBe('Week');
  });

  it('clicking three times wraps back to Month', () => {
    refs.cycleBtn.el!.click();
    refs.cycleBtn.el!.click();
    refs.cycleBtn.el!.click();
    expect(refs.cycleBtn.getActiveItem().text).toBe('Month');
  });

  it('setActiveItem with Week item updates getActiveItem().text to Week', () => {
    const weekItem = (refs.cycleBtn as any)._cycleItems[1];
    refs.cycleBtn.setActiveItem(weekItem);
    expect(refs.cycleBtn.getActiveItem().text).toBe('Week');
  });

  it('.x-btn-text matches getActiveItem().text after each cycle', () => {
    const textEl = () => refs.cycleBtn.el!.querySelector('.x-btn-text')!.textContent;
    expect(textEl()).toBe('Month');
    refs.cycleBtn.el!.click();
    expect(textEl()).toBe(refs.cycleBtn.getActiveItem().text);
    refs.cycleBtn.el!.click();
    expect(textEl()).toBe(refs.cycleBtn.getActiveItem().text);
  });
});

// ---------------------------------------------------------------------------
// § SegmentedButton — single select
// ---------------------------------------------------------------------------

describe('§ SegmentedButton — single select', () => {
  it('no button is pressed initially', () => {
    for (const item of refs.singleSeg.getItems()) {
      expect((item as Button).isPressed()).toBe(false);
    }
  });

  it('clicking Left presses it', () => {
    refs.singleSeg.getItems()[0].el!.click();
    expect((refs.singleSeg.getItems()[0] as Button).isPressed()).toBe(true);
  });

  it('getValue returns "left" after clicking Left', () => {
    refs.singleSeg.getItems()[0].el!.click();
    expect(refs.singleSeg.getValue()).toBe('left');
  });

  it('clicking Center depresses Left and presses Center', () => {
    const items = refs.singleSeg.getItems();
    items[0].el!.click();
    items[1].el!.click();
    expect((items[0] as Button).isPressed()).toBe(false);
    expect((items[1] as Button).isPressed()).toBe(true);
  });

  it('getValue returns "center" after clicking Center', () => {
    refs.singleSeg.getItems()[1].el!.click();
    expect(refs.singleSeg.getValue()).toBe('center');
  });

  it('re-clicking the already-pressed button keeps it pressed', () => {
    const items = refs.singleSeg.getItems();
    items[0].el!.click();
    items[0].el!.click();
    expect((items[0] as Button).isPressed()).toBe(true);
  });

  it('segChangeCount increments when selection changes', () => {
    refs.singleSeg.getItems()[0].el!.click();
    expect(refs.segChangeCount.value).toBe(1);
    refs.singleSeg.getItems()[2].el!.click();
    expect(refs.segChangeCount.value).toBe(2);
  });

  it('setValue("right") selects Right', () => {
    refs.singleSeg.setValue('right');
    expect((refs.singleSeg.getItems()[2] as Button).isPressed()).toBe(true);
  });

  it('getValue returns "right" after setValue("right")', () => {
    refs.singleSeg.setValue('right');
    expect(refs.singleSeg.getValue()).toBe('right');
  });
});

// ---------------------------------------------------------------------------
// § SegmentedButton — multi select
// ---------------------------------------------------------------------------

describe('§ SegmentedButton — multi select', () => {
  it('no button is pressed initially', () => {
    for (const item of refs.multiSeg.getItems()) {
      expect((item as Button).isPressed()).toBe(false);
    }
  });

  it('clicking Bold presses it; others remain unpressed', () => {
    const items = refs.multiSeg.getItems();
    items[0].el!.click();
    expect((items[0] as Button).isPressed()).toBe(true);
    expect((items[1] as Button).isPressed()).toBe(false);
    expect((items[2] as Button).isPressed()).toBe(false);
  });

  it('clicking Italic in addition to Bold: both are pressed', () => {
    const items = refs.multiSeg.getItems();
    items[0].el!.click();
    items[1].el!.click();
    expect((items[0] as Button).isPressed()).toBe(true);
    expect((items[1] as Button).isPressed()).toBe(true);
  });

  it('getValue returns ["bold", "italic"] when both are pressed', () => {
    const items = refs.multiSeg.getItems();
    items[0].el!.click();
    items[1].el!.click();
    expect(refs.multiSeg.getValue()).toEqual(['bold', 'italic']);
  });

  it('clicking Bold again toggles it off; getValue returns ["italic"]', () => {
    const items = refs.multiSeg.getItems();
    items[0].el!.click();
    items[1].el!.click();
    items[0].el!.click();
    expect(refs.multiSeg.getValue()).toEqual(['italic']);
  });

  it('setValue(["bold","underline"]) selects Bold and Underline, deselects Italic', () => {
    const items = refs.multiSeg.getItems();
    items[1].el!.click(); // Italic on first
    refs.multiSeg.setValue(['bold', 'underline']);
    expect((items[0] as Button).isPressed()).toBe(true);
    expect((items[1] as Button).isPressed()).toBe(false);
    expect((items[2] as Button).isPressed()).toBe(true);
  });

  it('getValue returns ["bold","underline"] after setValue', () => {
    refs.multiSeg.setValue(['bold', 'underline']);
    expect(refs.multiSeg.getValue()).toEqual(['bold', 'underline']);
  });
});
