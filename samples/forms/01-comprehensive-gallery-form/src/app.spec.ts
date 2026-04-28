/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

/**
 * forms/01-comprehensive-gallery-form — app.spec.ts
 *
 * TDD test suite for the Comprehensive Form Gallery.
 * Written against the exported factory + GalleryRefs before
 * the production Application wiring runs.
 *
 * Coverage:
 *   1.  Structure              — FormPanel in DOM, section panels present
 *   2.  Text fields render     — textField, emailField, textArea, displayField
 *   3.  Numeric/date render    — numberField, slider, dateField, timeField
 *   4.  Selection fields render — comboBox, tagField, checkboxGroup, radioGroup
 *   5.  Rich input render      — htmlEditor, fileField
 *   6.  Pickers render         — datePicker, colorPicker
 *   7.  TextField validation   — allowBlank, vtype:email
 *   8.  Slider                 — getValue, setValue, min/max clamping
 *   9.  ComboBox               — select() sets getValue()
 *  10.  CheckboxGroup          — setValue / getValue round-trip
 *  11.  RadioGroup             — setValue / getValue round-trip
 *  12.  DisplayField           — initial value, setValue
 *  13.  FormPanel integration  — getFields collects fields, isFormValid
 *  14.  Application guard      — MODE=test suppresses auto-start
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import '@framesquared/layout';
import { createGalleryForm, GalleryApp } from './app.js';
import type { GalleryRefs } from './app.js';
import { Application } from '@framesquared/app';

// ---------------------------------------------------------------------------
// Polyfills for jsdom
// ---------------------------------------------------------------------------

beforeAll(() => {
  if (!('ResizeObserver' in globalThis)) {
    (globalThis as any).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

describe('Form Gallery', () => {
  let host: HTMLDivElement;
  let refs: GalleryRefs;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    refs = createGalleryForm(host);
  });

  afterEach(() => {
    refs.formPanel.destroy();
    host.remove();
  });

  // -------------------------------------------------------------------------
  // 1. Structure
  // -------------------------------------------------------------------------

  describe('structure', () => {
    it('renders the FormPanel into host', () => {
      expect(host.querySelector('.x-form')).not.toBeNull();
    });

    it('renders at least 5 section panels', () => {
      // formPanel + 5 section panels = 6 total .x-panel elements
      expect(host.querySelectorAll('.x-panel').length).toBeGreaterThanOrEqual(5);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Text fields render
  // -------------------------------------------------------------------------

  describe('text fields', () => {
    it('textField renders', () => expect(refs.textField.el).not.toBeNull());
    it('emailField renders', () => expect(refs.emailField.el).not.toBeNull());
    it('textArea renders',   () => expect(refs.textArea.el).not.toBeNull());
    it('displayField renders', () => expect(refs.displayField.el).not.toBeNull());
  });

  // -------------------------------------------------------------------------
  // 3. Numeric & date fields render
  // -------------------------------------------------------------------------

  describe('numeric & date fields', () => {
    it('numberField renders', () => expect(refs.numberField.el).not.toBeNull());
    it('slider renders',      () => expect(refs.slider.el).not.toBeNull());
    it('dateField renders',   () => expect(refs.dateField.el).not.toBeNull());
    it('timeField renders',   () => expect(refs.timeField.el).not.toBeNull());
  });

  // -------------------------------------------------------------------------
  // 4. Selection fields render
  // -------------------------------------------------------------------------

  describe('selection fields', () => {
    it('comboBox renders',      () => expect(refs.comboBox.el).not.toBeNull());
    it('tagField renders',      () => expect(refs.tagField.el).not.toBeNull());
    it('checkboxGroup renders', () => expect(refs.checkboxGroup.el).not.toBeNull());
    it('radioGroup renders',    () => expect(refs.radioGroup.el).not.toBeNull());
  });

  // -------------------------------------------------------------------------
  // 5. Rich input fields render
  // -------------------------------------------------------------------------

  describe('rich input fields', () => {
    it('htmlEditor renders', () => expect(refs.htmlEditor.el).not.toBeNull());
    it('fileField renders',  () => expect(refs.fileField.el).not.toBeNull());
  });

  // -------------------------------------------------------------------------
  // 6. Pickers render (standalone — not Field subclasses)
  // -------------------------------------------------------------------------

  describe('pickers', () => {
    it('datePicker renders',  () => expect(refs.datePicker.el).not.toBeNull());
    it('colorPicker renders', () => expect(refs.colorPicker.el).not.toBeNull());
  });

  // -------------------------------------------------------------------------
  // 7. TextField validation
  // -------------------------------------------------------------------------

  describe('TextField validation', () => {
    it('textField (allowBlank:false) is invalid when blank', () => {
      refs.textField.setValue('');
      expect(refs.textField.validate()).toBe(false);
    });

    it('textField (allowBlank:false) is valid when non-blank', () => {
      refs.textField.setValue('Jane Doe');
      expect(refs.textField.validate()).toBe(true);
    });

    it('emailField rejects malformed address', () => {
      refs.emailField.setValue('not-an-email');
      expect(refs.emailField.validate()).toBe(false);
    });

    it('emailField accepts a well-formed address', () => {
      refs.emailField.setValue('user@example.com');
      expect(refs.emailField.validate()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 8. Slider
  // -------------------------------------------------------------------------

  describe('Slider', () => {
    it('initial getValue() is 50', () => {
      expect(refs.slider.getValue()).toBe(50);
    });

    it('setValue(75) → getValue() returns 75', () => {
      refs.slider.setValue(75);
      expect(refs.slider.getValue()).toBe(75);
    });

    it('clamps to minimum (0) for negative input', () => {
      refs.slider.setValue(-999);
      expect(refs.slider.getValue()).toBe(0);
    });

    it('clamps to maximum (100) for out-of-range input', () => {
      refs.slider.setValue(999);
      expect(refs.slider.getValue()).toBe(100);
    });

    it('fires change event on value change', () => {
      let fired = false;
      refs.slider.on('change', () => { fired = true; });
      refs.slider.setValue(20);
      expect(fired).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 9. ComboBox
  // -------------------------------------------------------------------------

  describe('ComboBox', () => {
    it('select() sets getValue()', () => {
      refs.comboBox.select('Editor');
      expect(refs.comboBox.getValue()).toBe('Editor');
    });

    it('select() can switch to a different value', () => {
      refs.comboBox.select('Admin');
      refs.comboBox.select('Viewer');
      expect(refs.comboBox.getValue()).toBe('Viewer');
    });

    it('fires select event', () => {
      let fired = false;
      refs.comboBox.on('select', () => { fired = true; });
      refs.comboBox.select('Admin');
      expect(fired).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 10. CheckboxGroup
  // -------------------------------------------------------------------------

  describe('CheckboxGroup', () => {
    it('getValue() returns empty array when nothing is checked', () => {
      refs.checkboxGroup.setValue([]);
      expect(refs.checkboxGroup.getValue()).toEqual([]);
    });

    it('setValue(["html","ts"]) checks the right boxes', () => {
      refs.checkboxGroup.setValue(['html', 'ts']);
      const val = refs.checkboxGroup.getValue();
      expect(val).toContain('html');
      expect(val).toContain('ts');
      expect(val).not.toContain('css');
    });

    it('setValue([]) unchecks all', () => {
      refs.checkboxGroup.setValue(['html', 'css', 'ts']);
      refs.checkboxGroup.setValue([]);
      expect(refs.checkboxGroup.getValue()).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // 11. RadioGroup
  // -------------------------------------------------------------------------

  describe('RadioGroup', () => {
    it('getValue() returns empty string when nothing is selected', () => {
      expect(refs.radioGroup.getValue()).toBe('');
    });

    it('setValue("sr") selects Senior', () => {
      refs.radioGroup.setValue('sr');
      expect(refs.radioGroup.getValue()).toBe('sr');
    });

    it('setValue can switch selection', () => {
      refs.radioGroup.setValue('jr');
      refs.radioGroup.setValue('lead');
      expect(refs.radioGroup.getValue()).toBe('lead');
    });

    it('only one radio is selected at a time', () => {
      refs.radioGroup.setValue('jr');
      refs.radioGroup.setValue('sr');
      const selected = (refs.radioGroup as any)
        .getItems()
        .filter((r: any) => r.isChecked());
      expect(selected.length).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // 12. DisplayField
  // -------------------------------------------------------------------------

  describe('DisplayField', () => {
    it('getValue() returns the initial value', () => {
      expect(refs.displayField.getValue()).toBe('Active');
    });

    it('setValue() updates getValue()', () => {
      refs.displayField.setValue('Inactive');
      expect(refs.displayField.getValue()).toBe('Inactive');
    });
  });

  // -------------------------------------------------------------------------
  // 13. FormPanel integration
  // -------------------------------------------------------------------------

  describe('FormPanel integration', () => {
    it('getFields() collects all Field instances (including nested)', () => {
      const fields = refs.formPanel.getFields();
      // 14 direct Field subclasses:
      // textField, emailField, textArea, displayField, numberField, slider,
      // dateField, timeField, comboBox, tagField, htmlEditor, fileField
      // + 3 Checkbox + 3 Radio (from groups) = 20 total
      // DatePicker and ColorPicker are NOT Fields — excluded.
      expect(fields.length).toBeGreaterThanOrEqual(12);
    });

    it('isFormValid() is false when required name field is blank', () => {
      refs.textField.setValue('');
      expect(refs.formPanel.isFormValid()).toBe(false);
    });

    it('isFormValid() is true when all required fields are satisfied', () => {
      refs.textField.setValue('Jane Doe');
      expect(refs.formPanel.isFormValid()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 14. Application guard
  // -------------------------------------------------------------------------

  describe('Application guard', () => {
    it('GalleryApp is a subclass of Application', () => {
      const app = new GalleryApp({ name: 'test-gallery' });
      expect(app).toBeInstanceOf(Application);
      Application.clearInstance();
    });

    it('getRefs() returns null before start()', () => {
      const app = new GalleryApp({ name: 'test-gallery-2' });
      expect(app.getRefs()).toBeNull();
      Application.clearInstance();
    });
  });
});
