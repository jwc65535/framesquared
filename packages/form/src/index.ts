/**
 * @framesquared/form
 * Form fields and validation
 */

export { Field } from './field/Field.js';
export type { FieldConfig } from './field/Field.js';
export { TextField } from './field/Text.js';
export type { TextFieldConfig, TriggerConfig } from './field/Text.js';
export { TextArea } from './field/TextArea.js';
export type { TextAreaConfig } from './field/TextArea.js';
export { DisplayField } from './field/Display.js';
export type { DisplayFieldConfig } from './field/Display.js';
export { HiddenField } from './field/Hidden.js';
export { VTypes } from './field/VTypes.js';
export type { VTypeEntry } from './field/VTypes.js';

// Numeric and Date fields
export { NumberField } from './field/Number.js';
export type { NumberFieldConfig } from './field/Number.js';
export { DateField } from './field/Date.js';
export type { DateFieldConfig } from './field/Date.js';

// Pickers
export { DatePicker } from './picker/DatePicker.js';
export type { DatePickerConfig } from './picker/DatePicker.js';
export { ColorPicker } from './picker/ColorPicker.js';
export type { ColorPickerConfig } from './picker/ColorPicker.js';

// Selection fields
export { ComboBox } from './field/ComboBox.js';
export type { ComboBoxConfig } from './field/ComboBox.js';
export { TagField } from './field/Tag.js';
export type { TagFieldConfig } from './field/Tag.js';
export { Checkbox } from './field/Checkbox.js';
export type { CheckboxConfig } from './field/Checkbox.js';
export { Radio } from './field/Radio.js';
export { CheckboxGroup } from './field/CheckboxGroup.js';
export type { CheckboxGroupConfig } from './field/CheckboxGroup.js';
export { RadioGroup } from './field/RadioGroup.js';
export type { RadioGroupConfig } from './field/RadioGroup.js';
export { BoundList } from './BoundList.js';
export type { BoundListConfig } from './BoundList.js';

// Form panel
export { FormPanel } from './FormPanel.js';
export type { FormPanelConfig } from './FormPanel.js';
export { BasicForm } from './form/BasicForm.js';
export type { SubmitOptions, SubmitResult } from './form/BasicForm.js';

// Validators
export {
  presence,
  length,
  email,
  url,
  alpha,
  alphanum,
  range,
  format,
  inclusion,
  exclusion,
  custom,
  validateChain,
} from './form/Validators.js';

// Field container
export { FieldContainer } from './field/FieldContainer.js';
export type { FieldContainerConfig } from './field/FieldContainer.js';

// Advanced fields
export { Slider } from './field/Slider.js';
export type { SliderConfig } from './field/Slider.js';
export { FileField } from './field/FileUpload.js';
export type { FileFieldConfig } from './field/FileUpload.js';
export { HtmlEditor } from './field/HtmlEditor.js';
export type { HtmlEditorConfig } from './field/HtmlEditor.js';
export { Spinner } from './field/Spinner.js';
export type { SpinnerConfig } from './field/Spinner.js';

// Date utilities
export {
  formatDate,
  parseDate,
  addDate,
  diffDate,
  isLeapYear,
  getDaysInMonth,
  getMonthName,
  getMonthShortName,
} from './util/DateUtil.js';
export type { DateUnit } from './util/DateUtil.js';
