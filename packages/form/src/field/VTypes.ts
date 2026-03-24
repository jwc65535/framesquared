/**
 * @ext-ts/form – VTypes
 * Predefined validation types for text fields.
 */

export interface VTypeEntry {
  test: (value: string) => boolean;
  regex: RegExp;
  text: string;
}

export const VTypes: Record<string, VTypeEntry> = {
  email: {
    regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    test: (v: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v),
    text: 'Not a valid email address',
  },
  url: {
    regex: /^https?:\/\/.+/,
    test: (v: string) => /^https?:\/\/.+/.test(v),
    text: 'Not a valid URL',
  },
  alpha: {
    regex: /^[a-zA-Z]+$/,
    test: (v: string) => /^[a-zA-Z]+$/.test(v),
    text: 'Only letters allowed',
  },
  alphanum: {
    regex: /^[a-zA-Z0-9]+$/,
    test: (v: string) => /^[a-zA-Z0-9]+$/.test(v),
    text: 'Only letters and numbers allowed',
  },
};
