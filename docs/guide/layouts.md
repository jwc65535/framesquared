# Layouts

Layouts control how child components are sized and positioned within a Container.

## Setting a Layout

```typescript
const container = new Container({
  layout: 'hbox',         // String shorthand
  items: [/* ... */],
});

// Or explicit instance
const container2 = new Container({
  layout: new HBoxLayout({ align: 'stretch' }),
  items: [/* ... */],
});
```

## Available Layouts

### Auto Layout (default)

Children render in natural flow. No special sizing.

```typescript
{ layout: 'auto' }
```

### HBox Layout

Arranges children horizontally in a row:

```typescript
{
  layout: { type: 'hbox', align: 'stretch', pack: 'start' },
  items: [
    { flex: 1 },    // Takes remaining space
    { width: 200 }, // Fixed width
    { flex: 2 },    // Takes 2x the remaining space
  ],
}
```

`align`: `'start'` | `'center'` | `'end'` | `'stretch'`
`pack`: `'start'` | `'center'` | `'end'`

### VBox Layout

Arranges children vertically in a column:

```typescript
{
  layout: { type: 'vbox', align: 'stretch' },
  items: [
    { height: 50 },
    { flex: 1 },
    { height: 30 },
  ],
}
```

### Fit Layout

Single child fills the entire container:

```typescript
{
  layout: 'fit',
  items: [grid],  // Grid fills 100% width and height
}
```

### Card Layout

Stack of children, only one visible at a time:

```typescript
const card = new Container({
  layout: 'card',
  activeItem: 0,
  items: [step1Panel, step2Panel, step3Panel],
});

card.getLayout().setActiveItem(1); // Show step 2
card.getLayout().next();           // Show step 3
card.getLayout().prev();           // Back to step 2
```

### Border Layout

Classic regions: north, south, east, west, center:

```typescript
{
  layout: 'border',
  items: [
    { region: 'north', height: 60, html: 'Header' },
    { region: 'west', width: 200, collapsible: true, html: 'Sidebar' },
    { region: 'center', html: 'Main content' },
    { region: 'south', height: 30, html: 'Footer' },
  ],
}
```

Center is required. Other regions are optional and can be `collapsible` and `split`.

### Anchor Layout

Children sized relative to container using anchor expressions:

```typescript
{
  layout: 'anchor',
  items: [
    { anchor: '100%', height: 50 },      // Full width, fixed height
    { anchor: '100% 50%' },              // Full width, 50% height
    { anchor: '-50 -100' },              // 50px less than container width, 100px less height
  ],
}
```

### Column Layout

Children arranged in columns using width fractions:

```typescript
{
  layout: 'column',
  items: [
    { columnWidth: 0.5 },  // 50%
    { columnWidth: 0.25 }, // 25%
    { columnWidth: 0.25 }, // 25%
  ],
}
```

### Table Layout

HTML table-based grid layout:

```typescript
{
  layout: { type: 'table', columns: 3 },
  items: [
    { html: 'Cell 1' },
    { html: 'Cell 2' },
    { html: 'Cell 3' },
    { html: 'Cell 4', colspan: 2 },
    { html: 'Cell 5' },
  ],
}
```

### Absolute Layout

Children positioned at exact x/y coordinates:

```typescript
{
  layout: 'absolute',
  items: [
    { x: 10, y: 10, width: 200, height: 100, html: 'Top-left' },
    { x: 220, y: 10, width: 200, height: 100, html: 'Top-right' },
  ],
}
```

### Accordion Layout

Collapsible vertical panels, one expanded at a time:

```typescript
{
  layout: 'accordion',
  items: [
    new Panel({ title: 'General', html: '...' }),
    new Panel({ title: 'Advanced', html: '...' }),
    new Panel({ title: 'About', html: '...' }),
  ],
}
```

## Responsive Plugin

Adapt layout based on viewport width:

```typescript
import { ResponsivePlugin } from '@framesquared/layout';

const container = new Container({
  plugins: [new ResponsivePlugin({
    breakpoints: { sm: 600, md: 960, lg: 1280 },
    rules: {
      sm: { layout: 'vbox' },
      md: { layout: 'hbox' },
    },
  })],
});
```
