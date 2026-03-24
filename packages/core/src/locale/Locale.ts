/**
 * @framesquared/core – Locale
 *
 * Manages translations, number/date formatting (via Intl APIs),
 * plural rules, RTL direction, and locale-aware collation.
 */

export interface NumberFormatOptions {
  currency?: string;
}

export interface LocaleConfig {
  language: string;
  rtl?: boolean;
  messages: Record<string, string>;
  dateFormat?: string;
  timeFormat?: string;
  numberFormat?: NumberFormatOptions;
  firstDayOfWeek?: number;
  pluralRules?: (count: number) => string;
}

export class Locale {
  private _language: string;
  private _rtl: boolean;
  private _messages: Record<string, string>;
  private _numberFormat: NumberFormatOptions;
  private _firstDayOfWeek: number;
  private _pluralRules: ((count: number) => string) | null;
  private _collator: Intl.Collator;
  private _numberFormatter: Intl.NumberFormat;
  private _dateFormatter: Intl.DateTimeFormat;
  private _timeFormatter: Intl.DateTimeFormat;
  private _currencyFormatter: Intl.NumberFormat | null = null;

  constructor(config: LocaleConfig) {
    this._language = config.language;
    this._rtl = config.rtl ?? false;
    this._messages = { ...config.messages };
    this._numberFormat = config.numberFormat ?? {};
    this._firstDayOfWeek = config.firstDayOfWeek ?? 0;
    this._pluralRules = config.pluralRules ?? null;

    // Intl formatters
    this._collator = new Intl.Collator(this._language);
    this._numberFormatter = new Intl.NumberFormat(this._language);
    this._dateFormatter = new Intl.DateTimeFormat(this._language, {
      year: 'numeric', month: 'numeric', day: 'numeric',
    });
    this._timeFormatter = new Intl.DateTimeFormat(this._language, {
      hour: 'numeric', minute: 'numeric',
    });

    if (this._numberFormat.currency) {
      this._currencyFormatter = new Intl.NumberFormat(this._language, {
        style: 'currency', currency: this._numberFormat.currency,
      });
    }
  }

  // -----------------------------------------------------------------------
  // Accessors
  // -----------------------------------------------------------------------

  getLanguage(): string { return this._language; }
  isRtl(): boolean { return this._rtl; }
  getDirection(): 'ltr' | 'rtl' { return this._rtl ? 'rtl' : 'ltr'; }
  getFirstDayOfWeek(): number { return this._firstDayOfWeek; }

  // -----------------------------------------------------------------------
  // Translation
  // -----------------------------------------------------------------------

  t(key: string, params?: Record<string, unknown>): string {
    let msg = this._messages[key];
    if (msg === undefined) return key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        msg = msg.replaceAll(`{${k}}`, String(v ?? ''));
      }
    }
    return msg;
  }

  /**
   * Translate with plural support.  Appends the plural category
   * to the key (e.g., 'items.one', 'items.other').
   */
  tp(key: string, count: number, params?: Record<string, unknown>): string {
    const category = this.getPlural(count);
    return this.t(`${key}.${category}`, params);
  }

  // -----------------------------------------------------------------------
  // Plural rules
  // -----------------------------------------------------------------------

  getPlural(count: number): string {
    if (this._pluralRules) return this._pluralRules(count);
    // Use Intl.PluralRules
    try {
      return new Intl.PluralRules(this._language).select(count);
    } catch {
      return count === 1 ? 'one' : 'other';
    }
  }

  // -----------------------------------------------------------------------
  // Number formatting
  // -----------------------------------------------------------------------

  formatNumber(value: number): string {
    return this._numberFormatter.format(value);
  }

  formatCurrency(value: number): string {
    if (this._currencyFormatter) return this._currencyFormatter.format(value);
    return this._numberFormatter.format(value);
  }

  // -----------------------------------------------------------------------
  // Date / time formatting
  // -----------------------------------------------------------------------

  formatDate(date: Date): string {
    return this._dateFormatter.format(date);
  }

  formatTime(date: Date): string {
    return this._timeFormatter.format(date);
  }

  // -----------------------------------------------------------------------
  // Collation / sorting
  // -----------------------------------------------------------------------

  compare(a: string, b: string): number {
    return this._collator.compare(a, b);
  }
}
