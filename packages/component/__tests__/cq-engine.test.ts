import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Component } from '../src/Component.js';
import { Container } from '../src/Container.js';
import { CQParser } from '../src/query/CQParser.js';
import { CQMatcher } from '../src/query/CQMatcher.js';
import { CQ } from '../src/query/ComponentQuery.js';
import type { SelectorNode } from '../src/query/CQParser.js';

// ResizeObserver mock
class MockRO {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeEach(() => { (globalThis as any).ResizeObserver = MockRO; });
afterEach(() => { document.body.innerHTML = ''; });

// Helpers
function cmp(cfg: Record<string, unknown> = {}): Component {
  return new Component(cfg);
}
function ct(cfg: Record<string, unknown> = {}): Container {
  return new Container({ renderTo: document.body, ...cfg });
}

// Build a test tree:
//   viewport
//   ├── panel#main .highlighted [title="Settings"]
//   │   ├── button#save .primary
//   │   └── button#cancel
//   ├── panel#sidebar [count=10]
//   │   └── textfield#search
//   └── toolbar
//       ├── button#toolBtn
//       └── button#toolBtn2 .primary :disabled
function buildTree() {
  const viewport = ct({ xtype: 'viewport' });
  const mainPanel = new Container({ xtype: 'panel', cls: 'highlighted', title: 'Settings' });
  (mainPanel as any).componentId = 'main'; // override for test
  const saveBtn = cmp({ xtype: 'button', cls: 'primary' });
  (saveBtn as any).componentId = 'save';
  const cancelBtn = cmp({ xtype: 'button' });
  (cancelBtn as any).componentId = 'cancel';
  mainPanel.add(saveBtn, cancelBtn);

  const sidebar = new Container({ xtype: 'panel', count: 10 });
  (sidebar as any).componentId = 'sidebar';
  const searchField = cmp({ xtype: 'textfield' });
  (searchField as any).componentId = 'search';
  sidebar.add(searchField);

  const toolbar = new Container({ xtype: 'toolbar' });
  const toolBtn = cmp({ xtype: 'button' });
  (toolBtn as any).componentId = 'toolBtn';
  const toolBtn2 = cmp({ xtype: 'button', cls: 'primary', disabled: true });
  (toolBtn2 as any).componentId = 'toolBtn2';
  toolbar.add(toolBtn, toolBtn2);

  viewport.add(mainPanel, sidebar, toolbar);

  return { viewport, mainPanel, saveBtn, cancelBtn, sidebar, searchField, toolbar, toolBtn, toolBtn2 };
}

// ═══════════════════════════════════════════════════════════════════════════
// CQParser
// ═══════════════════════════════════════════════════════════════════════════

describe('CQParser', () => {
  it('parses xtype selector', () => {
    const ast = CQParser.parse('button');
    expect(ast.type).toBe('compound');
    expect(ast.selectors[0].type).toBe('type');
    expect(ast.selectors[0].value).toBe('button');
  });

  it('parses #id selector', () => {
    const ast = CQParser.parse('#myBtn');
    expect(ast.selectors[0].type).toBe('id');
    expect(ast.selectors[0].value).toBe('myBtn');
  });

  it('parses .class selector', () => {
    const ast = CQParser.parse('.highlighted');
    expect(ast.selectors[0].type).toBe('class');
    expect(ast.selectors[0].value).toBe('highlighted');
  });

  it('parses [attr=value] selector', () => {
    const ast = CQParser.parse('[title="Settings"]');
    expect(ast.selectors[0].type).toBe('attribute');
    expect(ast.selectors[0].name).toBe('title');
    expect(ast.selectors[0].operator).toBe('=');
    expect(ast.selectors[0].value).toBe('Settings');
  });

  it('parses [attr] existence selector', () => {
    const ast = CQParser.parse('[title]');
    expect(ast.selectors[0].type).toBe('attribute');
    expect(ast.selectors[0].name).toBe('title');
    expect(ast.selectors[0].operator).toBeUndefined();
  });

  it('parses [attr>5] numeric comparison', () => {
    const ast = CQParser.parse('[count>5]');
    expect(ast.selectors[0].operator).toBe('>');
    expect(ast.selectors[0].value).toBe('5');
  });

  it('parses [attr>=10]', () => {
    const ast = CQParser.parse('[count>=10]');
    expect(ast.selectors[0].operator).toBe('>=');
  });

  it('parses [attr!=value]', () => {
    const ast = CQParser.parse('[status!=active]');
    expect(ast.selectors[0].operator).toBe('!=');
  });

  it('parses :not(selector)', () => {
    const ast = CQParser.parse(':not(button)');
    expect(ast.selectors[0].type).toBe('pseudo');
    expect(ast.selectors[0].name).toBe('not');
    expect(ast.selectors[0].argument).toBeDefined();
  });

  it('parses :first-child', () => {
    const ast = CQParser.parse(':first-child');
    expect(ast.selectors[0].type).toBe('pseudo');
    expect(ast.selectors[0].name).toBe('first-child');
  });

  it('parses :last-child', () => {
    const ast = CQParser.parse(':last-child');
    expect(ast.selectors[0].type).toBe('pseudo');
    expect(ast.selectors[0].name).toBe('last-child');
  });

  it('parses :nth-child(2)', () => {
    const ast = CQParser.parse(':nth-child(2)');
    expect(ast.selectors[0].type).toBe('pseudo');
    expect(ast.selectors[0].name).toBe('nth-child');
    expect(ast.selectors[0].argument).toBe('2');
  });

  it('parses :focusable', () => {
    const ast = CQParser.parse(':focusable');
    expect(ast.selectors[0].name).toBe('focusable');
  });

  it('parses :visible', () => {
    const ast = CQParser.parse(':visible');
    expect(ast.selectors[0].name).toBe('visible');
  });

  it('parses :disabled', () => {
    const ast = CQParser.parse(':disabled');
    expect(ast.selectors[0].name).toBe('disabled');
  });

  it('parses {methodName} method selector', () => {
    const ast = CQParser.parse('{isValid}');
    expect(ast.selectors[0].type).toBe('method');
    expect(ast.selectors[0].value).toBe('isValid');
  });

  it('parses compound selector: button.primary', () => {
    const ast = CQParser.parse('button.primary');
    expect(ast.selectors.length).toBe(2);
    expect(ast.selectors[0].type).toBe('type');
    expect(ast.selectors[1].type).toBe('class');
  });

  it('parses descendant combinator: panel button', () => {
    const ast = CQParser.parse('panel button');
    expect(ast.type).toBe('combinator');
    expect(ast.combinator).toBe(' ');
  });

  it('parses child combinator: panel > button', () => {
    const ast = CQParser.parse('panel > button');
    expect(ast.type).toBe('combinator');
    expect(ast.combinator).toBe('>');
  });

  it('parses sibling combinator: panel ~ button', () => {
    const ast = CQParser.parse('panel ~ button');
    expect(ast.type).toBe('combinator');
    expect(ast.combinator).toBe('~');
  });

  it('parses adjacent sibling combinator: panel + button', () => {
    const ast = CQParser.parse('panel + button');
    expect(ast.type).toBe('combinator');
    expect(ast.combinator).toBe('+');
  });

  it('parses comma-separated selectors', () => {
    const ast = CQParser.parse('button, textfield');
    expect(ast.type).toBe('list');
    expect(ast.items.length).toBe(2);
  });

  it('parses complex compound: panel[title="Settings"] > button.primary:not(:disabled)', () => {
    const ast = CQParser.parse('panel[title="Settings"] > button.primary:not(:disabled)');
    expect(ast.type).toBe('combinator');
    // Left side: panel[title="Settings"]
    expect(ast.left.selectors.length).toBe(2); // type + attr
    // Right side: button.primary:not(:disabled)
    expect(ast.right.selectors.length).toBe(3); // type + class + :not
  });

  it('throws on empty selector', () => {
    expect(() => CQParser.parse('')).toThrow();
  });

  it('throws on invalid selector', () => {
    expect(() => CQParser.parse('>>>>')).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CQMatcher — simple selector matching
// ═══════════════════════════════════════════════════════════════════════════

describe('CQMatcher — simple selectors', () => {
  it('matches xtype', () => {
    const tree = buildTree();
    expect(CQMatcher.matches(tree.saveBtn, 'button')).toBe(true);
    expect(CQMatcher.matches(tree.saveBtn, 'panel')).toBe(false);
  });

  it('matches #id', () => {
    const tree = buildTree();
    expect(CQMatcher.matches(tree.saveBtn, '#save')).toBe(true);
    expect(CQMatcher.matches(tree.saveBtn, '#cancel')).toBe(false);
  });

  it('matches .class', () => {
    const tree = buildTree();
    expect(CQMatcher.matches(tree.saveBtn, '.primary')).toBe(true);
    expect(CQMatcher.matches(tree.cancelBtn, '.primary')).toBe(false);
  });

  it('matches [attr=value]', () => {
    const tree = buildTree();
    expect(CQMatcher.matches(tree.mainPanel, '[title="Settings"]')).toBe(true);
    expect(CQMatcher.matches(tree.sidebar, '[title="Settings"]')).toBe(false);
  });

  it('matches [attr] existence', () => {
    const tree = buildTree();
    expect(CQMatcher.matches(tree.mainPanel, '[title]')).toBe(true);
    expect(CQMatcher.matches(tree.toolbar, '[title]')).toBe(false);
  });

  it('matches [attr>5] numeric comparison', () => {
    const tree = buildTree();
    expect(CQMatcher.matches(tree.sidebar, '[count>5]')).toBe(true);
    expect(CQMatcher.matches(tree.sidebar, '[count>20]')).toBe(false);
  });

  it('matches [attr>=10]', () => {
    const tree = buildTree();
    expect(CQMatcher.matches(tree.sidebar, '[count>=10]')).toBe(true);
    expect(CQMatcher.matches(tree.sidebar, '[count>=11]')).toBe(false);
  });

  it('matches [attr!=value]', () => {
    const tree = buildTree();
    expect(CQMatcher.matches(tree.mainPanel, '[title!=Other]')).toBe(true);
    expect(CQMatcher.matches(tree.mainPanel, '[title!=Settings]')).toBe(false);
  });

  it('matches :not(selector)', () => {
    const tree = buildTree();
    expect(CQMatcher.matches(tree.saveBtn, ':not(panel)')).toBe(true);
    expect(CQMatcher.matches(tree.saveBtn, ':not(button)')).toBe(false);
  });

  it('matches :visible', () => {
    const tree = buildTree();
    expect(CQMatcher.matches(tree.saveBtn, ':visible')).toBe(true);
    tree.saveBtn.hide();
    expect(CQMatcher.matches(tree.saveBtn, ':visible')).toBe(false);
  });

  it('matches :disabled', () => {
    const tree = buildTree();
    expect(CQMatcher.matches(tree.toolBtn2, ':disabled')).toBe(true);
    expect(CQMatcher.matches(tree.toolBtn, ':disabled')).toBe(false);
  });

  it('matches {method}', () => {
    const tree = buildTree();
    // isVisible() returns true by default
    expect(CQMatcher.matches(tree.saveBtn, '{isVisible}')).toBe(true);
    tree.saveBtn.hide();
    expect(CQMatcher.matches(tree.saveBtn, '{isVisible}')).toBe(false);
  });

  it('matches compound: button.primary', () => {
    const tree = buildTree();
    expect(CQMatcher.matches(tree.saveBtn, 'button.primary')).toBe(true);
    expect(CQMatcher.matches(tree.cancelBtn, 'button.primary')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CQMatcher — combinators
// ═══════════════════════════════════════════════════════════════════════════

describe('CQMatcher — combinators', () => {
  it('descendant combinator: panel button', () => {
    const tree = buildTree();
    const results = CQMatcher.query(tree.viewport, 'panel button');
    // mainPanel has save,cancel; sidebar has none (textfield); buttons from panels
    expect(results.length).toBe(2);
    expect(results).toContain(tree.saveBtn);
    expect(results).toContain(tree.cancelBtn);
  });

  it('child combinator: viewport > panel', () => {
    const tree = buildTree();
    const results = CQMatcher.query(tree.viewport, 'viewport > panel');
    expect(results.length).toBe(2); // mainPanel, sidebar
  });

  it('general sibling combinator: #save ~ button', () => {
    const tree = buildTree();
    const results = CQMatcher.query(tree.viewport, '#save ~ button');
    expect(results.length).toBe(1);
    expect(results[0]).toBe(tree.cancelBtn);
  });

  it('adjacent sibling combinator: #save + button', () => {
    const tree = buildTree();
    const results = CQMatcher.query(tree.viewport, '#save + button');
    expect(results.length).toBe(1);
    expect(results[0]).toBe(tree.cancelBtn);
  });

  it('adjacent sibling: no match when not adjacent', () => {
    const tree = buildTree();
    // #main + toolbar should fail — sidebar is between them
    const results = CQMatcher.query(tree.viewport, '#main + toolbar');
    expect(results.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CQMatcher — positional pseudo-classes
// ═══════════════════════════════════════════════════════════════════════════

describe('CQMatcher — positional pseudo-classes', () => {
  it(':first-child', () => {
    const tree = buildTree();
    const results = CQMatcher.query(tree.viewport, 'button:first-child');
    // First child buttons: save (in mainPanel), toolBtn (in toolbar)
    expect(results).toContain(tree.saveBtn);
    expect(results).toContain(tree.toolBtn);
  });

  it(':last-child', () => {
    const tree = buildTree();
    const results = CQMatcher.query(tree.viewport, 'button:last-child');
    // Last child buttons: cancel (in mainPanel), toolBtn2 (in toolbar)
    expect(results).toContain(tree.cancelBtn);
    expect(results).toContain(tree.toolBtn2);
  });

  it(':nth-child(1)', () => {
    const tree = buildTree();
    const results = CQMatcher.query(tree.viewport, ':nth-child(1)');
    // First child of each parent: mainPanel (of viewport), save (of mainPanel),
    // search (of sidebar), toolBtn (of toolbar)
    expect(results.length).toBe(4);
  });

  it(':nth-child(2)', () => {
    const tree = buildTree();
    const results = CQMatcher.query(tree.viewport, 'button:nth-child(2)');
    // Second child buttons: cancel (in mainPanel), toolBtn2 (in toolbar)
    expect(results).toContain(tree.cancelBtn);
    expect(results).toContain(tree.toolBtn2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CQMatcher — comma (OR) selectors
// ═══════════════════════════════════════════════════════════════════════════

describe('CQMatcher — comma selectors', () => {
  it('button, textfield matches both types', () => {
    const tree = buildTree();
    const results = CQMatcher.query(tree.viewport, 'button, textfield');
    expect(results.length).toBe(5); // 4 buttons + 1 textfield
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CQMatcher — complex compound selectors
// ═══════════════════════════════════════════════════════════════════════════

describe('CQMatcher — complex selectors', () => {
  it('panel[title="Settings"] > button.primary', () => {
    const tree = buildTree();
    const results = CQMatcher.query(tree.viewport, 'panel[title="Settings"] > button.primary');
    expect(results.length).toBe(1);
    expect(results[0]).toBe(tree.saveBtn);
  });

  it('button.primary:not(:disabled)', () => {
    const tree = buildTree();
    const results = CQMatcher.query(tree.viewport, 'button.primary:not(:disabled)');
    expect(results.length).toBe(1);
    expect(results[0]).toBe(tree.saveBtn);
  });

  it('panel > button:first-child', () => {
    const tree = buildTree();
    const results = CQMatcher.query(tree.viewport, 'panel > button:first-child');
    expect(results.length).toBe(1);
    expect(results[0]).toBe(tree.saveBtn);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CQ Static API
// ═══════════════════════════════════════════════════════════════════════════

describe('CQ static API', () => {
  it('CQ.query returns matching components', () => {
    const tree = buildTree();
    const results = CQ.query('button', tree.viewport);
    expect(results.length).toBe(4);
  });

  it('CQ.is checks if component matches', () => {
    const tree = buildTree();
    expect(CQ.is(tree.saveBtn, 'button.primary')).toBe(true);
    expect(CQ.is(tree.cancelBtn, 'button.primary')).toBe(false);
  });

  it('CQ.is is alias for CQMatcher.matches', () => {
    const tree = buildTree();
    expect(CQ.is(tree.saveBtn, '#save')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Performance
// ═══════════════════════════════════════════════════════════════════════════

describe('Performance', () => {
  it('queries 1000+ component tree in reasonable time', () => {
    const root = ct({ xtype: 'viewport' });
    // Build 50 panels × 20 buttons each = 1000 buttons + 50 panels
    for (let i = 0; i < 50; i++) {
      const panel = new Container({ xtype: 'panel', cls: i % 2 === 0 ? 'even' : 'odd' });
      for (let j = 0; j < 20; j++) {
        panel.add(cmp({ xtype: 'button', cls: j === 0 ? 'first' : 'other' }));
      }
      root.add(panel);
    }

    const start = performance.now();
    const buttons = CQ.query('button', root);
    const panels = CQ.query('panel.even > button.first', root);
    const elapsed = performance.now() - start;

    expect(buttons.length).toBe(1000);
    expect(panels.length).toBe(25);
    expect(elapsed).toBeLessThan(500); // Should be well under 500ms
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Error handling
// ═══════════════════════════════════════════════════════════════════════════

describe('Error handling', () => {
  it('empty selector throws', () => {
    expect(() => CQParser.parse('')).toThrow();
  });

  it('invalid selector throws', () => {
    expect(() => CQParser.parse('>>>>')).toThrow();
  });

  it('CQ.query with invalid selector throws', () => {
    const tree = buildTree();
    expect(() => CQ.query('', tree.viewport)).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Additional branch coverage
// ═══════════════════════════════════════════════════════════════════════════

describe('Branch coverage — attribute operators', () => {
  it('[attr<5]', () => {
    const tree = buildTree();
    expect(CQMatcher.matches(tree.sidebar, '[count<20]')).toBe(true);
    expect(CQMatcher.matches(tree.sidebar, '[count<5]')).toBe(false);
  });

  it('[attr<=10]', () => {
    const tree = buildTree();
    expect(CQMatcher.matches(tree.sidebar, '[count<=10]')).toBe(true);
    expect(CQMatcher.matches(tree.sidebar, '[count<=9]')).toBe(false);
  });

  it('[attr=true] and [attr=false] boolean matching', () => {
    const tree = buildTree();
    expect(CQMatcher.matches(tree.toolBtn2, '[disabled=true]')).toBe(true);
    expect(CQMatcher.matches(tree.toolBtn2, '[disabled=false]')).toBe(false);
  });

  it('[attr!=true]', () => {
    const tree = buildTree();
    expect(CQMatcher.matches(tree.toolBtn, '[disabled!=true]')).toBe(true);
  });

  it('attribute existence on non-existent prop', () => {
    const tree = buildTree();
    expect(CQMatcher.matches(tree.toolBtn, '[nonexistent]')).toBe(false);
  });
});

describe('Branch coverage — sibling edge cases', () => {
  it('adjacent sibling at index 0 returns false', () => {
    const tree = buildTree();
    // saveBtn is first child — no preceding sibling
    const results = CQMatcher.query(tree.viewport, '#cancel + #save');
    expect(results.length).toBe(0);
  });

  it('general sibling with no match', () => {
    const tree = buildTree();
    const results = CQMatcher.query(tree.viewport, 'textfield ~ button');
    // textfield is only child of sidebar — no siblings
    expect(results.length).toBe(0);
  });
});

describe('Branch coverage — method matcher edge cases', () => {
  it('{nonExistentMethod} returns false', () => {
    const tree = buildTree();
    expect(CQMatcher.matches(tree.saveBtn, '{nonExistentMethod}')).toBe(false);
  });
});

describe('Branch coverage — :focusable', () => {
  it(':focusable matches when tabIndex is set', () => {
    const tree = buildTree();
    tree.saveBtn.el!.tabIndex = 0;
    expect(CQMatcher.matches(tree.saveBtn, ':focusable')).toBe(true);
  });
});

describe('Branch coverage — combinator nesting', () => {
  it('three-level descendant: viewport panel button', () => {
    const tree = buildTree();
    const results = CQMatcher.query(tree.viewport, 'viewport panel button');
    expect(results.length).toBe(2);
  });

  it('child then descendant: viewport > panel button', () => {
    const tree = buildTree();
    const results = CQMatcher.query(tree.viewport, 'viewport > panel button');
    expect(results.length).toBe(2);
  });
});

describe('Branch coverage — parser edge cases', () => {
  it('handles quoted attribute value with single quotes', () => {
    const ast = CQParser.parse("[title='Test']");
    expect(ast.selectors[0].value).toBe('Test');
  });

  it('handles attribute value without quotes', () => {
    const ast = CQParser.parse('[count=10]');
    expect(ast.selectors[0].value).toBe('10');
  });

  it(':nth-child with non-numeric arg returns false', () => {
    const tree = buildTree();
    expect(CQMatcher.matches(tree.saveBtn, ':nth-child(abc)')).toBe(false);
  });

  it('unknown pseudo-class returns false', () => {
    const tree = buildTree();
    expect(CQMatcher.matches(tree.saveBtn, ':whatever')).toBe(false);
  });
});

describe('Branch coverage — legacy ComponentQuery wrapper', () => {
  // Import the old wrapper
  it('matchesCQ handles invalid selectors gracefully', async () => {
    const { matchesCQ } = await import('../src/ComponentQuery.js');
    const tree = buildTree();
    // Invalid selector should return false, not throw
    expect(matchesCQ(tree.saveBtn, '')).toBe(false);
  });

  it('ComponentQuery.query with > selector works', async () => {
    const { ComponentQuery } = await import('../src/ComponentQuery.js');
    const tree = buildTree();
    const results = ComponentQuery.query(tree.mainPanel, '> button');
    expect(results.length).toBe(2);
  });

  it('ComponentQuery.query handles invalid > inner selector', async () => {
    const { ComponentQuery } = await import('../src/ComponentQuery.js');
    const tree = buildTree();
    const results = ComponentQuery.query(tree.viewport, '> ');
    expect(results).toEqual([]);
  });
});

describe('Branch coverage — CQMatcher list in context', () => {
  it('matchesInContext handles list node', () => {
    const tree = buildTree();
    const results = CQMatcher.query(tree.viewport, 'button, textfield');
    expect(results.length).toBe(5);
  });
});

describe('Branch coverage — no parent/siblings', () => {
  it('component with no ownerCt — descendant combinator fails', () => {
    const orphan = cmp({ xtype: 'button' });
    expect(CQMatcher.matches(orphan, 'panel button')).toBe(false);
  });

  it('component with no ownerCt — child combinator fails', () => {
    const orphan = cmp({ xtype: 'button' });
    expect(CQMatcher.matches(orphan, 'panel > button')).toBe(false);
  });

  it(':first-child on orphan returns false', () => {
    const orphan = cmp({ xtype: 'button' });
    expect(CQMatcher.matches(orphan, ':first-child')).toBe(false);
  });

  it(':last-child on orphan returns false', () => {
    const orphan = cmp({ xtype: 'button' });
    expect(CQMatcher.matches(orphan, ':last-child')).toBe(false);
  });
});
