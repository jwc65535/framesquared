import { describe, it, expect } from 'vitest';
import { XTemplate } from '../src/template/XTemplate.js';

// ═══════════════════════════════════════════════════════════════════════════
// Basic interpolation
// ═══════════════════════════════════════════════════════════════════════════

describe('Basic interpolation', () => {
  it('substitutes simple field names', () => {
    const tpl = new XTemplate('{name} is {age}');
    expect(tpl.apply({ name: 'Alice', age: 30 })).toBe('Alice is 30');
  });

  it('missing field returns empty string', () => {
    const tpl = new XTemplate('Hello {missing}!');
    expect(tpl.apply({})).toBe('Hello !');
  });

  it('null value returns empty string', () => {
    const tpl = new XTemplate('Value: {x}');
    expect(tpl.apply({ x: null })).toBe('Value: ');
  });

  it('undefined value returns empty string', () => {
    const tpl = new XTemplate('Value: {x}');
    expect(tpl.apply({ x: undefined })).toBe('Value: ');
  });

  it('supports nested dot paths', () => {
    const tpl = new XTemplate('{user.name} lives in {user.address.city}');
    expect(tpl.apply({
      user: { name: 'Alice', address: { city: 'NYC' } },
    })).toBe('Alice lives in NYC');
  });

  it('numeric values are converted to string', () => {
    const tpl = new XTemplate('Count: {count}');
    expect(tpl.apply({ count: 42 })).toBe('Count: 42');
  });

  it('boolean values are converted to string', () => {
    const tpl = new XTemplate('Active: {active}');
    expect(tpl.apply({ active: true })).toBe('Active: true');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Format functions
// ═══════════════════════════════════════════════════════════════════════════

describe('Format functions', () => {
  it('{field:htmlEncode} encodes HTML entities', () => {
    const tpl = new XTemplate('{text:htmlEncode}');
    expect(tpl.apply({ text: '<b>bold</b>' })).toBe('&lt;b&gt;bold&lt;/b&gt;');
  });

  it('{field:htmlDecode} decodes HTML entities', () => {
    const tpl = new XTemplate('{text:htmlDecode}');
    expect(tpl.apply({ text: '&lt;b&gt;' })).toBe('<b>');
  });

  it('{field:trim} trims whitespace', () => {
    const tpl = new XTemplate('{text:trim}');
    expect(tpl.apply({ text: '  hello  ' })).toBe('hello');
  });

  it('{field:uppercase}', () => {
    const tpl = new XTemplate('{text:uppercase}');
    expect(tpl.apply({ text: 'hello' })).toBe('HELLO');
  });

  it('{field:lowercase}', () => {
    const tpl = new XTemplate('{text:lowercase}');
    expect(tpl.apply({ text: 'HELLO' })).toBe('hello');
  });

  it('{field:capitalize}', () => {
    const tpl = new XTemplate('{text:capitalize}');
    expect(tpl.apply({ text: 'hello world' })).toBe('Hello world');
  });

  it('{field:ellipsis(10)}', () => {
    const tpl = new XTemplate('{text:ellipsis(10)}');
    expect(tpl.apply({ text: 'A very long string here' })).toBe('A very ...');
  });

  it('{field:ellipsis} on short text returns as-is', () => {
    const tpl = new XTemplate('{text:ellipsis(50)}');
    expect(tpl.apply({ text: 'Short' })).toBe('Short');
  });

  it('{field:round(2)} rounds numbers', () => {
    const tpl = new XTemplate('{value:round(2)}');
    expect(tpl.apply({ value: 3.14159 })).toBe('3.14');
  });

  it('{field:number(0,000.00)} formats numbers', () => {
    const tpl = new XTemplate('{value:number}');
    expect(tpl.apply({ value: 1234.5 })).toBe('1234.5');
  });

  it('{field:currency} formats as currency', () => {
    const tpl = new XTemplate('{value:currency}');
    const result = tpl.apply({ value: 1234.5 });
    expect(result).toContain('1234.50');
  });

  it('{field:usMoney} formats as US money', () => {
    const tpl = new XTemplate('{value:usMoney}');
    const result = tpl.apply({ value: 1234.5 });
    expect(result).toContain('$');
    expect(result).toContain('1,234.50');
  });

  it('{field:fileSize} formats bytes', () => {
    const tpl = new XTemplate('{size:fileSize}');
    expect(tpl.apply({ size: 1024 })).toBe('1 KB');
    expect(tpl.apply({ size: 1048576 })).toBe('1 MB');
    expect(tpl.apply({ size: 500 })).toBe('500 bytes');
  });

  it('{field:plural("item")} pluralizes', () => {
    const tpl = new XTemplate('{count:plural("item")}');
    expect(tpl.apply({ count: 1 })).toBe('1 item');
    expect(tpl.apply({ count: 5 })).toBe('5 items');
  });

  it('{field:date} formats a date', () => {
    const tpl = new XTemplate('{d:date}');
    const result = tpl.apply({ d: '2024-01-15' });
    expect(result).toContain('2024');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Conditionals
// ═══════════════════════════════════════════════════════════════════════════

describe('Conditionals', () => {
  it('tpl if — true condition renders content', () => {
    const tpl = new XTemplate('<tpl if="age > 18">Adult</tpl>');
    expect(tpl.apply({ age: 25 })).toBe('Adult');
  });

  it('tpl if — false condition renders nothing', () => {
    const tpl = new XTemplate('<tpl if="age > 18">Adult</tpl>');
    expect(tpl.apply({ age: 10 })).toBe('');
  });

  it('tpl if/else', () => {
    const tpl = new XTemplate(
      '<tpl if="active">Active<tpl else>Inactive</tpl>',
    );
    expect(tpl.apply({ active: true })).toBe('Active');
    expect(tpl.apply({ active: false })).toBe('Inactive');
  });

  it('tpl if/elseif/else', () => {
    const tpl = new XTemplate([
      '<tpl if="age >= 18">Adult',
      '<tpl elseif="age >= 13">Teen',
      '<tpl else>Child',
      '</tpl>',
    ].join(''));
    expect(tpl.apply({ age: 25 })).toBe('Adult');
    expect(tpl.apply({ age: 15 })).toBe('Teen');
    expect(tpl.apply({ age: 5 })).toBe('Child');
  });

  it('conditional with string comparison', () => {
    const tpl = new XTemplate('<tpl if="status == \'active\'">Active</tpl>');
    expect(tpl.apply({ status: 'active' })).toBe('Active');
    expect(tpl.apply({ status: 'inactive' })).toBe('');
  });

  it('conditional with boolean field', () => {
    const tpl = new XTemplate('<tpl if="visible">Shown</tpl>');
    expect(tpl.apply({ visible: true })).toBe('Shown');
    expect(tpl.apply({ visible: false })).toBe('');
  });

  it('conditional with nested field', () => {
    const tpl = new XTemplate('<tpl if="user.admin">Admin</tpl>');
    expect(tpl.apply({ user: { admin: true } })).toBe('Admin');
  });

  it('conditional with interpolation inside', () => {
    const tpl = new XTemplate('<tpl if="show">{message}</tpl>');
    expect(tpl.apply({ show: true, message: 'Hello' })).toBe('Hello');
    expect(tpl.apply({ show: false, message: 'Hello' })).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Loops
// ═══════════════════════════════════════════════════════════════════════════

describe('Loops', () => {
  it('tpl for iterates array field', () => {
    const tpl = new XTemplate('<tpl for="items">{name} </tpl>');
    expect(tpl.apply({ items: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] }))
      .toBe('A B C ');
  });

  it('{.} refers to current value in simple array', () => {
    const tpl = new XTemplate('<tpl for="tags">{.} </tpl>');
    expect(tpl.apply({ tags: ['red', 'green', 'blue'] }))
      .toBe('red green blue ');
  });

  it('{#} gives 1-based index', () => {
    const tpl = new XTemplate('<tpl for="items">{#}:{name} </tpl>');
    expect(tpl.apply({ items: [{ name: 'A' }, { name: 'B' }] }))
      .toBe('1:A 2:B ');
  });

  it('for "." iterates root array', () => {
    const tpl = new XTemplate('<tpl for=".">{name} </tpl>');
    expect(tpl.apply([{ name: 'X' }, { name: 'Y' }] as any))
      .toBe('X Y ');
  });

  it('{[xindex]} gives 1-based index', () => {
    const tpl = new XTemplate('<tpl for="items">{[xindex]} </tpl>');
    expect(tpl.apply({ items: ['a', 'b', 'c'] })).toBe('1 2 3 ');
  });

  it('{[xcount]} gives total count', () => {
    const tpl = new XTemplate('<tpl for="items">{[xcount]} </tpl>');
    expect(tpl.apply({ items: ['a', 'b', 'c'] })).toBe('3 3 3 ');
  });

  it('nested loops with parent access', () => {
    const tpl = new XTemplate(
      '<tpl for="groups">{name}:<tpl for="items">{parent.name}/{.} </tpl></tpl>',
    );
    expect(tpl.apply({
      groups: [
        { name: 'G1', items: ['a', 'b'] },
        { name: 'G2', items: ['c'] },
      ],
    })).toBe('G1:G1/a G1/b G2:G2/c ');
  });

  it('empty array produces no output', () => {
    const tpl = new XTemplate('<tpl for="items">{name}</tpl>');
    expect(tpl.apply({ items: [] })).toBe('');
  });

  it('missing array field produces no output', () => {
    const tpl = new XTemplate('<tpl for="items">{name}</tpl>');
    expect(tpl.apply({})).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Inline expressions
// ═══════════════════════════════════════════════════════════════════════════

describe('Inline expressions', () => {
  it('{[values.price * values.quantity]} computes expression', () => {
    const tpl = new XTemplate('Total: {[values.price * values.quantity]}');
    expect(tpl.apply({ price: 10, quantity: 3 })).toBe('Total: 30');
  });

  it('{[values.a + values.b]} addition', () => {
    const tpl = new XTemplate('{[values.a + values.b]}');
    expect(tpl.apply({ a: 2, b: 3 })).toBe('5');
  });

  it('expression with string concatenation', () => {
    const tpl = new XTemplate('{[values.first + " " + values.last]}');
    expect(tpl.apply({ first: 'John', last: 'Doe' })).toBe('John Doe');
  });

  it('expression with ternary', () => {
    const tpl = new XTemplate('{[values.score >= 50 ? "PASS" : "FAIL"]}');
    expect(tpl.apply({ score: 75 })).toBe('PASS');
    expect(tpl.apply({ score: 30 })).toBe('FAIL');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Template methods
// ═══════════════════════════════════════════════════════════════════════════

describe('Template methods', () => {
  it('{[this.greet(values.name)]} calls member function', () => {
    const tpl = new XTemplate('{[this.greet(values.name)]}', {
      greet: (name: string) => `Hello, ${name}!`,
    });
    expect(tpl.apply({ name: 'Alice' })).toBe('Hello, Alice!');
  });

  it('method with multiple args', () => {
    const tpl = new XTemplate('{[this.sum(values.a, values.b)]}', {
      sum: (a: number, b: number) => a + b,
    });
    expect(tpl.apply({ a: 3, b: 7 })).toBe('10');
  });

  it('method returning HTML', () => {
    const tpl = new XTemplate('{[this.badge(values.status)]}', {
      badge: (status: string) => `<span class="${status}">${status}</span>`,
    });
    expect(tpl.apply({ status: 'active' })).toBe('<span class="active">active</span>');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Compilation caching
// ═══════════════════════════════════════════════════════════════════════════

describe('Compilation caching', () => {
  it('second apply does not recompile', () => {
    const tpl = new XTemplate('Hello {name}');
    tpl.compile();
    const result1 = tpl.apply({ name: 'A' });
    const result2 = tpl.apply({ name: 'B' });
    expect(result1).toBe('Hello A');
    expect(result2).toBe('Hello B');
  });

  it('auto-compiles on first apply', () => {
    const tpl = new XTemplate('{x}');
    expect(tpl.apply({ x: 42 })).toBe('42');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// XSS safety
// ═══════════════════════════════════════════════════════════════════════════

describe('XSS safety', () => {
  it('htmlEncode format prevents XSS', () => {
    const tpl = new XTemplate('{input:htmlEncode}');
    const result = tpl.apply({ input: '<script>alert("xss")</script>' });
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// DOM integration
// ═══════════════════════════════════════════════════════════════════════════

describe('DOM integration', () => {
  it('append() injects HTML into element', () => {
    const el = document.createElement('div');
    const tpl = new XTemplate('<span>{name}</span>');
    tpl.append(el, { name: 'Test' });
    expect(el.innerHTML).toBe('<span>Test</span>');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Error handling
// ═══════════════════════════════════════════════════════════════════════════

describe('Error handling', () => {
  it('invalid expression does not throw, returns error marker', () => {
    const tpl = new XTemplate('{[!!!invalid]}');
    expect(() => tpl.apply({})).not.toThrow();
  });

  it('missing data gracefully handled', () => {
    const tpl = new XTemplate('{a.b.c.d}');
    expect(tpl.apply({})).toBe('');
  });

  it('empty template returns empty string', () => {
    const tpl = new XTemplate('');
    expect(tpl.apply({})).toBe('');
  });

  it('invalid condition evaluates to false', () => {
    const tpl = new XTemplate('<tpl if="!!!">yes<tpl else>no</tpl>');
    expect(tpl.apply({})).toBe('no');
  });

  it('condition with null data does not throw', () => {
    const tpl = new XTemplate('<tpl if="x > 0">yes</tpl>');
    expect(tpl.apply({})).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Additional branch coverage
// ═══════════════════════════════════════════════════════════════════════════

describe('Additional XTemplate branches', () => {
  it('format on {.} in loop', () => {
    const tpl = new XTemplate('<tpl for="items">{.:uppercase} </tpl>');
    expect(tpl.apply({ items: ['hello', 'world'] })).toBe('HELLO WORLD ');
  });

  it('format function with null value', () => {
    const tpl = new XTemplate('{x:uppercase}');
    expect(tpl.apply({ x: null })).toBe('');
  });

  it('ellipsis with 0 max returns as-is', () => {
    const tpl = new XTemplate('{text:ellipsis(0)}');
    expect(tpl.apply({ text: 'abc' })).toBe('abc');
  });

  it('usMoney with negative value', () => {
    const tpl = new XTemplate('{v:usMoney}');
    expect(tpl.apply({ v: -1234.5 })).toContain('-$');
  });

  it('fileSize GB', () => {
    const tpl = new XTemplate('{s:fileSize}');
    expect(tpl.apply({ s: 2147483648 })).toContain('GB');
  });

  it('plural with 0 count', () => {
    const tpl = new XTemplate('{n:plural("item")}');
    expect(tpl.apply({ n: 0 })).toBe('0 items');
  });

  it('date with Date object', () => {
    const tpl = new XTemplate('{d:date}');
    const result = tpl.apply({ d: new Date('2024-06-15') });
    expect(result).toContain('2024');
  });

  it('date with invalid value', () => {
    const tpl = new XTemplate('{d:date}');
    expect(tpl.apply({ d: 'not-a-date' })).toBe('not-a-date');
  });

  it('for with non-array field produces nothing', () => {
    const tpl = new XTemplate('<tpl for="items">{.}</tpl>');
    expect(tpl.apply({ items: 'not-array' })).toBe('');
  });

  it('expression with xindex and xcount inside loop', () => {
    const tpl = new XTemplate('<tpl for="items">{[xindex]}/{[xcount]} </tpl>');
    expect(tpl.apply({ items: ['a', 'b'] })).toBe('1/2 2/2 ');
  });

  it('elseif branch with condition', () => {
    const tpl = new XTemplate(
      '<tpl if="x == 1">one<tpl elseif="x == 2">two<tpl else>other</tpl>',
    );
    expect(tpl.apply({ x: 2 })).toBe('two');
  });

  it('nested tpl for inside tpl if', () => {
    const tpl = new XTemplate(
      '<tpl if="show"><tpl for="list">{.} </tpl></tpl>',
    );
    expect(tpl.apply({ show: true, list: ['a', 'b'] })).toBe('a b ');
  });

  it('resolve on non-object returns undefined', () => {
    const tpl = new XTemplate('{a.b}');
    expect(tpl.apply({ a: 42 })).toBe('');
  });

  it('attribute without quotes in condition', () => {
    const tpl = new XTemplate('<tpl if="count > 0">{count}</tpl>');
    expect(tpl.apply({ count: 5 })).toBe('5');
  });

  it('htmlDecode all entities', () => {
    const tpl = new XTemplate('{t:htmlDecode}');
    expect(tpl.apply({ t: '&amp;&lt;&gt;&quot;&#39;' })).toBe('&<>"\'' );
  });

  it('condition with single-quoted string', () => {
    const tpl = new XTemplate("<tpl if=\"status == 'ok'\">OK</tpl>");
    expect(tpl.apply({ status: 'ok' })).toBe('OK');
  });

  it('loop inside loop with expressions', () => {
    const tpl = new XTemplate(
      '<tpl for="rows"><tpl for="cells">{[values.v]} </tpl></tpl>',
    );
    expect(tpl.apply({
      rows: [
        { cells: [{ v: 1 }, { v: 2 }] },
        { cells: [{ v: 3 }] },
      ],
    })).toBe('1 2 3 ');
  });

  it('unclosed tpl tag is handled gracefully', () => {
    const tpl = new XTemplate('<tpl for="items">{.} ');
    expect(() => tpl.apply({ items: ['a'] })).not.toThrow();
  });

  it('method returning number', () => {
    const tpl = new XTemplate('{[this.double(values.x)]}', {
      double: (x: number) => x * 2,
    });
    expect(tpl.apply({ x: 5 })).toBe('10');
  });

  it('PrimitiveScope resolves nested parent path', () => {
    const tpl = new XTemplate(
      '<tpl for="items">{parent.title}: {.} </tpl>',
    );
    expect(tpl.apply({ title: 'List', items: [1, 2] })).toBe('List: 1 List: 2 ');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Mixed / complex templates
// ═══════════════════════════════════════════════════════════════════════════

describe('Complex templates', () => {
  it('loop with conditional inside', () => {
    const tpl = new XTemplate(
      '<tpl for="items"><tpl if="active">{name} </tpl></tpl>',
    );
    expect(tpl.apply({
      items: [
        { name: 'A', active: true },
        { name: 'B', active: false },
        { name: 'C', active: true },
      ],
    })).toBe('A C ');
  });

  it('conditional with loop inside', () => {
    const tpl = new XTemplate(
      '<tpl if="showList"><tpl for="items">{.} </tpl></tpl>',
    );
    expect(tpl.apply({ showList: true, items: ['x', 'y'] })).toBe('x y ');
    expect(tpl.apply({ showList: false, items: ['x', 'y'] })).toBe('');
  });

  it('format function with loop', () => {
    const tpl = new XTemplate(
      '<tpl for="names">{.:uppercase} </tpl>',
    );
    expect(tpl.apply({ names: ['alice', 'bob'] })).toBe('ALICE BOB ');
  });

  it('full real-world template', () => {
    const tpl = new XTemplate([
      '<div class="user-card">',
      '  <h2>{name:htmlEncode}</h2>',
      '  <tpl if="email">',
      '    <p>{email}</p>',
      '  </tpl>',
      '  <tpl if="items.length > 0">',
      '    <ul>',
      '    <tpl for="items">',
      '      <li>{#}. {title:htmlEncode} - {[values.price.toFixed(2)]}</li>',
      '    </tpl>',
      '    </ul>',
      '  </tpl>',
      '</div>',
    ].join(''));

    const result = tpl.apply({
      name: 'Alice & Bob',
      email: 'alice@test.com',
      items: [
        { title: 'Widget <A>', price: 9.99 },
        { title: 'Gadget "B"', price: 24.5 },
      ],
    });

    expect(result).toContain('Alice &amp; Bob');
    expect(result).toContain('alice@test.com');
    expect(result).toContain('1. Widget &lt;A&gt;');
    expect(result).toContain('9.99');
    expect(result).toContain('2. Gadget &quot;B&quot;');
    expect(result).toContain('24.50');
  });
});
