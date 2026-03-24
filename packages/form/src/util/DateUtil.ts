/**
 * @ext-ts/form – DateUtil
 *
 * Date utility functions: format, parse, add, diff, isLeapYear, getDaysInMonth.
 * Format tokens: Y (4-digit year), m (01-12), d (01-31),
 * H (00-23), i (00-59), s (00-59), g (1-12), A (AM/PM).
 */

export type DateUnit = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0');
}

// ---------------------------------------------------------------------------
// Format
// ---------------------------------------------------------------------------

export function formatDate(date: Date, format: string): string {
  const Y = date.getFullYear();
  const m = date.getMonth();     // 0-based
  const d = date.getDate();
  const H = date.getHours();
  const i = date.getMinutes();
  const s = date.getSeconds();

  // 12-hour
  const h12 = H % 12 || 12;
  const ampm = H < 12 ? 'AM' : 'PM';

  let result = '';
  for (let idx = 0; idx < format.length; idx++) {
    const ch = format[idx];
    switch (ch) {
      case 'Y': result += String(Y); break;
      case 'm': result += pad(m + 1); break;
      case 'd': result += pad(d); break;
      case 'H': result += pad(H); break;
      case 'i': result += pad(i); break;
      case 's': result += pad(s); break;
      case 'g': result += String(h12); break;
      case 'A': result += ampm; break;
      case 'F': result += MONTH_NAMES[m]; break;
      case 'M': result += MONTH_SHORT[m]; break;
      case 'j': result += String(d); break;
      case 'n': result += String(m + 1); break;
      default:  result += ch; break;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

export function parseDate(input: string, format: string): Date {
  let year = 0, month = 0, day = 1, hour = 0, minute = 0, second = 0;
  let inputIdx = 0;

  for (let fmtIdx = 0; fmtIdx < format.length && inputIdx < input.length; fmtIdx++) {
    const ch = format[fmtIdx];
    switch (ch) {
      case 'Y': year = parseInt(input.slice(inputIdx, inputIdx + 4), 10); inputIdx += 4; break;
      case 'm': month = parseInt(input.slice(inputIdx, inputIdx + 2), 10) - 1; inputIdx += 2; break;
      case 'd': day = parseInt(input.slice(inputIdx, inputIdx + 2), 10); inputIdx += 2; break;
      case 'H': hour = parseInt(input.slice(inputIdx, inputIdx + 2), 10); inputIdx += 2; break;
      case 'i': minute = parseInt(input.slice(inputIdx, inputIdx + 2), 10); inputIdx += 2; break;
      case 's': second = parseInt(input.slice(inputIdx, inputIdx + 2), 10); inputIdx += 2; break;
      default:  inputIdx++; break; // skip separator
    }
  }

  return new Date(year, month, day, hour, minute, second);
}

// ---------------------------------------------------------------------------
// Arithmetic
// ---------------------------------------------------------------------------

export function addDate(date: Date, unit: DateUnit, amount: number): Date {
  const d = new Date(date.getTime());
  switch (unit) {
    case 'year':   d.setFullYear(d.getFullYear() + amount); break;
    case 'month':  d.setMonth(d.getMonth() + amount); break;
    case 'day':    d.setDate(d.getDate() + amount); break;
    case 'hour':   d.setHours(d.getHours() + amount); break;
    case 'minute': d.setMinutes(d.getMinutes() + amount); break;
    case 'second': d.setSeconds(d.getSeconds() + amount); break;
  }
  return d;
}

export function diffDate(date1: Date, date2: Date, unit: DateUnit): number {
  const ms = date2.getTime() - date1.getTime();
  switch (unit) {
    case 'second': return Math.round(ms / 1000);
    case 'minute': return Math.round(ms / 60000);
    case 'hour':   return Math.round(ms / 3600000);
    case 'day':    return Math.round(ms / 86400000);
    case 'month':  return (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth());
    case 'year':   return date2.getFullYear() - date1.getFullYear();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getMonthName(month: number): string {
  return MONTH_NAMES[month] ?? '';
}

export function getMonthShortName(month: number): string {
  return MONTH_SHORT[month] ?? '';
}
