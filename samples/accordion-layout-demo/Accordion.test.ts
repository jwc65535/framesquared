/**
 * Accordion.test.ts
 *
 * TDD suite for the Accordion UI component.
 *
 * Tests are ordered from the smallest observable unit outward:
 *   1.  State before render        — pure logic, no DOM
 *   2.  Default state after render — DOM reflects initial expansion
 *   3.  Exclusive single-mode      — expanding one collapses the others
 *   4.  Collapse and toggle        — full expand/collapse/toggle contract
 *   5.  DOM visibility             — bodyWrap display property
 *   6.  CSS class invariants       — x-accordion-expanded class placement
 *   7.  Header click interaction   — user gesture triggers toggle
 *   8.  Event emission             — 'expand' / 'collapse' fire correctly
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Accordion, Panel } from '@framesquared/ui';
import type { AccordionConfig } from '@framesquared/ui';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a standard 3-panel Accordion, optionally overriding config. */
function makeAccordion(config: Partial<AccordionConfig> = {}): Accordion {
  return new Accordion({
    items: [
      new Panel({ title: 'General Settings' }),
      new Panel({ title: 'User Profile' }),
      new Panel({ title: 'Security' }),
    ],
    ...config,
  });
}

/**
 * Render an Accordion into the test host and return the section elements.
 * Each section contains one `.x-accordion-header` and one `.x-accordion-body`.
 */
function renderAndGetSections(
  acc: Accordion,
  host: HTMLElement,
): NodeListOf<Element> {
  acc.render(host);
  return host.querySelectorAll('.x-accordion-section');
}

function bodyOf(section: Element): HTMLElement {
  return section.querySelector('.x-accordion-body') as HTMLElement;
}

function headerOf(section: Element): HTMLElement {
  return section.querySelector('.x-accordion-header') as HTMLElement;
}

// ── Test host setup ───────────────────────────────────────────────────────────

let host: HTMLDivElement;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
});

afterEach(() => {
  host.remove();
});

// ════════════════════════════════════════════════════════════════════════════
// 1. State before render
// ════════════════════════════════════════════════════════════════════════════

describe('Accordion — state before render', () => {
  it('reports all sections as collapsed before render', () => {
    const acc = makeAccordion();
    expect(acc.isExpanded(0)).toBe(false);
    expect(acc.isExpanded(1)).toBe(false);
    expect(acc.isExpanded(2)).toBe(false);
  });

  it('expand() updates internal state even before render', () => {
    const acc = makeAccordion();
    acc.expand(2);
    expect(acc.isExpanded(2)).toBe(true);
  });

  it('collapse() removes a pre-render expansion', () => {
    const acc = makeAccordion();
    acc.expand(1);
    acc.collapse(1);
    expect(acc.isExpanded(1)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. Default state after render
// ════════════════════════════════════════════════════════════════════════════

describe('Accordion — default state after render', () => {
  it('expands section 0 by default', () => {
    const acc = makeAccordion();
    acc.render(host);
    expect(acc.isExpanded(0)).toBe(true);
    expect(acc.isExpanded(1)).toBe(false);
    expect(acc.isExpanded(2)).toBe(false);
  });

  it('respects activeItem config — expands section 1 when activeItem: 1', () => {
    const acc = makeAccordion({ activeItem: 1 });
    acc.render(host);
    expect(acc.isExpanded(0)).toBe(false);
    expect(acc.isExpanded(1)).toBe(true);
    expect(acc.isExpanded(2)).toBe(false);
  });

  it('renders three section elements', () => {
    const acc = makeAccordion();
    const sections = renderAndGetSections(acc, host);
    expect(sections.length).toBe(3);
  });

  it('section headers display the panel title text', () => {
    const acc = makeAccordion();
    const sections = renderAndGetSections(acc, host);
    expect(headerOf(sections[0]).textContent).toBe('General Settings');
    expect(headerOf(sections[1]).textContent).toBe('User Profile');
    expect(headerOf(sections[2]).textContent).toBe('Security');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. Exclusive single-mode expansion
// ════════════════════════════════════════════════════════════════════════════

describe('Accordion — single-mode exclusive expansion', () => {
  it('expand(1) collapses section 0 and expands section 1', () => {
    const acc = makeAccordion();
    acc.render(host);

    acc.expand(1);

    expect(acc.isExpanded(0)).toBe(false);
    expect(acc.isExpanded(1)).toBe(true);
    expect(acc.isExpanded(2)).toBe(false);
  });

  it('expand(2) collapses section 0 and expands section 2', () => {
    const acc = makeAccordion();
    acc.render(host);

    acc.expand(2);

    expect(acc.isExpanded(0)).toBe(false);
    expect(acc.isExpanded(1)).toBe(false);
    expect(acc.isExpanded(2)).toBe(true);
  });

  it('expanding A then B then C leaves only C expanded', () => {
    const acc = makeAccordion();
    acc.render(host);

    acc.expand(0);
    acc.expand(1);
    acc.expand(2);

    expect(acc.isExpanded(0)).toBe(false);
    expect(acc.isExpanded(1)).toBe(false);
    expect(acc.isExpanded(2)).toBe(true);
  });

  it('at most one section is expanded at any time (multi: false)', () => {
    const acc = makeAccordion();
    acc.render(host);

    for (let target = 0; target < 3; target++) {
      acc.expand(target);
      const expandedCount = [0, 1, 2].filter((i) => acc.isExpanded(i)).length;
      expect(expandedCount).toBe(1);
    }
  });

  it('multi: true allows multiple sections to be expanded simultaneously', () => {
    const acc = makeAccordion({ multi: true });
    acc.render(host);

    acc.expand(0);
    acc.expand(1);
    acc.expand(2);

    expect(acc.isExpanded(0)).toBe(true);
    expect(acc.isExpanded(1)).toBe(true);
    expect(acc.isExpanded(2)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. Collapse and toggle
// ════════════════════════════════════════════════════════════════════════════

describe('Accordion — collapse and toggle', () => {
  it('collapse(0) collapses the currently expanded section', () => {
    const acc = makeAccordion();
    acc.render(host);

    acc.collapse(0);

    expect(acc.isExpanded(0)).toBe(false);
  });

  it('collapse(1) on an already-collapsed section is a no-op', () => {
    const acc = makeAccordion();
    acc.render(host);

    acc.collapse(1); // section 1 starts collapsed
    expect(acc.isExpanded(1)).toBe(false);
  });

  it('toggle(0) collapses section 0 when it is expanded', () => {
    const acc = makeAccordion();
    acc.render(host);
    // section 0 starts expanded
    acc.toggle(0);
    expect(acc.isExpanded(0)).toBe(false);
  });

  it('toggle(1) expands section 1 when it is collapsed', () => {
    const acc = makeAccordion();
    acc.render(host);
    // section 1 starts collapsed
    acc.toggle(1);
    expect(acc.isExpanded(1)).toBe(true);
  });

  it('toggle(1) then toggle(1) returns to collapsed', () => {
    const acc = makeAccordion({ multi: true });
    acc.render(host);

    acc.toggle(1); // expand
    acc.toggle(1); // collapse
    expect(acc.isExpanded(1)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. DOM visibility
// ════════════════════════════════════════════════════════════════════════════

describe('Accordion — DOM body visibility', () => {
  it('expanded section body is visible (display not "none")', () => {
    const acc = makeAccordion();
    const sections = renderAndGetSections(acc, host);

    expect(bodyOf(sections[0]).style.display).not.toBe('none');
  });

  it('collapsed section bodies are hidden (display: none)', () => {
    const acc = makeAccordion();
    const sections = renderAndGetSections(acc, host);

    expect(bodyOf(sections[1]).style.display).toBe('none');
    expect(bodyOf(sections[2]).style.display).toBe('none');
  });

  it('expand(1) makes section 1 body visible and hides section 0 body', () => {
    const acc = makeAccordion();
    const sections = renderAndGetSections(acc, host);

    acc.expand(1);

    expect(bodyOf(sections[0]).style.display).toBe('none');
    expect(bodyOf(sections[1]).style.display).not.toBe('none');
  });

  it('collapse(0) hides section 0 body', () => {
    const acc = makeAccordion();
    const sections = renderAndGetSections(acc, host);

    acc.collapse(0);

    expect(bodyOf(sections[0]).style.display).toBe('none');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. CSS class invariants
// ════════════════════════════════════════════════════════════════════════════

describe('Accordion — CSS class invariants', () => {
  it('expanded section carries x-accordion-expanded class', () => {
    const acc = makeAccordion();
    const sections = renderAndGetSections(acc, host);

    expect(sections[0].classList.contains('x-accordion-expanded')).toBe(true);
    expect(sections[1].classList.contains('x-accordion-expanded')).toBe(false);
    expect(sections[2].classList.contains('x-accordion-expanded')).toBe(false);
  });

  it('after expand(2), only section 2 has x-accordion-expanded', () => {
    const acc = makeAccordion();
    const sections = renderAndGetSections(acc, host);

    acc.expand(2);

    expect(sections[0].classList.contains('x-accordion-expanded')).toBe(false);
    expect(sections[1].classList.contains('x-accordion-expanded')).toBe(false);
    expect(sections[2].classList.contains('x-accordion-expanded')).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. Header click interaction
// ════════════════════════════════════════════════════════════════════════════

describe('Accordion — header click interaction', () => {
  it('clicking the section 1 header expands section 1', () => {
    const acc = makeAccordion();
    const sections = renderAndGetSections(acc, host);

    headerOf(sections[1]).click();

    expect(acc.isExpanded(1)).toBe(true);
  });

  it('clicking section 1 header collapses section 0 (single mode)', () => {
    const acc = makeAccordion();
    const sections = renderAndGetSections(acc, host);

    headerOf(sections[1]).click();

    expect(acc.isExpanded(0)).toBe(false);
  });

  it('clicking section 2 header makes only section 2 expanded', () => {
    const acc = makeAccordion();
    const sections = renderAndGetSections(acc, host);

    headerOf(sections[2]).click();

    expect(acc.isExpanded(0)).toBe(false);
    expect(acc.isExpanded(1)).toBe(false);
    expect(acc.isExpanded(2)).toBe(true);
  });

  it('clicking an expanded section header collapses it', () => {
    const acc = makeAccordion();
    const sections = renderAndGetSections(acc, host);
    // section 0 is expanded by default — click to collapse
    headerOf(sections[0]).click();
    expect(acc.isExpanded(0)).toBe(false);
  });

  it('click sequence A → B → A leaves only A expanded', () => {
    const acc = makeAccordion();
    const sections = renderAndGetSections(acc, host);

    headerOf(sections[1]).click(); // expand B, collapse A
    headerOf(sections[0]).click(); // expand A, collapse B

    expect(acc.isExpanded(0)).toBe(true);
    expect(acc.isExpanded(1)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. Event emission
// ════════════════════════════════════════════════════════════════════════════

describe('Accordion — event emission', () => {
  it('expand() fires the "expand" event with (accordion, index)', () => {
    const acc = makeAccordion();
    acc.render(host);

    const spy = vi.fn();
    (acc as any).on('expand', spy);

    acc.expand(1);

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(acc, 1);
  });

  it('collapse() fires the "collapse" event with (accordion, index)', () => {
    const acc = makeAccordion();
    acc.render(host);

    const spy = vi.fn();
    (acc as any).on('collapse', spy);

    acc.collapse(0);

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(acc, 0);
  });

  it('expand(1) fires both "collapse" for 0 and "expand" for 1', () => {
    const acc = makeAccordion();
    acc.render(host);

    const collapseSpy = vi.fn();
    const expandSpy = vi.fn();
    (acc as any).on('collapse', collapseSpy);
    (acc as any).on('expand', expandSpy);

    acc.expand(1);

    expect(collapseSpy).toHaveBeenCalledWith(acc, 0);
    expect(expandSpy).toHaveBeenCalledWith(acc, 1);
  });

  it('clicking a header fires the "expand" event', () => {
    const acc = makeAccordion();
    const sections = renderAndGetSections(acc, host);

    const spy = vi.fn();
    (acc as any).on('expand', spy);

    headerOf(sections[2]).click();

    expect(spy).toHaveBeenCalledWith(acc, 2);
  });

  it('"expand" is not fired when expanding an already-expanded section', () => {
    const acc = makeAccordion({ multi: true });
    acc.render(host);
    acc.expand(0); // already expanded from afterRender

    const spy = vi.fn();
    (acc as any).on('expand', spy);

    acc.expand(0); // no-op — already expanded
    expect(spy).not.toHaveBeenCalled();
  });
});
