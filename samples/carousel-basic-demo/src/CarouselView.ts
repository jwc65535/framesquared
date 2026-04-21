/**
 * CarouselView
 *
 * Builds the carousel demonstration.  All carousel controls (Prev, Next,
 * First, Last, Loop toggle) live in the persistent bottom toolbar so they
 * are always accessible, regardless of which slide is active.
 *
 * Slides are purely informational — no interactive elements that require
 * reaching back up to the carousel from inside slide content.
 */

import '@framesquared/layout';
import { Component } from '@framesquared/component';
import { Panel, Viewport, Carousel, Button, Toolbar } from '@framesquared/ui';

// ── Slide definitions ─────────────────────────────────────────────────────

function makeSlide(title: string, ...lines: string[]): Panel {
  return new Panel({
    title,
    bodyPadding: 24,
    border: false,
    items: lines.map((html) => new Component({ html })),
  });
}

function buildSlides(): Panel[] {
  return [
    makeSlide(
      'Welcome to Carousel',
      '<h2 style="margin:0 0 12px">Ext.Carousel</h2>' +
      '<p>A fluid, animated card-switcher built on the framesquared Container. ' +
      'Navigate with the toolbar buttons below or drag the slide area.</p>',
    ),

    makeSlide(
      'Features',
      '<ul style="margin:0;padding-left:20px;line-height:2.2">' +
      '<li>Pointer drag-to-switch (desktop &amp; touch)</li>' +
      '<li>CSS translate-based animation — no JS animation loop</li>' +
      '<li>Indicator pips with click-to-jump</li>' +
      '<li>Optional loop mode (toggle with the Loop button below)</li>' +
      '<li>Graceful resize via ResizeObserver</li>' +
      '<li>Zero external CSS — fully theme-driven</li>' +
      '</ul>',
    ),

    makeSlide(
      'API',
      '<p>Instantiate directly or via xtype once <code>@framesquared/ui</code> is imported:</p>' +
      '<pre style="background:var(--ext-color-surface,#f5f5f5);border-radius:4px;' +
      'padding:14px;font-size:13px;overflow:auto;line-height:1.6">' +
      'new Carousel({\n' +
      '  activeItem: 0,\n' +
      '  indicators: true,\n' +
      '  loop: false,\n' +
      '  animDuration: 350,\n' +
      '  items: [ slide1, slide2, slide3 ],\n' +
      '});\n\n' +
      '// Navigation\n' +
      'carousel.next();\n' +
      'carousel.prev();\n' +
      'carousel.goTo(2);\n' +
      'carousel.setLoop(true);\n' +
      '</pre>',
    ),

    makeSlide(
      'Integration',
      '<p>The Carousel registers as xtype <code>\'carousel\'</code> so it can be ' +
      'used inline inside any Container\'s <code>items</code> array:</p>' +
      '<pre style="background:var(--ext-color-surface,#f5f5f5);border-radius:4px;' +
      'padding:14px;font-size:13px;overflow:auto;line-height:1.6">' +
      'new Viewport({\n' +
      '  layout: { type: \'vbox\', align: \'stretch\' },\n' +
      '  items: [\n' +
      '    { xtype: \'carousel\', flex: 1, items: slides },\n' +
      '    navigationToolbar,\n' +
      '  ],\n' +
      '});\n' +
      '</pre>',
    ),

    makeSlide(
      'Resources',
      '<ul style="margin:0;padding-left:20px;line-height:2.2">' +
      '<li>Framework source — <code>packages/ui/src/carousel/Carousel.ts</code></li>' +
      '<li>Unit tests — <code>packages/ui/__tests__/carousel.test.ts</code></li>' +
      '<li>This sample — <code>samples/carousel-basic-demo/</code></li>' +
      '</ul>',
    ),
  ];
}

// ── Exported refs ─────────────────────────────────────────────────────────

export interface CarouselViewRefs {
  carousel: Carousel;
  prevButton: Button;
  nextButton: Button;
  firstButton: Button;
  lastButton: Button;
  loopButton: Button;
  autoPlayButton: Button;
}

// ── Toolbar builder ───────────────────────────────────────────────────────
// Accepts the carousel instance so every button uses a direct closure
// reference — no fragile up() / component-query traversal needed.

function buildToolbar(carousel: Carousel, slides: Panel[]): {
  toolbar: Toolbar;
  prevButton: Button;
  nextButton: Button;
  firstButton: Button;
  lastButton: Button;
  loopButton: Button;
  autoPlayButton: Button;
} {
  let loopOn = false;
  let autoPlayOn = false;
  const AUTO_PLAY_INTERVAL = 3000;

  const prevButton  = new Button({ text: '← Prev',  handler: () => carousel.prev() });
  const nextButton  = new Button({ text: 'Next →',  handler: () => carousel.next() });
  const firstButton = new Button({ text: '⏮ First', handler: () => carousel.goTo(0) });
  const lastButton  = new Button({ text: 'Last ⏭',  handler: () => carousel.goTo(slides.length - 1) });

  const loopButton  = new Button({
    text: 'Loop: OFF',
    handler: () => {
      loopOn = !loopOn;
      carousel.setLoop(loopOn);
      loopButton.setText(loopOn ? 'Loop: ON' : 'Loop: OFF');
    },
  });

  const autoPlayButton = new Button({
    text: 'Auto: OFF',
    handler: () => {
      autoPlayOn = !autoPlayOn;
      carousel.setAutoPlay(autoPlayOn ? AUTO_PLAY_INTERVAL : 0);
      autoPlayButton.setText(autoPlayOn ? 'Auto: ON' : 'Auto: OFF');
    },
  });

  const toolbar = new Toolbar({
    items: [
      firstButton,
      prevButton,
      { xtype: 'component', cls: 'x-toolbar-fill' },
      autoPlayButton,
      loopButton,
      { xtype: 'component', cls: 'x-toolbar-fill' },
      nextButton,
      lastButton,
    ],
  });

  return { toolbar, prevButton, nextButton, firstButton, lastButton, loopButton, autoPlayButton };
}

// ── Factory: test entry point ─────────────────────────────────────────────
// Creates a self-contained wrapper Panel rendered into the provided host
// element. No Application or Viewport required — suitable for unit tests.

export function createCarouselView(host: Element): CarouselViewRefs {
  const slides = buildSlides();

  const carousel = new Carousel({
    flex: 1,
    activeItem: 0,
    indicators: true,
    loop: false,
    animDuration: 350,
    items: slides,
  });

  const { toolbar, prevButton, nextButton, firstButton, lastButton, loopButton, autoPlayButton } =
    buildToolbar(carousel, slides);

  new Panel({
    renderTo: host,
    title: 'Carousel Demo — framesquared',
    layout: { type: 'vbox', align: 'stretch' },
    width: '100%',
    height: '100%',
    items: [carousel, toolbar],
  });

  return { carousel, prevButton, nextButton, firstButton, lastButton, loopButton, autoPlayButton };
}

// ── Factory: App / Viewport entry point ──────────────────────────────────

export function createViewport(): CarouselViewRefs {
  const slides = buildSlides();

  const carousel = new Carousel({
    flex: 1,
    activeItem: 0,
    indicators: true,
    loop: false,
    animDuration: 350,
    items: slides,
  });

  const { toolbar, prevButton, nextButton, firstButton, lastButton, loopButton, autoPlayButton } =
    buildToolbar(carousel, slides);

  new Viewport({
    layout: { type: 'vbox', align: 'stretch' },
    items: [
      new Panel({
        title: 'Carousel Demo — framesquared',
        height: 52,
      }),
      carousel,
      toolbar,
    ],
  });

  return { carousel, prevButton, nextButton, firstButton, lastButton, loopButton, autoPlayButton };
}
