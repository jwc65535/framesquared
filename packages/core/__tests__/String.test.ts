import { describe, it, expect } from 'vitest';
import {
  capitalize,
  uncapitalize,
  ellipsis,
  escapeHtml,
  unescapeHtml,
  escapeRegex,
  format,
  repeat,
  trim,
  leftPad,
  toggle,
  splitWords,
  camelCase,
  kebabCase,
  pascalCase,
  htmlEncode,
  htmlDecode,
} from '../src/util/String.js';

// ---------------------------------------------------------------------------
// capitalize
// ---------------------------------------------------------------------------
describe('capitalize', () => {
  it('capitalizes the first character', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('leaves an already-capitalized string unchanged', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });

  it('handles a single character', () => {
    expect(capitalize('a')).toBe('A');
  });

  it('returns empty string for empty input', () => {
    expect(capitalize('')).toBe('');
  });

  it('does not alter characters beyond the first', () => {
    expect(capitalize('hELLO wORLD')).toBe('HELLO wORLD');
  });

  it('handles non-alpha first character', () => {
    expect(capitalize('123abc')).toBe('123abc');
  });

  it('handles unicode letters', () => {
    expect(capitalize('über')).toBe('Über');
  });
});

// ---------------------------------------------------------------------------
// uncapitalize
// ---------------------------------------------------------------------------
describe('uncapitalize', () => {
  it('lowercases the first character', () => {
    expect(uncapitalize('Hello')).toBe('hello');
  });

  it('leaves an already-lowercased string unchanged', () => {
    expect(uncapitalize('hello')).toBe('hello');
  });

  it('handles a single character', () => {
    expect(uncapitalize('A')).toBe('a');
  });

  it('returns empty string for empty input', () => {
    expect(uncapitalize('')).toBe('');
  });

  it('does not alter characters beyond the first', () => {
    expect(uncapitalize('HELLO')).toBe('hELLO');
  });
});

// ---------------------------------------------------------------------------
// ellipsis
// ---------------------------------------------------------------------------
describe('ellipsis', () => {
  it('returns the string unchanged when shorter than length', () => {
    expect(ellipsis('short', 10)).toBe('short');
  });

  it('returns the string unchanged when exactly at length', () => {
    expect(ellipsis('12345', 5)).toBe('12345');
  });

  it('truncates and adds ... when longer than length', () => {
    expect(ellipsis('hello world', 8)).toBe('hello...');
  });

  it('accounts for the ... in the total length', () => {
    // length=8 means the result should be at most 8 chars total
    const result = ellipsis('abcdefghij', 8);
    expect(result.length).toBeLessThanOrEqual(8);
    expect(result).toBe('abcde...');
  });

  it('respects word boundaries when word=true', () => {
    const result = ellipsis('the quick brown fox', 15, true);
    // Should break before a word boundary, not mid-word
    expect(result).toBe('the quick...');
  });

  it('falls back to hard truncation if no space found (word=true)', () => {
    const result = ellipsis('abcdefghijklmnop', 8, true);
    // No spaces at all, so hard truncate
    expect(result).toBe('abcde...');
  });

  it('handles length <= 3 gracefully', () => {
    expect(ellipsis('hello', 3)).toBe('...');
  });

  it('returns empty string for empty input', () => {
    expect(ellipsis('', 10)).toBe('');
  });

  it('word=true with a space right at the boundary', () => {
    // "hello world" with length 8 → "hello" fits with "..."
    const result = ellipsis('hello world', 8, true);
    expect(result).toBe('hello...');
  });
});

// ---------------------------------------------------------------------------
// escapeHtml / htmlEncode
// ---------------------------------------------------------------------------
describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes less-than', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
  });

  it('escapes greater-than', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('escapes all special characters in one string', () => {
    expect(escapeHtml('<a href="x">a & b\'s</a>')).toBe(
      '&lt;a href=&quot;x&quot;&gt;a &amp; b&#39;s&lt;/a&gt;',
    );
  });

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('returns string unchanged when no special characters', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
});

describe('htmlEncode', () => {
  it('is an alias for escapeHtml', () => {
    expect(htmlEncode).toBe(escapeHtml);
  });
});

// ---------------------------------------------------------------------------
// unescapeHtml / htmlDecode
// ---------------------------------------------------------------------------
describe('unescapeHtml', () => {
  it('unescapes &amp;', () => {
    expect(unescapeHtml('a &amp; b')).toBe('a & b');
  });

  it('unescapes &lt; and &gt;', () => {
    expect(unescapeHtml('&lt;div&gt;')).toBe('<div>');
  });

  it('unescapes &quot;', () => {
    expect(unescapeHtml('&quot;hello&quot;')).toBe('"hello"');
  });

  it('unescapes &#39;', () => {
    expect(unescapeHtml('it&#39;s')).toBe("it's");
  });

  it('round-trips with escapeHtml', () => {
    const original = '<a href="x">a & b\'s</a>';
    expect(unescapeHtml(escapeHtml(original))).toBe(original);
  });

  it('returns empty string for empty input', () => {
    expect(unescapeHtml('')).toBe('');
  });

  it('returns string unchanged when no entities', () => {
    expect(unescapeHtml('hello world')).toBe('hello world');
  });
});

describe('htmlDecode', () => {
  it('is an alias for unescapeHtml', () => {
    expect(htmlDecode).toBe(unescapeHtml);
  });
});

// ---------------------------------------------------------------------------
// escapeRegex
// ---------------------------------------------------------------------------
describe('escapeRegex', () => {
  it('escapes dots', () => {
    expect(escapeRegex('a.b')).toBe('a\\.b');
  });

  it('escapes all special regex characters', () => {
    const specials = '.*+?^${}()|[]\\';
    const result = escapeRegex(specials);
    // Every character should be preceded by a backslash
    for (const ch of specials) {
      expect(result).toContain('\\' + ch);
    }
  });

  it('leaves normal characters unchanged', () => {
    expect(escapeRegex('hello')).toBe('hello');
  });

  it('produces a pattern that matches the original literal string', () => {
    const literal = 'price: $100.00 (USD)';
    const re = new RegExp(escapeRegex(literal));
    expect(re.test(literal)).toBe(true);
  });

  it('returns empty string for empty input', () => {
    expect(escapeRegex('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// format
// ---------------------------------------------------------------------------
describe('format', () => {
  it('replaces numbered placeholders', () => {
    expect(format('{0} {1}', 'hello', 'world')).toBe('hello world');
  });

  it('replaces repeated placeholders', () => {
    expect(format('{0} and {0}', 'yes')).toBe('yes and yes');
  });

  it('leaves unreplaced placeholders intact', () => {
    expect(format('{0} {1} {2}', 'a', 'b')).toBe('a b {2}');
  });

  it('converts values to strings', () => {
    expect(format('{0} is {1}', 'count', 42)).toBe('count is 42');
  });

  it('handles null and undefined values', () => {
    expect(format('{0} {1}', null, undefined)).toBe('null undefined');
  });

  it('returns template unchanged when no values given', () => {
    expect(format('hello {0}')).toBe('hello {0}');
  });

  it('returns empty string for empty template', () => {
    expect(format('', 'a', 'b')).toBe('');
  });

  it('handles double-digit indices', () => {
    const args = Array.from({ length: 12 }, (_, i) => `v${i}`);
    expect(format('{10}-{11}', ...args)).toBe('v10-v11');
  });
});

// ---------------------------------------------------------------------------
// repeat
// ---------------------------------------------------------------------------
describe('repeat', () => {
  it('repeats a string n times', () => {
    expect(repeat('ab', 3)).toBe('ababab');
  });

  it('returns empty string for count=0', () => {
    expect(repeat('hello', 0)).toBe('');
  });

  it('returns the string itself for count=1', () => {
    expect(repeat('hello', 1)).toBe('hello');
  });

  it('returns empty string when input is empty', () => {
    expect(repeat('', 5)).toBe('');
  });

  it('handles single character', () => {
    expect(repeat('*', 4)).toBe('****');
  });
});

// ---------------------------------------------------------------------------
// trim
// ---------------------------------------------------------------------------
describe('trim', () => {
  it('trims leading whitespace', () => {
    expect(trim('  hello')).toBe('hello');
  });

  it('trims trailing whitespace', () => {
    expect(trim('hello  ')).toBe('hello');
  });

  it('trims both sides', () => {
    expect(trim('  hello  ')).toBe('hello');
  });

  it('trims tabs and newlines', () => {
    expect(trim('\t\nhello\n\t')).toBe('hello');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(trim('   ')).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(trim('')).toBe('');
  });

  it('does not trim interior whitespace', () => {
    expect(trim(' a b c ')).toBe('a b c');
  });
});

// ---------------------------------------------------------------------------
// leftPad
// ---------------------------------------------------------------------------
describe('leftPad', () => {
  it('pads with spaces by default', () => {
    expect(leftPad('hi', 5)).toBe('   hi');
  });

  it('pads with a custom character', () => {
    expect(leftPad('42', 5, '0')).toBe('00042');
  });

  it('returns the string unchanged when already at or beyond size', () => {
    expect(leftPad('hello', 5)).toBe('hello');
    expect(leftPad('hello!', 5)).toBe('hello!');
  });

  it('handles padding to size=0', () => {
    expect(leftPad('hi', 0)).toBe('hi');
  });

  it('pads empty string', () => {
    expect(leftPad('', 3, '0')).toBe('000');
  });

  it('uses only the first character of the pad string', () => {
    expect(leftPad('x', 4, 'ab')).toBe('aaax');
  });
});

// ---------------------------------------------------------------------------
// toggle
// ---------------------------------------------------------------------------
describe('toggle', () => {
  it('returns value2 when str matches value1', () => {
    expect(toggle('A', 'A', 'B')).toBe('B');
  });

  it('returns value1 when str does not match value1', () => {
    expect(toggle('B', 'A', 'B')).toBe('A');
  });

  it('returns value1 for an unrelated string', () => {
    expect(toggle('C', 'A', 'B')).toBe('A');
  });

  it('handles empty strings', () => {
    expect(toggle('', 'a', 'b')).toBe('a');
    // str='a' does not equal value1='', so returns value1=''
    expect(toggle('a', '', 'b')).toBe('');
    // str='' equals value1='', so returns value2='b'
    expect(toggle('', '', 'b')).toBe('b');
  });
});

// ---------------------------------------------------------------------------
// splitWords
// ---------------------------------------------------------------------------
describe('splitWords', () => {
  it('splits camelCase', () => {
    expect(splitWords('camelCase')).toEqual(['camel', 'Case']);
  });

  it('splits PascalCase', () => {
    expect(splitWords('PascalCase')).toEqual(['Pascal', 'Case']);
  });

  it('splits snake_case', () => {
    expect(splitWords('snake_case')).toEqual(['snake', 'case']);
  });

  it('splits kebab-case', () => {
    expect(splitWords('kebab-case')).toEqual(['kebab', 'case']);
  });

  it('splits mixed delimiters', () => {
    expect(splitWords('one_two-three')).toEqual(['one', 'two', 'three']);
  });

  it('handles consecutive uppercase (acronyms)', () => {
    const result = splitWords('parseHTMLString');
    expect(result).toEqual(['parse', 'HTML', 'String']);
  });

  it('returns empty array for empty string', () => {
    expect(splitWords('')).toEqual([]);
  });

  it('handles single word', () => {
    expect(splitWords('hello')).toEqual(['hello']);
  });

  it('handles all uppercase', () => {
    expect(splitWords('ABC')).toEqual(['ABC']);
  });

  it('handles numbers in words', () => {
    expect(splitWords('item2Count')).toEqual(['item2', 'Count']);
  });

  it('handles leading/trailing delimiters', () => {
    expect(splitWords('_leading')).toEqual(['leading']);
    expect(splitWords('trailing_')).toEqual(['trailing']);
  });
});

// ---------------------------------------------------------------------------
// camelCase
// ---------------------------------------------------------------------------
describe('camelCase', () => {
  it('converts PascalCase', () => {
    expect(camelCase('PascalCase')).toBe('pascalCase');
  });

  it('converts snake_case', () => {
    expect(camelCase('snake_case')).toBe('snakeCase');
  });

  it('converts kebab-case', () => {
    expect(camelCase('kebab-case')).toBe('kebabCase');
  });

  it('handles already camelCase', () => {
    expect(camelCase('camelCase')).toBe('camelCase');
  });

  it('handles single word', () => {
    expect(camelCase('hello')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(camelCase('')).toBe('');
  });

  it('handles acronyms', () => {
    expect(camelCase('parseHTMLString')).toBe('parseHtmlString');
  });

  it('handles multiple delimiters', () => {
    expect(camelCase('one_two-three')).toBe('oneTwoThree');
  });
});

// ---------------------------------------------------------------------------
// kebabCase
// ---------------------------------------------------------------------------
describe('kebabCase', () => {
  it('converts camelCase', () => {
    expect(kebabCase('camelCase')).toBe('camel-case');
  });

  it('converts PascalCase', () => {
    expect(kebabCase('PascalCase')).toBe('pascal-case');
  });

  it('converts snake_case', () => {
    expect(kebabCase('snake_case')).toBe('snake-case');
  });

  it('handles already kebab-case', () => {
    expect(kebabCase('kebab-case')).toBe('kebab-case');
  });

  it('handles single word', () => {
    expect(kebabCase('hello')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(kebabCase('')).toBe('');
  });

  it('handles acronyms', () => {
    expect(kebabCase('parseHTMLString')).toBe('parse-html-string');
  });
});

// ---------------------------------------------------------------------------
// pascalCase
// ---------------------------------------------------------------------------
describe('pascalCase', () => {
  it('converts camelCase', () => {
    expect(pascalCase('camelCase')).toBe('CamelCase');
  });

  it('converts snake_case', () => {
    expect(pascalCase('snake_case')).toBe('SnakeCase');
  });

  it('converts kebab-case', () => {
    expect(pascalCase('kebab-case')).toBe('KebabCase');
  });

  it('handles already PascalCase', () => {
    expect(pascalCase('PascalCase')).toBe('PascalCase');
  });

  it('handles single word', () => {
    expect(pascalCase('hello')).toBe('Hello');
  });

  it('handles empty string', () => {
    expect(pascalCase('')).toBe('');
  });

  it('handles acronyms', () => {
    expect(pascalCase('parseHTMLString')).toBe('ParseHtmlString');
  });
});
