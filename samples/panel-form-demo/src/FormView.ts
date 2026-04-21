import { Panel, Viewport, Button } from '@framesquared/ui';
import {
  FormPanel,
  TextField,
  TextArea,
  NumberField,
  DateField,
  TimeField,
  ComboBox,
  Checkbox,
  Radio,
  RadioGroup,
  DisplayField,
  HiddenField,
  FileField,
} from '@framesquared/form';
import { Component } from '@framesquared/component';

// ---------------------------------------------------------------------------
// Country data for ComboBox
// ---------------------------------------------------------------------------

const COUNTRIES = [
  'Australia', 'Brazil', 'Canada', 'China', 'France',
  'Germany', 'India', 'Japan', 'Mexico', 'United Kingdom', 'USA',
];

// ---------------------------------------------------------------------------
// Section heading helper — returns a plain Component with styled HTML
// ---------------------------------------------------------------------------

function sectionHeading(text: string): Component {
  return new Component({
    html: `<div style="font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--ext-color-text-secondary,#757575);padding:12px 0 4px;border-bottom:1px solid rgba(0,0,0,.08);margin-bottom:4px">${text}</div>`,
  });
}

// ---------------------------------------------------------------------------
// FormView
// ---------------------------------------------------------------------------

export function createViewport(): Viewport {
  // ── Output display (shows serialised form values after Get Values) ─────────
  const outputDisplay = new DisplayField({
    name: 'formOutput',
    fieldLabel: 'Form Data',
    value: 'Press "Get Values" to inspect the form.',
  });

  // ── Hidden field ────────────────────────────────────────────────────────────
  const csrfField = new HiddenField({ name: 'csrf', value: 'demo-csrf-token-12345' });

  // ── Radio group ─────────────────────────────────────────────────────────────
  const genderGroup = new RadioGroup({
    items: [
      new Radio({ name: 'gender', inputValue: 'male',   boxLabel: 'Male',   checked: true }),
      new Radio({ name: 'gender', inputValue: 'female', boxLabel: 'Female' }),
      new Radio({ name: 'gender', inputValue: 'other',  boxLabel: 'Other'  }),
    ],
    columns: 3,
  });

  // ── All form fields ─────────────────────────────────────────────────────────
  const firstNameField = new TextField({
    name: 'firstName',
    fieldLabel: 'First Name',
    allowBlank: false,
    emptyText: 'Enter first name',
    value: 'Jane',
  });

  const lastNameField = new TextField({
    name: 'lastName',
    fieldLabel: 'Last Name',
    allowBlank: false,
    emptyText: 'Enter last name',
    value: 'Doe',
  });

  const emailField = new TextField({
    name: 'email',
    fieldLabel: 'Email',
    vtype: 'email',
    emptyText: 'user@example.com',
    value: 'jane.doe@example.com',
  });

  const ageField = new NumberField({
    name: 'age',
    fieldLabel: 'Age',
    minValue: 1,
    maxValue: 120,
    value: 29,
  });

  const countryField = new ComboBox({
    name: 'country',
    fieldLabel: 'Country',
    store: COUNTRIES,
    emptyText: 'Select a country…',
    value: 'Canada',
  });

  const dobField = new DateField({
    name: 'dob',
    fieldLabel: 'Date of Birth',
    format: 'Y-m-d',
    emptyText: 'YYYY-MM-DD',
    maxValue: new Date(),
  });

  const apptField = new TimeField({
    name: 'appt',
    fieldLabel: 'Appointment Time',
    format: 'HH:mm',
    minValue: '08:00',
    maxValue: '18:00',
    value: '09:30',
  });

  const bioField = new TextArea({
    name: 'bio',
    fieldLabel: 'Bio',
    emptyText: 'Tell us about yourself…',
    maxLength: 500,
    value: 'framesquared enthusiast.',
  });

  const newsletterField = new Checkbox({
    name: 'newsletter',
    fieldLabel: 'Newsletter',
    boxLabel: 'Subscribe to our newsletter',
    checked: true,
  });

  const resumeField = new FileField({
    name: 'resume',
    fieldLabel: 'Resume',
    buttonText: 'Browse…',
    accept: '.pdf,.doc,.docx',
  });

  const statusField = new DisplayField({
    name: 'status',
    fieldLabel: 'Account Status',
    value: 'Active',
  });

  // ── Action buttons ──────────────────────────────────────────────────────────
  const validateBtn = new Button({
    text: 'Validate',
    handler: () => {
      const form = mainForm;
      if (form.isValid()) {
        outputDisplay.setValue('✓ Form is valid.');
      } else {
        const invalid = form.getFields()
          .filter((f) => !f.isValid())
          .map((f) => f.getName())
          .join(', ');
        outputDisplay.setValue(`✗ Invalid fields: ${invalid}`);
      }
    },
  });

  const getValuesBtn = new Button({
    text: 'Get Values',
    handler: () => {
      // RadioGroup is not a Field so BasicForm doesn't collect it;
      // merge its value in manually.
      const vals = mainForm.getValues() as Record<string, unknown>;
      vals.gender = genderGroup.getValue();
      outputDisplay.setValue(JSON.stringify(vals, null, 2));
    },
  });

  const resetBtn = new Button({
    text: 'Reset',
    handler: () => {
      mainForm.reset();
      outputDisplay.setValue('Form has been reset.');
    },
  });

  const setValuesBtn = new Button({
    text: 'Set Demo Values',
    handler: () => {
      mainForm.setValues({
        firstName: 'Alice',
        lastName:  'Smith',
        email:     'alice@example.com',
        age:       35,
        country:   'USA',
        bio:       'Demo values loaded by Set Demo Values button.',
      });
      genderGroup.setValue('female');
      outputDisplay.setValue('Demo values applied. Press "Get Values" to confirm.');
    },
  });

  const buttonBar = new Panel({
    border: false,
    layout: { type: 'hbox', align: 'middle', pack: 'start', gap: 8 },
    bodyPadding: '12px 0 0',
    items: [validateBtn, getValuesBtn, resetBtn, setValuesBtn],
  });

  // ── Main form ───────────────────────────────────────────────────────────────
  // Note: RadioGroup is not a Field subclass; it cannot be auto-collected by
  // FormPanel.  It is rendered as a normal container child.  Read its value
  // via genderGroup.getValue() in button handlers.
  const mainForm = new FormPanel({
    title: 'User Profile',
    bodyPadding: 16,
    layout: { type: 'vbox', align: 'stretch' },
    items: [
      csrfField,

      sectionHeading('Personal Information'),
      firstNameField,
      lastNameField,
      emailField,
      ageField,

      sectionHeading('Demographics'),
      new Panel({
        border: false,
        layout: { type: 'vbox', align: 'stretch' },
        items: [
          new DisplayField({ fieldLabel: 'Gender', value: '' }),
          genderGroup,
        ],
      }),
      countryField,

      sectionHeading('Schedule'),
      dobField,
      apptField,

      sectionHeading('Additional Details'),
      bioField,
      newsletterField,
      resumeField,

      sectionHeading('Account'),
      statusField,

      buttonBar,
    ],
  });

  // ── Output panel below the form ─────────────────────────────────────────────
  const outputPanel = new Panel({
    title: 'Output',
    bodyPadding: 12,
    border: true,
    items: [outputDisplay],
  });

  // ── Viewport ────────────────────────────────────────────────────────────────
  return new Viewport({
    layout: { type: 'vbox', align: 'stretch' },
    items: [
      new Panel({
        height: 52,
        border: false,
        bodyPadding: '12px 16px',
        html: '<h2 style="margin:0;font-size:18px;font-weight:600">framesquared — Form Panel Showcase</h2>',
      }),
      new Panel({
        flex: 1,
        border: false,
        layout: { type: 'hbox', align: 'stretch' },
        bodyPadding: 16,
        items: [
          new Panel({
            flex: 1,
            border: false,
            layout: { type: 'vbox', align: 'stretch' },
            items: [mainForm],
          }),
          new Panel({
            width: 360,
            border: false,
            bodyPadding: '0 0 0 16px',
            layout: { type: 'vbox', align: 'stretch' },
            items: [outputPanel],
          }),
        ],
      }),
    ],
  });
}
