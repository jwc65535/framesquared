/**
 * @framesquared/core – en-US locale bundle
 */

import { Locale } from '../Locale.js';

export const enUS = new Locale({
  language: 'en-US',
  rtl: false,
  firstDayOfWeek: 0,
  numberFormat: { currency: 'USD' },
  messages: {
    // Buttons
    'btn.ok': 'OK',
    'btn.cancel': 'Cancel',
    'btn.yes': 'Yes',
    'btn.no': 'No',
    'btn.save': 'Save',
    'btn.close': 'Close',
    'btn.apply': 'Apply',
    'btn.reset': 'Reset',

    // Grid
    'grid.noData': 'No data to display',
    'grid.loading': 'Loading...',
    'grid.page': 'Page {page} of {total}',
    'grid.pageSize': 'Items per page',

    // Form validation
    'validation.required': 'This field is required',
    'validation.minLength': 'Minimum length is {min} characters',
    'validation.maxLength': 'Maximum length is {max} characters',
    'validation.email': 'This is not a valid email address',
    'validation.range': 'Value must be between {min} and {max}',
    'validation.format': 'Invalid format',

    // Date picker — months
    'datepicker.months.0': 'January',
    'datepicker.months.1': 'February',
    'datepicker.months.2': 'March',
    'datepicker.months.3': 'April',
    'datepicker.months.4': 'May',
    'datepicker.months.5': 'June',
    'datepicker.months.6': 'July',
    'datepicker.months.7': 'August',
    'datepicker.months.8': 'September',
    'datepicker.months.9': 'October',
    'datepicker.months.10': 'November',
    'datepicker.months.11': 'December',

    // Date picker — days
    'datepicker.days.0': 'Sunday',
    'datepicker.days.1': 'Monday',
    'datepicker.days.2': 'Tuesday',
    'datepicker.days.3': 'Wednesday',
    'datepicker.days.4': 'Thursday',
    'datepicker.days.5': 'Friday',
    'datepicker.days.6': 'Saturday',

    // Date picker — short days
    'datepicker.daysShort.0': 'Sun',
    'datepicker.daysShort.1': 'Mon',
    'datepicker.daysShort.2': 'Tue',
    'datepicker.daysShort.3': 'Wed',
    'datepicker.daysShort.4': 'Thu',
    'datepicker.daysShort.5': 'Fri',
    'datepicker.daysShort.6': 'Sat',

    // MessageBox
    'messagebox.alert.title': 'Alert',
    'messagebox.confirm.title': 'Confirm',
    'messagebox.prompt.title': 'Prompt',

    // Misc
    loading: 'Loading...',
    error: 'Error',
  },
});
