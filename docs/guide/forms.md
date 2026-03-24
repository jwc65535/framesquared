# Forms

framesquared provides a comprehensive form system with typed fields, real-time validation, and server submission.

## FormPanel

```typescript
import { FormPanel, TextField, NumberField, ComboBox, Checkbox } from '@framesquared/form';

const form = new FormPanel({
  title: 'User Registration',
  renderTo: document.body,
  items: [
    new TextField({ name: 'name', fieldLabel: 'Full Name', allowBlank: false }),
    new TextField({ name: 'email', fieldLabel: 'Email', vtype: 'email' }),
    new NumberField({ name: 'age', fieldLabel: 'Age', minValue: 18, maxValue: 120 }),
    new ComboBox({
      name: 'role', fieldLabel: 'Role',
      store: [{ value: 'user', text: 'User' }, { value: 'admin', text: 'Admin' }],
      displayField: 'text', valueField: 'value',
    }),
    new Checkbox({ name: 'agree', fieldLabel: 'I agree to terms' }),
  ],
});
```

## Field Types

| Field | Import | Key configs |
|-------|--------|-------------|
| `TextField` | `@framesquared/form` | `allowBlank`, `minLength`, `maxLength`, `vtype`, `regex` |
| `TextArea` | `@framesquared/form` | `rows`, `grow`, `growMax` |
| `NumberField` | `@framesquared/form` | `minValue`, `maxValue`, `step`, `decimalPrecision` |
| `DateField` | `@framesquared/form` | `format`, `minValue`, `maxValue` |
| `ComboBox` | `@framesquared/form` | `store`, `displayField`, `valueField`, `editable`, `multiSelect` |
| `TagField` | `@framesquared/form` | `store`, `displayField`, `valueField` |
| `Checkbox` | `@framesquared/form` | `checked`, `inputValue` |
| `Radio` | `@framesquared/form` | `name` (group), `inputValue` |
| `Slider` | `@framesquared/form` | `minValue`, `maxValue`, `step` |
| `FileUploadField` | `@framesquared/form` | `accept`, `multiple` |
| `HtmlEditor` | `@framesquared/form` | `enableColors`, `enableFont`, `enableLinks` |
| `Spinner` | `@framesquared/form` | `minValue`, `maxValue`, `step` |
| `HiddenField` | `@framesquared/form` | `name`, `value` |
| `DisplayField` | `@framesquared/form` | `value` (read-only display) |

## Validation

### Built-in VTypes

```typescript
new TextField({ vtype: 'email' });  // Email format
new TextField({ vtype: 'url' });    // URL format
new TextField({ vtype: 'alpha' });  // Letters only
new TextField({ vtype: 'alphanum' }); // Letters + numbers
```

### Custom Validators

```typescript
import { presence, length, email, rangeValidator } from '@framesquared/data';

// On the Model
class User extends Model {
  static validators = {
    name: [presence(), length({ min: 2, max: 50 })],
    email: [email()],
    age: [rangeValidator({ min: 0, max: 150 })],
  };
}
```

### Form-Level Validation

```typescript
if (form.isValid()) {
  // All fields pass validation
  const values = form.getValues();
} else {
  // Get individual field errors
  form.getFields().forEach(field => {
    const errors = field.getErrors();
    if (errors.length > 0) console.log(field.getName(), errors);
  });
}
```

## Getting / Setting Values

```typescript
// Set all field values at once
form.setValues({ name: 'Alice', email: 'alice@example.com', age: 30 });

// Get all values
const values = form.getValues(); // { name: 'Alice', email: '...', age: '30' }

// Get only dirty (changed) values
const dirty = form.getValues(false, true);

// Reset to original values
form.reset();
```

## Date and Color Pickers

```typescript
import { DatePicker, ColorPicker } from '@framesquared/form';

const datePicker = new DatePicker({
  value: new Date(),
  minDate: new Date(2020, 0, 1),
  maxDate: new Date(2030, 11, 31),
  handler: (picker, date) => console.log('Selected:', date),
});

const colorPicker = new ColorPicker({
  value: '#ff0000',
  handler: (picker, color) => console.log('Color:', color),
});
```

## CheckboxGroup and RadioGroup

```typescript
import { CheckboxGroup, RadioGroup, Checkbox, Radio } from '@framesquared/form';

const sizes = new CheckboxGroup({
  fieldLabel: 'Sizes',
  columns: 3,
  items: [
    new Checkbox({ boxLabel: 'Small', inputValue: 'S' }),
    new Checkbox({ boxLabel: 'Medium', inputValue: 'M' }),
    new Checkbox({ boxLabel: 'Large', inputValue: 'L' }),
  ],
});

const priority = new RadioGroup({
  fieldLabel: 'Priority',
  items: [
    new Radio({ boxLabel: 'Low', name: 'priority', inputValue: 'low' }),
    new Radio({ boxLabel: 'High', name: 'priority', inputValue: 'high' }),
  ],
});
```
