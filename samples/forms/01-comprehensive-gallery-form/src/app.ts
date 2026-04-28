/**
 * forms/01-comprehensive-gallery-form — app.ts
 *
 * Demonstrates every form component in the framesquared framework.
 * Components are grouped into sections using Panel as a fieldset stand-in
 * (there is no FieldSet class; Panel with title serves the same role).
 *
 * Architecture:
 *   createGalleryForm(host) — pure factory; testable in isolation
 *   GalleryApp              — Application subclass; wires factory into #app
 *
 * Architectural notes recorded here for test authors:
 *   • Spinner is abstract — use NumberField (the concrete spinner) instead.
 *   • ColorPicker extends Component, not Field — no getValue/setValue; fires 'select'.
 *   • DatePicker extends Component, not Field — fires 'select' with a Date.
 *   • CheckboxGroup / RadioGroup extend Container, not Field.
 *   • ComboBox: call select(record) to choose a value, not setValue().
 *   • Radio / Checkbox: set both inputValue AND value to the same string so
 *     RadioGroup.getValue() and CheckboxGroup.getValue() return the expected value.
 *
 * The auto-start block at the bottom is guarded so importing this module in
 * Vitest does not trigger the browser launch sequence.
 */

import '@framesquared/layout';
import { Application } from '@framesquared/app';
import { ModernTheme } from '@framesquared/theme';
import { Panel } from '@framesquared/ui';
import {
  TextField,
  TextArea,
  NumberField,
  Slider,
  DateField,
  TimeField,
  DatePicker,
  ColorPicker,
  ComboBox,
  TagField,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  HtmlEditor,
  FileField,
  DisplayField,
  FormPanel,
} from '@framesquared/form';

// ---------------------------------------------------------------------------
// Gallery refs — one typed handle per component
// ---------------------------------------------------------------------------

export interface GalleryRefs {
  // Text & display
  textField: TextField;
  emailField: TextField;
  textArea: TextArea;
  displayField: DisplayField;
  // Numeric & date
  numberField: NumberField;
  slider: Slider;
  dateField: DateField;
  timeField: TimeField;
  // Selection
  comboBox: ComboBox;
  tagField: TagField;
  checkboxGroup: CheckboxGroup;
  radioGroup: RadioGroup;
  // Rich input
  htmlEditor: HtmlEditor;
  fileField: FileField;
  // Pickers (standalone — not Field subclasses)
  datePicker: DatePicker;
  colorPicker: ColorPicker;
  // Container
  formPanel: FormPanel;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createGalleryForm(host: HTMLElement): GalleryRefs {

  // --- Text & display ---

  const textField = new TextField({
    fieldLabel: 'Full Name',
    allowBlank: false,
    emptyText: 'Enter full name',
  });

  const emailField = new TextField({
    fieldLabel: 'Email',
    vtype: 'email',
    emptyText: 'user@example.com',
  });

  const textArea = new TextArea({
    fieldLabel: 'Bio',
    rows: 4,
    emptyText: 'Tell us about yourself',
  });

  const displayField = new DisplayField({
    fieldLabel: 'Status',
    value: 'Active',
  });

  // --- Numeric & date ---

  const numberField = new NumberField({
    fieldLabel: 'Age',
    minValue: 0,
    maxValue: 120,
    value: 30,
  });

  const slider = new Slider({
    fieldLabel: 'Volume',
    minValue: 0,
    maxValue: 100,
    value: 50,
  });

  const dateField = new DateField({ fieldLabel: 'Birthday' });

  const timeField = new TimeField({ fieldLabel: 'Start Time' });

  // --- Selection ---

  const comboBox = new ComboBox({
    fieldLabel: 'Role',
    store: ['Viewer', 'Editor', 'Admin'],
    emptyText: 'Select a role…',
  });

  const tagField = new TagField({
    fieldLabel: 'Tags',
    store: ['TypeScript', 'JavaScript', 'CSS', 'HTML', 'React'],
    emptyText: 'Pick tags…',
  });

  // Both inputValue AND value are set to the same string so that
  // CheckboxGroup.getValue() (which calls cb.getValue() → _value) returns
  // the same tokens that setValue() uses to match _inputValue.
  const checkboxGroup = new CheckboxGroup({
    fieldLabel: 'Skills',
    columns: 3,
    items: [
      new Checkbox({ boxLabel: 'HTML',       inputValue: 'html', value: 'html' }),
      new Checkbox({ boxLabel: 'CSS',        inputValue: 'css',  value: 'css'  }),
      new Checkbox({ boxLabel: 'TypeScript', inputValue: 'ts',   value: 'ts'   }),
    ],
  });

  // Same dual-value trick for Radio so RadioGroup.getValue() returns _value.
  const radioGroup = new RadioGroup({
    fieldLabel: 'Experience',
    items: [
      new Radio({ boxLabel: 'Junior', inputValue: 'jr',   value: 'jr',   name: 'exp' }),
      new Radio({ boxLabel: 'Senior', inputValue: 'sr',   value: 'sr',   name: 'exp' }),
      new Radio({ boxLabel: 'Lead',   inputValue: 'lead', value: 'lead', name: 'exp' }),
    ],
  });

  // --- Rich input ---

  const htmlEditor = new HtmlEditor({ fieldLabel: 'Notes', height: 150 });

  const fileField = new FileField({
    fieldLabel: 'Resume',
    accept: '.pdf,.doc,.docx',
    buttonText: 'Browse…',
  });

  // --- Pickers (standalone — DatePicker and ColorPicker do not extend Field) ---

  const datePicker = new DatePicker({ showToday: true });
  const colorPicker = new ColorPicker({});

  // --- Assemble ---

  const formPanel = new FormPanel({
    renderTo: host,
    title: 'Comprehensive Form Gallery',
    items: [
      new Panel({
        title: 'Personal Information',
        items: [textField, emailField, textArea, displayField],
      }),
      new Panel({
        title: 'Numeric & Date',
        items: [numberField, slider, dateField, timeField],
      }),
      new Panel({
        title: 'Selection',
        items: [comboBox, tagField, checkboxGroup, radioGroup],
      }),
      new Panel({
        title: 'Rich Input',
        items: [htmlEditor, fileField],
      }),
      new Panel({
        title: 'Pickers',
        items: [datePicker, colorPicker],
      }),
    ],
  });

  return {
    textField, emailField, textArea, displayField,
    numberField, slider, dateField, timeField,
    comboBox, tagField, checkboxGroup, radioGroup,
    htmlEditor, fileField,
    datePicker, colorPicker,
    formPanel,
  };
}

// ---------------------------------------------------------------------------
// Application
// ---------------------------------------------------------------------------

export class GalleryApp extends Application {
  private _refs: GalleryRefs | null = null;

  override launch(): void {
    const host = document.getElementById('app');
    if (!host) return;
    this._refs = createGalleryForm(host);
  }

  getRefs(): GalleryRefs | null {
    return this._refs;
  }
}

// ---------------------------------------------------------------------------
// Auto-start (suppressed in test mode)
// ---------------------------------------------------------------------------

if (import.meta.env.MODE !== 'test') {
  new GalleryApp({
    name: 'FormGallery',
    theme: ModernTheme,
  }).start();
}
